import { createFileRoute } from "@tanstack/react-router";

import { StockWorkflowPage } from "@/components/erp/stock-workflow-page";

export const Route = createFileRoute("/_erp/issue-stock")({
  head: () => ({
    meta: [
      { title: "Issue Stock | Grandma's Kitchen Lagos Ops ERP" },
      {
        name: "description",
        content: "Issue raw materials and prepped stock from storage to kitchen production lines.",
      },
      { property: "og:title", content: "Issue Stock | Grandma's Kitchen Lagos Ops ERP" },
      {
        property: "og:description",
        content: "Issue raw materials and prepped stock from storage to kitchen production lines.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <StockWorkflowPage workflow="issue" />,
});
