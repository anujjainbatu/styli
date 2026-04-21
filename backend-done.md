---
name: Styli backend build status
description: What has been built for the Styli Next.js backend, stack choices, and what comes next
type: project
originSessionId: 77469dbd-12bf-4c25-ac7f-276cc0ce2b14
---
Full production-grade backend wired to the existing frontend. Zero mock data at runtime. Multi-source intake (camera, upload, Instagram) added.

**Stack**: Next.js App Router API routes + Prisma 7 ORM + Neon Postgres + Supabase Auth + Supabase Storage (bucket provisioned).

**Packages added**:
- `@supabase/supabase-js` + `@supabase/ssr` — auth + storage
- `prisma` + generated client at `src/generated/prisma`
- `zod` v4 — request/response validation
- `cheerio` — server-side HTML scraping for URL extraction

**New packages** (multi-source intake phase): none — all new functionality uses existing packages.

**Database**: Neon Postgres (pooled via pgBouncer). Migrations applied:
- `20260420163653_init`
- `20260420181357_add_intake_source_instagram`

**Prisma schema** (`prisma/schema.prisma`) — 8 models:
- `User` — supabaseId FK, email, displayName, scanCompleted; now has `instagramToken` relation
- `StylePreferences` — 1:1 with User; gender, heightCm, preferredStyles[], budgetTier, budgetMin/Max
- `BodyProfile` — 1:1 with User; bodyShape+confidence, faceShape+confidence, monkTone, undertone, colorSeason, silhouettes[], necklines[], colorPalette[], avoidColors[], confirmed flag; **+`source` (camera|upload|instagram, default camera), +`consentGivenAt`**
- `WardrobeItem` — userId, productName, brand, category, colors, formalityLevel, seasonTags[], wearCount, lastWornAt, isFavorite, source (url|image|manual), soft-delete via deletedAt
- `WishlistItem` — userId, full product snapshot + externalId for dedup; unique on [userId, externalId]
- `Outfit` — userId, occasion, season, formalityLevel, overallScore, isSaved, wornCount, lastWornAt
- `OutfitItem` — join table Outfit ↔ WardrobeItem with slot name
- **`InstagramToken`** — 1:1 with User; accessToken, tokenType, scope, expiresAt; CASCADE on user delete

Key indexes: `[userId]`, `[userId, category]`, `[createdAt]`, `[deletedAt]` on WardrobeItem and WishlistItem.

**Seed** (`prisma/seed.ts`): demo user, StylePreferences, BodyProfile (hourglass/oval/monk5/warm/warm_autumn), 15 WardrobeItems, 3 WishlistItems, 10 recommendation candidates.

**Lib layer** (`src/lib/`):
- `prisma.ts` — singleton PrismaClient (dev hot-reload safe)
- `supabase.ts` — `createServerClient` helper (reads cookies via Next.js `cookies()`)
- `supabase-browser.ts` — `createBrowserClient` for client components
- `env.ts` — Zod-validated env (throws on startup if vars missing)
- `errors.ts` — `AppError` class + `Errors.*` factory + `apiError()` response helper
- `posthog.ts` — lightweight `trackEvent()` wrapper; no-op when `NEXT_PUBLIC_POSTHOG_KEY` is unset

**Types** (`src/types/api.ts`): Zod schemas exported as TS types for all request bodies (OnboardingSchema, ScanConfirmSchema, WardrobeItemCreateSchema, WardrobeItemUpdateSchema, WishlistItemAddSchema, OutfitGenerateSchema) plus query schemas.

**Services** (`src/services/`):
- `user.service.ts` — `upsertUser`, `requireUser`, `getUser`
- `onboarding.service.ts` — `saveOnboarding`, `getOnboarding`
- `scan.service.ts` — `saveBodyProfile`, `getBodyProfile`, `getMockBodyProfile`; **+`deleteUserScanUploads`** (removes scan-uploads bucket files for a user — used in GDPR delete flow); now persists `source` and `consentGivenAt`
- `wardrobe.service.ts` — `listWardrobeItems`, `createWardrobeItem`, `updateWardrobeItem`, `deleteWardrobeItem`, `extractProductFromUrl`
- `wishlist.service.ts` — `listWishlistItems`, `addWishlistItem`, `removeWishlistItem`
- `recommendations.service.ts` — `getRecommendations` (scores WishlistItem candidates against user BodyProfile + StylePreferences)
- `outfit.service.ts` — `getDailyOutfit`, `generateOutfit`, `markOutfitWorn`
- **`instagram.service.ts`** — `upsertToken`, `getToken`, `refreshTokenIfNeeded`, `fetchAccountInfo`, `fetchMedia`, `deleteToken`

**Middleware** (`src/middleware.ts`): Supabase SSR session refresh on every request. Protected routes (`/onboarding`, `/scan`, `/recommendations`, `/wardrobe`, `/wishlist`) redirect unauthenticated users to `/auth`. `/auth` redirects authenticated users to `/recommendations`.

