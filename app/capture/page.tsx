import Link from "next/link";
import { ChevronRight, FileText, PlusCircle } from "lucide-react";

export default function CapturePage() {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Capture</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Add a purchase manually or upload a receipt photo.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        <li>
          <Link
            href="/capture/manual"
            className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-xs transition-all hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
          >
            <span className="bg-accent/10 text-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <PlusCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-semibold">Add manual entry</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Record a purchase by total or itemize it.
              </span>
            </span>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-neutral-400 transition-colors group-hover:text-neutral-600 dark:group-hover:text-neutral-300"
              aria-hidden="true"
            />
          </Link>
        </li>
        <li>
          <Link
            href="/capture/receipt"
            className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-xs transition-all hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
          >
            <span className="bg-accent/10 text-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-semibold">Upload receipt</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Add a receipt photo to parse later.
              </span>
            </span>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-neutral-400 transition-colors group-hover:text-neutral-600 dark:group-hover:text-neutral-300"
              aria-hidden="true"
            />
          </Link>
        </li>
      </ul>
    </section>
  );
}
