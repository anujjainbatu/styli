import { NextRequest, NextResponse } from "next/server"
import { purgeExpiredRetentions } from "@/services/scan.service"
import { apiError } from "@/lib/errors"

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-purge-secret")
    const expected = process.env.PURGE_SECRET
    if (expected && secret !== expected) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const purged = await purgeExpiredRetentions()
    return NextResponse.json({ ok: true, purged })
  } catch (e) {
    return apiError(e)
  }
}
