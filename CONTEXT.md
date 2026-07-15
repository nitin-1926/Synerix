# Synerix Studio — Context & Glossary

The shared language for Synerix Studio. Terms here are meaningful to domain
experts (brand owners, the consulting team), not implementation details.

## Glossary

### Creative
One generated ad option for an occasion: a wordless **Plate** plus an
**OverlaySpec** that, when composited, yields the final shareable image.

### Plate
The AI-generated scene image (background + real product). Plates are wordless:
headline/CTA typography is rendered by the canvas compositor as an overlay by
default (see Typography Mode); the logo and Brand Block are never baked.

### OverlaySpec
The deterministic, AI-free contract describing every text layer, scrim, logo,
and the Brand Block placed over a Plate. Editing it (text fix, language switch,
reposition) re-composites instantly and for free via the canvas compositor.
No image-model call is involved in an edit.

### Brand Block  *(new — resolved 2026-06-08)*
The brand-locked, deterministic layer rendered on every Creative: logo plus
optional fixed **contact line** ("For business queries: <phone>") and
**tagline**. The contact line is OPT-IN per Creative (off by default; toggled on
for lead-gen/offer creatives). These are FIXED brand facts stored on the Brand,
never written or invented by the AI concepting pipeline. The concepting pipeline only produces
creative copy (headline / subhead / CTA). Rendered by the canvas compositor,
not the image model. Position/visibility are editable per Creative; the text
content is brand-locked.

### Product Category  *(new — resolved 2026-06-08)*
A field on every Product set at creation (FMCG / Apparel / Other). Drives
pipeline routing: Apparel defaults to **On-model**, FMCG to **In-scene /
Studio composite**. Concepting rules and default Fidelity Mode follow from it.

### Model Library  *(resolved 2026-06-08)*
A shared global set of AI Model presets available to all brands, PLUS per-brand
saved models (a brand's own generated "ambassador" faces) for catalog
consistency.

### Concept / Concepting
The product-first ideation step (Claude) that reasons product → occasion-fit →
distinct creative directions, producing headline/subhead/CTA copy in all
languages plus a scene description. Does NOT produce Brand Block content.

### Fidelity Mode
Per-Creative toggle for how the real product enters the scene:
- **In-scene** — image model renders the real product from its reference photo.
- **Studio composite** — product-less scene + real cut-out composited with shadow.
- **On-model** *(new — resolved 2026-06-08)* — for apparel: an **AI Model**
  reference photo + the real garment photo are fused by Nano Banana Pro
  (multi-reference) with a strong scene prompt, producing an on-model staged
  shot in ONE image call. No dedicated virtual-try-on engine. The resulting
  on-model photo becomes the Plate, then the normal OverlaySpec + Brand Block
  composite over it. Known tradeoff: garment fidelity can drift vs dedicated
  VTON; mitigated by human Review + regenerate. In scope for v1.

### AI Model  *(new — resolved 2026-06-08)*
A reusable human-model reference image used for On-model creatives. The system
ships a **curated library of presets** (Indian adult M/F, baby, a few
poses/looks) AND can **generate a new model from a text description** (via the
image model), saving it to the library for consistent reuse across a catalog.

### Review (quality stance)  *(updated 2026-07-16)*
Layered QA before human review: concept briefs are validated and repaired
(`validate-concepts.ts`), rendered plates are checked against references —
pack-vs-label for product shots (`pack-qa.ts`), identity + garment fidelity
for on-model shots (`model-qa.ts`) — with strict corrective re-renders, and
overlay placement is vetoed/re-composited (`placement-qa.ts`). A human still
makes the final call in the studio before sharing with the client; automated
QA raises the floor, human taste sets the bar.

### Render Engine decision
Final images are composited with a deterministic **canvas compositor**
(`@napi-rs/canvas` + HarfBuzz), NOT by baking text into the image model and NOT
by Puppeteer/HTML screenshots. Rationale: deterministic fonts/colours, free
instant re-renders, and correct Devanagari/Gurmukhi shaping.

---

## Launch overhaul (2026-06-10)

### Typography Mode  *(overlay-first — resolved 2026-07-02)*
How the headline gets onto a Creative. **Overlay** (default for every fidelity
mode): the pipeline generates a wordless Plate from the concept's own
imagePrompt (trusted verbatim, "trust-the-brief"), then the canvas compositor
renders headline/CTA as deterministic text layers — free instant edits,
guaranteed-correct Devanagari/Gurmukhi shaping. Placement is content-aware
(palette / safe-band / busyness scoring across template variants) and verified
by a cheap vision QA check (does text/logo overlap faces, product, or key
content?); on failure the compositor auto re-lays-out with the next-best
template, one retry, fail-open. **Baked** typography survives only as a paid
editor upgrade (2 credits): an image-model pass typesets the headline into the
clean scene plate with spelling+overlap vision QA and auto-refund on repeated
failure. Text edits/language switches stay free on overlay Creatives.

### Brand Creative Intelligence  *(new)*
A cached, per-brand evidence pack — category snapshot, named competitor
patterns, verbatim customer language, proven angles, visual trends — researched
once via Claude web search (world-knowledge fallback) and injected into every
generation run's concept stage. Concepts must cite this evidence in their
`insightRationale`. Refresh manually via the brand page action; stored on
`Brand.creativeIntel`.

### Concept brief  *(upgraded)*
Concepts are now full senior-creative-director briefs: bigIdea (the creative
leap), insightRationale (evidence citation), artDirection (the shoot), and a
bespoke per-concept `imagePrompt` consumed by the image model — no shared
template. The default image model is env-driven (`IMAGE_DEFAULT_MODEL`,
currently Nano Banana 2 / gemini-3.1-flash-image) and read by BOTH the
generation pipeline and the editor's paid edits; a super-admin **bake-off**
mode fans the same prompt out across NB2 / NB Pro / gpt-image-2 / seedream v4
side-by-side to crown the default. Up to 3 product reference angles are passed
for fidelity.

### Tenancy & auth
NextAuth v5, Google-only. Any sign-in auto-creates a zero-credit workspace
(explore-only; generation unlocks when the super-admin grants credits).
Workspace invites by email auto-join on first sign-in. `SUPER_ADMIN_EMAIL`
(consulting.synerix@gmail.com) gets the `/admin` console: all-workspace
god-view (enter any workspace), credit grants/adjustments, business-health
leads, test management. `DEV_AUTH_BYPASS=1` is the dev-only bypass.

### Credits
2 credits = 1 finished creative (guided run = 8, direct = 2, scene regen /
baked text edit / baked language switch = 2). Failed concepts auto-refund;
QA-failed baked edits auto-refund. Ledger is user-visible at /settings/credits.

### One app
This repo also serves the Synerix marketing site — `src/app/(marketing)/`:
landing, consulting, the Synerix Studio product page, and the Business Health
Check (test wizard + scored email report; leads in `tests`/`test_results`,
viewable in /admin/leads).
