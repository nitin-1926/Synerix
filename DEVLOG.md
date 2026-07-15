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
