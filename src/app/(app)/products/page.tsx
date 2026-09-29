import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureBrand } from "@/lib/ensure-brand";
import { getSignedThumbUrls } from "@/lib/storage";
import { getWorkspaceProfile } from "@/lib/workspace-profile-server";
import { showsModelSurface } from "@/lib/workspace-profile";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AutoRefresh } from "@/components/auto-refresh";
import { BrandKitTabs } from "@/components/brand-kit-tabs";
import { ProductForm } from "./product-form";
import { BulkUpload } from "./bulk-upload";
import { dissectionBadge } from "./dissection-status";

export const metadata = { title: "Products | Synerix Studio" };

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
      // The grid shows a thumbnail, a name and a status badge. `include` was
      // dragging dissectionFull (a full vision-analysis blob) and productIntel
      // for EVERY product — on a page that re-fetches every 8 seconds while any
      // photo is still analysing.
      select: {
        id: true,
        name: true,
        dissectionStatus: true,
        images: { orderBy: [{ isPrimary: "desc" }], take: 1, select: { storageKey: true } },
      },
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
      <AutoRefresh active={analyzing} intervalMs={15_000} />
      {onboarding && (
        <div className="mb-6 rounded-xl bg-primary/10 px-4 py-3 text-sm text-foreground ring-1 ring-primary/20">
          <span className="font-semibold text-primary">Step 2 of 2:</span> add your first product: a
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

      {products.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border-2 border-dashed border-border px-6 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Package className="size-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold text-foreground">No products yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Add a product with a couple of clear phone photos, or bulk upload several at once.
          </p>
          <div className="mt-6 flex w-full flex-wrap justify-center gap-3 text-left">
            <ProductForm />
            <BulkUpload />
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ProductForm />
            <BulkUpload />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => {
              const img = p.images[0];
              const status = dissectionBadge(p.dissectionStatus);
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="group block rounded-2xl outline-none transition-transform duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none"
                >
                  {/* relative + absolute img: aspect-ratio alone is only a
                      PREFERRED size — a tall photo forces the box to grow and
                      stretches the whole grid row (the whitespace bug). */}
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary ring-1 ring-foreground/10 transition-shadow duration-200 group-hover:shadow-md">
                    {img && urls[img.storageKey] && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={urls[img.storageKey]}
                        alt={p.name}
                        loading="lazy"
                        className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />
                    )}
                  </div>
                  <div className="space-y-1.5 px-0.5 pt-2.5">
                    <p title={p.name} className="truncate text-sm font-medium text-foreground">
                      {p.name}
                    </p>
                    <Badge variant={status.variant} className={status.className}>
                      {status.label}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
