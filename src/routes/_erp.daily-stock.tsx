import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/erp/module-placeholder";

export const Route = createFileRoute("/_erp/daily-stock")({
  head: () => ({
    meta: [
      { title: "Daily Stock | Grandma's Kitchen Lagos Ops ERP" },
      {
        name: "description",
        content: "Day-by-day stock intake, issue and wastage records for Grandma's Kitchen Lagos.",
      },
      { property: "og:title", content: "Daily Stock | Grandma's Kitchen Lagos Ops ERP" },
      {
        property: "og:description",
        content: "Day-by-day stock intake, issue and wastage records for Grandma's Kitchen Lagos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      icon="calendar_today"
      kicker="Operations Core"
      title="Daily Stock"
      description="Day-by-day stock intake, issue and wastage records across every storage unit and kitchen line."
    />
  ),
});
