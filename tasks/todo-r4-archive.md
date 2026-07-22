# Round 4 — Productization: dev script, pipeline quality, account types, marketing, AI bot (2026-07-11) — DONE (all R4 items ✅, gate passed 2026-07-11)

Execution order: R4.1 → R4.5 → R4.4 → R4.2 → R4.3
(pipeline before marketing/bot so copy + bot knowledge describe FINAL capabilities; account types before marketing because login-only changes login copy.)

## R4.1 `npm run dev` runs Trigger.dev too — ✅ DONE
- [x] `dev` = concurrently(next dev, trigger dev); `dev:next`/`dev:trigger` standalone
- [x] devDeps: concurrently@^10, trigger.dev@4.4.6 (pinned = SDK version); allowScripts approvals for CLI esbuild/@depot postinstalls
- [x] Verified 25s smoke run; zero prod impact (Vercel runs `next build`; Trigger deploys via `trigger.dev deploy`)
- [x] DEVLOG entry

## R4.5 Pipeline review + quality-first hardening
- [ ] Fallback chain → tiered steps in src/lib/image/provider.ts:
      **Nano Banana Pro (gemini hero) → gpt-image-2 → Nano Banana 2 (gemini default) → Seedream** (user-specified order)
      — single reusable FALLBACK_CHAIN of {provider, tier} consumed by generateScene; call-site API unchanged
- [ ] Default render tier → hero / NB Pro (quality > cost, per user)
- [ ] BRIEF VALIDATOR stage: semantic QA of concepts (product/brand/occasion consistency) + one repair round, between CONCEPTING and RENDERING
- [ ] PROMPT ENHANCER stage in-pipeline for image prompts (enhance-prompt.ts is UI-only today)
- [ ] Fail-open QA gates (pack-qa, placement-qa): add one extra quality-critical retry
- [ ] Tests: chain order, validator schema; tsc + vitest green
- [ ] UI: NB Pro default pref; label fallback-used
- [ ] DEVLOG entry

## R4.4 3 account types + workspaces + login-only + invites
- [ ] schema: enum WorkspaceType { FMCG_PRODUCT, APPAREL_ON_MODEL, FASHION_EDITORIAL } + Workspace.type; Creative.deletedAt
- [ ] Thread type → AuthContext + generation defaults (FMCG: SKU + festival/theme/custom, EXACT_PRODUCT/IN_SCENE; APPAREL: ON_MODEL standard; FASHION: ON_MODEL editorial-campaign prompt flavor)
- [ ] Login-only: signIn callback denies unknown emails (no User + no PENDING invite) → "invite required" page; remove auto-workspace-create; fix login caption
- [ ] Invite email: src/lib/email.ts (nodemailer GMAIL_* pattern from send-enquiry) sent from inviteMember
- [ ] Workspace setup + creative soft-delete script (DESTRUCTIVE — only after explicit user confirm)
- [ ] Re-run refreshBrandIntel per workspace after setup
- [ ] Additive prisma migration
- [ ] DEVLOG entries

