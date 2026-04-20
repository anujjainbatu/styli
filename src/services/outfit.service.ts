import { prisma } from "@/lib/prisma"
import { Errors } from "@/lib/errors"
import type { OutfitGenerateInput } from "@/types/api"

const SLOT_CATEGORIES: Record<string, string[]> = {
  top:       ["Tops"],
  bottom:    ["Bottoms"],
  dress:     ["Dresses"],
  outerwear: ["Outerwear"],
  shoes:     ["Shoes"],
  accessory: ["Accessories", "Bags"],
}

export async function getDailyOutfit(userId: string) {
  const recent = await prisma.outfit.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { wardrobeItem: true } } },
  })
  if (recent) return recent
  return generateOutfit(userId, {})
}

export async function generateOutfit(userId: string, input: OutfitGenerateInput) {
  const wardrobe = await prisma.wardrobeItem.findMany({
    where: { userId, deletedAt: null },
    orderBy: { wearCount: "asc" },
  })

  if (wardrobe.length < 2) return null

  const pick = (cats: string[]) =>
    wardrobe.find((w) => cats.includes(w.category)) ?? null

  const hasDress = pick(["Dresses"])

  const slots: Array<{ slot: string; wardrobeItemId: string }> = []

  if (hasDress) {
    slots.push({ slot: "dress", wardrobeItemId: hasDress.id })
  } else {
    const top    = pick(SLOT_CATEGORIES.top)
    const bottom = pick(SLOT_CATEGORIES.bottom)
    if (top)    slots.push({ slot: "top",    wardrobeItemId: top.id })
    if (bottom) slots.push({ slot: "bottom", wardrobeItemId: bottom.id })
  }

  const shoes     = pick(SLOT_CATEGORIES.shoes)
  const outerwear = pick(SLOT_CATEGORIES.outerwear)
  const accessory = pick(SLOT_CATEGORIES.accessory)
  if (shoes)     slots.push({ slot: "shoes",     wardrobeItemId: shoes.id })
  if (outerwear) slots.push({ slot: "outerwear", wardrobeItemId: outerwear.id })
  if (accessory) slots.push({ slot: "accessory", wardrobeItemId: accessory.id })

  if (slots.length < 2) return null

  return prisma.outfit.create({
    data: {
      userId,
      source: "ai_generated",
      occasion: input.occasion,
      season: input.season,
      formalityLevel: input.formalityLevel,
      overallScore: 0.82,
      items: { create: slots },
    },
    include: { items: { include: { wardrobeItem: true } } },
  })
}

export async function listOutfits(userId: string) {
  return prisma.outfit.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { wardrobeItem: true } } },
  })
}

export async function markOutfitWorn(id: string, userId: string) {
  const outfit = await prisma.outfit.findFirst({ where: { id, userId } })
  if (!outfit) throw Errors.NotFound("Outfit")
  return prisma.outfit.update({
    where: { id },
    data: { wornCount: { increment: 1 }, lastWornAt: new Date() },
  })
}
