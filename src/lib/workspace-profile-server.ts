import { cache } from "react";
import { prisma } from "@/lib/db";
import type { WorkspaceProfile } from "./workspace-profile";

/** Workspace onboarding profile, request-deduped (used by nav/tab gating). */
export const getWorkspaceProfile = cache(async (workspaceId: string): Promise<WorkspaceProfile> => {
  const w = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { industry: true, primaryUseCase: true, salesChannel: true },
  });
  return w ?? { industry: null, primaryUseCase: null, salesChannel: null };
});
