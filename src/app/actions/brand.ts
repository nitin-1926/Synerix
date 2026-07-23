"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureBrand } from "@/lib/ensure-brand";
import { storageKeys, uploadBuffer } from "@/lib/storage";
import { PROFILE_CHANNELS } from "@/lib/workspace-profile";
import { isWorkspaceTypeId } from "@/lib/workspace-type";
import type { brandIngest } from "@/trigger/brand-ingest";

const urlSchema = z.string().trim().transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`)).pipe(z.string().url());

/** Persist the onboarding profile onto the workspace. The account type is the
 * canonical classification (drives photography + concept style); the legacy
 * industry/primaryUseCase columns are no longer written. */
async function saveWorkspaceProfile(workspaceId: string, formData: FormData): Promise<void> {
  const rawType = formData.get("accountType");
  const type = isWorkspaceTypeId(rawType) ? rawType : null;
  const rawChannel = formData.get("salesChannel");
  const salesChannel =
    typeof rawChannel === "string" && PROFILE_CHANNELS.some((c) => c.id === rawChannel) ? rawChannel : null;
  if (type || salesChannel) {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { ...(type ? { type } : {}), ...(salesChannel ? { salesChannel } : {}) },
    });
  }
}

export async function createBrandFromUrl(formData: FormData) {
  const auth = await requireAuth();
  const parsed = urlSchema.safeParse(formData.get("websiteUrl"));
  if (!parsed.success) return { error: "Please enter a valid website URL" };
  await saveWorkspaceProfile(auth.workspaceId, formData);

  const existing = await prisma.brand.findFirst({ where: { workspaceId: auth.workspaceId } });
  const brand =
    existing ??
    (await prisma.brand.create({
      data: {
        workspaceId: auth.workspaceId,
        name: new URL(parsed.data).hostname.replace(/^www\./, ""),
        websiteUrl: parsed.data,
        ingestStatus: "PENDING",
      },
    }));
  if (existing) {
    await prisma.brand.update({
      where: { id: brand.id },
      data: { websiteUrl: parsed.data, ingestStatus: "PENDING", ingestError: null },
    });
  }

  let handle;
  try {
    handle = await tasks.trigger<typeof brandIngest>("brand-ingest", {
      brandId: brand.id,
      websiteUrl: parsed.data,
    });
  } catch (e) {
    // Enqueue failed → don't strand the brand in PENDING with the wizard
    // polling forever; mark FAILED so the UI offers a retry.
    console.error("[brand] failed to enqueue brand-ingest", e);
    await prisma.brand.update({
      where: { id: brand.id },
      data: { ingestStatus: "FAILED", ingestError: "Ingest could not be queued — please try again" },
    });
    return { error: "Brand analysis service is unavailable right now — please try again shortly." };
  }
  await prisma.brand.update({ where: { id: brand.id }, data: { ingestRunId: handle.id } });
  revalidatePath("/onboarding");
  return { ok: true, brandId: brand.id };
}

const manualSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: z.string().trim().min(1).max(80),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  primaryColorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal("")),
  motto: z.string().trim().max(120).optional().or(z.literal("")),
  oneLiner: z.string().trim().max(160).optional().or(z.literal("")),
});

export async function createBrandManual(formData: FormData) {
  const auth = await requireAuth();
  const parsed = manualSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;
  await saveWorkspaceProfile(auth.workspaceId, formData);

  const dna = {
    identity: { name: d.name, one_line: d.oneLiner || `${d.category} business`, category: d.category, city: d.city || null, founded_hint: null },
    positioning: { promise: null, differentiators: [], price_band: "unknown" },
    audience: { target_customer: null, occasions: [] },
    visual_identity: {
      primary_color: d.primaryColorHex || null,
      secondary_colors: [], accent_colors: [],
      typography_style: "unknown", photography_style: "none", logo_treatment: "unknown",
    },
    voice: { register: "warm_familiar", signature_phrases: [], languages_seen: ["en"] },
    offering: { primary_products: [], services: [], delivery_or_booking: null },
    motto: d.motto || null,
  };

  const existing = await prisma.brand.findFirst({ where: { workspaceId: auth.workspaceId } });
  const data = {
    name: d.name,
    mottoText: d.motto || null,
    oneLiner: d.oneLiner || null,
    primaryColorHex: d.primaryColorHex || null,
    dna: dna as object,
    ingestStatus: "READY" as const,
    ingestError: null,
  };
  if (existing) await prisma.brand.update({ where: { id: existing.id }, data });
  else await prisma.brand.create({ data: { ...data, workspaceId: auth.workspaceId } });

  redirect("/products?onboarding=1");
}

const kitSchema = z.object({
  name: z.string().trim().min(1).max(80),
  motto: z.string().trim().max(120).optional().or(z.literal("")),
  oneLiner: z.string().trim().max(160).optional().or(z.literal("")),
  primaryColorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal("")),
  accentColorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal("")),
  // Brand Block
  contactLine: z.string().trim().max(80).optional().or(z.literal("")),
  logoCorner: z.enum(["TL", "TR", "TC", "BL", "BR"]).optional(),
  logoScale: z.coerce.number().min(0.5).max(2).optional(),
});

export async function updateBrandKit(formData: FormData) {
  const auth = await requireAuth();
  const brand = await prisma.brand.findFirst({ where: { workspaceId: auth.workspaceId } });
  if (!brand) return { error: "No brand yet" };
  const parsed = kitSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;
  await prisma.brand.update({
    where: { id: brand.id },
    data: {
      name: d.name,
      mottoText: d.motto || null,
      oneLiner: d.oneLiner || null,
      primaryColorHex: d.primaryColorHex || null,
      accentColorsHex: d.accentColorHex ? [d.accentColorHex] : brand.accentColorsHex,
      contactLine: d.contactLine || null,
      logoCorner: d.logoCorner ?? brand.logoCorner,
      logoScale: d.logoScale ?? brand.logoScale,
    },
  });
  revalidatePath("/brand");
  return { ok: true };
}

/** Default output mode for this brand's apparel on-model creatives. */
export async function setApparelBrandingDefault(mode: "BRANDED" | "PLAIN") {
  const auth = await requireAuth();
  const brand = await prisma.brand.findFirst({ where: { workspaceId: auth.workspaceId } });
  if (!brand) return { error: "No brand yet" };
  await prisma.brand.update({ where: { id: brand.id }, data: { apparelBrandingDefault: mode } });
  revalidatePath("/brand");
  return { ok: true };
}

const LOGO_MIME: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg" };

/** Upload a logo file and set it as the brand's primary logo. Lets brands that
 * skipped the website pull add a logo by hand. */
export async function uploadBrandLogo(formData: FormData) {
  const auth = await requireAuth();
  const brand = await ensureBrand(auth.workspaceId, auth.workspaceName);
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a logo image" };
  const ext = LOGO_MIME[file.type];
  if (!ext) return { error: "Use a PNG, JPG, WEBP or SVG image" };
  if (file.size > 5 * 1024 * 1024) return { error: "Logo must be under 5 MB" };

  const assetId = crypto.randomUUID();
  const key = storageKeys.brandAsset(brand.id, assetId, ext);
  await uploadBuffer(key, Buffer.from(await file.arrayBuffer()), file.type);
  await prisma.$transaction([
    prisma.brandAsset.updateMany({ where: { brandId: brand.id }, data: { isPrimaryLogo: false } }),
    prisma.brandAsset.create({
      data: { id: assetId, brandId: brand.id, kind: "LOGO", storageKey: key, mimeType: file.type, isPrimaryLogo: true },
    }),
    prisma.brand.update({ where: { id: brand.id }, data: { logoAssetId: assetId } }),
  ]);
  revalidatePath("/brand");
  return { ok: true };
}

export async function setPrimaryLogo(assetId: string) {
  const auth = await requireAuth();
  const asset = await prisma.brandAsset.findFirst({
    where: { id: assetId, brand: { workspaceId: auth.workspaceId } },
  });
  if (!asset) return { error: "Asset not found" };
  await prisma.$transaction([
    prisma.brandAsset.updateMany({ where: { brandId: asset.brandId }, data: { isPrimaryLogo: false } }),
    prisma.brandAsset.update({ where: { id: asset.id }, data: { isPrimaryLogo: true } }),
    prisma.brand.update({ where: { id: asset.brandId }, data: { logoAssetId: asset.id } }),
  ]);
  revalidatePath("/brand");
  return { ok: true };
}

/**
 * Re-run the Brand Creative Intelligence research (web-grounded category
 * evidence consumed by every generation run's brief stage). One-time cost
 * ~$0.10–0.15; the result is cached on the brand until refreshed again.
 */
export async function refreshBrandIntel(brandId: string) {
  const auth = await requireAuth();
  const brand = await prisma.brand.findFirst({
    where: { id: brandId, workspaceId: auth.workspaceId },
    include: { products: { select: { name: true }, take: 6 } },
  });
  if (!brand) return { error: "Brand not found" };

  const { researchBrandIntel } = await import("@/lib/pipeline/brand-intel");
  const dna = brand.dna as {
    identity?: { category?: string; city?: string };
    audience?: { target_customer?: string };
    positioning?: { price_band?: string };
  } | null;

  try {
    const intel = await researchBrandIntel({
      brandName: brand.name,
      category: dna?.identity?.category,
      city: dna?.identity?.city,
      oneLiner: brand.oneLiner,
      productNames: brand.products.map((p) => p.name),
      audience: dna?.audience?.target_customer,
      priceBand: dna?.positioning?.price_band,
    });
    await prisma.brand.update({
      where: { id: brand.id },
      data: {
        creativeIntel: intel as unknown as import("@/generated/prisma/client").Prisma.InputJsonValue,
        creativeIntelAt: new Date(),
      },
    });
    revalidatePath("/brand");
    return { ok: true, searchUsed: intel.searchUsed };
  } catch (e) {
    return { error: `Research failed: ${(e as Error).message?.slice(0, 200)}` };
  }
}
