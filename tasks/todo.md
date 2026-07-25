# 2026-07-25 — cost reduction for the e-commerce apparel path
(prev round archived in git history; account-types feature shipped 2026-07-23)

## Problem (measured, prod ApiCostLog)
Worst real PLAIN on-model run = **$0.524 / creative**: on-model renders $0.402 (NB Pro
$0.134 × 3 — 1 render + 2 fidelity retries), concepts (Opus) $0.085, enhancer $0.020,
brief-QA $0.013, model-QA $0.004. Client wants ≤ $0.5 charge for 800+ images.
The concept stack's output is discarded on this path — PLAIN composites no text or logo.

## Decisions (My Lord)
- Lite path gated on `ON_MODEL + PLAIN` (not on account type wholesale).
- Run a real bake-off before pinning a cheaper image model.

## Plan
- [ ] `src/lib/pipeline/catalog-concepts.ts` — deterministic shot briefs
- [ ] generation-run: lite branch skips concepts / brief-QA / enhancer
- [ ] fidelity-QA retry budget per path
- [ ] persist the fidelity verdict for PLAIN creatives
- [ ] workspace image-model pin honoured in the editor paths
- [ ] fix: Runware rejected our 4500-char on-model prompt
- [ ] bake-off: 4 garments × 4 models
- [ ] DEVLOG entry
