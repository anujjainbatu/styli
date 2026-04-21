import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getAuthUser } from "@/lib/supabase"
import { requireUser } from "@/services/user.service"
import { prisma } from "@/lib/prisma"
import { apiError, Errors } from "@/lib/errors"
import type { IntentResponse } from "@/types/api"

const anthropic = new Anthropic()

export async function POST(): Promise<NextResponse> {
  try {
    const authUser = await getAuthUser()
    if (!authUser) throw Errors.Unauthorized()
    const user = await requireUser(authUser.id)

    const [profile, prefs] = await Promise.all([
      prisma.bodyProfile.findUnique({ where: { userId: user.id } }),
      prisma.stylePreferences.findUnique({
        where: { userId: user.id },
        select: { genderIdentity: true },
      }),
    ])

    if (!profile) {
      return NextResponse.json<IntentResponse>({ keywords: [] })
    }

    const gender = prefs?.genderIdentity ?? "unisex"

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system:
        "You are a fashion stylist. Given a user's style profile, output a JSON array of 3-5 short product search queries. Each query should be 2-4 words. Return ONLY a valid JSON array like [\"navy wrap dress\", \"cream linen pant\"] — no explanation, no markdown, no code fences.",
      messages: [
        {
          role: "user",
          content: `body_shape: ${profile.bodyShape ?? "unknown"}, color_season: ${profile.colorSeason ?? "unknown"}, undertone: ${profile.skinUndertone ?? "unknown"}, gender: ${gender}, silhouettes: ${profile.recommendedSilhouettes.join(", ") || "none"}`,
        },
      ],
    })

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "[]"

    // Strip any accidental markdown code fences
    const cleaned = raw.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "").trim()

    let keywords: string[] = []
    try {
      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed)) {
        keywords = parsed.filter((k): k is string => typeof k === "string").slice(0, 5)
      }
    } catch {
      keywords = []
    }

    return NextResponse.json<IntentResponse>({ keywords })
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return apiError(e)
    }
    console.error("[intent] Claude call failed:", e)
    return NextResponse.json<IntentResponse>({ keywords: [] })
  }
}
