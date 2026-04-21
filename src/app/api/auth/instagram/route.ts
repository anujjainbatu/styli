import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase"
import { apiError, Errors } from "@/lib/errors"

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) throw Errors.Unauthorized()

    const clientId = process.env.INSTAGRAM_CLIENT_ID
    if (!clientId) {
      throw Errors.BadRequest("Instagram integration is not configured")
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const redirectUri = `${appUrl}/api/auth/instagram/callback`

    const authUrl = new URL("https://api.instagram.com/oauth/authorize")
    authUrl.searchParams.set("client_id", clientId)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("scope", "user_profile,user_media")
    authUrl.searchParams.set("response_type", "code")

    return NextResponse.redirect(authUrl.toString())
  } catch (e) {
    return apiError(e)
  }
}
