import { createFileRoute } from "@tanstack/react-router";

import { SettingsPage } from "@/components/erp/settings-page";

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
  component: SettingsPage,
});
