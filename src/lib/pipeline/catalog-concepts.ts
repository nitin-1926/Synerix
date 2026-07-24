import type { CreativeConcept } from "./schemas";

/**
 * Deterministic concept briefs for PLAIN on-model runs (e-commerce apparel
 * product-page shots).
 *
 * Why no LLM here: a PLAIN on-model creative ships the bare model+garment
 * photograph — the compositor renders NO headline, subhead, CTA or logo (see
 * `plainMode` in generation-run). The concept LLM's entire output except the
 * scene line is discarded, so paying for concepting + brief QA + prompt polish
 * bought nothing but latency. The variation a catalog needs is framing, not
 * storytelling.
 */

interface Shot {
  name: string;
  body: string;
}

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
];

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

export function buildCatalogConcepts(opts: {
  count: number;
  poseDriven?: boolean;
  palette?: string[];
}): CreativeConcept[] {
  const palette = opts.palette ?? [];
  const n = Math.max(1, opts.count);
  return Array.from({ length: n }, (_, i) => toConcept(SHOTS[i % SHOTS.length], palette));
}
