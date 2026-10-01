# Moving the database to `Synerix Prod` (ap-south-1 / Mumbai)

| | old | new |
|---|---|---|
| name | Synerix Studio | **Synerix Prod** |
| ref | `updubmdjbaeehhkgcxnf` | `cvryhmquxenhciqdyeap` |
| region | ap-northeast-1 (Tokyo) | **ap-south-1 (Mumbai)** |
| API URL | — | `https://cvryhmquxenhciqdyeap.supabase.co` |

## What actually has to move

Only the **database**. Object storage already moved off Supabase to Cloudflare R2
(bucket `synerix-studio`), which both projects' app code reads from; there is
nothing to copy between Supabase projects.

- **No Supabase Auth users.** Login is NextAuth + Prisma; `auth.users` is empty.
- **No custom extensions, edge functions, or `pg_cron` jobs.** Only Supabase defaults.
- **Database is ~3 MB / ~1000 rows**, and every workspace is dev/test/demo — no customer data.

## Steps

Point `.env.local` at the NEW project first. Supabase is Postgres-only now, so
these two are the only Supabase values the app reads:

```
DATABASE_URL=postgresql://...@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://...@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```

`DATABASE_URL` is the pooler (runtime), `DIRECT_URL` is the direct connection (migrations) — see `prisma.config.ts`.

### 1. Schema

```bash
npx prisma migrate deploy
```

Run this and **not** any hand-applied SQL: applying the schema out-of-band leaves `_prisma_migrations` empty, and the next `migrate deploy` then fails with `P3005 database schema is not empty`.

The migrations enable RLS (deny-all, zero policies) on every `public` table, `_prisma_migrations` included, so nothing is readable over the Data API with the anon key.

### 2. Reference data

```bash
npx tsx prisma/seed.ts          # 45 festivals + 135 occurrences, from src/data/festivals/festivals.json
```

### 3. Model presets — copy the rows, not the images

`prisma/seed-models.ts` regenerates the 12 presets through the image API: it costs money and produces **different faces**. Copy the rows; their `storageKey`s already point at `models/presets/` in R2:

```bash
pg_dump "<OLD DIRECT_URL>" --data-only --table=ai_models | psql "<NEW DIRECT_URL>"
```

### 4. Super-admin + launch workspaces

Sign in with Google as `SUPER_ADMIN_EMAIL` — `requireAuth()` bootstraps the super-admin workspace on first login. Create launch workspaces from the admin console (`/admin`, which calls `adminCreateWorkspace`).

### 5. Vercel + Trigger.dev

Update `DATABASE_URL` / `DIRECT_URL` in the Vercel project and redeploy the Trigger.dev worker, then flip the region (see below).

## Why `vercel.json` pins `hnd1`

`hnd1` = Tokyo, chosen to sit **next to the database, not next to the user**. Every page makes 6–11 sequential queries, so co-locating with the database wins: N × ~1 ms beats N × ~90 ms, even though a user in India then pays ~120 ms once for the HTML. Hobby allows exactly one region.

**When the database moves to Mumbai, change it to `bom1`** — with the database local, Mumbai wins both legs (function-to-database and user-to-function):

```json
"regions": ["bom1"]
```

Trigger.dev has no Asian region (US East / US West / EU only), so its workers stay remote from the database regardless. That is fine: they are long-running jobs where a one-off ~120 ms round trip is noise.

This rationale lives here rather than in `vercel.json` because that file is validated against a strict schema that rejects unknown keys — a `"//"` comment block in it fails every deploy with "should NOT have additional property".

## If you want the test data too

The recommendation is not to take it. If you do:

```bash
pg_dump "<OLD DIRECT_URL>" --data-only --disable-triggers \
  --exclude-table=_prisma_migrations | psql "<NEW DIRECT_URL>"
```

No storage step: every key in those rows (including the re-keyed creative render prefixes) already resolves in R2. Do **not** re-run a Supabase→R2 copy against this data — its render keys are already in the new layout, so a copier would find no mapping and write duplicate, unreferenced objects.

## Verify

```sql
-- every public table has RLS on (deny-all over the Data API)
select relname from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
-- expect: 0 rows
```

Then `mcp__supabase__get_advisors` (security + performance) on the new project.

## Rollback: what Supabase Storage is and is not

Supabase Storage on the old project still holds every object from **before** the R2 cutover, under the **old** keys. It is a byte backup, not a rollback target:

- The cutover re-keyed `CreativeRender` / `CreativeVersion.composedImageKey` from `creatives/{id}/renders/…` to `{workspace}/{user}/{secs}-{id8}/…` and saved no reverse map. Old code pointed back at Supabase would 404 on every re-keyed render.
- Everything rendered after the cutover exists only in R2.

So a storage rollback means restoring those two columns from a pre-cutover database backup (PITR) **and** copying post-cutover objects back. Keep the old project paused-but-alive until the new setup has served real traffic for a couple of weeks; the Free plan allows 2 projects.
