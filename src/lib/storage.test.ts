import { describe, it, expect } from "vitest";
import { sanitizeSegment, creativeStoragePrefix, storageKeys, renderPrefix } from "./storage";

/**
 * The creative storage prefix is the tenant boundary in the object store AND is
 * frozen into Creative.storagePrefix behind a unique index. A regression that
 * dropped a segment, or let a separator through, would only surface as wrong
 * production object keys — after the bytes were already written there.
 */

describe("sanitizeSegment", () => {
  it("collapses anything that is not [a-z0-9] into single dashes", () => {
    expect(sanitizeSegment("Blueman Clothing")).toBe("blueman-clothing");
    expect(sanitizeSegment("A  B___C")).toBe("a-b-c");
  });

  it("strips path separators and traversal so a segment can never escape its prefix", () => {
    expect(sanitizeSegment("../../etc/passwd")).toBe("etc-passwd");
    expect(sanitizeSegment("a/b")).toBe("a-b");
    expect(sanitizeSegment("..")).toBe("untitled");
    for (const evil of ["../../..", "//", "./."]) {
      expect(sanitizeSegment(evil)).not.toContain("/");
    }
  });

  it("never returns an empty segment, which would collapse two path levels into one", () => {
    expect(sanitizeSegment("")).toBe("untitled");
    expect(sanitizeSegment("!!!")).toBe("untitled");
    expect(sanitizeSegment("---")).toBe("untitled");
  });

  it("bounds length so a long workspace name cannot blow the key limit", () => {
    expect(sanitizeSegment("x".repeat(500))).toHaveLength(60);
  });
});

describe("creativeStoragePrefix", () => {
  const base = {
    workspaceSlug: "blueman-clothing-nojry8",
    userId: "88a173d4-eb4c-4b78-9a12-46f4a2534caf",
    createdAt: new Date("2026-07-31T12:00:00.000Z"),
    creativeId: "fded4265-8c53-43c3-bd9e-21ebb2cabda0",
  };

  it("is {workspace}/{userId}/{unix seconds}-{first 8 of id}", () => {
    expect(creativeStoragePrefix(base)).toBe(
      "blueman-clothing-nojry8/88a173d4-eb4c-4b78-9a12-46f4a2534caf/1785499200-fded4265",
    );
  });

  it("keeps exactly three segments so tenant/user/creative levels never merge", () => {
    expect(creativeStoragePrefix(base).split("/")).toHaveLength(3);
  });

  /**
   * The regression this suffix exists for: concepts inside one run are rendered
   * concurrently and land in the same second. Without the id, 85 real creatives
   * produced only 82 distinct prefixes and renders overwrote each other.
   */
  it("distinguishes two creatives created in the SAME second", () => {
    const a = creativeStoragePrefix(base);
    const b = creativeStoragePrefix({ ...base, creativeId: "aaaa1111-0000-0000-0000-000000000000" });
    expect(a).not.toBe(b);
  });

  it("truncates to whole seconds so sub-second jitter cannot split one creative", () => {
    const withMs = creativeStoragePrefix({ ...base, createdAt: new Date("2026-07-31T12:00:00.999Z") });
    expect(withMs).toBe(creativeStoragePrefix(base));
  });

  it("sanitizes the slug rather than trusting it", () => {
    expect(creativeStoragePrefix({ ...base, workspaceSlug: "Evil/../Name" })).toContain("evil-name/");
  });
});

describe("storageKeys.composedRender", () => {
  const prefix = "ws/user/123-abcd1234";

  it("nests renders under the creative prefix with aspect and version", () => {
    expect(storageKeys.composedRender({ prefix, aspect: "16:9", version: 0 })).toBe(
      "ws/user/123-abcd1234/16x9-v0.png",
    );
  });

  it("escapes the colon in the aspect ratio", () => {
    const key = storageKeys.composedRender({ prefix, aspect: "4:5", version: 2 });
    expect(key).toContain("4x5-v2");
    expect(key).not.toContain(":");
  });

  it("gives every aspect+version its own object", () => {
    const keys = new Set(
      ["1:1", "4:5", "9:16", "16:9"].flatMap((aspect) =>
        [0, 1].map((version) => storageKeys.composedRender({ prefix, aspect, version })),
      ),
    );
    expect(keys.size).toBe(8);
  });
});

describe("storageKeys.masterPlate", () => {
  /**
   * A bake-off run emits one creative per (concept, variant), so several
   * creatives share conceptIndex 0 within one run. Keying an editor-generated
   * plate by (runId, conceptIndex, aspect) alone let the second creative
   * overwrite the first's plate, and the next text edit silently re-composited
   * one creative onto the other model's scene.
   */
  it("separates two bake-off creatives that share a conceptIndex", () => {
    const runId = "run-1";
    const a = storageKeys.masterPlate(runId, `0-${"48a68a32".slice(0, 8)}-16x9`);
    const b = storageKeys.masterPlate(runId, `0-${"6c110256".slice(0, 8)}-16x9`);
    expect(a).not.toBe(b);
  });

  it("keeps plates under runs/{runId}/plates/ so no lifecycle rule targets them by accident", () => {
    expect(storageKeys.masterPlate("run-1", "0-16x9")).toBe("runs/run-1/plates/0-16x9.png");
  });
});

describe("renderPrefix", () => {
  it("uses the frozen prefix when present", () => {
    expect(renderPrefix({ id: "c1", storagePrefix: "ws/user/1-abcd" })).toBe("ws/user/1-abcd");
  });

  it("falls back to the pre-R2 layout so unbackfilled rows still resolve", () => {
    expect(renderPrefix({ id: "c1", storagePrefix: null })).toBe("creatives/c1/renders");
  });
});
