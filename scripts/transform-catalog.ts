/**
 * Transforms one or more fashion product CSVs into catalog-data.json.
 * Uses streaming so files of any size work (stops reading once enough rows collected).
 * Auto-detects Amazon vs Myntra format by column headers.
 *
 * Usage:
 *   Replace:  npx tsx scripts/transform-catalog.ts <csv1> [csv2] ...
 *   Append:   npx tsx scripts/transform-catalog.ts --append <csv1> [csv2] ...
 *
 * Amazon columns: title, product_url, image, selling_price, brand, category, asin
 * Myntra (p_id):  p_id, name, price, img, colour, brand
 * Myntra (purl):  id, name, img, price, purl, rating  ← purl = direct product URL
 */

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const APPEND_MODE = args.includes("--append");
const INPUTS = args.filter((a) => !a.startsWith("--"));
const OUTPUT_JSON = path.join(process.cwd(), "src/lib/catalog-data.json");
const MAX_ROWS = 5000;

if (!INPUTS.length) {
  console.error(
    "Usage:\n" +
    "  Replace: npx tsx scripts/transform-catalog.ts <csv1> [csv2] ...\n" +
    "  Append:  npx tsx scripts/transform-catalog.ts --append <csv1> [csv2] ..."
  );
  process.exit(1);
}

// --- Streaming CSV reader ---
// Reads character-by-character so quoted newlines are handled correctly.
// Calls onRow(record) for each data row; return false to stop early.
function readCSVStream(
  filePath: string,
  onRow: (row: Record<string, string>, rowIndex: number) => boolean
): Promise<number> {
  return new Promise((resolve, reject) => {
    let headers: string[] = [];
    let rowBuf = "";
    let inQuotes = false;
    let prevChar = "";
    let rowCount = 0;
    let stopped = false;

    const splitRow = (line: string): string[] => {
      const fields: string[] = [];
      let field = "";
      let q = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (q && line[i + 1] === '"') { field += '"'; i++; }
          else { q = !q; }
        } else if (c === "," && !q) {
          fields.push(field.trim());
          field = "";
        } else {
          field += c;
        }
      }
      fields.push(field.trim());
      return fields;
    };

    const flushRow = () => {
      const trimmed = rowBuf.trim();
      rowBuf = "";
      if (!trimmed) return;

      if (headers.length === 0) {
        headers = splitRow(trimmed).map((h) => h.toLowerCase().replace(/["\r]/g, "").trim());
        return;
      }

      const vals = splitRow(trimmed);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = (vals[idx] ?? "").replace(/\r/g, ""); });
      rowCount++;
      if (!onRow(row, rowCount)) {
        stopped = true;
      }
    };

    const stream = fs.createReadStream(filePath, { encoding: "utf-8", highWaterMark: 64 * 1024 });

    stream.on("data", (rawChunk: string | Buffer) => {
      const chunk = typeof rawChunk === "string" ? rawChunk : rawChunk.toString("utf-8");
      if (stopped) { stream.destroy(); return; }

      for (let i = 0; i < chunk.length; i++) {
        if (stopped) break;
        const ch = chunk[i];

        if (ch === '"') {
          if (inQuotes && prevChar === '"') {
            // escaped quote — already added the char when we saw the first "
          } else {
            inQuotes = !inQuotes;
          }
          rowBuf += ch;
        } else if (ch === "\r") {
          // skip bare CR
        } else if (ch === "\n" && !inQuotes) {
          flushRow();
        } else {
          rowBuf += ch;
        }
        prevChar = ch;
      }
    });

    stream.on("end", () => { if (rowBuf.trim()) flushRow(); resolve(rowCount); });
    stream.on("close", () => resolve(rowCount));
    stream.on("error", reject);
  });
}

// --- Helpers ---
const PLACEHOLDERS = new Set(["-", "na", "n/a", "null", "none", "nan"]);
function pick(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k.toLowerCase()]?.trim();
    if (v && !PLACEHOLDERS.has(v.toLowerCase())) return v;
  }
  return "";
}

