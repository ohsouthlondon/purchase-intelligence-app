"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  runParse,
  submitReview,
  type ReceiptActionResult,
} from "@/app/capture/receipt/[id]/review/actions";
import {
  errorClass,
  fieldClass,
  labelClass,
} from "@/components/receipt-form-styles";
import {
  ReceiptItemsEditor,
  type EditableItem,
  type EditableItemField,
} from "@/components/receipt-items-editor";
import {
  assessParseQuality,
  type ParseQuality,
} from "@/lib/receipts/review/quality";

/**
 * Receipt review form (Milestone 2).
 *
 * Drives the small parse → review state machine for one receipt:
 * - `pending`/`failed` → a Parse trigger (re-tryable).
 * - `parsed`/`reviewed` → an editable header form (merchant, date, totals,
 *   notes) plus an editable list of parsed line items (correct or remove).
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
  parseConfidence: string | null;
  initial: InitialValues;
  items: ReviewItem[];
}

// Built once; "and" reads better than "or" for a list of fields to fill in.
const fieldListFormatter = new Intl.ListFormat("en-GB", {
  style: "long",
  type: "conjunction",
});

/** Plain-language phrasing layered on top of the structured quality verdict. */
function buildParseNotice(quality: ParseQuality): {
  heading: string;
  detail: string;
} {
  if (quality.level === "low") {
    return {
      heading: "Low-confidence parse",
      detail:
        "These values were read with low confidence — double-check them before you save.",
    };
  }

  const parts: string[] = [];
  if (quality.missingFields.length > 0) {
    parts.push(
      `Add the ${fieldListFormatter.format(quality.missingFields)} below before you save.`,
    );
  }
  if (!quality.hasItems) {
    parts.push("No line items were read from this receipt.");
  }

  return { heading: "We couldn't read everything", detail: parts.join(" ") };
}

export function ReceiptReviewForm({
  receiptId,
  ocrStatus,
  reviewStatus,
  failureNote,
  parseConfidence,
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
  const [editableItems, setEditableItems] = useState<EditableItem[]>(() =>
    items.map((item) => ({
      id: item.id,
      itemName: item.itemNameRaw ?? "",
      quantity: item.quantityValue ?? "",
      price: item.price ?? "",
      rawLineText: item.rawLineText,
      confidence: item.confidence,
    })),
  );
  const [result, setResult] = useState<ReceiptActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const fieldErrors =
    result?.status === "error" ? result.fieldErrors : undefined;
  const errorFor = (field: string): string | undefined =>
    fieldErrors?.[field]?.[0];
  const itemErrors = result?.status === "error" ? result.itemErrors : undefined;

  function updateItem(id: string, field: EditableItemField, value: string) {
    setEditableItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  function removeItem(id: string) {
    setEditableItems((prev) => prev.filter((item) => item.id !== id));
  }

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
    const payload = {
      merchant,
      purchaseDate,
      subtotal,
      total,
      tax,
      notes,
      items: editableItems.map(({ id, itemName, quantity, price }) => ({
        id,
        itemName,
        quantity,
        price,
      })),
    };
    startTransition(async () => {
      const actionResult = await submitReview(receiptId, payload);
      setResult(actionResult);
      if (actionResult.status === "success") router.refresh();
    });
  }

  if (needsParse) {
    const hasFailed = ocrStatus === "failed";
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {hasFailed
            ? "We couldn't read this receipt automatically."
            : "This receipt hasn't been parsed yet."}
        </p>
        {hasFailed && failureNote ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Reason: {failureNote}
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleParse}
          disabled={isPending}
          className="bg-accent text-accent-foreground hover:bg-accent-hover focus-visible:ring-accent/40 disabled:hover:bg-accent self-start rounded-lg px-4 py-2.5 text-sm font-semibold shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
        >
          {isPending ? "Parsing…" : hasFailed ? "Try again" : "Parse receipt"}
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

  // Assess against LIVE form state (not just the server snapshot) so the notice
  // clears the moment the user fills in a missing field — no round-trip needed.
  const quality = assessParseQuality({
    merchant,
    purchaseDate,
    total,
    itemCount: items.length,
    parseConfidence,
  });
  const showQualityNotice =
    reviewStatus !== "reviewed" && quality.level !== "good";
  const notice = showQualityNotice ? buildParseNotice(quality) : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {reviewStatus === "reviewed" ? (
        <p className="text-sm text-green-600 dark:text-green-400">
          Reviewed — you can update the details and save again.
        </p>
      ) : null}

      {notice ? (
        <div
          role="status"
          className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50"
        >
          <p
            className={`text-sm font-semibold ${
              quality.level === "partial"
                ? "text-accent"
                : "text-neutral-800 dark:text-neutral-100"
            }`}
          >
            {notice.heading}
          </p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {notice.detail}
          </p>
        </div>
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

      <ReceiptItemsEditor
        items={editableItems}
        errors={itemErrors}
        onChange={updateItem}
        onRemove={removeItem}
      />

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
