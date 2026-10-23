import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Icon } from "@/components/erp/icon";
import {
  ATTENTION_ROWS,
  LEDGER_EVENTS,
  PRODUCTION_QUOTAS,
  type AttentionTag,
} from "@/data/erp";

export const Route = createFileRoute("/_erp/")({
  head: () => ({
    meta: [
      { title: "Overview | Grandma's Kitchen Lagos Ops ERP" },
      {
        name: "description",
        content:
          "Stock movement and inventory audit dashboard: unit-safe KPIs, floor exceptions, live movement ledger and daily production quotas.",
      },
      { property: "og:title", content: "Overview | Grandma's Kitchen Lagos Ops ERP" },
      {
        property: "og:description",
        content:
          "Stock movement and inventory audit dashboard: unit-safe KPIs, floor exceptions, live movement ledger and daily production quotas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-space-lg px-space-base py-space-lg sm:px-space-lg lg:px-space-xl">
      <DutyHeader />
      <KpiRibbon />
      <MainWorkspace />
      <IntegrityBanner />
    </div>
  );
}

/* ---------------- Duty session & action header ---------------- */

const QUICK_ACTIONS = [
  {
    id: "receive",
    icon: "add_box",
    label: "Receive Stock",
    className: "bg-secondary hover:bg-on-secondary-container text-on-secondary",
    iconClass: "",
  },
  {
    id: "issue",
    icon: "local_shipping",
    label: "Issue to Kitchen",
    className: "bg-primary hover:bg-primary-container text-on-primary",
    iconClass: "",
  },
  {
    id: "count",
    icon: "fact_check",
    label: "Record Count",
    className: "bg-surface-container-lowest hover:bg-surface-container text-on-surface",
    iconClass: "text-outline",
  },
  {
    id: "portion",
    icon: "calculate",
    label: "Portion Conversion",
    className: "bg-surface-container-lowest hover:bg-surface-container text-on-surface",
    iconClass: "text-outline",
  },
];

function DutyHeader() {
  return (
    <div className="flex flex-col justify-between gap-space-md xl:flex-row xl:items-center">
      <div className="flex min-w-0 flex-col gap-space-2xs">
        <div className="flex flex-wrap items-center gap-space-xs font-label-sm text-label-sm text-outline uppercase tracking-wider">
          <span>Home</span>
          <Icon name="chevron_right" className="text-[12px]" />
          <span className="font-semibold text-primary">Overview</span>
          <span className="mx-space-xs text-outline-variant">•</span>
          <span className="flex items-center gap-space-2xs font-semibold text-secondary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
            Morning Prep &amp; Receiving
          </span>
          <span className="text-outline-variant">•</span>
          <span>Africa/Lagos WAT</span>
        </div>
        <div className="mt-space-2xs flex flex-wrap items-center gap-space-sm">
          <span className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Stock Movement &amp; Inventory Audit
          </span>
          <div className="inline-flex items-center gap-space-2xs rounded bg-surface-container px-space-xs py-0.5 font-label-sm text-label-sm text-on-surface-variant">
            <Icon name="cloud_done" className="text-[14px] text-primary-container" />
            <span>Live Master (Synced 1m ago)</span>
          </div>
        </div>
      </div>

      {/* Quick action controls */}
      <div className="flex flex-wrap items-center gap-space-xs">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.id}
            className={`flex items-center gap-space-2xs rounded px-space-sm py-space-xs font-label-md text-label-md shadow-sm transition-all active:scale-[0.98] ${a.className}`}
          >
            <Icon name={a.icon} className={`text-[16px] ${a.iconClass}`} />
            <span>{a.label}</span>
          </button>
        ))}
        <button
          title="Download Daily Snapshot CSV"
          aria-label="Download Daily Snapshot CSV"
          className="rounded bg-surface-container-lowest p-space-xs text-on-surface shadow-sm transition-colors hover:bg-surface-container"
        >
          <Icon name="download" className="text-[18px]" />
        </button>
      </div>
    </div>
  );
}

/* ---------------- KPI ribbon ---------------- */

