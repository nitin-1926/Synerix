# AI Creative Studio for Small Businesses — Product Spec / Problem Statement

> A self-contained product description written to be handed to a UI/UX-generating
> tool (or a designer, or another AI). It explains the idea, the users, how the
> product works, and every major screen with its purpose, content, and states —
> without dictating exact pixels, so the generator has room to design.

---

## 1. One-line pitch

**An AI studio that turns a small business's brand + product photos into
finished, on-brand advertising creatives — festival posts, product ads, and
on-model apparel shots — in a minute, without a designer.**

## 2. The problem

Small and mid-sized businesses (think an Indian sweet shop, an apparel label, a
packaged-foods brand) need a constant stream of ad creatives: for every festival
(Diwali, Eid, Raksha Bandhan…), every product launch, every weekend offer. Today
they either:

- pay an agency/freelancer (slow, expensive, inconsistent), or
- use generic template tools (Canva et al.) that require design skill and still
  look off-brand, or
- use raw AI image generators that mangle their actual product, misspell
  non-English text, and ignore brand colors/logo.

They don't want a blank canvas. They want **"give me 4 great options for Diwali
featuring my product, in my brand's look, with correct Hindi/Punjabi text"** —
and then lightly tweak the winner.

## 3. Who it's for

- **Primary user:** a non-designer owner/marketer at an SMB. Mobile-first
  mindset, low patience, wants results not tools.
- **Secondary user:** a small agency or the platform operator managing many
  client businesses from one place (multi-tenant "god view").

## 4. The core idea (what makes it work)

Three ideas combine:

1. **Brand memory.** The business is onboarded once — ideally by just pasting
   their website URL. The system crawls it and extracts a **Brand Kit**: logo,
   colors, fonts/voice, tagline, product hints. Everything generated afterward
   inherits this automatically, so output is on-brand by default.

2. **Structured generation, not a blank canvas.** The user picks a *product* and
   an *occasion/idea*, chooses a *fidelity mode*, and the system generates N
   distinct **concepts** (art-directed ideas), renders a photographic scene for
   each, then composites the headline/logo/CTA on top with a deterministic
   layout engine. Text is never "baked" by the image model (which misspells
   Indian scripts) — it's drawn with real fonts by the compositor, so Hindi,
   Punjabi, Hinglish, and English are always correct.

3. **Fidelity modes** — the product is preserved, not reimagined:
   - **In-scene:** the real product photo is placed into a lifestyle scene.
   - **Exact product:** a clean studio backdrop is generated and the real
     product cut-out is composited in pixel-exact.
   - **On-model (apparel):** an AI human model "wears" the real garment; the
     user can pick/great a model and describe a **pose**.

## 5. Key concepts (the mental model / entities)

- **Workspace** — one business/tenant. Has members, a brand, credits.
- **Brand Kit** — logo(s), colors, tagline, contact line, voice, category, plus
  cached "creative intelligence" (how this category advertises).
- **Product** — an item with 1–5 photos, a category (FMCG / Apparel / Other),
  and an auto-generated description of what it looks like ("dissection").
- **AI Model** — a reusable synthetic human (for on-model apparel), global or
  brand-owned, with traits.
- **Occasion / Calendar entry** — a festival or a custom idea to create for.
- **Generation Run** — one request → N concepts → N creatives. Has a status
  (Queued → Briefing → Concepting → Rendering → Complete/Partial/Failed).
- **Creative** — one finished option. Has multiple **aspect renders** (1:1, 4:5,
  9:16, 16:9), a version history, and an editable overlay (text/logo/layout).
- **Credits** — usage currency; each creative option costs credits, refunded on
  failure.

## 6. Primary user journeys

1. **Onboard:** paste website → watch brand kit build → confirm/adjust → add a
   product (or bulk-add many).
2. **Create:** pick product + occasion (or type an idea) → choose mode/options →
   generate → watch options stream in → open the best one.
3. **Refine:** in the editor, tweak headline/language/layout/logo, try alternate
   layouts, regenerate the scene with a note, export per platform.
4. **Operate (agency/admin):** see all client workspaces, enter one, set it up,
   generate on their behalf.

---

## 7. Screen inventory

