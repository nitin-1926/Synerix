import Anthropic from "@anthropic-ai/sdk";
import { generateObject } from "ai";
import { z } from "zod";
import { MODELS, resolveLanguageModel } from "@/lib/ai/models";
import type { CostTracker } from "./cost";

/**
 * Brand Creative Intelligence (brand_os port, adapted for Indian SMBs).
 * A one-time-per-brand research step: web-grounded category evidence —
 * how this category is advertised in India, what customers say, which angles
 * win — cached on Brand.creativeIntel and consumed by the brief stage of
 * every generation run. Quality lever: evidence-grounded briefs beat generic
 * marketing fluff (see labs_brand_research concept_creative_brief).
 */

// Permissive schema (LLM structured output rejects tight min/max — see FINDINGS).
export const brandIntelSchema = z.object({
  categorySnapshot: z
    .string()
    .describe("2-3 sentences: how this category is marketed/advertised in India right now"),
  competitorPatterns: z
    .array(
      z.object({
        name: z.string().describe("Named competitor or brand archetype, e.g. 'Aashirvaad'"),
        pattern: z.string().describe("The creative pattern they win with, specific not generic"),
      }),
    )
    .describe("3-5 named competitor patterns worth adopting or countering"),
  customerLanguage: z.object({
    desires: z.array(z.string()).describe("3-5 verbatim-style phrases customers use for what they WANT"),
    complaints: z.array(z.string()).describe("2-4 verbatim-style complaint phrases / friction points"),
    unmetNeeds: z.array(z.string()).describe("2-3 questions or needs no competitor answers"),
  }),
  provenAngles: z
    .array(
      z.object({
        angle: z.string().describe("Short label, e.g. 'Purity proof' / 'Family ritual'"),
        why: z.string().describe("Why this angle works in this category, citing the evidence"),
      }),
    )
    .describe("3-5 creative angles proven to work in this category"),
  visualTrends: z
    .array(z.string())
    .describe("3-5 current visual/styling trends in this category's Indian ads"),
  avoid: z.array(z.string()).describe("2-4 clichés or mistakes common in this category's ads"),
});

export type BrandIntel = z.infer<typeof brandIntelSchema> & {
  researchedAt?: string;
  searchUsed?: boolean;
};

interface ResearchInput {
  brandName: string;
  category?: string | null;
  city?: string | null;
  oneLiner?: string | null;
  productNames?: string[];
  audience?: string | null;
  priceBand?: string | null;
}

function researchBrief(b: ResearchInput): string {
  return [
    `Brand: ${b.brandName}`,
    b.oneLiner ? `About: ${b.oneLiner}` : "",
    b.category ? `Category: ${b.category}` : "",
    b.city ? `Location: ${b.city}, India` : "Market: India",
    b.productNames?.length ? `Products: ${b.productNames.slice(0, 6).join(", ")}` : "",
    b.audience ? `Audience: ${b.audience}` : "",
    b.priceBand ? `Price band: ${b.priceBand}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Web search runs on a brand's FIRST generation and sits on the critical path
 * (the BRIEFING stage). Bound it hard so a slow/stalled search can never make a
 * run look hung — on timeout we fall back to instant world-knowledge notes.
 */
const WEB_SEARCH_TIMEOUT_MS = Number(process.env.BRAND_INTEL_SEARCH_TIMEOUT_MS ?? 90_000);
const FALLBACK_NOTES_TIMEOUT_MS = 30_000;

/**
 * Step 1 — web-grounded research notes via the Anthropic web_search server
 * tool (official SDK; the AI SDK route stays for structured calls). Falls
 * back to world-knowledge notes if search is unavailable or too slow.
 */
async function gatherResearchNotes(
  input: ResearchInput,
  tracker?: CostTracker,
): Promise<{ notes: string; searchUsed: boolean }> {
  const client = new Anthropic();
  const brief = researchBrief(input);
  const prompt = `You are researching the Indian advertising landscape for a small business so a creative team can make evidence-grounded ad briefs.

${brief}

Research and write CONCISE evidence notes (markdown, <600 words) covering:
1. How leading brands in this category advertise in India right now (NAMED brands, their creative patterns/angles — festive campaigns, social ads).
2. What customers in this category say: desire phrases, complaint phrases, unmet needs (reviews, social chatter).
3. Current visual/styling trends in this category's Indian social ads.
4. Clichés to avoid.
Be specific: name brands, quote customer-style language. If the brand is too small/local to find directly, research the CATEGORY in its region instead.`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEB_SEARCH_TIMEOUT_MS);
  try {
    const stream = client.messages.stream(
      {
        model: MODELS.research,
        max_tokens: 4000,
        // Auto-cache the growing prefix: the server-side search loop re-bills
        // accumulated search results on every internal iteration otherwise
        // (measured: ~470k uncached input tokens at max_uses 6).
        cache_control: { type: "ephemeral" },
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }],
        messages: [{ role: "user", content: prompt }],
      },
      { signal: controller.signal },
    );
    const final = await stream.finalMessage();
    tracker?.addLLM(
      MODELS.research,
      { inputTokens: final.usage.input_tokens, outputTokens: final.usage.output_tokens },
      "brand-intel-research",
    );
    const text = final.content
      .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const searchUsed = final.content.some((b) => b.type === "server_tool_use");
    if (text.trim()) return { notes: text, searchUsed };
    throw new Error("empty research notes");
  } catch (e) {
    const reason = controller.signal.aborted
      ? `timed out after ${WEB_SEARCH_TIMEOUT_MS}ms`
      : (e as Error).message?.slice(0, 200);
    console.warn(`[brand-intel] web search research failed, falling back to world knowledge: ${reason}`);
  } finally {
    clearTimeout(timer);
  }

  // Fallback: world-knowledge notes (no web grounding, single fast call).
  const client2 = new Anthropic();
  const res = await client2.messages.create(
    {
      model: MODELS.research,
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\n(Web search is unavailable — write the notes from your knowledge of the Indian market. Mark uncertain claims as such.)`,
        },
      ],
    },
    { signal: AbortSignal.timeout(FALLBACK_NOTES_TIMEOUT_MS) },
  );
  tracker?.addLLM(
    MODELS.research,
    { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens },
    "brand-intel-research",
  );
  const text = res.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return { notes: text, searchUsed: false };
}

