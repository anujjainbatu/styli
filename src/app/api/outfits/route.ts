import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase"
import { requireUser } from "@/services/user.service"
import { getDailyOutfit, generateOutfit, listOutfits } from "@/services/outfit.service"
import { OutfitGenerateSchema } from "@/types/api"
import { apiError, Errors } from "@/lib/errors"

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) throw Errors.Unauthorized()
    const user = await requireUser(authUser.id)

    const outfit = await getDailyOutfit(user.id)
    const all    = await listOutfits(user.id)
    return NextResponse.json({ outfit, history: all })
  } catch (e) {
    return apiError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) throw Errors.Unauthorized()
    const user = await requireUser(authUser.id)

    const body = await req.json().catch(() => ({}))
    const parsed = OutfitGenerateSchema.safeParse(body)
    if (!parsed.success) {
      throw Errors.BadRequest(parsed.error.issues.map((e) => e.message).join(", "))
    }

    const outfit = await generateOutfit(user.id, parsed.data)
    if (!outfit) {
      throw Errors.BadRequest("Not enough wardrobe items to generate an outfit. Add at least 2 items.")
    }
    return NextResponse.json({ outfit }, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
