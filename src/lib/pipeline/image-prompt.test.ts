import { describe, it, expect } from "vitest";
import { buildScenePassPrompt, buildOnModelPrompt, buildDirectPrompt } from "./image-prompt";
import type { CreativeConcept } from "./schemas";

const concept = {
  name: "Festive family",
  archetype: "headline_bottom",
  sceneDescription: "A warm Indian living room at dusk with a family gathered.",
  paletteHexes: ["#b83b5e", "#e8862e"],
} as unknown as CreativeConcept;

const conceptWithPrompt = {
  ...concept,
  imagePrompt:
    "Photograph a warm Indian living room at dusk, family gathered around a low table, golden window light, festive marigolds.",
} as unknown as CreativeConcept;

describe("buildScenePassPrompt", () => {
  it("with product instructs faithful single placement and carries the scene", () => {
    const p = buildScenePassPrompt({ concept, aspect: "4:5", hasProduct: true });
    expect(p).toMatch(/exact product/i);
    expect(p).toMatch(/shown only once/i);
    expect(p).toContain(concept.sceneDescription);
  });

  it("prefers the concept's art-directed imagePrompt over sceneDescription", () => {
    const p = buildScenePassPrompt({ concept: conceptWithPrompt, aspect: "4:5", hasProduct: false });
    expect(p).toContain("golden window light");
    expect(p).not.toContain(concept.sceneDescription);
  });

  it("always appends the quality floor and the per-aspect overlay safe-zone", () => {
    const story = buildScenePassPrompt({ concept: conceptWithPrompt, aspect: "9:16", hasProduct: false });
    expect(story).toMatch(/Photoreal/);
    expect(story).toMatch(/top ~15%/); // 9:16 safe zone
    const feed = buildScenePassPrompt({ concept: conceptWithPrompt, aspect: "4:5", hasProduct: false });
    expect(feed).toMatch(/bottom ~32%/); // 4:5 safe zone
  });

  it("carries the framing guard against edge-cropped / split compositions", () => {
    const p = buildScenePassPrompt({ concept, aspect: "4:5", hasProduct: true });
    expect(p).toMatch(/never a split-screen, diptych/i);
    expect(p).toMatch(/comfortable margin on all sides/i);
    expect(p).toMatch(/cut off by any edge/i);
  });

  it("stays within the 4000-char cap", () => {
    const p = buildScenePassPrompt({ concept, aspect: "9:16", hasProduct: true });
    expect(p.length).toBeLessThanOrEqual(4000);
  });

  it("truncates an oversized concept body, never the guard blocks", () => {
    const huge = { ...concept, imagePrompt: "A ".repeat(3000) + "END" } as unknown as CreativeConcept;
    const p = buildScenePassPrompt({ concept: huge, aspect: "4:5", hasProduct: true });
    expect(p.length).toBeLessThanOrEqual(4000);
    expect(p).toMatch(/Photoreal/); // quality floor survives
    expect(p).toMatch(/bottom ~32%/); // safe zone survives
    expect(p).toMatch(/cut off by any edge/i); // framing guard survives
    expect(p).toMatch(/exact product/i); // fidelity line survives
  });
});

