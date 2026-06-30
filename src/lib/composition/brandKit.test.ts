import { describe, it, expect } from "vitest";
import { resolveBrandKit } from "./brandKit";

describe("resolveBrandKit", () => {
  it("derives palette roles + a pairing from brand colours and typography", () => {
    const kit = resolveBrandKit({ primaryColorHex: "#1d59a2", accentColorsHex: ["#e8a020"], typographyStyle: "premium elegant serif" });
    expect(kit.palette.roles.accent).toBe("#e8a020");
    expect(kit.preferPairing).toBe("editorial-serif");
    expect(kit.preferDeviceStyle).toBeTruthy();
  });

  it("routes apparel brands to the fashion pairing", () => {
    const kit = resolveBrandKit({ primaryColorHex: "#222", productCategory: "APPAREL" });
    expect(kit.preferPairing).toBe("tall-minimal");
  });

  it("is safe with empty brand input", () => {
    const kit = resolveBrandKit({});
    expect(kit.palette.roles.bg).toMatch(/^#[0-9a-f]{6}$/);
    expect(kit.preferPairing).toBeTruthy();
  });
});
