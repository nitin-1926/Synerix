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
- [x] `src/lib/pipeline/catalog-concepts.ts` — deterministic shot briefs (6-shot table + neutral pose-driven brief)
- [x] generation-run: lite branch skips concepts / brief-QA / enhancer / brand-research refresh
- [x] fidelity-QA retry budget per path (`LITE_QA_MAX_RETRIES`, default 1 vs 2)
- [x] persist the fidelity verdict for PLAIN creatives (was invisible on the highest-volume path)
- [x] tests: catalog-concepts (3) + runware prompt fit (2)
- [x] admin costs list: "Spend by pipeline stage · last 30 days" + clickable run rows
- [x] e2e: `PACK_QA_MAX_RETRIES=0` / `LITE_QA_MAX_RETRIES=0` (retries were the suite's biggest line)
- [x] workspace image-model pin honoured in the editor paths (was silently NB Pro)
- [x] fix: Runware rejected our 4500-char on-model prompt → every Seedream/Qwen/Wan on-model render failed
- [ ] bake-off: 4 garments × 4 models, judge fidelity, recommend the pin
- [ ] DEVLOG entry

## Open for My Lord
- "Compare" pref + a workspace pin = 2× credits debited, 1 render delivered (generate.ts:149 vs
  generation-run.ts:147). Needs a decision: pin wins, pref wins, or refund the unused variant.
- `generate-model.ts` renders AI models on NB Pro ($0.134) — one-time per model, cheap to downgrade.
