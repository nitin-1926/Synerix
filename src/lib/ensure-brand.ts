import "server-only";
import { prisma } from "@/lib/db";

/**
 * Return the workspace's brand, creating a blank one if none exists. Lets users
 * (especially admin-provisioned, invite-only workspaces) jump straight into
 * uploading products / a logo without being forced through brand onboarding
 * first — brand details are filled in later on the brand page.
 */
export async function ensureBrand(workspaceId: string, fallbackName: string) {
  const existing = await prisma.brand.findFirst({ where: { workspaceId } });
  if (existing) return existing;
  return prisma.brand.create({
    data: { workspaceId, name: fallbackName?.trim() || "My brand", ingestStatus: "READY" },
  });
}
