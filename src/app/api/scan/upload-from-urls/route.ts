import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthUser } from "@/lib/supabase"
import { requireUser, markScanCompleted } from "@/services/user.service"
import { saveExtractionResult } from "@/services/scan.service"
import { getExtractor, fetchImageBuffer } from "@/services/extraction.service"
import { apiError, Errors } from "@/lib/errors"

const Schema = z.object({
  mediaUrls: z.array(z.string().url()).min(1).max(5),
  source: z.enum(["instagram"]).default("instagram"),
  consentGivenAt: z.string().datetime().optional(),
})

export async function POST(req: NextRequest) {
  const stage = { current: "auth" }
  try {
    const authUser = await getAuthUser()
    if (!authUser) throw Errors.Unauthorized()
    const user = await requireUser(authUser.id)

    stage.current = "parse"
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      throw Errors.BadRequest(parsed.error.issues.map((e) => e.message).join(", "))
    }

    const { mediaUrls, source, consentGivenAt } = parsed.data

    stage.current = "fetch"
    const imageResults = await Promise.all(mediaUrls.map(fetchImageBuffer))
    const imageInputs = imageResults.filter((img) => img !== null)

    stage.current = "extraction"
    const result = await getExtractor().extract(imageInputs)

    stage.current = "profile"
    await saveExtractionResult(user.id, result, source, consentGivenAt)
    await markScanCompleted(user.id)

    return NextResponse.json({
      ok: true,
      extractionConfidence: result.extractionConfidence,
      warnings: result.warnings,
    }, { status: 201 })
  } catch (e) {
    console.error(`[scan/upload-from-urls] stage=${stage.current}`, e)
    return apiError(e)
  }
}
