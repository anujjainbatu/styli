import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase"
import { requireUser } from "@/services/user.service"
import { updateWardrobeItem, deleteWardrobeItem } from "@/services/wardrobe.service"
import { WardrobeItemUpdateSchema } from "@/types/api"
import { apiError, Errors } from "@/lib/errors"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) throw Errors.Unauthorized()
    const user = await requireUser(authUser.id)
    const { id } = await params

    const body = await req.json()
    const parsed = WardrobeItemUpdateSchema.safeParse(body)
    if (!parsed.success) {
      throw Errors.BadRequest(parsed.error.issues.map((e) => e.message).join(", "))
    }

    const item = await updateWardrobeItem(id, user.id, parsed.data)
    return NextResponse.json({ item })
  } catch (e) {
    return apiError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) throw Errors.Unauthorized()
    const user = await requireUser(authUser.id)
    const { id } = await params

    await deleteWardrobeItem(id, user.id)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return apiError(e)
  }
}
