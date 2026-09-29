import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSignedUrls } from "@/lib/storage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dissectionBadge } from "../dissection-status";
import { AddPhotos } from "./add-photos";
import { ProductActions } from "./product-actions";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const auth = await requireAuth();
  const product = await prisma.product.findFirst({
    where: { id: productId, brand: { workspaceId: auth.workspaceId } },
    include: { images: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] } },
  });
  if (!product) notFound();

  const urls = await getSignedUrls(product.images.map((i) => i.storageKey));
  const dissection = product.dissectionFull as { analysis?: string } | null;
  const status = dissectionBadge(product.dissectionStatus);

  return (
    <div>
      <Link
        href="/products"
        className="-ml-1 inline-flex min-h-10 items-center gap-1 rounded-lg px-1 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" /> Products
      </Link>
      <div className="mt-2 flex flex-col-reverse items-start gap-2 sm:flex-row sm:justify-between sm:gap-4">
        <div className="min-w-0">
          {/* Names are often camera filenames; let them wrap instead of overflowing. */}
          <h1 className="text-2xl font-semibold tracking-tight break-words md:text-3xl">{product.name}</h1>
          {product.sku && <p className="mt-1 text-sm text-muted-foreground">SKU: {product.sku}</p>}
        </div>
        <Badge variant={status.variant} className={status.className}>
          {status.label}
        </Badge>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {product.images.map((img) => (
          <div
            key={img.id}
            className="relative aspect-square overflow-hidden rounded-2xl bg-secondary ring-1 ring-foreground/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urls[img.storageKey]} alt="" className="size-full object-cover" />
            {img.isPrimary && (
              <Badge className="absolute left-2 top-2">Primary</Badge>
            )}
          </div>
        ))}
        <AddPhotos productId={product.id} imageCount={product.images.length} />
      </div>

      {product.dissectionPrompt && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">What Studio sees</CardTitle>
            <CardDescription>Used to keep your product exact in every creative.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground">{product.dissectionPrompt}</p>
            {dissection?.analysis && (
              <details className="mt-3">
                <summary className="-mx-1 inline-flex min-h-10 cursor-pointer items-center rounded-lg px-1 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
                  Full analysis
                </summary>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {dissection.analysis}
                </p>
              </details>
            )}
          </CardContent>
        </Card>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button nativeButton={false} render={<Link href={`/studio?product=${product.id}`} />}>
          Create with this product
        </Button>
        <ProductActions productId={product.id} />
      </div>
    </div>
  );
}
