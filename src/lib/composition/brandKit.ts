import { makePalette } from "./color";
import { pickTypePairing } from "./typeSystem";
import type { DeviceStyle } from "./devices";
import type { Palette } from "./types";

/**
 * A resolved BrandKit — the brand's design identity, derived once from its
 * colours + typography style. Passing the kit's preferred pairing/device into
 * template selection keeps every creative for a brand visually coherent, while
 * still letting a strong occasion signal (e.g. a sale) override.
 *
 * Derived at runtime from existing fields — no schema change. A future BrandKit
 * table can persist overrides, but the defaults live here.
 */
export interface BrandKit {
  palette: Palette;
  /** Preferred type pairing id for this brand (consistency anchor). */
  preferPairing: string;
  /** Preferred graphic-device style. */
  preferDeviceStyle: DeviceStyle;
}

export interface BrandLike {
  primaryColorHex?: string | null;
  accentColorsHex?: string[] | null;
  typographyStyle?: string | null;
  photographyStyle?: string | null;
  productCategory?: string | null;
}

/** Map a type pairing to a default device style that complements it. */
const DEVICE_FOR_PAIRING: Record<string, DeviceStyle> = {
  "editorial-serif": "bars",
  "bold-impact": "block",
  "modern-grotesque": "bars",
  "tall-minimal": "minimal",
  "clean-sans": "bars",
};

export function resolveBrandKit(brand: BrandLike): BrandKit {
  const palette = makePalette({
    primaryHex: brand.primaryColorHex ?? "#b83b5e",
    accentHex: brand.accentColorsHex?.[0] ?? null,
  });
  const pairing = pickTypePairing({
    typographyStyle: brand.typographyStyle,
    productCategory: brand.productCategory,
  });
  return {
    palette,
    preferPairing: pairing.id,
    preferDeviceStyle: DEVICE_FOR_PAIRING[pairing.id] ?? "bars",
  };
}
