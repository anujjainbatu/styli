import { prisma } from "@/lib/prisma"
import type { ScanConfirmInput } from "@/types/api"
import { COLOR_SEASONS } from "@/lib/tokens"

const SEASON_PALETTES: Record<string, string[]> = {
  warm_autumn: ["#8B4513", "#D2691E", "#CD853F", "#A0522D", "#6B4226", "#C17F24", "#B5651D", "#8B6914"],
  deep_winter: ["#191970", "#000080", "#003153", "#002366", "#00008B", "#1C1C8C", "#0000CD", "#4169E1"],
  bright_spring: ["#FF6B35", "#F7C59F", "#EFEFD0", "#004E89", "#1A936F", "#E8871E", "#F9DC5C", "#C9EDDC"],
  cool_summer: ["#B0C4DE", "#778899", "#708090", "#C0C0C0", "#A9A9A9", "#D8BFD8", "#DDA0DD", "#EE82EE"],
}

const SEASON_FOR_COMBO: Record<string, string> = {
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

const SILHOUETTES_BY_BODY: Record<string, string[]> = {
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

const NECKLINES_BY_FACE: Record<string, string[]> = {
  oval: ["V-neck", "Scoop", "Sweetheart"],
  round: ["V-neck", "Deep V", "Square neck"],
  square: ["Round neck", "Scoop", "Sweetheart", "Cowl"],
  heart: ["Cowl", "Boat neck", "Scoop"],
  oblong: ["Boat neck", "Square neck", "Off-shoulder"],
  diamond: ["Sweetheart", "Off-shoulder", "Cowl"],
  triangle: ["Off-shoulder", "Boat neck", "Square neck"],
}

export async function getMockBodyProfile() {
  return {
    bodyShape: "hourglass",
    bodyShapeConfidence: 0.88,
    faceShape: "oval",
    faceShapeConfidence: 0.92,
    monkTone: 5,
    skinUndertone: "warm",
    colorSeason: "warm_autumn",
    skinToneConfirmed: false,
    recommendedSilhouettes: SILHOUETTES_BY_BODY["hourglass"],
    recommendedNecklines: NECKLINES_BY_FACE["oval"],
    colorPalette: SEASON_PALETTES["warm_autumn"],
    avoidColors: ["#87CEEB", "#ADD8E6", "#90EE90"],
  }
}

export async function getBodyProfile(userId: string) {
  const profile = await prisma.bodyProfile.findUnique({ where: { userId } })
  if (!profile) return getMockBodyProfile()
  return profile
}

export async function saveBodyProfile(userId: string, input: ScanConfirmInput) {
  const colorSeason =
    input.colorSeason ??
    SEASON_FOR_COMBO[`${input.monkTone}_${input.skinUndertone}`] ??
    "warm_autumn"

  const bodyShape = input.bodyShape ?? "hourglass"
  const faceShape = input.faceShape ?? "oval"

  const colorPalette =
    input.colorPalette.length > 0 ? input.colorPalette : (SEASON_PALETTES[colorSeason] ?? [])
  const silhouettes =
    input.recommendedSilhouettes.length > 0
      ? input.recommendedSilhouettes
      : (SILHOUETTES_BY_BODY[bodyShape] ?? [])
  const necklines =
    input.recommendedNecklines.length > 0
      ? input.recommendedNecklines
      : (NECKLINES_BY_FACE[faceShape] ?? [])

  return prisma.bodyProfile.upsert({
    where: { userId },
    update: {
      monkTone: input.monkTone,
      skinUndertone: input.skinUndertone,
      colorSeason,
      skinToneConfirmed: true,
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
