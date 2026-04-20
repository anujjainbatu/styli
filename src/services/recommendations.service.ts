import { prisma } from "@/lib/prisma"
import type { RecommendationQuery } from "@/types/api"
import { MOCK_RECOMMENDATIONS } from "@/lib/mock-data"

/**
 * MVP: returns seeded/mock recommendations scored against the user's body profile.
 * V2 will replace this with vector similarity + affiliate product catalog.
 */
export async function getRecommendations(userId: string, query: RecommendationQuery) {
  const profile = await prisma.bodyProfile.findUnique({ where: { userId } })
  const wishlist = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { externalId: true },
  })
  const wishlistIds = new Set(wishlist.map((w) => w.externalId).filter(Boolean))

  let items = MOCK_RECOMMENDATIONS.map((rec) => ({
    ...rec,
    inWishlist: wishlistIds.has(rec.id),
    matchScore: scoreItem(rec, profile),
  }))

  if (query.category && query.category !== "All") {
    items = items.filter((i) => i.category === query.category)
  }

  switch (query.sort) {
    case "price_asc":  items.sort((a, b) => a.price - b.price); break
    case "price_desc": items.sort((a, b) => b.price - a.price); break
    case "newest":     /* mock data has no dates, keep order */; break
    default:           items.sort((a, b) => b.matchScore - a.matchScore); break
  }

  return items.slice(0, query.limit)
}

function scoreItem(
  item: (typeof MOCK_RECOMMENDATIONS)[number],
  profile: { colorPalette?: string[]; bodyShape?: string | null } | null
): number {
  let score = item.matchScore

  if (profile?.colorPalette?.length && item.primaryColorHex) {
    const inPalette = profile.colorPalette.some((c) =>
      hexDistance(c, item.primaryColorHex!) < 60
    )
    if (inPalette) score = Math.min(1, score + 0.05)
  }

  return score
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
