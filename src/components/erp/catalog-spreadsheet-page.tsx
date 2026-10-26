import { useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Icon } from "@/components/erp/icon";
import {
  ITEM_COLUMNS,
  csvEscape,
  type CatalogKind,
  type ImportPreview,
  VARIANT_COLUMNS,
} from "@/lib/catalog-import";
import {
  commitCatalogImport,
  createTemplateCsv,
  createTemplateXlsx,
  downloadBlob,
  downloadCsv,
  exportCatalogCsv,
  exportCatalogXlsx,
  getImportPreview,
  inferredMapping,
  parseSpreadsheet,
  type CatalogImportPreview,
  type ParsedSheet,
  type ParsedSpreadsheet,
  validateSpreadsheetRows,
} from "@/lib/catalog-spreadsheet";
import type { Firestore } from "firebase/firestore";

const FIELD_LABELS: Record<string, string> = {
  id: "Stable ID",
  name: "Item name",
  category: "Category",
  status: "Active/archive status",
  processingEnabled: "Processing enabled",
  confirmationStatus: "Confirmation status",
  sourceLabel: "Source label",
  confirmationNote: "Confirmation note",
  itemId: "Parent item ID",
  processingState: "Processing state",
  stockForm: "Stock form",
  portionSizeLabel: "Portion-size label",
  balanceUnit: "Balance unit",
  active: "Active",
};

