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
    const images = formData.getAll("images") as File[]
    const consentGivenAt = formData.get("consentGivenAt") as string | null

    if (!images || images.length === 0) {
      throw Errors.BadRequest("At least one image is required")
    }
    if (images.length > 5) {
      throw Errors.BadRequest("Maximum 5 images allowed")
    }

    stage.current = "storage"
    const adminClient = createSupabaseAdminClient()
    const uploadedPaths: string[] = []
    const imageInputs: ImageInput[] = []

    for (const image of images) {
      if (!(image instanceof File)) continue
      const ext = image.name.split(".").pop()?.toLowerCase() ?? "jpg"
      const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const buffer = Buffer.from(await image.arrayBuffer())

      const mediaType = (
        image.type === "image/png" ? "image/png"
        : image.type === "image/webp" ? "image/webp"
        : "image/jpeg"
      ) as ImageInput["mediaType"]
      imageInputs.push({ data: buffer, mediaType })

      const { error } = await adminClient.storage
        .from("scan-uploads")
        .upload(path, buffer, { contentType: image.type, upsert: false })

      if (error) {
        console.error("[scan/upload] storage upload failed:", error.message)
      } else {
        uploadedPaths.push(path)
      }
    }

    stage.current = "extraction"
    const result = await getExtractor().extract(imageInputs)

    stage.current = "profile"
    await saveExtractionResult(user.id, result, "upload", consentGivenAt ?? undefined)
    await markScanCompleted(user.id)

    // retention is best-effort — a tracking failure must not fail the scan
    stage.current = "retention"
    await createScanRetention(user.id, uploadedPaths, "upload").catch((err) => {
      console.error("[scan/upload] retention tracking failed (non-fatal):", err)
    })

    return NextResponse.json({
      ok: true,
      extractionConfidence: result.extractionConfidence,
      warnings: result.warnings,
    }, { status: 201 })
  } catch (e) {
    console.error(`[scan/upload] stage=${stage.current}`, e)
    return apiError(e)
  }
}
