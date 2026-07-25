import type { CreativeConcept } from "./schemas";

/**
 * Deterministic concept briefs for PLAIN on-model runs (e-commerce apparel
 * product-page shots).
 *
 * Why no LLM here: a PLAIN on-model creative ships the bare model+garment
 * photograph — the compositor renders NO headline, subhead, CTA or logo (see
 * `plainMode` in generation-run). The concept LLM's entire output except the
 * scene line (four-language copy, big idea, archetype, typography spec) is
 * discarded, so paying Opus for concepting + Sonnet for brief QA + Opus for
 * prompt polish bought nothing but latency (~$0.12 and ~45s per creative,
 * measured on prod runs). The variation a catalog actually needs is framing,
 * not storytelling, and a fixed shot list gives a client's 800-image drop the
 * consistency an LLM cannot hold across runs.
 *
 * These bodies deliberately carry ONLY the shot: pose, camera, crop, backdrop.
 * The craft floors (garment fidelity, light quality, single-figure framing,
 * the schein-anchored catalog direction) are appended by buildOnModelPrompt.
 */

interface Shot {
  name: string;
  body: string;
}

/** Backdrops stay in one warm-neutral family on purpose — a catalog reads as a
 * set. The variation axis is framing and pose. */
const SHOTS: Shot[] = [
  {
    name: "Front hero",
    body: "Full-length straight-on hero frame. The model stands facing camera in a relaxed, symmetrical stance, weight settled on one leg, arms loose at the sides, chin level, calm confident expression. Warm off-white seamless studio backdrop with a soft floor gradient and a gentle contact shadow.",
  },
  {
    name: "Three-quarter turn",
    body: "Full-length three-quarter frame. The model's body is turned about thirty degrees from camera with the head returning to lens, one hand resting easily at the side or in a pocket, shoulders relaxed and open. Calm cream plaster wall with soft daylight falloff across it.",
  },
  {
    name: "In motion",
    body: "Full-length walking frame. The model steps naturally toward camera mid-stride, the garment carrying real motion in its fabric and hem, arms swinging loosely, gaze forward. Warm beige studio backdrop kept quiet so the movement of the cloth reads clearly.",
  },
  {
    name: "Side profile",
    body: "Full-length side frame. The model stands turned away from camera at roughly forty-five degrees, looking off-frame, so the garment's silhouette, side seams, sleeve line and back drape all read. Sand-toned wall with a soft directional shadow falling behind the figure.",
  },
  {
    name: "Seated",
    body: "Full-length seated frame. The model sits on a simple pale wooden block, posture relaxed and upright, hands easy, one leg extended, so the garment's drape falls naturally across the lap and shoulders. Warm neutral studio backdrop, uncluttered.",
  },
  {
    name: "Architectural",
    body: "Full-length environmental frame. The model stands beside a quiet beige architectural detail — a subtle plaster arch or a low step riser — lit by soft window light from one side, posture poised and still. Minimal set with gentle depth, nothing competing with the clothing.",
  },
];

/** Pose-driven runs get the pose from the run itself, so the body must not
 * dictate a competing one — it sets the backdrop and camera only. */
const NEUTRAL_SHOT: Shot = {
  name: "Studio shot",
  body: "Full-length studio frame on a warm off-white seamless backdrop with a soft floor gradient and a gentle contact shadow. Camera at chest height, straight and undistorted, the full figure centred with the garment reading clearly from head to hem.",
};

function toConcept(shot: Shot, palette: string[]): CreativeConcept {
  const empty = { eyebrow: null, headline: "", subhead: null, cta: "" };
  return {
    name: shot.name,
    bigIdea: shot.body,
    whyFits: "E-commerce apparel product-page shot.",
    insightRationale: "",
    artDirection: shot.body,
    archetype: "headline_bottom",
    productPlacement: "lifestyle",
    sceneDescription: shot.body,
    imagePrompt: shot.body,
    typographySpec: "",
    paletteHexes: palette.length ? palette.slice(0, 4) : ["#f5f1ea", "#d8cfc2"],
    copy: { en: empty, hinglish: empty, hi: empty, pa: empty },
  } as CreativeConcept;
}

/**
 * Build `count` catalog shot briefs. Pose-driven runs (the user picked poses in
 * the studio) always get exactly one neutral brief — there the poses are the
 * variation axis and the caller renders one creative per pose.
 */
export function buildCatalogConcepts(opts: {
  count: number;
  poseDriven?: boolean;
  palette?: string[];
}): CreativeConcept[] {
  const palette = opts.palette ?? [];
  if (opts.poseDriven) return [toConcept(NEUTRAL_SHOT, palette)];
  const n = Math.max(1, opts.count);
  return Array.from({ length: n }, (_, i) => toConcept(SHOTS[i % SHOTS.length], palette));
}
