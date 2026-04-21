# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (localhost:3000)
npm run build        # production build
npx tsc --noEmit     # type-check (authoritative — ESLint is broken, see below)
npm run db:migrate   # prisma migrate dev
npm run db:generate  # regenerate Prisma client after schema changes
npm run db:seed      # seed demo data (requires .env.local)
```

**Always run `npx prisma generate` after any schema change**, then `npx tsc --noEmit` before committing. `eslint-config-next@16.2.4` has a circular JSON bug — do not rely on `npm run lint`.

## Architecture

### Request lifecycle
Every protected API route follows the same three-step pattern:

```
getAuthUser()          → Supabase JWT → supabaseId (UUID from Supabase Auth)
requireUser(supabaseId) → prisma.user lookup → internal User row (CUID)
service(user.id, ...)  → all DB queries use the internal CUID, never supabaseId
```

`requireUser` throws `Errors.Unauthorized()` if the row is missing. All API errors go through `apiError(e)` in `src/lib/errors.ts` which returns `{ error, code }` JSON.

### Service layer
Business logic lives entirely in `src/services/`. Route handlers in `src/app/api/` are thin: validate with Zod → call service → return JSON. Never put Prisma calls directly in route handlers.

Key services and what they own:
- `scan.service.ts` — BodyProfile upsert, mock extraction defaults, `deleteUserScanUploads`
- `instagram.service.ts` — token lifecycle (upsert/refresh/delete), Instagram Graph API calls
- `recommendations.service.ts` — scoring against BodyProfile; currently uses `MOCK_RECOMMENDATIONS` from `src/lib/mock-data.ts`
- `wardrobe.service.ts` — soft-delete pattern (`deletedAt: null` filter on all reads), URL metadata extraction (Schema.org → OG → scrape)
- `outfit.service.ts` — slot-based greedy outfit generation from wardrobe

### Prisma setup (non-standard)
- Client is generated to `src/generated/prisma` (not the default location) — import from `@/generated/prisma/client`
- Uses `PrismaPg` driver adapter (pgBouncer-compatible) — the `adapter` option is required, connection pooling is via `DATABASE_URL`; `DIRECT_URL` is only used by migrations
- `prisma.config.ts` is not present; the generator output path is declared in `prisma/schema.prisma`

### Auth (Supabase + Prisma dual identity)
Supabase handles sessions and JWT. On first sign-up, the frontend calls `upsertUser(supabaseId, email, displayName)` which creates the internal `User` row. The `supabaseId` field is the bridge; never pass Supabase UUIDs to service functions expecting internal IDs.

### Intake flow
Onboarding → `/intake` (3-source hub) → one of:
- `/scan` (camera, mock frame capture)
- `/scan/upload` → `POST /api/scan/upload` (multipart, saves to Supabase Storage then deletes)
- `/api/auth/instagram` → callback → `/scan/instagram` → `POST /api/scan/upload-from-urls`

All three paths converge at `saveBodyProfile(userId, { source, consentGivenAt, ... })` and then redirect to `/scan/confirm`. The confirm page is the user's chance to adjust the seeded/extracted values before they're committed.

**Current state:** All three intake paths write a seeded mock profile (hourglass/oval/monk5/warm). Real CV extraction is not yet implemented.

### Design system
Noir Luxe palette defined in `src/lib/tokens.ts` and mirrored in `tailwind.config.ts`. Use Tailwind classes (`bg-bg-base`, `text-gold`, `text-cream`, `border-border`, etc.) — never hardcode hex values in components. `GoldButton`, `DarkCard`, `MonkSwatch` etc. are in `src/components/ui/`.

### Validation
All API request bodies are validated with Zod v4. Use `.issues` (not `.errors`) when reading parse failures. Schemas and their inferred types live together in `src/types/api.ts`.

### Analytics
`trackEvent()` in `src/lib/posthog.ts` is a no-op when `NEXT_PUBLIC_POSTHOG_KEY` is not set — safe to call unconditionally.

## Environment variables

Required at runtime:
```
DATABASE_URL                  # Neon pooled (pgBouncer)
DIRECT_URL                    # Neon direct (migrations only)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL           # default: http://localhost:3000
```

Optional:
```
INSTAGRAM_CLIENT_ID           # required for Instagram OAuth flow
INSTAGRAM_CLIENT_SECRET
NEXT_PUBLIC_POSTHOG_KEY       # analytics; no-ops if absent
```

`src/lib/env.ts` validates required vars at startup and throws with a descriptive message if any are missing.

## What is still mocked / not yet built

- **CV extraction**: `scan.service.ts` writes a hardcoded seed profile for all three intake paths. Real body/face/skin extraction is not implemented.
- **Affiliate catalog**: `recommendations.service.ts` scores against `MOCK_RECOMMENDATIONS` in `src/lib/mock-data.ts`. No real product catalog or affiliate API.
- **Instagram App Review**: Instagram OAuth is implemented but only works for pre-approved test users until App Review is completed.
- **GDPR user-delete route**: `deleteUserScanUploads` exists in `scan.service.ts` but is not wired to any API endpoint.
- **Supabase RLS**: service role key bypasses all Row Level Security policies.
