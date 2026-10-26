import { createFileRoute } from "@tanstack/react-router";

import { CatalogSpreadsheetPage } from "@/components/erp/catalog-spreadsheet-page";

export const Route = createFileRoute("/_erp/csv-import-export")({
  head: () => ({
    meta: [
      { title: "CSV Import / Export | My Grandma's Kitchen" },
      { name: "description", content: "CSV data tools workspace." },
    ],
  }),
  component: CatalogSpreadsheetPage,
});
