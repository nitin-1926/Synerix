import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ images: vi.fn(), models: vi.fn(), assets: vi.fn(), del: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    productImage: { findMany: m.images },
    aiModel: { findMany: m.models },
    brandAsset: { findMany: m.assets },
  },
}));
vi.mock("@/lib/storage", () => ({ deleteObjects: m.del }));

const { deleteUnreferencedObjects } = await import("./object-gc");

beforeEach(() => {
  vi.clearAllMocks();
  m.images.mockResolvedValue([]);
  m.models.mockResolvedValue([]);
  m.assets.mockResolvedValue([]);
  m.del.mockResolvedValue(undefined);
});

describe("deleteUnreferencedObjects", () => {
  it("keeps a key another row still references (e2e seed shares keys across workspaces)", async () => {
    m.images.mockResolvedValue([{ storageKey: "products/p/shared.jpg", cutoutKey: null }]);
    m.models.mockResolvedValue([{ storageKey: "models/brand/m.png" }]);
    await deleteUnreferencedObjects(
      ["products/p/shared.jpg", "products/p/own.jpg", "models/brand/m.png", null],
      "test",
    );
    expect(m.del).toHaveBeenCalledWith(["products/p/own.jpg"]);
  });

  it("does nothing for an empty key list", async () => {
    await deleteUnreferencedObjects([null], "test");
    expect(m.images).not.toHaveBeenCalled();
    expect(m.del).not.toHaveBeenCalled();
  });

  it("never throws: a failed cleanup must not fail a delete the user already saw succeed", async () => {
    m.del.mockRejectedValue(new Error("R2 down"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(deleteUnreferencedObjects(["k"], "test")).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });
});
