# 2026-07-22b — workspace model picker, multi-pose, aspect fix
(prev round archived at tasks/todo-r4-archive.md)

## Decisions (from My Lord)
- Model list: 7 — NB Pro, NB2, GPT Image 2, Seedream v4, Seedream v5 Lite, Qwen-Image (runware:108@1), Wan 2.7 (alibaba:wan@2.7-image). Workspace default, super-admin only.
- Poses: multi-select REPLACE option count for on-model. M poses → M images, same model+garment. Hide "how many options" for on-model.
- Aspect: editor "add format" re-renders NATIVE plate (image call) and CHARGES credits.

## Plan
### F1 — Workspace image-model setting (super-admin only)
- [ ] schema: Workspace.imageModel String?
- [ ] runware.ts: add qwen_image, wan_2_7 to IMAGE_MODELS
- [ ] provider.ts: runwareModel on params/variant; seedream path honors it; WORKSPACE_IMAGE_MODELS registry + resolveWorkspaceVariant(); labels
- [ ] generation-run: select workspace.imageModel; resolve variant (soft-prefer, keep fallback)
- [ ] actions/workspace.ts: setWorkspaceImageModel (requireSuperAdmin)
- [ ] settings page + client: picker visible only to super admin

### F2 — Multi-pose (on-model)
- [ ] schema: GenerationRun.modelPoses String[]
- [ ] create-form: pose multi-select; hide optionCount for on-model; cost = poses×perConcept
- [ ] generate.ts: parse modelPoses; on-model conceptCount = poses.length (min 1)
- [ ] generation-run: on-model per-pose queue (1 concept × M poses); poseOverride → buildOnModelPrompt

### F3 — Aspect native re-render + charge
- [ ] paid-edits.ts: applyRenderAspect re-renders native plate via generateScene, not cover-crop
- [ ] actions/editor.ts: renderNewAspect debits + insufficient handling
- [ ] creative-edit.ts: render_aspect debited → catchError refunds
- [ ] editor.tsx: "add format" copy reflects credit cost

### Verify
- [ ] tsc + lint + vitest + migrate + real e2e both kinds
- [ ] DEVLOG entries; My Lord sets TRIGGER_ACCESS_TOKEN secret

## Review — DONE (all 3 features built + verified)
- F1 image-model picker: 7 models (NB Pro/NB2/GPT/Seedream v4/Seedream v5 Lite/Qwen-Image/Wan 2.7), super-admin-only in settings, soft-prefer with cascade kept. 4 new unit tests incl. fallback-model-isolation guard.
- F2 multi-pose: verified live — 2 poses → 2 creatives, each with its own pose (run 8ac7da08). Option picker hidden for on-model.
- F3 aspect native re-render: verified live — new 1:1 got a native plate (0-1x1.png) recorded in aspectPlateKeys, not a crop. Now charges credits (regen cost); refund on failure both paths.
- Verify: tsc ✓, lint ✓, vitest 62 ✓, real e2e both kinds ✓ (in-scene 1.9m, on-model 3.3m).
- Migrations 20260722115500 (cutout) + 20260722133655 (imageModel+modelPoses) applied to prod DB — nullable/backward-compatible, old prod code unaffected.

## State / open
- ALL of this session's work is UNCOMMITTED (last commit 72b6ed1). Batch A (timeout/cutouts/e2e/CI) was deployed to prod last part but not committed; Batch B (these 3 features) is neither committed nor deployed.
- Awaiting My Lord: test → then commit (retroactive-commit-history) + deploy (Trigger prod + Vercel prod).
- Still pending: My Lord sets TRIGGER_ACCESS_TOKEN gh secret (dashboard PAT) — blocks CI trigger-deploy + e2e worker.
