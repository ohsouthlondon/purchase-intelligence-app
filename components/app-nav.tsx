"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActiveRoute, NAV_ITEMS } from "@/lib/navigation";

/**
 * Mobile-first bottom tab bar. Fixed to the bottom of the viewport and
 * centered with a max width so it reads cleanly on larger screens too.
 */
export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="border-border bg-page/90 fixed inset-x-0 bottom-0 z-20 border-t"
    >
      <ul className="mx-auto flex w-full max-w-md items-stretch justify-between px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = isActiveRoute(item.href, pathname);
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2 text-xs transition-colors ${
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted hover:text-fg"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
