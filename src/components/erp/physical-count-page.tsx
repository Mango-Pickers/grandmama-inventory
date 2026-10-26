import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { collection, doc, getDocs, runTransaction, Timestamp } from "firebase/firestore";

import { Icon } from "@/components/erp/icon";
import { useAuth } from "@/components/auth/auth-provider";
import { calculateAvailableForVariant, loadCatalogue, loadPostedMovements, savePhysicalCount, type PostedMovement } from "@/lib/inventory-service";
import type { InventoryItemRecord, LocationRecord, StockVariantRecord } from "@/lib/inventory-service";

type CountRecord = {
  id: string;
  itemId: string;
  variantId: string;
  locationId: string;
  unit: string;
  expectedQuantityAtCount: number;
  observedQuantity: number;
  difference: number;
  countedAt: Timestamp;
  notes: string;
  status: "draft" | "observed" | "reconciled";
  countedBy: string;
  adjustmentMovementId?: string;
};

export function PhysicalCountPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItemRecord[]>([]);
  const [variants, setVariants] = useState<StockVariantRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [movements, setMovements] = useState<PostedMovement[]>([]);
  const [counts, setCounts] = useState<CountRecord[]>([]);
  const [itemId, setItemId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"draft" | "observed">("draft");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [reconcileReason, setReconcileReason] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { db } = await import("@/lib/firebase");
      if (!db) throw new Error("Cloud Firestore is unavailable.");
      const [catalogue, ledger, countSnapshot] = await Promise.all([
        loadCatalogue(db),
        loadPostedMovements(db),
        getDocs(collection(db, "physicalCounts")),
      ]);
      setItems(catalogue.items);
      setVariants(catalogue.variants);
      setLocations(catalogue.locations);
      setMovements(ledger);
      setCounts(countSnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as CountRecord).sort((a, b) => b.countedAt.toMillis() - a.countedAt.toMillis()));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load physical counts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const activeItems = useMemo(() => items.filter((item) => item.status === "active" && item.confirmationStatus === "confirmed"), [items]);
  const selectedVariants = variants.filter((variant) => variant.itemId === itemId && variant.active && variant.balanceUnit);
  const selectedVariant = variants.find((variant) => variant.id === variantId);
  const expected = variantId && locationId ? calculateAvailableForVariant(movements, variantId, locationId) : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !selectedVariant || expected === null) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const { db } = await import("@/lib/firebase");
      if (!db) throw new Error("Cloud Firestore is unavailable.");
      const countId = await savePhysicalCount(db, {
        itemId,
        variantId,
        locationId,
        unit: selectedVariant.balanceUnit,
        countedQuantity: Number(quantity),
        expectedQuantity: expected,
        countedAt: new Date(),
        notes,
        status,
      }, user.uid);
      setMessage(status === "draft" ? `Count ${countId} saved as a draft; stock was not changed.` : `Count ${countId} recorded. Variance is ${Number(quantity) - expected} ${selectedVariant.balanceUnit}; stock was not changed.`);
      setQuantity("");
      setNotes("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save physical count.");
    } finally {
      setSaving(false);
    }
  }

  async function reconcile(count: CountRecord) {
    const reason = reconcileReason[count.id]?.trim();
    if (!reason) { setError("Enter an adjustment reason before reconciliation."); return; }
    if (count.countedBy !== user?.uid) { setError("Only the counter can reconcile this count under the current count ownership workflow."); return; }
    if (count.difference === 0) { setError("This count has no difference to reconcile."); return; }
    setSaving(true);
    setError(null);
    try {
      const { db } = await import("@/lib/firebase");
      if (!db) throw new Error("Cloud Firestore is unavailable.");
      const operationId = `count-${count.id}`;
      const movementRef = doc(db, "stockMovements", operationId);
      const countRef = doc(db, "physicalCounts", count.id);
      const operationRef = doc(db, "stockOperations", operationId);
      await runTransaction(db, async (transaction) => {
        const [countSnapshot, existingOperation] = await Promise.all([transaction.get(countRef), transaction.get(operationRef)]);
        if (!countSnapshot.exists()) throw new Error("Count record no longer exists.");
        const current = countSnapshot.data();
        if (current.status !== "observed" || current.adjustmentMovementId) throw new Error("Count is not available for reconciliation.");
        if (existingOperation.exists()) throw new Error("This count adjustment was already posted.");
        const now = Timestamp.now();
        transaction.set(movementRef, {
          id: operationId,
          operationId,
          itemId: count.itemId,
          variantId: count.variantId,
          locationId: count.locationId,
          ...(count.batchId ? { batchId: count.batchId } : {}),
          type: "adjustment",
          quantity: Math.abs(count.difference),
          signedQuantity: count.difference,
          unit: count.unit,
          reason,
          reference: `Count ${count.id}`,
          relatedEventId: count.id,
          effectiveAt: now,
          occurredAt: now,
          createdAt: now,
          createdBy: user?.uid,
          status: "posted",
        });
        transaction.set(operationRef, { id: operationId, movementIds: [operationId], lineCount: 1, status: "posted", createdAt: now, createdBy: user?.uid });
        transaction.update(countRef, { status: "reconciled", adjustmentMovementId: operationId, reconciledBy: user?.uid, reconciledAt: now, reconciliationReason: reason });
      });
      setMessage(`Count ${count.id} reconciled with a linked adjustment.`);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not reconcile count.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="mx-auto flex w-full max-w-360 min-w-0 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
    <header><p className="text-xs font-semibold uppercase tracking-wider text-secondary">Operations core</p><h1 className="mt-1 text-2xl font-bold text-primary sm:text-3xl">Physical Count</h1><p className="mt-1 text-sm text-on-surface-variant">Record what was observed. A count never changes stock until a linked adjustment is confirmed.</p></header>
    {error && <p className="rounded-md border border-error/30 bg-error-container/50 p-3 text-sm text-on-error-container" role="alert">{error}</p>}
    {message && <p className="rounded-md border border-primary/20 bg-muted p-3 text-sm" role="status">{message}</p>}
    <form className="grid min-w-0 gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-5" onSubmit={submit}>
      <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Item<select className="min-h-11 rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => { setItemId(event.target.value); setVariantId(""); }} required value={itemId}><option value="">Select item</option>{activeItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Variant<select className="min-h-11 rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => setVariantId(event.target.value)} required value={variantId}><option value="">Select variant</option>{selectedVariants.map((variant) => <option key={variant.id} value={variant.id}>{variant.processingState} · {variant.stockForm || variant.balanceUnit}</option>)}</select></label>
      <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Location<select className="min-h-11 rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => setLocationId(event.target.value)} required value={locationId}><option value="">Select location</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
      <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Observed quantity{selectedVariant && <span className="font-normal text-on-surface-variant">Recorded balance: {expected ?? "—"} {selectedVariant.balanceUnit}</span>}<input className="min-h-11 rounded-md border border-outline-variant bg-surface px-3 text-base" inputMode="decimal" min="0" onChange={(event) => setQuantity(event.target.value)} required step="any" type="number" value={quantity} /></label>
      <label className="flex min-w-0 flex-col gap-1 text-sm font-medium sm:col-span-2">Notes<textarea className="min-h-20 rounded-md border border-outline-variant bg-surface p-3 text-base" onChange={(event) => setNotes(event.target.value)} value={notes} /></label>
      <label className="flex items-center gap-3 text-sm font-medium"><input checked={status === "observed"} className="h-5 w-5 accent-primary" onChange={(event) => setStatus(event.target.checked ? "observed" : "draft")} type="checkbox" />Submit observation (does not adjust stock)</label>
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3"><button className="min-h-11 rounded-md bg-primary px-5 font-semibold text-on-primary disabled:opacity-60" disabled={saving || loading} type="submit">{saving ? "Saving..." : status === "draft" ? "Save Draft" : "Record Count"}</button><button className="min-h-11 rounded-md px-4 text-sm font-medium hover:bg-surface-container" onClick={() => void refresh()} type="button">Refresh balances</button></div>
    </form>
    <section className="min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 sm:p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Count history</h2><span className="text-xs text-on-surface-variant">{counts.length} records</span></div>{loading ? <p className="py-8 text-center text-sm text-on-surface-variant">Loading count history...</p> : counts.length === 0 ? <p className="py-8 text-center text-sm text-on-surface-variant">No physical counts have been recorded.</p> : <div className="mt-3 space-y-3">{counts.map((count) => { const item = items.find((record) => record.id === count.itemId); const variant = variants.find((record) => record.id === count.variantId); return <article className="min-w-0 rounded-md border border-outline-variant p-3 sm:p-4" key={count.id}><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div className="min-w-0"><h3 className="font-semibold">{item?.name ?? count.itemId} · {variant?.processingState ?? "Variant"}</h3><p className="mt-1 text-xs text-on-surface-variant">Expected {count.expectedQuantityAtCount} {count.unit} · Observed {count.observedQuantity} {count.unit} · Difference {count.difference} {count.unit}</p><p className="mt-1 text-xs text-on-surface-variant">{count.countedAt.toDate().toLocaleString()} · {count.status}</p>{count.notes && <p className="mt-2 break-words text-sm">{count.notes}</p>}</div>{count.status === "observed" && count.difference !== 0 && <div className="flex flex-col gap-2 sm:min-w-64"><label className="text-xs font-medium">Adjustment reason<input className="mt-1 min-h-10 w-full rounded-md border border-outline-variant px-2 text-sm" onChange={(event) => setReconcileReason((current) => ({ ...current, [count.id]: event.target.value }))} value={reconcileReason[count.id] ?? ""} /></label><button className="min-h-10 rounded-md bg-primary px-3 text-sm font-semibold text-on-primary disabled:opacity-50" disabled={saving || !reconcileReason[count.id]?.trim()} onClick={() => void reconcile(count)} type="button">Confirm reconciliation</button></div>}</div></article>; })}</div>}</section>
  </div>;
}
