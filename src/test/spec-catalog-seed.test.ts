import { describe, expect, it } from "vitest";

import {
  SPEC_CATALOGUE,
  SPEC_SOURCE_PRODUCT_COUNT,
  SPEC_VARIANTS,
} from "@/data/spec-catalog-seed";

describe("spec.md catalogue seed", () => {
  it("includes all unique parent products without quantities or opening balances", () => {
    expect(SPEC_CATALOGUE).toHaveLength(SPEC_SOURCE_PRODUCT_COUNT);
    expect(new Set(SPEC_CATALOGUE.map((item) => item.id)).size).toBe(SPEC_SOURCE_PRODUCT_COUNT);
    expect(SPEC_CATALOGUE.every((item) => item.status === "active")).toBe(true);
    expect(SPEC_CATALOGUE.some((item) => "quantity" in item || "openingBalance" in item)).toBe(false);
  });

  it("creates separate processed and unprocessed variants only where explicitly listed", () => {
    const goatMeat = SPEC_VARIANTS.filter((variant) => variant.itemId === "SPEC-MGK-P006");
    expect(goatMeat.map((variant) => variant.processingState)).toEqual(["Processed", "Unprocessed"]);

    const chicken = SPEC_VARIANTS.filter((variant) => variant.itemId === "SPEC-MGK-P002");
    expect(chicken).toEqual([]);

    const stockfish = SPEC_VARIANTS.filter((variant) => variant.itemId === "SPEC-MGK-S008");
    expect(stockfish.map((variant) => variant.processingState)).toEqual(["Processed"]);
  });

  it("models bowl capacities as packaging variants, not separate parent products", () => {
    const bowls = SPEC_CATALOGUE.filter((item) => item.name.toLowerCase().includes("bowl"));
    expect(bowls).toHaveLength(2);

    const soupBowls = SPEC_VARIANTS.filter((variant) => variant.itemId === "SPEC-MGK-K001");
    expect(soupBowls.map((variant) => variant.stockForm)).toEqual([
      "Bowl 1.5L",
      "Bowl 3L",
      "Bowl 4L",
    ]);
    expect(soupBowls.every((variant) => variant.balanceUnit === "" && !variant.active)).toBe(true);
  });

  it("keeps unresolved product identities pending", () => {
    const pendingIds = new Set(SPEC_CATALOGUE.filter((item) => item.confirmationStatus === "pending").map((item) => item.id));
    expect(pendingIds.has("SPEC-MGK-P002")).toBe(true);
    expect(pendingIds.has("SPEC-MGK-K002")).toBe(true);
    expect(pendingIds.has("SPEC-MGK-P006")).toBe(false);
  });
});
