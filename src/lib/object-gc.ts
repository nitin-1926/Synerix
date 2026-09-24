import { prisma } from "@/lib/db";
import { deleteObjects } from "@/lib/storage";

/**
 * Delete storage objects a just-deleted row owned, EXCEPT any another row still
 * points at. Keys are not always exclusive: scripts/seed-e2e-workspace.ts clones
 * product images, cutouts, brand assets and brand models into the E2E workspace
 * with the SAME keys ("shared bytes"), so a blind delete from one workspace
 * destroys the other's files (R2 has no versioning — that loss is permanent).
 *
 * Call AFTER the owning row is deleted, so its own reference no longer counts.
 * Never throws: a failed cleanup leaves recoverable garbage, which is strictly
 * better than failing a delete the user already saw succeed.
 */
export async function deleteUnreferencedObjects(keys: (string | null)[], label: string): Promise<void> {
  const candidates = [...new Set(keys.filter((k): k is string => !!k))];
  if (!candidates.length) return;
  try {
    const [images, models, assets] = await Promise.all([
      prisma.productImage.findMany({
        where: { OR: [{ storageKey: { in: candidates } }, { cutoutKey: { in: candidates } }] },
        select: { storageKey: true, cutoutKey: true },
      }),
      prisma.aiModel.findMany({ where: { storageKey: { in: candidates } }, select: { storageKey: true } }),
      prisma.brandAsset.findMany({ where: { storageKey: { in: candidates } }, select: { storageKey: true } }),
    ]);
    const stillUsed = new Set(
      [...images.flatMap((i) => [i.storageKey, i.cutoutKey]), ...models.map((m) => m.storageKey), ...assets.map((a) => a.storageKey)],
    );
    await deleteObjects(candidates.filter((k) => !stillUsed.has(k)));
  } catch (e) {
    console.warn(`[storage] object cleanup failed for ${label}: ${(e as Error).message}`);
  }
}
