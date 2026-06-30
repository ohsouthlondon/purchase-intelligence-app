import type { Metadata } from "next";
import "./globals.css";

import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { BackgroundShapes } from "@/components/ui/background-shapes";

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
      <body className="bg-page text-fg min-h-screen antialiased">
        <ThemeProvider>
          <BackgroundShapes />
          <div className="relative flex min-h-screen flex-col">
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
