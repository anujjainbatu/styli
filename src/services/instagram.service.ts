import { prisma } from "@/lib/prisma"
import type { InstagramMedia } from "@/types/api"

const GRAPH_BASE = "https://graph.instagram.com"
const TOKEN_REFRESH_THRESHOLD_DAYS = 7

type RawMediaItem = {
  id: string
  media_type: string
  media_url?: string
  thumbnail_url?: string
  timestamp: string
}

export async function upsertToken(
  userId: string,
  accessToken: string,
  expiresInSeconds?: number
) {
  const expiresAt = expiresInSeconds
    ? new Date(Date.now() + expiresInSeconds * 1000)
    : null

  return prisma.instagramToken.upsert({
    where: { userId },
    update: { accessToken, expiresAt, updatedAt: new Date() },
    create: { userId, accessToken, expiresAt },
  })
}

export async function getToken(userId: string) {
  return prisma.instagramToken.findUnique({ where: { userId } })
}

export async function refreshTokenIfNeeded(userId: string): Promise<string | null> {
  const record = await getToken(userId)
  if (!record) return null

  if (record.expiresAt) {
    const daysLeft = (record.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    if (daysLeft > TOKEN_REFRESH_THRESHOLD_DAYS) return record.accessToken
  }

  // Refresh long-lived token (Instagram allows refreshing before expiry)
  try {
    const url = new URL(`${GRAPH_BASE}/refresh_access_token`)
    url.searchParams.set("grant_type", "ig_refresh_token")
    url.searchParams.set("access_token", record.accessToken)

    const res = await fetch(url.toString())
    if (!res.ok) return record.accessToken // return existing if refresh fails gracefully

    const data = await res.json() as { access_token: string; expires_in: number }
    await upsertToken(userId, data.access_token, data.expires_in)
    return data.access_token
  } catch {
    return record.accessToken
  }
}

export async function fetchAccountInfo(accessToken: string): Promise<{ account_type: string }> {
  const url = new URL(`${GRAPH_BASE}/me`)
  url.searchParams.set("fields", "account_type")
  url.searchParams.set("access_token", accessToken)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } }).error?.message ?? "Failed to fetch account info")
  }
  return res.json() as Promise<{ account_type: string }>
}

export async function fetchMedia(
  accessToken: string,
  limit = 20
): Promise<InstagramMedia[]> {
  const url = new URL(`${GRAPH_BASE}/me/media`)
  url.searchParams.set("fields", "id,media_type,media_url,thumbnail_url,timestamp")
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("access_token", accessToken)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } }).error?.message ?? "Failed to fetch media")
  }

  const data = await res.json() as { data: RawMediaItem[] }
  return data.data
    .filter((item) => item.media_type === "IMAGE" || item.media_type === "CAROUSEL_ALBUM")
    .map((item) => ({
      id: item.id,
      mediaType: item.media_type as InstagramMedia["mediaType"],
      mediaUrl: item.media_url ?? "",
      thumbnailUrl: item.thumbnail_url,
      timestamp: item.timestamp,
    }))
}

export async function deleteToken(userId: string) {
  await prisma.instagramToken.deleteMany({ where: { userId } })
}
