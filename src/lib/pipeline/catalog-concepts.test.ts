import { describe, expect, it } from "vitest";
import { buildCatalogConcepts } from "./catalog-concepts";

describe("buildCatalogConcepts", () => {
  it("gives every requested concept a distinct shot", () => {
    const concepts = buildCatalogConcepts({ count: 4 });
    expect(concepts).toHaveLength(4);
    expect(new Set(concepts.map((c) => c.imagePrompt)).size).toBe(4);
    expect(new Set(concepts.map((c) => c.name)).size).toBe(4);
  });
});
