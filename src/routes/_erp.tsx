import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import { Icon } from "@/components/erp/icon";
import { LiveClock } from "@/components/erp/live-clock";
import { NAV_ITEMS } from "@/components/erp/nav";

export const Route = createFileRoute("/_erp")({
  component: ErpLayout,
});

function ErpLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = useLocation({ select: (s) => s.pathname });

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 cursor-default bg-black/40 lg:hidden"
        />
      )}

      <AppSidebar drawerOpen={drawerOpen} />

      <div className="lg:pl-60">
        <AppHeader onMenu={() => setDrawerOpen(true)} />

        <main className="min-h-screen w-full bg-background pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AppSidebar({ drawerOpen }: { drawerOpen: boolean }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-full w-60 flex-col justify-between bg-primary text-on-primary shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-200 ease-out max-lg:shadow-2xl ${
        drawerOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="flex flex-col">
        <div className="flex h-16 items-center gap-space-sm bg-primary px-space-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-on-secondary shadow-sm">
            <Icon name="soup_kitchen" className="text-[20px]" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-headline-sm font-label-lg text-on-primary truncate tracking-tight">
              Grandma's Kitchen
            </span>
            <span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider">
              Lagos Ops ERP
            </span>
          </div>
        </div>

        <div className="px-space-base py-space-xs">
          <span className="font-label-sm text-label-sm text-on-primary-container uppercase tracking-wider">
            Operations Core
          </span>
        </div>

        <nav className="flex max-h-[calc(100vh-160px)] flex-col space-y-space-2xs overflow-y-auto px-space-sm">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-space-sm rounded-lg px-space-sm py-space-xs font-label-md text-label-md text-on-primary-container transition-colors hover:bg-primary-container hover:text-on-primary [&.active]:bg-primary-container [&.active]:font-bold [&.active]:text-on-primary"
              activeProps={{ className: "active" }}
            >
              <Icon name={item.icon} className="text-[18px]" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="bg-primary-container/40 p-space-base">
        <div className="flex items-center gap-space-sm">
          <Icon name="warehouse" className="text-[20px] text-secondary-container" />
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-surface-container-lowest font-semibold">
              Ikeja Main Kitchen
            </span>
            <span className="font-body-sm text-body-sm text-on-primary-container text-[11px]">
              Storage Unit A
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function AppHeader({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between bg-surface/90 px-space-base shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:left-60 lg:px-space-xl">
      <div className="flex items-center gap-space-base">
        <button
          onClick={onMenu}
          aria-label="Open navigation"
          className="flex items-center justify-center rounded-lg p-space-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface lg:hidden"
        >
          <Icon name="menu" className="text-[22px]" />
        </button>

        <div className="hidden items-center gap-space-xs rounded-lg bg-surface-container px-space-sm py-space-2xs text-on-surface sm:flex">
          <Icon name="schedule" className="text-[18px] text-outline" />
          <LiveClock />
          <span className="font-label-sm text-label-sm text-outline uppercase">WAT (Lagos)</span>
        </div>

        <div className="hidden items-center gap-space-xs rounded-lg bg-surface-container-low px-space-sm py-space-2xs md:flex">
          <span className="h-2 w-2 rounded-full bg-primary-container ring-2 ring-primary-fixed" />
          <span className="font-label-md text-label-md text-on-surface-variant">Ledger Synced</span>
        </div>
      </div>

      <div className="flex items-center gap-space-lg">
        <button
          aria-label="Search"
          className="flex items-center justify-center rounded-lg p-space-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <Icon name="search" className="text-[20px]" />
        </button>
        <div className="flex items-center gap-space-md pl-space-base">
          <div className="hidden flex-col items-end sm:flex">
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              Amara Okafor
            </span>
            <span className="font-label-sm text-label-sm text-outline">Lead Stockkeeper</span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-sm">
            <Icon name="person" className="text-[18px] text-on-primary" />
          </div>
        </div>
      </div>
    </header>
  );
}
