import { describe, expect, it } from "vitest";
import { buildCatalogConcepts } from "./catalog-concepts";
import { buildOnModelPrompt } from "./image-prompt";

describe("buildCatalogConcepts", () => {
  it("gives every requested concept a distinct shot", () => {
    const concepts = buildCatalogConcepts({ count: 4 });
    expect(concepts).toHaveLength(4);
    expect(new Set(concepts.map((c) => c.imagePrompt)).size).toBe(4);
    expect(new Set(concepts.map((c) => c.name)).size).toBe(4);
  });

  it("collapses to one neutral brief when poses drive the variation", () => {
    const [concept, ...rest] = buildCatalogConcepts({ count: 4, poseDriven: true });
    expect(rest).toHaveLength(0);
    // A pose-driven body must not fight the run's own pose instruction.
    expect(concept.imagePrompt).not.toMatch(/stride|seated|turned/i);
  });

  it("renders a prompt carrying the catalog craft floors and no copy", () => {
    const [concept] = buildCatalogConcepts({ count: 1, palette: ["#f5f1ea"] });
    const prompt = buildOnModelPrompt({ concept, aspect: "4:5", direction: "catalog", plain: true });
    expect(prompt).toMatch(/premium e-commerce showcase/i);
    expect(prompt).toMatch(/STRICT E-COMMERCE SHOWCASE/);
    expect(prompt).toContain(concept.imagePrompt);
    expect(concept.copy.en.headline).toBe("");
  });
});

describe("render-prompt guards (regressions found in shipped output)", () => {
  const [concept] = buildCatalogConcepts({ count: 1 });

  it("bans baked text and app UI on the PLAIN path — the guard used to be dead code", () => {
    const prompt = buildOnModelPrompt({ concept, aspect: "4:5", direction: "catalog", plain: true });
    expect(prompt).toMatch(/NO TEXT ANYWHERE/);
    expect(prompt).toMatch(/never a screenshot/i);
  });

  it("does not reserve a headline safe-zone on PLAIN runs (nothing is composited there)", () => {
    const plain = buildOnModelPrompt({ concept, aspect: "4:5", direction: "catalog", plain: true });
    const branded = buildOnModelPrompt({ concept, aspect: "4:5", direction: "catalog" });
    expect(plain).not.toMatch(/headline overlay/i);
    expect(branded).toMatch(/headline overlay/i);
  });

  it("tells the model the garment reference is a product photo, not a scene", () => {
    const prompt = buildOnModelPrompt({ concept, aspect: "4:5", direction: "catalog", plain: true });
    expect(prompt).toMatch(/PRODUCT PHOTOGRAPH/);
    expect(prompt).toMatch(/hang tags/);
  });

  it("locks styling so one product's frames cut together as one shoot", () => {
    const prompt = buildOnModelPrompt({ concept, aspect: "4:5", direction: "catalog", plain: true });
    expect(prompt).toMatch(/STYLING IS FIXED/);
    expect(prompt).toMatch(/never barefoot/);
  });
});
