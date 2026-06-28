# Spike Findings

## Spike 0a — Devanagari text rendering (2026-06-06)

**Question:** Can satori (`@vercel/og`'s engine) shape Devanagari correctly for the creative compositor?

**Result: NO — satori is disqualified for Hindi.**

- satori (v0.18.3, via `satori` npm): conjuncts (श्रे, द्ध, त्यो, क्ष, ज्ञ), nukta (फ़), and chandrabindu (एँ) render correctly (font GSUB applies), but **pre-base i-matra reordering fails**: दिवाली → दविाली, मिठास → मठिास, निःशुल्क → नःिशुल्क, डिलीवरी → डलिीवरी, रहित → रहति. Reproduced identically in Noto Sans Devanagari and Mukta → shaper limitation, not a font issue. satori has no HarfBuzz-class Indic shaping.
- `@napi-rs/canvas` (Skia, prebuilt napi binaries, Vercel/Trigger.dev compatible): **all cases correct**, including i-matra reordering, repha (ऑर्डर), and mixed Latin+Devanagari font fallback in a single line.

**Decision:** Compositor = `@napi-rs/canvas`. Consequences:
- `overlaySpec` (absolute-positioned layers) is the renderer contract — fits canvas natively.
- floki's `archetypes.tsx` ports as: archetype layout functions (compute overlaySpec from concept + brand) + a single canvas renderer (`renderOverlay(plate, overlaySpec) → PNG`).
- Manual text wrapping/auto-sizing via `ctx.measureText` (replaces satori flexbox + `autoHeadlineSize`).

Artifacts: `out/devanagari-hi-noto.png`, `out/devanagari-hi-mukta.png` (satori, broken), `out/devanagari-napi-canvas.png` (canvas, correct).

## Spike — Nano Banana Pro DIRECT, two render modes (2026-06-07)

**Decisive.** `gemini-3-pro-image` (Nano Banana Pro) via the direct Gemini API (`generateContent`, `responseModalities:["IMAGE"]`, `imageConfig.aspectRatio`, product photo as `inline_data`) is far better than the old Seedream-draft + cut-out approach.

- **In-scene** (`out/nb-inscene.png`): real Gillco pack reproduced faithfully and held ONCE (correct hands), golden puffed pooris + chole, a kadhai deep-frying a poori in oil (domain-correct, NOT tawa), diyas/marigolds. No duplicate, no pasted look, single shot. Minor label-text wobble ("Gilleo") → that's what composite mode is for.
- **Product-less** (`out/nb-productless.png`): gorgeous scene with a deliberate clean empty hero space center-right for compositing the real cut-out.

→ Build: single-shot in-scene on Nano Banana Pro direct; composite mode uses a product-less prompt. Drop critic loop + QA. Product-intelligence brief drives domain-correct scenes.

## Overhaul verified — new pipeline (2026-06-07)

Real Gillco/Punjabi Poori Atta Diwali run on the rebuilt pipeline (Nano Banana Pro direct, product-first concepting, in-scene mode, no critic/QA):
- **COMPLETE in 91s** (was ~300s). 4 creatives, $0.117/creative ($0.40 images @ $0.10 Nano Banana Pro direct + $0.066 concepts).
- Concepts product-correct: "Kadhai Glow" (pooris frying in oil), "Family Table" (thali), "Softness Test", "Diwali Offer Rush" — NO tawa, NO atta-on-rangoli.
- Creatives (`.playwright-mcp/v2-creative-*.png`): real pack placed ONCE in-scene (no duplicate/paste), deep-fried puffed pooris + chole, logo TOP-LEFT properly sized, clean English headline/subhead/CTA. Agency quality, verified by eye.
- Zod lesson again: concept schema needed lenient (no regex/min/max) + sanitize hexes in code.

## Spike 0b — Exact-product fidelity (2026-06-06)

**Question:** Can reference-image generation preserve an exact product (labs dissection prefix + reference image) well enough for the subjectFidelity ≥ 7 bar?

**Result: YES — with models we already have keys for.**

Pipeline tested: Seedream V4 ground-truth packshot (distinctive mithai box: saffron lid + white jali + gold medallion + teal band) → Gemini dissection (311 chars) → in-scene generation (Indian woman in saree holding the box, Diwali set) with the packshot as Runware `inputs.referenceImages`:

| Leg | Critic subjectFidelity | My visual read | Notes |
|-----|------------------------|----------------|-------|
| Nano Banana Pro (`google:4@2`) | 10 | ~9 | Best texture fidelity; lattice slightly simplified. peopleRealism excellent |
| Seedream V4 (`bytedance:5@0`) | 10 | ~8 | Lid border embossing softened; same product identity. Larger output sizes available |

**Decisions/notes:**
- Primary in-scene path = Runware reference-image generation (Nano Banana Pro first). GPT Image 2 comparison is now an *optional* enhancement once OPENAI_API_KEY exists, not a blocker.
- Critic (Gemini 2.5 Flash) is **lenient** — returned 10s where ~8-9 is honest. Production critic needs an anchored rubric (force listing differences before scoring, give 8 = "any visible pattern/proportion deviation") and possibly a stronger judge model.
- Residual risk: ground truth here was a clean AI packshot. Re-validate with a real SMB phone photo (cluttered background, imperfect lighting) — Phase 4 acceptance test.

Artifacts: `out/fidelity-ref-product.png`, `out/fidelity-gen-nano-banana-pro.png`, `out/fidelity-gen-seedream-v4.png`.

## Golden-path run (2026-06-06) — gillcoagro.com / Punjabi Poori Atta

Full real run via the live app (Vercel-style Next + Trigger.dev worker + Supabase):
brand ingest (DNA `#1d59a2`, logo, 37 classified assets, product list incl. the SKU) →
product added with the **real site image** (PPA.jpg) → dissection (400-char prefix, 16s) →
Diwali generation (Hindi) → **4 creatives, all READY** (1 production_ready, 3 review) →
editor: language switch + text edit (free), 9:16 re-render (free), regenerate-with-instruction (1 credit) →
credit ledger reconciled (30 → −4 → +4 refund → −4 → −1 = 25).

Quality: photoreal Indian models, **exact product preserved** (in-scene where the model managed it, cut-out fallback otherwise), **flawless Devanagari**, real logo + motto composited, brand palette respected. Verified visually, not just by the critic.

### Cost per creative (measured, Nano Banana Pro finals)
One run = 4 creatives, **$0.655 total → $0.164 / creative**:
- Images: **$0.48** (8 × $0.06 Nano Banana Pro `google:4@2`) — the dominant cost
- LLM: **$0.175** (concepts Sonnet $0.044 · critic Gemini Flash ~$0.08 · QA Haiku+Sonnet ~$0.05)
- One-time setup (amortized, not per-creative): brand DNA + dissection ≈ $0.02 total
- Each regen-with-instruction edit ≈ $0.06 (1 image)

**Levers**: switch in-scene drafts to Seedream V4 ($0.03) to ~halve image cost; the critic early-exit (added this run) already cut wasted iterations for printed-label products; QA Sonnet escalation adds ~$0.012/escalated concept.

### Tiered-model optimization (wired 2026-06-06)
Critic-loop drafts now always run on **Seedream V4 ($0.03)**; the quality model (Nano Banana Pro $0.06) fires once **only to rescue a borderline exact-product render** (fidelity in `[rescue=5, veto=7)`). Hopeless printed-label products early-exit to the free, exact cut-out — zero quality-model spend. Config: `IMAGE_MODEL_DRAFT`, `IMAGE_MODEL_FINAL`, `CRITIC_FIDELITY_RESCUE`, `EXACT_FINAL_UPGRADE=0` to disable.

**Measured after optimization** (same Gillco/Diwali run): images **$0.48 → $0.15**, total **$0.655 → $0.269**, **per-creative $0.164 → $0.090** (−45%). All 5 images were `bytedance:5@0`. Also added **partial credit refund** — a PARTIAL run now refunds `failed × perConcept` credits (only charge for delivered creatives).

## Bugs found & fixed during the run (all real-integration only)
1. Trigger worker loads `.env` not `.env.local` — synced them.
2. Supabase shared pooler host flaked ("tenant not found") — use direct host `db.<ref>.supabase.co:5432` locally.
3. Brand DNA: Gemini structured output fails strict schema (regex/min/max) — permissive LLM schema + `normalizeBrandDna`.
4. QA + critic: Claude/Gemini return out-of-range scores → strict `min/max` Zod fails the whole object — dropped constraints, clamp in code.
5. Base UI `Button render={<Link/>}` needs `nativeButton={false}` (threw in client components).
6. **Zod v4 `z.record(enumKey, val)` is exhaustive** — required absent roles (subhead/motto) → editor text edits silently rejected. Use string-keyed record, filter in code.
7. Duplicate stale `next dev` processes on :3000 served old code — kill by port before restart.
