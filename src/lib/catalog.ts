import fs from "fs";
import path from "path";
import type { RecommendationItem } from "./mock-data";
import { MOCK_RECOMMENDATIONS } from "./mock-data";

const DISPLAYABLE_CATEGORIES = new Set([
  "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories",
]);

const JSON_PATH = path.join(process.cwd(), "src/lib/catalog-data.json");

// Loaded once per process, never bundled into client JS
let _catalog: RecommendationItem[] | null = null;

function load(): RecommendationItem[] {
  if (_catalog) return _catalog;
  try {
    const raw = fs.readFileSync(JSON_PATH, "utf-8");
    const data = JSON.parse(raw) as RecommendationItem[];
    if (data.length > 0) {
      _catalog = data.filter(
        (item) =>
          item.productName?.trim() &&
          item.affiliateUrl?.trim() &&
          DISPLAYABLE_CATEGORIES.has(item.category)
      );
      return _catalog;
    }
  } catch {
    // file missing or empty — fall through to mock
  }
  _catalog = MOCK_RECOMMENDATIONS;
  return _catalog;
}

export function getCatalog(): RecommendationItem[] {
  return load();
}
