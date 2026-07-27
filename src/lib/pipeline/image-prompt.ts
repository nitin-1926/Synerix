import type { SceneAspect } from "@/lib/image/provider";
import type { CreativeConcept } from "./schemas";

/**
 * Scene-prompt builders. The concept's art-directed imagePrompt is trusted
 * verbatim (it carries the creative direction); code appends only the
 * non-negotiable floors — product/garment fidelity, photographic quality,
 * per-aspect overlay safe-zones and framing guards — so a weak or failed
 * enhancer pass can never ship an unguarded plate.
 *  - IN_SCENE / EXACT_PRODUCT: the model places the REAL product (reference
 *    image) into the scene ONCE, faithfully.
 *  - ON_MODEL: fuses an AI-model reference with the real garment, directed as
 *    either an editorial campaign or a clean catalog showcase.
 */

const SAFE_ZONES: Record<SceneAspect, string> = {
  "9:16": "Keep the top ~15% and bottom ~30% calmer (story UI + headline overlay live there).",
  "4:5": "Keep the bottom ~32% calmer and slightly darker for a headline overlay.",
  "1:1": "Keep the bottom ~32% calmer for a headline overlay.",
  "16:9": "Keep the subject left-of-centre; keep the right and bottom calmer for overlay copy.",
};

const QUALITY =
  "Photoreal commercial advertising photography, editorial quality, sharp focus, controlled natural lighting, authentic Indian people with natural skin tones and correct hands where people appear, no uncanny artifacts.";

// The two worst renders we have ever shipped were text the image model invented:
// a full fake shopping-app screenshot (carrier status bar, nav and cart icons)
// and a gibberish serif headline baked across the frame. Both got through
// because this ban used to be appended ONLY when a concept carried no
// imagePrompt — which no path is true for any more (the enhancer and the
// catalog shot list both always set one), so the guard was dead code on 100% of
// renders. It is unconditional now, and it names the app-UI failure explicitly
// because product reference photos are often phone screenshots.
const WORDLESS =
  "NO TEXT ANYWHERE (absolute): render no letters, words, numbers, headlines, captions, watermarks, signage, price tags, hang tags, size labels or brand labels anywhere in the frame. The ONLY text permitted is text genuinely printed on the real product's own packaging. This is a PHOTOGRAPH, never a screenshot: no phone or app interface, status bar, carrier or battery or wifi icons, navigation bars, buttons, search fields, cart, heart or menu icons, and no website or app chrome of any kind.";

// Display artefacts a garment reference carries — the hanger it hangs on, the
// mannequin's head form, the retail hang tag, the stuck-on size sticker — were
// being reproduced ONTO the model (a rhinestone tiara from a mannequin head, a
// size "32" label on a model's chest). The reference is a product photograph;
// only the clothing inside it is the subject.
const REFERENCE_IS_A_PRODUCT_PHOTO =
  "The garment reference is a PRODUCT PHOTOGRAPH, not a scene: copy ONLY the clothing itself. Everything present for display purposes must be absent from your render — the hanger, hook, mannequin, stand or head form, the studio background, hang tags, price or size stickers, brand labels attached at the collar, and any other garment visible beside or behind it.";

// Universal framing guard — a single, well-composed photograph with every key
// subject fully inside the frame. Guards against the two edge failures seen in
// output: subjects/product touching or cut off by the frame, and split/collage
// compositions. Kept short so it never crowds the concept's own art direction.
const FRAMING =
  "Framing: ONE single photograph — never a split-screen, diptych, side-by-side, grid, collage, before/after or multiple panels. Compose so every key subject and the product sit FULLY inside the frame with a comfortable margin on all sides; nothing important (heads, hands, feet, the product or its label) touches or is cut off by any edge.";

// On-model specific framing — the on-model fusion tends to render a front+back
// catalogue diptych with a small figure and empty bands; force one full-figure
// hero with headroom and foot-room so the compositor's aspect crop never clips
// the model or the garment.
const ON_MODEL_FRAMING =
  "Show ONE model in ONE single full-body view only — no front-and-back split, no repeated or mirrored figure, no catalogue grid. Exactly ONE person in the entire frame: no other people, background figures, passers-by or reflections of people anywhere. Frame the full figure from above the head to below the feet, centred and filling the frame naturally, with clear breathing room above the head and below the feet; do NOT crop the model, their head/feet or the garment at the top, bottom or sides.";

