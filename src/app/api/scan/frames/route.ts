import { NextRequest, NextResponse } from "next/server"
import { getAuthUser, createSupabaseAdminClient } from "@/lib/supabase"
import { requireUser, markScanCompleted } from "@/services/user.service"
import { saveExtractionResult, createScanRetention } from "@/services/scan.service"
import { getExtractor } from "@/services/extraction.service"
import type { ImageInput } from "@/services/extraction.service"
import { apiError, Errors } from "@/lib/errors"

export async function POST(req: NextRequest) {
  const stage = { current: "auth" }
  try {
    const authUser = await getAuthUser()
    if (!authUser) throw Errors.Unauthorized()
    const user = await requireUser(authUser.id)

    stage.current = "parse"
    const formData = await req.formData()
    const frames = formData.getAll("frames") as File[]
    const consentGivenAt = formData.get("consentGivenAt") as string | null

    if (!frames || frames.length === 0) {
      throw Errors.BadRequest("At least one frame is required")
    }
    if (frames.length > 5) {
      throw Errors.BadRequest("Maximum 5 frames allowed")
    }

    stage.current = "storage"
    const adminClient = createSupabaseAdminClient()
    const uploadedPaths: string[] = []
    const imageInputs: ImageInput[] = []

    for (const frame of frames) {
      if (!(frame instanceof File)) continue
      const path = `${user.id}/frame_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
      const buffer = Buffer.from(await frame.arrayBuffer())
      imageInputs.push({ data: buffer, mediaType: "image/jpeg" })

      const { error } = await adminClient.storage
        .from("scan-uploads")
        .upload(path, buffer, { contentType: "image/jpeg", upsert: false })

      if (error) {
        console.error("[scan/frames] storage upload failed:", error.message)
      } else {
        uploadedPaths.push(path)
      }
    }

    stage.current = "extraction"
    const result = await getExtractor().extract(imageInputs)

    stage.current = "profile"
    await saveExtractionResult(user.id, result, "camera", consentGivenAt ?? undefined)
    await markScanCompleted(user.id)

    // retention is best-effort — a tracking failure must not fail the scan
    stage.current = "retention"
    await createScanRetention(user.id, uploadedPaths, "camera").catch((err) => {
      console.error("[scan/frames] retention tracking failed (non-fatal):", err)
    })

    return NextResponse.json({
      ok: true,
      extractionConfidence: result.extractionConfidence,
      warnings: result.warnings,
    }, { status: 201 })
  } catch (e) {
    console.error(`[scan/frames] stage=${stage.current}`, e)
    return apiError(e)
  }
}
