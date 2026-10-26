import type { CatalogItemImport } from "@/lib/catalog-import";

type SeedProduct = {
  id: string;
  name: string;
  category: string;
  variants?: string[];
  stockVariants?: string[];
  pendingNote?: string;
  sourceLabel?: string;
};

const products: SeedProduct[] = [
  { id: "SPEC-MGK-P001", name: "Barracuda", category: "Protein and meat", pendingNote: "Processing state to confirm" },
  { id: "SPEC-MGK-P002", name: "Chicken", category: "Protein and meat", pendingNote: "Processing state to confirm; carton-to-piece yield must be recorded per receipt" },
  { id: "SPEC-MGK-P003", name: "Turkey", category: "Protein and meat", variants: ["Processed"] },
  { id: "SPEC-MGK-P004", name: "Assorted cow meat", category: "Protein and meat", pendingNote: "Processing state to confirm", sourceLabel: "Cow assorted" },
  { id: "SPEC-MGK-P005", name: "Ponmo", category: "Protein and meat", pendingNote: "Processing state to confirm" },
  { id: "SPEC-MGK-P006", name: "Goat meat", category: "Protein and meat", variants: ["Processed", "Unprocessed"] },
  { id: "SPEC-MGK-S001", name: "Crab", category: "Seafood", variants: ["Processed", "Unprocessed"], sourceLabel: "Crabs" },
  { id: "SPEC-MGK-S002", name: "Catfish", category: "Seafood", variants: ["Processed", "Unprocessed"] },
  { id: "SPEC-MGK-S003", name: "Croaker fish", category: "Seafood", pendingNote: "Processing state to confirm" },
  { id: "SPEC-MGK-S004", name: "Prawns", category: "Seafood", variants: ["Processed", "Unprocessed"] },
  { id: "SPEC-MGK-S005", name: "Periwinkles", category: "Seafood", pendingNote: "Processing state to confirm", sourceLabel: "Periwinkle" },
  { id: "SPEC-MGK-S006", name: "Shrimps", category: "Seafood", variants: ["Processed", "Unprocessed"] },
  { id: "SPEC-MGK-S007", name: "Dry fish", category: "Seafood", variants: ["Processed", "Unprocessed"] },
  { id: "SPEC-MGK-S008", name: "Stockfish", category: "Seafood", variants: ["Processed"], pendingNote: "Plain stockfish processing state is unresolved; only the confirmed processed variant is included" },
  { id: "SPEC-MGK-S009", name: "Snails", category: "Seafood", variants: ["Processed", "Unprocessed"], sourceLabel: "Snail" },
  { id: "SPEC-MGK-S010", name: "Crayfish", category: "Seafood", pendingNote: "Processing state to confirm" },
  { id: "SPEC-MGK-V001", name: "Tomatoes", category: "Vegetables and produce", pendingNote: "Processing state to confirm" },
  { id: "SPEC-MGK-V002", name: "Onions", category: "Vegetables and produce", pendingNote: "Processing state to confirm" },
  { id: "SPEC-MGK-V003", name: "Waterleaf", category: "Vegetables and produce", pendingNote: "Processing state to confirm" },
  { id: "SPEC-MGK-V004", name: "Bitter leaf", category: "Vegetables and produce", pendingNote: "Processing state to confirm" },
  { id: "SPEC-MGK-V005", name: "Afang leaves", category: "Vegetables and produce", pendingNote: "Processing state to confirm" },
  { id: "SPEC-MGK-V006", name: "Okra", category: "Vegetables and produce", pendingNote: "Processing state to confirm" },
  { id: "SPEC-MGK-V007", name: "Uziza leaves", category: "Vegetables and produce", pendingNote: "Confirm leaf form; do not conflate with uziza seed" },
  { id: "SPEC-MGK-V008", name: "Ugu leaves", category: "Vegetables and produce", pendingNote: "Processing state to confirm" },
  { id: "SPEC-MGK-V009", name: "Pepper", category: "Vegetables and produce", pendingNote: "Processing state to confirm; separate from blended pepper products" },
  { id: "SPEC-MGK-V010", name: "Plantain", category: "Vegetables and produce", pendingNote: "Processing state to confirm" },
  { id: "SPEC-MGK-I001", name: "Vegetable oil", category: "Cooking ingredients", pendingNote: "Balance unit and purchase conversion to configure" },
  { id: "SPEC-MGK-I002", name: "Frying oil", category: "Cooking ingredients", pendingNote: "Balance unit and purchase conversion to configure" },
  { id: "SPEC-MGK-I003", name: "Palm oil", category: "Cooking ingredients", pendingNote: "Balance unit and purchase conversion to configure" },
  { id: "SPEC-MGK-I004", name: "Salt", category: "Cooking ingredients", pendingNote: "Balance unit and purchase conversion to configure" },
  { id: "SPEC-MGK-I005", name: "Terra seasoning cubes", category: "Cooking ingredients", pendingNote: "Pack quantity and balance unit to configure" },
  { id: "SPEC-MGK-I006", name: "Pepper soup spice", category: "Cooking ingredients", pendingNote: "Balance unit to configure" },
  { id: "SPEC-MGK-I007", name: "Iru", category: "Cooking ingredients", pendingNote: "Processing state and balance unit to confirm" },
  { id: "SPEC-MGK-I008", name: "Thickener", category: "Cooking ingredients", pendingNote: "Product identity and balance unit to confirm" },
  { id: "SPEC-MGK-I009", name: "Palm fruits", category: "Cooking ingredients", pendingNote: "Processing state and balance unit to confirm" },
  { id: "SPEC-MGK-I010", name: "Rice", category: "Cooking ingredients", pendingNote: "Balance unit and purchase conversion to configure" },
  { id: "SPEC-MGK-I011", name: "Basmati rice", category: "Cooking ingredients", pendingNote: "Balance unit and purchase conversion to configure" },
  { id: "SPEC-MGK-F001", name: "Fufu flour", category: "Flour and water", pendingNote: "Balance unit to configure" },
  { id: "SPEC-MGK-F002", name: "Oat flour", category: "Flour and water", pendingNote: "Balance unit to configure" },
  { id: "SPEC-MGK-F003", name: "Plantain flour", category: "Flour and water", pendingNote: "Balance unit to configure" },
  { id: "SPEC-MGK-F004", name: "Water", category: "Flour and water", pendingNote: "Balance unit to configure" },
  { id: "SPEC-MGK-K001", name: "Soup bowls", category: "Packaging", stockVariants: ["1.5L", "3L", "4L"] },
  { id: "SPEC-MGK-K002", name: "Bowl lids", category: "Packaging", pendingNote: "Confirm whether counted separately from bowls" },
  { id: "SPEC-MGK-K003", name: "Takeaway plates", category: "Packaging", pendingNote: "Count unit and purchase-pack conversion to configure" },
  { id: "SPEC-MGK-K004", name: "Thick black nylon bags", category: "Packaging", pendingNote: "Count unit and purchase-pack conversion to configure" },
  { id: "SPEC-MGK-K005", name: "Baking paper", category: "Packaging", pendingNote: "Balance unit to configure" },
  { id: "SPEC-MGK-K006", name: "Cling film", category: "Packaging", pendingNote: "Confirm specification and balance unit" },
  { id: "SPEC-MGK-K007", name: "Large Ziploc bags", category: "Packaging", pendingNote: "Confirm size specification and purchase-pack conversion" },
  { id: "SPEC-MGK-K008", name: "Medium Ziploc bags", category: "Packaging", pendingNote: "Confirm size specification and purchase-pack conversion" },
  { id: "SPEC-MGK-K009", name: "Serviettes", category: "Packaging", pendingNote: "Count unit and purchase-pack conversion to configure" },
  { id: "SPEC-MGK-K010", name: "Aluminium foil", category: "Packaging", pendingNote: "Balance unit to configure" },
  { id: "SPEC-MGK-C001", name: "Large waste bags", category: "Cleaning", pendingNote: "Size, balance unit and purchase-pack conversion to configure" },
  { id: "SPEC-MGK-C002", name: "Detergent", category: "Cleaning", pendingNote: "Package size and balance unit to configure" },
  { id: "SPEC-MGK-C003", name: "Iron or metal scouring sponges", category: "Cleaning", pendingNote: "Pack quantity to configure" },
  { id: "SPEC-MGK-C004", name: "Dishwashing sponges", category: "Cleaning", pendingNote: "Count unit and purchase-pack conversion to configure" },
  { id: "SPEC-MGK-C005", name: "Vim cleaning powder", category: "Cleaning", pendingNote: "Package size and balance unit to configure" },
  { id: "SPEC-MGK-H001", name: "Gloves", category: "Staff supplies", pendingNote: "Type, size, count unit and pack quantity to confirm" },
  { id: "SPEC-MGK-H002", name: "Nylon gloves", category: "Staff supplies", pendingNote: "Size and pack quantity to configure" },
  { id: "SPEC-MGK-H003", name: "Hairnets", category: "Staff supplies", pendingNote: "Count unit and purchase-pack conversion to configure" },
  { id: "SPEC-MGK-O001", name: "A4 paper", category: "Office and other items", pendingNote: "Count unit and pack quantity to configure" },
  { id: "SPEC-MGK-O002", name: "Pens", category: "Office and other items", pendingNote: "Count unit and pack quantity to configure" },
  { id: "SPEC-MGK-O003", name: "Lighters", category: "Office and other items", pendingNote: "Count unit to configure" },
  { id: "SPEC-MGK-O004", name: "Pans", category: "Office and other items", pendingNote: "Count unit to configure" },
  { id: "SPEC-MGK-O005", name: "Cotton material", category: "Office and other items", pendingNote: "Balance unit to configure" },
];

