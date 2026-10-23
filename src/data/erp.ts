/* Demo operational data mirroring the approved reference screens. */

export type AttentionTag = "low-stock" | "discrepancy" | "expiring";

export type AttentionRow = {
  id: string;
  icon: string;
  name: string;
  sub: string;
  location: string;
  balance: string;
  balanceUnit: string;
  balanceClass: string;
  reorder: string;
  badge: { icon: string; text: string; className: string };
  action: string;
  actionClass: string;
  tags: AttentionTag[];
  rowClass: string;
};

export const ATTENTION_ROWS: AttentionRow[] = [
  {
    id: "goat",
    icon: "set_meal",
    name: "Goat Meat (Diced, Premium Cut)",
    sub: "Batch #GM-240-LK",
    location: "Walk-in Cold Room A",
    balance: "28.5",
    balanceUnit: "kg",
    balanceClass: "text-primary",
    reorder: "20.0 kg",
    badge: {
      icon: "scale",
      text: "Variance: -3.5kg",
      className: "bg-error-container text-on-error-container",
    },
    action: "Review Scale Count",
    actionClass: "bg-secondary text-on-secondary hover:bg-on-secondary-container",
    tags: ["discrepancy"],
    rowClass: "",
  },
  {
    id: "chicken",
    icon: "egg",
    name: "Fresh Hard Chicken",
    sub: "Portioned: Legs / Breasts",
    location: "Deep Freezer 2",
    balance: "144",
    balanceUnit: "pcs (12 Ctns)",
    balanceClass: "text-primary",
    reorder: "10 Ctns",
    badge: {
      icon: "lock",
      text: "Portion Locked",
      className: "bg-surface-container text-surface-tint",
    },
    action: "View Batches",
    actionClass: "bg-surface-container hover:bg-surface-container-high text-on-surface",
    tags: [],
    rowClass: "bg-surface-container-low/20",
  },
  {
    id: "bowls",
    icon: "takeout_dining",
    name: "1.5L Soup Takeaway Bowls",
    sub: "PET Grade Injection",
    location: "Dry Packaging Bay 4",
    balance: "185",
    balanceUnit: "bowls",
    balanceClass: "text-secondary",
    reorder: "250 bowls",
    badge: {
      icon: "trending_down",
      text: "Low Stock Warning",
      className: "bg-secondary-fixed text-on-secondary-fixed",
    },
    action: "Create Reorder PO",
    actionClass: "bg-secondary text-on-secondary hover:bg-on-secondary-container",
    tags: ["low-stock"],
    rowClass: "",
  },
  {
    id: "ofe-owerri",
    icon: "soup_kitchen",
    name: "Ofe Owerri Prepared Base",
    sub: "8x1L, 14x2.5L, 6x3.5L, 4x5L",
    location: "Chiller 1 (Cooked)",
    balance: "84.0",
    balanceUnit: "Litres",
    balanceClass: "text-primary",
    reorder: "30.0 L",
    badge: {
      icon: "verified",
      text: "Freshness: Optimal",
      className: "bg-surface-container-high text-primary",
    },
    action: "Portion / Pack",
    actionClass: "bg-primary text-on-primary hover:bg-primary-container",
    tags: ["expiring"],
    rowClass: "bg-surface-container-low/20",
  },
  {
    id: "catfish",
    icon: "phishing",
    name: "Catfish (Medium Grade)",
    sub: "Point of Kill Frozen",
    location: "Freezer 1",
    balance: "38",
    balanceUnit: "pcs",
    balanceClass: "text-primary",
    reorder: "50 pcs",
    badge: {
      icon: "schedule",
      text: "QA Due: 24h",
      className: "bg-secondary-fixed text-on-secondary-fixed",
    },
    action: "QA Check",
    actionClass: "bg-surface-container hover:bg-surface-container-high text-on-surface",
    tags: ["low-stock", "expiring"],
    rowClass: "",
  },
];

export type LedgerEvent = {
  id: string;
  icon: string;
  circleClass: string;
  label: string;
  labelClass: string;
  time: string;
  headline: string;
  detail: string;
};

