import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  findFirst: vi.fn(),
  updateMany: vi.fn(),
  update: vi.fn(),
  debit: vi.fn(),
  grant: vi.fn(),
  trigger: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { brand: { findFirst: m.findFirst, updateMany: m.updateMany, update: m.update } },
}));
vi.mock("@/lib/auth", () => ({ requireWriteAccess: async () => ({ workspaceId: "ws1", userId: "u1" }) }));
vi.mock("@/lib/credits", async () => {
  class InsufficientCreditsError extends Error {}
  return { debitCredits: m.debit, grantCredits: m.grant, InsufficientCreditsError };
});
vi.mock("@trigger.dev/sdk", () => ({ tasks: { trigger: m.trigger } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/storage", () => ({ storageKeys: {}, uploadBuffer: vi.fn() }));
vi.mock("@/lib/ensure-brand", () => ({ ensureBrand: vi.fn() }));

const { refreshBrandIntel } = await import("./brand");
const { InsufficientCreditsError } = await import("@/lib/credits");
const { CREDIT_COSTS } = await import("@/lib/ai/models");

beforeEach(() => {
  vi.clearAllMocks();
  m.findFirst.mockResolvedValue({ id: "b1", name: "Acme", creativeIntelRequestedAt: null });
  m.updateMany.mockResolvedValue({ count: 1 });
  m.debit.mockResolvedValue(10);
  m.trigger.mockResolvedValue({ id: "run_1" });
});

describe("refreshBrandIntel", () => {
  it("claims the slot BEFORE debiting, then enqueues research carrying the charge", async () => {
    expect(await refreshBrandIntel("b1")).toEqual({ ok: true });
    expect(m.updateMany.mock.invocationCallOrder[0]).toBeLessThan(m.debit.mock.invocationCallOrder[0]);
    expect(m.trigger).toHaveBeenCalledWith("brand-research", {
      brandId: "b1",
      force: true,
      charge: { workspaceId: "ws1", amount: CREDIT_COSTS.brandIntel },
    });
    expect(m.grant).not.toHaveBeenCalled();
  });

  it("charges nothing when the claim is lost (cooldown, or another tab mid-research)", async () => {
    m.updateMany.mockResolvedValue({ count: 0 });
    const res = await refreshBrandIntel("b1");
    expect(res.error).toMatch(/recently or is still running/);
    expect(m.debit).not.toHaveBeenCalled();
    expect(m.trigger).not.toHaveBeenCalled();
  });

  it("releases the claim and runs no research when credits are short", async () => {
    m.debit.mockRejectedValue(new InsufficientCreditsError(0, CREDIT_COSTS.brandIntel));
    const res = await refreshBrandIntel("b1");
    expect(res.error).toMatch(/Not enough credits/);
    expect(m.update).toHaveBeenCalledWith({ where: { id: "b1" }, data: { creativeIntelRequestedAt: null } });
    expect(m.trigger).not.toHaveBeenCalled();
  });

  it("refunds and releases when the research cannot be enqueued", async () => {
    m.trigger.mockRejectedValue(new Error("trigger down"));
    const res = await refreshBrandIntel("b1");
    expect(res.error).toMatch(/refunded/);
    expect(m.grant).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: "ws1", amount: CREDIT_COSTS.brandIntel, reason: "REFUND" }),
    );
    expect(m.update).toHaveBeenCalled();
  });

  it("refuses a brand outside the caller's workspace without touching credits", async () => {
    m.findFirst.mockResolvedValue(null);
    expect(await refreshBrandIntel("other")).toEqual({ error: "Brand not found" });
    expect(m.updateMany).not.toHaveBeenCalled();
    expect(m.debit).not.toHaveBeenCalled();
  });
});
