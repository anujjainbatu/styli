import { prisma } from "@/lib/prisma"
import type { RecommendationQuery, RecommendationResponse } from "@/types/api"
import type { RecommendationItem } from "@/lib/mock-data"
import { CATALOG } from "@/lib/catalog"

// ─── Gender filter ────────────────────────────────────────────────────────────

// Explicit gender markers
const WOMEN_RE = /\b(women|woman|ladies|lady|girls|girl|female|femme)\b/i
const MEN_RE   = /\b(men|man|boys|boy|male|mens|gents)\b/i

// Indian ethnic garments and women's style cues exclusively for women
const WOMEN_ETHNIC_RE =
  /\b(kurti|kurtis|palazzo|dupatta|sharara|lehenga|saree|sari|anarkali|salwar|gharara|choli|ghagra)\b|kurta set|puff sleeve|wrap crop|keyhole neck|smocked|peplum|bodycon|corset|bralette/i

function inferProductGender(productName: string): "women" | "men" | "unisex" {
  const hasWomen = WOMEN_RE.test(productName) || WOMEN_ETHNIC_RE.test(productName)
  const hasMen   = MEN_RE.test(productName)
  if (hasWomen && !hasMen) return "women"
  if (hasMen && !hasWomen) return "men"
  return "unisex"
}

function normalizeGender(g: string): "men" | "women" | null {
  const lower = g.toLowerCase()
  if (lower === "man" || lower === "men" || lower === "male") return "men"
  if (lower === "woman" || lower === "women" || lower === "female") return "women"
  return null // non-binary, prefer_not, etc. → no filter
}

function genderAllowed(
  item: { productName: string; gender?: "women" | "men" | "unisex" },
  userGender: string | null | undefined
): boolean {
  if (!userGender) return true
  const normalized = normalizeGender(userGender)
  if (!normalized) return true
  const productGender = item.gender ?? inferProductGender(item.productName)
  if (productGender === "unisex") return true
  return productGender === normalized
}

// ─── Category inference ───────────────────────────────────────────────────────

const INTENT_CATEGORY_MAP: [RegExp, string][] = [
  [/\b(pant|trouser|jean|denim|legging|short|skirt|palazzo|sharara)\b/i, "Bottoms"],
  [/\b(top|shirt|blouse|tee|kurti|kurta|tank|cami|crop|tunic)\b/i, "Tops"],
  [/\b(dress|gown|maxi|midi|jumpsuit|romper)\b/i, "Dresses"],
  [/\b(jacket|coat|blazer|parka|trench)\b/i, "Outerwear"],
  [/\b(shoe|heel|sneaker|boot|sandal|loafer|flat|pump|slipper)\b/i, "Shoes"],
  [/\b(bag|purse|belt|scarf|hat|necklace|earring|watch|jewelry)\b/i, "Accessories"],
]

function extractKeywords(intent: string): string[] {
  return intent.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
}

function inferCategory(keywords: string[]): string | null {
  const joined = keywords.join(" ")
  for (const [re, cat] of INTENT_CATEGORY_MAP) {
    if (re.test(joined)) return cat
  }
  return null
}

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function intentScore(item: RecommendationItem, keywords: string[]): number {
  const haystack = `${item.productName} ${item.primaryColor ?? ""}`.toLowerCase()
  const matched = keywords.filter((kw) => haystack.includes(kw)).length
  return keywords.length > 0 ? matched / keywords.length : 0
}

type ProfileSlice = {
  colorPalette?: string[]
  colorSeason?: string | null
} | null

function generateExplanations(
  item: RecommendationItem,
  keywords: string[],
  profile: ProfileSlice
): Array<{ icon: string; text: string }> {
  const chips: Array<{ icon: string; text: string }> = []
  if (keywords.length > 0) {
    const haystack = `${item.productName} ${item.primaryColor ?? ""}`.toLowerCase()
    const matched = keywords.filter((kw) => haystack.includes(kw))
    if (matched.length > 0)
      chips.push({ icon: "✦", text: `Matches "${matched.slice(0, 2).join(", ")}"` })
  }
  if (profile?.colorPalette?.length && item.primaryColorHex) {
    const inPalette = profile.colorPalette.some(
      (c) => hexDistance(c, item.primaryColorHex) < 60
    )
    if (inPalette)
      chips.push({ icon: "◈", text: `${profile.colorSeason ?? "palette"} match` })
  }
  return chips.slice(0, 2)
}

