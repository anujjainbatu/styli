import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase"
import { extractProductFromUrl } from "@/services/wardrobe.service"
import { ExtractUrlSchema } from "@/types/api"
import { apiError, Errors } from "@/lib/errors"

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) throw Errors.Unauthorized()

    const body = await req.json()
    const parsed = ExtractUrlSchema.safeParse(body)
    if (!parsed.success) {
      throw Errors.BadRequest(parsed.error.issues.map((e) => e.message).join(", "))
    }

    const product = await extractProductFromUrl(parsed.data.url)
    return NextResponse.json({ product })
  } catch (e) {
    return apiError(e)
  }
}
