import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSignedThumbUrls } from "@/lib/storage";
import { LibraryClient } from "./library-client";

export const metadata = { title: "Creatives — Synerix Studio" };

const CREATIVES_PAGE_SIZE = 60;
const RUNS_PAGE_SIZE = 20;

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; rpage?: string; tab?: string }>;
}) {
  const { page, rpage, tab } = await searchParams;
  const creativesPage = Math.max(1, Number(page) || 1);
  const runsPage = Math.max(1, Number(rpage) || 1);
  const auth = await requireAuth();
  const brand = await prisma.brand.findFirst({ where: { workspaceId: auth.workspaceId } });
  if (!brand) redirect("/onboarding");

  const [creatives, creativeTotal, runs, runTotal] = await Promise.all([
    prisma.creative.findMany({
      where: { brandId: brand.id, status: "READY", deletedAt: null },
      include: {
        renders: { where: { status: "COMPOSED" }, take: 1 },
        generationRun: {
          include: { calendarEntry: { include: { festivalOccurrence: { include: { festival: true } } } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (creativesPage - 1) * CREATIVES_PAGE_SIZE,
      take: CREATIVES_PAGE_SIZE,
    }),
    prisma.creative.count({ where: { brandId: brand.id, status: "READY", deletedAt: null } }),
    prisma.generationRun.findMany({
      where: { workspaceId: auth.workspaceId },
      include: {
        brand: { select: { name: true } },
        product: { select: { name: true } },
        calendarEntry: { include: { festivalOccurrence: { include: { festival: true } } } },
        _count: { select: { creatives: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (runsPage - 1) * RUNS_PAGE_SIZE,
      take: RUNS_PAGE_SIZE,
    }),
    prisma.generationRun.count({ where: { workspaceId: auth.workspaceId } }),
  ]);

  const urls = await getSignedThumbUrls(
    creatives.flatMap((c) => c.renders.map((r) => r.composedImageKey).filter((k): k is string => Boolean(k))),
    600,
  );

  const creativeItems = creatives.map((c) => {
    const render = c.renders[0];
    const concept = c.concept as { name: string };
    return {
      id: c.id,
      name: concept.name,
      occasion:
        c.generationRun.calendarEntry?.festivalOccurrence?.festival.name ??
        c.generationRun.calendarEntry?.customTitle ??
        "Custom",
      url: render?.composedImageKey ? (urls[render.composedImageKey] ?? null) : null,
      approved: c.approved,
    };
  });

  const runItems = runs.map((r) => {
    // Real API spend is internal telemetry — super-admin eyes only.
    const cost = auth.isSuperAdmin
      ? (r.pipeline as { cost?: { totalUSD?: number } } | null)?.cost?.totalUSD
      : undefined;
    return {
      id: r.id,
      title:
        r.calendarEntry?.festivalOccurrence?.festival.name ??
        r.calendarEntry?.customTitle ??
        "Custom creative",
      productName: r.product?.name ?? null,
      brandName: r.brand.name,
      status: r.status,
      when: r.startedAt.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      creditsDebited: Number(r.creditsDebited),
      costUSD: typeof cost === "number" ? cost : null,
      creativeCount: r._count.creatives,
    };
  });

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Creatives</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">Your creatives</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {creativeTotal} ready to download or edit
      </p>

      <LibraryClient
        creatives={creativeItems}
        runs={runItems}
        initialTab={tab === "generations" ? "generations" : "creatives"}
        pagination={{
          creativesPage,
          creativesPageCount: Math.max(1, Math.ceil(creativeTotal / CREATIVES_PAGE_SIZE)),
          runsPage,
          runsPageCount: Math.max(1, Math.ceil(runTotal / RUNS_PAGE_SIZE)),
        }}
      />
    </div>
  );
}
