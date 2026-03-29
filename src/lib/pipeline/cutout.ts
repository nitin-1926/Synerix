import sharp from "sharp";

/**
 * Cut-out composite fallback (decision 6): when the critic can't clear the
 * fidelity veto, paste the REAL product photo (background removed via FAL
 * BiRefNet) onto the best generated scene. Guarantees label fidelity at the
 * cost of in-scene realism.
 */

export async function removeBackground(image: Buffer, mime: string): Promise<Buffer> {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY missing");
  const timeoutMs = Number(process.env.CUTOUT_TIMEOUT_MS ?? 60_000);
  const r = await fetchWithTimeout("https://fal.run/fal-ai/birefnet/v2", {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: `data:${mime};base64,${image.toString("base64")}`,
      operating_resolution: "1024x1024",
      output_format: "png",
    }),
  }, timeoutMs, "birefnet");
  if (!r.ok) throw new Error(`birefnet ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const body = (await r.json()) as { image?: { url?: string } };
  if (!body.image?.url) throw new Error("birefnet: missing output image");
  const img = await fetchWithTimeout(body.image.url, {}, timeoutMs, "birefnet-download");
  return Buffer.from(await img.arrayBuffer());
}

/** fetch with an AbortController deadline so a stuck call fails fast. */
async function fetchWithTimeout(url: string, init: RequestInit, ms: number, label: string): Promise<Response> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ac.signal });
  } catch (e) {
    if (ac.signal.aborted) throw new Error(`${label} timeout after ${ms}ms`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Vertical anchor (0..1, centre of the product) chosen so the cut-out sits in
 * the archetype's CLEAR zone and never collides with the headline band: text at
 * the bottom → product higher; text at the top → product lower.
 */
function anchorYFor(archetype?: string): number {
  switch (archetype) {
    case "big_type_top": return 0.60; // headline at top → product lower
    case "framed_card": return 0.50;
    case "headline_bottom":
    case "badge_offer": return 0.42; // headline at bottom → product upper-centre
    default: return 0.46;
  }
}

/**
 * Composite the real product cut-out onto the scene's reserved hero spot. The
 * product pixels are preserved EXACTLY (no recolour) — only placement, scale and
 * a grounding shadow are added, so packaging fidelity is never compromised.
 */
export async function compositeCutout(
  scene: Buffer,
  cutout: Buffer,
  opts: { archetype?: string } = {},
): Promise<Buffer> {
  const sceneMeta = await sharp(scene).metadata();
  const W = sceneMeta.width ?? 1080;
  const H = sceneMeta.height ?? 1350;

  const productW = Math.round(W * 0.5);
  const resized = await sharp(cutout)
    .resize(productW, Math.round(H * 0.42), { fit: "inside" })
    .png()
    .toBuffer();
  const meta = await sharp(resized).metadata();
  const pw = meta.width ?? productW;
  const ph = meta.height ?? productW;
  const left = Math.round((W - pw) / 2);
  const anchorY = anchorYFor(opts.archetype);
  const top = Math.max(Math.round(H * 0.04), Math.round(H * anchorY - ph / 2));

  // Soft elliptical contact shadow to ground the product (prevents a floating /
  // pasted look) without touching the product pixels.
  const shadowCy = Math.min(H - 8, top + ph - 4);
  const shadow = Buffer.from(
    `<svg width="${W}" height="${H}"><ellipse cx="${left + pw / 2}" cy="${shadowCy}" rx="${Math.round(pw * 0.46)}" ry="${Math.round(ph * 0.07)}" fill="rgba(0,0,0,0.38)"/></svg>`,
  );

  return sharp(scene)
    .composite([
      { input: await sharp(shadow).blur(16).png().toBuffer(), left: 0, top: 0 },
      { input: resized, left, top },
    ])
    .png()
    .toBuffer();
}