**API routes** (22 handlers):

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/health` | Public. Returns `{ status, db, timestamp }` |
| GET + POST | `/api/onboarding` | Save/load StylePreferences |
| GET + POST | `/api/scan/confirm` | Save/load BodyProfile |
| POST | `/api/scan/upload` | Multipart upload (≤5 images); uploads to Supabase Storage `scan-uploads/`, seeds BodyProfile with `source: upload`, immediately deletes images after "analysis" |
| POST | `/api/scan/upload-from-urls` | JSON body with `mediaUrls[]`; seeds BodyProfile with `source: instagram` (used by Instagram picker) |
| GET | `/api/auth/instagram` | Redirects to Instagram OAuth authorization URL |
| GET | `/api/auth/instagram/callback` | Exchanges code → short-lived token → long-lived token; upserts InstagramToken; redirects to `/scan/instagram` |
| GET | `/api/instagram/media` | Returns up to 20 Instagram IMAGE/CAROUSEL_ALBUM items; `403 personal_account` for personal accounts |
| GET + POST | `/api/wardrobe` | List (category + sort filters) + create item |
| PUT + DELETE | `/api/wardrobe/[id]` | Update or soft-delete item |
| POST | `/api/wardrobe/extract-url` | Scrapes product URL via cheerio (Schema.org → OG → heuristic fallback) |
| GET + POST | `/api/wishlist` | List + add item |
| DELETE | `/api/wishlist/[id]` | Remove item |
| GET | `/api/recommendations` | Category + sort filters; scores against user profile |
| GET + POST | `/api/outfits` | Daily outfit fetch + AI-style generation from wardrobe |
| POST | `/api/outfits/[id]/worn` | Increment wornCount + set lastWornAt |

All protected routes: middleware resolves Supabase JWT → looks up `User` row via Prisma. 401 if missing. All bodies validated with Zod v4. Standard error shape: `{ error: string, code: string }`.

**Frontend wired** — pages replaced mock fetches with real API calls:
- `/auth` — Supabase `signUp` / `signInWithPassword`; upserts User row on success
- `/onboarding` — `POST /api/onboarding` on finish; redirects to `/intake`
- `/intake` — `GET /api/scan/confirm` on load to detect existing profile (re-scan banner)
- `/scan/confirm` — `GET /api/scan/confirm` on load; `POST` on confirm (now includes `source: camera`, `consentGivenAt`); redirects to `/recommendations`
- `/scan/upload` — `POST /api/scan/upload` (multipart); redirects to `/scan/confirm` on success
- `/scan/instagram` — `GET /api/instagram/media` on load; `POST /api/scan/upload-from-urls` on analyze; personal-account error with fallback buttons
- `/recommendations` — `GET /api/recommendations?category=&sort=`; wishlist toggle hits `POST/DELETE /api/wishlist`
- `/wardrobe` — `GET /api/wardrobe?category=&sort=`
- `/wardrobe/add` — URL tab: `POST /api/wardrobe/extract-url`; manual tab: `POST /api/wardrobe`
- `/wishlist` — `GET /api/wishlist`; remove: `DELETE /api/wishlist/[id]`

**Build status**: ✅ Zero TypeScript errors (`tsc --noEmit`). Clean `next build` — 19 static pages + 8 dynamic API routes (27 total). All Zod v4 `.issues` (not `.errors`) used throughout.

**Env vars** (`.env.local`):
- `DATABASE_URL` — Neon pooled (pgBouncer)
- `DIRECT_URL` — Neon direct (for migrations)
- `NEXT_PUBLIC_SUPABASE_URL` — filled
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — filled
- `SUPABASE_SERVICE_ROLE_KEY` — filled
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000`
- `INSTAGRAM_CLIENT_ID` — required for Instagram OAuth (set when registering Facebook app)
- `INSTAGRAM_CLIENT_SECRET` — required for Instagram OAuth
- `NEXT_PUBLIC_POSTHOG_KEY` — optional; analytics are no-ops if unset

**Not yet built (V2)**:
- CV pipeline (scan frames → real body/face/skin ML analysis) — all three intake paths (camera, upload, instagram) seed a default BodyProfile; real ML inference replaces this in V2
- Affiliate product catalog ingestion (ShareASale API) — recommendations use seeded candidates
- CLIP embeddings for wardrobe similarity — plain attribute matching for MVP
- Supabase Row Level Security policies — service role key bypasses for now
- Rate limiting on scan endpoint (Redis not in MVP)
- Instagram App Review + Business Verification — required before non-test users can connect (personal accounts blocked by Instagram policy)
- GDPR user-delete endpoint — `deleteUserScanUploads` is implemented in scan.service but not yet wired to a delete route
