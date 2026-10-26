import { useCallback, useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/erp/icon";
import { calculateBalances, loadCatalogue, loadPostedMovements, type InventoryItemRecord, type PostedMovement, type StockVariantRecord } from "@/lib/inventory-service";

function dateInLagos() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

function quoteCsv(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function downloadCsv(rows: unknown[][], filename: string) {
  const content = rows.map((row) => row.map(quoteCsv).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function StockActivityPage() {
  const [items, setItems] = useState<InventoryItemRecord[]>([]);
  const [variants, setVariants] = useState<StockVariantRecord[]>([]);
  const [movements, setMovements] = useState<PostedMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(dateInLagos);
  const [endDate, setEndDate] = useState(dateInLagos);
  const [search, setSearch] = useState("");
  const [movementType, setMovementType] = useState("all");
  const [view, setView] = useState<"activity" | "summary">("activity");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { db } = await import("@/lib/firebase");
      if (!db) throw new Error("Cloud Firestore is unavailable.");
      const [catalogue, ledger] = await Promise.all([loadCatalogue(db), loadPostedMovements(db)]);
      setItems(catalogue.items);
      setVariants(catalogue.variants);
      setMovements(ledger);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load stock activity.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    const from = startDate ? new Date(`${startDate}T00:00:00+01:00`).getTime() : -Infinity;
    const to = endDate ? new Date(`${endDate}T23:59:59.999+01:00`).getTime() : Infinity;
    return movements.filter((movement) => {
      const effective = movement.effectiveAt.toMillis();
      const item = items.find((record) => record.id === movement.itemId);
      return effective >= from && effective <= to
        && (movementType === "all" || movement.type === movementType)
        && `${item?.name ?? ""} ${movement.reference} ${movement.reason} ${movement.type}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
    }).sort((a, b) => b.effectiveAt.toMillis() - a.effectiveAt.toMillis());
  }, [endDate, items, movementType, movements, search, startDate]);

  const balances = useMemo(() => calculateBalances(movements), [movements]);

  return <div className="mx-auto flex w-full max-w-360 min-w-0 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-wider text-secondary">Operations core</p><h1 className="mt-1 text-2xl font-bold text-primary sm:text-3xl">Stock Activity</h1><p className="mt-1 text-sm text-on-surface-variant">One shared ledger. Balances always include every posted movement type.</p></div><div className="flex flex-wrap gap-2"><button className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary" onClick={() => { setStartDate(dateInLagos()); setEndDate(dateInLagos()); setView("activity"); }} type="button">Run Daily Report</button><button className="min-h-11 rounded-md border border-outline-variant px-4 text-sm font-semibold" onClick={() => downloadCsv([["id", "effectiveAt", "type", "itemId", "variantId", "locationId", "quantity", "signedQuantity", "unit", "reason", "reference"], ...filtered.map((row) => [row.id, row.effectiveAt.toDate().toISOString(), row.type, row.itemId, row.variantId, row.locationId, row.quantity, row.signedQuantity, row.unit, row.reason, row.reference])], "my-grandmama-kitchen-stock-activity.csv")} type="button">Export CSV</button></div></header>
    {error && <p className="rounded-md border border-error/30 bg-error-container/50 p-3 text-sm text-on-error-container" role="alert">{error}<button className="ml-3 underline" onClick={() => void refresh()} type="button">Retry</button></p>}
    <section className="grid min-w-0 gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="flex flex-col gap-1 text-sm font-medium">From · Africa/Lagos<input className="min-h-11 rounded border border-outline-variant px-3 text-base" onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} /></label>
      <label className="flex flex-col gap-1 text-sm font-medium">To · Africa/Lagos<input className="min-h-11 rounded border border-outline-variant px-3 text-base" onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} /></label>
      <label className="flex flex-col gap-1 text-sm font-medium">Activity type<select className="min-h-11 rounded border border-outline-variant px-3 text-base" onChange={(event) => setMovementType(event.target.value)} value={movementType}><option value="all">All types</option>{[...new Set(movements.map((movement) => movement.type))].sort().map((type) => <option key={type}>{type}</option>)}</select></label>
      <label className="flex flex-col gap-1 text-sm font-medium">Search<input className="min-h-11 rounded border border-outline-variant px-3 text-base" onChange={(event) => setSearch(event.target.value)} placeholder="Item, reason, reference" value={search} /></label>
    </section>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-1 rounded-md bg-surface-container p-1"><button aria-pressed={view === "activity"} className={`min-h-10 rounded px-3 text-sm font-medium ${view === "activity" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant"}`} onClick={() => setView("activity")} type="button">Activity</button><button aria-pressed={view === "summary"} className={`min-h-10 rounded px-3 text-sm font-medium ${view === "summary" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant"}`} onClick={() => setView("summary")} type="button">Stock Summary</button></div><p className="text-sm text-on-surface-variant">{loading ? "Loading..." : `${view === "activity" ? filtered.length : balances.length} records · ${startDate || "All dates"} to ${endDate || "All dates"} · WAT`}</p></div>
    <section className="min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 sm:p-5">{loading ? <p className="py-10 text-center text-sm text-on-surface-variant">Loading ledger...</p> : view === "activity" ? filtered.length ? <div className="divide-y divide-outline-variant">{filtered.map((movement) => { const item = items.find((entry) => entry.id === movement.itemId); const variant = variants.find((entry) => entry.id === movement.variantId); return <article className="grid min-w-0 gap-1 py-3 sm:grid-cols-[minmax(140px,0.9fr)_minmax(120px,0.7fr)_minmax(100px,0.6fr)_minmax(160px,1fr)] sm:gap-4" key={movement.id}><div className="min-w-0"><h2 className="break-words font-medium">{item?.name ?? movement.itemId}</h2><p className="break-all font-mono text-xs text-on-surface-variant">{variant?.processingState ?? movement.variantId} · {variant?.stockForm ?? "form"}</p></div><div className="text-sm">{movement.type}<p className="text-xs text-on-surface-variant">{movement.effectiveAt.toDate().toLocaleString()}</p></div><div className="font-semibold">{movement.signedQuantity > 0 ? "+" : ""}{movement.signedQuantity} {movement.unit}</div><div className="break-words text-sm text-on-surface-variant">{movement.reason}<p className="text-xs">{movement.reference} · {movement.locationId}</p></div></article>; })}</div> : <div className="py-12 text-center"><Icon name="timeline" className="text-3xl text-outline" /><h2 className="mt-3 font-semibold">No activity in this date range</h2><p className="mt-1 text-sm text-on-surface-variant">Posted stock movements will appear here.</p></div> : balances.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{balances.map((balance) => { const variant = variants.find((entry) => entry.id === balance.variantId); const item = items.find((entry) => entry.id === variant?.itemId); return <article className="rounded-md border border-outline-variant p-3" key={`${balance.variantId}-${balance.locationId}-${balance.unit}`}><h3 className="break-words font-semibold">{item?.name ?? variant?.itemId}</h3><p className="text-xs text-on-surface-variant">{variant?.processingState} · {variant?.stockForm || balance.unit} · {balance.locationId}</p><p className="mt-2 text-xl font-semibold text-primary">{balance.quantity} <span className="text-sm">{balance.unit}</span></p></article>; })}</div> : <div className="py-12 text-center"><h2 className="font-semibold">No posted stock balances</h2><p className="mt-1 text-sm text-on-surface-variant">Opening balances are not assumed. Record a receipt or opening-stock workflow first.</p></div>}</section>
  </div>;
}
