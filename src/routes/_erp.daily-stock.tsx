import { createFileRoute } from "@tanstack/react-router";

import { DailyStockPage } from "@/components/erp/daily-stock-page";

export const Route = createFileRoute("/_erp/daily-stock")({
  head: () => ({
    meta: [
      { title: "Daily Stock | My Grandma's Kitchen" },
      { name: "description", content: "Ledger-derived stock for a selected day." },
    ],
  }),
  component: DailyStockPage,
});
