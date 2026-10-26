import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";

import { Icon } from "@/components/erp/icon";
import { useAuth } from "@/components/auth/auth-provider";
import {
  calculateAvailableForVariant,
  loadCatalogue,
  loadPostedMovements,
  postMovementOperation,
  type LocationRecord,
  type MovementLineInput,
  type MovementType,
  type PostedMovement,
  type StockVariantRecord,
} from "@/lib/inventory-service";
import type { InventoryItemRecord } from "@/lib/inventory-service";

export type StockWorkflow = "receipt" | "issue" | "return" | "waste" | "preparation";

const CONFIG: Record<StockWorkflow, { title: string; intro: string; type: MovementType; button: string }> = {
  receipt: { title: "Receive Stock", intro: "Record incoming stock once; the ledger updates balances and activity.", type: "receipt", button: "Review receipt" },
  issue: { title: "Issue Stock", intro: "Issue eligible stock to a destination or purpose.", type: "issue", button: "Review issue" },
  return: { title: "Return Stock", intro: "Record returned quantity and its observed condition.", type: "return", button: "Review return" },
  waste: { title: "Record Waste", intro: "Record stock disposal separately from normal issues.", type: "waste", button: "Review waste" },
  preparation: { title: "Stock Preparation", intro: "Consume source stock and record actual prepared output without assumed yields.", type: "preparation_input", button: "Review preparation" },
};

type LineDraft = {
  itemId: string;
  variantId: string;
  locationId: string;
  outputVariantId: string;
  outputLocationId: string;
  quantity: string;
  outputQuantity: string;
  outputForm: string;
  reason: string;
  reference: string;
  batchId: string;
};

const blankLine = (): LineDraft => ({ itemId: "", variantId: "", locationId: "", outputVariantId: "", outputLocationId: "", quantity: "", outputQuantity: "", outputForm: "", reason: "", reference: "", batchId: "" });

