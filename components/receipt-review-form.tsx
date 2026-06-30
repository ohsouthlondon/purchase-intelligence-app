"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  runParse,
  submitReview,
  type ReceiptActionResult,
} from "@/app/capture/receipt/[id]/review/actions";

/**
 * Receipt review scaffold (Milestone 2, Slice 1).
 *
 * Drives the small parse → review state machine for one receipt:
 * - `pending`/`failed` → a Parse trigger (re-tryable).
 * - `parsed`/`reviewed` → an editable header form (merchant, date, totals,
 *   notes) plus read-only parsed line items. Line-item editing is a later slice.
 *
 * The `receiptId` is passed in from the page and forwarded explicitly to each
 * Server Action. Client checks are convenience only — the actions re-validate.
 */

interface ReviewItem {
  id: string;
  rawLineText: string | null;
  itemNameRaw: string | null;
  price: string | null;
  quantityValue: string | null;
  confidence: string | null;
}

interface InitialValues {
  merchant: string;
  purchaseDate: string;
  subtotal: string;
  total: string;
  tax: string;
  notes: string;
}

interface ReceiptReviewFormProps {
  receiptId: string;
  ocrStatus: string;
  reviewStatus: string;
  failureNote: string | null;
  initial: InitialValues;
  items: ReviewItem[];
}

const fieldClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-xs outline-none transition-colors placeholder:text-neutral-400 focus:border-accent focus:ring-2 focus:ring-accent/30 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500";
const labelClass = "text-sm font-medium text-neutral-700 dark:text-neutral-300";
const errorClass = "text-xs text-red-600 dark:text-red-400";

export function ReceiptReviewForm({
  receiptId,
  ocrStatus,
  reviewStatus,
  failureNote,
  initial,
  items,
}: ReceiptReviewFormProps) {
  const router = useRouter();
  const [merchant, setMerchant] = useState(initial.merchant);
  const [purchaseDate, setPurchaseDate] = useState(initial.purchaseDate);
  const [subtotal, setSubtotal] = useState(initial.subtotal);
  const [total, setTotal] = useState(initial.total);
  const [tax, setTax] = useState(initial.tax);
  const [notes, setNotes] = useState(initial.notes);
  const [result, setResult] = useState<ReceiptActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const fieldErrors =
    result?.status === "error" ? result.fieldErrors : undefined;
  const errorFor = (field: string): string | undefined =>
    fieldErrors?.[field]?.[0];

  const needsParse = ocrStatus === "pending" || ocrStatus === "failed";

  function handleParse() {
    setResult(null);
    startTransition(async () => {
      const actionResult = await runParse(receiptId);
      setResult(actionResult);
      if (actionResult.status === "success") router.refresh();
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    const payload = { merchant, purchaseDate, subtotal, total, tax, notes };
    startTransition(async () => {
      const actionResult = await submitReview(receiptId, payload);
      setResult(actionResult);
      if (actionResult.status === "success") router.refresh();
    });
  }

  if (needsParse) {
    return (
      <div className="flex flex-col gap-3">
        {ocrStatus === "failed" && failureNote ? (
          <p className={errorClass}>Last attempt failed: {failureNote}</p>
        ) : null}
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          This receipt hasn&apos;t been parsed yet.
        </p>
        <button
          type="button"
          onClick={handleParse}
          disabled={isPending}
          className="bg-accent text-accent-foreground hover:bg-accent-hover focus-visible:ring-accent/40 disabled:hover:bg-accent self-start rounded-lg px-4 py-2.5 text-sm font-semibold shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
        >
          {isPending ? "Parsing…" : "Parse receipt"}
        </button>
        {result ? (
          <p
            role="status"
            aria-live="polite"
            className={`text-sm ${
              result.status === "success"
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {result.message}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {reviewStatus === "reviewed" ? (
        <p className="text-sm text-green-600 dark:text-green-400">
          Reviewed — you can update the details and save again.
        </p>
      ) : null}

      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-1">
          <label htmlFor="merchant" className={labelClass}>
            Merchant
          </label>
          <input
            id="merchant"
            name="merchant"
            type="text"
            value={merchant}
            onChange={(event) => setMerchant(event.target.value)}
            className={fieldClass}
            placeholder="e.g. Tesco"
          />
          {errorFor("merchant") ? (
            <p className={errorClass}>{errorFor("merchant")}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="purchaseDate" className={labelClass}>
            Date
          </label>
          <input
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            required
            value={purchaseDate}
            onChange={(event) => setPurchaseDate(event.target.value)}
            className={fieldClass}
          />
          {errorFor("purchaseDate") ? (
            <p className={errorClass}>{errorFor("purchaseDate")}</p>
          ) : null}
        </div>

        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="subtotal" className={labelClass}>
              Subtotal (£)
            </label>
            <input
              id="subtotal"
              name="subtotal"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={subtotal}
              onChange={(event) => setSubtotal(event.target.value)}
              className={fieldClass}
              placeholder="0.00"
            />
            {errorFor("subtotal") ? (
              <p className={errorClass}>{errorFor("subtotal")}</p>
            ) : null}
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="total" className={labelClass}>
              Total (£)
            </label>
            <input
              id="total"
              name="total"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={total}
              onChange={(event) => setTotal(event.target.value)}
              className={fieldClass}
              placeholder="0.00"
            />
            {errorFor("total") ? (
              <p className={errorClass}>{errorFor("total")}</p>
            ) : null}
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="tax" className={labelClass}>
              Tax (£)
            </label>
            <input
              id="tax"
              name="tax"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={tax}
              onChange={(event) => setTax(event.target.value)}
              className={fieldClass}
              placeholder="0.00"
            />
            {errorFor("tax") ? (
              <p className={errorClass}>{errorFor("tax")}</p>
            ) : null}
          </div>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
        <legend className="flex items-center gap-2 px-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Parsed items
          <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-[10px] font-medium tracking-wide text-neutral-500 uppercase dark:border-neutral-700 dark:text-neutral-400">
            Read-only
          </span>
        </legend>
        {items.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No line items were parsed.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <span className="flex flex-col">
                  <span className="font-medium">
                    {item.itemNameRaw ?? item.rawLineText ?? "Item"}
                  </span>
                  {item.rawLineText ? (
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {item.rawLineText}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-neutral-700 tabular-nums dark:text-neutral-300">
                  {item.quantityValue ? `${item.quantityValue} × ` : ""}
                  {item.price != null ? `£${item.price}` : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className={labelClass}>
          Notes <span className="text-neutral-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className={fieldClass}
        />
        {errorFor("notes") ? (
          <p className={errorClass}>{errorFor("notes")}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-accent text-accent-foreground hover:bg-accent-hover focus-visible:ring-accent/40 disabled:hover:bg-accent rounded-lg px-4 py-2.5 text-sm font-semibold shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save review"}
      </button>

      {result ? (
        <p
          role="status"
          aria-live="polite"
          className={`text-sm ${
            result.status === "success"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {result.message}
        </p>
      ) : null}
    </form>
  );
}
