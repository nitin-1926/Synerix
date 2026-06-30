/**
 * Template authoring gallery — renders every entry in the design-template
 * library onto a sample plate and tiles them into a single contact sheet, so
 * you can eyeball the whole catalogue when adding or tuning templates.
 *
 * Run:  npx tsx scripts/template-gallery.ts [outfile.png] [language]
 *       (language: en | hi | pa — defaults to en)
 */
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { TEMPLATES } from "../src/lib/composition/templates";
import { buildOverlaySpec } from "../src/lib/composition/archetypes";
import { renderOverlay } from "../src/lib/composition/render";
import type { CopyLanguage } from "../src/lib/composition/types";

const OUT = process.argv[2] ?? "template-gallery.png";
const LANG = (process.argv[3] as CopyLanguage) ?? "en";

const COPY = {
  eyebrow: { en: "Father’s Day Special", hinglish: "Father’s Day Special", hi: "खास पेशकश", pa: "ਖਾਸ ਪੇਸ਼ਕਸ਼" },
  headline: { en: "Dad Deserves a Golden Morning", hinglish: "Dad Deserves a Golden Morning", hi: "पापा को दें सुनहरी सुबह", pa: "ਪਾਪਾ ਨੂੰ ਦਿਓ ਸੁਨਹਿਰੀ ਸਵੇਰ" },
  subhead: { en: "Soft, puffed pooris. Less oil, more love.", hinglish: "Soft, puffed pooris.", hi: "कम तेल, ज़्यादा प्यार।", pa: "ਘੱਟ ਤੇਲ, ਵੱਧ ਪਿਆਰ।" },
  cta: { en: "Order on WhatsApp", hinglish: "Order on WhatsApp", hi: "अभी ऑर्डर करें", pa: "ਹੁਣੇ ਆਰਡਰ ਕਰੋ" },
};
const BRAND = { primaryColorHex: "#1d59a2", accentColorHex: "#e8a020" };

async function samplePlate(): Promise<Buffer> {
  return sharp({ create: { width: 1080, height: 1350, channels: 3, background: { r: 40, g: 52, b: 72 } } })
    .composite([
      { input: Buffer.from(`<svg width="1080" height="1350"><circle cx="700" cy="430" r="300" fill="#c89a4e"/><circle cx="300" cy="980" r="170" fill="#7a5a2e" opacity="0.5"/></svg>`), blend: "over" },
    ])
    .png()
    .toBuffer();
}

async function main() {
  const plate = await samplePlate();
  const cols = 4;
  const cellW = 360;
  const cellH = 450;
  const labelH = 34;

  const tiles = await Promise.all(
    TEMPLATES.map(async (t) => {
      const spec = buildOverlaySpec({
        archetype: t.archetype,
        aspectRatio: "4:5",
        language: LANG,
        copy: COPY,
        motto: "Sehat Swad",
        brand: BRAND,
        typePairingId: t.typePairingId,
        deviceStyle: t.deviceStyle,
        plateTreatment: t.plateTreatment,
        dominantColors: ["#c89a4e", "#1d59a2"],
        placement: { safeBand: "bottom", busyness: 0.35 },
      });
      const img = await renderOverlay(spec, { plate });
      const thumb = await sharp(img).resize(cellW, cellH - labelH, { fit: "fill" }).toBuffer();
      const label = Buffer.from(
        `<svg width="${cellW}" height="${labelH}"><rect width="${cellW}" height="${labelH}" fill="#111"/><text x="8" y="22" fill="#fff" font-family="sans-serif" font-size="16">${t.id}  ·  ${t.typePairingId}</text></svg>`,
      );
      return sharp({ create: { width: cellW, height: cellH, channels: 3, background: "#000" } })
        .composite([
          { input: thumb, top: labelH, left: 0 },
          { input: await sharp(label).png().toBuffer(), top: 0, left: 0 },
        ])
        .png()
        .toBuffer();
    }),
  );

  const rows = Math.ceil(tiles.length / cols);
  const sheet = sharp({ create: { width: cols * cellW, height: rows * cellH, channels: 3, background: "#000" } });
  const composites = tiles.map((input, i) => ({
    input,
    left: (i % cols) * cellW,
    top: Math.floor(i / cols) * cellH,
  }));
  const out = await sheet.composite(composites).png().toBuffer();
  writeFileSync(OUT, out);
  console.log(`Rendered ${TEMPLATES.length} templates (${LANG}) → ${OUT}`);
}

main();
