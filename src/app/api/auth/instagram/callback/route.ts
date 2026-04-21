import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase"
import { requireUser } from "@/services/user.service"
import { upsertToken } from "@/services/instagram.service"
import { apiError, Errors } from "@/lib/errors"

type ShortLivedTokenResponse = {
  access_token: string
  user_id: number
}

type LongLivedTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) throw Errors.Unauthorized()

    const { searchParams } = req.nextUrl
    const code = searchParams.get("code")
    const errorParam = searchParams.get("error")

    if (errorParam || !code) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      return NextResponse.redirect(`${appUrl}/intake?instagram_error=cancelled`)
    }

    const clientId = process.env.INSTAGRAM_CLIENT_ID!
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET!
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const redirectUri = `${appUrl}/api/auth/instagram/callback`

    // Step 1: exchange code for short-lived token
    const tokenForm = new URLSearchParams()
    tokenForm.set("client_id", clientId)
    tokenForm.set("client_secret", clientSecret)
    tokenForm.set("grant_type", "authorization_code")
    tokenForm.set("redirect_uri", redirectUri)
    tokenForm.set("code", code)

    const shortRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: tokenForm,
    })
    if (!shortRes.ok) {
      const err = await shortRes.json().catch(() => ({}))
      throw new Error((err as { error_message?: string }).error_message ?? "Token exchange failed")
    }
    const shortData = await shortRes.json() as ShortLivedTokenResponse

    // Step 2: exchange short-lived for long-lived token
    const longUrl = new URL("https://graph.instagram.com/access_token")
    longUrl.searchParams.set("grant_type", "ig_exchange_token")
    longUrl.searchParams.set("client_secret", clientSecret)
    longUrl.searchParams.set("access_token", shortData.access_token)

    const longRes = await fetch(longUrl.toString())
    if (!longRes.ok) {
      // Fall back to short-lived token
      const user = await requireUser(authUser.id)
      await upsertToken(user.id, shortData.access_token, 3600)
    } else {
      const longData = await longRes.json() as LongLivedTokenResponse
      const user = await requireUser(authUser.id)
      await upsertToken(user.id, longData.access_token, longData.expires_in)
    }

    return NextResponse.redirect(`${appUrl}/scan/instagram`)
  } catch (e) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    console.error("Instagram callback error:", e)
    return NextResponse.redirect(`${appUrl}/intake?instagram_error=auth_failed`)
  }
}
