import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSignedUrls, getSignedThumbUrls } from "@/lib/storage";
import { formatCredits } from "@/lib/credits";
import { CREDIT_COSTS } from "@/lib/ai/models";
import { CreativeEditor, type EditorCopy } from "./editor";
import type { OverlaySpec } from "@/lib/composition/types";
import type { CreativeConcept } from "@/lib/pipeline/schemas";

export default async function CreativeDetailPage({
  params,
}: {
  params: Promise<{ creativeId: string }>;
}) {
  const { creativeId } = await params;
  const auth = await requireAuth();
  const creative = await prisma.creative.findFirst({
    where: { id: creativeId, brand: { workspaceId: auth.workspaceId }, deletedAt: null },
    include: {
      renders: { where: { status: "COMPOSED" }, orderBy: { createdAt: "asc" } },
      versions: { orderBy: { index: "desc" } },
      brand: { select: { contactLine: true, mottoText: true, name: true } },
      generationRun: {
        include: { calendarEntry: { include: { festivalOccurrence: { include: { festival: true } } } } },
      },
    },
  });
  if (!creative) notFound();

  const concept = creative.concept as unknown as CreativeConcept & {
    typographyMode?: "baked" | "overlay";
  };

  const renderKeys = creative.renders
    .map((r) => r.composedImageKey)
    .filter((k): k is string => Boolean(k));
  const versionKeys = creative.versions.map((v) => v.composedImageKey);
  const [urls, thumbs] = await Promise.all([
    getSignedUrls(renderKeys, 7200),
    getSignedThumbUrls(versionKeys, 200, 7200),
  ]);

  const occasion =
    creative.generationRun.calendarEntry?.festivalOccurrence?.festival.name ??
    creative.generationRun.calendarEntry?.customTitle ??
    "Custom";

  return (
    <div>
      <Link
        href="/library"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Library
      </Link>
      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{occasion}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">{concept.name}</h1>
      </div>

      <div className="mt-6">
        <CreativeEditor
          creativeId={creative.id}
          brandName={creative.brand.name}
          approved={Boolean(creative.approved)}
          baked={concept.typographyMode === "baked"}
          copy={(concept.copy ?? null) as EditorCopy | null}
          bigIdea={concept.bigIdea ?? ""}
          insightRationale={concept.insightRationale ?? ""}
          hasContactLine={Boolean(creative.brand.contactLine?.trim())}
          costs={{
            regen: formatCredits(CREDIT_COSTS.regenInstruction),
            enhance: formatCredits(CREDIT_COSTS.enhancePrompt),
          }}
          renders={creative.renders.map((r) => ({
            aspectRatio: r.aspectRatio,
            url: r.composedImageKey ? (urls[r.composedImageKey] ?? null) : null,
            spec: r.overlaySpec as unknown as OverlaySpec,
          }))}
          versions={creative.versions.map((v) => ({
            index: v.index,
            cause: v.cause as { type: string; note?: string; language?: string },
            thumbUrl: thumbs[v.composedImageKey] ?? null,
            createdAt: v.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
