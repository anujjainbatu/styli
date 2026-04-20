import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase"
import { requireUser } from "@/services/user.service"
import { getRecommendations } from "@/services/recommendations.service"
import { RecommendationQuerySchema } from "@/types/api"
import { apiError, Errors } from "@/lib/errors"

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) throw Errors.Unauthorized()
    const user = await requireUser(authUser.id)

    const { searchParams } = new URL(req.url)
    const query = RecommendationQuerySchema.parse({
      category: searchParams.get("category") ?? undefined,
      sort:     searchParams.get("sort")     ?? undefined,
      limit:    searchParams.get("limit")    ?? undefined,
    })

    const items = await getRecommendations(user.id, query)
    return NextResponse.json({ items })
  } catch (e) {
    return apiError(e)
  }
}