describe("buildOnModelPrompt", () => {
  it("references two images and locks garment fidelity", () => {
    const p = buildOnModelPrompt({ concept, aspect: "4:5" });
    expect(p).toMatch(/TWO reference images/i);
    expect(p).toMatch(/IMAGE 1 is the human MODEL/i);
    expect(p).toMatch(/EXACT GARMENT/i);
    expect(p).toMatch(/GARMENT FIDELITY/i);
    expect(p).toMatch(/do NOT restyle/i);
    expect(p).toContain(concept.sceneDescription);
    expect(p).toMatch(/No on-image text/i);
  });

  it("subordinates any person in the scene text to the model reference (identity from IMAGE 1)", () => {
    const p = buildOnModelPrompt({ concept, aspect: "4:5" });
    expect(p).toMatch(/identity .* ALWAYS comes from IMAGE 1/i);
  });

  it("forces a single full-figure, fully-in-frame composition (no diptych / edge-crop)", () => {
    const p = buildOnModelPrompt({ concept, aspect: "9:16" });
    expect(p).toMatch(/ONE model in ONE single full-body view/i);
    expect(p).toMatch(/no front-and-back split/i);
    expect(p).toMatch(/never a split-screen, diptych/i);
    expect(p).toMatch(/breathing room above the head and below the feet/i);
  });

  it("defaults to the clean-catalog photoshoot direction", () => {
    const p = buildOnModelPrompt({ concept, aspect: "4:5" });
    expect(p).toMatch(/clean showcase/i);
    expect(p).toMatch(/GARMENT is the hero/i);
  });

  it("switches to editorial campaign direction when asked", () => {
    const p = buildOnModelPrompt({ concept, aspect: "4:5", direction: "editorial" });
    expect(p).toMatch(/high-fashion campaign/i);
    expect(p).toMatch(/85mm/);
    expect(p).not.toMatch(/clean showcase/i);
  });

  it("appends the direction and quality floors even when the concept carries a full imagePrompt", () => {
    const p = buildOnModelPrompt({ concept: conceptWithPrompt, aspect: "4:5", direction: "editorial" });
    expect(p).toContain("golden window light");
    expect(p).toMatch(/PHOTOSHOOT DIRECTION/);
    expect(p).toMatch(/Photoreal/);
    expect(p).toMatch(/bottom ~32%/); // 4:5 safe zone
  });

  it("injects the user's pose direction and gives it precedence over the scene", () => {
    const p = buildOnModelPrompt({ concept, aspect: "4:5", pose: "leaning against a pillar" });
    expect(p).toContain("leaning against a pillar");
    expect(p).toMatch(/POSE above wins/i);
  });

  it("includes the garment reference description when provided", () => {
    const p = buildOnModelPrompt({ concept, aspect: "4:5", garmentPrompt: "navy quilted bomber jacket" });
    expect(p).toContain("navy quilted bomber jacket");
  });

  it("truncates an oversized scene body, never the fidelity head or craft floors", () => {
    const huge = { ...concept, imagePrompt: "A ".repeat(3000) + "END" } as unknown as CreativeConcept;
    const p = buildOnModelPrompt({ concept: huge, aspect: "9:16", direction: "editorial" });
    expect(p.length).toBeLessThanOrEqual(4500);
    expect(p).toMatch(/GARMENT FIDELITY/); // head survives
    expect(p).toMatch(/PHOTOSHOOT DIRECTION/); // direction survives
    expect(p).toMatch(/ONE model in ONE single full-body view/i); // on-model framing survives
    expect(p).toMatch(/never a split-screen, diptych/i); // framing survives
    expect(p).toMatch(/top ~15%/); // safe zone survives
  });
});

describe("buildDirectPrompt", () => {
  it("carries the user's literal prompt and preserves product when present", () => {
    const p = buildDirectPrompt({ userPrompt: "Minimal product on marble", aspect: "1:1", hasProduct: true });
    expect(p).toContain("Minimal product on marble");
    expect(p).toMatch(/EXACT product/i);
    expect(p).toMatch(/Photoreal/);
  });

  it("carries the framing guard against edge-cropped / split compositions", () => {
    const p = buildDirectPrompt({ userPrompt: "Minimal product on marble", aspect: "1:1", hasProduct: true });
    expect(p).toMatch(/never a split-screen, diptych/i);
  });
});

describe("framing guard", () => {
  it("scene prompt reserves in-frame margins for every subject", () => {
    const p = buildScenePrompt({ concept, aspect: "4:5", mode: "in_scene", hasProduct: true });
    expect(p).toMatch(/comfortable margin on all sides/i);
    expect(p).toMatch(/cut off by any edge/i);
  });
});
