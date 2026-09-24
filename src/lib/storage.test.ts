import { describe, it, expect } from "vitest";
import { sanitizeSegment, creativeStoragePrefix, storageKeys, getSignedUrl, getSignedUrls } from "./storage";

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

describe("storageKeys.editorAspectPlate", () => {
  /**
   * A bake-off run emits one creative per (concept, variant), so several
   * creatives share conceptIndex 0 within one run. Keying an editor-generated
   * plate by (runId, conceptIndex, aspect) alone let the second creative
   * overwrite the first's plate, and the next text edit silently re-composited
   * one creative onto the other model's scene. paid-edits.ts calls this helper,
   * so dropping the creative id from it fails here.
   */
  it("separates two bake-off creatives that share a run and conceptIndex", () => {
    const a = storageKeys.editorAspectPlate({ generationRunId: "run-1", conceptIndex: 0, id: "48a68a32-aaaa" }, "16:9");
    const b = storageKeys.editorAspectPlate({ generationRunId: "run-1", conceptIndex: 0, id: "6c110256-bbbb" }, "16:9");
    expect(a).not.toBe(b);
    expect(a).toBe("runs/run-1/plates/0-48a68a32-16x9.png");
  });

  it("keeps plates under runs/{runId}/plates/ so no lifecycle rule targets them by accident", () => {
    expect(storageKeys.masterPlate("run-1", "0-16x9")).toBe("runs/run-1/plates/0-16x9.png");
  });
});

describe("presigned urls", () => {
  process.env.R2_ACCOUNT_ID ??= "test-account";
  process.env.R2_ACCESS_KEY_ID ??= "test-key";
  process.env.R2_SECRET_ACCESS_KEY ??= "test-secret";

  /**
   * URL stability is what keeps the browser image cache hitting: the same key
   * must sign to the same URL across calls and across different key sets
   * (the old array-keyed cache re-signed everything when one key was added).
   */
  it("signs the same key to the same url regardless of the surrounding set", async () => {
    const one = await getSignedUrl("ws/u/1-abcd/4x5-v0.png");
    const set = await getSignedUrls(["ws/u/1-abcd/4x5-v0.png", "ws/u/2-efgh/4x5-v0.png"]);
    expect(set["ws/u/1-abcd/4x5-v0.png"]).toBe(one);
  });

  it("is valid for at least the requested lifetime", async () => {
    const url = new URL(await getSignedUrl("k.png", 3600));
    const signedAt = url.searchParams.get("X-Amz-Date")!; // yyyymmddThhmmssZ
    const iso = `${signedAt.slice(0, 4)}-${signedAt.slice(4, 6)}-${signedAt.slice(6, 8)}T${signedAt.slice(9, 11)}:${signedAt.slice(11, 13)}:${signedAt.slice(13, 15)}Z`;
    const expiresAt = Date.parse(iso) + Number(url.searchParams.get("X-Amz-Expires")) * 1000;
    expect(expiresAt).toBeGreaterThanOrEqual(Date.now() + 3600 * 1000 - 1000);
  });
});
