import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { analyzePlate } from "./analyze";

function noisyBand(where: "top" | "bottom"): Promise<Buffer> {
  const y0 = where === "top" ? 0 : 540;
  const rects = Array.from({ length: 60 }, (_, i) =>
    `<rect x="${(i * 41) % 600}" y="${y0 + ((i * 31) % 240)}" width="40" height="40" fill="#${((i * 7919) % 0xffffff).toString(16).padStart(6, "0")}"/>`,
  ).join("");
  return sharp({ create: { width: 600, height: 800, channels: 3, background: { r: 200, g: 180, b: 140 } } })
    .composite([{ input: Buffer.from(`<svg width="600" height="800">${rects}</svg>`), blend: "over" }])
    .png()
    .toBuffer();
}

describe("analyzePlate", () => {
  it("anchors to the calm band opposite the busy band", async () => {
    expect((await analyzePlate(await noisyBand("top"))).safeBand).toBe("bottom");
    expect((await analyzePlate(await noisyBand("bottom"))).safeBand).toBe("top");
  });

  it("extracts dominant colours as hex", async () => {
    const a = await analyzePlate(await noisyBand("bottom"));
    expect(a.dominant.length).toBeGreaterThan(0);
    expect(a.dominant[0]).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("reports a bounded busyness score", async () => {
    const a = await analyzePlate(await noisyBand("top"));
    expect(a.busyness).toBeGreaterThanOrEqual(0);
    expect(a.busyness).toBeLessThanOrEqual(1);
  });
});
