import {
  Inbox,
  LayoutDashboard,
  Lightbulb,
  PlusCircle,
  Settings,
  type LucideIcon,
} from "lucide-react";

/**
 * Top-level destinations for the app shell. Single source of truth shared by
 * the bottom navigation and any future breadcrumb/title logic.
 *
 * Routes are placeholders in Slice 2; later slices/milestones fill them in:
 * - `/capture` → manual entry (Slice 3) + receipt upload (Slice 4)
 * - `/dashboard` → Milestone 3
 * - `/insights` → Milestone 4
 */
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Inbox", icon: Inbox },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/capture", label: "Capture", icon: PlusCircle },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

/**
 * True when `pathname` belongs to `href`. The root route matches exactly;
 * section routes also match their nested paths (e.g. `/capture/manual`).
 */
export function isActiveRoute(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
