import Link from "next/link";

import { ReceiptUploadForm } from "@/components/receipt-upload-form";

export default function ReceiptUploadPage() {
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
          Upload receipt
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Add a receipt photo now; parsing and review come later.
        </p>
      </div>

      <ReceiptUploadForm />
    </section>
  );
}