// PLAIN on-model runs deliver e-commerce product-page shots, not ad scenes.
// Appended AFTER the concept's scene body so a stray concept that still writes
// a location/story cannot override the deliverable the user actually chose.
const PLAIN_ECOMMERCE =
  "STRICT E-COMMERCE SHOWCASE (this overrides any scene direction above): a clean apparel product-page photograph — seamless studio backdrop or minimal neutral setting only; the garment fully visible as the hero with drape and details readable; no location scenes, no storytelling staging, no props beyond at most a simple stool or block, and absolutely no other people. STYLING IS FIXED so every frame of this product cuts together as one shoot: plain matching bottoms in a tone drawn from the garment itself, simple neutral closed footwear (never sports sneakers with formal or festive wear, never barefoot), and no jewellery, watch, sunglasses, bag, dupatta or headwear unless that piece is part of the garment in the reference.";

/**
 * On-model art direction, keyed by what the account sells. Both are ALWAYS
 * appended after the concept's own prompt — they are the photographic craft
 * floor (lens, light, grooming, pose energy) that turns "AI image of a person
 * in clothes" into "frame from a real model photoshoot". Kept compact so they
 * reinforce rather than fight the concept's art direction.
 */
export type OnModelDirection = "editorial" | "catalog";

const ON_MODEL_DIRECTION: Record<OnModelDirection, string> = {
  // Premium fashion accounts: styled fashion-campaign photograph with
  // character energy (reference: theblueman.net lookbooks).
  editorial:
    "PHOTOSHOOT DIRECTION (premium fashion campaign): shoot it as a frame from a designer lookbook campaign — 85mm–105mm portrait compression, shallow depth of field, directional natural or rim light with sculpted contrast and real dimensionality. The set is an environment with genuine depth and tasteful props or textures (architectural detail, foliage, weathered wood, an evocative location) — never a bare seamless wall. The model has styled character energy: impeccable grooming, confident expressive posture, natural hands, and tasteful complementary accessories where they suit the garment (sunglasses, a watch, layered pieces). Rich, confident yet controlled colour grade with a sophisticated story. Never a flat catalogue listing, never mass-market retail energy.",
  // E-commerce apparel accounts: clean premium catalog showcase (reference:
  // schein.in product photography).
  catalog:
    "PHOTOSHOOT DIRECTION (premium e-commerce showcase): shoot it as a premium apparel product photograph — the GARMENT is the hero. Soft, diffused, flattering daylight-quality key light with gentle falloff and delicate soft shadows; a warm neutral minimal set — seamless studio tone or a calm beige/cream architectural backdrop (plaster wall, subtle arch or steps) with quiet depth — that never competes with the clothing. Muted, harmonious palette that flatters the garment's colours. Crisp, macro-readable focus on fabric texture, drape, embroidery/print detail and cut. The model is elegantly groomed with a natural, poised, relaxed pose that presents the garment clearly — full drape, fit and details all readable. Polished premium-listing quality: clean, quiet, true to the garment.",
};

/**
 * Join head (critical instructions) + body (LLM-authored scene, unbounded —
 * the schema's length limits are describe-only) + tail (critical floors)
 * under a char cap by truncating ONLY the body. A naive `.slice(cap)` on the
 * joined string cuts the guards first, which are the whole point.
 */
function joinCapped(head: string[], body: string, tail: string[], cap: number): string {
  const headStr = head.join("\n\n");
  const tailStr = tail.join("\n\n");
  const budget = Math.max(0, cap - headStr.length - tailStr.length - 4);
  return [headStr, body.slice(0, budget), tailStr].filter(Boolean).join("\n\n");
}

/** Language → script descriptor for the baked-typography instruction. */
const SCRIPT_NAME: Record<string, string> = {
  en: "English",
  hinglish: "Hinglish (Hindi written in Latin script)",
  hi: "Hindi in Devanagari script",
  pa: "Punjabi in Gurmukhi script",
};

/**
 * PASS 1 — the wordless scene. Trust-the-brief: the concept's imagePrompt IS
 * the prompt (it carries the creative direction — see the concepts system
 * prompt). Code appends the product-reference line plus the non-negotiable
 * floors: photographic quality and the per-aspect overlay safe-zone (the
 * concept prompt is aspect-agnostic and the enhancer is fail-open, so neither
 * can be relied on for these).
 */
