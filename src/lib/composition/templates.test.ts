import { describe, it, expect } from "vitest";
import { selectTemplates, TEMPLATES } from "./templates";
import { buildOverlaySpec } from "./archetypes";
import { scoreSpec } from "./score";

const copy = {
  eyebrow: { en: "Limited Time", hinglish: "Limited Time", hi: "सीमित समय", pa: "ਸੀਮਤ ਸਮਾਂ" },
  headline: { en: "Big Diwali Sale", hinglish: "Big Diwali Sale", hi: "बड़ी दिवाली सेल", pa: "ਵੱਡੀ ਦੀਵਾਲੀ ਸੇਲ" },
  cta: { en: "Shop Now", hinglish: "Shop Now", hi: "अभी खरीदें", pa: "ਹੁਣੇ ਖਰੀਦੋ" },
};
const brand = { primaryColorHex: "#1d59a2", accentColorHex: "#e8a020" };

describe("template selection", () => {
  it("routes sale signals to impact templates", () => {
    const t = selectTemplates({ aspect: "4:5", signals: "big diwali sale offer discount", busyness: 0.3 }, 3);
    expect(t.length).toBeGreaterThan(0);
    expect(t[0].typePairingId).toBe("bold-impact");
  });

  it("routes premium signals to editorial templates", () => {
    const t = selectTemplates({ aspect: "4:5", signals: "wedding premium heartfelt", busyness: 0.3 }, 3);
    expect(t[0].typePairingId).toBe("editorial-serif");
  });

  it("always returns at least one template with no signals", () => {
    expect(selectTemplates({ aspect: "4:5" }, 3).length).toBeGreaterThan(0);
  });

  it("respects busyness constraints (skips framed on busy plates)", () => {
    const t = selectTemplates({ aspect: "4:5", signals: "premium wedding", busyness: 0.9 }, 6);
    expect(t.some((x) => x.id === "editorial-framed")).toBe(false);
  });
});

describe("scoreSpec", () => {
  it("rewards a headline that lands in the calm band", () => {
    const bottomTemplate = TEMPLATES.find((t) => t.archetype === "headline_bottom")!;
    const spec = buildOverlaySpec({
      archetype: bottomTemplate.archetype,
      aspectRatio: "4:5",
      language: "en",
      copy,
      brand,
      typePairingId: bottomTemplate.typePairingId,
      deviceStyle: bottomTemplate.deviceStyle,
      placement: { safeBand: "bottom", busyness: 0.3 },
    });
    const matched = scoreSpec(spec, { safeBand: "bottom", busyness: 0.3 }).score;
    const mismatched = scoreSpec(spec, { safeBand: "top", busyness: 0.3 }).score;
    expect(matched).toBeGreaterThan(mismatched);
  });

  it("returns a bounded 0..100 score", () => {
    const spec = buildOverlaySpec({ archetype: "headline_bottom", aspectRatio: "4:5", language: "en", copy, brand });
    const s = scoreSpec(spec);
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.score).toBeLessThanOrEqual(100);
  });
});
