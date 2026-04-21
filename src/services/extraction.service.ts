import Anthropic from "@anthropic-ai/sdk"
import type { ExtractionResult } from "@/types/api"
import { BODY_SHAPES, FACE_SHAPES } from "@/lib/tokens"

// ─── Provider interface ───────────────────────────────────────────────────────
// Swap the implementation for a FastAPI/GPU service by pointing to a different
// ExtractionProvider — all callers stay unchanged.

export interface ExtractionProvider {
  extract(images: ImageInput[]): Promise<ExtractionResult>
}

export type ImageInput = {
  data: Buffer      // raw image bytes
  mediaType: "image/jpeg" | "image/png" | "image/webp"
}

// ─── Claude Vision provider ───────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a personal styling AI assistant with expertise in body shape analysis, face shape classification, and skin tone identification. Analyze the provided photo(s) and call the analyze_style tool with your findings.

Guidelines:
- For body shape: analyze full-body photos for shoulder/hip/waist proportions using FFIT classifications
- For face shape: analyze face/portrait photos for length-to-width ratio, forehead vs jaw width, jaw shape
- For Monk skin tone (1–10): 1–2 very light, 3–4 light, 5–6 medium, 7–8 tan/brown, 9–10 deep; note lighting conditions affect accuracy
- If photo quality, angle, or coverage is insufficient to classify a dimension confidently, return null for that field
- Provide lower confidence scores (< 0.6) when lighting is poor, photo is partial, or the classification is ambiguous
- Always include warnings for any quality issues`

const TOOL_DEF: Anthropic.Tool = {
  name: "analyze_style",
  description: "Record the body shape, face shape, and skin tone analysis from the provided photos",
  input_schema: {
    type: "object" as const,
    properties: {
      bodyShape: {
        type: "string",
        enum: [...BODY_SHAPES],
        description: "FFIT body shape classification from a full-body photo",
      },
      bodyShapeConfidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Confidence score 0–1 for body shape classification",
      },
      faceShape: {
        type: "string",
        enum: [...FACE_SHAPES],
        description: "Face shape classification from a portrait/face photo",
      },
      faceShapeConfidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Confidence score 0–1 for face shape classification",
      },
      monkTone: {
        type: "integer",
        minimum: 1,
        maximum: 10,
        description: "Monk skin tone scale 1–10",
      },
      skinUndertone: {
        type: "string",
        enum: ["warm", "cool", "neutral"],
        description: "Skin undertone classification",
      },
      warnings: {
        type: "array",
        items: { type: "string" },
        description: "Quality issues, lighting caveats, or low-confidence notes",
      },
    },
    required: ["bodyShapeConfidence", "faceShapeConfidence", "warnings"],
  },
}

type ToolInput = {
  bodyShape?: string
  bodyShapeConfidence: number
  faceShape?: string
  faceShapeConfidence: number
  monkTone?: number
  skinUndertone?: "warm" | "cool" | "neutral"
  warnings: string[]
}

class VisionLLMExtractor implements ExtractionProvider {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async extract(images: ImageInput[]): Promise<ExtractionResult> {
    try {
      const imageBlocks: Anthropic.ImageBlockParam[] = images.slice(0, 5).map((img) => ({
        type: "image",
        source: {
          type: "base64",
          media_type: img.mediaType,
          data: img.data.toString("base64"),
        },
      }))

      const response = await this.client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: [TOOL_DEF],
        tool_choice: { type: "tool", name: "analyze_style" },
        messages: [
          {
            role: "user",
            content: [
              ...imageBlocks,
              {
                type: "text",
                text: "Please analyze these photos and call analyze_style with your findings. Classify body shape, face shape, and skin tone. Return null for any dimension you cannot classify confidently from the available photos.",
              },
            ],
          },
        ],
      })

      const toolUse = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      )

      if (!toolUse) {
        return nullResult("vision_llm extraction returned no tool call")
      }

      const input = toolUse.input as ToolInput

      const overallConfidence =
        (input.bodyShapeConfidence + input.faceShapeConfidence) / 2

      return {
        bodyShape: input.bodyShape ?? null,
        bodyShapeConfidence: input.bodyShapeConfidence,
        faceShape: input.faceShape ?? null,
        faceShapeConfidence: input.faceShapeConfidence,
        monkTone: input.monkTone ?? null,
        skinUndertone: input.skinUndertone ?? null,
        extractionMethod: "vision_llm",
        extractionConfidence: overallConfidence,
        warnings: input.warnings,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error("[extraction] API call failed:", message)
      return nullResult(`Extraction unavailable: ${message}`)
    }
  }
}

// ─── Null result (no API key or extraction error) ─────────────────────────────

export function nullResult(warning?: string): ExtractionResult {
  return {
    bodyShape: null,
    bodyShapeConfidence: 0,
    faceShape: null,
    faceShapeConfidence: 0,
    monkTone: null,
    skinUndertone: null,
    extractionMethod: "manual",
    extractionConfidence: 0,
    warnings: warning ? [warning] : [],
  }
}

// ─── Fetch a remote image as a buffer (for Instagram URLs) ───────────────────

export async function fetchImageBuffer(url: string): Promise<ImageInput | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return null
    const contentType = res.headers.get("content-type") ?? "image/jpeg"
    const mediaType = (
      contentType.startsWith("image/png") ? "image/png"
      : contentType.startsWith("image/webp") ? "image/webp"
      : "image/jpeg"
    ) as ImageInput["mediaType"]
    const data = Buffer.from(await res.arrayBuffer())
    return { data, mediaType }
  } catch {
    return null
  }
}

// ─── Singleton extractor ──────────────────────────────────────────────────────

let _extractor: ExtractionProvider | null = null

export function getExtractor(): ExtractionProvider {
  if (_extractor) return _extractor
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Return a no-op extractor that returns null results
    _extractor = { extract: async () => nullResult("ANTHROPIC_API_KEY not configured — set it to enable real extraction") }
    return _extractor
  }
  _extractor = new VisionLLMExtractor(apiKey)
  return _extractor
}
