import Link from "next/link";

import { ManualEntryForm } from "@/components/manual-entry-form";
import { DEFAULT_CATEGORIES } from "@/lib/domain/categories";

export default function ManualEntryPage() {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Link
          href="/capture"
          className="text-sm text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          ← Capture
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Add manual entry
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Record a purchase by total, or itemize it for line-level detail.
        </p>
      </div>

      <ManualEntryForm categories={DEFAULT_CATEGORIES} />
    </section>
  );
}
