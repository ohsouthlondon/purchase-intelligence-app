import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Sticky top bar: app brand on the left, theme toggle on the right.
 * Constrained to the same max width as the content for visual alignment.
 */
export function AppHeader() {
  return (
    <header className="border-border bg-page/90 sticky top-0 z-20 border-b">
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
        <Link href="/" className="text-fg text-sm font-semibold tracking-tight">
          Purchase Intelligence
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