## R4.2 Marketing redesign (design-taste-frontend skill)
- [ ] Read SKILL.md lines 509+ first
- [ ] Scope: src/app/(marketing)/* + src/components/marketing/* + mk-tokens in globals.css
- [ ] Remove ALL 44 user-facing em-dashes (rewrite sentences, not mechanical swaps)
- [ ] Studio copy = real capabilities (overlay compositor, NOT "typography set into the image"; verify 45-occasions count, credits, languages, refund + QA claims)
- [ ] Skill hard rules: hero discipline, eyebrow cap, section variety, CTA dedup, image strategy
- [ ] DEVLOG entry

## R4.3 AI bot (Synerix-scoped, Gemini Flash)
- [ ] Vercel AI SDK (`ai` + `@ai-sdk/google`, already installed): streamText, `gemini-flash-latest`; env GOOGLE_GENERATIVE_AI_API_KEY (user adds)
- [ ] src/app/api/chat/route.ts guardrails: scoped system prompt + embedded knowledge base, topic refusal, input/output caps, message-count cap, rate limit (src/lib/rate-limit.ts), no tools, no prompt disclosure
- [ ] Floating chat widget in (marketing) layout
- [ ] DEVLOG entry

## Review (2026-07-11)
- R4.1 ✅ dev script (verified via 25s smoke run)
- R4.5 ✅ tiered cascade NB Pro → GPT → NB2 → Seedream (resolveSceneChain, 4 new tests); brief validator + repair (sonnet judge, opus repair, fail-open); batch prompt enhancer (opus, guarded); pack QA 2 retries; placement QA 2 runner-ups; fallback badge on single picks
- R4.4 ✅ code + DB EXECUTED (user confirmed 2×): migration applied; 39 creatives soft-deleted; FMCG Creative Studio / Apparel Studio / Fashion Editorial Studio created (owner dev@synerix.local, god-view covers all); invite-only auth + /request-access; invite emails; soft-delete filters on 9 reads; FASHION_EDITORIAL brief flavor
- R4.2 ✅ marketing polish: truthful Studio copy (overlay-first, invite-only), zero em/en dashes, eyebrow rationing 6→2/page, hero discipline, bento features, CTA dedup. Verified: build + lint + tsc clean
- R4.3 ✅ chat bot: /api/chat (AI SDK v6 + gemini-flash-latest, zod validation, rate limit 10/min, 500-token cap, scope-locked system prompt, 503 w/o key) + mk-styled floating widget in (marketing) layout
- Gate: tsc 0 · 49/49 vitest · eslint clean · next build clean
- User TODOs: add GOOGLE_GENERATIVE_AI_API_KEY, GOOGLE_CLIENT_ID/SECRET, GMAIL_USERNAME/PASSWORD, SUPER_ADMIN_EMAIL; sign in once w/ Google before running setup script; `npx trigger.dev deploy` when ready

---

# Round 3 — Quality reset after floating-pack run (2026-07-05) — ✅ EXECUTED

User's verdict on run 2: pack floating mid-air (crude cut-out paste), dull scene, still blue CTA.
Directive: quality over cost; latest opus/sonnet for concepting; NB Pro / GPT-Image-2 for images;
user-selectable "both" for comparison.

- [x] R3.1 Concepts → claude-opus-4-8 (enhance rides same slot); research → claude-sonnet-5;
      pricing table updated; live smoke test passed on both
- [x] R3.2 Cut-out paste RETIRED: EXACT_PRODUCT renders in-scene on premium model + pack-fidelity QA
      (label verified vs reference, one strict retry); concepts.ts stages pack prominent + label-readable
      instead of forcing product_hero; cutout.ts left in place but unused (deletion not approved)
- [x] R3.3 Image model picker in create form (all users): Nano Banana Pro (default) / GPT Image 2 /
      Both — compare (2× credits, per-option side-by-side with model badges on the run page)
- [x] R3.4 Single picks soft-prefer (fallback chain kept); compare/bake-off hard-forced;
      GenerationRun.imageModelPref (+migration); refund math unchanged (queue doubles with cost)
- [x] R3.5 Editor paid edits → hero tier (same premium bar as generation)

Gate: tsc 0 · 36/36 vitest · lint 0 errors · build clean · live opus/sonnet smoke OK.
**User TODOs:** re-test the same Gillco brief (pick "Both — compare" to judge NB Pro vs GPT-Image-2);
`npx trigger.dev deploy`; re-ingest Gillco (or set brand colors in Brand Kit) to kill the blue CTA;
note per-run API cost now higher (~$0.15-0.30 concepting + $0.134/img NB Pro) — visible in /admin/costs.

---

# Round 2 — Quality/Perf/Content fixes (2026-07-04) — ✅ EXECUTED 2026-07-05

User's 7 concerns from first real run (Gillco "Punjabi Poori Atta", 9:16, EXACT_PRODUCT, Friendship Day).
Root causes investigated (4 subagent audits + DB inspection of run 82e64023). Plan below; verify per batch:
`npx tsc --noEmit` + `npm test` + `npm run build` + touched flow.

## Batch 1 — Output quality: overlay typography (user items 2)
- [x] 1a. Local-contrast enforcement: sample plate pixels under each text layer + CTA pill in
      composeAllAspects; WCAG ratio < threshold → remap colorRole to ink/white or luminance-shifted
      variant (new helper in src/lib/composition/analyze.ts)
- [x] 1b. Un-dead the `dominant` param in resolveRoles (src/lib/composition/color.ts:24): accent too
      close in hue/luminance to a dominant plate color → substitute
- [x] 1c. Empty-band anchoring: analyzeRegions 3 fixed thirds → 6–8 bands returning calmest band's
      y-range; anchor copy block into it; on 9:16 drop safeBottom 400 → ~120 when bottom band calm
- [x] 1d. Fix 9:16 band classifier (score.ts:72-74): classify by headline center vs thirds
- [x] 1e. Placement QA hardening: per-layer verdict schema (eyebrow/headline/body/cta/logo ×
      overlaps/lowContrast); retry must differ in archetype; double-fail → render guaranteed-legible
      fallback (clean-bottom, all-ink, scrim 0.75) instead of shipping the failure
- [x] 1f. Wire concept typographySpec zone (generated + reserved in plate, currently discarded) into
      selectTemplates signals

## Batch 2 — Output quality: exact-pack fidelity + brand palette (user items 3 + root of 2's blue)
- [x] 2a. Thread fidelityMode into generateConcepts; EXACT_PRODUCT → force/strongly-prefer
      productPlacement=product_hero (composite path = real pack pixels)
- [x] 2b. Pack-region vision QA for residual in-scene renders in EXACT_PRODUCT: compare rendered pack
      vs reference photo; mismatch → re-render once or demote to composite fallback
- [x] 2c. Brand ingest palette hygiene: prompt prefers logo/brand-mark colors, rejects generic UI
      blues; validate against extracted logo palette before persisting primaryColorHex/accentColorsHex
- [x] 2d. (decide) hero tier (NB Pro) for in-scene EXACT_PRODUCT renders — 2.2× image cost on those

## Batch 3 — Performance (user item 4)
- [x] 3a. db.ts:23 pool max 1 → 5 (unblocks all Promise.all query fan-outs)
- [x] 3b. ensureMembership early-return when no invites + memberships exist (−2 queries/request)
- [x] 3c. Cache signed URLs: unstable_cache around getSignedThumbUrls/getSignedUrls, revalidate 3300s
- [x] 3d. Remove double render: drop router.refresh() from editor mutate() success (actions already
      revalidatePath)
- [x] 3e. Studio polling: refresh only on realtime done-increment/terminal; interval = fallback only
- [x] 3f. renderNewAspect (size generation) → existing Trigger.dev pending-edit path
- [x] 3g. Drop layout's duplicate memberships query (expose from requireAuth)

## Batch 4 — Per-run cost dashboard (user item 1)
- [x] 4a. Runs list page: every generation run + credits debited + USD total (ApiCostLog has
      runId+stage already — pure UI). DECIDE: super-admin only (raw USD = internal margin data) vs
      workspace-visible
- [x] 4b. Run drilldown: per-stage cost table (concepts/enhance/image/placement-qa/…), per-source
      totals incl. editor/dissect/brand-research

## Batch 5 — Festival picker in create form (user item 5)
- [x] 5a. Occasion selector inside studio create form (upcoming calendar entries + custom brief),
      not only via home/calendar deep-link ?occasion=

## Batch 6 — Marketing site content + responsive (user item 6)
- [x] 6a. Home: consulting-led hero; restore old 6-service catalogue (data/features.ts base,
      enriched in new concrete voice); restore Why-Us pillars + real testimonial (verify facts);
      stats row → verifiable facts; de-festival the Studio band
- [x] 6b. /consulting: expand 4 → 6 service areas; add Who-we-are (25+ yrs credential — verify);
      keep engagement cadence + free-first-conversation
- [x] 6c. /synerix-studio: kill over-claims ("agency-grade", "pixel-faithful", "never drawn wrong",
      "swear an agency made", "45+"→"45"); lead with your-product-your-brand; festivals = one bullet;
      foreground true differentiators (refunds, 4 concepts, 4 languages, human activation)
- [x] 6d. Responsive nits: admin leads grid-cols-3 → responsive; admin tabs overflow-x-auto;
      create-form/editor unprefixed grids checked at 320px
- [x] 6e. Unify WhatsApp number to env WHATSAPP_NUMBER (3 hardcoded sites); metadata de-hype
- [x] 6f. Verify CREDIT_COSTS.perConcept + LIMITS.maxConceptsPerRun match pricing copy

## Batch 7 — Onboarding workspace profile (user item 7)
- [x] 7a. Add 2–3 skippable onboarding questions: industry/category, primary use case, sells via
      (marketplace/D2C/offline); store on Workspace
- [x] 7b. Profile drives surface: hide/deprioritize Models nav + on-model mode where irrelevant
      (e.g. packaged-foods brand), default fidelity mode, calendar relevance ordering

## Round 2 Review (2026-07-05)

Final gate: `tsc --noEmit` 0 · 36/36 vitest · lint 0 errors (4 pre-existing warnings) ·
`next build` clean. New migration `20260704202919_add_workspace_profile` applied to dev DB (additive).
DEVLOG entries per batch. Decisions as approved: cost dashboard super-admin only; exact-pack forces
product_hero + pack QA; hero tier NOT enabled (revisit post bake-off).

**Deviations / notes:**
- 2b "demote to composite fallback" → implemented as one strict re-render + verdict in critic
  (crude center-paste composite onto an already-staged scene looks sticker-like; review gate + verdict
  is the better failure mode).
- 1c safeBottom drops to 160 (not 120) when the 9:16 bottom band is calm — keeps motto/contact clear.
- 6a testimonial: the "Utkarsh Singh @AccioJob" quote in the old repo was a commented-out TEMPLATE
  placeholder (praising "Monkster"), never a real client quote → REMOVED from both pages; a marked
  slot comment remains. Add only real verified quotes.
- 4: an older uncommitted aggregate-only /admin/costs page existed; replaced by the run-centric
  dashboard (spec matched your ask). Old aggregate view not preserved.
- 7b calendar-relevance ordering + default-fidelity by profile deferred (profile data must exist first);
  on-model is hidden by product category (APPAREL) in the create form — stronger signal than profile.
- Incident: a subagent's `git stash` transiently reverted uncommitted `prisma/schema.prisma` to HEAD;
  fully restored from the generated client's embedded inlineSchema + verified (`prisma validate`, 24 models).

**User TODOs:**
1. Test flows, then commit + push yourself (nothing committed). Suggested first test: repeat the
   Gillco Friendship-Day 9:16 EXACT_PRODUCT run and compare against the old output.
2. Deploy trigger tasks (`npx trigger.dev deploy`) — generation-run, brand-ingest, creative-edit all changed.
3. Re-ingest the Gillco brand (or manually set brand colors) so the logo-grounded palette replaces the blue.
4. Verify consulting-page claims you alone can confirm: "25+ years", "run, grown and rescued real businesses".
5. Set `WHATSAPP_NUMBER` env (falls back to +91 92164 92174).
6. Sentry TODOs from round 1 still open (`npm i @sentry/node`, set DSNs).

---

# Productionize — Synerix Studio (2026-07-02)

Decisions locked via grill session. I edit only — user tests, commits, pushes.
Verify after every batch: `npx tsc --noEmit` + `npm test` + `npm run build` + touched flow.

## Batch A — Security (highest risk, safe fixes) ✅ verified (tsc clean, 36/36 tests)
- [x] A1. Delete `src/app/api/_debug-db/route.ts` (public DB-info leak; no caller in src)
- [x] A2. `GET /api/health` — public but leak-free (ok/503 only) + rate-limited; deviation from "auth-gated": uptime monitors can't hold sessions, nothing sensitive returned
- [x] A3. `src/lib/rate-limit.ts` — in-memory sliding-window limiter (per-instance on serverless; fine at current traffic)
- [x] A4. `/api/check-user` → boolean-only (`hasTakenTest` + copy, no score/date), rate-limited 20/10min; wizard's orphaned score/date display + type fields removed; same oracle neutered in send-test-report 409 branch
- [x] A5. Rate-limited `/api/send-enquiry` (5/h/IP) + `/api/send-test-report` (3/h/IP)
- [x] A6. No change — 50mb already right-sized: comment in next.config.ts covers the legit 5×8MB product-form max with margin

## Batch B — Cleanup + docs ✅ verified (tsc clean, 36/36 tests)
- [x] B1. Deleted `legacy/`, `graphify-out/` (+ gitignore), spikes except `FINDINGS.md`, 5 `scripts/_*.mjs` debug scripts
- [x] B2. Removed `satori` + `@resvg/resvg-js` deps (only non-spike match was a comment)
- [x] B3. Removed `flux_2_pro`; `deriveProductPlacement` stub replaced by wiring real `concept.productPlacement` → `selectTemplates` (root-cause fix); `IMAGE_MODEL_SLOTS` restructure deferred to C1; `seedream_v5_lite` kept (not approved for removal)
- [x] B4. Sharing copy fixed in editor + preview-stage
- [x] B5. `CONTEXT.md` trued: overlay-first typography, env-driven model tier, bake-off note
- [x] B6. `DEVLOG.md` created (committed mode — default chosen while user AFK, reversible) + discipline snippet in project CLAUDE.md

## Batch C — Model config unification + admin bake-off ✅ verified (tsc clean, 36/36 tests, migration applied)
- [x] C1. Editor paid edits migrated to `generateScene` router (env-driven default = NB2 flash via existing `GEMINI_IMAGE_MODEL_FAST`/`IMAGE_PROVIDER`, fallback chain, + editor costs now land in ApiCostLog via new "editor" source); `IMAGE_MODEL_SLOTS` deleted
- [x] C2. Bake-off: `GenerationRun.bakeoff` + `Creative.imageModel` columns (migration `20260702105109`); super-admin toggle in create form; fan-out concepts × {nb2, nb-pro, gpt-image-2, seedream} with forced provider (no fallback); zero debit + refund guard; model labels on run rail
- [x] C3. Normal runs untouched: single variant, fallback chain intact

## Batch D — Overlay placement QA ✅ verified (tsc clean, 36/36 tests)
- [x] D1. `placement-qa.ts` vision check on composited pixels; fail → re-composite with runner-up template, re-check once, fail-open; verdict stored in `critic.placementQa`; cost-tracked
- [x] (F3 pulled forward) `conceptStatus` wired: failed work items render as distinct slots with error tooltip; PARTIAL runs now explain themselves

## Batch E — Editor async migration ✅ verified (tsc clean, 36/36 tests)
- [x] E1. `src/lib/editor/paid-edits.ts` + `creative-edit` task; debit stays sync in actions, refunds live next to failures, no double-refund paths
- [x] E2. Editor watches the task via useRealtimeRun (scoped 15-min token, 60s-refresh fallback); per-lane busy states preserved via derived consts

## Batch F — UX polish bundle ✅ (agent-implemented, verified: tsc 0, 36/36, lint 0 new)
- [x] F1. Library pagination (?page/?rpage + counts + Prev/Next, tab preserved)
- [x] F2. `AutoRefresh` component on Products + Models lists (4s while non-terminal)
- [x] F3. Done in Batch C/D pass (failed-slot display on run canvas)
- [x] F4. ProductActions toasts on delete/re-analyze results
- [x] F5. Brand-kit client form wrapper: pending + toasts (orphaned void wrapper removed)
- [x] F6. Onboarding ingest: always-visible "fill in manually" escape (chose simpler variant over 60s timer)
- [x] F7. Dashboard checklist: real done states + destructive failed-ingest hint
- [x] F8. `addProductImages` action (reuses createProduct validation, 5-cap, no re-dissect — dissection reads primary image only) + add-photos tile on detail page
- [x] F9. Model delete → Dialog confirm

## Batch G — Ops ✅ verified (full gate: tsc 0, 36/36 tests, lint 0 errors, build clean)
- [x] G1. Sentry: instrumentation.ts + instrumentation-client.ts + global-error.tsx + @sentry/node onFailure hook in trigger.config.ts — all DSN-gated no-ops until `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` set. Source-map upload (withSentryConfig) skipped deliberately.
- [x] G2. Covered by the onFailure hook (taskId/runId/payload context) + existing logger calls
- [x] Bonus: `useCompositeFor` → `shouldCompositeFor` (eslint rules-of-hooks false positive; lint now 0 errors)

## Review

All 7 batches executed and verified. Final gate 2026-07-04: `tsc --noEmit` 0 errors ·
36/36 vitest · lint 0 errors (4 pre-existing warnings in untouched files) ·
`next build` clean. DB migration `20260702105109` applied to dev DB (additive).

**User TODOs (things only you can do):**
1. Test flows, then commit + push (nothing is committed — repo was already fully uncommitted before this session).
2. `npm i @sentry/node` — currently resolves transitively via @sentry/nextjs; make it direct.
3. Create Sentry project → set `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` in env (Vercel + Trigger.dev).
4. Deploy trigger tasks (`npx trigger.dev deploy`) — new `creative-edit` task + changed `generation-run` must ship together with the app.
5. Run a bake-off (super-admin studio form toggle) → crown a model → pin via `IMAGE_PROVIDER`/`GEMINI_IMAGE_MODEL_FAST` env if the winner isn't NB2 flash.

**Known limitations (accepted):**
- Rate limiter is per-instance (in-memory) — fine pre-launch, swap for Upstash at scale.
- Placement QA is one retry, fail-open — human Review gate is the backstop.
- Email-HTML injection surface in send-test-report's inline template noted but untouched (values are zod-validated; full escape pass = backlog).
- `pipelineChain` in-process serialization of run pipeline JSON — pre-existing, unchanged.
