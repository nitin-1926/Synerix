# Synerix

One app, two offerings for Indian SMBs:

- **Marketing site + Consulting** — synerix.in: landing, consulting services, free
  Business Health Check (scored email report, leads stored in DB).
- **Synerix Studio** — an AI ad-creative SaaS: brand DNA ingestion, product
  dissection, Indian festival calendar, evidence-grounded creative briefs, and
  photoreal ad creatives with agency typography baked in (EN / Hindi / Hinglish /
  Punjabi).

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 + shadcn (Base UI) ·
Prisma 7 + Supabase Postgres/Storage · Trigger.dev v4 (background pipelines) ·
NextAuth v5 (Google) · Anthropic Claude + Gemini (Nano Banana Pro) + Runware/FAL.

## Develop

```bash
npm install
npx prisma generate
npm run dev                  # web on :3000
npx trigger.dev@v4 dev       # background worker (separate terminal)
```

- Env lives in `.env.local` and must be mirrored to `.env` (the Trigger.dev
  worker reads `.env`). See `.env.local` for the full variable list.
- `DEV_AUTH_BYPASS=1` (dev only) signs you in as a seeded dev user with admin
  access — remove once Google OAuth credentials are configured
  (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, redirect URI
  `<origin>/api/auth/callback/google`).
- `SUPER_ADMIN_EMAIL` gets the `/admin` console (all workspaces, credit grants,
  business-health leads).

## Checks

```bash
npm run build && npm run lint && npm test
```

## Map

| Area | Where |
| --- | --- |
| Marketing site (landing, consulting, studio page, health check) | `src/app/(marketing)/` |
| Studio app (dashboard, studio, library, products, brand, calendar) | `src/app/(app)/` |
| Admin console (super-admin) | `src/app/(app)/admin/` |
| Auth (NextAuth v5 + workspace resolution) | `src/lib/nextauth.ts`, `src/lib/auth.ts` |
| Generation pipeline (briefs, baked typography, QA) | `src/lib/pipeline/`, `src/trigger/generation-run.ts` |
| Brand Creative Intelligence (web-search research) | `src/lib/pipeline/brand-intel.ts` |
| Credits ledger | `src/lib/credits.ts`, `/settings/credits` |
| Legacy website data migration | `scripts/migrate-legacy-pinata.ts` |

`legacy/` holds the pre-merge Pinata website source for reference only — it is
excluded from builds and lint and can be deleted once nothing else is needed
from it.