export function buildScenePassPrompt(opts: {
  concept: CreativeConcept;
  aspect: SceneAspect;
  dissectionPrompt?: string | null;
  hasProduct: boolean;
  /** Per-SKU product truth (sceneDo / sceneDont). It used to reach only the
   * concept LLM, so nothing stopped the RENDER from showing the product wrongly
   * — a pale, matte, undercooked poori sitting in a shallow pan of water-like
   * liquid, which the SKU's own MUST NOT SHOW list forbids. */
  productTruth?: { mustShow: string[]; mustNotShow: string[] } | null;
}): string {
  const body = opts.concept.imagePrompt?.trim() || opts.concept.sceneDescription;
  const truthLine =
    opts.productTruth && (opts.productTruth.mustShow.length || opts.productTruth.mustNotShow.length)
      ? `PRODUCT TRUTH (non-negotiable, overrides the scene text above where they conflict).${opts.productTruth.mustShow.length ? ` The product must appear as it genuinely is when used: ${opts.productTruth.mustShow.join("; ")}.` : ""}${opts.productTruth.mustNotShow.length ? ` NEVER show: ${opts.productTruth.mustNotShow.join("; ")}.` : ""}`
      : "";
  const refLine = opts.hasProduct
    ? `The attached reference photo(s) ARE the exact product: render it faithfully — real packaging, label, shape and colours preserved, its own label text sharp and legible, never redesigned, shown only once. Copy only the product: anything present in the reference purely for display (a hanger, mannequin or stand, a hang tag, a price or size sticker, the studio background, neighbouring products) must NOT appear in your scene.${opts.dissectionPrompt ? ` Reference: ${opts.dissectionPrompt}` : ""}`
    : "";
  return joinCapped([], body, [refLine, truthLine, QUALITY, SAFE_ZONES[opts.aspect], FRAMING, WORDLESS].filter(Boolean), 4000);
}

/**
 * PASS 2 — typography set INTO the finished scene (image edit). Because the
 * type pass sees the final rendered image, it can avoid faces, hands and the
 * product — the failure mode of single-pass baking. Verified by text-QA
 * (spelling + overlap) with a canvas-overlay fallback.
 */
export function buildTypographyEditPrompt(opts: {
  headline: string;
  cta?: string | null;
  language: string;
  typographySpec?: string | null;
  paletteHexes?: string[];
}): string {
  const script = SCRIPT_NAME[opts.language] ?? "English";
  const cta = opts.cta?.trim();
  const parts: string[] = [];
  parts.push(
    `You are given a finished advertising photograph. Set the ad headline "${opts.headline.trim()}" into it as premium baked advertising typography — ${script}, spelled EXACTLY as given, every letter, matra and diacritic correct, perfectly legible, well-kerned, sized like a professional ad headline.${cta ? ` Near it, set the call-to-action "${cta}" in smaller complementary type.` : ""}`,
  );
  if (opts.typographySpec?.trim()) parts.push(`Art direction for the type: ${opts.typographySpec.trim()}`);
  parts.push(
    `PLACEMENT (critical): the type sits ONLY in clean, calm negative space. It must NEVER overlap or touch faces, people, hands, food, the product, its packaging or label. If the directed zone is busy, choose the calmest open area instead.`,
  );
  parts.push(
    `The typography must look art-directed into the photograph: harmonious with the scene's light, perspective and palette${opts.paletteHexes?.length ? ` (brand tones ${opts.paletteHexes.join(", ")})` : ""}, with real depth, never a flat sticker.`,
  );
  parts.push(
    `Change NOTHING else: every other pixel of the photograph stays identical. Add no other text, captions, watermarks or logos.`,
  );
  return parts.join("\n\n").slice(0, 2500);
}

/**
 * ON_MODEL: fuse an AI-model reference (image 1) with the real garment
 * (image 2) into one staged on-model shot. The garment-fidelity block is the
 * key guard against the model "restyling" the clothing (see ADR-0002). The
 * direction preset (editorial vs clean catalog) and the quality floor are
 * ALWAYS appended — photoshoot craft must not depend on what the concept LLM
 * happened to write.
 */
