import "server-only";
import type { ComponentProps } from "react";
import { prisma } from "@/lib/db";
import { getSignedUrls, getSignedThumbUrls } from "@/lib/storage";
import { formatCredits } from "@/lib/credits";
import { CREDIT_COSTS } from "@/lib/ai/models";
import type { CreativeEditor, EditorCopy } from "@/app/(app)/library/[creativeId]/editor";
import type { OverlaySpec } from "@/lib/composition/types";
import type { CreativeConcept } from "@/lib/pipeline/schemas";

export type EditorProps = ComponentProps<typeof CreativeEditor>;

/**
 * Load the full prop set the per-creative editor needs (renders + signed URLs +
 * version history). Shared by the library detail page and the studio canvas so
 * both render the exact same editor for a given creative.
 */
export async function loadEditorProps(creativeId: string, workspaceId: string): Promise<EditorProps | null> {
  const creative = await prisma.creative.findFirst({
    where: { id: creativeId, brand: { workspaceId }, deletedAt: null },
    include: {
      renders: { where: { status: "COMPOSED" }, orderBy: { createdAt: "asc" } },
      versions: { orderBy: { index: "desc" } },
      brand: { select: { contactLine: true, name: true } },
    },
  });
  if (!creative) return null;

  const concept = creative.concept as unknown as CreativeConcept & { typographyMode?: "baked" | "overlay" };

  const renderKeys = creative.renders.map((r) => r.composedImageKey).filter((k): k is string => Boolean(k));
  const versionKeys = creative.versions.map((v) => v.composedImageKey);
  const [urls, thumbs] = await Promise.all([
    getSignedUrls(renderKeys, 7200),
    getSignedThumbUrls(versionKeys, 200, 7200),
  ]);

  return {
    creativeId: creative.id,
    brandName: creative.brand.name,
    approved: Boolean(creative.approved),
    baked: concept.typographyMode === "baked",
    copy: (concept.copy ?? null) as EditorCopy | null,
    bigIdea: concept.bigIdea ?? "",
    insightRationale: concept.insightRationale ?? "",
    hasContactLine: Boolean(creative.brand.contactLine?.trim()),
    costs: {
      regen: formatCredits(CREDIT_COSTS.regenInstruction),
      enhance: formatCredits(CREDIT_COSTS.enhancePrompt),
    },
    renders: creative.renders.map((r) => ({
      aspectRatio: r.aspectRatio,
      url: r.composedImageKey ? (urls[r.composedImageKey] ?? null) : null,
      spec: r.overlaySpec as unknown as OverlaySpec,
    })),
    versions: creative.versions.map((v) => ({
      index: v.index,
      cause: v.cause as { type: string; note?: string; language?: string },
      thumbUrl: thumbs[v.composedImageKey] ?? null,
      createdAt: v.createdAt.toISOString(),
    })),
  };
}
