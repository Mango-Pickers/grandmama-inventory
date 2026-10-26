import { useCallback, useEffect, useState, type FormEvent } from "react";
import { collection, doc, getDocs, setDoc, Timestamp } from "firebase/firestore";

import { useAuth } from "@/components/auth/auth-provider";
import { Icon } from "@/components/erp/icon";
import { createLocation, loadCatalogue, type LocationRecord, type StockVariantRecord } from "@/lib/inventory-service";

export function SettingsPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [variants, setVariants] = useState<StockVariantRecord[]>([]);
  const [locationName, setLocationName] = useState("");
  const [locationKind, setLocationKind] = useState<LocationRecord["kind"]>("storage");
  const [variantThresholds, setVariantThresholds] = useState<Record<string, string>>({});
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
      const [catalogue, locationsSnapshot] = await Promise.all([loadCatalogue(db), getDocs(collection(db, "locations"))]);
      setVariants(catalogue.variants);
      setLocations(locationsSnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as LocationRecord));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load settings.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  async function addLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setSaving(true); setError(null); setMessage(null);
    try {
      const { db } = await import("@/lib/firebase");
      if (!db) throw new Error("Cloud Firestore is unavailable.");
      await createLocation(db, locationName, locationKind, user.uid);
      setLocationName("");
      setMessage("Location saved and available in stock workflows.");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save location."); }
    finally { setSaving(false); }
  }

  async function saveThreshold(variant: StockVariantRecord) {
    if (!user) return;
    const raw = variantThresholds[variant.id] ?? (variant.reorderThreshold === undefined ? "" : String(variant.reorderThreshold));
    const threshold = raw === "" ? undefined : Number(raw);
    if (threshold !== undefined && (!Number.isFinite(threshold) || threshold < 0)) { setError("Threshold must be zero or greater, or left blank."); return; }
    setSaving(true); setError(null); setMessage(null);
    try {
      const { db } = await import("@/lib/firebase");
      if (!db) throw new Error("Cloud Firestore is unavailable.");
      const ref = doc(db, "stockVariants", variant.id);
      await setDoc(ref, {
        reorderThreshold: threshold ?? null,
        updatedAt: Timestamp.now(),
        updatedBy: user.uid,
      }, { merge: true });
      setMessage("Threshold setting saved. It applies only to the selected variant unit.");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save threshold."); }
    finally { setSaving(false); }
  }

  return <div className="mx-auto flex w-full max-w-360 min-w-0 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
    <header><p className="text-xs font-semibold uppercase tracking-wider text-secondary">Operations core</p><h1 className="mt-1 text-2xl font-bold text-primary sm:text-3xl">Settings</h1><p className="mt-1 text-sm text-on-surface-variant">Configure actual locations and stock rules. No quantities, conversions, or thresholds are assumed.</p></header>
    {error && <p className="rounded-md border border-error/30 bg-error-container/50 p-3 text-sm text-on-error-container" role="alert">{error}</p>}{message && <p className="rounded-md border border-primary/20 bg-muted p-3 text-sm" role="status">{message}</p>}
    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
      <section className="min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 sm:p-5"><h2 className="font-semibold">Kitchen locations</h2><p className="mt-1 text-sm text-on-surface-variant">Storage areas and kitchen lines used by receipts, issues, counts and reports.</p><form className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(140px,0.6fr)_auto] sm:items-end" onSubmit={addLocation}><label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Location name<input className="min-h-11 rounded-md border border-outline-variant px-3 text-base" onChange={(event) => setLocationName(event.target.value)} required value={locationName} /></label><label className="flex flex-col gap-1 text-sm font-medium">Location type<select className="min-h-11 rounded-md border border-outline-variant px-3 text-base" onChange={(event) => setLocationKind(event.target.value as LocationRecord["kind"])} value={locationKind}><option value="storage">Storage</option><option value="kitchen">Kitchen</option></select></label><button className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50" disabled={saving} type="submit">Add location</button></form>{loading ? <p className="py-5 text-sm text-on-surface-variant">Loading locations...</p> : locations.length ? <div className="mt-4 divide-y divide-outline-variant">{locations.map((location) => <div className="flex items-center justify-between gap-3 py-3" key={location.id}><div className="min-w-0"><p className="break-words font-medium">{location.name}</p><p className="text-xs text-on-surface-variant">{location.kind} · {location.active ? "Active" : "Inactive"}</p></div><span className="break-all font-mono text-[11px] text-on-surface-variant">{location.id}</span></div>)}</div> : <p className="mt-4 rounded-md bg-surface-container-low p-3 text-sm text-on-surface-variant">No locations configured. Stock workflows remain unavailable until a real location is added.</p>}</section>
      <section className="min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 sm:p-5"><h2 className="font-semibold">Variant thresholds</h2><p className="mt-1 text-sm text-on-surface-variant">Optional low-stock threshold, always interpreted in that variant's configured balance unit.</p>{loading ? <p className="py-5 text-sm text-on-surface-variant">Loading variants...</p> : variants.length ? <div className="mt-4 space-y-3">{variants.map((variant) => <div className="grid min-w-0 gap-2 rounded-md border border-outline-variant p-3 sm:grid-cols-[minmax(0,1fr)_minmax(120px,0.5fr)_auto] sm:items-end" key={variant.id}><div className="min-w-0"><p className="break-words font-medium">{variant.processingState} · {variant.stockForm || "Stock form"}</p><p className="break-all font-mono text-[11px] text-on-surface-variant">{variant.id} · {variant.balanceUnit || "Unit not configured"}</p></div><label className="flex flex-col gap-1 text-xs font-medium">Threshold {variant.balanceUnit && `(${variant.balanceUnit})`}<input className="min-h-10 rounded border border-outline-variant px-2 text-base" inputMode="decimal" min="0" onChange={(event) => setVariantThresholds((current) => ({ ...current, [variant.id]: event.target.value }))} step="any" type="number" value={variantThresholds[variant.id] ?? (variant.reorderThreshold === undefined ? "" : String(variant.reorderThreshold))} /></label><button className="min-h-10 rounded border border-outline-variant px-3 text-sm font-semibold disabled:opacity-50" disabled={saving || !variant.balanceUnit} onClick={() => void saveThreshold(variant)} type="button">Save</button></div>)}</div> : <p className="mt-4 rounded-md bg-surface-container-low p-3 text-sm text-on-surface-variant">No variants yet. Add catalogue variants before configuring compatible quantity thresholds.</p>}</section>
    </div>
    <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 sm:p-5"><h2 className="font-semibold">Persistence and backup</h2><p className="mt-1 text-sm text-on-surface-variant">Mode: Firebase Authentication + Cloud Firestore. No browser-local inventory store is used. Full backup/restore is not implemented yet; catalogue CSV/XLSX export is not a complete backup.</p><div className="mt-3 flex flex-wrap gap-2"><button className="min-h-10 rounded border border-outline-variant px-3 text-sm" onClick={() => void refresh()} type="button"><Icon name="refresh" className="mr-1" />Refresh settings</button></div></section>
  </div>;
}
