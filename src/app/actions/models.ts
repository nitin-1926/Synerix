"use server";

import { revalidatePath } from "next/cache";
import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, requireWriteAccess } from "@/lib/auth";
import { ensureBrand } from "@/lib/ensure-brand";
import { deleteObjects, getSignedThumbUrls } from "@/lib/storage";
import type { generateModel } from "@/trigger/generate-model";

/** List the AI-model library available to this workspace: shared GLOBAL presets
 * plus the workspace brand's own saved/generated models. Includes signed thumb
 * URLs for ready models. */
export async function listAiModels() {
  const auth = await requireAuth();
  const models = await prisma.aiModel.findMany({
    where: {
      OR: [{ scope: "GLOBAL" }, { brand: { workspaceId: auth.workspaceId } }],
    },
    orderBy: [{ scope: "asc" }, { createdAt: "desc" }],
  });
  const keys = models.map((m) => m.storageKey).filter((k): k is string => Boolean(k));
  const thumbs = await getSignedThumbUrls(keys, 400);
  return models.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    scope: m.scope,
    status: m.status,
    traits: m.traits,
    thumbUrl: m.storageKey ? thumbs[m.storageKey] ?? null : null,
  }));
}

const generateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().min(4).max(400),
});

/** Create a BRAND-scoped model row (PENDING) and kick off generation. */
export async function generateBrandModel(formData: FormData) {
  const auth = await requireWriteAccess();
  const brand = await ensureBrand(auth.workspaceId, auth.workspaceName);

  const parsed = generateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const model = await prisma.aiModel.create({
    data: {
      scope: "BRAND",
      brandId: brand.id,
      name: parsed.data.name,
      description: parsed.data.description,
      status: "PENDING",
    },
  });

  await tasks.trigger<typeof generateModel>("generate-model", { modelId: model.id });
  revalidatePath("/models");
  return { ok: true, modelId: model.id };
}

/** Delete a brand-scoped model (presets cannot be deleted by users). */
export async function deleteAiModel(modelId: string) {
  const auth = await requireWriteAccess();
  const model = await prisma.aiModel.findFirst({
    where: { id: modelId, scope: "BRAND", brand: { workspaceId: auth.workspaceId } },
  });
  if (!model) return { error: "Model not found" };
  const key = model.storageKey;
  await prisma.aiModel.delete({ where: { id: model.id } });
  await deleteObjects(key ? [key] : []).catch((e) =>
    console.warn(`[models] object cleanup failed for ${model.id}: ${(e as Error).message}`),
  );
  revalidatePath("/models");
  return { ok: true };
}
