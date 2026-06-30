import { describe, it, expect } from "vitest";
import { buildOverlaySpec, contactLayer, computeLogoBox, plateFocusYFor } from "./archetypes";
import { ASPECT_DIMENSIONS } from "./types";

const base = {
  archetype: "headline_bottom",
  aspectRatio: "4:5",
  language: "en" as const,
  copy: { headline: { en: "Hi", hinglish: "Hi", hi: "नमस्ते", pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ" } },
  brand: { primaryColorHex: "#b83b5e", accentColorHex: "#e8862e" },
};

describe("plateFocusY crop anchor (single source of truth)", () => {
  it("maps safeBand to a subject-preserving anchor (band bottom → keep top)", () => {
    expect(plateFocusYFor("bottom")).toBe(0.35); // empty band low → subject high → keep top
    expect(plateFocusYFor("top")).toBe(0.65); // empty band high → subject low → keep bottom
    expect(plateFocusYFor("center")).toBe(0.5);
    expect(plateFocusYFor(undefined)).toBe(0.5);
  });

  it("buildOverlaySpec stamps plateFocusY from safeBand so every render path inherits it", () => {
    const bottom = buildOverlaySpec({ ...base, placement: { safeBand: "bottom" } });
    expect(bottom.plateFocusY).toBe(0.35);
    const top = buildOverlaySpec({ ...base, placement: { safeBand: "top" } });
    expect(top.plateFocusY).toBe(0.65);
  });

  it("leaves plateFocusY unset for centered/absent bands (byte-identical legacy crop)", () => {
    expect(buildOverlaySpec({ ...base, placement: { safeBand: "center" } }).plateFocusY).toBeUndefined();
    expect(buildOverlaySpec({ ...base }).plateFocusY).toBeUndefined();
  });
});

describe("buildOverlaySpec — Brand Block contact line", () => {
  it("renders the contact line only when showContact is true", () => {
    const spec = buildOverlaySpec({ ...base, contactLine: "For queries: 98xxxx", showContact: true });
    const contact = spec.textLayers.find((l) => l.role === "contact");
    expect(contact).toBeTruthy();
    expect(contact?.textByLang.en).toBe("For queries: 98xxxx");
  });

  it("omits the contact line when showContact is false", () => {
    const spec = buildOverlaySpec({ ...base, contactLine: "For queries: 98xxxx", showContact: false });
    expect(spec.textLayers.some((l) => l.role === "contact")).toBe(false);
  });

  it("omits the contact line when showContact is true but the line is empty", () => {
    const spec = buildOverlaySpec({ ...base, contactLine: "   ", showContact: true });
    expect(spec.textLayers.some((l) => l.role === "contact")).toBe(false);
  });
});

describe("buildOverlaySpec — logo placement", () => {
  it("defaults the logo to the top-left corner", () => {
    const spec = buildOverlaySpec({ ...base, logoAssetRef: "brands/x/logo.png" });
    const { width } = ASPECT_DIMENSIONS["4:5"];
    expect(spec.logo).toBeTruthy();
    expect(spec.logo!.x).toBeLessThan(width / 2);
    expect(spec.logo!.y).toBeLessThan(width / 2);
  });

  it("honors a bottom-right logo corner", () => {
    const spec = buildOverlaySpec({ ...base, logoAssetRef: "brands/x/logo.png", logoPosition: "BR" });
    const { width, height } = ASPECT_DIMENSIONS["4:5"];
    expect(spec.logo!.x).toBeGreaterThan(width / 2);
    expect(spec.logo!.y).toBeGreaterThan(height / 2);
  });
});

describe("contactLayer", () => {
  it("produces a left-aligned contact role layer at the bottom edge", () => {
    const dims = ASPECT_DIMENSIONS["4:5"];
    const layer = contactLayer("Call 98xxxx", dims);
    expect(layer.role).toBe("contact");
    expect(layer.align).toBe("left");
    expect(layer.y).toBeGreaterThan(0);
    expect(layer.textByLang.pa).toBe("Call 98xxxx");
  });
});

describe("computeLogoBox", () => {
  it("places a top-center logo horizontally centered", () => {
    const dims = ASPECT_DIMENSIONS["1:1"];
    const box = computeLogoBox("logo.png", dims, "TC", 1);
    const center = dims.width / 2;
    expect(box.x + box.w / 2).toBeCloseTo(center, 0);
  });
});
