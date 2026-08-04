# DEVLOG — Synerix (Pinata)

> A running, append-only log of every substantive bug fix, feature, refactor, build/CI change, and decision that shapes this project. Written *during* the session that made the change so that future blog posts, LLM-mistake pattern analysis, or context-restoration reads can reconstruct the journey without spelunking through git history.

This file may be **local-only and gitignored** (maintainer journal) or **committed** (team-visible decision log) — check `.gitignore` to see which mode this project uses.

---

## Problem statement

Synerix Studio: an AI creative studio for Indian SMBs — brands add their products, pick a festival/occasion (or a custom brief), and the pipeline reasons product → occasion-fit → distinct creative directions (Claude concepting), builds a bespoke image prompt per concept, renders wordless scene plates (image models), and composites deterministic text/logo overlays (canvas, correct Devanagari/Gurmukhi) into finished ad creatives — cost-optimised via a credit ledger and per-call API cost logging. The same repo serves the Synerix consulting marketing site and Business Health Check lead-gen quiz.

---

## Baseline (state before this log begins)

- Full app already built (uncommitted at log start): Next.js 16 App Router, Prisma 7 + Supabase (DB/storage), NextAuth v5 Google-only, Trigger.dev v4 tasks (brand-ingest, brand-research, product-dissect, generate-model, generation-run), canvas compositor with scored layout templates, credit ledger with refunds, ApiCostLog + /admin/costs.
- Domain model documented in CONTEXT.md; product spec in docs/product-spec.md; old Pinata site ported into (marketing) group, original in legacy/ (deleted 2026-07-02).
- Out of scope for v1: video generation (seedance), client share links, automated QA critic loop (human review gates quality), self-serve credit top-up.

---

## Entry template

Every new entry follows this skeleton. Keep it compact — the goal is fast scan, not novel-length prose. Link out instead of restating.

```markdown
### YYYY-MM-DD — <one-line title naming the artifact + change>

- Type: bug | feature | refactor | build | docs | chore
- Scope: <files / packages / commands affected>

Reasoning / RCA / research:
    <1-6 bullets. For bugs: what broke, root cause, why the obvious fix
    was wrong. For features: why it matters, what alternatives were
    considered and rejected. For refactors: what changed in shape
    without changing behavior, and what motivated the reshape.>

Implementation summary:
    <1-6 bullets. What code moved, what files were added/deleted, what
    tests landed, what verification ran.>

Follow-ups deferred:
    <Optional. Known unfinished work — anything you intentionally
    decided NOT to do in this change, with the reason.>
```

### Style rules

- **Capture *why*, not *what*.** The diff already shows what. The journal earns its keep by recording decisions.
- **Name files affected** so a future grep finds the entry from a path.
- **State tradeoffs explicitly:** "considered X but Y because Z." A rejected option is more valuable than the chosen one when read six months later.
- **Note failed approaches.** If you tried fix A and it didn't work before fix B did, both belong — the dead-end teaches.
- **Each bullet ≤2 sentences.** If you need more, link to a longer doc and summarize.
- **Don't paraphrase the diff.** "Renamed `foo` to `bar`" is useless; "renamed `foo` to `bar` because `foo` collided with the new public API for the upgrade path" is the entry.

### Anti-patterns

- **Don't batch unrelated changes** into one entry. One logical change per entry.
- **Don't write entries days later.** Context decays in hours. The skill exists because the LLM forgets — write while it remembers.
- **Don't edit past entries.** Correct factual errors with a *new* entry that references the old one. The chronology is the point.
- **Don't omit the boring-looking changes.** Build/CI/docs changes shape the project's behavior over time and surface in pattern analysis.

New entries go at the **top** of the Log section (reverse chronological).

---

## Log

### 2026-08-04 — Brand-research refresh becomes a paid, user-triggered action; Sentry removed

- Type: feature
- Scope: src/app/actions/brand.ts, src/app/(app)/brand/{page.tsx,refresh-intel.tsx}, src/lib/ai/models.ts, src/app/(app)/settings/credits/page.tsx, prisma/schema.prisma + migrations/20260804090000_credit_reason_brand_intel/, trigger.config.ts, src/app/global-error.tsx, deleted src/instrumentation*.ts

Reasoning / RCA / research:
    - `refreshBrandIntel` had been sitting with zero callers — a complete
      web-grounded research pass, ~$0.10–0.15 of real spend per call, reachable
      by nobody. Giving it a button without a price would have been the worse
      half of the fix: it is the only action in the app that spends real money
      outside the credit ledger.
    - Priced at 2 credits, matching `perConcept`, whose underlying image cost
      sits in the same $0.10–0.15 band. The point is that a credit keeps meaning
      roughly the same amount of spend whatever it is spent on, rather than
      being cheap on one surface and expensive on another.
    - Added a 1-hour cooldown BEFORE the debit rather than relying on the button
      being disabled. The research takes tens of seconds, so an impatient
      re-submit or a second tab would otherwise buy an identical answer twice —
      and category evidence does not change hour to hour.
    - `BRAND_INTEL` is its own `CreditReason` rather than reusing `GENERATION`.
      Folding it in would have made the spend invisible in /admin/costs and the
      ledger at exactly the moment it became a real line item.
    - **Sentry removed rather than configured.** It had been installed for
      months with no DSN in any environment and no `withSentryConfig` in
      next.config.ts, so it uploaded no source maps and reported nothing while
      costing 90 MB. PostHog is the intended replacement; "installed and inert"
      was the one state paying a cost for nothing.

Implementation summary:
    - refreshBrandIntel: cooldown check → debit → research → refund on any
      failure, mirroring the enhance-prompt pattern already in the codebase.
    - `RefreshIntelButton` states the credit cost ON the control instead of
      leaving it to be discovered in the ledger afterwards, and shows the last
      refresh date so the value of spending again is visible before clicking.
    - Sentry: deleted both instrumentation files, stripped the init/onFailure
      blocks and `SENTRY_DSN` from trigger.config.ts, uninstalled
      `@sentry/nextjs` + `@sentry/node`, dropped the `@sentry/cli` allow-scripts
      entry. `global-error.tsx` KEPT as the root error boundary — it is useful
      UI independent of any SDK — now logging the digest that links to the
      Vercel runtime log.
    - `tsc`, `eslint`, 107 tests, `next build` green; migration applied.

Follow-ups deferred:
    - PostHog not wired. `global-error.tsx` carries the note for whoever does it.
    - `redissectProduct` still has no cooldown and no charge; it is the same
      shape of problem refreshBrandIntel just had.

### 2026-08-04 — Audit cleanup: ~700 lines removed, env wired into Vercel, two audit findings rejected on evidence

- Type: chore
- Scope: deleted src/lib/themes.ts, scripts/spikes/, scripts/migrate-legacy-pinata.ts, scripts/setup-launch-workspaces.ts; new src/lib/image/retry.ts; edited src/app/layout.tsx, src/styles/themes.css, src/lib/image/{gemini,provider,runware}.ts, src/lib/workspace-profile.ts, src/app/actions/{review,calendar}.ts, src/lib/auth.ts, src/lib/composition/devices.ts, package.json

Reasoning / RCA / research:
    - **Two audit findings were wrong and were rejected, not applied.**
      `regionAverage` was listed as a zero-caller export; it is called at
      contrast.ts:112. And the recommendation to delete the whole per-run
      image-model layer would have broken the studio page: a DB check found
      **6 historical runs with `imageModelPref = 'compare'`** whose side-by-side
      output still renders. Only the genuinely unreferenced `IMAGE_MODEL_PREFS`
      option list went; the type and resolver stay with a comment saying when
      they can go.
    - Verified every other deletion by grepping for the symbol across src and
      e2e first — "1 reference" means the definition alone. Nothing was removed
      on the audit's word.
    - Kept `refreshBrandIntel` despite zero callers. It is a complete, working
      ~$0.15/call feature whose only missing piece is a button; deleting it
      destroys work rather than debt. Flagged for a product decision instead.
    - Kept `@sentry/nextjs` (90 MB, inert without a DSN). Removing error
      monitoring immediately before launch is the wrong direction — the fix is
      to set the DSN, not to delete the integration.
    - Kept `wrangler` against the audit's advice: it is how the R2 bucket was
      created and remains the tool for bucket-level admin, which no application
      code covers.
    - Kept `getSignedThumbUrls`' unused `_width` for the reason recorded
      yesterday — removing it silently turns `(keys, 200, 7200)` into a
      200-second URL TTL and the compiler cannot catch it.

Implementation summary:
    - `src/lib/themes.ts` deleted (only `DEFAULT_THEME_CLASS` escaped it;
      inlined as `theme-synerix` in layout.tsx) plus 88 lines of unreachable
      `.theme-violet-bloom` CSS. The registry described a palette switcher that
      was never built.
    - Five spent one-time scripts deleted (legacy Neon->Supabase migration, the
      already-run launch-workspace setup, two dated spikes). One of the spikes
      was actively misleading: it still read Supabase Storage for keys that were
      re-keyed to R2, so every download in it would 404.
    - `withRetry` existed three times and had DRIFTED — the Runware copy omitted
      `overloaded` and `high demand` from its transient set, so a provider
      brownout the other two rode out failed outright there. Consolidated into
      `src/lib/image/retry.ts` on the superset regex. This is a deduplication,
      not a new abstraction.
    - Removed verified zero-caller exports: `deleteCustomEntry`,
      `assertApproved`, `assertBrandInWorkspace`, `ruleLine`, `offerBadge`,
      `PROFILE_INDUSTRIES`, `PROFILE_USE_CASES`.
    - `shadcn` moved from dependencies to devDependencies — it is a CLI, not a
      runtime library.
    - Vercel: added the four `R2_*` vars and both Fingerprint vars to production
      AND preview via the CLI, piping values straight from .env.local so they
      never entered a transcript. Production had NONE of them — a deploy would
      have failed every storage read and run no device identification.
    - `tsc`, `eslint`, 107 tests, `next build` all green after each step.

Follow-ups deferred:
    - Trigger.dev's CLI has no env-set command (`list`/`get`/`pull` only), so
      the worker vars are handled by yesterday's `WORKER_ENV_VARS` fix: they
      sync from the deploy environment on the next `trigger.dev deploy`.
    - The 34 `PRICE_*`/`MODEL_*`/`MAX_*`/`CREDITS_*` env knobs resolve to their
      literal defaults everywhere — `vercel env ls` confirms none is set. Left
      alone pending a check of the Trigger.dev environment, which the CLI cannot
      list without printing values.
    - `salesChannel` is written by onboarding and read by nothing.

### 2026-08-04 — Four-lens review of the R2 work: object deletion never existed, worker creds pointed at the dead provider

- Type: fix
- Scope: trigger.config.ts, src/lib/storage.ts, src/lib/site.ts, src/lib/editor/paid-edits.ts, src/app/actions/{products,models}.ts, scripts/migrate-storage-to-r2.ts, prisma/schema.prisma, src/lib/storage.test.ts (new)

Reasoning / RCA / research:
    - Ran security, correctness, simplicity and architecture passes over the R2
      migration. Security found nothing exploitable. The other three each found
      something the migration itself could not have surfaced.
    - **Deployed workers had no R2 credentials.** `WORKER_ENV_VARS` in
      trigger.config.ts still listed the Supabase pair and `syncEnvVars` pushes
      only what is listed, so any fresh Trigger.dev deploy would have failed
      100% of image work — the first thing `generation-run` does is
      `downloadFromStorage` for the product reference, and storage.ts throws
      outright without credentials. I had noted "add the R2 vars to the
      dashboard" as a manual follow-up and missed that the repo itself declares
      the list. A hand-set dashboard value would have hidden this until the next
      environment.
    - **There was no object deletion anywhere in the codebase.** No
      `DeleteObjectCommand`, while `deleteProduct` and `deleteAiModel` hard-delete
      rows — every deleted product and model had been orphaning its bytes
      forever, and the thumbnails added last week silently doubled the leak.
      This also reframes the tenant-prefix debate: per-tenant deletion cannot be
      the argument for a prefix scheme when no delete path exists at all.
      (`generate.ts` looked like a third site but is a false positive — it
      deletes a run created seconds earlier on the insufficient-credits
      rollback, before any object exists.)
    - **Bake-off plate keys collided.** `applyRenderAspect` keyed an
      editor-generated plate by (runId, conceptIndex, aspect), but a bake-off run
      emits one creative per (concept, variant), so several share conceptIndex 0.
      Adding an aspect to the second creative overwrote the first's plate, and
      the next text edit re-composited one creative onto the other model's scene
      with no error. Generation avoids this with `ctx.variantTag`; this path,
      added in the same week, had no equivalent.
    - **Preview deploys were emitting production canonicals** — site.ts read
      `VERCEL_PROJECT_PRODUCTION_URL` before `VERCEL_URL`, and the former holds
      the production domain even on a preview. The docblock described exactly
      the deindexing risk the code then failed to prevent.
    - Two claims in my own comments were wrong and are corrected in place rather
      than quietly dropped: the `storagePrefix` freeze was justified by workspace
      renames (renameWorkspace updates `name` only — the slug is immutable), and
      "R2 has no cheap server-side move" overstates it (CopyObject is
      server-side in-bucket). Both would have made a future re-key look scarier
      than it is.

Implementation summary:
    - `deleteObjects(keys)` in storage.ts, batched at the 1000-key API cap and
      deleting the `.thumb.webp` sibling alongside each original; wired into
      deleteProduct (keys collected BEFORE the cascade) and deleteAiModel. Both
      delete objects AFTER the row, so a failed cleanup leaves recoverable
      garbage rather than a live row pointing at deleted bytes.
    - uploadBuffer now writes the thumb key even when sharp fails, storing the
      original bytes. Presigning is local and cannot fail, so the read path
      always hands back a URL — under Supabase a broken thumbnail was omitted
      and callers rendered nothing, but here an absent object 404s behind a
      valid URL, and in the library grid the thumb is the ONLY url. The
      doc comment claiming callers "already fall back" was false; it is now
      true by construction.
    - `storageKeys.iteration` deleted outright — it had no caller, so renaming
      it to a lifecycle-friendly `scratch/` prefix would have been fixing dead
      code. Replaced with a warning that `runs/` holds the only copy of each
      master plate and must never get an expiry rule.
    - Migration script hardened: resume now checks the thumbnail as well as the
      original (the pair is written non-atomically), failures are tracked as
      structured records instead of strings split on ":", and the plan aborts if
      two sources map to one destination — the generic form of the collision
      caught by hand on 2026-07-31.
    - New src/lib/storage.test.ts: 16 tests pinning the prefix shape, that
      `sanitizeSegment` strips traversal, that same-second creatives stay
      distinct, and that bake-off creatives get distinct plate keys. 107 pass.
    - `tsc`, `eslint`, 107 tests, `next build` green.

Follow-ups deferred:
    - Left `getSignedThumbUrls`' unused `_width` parameter in place despite the
      audit flagging it. Removing it rewrites 8 call sites, two of which pass
      three arguments — `(keys, 200, 7200)` would silently become
      `(keys, 7200)`, i.e. a 200-second URL TTL, and the compiler cannot catch
      it. Not worth that hazard for a cosmetic win while the migration is still
      unproven in production.
    - Audit's larger deletion list (dead per-run image-model picker, themes.ts,
      spent one-time scripts, three copies of withRetry, ~7 zero-caller exports,
      inert @sentry/nextjs, unused wrangler dep) is real but unexecuted —
      roughly 800 LOC. Held back deliberately: two items need checks I cannot
      make from the repo (Trigger.dev/Vercel dashboard env vars, and whether any
      historical run has imageModelPref='compare'), and `refreshBrandIntel` is a
      working feature with no button, which is a product call rather than dead
      code.
    - Plate keys still live untyped inside `Creative.concept` JSON. That is the
      real layering violation and the main obstacle to any future re-key; a
      `plateKey` column on CreativeRender (already one row per aspect, already
      uniquely indexed on creativeId+aspectRatio) is the fix.

### 2026-07-31 — Storage moves to Cloudflare R2; creatives get a frozen per-workspace prefix

- Type: refactor
- Scope: src/lib/storage.ts, src/trigger/generation-run.ts, src/app/actions/{generate,layouts}.ts, src/lib/editor/paid-edits.ts, prisma/schema.prisma, prisma/migrations/20260731060000_r2_storage_prefix/, scripts/migrate-storage-to-r2.ts (replaces scripts/copy-storage.ts), .env.example

Reasoning / RCA / research:
    - Follows the 2026-07-27 reversal. Supabase bundles storage into a plan, so
      growth forces the $25/mo Pro step; R2 prices storage alone, gives 10 GB
      free and charges nothing for egress ever. At 440 MB we were already 44%
      through Supabase's free tier and 4% through R2's.
    - **The requested path could not be built as specified.** `{workspaceName}/
      {userId}/{timestamp}` assumed a user on the creative; `GenerationRun` had
      workspaceId and brandId only, and no user was recorded anywhere. Added
      `createdByUserId`, set in generate.ts (the single place a run is created)
      and backfilled to the workspace owner, since the real creator of an
      existing run is unrecoverable.
    - Used `workspace.slug`, not `name`. slug is `@unique` and already IS the
      sanitized name, so two workspaces called "Apparel Studio" cannot collide
      on a shared prefix — which sanitizing the name would have allowed.
    - Prefix is FROZEN on the creative (`Creative.storagePrefix`) rather than
      re-derived per render. Workspaces are renameable and R2 has no cheap
      server-side move, so a derived prefix would point at objects that are not
      there after any rename. The stored value records where the bytes ARE.
    - Thumbnails: sharp at upload, not Cloudflare Images. sharp was already a
      dependency, so this needs no CF zone, no Worker and no custom domain, and
      plain presigned URLs keep the private model byte-for-byte as it was.
    - Chose ONE 600px webp per image over per-width variants. Callers ask for
      160/200/400/600, but 600px webp is already ~50x smaller than the source
      PNG; four variants would multiply storage and upload latency to save a few
      KB. `width` on the read path is now advisory.

Implementation summary:
    - storage.ts rewritten on @aws-sdk/client-s3 against R2. Presigning is now a
      LOCAL signature — no network call, where Supabase charged an HTTPS request
      per key. The unstable_cache stays, but its job changed from saving API
      calls to holding URLs stable so the browser image cache still hits.
    - **`composedRender` takes an object now, deliberately.** The old signature
      was (creativeId, aspect, version) and the new one needed (prefix, aspect,
      version) — all (string, string, number), so the swap typechecked clean at
      every call site while silently writing to the wrong path. Switching to a
      named field turned that into 5 compile errors, and it was 5, not the 3 I
      had counted by eye.
    - `renderPrefix()` falls back to the pre-R2 layout for any unbackfilled row,
      so old and new creatives read through one path instead of branching.
    - migrate-storage-to-r2.ts moves objects, generates thumbnails on the way,
      and re-keys creative renders. It rewrites a DB key ONLY after that
      object's copy succeeded — a key pointing at an object that failed to copy
      is worse than one still pointing at Supabase.
    - `npx tsc --noEmit`, `npx eslint`, 91 vitest tests, `npx next build` green.

Executed 2026-07-31:
    - Bucket `synerix-studio` created with location hint **apac** (all users are
      in India). 340 objects migrated, 0 failures; 680 objects / 431 MB in R2
      once thumbnails are counted, none missing. 200 render/version rows re-keyed,
      0 left on the old path.
    - **The backfill exposed a collision the design would have shipped.** A bare
      {workspace}/{userId}/{seconds} prefix produced 82 distinct values for 85
      creatives — concepts inside a run render concurrently and share a second,
      so three sets of renders would have silently overwritten each other in R2.
      conceptIndex was no fix: two of the three collisions were different runs
      sharing conceptIndex 0. Added a short-id suffix AND a unique index on
      storagePrefix (20260731070000), so a regression fails at INSERT instead of
      destroying renders. Caught only because the prefix count was checked
      against the row count before moving bytes — the migration itself would
      have reported success.
    - Smoke-tested presigned reads across e2e-tests, dev, blueman and products
      prefixes: HTTP 200 on both full and thumbnail. Thumbnails run 27-87x
      smaller (1.7 MB PNG -> 43 KB webp).
    - Confirmed no Trigger.dev task calls the unstable_cache-backed helpers —
      they would throw outside a Next request context; workers only
      upload/download.

