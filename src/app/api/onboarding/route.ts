import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase"
import { requireUser, upsertUser } from "@/services/user.service"
import { saveOnboarding, getOnboarding } from "@/services/onboarding.service"
import { OnboardingSchema } from "@/types/api"
import { apiError, Errors } from "@/lib/errors"

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) throw Errors.Unauthorized()
    const user = await requireUser(authUser.id)
    const prefs = await getOnboarding(user.id)
    return NextResponse.json({ preferences: prefs })
  } catch (e) {
    return apiError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) throw Errors.Unauthorized()

    const user = await upsertUser(
      authUser.id,
      authUser.email!,
      authUser.user_metadata?.full_name ?? authUser.email!.split("@")[0]
    )

    const body = await req.json()
    const parsed = OnboardingSchema.safeParse(body)
    if (!parsed.success) {
      throw Errors.BadRequest(parsed.error.issues.map((e) => e.message).join(", "))
    }

    const prefs = await saveOnboarding(user.id, parsed.data)
    return NextResponse.json({ preferences: prefs }, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
