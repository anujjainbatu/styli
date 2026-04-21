import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase"
import { requireUser } from "@/services/user.service"
import {
  refreshTokenIfNeeded,
  fetchAccountInfo,
  fetchMedia,
} from "@/services/instagram.service"
import { apiError, Errors } from "@/lib/errors"

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) throw Errors.Unauthorized()
    const user = await requireUser(authUser.id)

    const accessToken = await refreshTokenIfNeeded(user.id)
    if (!accessToken) {
      return NextResponse.json(
        { error: "token_invalid", message: "Instagram account not connected" },
        { status: 401 }
      )
    }

    const accountInfo = await fetchAccountInfo(accessToken)
    const accountType: string = accountInfo.account_type ?? "PERSONAL"

    // Instagram Basic Display API only works for Business/Creator accounts
    // when approved via App Review. Personal accounts are blocked by policy.
    if (accountType === "PERSONAL") {
      return NextResponse.json(
        {
          error: "personal_account",
          message:
            "Instagram media import requires a Business or Creator account. " +
            "Switch your account type in the Instagram app under Settings → Account.",
        },
        { status: 403 }
      )
    }

    const media = await fetchMedia(accessToken, 20)
    return NextResponse.json({ media, accountType })
  } catch (e) {
    return apiError(e)
  }
}
