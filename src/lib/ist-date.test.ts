import { afterEach, describe, expect, it, vi } from "vitest";
import { todayIST } from "./ist-date";

afterEach(() => vi.useRealTimers());

describe("todayIST", () => {
  it("is the India calendar date even when UTC is still on the previous day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T20:00:00Z")); // 01:30 IST on 20 Oct
    expect(todayIST().toISOString()).toBe("2026-10-20T00:00:00.000Z");
  });

  it("keeps a festival on its own day after 05:30 IST", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T10:00:00Z")); // 15:30 IST on 20 Oct
    const festival = new Date("2026-10-20T00:00:00Z");
    expect(festival >= todayIST()).toBe(true);
  });
});
