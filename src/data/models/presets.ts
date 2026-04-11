/**
 * Shared AI-model preset library (scope = GLOBAL). Seeded via
 * `npx tsx prisma/seed-models.ts` (set SEED_FORCE=1 to regenerate existing).
 *
 * A preset is a REFERENCE photo (IMAGE 1 in the on-model fusion), so it is shot
 * clean — neutral seamless background, no busy set — for faithful identity
 * transfer. The editorial styling/setting of the final ad is applied at
 * generation time by the scene prompt, NOT baked into the preset. But the
 * person is cast fashion-model-grade (photogenic, impeccably groomed) so the
 * resulting on-model creatives look premium. Menswear-heavy by default to match
 * the apparel clients.
 */

export interface ModelPreset {
  slug: string;
  name: string;
  description: string;
  traits: { ageBand: string; gender: string; look: string };
  /** Text-to-image prompt for the reference photo. */
  prompt: string;
}

// Premium lookbook reference: clean enough to fuse, polished enough to look high-end.
const STUDIO =
  "Premium menswear/fashion lookbook reference photo. Plain warm light-grey seamless studio background, soft directional key light with gentle shadow falloff, full-body, relaxed confident editorial pose facing camera, natural skin texture, crisp high-end fashion-campaign quality, photoreal. No text, no logos, no props.";

const GROOMED_MAN =
  "a strikingly photogenic, impeccably groomed Indian male fashion model, strong jawline, clear skin, neat modern hairstyle";

export const MODEL_PRESETS: ModelPreset[] = [
  // ---- Men (menswear-first) ----
  {
    slug: "man-sharp-clean-shaven",
    name: "Arjun — sharp, clean-shaven",
    description: "Late-20s male model, clean-shaven, sharp modern look.",
    traits: { ageBand: "20s", gender: "male", look: "sharp" },
    prompt: `${GROOMED_MAN}, late 20s, clean-shaven, styled quiff with a tidy fade, wearing plain neutral fitted basics (plain white tee, dark trousers). ${STUDIO}`,
  },
  {
    slug: "man-bearded-rugged",
    name: "Kabir — bearded, rugged",
    description: "30s male model, well-kept beard, rugged premium look.",
    traits: { ageBand: "30s", gender: "male", look: "rugged" },
    prompt: `${GROOMED_MAN}, early 30s, neatly groomed full beard, textured swept-back hair, confident gaze, wearing plain neutral fitted basics. ${STUDIO}`,
  },
  {
    slug: "man-light-stubble-casual",
    name: "Veer — casual, light stubble",
    description: "20s male model, light stubble, approachable casual.",
    traits: { ageBand: "20s", gender: "male", look: "casual" },
    prompt: `${GROOMED_MAN}, mid 20s, light stubble, relaxed tousled hair, warm easy expression, wearing plain neutral fitted basics. ${STUDIO}`,
  },
  {
    slug: "man-formal-distinguished",
    name: "Rohan — distinguished, formal",
    description: "30s male model, distinguished, premium formal vibe.",
    traits: { ageBand: "30s", gender: "male", look: "formal" },
    prompt: `${GROOMED_MAN}, mid 30s, clean tapered haircut, refined posture, polished distinguished presence, wearing plain neutral fitted basics. ${STUDIO}`,
  },
  {
    slug: "man-senior-silverfox",
    name: "Raghav — silver, senior",
    description: "60s male model, silver hair, dignified premium.",
    traits: { ageBand: "60s", gender: "male", look: "senior" },
    prompt: `a handsome, well-groomed senior Indian male model, early 60s, silver hair, neat short beard, dignified premium presence, wearing plain neutral fitted basics. ${STUDIO}`,
  },
  // ---- Women ----
  {
    slug: "woman-elegant-30s",
    name: "Meera — elegant",
    description: "30s female model, elegant, premium.",
    traits: { ageBand: "30s", gender: "female", look: "elegant" },
    prompt: `a strikingly photogenic, impeccably groomed Indian female fashion model, early 30s, refined elegant presence, sleek styled hair, wearing plain neutral fitted basics. ${STUDIO}`,
  },
  {
    slug: "woman-young-casual",
    name: "Aanya — young, casual",
    description: "20s female model, fresh, casual.",
    traits: { ageBand: "20s", gender: "female", look: "casual" },
    prompt: `a strikingly photogenic Indian female fashion model, mid 20s, natural fresh look, soft styled hair, warm expression, wearing plain neutral fitted basics. ${STUDIO}`,
  },
  {
    slug: "woman-plus-size",
    name: "Priya — plus-size, confident",
    description: "Plus-size female model, confident, premium.",
    traits: { ageBand: "30s", gender: "female", look: "plus-size" },
    prompt: `a beautiful, confident plus-size Indian female fashion model, late 20s, glowing skin, styled hair, warm assured expression, wearing plain neutral fitted basics. ${STUDIO}`,
  },
  // ---- Kids & baby (for the kids/baby-apparel client) ----
  {
    slug: "boy-child",
    name: "Aarav — boy, child",
    description: "Indian boy (~6), bright and playful.",
    traits: { ageBand: "child", gender: "male", look: "child" },
    prompt: `a cute, photogenic Indian boy around 6 years old, bright cheerful expression, tidy hair, wearing plain neutral kids' basics. ${STUDIO}`,
  },
  {
    slug: "girl-child",
    name: "Diya — girl, child",
    description: "Indian girl (~6), cheerful.",
    traits: { ageBand: "child", gender: "female", look: "child" },
    prompt: `a cute, photogenic Indian girl around 6 years old, cheerful smile, neat hair, wearing plain neutral kids' basics. ${STUDIO}`,
  },
  {
    slug: "baby-toddler",
    name: "Baby — toddler",
    description: "Indian toddler (~1.5y), neutral.",
    traits: { ageBand: "baby", gender: "neutral", look: "baby" },
    prompt: `an adorable Indian toddler around 18 months old, sitting upright, gentle happy expression, wearing plain neutral baby basics. Clean studio reference photo, plain warm light-grey seamless background, soft even lighting, photoreal, no text, no props.`,
  },
];