export function StockWorkflowPage({ workflow }: { workflow: StockWorkflow }) {
  const { user } = useAuth();
  const config = CONFIG[workflow];
  const [items, setItems] = useState<InventoryItemRecord[]>([]);
  const [variants, setVariants] = useState<StockVariantRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [movements, setMovements] = useState<PostedMovement[]>([]);
  const [lines, setLines] = useState<LineDraft[]>([blankLine()]);
  const [effectiveAt, setEffectiveAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [condition, setCondition] = useState<"Good" | "Needs review" | "Bad" | "Not checked">("Not checked");
  const [destination, setDestination] = useState("");
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { db, firebaseConfigError } = await import("@/lib/firebase");
      if (!db || firebaseConfigError) throw new Error(firebaseConfigError ?? "Cloud Firestore is unavailable.");
      const [catalogue, ledger] = await Promise.all([loadCatalogue(db), loadPostedMovements(db)]);
      setItems(catalogue.items);
      setVariants(catalogue.variants);
      setLocations(catalogue.locations);
      setMovements(ledger);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load inventory data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const eligibleItems = useMemo(() => items.filter((item) => item.status === "active" && item.confirmationStatus === "confirmed"), [items]);
  const eligibleVariants = useMemo(() => variants.filter((variant) => variant.active && variant.balanceUnit), [variants]);
  const history = useMemo(() => movements.filter((movement) => {
    if (workflow === "receipt") return movement.type === "receipt";
    if (workflow === "issue") return movement.type === "issue";
    if (workflow === "return") return movement.type === "return";
    if (workflow === "waste") return movement.type === "waste";
    return movement.type.startsWith("preparation_");
  }).sort((a, b) => b.effectiveAt.toMillis() - a.effectiveAt.toMillis()).slice(0, 20), [movements, workflow]);

  function updateLine(index: number, field: keyof LineDraft, value: string) {
    setLines((current) => current.map((line, row) => row === index ? { ...line, [field]: value, ...(field === "itemId" ? { variantId: "" } : {}) } : line));
  }

  function addLine() { setLines((current) => [...current, blankLine()]); }
  function removeLine(index: number) { setLines((current) => current.filter((_, row) => row !== index)); }

  function getAvailable(variantId: string, locationId: string) {
    return calculateAvailableForVariant(movements, variantId, locationId);
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const validation = lines.map((line, index) => {
      const variant = variants.find((entry) => entry.id === line.variantId);
      const quantity = Number(line.quantity);
      if (!variant || !line.locationId) return `Line ${index + 1}: select a configured variant and location.`;
      if (!Number.isFinite(quantity) || quantity <= 0) return `Line ${index + 1}: quantity must be greater than zero.`;
      if (!line.reason.trim()) return `Line ${index + 1}: reason is required.`;
      if (workflow === "preparation") {
        const outputVariant = variants.find((entry) => entry.id === line.outputVariantId);
        const outputQuantity = Number(line.outputQuantity);
        if (!outputVariant || !line.outputLocationId) return `Line ${index + 1}: select a configured output variant and location.`;
        if (!Number.isFinite(outputQuantity) || outputQuantity <= 0) return `Line ${index + 1}: enter the actual measured output quantity.`;
        if (outputVariant.balanceUnit !== variant.balanceUnit && !line.outputForm.trim()) return `Line ${index + 1}: describe the output form when units differ.`;
      }
      if (workflow !== "receipt" && workflow !== "return" && workflow !== "preparation" && quantity > getAvailable(variant.id, line.locationId)) {
        return `Line ${index + 1}: only ${getAvailable(variant.id, line.locationId)} ${variant.balanceUnit} is available.`;
      }
      return "";
    }).filter(Boolean);
    if (validation.length) { setError(validation.join(" ")); return; }
    if ((workflow === "issue" || workflow === "return") && !destination.trim()) { setError("Enter the destination or source reference."); return; }
    setPreview(true);
  }

  async function post(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const { db } = await import("@/lib/firebase");
      if (!db) throw new Error("Cloud Firestore is unavailable.");
      const date = new Date(effectiveAt);
      const movementLines: MovementLineInput[] = lines.map((line) => {
        const item = items.find((entry) => entry.id === line.itemId);
        const variant = variants.find((entry) => entry.id === line.variantId);
        if (!item || !variant) throw new Error("A selected catalogue record is no longer available.");
        return {
          itemId: item.id,
          variantId: variant.id,
          locationId: line.locationId,
          ...(line.batchId ? { batchId: line.batchId } : {}),
          type: config.type,
          quantity: Number(line.quantity),
          unit: variant.balanceUnit,
          reason: workflow === "issue" ? `${line.reason.trim()} · Destination: ${destination.trim()}` : workflow === "return" ? `${line.reason.trim()} · Returned from: ${destination.trim()}` : line.reason.trim(),
          reference: line.reference.trim() || destination.trim(),
          effectiveAt: date,
          ...(workflow === "receipt" ? { condition } : {}),
        };
      });

      if (workflow === "preparation") {
        movementLines.forEach((line) => { line.type = "preparation_input"; });
        const outputs = lines.map((line, index): MovementLineInput => {
          const outputVariant = variants.find((entry) => entry.id === line.outputVariantId)!;
          return {
            itemId: outputVariant.itemId,
            variantId: outputVariant.id,
            locationId: line.outputLocationId,
            type: "preparation_output",
            quantity: Number(line.outputQuantity),
            signedQuantity: Number(line.outputQuantity),
            unit: outputVariant.balanceUnit,
            reason: `Preparation output${line.outputForm.trim() ? ` (${line.outputForm.trim()})` : ""}: ${line.reason.trim()}`,
            reference: line.reference.trim(),
            effectiveAt: date,
          };
        });
        await postMovementOperation(db, [...movementLines, ...outputs], user.uid);
      } else {
        await postMovementOperation(db, movementLines, user.uid);
      }

      setMessage(`Posted ${movementLines.length} ${workflow === "preparation" ? "preparation input/output line pair(s)" : `${workflow} line(s)`}.`);
      setLines([blankLine()]);
      setDestination("");
      setPreview(false);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not post stock operation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-360 min-w-0 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header><p className="text-xs font-semibold uppercase tracking-wider text-secondary">Operations core</p><h1 className="mt-1 text-2xl font-bold text-primary sm:text-3xl">{config.title}</h1><p className="mt-1 max-w-3xl text-sm text-on-surface-variant">{config.intro}</p></header>
      {error && <p className="rounded-md border border-error/30 bg-error-container/50 p-3 text-sm text-on-error-container" role="alert">{error}</p>}
      {message && <p className="rounded-md border border-primary/20 bg-muted p-3 text-sm text-on-surface" role="status">{message}</p>}
      {loading ? <p className="py-12 text-center text-sm text-on-surface-variant" role="status">Loading shared inventory data...</p> : eligibleItems.length === 0 || eligibleVariants.length === 0 || locations.length === 0 ? (
        <section className="rounded-lg border border-warning/30 bg-warning/10 p-5 text-sm text-on-surface"><h2 className="font-semibold">Configuration required before posting</h2><ul className="mt-2 list-disc space-y-1 pl-5"><li>Confirm catalogue item identities.</li><li>Activate stock variants and set each balance unit.</li><li>Add active storage or kitchen locations in Settings.</li></ul><p className="mt-3">This form will not create a balance using an unknown unit or location.</p></section>
      ) : (
        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          <form className="flex min-w-0 flex-col gap-5 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 sm:p-5" onSubmit={preview ? post : review}>
            <div className="grid gap-3 sm:grid-cols-2"><label className="flex flex-col gap-1 text-sm font-medium">Effective date/time<input className="min-h-11 rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => setEffectiveAt(event.target.value)} required type="datetime-local" value={effectiveAt} /></label>{workflow === "receipt" && <label className="flex flex-col gap-1 text-sm font-medium">Receipt condition<input aria-label="Confirm receipt condition" checked={condition === "Good"} className="mr-2 h-5 w-5 accent-primary" onChange={(event) => setCondition(event.target.checked ? "Good" : "Not checked")} type="checkbox" /><span className="font-normal">Confirm Good at receipt</span></label>}</div>
            {(workflow === "issue" || workflow === "return") && <label className="flex flex-col gap-1 text-sm font-medium">{workflow === "issue" ? "Destination / purpose" : "Returned from / original reference"}<input className="min-h-11 rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => setDestination(event.target.value)} required value={destination} /></label>}
            <div className="flex items-center justify-between gap-3"><h2 className="font-semibold text-on-surface">{workflow === "preparation" ? "Source and output lines" : "Stock lines"}</h2><button className="min-h-11 rounded-md border border-outline-variant px-3 text-sm font-semibold hover:bg-surface-container" onClick={addLine} type="button">Add line</button></div>
            {lines.map((line, index) => {
              const itemVariants = eligibleVariants.filter((variant) => variant.itemId === line.itemId);
              const selectedVariant = itemVariants.find((variant) => variant.id === line.variantId);
              const available = selectedVariant && line.locationId ? getAvailable(selectedVariant.id, line.locationId) : null;
              return <fieldset className="grid min-w-0 gap-3 rounded-md border border-outline-variant p-3 sm:grid-cols-2 lg:grid-cols-3" key={index}><legend className="px-1 text-xs font-semibold text-on-surface-variant">Line {index + 1}</legend>
                <label className="flex min-w-0 flex-col gap-1 text-sm font-medium sm:col-span-2 lg:col-span-1">Item<select className="min-h-11 min-w-0 rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => updateLine(index, "itemId", event.target.value)} required value={line.itemId}><option value="">Select item</option>{eligibleItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Variant<select className="min-h-11 min-w-0 rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => updateLine(index, "variantId", event.target.value)} required value={line.variantId}><option value="">Select variant</option>{itemVariants.map((variant) => <option key={variant.id} value={variant.id}>{variant.processingState} · {variant.stockForm || variant.balanceUnit}</option>)}</select></label>
                <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Location<select className="min-h-11 min-w-0 rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => updateLine(index, "locationId", event.target.value)} required value={line.locationId}><option value="">Select location</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
                <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Quantity{selectedVariant && <span className="font-normal text-on-surface-variant">Unit: {selectedVariant.balanceUnit} · Available: {available ?? "—"} {selectedVariant.balanceUnit}</span>}<input className="min-h-11 min-w-0 rounded-md border border-outline-variant bg-surface px-3 text-base" inputMode="decimal" min="0.000001" onChange={(event) => updateLine(index, "quantity", event.target.value)} required step="any" type="number" value={line.quantity} /></label>
                <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Reason<input className="min-h-11 min-w-0 rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => updateLine(index, "reason", event.target.value)} required value={line.reason} /></label>
                <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Reference / batch ID<input className="min-h-11 min-w-0 rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => updateLine(index, "reference", event.target.value)} value={line.reference} /></label>
                {workflow === "preparation" && <>
                  <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Actual output variant<select className="min-h-11 min-w-0 rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => updateLine(index, "outputVariantId", event.target.value)} required value={line.outputVariantId}><option value="">Select output variant</option>{eligibleVariants.map((variant) => <option key={variant.id} value={variant.id}>{items.find((item) => item.id === variant.itemId)?.name} · {variant.processingState} · {variant.stockForm || variant.balanceUnit}</option>)}</select></label>
                  <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Output location<select className="min-h-11 min-w-0 rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => updateLine(index, "outputLocationId", event.target.value)} required value={line.outputLocationId}><option value="">Select output location</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
                  <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Actual output quantity<input className="min-h-11 min-w-0 rounded-md border border-outline-variant bg-surface px-3 text-base" inputMode="decimal" min="0.000001" onChange={(event) => updateLine(index, "outputQuantity", event.target.value)} required step="any" type="number" value={line.outputQuantity} /></label>
                  <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Output form / portion label<input className="min-h-11 min-w-0 rounded-md border border-outline-variant bg-surface px-3 text-base" onChange={(event) => updateLine(index, "outputForm", event.target.value)} placeholder="e.g. loose pieces, filled bag, 1L portion" value={line.outputForm} /></label>
                </>}
                {lines.length > 1 && <button className="min-h-11 justify-self-start rounded-md px-3 text-sm font-medium text-error hover:bg-error-container sm:col-span-2 lg:col-span-3" onClick={() => removeLine(index)} type="button">Remove line {index + 1}</button>}
              </fieldset>;
            })}
            {workflow === "preparation" && <p className="rounded-md bg-surface-container-low p-3 text-sm text-on-surface-variant">Enter actual source and output quantities separately. No yield is inferred. Source stock is consumed once; the measured output is added as a linked preparation movement.</p>}
            {preview && <section className="rounded-md border border-primary/20 bg-muted p-4"><h3 className="font-semibold text-on-surface">Review before posting</h3><ul className="mt-2 space-y-1 text-sm">{lines.map((line, index) => <li key={index}>{line.quantity} {variants.find((variant) => variant.id === line.variantId)?.balanceUnit} · {items.find((item) => item.id === line.itemId)?.name} · {line.reason}</li>)}</ul><p className="mt-2 text-xs text-on-surface-variant">Posting writes an immutable event and linked lines. Corrections require a reversal.</p></section>}
            <div className="flex flex-col-reverse gap-2 border-t border-outline-variant pt-4 sm:flex-row sm:justify-end">{preview && <button className="min-h-11 rounded-md border border-outline-variant px-4 font-semibold" onClick={() => setPreview(false)} type="button">Back to edit</button>}<button className="min-h-11 rounded-md bg-primary px-5 font-semibold text-on-primary hover:bg-primary-container disabled:opacity-60" disabled={saving} type="submit">{saving ? "Saving..." : preview ? "Post once" : config.button}</button></div>
          </form>
          <section className="min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 sm:p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Recent {workflow} activity</h2><button className="min-h-10 rounded-md px-3 text-sm font-medium hover:bg-surface-container" onClick={() => void refresh()} type="button">Refresh</button></div>{history.length ? <div className="mt-3 divide-y divide-outline-variant">{history.map((entry) => <article className="py-3" key={entry.id}><p className="break-words text-sm font-medium">{entry.quantity} {entry.unit} · {items.find((item) => item.id === entry.itemId)?.name ?? entry.itemId}</p><p className="mt-1 break-words text-xs text-on-surface-variant">{entry.reason} · {entry.reference || entry.id}</p><p className="mt-1 text-xs text-on-surface-variant">{entry.effectiveAt.toDate().toLocaleString()}</p></article>)}</div> : <p className="mt-4 text-sm text-on-surface-variant">No posted activity for this workflow yet.</p>}</section>
        </div>
      )}
    </div>
  );
}
