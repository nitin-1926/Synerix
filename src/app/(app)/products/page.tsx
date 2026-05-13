import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureBrand } from "@/lib/ensure-brand";
import { getSignedThumbUrls } from "@/lib/storage";
import { getWorkspaceProfile } from "@/lib/workspace-profile-server";
import { showsModelSurface } from "@/lib/workspace-profile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AutoRefresh } from "@/components/auto-refresh";
import { BrandKitTabs } from "@/components/brand-kit-tabs";
import { ProductForm } from "./product-form";
import { BulkUpload } from "./bulk-upload";

export const metadata = { title: "Products — Synerix Studio" };

const DISSECTION_LABEL: Record<string, { label: string; tone: "ok" | "busy" | "bad" }> = {
  READY: { label: "Ready for creatives", tone: "ok" },
  RUNNING: { label: "Analyzing photo…", tone: "busy" },
  PENDING: { label: "Queued for analysis", tone: "busy" },
  FAILED: { label: "Analysis failed", tone: "bad" },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const { onboarding } = await searchParams;
  const auth = await requireAuth();
  // No hard onboarding gate — a workspace without a brand gets a blank one so
  // products can be added straight away; brand details are filled in later.
  const brand = await ensureBrand(auth.workspaceId, auth.workspaceName);

  const [products, profile] = await Promise.all([
    prisma.product.findMany({
      where: { brandId: brand.id },
      include: { images: { orderBy: [{ isPrimary: "desc" }], take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    getWorkspaceProfile(auth.workspaceId),
  ]);
  const urls = await getSignedThumbUrls(products.flatMap((p) => p.images.map((i) => i.storageKey)), 600);
  const analyzing = products.some(
    (p) => p.dissectionStatus === "PENDING" || p.dissectionStatus === "RUNNING",
  );

  return (
    <div>
      <AutoRefresh active={analyzing} />
      {onboarding && (
        <div className="mb-6 rounded-xl bg-primary/10 px-4 py-3 text-sm text-foreground ring-1 ring-primary/20">
          <span className="font-semibold text-primary">Step 2 of 2:</span> add your first product — a
          couple of clear phone photos work great. Then you&apos;re ready to create.
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Brand Kit
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">Products</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The items your creatives will feature. Photos are analyzed once so every ad shows your
            exact product.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <BrandKitTabs showModels={showsModelSurface(profile)} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ProductForm />
        <BulkUpload />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => {
          const img = p.images[0];
          const status = DISSECTION_LABEL[p.dissectionStatus] ?? DISSECTION_LABEL.PENDING;
          return (
            <Link key={p.id} href={`/products/${p.id}`} className="group block">
              <Card className="h-full gap-0 py-0 transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                <div className="aspect-square bg-secondary">
                  {img && urls[img.storageKey] && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={urls[img.storageKey]}
                      alt={p.name}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <CardContent className="space-y-2 py-4">
                  <p className="truncate font-medium text-foreground">{p.name}</p>
                  <Badge
                    variant={status.tone === "ok" ? "secondary" : status.tone === "bad" ? "destructive" : "outline"}
                    className={status.tone === "busy" ? "animate-pulse" : ""}
                  >
                    {status.label}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {products.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            No products yet — add your first one above.
          </p>
        )}
      </div>
    </div>
  );
}
