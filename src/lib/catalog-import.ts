export type CatalogKind = "items" | "variants";

export type CatalogItemImport = {
  id: string;
  name: string;
  category: string;
  status: "active" | "archived";
  processingEnabled: boolean;
  confirmationStatus: "confirmed" | "pending";
  sourceLabel: string;
  confirmationNote: string;
};

export type StockVariantImport = {
  id: string;
  itemId: string;
  processingState: string;
  stockForm: string;
  portionSizeLabel: string;
  balanceUnit: string;
  active: boolean;
};

export type ImportIssue = { row: number; message: string };
export type ImportPreview<T> = { valid: T[]; issues: ImportIssue[] };

export const ITEM_COLUMNS = [
  "id",
  "name",
  "category",
  "status",
  "processingEnabled",
  "confirmationStatus",
  "sourceLabel",
  "confirmationNote",
] as const;

export const VARIANT_COLUMNS = [
  "id",
  "itemId",
  "processingState",
  "stockForm",
  "portionSizeLabel",
  "balanceUnit",
  "active",
] as const;

export function normalizeHeader(value: string): string {
  return value.trim().replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function defaultColumnMapping(headers: string[], kind: CatalogKind): Record<string, string> {
  const fields = kind === "items" ? ITEM_COLUMNS : VARIANT_COLUMNS;
  const normalizedHeaders = new Map(headers.map((header) => [normalizeHeader(header), header]));
  return Object.fromEntries(
    fields.map((field) => [field, normalizedHeaders.get(normalizeHeader(field)) ?? ""]),
  );
}

function getValue(row: Record<string, unknown>, mapping: Record<string, string>, field: string): string {
  const source = mapping[field];
  const value = source ? row[source] : "";
  return value == null ? "" : String(value).trim();
}

function parseBoolean(value: string): boolean | null {
  if (["true", "yes", "1", "active", "enabled"].includes(value.toLowerCase())) return true;
  if (["false", "no", "0", "archived", "disabled"].includes(value.toLowerCase())) return false;
  return null;
}

function isSafeId(value: string): boolean {
  return /^[A-Za-z0-9_-]{1,128}$/.test(value);
}

export function validateCatalogRows(
  rows: Record<string, unknown>[],
  mapping: Record<string, string>,
  kind: CatalogKind,
): ImportPreview<CatalogItemImport | StockVariantImport> {
  const valid: Array<CatalogItemImport | StockVariantImport> = [];
  const issues: ImportIssue[] = [];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  rows.forEach((row, index) => {
    const sourceRow = index + 2;
    const id = getValue(row, mapping, "id");
    const rowErrors: string[] = [];

    if (!id) rowErrors.push("ID is required.");
    else if (!isSafeId(id)) rowErrors.push("ID may contain only letters, numbers, underscores, and hyphens.");
    else if (seenIds.has(id)) rowErrors.push(`Duplicate ID in file: ${id}.`);
    else seenIds.add(id);

    if (kind === "items") {
      const name = getValue(row, mapping, "name");
      const category = getValue(row, mapping, "category");
      const status = getValue(row, mapping, "status").toLowerCase();
      const processing = parseBoolean(getValue(row, mapping, "processingEnabled"));
      const confirmationStatus = getValue(row, mapping, "confirmationStatus").toLowerCase();

      if (!name) rowErrors.push("Name is required.");
      const normalizedName = name.toLocaleLowerCase().replace(/\s+/g, " ");
      if (normalizedName && seenNames.has(normalizedName)) {
        rowErrors.push(`Duplicate item name in file: ${name}.`);
      } else if (normalizedName) {
        seenNames.add(normalizedName);
      }
      if (!category) rowErrors.push("Category is required.");
      if (!(["active", "archived"].includes(status))) rowErrors.push("Status must be active or archived.");
      if (processing === null) rowErrors.push("processingEnabled must be true or false.");
      if (!(confirmationStatus === "confirmed" || confirmationStatus === "pending")) {
        rowErrors.push("confirmationStatus must be confirmed or pending.");
      }

      if (rowErrors.length === 0) {
        valid.push({
          id,
          name,
          category,
          status: status as CatalogItemImport["status"],
          processingEnabled: processing as boolean,
          confirmationStatus: confirmationStatus as CatalogItemImport["confirmationStatus"],
          sourceLabel: getValue(row, mapping, "sourceLabel"),
          confirmationNote: getValue(row, mapping, "confirmationNote"),
        });
      }
    } else {
      const itemId = getValue(row, mapping, "itemId");
      const processingState = getValue(row, mapping, "processingState");
      const stockForm = getValue(row, mapping, "stockForm");
      const balanceUnit = getValue(row, mapping, "balanceUnit");
      const active = parseBoolean(getValue(row, mapping, "active"));

      if (!itemId || !isSafeId(itemId)) rowErrors.push("A valid parent itemId is required.");
      if (!processingState) rowErrors.push("processingState is required.");
      if (!stockForm) rowErrors.push("stockForm is required.");
      if (!balanceUnit) rowErrors.push("balanceUnit is required.");
      if (active === null) rowErrors.push("active must be true or false.");

      if (rowErrors.length === 0) {
        valid.push({
          id,
          itemId,
          processingState,
          stockForm,
          portionSizeLabel: getValue(row, mapping, "portionSizeLabel"),
          balanceUnit,
          active: active as boolean,
        });
      }
     }

    if (rowErrors.length) issues.push({ row: sourceRow, message: rowErrors.join(" ") });
  });

  return { valid, issues };
}

export function csvSafeText(value: unknown): string {
  const text = String(value ?? "");
  return /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
}

export function csvEscape(value: unknown): string {
  const safe = csvSafeText(value);
  return `"${safe.replace(/"/g, '""')}"`;
}
