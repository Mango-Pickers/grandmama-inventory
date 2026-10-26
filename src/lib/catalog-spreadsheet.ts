import Papa from "papaparse";
import ExcelJS from "exceljs";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import {
  csvEscape,
  defaultColumnMapping,
  ITEM_COLUMNS,
  type CatalogItemImport,
  type CatalogKind,
  type ImportPreview,
  type StockVariantImport,
  validateCatalogRows,
  VARIANT_COLUMNS,
} from "@/lib/catalog-import";

export type ParsedSheet = {
  name: string;
  headers: string[];
  rows: Record<string, unknown>[];
};

export type ParsedSpreadsheet = {
  format: "csv" | "xlsx";
  sheets: ParsedSheet[];
};

export type CatalogImportPreview = {
  kind: CatalogKind;
  valid: Array<CatalogItemImport | StockVariantImport>;
  issues: ImportPreview<CatalogItemImport | StockVariantImport>["issues"];
  existingIds: Set<string>;
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 400;
const MAX_CELL_LENGTH = 1000;

function excelSafeValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  return /^[=+@\-\t\r]/.test(value) ? `'${value}` : value;
}

export async function parseSpreadsheet(file: File): Promise<ParsedSpreadsheet> {
  if (file.size > MAX_FILE_BYTES) throw new Error("File is larger than the 5 MB import limit.");
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    const parsed = await new Promise<Papa.ParseResult<Record<string, unknown>>>((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: (header) => header.trim(),
        complete: resolve,
        error: reject,
      });
    });
    if (parsed.errors.length) throw new Error(parsed.errors[0]?.message ?? "Could not parse CSV.");
    const headers = parsed.meta.fields ?? [];
    return { format: "csv", sheets: [{ name: "CSV data", headers, rows: parsed.data }] };
  }

  if (extension !== "xlsx") throw new Error("Supported formats are UTF-8 CSV and XLSX. Legacy XLS is not supported.");

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheets = workbook.worksheets.map((worksheet) => {
    const headers: string[] = [];
    const rows: Record<string, unknown>[] = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const values = row.values as unknown[];
      const cells = values.slice(1).map(normalizeCell);
      if (rowNumber === 1) {
        cells.forEach((value) => headers.push(String(value ?? "").trim()));
        return;
      }
      if (cells.every((value) => value === "" || value == null)) return;
      const record: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        if (header) record[header] = cells[index] ?? "";
      });
      rows.push(record);
    });
    return { name: worksheet.name, headers, rows };
  });
  return { format: "xlsx", sheets };
}

function normalizeCell(value: unknown): unknown {
  if (value == null) return "";
  if (typeof value === "object") {
    if ("formula" in value || "sharedFormula" in value) throw new Error("Formula cells are not accepted in imports.");
    if ("text" in value) return String(value.text ?? "");
    if ("result" in value) return value.result ?? "";
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((entry) => (typeof entry === "object" && entry && "text" in entry ? entry.text : "")).join("");
    }
    if (value instanceof Date) return value.toISOString();
    return String(value);
  }
  return value;
}

export function validateSpreadsheetRows(
  sheet: ParsedSheet,
  mapping: Record<string, string>,
  kind: CatalogKind,
): ImportPreview<CatalogItemImport | StockVariantImport> {
  if (sheet.rows.length > MAX_ROWS) {
    return {
      valid: [],
      issues: [{ row: 0, message: `A single import is limited to ${MAX_ROWS} data rows.` }],
    };
  }

  for (const row of sheet.rows) {
    for (const [header, value] of Object.entries(row)) {
      if (typeof value === "string" && value.length > MAX_CELL_LENGTH) {
        return {
          valid: [],
          issues: [{ row: 0, message: `Column "${header}" contains a value longer than ${MAX_CELL_LENGTH} characters.` }],
        };
      }
    }
  }

  return validateCatalogRows(sheet.rows, mapping, kind);
}

