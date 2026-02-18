import sharp from "sharp";

/**
 * Content-aware plate analysis (deterministic, no AI). Extracts the dominant
 * palette and finds the calmest horizontal band so the layout can anchor the
 * headline into real negative space instead of relying on a blanket scrim.
 *
 * A vision pass (faces / precise subject box) can augment this later; this
 * sharp-based analyzer runs fully offline and is the always-on baseline.
 */

export type SafeBand = "top" | "center" | "bottom";

/** Calmest contiguous vertical region, as fractions of frame height. */
export interface CalmBand {
  y0: number;
  y1: number;
  /** Mean luminance of the band, 0..1 (dark bands suit light type). */
  meanLum: number;
}

export interface PlateAnalysis {
  /** Dominant colours (hex), most-frequent first. */
  dominant: string[];
  /** The calmest third of the frame — best place for the headline block. */
  safeBand: SafeBand;
  /** 0 (clean) .. 1 (very busy) — drives scrim strength. */
  busyness: number;
  /** Finer-grained calm region the layout can anchor the copy block into. */
  calmBand?: CalmBand;
}

function toHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Dominant colours via coarse RGB bucketing on a downsampled copy. */
export async function extractPalette(plate: Buffer, n = 4): Promise<string[]> {
  const w = 64;
  const h = 64;
  const { data, info } = await sharp(plate)
    .resize(w, h, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const buckets = new Map<number, { r: number; g: number; b: number; c: number }>();
  for (let i = 0; i + 2 < data.length; i += ch) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5); // 3 bits/channel
    const e = buckets.get(key) ?? { r: 0, g: 0, b: 0, c: 0 };
    e.r += r;
    e.g += g;
    e.b += b;
    e.c++;
    buckets.set(key, e);
  }
  return [...buckets.values()]
    .sort((a, b) => b.c - a.c)
    .slice(0, n)
    .map((e) => toHex(e.r / e.c, e.g / e.c, e.b / e.c));
}

/** Per-band luminance variance → calmest contiguous region + overall busyness. */
export async function analyzeRegions(
  plate: Buffer,
): Promise<{ safeBand: SafeBand; busyness: number; calmBand: CalmBand }> {
  const gw = 48;
  const gh = 66; // divisible by the band count
  const N_BANDS = 6;
  const { data } = await sharp(plate)
    .resize(gw, gh, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bandH = gh / N_BANDS;
  const bands = Array.from({ length: N_BANDS }, (_, bi) => {
    let sum = 0;
    let sum2 = 0;
    let cnt = 0;
    for (let y = bi * bandH; y < (bi + 1) * bandH; y++) {
      for (let x = 0; x < gw; x++) {
        const v = data[y * gw + x];
        sum += v;
        sum2 += v * v;
        cnt++;
      }
    }
    const mean = sum / cnt;
    return { band: bi, variance: sum2 / cnt - mean * mean, mean };
  });
  const calmest = [...bands].sort((a, b) => a.variance - b.variance)[0];
  // Grow the calm region into adjacent bands that are nearly as calm, so the
  // layout gets a usable y-range instead of a single sliver.
  const tolerance = Math.max(calmest.variance * 1.6, calmest.variance + 250);
  let lo = calmest.band;
  let hi = calmest.band;
  while (lo > 0 && bands[lo - 1].variance <= tolerance) lo--;
  while (hi < N_BANDS - 1 && bands[hi + 1].variance <= tolerance) hi++;
  const run = bands.slice(lo, hi + 1);
  const calmBand: CalmBand = {
    y0: lo / N_BANDS,
    y1: (hi + 1) / N_BANDS,
    meanLum: run.reduce((s, b) => s + b.mean, 0) / run.length / 255,
  };
  const avgVar = bands.reduce((s, b) => s + b.variance, 0) / bands.length;
  // ~4000 variance ≈ very busy; clamp to 0..1.
  const busyness = Math.max(0, Math.min(1, avgVar / 4000));
  // Label by the frame edge the calm region reaches — a run spanning
  // center+bottom is best used as a bottom anchor, not called "center".
  const touchesTop = calmBand.y0 <= 0.05;
  const touchesBottom = calmBand.y1 >= 0.95;
  const center = (calmBand.y0 + calmBand.y1) / 2;
  const safeBand: SafeBand =
    touchesBottom && !touchesTop
      ? "bottom"
      : touchesTop && !touchesBottom
        ? "top"
        : center < 1 / 3
          ? "top"
          : center > 2 / 3
            ? "bottom"
            : "center";
  return { safeBand, busyness, calmBand };
}

export async function analyzePlate(plate: Buffer): Promise<PlateAnalysis> {
  const [dominant, regions] = await Promise.all([extractPalette(plate), analyzeRegions(plate)]);
  return { dominant, ...regions };
}
