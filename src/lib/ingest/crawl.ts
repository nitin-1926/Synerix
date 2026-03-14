import Firecrawl from "@mendable/firecrawl-js";
import { LIMITS } from "@/lib/ai/models";

/** Site crawl for brand ingestion — ported from floki lib/pipeline/1-crawl.ts. */

const PATH_SCORES: [RegExp, number][] = [
  [/^\/?$/, 100],
  [/\/(about|company|story|our-story)/i, 90],
  [/\/(menu|products|shop|collections|catalogue|catalog)/i, 95],
  [/\/(services|offerings)/i, 85],
  [/\/(gallery|portfolio|photos)/i, 80],
  [/\/(contact|locations|stores)/i, 60],
  [/\/(testimonials|reviews)/i, 70],
  [/\/(blog|news)\/?$/i, 40],
  [/\/(login|signup|cart|checkout|terms|privacy|careers)/i, -100],
];

function scoreUrl(rawUrl: string): number {
  try {
    const u = new URL(rawUrl);
    const path = u.pathname || "/";
    let score = 10;
    for (const [re, s] of PATH_SCORES) if (re.test(path)) score += s;
    score -= path.split("/").filter(Boolean).length * 2;
    if (u.search) score -= 5;
    return score;
  } catch {
    return -1000;
  }
}

export interface CrawledPage {
  url: string;
  markdown?: string;
  rawHtml?: string;
  screenshotUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface CrawlOutput {
  pages: CrawledPage[];
  imageUrls: string[];
}

export async function crawlBrandSite(inputUrl: string): Promise<CrawlOutput> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY missing");
  const fc = new Firecrawl({ apiKey });

  // 1. Map the site, rank URLs by brand-signal.
  let topUrls: string[] = [inputUrl];
  try {
    const map = await fc.map(inputUrl, { includeSubdomains: false, limit: 300 });
    const links = (map.links ?? []).map((l: { url?: string } | string) =>
      typeof l === "string" ? l : (l.url ?? ""),
    );
    const ranked = [...new Set(links.filter(Boolean))]
      .map((u) => ({ u, s: scoreUrl(u) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, LIMITS.maxCrawlUrls)
      .map((x) => x.u);
    if (ranked.length) topUrls = [...new Set([inputUrl, ...ranked])].slice(0, LIMITS.maxCrawlUrls);
  } catch (e) {
    console.warn("[crawl] map failed, scraping input URL only:", (e as Error).message);
  }

  // 2. Batch scrape with markdown + raw HTML + full-page screenshot.
  const job = await fc.batchScrape(topUrls, {
    options: {
      formats: [
        "markdown",
        "rawHtml",
        { type: "screenshot", fullPage: true, viewport: { width: 1440, height: 900 } },
      ],
      onlyMainContent: false,
      timeout: 60_000,
    },
  });

  const pages: CrawledPage[] = [];
  const imageUrls = new Set<string>();
  for (const d of job.data ?? []) {
    const meta = d.metadata as Record<string, unknown> | undefined;
    const url = (meta?.sourceURL as string) ?? (meta?.url as string) ?? "";
    pages.push({
      url,
      markdown: d.markdown ?? undefined,
      rawHtml: d.rawHtml ?? undefined,
      screenshotUrl: d.screenshot ?? undefined,
      metadata: meta,
    });
    // Harvest <img> sources + og:image (floki 1b).
    if (meta?.ogImage) imageUrls.add(String(meta.ogImage));
    for (const m of (d.rawHtml ?? "").matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
      try {
        imageUrls.add(new URL(m[1], url || inputUrl).toString());
      } catch {
        /* relative URL resolution failed — skip */
      }
    }
  }

  return { pages, imageUrls: [...imageUrls].slice(0, 40) };
}

export async function downloadAsset(
  url: string,
): Promise<{ buf: Buffer; mime: string } | null> {
  try {
    if (url.startsWith("data:")) {
      const m = /^data:([^;]+);base64,(.+)$/.exec(url);
      if (!m) return null;
      return { buf: Buffer.from(m[2], "base64"), mime: m[1] };
    }
    const r = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!r.ok) return null;
    const mime = r.headers.get("content-type")?.split(";")[0] ?? "image/png";
    if (!mime.startsWith("image/")) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 2_000 || buf.length > 8_000_000) return null; // skip trackers/huge files
    return { buf, mime };
  } catch {
    return null;
  }
}
