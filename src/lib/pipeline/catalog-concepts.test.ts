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
