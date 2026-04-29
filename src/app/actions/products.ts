"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureBrand } from "@/lib/ensure-brand";
import { storageKeys, uploadBuffer } from "@/lib/storage";
import type { productDissect } from "@/trigger/product-dissect";

const MAX_IMAGES = 5;
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

const productSchema = z.object({
  name: z.string().trim().min(1).max(80),
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  // Drives pipeline routing: APPAREL → on-model, FMCG → in-scene/composite.
  category: z.enum(["FMCG", "APPAREL", "OTHER"]).default("OTHER"),
});

export async function createProduct(formData: FormData) {
  const auth = await requireAuth();
  const brand = await ensureBrand(auth.workspaceId, auth.workspaceName);

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Add at least one product photo" };
  if (files.length > MAX_IMAGES) return { error: `Maximum ${MAX_IMAGES} photos` };
  for (const f of files) {
    if (!ALLOWED_MIME.has(f.type)) return { error: `Unsupported format: ${f.type}` };
    if (f.size > MAX_BYTES) return { error: `${f.name} is over 8 MB` };
  }

  const product = await prisma.product.create({
    data: {
      brandId: brand.id,
      name: parsed.data.name,
      sku: parsed.data.sku || null,
      description: parsed.data.description || null,
      category: parsed.data.category,
    },
  });

  let first = true;
  for (const f of files) {
    const imageId = crypto.randomUUID();
    const ext = f.type.split("/")[1] === "jpeg" ? "jpg" : f.type.split("/")[1];
    const key = storageKeys.productImage(product.id, imageId, ext);
    await uploadBuffer(key, Buffer.from(await f.arrayBuffer()), f.type);
    await prisma.productImage.create({
      data: { id: imageId, productId: product.id, storageKey: key, mimeType: f.type, isPrimary: first },
    });
    first = false;
  }

  await tasks.trigger<typeof productDissect>("product-dissect", { productId: product.id });
  revalidatePath("/products");
  return { ok: true, productId: product.id };
}

// Inline variant for the studio create flow: one photo, returns the product as JSON.
export async function createProductInline(formData: FormData) {
  const auth = await requireAuth();
  const brand = await ensureBrand(auth.workspaceId, auth.workspaceName);

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Add a product photo" };
  if (!ALLOWED_MIME.has(file.type)) return { error: `Unsupported format: ${file.type}` };
  if (file.size > MAX_BYTES) return { error: `${file.name} is over 8 MB` };

  const product = await prisma.product.create({
    data: {
      brandId: brand.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      category: parsed.data.category,
    },
  });

  const imageId = crypto.randomUUID();
  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const key = storageKeys.productImage(product.id, imageId, ext);
  await uploadBuffer(key, Buffer.from(await file.arrayBuffer()), file.type);
  await prisma.productImage.create({
    data: { id: imageId, productId: product.id, storageKey: key, mimeType: file.type, isPrimary: true },
  });

  await tasks.trigger<typeof productDissect>("product-dissect", { productId: product.id });
  revalidatePath("/products");
  return {
    product: {
      id: product.id,
      name: product.name,
      category: product.category,
      dissectionStatus: product.dissectionStatus,
    },
  };
}

/** Add photos to an existing product (up to MAX_IMAGES total). Dissection uses
 * only the primary image, so no re-analysis is triggered. */
export async function addProductImages(productId: string, formData: FormData) {
  const auth = await requireAuth();
  const product = await prisma.product.findFirst({
    where: { id: productId, brand: { workspaceId: auth.workspaceId } },
    include: { _count: { select: { images: true } } },
  });
  if (!product) return { error: "Not found" };

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Add at least one product photo" };
  if (product._count.images + files.length > MAX_IMAGES)
    return { error: `Maximum ${MAX_IMAGES} photos per product` };
  for (const f of files) {
    if (!ALLOWED_MIME.has(f.type)) return { error: `Unsupported format: ${f.type}` };
    if (f.size > MAX_BYTES) return { error: `${f.name} is over 8 MB` };
  }

  for (const f of files) {
    const imageId = crypto.randomUUID();
    const ext = f.type.split("/")[1] === "jpeg" ? "jpg" : f.type.split("/")[1];
    const key = storageKeys.productImage(product.id, imageId, ext);
    await uploadBuffer(key, Buffer.from(await f.arrayBuffer()), f.type);
    await prisma.productImage.create({
      data: { id: imageId, productId: product.id, storageKey: key, mimeType: f.type, isPrimary: false },
    });
  }

  revalidatePath(`/products/${product.id}`);
  revalidatePath("/products");
  return { ok: true };
}

export async function deleteProduct(productId: string) {
  const auth = await requireAuth();
  const product = await prisma.product.findFirst({
    where: { id: productId, brand: { workspaceId: auth.workspaceId } },
  });
  if (!product) return { error: "Not found" };
  await prisma.product.delete({ where: { id: product.id } });
  revalidatePath("/products");
  return { ok: true };
}

export async function redissectProduct(productId: string) {
  const auth = await requireAuth();
  const product = await prisma.product.findFirst({
    where: { id: productId, brand: { workspaceId: auth.workspaceId } },
  });
  if (!product) return { error: "Not found" };
  await prisma.product.update({
    where: { id: product.id },
    data: { dissectionStatus: "PENDING", dissectionSourceImageId: null },
  });
  await tasks.trigger<typeof productDissect>("product-dissect", { productId: product.id });
  revalidatePath("/products");
  return { ok: true };
}