function KpiCard({
  label,
  labelClass = "text-outline",
  tag,
  tagClass = "bg-surface-container text-primary",
  title,
  value,
  valueClass = "text-primary",
  suffix,
  blurClass,
  footer,
}: {
  label: string;
  labelClass?: string;
  tag: string;
  tagClass?: string;
  title: string;
  value: string;
  valueClass?: string;
  suffix: string;
  blurClass?: string;
  footer: React.ReactNode;
}) {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest p-space-base shadow-sm transition-shadow hover:shadow-md">
      {blurClass && (
        <div
          className={`pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full blur-xl ${blurClass}`}
        />
      )}
      <div>
        <div className="flex items-center justify-between gap-space-xs">
          <span className={`font-label-sm text-label-sm uppercase tracking-wider ${labelClass}`}>
            {label}
          </span>
          <span className={`rounded px-space-xs py-0.5 font-label-sm text-label-sm ${tagClass}`}>
            {tag}
          </span>
        </div>
        <span className="font-headline-sm font-body-md text-on-surface mt-space-2xs block font-semibold">
          {title}
        </span>
        <div className="mt-space-sm flex items-baseline gap-space-2xs">
          <span className={`font-numerical-metric text-display-lg tracking-tight ${valueClass}`}>
            {value}
          </span>
          <span className="font-label-md text-label-md text-outline uppercase">{suffix}</span>
        </div>
      </div>
      <div className="mt-space-md flex items-center justify-between pt-space-xs font-label-sm text-label-sm text-on-surface-variant">
        {footer}
      </div>
    </div>
  );
}

function KpiRibbon() {
  return (
    <div className="grid grid-cols-1 gap-space-base md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <KpiCard
        label="Unit: Kilograms (KG)"
        tag="Raw Bulk"
        blurClass="bg-primary/5"
        title="Raw Meats & Poultry"
        value="142.5"
        suffix="kg"
        footer={
          <>
            <span className="flex items-center gap-space-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-surface-tint" />
              4 Batches Active
            </span>
            <span className="font-bold text-secondary">1 Reorder Alert</span>
          </>
        }
      />
      <KpiCard
        label="Unit: Litres (L)"
        tag="Hot Kitchen"
        blurClass="bg-secondary/5"
        title="Prepped Soups"
        value="84.0"
        suffix="L"
        footer={
          <>
            <span>32 Containers</span>
            <span className="font-semibold text-primary">4 Active Pots</span>
          </>
        }
      />
      <KpiCard
        label="Unit: Count (PCS)"
        tag="Portioned"
        title="Poultry Pieces"
        value="188"
        suffix="pcs"
        footer={
          <>
            <span>Carcass Parsed</span>
            <span className="font-semibold text-surface-tint">Locked Ledger</span>
          </>
        }
      />
      <KpiCard
        label="Unit: Units (BOWLS)"
        tag="Containers"
        title="Packaging Bowls"
        value="460"
        suffix="bowls"
        footer={
          <>
            <span>1.5L / 3L / 4L Mix</span>
            <span className="font-semibold text-surface-tint">Rule Compliant</span>
          </>
        }
      />
      <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest p-space-base shadow-sm transition-shadow hover:shadow-md">
        <div className="absolute top-0 right-0 left-0 h-1 bg-secondary" />
        <div>
          <div className="flex items-center justify-between gap-space-xs">
            <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">
              Audit Exception
            </span>
            <span className="rounded bg-secondary-fixed px-space-xs py-0.5 font-label-sm text-label-sm font-bold text-on-secondary-fixed">
              Priority
            </span>
          </div>
          <span className="font-headline-sm font-body-md text-on-surface mt-space-2xs block font-semibold">
            Active Discrepancies
          </span>
          <div className="mt-space-sm flex items-baseline gap-space-2xs">
            <span className="font-numerical-metric text-display-lg tracking-tight text-secondary">
              2
            </span>
            <span className="font-label-md text-label-md font-semibold text-secondary">Flagged</span>
          </div>
        </div>
        <div className="mt-space-md truncate pt-space-xs font-label-sm text-label-sm text-on-secondary-container">
          Goat meat: -3.5kg variance
        </div>
      </div>
      <KpiCard
        label="Sensory & Temp"
        tag="Inspection"
        tagClass="bg-surface-container-high text-primary"
        title="QA Inspections"
        value="3"
        suffix="Batches"
        footer={
          <>
            <span>Due within 24h</span>
            <span className="font-semibold text-secondary">Cold Chain</span>
          </>
        }
      />
    </div>
  );
}

