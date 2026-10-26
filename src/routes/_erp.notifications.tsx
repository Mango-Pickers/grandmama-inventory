import { createFileRoute } from "@tanstack/react-router";

import { NotificationsPage } from "@/components/erp/notifications-page";

export const Route = createFileRoute("/_erp/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications | Grandma's Kitchen Lagos Ops ERP" },
      {
        name: "description",
        content: "Reorder alerts, QA deadlines and ledger sync notifications for the ops team.",
      },
      { property: "og:title", content: "Notifications | Grandma's Kitchen Lagos Ops ERP" },
      {
        property: "og:description",
        content: "Reorder alerts, QA deadlines and ledger sync notifications for the ops team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});
