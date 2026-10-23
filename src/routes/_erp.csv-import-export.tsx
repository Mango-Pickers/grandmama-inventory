import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Icon } from "@/components/erp/icon";
import { CSV_ROWS, EXPORT_ENTITIES, MAPPING_PILLS, SYNC_HISTORY } from "@/data/erp";

export const Route = createFileRoute("/_erp/csv-import-export")({
  head: () => ({
    meta: [
      { title: "CSV Data Hub | Grandma's Kitchen Lagos Ops ERP" },
      {
        name: "description",
        content:
          "Idempotent CSV importer, template generator and multi-entity exporter for inventory ledger records.",
      },
      { property: "og:title", content: "CSV Data Hub | Grandma's Kitchen Lagos Ops ERP" },
      {
        property: "og:description",
        content:
          "Idempotent CSV importer, template generator and multi-entity exporter for inventory ledger records.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CsvHubPage,
});

type TabId = "import" | "export" | "history";

const TABS: { id: TabId; icon: string; label: string; badge?: string }[] = [
  { id: "import", icon: "publish", label: "Import CSV Wizard", badge: "86 Staged" },
  { id: "export", icon: "cloud_download", label: "Export Business Data" },
  { id: "history", icon: "history", label: "Sync History & Audit Log" },
];

function CsvHubPage() {
  const [tab, setTab] = useState<TabId>("import");
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-space-lg px-space-base py-space-lg pb-space-lg sm:px-space-lg lg:px-space-xl">
      <HeaderRow
        templateMenuOpen={templateMenuOpen}
        onToggleTemplateMenu={() => setTemplateMenuOpen((v) => !v)}
        onCloseTemplateMenu={() => setTemplateMenuOpen(false)}
      />

      {/* Tab bar */}
      <div className="flex w-fit flex-wrap items-center gap-space-xs rounded-lg bg-surface-container-low p-space-2xs">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-space-xs rounded px-space-md py-space-xs font-label-md text-label-md transition-colors ${
              tab === t.id
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <Icon name={t.icon} className="text-[18px]" />
            <span>{t.label}</span>
            {t.badge && tab === t.id && (
              <span className="ml-space-2xs rounded-full bg-secondary-fixed px-1.5 py-0.5 font-label-sm text-[10px] text-on-secondary-fixed">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "import" && <ImportWizard />}
      {tab === "export" && <ExportPanel />}
      {tab === "history" && <HistoryPanel />}
    </div>
  );
}

/* ---------------- Title & template downloads ---------------- */

const TEMPLATES = [
  { id: "movement", icon: "table_chart", iconClass: "text-secondary", name: "Stock Movement Template", ext: ".CSV" },
  { id: "catalog", icon: "inventory", iconClass: "text-primary", name: "Master Catalog Template", ext: ".CSV" },
  { id: "audit", icon: "fact_check", iconClass: "text-outline", name: "Physical Audit Template", ext: ".XLSX" },
];

function HeaderRow({
  templateMenuOpen,
  onToggleTemplateMenu,
  onCloseTemplateMenu,
}: {
  templateMenuOpen: boolean;
  onToggleTemplateMenu: () => void;
  onCloseTemplateMenu: () => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-center">
      <div className="flex flex-col">
        <div className="mb-space-2xs flex flex-wrap items-center gap-space-xs">
          <span className="rounded bg-secondary-fixed/50 px-space-xs py-space-2xs font-label-sm text-label-sm uppercase tracking-widest text-secondary">
            ETL Pipeline v2.4
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-outline-variant" />
          <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
            IDEMPOTENCY: SHA-256
          </span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
          CSV Data Hub &amp; Spreadsheet Synchronisation
        </h1>
        <p className="mt-space-2xs max-w-3xl font-body-md text-body-md text-on-surface-variant">
          Idempotent Papa Parse importer, template generator, and multi-entity data exporter for
          inventory ledger records.
        </p>
      </div>

      <div className="flex items-center gap-space-sm self-start lg:self-center">
        <div className="relative">
          <button
            onClick={onToggleTemplateMenu}
            aria-expanded={templateMenuOpen}
            className="flex items-center gap-space-xs rounded bg-surface-container px-space-md py-space-sm font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high"
          >
            <Icon name="download" className="text-[18px] text-primary" />
            <span>Sample Templates</span>
            <Icon name="arrow_drop_down" className="text-[16px] text-outline" />
          </button>
          {templateMenuOpen && (
            <div
              onMouseLeave={onCloseTemplateMenu}
              className="absolute right-0 z-30 mt-space-xs w-64 rounded bg-surface-container-lowest p-space-xs shadow-lg"
            >
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={onCloseTemplateMenu}
                  className="flex w-full items-center justify-between rounded p-space-sm font-label-sm text-label-sm text-on-surface transition-colors hover:bg-surface-container-low"
                >
                  <span className="flex items-center gap-space-xs">
                    <Icon name={t.icon} className={`text-[16px] ${t.iconClass}`} />
                    <span>{t.name}</span>
                  </span>
                  <span className="text-[10px] text-outline uppercase">{t.ext}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="flex items-center gap-space-xs rounded bg-surface-container-low px-space-md py-space-sm font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface">
          <Icon name="help" className="text-[18px]" />
          <span>Field Dictionary</span>
        </button>
      </div>
    </div>
  );
}

/* ---------------- Step indicator ---------------- */

const STEPS = [
  { id: 1, label: "Select File & Entity", state: "done" as const },
  { id: 2, label: "Column Mapping", state: "done" as const },
  { id: 3, label: "Validation & Hashes", state: "active" as const },
  { id: 4, label: "Review & Commit", state: "todo" as const },
];

function StepIndicator() {
  return (
    <div className="flex flex-col justify-between gap-space-base rounded-xl bg-surface-container-lowest p-space-md shadow-sm md:flex-row md:items-center">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex flex-col gap-space-base md:flex-row md:items-center md:flex-1">
          <div
            className={`flex items-center gap-space-sm flex-1 rounded p-space-xs ${
              step.state === "active" ? "bg-surface-container-low" : step.state === "todo" ? "opacity-60" : ""
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-label-md text-label-md font-bold ${
                step.state === "done"
                  ? "bg-primary-fixed-dim text-primary"
                  : step.state === "active"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {step.state === "done" ? <Icon name="done" className="text-[18px]" /> : step.id}
            </div>
            <div className="flex min-w-0 flex-col">
              <span
                className={`font-label-sm text-label-sm uppercase tracking-wider ${
                  step.state === "active"
                    ? "font-bold text-secondary"
                    : step.state === "todo"
                      ? "text-outline"
                      : "text-outline"
                }`}
              >
                {step.state === "active" ? "Active Phase" : `Step ${step.id}`}
              </span>
              <span
                className={`font-label-md text-label-md text-on-surface truncate ${
                  step.state === "active" ? "font-bold" : step.state === "todo" ? "font-medium" : "font-semibold"
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`hidden h-[2px] w-8 shrink-0 md:block ${
                step.state === "done" ? (step.id === 2 ? "bg-primary" : "bg-primary/20") : "bg-surface-variant"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Import wizard ---------------- */

const ENTITIES = [
  "Stock Transactions Ledger (Receipts, Issues, Waste)",
  "Inventory Master Catalog (Ingredients & Packaging)",
  "Physical Count Sheet (Weekly Audit Discrepancies)",
  "Supplier Batch Registry (Fresh Farm Inflow)",
];

function ImportWizard() {
  const [dryRun, setDryRun] = useState(true);
  const [commitState, setCommitState] = useState<"idle" | "done">("idle");

  const runCommit = () => {
    setCommitState("done");
    window.setTimeout(() => setCommitState("idle"), 4000);
  };

  return (
    <div className="flex flex-col gap-space-lg">
      <StepIndicator />

      <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
        {/* Target configuration & dropzone */}
        <div className="flex flex-col gap-space-md lg:col-span-5">
          <div className="flex flex-col gap-space-base rounded-xl bg-surface-container-lowest p-space-base shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Target Entity Ledger
              </span>
              <span className="rounded bg-surface-container-high px-space-xs py-space-2xs font-label-sm text-label-sm text-on-surface-variant">
                Strict Schema
              </span>
            </div>
            <div className="flex flex-col gap-space-2xs">
              <label className="font-label-sm text-label-sm font-semibold uppercase text-on-surface-variant">
                Destination Collection
              </label>
              <div className="relative">
                <select className="w-full cursor-pointer appearance-none rounded bg-surface-container-low px-space-md py-space-sm pr-10 font-label-md text-label-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary">
                  {ENTITIES.map((e, i) => (
                    <option key={e} selected={i === 0}>
                      {e}
                    </option>
                  ))}
                </select>
                <Icon
                  name="expand_more"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-outline"
                />
              </div>
            </div>

            {/* Staged file status */}
            <div className="flex flex-col gap-space-sm rounded-lg bg-surface-container-low p-space-base">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Staged Source File
                </span>
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm font-bold text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary-container" />
                  Papa Parse OK
                </span>
              </div>
              <div className="flex items-center gap-space-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-primary-fixed text-primary">
                  <Icon name="description" className="text-[24px]" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="font-label-md text-label-md truncate font-mono font-semibold text-on-surface">
                    daily_stock_movement_2026-10-24.csv
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    14.2 KB • 86 rows parsed • UTF-8 Enriched
                  </span>
                </div>
                <button
                  title="Remove file"
                  aria-label="Remove staged file"
                  className="p-space-xs text-outline transition-colors hover:text-error"
                >
                  <Icon name="close" className="text-[20px]" />
                </button>
              </div>
              <div className="mt-space-2xs h-1.5 w-full overflow-hidden rounded-full bg-surface-variant">
                <div className="h-full w-full bg-primary transition-all" />
              </div>
              <div className="flex justify-between font-label-sm text-label-sm text-outline">
                <span>Encoding: ISO-8859-1 → UTF-8</span>
                <span>100% Parsed (12ms)</span>
              </div>
            </div>

            {/* Dropzone */}
            <div className="flex cursor-pointer flex-col items-center justify-center gap-space-xs rounded-lg border-2 border-dashed border-outline-variant/60 bg-surface/30 p-space-base text-center transition-colors hover:border-primary/50">
              <Icon name="upload_file" className="text-[32px] text-outline" />
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface font-semibold">
                  Drop alternative CSV or XLSX here
                </span>
                <span className="font-body-sm text-body-sm text-outline">
                  Supports comma, semicolon, tab or pipe delimiters
                </span>
              </div>
            </div>
          </div>

          {/* Idempotency card */}
          <div className="flex items-start gap-space-md rounded-xl bg-primary p-space-base text-on-primary shadow-sm">
            <div className="shrink-0 rounded bg-primary-container p-space-xs text-primary-fixed">
              <Icon name="verified_user" className="text-[24px]" />
            </div>
            <div className="flex flex-col gap-space-2xs">
              <span className="font-label-md text-label-md font-bold tracking-tight text-primary-fixed">
                Idempotency Guarantee Active
              </span>
              <p className="font-body-sm text-body-sm leading-relaxed text-primary-fixed-dim">
                Every row generates a combined deterministic signature:{" "}
                <code className="rounded bg-primary-container px-1 py-0.5 font-mono text-[11px] text-surface-container-lowest">
                  SHA256(refId + itemId + createdAt)
                </code>
                . Duplicate postings are skipped safely on batch write.
              </p>
            </div>
          </div>
        </div>

        {/* Pre-flight audit summary */}
        <div className="flex flex-col gap-space-md lg:col-span-7">
          <div className="flex flex-col gap-space-base rounded-xl bg-surface-container-lowest p-space-base shadow-sm">
            <div className="flex flex-col justify-between gap-space-sm sm:flex-row sm:items-center">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Pre-Flight Audit Summary
                </span>
                <Icon name="info" className="text-[18px] text-outline" />
              </div>
              <button className="flex items-center gap-space-xs self-start rounded bg-error-container px-space-sm py-space-2xs font-label-sm text-label-sm font-semibold text-on-error-container transition-colors hover:bg-error/20 sm:self-auto">
                <Icon name="file_download" className="text-[16px]" />
                <span>Download Rejected Rows (1).csv</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-space-sm sm:grid-cols-4">
              <PreFlightMetric
                label="Total Processed"
                labelClass="text-outline font-semibold"
                value="86"
                valueClass="text-on-surface"
                note="100% of buffer"
                noteClass="text-on-surface-variant"
              />
              <PreFlightMetric
                label="Valid & Ready"
                labelClass="text-primary font-bold"
                value="83"
                valueClass="text-primary"
                note="96.5% yield"
                noteClass="text-primary font-semibold"
              />
              <PreFlightMetric
                label="Duplicated"
                labelClass="text-secondary font-bold"
                value="2"
                valueClass="text-secondary"
                note="Skipped safely"
                noteClass="text-on-secondary-container font-medium"
              />
              <PreFlightMetric
                label="Schema Syntax"
                labelClass="text-error font-bold"
                value="1"
                valueClass="text-error"
                note="Row #42 halted"
                noteClass="text-on-error-container font-medium"
              />
            </div>

            <div className="flex flex-col gap-space-xs">
              <span className="font-label-sm text-label-sm font-semibold uppercase text-on-surface-variant">
                Inspection Log Exceptions
              </span>

              {/* Duplicate exception */}
              <div className="flex flex-col justify-between gap-space-sm rounded-lg bg-secondary-fixed/30 p-space-sm sm:flex-row sm:items-start">
                <div className="flex items-start gap-space-sm">
                  <Icon name="content_copy" className="mt-0.5 text-[20px] text-secondary" />
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-space-xs">
                      <span className="font-label-md text-label-md font-bold text-on-secondary-fixed">
                        Rows #18 &amp; #19: Duplicate Hash Collision
                      </span>
                      <span className="rounded bg-secondary-fixed px-1.5 py-0.5 font-label-sm font-mono text-[10px] text-on-secondary-fixed-variant">
                        TX-2026-10-881
                      </span>
                    </div>
                    <p className="mt-0.5 font-body-sm text-body-sm text-on-secondary-container">
                      An identical stock movement for{" "}
                      <span className="font-semibold text-on-surface">50 KG Egusi Melon Seeds</span>{" "}
                      was already registered at 11:20:04 WAT. Will bypass write.
                    </p>
                  </div>
                </div>
                <span className="shrink-0 self-start rounded bg-surface-container-lowest px-space-xs py-space-2xs font-label-sm text-label-sm font-bold uppercase text-secondary">
                  Auto-Bypassed
                </span>
              </div>

              {/* Hard error exception */}
              <div className="flex flex-col justify-between gap-space-sm rounded-lg bg-error-container/40 p-space-sm sm:flex-row sm:items-start">
                <div className="flex items-start gap-space-sm">
                  <Icon name="warning" className="mt-0.5 text-[20px] text-error" />
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-space-xs">
                      <span className="font-label-md text-label-md font-bold text-on-error-container">
                        Row #42: Missing Required Field Constraint
                      </span>
                      <span className="rounded bg-error-container px-1.5 py-0.5 font-label-sm font-mono text-[10px] text-on-error-container">
                        FIELD: unit
                      </span>
                    </div>
                    <p className="mt-0.5 font-body-sm text-body-sm text-on-error-container">
                      Item{" "}
                      <span className="font-mono font-bold text-on-surface">MGK-PR-018</span> (Smoked
                      Catfish) has quantity <code>24</code> but no valid culinary measure specified.
                    </p>
                  </div>
                </div>
                <button className="shrink-0 self-start rounded bg-surface-container-lowest px-space-xs py-space-2xs font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container">
                  Edit Inline
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schema table */}
      <SchemaTable />

      {/* Sticky operational action footer */}
      <div className="flex flex-col justify-between gap-space-base rounded-xl bg-surface-container-lowest p-space-base shadow-md md:flex-row md:items-center">
        <div className="flex flex-col gap-space-xs sm:flex-row sm:items-center sm:gap-space-base">
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-surface-variant after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-surface-variant after:bg-surface-container-lowest after:transition-all after:content-[''] peer-checked:bg-secondary peer-checked:after:translate-x-full peer-checked:after:border-surface-container-lowest" />
            <span className="ml-3 flex items-center gap-1 font-label-md text-label-md font-semibold text-on-surface">
              Dry Run / Simulation Mode
              <Icon name="help_outline" className="text-[16px] text-outline" />
            </span>
          </label>
          <span className="hidden font-body-sm text-body-sm text-outline sm:inline">
            Ledger mutation will only proceed when unchecked.
          </span>
        </div>
        <div className="flex w-full flex-col gap-space-sm sm:flex-row sm:items-center sm:justify-end md:w-auto">
          <button className="rounded px-space-md py-space-sm font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container">
            Cancel &amp; Re-upload
          </button>
          <button
            onClick={runCommit}
            className={`flex items-center justify-center gap-space-xs rounded px-space-lg py-space-sm font-label-md text-label-md font-semibold shadow-sm transition-all active:scale-[0.99] ${
              dryRun
                ? "bg-primary text-on-primary hover:bg-primary-container"
                : "bg-secondary text-on-secondary hover:bg-secondary-container"
            }`}
          >
            <Icon name={dryRun ? "preview" : "cloud_sync"} className="text-[20px]" />
            <span>
              {dryRun ? "Simulate Batch (Dry Run 83 Records)" : "Commit 83 Records to Live Ledger"}
            </span>
          </button>
        </div>
      </div>
      {commitState === "done" && (
        <div className="flex items-center gap-space-xs rounded-lg bg-primary-fixed px-space-base py-space-sm font-label-md text-label-md text-on-primary-fixed-variant">
          <Icon name="check_circle" className="text-[18px] text-primary" />
          <span>
            {dryRun
              ? "Dry run complete — 83 rows validated, no ledger changes written."
              : "Batch committed — 83 rows written to the ledger."}
          </span>
        </div>
      )}

      {/* Footnote */}
      <div className="flex flex-col items-start justify-between gap-space-xs px-space-xs pb-space-lg font-label-sm text-label-sm text-outline sm:flex-row sm:items-center">
        <div className="flex items-center gap-space-xs">
          <Icon name="bolt" className="text-[16px]" />
          <span>Automatic rollback triggered if network disconnects during 500-item batch write</span>
        </div>
        <div>Grandma's Kitchen Enterprise Ops • Ikeja Storage Cluster</div>
      </div>
    </div>
  );
}

function PreFlightMetric({
  label,
  labelClass,
  value,
  valueClass,
  note,
  noteClass,
}: {
  label: string;
  labelClass: string;
  value: string;
  valueClass: string;
  note: string;
  noteClass: string;
}) {
  return (
    <div className="flex flex-col rounded-lg bg-surface-container-low p-space-sm">
      <span className={`font-label-sm text-label-sm uppercase ${labelClass}`}>{label}</span>
      <span className={`font-numerical-metric text-numerical-metric mt-space-2xs font-bold ${valueClass}`}>
        {value}
      </span>
      <span className={`mt-1 font-label-sm text-label-sm text-[11px] ${noteClass}`}>{note}</span>
    </div>
  );
}

/* ---------------- Schema field resolution table ---------------- */

function SchemaTable() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
      <div className="flex flex-col justify-between gap-space-sm bg-surface-container-low px-space-base py-space-md md:flex-row md:items-center">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-on-primary">
            <Icon name="schema" className="text-[18px]" />
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Schema Field Resolution &amp; Sample Inspection
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Displaying 7 mapped columns with live schema type coercions.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-space-sm">
          <div className="flex items-center gap-space-xs rounded bg-surface-container px-space-sm py-space-2xs font-label-sm text-label-sm text-on-surface">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>All 7 Critical Targets Matched</span>
          </div>
          <button
            title="Reload Schema Mapping"
            aria-label="Reload Schema Mapping"
            className="p-space-xs text-outline transition-colors hover:text-on-surface"
          >
            <Icon name="refresh" className="text-[20px]" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-space-xs overflow-x-auto bg-surface-container-lowest px-space-base py-space-sm font-mono text-[11px]">
        <span className="font-label-sm font-bold uppercase text-outline">Resolved mappings:</span>
        {MAPPING_PILLS.map((p) => (
          <span key={p} className="whitespace-nowrap rounded bg-surface-container px-2 py-0.5 text-on-surface">
            {p}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              <th className="px-space-base py-space-sm">CSV Row</th>
              <th className="px-space-base py-space-sm">Transaction Ref</th>
              <th className="px-space-base py-space-sm">Item Identification</th>
              <th className="px-space-base py-space-sm">Movement Type</th>
              <th className="px-space-base py-space-sm">Quantity &amp; Unit</th>
              <th className="px-space-base py-space-sm">Timestamp (WAT)</th>
              <th className="px-space-base py-space-sm">Operator ID</th>
              <th className="px-space-base py-space-sm text-right">Validation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant/40 font-body-sm text-body-sm text-on-surface">
            {CSV_ROWS.map((r) => (
              <tr key={r.id} className={`transition-colors hover:bg-surface-container-low/50 ${r.rowClass}`}>
                <td className={`px-space-base py-space-sm font-mono ${r.rowNoClass}`}>{r.rowNo}</td>
                <td className={`px-space-base py-space-sm font-mono font-semibold ${r.refClass}`}>{r.ref}</td>
                <td className="px-space-base py-space-sm">
                  <div className="flex flex-col">
                    <span className={`font-medium ${r.itemClass}`}>{r.item}</span>
                    <span className={`font-mono text-[11px] ${r.itemClass ? r.itemClass : "text-outline"}`}>
                      {r.code}
                    </span>
                  </div>
                </td>
                <td className="px-space-base py-space-sm">
                  <span
                    className={`rounded-full px-2 py-0.5 font-label-sm text-[10px] font-bold uppercase ${r.movement.className}`}
                  >
                    {r.movement.label}
                  </span>
                </td>
                <td className="px-space-base py-space-sm font-mono">
                  <span className={`font-bold ${r.qtyClass}`}>{r.qty}</span>
                  <span className={`ml-1 rounded px-1 text-[11px] ${r.unit.className}`}>{r.unit.text}</span>
                </td>
                <td className="px-space-base py-space-sm font-mono text-[11px] text-on-surface-variant">
                  {r.timestamp}
                </td>
                <td className="px-space-base py-space-sm font-mono text-on-surface-variant">{r.operator}</td>
                <td className="px-space-base py-space-sm text-right">
                  <span
                    className={`inline-flex items-center gap-1 font-label-sm text-label-sm font-bold ${r.validation.className}`}
                  >
                    <Icon name={r.validation.icon} className="text-[16px]" />
                    {r.validation.text}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-space-sm bg-surface-container-low px-space-base py-space-sm font-label-sm text-label-sm text-on-surface-variant sm:flex-row">
        <span>Displaying sample rows from 86 parsed file lines (1 to 5 of 86 shown)</span>
        <div className="flex items-center gap-space-sm">
          <span>Sort by: CSV Order (Ascending)</span>
          <div className="flex items-center gap-1">
            <button disabled className="rounded bg-surface-container p-1 text-on-surface opacity-50">
              <Icon name="chevron_left" className="text-[16px]" />
            </button>
            <span className="rounded bg-surface-container-lowest px-2 py-0.5 font-bold text-primary">1</span>
            <button className="rounded bg-surface-container p-1 text-on-surface hover:bg-surface-container-high">
              <Icon name="chevron_right" className="text-[16px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Export panel ---------------- */

function ExportPanel() {
  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-base rounded-xl bg-surface-container-lowest p-space-base shadow-sm">
        <div className="flex flex-col justify-between gap-space-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-space-xs">
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Multi-Entity Export Builder
            </span>
            <span className="rounded bg-surface-container-high px-space-xs py-space-2xs font-label-sm text-label-sm text-on-surface-variant">
              CSV + XLSX
            </span>
          </div>
          <button className="flex items-center gap-space-xs self-start rounded bg-primary px-space-md py-space-sm font-label-md text-label-md text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[0.99] sm:self-auto">
            <Icon name="file_download" className="text-[18px]" />
            <span>Generate Export (2 Entities Selected)</span>
          </button>
        </div>
        <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
          {EXPORT_ENTITIES.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-space-sm rounded-lg bg-surface-container-low p-space-sm"
            >
              <div className="flex items-center gap-space-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-surface-container text-primary">
                  <Icon name={e.icon} className="text-[20px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">{e.name}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">{e.detail}</span>
                </div>
              </div>
              <Icon
                name={e.checked ? "check_box" : "check_box_outline_blank"}
                className={`text-[20px] ${e.checked ? "text-primary" : "text-outline"}`}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-space-xs px-space-xs pb-space-lg font-label-sm text-label-sm text-outline">
        <Icon name="bolt" className="text-[16px]" />
        <span>Exports stream in 5k-row pages and pause automatically if the sheet exceeds cell limits.</span>
      </div>
    </div>
  );
}

/* ---------------- Sync history panel ---------------- */

function HistoryPanel() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
      <div className="flex flex-col justify-between gap-space-sm bg-surface-container-low px-space-base py-space-md md:flex-row md:items-center">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-on-primary">
            <Icon name="history" className="text-[18px]" />
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Sync History &amp; Audit Log
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Every batch write is journaled with its operator, hash set and rollback trail.
            </p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left font-body-sm text-body-sm text-on-surface">
          <thead>
            <tr className="bg-surface-container-low font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              <th className="px-space-base py-space-sm">Sync Ref</th>
              <th className="px-space-base py-space-sm">Source File</th>
              <th className="px-space-base py-space-sm text-right">Rows Written</th>
              <th className="px-space-base py-space-sm">Status</th>
              <th className="px-space-base py-space-sm">When</th>
              <th className="px-space-base py-space-sm">Operator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant/40">
            {SYNC_HISTORY.map((h) => (
              <tr key={h.id} className="transition-colors hover:bg-surface-container-low/50">
                <td className="px-space-base py-space-sm font-mono font-semibold text-primary">{h.ref}</td>
                <td className="px-space-base py-space-sm font-mono text-[12px] text-on-surface-variant">{h.file}</td>
                <td className="px-space-base py-space-sm text-right font-mono font-bold">{h.rows}</td>
                <td className="px-space-base py-space-sm">
                  <span className={`rounded px-2 py-0.5 font-label-sm text-[10px] font-bold uppercase ${h.status.className}`}>
                    {h.status.text}
                  </span>
                </td>
                <td className="px-space-base py-space-sm font-mono text-[11px] text-on-surface-variant">{h.when}</td>
                <td className="px-space-base py-space-sm">{h.by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
