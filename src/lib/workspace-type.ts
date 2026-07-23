/**
 * Workspace account types — the single client-safe source of the three
 * customer segments. The ids mirror the Prisma `WorkspaceType` enum; keep them
 * in lockstep. The type steers photography + concept direction end-to-end
 * (see image-prompt.ts ON_MODEL_DIRECTION and the ACCOUNT STYLE brief block in
 * generation-run.ts).
 */

export type WorkspaceTypeId = "FMCG_PRODUCT" | "APPAREL_ON_MODEL" | "FASHION_EDITORIAL";

export const WORKSPACE_TYPES: readonly { id: WorkspaceTypeId; label: string; hint: string }[] = [
  {
    id: "FMCG_PRODUCT",
    label: "Products & campaigns",
    hint: "FMCG, packaged goods or any product SKU — festival, theme and custom-brief ad creatives",
  },
  {
    id: "APPAREL_ON_MODEL",
    label: "E-commerce apparel",
    hint: "Clothing on AI models — clean premium catalog shots for product pages & listings",
  },
  {
    id: "FASHION_EDITORIAL",
    label: "Premium fashion",
    hint: "Designer-grade apparel — styled fashion-campaign photoshoot look",
  },
] as const;

export function isWorkspaceTypeId(v: unknown): v is WorkspaceTypeId {
  return typeof v === "string" && WORKSPACE_TYPES.some((t) => t.id === v);
}
