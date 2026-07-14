"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { tasks } from "@trigger.dev/sdk";
import { requireSuperAdmin, ACTIVE_WORKSPACE_COOKIE, ADMIN_ACTING_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { grantCredits } from "@/lib/credits";
import type { brandIngest } from "@/trigger/brand-ingest";

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, "Name the workspace").max(80),
  type: z.enum(["FMCG_PRODUCT", "APPAREL_ON_MODEL", "FASHION_EDITORIAL"]).default("FMCG_PRODUCT"),
  websiteUrl: z
    .string()
    .trim()
    .transform((v) => (v ? (/^https?:\/\//i.test(v) ? v : `https://${v}`) : ""))
    .pipe(z.string().url().or(z.literal(""))),
});

function slugify(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) || "workspace";
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Admin provisions a new customer workspace (invite-only onboarding). Creates
 * the workspace (+ optionally a brand seeded from a website URL), then drops the
 * admin into it (god-view) to finish brand setup and invite the client's users.
 * Activation is never gated on setup — the workspace is live immediately.
 */
export async function adminCreateWorkspace(input: { name: string; type?: string; websiteUrl?: string }) {
  const auth = await requireSuperAdmin();
  const parsed = createWorkspaceSchema.safeParse({ name: input.name, type: input.type, websiteUrl: input.websiteUrl ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { name, type, websiteUrl } = parsed.data;

  const workspace = await prisma.workspace.create({
    data: {
      name,
      type,
      slug: slugify(name),
      ownerUserId: auth.userId,
      credits: { create: { balance: 0 } },
    },
  });

  if (websiteUrl) {
    const brand = await prisma.brand.create({
      data: {
        workspaceId: workspace.id,
        name: new URL(websiteUrl).hostname.replace(/^www\./, ""),
        websiteUrl,
        ingestStatus: "PENDING",
      },
    });
    // Best-effort: kick off brand ingestion. If the worker is down, the brand
    // still exists and can be re-ingested from the brand page.
    try {
      const handle = await tasks.trigger<typeof brandIngest>("brand-ingest", { brandId: brand.id, websiteUrl });
      await prisma.brand.update({ where: { id: brand.id }, data: { ingestRunId: handle.id } });
    } catch {
      /* ingestion can be retried later */
    }
  }

  // Enter the new workspace in god-view so the admin finishes setup inside it.
  const jar = await cookies();
  const opts = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 30 };
  jar.set(ACTIVE_WORKSPACE_COOKIE, workspace.id, opts);
  jar.set(ADMIN_ACTING_COOKIE, "1", opts);
  // With a URL we ingested a brand → land on the dashboard. Without one, go to
  // the brand page to set it up by hand (or skip straight to Products/Models).
  redirect(websiteUrl ? "/dashboard" : "/brand");
}

/** Rename a workspace from the admin console (super-admin only). Mirrors
 * renameWorkspace in workspace.ts but targets any workspace by id rather than
 * the caller's active one. */
export async function adminRenameWorkspace(workspaceId: string, name: string) {
  await requireSuperAdmin();
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) return { error: "Name must be 2 to 80 characters" };
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { id: true } });
  if (!ws) return { error: "Workspace not found" };
  await prisma.workspace.update({ where: { id: workspaceId }, data: { name: trimmed } });
  revalidatePath("/admin");
  return { ok: true };
}

/** Admin enters a customer's product UI (god-view): pin their workspace + mark
 * "acting", then land in the product dashboard as that customer. */
export async function enterCustomerWorkspace(workspaceId: string) {
  await requireSuperAdmin();
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!ws) throw new Error("Workspace not found");
  const jar = await cookies();
  const opts = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 30 };
  jar.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, opts);
  jar.set(ADMIN_ACTING_COOKIE, "1", opts);
  redirect("/dashboard");
}

/** Admin leaves god-view and returns to the admin home. */
export async function exitToAdmin() {
  await requireSuperAdmin();
  const jar = await cookies();
  jar.delete(ADMIN_ACTING_COOKIE);
  redirect("/admin");
}

/**
 * Grant (positive) or adjust down (negative) a workspace's credits.
 * Negative deltas mirror grantCredits' ledger+balance write inline because
 * grantCredits blindly increments (its upsert-create would even seed a
 * negative balance); the balance is never allowed below 0.
 */
export async function adminGrantCredits(workspaceId: string, amount: number, note: string) {
  await requireSuperAdmin();

  if (!Number.isInteger(amount) || amount === 0 || amount < -10000 || amount > 10000) {
    throw new Error("Amount must be a non-zero integer between -10,000 and 10,000");
  }

  if (amount > 0) {
    await grantCredits({ workspaceId, amount, reason: "MANUAL_GRANT", note: note || undefined });
  } else {
    await prisma.$transaction(async (tx) => {
      // Guarded conditional decrement (mirrors debitCredits) — a read-then-
      // write-absolute here would silently overwrite any debit that commits
      // between the read and the write.
      const deducted = await tx.workspaceCredits.updateMany({
        where: { workspaceId, balance: { gte: -amount } },
        data: { balance: { decrement: -amount } },
      });
      if (deducted.count === 0) {
        throw new Error("Balance cannot go below 0");
      }
      const credits = await tx.workspaceCredits.findUniqueOrThrow({ where: { workspaceId } });
      await tx.creditLedger.create({
        data: {
          workspaceId,
          delta: amount,
          reason: "MANUAL_GRANT",
          balanceAfter: Number(credits.balance),
          note: note || undefined,
        },
      });
    });
  }

  revalidatePath("/admin");
}

export async function adminToggleTestActive(testId: string, isActive: boolean) {
  await requireSuperAdmin();
  await prisma.test.update({ where: { id: testId }, data: { isActive } });
  revalidatePath("/admin/tests");
}

// Mirrors the schema used by /api/admin/tests.
const testInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Test name is required"),
  type: z.enum(["paid", "free"]),
  description: z.string().optional(),
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      options: z.array(
        z.object({
          id: z.string(),
          content: z.string(),
          weightAge: z.union([z.string(), z.number()]),
        }),
      ),
      category: z.string(),
    }),
  ),
  isActive: z.boolean().optional(),
});

export type TestInput = z.infer<typeof testInputSchema>;

/** Create (no id) or update (id) a test with its full question payload. */
export async function adminSaveTest(input: TestInput): Promise<{ id: string }> {
  await requireSuperAdmin();
  const data = testInputSchema.parse(input);

  const payload = {
    name: data.name,
    type: data.type,
    description: data.description,
    questions: data.questions,
    isActive: data.isActive ?? true,
  };

  const test = data.id
    ? await prisma.test.update({ where: { id: data.id }, data: payload })
    : await prisma.test.create({ data: payload });

  revalidatePath("/admin/tests");
  return { id: test.id };
}

/** Delete a test. Blocked when results exist — deactivate instead. */
export async function adminDeleteTest(testId: string): Promise<{ error?: string }> {
  await requireSuperAdmin();

  const resultCount = await prisma.testResult.count({ where: { testId } });
  if (resultCount > 0) {
    return {
      error: `This test has ${resultCount} result${resultCount === 1 ? "" : "s"} — deactivate it instead of deleting.`,
    };
  }

  await prisma.test.delete({ where: { id: testId } });
  revalidatePath("/admin/tests");
  return {};
}
