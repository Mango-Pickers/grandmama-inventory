import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/erp/module-placeholder";

export const Route = createFileRoute("/_erp/settings")({
  head: () => ({
    meta: [
      { title: "Settings | Grandma's Kitchen Lagos Ops ERP" },
      {
        name: "description",
        content: "Storage units, staff roles, unit rules and sync preferences for the ERP.",
      },
      { property: "og:title", content: "Settings | Grandma's Kitchen Lagos Ops ERP" },
      {
        property: "og:description",
        content: "Storage units, staff roles, unit rules and sync preferences for the ERP.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      icon="settings"
      kicker="Operations Core"
      title="Settings"
      description="Storage units, staff roles, unit rules and sync preferences for the ERP."
    />
  ),
});
