import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  Timestamp,
  where,
  type Firestore,
} from "firebase/firestore";

export type InventoryItemRecord = {
  id: string;
  name: string;
  category: string;
  status: "active" | "archived";
  processingEnabled: boolean;
  confirmationStatus: "confirmed" | "pending";
  sourceLabel: string;
  confirmationNote: string;
  notes?: string;
};

export type StockVariantRecord = {
  id: string;
  itemId: string;
  processingState: string;
  stockForm: string;
  portionSizeLabel: string;
  balanceUnit: string;
  active: boolean;
  brand?: string;
  packSize?: string;
  purchaseUnit?: string;
  purchaseToBalanceFactor?: number;
  reorderThreshold?: number;
};

export type LocationRecord = {
  id: string;
  name: string;
  kind: "storage" | "kitchen";
  active: boolean;
  createdAt?: Timestamp;
  createdBy?: string;
};

export type MovementType =
  | "receipt"
  | "issue"
  | "return"
  | "waste"
  | "preparation_input"
  | "preparation_output"
  | "transfer_in"
  | "transfer_out"
  | "adjustment"
  | "reversal";

export type MovementLineInput = {
  itemId: string;
  variantId: string;
  locationId: string;
  batchId?: string;
  type: MovementType;
  quantity: number;
  unit: string;
  reason: string;
  reference: string;
  effectiveAt: Date;
  signedQuantity?: number;
  relatedEventId?: string;
  purchaseQuantity?: number;
  purchaseUnit?: string;
  purchaseToBalanceFactor?: number;
  condition?: "Good" | "Needs review" | "Bad" | "Not checked";
  expiryDate?: Date;
};

export type PostedMovement = MovementLineInput & {
  id: string;
  operationId: string;
  status: "posted";
  createdAt: Timestamp;
  createdBy: string;
};

export type StockBalance = {
  variantId: string;
  locationId: string;
  quantity: number;
  unit: string;
};

const INBOUND_TYPES = new Set<MovementType>(["receipt", "return", "preparation_output", "transfer_in", "reversal"]);

export function signedQuantityFor(line: MovementLineInput): number {
  if (line.signedQuantity !== undefined) return line.signedQuantity;
  return INBOUND_TYPES.has(line.type) ? line.quantity : -line.quantity;
}

export function calculateBalances(movements: Array<Pick<PostedMovement, "variantId" | "locationId" | "unit" | "signedQuantity" | "quantity" | "type">>): StockBalance[] {
  const balances = new Map<string, StockBalance>();
  for (const movement of movements) {
    const key = `${movement.variantId}\u0000${movement.locationId}\u0000${movement.unit}`;
    const balance = balances.get(key) ?? {
      variantId: movement.variantId,
      locationId: movement.locationId,
      quantity: 0,
      unit: movement.unit,
    };
    balance.quantity += movement.signedQuantity ?? signedQuantityFor(movement as MovementLineInput);
    balances.set(key, balance);
  }
  return [...balances.values()];
}

export async function loadCatalogue(db: Firestore) {
  const [items, variants, locations] = await Promise.all([
    getDocs(collection(db, "inventoryItems")),
    getDocs(collection(db, "stockVariants")),
    getDocs(query(collection(db, "locations"), where("active", "==", true))),
  ]);
  return {
    items: items.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as InventoryItemRecord),
    variants: variants.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as StockVariantRecord),
    locations: locations.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as LocationRecord),
  };
}

export async function loadPostedMovements(db: Firestore): Promise<PostedMovement[]> {
  const snapshot = await getDocs(query(collection(db, "stockMovements"), where("status", "==", "posted")));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as PostedMovement);
}

export function calculateAvailableForVariant(
  movements: PostedMovement[],
  variantId: string,
  locationId: string,
): number {
  return movements
    .filter((movement) => movement.variantId === variantId && movement.locationId === locationId && movement.status === "posted")
    .reduce((total, movement) => total + (movement.signedQuantity ?? signedQuantityFor(movement)), 0);
}

function validateMovementLine(line: MovementLineInput) {
  if (!line.itemId || !line.variantId || !line.locationId) throw new Error("Select an item, variant, and location.");
  if (!Number.isFinite(line.quantity) || line.quantity <= 0) throw new Error("Quantity must be greater than zero.");
  if (!line.unit.trim()) throw new Error("Configure and select a balance unit before posting stock.");
  if (!line.reason.trim()) throw new Error("Enter a reason for this stock movement.");
  if (!Number.isFinite(line.effectiveAt.getTime())) throw new Error("Enter a valid effective date and time.");
  if (line.purchaseQuantity !== undefined && (!line.purchaseUnit || !line.purchaseToBalanceFactor || line.purchaseToBalanceFactor <= 0)) {
    throw new Error("Purchase quantity requires a confirmed purchase unit and conversion factor.");
  }
}