function scoreItem(
  item: RecommendationItem,
  profile: ProfileSlice,
  keywords?: string[]
): number {
  const colorBonus =
    profile?.colorPalette?.length && item.primaryColorHex
      ? profile.colorPalette.some((c) => hexDistance(c, item.primaryColorHex) < 60)
        ? 0.05
        : 0
      : 0

  if (keywords?.length) {
    const intentRelevance = intentScore(item, keywords)
    const profileAffinity = Math.min(1, item.matchScore + colorBonus)
    return intentRelevance * 0.7 + profileAffinity * 0.3
  }

  return Math.min(1, item.matchScore + colorBonus)
}

function hexDistance(a: string, b: string): number {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
  const [ar, ag, ab] = parse(a)
  const [br, bg, bb] = parse(b)
  return Math.sqrt((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2)
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function getRecommendations(
  userId: string,
  query: RecommendationQuery
): Promise<RecommendationResponse> {
  const [profile, prefs, wishlist] = await Promise.all([
    prisma.bodyProfile.findUnique({ where: { userId } }),
    prisma.stylePreferences.findUnique({ where: { userId }, select: { genderIdentity: true } }),
    prisma.wishlistItem.findMany({ where: { userId }, select: { externalId: true } }),
  ])
  const wishlistIds = new Set(wishlist.map((w) => w.externalId).filter(Boolean))
  const userGender = prefs?.genderIdentity ?? null
  const genderPool = CATALOG.filter((i) => genderAllowed(i, userGender))

  if (query.intent && process.env.ENABLE_INTENT_RECS !== "false") {
    const keywords = extractKeywords(query.intent)
    const inferredCat = inferCategory(keywords)

    const pool = inferredCat
      ? genderPool.filter((i) => i.category === inferredCat)
      : genderPool

    // Stage A — items with at least one keyword hit, scored by intent dominance
    const stageA = pool
      .map((item) => ({
        ...item,
        inWishlist: wishlistIds.has(item.id),
        matchScore: scoreItem(item, profile, keywords),
        explanations: generateExplanations(item, keywords, profile),
      }))
      .filter((i) => intentScore(i, keywords) > 0)
      .sort((a, b) => b.matchScore - a.matchScore)

    if (stageA.length >= 5) {
      return { items: stageA.slice(0, query.limit), fallback: false }
    }

    // Stage B — same-category fallback by profile affinity
    const stageB = pool
      .map((item) => ({
        ...item,
        inWishlist: wishlistIds.has(item.id),
        matchScore: scoreItem(item, profile),
        explanations: generateExplanations(item, [], profile),
      }))
      .sort((a, b) => b.matchScore - a.matchScore)

    return {
      items: stageB.slice(0, query.limit),
      fallback: true,
      fallbackReason: inferredCat
        ? `No exact matches — showing similar ${inferredCat}`
        : "No exact matches found",
    }
  }

  // Legacy path (no intent or feature flag off)
  let items = genderPool.map((item) => ({
    ...item,
    inWishlist: wishlistIds.has(item.id),
    matchScore: scoreItem(item, profile),
    explanations: generateExplanations(item, [], profile),
  }))

  if (query.category && query.category !== "All") {
    items = items.filter((i) => i.category === query.category)
  }

  switch (query.sort) {
    case "price_asc":  items.sort((a, b) => a.price - b.price); break
    case "price_desc": items.sort((a, b) => b.price - a.price); break
    case "newest":     break
    default:           items.sort((a, b) => b.matchScore - a.matchScore)
  }

  return { items: items.slice(0, query.limit), fallback: false }
}
