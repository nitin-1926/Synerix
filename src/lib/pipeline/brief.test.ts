import { describe, it, expect } from "vitest";
import { assembleOccasionBrief } from "./brief";
import type { Brand, Product } from "@/generated/prisma/client";
import type { ProductIntel } from "@/lib/products/intelligence";

const brand = {
  name: "Gillco",
  oneLiner: "Punjab's trusted flour",
  mottoText: null,
  dna: null,
  primaryColorHex: "#b83b5e",
  secondaryColorsHex: [],
  accentColorsHex: [],
} as unknown as Brand;

const intel: ProductIntel = {
  category: "wheat flour for pooris",
  preparation: "kneaded and deep-fried",
  finishedForm: "golden puffed pooris",
  servingContext: ["with chole"],
  occasions: ["Diwali breakfast"],
  targetEmotions: ["family warmth"],
  sceneDo: ["puffed pooris"],
  sceneDont: ["tawa rotis"],
};

describe("assembleOccasionBrief", () => {
  it("apparel product gets the on-model direction and skips the food intelligence block", () => {
    const product = {
      name: "Quilted Bomber",
      category: "APPAREL",
      description: "Navy quilted bomber jacket",
      dissectionPrompt: null,
      productIntel: intel, // present, but must be ignored for apparel
    } as unknown as Product;

    const brief = assembleOccasionBrief({ brand, product, festival: null });
    expect(brief).toContain("Category: APPAREL");
    expect(brief).toMatch(/Apparel direction \(on-model\)/);
    expect(brief).toMatch(/WORN by a person/);
    expect(brief).not.toMatch(/Product intelligence/);
  });

  it("FMCG product with intel includes the product-intelligence block, not the apparel direction", () => {
    const product = {
      name: "Poori Atta",
      category: "FMCG",
      description: "Wheat flour",
      dissectionPrompt: "a yellow 1kg pack",
      productIntel: intel,
    } as unknown as Product;

    const brief = assembleOccasionBrief({ brand, product, festival: null });
    expect(brief).toContain("Category: FMCG");
    expect(brief).toMatch(/Product intelligence/);
    expect(brief).toContain("golden puffed pooris");
    expect(brief).not.toMatch(/Apparel direction/);
  });
});
