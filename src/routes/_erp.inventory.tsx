import { createFileRoute } from "@tanstack/react-router";
import { collection, doc, getDoc, getDocs, runTransaction, Timestamp, writeBatch } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/erp/icon";
import { useAuth } from "@/components/auth/auth-provider";
import { SPEC_CATALOGUE, SPEC_VARIANTS } from "@/data/spec-catalog-seed";
import type { CatalogItemImport } from "@/lib/catalog-import";
import type { Firestore } from "firebase/firestore";

export const Route = createFileRoute("/_erp/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory | My Grandma's Kitchen" },
      { name: "description", content: "Inventory master catalogue and confirmation status." },
    ],
  }),
  component: InventoryPage,
});

type InventoryItem = CatalogItemImport & {
  createdAt?: Date;
  updatedAt?: Date;
};

type InventoryVariant = {
  id: string;
  itemId: string;
  processingState: string;
  stockForm: string;
  portionSizeLabel: string;
  balanceUnit: string;
  active: boolean;
};

const IMPORT_SESSION_ID = "spec-catalogue-v1";
const VARIANT_IMPORT_SESSION_ID = "spec-catalogue-variants-v1";

function InventoryPage() {
  const { user, role } = useAuth();
  const canManage = role !== null;
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [variants, setVariants] = useState<InventoryVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSeed, setLoadingSeed] = useState(false);
  const [seedLoaded, setSeedLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editingVariant, setEditingVariant] = useState<InventoryVariant | null>(null);
  const [queryText, setQueryText] = useState("");
  const [category, setCategory] = useState("all");
  const [confirmation, setConfirmation] = useState("all");

  const loadData = useCallback(async (db: Firestore, checkSeedSession: boolean) => {
    const issues: string[] = [];
    let itemsSnapshot;
    try {
      itemsSnapshot = await getDocs(collection(db, "inventoryItems"));
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : "Unknown Firestore error";
      throw new Error(`Could not read inventoryItems: ${detail}`);
    }

    const catalogue = itemsSnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as InventoryItem);
    setItems(catalogue.sort((left, right) => left.name.localeCompare(right.name)));
    try {
      const variantsSnapshot = await getDocs(collection(db, "stockVariants"));
      setVariants(variantsSnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as InventoryVariant));
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : "Unknown Firestore error";
      setVariants([]);
      issues.push(`Could not read stockVariants: ${detail}`);
    }

    if (checkSeedSession) {
      try {
        const seedSession = await getDoc(doc(db, "importSessions", IMPORT_SESSION_ID));
        setSeedLoaded(seedSession.exists());
      } catch (cause) {
        const detail = cause instanceof Error ? cause.message : "Unknown Firestore error";
        issues.push(`Could not check import session: ${detail}`);
      }
    }

    setWarnings(issues);
    return issues;
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      setWarnings([]);
      try {
        const { db, firebaseConfigError } = await import("@/lib/firebase");
        if (!db || firebaseConfigError) throw new Error(firebaseConfigError ?? "Cloud Firestore is unavailable.");
        await loadData(db, canManage);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load the inventory catalogue.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [canManage, loadData]);

  const categories = useMemo(() => [...new Set(items.map((item) => item.category))].sort(), [items]);
  const filteredItems = useMemo(() => items.filter((item) => {
    const matchesText = `${item.name} ${item.id} ${item.sourceLabel}`.toLocaleLowerCase().includes(queryText.trim().toLocaleLowerCase());
    return matchesText && (category === "all" || item.category === category) && (confirmation === "all" || item.confirmationStatus === confirmation);
  }), [category, confirmation, items, queryText]);
  const pendingCount = items.filter((item) => item.confirmationStatus === "pending").length;

  async function loadStarterCatalogue() {
    if (!canManage || !user) return;
    setLoadingSeed(true);
    setError(null);
    setMessage(null);
    try {
      const { db } = await import("@/lib/firebase");
      if (!db) throw new Error("Cloud Firestore is unavailable.");
      const [existingItems, existingVariants] = await Promise.all([
        getDocs(collection(db, "inventoryItems")),
        getDocs(collection(db, "stockVariants")),
      ]);
      const existingItemIds = new Set(existingItems.docs.map((entry) => entry.id));
      const existingVariantIds = new Set(existingVariants.docs.map((entry) => entry.id));
      const batch = writeBatch(db);
      const now = new Date();

      SPEC_CATALOGUE.forEach((item) => {
        if (existingItemIds.has(item.id)) return;
        const ref = doc(db, "inventoryItems", item.id);
        batch.set(ref, {
          ...item,
          createdAt: now,
          createdBy: user.uid,
          updatedAt: now,
          updatedBy: user.uid,
        });
      });

      SPEC_VARIANTS.forEach((variant) => {
        if (existingVariantIds.has(variant.id)) return;
        const ref = doc(db, "stockVariants", variant.id);
        batch.set(ref, {
          ...variant,
          createdAt: now,
          createdBy: user.uid,
          updatedAt: now,
          updatedBy: user.uid,
        });
      });

      const sessionRef = doc(db, "importSessions", IMPORT_SESSION_ID);
      batch.set(sessionRef, {
        id: IMPORT_SESSION_ID,
        type: "catalog_items",
        sourceFileName: "spec.md product catalogue",
        sourceRowCount: SPEC_CATALOGUE.length,
        status: "committed",
        createdAt: now,
        createdBy: user.uid,
        recordIds: SPEC_CATALOGUE.map((item) => item.id),
      });

      const variantSessionRef = doc(db, "importSessions", VARIANT_IMPORT_SESSION_ID);
      batch.set(variantSessionRef, {
        id: VARIANT_IMPORT_SESSION_ID,
        type: "catalog_variants",
        sourceFileName: "spec.md explicit stock variants",
        sourceRowCount: SPEC_VARIANTS.length,
        status: "committed",
        createdAt: now,
        createdBy: user.uid,
        recordIds: SPEC_VARIANTS.map((variant) => variant.id),
      });

      await batch.commit();
      await loadData(db, true);
      setMessage(`${SPEC_CATALOGUE.length} products and ${SPEC_VARIANTS.length} explicitly specified variants loaded from spec.md. Existing records were preserved. Variant units are blank and inactive; no stock quantities or opening balances were created.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the starter catalogue.");
    } finally {
      setLoadingSeed(false);
    }
  }

  async function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingItem || !user) return;
    setError(null);
    setMessage(null);
    try {
      const { db } = await import("@/lib/firebase");
      if (!db) throw new Error("Cloud Firestore is unavailable.");
      const itemRef = doc(db, "inventoryItems", editingItem.id);
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(itemRef);
        if (!snapshot.exists()) throw new Error("This product was removed or moved. Refresh before editing.");
        transaction.update(itemRef, {
          name: editingItem.name.trim(),
          category: editingItem.category.trim(),
          status: editingItem.status,
          processingEnabled: editingItem.processingEnabled,
          confirmationStatus: editingItem.confirmationStatus,
          sourceLabel: editingItem.sourceLabel.trim(),
          confirmationNote: editingItem.confirmationNote.trim(),
          updatedAt: Timestamp.now(),
          updatedBy: user.uid,
        });
      });
      setMessage(`${editingItem.name} updated in the shared catalogue.`);
      setEditingItem(null);
      const { db: refreshedDb } = await import("@/lib/firebase");
      if (refreshedDb) await loadData(refreshedDb, canManage);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update product.");
    }
  }

  async function saveVariant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingVariant || !user) return;
    setError(null);
    setMessage(null);
    try {
      const { db } = await import("@/lib/firebase");
      if (!db) throw new Error("Cloud Firestore is unavailable.");
      const variantRef = doc(db, "stockVariants", editingVariant.id);
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(variantRef);
        if (!snapshot.exists()) throw new Error("This variant no longer exists. Refresh before editing.");
        const existing = snapshot.data();
        transaction.update(variantRef, {
          processingState: editingVariant.processingState.trim(),
          stockForm: editingVariant.stockForm.trim(),
          portionSizeLabel: editingVariant.portionSizeLabel.trim(),
          balanceUnit: editingVariant.balanceUnit.trim(),
          active: editingVariant.active,
          ...(editingVariant.brand !== undefined ? { brand: editingVariant.brand.trim() } : {}),
          ...(editingVariant.packSize !== undefined ? { packSize: editingVariant.packSize.trim() } : {}),
          ...(editingVariant.purchaseUnit !== undefined ? { purchaseUnit: editingVariant.purchaseUnit.trim() } : {}),
          ...(editingVariant.purchaseToBalanceFactor !== undefined ? { purchaseToBalanceFactor: editingVariant.purchaseToBalanceFactor } : {}),
          ...(editingVariant.reorderThreshold !== undefined ? { reorderThreshold: editingVariant.reorderThreshold } : {}),
          createdAt: existing.createdAt ?? Timestamp.now(),
          createdBy: existing.createdBy ?? user.uid,
          updatedAt: Timestamp.now(),
          updatedBy: user.uid,
        });
      });
      setMessage("Stock variant updated. Existing movement units and balances were not changed.");
      setEditingVariant(null);
      const { db: refreshedDb } = await import("@/lib/firebase");
      if (refreshedDb) await loadData(refreshedDb, canManage);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update stock variant.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-360 min-w-0 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Operations core</p>
          <h1 className="mt-1 text-2xl font-bold text-primary sm:text-3xl">Inventory</h1>
          <p className="mt-1 max-w-3xl text-sm text-on-surface-variant">One shared catalogue of products. Pending identities stay visible for review and never create stock balances.</p>
        </div>
        {canManage && !seedLoaded && (
          <button className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-container disabled:cursor-wait disabled:opacity-60" disabled={loadingSeed || loading} onClick={() => void loadStarterCatalogue()} type="button">
            <Icon name="playlist_add" />
            {loadingSeed ? "Loading catalogue..." : "Load starter catalogue"}
          </button>
        )}
      </header>

      {error && <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-error/30 bg-error-container/50 p-3 text-sm text-on-error-container" role="alert"><span>{error}</span><button className="min-h-10 rounded border border-error/30 px-3 font-medium" onClick={() => window.location.reload()} type="button">Retry</button></div>}
      {warnings.map((warning) => <p className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-on-surface" key={warning} role="status">{warning}</p>)}
      {message && <p className="rounded-md border border-primary/20 bg-muted p-3 text-sm text-on-surface" role="status">{message}</p>}

      {editingItem && <EditorDialog title={`Edit ${editingItem.name}`} onClose={() => setEditingItem(null)} onSubmit={saveItem}>
        <label className="flex flex-col gap-1 text-sm font-medium">Name<input className="min-h-11 rounded border border-outline-variant px-3 text-base" onChange={(event) => setEditingItem({ ...editingItem, name: event.target.value })} required value={editingItem.name} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">Category<input className="min-h-11 rounded border border-outline-variant px-3 text-base" onChange={(event) => setEditingItem({ ...editingItem, category: event.target.value })} required value={editingItem.category} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">Source label<input className="min-h-11 rounded border border-outline-variant px-3 text-base" onChange={(event) => setEditingItem({ ...editingItem, sourceLabel: event.target.value })} value={editingItem.sourceLabel} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">Confirmation note<textarea className="min-h-20 rounded border border-outline-variant p-3 text-base" onChange={(event) => setEditingItem({ ...editingItem, confirmationNote: event.target.value })} value={editingItem.confirmationNote} /></label>
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium"><input checked={editingItem.confirmationStatus === "confirmed"} className="h-5 w-5 accent-primary" onChange={(event) => setEditingItem({ ...editingItem, confirmationStatus: event.target.checked ? "confirmed" : "pending" })} type="checkbox" />Identity confirmed</label>
        <label className="flex flex-col gap-1 text-sm font-medium">Catalogue state<select className="min-h-11 rounded border border-outline-variant px-3 text-base" onChange={(event) => setEditingItem({ ...editingItem, status: event.target.value as InventoryItem["status"] })} value={editingItem.status}><option value="active">Active</option><option value="archived">Archived</option></select></label>
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium"><input checked={editingItem.processingEnabled} className="h-5 w-5 accent-primary" onChange={(event) => setEditingItem({ ...editingItem, processingEnabled: event.target.checked })} type="checkbox" />Processing variants apply to this item</label>
        <p className="text-xs text-on-surface-variant">This edits catalogue identity only; it does not create variants or change stock quantities.</p>
      </EditorDialog>}
      {editingVariant && <EditorDialog title="Edit stock variant" onClose={() => setEditingVariant(null)} onSubmit={saveVariant}>
        <p className="break-all font-mono text-xs text-on-surface-variant">{editingVariant.id}</p>
        <label className="flex flex-col gap-1 text-sm font-medium">Processing state<input className="min-h-11 rounded border border-outline-variant px-3 text-base" onChange={(event) => setEditingVariant({ ...editingVariant, processingState: event.target.value })} required value={editingVariant.processingState} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">Stock form<input className="min-h-11 rounded border border-outline-variant px-3 text-base" onChange={(event) => setEditingVariant({ ...editingVariant, stockForm: event.target.value })} required value={editingVariant.stockForm} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">Portion-size label (optional)<input className="min-h-11 rounded border border-outline-variant px-3 text-base" onChange={(event) => setEditingVariant({ ...editingVariant, portionSizeLabel: event.target.value })} value={editingVariant.portionSizeLabel} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">Balance unit<input className="min-h-11 rounded border border-outline-variant px-3 text-base" onChange={(event) => setEditingVariant({ ...editingVariant, balanceUnit: event.target.value })} required value={editingVariant.balanceUnit} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">Brand (optional)<input className="min-h-11 rounded border border-outline-variant px-3 text-base" onChange={(event) => setEditingVariant({ ...editingVariant, brand: event.target.value })} value={editingVariant.brand ?? ""} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">Purchase unit (optional)<input className="min-h-11 rounded border border-outline-variant px-3 text-base" onChange={(event) => setEditingVariant({ ...editingVariant, purchaseUnit: event.target.value })} value={editingVariant.purchaseUnit ?? ""} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">Purchase-to-balance factor (confirmed only)<input className="min-h-11 rounded border border-outline-variant px-3 text-base" min="0.000001" onChange={(event) => setEditingVariant({ ...editingVariant, purchaseToBalanceFactor: event.target.value === "" ? undefined : Number(event.target.value) })} step="any" type="number" value={editingVariant.purchaseToBalanceFactor ?? ""} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">Reorder threshold (optional)<input className="min-h-11 rounded border border-outline-variant px-3 text-base" min="0" onChange={(event) => setEditingVariant({ ...editingVariant, reorderThreshold: event.target.value === "" ? undefined : Number(event.target.value) })} step="any" type="number" value={editingVariant.reorderThreshold ?? ""} /></label>
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium"><input checked={editingVariant.active} className="h-5 w-5 accent-primary" onChange={(event) => setEditingVariant({ ...editingVariant, active: event.target.checked })} type="checkbox" />Available in stock workflows</label>
        <p className="text-xs text-on-surface-variant">Choose the actual unit and any conversion factor carefully. Historical movement quantities will not be reinterpreted.</p>
      </EditorDialog>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Summary label="Catalogue candidates" value={loading ? "—" : String(items.length)} />
        <Summary label="Needs confirmation" value={loading ? "—" : String(pendingCount)} />
        <Summary label="Active records" value={loading ? "—" : String(items.filter((item) => item.status === "active").length)} />
      </div>

      <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 sm:p-5">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_minmax(180px,0.7fr)_minmax(180px,0.7fr)]">
          <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Search catalogue
            <span className="relative"><Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-lg text-on-surface-variant" /><input className="min-h-11 w-full min-w-0 rounded-md border border-outline-variant bg-surface px-3 pl-10 text-base" onChange={(event) => setQueryText(event.target.value)} placeholder="Name or stable ID" value={queryText} /></span>
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Category
            <select className="min-h-11 w-full rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => setCategory(event.target.value)} value={category}><option value="all">All categories</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Confirmation
            <select className="min-h-11 w-full rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => setConfirmation(event.target.value)} value={confirmation}><option value="all">All records</option><option value="pending">Needs confirmation</option><option value="confirmed">Confirmed</option></select>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-outline-variant pt-3 text-sm text-on-surface-variant">
          <span>{loading ? "Loading catalogue..." : `Showing ${filteredItems.length} of ${items.length}`}</span>
          <span className="rounded-full bg-surface-container px-3 py-1 text-xs">No stock quantities configured</span>
        </div>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-on-surface-variant" role="status"><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />Loading catalogue</div>
        ) : filteredItems.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center px-4 py-10 text-center">
            <Icon name="inventory_2" className="text-3xl text-outline" />
            <h2 className="mt-3 font-semibold text-on-surface">{items.length ? "No matching catalogue records" : "Catalogue is empty"}</h2>
            <p className="mt-1 max-w-lg text-sm text-on-surface-variant">{items.length ? "Change your filters to view other records." : canManage ? "Load the product catalogue from spec.md or import a catalogue file." : "Sign in with an approved staff account to continue."}</p>
          </div>
        ) : (
          <>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:hidden">
              {filteredItems.map((item) => <ItemCard item={item} key={item.id} variants={variants.filter((variant) => variant.itemId === item.id)} canManage={canManage} onEditItem={() => setEditingItem(item)} onEditVariant={setEditingVariant} />)}
            </div>
            <div aria-label="Inventory catalogue table; scroll horizontally to view more columns" className="hidden min-w-0 overflow-x-auto rounded-md border border-outline-variant xl:block" role="region" tabIndex={0}>
              <table className="w-full min-w-225 text-left text-sm">
                <thead className="bg-surface-container text-xs uppercase text-on-surface-variant"><tr>{["Item", "Category", "Status", "Processing", "Source / confirmation", "Stock unit"].map((heading) => <th className="whitespace-nowrap px-3 py-3 font-semibold" key={heading}>{heading}</th>)}</tr></thead>
                <tbody>{filteredItems.map((item) => {
                  const itemVariants = variants.filter((variant) => variant.itemId === item.id);
                  return <tr className="border-t border-outline-variant" key={item.id}>
                    <td className="max-w-64 px-3 py-3"><span className="block wrap-break-word font-medium text-on-surface">{item.name}</span><span className="mt-0.5 block font-mono text-xs text-on-surface-variant">{item.id}</span></td>
                    <td className="px-3 py-3">{item.category}</td>
                    <td className="px-3 py-3"><StatusPill pending={item.confirmationStatus === "pending"}>{item.confirmationStatus === "pending" ? "Needs confirmation" : item.status}</StatusPill></td>
                    <td className="max-w-56 px-3 py-3">{itemVariants.length ? <ul className="space-y-1">{itemVariants.map((variant) => <li className="wrap-break-word" key={variant.id}>{variant.processingState}{variant.stockForm ? ` · ${variant.stockForm}` : ""}<span className="block font-mono text-[11px] text-on-surface-variant">{variant.id} · {variant.balanceUnit || "unit not configured"} · {variant.active ? "active" : "draft"}</span></li>)}</ul> : item.processingEnabled ? "Listed variants need confirmation" : "Not applicable / not configured"}</td>
                    <td className="max-w-80 wrap-break-word px-3 py-3 text-on-surface-variant">{item.confirmationNote || "No note"}</td>
                    <td className="px-3 py-3"><div className="flex flex-wrap gap-1">{canManage && <button className="min-h-9 rounded border border-outline-variant px-2 text-xs" onClick={() => setEditingItem(item)} type="button">Edit item</button>}{itemVariants.map((variant) => canManage && <button className="min-h-9 rounded border border-outline-variant px-2 text-xs" key={variant.id} onClick={() => setEditingVariant(variant)} type="button">Edit variant</button>)}</div></td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function EditorDialog({ title, onClose, onSubmit, children }: { title: string; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <form aria-label={title} className="max-h-[90dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-xl bg-surface-container-lowest p-4 shadow-xl sm:rounded-xl sm:p-6" onSubmit={onSubmit}>
      <div className="flex items-start justify-between gap-3"><h2 className="text-lg font-semibold text-on-surface">{title}</h2><button aria-label="Close editor" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-surface-container" onClick={onClose} type="button"><Icon name="close" /></button></div>
      {children}
      <div className="flex flex-col-reverse gap-2 border-t border-outline-variant pt-4 sm:flex-row sm:justify-end"><button className="min-h-11 rounded-md border border-outline-variant px-4 font-semibold" onClick={onClose} type="button">Cancel</button><button className="min-h-11 rounded-md bg-primary px-5 font-semibold text-on-primary" type="submit">Save changes</button></div>
    </form>
  </div>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-3 sm:px-4"><p className="wrap-break-word text-xs text-on-surface-variant">{label}</p><p className="mt-1 text-xl font-semibold text-primary">{value}</p></div>;
}

function StatusPill({ children, pending }: { children: string; pending: boolean }) {
  return <span className={`inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${pending ? "bg-warning/10 text-warning" : "bg-muted text-primary"}`}><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${pending ? "bg-warning" : "bg-primary"}`} />{children}</span>;
}

function ItemCard({ item, variants, canManage, onEditItem, onEditVariant }: { item: InventoryItem; variants: InventoryVariant[]; canManage: boolean; onEditItem: () => void; onEditVariant: (variant: InventoryVariant) => void }) {
  const pending = item.confirmationStatus === "pending";
  return <article className="min-w-0 rounded-md border border-outline-variant p-3 sm:p-4">
    <div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><h2 className="wrap-break-word font-semibold text-on-surface">{item.name}</h2><p className="mt-1 break-all font-mono text-xs text-on-surface-variant">{item.id}</p></div><StatusPill pending={pending}>{pending ? "Needs confirmation" : "Confirmed"}</StatusPill></div>
    <dl className="mt-4 grid min-w-0 grid-cols-2 gap-x-3 gap-y-3 text-sm"><div className="min-w-0"><dt className="text-xs text-on-surface-variant">Category</dt><dd className="mt-0.5 wrap-break-word font-medium text-on-surface">{item.category}</dd></div><div className="min-w-0"><dt className="text-xs text-on-surface-variant">Processing</dt><dd className="mt-0.5 wrap-break-word font-medium text-on-surface">{item.processingEnabled ? "See listed variants" : "Not applicable / not set"}</dd></div><div className="min-w-0"><dt className="text-xs text-on-surface-variant">Stock unit</dt><dd className="mt-0.5 text-on-surface-variant">Not configured</dd></div><div className="min-w-0"><dt className="text-xs text-on-surface-variant">Quantity</dt><dd className="mt-0.5 text-on-surface-variant">Not recorded</dd></div></dl>
    {variants.length > 0 && <div className="mt-4 border-t border-outline-variant pt-3"><h3 className="text-xs font-semibold uppercase text-on-surface-variant">Stock variants</h3><ul className="mt-2 space-y-2">{variants.map((variant) => <li className="min-w-0 rounded bg-surface-container-low px-2.5 py-2 text-sm" key={variant.id}><span className="wrap-break-word font-medium text-on-surface">{variant.processingState}{variant.stockForm ? ` · ${variant.stockForm}` : ""}</span><span className="mt-0.5 block break-all font-mono text-[11px] text-on-surface-variant">{variant.id}</span><span className="mt-1 block text-xs text-on-surface-variant">{variant.balanceUnit || "Unit not configured"} · {variant.active ? "Active" : "Draft"}</span></li>)}</ul></div>}
    {item.confirmationNote && <p className="mt-4 wrap-break-word border-t border-outline-variant pt-3 text-xs leading-5 text-on-surface-variant">{item.confirmationNote}</p>}
    {canManage && <div className="mt-4 flex flex-wrap gap-2 border-t border-outline-variant pt-3"><button className="min-h-10 rounded border border-outline-variant px-3 text-xs font-medium" onClick={onEditItem} type="button">Edit item</button>{variants.map((variant) => <button className="min-h-10 rounded border border-outline-variant px-3 text-xs font-medium" key={variant.id} onClick={() => onEditVariant(variant)} type="button">Edit {variant.processingState} variant</button>)}</div>}
  </article>;
}