Each screen: **purpose → key content → notable states.** Global chrome: a left
nav (Home, Create, Creatives, Calendar, Brand Kit, Settings), a credits pill, a
light/dark toggle, and — for operators — a "Viewing as <workspace>" banner with
"Back to admin."

### 7.1 Onboarding wizard
- **Purpose:** get a usable Brand Kit with minimum effort.
- **Content:** Step 1 — "Paste your website" (big input, or "skip / set up
  manually"). A live progress view while it crawls & extracts (Crawling →
  Extracting brand DNA → Finding logo & images → Ready). Step 2 — "Add your
  first product" (name, category, photos).
- **States:** ingesting (animated, staged), success (preview the detected logo +
  colors + tagline), partial/failed (let them fill manually), skipped (blank
  kit, don't block them).

### 7.2 Home / Dashboard
- **Purpose:** orient and prompt the next action.
- **Content:** upcoming festivals as "create for this" cards, recent creatives,
  credits, quick "Create" CTA, brand-setup completeness nudges.

### 7.3 Brand Kit
- **Purpose:** everything the system knows about the brand; editable.
- **Content:** business name, tagline, one-liner, primary/accent colors, logo
  corner & scale, contact line; a logo **upload** + a picker of website-pulled
  images to promote to logo; an "apparel output default" (branded vs plain);
  read-only "brand DNA" cards (voice, products spotted, audience, positioning).
  Tabs across the top: **Brand · Products · AI Models.**
- **States:** ingest badge (ready/pending), empty (no assets yet → prompt
  upload).

### 7.4 Products (tab)
- **Purpose:** manage the items creatives will feature.
- **Content:** "Add product" (single: name, SKU, description, category, up to 5
  photos with a drag/click drop-zone) and **"Bulk upload"** (drop many photos →
  each becomes a product, names auto-derived from filenames & editable, one
  shared category, progress as they upload). A grid of product cards with a
  status badge ("Ready for creatives" / "Analyzing photo…").
- **States:** analyzing (per product), empty, error.

### 7.5 Product detail
- **Purpose:** inspect one product.
- **Content:** photos, the auto-generated "what the studio sees" description,
  actions: **Create with this product**, Re-analyze photos, Delete (confirm).

### 7.6 AI Models (tab)
- **Purpose:** choose/create synthetic models for on-model apparel.
- **Content:** a gallery of model cards (portrait, name, traits like
  "bearded, rugged"), global vs brand-owned; "Generate a new model" (describe
  traits → it renders a reusable model).

### 7.7 Create / Studio (the brief)
- **Purpose:** specify what to generate.
- **Content:** product picker (visual grid, or "add product" inline), an
  occasion picker or a free-text idea box with an **"Enhance"** assist that
  expands a rough idea into an art-directed brief (shown & editable, never
  hidden), a **fidelity mode** selector (In-scene / Exact product / On-model),
  language (English / Hinglish / Hindi / Punjabi), number of options, aspect
  ratios, and — for on-model — a **model picker** + **pose** control
  (Auto / presets like Standing, Walking, Seated, ¾ turn / custom text) and a
  **branded vs plain** toggle. A prominent "Generate" with the credit cost.
- **States:** validation (e.g., on-model needs a product + a model), insufficient
  credits.

### 7.8 Studio canvas — generating (THE LOADING STATE, do this well)
- **Purpose:** make a 1–2 minute wait feel alive and premium, and stream results
  in as they finish. This is a 3-pane "Canva-like" canvas.
- **Content:**
  - **Left rail:** the run title, an **Options · N/M** list where finished
    options appear as thumbnails and not-yet-ready ones are **shimmering skeleton
    rows** ("Crafting option 2…"); below it a compact **Brand Kit** card (logo,
    color swatches, the chosen product & model thumbnails).
  - **Center/right:** a large, well-proportioned panel (fills the space — not a
    tiny spinner in a void) showing **skeleton "option" frames** in the target
    aspect ratio with a shimmer sweep, a **progress bar**, the current stage
    ("Reading your brand & occasion" → "Designing concepts" → "Generating &
    composing", with an "X/Y ready" counter during rendering), a tiny
    **Brief › Concepts › Render** stepper, and a reassuring "you can leave and
    find these in Creatives" line.
- **States:** queued, per-stage, first-option-ready (canvas swaps from skeletons
  to the editor for the first finished creative while the rest keep streaming),
  partial, failed (friendly message + credits refunded + "start a new one").

### 7.9 Studio canvas — editing a creative
- **Purpose:** refine the chosen option. Same 3-pane shell; the center becomes
  the creative editor.
- **Content:**
  - **Center stage:** the creative preview with **aspect tabs** (1:1/4:5/9:16/
    16:9), a draggable/resizable logo, and a **platform-preview** toggle that
    frames it inside an Instagram feed / Story / WhatsApp-status mockup.
  - **Right properties:** editable **copy** (headline/subhead/CTA) + language,
    **logo** controls, **layout** variants (a strip of alternate templates,
    scored, "why this works"), **scene** actions — *regenerate with a note*
    (paid) and *more variations* (paid) — and a **version history**.
- **States:** recompositing (free, instant), regenerating (paid, spinner),
  dirty/saved, per-aspect not-yet-rendered (render on demand).

### 7.10 Creatives (library)
- **Purpose:** find and reuse everything made.
- **Content:** a grid/gallery of finished creatives filterable by product /
  occasion / date; clicking opens the same canvas editor focused on that
  creative; download/export.

### 7.11 Calendar
- **Purpose:** plan around festivals.
- **Content:** upcoming festival occurrences (with regional/date info) and custom
  entries; each links straight into Create for that occasion.

### 7.12 Settings & Credits
- **Purpose:** account, members, billing.
- **Content:** workspace members/invites (invite-only), credit balance + ledger
  (debits per generation, refunds), plan.

### 7.13 Admin / Operator console (multi-tenant)
- **Purpose:** run many client businesses from one login.
- **Content:** a **Workspaces** section — a card per client (brand, product/
  creative counts, activity) — a **"New workspace"** modal (name + optional
  client URL → creates the workspace, optionally kicks off website ingest), and
  an **"Enter workspace"** action that drops the operator into that client's
  studio in a god-view (with the "Viewing as… / Back to admin" banner).

---

## 8. How generation works (the heart, for context)

1. **Brief** (instant): assemble the occasion/product brief. Web-grounded
   category research (how this niche advertises) runs **in the background** and
   is **cached per brand** — it never blocks a run.
2. **Concept** (one AI call): produce N distinct art-directed concept briefs,
   grounded in the brand kit + cached evidence.
3. **Render** (parallel per concept, and per aspect): generate the photographic
   scene (preserving the real product/garment via the fidelity mode), then
   **composite** headline/logo/CTA with a deterministic layout engine that
   scores several templates and keeps the best. Text uses real bundled fonts for
   correct multilingual rendering.
4. **Finalize:** each creative is saved with all aspect renders + a version
   history; failures are isolated per concept and refunded.

Results **stream** into the canvas as each option finishes. A brand's first run
concepts without web evidence (research is still warming in the background);
every subsequent run reuses the cache for free.

## 9. Design & tone

- Clean, confident, "premium tool" feel — lots of whitespace, rounded cards,
  a single accent color, subtle motion (shimmer skeletons, staged reveals).
- Mobile-friendly; the studio is usable on a laptop but nothing should feel
  desktop-only.
- Indian-market sensibility: festival-first, multilingual, real products front
  and center. Never "AI slop" — output should look like a real brand's ad.

## 10. Non-functional notes (shape the UX)

- **Latency:** a run is ~1–2 minutes; the UI must make waiting pleasant and let
  users leave and come back (results persist).
- **Cost/credits:** every paid action shows its cost up front; failures refund.
- **Trust:** the user's real product and exact text must be preserved — the
  product is never "reimagined," spelling is always correct.
- **Forgiving onboarding:** never hard-block; a business with no website/logo can
  still add products and generate immediately, filling brand details later.

---

*Use this as the problem statement. A good result is a coherent, on-brand,
multi-screen product where the **Create → generating → editing** flow is the
centerpiece, the **loading/streaming** state feels alive, and the **brand kit**
quietly drives everything.*
