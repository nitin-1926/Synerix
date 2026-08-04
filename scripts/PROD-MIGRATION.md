# Moving to `Synerix Prod` (ap-south-1 / Mumbai)

| | old | new |
|---|---|---|
| name | Synerix Studio | **Synerix Prod** |
| ref | `updubmdjbaeehhkgcxnf` | `cvryhmquxenhciqdyeap` |
| region | ap-northeast-1 (Tokyo) | **ap-south-1 (Mumbai)** |
| API URL | — | `https://cvryhmquxenhciqdyeap.supabase.co` |

## What actually has to move

The audit found far less than "everything":

- **No Supabase Auth users.** Login is NextAuth + Prisma; `auth.users` is empty. Nothing to migrate.
- **No custom extensions, edge functions, or `pg_cron` jobs.** Only Supabase defaults are installed.
- **Database is ~3 MB / ~1000 rows**, and every one of the 8 workspaces is dev/test/demo — no customer data.
- **Storage is 440 MB / 364 objects**, of which the only irreplaceable-and-cheap piece is `models/presets/` (11 objects, ~11 MB).

So the move is: schema → bucket → reference data → (optionally) storage.

## Steps

Everything below needs credentials, so it runs from your machine. Point `.env.local` at the NEW project first:

```
DATABASE_URL=postgresql://...@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://...@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://cvryhmquxenhciqdyeap.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<new project's service role key>
```

`DATABASE_URL` is the pooler (runtime), `DIRECT_URL` is the direct connection (migrations) — see `prisma.config.ts`.

### 1. Schema

```bash
npx prisma migrate deploy
```

Run this and **not** any hand-applied SQL: applying the schema out-of-band leaves `_prisma_migrations` empty, and the next `migrate deploy` then fails with `P3005 database schema is not empty`.

This now includes `20260726180000_enable_rls_remaining`, which locks the 8 tables the original RLS migration never covered (`accounts`, `sessions`, `verification_tokens`, `workspace_invites`, `ai_models`, `api_cost_log`, `tests`, `test_results`). On the Tokyo project those are enabled by something outside the migration history — a fresh project would have come up with OAuth tokens readable through the Data API.

### 2. Storage bucket

```bash
npx tsx scripts/setup-storage.ts
```

**Storage no longer lives in Supabase.** As of the R2 migration this creates the private `synerix-studio` bucket on Cloudflare R2, not a Supabase bucket — so the new Supabase project needs no storage setup at all and Supabase is Postgres-only. Reads are still short-lived presigned URLs; the bucket is never public. See `scripts/migrate-storage-to-r2.ts`.

### 3. Reference data

```bash
npx tsx prisma/seed.ts          # 45 festivals + 135 occurrences, from src/data/festivals/festivals.json
```

### 4. Model presets — copy, don't re-seed

`prisma/seed-models.ts` regenerates the 12 presets through the image API: it costs money and produces **different faces**. Copy the existing rows and images instead:

```bash
# rows
pg_dump "<OLD DIRECT_URL>" --data-only --table=ai_models | psql "<NEW DIRECT_URL>"

# images — moved to R2 by the storage migration, not copied between Supabase projects
SRC_SUPABASE_URL=https://updubmdjbaeehhkgcxnf.supabase.co \
SRC_SERVICE_ROLE_KEY=<old service role key> \
npx tsx scripts/migrate-storage-to-r2.ts --apply
```

### 5. Super-admin + launch workspaces

Sign in with Google as `SUPER_ADMIN_EMAIL` — `requireAuth()` bootstraps the super-admin workspace on first login. Then:

```bash
npx tsx scripts/setup-launch-workspaces.ts          # dry run
npx tsx scripts/setup-launch-workspaces.ts --apply
```

## Why `vercel.json` pins `hnd1`

`hnd1` = Tokyo, chosen to sit **next to the database, not next to the user**. Supabase Postgres is in `aws-1-ap-northeast-1` and every page makes 6–11 sequential queries, so co-locating with the database wins: N × ~1 ms beats N × ~90 ms, even though a user in India then pays ~120 ms once for the HTML. Hobby allows exactly one region, which is all this needs.

**When the database moves to Mumbai (`ap-south-1`), change this to `bom1`** — with the database local, the only latency left is user-to-function, and Mumbai wins both legs.

This rationale lives here rather than in `vercel.json` because that file is validated against a strict schema that rejects unknown keys — a `"//"` comment block in it fails every deploy with "should NOT have additional property".

### 6. Vercel

Update the same four env vars in the Vercel project, then flip the region:

```json
"regions": ["bom1"]
```

`vercel.json` currently pins `hnd1` (Tokyo) to sit next to the old database. With the database in Mumbai, `bom1` wins both legs — function-to-database *and* user-to-function. Redeploy after changing it.

Trigger.dev has no Asian region (US East / US West / EU only), so its workers stay remote from the database regardless. That is fine: they are long-running jobs where a one-off ~120 ms round trip is noise, unlike page renders that make 6–11 sequential queries.

## If you want the test data too

The recommendation is not to take it — see below. If you do:

```bash
pg_dump "<OLD DIRECT_URL>" --data-only --disable-triggers \
  --exclude-table=_prisma_migrations | psql "<NEW DIRECT_URL>"

SRC_SUPABASE_URL=... SRC_SERVICE_ROLE_KEY=... \
npx tsx scripts/migrate-storage-to-r2.ts --apply
```

Note `runs/*/plates/` (97 objects, 112 MB) is **not** scratch — the editor re-composites from `masterPlateKey` on every edit, so a creative whose plate is missing silently loses all editing. Only `runs/*/iterations/` (24 objects, 44 MB) is safe to leave behind.

## Verify

```sql
-- every public table has RLS on and zero policies (deny-all over the Data API)
select relname, relrowsecurity from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
-- expect: 0 rows
```

Then `mcp__supabase__get_advisors` (security + performance) on the new project, and confirm the `media` bucket shows `public = false`.

## Don't delete the old project yet

Keep `Synerix Studio` paused-but-alive until the new one has served real traffic for a couple of weeks. Free plan allows 2 projects, so it costs nothing to keep the rollback.
