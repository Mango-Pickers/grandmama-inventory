import { createFileRoute } from "@tanstack/react-router";

import { PhysicalCountPage } from "@/components/erp/physical-count-page";

export const Route = createFileRoute("/_erp/physical-count")({
  head: () => ({
    meta: [
      { title: "Physical Count | Grandma's Kitchen Lagos Ops ERP" },
      {
        name: "description",
        content: "Weekly audit counts, scale cross-checks and discrepancy reconciliation.",
      },
      { property: "og:title", content: "Physical Count | Grandma's Kitchen Lagos Ops ERP" },
      {
        property: "og:description",
        content: "Weekly audit counts, scale cross-checks and discrepancy reconciliation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PhysicalCountPage,
});
