import { afterEach, describe, expect, it, vi } from "vitest";
import { withRetry } from "./retry";

afterEach(() => vi.restoreAllMocks());

describe("withRetry", () => {
  it("retries an AbortSignal.timeout() fetch abort as transient", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    // The exact error fetch rejects with when AbortSignal.timeout fires.
    const timeout = new DOMException("The operation was aborted due to timeout", "TimeoutError");
    const fn = vi.fn().mockRejectedValueOnce(timeout).mockResolvedValueOnce("ok");
    await expect(withRetry(fn, { label: "t", attempts: 2, baseDelayMs: 0 })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry a non-transient error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("gemini-image 400: bad request"));
    await expect(withRetry(fn, { label: "t", attempts: 3, baseDelayMs: 0 })).rejects.toThrow("400");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
