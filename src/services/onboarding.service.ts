import { prisma } from "@/lib/prisma"
import type { OnboardingInput } from "@/types/api"
import { BUDGET_TIERS } from "@/lib/mock-data"

const BUDGET_RANGES: Record<string, { min: number; max: number }> = {
  budget: { min: 0, max: 50 },
  mid: { min: 50, max: 150 },
  premium: { min: 150, max: 500 },
  luxury: { min: 500, max: 10000 },
}

export async function saveOnboarding(userId: string, input: OnboardingInput) {
  const budgetRange = input.budgetTier ? BUDGET_RANGES[input.budgetTier] : undefined
  return prisma.stylePreferences.upsert({
    where: { userId },
    update: {
      genderIdentity: input.genderIdentity,
      heightCm: input.heightCm,
      preferredStyles: input.preferredStyles,
      budgetTier: input.budgetTier,
      budgetMinUsd: input.budgetMinUsd ?? budgetRange?.min,
      budgetMaxUsd: input.budgetMaxUsd ?? budgetRange?.max,
      updatedAt: new Date(),
    },
    create: {
      userId,
      genderIdentity: input.genderIdentity,
      heightCm: input.heightCm,
      preferredStyles: input.preferredStyles,
      budgetTier: input.budgetTier,
      budgetMinUsd: input.budgetMinUsd ?? budgetRange?.min,
      budgetMaxUsd: input.budgetMaxUsd ?? budgetRange?.max,
    },
  })
}

export async function getOnboarding(userId: string) {
  return prisma.stylePreferences.findUnique({ where: { userId } })
}
