import { prisma } from "@/lib/prisma"
import type { ScanConfirmInput, ExtractionResult } from "@/types/api"

export const SEASON_PALETTES: Record<string, string[]> = {
  warm_autumn: ["#8B4513", "#D2691E", "#CD853F", "#A0522D", "#6B4226", "#C17F24", "#B5651D", "#8B6914"],
  deep_winter: ["#191970", "#000080", "#003153", "#002366", "#00008B", "#1C1C8C", "#0000CD", "#4169E1"],
  bright_spring: ["#FF6B35", "#F7C59F", "#EFEFD0", "#004E89", "#1A936F", "#E8871E", "#F9DC5C", "#C9EDDC"],
  cool_summer: ["#B0C4DE", "#778899", "#708090", "#C0C0C0", "#A9A9A9", "#D8BFD8", "#DDA0DD", "#EE82EE"],
}

export const SEASON_FOR_COMBO: Record<string, string> = {
  "1_warm": "bright_spring", "1_cool": "cool_summer", "1_neutral": "bright_spring",
  "2_warm": "bright_spring", "2_cool": "cool_summer", "2_neutral": "bright_spring",
  "3_warm": "bright_spring", "3_cool": "cool_summer", "3_neutral": "cool_summer",
  "4_warm": "bright_spring", "4_cool": "cool_summer", "4_neutral": "cool_summer",
  "5_warm": "warm_autumn",   "5_cool": "cool_summer", "5_neutral": "warm_autumn",
  "6_warm": "warm_autumn",   "6_cool": "cool_summer", "6_neutral": "warm_autumn",
  "7_warm": "warm_autumn",   "7_cool": "deep_winter", "7_neutral": "warm_autumn",
  "8_warm": "warm_autumn",   "8_cool": "deep_winter", "8_neutral": "deep_winter",
  "9_warm": "warm_autumn",   "9_cool": "deep_winter", "9_neutral": "deep_winter",
  "10_warm": "warm_autumn",  "10_cool": "deep_winter","10_neutral": "deep_winter",
}

export const SILHOUETTES_BY_BODY: Record<string, string[]> = {
  hourglass: ["A-line", "Wrap", "Fit-and-flare", "Belted"],
  pear: ["A-line", "Empire waist", "Wrap", "Dark bottoms"],
  apple: ["Empire waist", "A-line", "V-neck tops", "Straight leg"],
  rectangle: ["Peplum", "Belted", "Ruffles", "Wrap"],
  inverted_triangle: ["Wide-leg trousers", "A-line skirts", "Boat neck", "Off-shoulder"],
  athletic: ["Wrap", "Peplum", "Fit-and-flare", "High waist"],
  oval: ["Empire waist", "Straight", "A-line", "Dark solids"],
  diamond: ["A-line", "Boat neck", "Straight leg", "Empire waist"],
  spoon: ["A-line", "Wrap", "Empire waist", "Dark bottoms"],
}

export const NECKLINES_BY_FACE: Record<string, string[]> = {
  oval: ["V-neck", "Scoop", "Sweetheart"],
  round: ["V-neck", "Deep V", "Square neck"],
  square: ["Round neck", "Scoop", "Sweetheart", "Cowl"],
  heart: ["Cowl", "Boat neck", "Scoop"],
  oblong: ["Boat neck", "Square neck", "Off-shoulder"],
  diamond: ["Sweetheart", "Off-shoulder", "Cowl"],
  triangle: ["Off-shoulder", "Boat neck", "Square neck"],
}

// Returns null when no profile exists — callers handle explicitly.
export async function getBodyProfile(userId: string) {
  return prisma.bodyProfile.findUnique({ where: { userId } })
}

// ─── Save extraction result (unconfirmed) ────────────────────────────────────
// Called by camera/upload/instagram routes after running extraction.
// skinToneConfirmed = false so the confirm page prompts review.

export async function saveExtractionResult(
  userId: string,
  result: ExtractionResult,
  source: "camera" | "upload" | "instagram",
  consentGivenAt?: string
) {
  const bodyShape = result.bodyShape
  const faceShape = result.faceShape

  const colorPalette = (() => {
    if (!result.monkTone || !result.skinUndertone) return []
    const season = SEASON_FOR_COMBO[`${result.monkTone}_${result.skinUndertone}`]
    return SEASON_PALETTES[season] ?? []
  })()

  const colorSeason = (() => {
    if (!result.monkTone || !result.skinUndertone) return null
    return SEASON_FOR_COMBO[`${result.monkTone}_${result.skinUndertone}`] ?? null
  })()

  return prisma.bodyProfile.upsert({
    where: { userId },
    update: {
      bodyShape,
      bodyShapeConfidence: result.bodyShapeConfidence,
      faceShape,
      faceShapeConfidence: result.faceShapeConfidence,
      monkTone: result.monkTone,
      skinUndertone: result.skinUndertone,
      colorSeason,
      colorPalette,
      recommendedSilhouettes: bodyShape ? (SILHOUETTES_BY_BODY[bodyShape] ?? []) : [],
      recommendedNecklines: faceShape ? (NECKLINES_BY_FACE[faceShape] ?? []) : [],
      avoidColors: [],
      skinToneConfirmed: false,
      source,
      consentGivenAt: consentGivenAt ? new Date(consentGivenAt) : new Date(),
      extractionMethod: result.extractionMethod,
      extractionConfidence: result.extractionConfidence,
      extractionWarnings: result.warnings,
      updatedAt: new Date(),
    },
    create: {
      userId,
      bodyShape,
      bodyShapeConfidence: result.bodyShapeConfidence,
      faceShape,
      faceShapeConfidence: result.faceShapeConfidence,
      monkTone: result.monkTone,
      skinUndertone: result.skinUndertone,
      colorSeason,
      colorPalette,
      recommendedSilhouettes: bodyShape ? (SILHOUETTES_BY_BODY[bodyShape] ?? []) : [],
      recommendedNecklines: faceShape ? (NECKLINES_BY_FACE[faceShape] ?? []) : [],
      avoidColors: [],
      skinToneConfirmed: false,
      source,
      consentGivenAt: consentGivenAt ? new Date(consentGivenAt) : new Date(),
      extractionMethod: result.extractionMethod,
      extractionConfidence: result.extractionConfidence,
      extractionWarnings: result.warnings,
    },
  })
}

