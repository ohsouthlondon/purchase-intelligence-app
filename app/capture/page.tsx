import Link from "next/link";
import { FileText, PlusCircle } from "lucide-react";

export default function CapturePage() {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Capture</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Add a purchase manually or upload a receipt photo.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        <li>
          <Link
            href="/capture/manual"
            className="flex items-start gap-3 rounded-lg border border-neutral-200 p-4 transition-colors hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:border-neutral-600 dark:hover:bg-neutral-900"
          >
            <PlusCircle
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Add manual entry</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Record a purchase by total or itemize it.
              </span>
            </span>
          </Link>
        </li>
        <li>
          <div
            aria-disabled="true"
            className="flex items-start gap-3 rounded-lg border border-dashed border-neutral-200 p-4 opacity-60 dark:border-neutral-800"
          >
            <FileText className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Upload receipt</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Coming in Slice 4.
              </span>
            </span>
          </div>
        </li>
      </ul>
    </section>
  );
}
