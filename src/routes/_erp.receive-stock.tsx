import { createFileRoute } from "@tanstack/react-router";

import { StockWorkflowPage } from "@/components/erp/stock-workflow-page";

export const Route = createFileRoute("/_erp/receive-stock")({
  head: () => ({
    meta: [
      { title: "Receive Stock | Grandma's Kitchen Lagos Ops ERP" },
      {
        name: "description",
        content: "Log incoming vendor deliveries against purchase orders and supplier batch registries.",
      },
      { property: "og:title", content: "Receive Stock | Grandma's Kitchen Lagos Ops ERP" },
      {
        property: "og:description",
        content: "Log incoming vendor deliveries against purchase orders and supplier batch registries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <StockWorkflowPage workflow="receipt" />,
});
