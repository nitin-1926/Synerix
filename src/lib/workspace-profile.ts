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
  industry: string | null;
  primaryUseCase: string | null;
  salesChannel: string | null;
}

/** Should this workspace see the AI Models surface (nav + on-model mode)? */
export function showsModelSurface(profile: WorkspaceProfile): boolean {
  // No profile yet → show everything (don't hide features on incomplete data).
  if (!profile.industry && !profile.primaryUseCase) return true;
  return profile.industry === "apparel" || profile.primaryUseCase === "on_model";
}
