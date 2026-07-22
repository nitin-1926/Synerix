/**
 * Seed the "E2E Tests" workspace used by e2e/generation.spec.ts.
 * Clones brand kit + one dissected apparel product + brand AI models from the
 * source workspace (rows only — storage keys are shared, no bytes copied).
 * Idempotent: keyed on the workspace slug; re-running tops up credits only.
 *
 *   npx tsx --env-file=.env.local scripts/seed-e2e-workspace.ts
 */
import { prisma } from "@/lib/db";

export const E2E_WORKSPACE_SLUG = "e2e-tests";
const SOURCE_WORKSPACE_NAME = "Synerix Apparel";
const DEV_EMAIL = "dev@synerix.local"; // DEV_AUTH_BYPASS user (src/lib/auth.ts)
const CREDIT_TARGET = 10_000;

async function main() {
  const existing = await prisma.workspace.findUnique({
    where: { slug: E2E_WORKSPACE_SLUG },
    include: { credits: true },
  });
  if (existing) {
    const balance = Number(existing.credits?.balance ?? 0);
    if (balance < CREDIT_TARGET) {
      const delta = CREDIT_TARGET - balance;
      await prisma.$transaction([
        prisma.workspaceCredits.update({
          where: { workspaceId: existing.id },
          data: { balance: CREDIT_TARGET },
        }),
        prisma.creditLedger.create({
          data: { workspaceId: existing.id, delta, reason: "MANUAL_GRANT", balanceAfter: CREDIT_TARGET, note: "E2E top-up" },
        }),
      ]);
      console.log(`E2E workspace exists (${existing.id}) — credits topped up to ${CREDIT_TARGET}`);
    } else {
      console.log(`E2E workspace exists (${existing.id}) — nothing to do`);
    }
    return;
  }

  const source = await prisma.workspace.findFirst({
    where: { name: SOURCE_WORKSPACE_NAME },
    include: { memberships: true },
  });
  if (!source) throw new Error(`Source workspace "${SOURCE_WORKSPACE_NAME}" not found`);

  const sourceBrand = await prisma.brand.findFirst({
    where: { workspaceId: source.id },
    include: { assets: true, aiModels: { where: { status: "READY", scope: "BRAND" } } },
  });
  if (!sourceBrand) throw new Error("Source workspace has no brand");

  const sourceProduct = await prisma.product.findFirst({
    where: { brandId: sourceBrand.id, dissectionStatus: "READY", images: { some: {} } },
    include: { images: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] } },
  });
  if (!sourceProduct) throw new Error("Source brand has no dissected product with images");

  const devUser = await prisma.user.upsert({
    where: { email: DEV_EMAIL },
    update: {},
    create: { email: DEV_EMAIL, name: "Dev User" },
  });

  const ws = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: {
        name: "E2E Tests",
        slug: E2E_WORKSPACE_SLUG,
        ownerUserId: source.ownerUserId,
        type: source.type,
      },
    });

    // Members: the dev-bypass user (the e2e runner) + everyone from the source
    // workspace (so the owner can inspect e2e output in the real UI).
    const memberRows = [
      { workspaceId: ws.id, userId: devUser.id, role: "OWNER" as const },
      ...source.memberships
        .filter((m) => m.userId !== devUser.id)
        .map((m) => ({ workspaceId: ws.id, userId: m.userId, role: m.role })),
    ];
    await tx.membership.createMany({ data: memberRows, skipDuplicates: true });

    await tx.workspaceCredits.create({ data: { workspaceId: ws.id, balance: CREDIT_TARGET } });
    await tx.creditLedger.create({
      data: { workspaceId: ws.id, delta: CREDIT_TARGET, reason: "MANUAL_GRANT", balanceAfter: CREDIT_TARGET, note: "E2E seed grant" },
    });

    const brand = await tx.brand.create({
      data: {
        workspaceId: ws.id,
        name: sourceBrand.name,
        websiteUrl: sourceBrand.websiteUrl,
        mottoText: sourceBrand.mottoText,
        dna: sourceBrand.dna ?? undefined,
        dnaConfidence: sourceBrand.dnaConfidence ?? undefined,
        primaryColorHex: sourceBrand.primaryColorHex,
        secondaryColorsHex: sourceBrand.secondaryColorsHex,
        accentColorsHex: sourceBrand.accentColorsHex,
        typographyStyle: sourceBrand.typographyStyle,
        photographyStyle: sourceBrand.photographyStyle,
        voiceRegister: sourceBrand.voiceRegister,
        oneLiner: sourceBrand.oneLiner,
        logoCorner: sourceBrand.logoCorner,
        logoScale: sourceBrand.logoScale,
        contactLine: sourceBrand.contactLine,
        apparelBrandingDefault: sourceBrand.apparelBrandingDefault,
        creativeIntel: sourceBrand.creativeIntel ?? undefined,
        creativeIntelAt: sourceBrand.creativeIntelAt,
        ingestStatus: "READY",
      },
    });

    for (const a of sourceBrand.assets) {
      await tx.brandAsset.create({
        data: {
          brandId: brand.id,
          kind: a.kind,
          storageKey: a.storageKey, // shared bytes
          mimeType: a.mimeType,
          width: a.width,
          height: a.height,
          sourceUrl: a.sourceUrl,
          classification: a.classification ?? undefined,
          isPrimaryLogo: a.isPrimaryLogo,
        },
      });
    }

    const product = await tx.product.create({
      data: {
        brandId: brand.id,
        name: sourceProduct.name,
        sku: sourceProduct.sku,
        description: sourceProduct.description,
        category: sourceProduct.category,
        dissectionPrompt: sourceProduct.dissectionPrompt,
        dissectionFull: sourceProduct.dissectionFull ?? undefined,
        productIntel: sourceProduct.productIntel ?? undefined,
        dissectionStatus: "READY",
      },
    });
    for (const img of sourceProduct.images) {
      await tx.productImage.create({
        data: {
          productId: product.id,
          storageKey: img.storageKey, // shared bytes
          cutoutKey: img.cutoutKey,
          mimeType: img.mimeType,
          width: img.width,
          height: img.height,
          isPrimary: img.isPrimary,
        },
      });
    }
    // Dissection cache is keyed to the source image id, which we didn't clone.
    const primary = await tx.productImage.findFirst({ where: { productId: product.id, isPrimary: true } });
    await tx.product.update({
      where: { id: product.id },
      data: { dissectionSourceImageId: primary?.id ?? null },
    });

    for (const m of sourceBrand.aiModels) {
      await tx.aiModel.create({
        data: {
          scope: "BRAND",
          brandId: brand.id,
          name: m.name,
          description: m.description,
          traits: m.traits ?? undefined,
          storageKey: m.storageKey, // shared bytes
          mimeType: m.mimeType,
          width: m.width,
          height: m.height,
          status: "READY",
        },
      });
    }

    return ws;
  });

  console.log(`Seeded E2E workspace ${ws.id} (slug ${E2E_WORKSPACE_SLUG})`);
  console.log(`  product: ${sourceProduct.name}, brand: ${sourceBrand.name}, aiModels cloned: ${sourceBrand.aiModels.length}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
