import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSignedUrls } from "@/lib/storage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div>
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Products
      </Link>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{product.name}</h1>
          {product.sku && <p className="mt-1 text-sm text-muted-foreground">SKU: {product.sku}</p>}
        </div>
        <Badge variant={product.dissectionStatus === "READY" ? "secondary" : "outline"}>
          {product.dissectionStatus.toLowerCase()}
        </Badge>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {product.images.map((img) => (
          <div
            key={img.id}
            className="relative aspect-square overflow-hidden rounded-xl bg-secondary ring-1 ring-foreground/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urls[img.storageKey]} alt="" className="size-full object-cover" />
            {img.isPrimary && (
              <Badge className="absolute left-1.5 top-1.5">Primary</Badge>
            )}
          </div>
        ))}
        <AddPhotos productId={product.id} imageCount={product.images.length} />
      </div>

      {product.dissectionPrompt && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What Studio sees (used to keep your product exact in every creative)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">{product.dissectionPrompt}</p>
            {dissection?.analysis && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  Full analysis
                </summary>
                <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
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
