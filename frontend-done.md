---
name: Styli frontend build status
description: What has been built for the Styli Next.js frontend, tech choices, and what comes next
type: project
originSessionId: e409a451-1a8d-48fb-815d-1146d2619edd
---
All 12 UI screens built. Next.js 16.2.4 + TypeScript + Tailwind CSS 3. Screens added since initial build are fully wired to the backend.

**Visual system**: Noir Luxe — midnight black (#0E0E13), champagne gold (#C8A96E), Cormorant Garamond display + Inter body.

**Built screens**:
- `/` — Marketing landing page
- `/auth` — Sign in / Create account (UI only)
- `/onboarding` — 4-step quiz (gender, height, style, budget) → now redirects to `/intake`
- `/intake` — Multi-source intake hub: 3 option cards (camera, upload, Instagram) with effort labels and privacy notes; shows "re-scan" banner if profile exists; fires PostHog analytics
- `/scan` — Camera scan guidance with BIPA consent flow (mock)
- `/scan/confirm` — Body shape + face shape + Monk skin tone picker + undertone + color season; now sends `source: "camera"` and `consentGivenAt` to backend
- `/scan/upload` — Drag-and-drop photo upload (1–5 files, BIPA consent checkbox, file previews, validation); POSTs to `/api/scan/upload`
- `/scan/instagram` — Instagram media grid picker (select 1–5 photos); personal-account error screen with upgrade instructions + fallback buttons; Suspense-wrapped
- `/recommendations` — Feed with sidebar profile, wardrobe gap callout, category filters, explanation chips
- `/wardrobe` — Grid/list toggle, stats ring, category filter, FAB
- `/wardrobe/add` — 3-tab: URL fetch, image upload (mock), manual form
- `/wishlist` — Saved items grid with remove + move-to-wardrobe actions

**Key files**:
- `src/lib/mock-data.ts` — all mock data (MOCK_RECOMMENDATIONS, MOCK_WARDROBE_ITEMS, MONK_TONES, etc.)
- `src/lib/tokens.ts` — design token constants
- `src/lib/posthog.ts` — lightweight PostHog wrapper (no-op when `NEXT_PUBLIC_POSTHOG_KEY` unset)
- `tailwind.config.ts` — full Noir Luxe theme with gold/bg/cream colors + animations
- `src/components/ui/` — GoldButton, DarkCard, ExplanationChip, MonkSwatch, StepIndicator, SkeletonCard, CategoryFilter
- `src/components/layout/` — Navbar, PageWrapper
- `src/components/sections/` — Hero, HowItWorks, Features, Testimonials, CtaBanner, Footer
- `src/components/recommendations/RecommendationCard.tsx`
- `src/components/wardrobe/WardrobeItemCard.tsx`

**Build status**: ✅ Zero TypeScript errors, zero build errors, 27 routes (19 static + 8 dynamic API). Dev server: http://localhost:3000.

**Note on ESLint**: `eslint-config-next@16.2.4` has a circular JSON bug in its react plugin export — this is a package bug, not a code issue. TypeScript check (`tsc --noEmit`) is the authoritative quality gate here.

**Why**: Agreed to Noir Luxe visual direction. Intake hub + upload + Instagram screens added in multi-source intake phase.
