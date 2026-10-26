import { createFileRoute } from "@tanstack/react-router";

import { StockWorkflowPage } from "@/components/erp/stock-workflow-page";

export const Route = createFileRoute("/_erp/stock-preparation")({
  head: () => ({
    meta: [
      { title: "Stock Preparation | Grandma's Kitchen Lagos Ops ERP" },
      {
        name: "description",
        content: "Portioning, cooking and packaging conversions, including the Grandma's bowl rule.",
      },
      { property: "og:title", content: "Stock Preparation | Grandma's Kitchen Lagos Ops ERP" },
      {
        property: "og:description",
        content: "Portioning, cooking and packaging conversions, including the Grandma's bowl rule.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <StockWorkflowPage workflow="preparation" />,
});
