import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase"
import { requireUser } from "@/services/user.service"
import { getBodyProfile, saveBodyProfile } from "@/services/scan.service"
import { markScanCompleted } from "@/services/user.service"
import { ScanConfirmSchema } from "@/types/api"
import { apiError, Errors } from "@/lib/errors"

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) throw Errors.Unauthorized()
    const user = await requireUser(authUser.id)
    const profile = await getBodyProfile(user.id)
    return NextResponse.json({ profile })
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
    const parsed = ScanConfirmSchema.safeParse(body)
    if (!parsed.success) {
      throw Errors.BadRequest(parsed.error.issues.map((e) => e.message).join(", "))
    }

    const profile = await saveBodyProfile(user.id, parsed.data)
    await markScanCompleted(user.id)
    return NextResponse.json({ profile }, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
