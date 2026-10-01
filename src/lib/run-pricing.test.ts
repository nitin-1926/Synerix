import { describe, expect, it } from "vitest";
import { undeliveredRefund } from "./run-pricing";

const run = (o: Partial<Parameters<typeof undeliveredRefund>[0]>) => ({
  creditsDebited: 8,
  creditsPerCreative: 2,
  conceptCount: 4,
  imageModelPref: null,
  ...o,
});

describe("undeliveredRefund", () => {
  it("refunds only the creatives that never arrived", () => {
    expect(undeliveredRefund(run({}), 3)).toBe(2);
    expect(undeliveredRefund(run({}), 0)).toBe(8);
    expect(undeliveredRefund(run({}), 4)).toBe(0);
  });

  it("does not price per aspect: a fully delivered multi-aspect run owes nothing", () => {
    // 2 concepts x 3 aspects, aspects not charged → debit 4, unit 2. The old
    // catchError divided by concepts x aspects and refunded 2.67 here.
    expect(undeliveredRefund(run({ creditsDebited: 4, conceptCount: 2 }), 2)).toBe(0);
  });

  it("prices a compare run per creative, not per concept", () => {
    // 2 concepts on both models = 4 creatives for 8 credits. The old catchError
    // clamped this to 0 (under-refund) with 2 of 4 delivered.
    expect(undeliveredRefund(run({ conceptCount: 2, imageModelPref: "compare" }), 2)).toBe(4);
  });

  it("honours a per-aspect unit frozen at debit time", () => {
    // CREDITS_PER_ASPECT=1, 2 concepts x 3 aspects → unit 6, debit 12.
    expect(undeliveredRefund(run({ creditsDebited: 12, creditsPerCreative: 6, conceptCount: 2 }), 1)).toBe(6);
  });

  it("falls back to spreading the debit over paid creatives for legacy runs", () => {
    expect(undeliveredRefund(run({ creditsPerCreative: null }), 1)).toBe(6);
    expect(undeliveredRefund(run({ creditsPerCreative: null, creditsDebited: 16, imageModelPref: "compare" }), 4)).toBe(8);
  });

  it("never refunds a free run or goes negative", () => {
    expect(undeliveredRefund(run({ creditsDebited: 0 }), 0)).toBe(0);
    expect(undeliveredRefund(run({}), 9)).toBe(0);
  });
});
