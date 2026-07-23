import { describe, expect, it } from "vitest";
import { showsModelSurface, type WorkspaceProfile } from "./workspace-profile";

const profile = (over: Partial<WorkspaceProfile>): WorkspaceProfile => ({
  type: null,
  industry: null,
  primaryUseCase: null,
  salesChannel: null,
  ...over,
});

describe("showsModelSurface", () => {
  it("always shows for apparel account types, regardless of legacy profile", () => {
    expect(showsModelSurface(profile({ type: "APPAREL_ON_MODEL" }))).toBe(true);
    expect(showsModelSurface(profile({ type: "FASHION_EDITORIAL", industry: "food_fmcg" }))).toBe(true);
  });

  it("falls back to the legacy profile for FMCG/default type (schema default can't distinguish a real choice)", () => {
    expect(showsModelSurface(profile({ type: "FMCG_PRODUCT", industry: "apparel" }))).toBe(true);
    expect(showsModelSurface(profile({ type: "FMCG_PRODUCT", primaryUseCase: "on_model" }))).toBe(true);
    expect(showsModelSurface(profile({ type: "FMCG_PRODUCT", industry: "food_fmcg" }))).toBe(false);
  });

  it("shows everything on incomplete data (no type, no legacy answers)", () => {
    expect(showsModelSurface(profile({}))).toBe(true);
    expect(showsModelSurface(profile({ type: "FMCG_PRODUCT" }))).toBe(true);
  });
});