export function CatalogSpreadsheetPage() {
  const { role, user } = useAuth();
  const canImport = role !== null;
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"import" | "export">("import");
  const [kind, setKind] = useState<CatalogKind>("items");
  const [fileName, setFileName] = useState("");
  const [workbook, setWorkbook] = useState<ParsedSpreadsheet | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<CatalogImportPreview | null>(null);
  const [localPreview, setLocalPreview] = useState<ImportPreview<unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sheet = useMemo(
    () => workbook?.sheets.find((candidate) => candidate.name === sheetName) ?? null,
    [sheetName, workbook],
  );
  const fields = kind === "items" ? ITEM_COLUMNS : VARIANT_COLUMNS;

  function resetPreview() {
    setPreview(null);
    setLocalPreview(null);
    setMessage(null);
    setError(null);
  }

  async function onFileSelected(file?: File) {
    resetPreview();
    if (!file) return;
    setBusy(true);
    setFileName(file.name);
    try {
      const parsed = await parseSpreadsheet(file);
      if (!parsed.sheets.length) throw new Error("The file does not contain a readable worksheet.");
      setWorkbook(parsed);
      setSheetName(parsed.sheets[0]?.name ?? "");
      setMapping(inferredMapping(parsed.sheets[0]?.headers ?? [], kind));
    } catch (cause) {
      setWorkbook(null);
      setFileName("");
      setError(cause instanceof Error ? cause.message : "Could not read this file.");
    } finally {
      setBusy(false);
    }
  }

  function changeKind(nextKind: CatalogKind) {
    setKind(nextKind);
    resetPreview();
    setMapping(inferredMapping(sheet?.headers ?? [], nextKind));
  }

  function changeSheet(nextName: string) {
    setSheetName(nextName);
    const nextSheet = workbook?.sheets.find((candidate) => candidate.name === nextName);
    setMapping(inferredMapping(nextSheet?.headers ?? [], kind));
    resetPreview();
  }

  async function runValidation() {
    resetPreview();
    if (!sheet) return;
    setBusy(true);
    try {
      const result = validateSpreadsheetRows(sheet, mapping, kind);
      setLocalPreview(result);
      if (!result.valid.length || result.issues.length) return;

      const { db, firebaseConfigError } = await import("@/lib/firebase");
      if (!db || firebaseConfigError) throw new Error(firebaseConfigError ?? "Cloud Firestore is unavailable.");
      const firestorePreview = await getImportPreview(db, sheet, mapping, kind);
      setPreview(firestorePreview);
      setLocalPreview(firestorePreview);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not validate the import against Firestore.");
    } finally {
      setBusy(false);
    }
  }

  async function commitImport() {
    if (!preview || !user || !canImport) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { db } = await import("@/lib/firebase");
      if (!db) throw new Error("Cloud Firestore is unavailable.");
      await commitCatalogImport(db, preview, user.uid, fileName);
      setMessage(`${preview.valid.length} ${kind === "items" ? "item" : "variant"} records imported. Existing IDs were updated; stock balances were not changed.`);
      setPreview(null);
      setLocalPreview(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Import failed. No success was reported.");
    } finally {
      setBusy(false);
    }
  }

  async function exportCsv(exportKind: CatalogKind) {
    setBusy(true);
    setError(null);
    try {
      const { db } = await import("@/lib/firebase");
      if (!db) throw new Error("Cloud Firestore is unavailable.");
      const csv = await exportCatalogCsv(db, exportKind);
      downloadCsv(csv, `my-grandmama-kitchen-${exportKind}.csv`);
      setMessage(`${exportKind === "items" ? "Item catalogue" : "Stock variants"} CSV downloaded.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "CSV export failed.");
    } finally {
      setBusy(false);
    }
  }

  async function exportXlsx() {
    setBusy(true);
    setError(null);
    try {
      const { db } = await import("@/lib/firebase");
      if (!db) throw new Error("Cloud Firestore is unavailable.");
      const blob = await exportCatalogXlsx(db);
      downloadBlob(blob, "my-grandmama-kitchen-catalogue.xlsx");
      setMessage("Items and stock variants XLSX workbook downloaded.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "XLSX export failed.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadTemplateXlsx() {
    const blob = await createTemplateXlsx();
    downloadBlob(blob, "my-grandmama-kitchen-catalogue-template.xlsx");
  }

  function downloadErrors() {
    if (!localPreview?.issues.length) return;
    const rows = ["sourceRow,message", ...localPreview.issues.map((issue) => `${csvEscape(issue.row)},${csvEscape(issue.message)}`)];
    downloadCsv(rows.join("\r\n"), "catalog-import-errors.csv");
  }

  const existingCount = preview?.valid.filter((record) => preview.existingIds.has(record.id)).length ?? 0;
  const newCount = preview ? preview.valid.length - existingCount : 0;

  return (
    <div className="mx-auto flex w-full max-w-360 min-w-0 flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-secondary">Catalogue data tools</p>
          <h1 className="mt-1 text-2xl font-bold text-primary">CSV and Excel</h1>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
            Import and export the Firestore item catalogue and stock variants. This workflow never writes quantities or stock movements.
          </p>
        </div>
        <div className="flex gap-2 self-start rounded-lg bg-surface-container p-1" role="tablist" aria-label="Spreadsheet actions">
          {(["import", "export"] as const).map((value) => (
            <button
              aria-selected={tab === value}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${tab === value ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant"}`}
              key={value}
              onClick={() => { setTab(value); resetPreview(); }}
              role="tab"
              type="button"
            >
              {value === "import" ? "Import" : "Export"}
            </button>
          ))}
        </div>
      </header>

      {error && <p className="rounded-lg border border-error/30 bg-error-container/50 p-3 text-sm text-on-error-container" role="alert">{error}</p>}
      {message && <p className="rounded-lg border border-primary/20 bg-muted p-3 text-sm text-on-surface" role="status">{message}</p>}

      {tab === "import" ? (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
          <div className="flex flex-col gap-5 rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
            <div className="flex flex-wrap items-end gap-4">
              <label className="flex min-w-48 flex-1 flex-col gap-1.5 text-sm font-medium">
                Record type
                <select className="rounded-md border border-outline-variant bg-surface px-3 py-2.5" value={kind} onChange={(event) => changeKind(event.target.value as CatalogKind)}>
                  <option value="items">Items</option>
                  <option value="variants">Stock variants</option>
                </select>
              </label>
              <button className="inline-flex items-center gap-2 rounded-md border border-outline-variant px-3 py-2.5 text-sm font-semibold text-primary hover:bg-surface-container" onClick={() => inputRef.current?.click()} type="button">
                <Icon name="upload_file" /> Choose CSV / XLSX
              </button>
              <input accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(event) => void onFileSelected(event.target.files?.[0])} ref={inputRef} type="file" />
            </div>

            <div className="rounded-md bg-surface-container-low p-4 text-sm text-on-surface-variant">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-on-surface">{fileName || "No file selected"}</span>
                <span>UTF-8 CSV or XLSX · max 5 MB · max 400 rows</span>
              </div>
              <p className="mt-2">Legacy XLS, formulas, stock balances, and transaction imports are not supported in this catalogue workflow.</p>
            </div>

            {workbook && workbook.sheets.length > 1 && (
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Worksheet
                <select className="rounded-md border border-outline-variant bg-surface px-3 py-2.5" value={sheetName} onChange={(event) => changeSheet(event.target.value)}>
                  {workbook.sheets.map((entry) => <option key={entry.name} value={entry.name}>{entry.name}</option>)}
                </select>
              </label>
            )}

            {sheet && (
              <div className="flex flex-col gap-3">
                <div>
                  <h2 className="font-semibold text-on-surface">Map columns</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">Headers matching the target field names are mapped automatically. Review every required field.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {fields.map((field) => (
                    <label className="flex flex-col gap-1 text-sm" key={field}>
                      <span className="font-medium text-on-surface">{FIELD_LABELS[field] ?? field}</span>
                      <select className="rounded-md border border-outline-variant bg-surface px-2.5 py-2" value={mapping[field] ?? ""} onChange={(event) => { setMapping((current) => ({ ...current, [field]: event.target.value })); resetPreview(); }}>
                        <option value="">Not mapped</option>
                        {sheet.headers.map((header) => <option key={header} value={header}>{header}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                <button className="self-start rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-container disabled:opacity-50" disabled={busy || !sheet.rows.length} onClick={() => void runValidation()} type="button">
                  {busy ? "Validating..." : "Validate and preview"}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
            <div>
              <h2 className="font-semibold text-on-surface">Templates</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Use stable IDs. Re-importing an ID updates that catalogue record.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-md border border-outline-variant px-3 py-2 text-sm font-medium hover:bg-surface-container" onClick={() => downloadCsv(createTemplateCsv("items"), "items-template.csv")} type="button">Items CSV</button>
              <button className="rounded-md border border-outline-variant px-3 py-2 text-sm font-medium hover:bg-surface-container" onClick={() => downloadCsv(createTemplateCsv("variants"), "stock-variants-template.csv")} type="button">Variants CSV</button>
              <button className="rounded-md border border-outline-variant px-3 py-2 text-sm font-medium hover:bg-surface-container" onClick={() => void downloadTemplateXlsx()} type="button">Excel template</button>
            </div>
            <div className="border-t border-outline-variant pt-4">
              <h3 className="text-sm font-semibold text-on-surface">Import rules</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-on-surface-variant">
                <li>Unknown variant parent IDs are rejected.</li>
                <li>Duplicate IDs within a file are row errors.</li>
                <li>Existing IDs are shown as updates before commit.</li>
                <li>All valid rows and the import session commit atomically.</li>
                <li>All four approved staff accounts can write catalogue imports.</li>
              </ul>
            </div>
          </div>

          {localPreview && (
            <div className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-5 lg:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-on-surface">Import preview</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {localPreview.valid.length} valid · {newCount} new · {existingCount} updates · {localPreview.issues.length} errors
                  </p>
                </div>
                <div className="flex gap-2">
                  {localPreview.issues.length > 0 && <button className="rounded-md border border-outline-variant px-3 py-2 text-sm font-medium" onClick={downloadErrors} type="button">Download errors</button>}
                  <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50" disabled={!preview || !canImport || busy} onClick={() => void commitImport()} type="button">
                    {busy ? "Saving..." : canImport ? `Confirm import (${preview?.valid.length ?? 0})` : "Sign in with an approved account"}
                  </button>
                </div>
              </div>
              <div className="space-y-2 sm:hidden">
                {localPreview.valid.slice(0, 20).map((record, index) => (
                  <article className="min-w-0 rounded-md border border-outline-variant p-3" key={`mobile-${record.id}-${index}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="text-xs text-on-surface-variant">Source row {index + 2}</span>
                      <span className="rounded bg-muted px-2 py-1 text-xs font-semibold text-primary">{preview?.existingIds.has(record.id) ? "Update" : "Create"}</span>
                    </div>
                    <p className="mt-1 break-all font-mono text-sm font-semibold">{record.id}</p>
                    <dl className="mt-3 grid grid-cols-1 gap-2 text-xs">
                      {Object.entries(record).filter(([key]) => key !== "id").slice(0, 5).map(([key, value]) => (
                        <div className="min-w-0" key={key}><dt className="text-on-surface-variant">{FIELD_LABELS[key] ?? key}</dt><dd className="mt-0.5 wrap-break-word text-on-surface">{String(value) || "Not provided"}</dd></div>
                      ))}
                    </dl>
                  </article>
                ))}
              </div>
              <div aria-label="Import preview table; scroll horizontally to view columns" className="hidden max-w-full overflow-x-auto rounded-md border border-outline-variant sm:block" role="region" tabIndex={0}>
                <table className="w-full min-w-170 text-left text-sm">
                  <thead className="bg-surface-container text-on-surface-variant"><tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">ID</th><th className="px-3 py-2">Record preview</th><th className="px-3 py-2">Result</th></tr></thead>
                  <tbody>
                    {localPreview.valid.slice(0, 20).map((record, index) => (
                      <tr className="border-t border-outline-variant" key={`${record.id}-${index}`}>
                        <td className="px-3 py-2">{index + 2}</td>
                        <td className="px-3 py-2 font-mono">{record.id}</td>
                        <td className="px-3 py-2">{Object.entries(record).filter(([key]) => key !== "id").slice(0, 4).map(([key, value]) => `${FIELD_LABELS[key] ?? key}: ${String(value)}`).join(" · ")}</td>
                        <td className="px-3 py-2">{preview?.existingIds.has(record.id) ? "Update" : "Create"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {localPreview.valid.length > 20 && <p className="text-xs text-on-surface-variant">Showing first 20 valid rows; {localPreview.valid.length - 20} more will be included.</p>}
              {localPreview.issues.length > 0 && (
                <div className="max-h-44 overflow-auto rounded-md bg-error-container/40 p-3 text-sm text-on-error-container">
                  {localPreview.issues.map((issue, index) => <p key={`${issue.row}-${index}`}>Row {issue.row || "-"}: {issue.message}</p>)}
                </div>
              )}
              {localPreview.issues.length > 0 && <p className="text-sm font-medium text-error">Resolve all errors before importing.</p>}
            </div>
          )}
        </section>
      ) : (
        <section className="flex flex-col gap-5 rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
          <div>
            <h2 className="font-semibold text-on-surface">Export catalogue</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Exports query all Firestore documents in the selected catalogue, not only the current screen.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-md border border-outline-variant px-4 py-3 text-sm font-semibold hover:bg-surface-container disabled:opacity-50" disabled={busy} onClick={() => void exportCsv("items")} type="button"><Icon name="download" />Items CSV</button>
            <button className="inline-flex items-center gap-2 rounded-md border border-outline-variant px-4 py-3 text-sm font-semibold hover:bg-surface-container disabled:opacity-50" disabled={busy} onClick={() => void exportCsv("variants")} type="button"><Icon name="download" />Variants CSV</button>
            <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-on-primary hover:bg-primary-container disabled:opacity-50" disabled={busy} onClick={() => void exportXlsx()} type="button"><Icon name="download" />Catalogue Excel workbook</button>
          </div>
          <p className="text-xs text-on-surface-variant">Formats supported for import: UTF-8 CSV and XLSX. Legacy XLS and formula cells are rejected. Spreadsheet free text is escaped against formula injection on CSV export.</p>
        </section>
      )}
    </div>
  );
}
