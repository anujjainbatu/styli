import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase"
import { requireUser } from "@/services/user.service"
import { removeFromWishlist } from "@/services/wishlist.service"
import { apiError, Errors } from "@/lib/errors"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) throw Errors.Unauthorized()
    const user = await requireUser(authUser.id)
    const { id } = await params

    await removeFromWishlist(id, user.id)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return apiError(e)
  }
}
