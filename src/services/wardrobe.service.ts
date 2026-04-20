import { prisma } from "@/lib/prisma"
import { Errors } from "@/lib/errors"
import type { WardrobeItemCreateInput, WardrobeItemUpdateInput, WardrobeQuery } from "@/types/api"

export async function listWardrobeItems(userId: string, query: WardrobeQuery) {
  const where = {
    userId,
    deletedAt: null,
    ...(query.category && query.category !== "All" ? { category: query.category } : {}),
  }

  const orderBy = (() => {
    switch (query.sort) {
      case "most_worn":  return { wearCount: "desc" as const }
      case "least_worn": return { wearCount: "asc" as const }
      case "by_color":   return { primaryColor: "asc" as const }
      default:           return { createdAt: "desc" as const }
    }
  })()

  return prisma.wardrobeItem.findMany({ where, orderBy })
}

export async function createWardrobeItem(userId: string, input: WardrobeItemCreateInput) {
  return prisma.wardrobeItem.create({
    data: { userId, ...input },
  })
}

export async function updateWardrobeItem(
  id: string,
  userId: string,
  input: WardrobeItemUpdateInput
) {
  const item = await prisma.wardrobeItem.findFirst({ where: { id, userId, deletedAt: null } })
  if (!item) throw Errors.NotFound("Wardrobe item")
  return prisma.wardrobeItem.update({ where: { id }, data: { ...input, updatedAt: new Date() } })
}

export async function deleteWardrobeItem(id: string, userId: string) {
  const item = await prisma.wardrobeItem.findFirst({ where: { id, userId, deletedAt: null } })
  if (!item) throw Errors.NotFound("Wardrobe item")
  return prisma.wardrobeItem.update({ where: { id }, data: { deletedAt: new Date() } })
}

export async function extractProductFromUrl(url: string) {
  const { load } = await import("cheerio")

  let html: string
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Styli-bot/1.0)" },
      signal: AbortSignal.timeout(8000),
    })
    html = await res.text()
  } catch {
    throw Errors.BadRequest("Could not fetch the product URL")
  }

  const $ = load(html)

  // Tier 1: Schema.org JSON-LD
  const ldScripts = $('script[type="application/ld+json"]').toArray()
  for (const el of ldScripts) {
    try {
      const json = JSON.parse($(el).html() ?? "")
      const product = Array.isArray(json)
        ? json.find((j: { "@type"?: string }) => j["@type"] === "Product")
        : json["@type"] === "Product"
        ? json
        : null
      if (product) {
        const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers
        return {
          name: product.name ?? null,
          brand: product.brand?.name ?? product.brand ?? null,
          price: offer?.price ? parseFloat(offer.price) : null,
          category: product.category ?? null,
          color: product.color ?? null,
          colorHex: null,
          imageUrl: Array.isArray(product.image) ? product.image[0] : product.image ?? null,
          productUrl: url,
          source: "schema" as const,
        }
      }
    } catch { /* skip malformed JSON-LD */ }
  }

  // Tier 2: Open Graph
  const ogTitle = $('meta[property="og:title"]').attr("content")
  const ogImage = $('meta[property="og:image"]').attr("content")
  const ogPrice =
    $('meta[property="product:price:amount"]').attr("content") ??
    $('meta[property="og:price:amount"]').attr("content")
  if (ogTitle) {
    return {
      name: ogTitle,
      brand: $('meta[property="og:site_name"]').attr("content") ?? null,
      price: ogPrice ? parseFloat(ogPrice) : null,
      category: null,
      color: null,
      colorHex: null,
      imageUrl: ogImage ?? null,
      productUrl: url,
      source: "og" as const,
    }
  }

  // Tier 3: HTML scraping
  const h1 = $("h1").first().text().trim() || null
  const largestImg = $("img[src]")
    .toArray()
    .map((el) => ({ src: $(el).attr("src"), w: parseInt($(el).attr("width") ?? "0") }))
    .sort((a, b) => b.w - a.w)[0]?.src ?? null

  return {
    name: h1,
    brand: null,
    price: null,
    category: null,
    color: null,
    colorHex: null,
    imageUrl: largestImg,
    productUrl: url,
    source: "scrape" as const,
  }
}