export async function postMovementOperation(
  db: Firestore,
  lines: MovementLineInput[],
  userId: string,
  operationId = crypto.randomUUID(),
): Promise<{ operationId: string; movementIds: string[] }> {
  if (!lines.length) throw new Error("Add at least one stock line.");
  lines.forEach(validateMovementLine);
  const operationRef = doc(db, "stockOperations", operationId);

  const movementIds = await runTransaction(db, async (transaction) => {
    const existingOperation = await transaction.get(operationRef);
    if (existingOperation.exists()) return existingOperation.data().movementIds as string[];

    const balanceQueries = [...new Map(lines
      .filter((line) => signedQuantityFor(line) < 0)
      .map((line) => [`${line.variantId}:${line.locationId}`, line] as const)).values()]
      .map((line) => query(
        collection(db, "stockMovements"),
        where("variantId", "==", line.variantId),
        where("locationId", "==", line.locationId),
        where("status", "==", "posted"),
      ));
    const balanceSnapshots = await Promise.all(balanceQueries.map((balanceQuery) => transaction.get(balanceQuery)));
    const existingMovements = balanceSnapshots.flatMap((snapshot) => snapshot.docs.map((entry) => entry.data() as PostedMovement));

    for (const line of lines.filter((candidate) => signedQuantityFor(candidate) < 0)) {
      const available = calculateAvailableForVariant(existingMovements, line.variantId, line.locationId);
      const requested = lines.filter((candidate) => candidate.variantId === line.variantId && candidate.locationId === line.locationId && signedQuantityFor(candidate) < 0)
        .reduce((total, candidate) => total + Math.abs(signedQuantityFor(candidate)), 0);
      if (requested > available) {
        throw new Error(`Insufficient stock for this operation. Available: ${available} ${line.unit}; requested: ${requested} ${line.unit}.`);
      }
    }

    const timestampNow = Timestamp.now();
    const createdMovementIds = lines.map(() => doc(collection(db, "stockMovements")).id);
    const movementRefs = createdMovementIds.map((id) => doc(db, "stockMovements", id));
    const existingBatches = new Set(existingMovements.map((movement) => movement.batchId).filter(Boolean));

    lines.forEach((line, index) => {
      const movementId = createdMovementIds[index];
      const batchId = line.batchId ?? (line.type === "receipt" ? doc(collection(db, "batches")).id : undefined);
      const movement: Record<string, unknown> = {
        id: movementId,
        operationId,
        itemId: line.itemId,
        variantId: line.variantId,
        locationId: line.locationId,
        type: line.type,
        quantity: line.quantity,
        signedQuantity: signedQuantityFor(line),
        unit: line.unit,
        reason: line.reason.trim(),
        reference: line.reference.trim(),
        effectiveAt: Timestamp.fromDate(line.effectiveAt),
        occurredAt: Timestamp.fromDate(line.effectiveAt),
        createdAt: timestampNow,
        createdBy: userId,
        status: "posted",
        ...(batchId ? { batchId } : {}),
        ...(line.relatedEventId ? { relatedEventId: line.relatedEventId } : line.type.startsWith("preparation_") ? { relatedEventId: operationId } : {}),
        ...(line.purchaseQuantity !== undefined ? { purchaseQuantity: line.purchaseQuantity, purchaseUnit: line.purchaseUnit, purchaseToBalanceFactor: line.purchaseToBalanceFactor } : {}),
        ...(line.condition ? { condition: line.condition } : {}),
        ...(line.expiryDate ? { labelledExpiryDate: Timestamp.fromDate(line.expiryDate) } : {}),
      };
      transaction.set(movementRefs[index], movement);

      if (line.type === "receipt" && batchId && !existingBatches.has(batchId)) {
        const batchRef = doc(db, "batches", batchId);
        transaction.set(batchRef, {
          id: batchId,
          itemId: line.itemId,
          variantId: line.variantId,
          locationId: line.locationId,
          receivedAt: Timestamp.fromDate(line.effectiveAt),
          sourceOperationId: operationId,
          ...(line.expiryDate ? { labelledExpiryDate: Timestamp.fromDate(line.expiryDate) } : {}),
          ...(line.condition ? { receiptCondition: line.condition, conditionCheckedBy: userId, conditionCheckedAt: timestampNow } : {}),
          createdAt: timestampNow,
          createdBy: userId,
        });
      }
    });

    transaction.set(operationRef, {
      id: operationId,
      movementIds: createdMovementIds,
      lineCount: lines.length,
      status: "posted",
      createdAt: timestampNow,
      createdBy: userId,
    });
    return createdMovementIds;
  });

  return { operationId, movementIds };
}

