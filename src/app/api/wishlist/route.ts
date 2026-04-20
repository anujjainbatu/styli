import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase"
import { requireUser } from "@/services/user.service"
import { listWishlistItems, addToWishlist } from "@/services/wishlist.service"
import { WishlistAddSchema } from "@/types/api"
import { apiError, Errors } from "@/lib/errors"

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) throw Errors.Unauthorized()
    const user = await requireUser(authUser.id)

    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category") ?? undefined
    const items = await listWishlistItems(user.id, category)
    return NextResponse.json({ items })
  } catch (e) {
    return apiError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) throw Errors.Unauthorized()
    const user = await requireUser(authUser.id)

    const body = await req.json()
    const parsed = WishlistAddSchema.safeParse(body)
    if (!parsed.success) {
      throw Errors.BadRequest(parsed.error.issues.map((e) => e.message).join(", "))
    }

    const item = await addToWishlist(user.id, parsed.data)
    return NextResponse.json({ item }, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
