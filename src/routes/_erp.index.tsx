import { createFileRoute } from "@tanstack/react-router";

import { Icon } from "@/components/erp/icon";

export const Route = createFileRoute("/_erp/")({
  head: () => ({
    meta: [
      { title: "Overview | My Grandma's Kitchen" },
      { name: "description", content: "Inventory overview workspace." },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  return (
    <div className="mx-auto flex w-full max-w-360 min-w-0 flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-6 sm:py-8 lg:px-8">
      <div>
        <p className="text-sm font-medium text-secondary">Inventory workspace</p>
        <h1 className="mt-1 text-2xl font-bold text-primary sm:text-3xl">Overview</h1>
      </div>

      <section className="flex min-h-64 min-w-0 flex-col items-center justify-center rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest px-4 py-10 text-center sm:min-h-72 sm:px-6 sm:py-12">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-primary">
          <Icon name="inventory_2" className="text-2xl" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-on-surface">No inventory data yet</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
          This workspace is ready for the Firestore data model. No sample stock, balances, or activity are shown.
        </p>
      </section>
    </div>
  );
}
