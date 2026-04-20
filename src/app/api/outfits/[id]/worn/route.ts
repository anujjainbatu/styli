import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase"
import { requireUser } from "@/services/user.service"
import { markOutfitWorn } from "@/services/outfit.service"
import { apiError, Errors } from "@/lib/errors"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) throw Errors.Unauthorized()
    const user = await requireUser(authUser.id)
    const { id } = await params

    const outfit = await markOutfitWorn(id, user.id)
    return NextResponse.json({ outfit })
  } catch (e) {
    return apiError(e)
  }
}
