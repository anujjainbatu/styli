import { prisma } from "@/lib/prisma"
import { Errors } from "@/lib/errors"

export async function upsertUser(supabaseId: string, email: string, displayName: string) {
  return prisma.user.upsert({
    where: { supabaseId },
    update: { email, displayName, updatedAt: new Date() },
    create: { supabaseId, email, displayName },
  })
}

export async function getUserBySupabaseId(supabaseId: string) {
  return prisma.user.findUnique({ where: { supabaseId } })
}

export async function requireUser(supabaseId: string) {
  const user = await getUserBySupabaseId(supabaseId)
  if (!user) throw Errors.Unauthorized()
  return user
}

export async function markScanCompleted(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { scanCompleted: true, updatedAt: new Date() },
  })
}