export function buildOnModelPrompt(opts: {
  concept: CreativeConcept;
  aspect: SceneAspect;
  /** Exact-appearance description of the garment, if dissected. */
  garmentPrompt?: string | null;
  /** Optional pose direction; empty = let the scene/art-direction set the pose. */
  pose?: string | null;
  /** Photoshoot treatment; defaults to the clean catalog showcase. */
  direction?: OnModelDirection;
  /** PLAIN branding mode: force a strict e-commerce showcase render. */
  plain?: boolean;
}): string {
  const { concept, aspect, garmentPrompt, pose } = opts;
  const direction = opts.direction ?? "catalog";
  const hasFullPrompt = Boolean(concept.imagePrompt?.trim());
  const parts: string[] = [];
  parts.push(
    `You are given TWO reference images. IMAGE 1 is the human MODEL (preserve their face, body type and identity). IMAGE 2 is the EXACT GARMENT to put on the model.`,
  );
  parts.push(
    `Dress the model from IMAGE 1 in the garment from IMAGE 2. GARMENT FIDELITY (critical): reproduce the garment's exact colour, print/pattern, fabric, neckline, sleeves, length and cut faithfully. Do NOT restyle, recolour, re-pattern or redesign it. Fit it naturally to the body with correct drape, folds and shadows.${garmentPrompt ? ` Garment reference: ${garmentPrompt}` : ""}`,
  );
  parts.push(REFERENCE_IS_A_PRODUCT_PHOTO);
  if (pose?.trim()) {
    parts.push(
      `POSE (follow this): the model is ${pose.trim()}. Keep it natural and flattering for the garment, with correct anatomy and hands.`,
    );
  }
  parts.push(
    `The scene below sets the location, mood, pose and styling. If it mentions a person, use that ONLY for pose and styling — the model's identity (face, gender, age, body, skin tone) ALWAYS comes from IMAGE 1, never from the scene text.${pose?.trim() ? " Where the scene's pose differs from the POSE above, the POSE above wins." : ""}`,
  );
  // Trust-the-brief for the SCENE (location, mood, story): the concept's
  // imagePrompt carries it. Legacy concepts without one fall back to the
  // sceneDescription plus palette/wordlessness blocks. The scene body is the
  // ONLY truncatable section — fidelity head and craft floors always survive.
  const body = hasFullPrompt ? concept.imagePrompt.trim() : concept.sceneDescription;
  const tail: string[] = [];
  if (!hasFullPrompt) {
    tail.push(`Palette: lead with ${concept.paletteHexes.join(", ")} as the dominant tones.`);
  }
  // Photographic craft floors apply to BOTH paths — the concept prompt is
  // written for a generic scene and cannot be relied on for on-model
  // photoshoot direction, quality, safe-zones or single-figure framing.
  if (opts.plain) tail.push(PLAIN_ECOMMERCE);
  tail.push(ON_MODEL_DIRECTION[direction]);
  tail.push(QUALITY);
  // A PLAIN run composites no overlay, so reserving a calmer/darker headline
  // band just surrenders up to a third of the catalog frame and dulls the
  // garment in it. Only branded runs need the safe zone.
  if (!opts.plain) tail.push(SAFE_ZONES[aspect]);
  tail.push(ON_MODEL_FRAMING);
  tail.push(FRAMING);
  tail.push(WORDLESS);
  return joinCapped(parts, body, tail, 4500);
}

/** Literal direct-prompt mode: user's exact words become the scene, product preserved. */
export function buildDirectPrompt(opts: {
  userPrompt: string;
  aspect: SceneAspect;
  dissectionPrompt?: string | null;
  hasProduct: boolean;
  paletteHexes?: string[];
}): string {
  const parts: string[] = [];
  if (opts.hasProduct) {
    parts.push(
      `Use the provided product photo as the EXACT product — reproduce it faithfully and show it only ONCE, naturally placed.${opts.dissectionPrompt ? ` Reference: ${opts.dissectionPrompt}` : ""}`,
    );
  }
  parts.push(opts.userPrompt);
  parts.push(QUALITY);
  if (opts.paletteHexes?.length) parts.push(`Palette: lead with ${opts.paletteHexes.join(", ")}.`);
  parts.push(SAFE_ZONES[opts.aspect]);
  parts.push(
    `No on-image text, letters, logos or watermarks${opts.hasProduct ? " other than what is printed on the actual product pack" : ""}.`,
  );
  parts.push(FRAMING);
  return parts.join("\n\n").slice(0, 2000);
}