export async function getImportPreview(
  db: Firestore,
  sheet: ParsedSheet,
  mapping: Record<string, string>,
  kind: CatalogKind,
): Promise<CatalogImportPreview> {
  const result = validateSpreadsheetRows(sheet, mapping, kind);
  const collectionName = kind === "items" ? "inventoryItems" : "stockVariants";
  const snapshot = await getDocs(collection(db, collectionName));
  const existingIds = new Set(snapshot.docs.map((entry) => entry.id));

  if (kind === "variants") {
    const importedItems = new Set(
      (await getDocs(collection(db, "inventoryItems"))).docs.map((entry) => entry.id),
    );
    const incomingItemIds = new Set(result.valid.map((record) => (record as StockVariantImport).itemId));
    for (const itemId of incomingItemIds) {
      if (!importedItems.has(itemId)) {
        result.issues.push({ row: 0, message: `Parent item "${itemId}" does not exist in Firestore. Import or create the item first.` });
      }
    }
  } else {
    const existingNames = new Map(
      snapshot.docs.map((entry) => [String(entry.data().name ?? "").trim().toLocaleLowerCase().replace(/\s+/g, " "), entry.id]),
    );
    result.valid.forEach((record, index) => {
      const item = record as CatalogItemImport;
      const existingId = existingNames.get(item.name.trim().toLocaleLowerCase().replace(/\s+/g, " "));
      if (existingId && existingId !== item.id) {
        result.issues.push({
          row: index + 2,
          message: `Item name already exists under ID "${existingId}". Reuse that stable ID or resolve the possible duplicate before importing.`,
        });
      }
    });
  }

  return { kind, valid: result.valid, issues: result.issues, existingIds };
}

export async function commitCatalogImport(
  db: Firestore,
  preview: CatalogImportPreview,
  uid: string,
  sourceFileName: string,
): Promise<void> {
  if (!preview.valid.length) throw new Error("There are no valid rows to import.");
  if (preview.issues.length) throw new Error("Resolve all validation errors before importing.");
  if (preview.valid.length > MAX_ROWS) throw new Error(`A single import is limited to ${MAX_ROWS} data rows.`);

  const batch = writeBatch(db);
  const collectionName = preview.kind === "items" ? "inventoryItems" : "stockVariants";
  const importedAt = new Date();

  preview.valid.forEach((record) => {
    const target = doc(db, collectionName, record.id);
    const created = !preview.existingIds.has(record.id);
    batch.set(target, {
      ...record,
      updatedAt: importedAt,
      updatedBy: uid,
      ...(created ? { createdAt: importedAt, createdBy: uid } : {}),
    }, { merge: true });
  });

  const session = doc(collection(db, "importSessions"));
  batch.set(session, {
    id: session.id,
    type: preview.kind === "items" ? "catalog_items" : "catalog_variants",
    sourceFileName,
    sourceRowCount: preview.valid.length,
    status: "committed",
    createdAt: importedAt,
    createdBy: uid,
    recordIds: preview.valid.map((record) => record.id),
  });

  await batch.commit();
}

export async function exportCatalogCsv(db: Firestore, kind: CatalogKind): Promise<string> {
  const collectionName = kind === "items" ? "inventoryItems" : "stockVariants";
  const snapshot = await getDocs(collection(db, collectionName));
  const fields = kind === "items" ? ITEM_COLUMNS : VARIANT_COLUMNS;
  const records = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
  return [fields.map(csvEscape).join(","), ...records.map((record) => fields.map((field) => csvEscape(record[field])).join(","))].join("\r\n");
}

export async function exportCatalogXlsx(db: Firestore): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "My Grandma's Kitchen";
  workbook.created = new Date();
  for (const kind of ["items", "variants"] as const) {
    const collectionName = kind === "items" ? "inventoryItems" : "stockVariants";
    const fields = kind === "items" ? ITEM_COLUMNS : VARIANT_COLUMNS;
    const snapshot = await getDocs(collection(db, collectionName));
    const records = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    const worksheet = workbook.addWorksheet(kind === "items" ? "Items" : "Stock Variants");
    worksheet.addRow([...fields]);
    worksheet.getRow(1).font = { bold: true };
    records.forEach((record) =>
      worksheet.addRow(fields.map((field) => excelSafeValue(record[field] ?? ""))),
    );
    worksheet.columns.forEach((column) => {
      column.width = Math.min(Math.max(column.header?.length ?? 14, 14), 36);
    });
  }
  const bytes = await workbook.xlsx.writeBuffer();
  return new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export function createTemplateCsv(kind: CatalogKind): string {
  const fields = kind === "items" ? ITEM_COLUMNS : VARIANT_COLUMNS;
  return fields.join(",");
}

export async function createTemplateXlsx(): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const items = workbook.addWorksheet("Items");
  items.addRow([...ITEM_COLUMNS]);
  const variants = workbook.addWorksheet("Stock Variants");
  variants.addRow([...VARIANT_COLUMNS]);
  const bytes = await workbook.xlsx.writeBuffer();
  return new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(csv: string, fileName: string) {
  downloadBlob(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }), fileName);
}

export function inferredMapping(headers: string[], kind: CatalogKind) {
  return defaultColumnMapping(headers, kind);
}
