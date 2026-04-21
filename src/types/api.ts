import { z } from "zod"
import type { RecommendationItem } from "@/lib/mock-data"

// ─── Onboarding ──────────────────────────────────────────────────────────────

export const OnboardingSchema = z.object({
  genderIdentity: z.string().optional(),
  heightCm: z.number().min(100).max(250).optional(),
  preferredStyles: z.array(z.string()).default([]),
  budgetTier: z.enum(["budget", "mid", "premium", "luxury"]).optional(),
  budgetMinUsd: z.number().int().min(0).optional(),
  budgetMaxUsd: z.number().int().min(0).optional(),
})
export type OnboardingInput = z.infer<typeof OnboardingSchema>

// ─── Scan / Body Profile ─────────────────────────────────────────────────────

export const ScanConfirmSchema = z.object({
  monkTone: z.number().int().min(1).max(10),
  skinUndertone: z.enum(["warm", "cool", "neutral"]),
  bodyShape: z.string().optional(),
  bodyShapeConfidence: z.number().min(0).max(1).optional(),
  faceShape: z.string().optional(),
  faceShapeConfidence: z.number().min(0).max(1).optional(),
  colorSeason: z.string().optional(),
  recommendedSilhouettes: z.array(z.string()).default([]),
  recommendedNecklines: z.array(z.string()).default([]),
  colorPalette: z.array(z.string()).default([]),
  avoidColors: z.array(z.string()).default([]),
  source: z.enum(["camera", "upload", "instagram"]).default("camera"),
  consentGivenAt: z.string().datetime().optional(),
})
export type ScanConfirmInput = z.infer<typeof ScanConfirmSchema>

// ─── Extraction ──────────────────────────────────────────────────────────────

export type ExtractionMethod = "vision_llm" | "manual"

export type ExtractionResult = {
  bodyShape: string | null
  bodyShapeConfidence: number
  faceShape: string | null
  faceShapeConfidence: number
  monkTone: number | null
  skinUndertone: "warm" | "cool" | "neutral" | null
  extractionMethod: ExtractionMethod
  extractionConfidence: number
  warnings: string[]
}

// ─── Instagram ───────────────────────────────────────────────────────────────

export type InstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"

export type InstagramMedia = {
  id: string
  mediaType: InstagramMediaType
  mediaUrl: string
  thumbnailUrl?: string
  timestamp: string
}

export type InstagramMediaResponse = {
  media: InstagramMedia[]
  accountType: string
}

export type InstagramErrorCode = "personal_account" | "token_invalid" | "token_expired" | "api_error"

// ─── Wardrobe ────────────────────────────────────────────────────────────────

export const WardrobeItemCreateSchema = z.object({
  productName: z.string().min(1),
  brand: z.string().optional(),
  category: z.string().min(1),
  primaryColor: z.string().optional(),
  primaryColorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().optional(),
  pattern: z.string().optional(),
  material: z.string().optional(),
  formalityLevel: z.number().int().min(1).max(5).optional(),
  seasonTags: z.array(z.string()).default([]),
  price: z.number().min(0).optional(),
  imageUrl: z.string().url().optional(),
  productUrl: z.string().url().optional(),
  source: z.enum(["url", "image", "manual"]).default("manual"),
})
export type WardrobeItemCreateInput = z.infer<typeof WardrobeItemCreateSchema>

export const WardrobeItemUpdateSchema = WardrobeItemCreateSchema.partial()
export type WardrobeItemUpdateInput = z.infer<typeof WardrobeItemUpdateSchema>

export const WardrobeQuerySchema = z.object({
  category: z.string().optional(),
  sort: z.enum(["recent", "most_worn", "least_worn", "by_color"]).default("recent"),
})
export type WardrobeQuery = z.infer<typeof WardrobeQuerySchema>

// ─── Wishlist ────────────────────────────────────────────────────────────────

export const WishlistAddSchema = z.object({
  productName: z.string().min(1),
  brand: z.string().optional(),
  price: z.number().min(0).optional(),
  imageUrl: z.string().url().optional(),
  category: z.string().optional(),
  matchScore: z.number().min(0).max(1).optional(),
  affiliateUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  primaryColorHex: z.string().optional(),
  explanations: z.array(z.object({ icon: z.string(), text: z.string() })).optional(),
  externalId: z.string().optional(),
})
export type WishlistAddInput = z.infer<typeof WishlistAddSchema>

// ─── Recommendations ─────────────────────────────────────────────────────────

export const RecommendationQuerySchema = z.object({
  category: z.string().optional(),
  sort: z.enum(["best_match", "price_asc", "price_desc", "newest"]).default("best_match"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  intent: z.string().max(200).optional(),
})
export type RecommendationQuery = z.infer<typeof RecommendationQuerySchema>

export type IntentResponse = { keywords: string[] }

export type RecommendationResponse = {
  items: RecommendationItem[]
  fallback: boolean
  fallbackReason?: string
}

// ─── Outfits ─────────────────────────────────────────────────────────────────

export const OutfitGenerateSchema = z.object({
  occasion: z.string().optional(),
  season: z.string().optional(),
  formalityLevel: z.number().int().min(1).max(5).optional(),
})
export type OutfitGenerateInput = z.infer<typeof OutfitGenerateSchema>

// ─── URL Extract ─────────────────────────────────────────────────────────────

export const ExtractUrlSchema = z.object({
  url: z.string().url("Must be a valid product URL"),
})
export type ExtractUrlInput = z.infer<typeof ExtractUrlSchema>

export type ExtractedProduct = {
  name: string | null
  brand: string | null
  price: number | null
  category: string | null
  color: string | null
  colorHex: string | null
  imageUrl: string | null
  productUrl: string
  source: "schema" | "og" | "scrape"
}