export const LEDGER_EVENTS: LedgerEvent[] = [
  {
    id: "intake",
    icon: "arrow_downward",
    circleClass: "bg-primary-container text-on-primary",
    label: "Kilograms Intake (KG)",
    labelClass: "text-primary",
    time: "08:15 WAT",
    headline: "+45.0 kg Raw Bulk Meat",
    detail: "Vendor: Alhaji Musa (Apapa Abattoir) • Invoice #8832",
  },
  {
    id: "soup",
    icon: "soup_kitchen",
    circleClass: "bg-surface-tint text-on-primary",
    label: "Soup Output (LITRES)",
    labelClass: "text-primary",
    time: "09:30 WAT",
    headline: "18 Pots Finished (90.0 Litres)",
    detail: "Batches: Egusi Special (10 Pots) & Ogbono Base (8 Pots)",
  },
  {
    id: "grandma-rule",
    icon: "rule",
    circleClass: "bg-secondary text-on-secondary",
    label: "Grandma's Packaging Rule",
    labelClass: "text-secondary",
    time: "Auto-calc",
    headline: "36 Packaging Bowls Locked",
    detail: "18x 4L Soup Bowls + 18x 1.5L buffer bowls reserved automatically",
  },
  {
    id: "wastage",
    icon: "delete_sweep",
    circleClass: "bg-error text-on-error",
    label: "Wastage Discard (KG)",
    labelClass: "text-error",
    time: "10:10 WAT",
    headline: "-5.5 kg Spoiled Peppers / Leaf",
    detail: "Auth: Sous Chef Blessing A. • Trimming loss",
  },
];

export type Quota = {
  id: string;
  label: string;
  progressText: string;
  pct: number;
  textClass: string;
  barClass: string;
};

export const PRODUCTION_QUOTAS: Quota[] = [
  {
    id: "egusi",
    label: "Egusi Mega Pot Production",
    progressText: "10 / 12 Pots (83%)",
    pct: 83,
    textClass: "text-primary",
    barClass: "bg-primary",
  },
  {
    id: "ogbono",
    label: "Ogbono Native Stock",
    progressText: "8 / 8 Pots (100%)",
    pct: 100,
    textClass: "text-surface-tint",
    barClass: "bg-surface-tint",
  },
  {
    id: "owerri",
    label: "Ofe Owerri Base Reserve",
    progressText: "4 / 10 Pots (40%)",
    pct: 40,
    textClass: "text-secondary",
    barClass: "bg-secondary",
  },
];

/* ---------------- CSV Data Hub ---------------- */

export type CsvRow = {
  id: string;
  rowNo: string;
  rowNoClass: string;
  ref: string;
  refClass: string;
  item: string;
  itemClass: string;
  code: string;
  movement: { label: string; className: string };
  qty: string;
  qtyClass: string;
  unit: { text: string; className: string };
  timestamp: string;
  operator: string;
  validation: { icon: string; text: string; className: string };
  rowClass: string;
};

