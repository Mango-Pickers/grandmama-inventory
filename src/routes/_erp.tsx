import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState, type RefObject } from "react";

import { Icon } from "@/components/erp/icon";
import { LiveClock } from "@/components/erp/live-clock";
import { NAV_ITEMS } from "@/components/erp/nav";
import { useAuth } from "@/components/auth/auth-provider";
import { getRoleLabel } from "@/lib/authorized-users";

export const Route = createFileRoute("/_erp")({
  component: ErpLayout,
});

function ErpLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const pathname = useLocation({ select: (s) => s.pathname });

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    if (drawerOpen) menuButtonRef.current?.focus();
    setDrawerOpen(false);
  }, [pathname]);

  function closeDrawer() {
    setDrawerOpen(false);
    menuButtonRef.current?.focus();
  }

  function toggleNavigation() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setDesktopSidebarOpen((open) => !open);
    } else {
      setDrawerOpen((open) => !open);
    }
  }

  useEffect(() => {
    if (!drawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const sidebar = sidebarRef.current;
    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusFirst = () => sidebar?.querySelector<HTMLElement>(focusableSelector)?.focus();
    const focusTimer = window.requestAnimationFrame(focusFirst);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setDrawerOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !sidebar) return;

      const focusable = [...sidebar.querySelectorAll<HTMLElement>(focusableSelector)];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <button
          aria-label="Close navigation"
          onClick={closeDrawer}
          className="fixed inset-0 z-40 cursor-default bg-black/40 lg:hidden"
        />
      )}

      <AppSidebar
        drawerOpen={drawerOpen}
        desktopSidebarOpen={desktopSidebarOpen}
        sidebarRef={sidebarRef}
        onClose={closeDrawer}
      />

      <div className={desktopSidebarOpen ? "lg:pl-60" : "lg:pl-0"}>
        <AppHeader
          drawerOpen={drawerOpen}
          desktopSidebarOpen={desktopSidebarOpen}
          menuButtonRef={menuButtonRef}
          onMenu={toggleNavigation}
        />

        <main className="min-h-screen w-full min-w-0 bg-background pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AppSidebar({
  drawerOpen,
  desktopSidebarOpen,
  sidebarRef,
  onClose,
}: {
  drawerOpen: boolean;
  desktopSidebarOpen: boolean;
  sidebarRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  return (
    <aside
      ref={sidebarRef}
      id="app-navigation"
      aria-label="Main navigation"
      aria-modal={drawerOpen ? true : undefined}
      role={drawerOpen ? "dialog" : undefined}
      className={`fixed inset-y-0 left-0 z-50 flex h-full w-60 flex-col justify-between bg-primary text-on-primary shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-200 ease-out motion-reduce:transition-none max-lg:shadow-2xl ${
        drawerOpen ? "visible translate-x-0" : "invisible -translate-x-full"
      } ${desktopSidebarOpen ? "lg:visible lg:translate-x-0" : "lg:invisible lg:-translate-x-full"}`}
      style={{ width: "min(15rem, 86vw)" }}
    >
      <div className="flex flex-col">
        <div className="flex h-16 items-center justify-between gap-space-sm bg-primary px-space-base">
          <div className="flex min-w-0 items-center gap-space-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-on-secondary shadow-sm">
            <Icon name="soup_kitchen" className="text-[20px]" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-headline-sm text-on-primary truncate tracking-tight">
              Grandma's Kitchen
            </span>
            <span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider">
              Lagos Ops ERP
            </span>
          </div>
          </div>
          <button
            aria-label="Close navigation"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-on-primary hover:bg-primary-container focus-visible:outline-2 focus-visible:outline-on-primary lg:hidden"
            onClick={onClose}
            type="button"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </div>

        <div className="px-space-base py-space-xs">
          <span className="font-label-sm text-label-sm text-on-primary-container uppercase tracking-wider">
            Operations Core
          </span>
        </div>

        <nav className="flex min-h-0 max-h-[calc(100dvh-160px)] flex-col space-y-1 overflow-y-auto overscroll-contain px-space-sm py-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex min-h-11 items-center gap-space-sm rounded-lg px-space-sm py-2 font-label-md text-label-md text-on-primary-container transition-colors hover:bg-primary-container hover:text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-primary [&.active]:bg-primary-container [&.active]:font-bold [&.active]:text-on-primary"
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
              Kitchen location
            </span>
            <span className="font-body-sm text-body-sm text-on-primary-container text-[11px]">
              Not configured
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function AppHeader({
  drawerOpen,
  desktopSidebarOpen,
  menuButtonRef,
  onMenu,
}: {
  drawerOpen: boolean;
  desktopSidebarOpen: boolean;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  onMenu: () => void;
}) {
  const { user, role, signOut } = useAuth();

  return (
    <header className={`fixed top-0 right-0 left-0 z-40 flex h-16 min-w-0 items-center justify-between gap-2 bg-surface/90 px-3 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl sm:px-space-base lg:px-space-xl ${desktopSidebarOpen ? "lg:left-60" : "lg:left-0"}`}>
      <div className="flex min-w-0 items-center gap-2 sm:gap-space-base">
        <button
          ref={menuButtonRef}
          onClick={onMenu}
          aria-label={drawerOpen ? "Close navigation" : "Open navigation"}
          aria-controls="app-navigation"
          aria-expanded={drawerOpen}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary lg:hidden"
        >
          <Icon name={drawerOpen ? "close" : "menu"} className="text-[22px]" />
        </button>
        <button
          aria-label={desktopSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-controls="app-navigation"
          aria-expanded={desktopSidebarOpen}
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary lg:flex"
          onClick={onMenu}
          type="button"
        >
          <Icon name={desktopSidebarOpen ? "left_panel_close" : "left_panel_open"} className="text-[22px]" />
        </button>

        <div className="hidden items-center gap-space-xs rounded-lg bg-surface-container px-space-sm py-space-2xs text-on-surface sm:flex">
          <Icon name="schedule" className="text-[18px] text-outline" />
          <LiveClock />
          <span className="font-label-sm text-label-sm text-outline uppercase">WAT (Lagos)</span>
        </div>

        <div className="hidden items-center gap-space-xs rounded-lg bg-surface-container-low px-space-sm py-space-2xs md:flex">
          <span className="font-label-md text-label-md text-on-surface-variant">Inventory workspace</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-space-sm">
        <button
          aria-label="Search"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Icon name="search" className="text-[20px]" />
        </button>
        <div className="flex items-center gap-1 sm:gap-space-sm sm:pl-space-sm">
          <div className="hidden flex-col items-end sm:flex">
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              {user?.displayName || user?.email || "Signed in"}
            </span>
            <span className="font-label-sm text-label-sm text-outline">
              {role ? getRoleLabel(role) : "Authenticated account"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            title="Sign out"
            aria-label="Sign out"
            className="flex h-11 items-center gap-2 rounded-lg px-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary sm:px-2"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-sm">
              <Icon name="person" className="text-[18px] text-on-primary" />
            </span>
            <span className="hidden text-xs font-medium md:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