function isProcessingState(value: string) {
  return /^(processed|unprocessed|uncooked|cooked|blended|unblended|peeled and processed)$/i.test(value);
}

export const SPEC_CATALOGUE: CatalogItemImport[] = products.map((product) => ({
  id: product.id,
  name: product.name,
  category: product.category,
  status: "active",
  processingEnabled: Boolean(product.variants?.length),
  confirmationStatus: product.pendingNote ? "pending" : "confirmed",
  sourceLabel: product.sourceLabel ?? product.name,
  confirmationNote: product.pendingNote ?? "",
}));

export type SpecStockVariant = {
  id: string;
  itemId: string;
  processingState: string;
  stockForm: string;
  portionSizeLabel: string;
  balanceUnit: string;
  active: boolean;
};

export const SPEC_VARIANTS: SpecStockVariant[] = products.flatMap((product) => [
  ...(product.variants ?? []).map((state) => ({
    id: `${product.id}-${state.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    itemId: product.id,
    processingState: state,
    stockForm: "",
    portionSizeLabel: "",
    balanceUnit: "",
    active: false,
  })),
  ...(product.stockVariants ?? []).map((capacity) => ({
    id: `${product.id}-${capacity.replace(/[^A-Z0-9]+/gi, "-")}`,
    itemId: product.id,
    processingState: "Not applicable",
    stockForm: `Bowl ${capacity}`,
    portionSizeLabel: "",
    balanceUnit: "",
    active: false,
  })),
]);

export const SPEC_SOURCE_PRODUCT_COUNT = 64;