function parsePrice(raw: string): number {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

const CATEGORY_MAP: [RegExp, string][] = [
  [/dress|skirt|gown|jumpsuit|romper/i, "Dresses"],
  [/kurta|salwar|saree|lehenga|dupatta|ethnic/i, "Dresses"],
  [/top|shirt|blouse|tee|tank|cami|tunic|bralette|crop/i, "Tops"],
  [/sweater|sweatshirt|hoodie|pullover|cardigan|knitwear/i, "Tops"],
  [/pant|jean|denim|trouser|legging|short|jogger|cargo|palazzo/i, "Bottoms"],
  [/jacket|coat|blazer|parka|trench|windbreaker|outerwear/i, "Outerwear"],
  [/shoe|boot|sandal|sneaker|heel|flat|loafer|pump|slipper|mule/i, "Shoes"],
  [/bag|purse|tote|clutch|backpack|wallet|handbag/i, "Bags"],
  [/jewelry|necklace|earring|bracelet|ring|watch|belt|scarf|hat|glove|accessory|sunglasses/i, "Accessories"],
];

const ALLOWED_CATEGORIES = new Set([
  "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories",
]);

function mapCategory(raw: string): string {
  for (const [re, cat] of CATEGORY_MAP) if (re.test(raw)) return cat;
  return "Tops";
}

const GENDER_WOMEN_RE =
  /\b(women|woman|ladies|lady|girls|girl|female|femme|kurti|kurtis|palazzo|dupatta|sharara|lehenga|saree|sari|anarkali|salwar|gharara|choli|ghagra)\b|kurta set|puff sleeve|wrap crop|keyhole neck|smocked|peplum|bodycon|corset|bralette/i;
const GENDER_MEN_RE =
  /\b(men|man|boys|boy|male|mens|gents)\b/i;

function mapGender(name: string): "women" | "men" | "unisex" {
  const isWomen = GENDER_WOMEN_RE.test(name);
  const isMen   = GENDER_MEN_RE.test(name);
  if (isWomen && !isMen) return "women";
  if (isMen && !isWomen) return "men";
  return "unisex";
}

const COLOR_HEX: Record<string, string> = {
  black: "#1A1A1A", white: "#FFFFFF", red: "#DC143C", blue: "#4169E1",
  navy: "#003153", green: "#228B22", yellow: "#FFD700", orange: "#FF8C00",
  pink: "#FF69B4", purple: "#6A0DAD", grey: "#808080", gray: "#808080",
  beige: "#F5F5DC", brown: "#795548", cream: "#FAF8F2", maroon: "#800000",
  olive: "#556B2F", teal: "#008080", gold: "#DAA520", rust: "#8B4513",
  coral: "#FF7F50", lavender: "#E6E6FA", khaki: "#C3B091", ivory: "#FFFFF0",
  silver: "#C0C0C0", copper: "#B87333", burgundy: "#722F37", camel: "#C19A6B",
  mustard: "#FFDB58", turquoise: "#40E0D0", fuchsia: "#FF00FF", indigo: "#4B0082",
  violet: "#EE82EE", peach: "#FFCBA4", mint: "#98FF98", charcoal: "#36454F",
};

function colorToHex(name: string): string {
  const lower = name.toLowerCase().trim();
  for (const [key, hex] of Object.entries(COLOR_HEX)) {
    if (lower.includes(key)) return hex;
  }
  return "#808080";
}

// --- Row processors (return null to skip) ---
type CatalogItem = {
  id: string; productName: string; brand: string; price: number;
  imageUrl: string; category: string; gender: "women" | "men" | "unisex"; matchScore: number;
  explanations: Array<{ icon: string; text: string }>; pairsWithCount: number;
  inWishlist: boolean; affiliateUrl: string; primaryColor: string; primaryColorHex: string;
};

function rowToAmazon(row: Record<string, string>, idx: number): CatalogItem | null {
  const title = pick(row, "title", "product_title", "name", "product_name");
  const url = pick(row, "product_url", "purl", "url", "link", "product_link");
  if (!title || !url) return null;

  const category = mapCategory(pick(row, "category", "main_category", "sub_category", "dept") || title);
  if (!ALLOWED_CATEGORIES.has(category)) return null;

  // Prefer a real ASIN over generic numeric id; skip placeholder "-"
  const asin = pick(row, "asin");
  const genericId = pick(row, "product_id", "sku", "id");
  const idRaw = asin || genericId;
  // Use "myn2" prefix for numeric-only IDs (Myntra with purl) to avoid collisions
  const idPrefix = asin ? "amz" : "myn2";

  const rawRating = pick(row, "rating", "avg_rating", "star_rating");
  const rating = parseFloat(rawRating);
  const matchScore = !isNaN(rating) && rating > 0
    ? Math.min(1, 0.6 + (Math.min(rating, 5) / 5) * 0.4)
    : 0.75;

  // img may be semicolon-separated list — take first
  const rawImg = pick(row, "image", "image_url", "imgurl", "thumbnail", "img");
  const imageUrl = rawImg.split(";")[0].trim();

  return {
    id: idRaw ? `${idPrefix}_${idRaw}` : `${idPrefix}_${idx}`,
    productName: title,
    brand: pick(row, "brand", "brand_name", "seller") || "Unknown",
    price: parsePrice(pick(row, "selling_price", "price", "discounted_price", "actual_price", "mrp")),
    imageUrl,
    category,
    gender: mapGender(title),
    matchScore,
    explanations: [],
    pairsWithCount: 0,
    inWishlist: false,
    affiliateUrl: url,
    primaryColor: "",
    primaryColorHex: "#808080",
  };
}

function rowToMyntra(row: Record<string, string>): CatalogItem | null {
  const name = pick(row, "name", "product_name", "title");
  const rawId = pick(row, "p_id", "product_id", "id");
  if (!name || !rawId) return null;
  const productId = Math.round(parseFloat(rawId));
  if (!productId) return null;

  const category = mapCategory(name);
  if (!ALLOWED_CATEGORIES.has(category)) return null;

  const colour = pick(row, "colour", "color");
  const rawRating = pick(row, "avg_rating", "rating");
  const rating = parseFloat(rawRating);
  const matchScore = !isNaN(rating) && rating > 0 ? Math.min(1, 0.6 + (rating / 5) * 0.4) : 0.75;

  return {
    id: `myn_${productId}`,
    productName: name,
    brand: pick(row, "brand", "brand_name") || "Unknown",
    price: parsePrice(pick(row, "price", "selling_price", "mrp")),
    imageUrl: pick(row, "img", "image", "image_url", "imgurl"),
    category,
    gender: mapGender(name),
    matchScore,
    explanations: [],
    pairsWithCount: 0,
    inWishlist: false,
    affiliateUrl: `https://www.myntra.com/${productId}`,
    primaryColor: colour.toLowerCase(),
    primaryColorHex: colorToHex(colour),
  };
}

// --- Main ---
async function main() {
  const existing: CatalogItem[] = APPEND_MODE && fs.existsSync(OUTPUT_JSON)
    ? JSON.parse(fs.readFileSync(OUTPUT_JSON, "utf-8")) as CatalogItem[]
    : [];

  const existingIds = new Set(existing.map((i) => i.id));
  const slots = MAX_ROWS - existing.length;

  if (APPEND_MODE) console.log(`Append mode — ${existing.length} existing, room for ${slots} more`);

  const newItems: CatalogItem[] = [];
  const perSource = Math.ceil(slots / INPUTS.length);

  for (const csvPath of INPUTS) {
    if (!fs.existsSync(csvPath)) { console.error(`Not found: ${csvPath}`); continue; }
    console.log(`Reading: ${csvPath}`);

    const sourceItems: CatalogItem[] = [];
    let detectedFormat = "";

    const total = await readCSVStream(csvPath, (row, rowIdx) => {
      if (sourceItems.length >= perSource) return false; // stop reading

      // Detect format on first row
      if (detectedFormat === "") {
        const keys = Object.keys(row);
        detectedFormat = keys.includes("p_id") ? "myntra-pid"
          : keys.includes("purl") ? "myntra-purl"
          : "amazon";
      }

      const item = detectedFormat === "myntra-pid"
        ? rowToMyntra(row)
        : rowToAmazon(row, rowIdx);

      if (!item || existingIds.has(item.id)) return true;
      existingIds.add(item.id);
      sourceItems.push(item);
      return true;
    });

    console.log(`  Scanned ~${total} rows → kept ${sourceItems.length} items (${detectedFormat})`);
    newItems.push(...sourceItems);
  }

  const final = [...existing, ...newItems].slice(0, MAX_ROWS);
  console.log(`Writing ${final.length} total items → ${OUTPUT_JSON}`);
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(final, null, 2));
  console.log("Done. Restart the dev server to pick up the new catalog.");
}

main().catch((err) => { console.error(err); process.exit(1); });
