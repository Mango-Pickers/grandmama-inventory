import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/erp/module-placeholder";

export const Route = createFileRoute("/_erp/quality-checks")({
  head: () => ({
    meta: [
      { title: "Quality Checks | Grandma's Kitchen Lagos Ops ERP" },
      {
        name: "description",
        content: "Sensory, temperature and freshness inspections due within 24 hours.",
      },
      { property: "og:title", content: "Quality Checks | Grandma's Kitchen Lagos Ops ERP" },
      {
        property: "og:description",
        content: "Sensory, temperature and freshness inspections due within 24 hours.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      icon="verified"
      kicker="Operations Core"
      title="Quality Checks"
      description="Sensory, temperature and freshness inspections due within 24 hours."
    />
  ),
});
