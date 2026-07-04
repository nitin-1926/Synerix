import { describe, it, expect } from "vitest";
import { buildScenePrompt, buildOnModelPrompt, buildDirectPrompt } from "./image-prompt";
import type { CreativeConcept } from "./schemas";

const concept = {
  name: "Festive family",
  archetype: "headline_bottom",
  sceneDescription: "A warm Indian living room at dusk with a family gathered.",
  paletteHexes: ["#b83b5e", "#e8862e"],
} as unknown as CreativeConcept;

describe("buildScenePrompt", () => {
  it("in-scene with product instructs faithful single placement + carries scene/quality/palette", () => {
    const p = buildScenePrompt({ concept, aspect: "4:5", mode: "in_scene", hasProduct: true });
    expect(p).toMatch(/EXACT product/i);
    expect(p).toMatch(/only ONCE/i);
    expect(p).toContain(concept.sceneDescription);
    expect(p).toMatch(/Photoreal/);
    expect(p).toContain("#b83b5e");
    expect(p).toMatch(/No on-image text/i);
  });

  it("composite mode forbids any product in the scene (product-less backdrop)", () => {
    const p = buildScenePrompt({ concept, aspect: "4:5", mode: "composite", hasProduct: true });
    expect(p).toMatch(/do NOT place any product/i);
    expect(p).toMatch(/EMPTY hero spot/i);
    expect(p).toMatch(/PACKSHOT BACKDROP/i);
  });

  it("stays within the 2000-char cap", () => {
    const p = buildScenePrompt({ concept, aspect: "9:16", mode: "in_scene", hasProduct: true });
    expect(p.length).toBeLessThanOrEqual(2000);
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

  it("includes the garment reference description when provided", () => {
    const p = buildOnModelPrompt({ concept, aspect: "4:5", garmentPrompt: "navy quilted bomber jacket" });
    expect(p).toContain("navy quilted bomber jacket");
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
