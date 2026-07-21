import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureBrand } from "@/lib/ensure-brand";
import { getBalance } from "@/lib/credits";
import { getSignedThumbUrls } from "@/lib/storage";
import { listAiModels } from "@/app/actions/models";
import { CreateForm } from "./create-form";

export const metadata = { title: "Create — Synerix Studio" };

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ occasion?: string; entry?: string; product?: string }>;
}) {
  const params = await searchParams;
  const auth = await requireAuth();
  const brand = await ensureBrand(auth.workspaceId, auth.workspaceName);

  const [products, aiModels, balance, occasion, entry, upcoming] = await Promise.all([
    prisma.product.findMany({
      where: { brandId: brand.id },
      include: { images: { orderBy: [{ isPrimary: "desc" }], take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    listAiModels(),
    getBalance(auth.workspaceId),
    params.occasion
      ? prisma.festivalOccurrence.findUnique({
          where: { id: params.occasion },
          include: { festival: true },
        })
      : null,
    params.entry
      ? prisma.calendarEntry.findFirst({
          where: { id: params.entry, workspaceId: auth.workspaceId },
        })
      : null,
    // Upcoming festivals for the in-form occasion picker (skipped on deep links).
    params.occasion || params.entry
      ? []
      : prisma.festivalOccurrence.findMany({
          where: { date: { gte: new Date() } },
          orderBy: { date: "asc" },
          take: 10,
          include: { festival: true },
        }),
  ]);

  // Picker tiles are ~150px — thumbnails, not full-res uploads (multi-MB
  // phone photos made the Create page feel slow to paint).
  const urls = await getSignedThumbUrls(products.flatMap((p) => p.images.map((i) => i.storageKey)), 400);

  return (
    <>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Studio</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
        {occasion ? `Create for ${occasion.festival.name}` : entry?.customTitle ? `Create for ${entry.customTitle}` : "Create"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {occasion
          ? `${occasion.festival.nameHindi ?? ""} · ${occasion.date.toLocaleDateString("en-IN", { day: "numeric", month: "long" })}`
          : "Pick a product, tell Studio the occasion or idea, get distinct concepts to choose from."}
      </p>

      <div className="mt-8">
        <CreateForm
          occasionId={occasion?.id ?? null}
          entryId={entry?.id ?? null}
          isOccasion={Boolean(occasion || entry)}
          occasionTitle={occasion?.festival.name ?? entry?.customTitle ?? null}
          upcomingOccasions={upcoming.map((o) => ({
            id: o.id,
            title: o.festival.name,
            dateLabel: o.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
          }))}
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            dissectionReady: p.dissectionStatus === "READY",
            imageUrl: p.images[0] ? (urls[p.images[0].storageKey] ?? null) : null,
          }))}
          aiModels={aiModels
            .filter((m) => m.status === "READY")
            .map((m) => ({ id: m.id, name: m.name, description: m.description, thumbUrl: m.thumbUrl, scope: m.scope, traits: m.traits }))}
          preselectedProductId={params.product ?? null}
          apparelBrandingDefault={brand.apparelBrandingDefault}
          creditBalance={balance}
        />
      </div>
    </>
  );
}