// ─── Save confirmed profile (from /scan/confirm POST) ───────────────────────
// User has reviewed and corrected the extracted values.

export async function saveBodyProfile(userId: string, input: ScanConfirmInput) {
  const colorSeason =
    input.colorSeason ??
    SEASON_FOR_COMBO[`${input.monkTone}_${input.skinUndertone}`] ??
    "warm_autumn"

  const bodyShape = input.bodyShape ?? null
  const faceShape = input.faceShape ?? null

  const colorPalette =
    input.colorPalette.length > 0 ? input.colorPalette : (SEASON_PALETTES[colorSeason] ?? [])
  const silhouettes =
    input.recommendedSilhouettes.length > 0
      ? input.recommendedSilhouettes
      : (bodyShape ? (SILHOUETTES_BY_BODY[bodyShape] ?? []) : [])
  const necklines =
    input.recommendedNecklines.length > 0
      ? input.recommendedNecklines
      : (faceShape ? (NECKLINES_BY_FACE[faceShape] ?? []) : [])

  const consentGivenAt = input.consentGivenAt ? new Date(input.consentGivenAt) : new Date()

  return prisma.bodyProfile.upsert({
    where: { userId },
    update: {
      monkTone: input.monkTone,
      skinUndertone: input.skinUndertone,
      colorSeason,
      skinToneConfirmed: true,
      source: input.source ?? "camera",
      consentGivenAt,
      bodyShape,
      bodyShapeConfidence: input.bodyShapeConfidence,
      faceShape,
      faceShapeConfidence: input.faceShapeConfidence,
      recommendedSilhouettes: silhouettes,
      recommendedNecklines: necklines,
      colorPalette,
      avoidColors: input.avoidColors,
      updatedAt: new Date(),
    },
    create: {
      userId,
      monkTone: input.monkTone,
      skinUndertone: input.skinUndertone,
      colorSeason,
      skinToneConfirmed: true,
      source: input.source ?? "camera",
      consentGivenAt,
      bodyShape,
      bodyShapeConfidence: input.bodyShapeConfidence,
      faceShape,
      faceShapeConfidence: input.faceShapeConfidence,
      recommendedSilhouettes: silhouettes,
      recommendedNecklines: necklines,
      colorPalette,
      avoidColors: input.avoidColors,
    },
  })
}

// ─── 7-day retention tracking ────────────────────────────────────────────────

const RETENTION_DAYS = 7

export async function createScanRetention(
  userId: string,
  storagePaths: string[],
  source: "camera" | "upload" | "instagram"
) {
  if (storagePaths.length === 0) return null
  const purgeBefore = new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000)
  return prisma.scanRetention.create({
    data: { userId, storagePaths, source, purgeBefore },
  })
}

export async function purgeExpiredRetentions() {
  const { createSupabaseAdminClient } = await import("@/lib/supabase")
  const adminClient = createSupabaseAdminClient()

  const expired = await prisma.scanRetention.findMany({
    where: { purgeBefore: { lte: new Date() }, purgedAt: null },
  })

  for (const record of expired) {
    if (record.storagePaths.length > 0) {
      await adminClient.storage.from("scan-uploads").remove(record.storagePaths)
    }
    await prisma.scanRetention.update({
      where: { id: record.id },
      data: { purgedAt: new Date() },
    })
  }

  return expired.length
}

// ─── GDPR: delete all scan assets for a user ─────────────────────────────────

export async function deleteUserScanUploads(userId: string) {
  const { createSupabaseAdminClient } = await import("@/lib/supabase")
  const adminClient = createSupabaseAdminClient()

  // Purge any still-retained scan files
  const retentions = await prisma.scanRetention.findMany({
    where: { userId, purgedAt: null },
  })
  const allPaths = retentions.flatMap((r) => r.storagePaths)
  if (allPaths.length > 0) {
    await adminClient.storage.from("scan-uploads").remove(allPaths)
  }

  // Also sweep the user folder directly
  const { data: files } = await adminClient.storage.from("scan-uploads").list(userId)
  if (files && files.length > 0) {
    const paths = files.map((f) => `${userId}/${f.name}`)
    await adminClient.storage.from("scan-uploads").remove(paths)
  }
}
