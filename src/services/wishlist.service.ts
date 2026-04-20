import { prisma } from "@/lib/prisma"
import { Errors } from "@/lib/errors"
import type { WishlistAddInput } from "@/types/api"

export async function listWishlistItems(userId: string, category?: string) {
  return prisma.wishlistItem.findMany({
    where: {
      userId,
      ...(category && category !== "All" ? { category } : {}),
    },
    orderBy: { savedAt: "desc" },
  })
}

export async function addToWishlist(userId: string, input: WishlistAddInput) {
  if (input.externalId) {
    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_externalId: { userId, externalId: input.externalId } },
    })
    if (existing) throw Errors.Conflict("Item already in wishlist")
  }
  return prisma.wishlistItem.create({
    data: { userId, ...input },
  })
}

export async function removeFromWishlist(id: string, userId: string) {
  const item = await prisma.wishlistItem.findFirst({ where: { id, userId } })
  if (!item) throw Errors.NotFound("Wishlist item")
  return prisma.wishlistItem.delete({ where: { id } })
}