export const CSV_ROWS: CsvRow[] = [
  {
    id: "r1",
    rowNo: "#01",
    rowNoClass: "text-outline",
    ref: "TX-2026-10-844",
    refClass: "text-primary",
    item: "Oloyin Honey Beans (Bag)",
    itemClass: "",
    code: "MGK-PR-002",
    movement: { label: "INWARD", className: "bg-primary-fixed text-on-primary-fixed" },
    qty: "50.00",
    qtyClass: "text-on-surface",
    unit: { text: "kg", className: "bg-surface-container text-outline" },
    timestamp: "2026-10-24T08:15:00Z",
    operator: "usr_okafor_a",
    validation: { icon: "check_circle", text: "Ready", className: "text-primary" },
    rowClass: "",
  },
  {
    id: "r2",
    rowNo: "#02",
    rowNoClass: "text-outline",
    ref: "TX-2026-10-845",
    refClass: "text-primary",
    item: "Pure Red Palm Oil (Gallons)",
    itemClass: "",
    code: "MGK-PR-014",
    movement: { label: "OUTWARD", className: "bg-secondary-fixed text-on-secondary-fixed" },
    qty: "15.00",
    qtyClass: "text-on-surface",
    unit: { text: "litres", className: "bg-surface-container text-outline" },
    timestamp: "2026-10-24T09:30:12Z",
    operator: "usr_balogun_t",
    validation: { icon: "check_circle", text: "Ready", className: "text-primary" },
    rowClass: "",
  },
  {
    id: "r18",
    rowNo: "#18",
    rowNoClass: "text-secondary font-bold",
    ref: "TX-2026-10-881",
    refClass: "text-secondary",
    item: "Egusi Melon Seeds (Hand-Peeled)",
    itemClass: "text-secondary",
    code: "MGK-PR-009",
    movement: { label: "INWARD", className: "bg-primary-fixed text-on-primary-fixed" },
    qty: "50.00",
    qtyClass: "text-on-surface",
    unit: { text: "kg", className: "bg-surface-container text-outline" },
    timestamp: "2026-10-24T11:20:04Z",
    operator: "usr_okafor_a",
    validation: { icon: "copy_all", text: "Duplicate Hash", className: "text-secondary" },
    rowClass: "bg-secondary-fixed/10 hover:bg-secondary-fixed/20",
  },
  {
    id: "r42",
    rowNo: "#42",
    rowNoClass: "text-error font-bold",
    ref: "TX-2026-10-904",
    refClass: "text-error",
    item: "Smoked Mangrove Catfish",
    itemClass: "text-error",
    code: "MGK-PR-018",
    movement: { label: "WASTE", className: "bg-surface-container-high text-on-surface-variant" },
    qty: "24.00",
    qtyClass: "text-error",
    unit: { text: "NULL_UNIT", className: "bg-error text-on-error animate-pulse" },
    timestamp: "2026-10-24T13:40:55Z",
    operator: "usr_adebayo_k",
    validation: { icon: "error", text: "Rejected", className: "text-error" },
    rowClass: "bg-error-container/20 hover:bg-error-container/30",
  },
  {
    id: "r86",
    rowNo: "#86",
    rowNoClass: "text-outline",
    ref: "TX-2026-10-948",
    refClass: "text-primary",
    item: "Scotch Bonnet Pepper (Atarodo)",
    itemClass: "",
    code: "MGK-PR-031",
    movement: { label: "INWARD", className: "bg-primary-fixed text-on-primary-fixed" },
    qty: "30.00",
    qtyClass: "text-on-surface",
    unit: { text: "bowls", className: "bg-surface-container text-outline" },
    timestamp: "2026-10-24T14:10:00Z",
    operator: "usr_okafor_a",
    validation: { icon: "check_circle", text: "Ready", className: "text-primary" },
    rowClass: "",
  },
];

export const MAPPING_PILLS = [
  "transaction_ref → refId",
  "item_code → itemId",
  "movement_type → type",
  "quantity → quantity",
  "unit → unit",
  "timestamp_wat → createdAt",
  "recorded_by → authUserId",
];

export const SYNC_HISTORY = [
  {
    id: "h1",
    ref: "SYNC-2026-10-24-A",
    file: "daily_stock_movement_2026-10-24.csv",
    rows: 83,
    status: { text: "Committed", className: "bg-primary-fixed text-on-primary-fixed" },
    when: "2026-10-24 14:12 WAT",
    by: "Amara Okafor",
  },
  {
    id: "h2",
    ref: "SYNC-2026-10-23-B",
    file: "supplier_batch_registry_week43.csv",
    rows: 41,
    status: { text: "Committed", className: "bg-primary-fixed text-on-primary-fixed" },
    when: "2026-10-23 18:40 WAT",
    by: "Tunde Balogun",
  },
  {
    id: "h3",
    ref: "SYNC-2026-10-23-A",
    file: "physical_audit_sheet_w43.csv",
    rows: 12,
    status: { text: "Rolled Back", className: "bg-error-container text-on-error-container" },
    when: "2026-10-23 09:05 WAT",
    by: "Amara Okafor",
  },
];

export const EXPORT_ENTITIES = [
  {
    id: "e1",
    icon: "swap_horiz",
    name: "Stock Transactions Ledger",
    detail: "Receipts, issues, waste • 1,204 rows",
    checked: true,
  },
  {
    id: "e2",
    icon: "inventory",
    name: "Inventory Master Catalog",
    detail: "Ingredients & packaging • 96 items",
    checked: true,
  },
  {
    id: "e3",
    icon: "fact_check",
    name: "Physical Count Sheet",
    detail: "Weekly audit discrepancies • 24 rows",
    checked: false,
  },
  {
    id: "e4",
    icon: "agriculture",
    name: "Supplier Batch Registry",
    detail: "Fresh farm inflow • 58 batches",
    checked: false,
  },
];
