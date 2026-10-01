import { describe, expect, it } from "vitest";
import { stripDashes } from "./dashes";

describe("stripDashes", () => {
  it("turns prose dashes into commas", () => {
    expect(stripDashes("Diwali sale — 20% off")).toBe("Diwali sale, 20% off");
    expect(stripDashes("Fresh – crisp – festive")).toBe("Fresh, crisp, festive");
  });

  it("keeps numeric ranges as ranges", () => {
    expect(stripDashes("Ships in 3–4 days")).toBe("Ships in 3-4 days");
    expect(stripDashes("₹499—999 only")).toBe("₹499-999 only");
  });

  it("never leaves a doubled comma", () => {
    expect(stripDashes("Hello, — world")).toBe("Hello, world");
  });
});
