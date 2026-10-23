export type NavItem = {
  to: string;
  label: string;
  icon: string;
};

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Overview", icon: "space_dashboard" },
  { to: "/daily-stock", label: "Daily Stock", icon: "calendar_today" },
  { to: "/inventory", label: "Inventory", icon: "inventory_2" },
  { to: "/receive-stock", label: "Receive Stock", icon: "move_to_inbox" },
  { to: "/issue-stock", label: "Issue Stock", icon: "outbox" },
  { to: "/stock-preparation", label: "Stock Preparation", icon: "blender" },
  { to: "/physical-count", label: "Physical Count", icon: "fact_check" },
  { to: "/quality-checks", label: "Quality Checks", icon: "verified" },
  { to: "/stock-activity", label: "Stock Activity", icon: "timeline" },
  { to: "/notifications", label: "Notifications", icon: "notifications" },
  { to: "/csv-import-export", label: "CSV Import / Export", icon: "import_export" },
  { to: "/settings", label: "Settings", icon: "settings" },
];
