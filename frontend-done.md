---
name: Styli frontend build status
description: What has been built for the Styli Next.js frontend, tech choices, and what comes next
type: project
originSessionId: e409a451-1a8d-48fb-815d-1146d2619edd
---
All 9 UI screens built as frontend-only (no backend). Next.js 16.2.4 + TypeScript + Tailwind CSS 3.

**Visual system**: Noir Luxe — midnight black (#0E0E13), champagne gold (#C8A96E), Cormorant Garamond display + Inter body.

**Built screens**:
- `/` — Marketing landing page
- `/auth` — Sign in / Create account (UI only)
- `/onboarding` — 4-step quiz (gender, height, style, budget)
- `/scan` — Camera scan guidance with BIPA consent flow (mock)
- `/scan/confirm` — Body shape + face shape + Monk skin tone picker + undertone + color season
- `/recommendations` — Feed with sidebar profile, wardrobe gap callout, category filters, explanation chips
- `/wardrobe` — Grid/list toggle, stats ring, category filter, FAB
- `/wardrobe/add` — 3-tab: URL fetch (mock), image upload (mock), manual form
- `/wishlist` — Saved items grid with remove + move-to-wardrobe actions

**Key files**:
- `src/lib/mock-data.ts` — all mock data (MOCK_RECOMMENDATIONS, MOCK_WARDROBE_ITEMS, MONK_TONES, etc.)
- `src/lib/tokens.ts` — design token constants
- `tailwind.config.ts` — full Noir Luxe theme with gold/bg/cream colors + animations
- `src/components/ui/` — GoldButton, DarkCard, ExplanationChip, MonkSwatch, StepIndicator, SkeletonCard, CategoryFilter
- `src/components/layout/` — Navbar, PageWrapper
- `src/components/sections/` — Hero, HowItWorks, Features, Testimonials, CtaBanner, Footer
- `src/components/recommendations/RecommendationCard.tsx`
- `src/components/wardrobe/WardrobeItemCard.tsx`

**Build status**: ✅ Zero TypeScript errors, zero build errors, all 11 routes static. Dev server: http://localhost:3000.

**Note on ESLint**: `eslint-config-next@16.2.4` has a circular JSON bug in its react plugin export — this is a package bug, not a code issue. TypeScript check (`tsc --noEmit`) is the authoritative quality gate here.

**Why**: Agreed to Noir Luxe visual direction and all 9 screens in order.
