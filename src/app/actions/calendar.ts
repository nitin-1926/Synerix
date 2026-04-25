"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const customSchema = z.object({
  title: z.string().trim().min(1).max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export async function createCustomEntry(formData: FormData) {
  const auth = await requireAuth();
  const brand = await prisma.brand.findFirst({ where: { workspaceId: auth.workspaceId } });
  if (!brand) return { error: "Set up your brand first" };
  const parsed = customSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await prisma.calendarEntry.create({
    data: {
      workspaceId: auth.workspaceId,
      brandId: brand.id,
      kind: "CUSTOM",
      customTitle: parsed.data.title,
      customDate: new Date(parsed.data.date),
      customContext: parsed.data.note ? { note: parsed.data.note } : undefined,
    },
  });
  revalidatePath("/calendar");
  return { ok: true };
}

export async function deleteCustomEntry(entryId: string) {
  const auth = await requireAuth();
  const entry = await prisma.calendarEntry.findFirst({
    where: { id: entryId, workspaceId: auth.workspaceId, kind: "CUSTOM" },
  });
  if (!entry) return { error: "Not found" };
  await prisma.calendarEntry.delete({ where: { id: entry.id } });
  revalidatePath("/calendar");
  return { ok: true };
}
