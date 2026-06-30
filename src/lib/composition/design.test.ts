import { describe, it, expect } from "vitest";
import { buildOverlaySpec } from "./archetypes";
import { pickTypePairing, TYPE_PAIRINGS } from "./typeSystem";
import { makePalette, resolveColorRole } from "./color";
import { DISPLAY } from "./fonts";

const base = {
  archetype: "headline_bottom",
  aspectRatio: "4:5",
  language: "en" as const,
  copy: {
    eyebrow: { en: "Special", hinglish: "Special", hi: "खास", pa: "ਖਾਸ" },
    headline: { en: "Golden Morning", hinglish: "Golden Morning", hi: "सुनहरी सुबह", pa: "ਸੁਨਹਿਰੀ ਸਵੇਰ" },
    cta: { en: "Order Now", hinglish: "Order Now", hi: "ऑर्डर करें", pa: "ਆਰਡਰ ਕਰੋ" },
  },
  brand: { primaryColorHex: "#1d59a2", accentColorHex: "#e8a020" },
};

describe("type pairing selection", () => {
  it("maps sale/offer signals to bold-impact", () => {
    expect(pickTypePairing({ occasion: "Big Diwali Sale, flat discount" }).id).toBe("bold-impact");
  });
  it("maps apparel category to tall-minimal", () => {
    expect(pickTypePairing({ productCategory: "APPAREL" }).id).toBe("tall-minimal");
  });
  it("falls back to the editorial default with no signals", () => {
    expect(pickTypePairing({}).id).toBe("editorial-serif");
  });
});

describe("colour roles", () => {
  it("resolves brand colours into roles and binds via resolveColorRole", () => {
    const palette = makePalette({ primaryHex: "#1d59a2", accentHex: "#e8a020" });
    expect(palette.roles.accent).toBe("#e8a020");
    expect(resolveColorRole(palette, "accent", "#000000")).toBe("#e8a020");
    // ctaText must be legible against the amber CTA (dark ink).
    expect(palette.roles.ctaText).toBe("#1a1a1a");
  });
  it("falls back to the literal colour when no role is given", () => {
    const palette = makePalette({ primaryHex: "#1d59a2", accentHex: "#e8a020" });
    expect(resolveColorRole(palette, undefined, "#abcdef")).toBe("#abcdef");
  });
});

describe("buildOverlaySpec — v2 design pass", () => {
  it("emits a v2 spec with palette, theme and shape devices", () => {
    const spec = buildOverlaySpec({ ...base, typePairingId: "editorial-serif", motto: "Tagline" });
    expect(spec.version).toBe(2);
    expect(spec.palette?.roles.accent).toBe("#e8a020");
    expect(spec.theme?.typePairing).toBe("editorial-serif");
    expect(spec.shapeLayers && spec.shapeLayers.length).toBeGreaterThan(0);
  });

  it("applies the display headline font and binds eyebrow to the accent role", () => {
    const spec = buildOverlaySpec({ ...base, typePairingId: "editorial-serif" });
    const headline = spec.textLayers.find((l) => l.role === "headline");
    const eyebrow = spec.textLayers.find((l) => l.role === "eyebrow");
    expect(headline?.fontFamily).toBe(DISPLAY.dmSerif);
    expect(eyebrow?.colorRole).toBe("accent");
  });

  it("forced pairing overrides the heuristic", () => {
    const spec = buildOverlaySpec({ ...base, occasion: "wedding", typePairingId: "bold-impact" });
    expect(spec.theme?.typePairing).toBe("bold-impact");
    const headline = spec.textLayers.find((l) => l.role === "headline");
    expect(headline?.fontFamily).toBe(TYPE_PAIRINGS["bold-impact"].headline.family);
  });
});
