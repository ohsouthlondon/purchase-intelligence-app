import type { Metadata } from "next";
import "./globals.css";

import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Purchase Intelligence",
  description:
    "Single-user personal finance app for receipt capture, manual spend entry, and item-level purchase intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-50">
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <AppHeader />
            <main className="mx-auto w-full max-w-md flex-1 px-4 pt-6 pb-24">
              {children}
            </main>
            <AppNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
