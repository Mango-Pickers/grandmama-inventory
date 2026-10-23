import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/erp/module-placeholder";

export const Route = createFileRoute("/_erp/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory | Grandma's Kitchen Lagos Ops ERP" },
      {
        name: "description",
        content: "Master catalog of ingredients, packaging and storage locations for Ikeja Main Kitchen.",
      },
      { property: "og:title", content: "Inventory | Grandma's Kitchen Lagos Ops ERP" },
      {
        property: "og:description",
        content: "Master catalog of ingredients, packaging and storage locations for Ikeja Main Kitchen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      icon="inventory_2"
      kicker="Operations Core"
      title="Inventory"
      description="Master catalog of ingredients, packaging and storage locations for Ikeja Main Kitchen."
    />
  ),
});