Follow-ups deferred:
    - 4 orphaned `creatives/...` objects carried over with 0 referencing rows
      (renders deleted before the move). Harmless; left in place.
    - `runs/<id>/iterations/` (24 objects, 44 MB of QA-reject scratch) left
      behind on purpose.
    - Supabase Storage still holds the originals — keep it until R2 has served
      real traffic, since it is the only rollback.
    - Trigger.dev env still needs the four R2_* vars or deployed workers will
      fail to upload.

### 2026-07-27 — Fingerprint device identification on the marketing funnel

- Type: feature
- Scope: src/components/fingerprint.tsx, src/app/(marketing)/layout.tsx, src/app/(marketing)/tests/business-health/wizard.tsx, src/app/api/send-test-report/route.ts, prisma/schema.prisma, prisma/migrations/20260727060000_test_result_fingerprint/, .env.example

Reasoning / RCA / research:
    - Mirrors the nexus setup (`@fingerprint/react` v3, region `ap`, same
      workspace and key) so both codebases read the same way.
    - Scoped to `(marketing)` only. The app is invite-only behind Google auth —
      a signed-in user is already a known identity, so re-identifying them
      spends quota for nothing. The anonymous funnel is where a device ID pays:
      the Business Health Check is the lead table, and one device filing
      repeated leads under different emails is otherwise invisible.
    - `immediate: true`, same as nexus. I first shipped `immediate: false` to
      conserve identification quota; My Lord corrected it — the point is
      tracking every marketing visitor, not only the ones who finish the quiz,
      and the free plan makes the quota argument moot. Identify on load.
    - Provider mounts unconditionally even with a blank key. First cut skipped
      it when unconfigured, which was wrong: `useVisitorData` throws with no
      provider above it, so local dev without a key would have crashed the quiz
      rather than degrading.
    - `visitorId`/`fingerprintEventId` are browser-supplied and nothing is
      authorized on them. Storing an unverified claim is fine for correlation;
      acting on one would not be.

Implementation summary:
    - `FingerprintIdentity` wraps nav/children/footer/chat in the marketing
      layout and exposes `useFingerprint()`; the wizard reads the already-
      identified visitor rather than triggering its own call, so a blocked or
      still-loading agent yields a null visitor and the lead submits regardless.
    - `test_results` gains nullable `visitorId` + `fingerprintEventId` and an
      index on `visitorId` — the index is the point, it turns "one device, many
      identities" into a query.
    - Zod schema takes both as `.nullish()` with a max length; route persists
      them alongside the existing fields.
    - `npx tsc --noEmit`, `npx eslint`, 91 vitest tests, `npx next build` — all
      green.

Follow-ups deferred:
    - Server-side verification intentionally NOT built — this is tracking, not
      an auth gate, so an unverified visitor id is sufficient. Storing the event
      id keeps the Events API route open if that ever changes.
    - `/api/send-enquiry` and the chat widget are the other two anonymous lead
      surfaces and are still unattributed.

### 2026-07-27 — Reversed: Cloudflare R2 + Images is the right storage target, not Supabase

- Type: docs
- Scope: decision record only — no code changed

Reasoning / RCA / research:
    - Yesterday's entry kept storage on Supabase, arguing R2 had no equivalent
      to Supabase's image transforms and that losing them would serve full-res
      PNGs into every grid. My Lord pushed back on the cost side and was right;
      pulling the live pricing pages showed the objection was wrong on its facts.
    - **Cloudflare Images transformations are on the FREE plan** — 5,000 unique
      transformations/month, explicitly for images stored *outside* Images
      (i.e. in R2). Uniqueness is per original+params per calendar month, so
      repeat views are free. Synerix thumbnails one 600px variant per creative;
      even 5 clients × 800 images/month lands at 4,000, under the free ceiling.
      I had assumed transforms required the paid plan.
    - The cost gap is not marginal. R2: 10 GB-month free, then $0.015/GB-month,
      **egress free at any volume**, 1M Class A + 10M Class B ops/month free.
      Supabase: 1 GB storage and 5 GB egress on free, and the next step is Pro
      at $25/mo. My Lord's framing was exactly right — Supabase bundles storage
      into a plan, so growth forces a subscription, while R2 prices storage
      independently and stays near zero at this scale.
    - The real cost of moving is NOT transforms or pricing: it is **private
      access**. Every read today is a short-lived signed URL. R2 + Images
      transformations want a Cloudflare-proxied origin, so preserving privacy
      means a Worker that authorizes then serves from the R2 binding. That is a
      day of work, not a config flip.
    - Sequencing: do it AFTER the Mumbai database move lands. Tangling a storage
      backend swap into a project migration means a failure could be either.

Follow-ups deferred:
    - Not started. `src/lib/storage.ts` is a single module (~10 call sites),
      which is what keeps this contained when it happens.
    - Cheap win available regardless of provider: `runs/<id>/iterations/` is
      44 MB of QA-reject scratch nothing reads. A cleanup job reclaims it
      without migrating anything.

### 2026-07-26 — Mumbai project move: complete the RLS lockdown, add a cross-project storage copier, runbook

- Type: build
- Scope: prisma/migrations/20260726180000_enable_rls_remaining/, scripts/copy-storage.ts, scripts/PROD-MIGRATION.md, vercel.json (pending bom1 flip)

Reasoning / RCA / research:
    - A new `Synerix Prod` project was created in ap-south-1 to end the
      Tokyo-database compromise recorded in `vercel.json`. Audited the old
      project before moving anything: no Supabase Auth users (login is
      NextAuth+Prisma, `auth.users` empty), no custom extensions, no edge
      functions, no pg_cron. The move is far smaller than "migrate everything".
    - **RLS held only by accident.** `20260606110146_enable_rls` covers the 16
      tables that existed then; the 9 added since are RLS-enabled on Tokyo but
      by nothing in the migration history. A freshly provisioned project would
      therefore expose `accounts`/`sessions`/`verification_tokens` — OAuth
      refresh tokens and session material — through the PostgREST Data API under
      the anon key. Found only because provisioning a second project is what
      separates "configured" from "reproducible".
    - Rejected applying the schema through the Supabase MCP: it records into
      `supabase_migrations.schema_migrations`, leaving Prisma's
      `_prisma_migrations` empty, and the next `migrate deploy` then dies with
      `P3005 database schema is not empty`. Hand-inserting Prisma rows means
      hand-computing migration checksums. `prisma migrate deploy` is one command
      and cannot get this wrong.
    - All 8 workspaces are dev/test/demo — no customer data, and `E2E Tests`
      holds 9980 test credits. Recommending a clean start rather than carrying
      440 MB of test renders into a 1 GB free tier on day one.
    - Model presets are the exception worth copying: `prisma/seed-models.ts`
      regenerates them through the image API, which costs money *and* returns
      different faces. Same reasoning does not apply to festivals, which
      `prisma/seed.ts` reproduces exactly from a repo fixture.

Implementation summary:
    - `20260726180000_enable_rls_remaining` enables RLS (still zero policies —
      deny-all for anon/authenticated, no-op for Prisma as table owner) on
      accounts, sessions, verification_tokens, workspace_invites, ai_models,
      api_cost_log, tests, test_results.
    - `scripts/copy-storage.ts`: prefix-scoped, resumable, dry-run-by-default
      object copier. Exists only because Supabase has no server-side copy across
      projects; the database half is plain `pg_dump | psql`. Recursive listing
      because `list()` is one directory deep and pages at 1000.
    - `scripts/PROD-MIGRATION.md`: ordered runbook, since every step needs
      credentials and runs on My Lord's machine.
    - Documented that `runs/*/plates/` is NOT scratch — the editor re-composites
      from `masterPlateKey` on every edit, so dropping plates silently kills
      editing on those creatives. Only `runs/*/iterations/` is disposable.
    - `npx tsc --noEmit` clean.

Follow-ups deferred:
    - `vercel.json` still pins `hnd1`; flip to `bom1` once the database is
      actually serving from Mumbai, not before — a Mumbai function against a
      Tokyo database is the worst of both.
    - Storage provider stays Supabase. Cloudflare R2's zero egress is the right
      end state for an image-heavy product, but `getSignedThumbUrls` depends on
      Supabase image transforms, which R2 has no equivalent for; losing them
      would serve full-res PNGs into every grid and undo the latency work.
      Revisit when storage cost, not principle, forces it.

### 2026-07-26 — Latency round 2: per-request payloads, parallel uploads, lazy editor; dead Runware pricing removed

- Type: fix
- Scope: src/lib/auth.ts, src/app/(app)/{products,studio}/page.tsx, src/app/actions/products.ts, src/app/(app)/studio/[runId]/studio-canvas.tsx, src/lib/pipeline/cost.ts, src/lib/image/runware.ts, vercel.json

Reasoning / RCA / research:
    - My Lord caught a real mistake: I had "corrected" the price of `google:4@2` (Nano Banana Pro via Runware) when nothing routes there. Verified: WORKSPACE_IMAGE_MODELS maps nb-pro to provider "gemini" (direct Gemini API) and gpt-image-2 to the direct OpenAI API; only seedream_v4 / seedream_v5_lite / qwen_image / wan_2_7 carry provider "seedream" and reach Runware. `bfl:5@1` was not even in the Runware catalogue. Fixing the price of a dead path is worse than leaving it — it implies the path is live. Deleted the two price rows, the `nano_banana_pro` catalogue entry and its dimension/negative-prompt rows. Runware also charges MORE than the direct API for that model, so the route has no reason to exist.
    - He also pushed back that I had diagnosed slowness more than fixed it. Fair. Round 1 was infrastructure (region, index, token cache, refresh coalescing, library payload). This round is the per-request work:
      * requireAuth runs on EVERY page render and EVERY server action and was doing `include: { memberships: { include: { workspace: true } } }` — full rows for six fields. Narrowed to an explicit select.
      * /products and /studio pulled `dissectionFull` (a whole vision-analysis blob) and `productIntel` for every product, on a page that re-polls while any photo is analysing. Narrowed to the five fields the grid renders, and slowed the poll from 8s to 15s (dissection takes tens of seconds; the extra polls only re-ran auth + brand + products + N signed URLs).
      * createProduct and addProductImages uploaded to Tokyo and inserted rows strictly one file at a time — five photos meant ten serial cross-region round trips with the user watching a spinner. Now parallel uploads plus one createMany, and the two Trigger enqueues fire together.
      * The 865-line editor was statically imported into the studio route, where it only renders after a creative is selected. Now a dynamic import behind a skeleton.
    - Checked before assuming: the app group ALREADY has a loading.tsx skeleton, so navigation is not blocking on a blank screen. Did not add redundant per-route ones.
    - Region research (for a 100%-India customer base): Vercel Hobby allows exactly ONE function region and it IS selectable, so hnd1 works on the free plan. Supabase CANNOT change an existing project's region — moving to ap-south-1 (Mumbai) means a new project plus a dump/restore and a storage copy, which the free plan's two-project allowance makes possible. Trigger.dev cloud offers US East, US West and EU only — no Asia region — but its tasks are minutes long and off the interactive path, so it is not worth optimising. vercel.json now documents the rule: stay in hnd1 while the database is in Tokyo, switch to bom1 the day it moves to Mumbai.

Implementation summary:
    - Explicit selects on the auth query and both product list pages; parallel uploads + createMany; lazy editor; dead Runware pricing/catalogue rows deleted; vercel.json annotated with the region decision and its trigger condition.
    - Verified: tsc/lint clean, 91 tests pass, `next build` green.

### 2026-07-26 — Access control: page-level guards, invite expiry, VIEWER enforcement

- Type: fix (security)
- Scope: src/app/(admin)/**/page.tsx (6), src/lib/auth.ts, src/app/actions/{auth,admin,brand,calendar,editor,enhance,generate,layouts,models,products,review,workspace}.ts, src/app/(app)/models/page.tsx, src/app/(app)/layout.tsx, src/app/(admin)/layout.tsx

