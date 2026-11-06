# APX Audit Engine — Integration Guide for APX Solutions

This document provides a step-by-step guide to merging the standalone **APX Audit Engine** into **APX Solutions** (Next.js 14 App Router, tRPC, PostgreSQL + Prisma, BullMQ) without touching unrelated application code.

---

## 1. Module Architecture & Isolation

All domain logic, UI components, metrics calculations, i18n dictionaries, Zod schemas, tRPC procedures, and theme tokens are encapsulated inside `src/modules/audit/`:

```text
src/modules/audit/
├── index.ts                          # Public module barrel exports
├── client/
│   └── trpc.tsx                      # React Query + tRPC client wrapper
├── components/
│   ├── brand/ApxMark.tsx             # Swappable <ApxMark /> SVG component
│   ├── admin/
│   │   ├── AuditAdminAuthGate.tsx    # Admin auth gate
│   │   ├── AuditsDashboard.tsx       # /admin/audits table, analytics drawer, snippets, settings
│   │   └── AuditWizard.tsx           # 8-step wizard with autosave & real-time split preview
│   └── report/
│       ├── AuditReportView.tsx       # 10-section scroll-driven client report (/a/[token])
│       └── ReportCharts.tsx          # Animated SVG score ring, median bar chart, 9-axis radar
├── i18n/
│   ├── ar.json                       # Arabic (RTL, Gulf/Egyptian-friendly copy)
│   ├── en.json                       # English (LTR)
│   └── index.ts                      # Locale & Arabic-Indic / Western numeral helpers
├── metrics/
│   ├── index.ts                      # Pure TypeScript statistical engine + CSV/timestamp parsers
│   └── metrics.test.ts               # Vitest unit test suite
├── schemas/
│   └── index.ts                      # Zod validation schemas & category weight defaults
├── server/
│   ├── auth.ts                       # Auth adapter (`getSessionUser()`)
│   ├── db.ts                         # Prisma singleton + JSON/Blob store adapter
│   ├── demoSeed.ts                   # DEMO seed record (@demo.consultant) & snippet library
│   ├── router.ts                     # `auditRouter` (ready for 1-line merge into `appRouter`)
│   ├── service.ts                    # Domain services, analytics aggregation, hot-lead logic
│   ├── storage.ts                    # Upload storage adapter (Vercel Blob / S3 / local)
│   └── trpc.ts                       # tRPC context & `adminProcedure` / `publicProcedure`
└── theme/
    ├── apxPreset.ts                  # Tailwind preset (`apxPreset`)
    ├── fonts.ts                      # Cormorant Garamond, DM Sans, Cairo via `next/font/google`
    └── tokens.css                    # Scoped `.apx-audit` CSS variables & print stylesheet
```

Thin Next.js App Router wrappers:
- `src/app/admin/audits/layout.tsx`
- `src/app/admin/audits/page.tsx`
- `src/app/admin/audits/[id]/page.tsx`
- `src/app/a/[token]/page.tsx`
- `src/app/api/audit/events/route.ts` (beacon endpoint)
- `src/app/api/audit/upload/route.ts` (screenshot upload endpoint)

---

## 2. Step-by-Step Merge into APX Solutions

### Step 1: Copy the Module & Route Wrappers
Copy the following folders into your APX Solutions repository:
1. `src/modules/audit` → `src/modules/audit`
2. `src/app/admin/audits` → `src/app/admin/audits`
3. `src/app/a/[token]` → `src/app/a/[token]`
4. `src/app/api/audit` → `src/app/api/audit`

### Step 2: Append Prisma Schema Fragment & Run Migration
All Prisma models and enums are prefixed with `Audit` (and mapped to `audit_*` table names) so there are zero naming collisions:
- `AuditProspect` (`audit_prospects`)
- `Audit` (`audits`)
- `AuditReel` (`audit_reels`)
- `AuditProfileCheck` (`audit_profile_checks`)
- `AuditCategoryScore` (`audit_category_scores`)
- `AuditFinding` (`audit_findings`)
- `AuditCompetitor` (`audit_competitors`)
- `AuditCompetitorReel` (`audit_competitor_reels`)
- `AuditUnmeasured` (`audit_unmeasured`)
- `AuditEvent` (`audit_events`)
- `RecommendationSnippet` (`audit_recommendation_snippets`)
- `AuditUpload` (`audit_uploads`)
- `AuditSettings` (`audit_settings`)

Append [`prisma/audit.prisma`](file:///d:/zyadmohamed.com/prisma/audit.prisma) to your main `prisma/schema.prisma` (or place it inside `prisma/schema/audit.prisma` if using Prisma `prismaSchemaFolder`), then run:

```bash
npx prisma migrate dev --name add_apx_audit_engine
npx tsx prisma/seed.ts
```

### Step 3: Merge `auditRouter` into Your Main tRPC `appRouter` (1 Line)
In your APX Solutions root tRPC router (`src/server/api/root.ts` or `src/trpc/router.ts`):

```ts
import { auditRouter } from '@/modules/audit'

export const appRouter = createTRPCRouter({
  // ...existing APX Solutions routers
  audit: auditRouter,
})
```

### Step 4: Swap the Auth Adapter (`getSessionUser`)
Open [`src/modules/audit/server/auth.ts`](file:///d:/zyadmohamed.com/src/modules/audit/server/auth.ts) and replace the body of `getSessionUser()` with your APX Solutions session helper:

```ts
import { getApxSolutionsSession } from '@/server/auth'

export async function getSessionUser(): Promise<AuditSessionUser | null> {
  const session = await getApxSolutionsSession()
  if (!session?.user) return null
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role === 'ADMIN' ? 'ADMIN' : 'CLIENT',
  }
}
```

### Step 5: Add the Tailwind Preset (`apxPreset`)
In your APX Solutions `tailwind.config.ts`, add `apxPreset` to `presets`:

```ts
import { apxPreset } from './src/modules/audit/theme/apxPreset'

export default {
  presets: [apxPreset],
  // ...existing config
}
```
All CSS variables are scoped under `.apx-audit` in [`src/modules/audit/theme/tokens.css`](file:///d:/zyadmohamed.com/src/modules/audit/theme/tokens.css), ensuring zero global CSS side-effects.

### Step 6: Configure Storage Adapter (Optional S3 / R2 Swap)
[`src/modules/audit/server/storage.ts`](file:///d:/zyadmohamed.com/src/modules/audit/server/storage.ts) uses Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set and falls back to local `public/uploads/audit/`. To use AWS S3 or Cloudflare R2 in APX Solutions, update `storageAdapter.upload()` in `src/modules/audit/server/storage.ts`.

---

## 3. Environment Variables

```env
# PostgreSQL Connection (Railway / Neon / Supabase)
DATABASE_URL="postgresql://user:password@host:5432/apx_solutions?sslmode=require"

# Admin Authentication (Standalone Mode)
ADMIN_EMAIL="admin@zyadmohamed.com"
ADMIN_PASSWORD="your-strong-admin-password"
NEXTAUTH_SECRET="your-nextauth-secret"

# Optional Cloud Storage for Insights Screenshot Uploads
BLOB_READ_WRITE_TOKEN=""
```

---

## 4. Verification Commands

```bash
# 1. Run pure TypeScript metrics engine unit tests
npx vitest run

# 2. Typecheck strict TypeScript
npx tsc --noEmit

# 3. Lint & Production Build
npm run lint
npm run build
```
