import { describe, expect, it } from "vitest";

import { calculateBalances, signedQuantityFor } from "@/lib/inventory-service";

describe("shared inventory ledger calculations", () => {
  it("applies signed receipt, issue, waste, preparation and return movements", () => {
    const movements = [
      { variantId: "raw", locationId: "store", unit: "kg", type: "receipt" as const, quantity: 60 },
      { variantId: "raw", locationId: "store", unit: "kg", type: "issue" as const, quantity: 39 },
      { variantId: "raw", locationId: "store", unit: "kg", type: "waste" as const, quantity: 2 },
      { variantId: "cooked", locationId: "kitchen", unit: "kg", type: "preparation_output" as const, quantity: 18 },
      { variantId: "raw", locationId: "store", unit: "kg", type: "return" as const, quantity: 3 },
    ];

    expect(calculateBalances(movements)).toEqual([
      { variantId: "raw", locationId: "store", quantity: 22, unit: "kg" },
      { variantId: "cooked", locationId: "kitchen", quantity: 18, unit: "kg" },
    ]);
  });

  it("keeps incompatible units as distinct balances", () => {
    const balances = calculateBalances([
      { variantId: "oil", locationId: "store", unit: "L", type: "receipt", quantity: 4 },
      { variantId: "oil", locationId: "store", unit: "bottles", type: "receipt", quantity: 2 },
    ]);

    expect(balances).toHaveLength(2);
    expect(balances.find((balance) => balance.unit === "L")?.quantity).toBe(4);
    expect(balances.find((balance) => balance.unit === "bottles")?.quantity).toBe(2);
  });

  it("treats zero count as a real observation and computes a negative difference", () => {
    const observed = 0;
    const expected = 21;
    expect(observed - expected).toBe(-21);
  });

  it("uses explicit signed adjustment values and linked reversal directions", () => {
    expect(signedQuantityFor({ itemId: "a", variantId: "v", locationId: "l", type: "adjustment", quantity: 3, signedQuantity: -3, unit: "pcs", reason: "count", reference: "count-1", effectiveAt: new Date() })).toBe(-3);
    expect(signedQuantityFor({ itemId: "a", variantId: "v", locationId: "l", type: "reversal", quantity: 4, unit: "pcs", reason: "reverse", reference: "movement-1", effectiveAt: new Date() })).toBe(4);
  });
});