/* ---------------- Main workspace: exceptions table + ledger ---------------- */

const ATTENTION_TABS: { id: "all" | AttentionTag; label: string }[] = [
  { id: "all", label: "All Attention (5)" },
  { id: "low-stock", label: "Low Stock" },
  { id: "discrepancy", label: "Discrepancy" },
  { id: "expiring", label: "Expiring" },
];

function MainWorkspace() {
  const [tab, setTab] = useState<"all" | AttentionTag>("all");
  const rows = tab === "all" ? ATTENTION_ROWS : ATTENTION_ROWS.filter((r) => r.tags.includes(tab));

  return (
    <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
      {/* Left column: floor attention table */}
      <div className="flex flex-col gap-space-base rounded-xl bg-surface-container-lowest p-space-base shadow-sm lg:col-span-8">
        <div className="flex flex-col justify-between gap-space-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-space-2xs">
            <Icon name="warning_amber" className="text-[20px] text-secondary" />
            <span className="font-headline-sm text-headline-sm text-primary">
              Floor Exceptions &amp; Attention Queue
            </span>
          </div>
          <div className="flex items-center gap-space-2xs overflow-x-auto rounded-lg bg-surface-container p-0.5">
            {ATTENTION_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`whitespace-nowrap rounded px-space-sm py-1 font-label-sm text-label-sm transition-colors ${
                  tab === t.id
                    ? "bg-surface-container-lowest font-bold text-primary shadow-xs"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left font-body-sm text-body-sm">
            <thead>
              <tr className="bg-surface-container-low font-label-sm text-label-sm text-outline uppercase tracking-wider">
                <th className="px-space-sm py-space-xs">Item &amp; Category</th>
                <th className="px-space-sm py-space-xs">Location</th>
                <th className="px-space-sm py-space-xs text-right">Ledger Balance</th>
                <th className="px-space-sm py-space-xs text-right">Reorder Min</th>
                <th className="px-space-sm py-space-xs">Risk Assessment</th>
                <th className="px-space-sm py-space-xs text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={`transition-colors hover:bg-surface-container-low/60 ${row.rowClass}`}
                >
                  <td className="px-space-sm py-space-sm">
                    <div className="flex items-center gap-space-sm">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-surface-container text-primary">
                        <Icon name={row.icon} className="text-[20px]" />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                          {row.name}
                        </span>
                        <span className="font-body-sm text-body-sm text-outline text-[11px]">
                          {row.sub}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-space-sm py-space-sm font-label-sm text-label-sm text-on-surface-variant">
                    {row.location}
                  </td>
                  <td className="px-space-sm py-space-sm text-right">
                    <span className={`font-numerical-metric font-label-lg font-bold ${row.balanceClass}`}>
                      {row.balance}
                    </span>
                    <span className="font-label-sm text-label-sm text-outline"> {row.balanceUnit}</span>
                  </td>
                  <td className="px-space-sm py-space-sm text-right font-label-md text-label-md text-outline">
                    {row.reorder}
                  </td>
                  <td className="px-space-sm py-space-sm">
                    <span
                      className={`inline-flex items-center gap-space-2xs rounded px-space-xs py-0.5 font-label-sm text-label-sm font-semibold ${row.badge.className}`}
                    >
                      <Icon name={row.badge.icon} className="text-[12px]" />
                      <span>{row.badge.text}</span>
                    </span>
                  </td>
                  <td className="px-space-sm py-space-sm text-right">
                    <button
                      className={`rounded px-space-sm py-space-2xs font-label-sm text-label-sm shadow-xs transition-all ${row.actionClass}`}
                    >
                      {row.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Discrepancy scale alert callout */}
        <div className="flex flex-col gap-space-sm rounded-lg bg-surface-container-low p-space-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-space-sm sm:items-center">
            <Icon name="balance" className="text-[22px] text-secondary" />
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface font-semibold">
                Scale Calibration Warning: Cold Room A
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                Variance of -3.5kg logged on Goat meat during morning scale cross-check.
                Dual-signoff required before reconciliation.
              </span>
            </div>
          </div>
          <button className="shrink-0 rounded bg-surface-container-lowest px-space-sm py-1 font-label-sm text-label-sm font-bold text-primary shadow-xs transition-colors hover:bg-surface-container-high">
            Open Audit Trail
          </button>
        </div>
      </div>

      {/* Right column: movement ledger + production quotas */}
      <div className="flex flex-col gap-space-base lg:col-span-4">
        <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-base shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <Icon name="swap_horiz" className="text-[20px] text-primary" />
              <span className="font-headline-sm text-headline-sm text-primary">
                Today's Movement Ledger
              </span>
            </div>
            <span className="rounded bg-surface-container px-space-xs py-0.5 font-label-sm text-label-sm text-outline">
              Unit Strict
            </span>
          </div>

          <div className="relative flex flex-col gap-space-md pl-space-xs">
            <div className="pointer-events-none absolute bottom-2 left-[11px] top-2 w-0.5 bg-surface-container-high" />
            {LEDGER_EVENTS.map((e) => (
              <div key={e.id} className="relative flex items-start gap-space-sm">
                <div
                  className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full shadow-xs ${e.circleClass}`}
                >
                  <Icon name={e.icon} className="text-[14px]" />
                </div>
                <div className="flex w-full min-w-0 flex-col rounded-lg bg-surface-container-low p-space-xs">
                  <div className="flex items-center justify-between gap-space-xs">
                    <span className={`font-label-sm text-label-sm font-bold uppercase ${e.labelClass}`}>
                      {e.label}
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">{e.time}</span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface mt-0.5 font-semibold">
                    {e.headline}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                    {e.detail}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-space-2xs w-full rounded bg-surface-container py-space-xs text-center font-label-sm text-label-sm font-bold text-primary transition-colors hover:bg-surface-container-high">
            View Complete Transaction Ledger (62 Events)
          </button>
        </div>

        {/* Kitchen batch status visualizer */}
        <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-lowest p-space-base shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-headline-sm text-headline-sm text-primary">
              Daily Production Quotas
            </span>
            <span className="font-label-sm text-label-sm text-outline">Hot Kitchen Shift 1</span>
          </div>
          <div className="mt-space-2xs flex flex-col gap-space-sm">
            {PRODUCTION_QUOTAS.map((q) => (
              <div key={q.id}>
                <div className="mb-1 flex items-center justify-between font-label-sm text-label-sm">
                  <span className="font-semibold text-on-surface">{q.label}</span>
                  <span className={`font-bold ${q.textClass}`}>{q.progressText}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                  <div className={`h-full rounded-full ${q.barClass}`} style={{ width: `${q.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Integrity banner ---------------- */

function IntegrityBanner() {
  return (
    <div className="flex flex-col justify-between gap-space-md rounded-xl bg-primary p-space-base text-on-primary shadow-md md:flex-row md:items-center">
      <div className="flex items-start gap-space-base md:items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container">
          <Icon name="security" className="text-[24px] text-primary-fixed" />
        </div>
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-space-xs">
            <span className="font-headline-sm font-body-md text-on-primary font-bold">
              Operational Data Integrity Guard
            </span>
            <span className="rounded bg-primary-container px-space-xs py-0.5 font-label-sm text-label-sm text-primary-fixed uppercase">
              Active Rule Engine
            </span>
          </div>
          <span className="mt-0.5 font-body-sm text-body-sm text-primary-fixed-dim text-[12px]">
            Master Ledger • Security Rules Enforced (Zero unapproved issues allowed) • Pipeline: 0
            pending writes, 0 conflicts.
          </span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-space-sm sm:flex-row sm:items-center sm:justify-end md:w-auto">
        <button className="flex items-center justify-center gap-space-2xs rounded bg-primary-container px-space-sm py-space-xs font-label-sm text-label-sm font-semibold text-on-primary transition-colors hover:bg-surface-tint">
          <Icon name="refresh" className="text-[16px]" />
          <span>Force Sync</span>
        </button>
        <button className="flex items-center justify-center gap-space-2xs rounded bg-surface-container-lowest px-space-sm py-space-xs font-label-sm text-label-sm font-bold text-primary shadow-xs transition-colors hover:bg-surface-container-low">
          <Icon name="file_download" className="text-[16px]" />
          <span>Export Daily Snapshot (CSV)</span>
        </button>
      </div>
    </div>
  );
}
