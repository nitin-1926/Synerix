# 2026-07-23 — workspace account types (FMCG / e-com apparel / premium fashion)
(prev round archived: tasks/todo-r4-archive.md; plan: ~/.ccpm/profiles/work/plans/warm-singing-comet.md)

## Decisions (from My Lord)
- 3 segments = existing WorkspaceType enum (no migration). References: schein.in (e-com apparel), theblueman.net (premium fashion).
- Settings: owner/admin (canManage) editable. Onboarding: 3-card picker REPLACES industry+usecase selects (keep salesChannel).

## Plan
- [x] src/lib/workspace-type.ts — shared WORKSPACE_TYPES metadata (client-safe)
- [x] src/components/account-type-picker.tsx — shared radio-card picker
- [x] admin new-workspace-dialog → use shared picker/metadata
- [x] onboarding wizard: ProfileFields → AccountTypePicker (required) + salesChannel only
- [x] brand.ts saveWorkspaceProfile: persist workspace.type + salesChannel; stop writing industry/useCase
- [x] workspace-profile.ts showsModelSurface: type-first, legacy profile fallback (callers unchanged — profile carries type)
- [x] workspace.ts setWorkspaceType (requireManager) + settings card (read-only for non-managers)
- [x] image-prompt.ts: rewrite ON_MODEL_DIRECTION catalog (schein) + editorial (blueman)
- [x] generation-run.ts: 3-way ACCOUNT STYLE brief block (FMCG none / APPAREL catalog / EDITORIAL campaign)
- [x] tests: showsModelSurface matrix + updated direction-string assertions
- [x] verify: tsc ✓ lint ✓ vitest 65 ✓; prod type audit done; DEVLOG entry written

## Review — DONE
- All UI reuses one AccountTypePicker (admin dialog, onboarding, settings). Zero DB migrations.
- Live smoke: settings picker persists to DB + toast + revert works (dev workspace flipped APPAREL_ON_MODEL→back); onboarding renders 3-card picker, required radio blocks submit.
- Concept + render prompts now 3-way: FMCG unchanged; APPAREL_ON_MODEL = schein-anchored (soft diffused light, warm beige architectural sets, garment hero); FASHION_EDITORIAL = blueman-anchored (styled character, environmental depth, rim light, rich grade).
- FLAGS for My Lord: (1) prod workspaces "Synerix Apparel" + "E2E Tests" are typed FMCG_PRODUCT but are apparel — fix via new settings card. (2) Pre-existing: image-model Select shows raw "__default__" instead of its label. (3) dev:next left running on :6969 for your testing.
- UNCOMMITTED — My Lord tests, then commit via retroactive-commit-history.
