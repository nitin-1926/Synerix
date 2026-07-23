/**
 * Workspace onboarding profile — allowed values + display labels. Drives which
 * surfaces a workspace sees (e.g. Models / on-model modes only make sense for
 * apparel-adjacent businesses). All answers optional.
 */

export const PROFILE_INDUSTRIES = [
  { id: "food_fmcg", label: "Food & packaged goods" },
  { id: "apparel", label: "Apparel & fashion" },
  { id: "jewellery", label: "Jewellery & accessories" },
  { id: "home_decor", label: "Home & decor" },
  { id: "beauty", label: "Beauty & personal care" },
  { id: "services", label: "Services" },
  { id: "other", label: "Other" },
] as const;

export const PROFILE_USE_CASES = [
  { id: "occasion_posts", label: "Festival & occasion posts" },
  { id: "product_ads", label: "Product ads" },
  { id: "on_model", label: "On-model fashion shots" },
  { id: "everything", label: "A bit of everything" },
] as const;

export const PROFILE_CHANNELS = [
  { id: "whatsapp_direct", label: "WhatsApp / direct orders" },
  { id: "marketplace", label: "Marketplaces (Amazon, Flipkart…)" },
  { id: "d2c", label: "Own website (D2C)" },
  { id: "retail", label: "Retail / distribution" },
] as const;

export interface WorkspaceProfile {
  /** Canonical account type (Prisma WorkspaceType). Kept as string so this
   * module stays client-safe. */
  type: string | null;
  industry: string | null;
  primaryUseCase: string | null;
  salesChannel: string | null;
}

/** Should this workspace see the AI Models surface (nav + on-model mode)? */
export function showsModelSurface(profile: WorkspaceProfile): boolean {
  // Apparel account types always get the Models surface.
  if (profile.type === "APPAREL_ON_MODEL" || profile.type === "FASHION_EDITORIAL") return true;
  // FMCG_PRODUCT is also the schema default, so it can't distinguish a real
  // FMCG choice from a never-classified legacy workspace — fall back to the
  // legacy profile answers, and show everything on incomplete data.
  if (!profile.industry && !profile.primaryUseCase) return true;
  return profile.industry === "apparel" || profile.primaryUseCase === "on_model";
}