Reasoning / RCA / research:
    - Owner reported users seeing a workspace they were not added to. Audit of every page, layout, action and route handler found the customer-facing (app) surface genuinely clean — every page calls requireAuth itself and every query filters on the resolved workspaceId — and located the exposure elsewhere.
    - The admin console had authorization in exactly ONE place: the (admin) group layout. A Next.js layout is not an authorization boundary — it is not re-rendered on RSC segment requests — so the five admin pages (all workspaces, owner emails, credit balances, API spend, leads) were one prefetch away from anyone signed in. Guard now sits at the top of every page body.
    - ensureMembership accepted invites with `expiresAt: null` as "legacy, never expires". Every invite created by workspace.ts sets an expiry, so a null is a stale row — meaning any address ever typed into an invite box could still claim membership years later, with no revoke path. Prod check: 3 invites, all ACCEPTED with expiry set, so nothing was actively exploitable; the rule is now future-expiry-only.
    - The VIEWER role existed in the schema and was enforced NOWHERE: ctx.role was read only for member management, so a read-only member could generate creatives (spending the workspace's credits), delete products and edit the brand. Added requireWriteAccess and swapped it into all 30 mutating actions; the 3 read-only actions keep requireAuth.
    - signOutAction deleted the workspace cookie but left the god-view flag alive for 30 days, so a super-admin's next sign-in on a shared machine landed silently inside a customer workspace. Both cookies now share sessionCookieOptions() with Secure in production.
    - /models rendered the AI-model surface for account types that /brand and /products hide it from — the gate lived in the nav, not the route.

Implementation summary:
    - requireSuperAdmin() at the top of all six admin pages; requireWriteAccess() across the mutating action surface; invite acceptance requires a future expiry; ADMIN_ACTING_COOKIE cleared on sign-out; shared cookie options with Secure; /models gated on showsModelSurface with notFound().
    - Verified: tsc/lint clean, 91 tests pass, `next build` green. An adversarial verification pass re-read each fix in the working tree and confirmed all four page-level findings resolved.

Follow-ups deferred:
    - generateBrandModel still calls a premium image model with no credit debit (platform spend, not customer spend).
    - refreshBrandIntel and redissectProduct run paid AI with no cooldown.
    - assertApproved is dead code: the download gate is client-side only.

### 2026-07-26 — Cost accounting: prices, silent zeros and credit-to-render mismatches

- Type: fix
- Scope: src/lib/pipeline/cost.ts, src/trigger/generate-model.ts, src/app/actions/generate.ts, src/trigger/generation-run.ts

Reasoning / RCA / research:
    - The numbers were wrong in both directions. Runware's Nano Banana Pro was priced at $0.060 against a real ~$0.1424 (understating every Runware-routed hero render by 2.4x), and two models reachable from the workspace picker (Qwen-Image, Wan 2.7) had no entry at all so they silently fell back to a $0.04 default.
    - addLLM priced an unknown model id at exactly $0 with no warning. Every model slot is env-overridable, so one MODEL_CONCEPTS change could zero out the most expensive stage in the pipeline and the cost report would look better for it. The fallback is now the frontier rate — a mispriced slot should overstate and get noticed.
    - generate-model rendered a premium image with no CostTracker at all.
    - Credit math did not track renders: a multi-aspect run debits once but renders one NATIVE plate per aspect, and a "compare" run debits 2x while a workspace image-model pin collapses the worker to a single render. The first is a margin hole, the second charges for a variant the pipeline will not produce. Both now priced from what actually renders, and the refund paths derive a per-item price from the debit instead of assuming a flat per-concept pack.

Implementation summary:
    - Corrected IMAGE_PRICING, added the missing Runware entries and a 4K rate for Nano Banana Pro; non-zero LLM fallback plus warnings on any price miss; cost tracking on generate-model; aspect multiplier and pin-aware compare pricing in generate.ts; proportional refunds in generation-run.
    - Verified: tsc/lint/tests/build green.

Follow-ups deferred:
    - brand-intel reads only Anthropic's `input_tokens`, so prompt-cache creation/read tokens and per-search web_search charges are invisible.
    - brand-ingest (one DNA extraction + up to 40 Haiku vision calls per brand) and the marketing chatbot are untracked.

### 2026-07-26 — Performance: region, index, refresh storm and payload size

- Type: fix
- Scope: vercel.json (new), prisma/schema.prisma + migration, src/lib/realtime-token.ts (new), src/app/(app)/studio/[runId]/{page,studio-canvas}.tsx, src/app/(app)/library/{page,library-client}.tsx, src/lib/credits.ts

Reasoning / RCA / research:
    - The app is not slow because of one bad query; it is slow because almost every page pays 6-11 SEQUENTIAL round trips to a database on the other side of the planet. DATABASE_URL and Supabase Storage both resolve to aws-1-ap-northeast-1 (Tokyo) while functions ran in the Vercel project default region. Pinned functions to hnd1: with N sequential queries per render, co-locating with the database beats co-locating with the user (N x ~0ms versus N x ~100ms).
    - Creative.generationRunId had no index — Prisma does not create one for a relation scalar on PostgreSQL — and it is the filter behind the studio page, the library and every refund path.
    - The studio minted a Trigger.dev public token over the network on EVERY progress refresh, so a cross-region API call sat in front of each RSC response (~15 per run). Now cached per run for 25 minutes.
    - router.refresh() fired once per landed concept with no coalescing, refetching the whole route segment tree (layout auth + balance + brand + signed URLs) each time. Coalesced to at most one refresh per 900ms.
    - The library masonry rendered up to 60 images with no intrinsic dimensions, so every arriving image reflowed the page. Each thumbnail now carries its real aspect ratio. The same query used `include` (SELECT *), dragging concept/qa/critic JSON and the run's pipeline blob across the wire for a page that shows a picture and a caption.

Implementation summary:
    - vercel.json regions hnd1; index migration for creatives(generationRunId); realtime-token cache; debounced studio refresh; aspect-ratio placeholders and a narrowed `select` on the library; getBalance wrapped in React cache (it was queried twice per dashboard render).
    - Verified: tsc/lint/tests green, `next build` green.

Follow-ups deferred:
    - Free editor edits still composite multi-MB images inline in a server action instead of enqueuing.
    - requireAuth costs three serial round trips and fetches full Workspace rows on every request.
    - No code splitting anywhere: the 865-line editor ships on the studio route before it renders.

### 2026-07-26 — SEO/AEO groundwork and a chatbot that reports its own failures

- Type: feature + fix
- Scope: src/lib/site.ts, src/lib/structured-data.ts, src/components/structured-data.tsx, src/app/{robots,sitemap}.ts, src/app/llms.txt/route.ts, src/app/(marketing)/{layout,page,opengraph-image}.tsx, synerix-studio/page.tsx, consulting/page.tsx, src/app/globals.css, src/app/api/chat/route.ts, src/components/marketing/chat-widget.tsx

Reasoning / RCA / research:
    - The marketing site was well written and effectively invisible: no robots.txt, no sitemap, no canonical on any route, zero structured data and no OG image anywhere in the repo. Every shared link rendered as a blank grey card — and WhatsApp is the primary outreach channel for this business.
    - AEO/GEO specifically: answer engines had nothing to ground on, so pricing and capability claims were theirs to infer. /llms.txt now publishes the same verified fact block that grounds the on-site assistant, plus a FAQ, and the Studio page carries a real FAQ section with FAQPage schema so the answers are extractable.
    - The hero heading animated from opacity 0, and Chrome does not accept a fully transparent element as an LCP candidate — the page was penalising its own LCP by the animation duration for no visual difference. Starts at 0.01 now, with a reduced-motion opt-out.
    - The chatbot was NOT partially streaming: it was streaming and then silently swallowing every failure. toTextStreamResponse() is built on textStream, which forwards only text-delta parts and DROPS error parts, so a model error, a safety block or an exhausted budget closed the body with HTTP 200 and partial text — no error, no retry, no server trace. Compounding it: the model was a floating "-latest" alias resolving to a thinking model whose reasoning tokens are billed against maxOutputTokens: 500, so the budget was spent before any visible text; a blank assistant turn then failed the server's min(1) validation and bricked the conversation permanently; and slice(-12) on an odd-length transcript always started on an assistant turn, which Gemini rejects.

Implementation summary:
    - SITE_URL resolver that never emits production canonicals from a preview deploy; robots (AI answer-engine crawlers allowed on marketing, product/admin disallowed), sitemap, canonicals, Organization/WebSite/SoftwareApplication/FAQPage/BreadcrumbList JSON-LD, generated OG image, llms.txt, noindex on the app and admin layouts.
    - Chat route reads fullStream and surfaces errors as text, pins the model, disables thinking, raises the budget, trims the history to start on a user turn and sets anti-buffering headers. Widget keeps partial text on failure, renders the light markdown the model emits, announces streamed text via aria-live, keeps keyboard focus, and offers a stop control.
    - Verified: tsc/lint/91 tests/`next build` green; robots.txt, sitemap.xml, llms.txt and the OG image all prerender as static.

Follow-ups deferred:
    - No conversation logging and no lead capture on the assistant — it produces nothing reviewable.
    - The in-memory rate limiter is per-instance on Vercel, so the effective chat limit is 10/min x warm instances.

### 2026-07-25 — Render guards: the no-baked-text ban was dead code on every path

- Type: fix
- Scope: src/lib/pipeline/image-prompt.ts, src/lib/pipeline/model-qa.ts, tests

Reasoning / RCA / research:
    - Found during a full art-direction audit of real production output. Two shipped PLAIN on-model frames were unusable: one rendered a complete fake shopping-app screenshot (carrier status bar reading "Verizom", clock, battery, hamburger/search/heart/cart icons and a home indicator), the other baked a gibberish serif headline across the frame ("Simtidiavi ihust Indian / Mith Ilar Tunan").
    - Root cause: `buildOnModelPrompt` appended its "no on-image text" ban inside `if (!hasFullPrompt)`. Every concept path now sets `imagePrompt` — the enhancer rewrites it, and the new catalog shot list always writes one — so `hasFullPrompt` is always true and the ban was appended on ZERO renders. `buildScenePassPrompt` never had the ban at all. The system's loudest invariant (text is never baked, it is always canvas-composited with real fonts) was documented everywhere and enforced nowhere.
    - The app-UI failure is not random: product reference photos in this workspace are phone screenshots (their names are literally "WhatsApp Image 2026 06 23 at 11.27.42 PM"), so the model had every reason to reproduce phone chrome. The ban now names that failure explicitly rather than relying on "no text" to cover it.
    - Same audit found display artefacts being copied off the reference onto the model — a rhinestone tiara off a mannequin head form, a size "32" label and collar brand tag on a model's chest. The reference is a product photograph; only the clothing in it is the subject, and nothing said so.
    - PLAIN runs were also being told to keep a headline band calmer and darker (`SAFE_ZONES`) for an overlay that `plainMode` never composites — surrendering up to a third of a catalog frame and dulling the garment in it.
    - model-qa could not have caught any of this: its verdict schema had four booleans (modelVisible, identityMatch, garmentFaithful, singleFigure) and no notion of baked text, frame containment, wearer gender or wearer age. It passed a toddler wearing adult menswear and passed womenswear on a male model reference.

Implementation summary:
    - `WORDLESS` constant, appended unconditionally by both the on-model and in-scene builders: bans all rendered text AND app/phone interface chrome, with the product's own printed packaging as the sole exception.
    - `REFERENCE_IS_A_PRODUCT_PHOTO` on the on-model path plus an equivalent clause on the in-scene reference line: hanger, mannequin, stand, head form, hang tags, size stickers and neighbouring garments must not appear.
    - `PLAIN_ECOMMERCE` now carries a styling lock (matching bottoms drawn from the garment, simple closed neutral footwear, no accessories) so frames of one product cut together as one shoot — sneakers-with-festive-kurta and barefoot frames were appearing inside a single pack.
    - SAFE_ZONES is now branded-only.
    - model-qa gained `garmentSuitsWearer`, `noBakedText` and `fullyInFrame`, gender/age judged first and strictly in `identityMatch`, and a precise failure label per class so the corrective re-render is told what actually went wrong. Same single vision call — no added cost.
    - Verified: tsc/lint clean, 74 vitest pass including four new guard tests asserting the ban, the PLAIN safe-zone removal, the product-photo clause and the styling lock.

Follow-ups deferred:
    - Wearer gender is still only caught after the render is paid for. The real gate is capturing garment gender at dissection and matching it to AiModel.traits before spending.
    - The in-scene path has the same identity blindness: pack-QA is explicitly told to ignore people, so a toddler or three cloned men pass.

### 2026-07-25 — Lite pipeline for PLAIN on-model (6× cheaper per catalog image) + OOM/stall recovery

- Type: feature + fix
- Scope: src/lib/pipeline/catalog-concepts.ts (new), src/trigger/generation-run.ts, src/trigger/heal-runs.ts (new), src/lib/run-heal.ts (new), src/lib/editor/paid-edits.ts, src/lib/pipeline/typography.ts, src/lib/pipeline/model-qa.ts, src/lib/image/runware.ts, src/app/(admin)/admin/costs/page.tsx, src/app/(app)/studio/[runId]/{page,studio-canvas}.tsx, src/trigger/creative-edit.ts, .github/workflows/e2e.yml, tests

Reasoning / RCA / research:
    - Trigger: an apparel client wants 800+ images at ≤ $0.5 each; measured unit cost was $0.34–$0.52. Read the real numbers out of `api_cost_log` rather than estimating — worst prod run: on-model renders $0.402 (NB Pro $0.134 × 3 = 1 render + 2 fidelity retries), concepts (Opus) $0.085, enhancer $0.020, brief-QA $0.013, model-QA $0.004.
    - Key finding: on a PLAIN on-model run the compositor renders NO text and NO logo (`plainMode`), so the concept LLM's four-language copy, big idea, archetype and typography spec are generated and then discarded. ~$0.118/creative and ~45s of latency bought nothing. The variation a catalog needs is framing, not storytelling — and a fixed shot list holds consistency across an 800-image drop better than an LLM can.
    - Gated the lite path on `ON_MODEL + PLAIN`, NOT on account type: an APPAREL_ON_MODEL workspace still runs branded festival campaigns, and those legitimately need concepting. My Lord chose the narrower gate.
    - Bake-off (4 garments × 4 models, real runs, ~$1.27 total): NB2 ($0.06) matched or beat NB Pro ($0.134) on 3 of 4 garments; on the fourth it rendered a hip-length tunic as an ankle-length gown and model-QA passed it — so the QA prompt now judges HEM LENGTH and invented embellishment explicitly. Seedream v4 ($0.03) hallucinated beadwork onto a dupatta border and shortened sleeves; gpt-image-2 cropped the model's head (it has no native 4:5 and the crop ate the head). Conclusion: NB2 as the apparel default with the cascade behind it, not Seedream.
    - Found while bake-offing: EVERY on-model render on a Runware model was failing with `invalidPositivePrompt` — our on-model prompt is capped at 4500 chars and Runware rejects that. Trimming from the middle (not the end) keeps the two-reference fidelity contract in the head and the craft floors in the tail; only the scene body is lossy.
    - Prod OOM (TASK_PROCESS_OOM_KILLED, 3-pose 9:16 run): generation-run had no `machine` preset, so it ran on small-1x = 0.5 GB while holding several multi-megapixel PNGs per concurrent concept (plate + composite + sharp raster + base64 copies of 3 images for QA). An OOM is a process kill, so `catchError` never ran → the row stayed RENDERING, credits stayed debited, and the studio spun forever.
    - The spinner had a second, independent cause: studio-canvas derived liveness ONLY from `run.metadata.status`, which the task writes itself. A dead worker can never write it. The Trigger run's own status (CRASHED/SYSTEM_FAILURE/…) was already in hand and ignored.
    - Stall recovery also only ran when someone loaded that run's studio page (and only after 30 min), so a user who closed the tab kept the spinner and the credits indefinitely.

Implementation summary:
    - `catalog-concepts.ts`: 6-shot table (framing/pose/backdrop only — craft floors still come from buildOnModelPrompt) + a neutral brief for pose-driven runs. Lite branch skips concepting, brief-QA, the enhancer and the brand-intel refresh.
    - Fidelity-QA retry budget is now per-path (`LITE_QA_MAX_RETRIES`, default 1 vs 2) and the verdict is finally persisted for PLAIN creatives — the highest-volume path had no measurable QA outcome.
    - `machine: medium-2x` on generation-run, `medium-1x` on creative-edit; shared `healStalledRun`/`healAllStalledRuns` + a 10-minute `heal-stalled-runs` scheduled task; studio treats a dead Trigger run as terminal and shows the failure panel.
    - Workspace image-model pin now honoured by the editor paths (baked-text swap, both regen paths, the typography pass) — they hardcoded `tier: "hero"` and silently billed NB Pro to workspaces pinned to a cheap model.
    - e2e: `PACK_QA_MAX_RETRIES=0` / `LITE_QA_MAX_RETRIES=0` — corrective re-renders were the suite's largest line ($0.20 vs $0.08 on the same run shape).
    - Admin costs list gained "Spend by pipeline stage · last 30 days" with share-of-total, plus a visible affordance on run rows (the per-run stage split existed but the rows looked unclickable).
    - Verified: tsc/lint clean, 70 vitest pass; 4 real bake-off runs on prod data confirmed `lite="plain-on-model"` with zero concepting spend (LLM cost per creative $0.118 → $0.001); the stalled prod run was healed and its 6 credits refunded (balance 76 → 82).

Follow-ups deferred:
    - "Compare" image-model pref + a workspace pin = 2× credits debited but one render delivered (generate.ts:149 vs generation-run.ts:147). Needs a product decision.
    - The apparel workspace's only READY AI model is male while its garments are womenswear — every bake-off render put a man in a women's anarkali. Model library needs female models before the client drop.
    - generate-model.ts still renders AI models on NB Pro ($0.134, one-time per model).

### 2026-07-23 — Workspace account types drive photography style (FMCG / e-com apparel / premium fashion)

- Type: feature
- Scope: src/lib/workspace-type.ts (new), src/components/account-type-picker.tsx (new), src/app/(admin)/admin/new-workspace-dialog.tsx, src/app/(app)/onboarding/wizard.tsx, src/app/actions/brand.ts, src/lib/workspace-profile{,-server}.ts, src/app/(app)/settings/{page,settings-client}.tsx, src/app/actions/workspace.ts, src/lib/pipeline/image-prompt.ts, src/trigger/generation-run.ts, tests

Reasoning / RCA / research:
    - Three customer segments (Gillco-style FMCG campaigns, normal e-com apparel, premium fashion) needed distinct generation styles, selectable at workspace level incl. onboarding. Key finding: the `WorkspaceType` enum already existed with exactly these 3 values but only `FASHION_EDITORIAL` branched anywhere, and onboarding used a parallel legacy classification (`industry`/`primaryUseCase`) that never set it — two disconnected systems. Chose to make `WorkspaceType` the single source of truth rather than add a fourth field; zero migrations needed.
    - Photography language reverse-engineered from live references: schein.in (e-com apparel = soft diffused daylight, warm beige/cream minimal architectural sets, muted pastels, garment-hero full figure + crisp fabric macro detail) and theblueman.net (premium fashion = character-driven campaign: styled model w/ accessories, environmental sets with depth/props, directional/rim light, rich confident grade). Screenshotted both sites' product photos and wrote `ON_MODEL_DIRECTION` + ACCOUNT STYLE blocks against what's actually in frame, not generic "editorial" adjectives.
    - Deliberately did NOT ban campaign concepts for APPAREL_ON_MODEL accounts — an e-com apparel brand still runs festival campaigns; its ACCOUNT STYLE block steers them tasteful/minimal instead of forbidding them. FMCG adds no block (base behavior IS its style).
    - Mode selection in the studio stays product-category driven (unchanged) — workspace type sets style, product category sets mechanics; an FMCG workspace with an apparel product still gets on-model.
    - `showsModelSurface` keys on type first, but FMCG_PRODUCT is also the schema default so it can't distinguish a real choice from a never-classified legacy workspace — kept the legacy-profile fallback (incomplete data → show everything) instead of hiding the Models tab on old workspaces.
    - Decisions from My Lord: type is owner/admin editable in settings (not super-admin-only like the image model); onboarding's Industry + Mainly-creating selects are replaced by the required 3-card picker (salesChannel kept, legacy columns no longer written).

Implementation summary:
    - Shared `WORKSPACE_TYPES` metadata + `AccountTypePicker` radio-card component extracted from the admin dialog; reused in admin, onboarding, settings.
    - `saveWorkspaceProfile` persists `workspace.type`; new `setWorkspaceType` action reuses `requireManager`; settings shows the picker read-only for non-managers.
    - Rewrote both `ON_MODEL_DIRECTION` strings (schein/blueman anchored) and extended the brief-level ACCOUNT STYLE injection to a 3-way switch in generation-run.ts.
    - Verified: tsc/lint clean, 65 vitest pass (new showsModelSurface matrix + updated direction assertions); live smoke on dev server — settings picker persists + reverts, onboarding renders picker and required-radio blocks submit without a choice.

Follow-ups deferred:
    - Prod data flags (My Lord to fix via the new settings card): "Synerix Apparel" and "E2E Tests" workspaces are typed FMCG_PRODUCT but are apparel accounts.
    - Pre-existing cosmetic bug spotted: the super-admin image-model Select renders raw `__default__` in its trigger instead of the "Default (quality-first cascade)" label.

### 2026-07-22 — Super-admin workspace image-model picker (7 models incl. cheap Chinese Runware models)

- Type: feature
- Scope: prisma/schema.prisma (Workspace.imageModel), src/lib/image/{provider.ts,runware.ts}, src/trigger/generation-run.ts, src/app/actions/workspace.ts, src/app/(app)/settings/{page.tsx,settings-client.tsx}

Reasoning / RCA / research:
    - Owner wants to A/B image models per workspace to save cost — simple e-commerce apparel doesn't need the premium tier. The create-form model picker was removed earlier (dev-only), so the knob belongs at the workspace level, visible/settable by the platform super-admin only.
    - Added Qwen-Image (runware:108@1) and Wan 2.7 (alibaba:wan@2.7-image) — cheap Alibaba models that both accept reference images (garment/product fidelity survives). Verified the exact Runware AIR ids via Runware docs; "Wan 2.2" was resolved to the current 2.7 image model.
    - Kept it a SOFT preference: the chosen model leads but the full quality-first cascade stays behind it, so a paid run survives a model outage. A hard pin would fail the run when the cheap model hiccups.
    - Threaded a `runwareModel` down ChainStep/BakeoffVariant/SceneGenParams so one "seedream" provider can front several Runware models. Critical subtlety (unit-tested): a fallback seedream step must NOT inherit the leading pick's model key — runProvider now reads the STEP's model, not the top-level param.

Implementation summary:
    - WORKSPACE_IMAGE_MODELS registry + resolveWorkspaceImageModel() in provider.ts; generation-run resolves it ahead of the legacy per-run pref. setWorkspaceImageModel action gated on isSuperAdmin. Settings picker rendered only for super-admins (model list passed as plain props so provider.ts/sharp never bundles into the client).
    - 4 new provider unit tests (registry integrity + fallback model isolation). Migration 20260722133655.

### 2026-07-22 — Multi-pose on-model: same model + garment, one image per selected pose in a single run

- Type: feature
- Scope: prisma/schema.prisma (GenerationRun.modelPoses), src/app/(app)/studio/create-form.tsx, src/app/actions/generate.ts, src/trigger/generation-run.ts

Reasoning / RCA / research:
    - Owner wants pose variety for apparel: pick several poses, get the SAME model in the SAME garment across them. Previously on-model with N options generated N different CONCEPTS (different scenes) — wrong axis of variation.
    - Decision (grilled): poses REPLACE the option count for on-model. M selected poses → M images; the "how many options" picker is hidden for on-model. Empty selection = one AI-varied pose (legacy behavior preserved).
    - Implementation: generate ONE concept, then fan out one work item per pose (poseOverride threaded into ConceptCtx → buildOnModelPrompt). The pose is stored in the creative's concept JSON so an editor aspect re-render reproduces it.
    - modelPoses sent as a JSON array (pose text contains commas; a delimiter join is unsafe), parsed + capped server-side; conceptCount for on-model = pose count.

Implementation summary:
    - create-form pose pills became multi-select + a custom-pose field appended to the set; cost/summary/CTA driven by the pose count. generate.ts derives conceptCount and stores modelPoses. Migration shared with the image-model change.

### 2026-07-22 — Editor "add format" now renders a NATIVE plate per ratio (no more crop) and charges credits

- Type: bug
- Scope: src/lib/editor/paid-edits.ts (applyRenderAspect), src/app/actions/editor.ts, src/trigger/creative-edit.ts, src/app/(app)/library/[creativeId]/{preview-stage.tsx,editor.tsx}

Reasoning / RCA / research:
    - Symptom (owner): switching a creative to another format in the editor "just crops the photo rather than fitting the dimension", 4:5 looked cut. RCA: generation already renders a native plate per requested aspect, but the editor's "add format" (applyRenderAspect) cover-cropped the master plate into the new ratio — a big crop that clips heads/feet. Confirmed Nano Banana natively supports 4:5, so the generation side was fine; the crop was purely the editor path.
    - Fix (owner-chosen): re-generate a native plate for the new ratio via the image model, reusing the run's references (cutout-preferred) + the same prompt builder (buildOnModelPrompt / buildScenePassPrompt) + the workspace image-model setting. Reconstructing the run context (product/model/pose/fidelity) is what makes the re-render faithful rather than a generic redraw.
    - Owner chose to CHARGE credits (it's a real image generation). Collapsed the old render_aspect "free" special-case: startCreativeEdit now debits every edit kind, applyRenderAspect refunds on handled failure, and the task's catchError refunds render_aspect on crash (previously it skipped it). The native plate is also saved as that aspect's own plate key so later text/language edits recomposite from it, not a crop.

Implementation summary:
    - applyRenderAspect rewritten (native render + cost tracking + aspectPlateKeys update). Editor "add format" badge changed from "Free" to the credit cost. Pose persisted in concept JSON at generation so re-renders match.

- Type: bug
- Scope: src/app/(app)/layout.tsx

Reasoning / RCA / research:
    - Symptom: click Generate → blank "Something went wrong" page, yet the run showed RUNNING in the library and actually COMPLETED. Third distinct failure in this flow (after the preview-key enqueue bug and the Node-21 WebSocket worker crash) — each a different layer.
    - Vercel error log pinned it: `POST /studio — Vercel Runtime Timeout Error: Task timed out after 10 seconds`. startGenerationRun does auth + ~8 sequential Supabase round-trips + a Trigger enqueue; a cold invocation crosses 10s. The enqueue had already succeeded, so the pipeline ran while the browser got the crash page.
    - Status codes were all 200 in the request logs — RSC/server-action errors don't surface as 5xx, so `--level error` (not `--status-code 5xx`) was the query that found it.
    - Fix at the layout, not per page: server actions POST to the page hosting the form, and Next segment config cascades from layouts (verified in next.js reduceAppConfig), so one `export const maxDuration = 60` in src/app/(app)/layout.tsx covers every app action. All genuinely slow work already lives in Trigger tasks; nothing needs more than 60s.
    - The bare unstyled crash page is global-error.tsx (the app has no nested error.tsx) — deliberately left for a future polish pass; the timeout fix removes the trigger.

Implementation summary:
    - One segment-config export + comment; verified layout-level cascade against Next.js docs/source before relying on it.

### 2026-07-22 — Product-image background removal moved to upload time: cached cutouts, reused as generation references

- Type: feature
- Scope: prisma/schema.prisma (+migration 20260722115500), src/lib/storage.ts, src/lib/image/runware.ts, src/trigger/product-cutout.ts (new), src/app/actions/products.ts, src/trigger/generation-run.ts, src/lib/pipeline/cost-log.ts

Reasoning / RCA / research:
    - Owner ask: "remove bg once and reuse". Audit found NO bg removal anywhere in the pipeline today (cut-out paste was retired for premium in-scene), so this is a new capability, not an optimisation: raw product photos were going to image models as references, busy backgrounds and all.
    - One-time per image at upload (product-cutout task) beats per-run removal: paid once (~$0.004/image via Runware removeBackground, runware:109@1), cached forever in cutoutKey.
    - Cutouts are flattened onto white with sharp instead of shipping alpha: image models handle a clean studio packshot better than transparency, and it matches the e-comm listing look. Flattening locally (not Runware settings.rgba) keeps the behavior model-independent.
    - Generation prefers cutoutKey and falls back to the original photo when absent — a failed/missing cutout can never fail a paid run; the task is idempotent (only processes cutoutKey=null rows) so re-triggering is free.

Implementation summary:
    - ProductImage.cutoutKey (nullable) + removeBackground() in runware.ts (includeCost, retry-wrapped) + product-cutout task; triggered from createProduct, createProductInline, addProductImages.
    - generation-run: ConceptCtx gained refMime; primary + extra refs use cutout when present (mimeType then image/png).
    - Cost rows land in ApiCostLog under new source "cutout".

Follow-ups deferred:
    - Backfill for pre-existing product images (task triggers only on upload); trivial script when wanted.
    - AI-model photos not cutout — they're already studio shots.

### 2026-07-22 — Real-generation e2e (browser → live pipeline on cheap models) + staging branch flow with CI gates

- Type: build
- Scope: e2e/generation.spec.ts (new), scripts/seed-e2e-workspace.ts (new), .github/workflows/{ci.yml,e2e.yml} (new), GitHub branch protection (main, staging), 11 Actions secrets

Reasoning / RCA / research:
    - Chosen shape (owner-grilled): Playwright vs localhost with DEV_AUTH_BYPASS + a Trigger DEV worker inside the CI runner. Because the worker runs in-job, cheap-model env vars apply (MODEL_CONCEPTS/BRIEF_QA/RESEARCH=haiku, GEMINI_IMAGE_MODEL=NB2, IMAGE_PROVIDER=gemini forced) — the same runs against the prod Trigger deployment would use full-price models since env lives with the deployment. Hence the DEV TRIGGER_SECRET_KEY in CI, never the prod one.
    - Dedicated "E2E Tests" workspace (slug e2e-tests, id a15a9e76-…) seeded by cloning Blueman brand + one dissected apparel product + 10k credits from Synerix Apparel — rows only, storage keys shared. Spec pins it via sx-active-ws cookie; ws id is hardcoded (E2E_WORKSPACE_ID overridable) because Playwright's transpiler can't resolve the "@/" alias inside src/lib/db.ts (first run failed exactly there).
    - Paid spec is opt-in (E2E_REAL_GENERATION=1) so `npm run test:e2e` stays free locally; serial mode + workflow concurrency group because parallel suites would race the shared Trigger dev env and credits.
    - Branch flow per owner: feature PR → staging runs checks+e2e (both required); main requires PR + checks with enforce_admins=false so only the owner pushes direct (small fixes skip the e2e bill).
    - Known risk, accepted: a locally-running `npm run dev` session shares the Trigger dev env with CI and could steal its runs; if flaky, move CI to a Trigger preview branch env.

Implementation summary:
    - 2 tests: in-scene campaign + on-model plain, 1 option each (4 credits/suite), assert option thumbnail renders and no failure panel, 7-min test timeout.
    - Secrets set via gh CLI from .env.local (DB, Supabase, Anthropic, Google, Runware, auth, dev Trigger key). TRIGGER_ACCESS_TOKEN still missing — dashboard-minted only; deploy workflow was already blocked on it.

### 2026-07-22 — FAL_KEY purged: "remove Fal" resolved as an env-only ghost

- Type: chore
- Scope: .env.local, Vercel env (all environments)

Reasoning / RCA / research:
    - Owner asked to "keep only Runware and remove Fal". Zero Fal references exist in src or package.json — the image stack is Gemini-direct + OpenAI-direct + Runware, and stays that way (direct Gemini was spike-verified better for reference placement).
    - Fal existed only as an unused FAL_KEY env var locally and on Vercel; removed both so it can't mislead again.

- Type: bug (owner escalation — second correction on the same requirement)
- Scope: src/app/(app)/studio/[runId]/{page,studio-canvas}.tsx, src/app/(app)/library/{page,library-client}.tsx; deployed (vercel --prod + trigger v20260721.2, git untouched)

Reasoning / RCA / research:
    - Yesterday's fix gated the run-page footer and library USD on isSuperAdmin — but the OWNER is the super-admin, so he still saw "API cost $0.524 · 0.524/creative" on his own run page and read it as "not removed". His actual requirement was absolute: API spend appears ONLY in /admin/costs, never in the product UI, for anyone.
    - Removed outright: studio-canvas cost prop + footer, run-page cost pass-through (+ orphaned pipeline.cost type widening), library costUSD field/mapping/render. Re-swept with ZERO exclusions (usd|toFixed|api cost|$N|cost across (app)+(marketing)+components): every remaining hit is credits pricing, comments, or marketing prose.
    - Lesson (why the first fix missed): I translated "visible only to Super Admin" as a role gate; the owner meant surface separation (product UI vs admin console). When the requester IS the privileged role, a role gate changes nothing they can see — prefer removing the surface over gating it, and verify from the requester's own viewpoint.
    - Deployed via CLI working-tree deploy (no commit — owner hasn't said commit): Vercel prod aliased to www.synerix.in; trigger deploy v20260721.2 also ships yesterday's plain-mode/occasion prompt changes to the prod worker. Note: Vercel warns Node 20 deprecated for builds after 2026-10-01 — project setting should move to 24.x.

Follow-ups deferred:
    - Owner: commit+push when ready (retroactive-commit-history); bump Vercel project Node version to 24.x before October.

### 2026-07-22 — Product-only briefs allowed, model picker/bake-off UI removed, PLAIN on-model = strict e-commerce listing shots

- Type: feature/bug (owner feedback after first working prod runs)
- Scope: src/app/actions/generate.ts, src/app/(app)/studio/{create-form,page}.tsx, src/lib/pipeline/{concepts,image-prompt}.ts (+test), src/trigger/generation-run.ts

Reasoning / RCA / research:
    - (1) "Asking me to select an occasion": guided runs required occasion OR free text — but a selected product is already a complete brief (assembleOccasionBrief emits brand+product blocks with festival/custom both null-safe). Validation now blocks only when product AND occasion AND brief are ALL absent; the form's brief label/placeholder go "(optional)" whenever a product is selected (briefOptional = hasOccasion || product).
    - (2) Image-model picker (NB Pro / GPT Image 2 / compare) + super-admin bake-off toggle removed from the create form — owner ruled them dev-testing tools, not product. UI-only removal: the server keeps imageModelPref (schema default "nb-pro" applies when the field isn't posted), variantsForPref, bake-off handling and the run-page compare display, so legacy compare/bake-off runs still render and the machinery can return behind an admin surface later. isSuperAdmin prop dropped from CreateForm (bake-off button was its only consumer).
    - (3) "Selected plain image but got extra models on a rooftop": PLAIN only affected the OVERLAY stage (skip logo/text) — concepts still authored campaign scenes. Owner intent for apparel: e-commerce product-page shots varying ONLY pose. Fixed at both layers: generateConcepts gains onModelPlain (concepts must be seamless-studio listing shots differing only by pose/angle/crop/backdrop tone; occasion may flavour copy, never the photograph) and buildOnModelPrompt gains plain (STRICT E-COMMERCE SHOWCASE tail appended AFTER the scene body, explicitly overriding it, so even a stray concept can't ship a location scene). Also hardened ON_MODEL_FRAMING for ALL on-model runs: "exactly ONE person in the entire frame" (the extra-models failure). Direct+on-model inherits via generatePlate.
    - Verified live (zero-debit run c2d3b8b3, dev worker, prod DB): ON_MODEL + PLAIN + NO occasion + NO brief → COMPLETE; concept self-named "Bisque On-Model Listing"; final image inspected: one model, exact bisque tunic, seamless studio backdrop, no props/people/text. tsc 0, eslint 0, 58/58 vitest (2 new prompt tests).

Follow-ups deferred:
    - Prompt changes live in the WORKER bundle — prod needs `npx trigger.dev@4.5.0 deploy` (+ Vercel deploy for form/action) when the owner ships; not deployed this session (no instruction).

### 2026-07-21 — Deployed runs die on "Node.js 21 detected without native WebSocket support": worker runtime → node-22

- Type: bug
- Scope: trigger.config.ts (runtime), deployed as Trigger.dev prod version 20260721.1

Reasoning / RCA / research:
    - After the TRIGGER_SECRET_KEY fix let runs finally ENQUEUE in prod, the first run to actually execute failed instantly: "Node.js 21 detected without native WebSocket support … install 'ws' … RealtimeClient. Your credits were refunded." (screenshot, ws "Blueman", run d65e183a).
    - Not our code: `grep` for subscribeToRun/RealtimeClient/streams/triggerAndWait across src/trigger + src/lib returns NOTHING. The RealtimeClient is the Trigger.dev worker's OWN coordination client (heartbeats/cancellation/metadata), which the SDK opens over a WebSocket on every run. Node < 22 has no global WebSocket, so the worker dies before our run() body executes; the task's failure path refunds credits (why the message says "refunded").
    - Decisive tell: the error names "Node.js 21", not 20. Vercel runs the app on Node 20; Trigger's worker on `runtime: "node"` resolves to Node 21. So the failure is the deployed WORKER, not the web app — which also explains why it never reproduced locally (host + `trigger.dev dev` run on Node 22.22, which HAS native WebSocket) nor in the earlier scripted verification runs (same Node-22 host). Prod was the first Node-21 execution.
    - Fix: `runtime: "node-22"` (valid values: node | node-22 | bun) → native global WebSocket present. The error's alternative ("install ws + pass transport") is only reachable when YOU construct RealtimeClient; the worker's internal client takes no injected transport, so the runtime bump is the only real fix. Deployed via `npx trigger.dev@4.5.0 deploy` (CLI pinned to the installed 4.5.0 SDK — @latest 4.5.6 aborts on version mismatch): "Version 20260721.1 deployed with 6 detected tasks".

Follow-ups deferred:
    - None. node-22 is the current recommended default; revisit only if a task needs a newer LTS.

### 2026-07-21 — Prod "Generation service is unavailable" RCA: preview-scoped Trigger key on Vercel (config, not code) + workspace-admin label disambiguation

- Type: bug (config) + docs-in-UI
- Scope: src/app/(app)/settings/settings-client.tsx (label only); Vercel project `synerix` env (user action)

Reasoning / RCA / research:
    - User screenshot (2026-07-20, ws "Synerix Apparel", ON_MODEL + NB Pro): "Generation service is unavailable right now — your credits were not spent." That string fires ONLY on the tasks.trigger enqueue catch in src/app/actions/generate.ts:200 — the run never reached the queue, so no image model/fallback was ever involved.
    - DB confirmed 3 FAILED runs 15:07–15:17 UTC, all `Queue failed: No matching branch env`. Trigger.dev v4 docs: that error means the SDK authenticated with a PREVIEW-scoped secret key (`tr_preview_…`) whose branch has no deployed preview env. Vercel `synerix` has a single TRIGGER_SECRET_KEY shared across Preview+Production (created ~2026-07-13) — production is running on a preview key. Fix is config: set the `tr_prod_` key (Trigger dashboard → API keys → prod) on Vercel Production and redeploy. Not fixable in code; refund path worked as designed (credits untouched).
    - Provider-fallback requirement re-verified, already implemented in the 2026-07-16 chain rework: single model picks are soft-prefer with the full quality-first cascade behind them (NB Pro → GPT Image 2 → NB 2 → Seedream, resolveSceneChain + 7 tests); compare/bake-off stay hard-forced deliberately (comparison integrity, failed slots refund). No code change needed.
    - Correction (same session, user pointed at in-app surfaces): the first audit only swept the admin console — two USD leaks existed INSIDE the workspace UI: the run page footer ("API cost $…", studio-canvas.tsx via studio/[runId]/page.tsx) and the library run rows ("$X.XX", library-client.tsx via library/page.tsx). Both now gated on isSuperAdmin at the SERVER component (the number never reaches the client payload for customers); credits displays untouched (that's customer-facing pricing). Lesson: "cost visible only to super admin" means auditing every render of pipeline.cost, not just the pages named "costs".
    - Cost-visibility audit: all cost UI lives only under src/app/(admin)/ whose layout calls requireSuperAdmin() (email allowlist via isSuperAdminEmail — never derived from MembershipRole); all /api/admin routes + admin actions individually guarded. Workspace ADMIN role grants member management only (MANAGER_ROLES in actions/workspace.ts); OWNER/super-admin never assignable via invite (parseRole whitelist). Separation was already correct — only ambiguity was the invite dropdown label "Admin", renamed to "Workspace admin" with a comment pinning the distinction.

Follow-ups deferred:
    - User: swap Vercel Production TRIGGER_SECRET_KEY to the tr_prod_ key + redeploy; optionally give Preview its own tr_preview key with TRIGGER_PREVIEW_BRANCH.

### 2026-07-16 — Visual audit of every app page (live browser) + grid/whitespace/image-expiry fixes

- Type: bug
- Scope: src/app/(app)/{products,models,dashboard,brand,studio}/page.tsx, studio/create-form.tsx, src/lib/storage.ts

Reasoning / RCA / research:
    - Walked every route at localhost:6969 with Playwright (screenshots + console + network) after user reported bad spacing, inconsistent components, broken images and slow navigation.
    - Product-card whitespace root cause: CSS `aspect-ratio` is only a PREFERRED size — a tall phone photo forces the wrapper past 1:1 (min-content), the tallest card stretches the whole grid row, siblings get slabs of dead space. Fix: `relative + overflow-hidden` wrapper with `absolute inset-0` img (products + models grids).
    - Dashboard dead space: `auto-rows-fr` forced every row to the tallest card (the custom-CTA tile). Removed + compacted the tile.
    - "Images not loading sometimes" root cause: signed URLs minted for 3600s but unstable_cache revalidates at 3300s AND serves stale entries while revalidating — browsers could receive already-expired signatures. Fix: sign for expiry + margin (2× cache window + 1h) so any cache-served URL is always valid.
    - Perf: warm client-side nav measured 54–218ms — perceived slowness is dev-mode first-visit route compilation (2–4s once per route per dev-server start; absent in production) plus full-res images. Studio product picker was loading full-res uploads for 150px tiles → switched to 400px transform thumbs (grids elsewhere already used thumbs).
    - Cosmetics: brand-kit colors were full-width native color bars → compact swatch + hex; "price: unknown" leaked into Positioning card → hidden when unknown; custom-pose raw <input> → shadcn Input. Noted: the black bottom-left circle is the Next.js dev-tools button (dev only, not shipped); logo-corner is already a shadcn Select.
    - Verified: fresh screenshots confirm uniform grids and compact dashboard; tsc clean, eslint 0 problems, 56/56 vitest, 11/11 Playwright.

Follow-ups deferred:
    - Duplicate "Annved Millet Laddu" product is data (added twice), not UI. Row-2 dashboard cards still match the custom tile's height (acceptable). Editor page not visually walked (no creative in dev workspace) — code-audited earlier instead.

### 2026-07-16 — First production Trigger.dev deploy + automatic worker env sync

- Type: build
- Scope: trigger.config.ts

Reasoning / RCA / research:
    - First real deploy attempt failed at task indexing: "DATABASE_URL is not set" in all six tasks. The Trigger.dev worker env is a THIRD environment — separate from Vercel and from local .env — and its variables live in the Trigger dashboard, which had none.
    - Chose the syncEnvVars build extension over manual dashboard entry: deploys push the current values automatically, so key rotation is a redeploy, not a dashboard chore. Guarded to only sync vars non-empty in the deploying environment, so a CI deploy without secrets can never blank the dashboard values.
    - Sync list deliberately excludes app-only vars (AUTH_*, GMAIL_*, DEV_AUTH_BYPASS) — the worker has no business holding them.

Implementation summary:
    - trigger.config.ts: dotenv load + WORKER_ENV_VARS allowlist (DB, Supabase storage, AI provider keys, Sentry) + syncEnvVars extension.
    - Deployed: version 20260715.2, 6 tasks detected, 10 env vars synced (user-authorized deploy).

Follow-ups deferred:
    - CI auto-deploy still needs the TRIGGER_ACCESS_TOKEN repo secret (user-side). Vercel needs a redeploy to pick up the newly added TRIGGER_SECRET_KEY.

### 2026-07-16 — Verification-round fixes: conditional terminal writes, reconciled run refunds, text/plain escape leak, healer resurrection

- Type: bug
- Scope: src/trigger/{generation-run,brand-ingest}.ts, src/app/actions/generate.ts, src/app/api/{send-test-report,send-enquiry}/route.ts, src/lib/rate-limit.ts

Reasoning / RCA / research:
    - Adversarially re-reviewed the productionize fixes themselves; four gaps confirmed, all in the interaction between healers, workers and refunds.
    - Free-generation cascade: generation-run's finalize wrote COMPLETE/FAILED unconditionally and refunded via plain grantCredits. A queue-delayed run (startedAt is set at ENQUEUE) could be healed+refunded by the studio stall-healer mid-execution, then the worker resurrected it to COMPLETE → refund AND creatives. All terminal writes are now conditional updateMany (status notIn terminal; loser no-ops) and every run refund routes through reconcileRunRefund so concurrent refunders converge.
    - Ghost-enqueue ordering: the action's catch refunded BEFORE marking FAILED — a worker picking up the accepted-but-timed-out enqueue in that gap passed the guard. Status write now lands first.
    - Same resurrection bug in brand-ingest: its first status write was unconditional, so a healed-FAILED brand got flipped back to CRAWLING and a user retry produced two interleaved ingests on one brand row. First write is now a conditional PENDING→CRAWLING claim; 0 rows = stale run, bail (safe: task has retry maxAttempts 1).
    - escapeHtml at the mail-route call sites leaked entities into the text/plain email parts ("Johnson &amp;amp; Sons", broken mailto: links — fires on legitimate names). Generators now take raw values and escape internally for the HTML part only; text templates use raw.
    - rate-limit: with no resolvable client IP (bare `next start`, no proxy) all visitors shared the "unknown" bucket — a 3/hour route bricked site-wide after 3 requests. Fails open on unknown (never occurs on Vercel, where x-real-ip is platform-set).
    - Verified: tsc clean, eslint 0 problems, 56/56 vitest, 11/11 Playwright, next build clean, trigger dry-run builds.

Follow-ups deferred:
    - recompositeAll same-nextIndex storage-key overwrite on concurrent edits (pre-existing, needs per-creative serialization or run-scoped keys). catchError may still write PARTIAL over a healer's FAILED (money-safe via reconciliation; cosmetic status disagreement).

### 2026-07-16 — Productionize pass: security hardening, race fixes, stall healer, dead-code/dep/doc cleanup

- Type: build
- Scope: src/lib/{rate-limit,html,credits}.ts, src/app/api/{send-test-report,send-enquiry,test,brand-status}/route.ts, src/app/actions/{auth,admin,brand}.ts, src/lib/editor/paid-edits.ts, src/lib/composition/render.ts, package.json, README.md, CONTEXT.md, .env.example (new), prisma/schema.prisma (comments)

Reasoning / RCA / research:
    - Three parallel audits (security sentinel, slop/config sweep, correctness reviewer). Auth core came back clean: workspace scoping/IDOR, admin gating, storage, secrets, DEV_AUTH_BYPASS fail-closed all verified. Issues clustered in the public marketing endpoints and in read-then-write DB patterns.
    - Security: clientIp() trusted the LEFTMOST x-forwarded-for (spoofable per request → every public rate limit bypassable, incl. the Gemini chat endpoint) — now prefers platform-set x-real-ip, falls back to the RIGHTMOST XFF hop. User input was interpolated raw into outbound email HTML (phishing-payload injection via businessName etc.) — escapeHtml() applied at the two mail routes; schema length caps added. /api/test served inactive tests; signInWithGoogle allowed protocol-relative "//" redirect targets.
    - Correctness: reconcileRunRefund's aggregate ran before any row lock (concurrent catchError + stall-healer could double-refund) — a no-op increment upsert now takes the workspace row lock first. adminGrantCredits' negative path was a read-then-write-absolute lost-update — now a guarded conditional decrement like debitCredits. recompositeAll could half-commit render rows when one aspect failed — DB writes now in one transaction after all composites/uploads. Brand ingest could strand PENDING forever (unhandled enqueue + no healer) — enqueue try/catch + 15-min stall healer in /api/brand-status. fitText measured without letter-spacing while drawing with it — spacing now set before measuring.
    - Slop/config: removed dead deps (exa-js, culori+types, @supabase/ssr) and dead files (pipeline/cutout.ts, ui/{avatar,toggle-group,tooltip}.tsx — zero callers verified). LESSON: the sweep flagged `shadcn` as dead but globals.css imports "shadcn/tailwind.css" — grep-for-imports must include CSS; caught by the build gate and restored. Debug console.logs stripped from mail routes. README fixed (port 6969, single dev command, .env.example reference); .env.example created (names only); dangling legacy/ references removed; CONTEXT.md quality-stance section rewritten (automated QA now exists).
    - Verified: tsc clean, eslint 0 problems, 56/56 vitest, 11/11 Playwright, next build clean, trigger deploy --dry-run builds.

Follow-ups deferred:
    - Unauthenticated mail endpoints still send to caller-chosen recipients (product requirement for the lead-gen report; mitigated by real-IP rate limit + escaping). In-memory rate limiter is per-instance (documented; Upstash if traffic grows). Editor-edit hard-loss refunds and renderNewAspect double-submit are narrow residual races (logged by audit, low frequency) — candidates for a later pass.

### 2026-07-16 — Adversarial-review fixes: ghost-enqueue guard, model-QA pass rule, cap-safe prompt guards, chain poisoning

- Type: bug
- Scope: src/trigger/generation-run.ts, src/lib/pipeline/{model-qa,pack-qa,image-prompt}.ts (+test), src/app/actions/generate.ts

Reasoning / RCA / research:
    - Adversarial review of today's diff surfaced six concrete failure scenarios; all fixed same-session.
    - Ghost enqueue: tasks.trigger can throw client-side AFTER the API accepted the run → the action refunds + marks FAILED, but the task would still execute → free generation. Fixed with a terminal-status guard at task entry (skips FAILED/COMPLETE/PARTIAL runs).
    - model-qa's pass rule was copied from pack-qa (`!packVisible ||` is legit for lifestyle scenes) but inverted this mode's promise: a render with NO model at all passed QA. Now modelVisible=false is a hard fail.
    - The "always appended" guard blocks were appended LAST before `.slice(cap)` — an oversized enhancer imagePrompt truncated exactly the guards. New joinCapped() truncates only the scene body; head fidelity + tail floors survive by construction (tested).
    - updatePipeline's module-level promise chain had no rejection reset — one transient DB error would poison every later pipeline write in the warm worker. Chain now absorbs rejections (callers still see their own); degraded-marker writes in fail-open catches are additionally .catch()ed so a marker can never fail the run it describes.
    - pack-QA on lifestyle-scale packs: illegible-at-distance label text no longer counts as failure (kills a persistent retry-burn loop after QA expanded to all product renders).
    - ON_MODEL with a missing garment/model reference silently downgraded to a model-less render; now a hard task error, plus action-level validation (garment must have ≥1 photo). Direct-mode fidelity verdicts are now persisted (were discarded).
    - Verified: tsc clean, 56/56 vitest, 11/11 Playwright, trigger deploy --dry-run builds.

### 2026-07-16 — App UI error-surfacing fixes from polish audit

- Type: bug
- Scope: src/app/(app)/models/models-client.tsx + models/page.tsx, studio/create-form.tsx, onboarding/wizard.tsx, studio/[runId]/{page,studio-canvas}.tsx, src/components/app-nav.tsx

Reasoning / RCA / research:
    - Full app-UI audit (subagent) rated the app high-polish but flagged error-surfacing inconsistencies rather than missing states. Fixed the defects; left the larger "toast vs inline" unification and segmented-control/pager dedupe for a dedicated pass (they are consistency refinements, not bugs).
    - Onboarding poll was the one real hazard: the 2.5s interval body had no try/catch, so one transient fetch failure became an unhandled rejection and the wizard span forever.

Implementation summary:
    - models-client: killed the double error surface (toast + inline for the same error → inline only, matching the form's other errors).
    - create-form: Enhance-prompt failures now toast instead of landing in the far-away summary-column error slot.
    - onboarding wizard: poll tick wrapped in try/catch (skip tick, retry next).
    - models grid: READY-but-thumbless tile now says "Preview unavailable" instead of a blank box.
    - Dead code: unused conceptNames prop (studio-canvas + page), vestigial desktopNav alias (app-nav).
    - Verified: tsc clean, 54/54 vitest, 11/11 Playwright.

### 2026-07-16 — On-model photoshoot direction system + identity/garment QA; quality floors restored on every prompt path

- Type: feature
- Scope: src/lib/pipeline/image-prompt.ts (+test), src/lib/pipeline/model-qa.ts (new), src/lib/pipeline/validate-concepts.ts, src/trigger/generation-run.ts

Reasoning / RCA / research:
    - Pipeline audit found the three account types (FMCG / fashion-editorial / regular apparel) barely differ in code: WorkspaceType branched exactly one brief paragraph, and the on-model FASHION_EDITORIAL styling block was dead (gated on `!imagePrompt`, which real concepts always have). Regular apparel shops had NO clean-showcase mode at all — every on-model shot got whatever lifestyle scene the concept LLM invented.
    - On-model had no post-render QA while EXACT_PRODUCT had pack-QA — yet identity drift (face not matching the chosen AI model) and garment restyling are this mode's exact equivalents of a mangled label.
    - buildScenePassPrompt ("trust-the-brief") had dropped the QUALITY floor and per-aspect SAFE_ZONES; since the enhancer is fail-open, an enhancer outage shipped completely unguarded plates. The concept prompt is also aspect-agnostic, so per-aspect safe zones can only come from code.
    - Direct mode + ON_MODEL was a straight bug: processDirect never passed the model reference, so "my exact scene with my chosen model" rendered a random person.
    - Considered making direction a per-run user choice; rejected for now — workspace type already encodes what the account sells (editorial vs catalog), zero extra UI. Per-run override can layer on later.

Implementation summary:
    - image-prompt.ts: `OnModelDirection` ("editorial" | "catalog") with two always-appended PHOTOSHOOT DIRECTION blocks (85-105mm editorial campaign craft vs garment-hero clean showcase); QUALITY + SAFE_ZONES now always-on for on-model AND scene-pass prompts; dead `buildScenePrompt`/`usageGuard`/`PlatePromptOpts`/composite branch deleted; header rewritten.
    - model-qa.ts (new): vision judge (identityMatch + garmentFaithful + singleFigure) mirroring pack-qa, fail-open. generation-run.ts: `ensureOnModelFidelity` retry loop (shares PACK_QA_MAX_RETRIES), verdict rides along as renamed `fidelityQa`.
    - generation-run.ts: workspace type fetched once → `ctx.onModelDirection`; pack-QA extended from EXACT_PRODUCT-only to EVERY product render (quality over cost per owner directive); direct+ON_MODEL routed through generatePlate via pseudo-concept; brief-QA/enhancer fail-open now records `pipeline.degraded` markers.
    - validate-concepts.ts: added check 7 (OCCASION MISSING) — festival briefs whose scene reads generic get flagged/repaired.
    - Verified: tsc clean, 54/54 vitest (9 new prompt-contract tests).

Follow-ups deferred:
    - Per-run direction override UI; curated pose presets for clean-showcase; processConcept/processDirect share more plumbing than ideal (dedupe later, not broken).

### 2026-07-16 — Playwright e2e suite (zero AI spend) against dev-bypass auth

- Type: build
- Scope: playwright.config.ts (new), e2e/*.spec.ts (new), package.json (test:e2e), .gitignore

Reasoning / RCA / research:
    - Goal: e2e coverage without paying image/LLM providers per run. Solution: specs only exercise navigation, auth gating and validation paths that return before any provider call; DEV_AUTH_BYPASS=1 supplies a seeded user/workspace so no Google OAuth in tests.
    - Learned: the dev-bypass user is a super-admin, so bare app routes redirect to /admin unless the sx-admin-acting=1 cookie is set — specs assert the redirect AND test the workspace view with the cookie (mirrors the real "enter workspace" action).

Implementation summary:
    - playwright.config.ts: chromium, baseURL localhost:6969, webServer reuses a running dev server locally.
    - e2e/marketing.spec.ts (4: pages render, zero pageerrors, no em-dashes) + e2e/app.spec.ts (7: admin redirect, dashboard/studio/settings/library/models/calendar). 11/11 passing.

Follow-ups deferred:
    - CI e2e needs a database story (local postgres service or dedicated test DB) — currently a local-only suite. Generation-flow e2e with a mocked provider layer.

### 2026-07-16 — Production "generate → something went wrong" RCA: Trigger tasks never deployed; hardened enqueue path

- Type: bug
- Scope: .github/workflows/trigger-deploy.yml, src/app/actions/generate.ts

Reasoning / RCA / research:
    - Every "Deploy Trigger.dev tasks" GitHub Action run failed at `npm ci`: postinstall `prisma generate` loads prisma.config.ts, which hard-requires `DIRECT_URL` (PrismaConfigEnvError) — CI has no env vars.
    - Compounding: `gh secret list` is empty — TRIGGER_ACCESS_TOKEN was never added, so the deploy step would have failed anyway. Net effect: production Trigger env has no deployed tasks, so `tasks.trigger("generation-run")` throws in the server action → Next.js generic "something went wrong" page. Credits already debited were not refunded.
    - Also flagged: .env.local carries a `tr_dev_` key; Vercel Production must carry the `tr_prod_` secret key or triggers land in the (offline) dev env and queue forever.
    - Considered making prisma.config.ts fall back to a default URL; rejected — a silent fallback could mask a real misconfig in prod migrations. A placeholder env var scoped to CI is explicit and local to the workflow.

Implementation summary:
    - Workflow: job-level `DIRECT_URL` placeholder (prisma generate never connects; it only needs the var resolvable).
    - generate.ts: wrapped `tasks.trigger` in try/catch — on enqueue failure, idempotent refund via `reconcileRunRefund`, run marked FAILED with the queue error, and a clear user-facing message returned (mirrors the existing pattern in actions/editor.ts). Client (create-form.tsx) already renders `{error}` returns.
    - Verified: tsc clean, 49/49 vitest, `trigger.dev deploy --dry-run` builds the bundle successfully.

Follow-ups deferred:
    - Actual prod deploy of tasks is permission-gated (user must run/approve `npx trigger.dev@4.5.0 deploy` or add TRIGGER_ACCESS_TOKEN + push). Vercel env verification blocked until `vercel login`.

### 2026-07-12 — Base UI dropdown crash fix + admin workspace rename + invite flow hardening (expiry + resend)

- Type: bug + feature
- Scope: src/components/ui/dropdown-menu.tsx usage in src/components/app-nav.tsx (crash); src/app/actions/admin.ts + src/app/(admin)/admin/{workspace-actions,page}.tsx (rename); prisma/schema.prisma + migration 20260712174006 (invite expiry); src/app/actions/workspace.ts + src/lib/auth.ts + src/app/(app)/settings/{page,settings-client}.tsx (invite expiry/resend UI)

Reasoning / RCA / research:
- CRASH: `DropdownMenuLabel` (Base UI `Menu.GroupLabel`) threw "MenuGroupContext is missing" because Base UI requires GroupLabel to sit inside a `Menu.Group` — unlike Radix, which allowed a bare label. The workspace-switcher dropdown in app-nav placed the label directly in the content. Fix: wrap label + items in `<DropdownMenuGroup>` at the one call site (grep confirmed app-nav is the only consumer), leaving the shadcn/base wrapper component untouched so every future dropdown keeps the same API.
- INVITE FLOW — link vs code decision: kept the existing email-match auto-accept (no token, no code). Google OAuth already proves the invitee controls the invited email on sign-in, which is strictly stronger than emailing a code (a code proves the same thing but adds a step). A 5-10 min code is wrong for invites specifically: recipients open invite emails hours/days later, so a short window means chronic "code expired" friction — short codes belong to login/2FA where the user is actively waiting. Added instead a generous `expiresAt` (14 days, nullable) so PENDING invites don't linger open forever and there's a concrete validity answer; legacy null rows never expire. `ensureMembership` now filters expired invites (`expiresAt null OR > now`).
- RESEND: now that invite emails actually send (src/lib/email.ts, prior entry), added a `resendInvite` action + Send-icon button in Settings that re-mails and refreshes the 14-day window.
- ADMIN RENAME: `adminRenameWorkspace(id, name)` (super-admin, by id — mirrors the active-workspace-only renameWorkspace in workspace.ts) + a pencil-icon RenameWorkspaceDialog on each admin workspace card. Card now shows the internal workspace name (was only shown when no brand existed) so the admin can see what they're renaming vs the customer-facing brand name.
- EMAIL: no new wiring needed — src/lib/email.ts already uses the identical Gmail SMTP transport (GMAIL_USERNAME/GMAIL_PASSWORD → sends from consulting.synerix@gmail.com) as the existing send-enquiry / send-test-report routes, so invites already go out from the same sender. Left those routes untouched (working) rather than refactoring for DRY.

Implementation summary:
- Migration 20260712174006_workspace_invite_expiry: single additive nullable column `workspace_invites.expiresAt` (verified SQL — no data risk).
- Verified: tsc clean, 49/49 vitest, eslint clean on changed files (2 pre-existing avatar `<img>` warnings in settings-client untouched).

Follow-ups deferred:
- Invite expiry has no background sweep — expired PENDING rows just stop auto-accepting and can be resent; a cron to mark them EXPIRED is cosmetic, skipped.

### 2026-07-12 — Fixed Trigger.dev CLI/package version mismatch + CI deploy workflow

- Type: build
- Scope: package.json (@trigger.dev/sdk, @trigger.dev/build, @trigger.dev/react-hooks, trigger.dev — all exact-pinned to 4.5.0), .github/workflows/trigger-deploy.yml (new)

Reasoning / RCA / research:
- `npx trigger.dev deploy` and `dev` both failed: "installed @trigger.dev/build (4.5.0) is newer than your CLI (4.4.6)". Root cause: an earlier session exact-pinned the CLI (`trigger.dev`) to 4.4.6 to fix a different mismatch, but left `@trigger.dev/build` on a caret range (`^4.4.6`) — a routine `npm install` let build drift to 4.5.0 while the CLI stayed frozen, recreating the exact class of bug the exact-pin was meant to prevent.
- Fix: exact-pin ALL FOUR trigger.dev packages (sdk, build, react-hooks, CLI) to the same version (4.5.0, the true npm-registry latest — the CLI's self-reported "4.5.3" is served from Trigger.dev's own update-check API, not on the npm registry, so it isn't installable). No carets on any of the four going forward, so they can only move in lockstep via an explicit version bump.
- `npm install` surfaced 5 new transitive postinstall scripts (@prisma/engines, @sentry/cli, fsevents, msw, prisma) blocked by npm's allow-scripts gate. Approved all five: legitimate transitive deps of packages already in use (prisma, @sentry/nextjs) or standard optional/dev tooling (fsevents, msw from trigger.dev's own tree), not attacker-controlled additions.
- CI: added a GitHub Actions workflow that deploys Trigger.dev tasks on push to main. Vercel deploy deliberately left OUT of the workflow — owner confirmed the repo is already Vercel-git-connected, so a parallel Actions-based Vercel deploy would just double-deploy every push.

Implementation summary:
- package.json: 4 trigger.dev packages exact-pinned to 4.5.0; allowScripts gained the 5 new entries.
- .github/workflows/trigger-deploy.yml: checkout → setup-node@22 → npm ci → `npx trigger.dev@4.5.0 deploy` (version pinned to match package.json, same fix rationale as above) with `TRIGGER_ACCESS_TOKEN` from repo secrets.
- Verified: tsc clean, 49/49 vitest, `trigger --version` reports 4.5.0 matching all four packages.

Follow-ups deferred:
- `TRIGGER_ACCESS_TOKEN` GitHub repo secret must be added by the owner (personal access token from the Trigger.dev dashboard, distinct from the runtime TRIGGER_SECRET_KEY) — the workflow will fail auth until then.

### 2026-07-12 — Pinned local dev port to 6969 for deterministic Google OAuth

- Type: build
- Scope: package.json (dev:next), .env.local (AUTH_URL)

Reasoning / RCA / research:
- `next dev` auto-increments the port when 3000 is busy (seen firsthand: 3003 during an earlier smoke test), which silently breaks Google OAuth in dev since the redirect URI registered in Google Cloud Console is a fixed port. Pinning the port makes the registered redirect URI always valid.
- Also set `AUTH_URL` explicitly rather than relying on Auth.js's header-inferred host: NextAuth v5 trusts request headers for the callback origin in dev, which is usually fine on one fixed port, but pinning `AUTH_URL` removes any ambiguity (e.g. hitting the app via `127.0.0.1` instead of `localhost` would otherwise mint a different implicit origin and mismatch the registered redirect URI).

Implementation summary:
- `dev:next` → `next dev --turbopack -p 6969` (dev:trigger and the concurrently-wrapped `dev` script pick this up unchanged).
- `.env.local`: added `AUTH_URL="http://localhost:6969"` next to `AUTH_SECRET`.
- Verified: 8s smoke run confirms Next binds to `http://localhost:6969`.

### 2026-07-11 — Launch DB executed: migration applied, 39 creatives soft-deleted, 3 typed workspaces created

- Type: chore
- Scope: prisma/migrations/20260710203203_workspace_type_and_creative_soft_delete, scripts/setup-launch-workspaces.ts (--owner flag added), production Supabase DB

Reasoning / RCA / research:
- Executes the pending DB half of the "Three customer account types" entry below, on explicit owner confirmation (twice: once for migration+dry-run, once for --apply).
- Dry run surfaced that the super-admin user (consulting.synerix@gmail.com) does not exist yet (Google auth keys pending), so the script gained an `--owner <email>` override. Owner chose to apply with dev@synerix.local — ownership is cosmetic because super-admin god-view reaches every workspace regardless.
- Script needed a dynamic `import("../src/lib/db")`: static imports hoist above dotenv config() and db.ts throws on missing DATABASE_URL at module load.

Implementation summary:
- Migration `workspace_type_and_creative_soft_delete` applied (enum WorkspaceType, workspaces.type default FMCG_PRODUCT, creatives.deletedAt).
- 39 creatives soft-deleted (timestamp only; storage untouched, reversible). Created: FMCG Creative Studio (e0c81f01…), Apparel Studio (fbe213c6…), Fashion Editorial Studio (f69e4bef…), each 0 credits, OWNER membership for dev user.
- Remaining owner ops: add GOOGLE_* + GMAIL_* + GOOGLE_GENERATIVE_AI_API_KEY envs, sign in once as the super-admin, grant credits, set up brands, invite customers, `npx trigger.dev deploy`.

### 2026-07-11 — Marketing site polish: truthful Studio copy, zero em-dashes, design-taste hard rules

- Type: refactor
- Scope: src/app/(marketing)/{page,layout,synerix-studio/page,consulting/page,tests/business-health/page,tests/business-health/wizard}.tsx, src/components/marketing/enquiry-form.tsx

Reasoning / RCA / research:
- Redesign-preserve mode (owner choice): ink-navy + cyan + Fraunces identity kept (existing brand tokens; the design skill's serif ban yields to preserve-mode brand material). Dials read as VARIANCE 6 / MOTION 4 / DENSITY 4; structure evolved, not rebuilt.
- TRUTH fixes were the core: Studio page claimed "typography set into the image" / "headlines placed inside the scene" — the product is overlay-first (crisp composited text layers; that's WHY Devanagari/Gurmukhi are always spelled right and edits are free). Also "workspace created instantly on sign-in" contradicted the new invite-only auth; the Getting-started card now describes request → we set up → invite → sign in. Verified before shipping: 45 festivals (fixtures), 2 credits = 1 creative (CREDIT_COSTS), refund-on-failure (ledger), 4 languages.
- Em-dash purge: every user-facing — and – rewritten (commas, colons, periods, sentence splits), not mechanically swapped; grep over the marketing tree returns zero.
- Design-skill hard rules applied: eyebrow rationing (home/studio/consulting each went 6 → 2, right-floating section labels deleted, headlines carry sections); hero stack cut to 4 elements (home stats strip → own band below hero; studio language strip → typography bento cell); CTA intent dedup (studio unified 3 access labels to "Request access"; health-check CTAs share one label; consulting hero anchors to #enquiry instead of a second mailto); studio's 6 equal white feature cards → 6-cell bento with varied surfaces (ink cell for the signature typography capability, cyan-tint calendar cell).
- Deliberately NOT changed (preserve rules): route slugs, nav labels, section order, fonts, palette, footer, the ink/paper/navy section rhythm.

Implementation summary:
- Verified: tsc clean, eslint clean, 49/49 vitest, `next build` succeeds with all marketing routes.

Follow-ups deferred:
- No real photography/product screenshots added — no approved assets on hand; the typographic ink-hero is existing brand language. Revisit when real Studio output screenshots are approved for the site.

### 2026-07-11 — Marketing chat assistant: /api/chat (Gemini via AI SDK) + floating widget

- Type: feature
- Scope: src/app/api/chat/route.ts, src/lib/bot-knowledge.ts, src/components/marketing/chat-widget.tsx, src/app/(marketing)/layout.tsx

Reasoning / RCA / research:
    - Public marketing site gets a scope-locked AI assistant answering only Synerix/Studio questions; everything else is refused by system prompt.
    - Chose `streamText` + `result.toTextStreamResponse()` (plain text stream) over `toUIMessageStreamResponse`: the client is hand-rolled (no @ai-sdk/react on marketing pages), and a raw text-delta reader is simpler and sufficient — no tool calls or structured parts to transport.
    - Knowledge lives in a single const (src/lib/bot-knowledge.ts) embedded server-side in the system prompt; model instructed to answer strictly from it, never invent prices/offers.
    - Guardrails: zod body validation (user/assistant roles only — "system"/"tool" rejected 400; ≤12 msgs, ≤1200 chars each, ≤16KB body), reused in-memory rateLimit() 10 req/min per IP (429), maxOutputTokens 500, temperature 0.4, no tools, 503 JSON when GOOGLE_GENERATIVE_AI_API_KEY missing so deploys without the key don't crash.
    - Widget is a client component mounted once in the (marketing) layout (server layout stays server); mk-* tokens keep it on the ink/cyan marketing palette; mobile renders as a bottom sheet.

Implementation summary:
    - New route with `export const maxDuration = 30`; new BOT_KNOWLEDGE const; new ChatWidget (launcher + panel, streaming via fetch + ReadableStream reader, Enter/Shift+Enter, ESC close, auto-scroll, typing dots, error + retry hint, history capped at last 12 turns client-side).
    - Verified: `npx tsc --noEmit` clean, `npx eslint` clean on changed files, `npm test` 49/49 green.

Follow-ups deferred:
    - Rate limiter is per-instance (documented in rate-limit.ts); swap for a shared store if traffic grows.
    - No streaming abort button in the UI; ESC/refresh aborts via AbortController.

### 2026-07-11 — Invite-only auth: no self-serve signup, /request-access screen, invite emails

- Type: feature
- Scope: src/lib/auth.ts (ensureMembership), src/app/(auth)/request-access/page.tsx (new), src/app/(auth)/login/login-form.tsx (caption), src/lib/email.ts (new), src/app/actions/workspace.ts (inviteMember), src/app/(app)/settings/settings-client.tsx (invite toast)

Reasoning / RCA / research:
- Owner directive: login-only for launch — access is granted by invitation, never by signing up. Previously ANY Google sign-in auto-created a personal workspace.
- Chose "authenticate, then gate" over rejecting unknown emails in the NextAuth signIn callback: the session exists, so /request-access can show WHO is signed in and offer a clean contact path; the callback approach surfaces NextAuth's ugly error redirect and needs a custom error page. Gate lives in ensureMembership (the single bootstrap point) → redirect("/request-access") when no membership and no PENDING invite. Super-admin keeps the workspace bootstrap (fresh-DB admin console must stay reachable).
- /request-access deliberately does NOT call requireAuth (would loop); it reads the session directly and self-heals: if an invite/membership appeared since sign-in, it forwards to /dashboard.
- Invite emails: the WorkspaceInvite model + settings UI existed but nothing was ever SENT — invitees only joined if they happened to sign in. New src/lib/email.ts reuses the marketing site's Gmail SMTP pattern (GMAIL_USERNAME/GMAIL_PASSWORD) rather than adding a provider dependency. Email is a courtesy, never a gate: missing creds or send failure logs + returns {emailSent:false}, the invite row still works, and the settings toast tells the inviter to share the link manually.
- proxy.ts needs no change: /request-access is unprotected by design and the page handles signed-out visitors itself.

Implementation summary:
- ensureMembership(user, superAdmin): invite auto-accept unchanged; auto-workspace-create now super-admin-only, everyone else → /request-access. AuthContext unchanged otherwise.
- inviteMember returns {emailSent}; settings-client toasts the distinction. Login caption now says invite-only.
- Verified: tsc clean, eslint clean on changed files (2 pre-existing img warnings in settings-client untouched).

### 2026-07-11 — Three customer account types (WorkspaceType) + creative soft-delete plumbing

- Type: feature
- Scope: prisma/schema.prisma (WorkspaceType enum, Workspace.type, Creative.deletedAt), src/lib/auth.ts (AuthContext.workspaceType), src/trigger/generation-run.ts (FASHION_EDITORIAL brief flavor), src/app/actions/admin.ts + src/app/(admin)/admin/new-workspace-dialog.tsx (typed creation), 9 creative reads (library, dashboard, studio run page, review/layouts actions, editor-data, paid-edits), scripts/setup-launch-workspaces.ts (new)

Reasoning / RCA / research:
- Launch serves 3 segments: FMCG_PRODUCT (SKU + festival/theme/custom briefs), APPAREL_ON_MODEL (everyday wear on AI models), FASHION_EDITORIAL (high-end apparel, designer-campaign look). No type concept existed; the closest was the free-text onboarding profile (industry/useCase/channel) which can't drive behavior reliably.
- Type lives on Workspace (enum, default FMCG_PRODUCT = additive migration) and rides AuthContext. Behavior wiring kept minimal: FASHION_EDITORIAL appends an ACCOUNT STYLE block to the occasion brief, so concepting, brief QA and the prompt enhancer ALL inherit the editorial bar — one injection point instead of scattering per-stage conditionals. Fidelity mode stays user/product-driven in the create form (apparel workspaces already surface ON_MODEL via profile).
- Soft delete: chose `deletedAt DateTime?` over reusing CreativeStatus.ARCHIVED — a status flip destroys the READY/FAILED provenance and ARCHIVED has no writer today; a timestamp is reversible and auditable. Every tenant-scoped creative read now filters deletedAt: null (9 sites).
- scripts/setup-launch-workspaces.ts is dry-run by default (--apply to execute): soft-deletes all existing creatives, creates the 3 typed workspaces owned by the SUPER_ADMIN_EMAIL user with 0 credits. NOT yet executed — DB steps run only on explicit owner confirmation, together with `prisma migrate dev`.

Implementation summary:
- Schema + client regenerated; admin New-workspace dialog gained an account-type radio group; adminCreateWorkspace validates type via Zod enum.
- Verified: tsc clean, eslint clean.

Follow-ups deferred:
- Migration + setup script execution pending owner confirmation (permission boundary).
- APPAREL_ON_MODEL has no prompt-flavor block yet — the standard on-model path already fits it; add only if outputs drift too editorial or too flat.

### 2026-07-11 — Brief validator + in-pipeline prompt enhancer + deeper QA retries (quality-first gates)

- Type: feature
- Scope: src/lib/pipeline/validate-concepts.ts (new), src/lib/ai/models.ts (briefQa slot), src/trigger/generation-run.ts (stage 2b wiring, ensurePackFidelity loop, placement retry x2)

Reasoning / RCA / research:
- Owner directive: brief generation → validation → prompt generation → enhancement → render, with output "directly usable as ads." The pipeline had Zod SHAPE validation only — nothing checked MEANING (product-wrong scenes, product_hero prompts that double-render the pack, invented offers, wrong scripts) before image money was spent.
- Validator runs on new MODELS.briefQa slot (sonnet — judgment quality at ~1/8 opus cost); repairs run on the concepts model (opus) because repair IS creative authorship. One batch judge call + parallel per-concept repairs + nothing blocking: fail-open everywhere (a QA outage must never kill a paid run), findings recorded in pipeline.briefQa for observability.
- Prompt enhancer existed (enhance-prompt.ts) but was UI-only. Chose a NEW batch enhancer over reusing it: one call polishes all N prompts together so the set reads like one campaign by one director; system prompt forbids changing scene contents, only adds photographic craft (lens/light/grade/texture). Deterministic guard: reject any polished prompt <300 chars or containing em/en dashes — the author's original always wins on doubt.
- Reused the CONCEPTING status for stage 2b instead of adding enum values — avoids a Prisma migration + UI status plumbing for what is an internal substage.
- Pack-fidelity QA went from one corrective re-render to a loop (PACK_QA_MAX_RETRIES, default 2); placement QA now tries up to TWO different-archetype runner-ups before the generic legible fallback (recomposes are cheap canvas work; a designed layout beats the fallback's genericness). Both per owner "quality over cost."

Implementation summary:
- validate-concepts.ts: judge (batch verdicts) → parallel repair (once) → merge; enhanceConceptPrompts (batch, index-mapped, guarded). Wired between generateConcepts and the render queue with try/catch fail-open.
- Verified: tsc clean, 49/49 vitest, eslint clean.

Follow-ups deferred:
- No re-validation after repair (accept-with-log) — a second judge round doubles latency for marginal catch rate; revisit if flagged-after-repair ads show up in review.

### 2026-07-11 — Fallback cascade reordered quality-first: NB Pro → GPT Image 2 → NB2 → Seedream (tiered ChainStep refactor)

- Type: feature
- Scope: src/lib/image/provider.ts (resolveSceneChain, FALLBACK_CHAIN, generateScene), src/lib/image/provider.test.ts, src/app/(app)/studio/[runId]/page.tsx (fallback badge)

Reasoning / RCA / research:
- Owner-specified resilience order: Nano Banana Pro first, then gpt-image-2, then Nano Banana 2, Seedream last. Old chain was provider-level (["gemini","seedream","gpt-image-2"]) with ONE tier for all steps — it could not express "gemini/hero then gemini/default" so NB2-before-Seedream was impossible without a tier-aware chain.
- Refactored to ChainStep {provider, tier}[] + exported resolveSceneChain() so the order is unit-testable (it's a product guarantee, not an implementation detail). Semantics preserved: forced pick = single attempt; softPrefer = pick leads, deduped cascade behind; IMAGE_PROVIDER env pin unchanged.
- Audited all callers before changing the default: paid-edits passes tier:"hero" (first step is hero anyway), typography/legacy pass nothing → now get the quality-first cascade (desired: baked text + legacy runs deserve the best model). Create-form already defaults nb-pro; no UI change needed there.
- Studio page now badges the actual model on SINGLE-pick runs whenever the cascade fell back to a different model — a silent substitution isn't honest to the buyer (was: badge only on bakeoff/compare).

Implementation summary:
- provider.ts: FALLBACK_CHAIN as 4 tiered steps; generateScene consumes resolveSceneChain; error labels now provider/tier for gemini. Comments updated (NB Pro is the primary, not "hero-only").
- 4 new chain-order tests (default order, forced single, soft nb-pro dedupe, soft gpt order). 49/49 vitest, tsc clean.

### 2026-07-11 — `npm run dev` now boots Next.js + Trigger.dev worker together

- Type: build
- Scope: package.json (scripts, devDependencies, allowScripts)

Reasoning / RCA / research:
- Devs had to remember a second terminal for `npx trigger.dev dev`; forgetting it makes every generation run sit in QUEUED silently. One command removes the failure mode.
- Chose `concurrently` (named/colored prefixes, sibling processes survive one exiting — next dev stays up if trigger CLI lacks auth) over `npm-run-all` (no prefixes) and `&`-backgrounding (orphans).
- Pinned `trigger.dev` CLI to exact `4.4.6` to match `@trigger.dev/sdk` — CLI 4.5.0 printed a version-mismatch warning against the 4.4.6 packages.
- Zero production impact: Vercel runs `next build` (untouched); Trigger.dev production deploys via `trigger.dev deploy` separately. `dev` script never executes in either.

Implementation summary:
- `dev` → `concurrently -n next,trigger "npm:dev:next" "npm:dev:trigger"`; kept `dev:next` / `dev:trigger` runnable standalone.
- Added devDeps `concurrently@^10`, `trigger.dev@4.4.6`; approved their esbuild/@depot postinstalls in `allowScripts` (project uses npm allow-scripts allowlisting; without approval the CLI's esbuild binary never installs and `trigger dev` breaks at runtime).
- Verified: 25s smoke run — both processes boot under one command; trigger CLI 4.4.6 reports no mismatch.

### 2026-07-10 — Production hardening: credit-integrity races + gpt-image-2 resilience + single-sourced aspect sizing

- Type: bug
- Scope: src/lib/credits.ts (debitCredits, reconcileRunRefund), src/trigger/generation-run.ts (catchError), src/app/(app)/studio/[runId]/page.tsx (stall recovery), src/lib/image/provider.ts (gpt-image-2 retry, closestGptSize), src/lib/image/provider.test.ts

Reasoning / RCA / research (all from the god-review pass on the generation pipeline):
- **Credit double-spend (P1, real money):** `debitCredits` read the balance in JS, checked it, then wrote an ABSOLUTE new value — a textbook lost-update. Two concurrent runs both read 8, both pass the check, both write 0 → N generations for the price of 1 (real Gemini/OpenAI spend not billed). READ COMMITTED does not save a read-then-write.
- **Over-refund (P1):** `catchError` full-refunded `creditsDebited` whenever status wasn't COMPLETE/PARTIAL. If the run delivered creatives then threw on a late DB write (status still RENDERING), it refunded the WHOLE debit on top of any partial refund already issued → free delivered product + double refund. It also always marked FAILED, discarding delivered creatives.
- **Double-refund on GET (P2):** the studio run page issued a stall-recovery refund during render with a non-atomic check-then-grant and no idempotency → two tabs = two refunds (a GET causing a ledger write).
- **gpt-image-2 no retry (P2):** gemini/runware wrap calls in withRetry; gpt-image-2 did not. In forced/compare mode there is NO cross-provider fallback, so a single transient 429/5xx killed the variant.
- **Aspect drift (P2, structural root of the crop bug):** `GPT_SIZE` was a hand-maintained map that had drifted from `ASPECT_DIMENSIONS` — both 4:5 and 9:16 mapped to 1024×1536 (2:3). gpt-image only offers 3 sizes and CANNOT render 4:5/9:16 natively, but the map made the mismatch silent and un-testable.

Implementation summary:
- Atomic debit: conditional `updateMany({ where: { balance: { gte } }, data: { balance: { decrement } } })` — the UPDATE row-locks and re-checks against the live row, so concurrent debits serialize; 0 rows ⇒ InsufficientCredits.
- Added `reconcileRunRefund({ owedRefund })`: idempotently tops a run's total REFUND up to `owed` (aggregates prior REFUND ledger, grants only the remainder, all in one tx). Routed catchError and the run-page stall-recovery through it (`owed = creditsDebited − delivered·perConcept`), so retries/races/tabs converge instead of stacking. catchError now marks PARTIAL when creatives were delivered. Kept the happy-path partial/full grants (`grantCredits`) as-is — they're first-writers and reconcile counts them.
- Run page: conditional `updateMany(status notIn terminal)` so exactly one render performs recovery; refund only when the flip actually happened AND idempotent.
- gpt-image-2: wrapped both endpoints in a transient-only `withRetry` (3 attempts, backoff+jitter) mirroring gemini/runware.
- `closestGptSize(aspect)` derives the nearest supported OpenAI size from `ASPECT_DIMENSIONS` (single source); the residual ratio gap is absorbed by the plateFocusY crop anchor. Added provider.test.ts asserting it always returns a supported, correctly-oriented, nearest-ratio size.
- Verified: 45 tests green; `tsc --noEmit` clean; eslint clean on all changed files. Billing-path correctness reasoned (not exercised against live DB by design — no mutating tests on prod data).

Follow-ups deferred:
- Add a REFUND ledger UNIQUE/dedup key per (runId, reason-slice) as belt-and-braces beyond the reconcile aggregate.
- Concurrency/integration tests for debit double-spend and refund idempotency (need a test DB; none is wired up).
- Move the run-page stall recovery out of GET render into a cron/route so page loads never mutate credits at all.

### 2026-07-10 — On-model/apparel edge-crop: framing guards + subject-anchored cover-crop

- Type: bug
- Scope: src/lib/pipeline/image-prompt.ts (FRAMING, ON_MODEL_FRAMING), src/lib/composition/render.ts (plateFocusY anchor), src/lib/composition/types.ts (OverlaySpec.plateFocusY), src/trigger/generation-run.ts (focusY from safeBand), src/lib/pipeline/image-prompt.test.ts

Reasoning / RCA / research:
- Report: Gillco creatives "cut at the edges." Pulled real renders from the Dev workspace (the Gillco *brand*, not a "gillco" workspace — none exists) + Blueman on-model. Two independent causes, both evidenced from stored plates vs composed renders.
- Cause 1 (framing): `buildOnModelPrompt` reserved no single-figure framing → on-model fusion rendered a front+back **catalogue diptych** (small figure, empty bands, feet at the frame edge). Scene/direct prompts likewise never reserved subject margins.
- Cause 2 (crop): `renderOverlay` cover-crops **center-anchored** and ignored that image models return off-ratio plates — gpt-image-2 gives **1024×1536 (2:3)** for a 4:5 request with subject high + reserved empty band low. Center-crop then sliced ~135px off the top → heads clipped (verified: left model's hair cut at the top edge). Not the compositor's aspect that's wrong — the anchor was.
- Rejected: forcing providers to return exact aspect (broad provider-layer change, deferred) and hard focusY=0 (would crop away the whole reserved text band → push headline onto the subject). Chose a *gentle* anchor (0.35/0.65) that keeps heads/feet while retaining the band.

Implementation summary:
- Added `FRAMING` (all modes: single photo, no split/diptych, every subject fully in frame with margin) + `ON_MODEL_FRAMING` (one full-body hero, headroom + foot-room, no front/back split). Injected into scene-pass, scene, direct, and on-model builders (on-model applies to BOTH trust-the-brief and legacy paths).
- Added optional `OverlaySpec.plateFocusY` (0..1, default 0.5 = legacy-identical); `renderOverlay` anchors the vertical cover-crop by it.
- Single-source anchor: `plateFocusYFor(safeBand)` (archetypes.ts) — band "bottom"→0.35 keep-top, "top"→0.65 keep-bottom, else 0.5. `buildOverlaySpec` stamps it from `placement.safeBand`, so EVERY caller inherits it (generation scored + fallback, layout-remix `layouts.ts`, add-aspect `paid-edits.ts`). The PLAIN on-model path (the primary apparel deliverable) and add-aspect now run `analyzePlate` explicitly and set it too.
- Regression fix from god-review: `rasterizePlate` (contrast sampler) cropped centred while the render cropped anchored → `enforceContrast` read the wrong pixels for focusY≠0.5. Threaded `focusY` into `rasterizePlate` (maps to sharp top/centre/bottom gravity) so sampler and render agree.
- Verified: 42 tests green (added plateFocusYFor + buildOverlaySpec stamping tests); `tsc --noEmit` clean; re-rendered the real gpt-image-2 Gillco plate through the full PLAIN chain (analyzePlate→safeBand=bottom→0.35) — centre clips the man's hair at the top, anchored restores headroom while keeping the bottom band. Default focusY path is byte-identical to old center-crop.

Why the reshape (god-review): the first cut set plateFocusY imperatively in generation-run only, so the PLAIN on-model path and both editor recompose paths silently center-cropped (fix missed its own primary target). Moving the derivation into buildOverlaySpec makes "forget" impossible by default.

Follow-ups deferred:
- Provider-level aspect fidelity: `GPT_SIZE` maps BOTH 4:5 and 9:16 to 1024×1536 (2:3) — the structural root of the plate≠canvas mismatch. A shared aspect registry (ratio→{geminiAspect,gptSize,canvasDims}) + an invariant test would remove the crop need entirely. plateFocusY is a mitigation, not the cure.
- On-model diptych is mitigated by prompt only; if it recurs, add a post-gen vision check ("single figure?") with one regen, mirroring pack-QA.
- Pre-existing credit-integrity issues surfaced by god-review (NOT this change): non-atomic `debitCredits` (lost-update double-spend), `catchError` full-refund-after-partial over-refund window, studio run-page GET-side-effect double refund. See the review report; needs its own hardening pass before production billing is trusted.
- Investigation scripts left at scripts/spikes/{inspect-gillco,crop-check}.ts (read-only; load .env.local at runtime).

### 2026-07-05 — gpt-image-2 C2PA PNGs crash the compositor; end-to-end compare verified with live runs

- Type: bug
- Scope: src/lib/image/provider.ts (normalizePng), src/trigger/generation-run.ts (calm-band fallback)

Reasoning / RCA / research:
- Second compare failure: "Invalid SVG image". The gpt plate WAS a valid PNG in storage — but carrying C2PA content-credential chunks (caBX/JUMBF; OpenAI signs its images). @napi-rs/canvas can't decode that variant and its last-resort SVG decoder throws the misleading error inside renderOverlay. Reproduced locally with the stored plate; sharp re-encode fixed it.
- Fix: normalizePng() (sharp decode→re-encode) on both gpt-image-2 return paths — strips C2PA, guarantees canvas-safe PNGs. Gemini/seedream outputs already decode fine, left untouched.
- Verified end to end by running the user's own brief twice via scripted zero-debit runs (owner instruction "run the same brief by yourself"): (1) in-scene compare → COMPLETE, both models; (2) EXACT_PRODUCT compare → COMPLETE, pack-fidelity QA PASSED first try on both (correct Gillco logo + "PUNJABI POORI" label — the in-scene run without QA showed "PUNJAEI", confirming exact-pack is the mode that carries the guarantee).
- Exact-pack finals exposed a layout flaw: both models staged the pack lower-left, placement QA correctly failed both layouts, and the guaranteed-legible fallback (hardcoded headline_bottom) put type over the pack anyway — legible but overlapping, under a wide-open sky. Fallback now anchors to the plate's calm band (top-calm → big_type_top).

Implementation summary:
- provider.ts: normalizePng on gpt-image-2 edits + generations; generation-run.ts fallback archetype from analysis.safeBand. tsc 0, 36/36.

### 2026-07-05 — gpt-image-2 edits 400: `input_fidelity` param removed upstream

- Type: bug
- Scope: src/lib/image/provider.ts (generateGptImage2)

Reasoning / RCA / research:
- First compare run: nb-pro slot done, gpt-image-2 slot failed with OpenAI 400 "The model 'gpt-image-2' does not support the 'input_fidelity' parameter" — that knob was a gpt-image-1 option our edits call still sent; gpt-image-2 rejects it (high fidelity built in). Failed slot auto-refunded as designed.
- Fix: drop the param. Verified live with a real reference-image edit call through generateScene (provider forced, 1.4MB image back).

Implementation summary:
- Removed `form.append("input_fidelity", "high")` + explanatory comment; tsc clean.

### 2026-07-05 — Quality reset: premium models everywhere, cut-out paste retired, user model picker with compare mode

- Type: feature
- Scope: src/lib/ai/models.ts, src/lib/pipeline/{cost.ts, concepts.ts, enhance-prompt.ts}, src/lib/image/provider.ts, src/trigger/generation-run.ts, src/lib/editor/paid-edits.ts, src/app/actions/generate.ts, src/app/(app)/studio/{create-form.tsx, [runId]/page.tsx, [runId]/studio-canvas.tsx}, prisma/schema.prisma (+migration image_model_pref)

Reasoning / RCA / research:
- Second real Gillco run still shipped an unusable creative: the pack FLOATED mid-air over an already-staged scene. RCA: yesterday's exact-pack fix forced every concept through the deterministic cut-out paste (compositeCutout: fixed 50% width, centered, one elliptical shadow) — label pixels correct, physical grounding absurd. Owner verdict: quality over cost, "even if generation costs a little more".
- Architecture flip: the paste is RETIRED. EXACT_PRODUCT now renders in-scene on a premium image model (they reproduce reference packaging well) and keeps yesterday's pack-fidelity QA (reference-vs-render label check + one strict re-render) as the guarantee. concepts.ts no longer forces product_hero — instead instructs pack-prominent, label-readable staging in every scene.
- LLM upgrades per owner instruction ("latest opus/sonnet"): concepts claude-sonnet-4-6 → claude-opus-4-8 ($5/$25/MTok — the concepting is the creative brain; enhance rides the same slot), research → claude-sonnet-5. Verified against the claude-api reference (exact IDs, no date suffixes; AI SDK v6 sends no sampling params, so no 400 risk on the new models). Live smoke test passed on both slots.
- User-facing image-model picker (all users, not just admin bake-off): "nb-pro" (default) | "gpt-image-2" | "compare". Compare reuses the bake-off variant fan-out but IS debited (2× credits, per-item refunds unchanged since queue length doubles with cost). Single picks are SOFT-forced: preferred provider first, fallback chain kept — a paid run should survive a provider outage; compare/bake-off stay hard-forced for comparison integrity.
- Editor paid edits upgraded to hero tier (same quality bar as generation).
- Deferred: crude-paste module (src/lib/pipeline/cutout.ts) now unused but left in place (deletion not approved); CTA-blue on existing brands still requires Gillco re-ingest or manual Brand Kit colors — the ingest fix only applies to new ingests.

Implementation summary:
- provider.ts: ImageModelPref type + IMAGE_MODEL_PREFS + variantsForPref() (single pick → key-less soft variant; compare → nb-pro + gpt-image-2 hero variants); SceneGenParams.softPrefer inserts the preferred provider ahead of the fallback chain.
- generation-run.ts: variants = bakeoff ? lineup : variantsForPref(run.imageModelPref); composite branch + shouldCompositeFor deleted; usedCutoutFallback always false; softPrefer threaded through generatePlate/ensurePackFidelity.
- generate.ts: imageModel field, cost × 2 on compare, persisted to GenerationRun.imageModelPref (null on bake-off).
- create-form: Image model card picker + cost multiplier + summary row + compare explainer; run page shows model badges on compare runs; failed-slot labels now parse variant suffix from the status id (compare runs aren't bake-offs).
- Gate: tsc 0, 36/36 vitest, lint 0 errors, build clean, live generateObject smoke on claude-opus-4-8 + claude-sonnet-5.

### 2026-07-05 — Onboarding workspace profile drives which surfaces show

- Type: feature
- Scope: prisma/schema.prisma (+migration 20260704202919_add_workspace_profile), src/lib/workspace-profile.ts (new), src/lib/workspace-profile-server.ts (new), src/app/actions/brand.ts, src/app/(app)/onboarding/wizard.tsx, src/components/brand-kit-tabs.tsx, src/app/(app)/{brand,products}/page.tsx, src/app/(app)/studio/create-form.tsx

Reasoning / RCA / research:
- User: "in gillco account showing models wouldn't make sense" — onboarding collected only brand basics, so every workspace saw every surface (AI Models tab, On-model mode) regardless of relevance.
- Chose 3 optional selects (industry / primary use case / sales channel) embedded in BOTH onboarding forms rather than a separate wizard step — skippable, no form wall, answers ride the existing FormData submit.
- Gating is progressive disclosure, not security: no profile answers → show everything (never hide features on missing data). /models stays URL-reachable.
- On-model mode card in the create form is gated by product category (APPAREL), not profile — the product data is the stronger signal; an atta pack never needs a fashion model regardless of workspace profile.

Implementation summary:
- Workspace gains industry/primaryUseCase/salesChannel (all String?, additive migration applied to dev DB).
- saveWorkspaceProfile() in brand.ts validates against allowed lists and updates the workspace from either onboarding form; constants + showsModelSurface() live in workspace-profile.ts (client-safe), cached DB read in workspace-profile-server.ts.
- BrandKitTabs takes showModels; brand + products pages pass showsModelSurface(profile).

Follow-ups deferred:
- Profile not yet editable post-onboarding (settings page slot) and not yet used to reorder calendar relevance or default fidelity mode — wire once real profiles accumulate.

### 2026-07-05 — In-form festival picker on the studio create form

- Type: feature
- Scope: src/app/(app)/studio/page.tsx, src/app/(app)/studio/create-form.tsx

Reasoning / RCA / research:
- Occasion could only enter a run via ?occasion=/?entry= deep links from home/calendar; going straight to Create meant custom-brief only.
- Reused the existing startGenerationRun contract (occasionId = FestivalOccurrence id; the action already auto-creates the CalendarEntry) — zero server changes, picker is purely additive.
- Chip row of the next 10 upcoming festivals, hidden when deep-linked (deep link stays the richer, preselected path); picking one makes the brief optional (server validation already allowed occasion-only runs).

Implementation summary:
- studio/page.tsx fetches upcoming festivalOccurrences (skipped on deep links) → upcomingOccasions prop; create-form adds pickedOccasionId state, chip UI above the brief, summary row + brief-label/placeholder react to the pick.

### 2026-07-05 — Exact-pack now means exact: concept routing, pack-fidelity QA, logo-grounded brand palette

- Type: bug
- Scope: src/lib/pipeline/concepts.ts, src/lib/pipeline/pack-qa.ts (new), src/trigger/generation-run.ts, src/trigger/brand-ingest.ts, src/lib/ingest/extract.ts, src/app/(app)/studio/create-form.tsx (card copy)

Reasoning / RCA / research:
- Real run rendered "PUNJASI POORI ATTA" in EXACT_PRODUCT mode. RCA: composite (pixel-true) path only ran for product_hero concepts, but generateConcepts never learned the user chose exact mode — the LLM freely picked lifestyle placements, whose renders let gemini-3.1-flash redraw the pack from a reference photo (small Latin label text is its classic failure).
- Fix at the routing layer, not the model: exact mode now forces product_hero (prompt instruction + hard post-hoc override in code — prompt hopes aren't guarantees), so the real cutout is composited in every concept. Set variety moves to the backdrop world instead of scene type; that IS the mode's promise ("Exact pack").
- Residual model-drawn packs (direct-mode exact runs) get a new pack-fidelity vision QA (reference vs render, word-by-word label check, ~$0.002) with ONE strict re-render on mismatch; verdict stored in critic.packQa. Fail-open on infra errors, no retry loops.
- Second root cause from the same run: the "brand" blue in overlays wasn't Gillco's — brand ingest asked the LLM for recurring website UI colors, so link-blue persisted as accent. extract.ts prompt now demands brand-mark colours and rejects UI chrome, and reconcilePaletteWithLogo() in brand-ingest grounds saved primary/accents in the logo's own chromatic pixels (extractPalette + RGB distance; skips mono logos, fail-open).
- Rejected: hero-tier (NB Pro) for exact in-scene renders — 2.2× image cost, deferred until after the bake-off verdict.

Implementation summary:
- generateConcepts(opts.exactProduct) + EXACT-PACK MODE prompt block + forced productPlacement; ensurePackFidelity() helper wired into both generatePlate's in-scene branch and processDirect; PlateResult.packQa → critics; Exact-pack ModeCard copy updated to the new contract.

### 2026-07-05 — Overlay legibility: real-pixel contrast enforcement, calm-band anchoring, QA that refuses to ship failures

- Type: bug
- Scope: src/lib/composition/{contrast.ts (new), analyze.ts, color.ts, score.ts, archetypes.ts, templates.ts}, src/lib/pipeline/placement-qa.ts, src/trigger/generation-run.ts

Reasoning / RCA / research:
- Real 9:16 output: blue eyebrow on blue kurta, white headline over the kadai (the key content), body copy over the pack — while placement QA had returned pass:false with exactly that diagnosis and the run shipped anyway. Five stacked root causes, all deterministic:
- (1) No pixel contrast anywhere: resolveRoles accepted `dominant` and never read it; the only "contrast" score was a binary has-scrim check on the headline. Fix: contrast.ts samples the cover-fitted plate under each text layer (scrim-adjusted), computes WCAG ratios (3 for display headlines, 4.5 small text), remaps failing layers to white/ink, and backs still-failing mid-tone cases with a translucent textBox panel. CTA pill separation (ratio <1.5 vs local bg) remaps the pill instead.
- (2) Accent-vs-image blindness: resolveRoles now shifts the accent's lightness (hue preserved) when it sits within RGB distance 90 + luminance 0.18 of a dominant plate colour — blue-on-blue can't happen even before per-layer checks.
- (3) Bottom band unreachable by design on 9:16: safeBottom=400 (story-chrome reserve) + copy-stack height pushed headlines to dead center. analyzeRegions upgraded 3 fixed thirds → 6 bands growing a calm run (calmBand y-range); when the bottom is genuinely calm, safeBottom drops to 160. Tradeoff: text may sit under IG-story UI chrome — accepted, kadai overlap is strictly worse.
- (4) score.ts band classifier used y<0.4/y>0.55 cutoffs — a correct bottom layout on tall frames classified "center" and got penalized. Now classifies by headline box CENTER against thirds; analyze.test.ts caught a regression here (calm run spanning center+bottom must label "bottom" — prefer the frame edge the run reaches).
- (5) QA was toothless: one whole-image boolean (easy for flash to shrug past), retry was a same-archetype template with identical palette/geometry (reproduces the collision), double-fail shipped anyway. Now: per-element verdict schema (eyebrow/headline/body/cta/logo × overlaps/lowContrast), retry must differ in archetype, and double-fail renders a guaranteed-legible fallback (clean-bottom, all-white text, scrim ≥0.75) — a known-bad composition is never stored. QA infra errors stay fail-open.
- Bonus wiring: concept.typographySpec's reserved zone (generated, reserved in the plate, previously discarded) now parsed into a zoneHint that nudges template selection.

Implementation summary:
- New contrast.ts (rasterizePlate/regionAverage/WCAG/enforceContrast); enforcement runs per candidate before scoring in composeAllAspects; contrastNotes + packQa + fallback flag recorded in critic. 36/36 vitest (one behavioral test fix in analyze), tsc 0, build clean.

Follow-ups deferred:
- calmBand only adjusts 9:16 headline_bottom geometry; per-archetype anchoring into the measured y-range is the natural next step if placement misses persist.

### 2026-07-05 — /admin/costs rebuilt as run-centric cost dashboard + per-run drilldown

- Type: feature
- Scope: src/app/(admin)/admin/costs/page.tsx (rewritten), src/app/(admin)/admin/costs/[runId]/page.tsx (new)

Reasoning / RCA / research:
- Approved spec wants margin analysis per generation run (run list → per-stage drilldown), not the prior aggregate observability view (source/provider/model rollups, 14-day bars) that page held; the old view answered "where does spend go overall", the new one answers "what did THIS run cost vs the credits it debited". Spec is explicit, so the page was replaced rather than merged.
- Gating is inherited: the (admin) group layout already calls `requireSuperAdmin()` (src/lib/auth.ts), so the pages themselves add no auth code — same pattern as leads/tests. "Costs" tab already existed in admin-tabs.tsx.
- Per-run totals for the page come from ONE `apiCostLog.groupBy({ by: ["runId"], where: { runId: { in: pageRunIds } } })`, not N per-row aggregates. Drilldown groups stage×kind×provider×model in JS from the single `findMany` it already needs for the raw log table — a second groupBy query would be redundant.
- Non-run spend (editor/dissect/brand-research rows with `runId: null`) would silently vanish from a run-centric view, so it surfaces as an "other sources" line grouped by source under the header cards.
- Numbers: USD 4dp on per-row/stage figures (sub-cent calls), 2dp on aggregates; Prisma Decimal → `Number()` for display; `tabular-nums` on aligned digit columns.

Implementation summary:
- List page: header cards (30-day USD, all-time USD, run count), other-sources line, paginated runs table (?page=, 50/page, Prev/Next links) with date, workspace, brand, trigger·fidelity, status badge, bake-off badge, credits, per-run API USD; each row overlay-links to the drilldown.
- Drilldown: run summary grid (workspace/brand/trigger/fidelity/aspects/concepts/started/duration), Total API USD + Credits debited + call-count cards side by side, cost-by-stage table ordered USD desc, raw ApiCostLog table; all tables in overflow-x-auto wrappers.
- Verified: `npx tsc --noEmit` exit 0; `npm run lint` 0 errors (4 pre-existing warnings in untouched files).

### 2026-07-05 — Perf audit batch: pool size, auth hot path, signed-url caching, refresh de-duplication, render_aspect task

- Type: refactor
- Scope: src/lib/{db,auth,storage}.ts, src/lib/editor/paid-edits.ts, src/trigger/creative-edit.ts, src/app/actions/editor.ts, src/app/(app)/layout.tsx, src/app/(app)/library/[creativeId]/editor.tsx, src/app/(app)/studio/[runId]/studio-canvas.tsx, src/components/auto-refresh.tsx

Reasoning / RCA / research:
- pg PoolConfig `max: 1` under the Supavisor transaction pooler serialized every parallel query (all `Promise.all` page loads degraded to sequential); the pooler multiplexes short connections so a local pool of 5 is safe.
- `ensureMembership` ran `workspaceInvite.findMany` + a full user refetch on EVERY request. Verified invites for existing users create memberships directly in `inviteMember` (src/app/actions/workspace.ts), so PENDING invites only exist for not-yet-signed-up emails → memberships-first early return is fully behavior-preserving, not just "mostly".
- Signed thumbnail URLs cost one Supabase HTTPS call per key per render (no batch endpoint for transforms). Storage keys are immutable (new version = new key) so `unstable_cache` at revalidate 3300s (< 3600s URL TTL) is safe. Chose per-key caching for thumbs (hit-friendly across pages) but per-key-array caching for `getSignedUrls` to keep its single batch call; thumb cache fn throws on failure so transient errors are never cached for 55 min.
- Editor `mutate()` called `router.refresh()` after every success, but all actions it dispatches (editor.ts, review.ts, layouts.ts — verified each) run `revalidatePath`, so every edit rendered the page twice. The pending-edit realtime watcher keeps its own refreshes (task completion isn't an action response).
- `renderNewAspect` downloaded the full-res plate + composited synchronously in a serverless action. Moved into the existing creative-edit task as a `render_aspect` payload variant; it is FREE, so `startCreativeEdit` gained a `paid` guard (no debit, no queue-failure refund) and the task's `catchError` returns early for it — the prior code refunded unconditionally, which would have minted free credits on crash.
- Studio canvas refreshed the whole server page every 4s even with a live realtime subscription; now metadata progress (done/status change via a ref-diff) drives refreshes, 15s interval only as no-token fallback. AutoRefresh lists stretched 4s → 8s.
- (app) layout re-queried `membership.findMany` that `requireAuth` had already loaded — exposed memberships on AuthContext instead.

Implementation summary:
- New `applyRenderAspect` in paid-edits.ts (body moved verbatim from the action, minus revalidatePath — client watcher refreshes on completion); editor gained an "aspect" pending lane so the format button stays busy until realtime completion.
- Supabase admin client hoisted to a module singleton (was re-created per storage call).
- Verified: `npx tsc --noEmit` clean (twice, from scratch) and `npm test` 36/36 (3 consecutive runs; one flake observed in composition/analyze.test.ts noise-band test, unrelated to this change and passing on all reruns).

Follow-ups deferred:
- Editor's no-token fallback still waits a flat 60s before refreshing — overlong for the fast free `render_aspect`, but only reachable when public-token minting fails; left as-is to keep the diff minimal.
- creative-edit's crash-path toast says "credits refunded" even for the free variant; cosmetic, crash-only, not worth widening the diff.

### 2026-07-05 — Marketing content rebuild: consulting-first copy, de-hyped Studio, shared WhatsApp constant

- Type: feature
- Scope: src/app/(marketing)/{page,consulting/page,synerix-studio/page,layout}.tsx, src/app/layout.tsx, src/app/(auth)/login/page.tsx, src/app/(app)/dashboard/page.tsx, src/app/(app)/settings/credits/page.tsx, src/components/marketing/footer.tsx, src/lib/contact.ts (new), src/app/(admin)/admin/{leads/page,admin-tabs}.tsx, + null-guard fixes in login-form/app-nav/brand-kit-tabs/marketing-nav

Reasoning / RCA / research:
- User verdict on the new marketing pages: over-claiming ("agency-grade", "pixel-faithful", "never redesigned", festival-first hooks) and festival over-indexing; approved base is the old site's earnest service-first voice (git show HEAD: pages/, components/, data/features.ts), enriched in the consulting page's concrete register.
- Kill-list phrases purged everywhere including SEO metadata and app-side taglines (root layout, login, dashboard); left `src/lib/pipeline/image-prompt.ts` ("never redesigned" is a model instruction, not a claim) and `src/lib/composition/fonts.ts` (code comment) — both in do-not-touch dirs; also left `src/app/(app)/studio/page.tsx` "agency-grade options" (dir owned by another workstream).
- Consulting "What we work on" spec asked for 6 areas but the enumerated ops (4 existing + Tech + Supply + split Planning out of Market) yield 7; resolved by merging Tech & Supply into one card ("Tech, digital & supply chain") so People & compliance — some of the site's best copy — survives intact at exactly 6 cards.
- Utkarsh Singh "testimonial" in old Testimonials.tsx is a commented-out Cruip template placeholder praising "Monkster"/interview workflow — adapted minimally to Synerix but FLAGGED for user verification before shipping; it was never live copy.
- Credits copy verified against code: CREDIT_COSTS.perConcept defaults 2, LIMITS.maxConceptsPerRun defaults 4 (both env-overridable; create-form offers 1/2/4) → "Two credits make one finished creative", "up to four distinct concepts".
- WhatsApp number unified in src/lib/contact.ts reading process.env.WHATSAPP_NUMBER with the literal fallback; all three consumers (marketing footer, consulting page, credits page) are server components, so a plain env-reading module suffices — no client plumbing needed.

Implementation summary:
- Home: consulting-first hero + verifiable stats row, six-service grid (old data/features.ts catalogue, rewritten concrete one-liners, emojis dropped), "Why Synerix" navy band (old pillars modernized + testimonial), Amplify rewritten without agency comparison, Studio band headline now "Marketing output, without hiring a team."
- Consulting: services 4→6 ("Six places a business quietly leaks money"), "In our experience, most MSMEs…" softener, new "Who you'll work with" section (25+ years credential in 3 sentences + testimonial); hero/cadence/enquiry untouched.
- Studio: hero "Ad creatives for your business, made by the same people who fix businesses.", absolutes replaced with verifiable claims (checked against reference photos, typography set into image + Devanagari/Gurmukhi spell-check, 45 occasions as one bullet), refund/human-activation copy kept, new "Part of Synerix" cross-link band, closer now "Try it on your own product."
- Responsive nits: leads stats grid `grid-cols-1 sm:grid-cols-3`; admin tabs wrapped in `overflow-x-auto` with `w-max min-w-full` nav so border-b spans scroll width.
- Pre-existing tsc failures fixed to satisfy the gate: 6× TS18047 (usePathname/useSearchParams now `string|null` under Next 16 types) via `?.` guards in 5 files; stale `.next` cache removed to clear generated-validator errors. `npx tsc --noEmit` exit 0; `npm run lint` 0 errors + the 4 known pre-existing warnings.

Follow-ups deferred:
- Verify the Utkarsh Singh quote with the actual person before ship (source was template debris).
- `src/app/(app)/studio/page.tsx` still says "agency-grade options" — owned by the other workstream.

### 2026-07-04 — Productionize batch G: Sentry error monitoring (Next app + Trigger workers)

- Type: build
- Scope: `src/instrumentation.ts` (new), `src/instrumentation-client.ts` (new), `src/app/global-error.tsx` (new), `trigger.config.ts`, `package.json` (@sentry/nextjs)

Reasoning / RCA / research:
    - Zero error monitoring existed (console.log only). Chose Sentry over
      PostHog error tracking because @sentry/nextjs gives server+edge+client
      capture with three small files and no product-analytics coupling.
    - Everything is DSN-gated no-op: shippable before the Sentry project
      exists. Set SENTRY_DSN (server + trigger workers) and
      NEXT_PUBLIC_SENTRY_DSN (browser) to activate.
    - Skipped withSentryConfig/source-map upload — needs an auth token and a
      postinstall'd @sentry/cli (whose binary download hung npm install in
      this environment); runtime capture works without it.
    - Trigger workers: @sentry/node init + global onFailure hook in
      trigger.config.ts with taskId/runId/payload context — one hook instead
      of per-task try/catch. NOTE: @sentry/node currently resolves as a
      TRANSITIVE dep of @sentry/nextjs; add it as a direct dependency
      (`npm i @sentry/node`) to be safe against dedupe changes.
    - eslint bonus: renamed `useCompositeFor` → `shouldCompositeFor` in
      generation-run.ts — backend function, not a React hook; the name
      tripped rules-of-hooks and was the only thing keeping lint red.

Implementation summary:
    - Final gate: tsc 0 errors, 36/36 vitest, lint 0 errors (4 pre-existing
      warnings), `next build` clean.

### 2026-07-04 — Productionize batch F: UX polish bundle (8 audited gaps)

- Type: feature
- Scope: `src/app/(app)/library/{page,library-client}.tsx`, `src/components/auto-refresh.tsx` (new), `src/app/(app)/products/{page,bulk-upload}.tsx` + `[productId]/{product-actions,add-photos}.tsx`, `src/app/(app)/models/{page,models-client}.tsx`, `src/app/(app)/brand/{page,brand-kit-form}.tsx`, `src/app/actions/{products,brand}.ts`, `src/app/(app)/onboarding/wizard.tsx`, `src/app/(app)/dashboard/page.tsx`

Reasoning / RCA / research:
    - Every item traces to the 2026-07-02 UI/UX audit: hard 60/20 caps with
      unreachable older items; async statuses (dissection, model-gen) frozen
      until manual reload while the run page live-updated; silent failures in
      product delete/re-analyze; brand-kit save with zero feedback; onboarding
      ingest screen trapping the user while polling; dashboard checklist steps
      hardcoded done:false; bulk-upload copy promising add-photos-later with
      no such feature; native confirm() inconsistent with Dialog confirms.
    - add-photos deliberately does NOT re-trigger dissection: product-dissect
      reads only the primary image, so extra angles change renders (multi-
      reference fidelity) but not the cached dissection.
    - Onboarding escape hatch is always-visible (simpler than a 60s timer,
      same protection).

Implementation summary:
    - ?page=/?rpage= pagination with counts + Prev/Next; shared AutoRefresh
      client component (4s router.refresh while non-terminal, pattern from
      studio-canvas); toasts on product actions; client brand-kit form wrapper
      with pending state (orphaned void action wrapper removed); real
      checklist conditions + failed-ingest hint; addProductImages action
      reusing createProduct validation, 5-image cap; Dialog delete confirm.

### 2026-07-04 — Productionize batch E: paid editor edits moved to a Trigger.dev task

- Type: refactor
- Scope: `src/lib/editor/paid-edits.ts` (new), `src/trigger/creative-edit.ts` (new), `src/app/actions/editor.ts`, `src/app/(app)/library/[creativeId]/editor.tsx`

Reasoning / RCA / research:
    - Scene regen and baked-text edits ran 20-40s+ of image-model calls
      synchronously inside Next server actions — guaranteed timeout deaths on
      Vercel; the generation pipeline already used Trigger.dev correctly.
    - Split: actions keep validation + debitCredits (InsufficientCredits must
      surface synchronously) and return {pending, runId, publicToken}; the
      `creative-edit` task runs the moved logic; refunds on QA-fail/error live
      INSIDE the apply* functions (next to the failure), task catchError
      refunds only crashes before the edit ran, and a failed tasks.trigger
      refunds immediately — no path double-refunds.
    - Editor client: transitions renamed to *Transition and the old *Pending
      names became derived consts (transition || async-lane-active) — every
      existing disabled/spinner usage kept working untouched. useRealtimeRun
      watches the task (15-min scoped token); token-mint failure falls back to
      a one-shot 60s refresh.
    - loadOwnedCreative/recompositeAll/isBaked moved to the lib since both the
      actions file and the task need them.

Implementation summary:
    - retry maxAttempts 1 on the task — a retry would re-spend the image call
      after a refund.
    - Verified: tsc 0 errors, 36/36 vitest.

### 2026-07-02 — Productionize batch D: vision placement QA on composited overlays

- Type: feature
- Scope: `src/lib/pipeline/placement-qa.ts` (new), `src/trigger/generation-run.ts` (composeAllAspects)

Reasoning / RCA / research:
    - User-reported problem: overlaid text/logo sometimes lands on faces or
      the product. The template scorer is a plate-side heuristic (safe-band /
      busyness) — it never sees the final composited pixels.
    - Chose a post-composite vision check (gemini flash, same shape as
      text-qa.ts) over improving the heuristic: the failure mode is visual,
      so judge the actual output. ~$0.003/aspect.
    - One retry with the runner-up template, then fail-open (ship top-scored
      anyway): a slightly awkward overlay beats a failed creative, and the
      human Review gate is the documented quality stance (CONTEXT.md).
    - QA verdict recorded in `critic.placementQa` per aspect for audits.

Implementation summary:
    - checkOverlayPlacement(): overlapsKeyContent + unreadable booleans,
      fail-open on infra error (mirrors checkBakedText).
    - composeAllAspects: QA best composition → maybe re-render scored[1] →
      re-check → keep winner; skipped when the creative has no headline.

Follow-ups deferred:
    - No second retry round — by design (cost/latency); revisit only if
      Review keeps catching placement misses.

### 2026-07-02 — Productionize batch C: unified image-model config + super-admin model bake-off

- Type: feature
- Scope: `prisma/schema.prisma` (+migration `20260702105109`), `src/lib/image/{provider,runware}.ts`, `src/trigger/generation-run.ts`, `src/app/actions/{generate,editor}.ts`, `src/lib/pipeline/cost-log.ts`, `src/app/(app)/studio/{page,create-form}.tsx`, `src/app/(app)/studio/[runId]/{page,studio-canvas}.tsx`

Reasoning / RCA / research:
    - Three-way model drift: pipeline rendered gemini-3.1-flash-image, editor
      paid edits called Nano Banana Pro via Runware directly, CONTEXT.md
      claimed "NB Pro everywhere". Grill decision: run ONE bake-off, then pin
      a single default; until then flash is the default everywhere.
    - Editor migrated from direct Runware calls to the generateScene router:
      same env-driven default + fallback chain as the pipeline, and edits now
      log to ApiCostLog (new "editor" source) — they were invisible to cost
      observability before. IMAGE_MODEL_SLOTS deleted (last caller gone).
    - Bake-off = per-run flag, super-admin only (silently ignored otherwise —
      flag can only arrive via forged form). Each concept renders once per
      variant {nb2, nb-pro, gpt-image-2, seedream} with a FORCED provider
      (no fallback: a failed variant is a data point, not a reroute).
    - Reused the whole existing machinery: one Creative row per concept ×
      variant (no unique constraint on conceptIndex made this free), storage
      keys/status ids suffixed with the variant key. Rejected a parallel
      "bakeoff results" table — the run page, editor and library then need
      nothing new.
    - Credits: bake-off debits 0 (admin testing tool); partial-refund path
      now guards on creditsDebited > 0, otherwise a failed bake-off concept
      would GRANT free credits.
    - New Creative.imageModel column records the actual cost-model id for
      EVERY run (provenance), not just bake-offs.

Implementation summary:
    - BAKEOFF_VARIANTS + IMAGE_MODEL_LABELS exported from provider.ts;
      ConceptCtx gains forced/variantTag; direct mode fans out too.
    - Run page shows per-option model labels; failed work items render as
      distinct slots (wired the previously-dead conceptStatus prop) with the
      pipeline error as tooltip.
    - Verified: tsc clean, 36/36 vitest, additive migration applied to dev DB.

Follow-ups deferred:
    - Per-variant USD badge on the run rail (IMAGE_PRICING lookup) — model
      label + /admin/costs covers the compare loop for now.

### 2026-07-02 — Productionize batch B: dead-weight removal + CONTEXT.md trued to overlay-first typography

- Type: chore
- Scope: `legacy/`, `graphify-out/`, `scripts/spikes/*` (kept FINDINGS.md), `scripts/_*.mjs`, `package.json` (satori, @resvg/resvg-js), `src/lib/image/runware.ts`, `src/trigger/generation-run.ts`, `src/app/(app)/library/[creativeId]/{editor,preview-stage}.tsx`, `CONTEXT.md`, `.gitignore`

Reasoning / RCA / research:
    - legacy/ (23MB old pages-router site) had zero imports from src/ and was
      tsconfig-excluded; its features were already ported to (marketing).
      Keeping it invited accidental edits to dead code.
    - satori/@resvg were spike-only deps — the Devanagari spike proved satori
      can't shape matras (scripts/spikes/FINDINGS.md), which is WHY the
      compositor is @napi-rs/canvas; FINDINGS.md kept, spike code deleted.
    - `deriveProductPlacement` stub always returned null — but the concept
      schema already carries a real `productPlacement`. Wired it through
      composeAllAspects instead of deleting the constraint entirely (root
      cause: plumbing was never finished, not that the constraint was wrong).
    - CONTEXT.md claimed baked two-pass typography as default and "Nano Banana
      Pro everywhere"; code ships wordless plates + canvas overlay and renders
      on gemini-3.1-flash-image. Decision (grill session): overlay-first IS
      the product (free edits, correct Indic shaping) — docs updated to match
      code, not code to match stale docs. Baked stays as paid editor upgrade.
    - Editor approve copy promised "client sharing" — feature doesn't exist;
      copy trimmed to "download" rather than building share links (scope).

Implementation summary:
    - Deleted legacy/, graphify-out/ (+ .gitignore), 5 hardcoded-ID debug
      scripts, spikes except FINDINGS.md; removed flux_2_pro model entry
      (zero callers); npm uninstall satori @resvg/resvg-js.
    - concept.productPlacement now flows into selectTemplates' constraint.
    - CONTEXT.md: Plate/Typography Mode/Concept-brief sections rewritten.

Follow-ups deferred:
    - IMAGE_MODEL_SLOTS draft/final restructure deferred to the unified
      IMAGE_DEFAULT_MODEL config landing with the bake-off feature (batch C)
      to avoid double churn.
    - seedream_v5_lite entry kept: unused but not approved for removal.

### 2026-07-02 — Productionize batch A: public API hardening (debug leak, PII oracle, rate limits)

- Type: bug
- Scope: `src/app/api/_debug-db/` (deleted), `src/app/api/health/route.ts` (new), `src/lib/rate-limit.ts` (new), `src/app/api/{check-user,send-enquiry,send-test-report}/route.ts`, `src/app/(marketing)/tests/business-health/wizard.tsx`

Reasoning / RCA / research:
    - `_debug-db` was a public GET returning DB username/host + raw error
      strings — debug scaffolding that shipped. Replaced by /api/health that
      returns ok/503 only; left public (uptime monitors can't hold sessions)
      because it now leaks nothing, and rate-limited as belt-and-braces.
    - `check-user` returned any person's test score + date given phone+email —
      an enumeration oracle. Neutered to boolean + copy; the same leak existed
      in send-test-report's 409 duplicate branch. Wizard's score/date display
      became orphaned and was removed with it.
    - Both Gmail-sending routes had zero throttling. Chose an in-memory
      sliding-window limiter over Upstash/Redis: no new infra, and per-instance
      limits are acceptable at pre-launch traffic (limitation documented in
      src/lib/rate-limit.ts).
    - next.config.ts 50mb bodySizeLimit audited but left: the inline comment
      already justifies it (5×8MB product form + margin) — audit flag was a
      false positive.

Implementation summary:
    - New rate-limit lib (sliding window, stale-key sweep at 5k keys);
      limits: check-user 20/10min, send-enquiry 5/h, send-test-report 3/h,
      health 30/min, all per-IP (x-forwarded-for first hop).
    - Verified: `npx tsc --noEmit` clean, 36/36 vitest pass.

Follow-ups deferred:
    - Shared-store rate limiting (Upstash) when traffic justifies infra.
    - Email-HTML injection surface in send-test-report's 700-line inline
      template noted but untouched this batch (values are zod-validated
      strings; full HTML-escape pass is a candidate for a later batch).

### 2026-07-02 — Devlog initialized via `/setup-devlog`

- Type: chore
- Scope: `DEVLOG.md`, `CLAUDE.md`

Reasoning / RCA / research:
    - Project lacked a structured journal of decisions, tradeoffs, and
      bug fixes; CONTEXT.md holds the domain glossary but not the
      change-by-change reasoning. Productionize session (2026-07-02)
      generates many decisions worth recording.
    - Chose append-only flat markdown over a tool because the file lives
      next to the code, follows the repo, and survives tool churn.

Implementation summary:
    - Created DEVLOG.md from the setup-devlog skill template
    - Added discipline section to CLAUDE.md so every session appends
      entries in the same session as the change
    - DEVLOG.md is committed (team-visible decision log), not gitignored —
      solo project, doubles as the durable decision record

Follow-ups deferred:
    - First few entries set the tone. If they drift toward "what
      changed" instead of "why we chose this," recalibrate by reading
      back the Style rules above.
