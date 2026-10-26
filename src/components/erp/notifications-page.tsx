import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, Timestamp, updateDoc } from "firebase/firestore";
import { Link } from "@tanstack/react-router";

import { Icon } from "@/components/erp/icon";
import { calculateBalances, loadCatalogue, loadPostedMovements, type InventoryItemRecord, type PostedMovement, type StockVariantRecord } from "@/lib/inventory-service";

type CountRecord = { id: string; status: string; difference: number; itemId: string; variantId: string };
type QualityRecord = { id: string; batchId: string; condition: string; checkedAt: Timestamp; itemId: string };
type NotificationRow = { id: string; kind: string; title: string; detail: string; href: string; seen: boolean; persistentId?: string };

export function NotificationsPage() {
  const [items, setItems] = useState<InventoryItemRecord[]>([]);
  const [variants, setVariants] = useState<StockVariantRecord[]>([]);
  const [movements, setMovements] = useState<PostedMovement[]>([]);
  const [counts, setCounts] = useState<CountRecord[]>([]);
  const [quality, setQuality] = useState<QualityRecord[]>([]);
  const [stored, setStored] = useState<Array<{ id: string; readAt?: Timestamp; title?: string; detail?: string; href?: string; kind?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState("all");

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { db } = await import("@/lib/firebase");
      if (!db) throw new Error("Cloud Firestore is unavailable.");
      const [catalogue, ledger, countSnapshot, qualitySnapshot, storedSnapshot] = await Promise.all([
        loadCatalogue(db), loadPostedMovements(db), getDocs(collection(db, "physicalCounts")),
        getDocs(collection(db, "qualityChecks")), getDocs(collection(db, "notifications")),
      ]);
      setItems(catalogue.items); setVariants(catalogue.variants); setMovements(ledger);
      setCounts(countSnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as CountRecord));
      setQuality(qualitySnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as QualityRecord));
      setStored(storedSnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load notifications."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const alerts = useMemo<NotificationRow[]>(() => {
    const generated: NotificationRow[] = [];
    const balances = calculateBalances(movements);
    for (const balance of balances) {
      const variant = variants.find((entry) => entry.id === balance.variantId);
      const item = items.find((entry) => entry.id === variant?.itemId);
      if (variant?.reorderThreshold !== undefined && balance.quantity <= variant.reorderThreshold) {
        generated.push({ id: `low-${balance.variantId}-${balance.locationId}`, kind: "Low stock", title: `${item?.name ?? variant.itemId} is at or below its configured threshold`, detail: `${balance.quantity} ${balance.unit} at ${balance.locationId}; threshold ${variant.reorderThreshold} ${balance.unit}.`, href: "/inventory", seen: false });
      }
    }
    for (const count of counts.filter((entry) => entry.status === "observed" && entry.difference !== 0)) {
      const item = items.find((record) => record.id === count.itemId);
      generated.push({ id: `count-${count.id}`, kind: "Count difference", title: `Unresolved count difference for ${item?.name ?? count.itemId}`, detail: `Difference: ${count.difference}. Review the count before making an adjustment.`, href: "/physical-count", seen: false });
    }
    for (const check of quality.filter((entry) => entry.condition === "Needs review" || entry.condition === "Bad")) {
      const item = items.find((record) => record.id === check.itemId);
      generated.push({ id: `quality-${check.id}`, kind: "Quality concern", title: `${item?.name ?? check.itemId} condition: ${check.condition}`, detail: `Batch ${check.batchId} · checked ${check.checkedAt.toDate().toLocaleString()}. Quantity is unchanged.`, href: "/quality-checks", seen: false });
    }
    const storedById = new Map(stored.map((entry) => [entry.id, entry]));
    for (const entry of stored) {
      generated.push({ id: entry.id, kind: entry.kind ?? "Notice", title: entry.title ?? entry.id, detail: entry.detail ?? "", href: entry.href ?? "/stock-activity", seen: Boolean(entry.readAt), persistentId: entry.id });
    }
    return generated.map((alert) => {
      const saved = storedById.get(alert.id);
      return saved ? { ...alert, seen: Boolean(saved.readAt), persistentId: saved.id } : alert;
    });
  }, [counts, items, movements, quality, stored, variants]);
  const filteredAlerts = alerts.filter((alert) => type === "all" || alert.kind === type);
  const unseen = alerts.filter((alert) => !alert.seen).length;

  async function markSeen(alert: NotificationRow) {
    if (!alert.persistentId) return;
    setError(null);
    try {
      const { db } = await import("@/lib/firebase");
      if (!db) throw new Error("Cloud Firestore is unavailable.");
      await updateDoc(doc(db, "notifications", alert.persistentId), { readAt: Timestamp.now() });
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not acknowledge notification."); }
  }

  return <div className="mx-auto flex w-full max-w-360 min-w-0 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-wider text-secondary">Operations core</p><h1 className="mt-1 text-2xl font-bold text-primary sm:text-3xl">Notifications</h1><p className="mt-1 text-sm text-on-surface-variant">Current alerts are derived from posted ledger, inspection and count records. Missing thresholds stay unconfigured.</p></div><span className="w-fit rounded-full bg-surface-container px-3 py-2 text-sm font-semibold">{unseen} unread</span></header>
    {error && <p className="rounded-md border border-error/30 bg-error-container/50 p-3 text-sm text-on-error-container" role="alert">{error}</p>}
    <section className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"><label className="flex flex-col gap-1 text-sm font-medium">Filter by alert type<select className="min-h-11 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-base" onChange={(event) => setType(event.target.value)} value={type}><option value="all">All alerts</option>{[...new Set(alerts.map((alert) => alert.kind))].map((kind) => <option key={kind}>{kind}</option>)}</select></label><button className="min-h-11 self-end rounded-md border border-outline-variant px-4 text-sm font-medium" onClick={() => void refresh()} type="button">Refresh alerts</button></section>
    <section className="min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 sm:p-5">{loading ? <p className="py-10 text-center text-sm text-on-surface-variant">Checking ledger, counts and quality records...</p> : filteredAlerts.length ? <div className="divide-y divide-outline-variant">{filteredAlerts.map((alert) => <article className="flex min-w-0 flex-col justify-between gap-3 py-4 sm:flex-row sm:items-start" key={alert.id}><div className="flex min-w-0 gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning"><Icon name={alert.kind === "Quality concern" ? "health_and_safety" : alert.kind === "Count difference" ? "fact_check" : "notifications_active"} /></span><div className="min-w-0"><p className="break-words font-semibold">{alert.title}</p><p className="mt-1 break-words text-sm text-on-surface-variant">{alert.detail}</p><span className="mt-2 inline-block rounded-full bg-surface-container px-2.5 py-1 text-xs">{alert.kind} · {alert.seen ? "Seen" : "New"}</span></div></div><div className="flex shrink-0 gap-2"><Link className="min-h-10 rounded border border-outline-variant px-3 py-2 text-xs font-semibold" to={alert.href}>Open</Link>{alert.persistentId && !alert.seen && <button className="min-h-10 rounded px-3 py-2 text-xs font-semibold text-primary hover:bg-surface-container" onClick={() => void markSeen(alert)} type="button">Mark seen</button>}</div></article>)}</div> : <div className="py-12 text-center"><Icon name="notifications_none" className="text-3xl text-outline" /><h2 className="mt-3 font-semibold">No active alerts</h2><p className="mt-1 text-sm text-on-surface-variant">No configured threshold, unresolved count difference, or quality concern is currently present.</p></div>}</section>
  </div>;
}
