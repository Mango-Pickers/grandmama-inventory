import { describe, expect, it } from "vitest";

import { csvEscape, defaultColumnMapping, validateCatalogRows } from "@/lib/catalog-import";

describe("catalogue spreadsheet validation", () => {
  it("validates item records without accepting stock quantities", () => {
    const headers = ["id", "name", "category", "status", "processingEnabled", "confirmationStatus"];
    const mapping = defaultColumnMapping(headers, "items");
    const result = validateCatalogRows(
      [{ id: "MGK-P001", name: "Sea snail", category: "Protein", status: "active", processingEnabled: true, confirmationStatus: "pending" }],
      mapping,
      "items",
    );

    expect(result.issues).toEqual([]);
    expect(result.valid).toEqual([
      {
        id: "MGK-P001",
        name: "Sea snail",
        category: "Protein",
        status: "active",
        processingEnabled: true,
        confirmationStatus: "pending",
        sourceLabel: "",
        confirmationNote: "",
      },
    ]);
  });

  it("reports missing fields, invalid status, and repeated IDs by source row", () => {
    const mapping = defaultColumnMapping(["id", "name", "category", "status", "processingEnabled", "confirmationStatus"], "items");
    const result = validateCatalogRows(
      [
        { id: "duplicate", name: "First", category: "Food", status: "active", processingEnabled: true, confirmationStatus: "confirmed" },
        { id: "duplicate", name: "", category: "", status: "unknown", processingEnabled: "maybe", confirmationStatus: "" },
      ],
      mapping,
      "items",
    );

    expect(result.valid).toHaveLength(1);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.row).toBe(3);
    expect(result.issues[0]?.message).toContain("Duplicate ID");
    expect(result.issues[0]?.message).toContain("Name is required");
  });

  it("rejects repeated item names even when the rows have different IDs", () => {
    const mapping = defaultColumnMapping(["id", "name", "category", "status", "processingEnabled", "confirmationStatus"], "items");
    const result = validateCatalogRows(
      [
        { id: "MGK-P001", name: "Sea snail", category: "Protein", status: "active", processingEnabled: true, confirmationStatus: "confirmed" },
        { id: "MGK-P002", name: "  SEA   SNAIL ", category: "Protein", status: "active", processingEnabled: true, confirmationStatus: "confirmed" },
      ],
      mapping,
      "items",
    );

    expect(result.valid).toHaveLength(1);
    expect(result.issues[0]?.message).toContain("Duplicate item name");
  });

  it("validates stock variants and requires a parent ID", () => {
    const mapping = defaultColumnMapping(["id", "itemId", "processingState", "stockForm", "portionSizeLabel", "balanceUnit", "active"], "variants");
    const result = validateCatalogRows(
      [{ id: "MGK-P001-U", itemId: "MGK-P001", processingState: "Unprocessed", stockForm: "loose", portionSizeLabel: "", balanceUnit: "kg", active: true }],
      mapping,
      "variants",
    );

    expect(result.issues).toEqual([]);
    expect(result.valid[0]).toMatchObject({ id: "MGK-P001-U", itemId: "MGK-P001", active: true });
  });

  it("quotes CSV and neutralizes formula-like content", () => {
    expect(csvEscape("=SUM(A1:A2)")).toBe('"\'=SUM(A1:A2)"');
    expect(csvEscape('soup, "special"')).toBe('"soup, ""special"""');
  });
});