/**
 * Step 2 — synthesize the notes into the typed evidence pack the brief stage
 * consumes. Separate call because structured outputs can't combine with
 * web-search citations.
 */
export async function researchBrandIntel(
  input: ResearchInput,
  tracker?: CostTracker,
): Promise<BrandIntel> {
  const { notes, searchUsed } = await gatherResearchNotes(input, tracker);

  const { object, usage } = await generateObject({
    model: resolveLanguageModel(MODELS.concepts),
    schema: brandIntelSchema,
    system:
      "You distill advertising research notes into a compact, specific evidence pack for creative briefs. Keep NAMED brands and verbatim-style customer phrases. No generic marketing fluff. NEVER include prices, discounts, offers or promotional claims in the pack — patterns and angles only (a downstream rule forbids invented offers in ads).",
    prompt: `${researchBrief(input)}\n\nRESEARCH NOTES:\n${notes}`,
  });
  tracker?.addLLM(MODELS.concepts, usage, "brand-intel-synthesis");

  return { ...object, researchedAt: new Date().toISOString(), searchUsed };
}

/** Render the evidence pack as the EVIDENCE block injected into the brief stage. */
export function intelToEvidenceBlock(intel: BrandIntel | null | undefined): string {
  if (!intel) return "";
  const lines: string[] = [];
  lines.push(`Category snapshot: ${intel.categorySnapshot}`);
  if (intel.competitorPatterns?.length) {
    lines.push("Competitor patterns (adopt or counter):");
    for (const c of intel.competitorPatterns.slice(0, 5)) lines.push(`- ${c.name}: ${c.pattern}`);
  }
  const cl = intel.customerLanguage;
  if (cl) {
    if (cl.desires?.length) lines.push(`Customer desires: ${cl.desires.slice(0, 5).map((d) => `"${d}"`).join("; ")}`);
    if (cl.complaints?.length) lines.push(`Customer complaints: ${cl.complaints.slice(0, 4).map((d) => `"${d}"`).join("; ")}`);
    if (cl.unmetNeeds?.length) lines.push(`Unmet needs: ${cl.unmetNeeds.slice(0, 3).join("; ")}`);
  }
  if (intel.provenAngles?.length) {
    lines.push("Proven creative angles:");
    for (const a of intel.provenAngles.slice(0, 5)) lines.push(`- ${a.angle}: ${a.why}`);
  }
  if (intel.visualTrends?.length) lines.push(`Visual trends: ${intel.visualTrends.slice(0, 5).join("; ")}`);
  if (intel.avoid?.length) lines.push(`Avoid: ${intel.avoid.slice(0, 4).join("; ")}`);
  return lines.join("\n");
}
