import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { collection, getDocs } from "firebase/firestore";

import { useAuth } from "@/components/auth/auth-provider";
import { Icon } from "@/components/erp/icon";
import { createQualityCheck, loadCatalogue, type InventoryItemRecord, type LocationRecord, type StockVariantRecord } from "@/lib/inventory-service";

type BatchRecord = {
  id: string;
  itemId: string;
  variantId: string;
  locationId: string;
  receivedAt: { toDate: () => Date };
  latestCondition?: string;
  latestConditionAt?: { toDate: () => Date };
  labelledExpiryDate?: { toDate: () => Date };
};

type CheckRecord = { id: string; batchId: string; condition: string; notes: string; checkedBy: string; checkedAt: { toDate: () => Date } };

export function QualityChecksPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItemRecord[]>([]);
  const [variants, setVariants] = useState<StockVariantRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [checks, setChecks] = useState<CheckRecord[]>([]);
  const [batchId, setBatchId] = useState("");
  const [condition, setCondition] = useState<"Good" | "Needs review" | "Bad">("Needs review");
  const [notes, setNotes] = useState("");
  const [queryText, setQueryText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { db } = await import("@/lib/firebase");
      if (!db) throw new Error("Cloud Firestore is unavailable.");
      const [catalogue, batchSnapshot, checkSnapshot] = await Promise.all([
        loadCatalogue(db),
        getDocs(collection(db, "batches")),
        getDocs(collection(db, "qualityChecks")),
      ]);
      setItems(catalogue.items);
      setVariants(catalogue.variants);
      setLocations(catalogue.locations);
      setBatches(batchSnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as BatchRecord));
      setChecks(checkSnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as CheckRecord).sort((a, b) => b.checkedAt.toDate().getTime() - a.checkedAt.toDate().getTime()));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load quality checks.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const filteredBatches = useMemo(() => batches.filter((batch) => {
    const item = items.find((candidate) => candidate.id === batch.itemId);
    const variant = variants.find((candidate) => candidate.id === batch.variantId);
    const location = locations.find((candidate) => candidate.id === batch.locationId);
    return `${item?.name ?? batch.itemId} ${variant?.processingState ?? ""} ${batch.id} ${location?.name ?? ""}`.toLocaleLowerCase().includes(queryText.trim().toLocaleLowerCase());
  }), [batches, items, locations, queryText, variants]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const batch = batches.find((candidate) => candidate.id === batchId);
    if (!batch) { setError("Select a real batch before recording an inspection."); return; }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const { db } = await import("@/lib/firebase");
      if (!db) throw new Error("Cloud Firestore is unavailable.");
      await createQualityCheck(db, { batchId, itemId: batch.itemId, variantId: batch.variantId, locationId: batch.locationId, condition, notes }, user.uid);
      setMessage("Quality inspection saved. Inventory quantity was not changed.");
      setBatchId("");
      setNotes("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the quality inspection.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="mx-auto flex w-full max-w-360 min-w-0 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
    <header><p className="text-xs font-semibold uppercase tracking-wider text-secondary">Operations core</p><h1 className="mt-1 text-2xl font-bold text-primary sm:text-3xl">Quality Checks</h1><p className="mt-1 text-sm text-on-surface-variant">Record dated condition observations against real receipt batches. Inspections never change quantity.</p></header>
    {error && <p className="rounded-md border border-error/30 bg-error-container/50 p-3 text-sm text-on-error-container" role="alert">{error}</p>}{message && <p className="rounded-md border border-primary/20 bg-muted p-3 text-sm" role="status">{message}</p>}
    <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
      <form className="flex min-w-0 flex-col gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 sm:p-5" onSubmit={submit}>
        <h2 className="font-semibold">Record inspection</h2>
        <label className="flex flex-col gap-1 text-sm font-medium">Batch<select className="min-h-11 rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => setBatchId(event.target.value)} required value={batchId}><option value="">Select batch</option>{filteredBatches.map((batch) => { const item = items.find((entry) => entry.id === batch.itemId); const variant = variants.find((entry) => entry.id === batch.variantId); const location = locations.find((entry) => entry.id === batch.locationId); return <option key={batch.id} value={batch.id}>{item?.name ?? batch.itemId} · {variant?.processingState ?? "variant"} · {location?.name ?? batch.locationId} · {batch.id}</option>; })}</select></label>
        <label className="flex flex-col gap-1 text-sm font-medium">Condition<select className="min-h-11 rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => setCondition(event.target.value as typeof condition)} value={condition}><option>Good</option><option>Needs review</option><option>Bad</option></select></label>
        <label className="flex flex-col gap-1 text-sm font-medium">Inspection notes<textarea className="min-h-24 rounded-md border border-outline-variant bg-surface p-3 text-base" onChange={(event) => setNotes(event.target.value)} value={notes} /></label>
        <button className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50" disabled={saving || loading || !batches.length} type="submit">{saving ? "Saving..." : "Save quality check"}</button>
        {batches.length === 0 && !loading && <p className="text-xs text-warning">No receipt batches exist yet. Record a receipt before inspecting stock.</p>}
      </form>
      <section className="min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 sm:p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-semibold">Batch inspections</h2><p className="mt-1 text-xs text-on-surface-variant">{checks.length} checks recorded</p></div><label className="flex items-center gap-2 text-sm"><Icon name="search" /><input className="min-h-10 min-w-0 rounded-md border border-outline-variant px-3" onChange={(event) => setQueryText(event.target.value)} placeholder="Filter batch list" value={queryText} /></label></div>{loading ? <p className="py-8 text-center text-sm text-on-surface-variant">Loading batch inspections...</p> : checks.length ? <div className="mt-3 divide-y divide-outline-variant">{checks.map((check) => { const batch = batches.find((entry) => entry.id === check.batchId); const item = items.find((entry) => entry.id === check.itemId); return <article className="py-3" key={check.id}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="break-words font-medium">{item?.name ?? check.itemId} · Batch {check.batchId}</h3><span className="rounded-full bg-surface-container px-3 py-1 text-xs font-medium">{check.condition}</span></div><p className="mt-1 text-xs text-on-surface-variant">Received {batch?.receivedAt.toDate().toLocaleDateString() ?? "date unavailable"} · Checked {check.checkedAt.toDate().toLocaleString()}</p>{check.notes && <p className="mt-2 break-words text-sm">{check.notes}</p>}</article>; })}</div> : <p className="py-8 text-center text-sm text-on-surface-variant">No inspections recorded.</p>}</section>
    </div>
  </div>;
}
