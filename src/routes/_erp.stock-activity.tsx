import { createFileRoute } from "@tanstack/react-router";

import { StockActivityPage } from "@/components/erp/stock-activity-page";

export const Route = createFileRoute("/_erp/stock-activity")({
  head: () => ({
    meta: [
      { title: "Stock Activity | Grandma's Kitchen Lagos Ops ERP" },
      {
        name: "description",
        content: "Complete transaction ledger of every intake, issue, prep and discard event.",
      },
      { property: "og:title", content: "Stock Activity | Grandma's Kitchen Lagos Ops ERP" },
      {
        property: "og:description",
        content: "Complete transaction ledger of every intake, issue, prep and discard event.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StockActivityPage,
});