export async function savePhysicalCount(
  db: Firestore,
  input: {
    id?: string;
    itemId: string;
    variantId: string;
    locationId: string;
    batchId?: string;
    unit: string;
    countedQuantity: number;
    expectedQuantity: number;
    countedAt: Date;
    notes: string;
    status: "draft" | "observed";
  },
  userId: string,
) {
  if (!input.itemId || !input.variantId || !input.locationId || !input.unit) throw new Error("Select an item, variant, location, and unit.");
  if (!Number.isFinite(input.countedQuantity) || input.countedQuantity < 0) throw new Error("Count must be zero or greater.");
  const id = input.id ?? crypto.randomUUID();
  const countRef = doc(db, "physicalCounts", id);
  await runTransaction(db, async (transaction) => {
    const previous = await transaction.get(countRef);
    if (previous.exists() && previous.data().status !== "draft") throw new Error("Submitted count observations cannot be edited.");
    transaction.set(countRef, {
      id,
      itemId: input.itemId,
      variantId: input.variantId,
      locationId: input.locationId,
      ...(input.batchId ? { batchId: input.batchId } : {}),
      unit: input.unit,
      expectedQuantityAtCount: input.expectedQuantity,
      observedQuantity: input.countedQuantity,
      difference: input.countedQuantity - input.expectedQuantity,
      countedAt: Timestamp.fromDate(input.countedAt),
      notes: input.notes,
      status: input.status,
      countedBy: userId,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  });
  return id;
}

export async function confirmCountReconciliation(
  db: Firestore,
  count: Record<string, unknown> & { id: string; difference: number; itemId: string; variantId: string; locationId: string; unit: string },
  reason: string,
  userId: string,
) {
  if (!reason.trim()) throw new Error("Enter a reason for the count adjustment.");
  if (count.status !== "observed") throw new Error("Only submitted count observations can be reconciled.");
  if (count.difference === 0) throw new Error("This count has no variance to adjust.");
  if (count.adjustmentMovementId) throw new Error("This count already has a linked adjustment.");

  const operationId = `count-${count.id}`;
  const line: MovementLineInput = {
    itemId: count.itemId,
    variantId: count.variantId,
    locationId: count.locationId,
    ...(typeof count.batchId === "string" ? { batchId: count.batchId } : {}),
    type: "adjustment",
    quantity: Math.abs(count.difference),
    signedQuantity: count.difference,
    unit: count.unit,
    reason: reason.trim(),
    reference: `Count ${count.id}`,
    effectiveAt: new Date(),
    relatedEventId: count.id,
  };
  const result = await postMovementOperation(db, [line], userId, operationId);
  const countRef = doc(db, "physicalCounts", count.id);
  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(countRef);
    if (!current.exists()) throw new Error("The physical count no longer exists.");
    transaction.update(countRef, {
      status: "reconciled",
      adjustmentMovementId: result.movementIds[0],
      reconciledBy: userId,
      reconciledAt: Timestamp.now(),
      reconciliationReason: reason.trim(),
    });
  });
  return result.movementIds[0];
}

export async function createQualityCheck(
  db: Firestore,
  input: { batchId: string; itemId: string; variantId: string; locationId: string; condition: "Good" | "Needs review" | "Bad"; notes: string },
  userId: string,
) {
  if (!input.batchId || !input.itemId || !input.variantId || !input.locationId) throw new Error("Select a batch, item, variant, and location.");
  if (!input.condition) throw new Error("Select a condition.");
  const id = crypto.randomUUID();
  await runTransaction(db, async (transaction) => {
    const batchRef = doc(db, "batches", input.batchId);
    const batchSnapshot = await transaction.get(batchRef);
    if (!batchSnapshot.exists()) throw new Error("Selected batch no longer exists.");
    const checkRef = doc(db, "qualityChecks", id);
    const now = Timestamp.now();
    transaction.set(checkRef, {
      id,
      ...input,
      notes: input.notes.trim(),
      checkedAt: now,
      checkedBy: userId,
      createdAt: now,
    });
    transaction.update(batchRef, {
      latestCondition: input.condition,
      latestConditionAt: now,
      latestConditionBy: userId,
    });
  });
  return id;
}

export async function createLocation(db: Firestore, name: string, kind: LocationRecord["kind"], userId: string) {
  if (!name.trim()) throw new Error("Enter a location name.");
  const id = crypto.randomUUID();
  await runTransaction(db, async (transaction) => {
    const locationRef = doc(db, "locations", id);
    transaction.set(locationRef, {
      id,
      name: name.trim(),
      kind,
      active: true,
      createdAt: Timestamp.now(),
      createdBy: userId,
    });
  });
  return id;
}
