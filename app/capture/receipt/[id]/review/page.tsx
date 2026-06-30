import Link from "next/link";
import { notFound } from "next/navigation";

import { ReceiptReviewForm } from "@/components/receipt-review-form";
import { getDb } from "@/lib/db";
import { getReceiptWithItems } from "@/lib/receipts/queries";

// Reads the database on demand; never prerender (and never touch the DB) at
// build time.
export const dynamic = "force-dynamic";

function toDateInput(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function ReceiptReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getReceiptWithItems(getDb(), id);
  if (!data) notFound();

  const { receipt, items } = data;
  const isFailed = receipt.ocrStatus === "failed";

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Link
          href="/capture"
          className="text-sm text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          ← Capture
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Review receipt</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Check the parsed details and save them when they look right.
        </p>
      </div>

      <ReceiptReviewForm
        receiptId={receipt.id}
        ocrStatus={receipt.ocrStatus}
        reviewStatus={receipt.reviewStatus}
        failureNote={isFailed ? receipt.notes : null}
        initial={{
          merchant: receipt.merchantNameRaw ?? "",
          purchaseDate: toDateInput(receipt.purchaseDatetime),
          subtotal: receipt.subtotal ?? "",
          total: receipt.total ?? "",
          tax: receipt.tax ?? "",
          notes: isFailed ? "" : (receipt.notes ?? ""),
        }}
        items={items.map((item) => ({
          id: item.id,
          rawLineText: item.rawLineText,
          itemNameRaw: item.itemNameRaw,
          price: item.price,
          quantityValue: item.quantityValue,
          confidence: item.confidence,
        }))}
      />
    </section>
  );
}
