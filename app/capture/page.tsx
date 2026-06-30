import Link from "next/link";
import { ChevronRight, FileText, PlusCircle } from "lucide-react";

export default function CapturePage() {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Capture</h1>
        <p className="text-muted text-sm">
          Add a purchase manually or upload a receipt photo.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        <li>
          <Link
            href="/capture/manual"
            className="group border-border bg-surface shadow-soft flex items-center gap-3 rounded-2xl border p-4 transition-transform hover:-translate-y-0.5"
          >
            <span className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <PlusCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-semibold">Add manual entry</span>
              <span className="text-muted text-xs">
                Record a purchase by total or itemize it.
              </span>
            </span>
            <ChevronRight
              className="text-muted group-hover:text-fg h-4 w-4 shrink-0 transition-colors"
              aria-hidden="true"
            />
          </Link>
        </li>
        <li>
          <Link
            href="/capture/receipt"
            className="group border-border bg-surface shadow-soft flex items-center gap-3 rounded-2xl border p-4 transition-transform hover:-translate-y-0.5"
          >
            <span className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-semibold">Upload receipt</span>
              <span className="text-muted text-xs">
                Add a receipt photo to parse later.
              </span>
            </span>
            <ChevronRight
              className="text-muted group-hover:text-fg h-4 w-4 shrink-0 transition-colors"
              aria-hidden="true"
            />
          </Link>
        </li>
      </ul>
    </section>
  );
}
