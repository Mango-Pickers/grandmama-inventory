import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

import { Icon } from "@/components/erp/icon";
import {
  calculateBalances,
  loadCatalogue,
  loadPostedMovements,
  type InventoryItemRecord,
  type LocationRecord,
  type PostedMovement,
  type StockVariantRecord,
} from "@/lib/inventory-service";

function lagosDate() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function DailyStockPage() {
  const [items, setItems] = useState<InventoryItemRecord[]>([]);
  const [variants, setVariants] = useState<StockVariantRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [movements, setMovements] = useState<PostedMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(lagosDate);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [locationId, setLocationId] = useState("all");
  const [processing, setProcessing] = useState("all");
  const [showZero, setShowZero] = useState(false);
  const [presentation, setPresentation] = useState<"cards" | "table">("cards");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { db } = await import("@/lib/firebase");
      if (!db) throw new Error("Cloud Firestore is unavailable.");
      const [catalogue, ledger] = await Promise.all([loadCatalogue(db), loadPostedMovements(db)]);
      setItems(catalogue.items);
      setVariants(catalogue.variants);
      setLocations(catalogue.locations);
      setMovements(ledger);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load daily stock.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const categories = useMemo(() => [...new Set(items.map((item) => item.category))].sort(), [items]);
  const cutoff = useMemo(() => new Date(`${selectedDate}T23:59:59.999+01:00`).getTime(), [selectedDate]);
  const cutoffMovements = useMemo(() => movements.filter((movement) => movement.effectiveAt.toMillis() <= cutoff), [cutoff, movements]);
  const balances = useMemo(() => calculateBalances(cutoffMovements), [cutoffMovements]);
  const periodMovements = useMemo(() => movements.filter((movement) => {
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(movement.effectiveAt.toDate());
    return day === selectedDate;
  }), [movements, selectedDate]);

  const rows = useMemo(() => {
    const result = items.filter((item) => item.status === "active").flatMap((item) => {
      if (category !== "all" && item.category !== category) return [];
      const itemVariants = variants.filter((variant) => variant.itemId === item.id && variant.active);
      const displayVariants = itemVariants.length ? itemVariants : [null];
      return displayVariants.map((variant) => {
        const locationIds = locationId === "all" ? [...new Set([...locations.map((location) => location.id), ...balances.filter((balance) => balance.variantId === variant?.id).map((balance) => balance.locationId)])] : [locationId];
        return (locationIds.length ? locationIds : [""]).map((location) => {
          const matchesSearch = `${item.name} ${item.id} ${variant?.id ?? ""}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
          const matchesProcessing = processing === "all" || (variant?.processingState ?? "Not applicable") === processing;
          const balance = variant ? balances.find((record) => record.variantId === variant.id && record.locationId === location) : undefined;
          const relevantMovements = periodMovements.filter((movement) => movement.variantId === variant?.id && movement.locationId === location);
          const incoming = relevantMovements.filter((movement) => (movement.signedQuantity ?? 0) > 0).reduce((sum, movement) => sum + movement.signedQuantity, 0);
          const outgoing = relevantMovements.filter((movement) => (movement.signedQuantity ?? 0) < 0).reduce((sum, movement) => sum + Math.abs(movement.signedQuantity), 0);
          const value = { item, variant, locationId: location, balance: balance?.quantity, unit: variant?.balanceUnit || balance?.unit || "", incoming, outgoing };
          if (!matchesSearch || !matchesProcessing) return null;
          if (!showZero && value.balance === 0 && !incoming && !outgoing) return null;
          return value;
        }).filter((value) => value !== null);
      }).flat();
    });
    return result.flat();
  }, [balances, category, items, locationId, locations, periodMovements, processing, search, showZero, variants]);

  return <div className="mx-auto flex w-full max-w-360 min-w-0 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
    <header className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-secondary">Operations core</p><h1 className="mt-1 text-2xl font-bold text-primary sm:text-3xl">Daily Stock</h1><p className="mt-1 text-sm text-on-surface-variant">Balances carried forward to the selected date. Stock In and Stock Out are that day only.</p></div><label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Selected date · Africa/Lagos<input className="min-h-11 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-base" onChange={(event) => setSelectedDate(event.target.value)} type="date" value={selectedDate} /></label></header>
    {error && <p className="rounded-md border border-error/30 bg-error-container/50 p-3 text-sm text-on-error-container" role="alert">{error}<button className="ml-3 underline" onClick={() => void refresh()} type="button">Retry</button></p>}
    <section aria-label="Daily stock filters" className="grid min-w-0 gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Search item<input className="min-h-11 rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => setSearch(event.target.value)} placeholder="Name or ID" value={search} /></label>
      <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Category<select className="min-h-11 rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => setCategory(event.target.value)} value={category}><option value="all">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Location<select className="min-h-11 rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => setLocationId(event.target.value)} value={locationId}><option value="all">All locations</option>{locations.map((value) => <option key={value.id} value={value.id}>{value.name}</option>)}</select></label>
      <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Processing state<select className="min-h-11 rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => setProcessing(event.target.value)} value={processing}><option value="all">All states</option><option>Processed</option><option>Unprocessed</option><option>Not applicable</option></select></label>
      <label className="flex min-h-11 items-center gap-2 text-sm font-medium"><input checked={showZero} className="h-5 w-5 accent-primary" onChange={(event) => setShowZero(event.target.checked)} type="checkbox" />Include zero-stock items</label>
      <div className="flex items-center gap-2 lg:col-span-3"><button className={`min-h-10 rounded px-3 text-sm ${presentation === "cards" ? "bg-primary text-on-primary" : "border border-outline-variant"}`} onClick={() => setPresentation("cards")} type="button">Cards</button><button className={`min-h-10 rounded px-3 text-sm ${presentation === "table" ? "bg-primary text-on-primary" : "border border-outline-variant"}`} onClick={() => setPresentation("table")} type="button">Table</button><button className="min-h-10 rounded px-3 text-sm text-primary underline" onClick={() => { setSearch(""); setCategory("all"); setLocationId("all"); setProcessing("all"); }} type="button">Clear filters</button><span className="ml-auto text-xs text-on-surface-variant">{loading ? "Loading..." : `${rows.length} rows`}</span></div>
    </section>
    {loading ? <p className="py-12 text-center text-sm text-on-surface-variant" role="status">Loading shared inventory and ledger...</p> : rows.length === 0 ? <section className="rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest px-5 py-12 text-center"><Icon name="inventory_2" className="text-3xl text-outline" /><h2 className="mt-3 font-semibold">No stock rows for these filters</h2><p className="mt-1 text-sm text-on-surface-variant">No zero quantities are assumed. Add a posted receipt or include zero-stock items.</p></section> : presentation === "cards" ? <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">{rows.map((row) => <article className="min-w-0 rounded-md border border-outline-variant bg-surface-container-lowest p-4" key={`${row.variant?.id ?? row.item.id}:${row.locationId}`}><div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words font-semibold">{row.item.name}</h2><p className="mt-1 break-all font-mono text-xs text-on-surface-variant">{row.variant?.id ?? "Variant not configured"}</p></div><span className="max-w-32 break-words rounded bg-surface-container px-2 py-1 text-xs">{row.locationId ? locations.find((location) => location.id === row.locationId)?.name ?? row.locationId : "Location not configured"}</span></div><p className="mt-2 text-sm text-on-surface-variant">{row.variant?.processingState ?? "Not applicable"} · {row.variant?.stockForm || row.unit || "Form not configured"}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-on-surface-variant">Closing at cutoff</dt><dd className="mt-1 font-semibold">{row.balance === undefined ? "Not recorded" : `${row.balance} ${row.unit}`}</dd></div><div><dt className="text-xs text-on-surface-variant">Stock In today</dt><dd className="mt-1">{row.incoming} {row.unit || "unit not configured"}</dd></div><div><dt className="text-xs text-on-surface-variant">Stock Out today</dt><dd className="mt-1">{row.outgoing} {row.unit || "unit not configured"}</dd></div><div><dt className="text-xs text-on-surface-variant">Condition</dt><dd className="mt-1">Not checked</dd></div></dl><div className="mt-4 flex flex-wrap gap-2"><Link className="min-h-10 rounded border border-outline-variant px-3 py-2 text-xs font-medium" to="/receive-stock">Receive</Link><Link className="min-h-10 rounded border border-outline-variant px-3 py-2 text-xs font-medium" to="/issue-stock">Issue</Link><Link className="min-h-10 rounded border border-outline-variant px-3 py-2 text-xs font-medium" to="/physical-count">Count</Link></div></article>)}</div> : <div aria-label="Daily stock table, scroll horizontally for additional measures" className="min-w-0 overflow-x-auto rounded-lg border border-outline-variant bg-surface-container-lowest" role="region" tabIndex={0}><table className="w-full min-w-[1180px] text-left text-sm"><thead className="bg-surface-container text-xs uppercase text-on-surface-variant"><tr>{["Item / variant", "Location", "Unit", "1L", "2.5L", "3.5L", "5L", "Pieces", "Filled bags", "Stock In", "Stock Out", "Closing", "Condition"].map((title) => <th className="whitespace-nowrap px-3 py-3" key={title}>{title}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-outline-variant" key={`${row.variant?.id ?? row.item.id}:${row.locationId}`}><td className="px-3 py-3"><span className="font-medium">{row.item.name}</span><span className="block text-xs text-on-surface-variant">{row.variant?.processingState ?? "Not applicable"}</span></td><td className="px-3 py-3">{locations.find((location) => location.id === row.locationId)?.name ?? "Not configured"}</td><td className="px-3 py-3">{row.unit || "Not configured"}</td>{["1L", "2.5L", "3.5L", "5L", "Pieces", "Filled bags"].map((measure) => <td className="px-3 py-3 text-on-surface-variant" key={measure}>{row.variant?.portionSizeLabel === measure ? row.balance ?? "Not recorded" : "Not applicable"}</td>)}<td className="px-3 py-3">{row.incoming || "—"}</td><td className="px-3 py-3">{row.outgoing || "—"}</td><td className="px-3 py-3 font-semibold">{row.balance ?? "Not recorded"}</td><td className="px-3 py-3">Not checked</td></tr>)}</tbody></table></div>}
    <p className="text-xs text-on-surface-variant">Cutoff balance derives from all posted movements through the selected date. Daily In/Out reflects that date only. No count, condition, or stock quantity is inferred from catalogue data.</p>
  </div>;
}
