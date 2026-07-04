import { describe, it, expect } from "vitest";
import { closestGptSize, resolveSceneChain } from "./provider";
import { ASPECT_DIMENSIONS } from "@/lib/composition/types";

describe("resolveSceneChain — quality-first fallback cascade", () => {
  it("default chain is NB Pro → GPT Image 2 → NB2 → Seedream (owner-specified order)", () => {
    expect(resolveSceneChain({})).toEqual([
      { provider: "gemini", tier: "hero" },
      { provider: "gpt-image-2", tier: "hero" },
      { provider: "gemini", tier: "default" },
      { provider: "seedream", tier: "default" },
    ]);
  });

  it("forced provider (no softPrefer) is a single attempt with no fallback", () => {
    expect(resolveSceneChain({ provider: "seedream", tier: "default" })).toEqual([
      { provider: "seedream", tier: "default" },
    ]);
  });

  it("soft NB Pro pref leads and keeps the full cascade behind it, deduped", () => {
    expect(resolveSceneChain({ provider: "gemini", tier: "hero", softPrefer: true })).toEqual([
      { provider: "gemini", tier: "hero" },
      { provider: "gpt-image-2", tier: "hero" },
      { provider: "gemini", tier: "default" },
      { provider: "seedream", tier: "default" },
    ]);
  });

  it("soft GPT Image 2 pref leads, then NB Pro, NB2, Seedream", () => {
    expect(resolveSceneChain({ provider: "gpt-image-2", tier: "hero", softPrefer: true })).toEqual([
      { provider: "gpt-image-2", tier: "hero" },
      { provider: "gemini", tier: "hero" },
      { provider: "gemini", tier: "default" },
      { provider: "seedream", tier: "default" },
    ]);
  });
});

const SUPPORTED = new Set(["1024x1024", "1024x1536", "1536x1024"]);

describe("closestGptSize — single-sourced from ASPECT_DIMENSIONS", () => {
  it("only ever returns an OpenAI-supported size", () => {
    for (const aspect of ["1:1", "4:5", "9:16", "16:9"] as const) {
      expect(SUPPORTED.has(closestGptSize(aspect))).toBe(true);
    }
  });

  it("picks the size whose ratio is nearest the canvas ratio", () => {
    // 1:1 → square; portraits → 2:3 portrait; 16:9 → 3:2 landscape.
    expect(closestGptSize("1:1")).toBe("1024x1024");
    expect(closestGptSize("4:5")).toBe("1024x1536");
    expect(closestGptSize("9:16")).toBe("1024x1536");
    expect(closestGptSize("16:9")).toBe("1536x1024");
  });

  it("never returns a size whose orientation is opposite the canvas", () => {
    for (const aspect of ["4:5", "9:16"] as const) {
      const [w, h] = closestGptSize(aspect).split("x").map(Number);
      const canvas = ASPECT_DIMENSIONS[aspect];
      const canvasPortrait = canvas.width < canvas.height;
      const sizePortrait = w < h;
      expect(sizePortrait).toBe(canvasPortrait); // portrait canvas → portrait size
    }
  });
});
