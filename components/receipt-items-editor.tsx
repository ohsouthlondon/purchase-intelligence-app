"use client";

import {
  badgeClass,
  errorClass,
  fieldClass,
  labelClass,
} from "@/components/receipt-form-styles";
import { isLowConfidence } from "@/lib/receipts/review/quality";

/**
 * Editable list of parsed receipt line items (Milestone 2).
 *
 * Controlled by the review form: the user can correct each line's name,
 * quantity, and unit price, or remove a line entirely. The OCR `rawLineText`
 * stays read-only as the evidence behind each row (kept explainable per
 * CLAUDE.md rule 8), and a "Low confidence" badge flags lines the parser was
 * unsure about. Adding new lines is intentionally out of scope for this slice.
 */

export interface EditableItem {
  id: string;
  itemName: string;
  quantity: string;
  price: string;
  rawLineText: string | null;
  confidence: string | null;
}

export type EditableItemField = "itemName" | "quantity" | "price";

interface ReceiptItemsEditorProps {
  items: EditableItem[];
  /** Validation messages keyed by row index, surfaced from the save action. */
  errors?: Record<number, string>;
  onChange: (id: string, field: EditableItemField, value: string) => void;
  onRemove: (id: string) => void;
}

export function ReceiptItemsEditor({
  items,
  errors,
  onChange,
  onRemove,
}: ReceiptItemsEditorProps) {
  return (
    <fieldset className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
      <legend className="px-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Line items
      </legend>

      {items.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No line items — the totals above will be used on their own.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item, index) => {
            const lowConfidence = isLowConfidence(item.confidence);
            return (
              <li
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    aria-label={`Item ${index + 1} name`}
                    value={item.itemName}
                    onChange={(event) =>
                      onChange(item.id, "itemName", event.target.value)
                    }
                    className={fieldClass}
                    placeholder="Item name"
                  />
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    aria-label={`Remove ${item.itemName || `item ${index + 1}`}`}
                    className="shrink-0 rounded-lg border border-neutral-200 px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:border-red-300 hover:text-red-600 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-red-800 dark:hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>

                <div className="flex gap-2">
                  <div className="flex flex-1 flex-col gap-1">
                    <label
                      htmlFor={`item-${item.id}-qty`}
                      className={labelClass}
                    >
                      Qty
                    </label>
                    <input
                      id={`item-${item.id}-qty`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={item.quantity}
                      onChange={(event) =>
                        onChange(item.id, "quantity", event.target.value)
                      }
                      className={fieldClass}
                      placeholder="1"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <label
                      htmlFor={`item-${item.id}-price`}
                      className={labelClass}
                    >
                      Price (£)
                    </label>
                    <input
                      id={`item-${item.id}-price`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={item.price}
                      onChange={(event) =>
                        onChange(item.id, "price", event.target.value)
                      }
                      className={fieldClass}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {item.rawLineText || lowConfidence ? (
                  <div className="flex items-center gap-2">
                    {lowConfidence ? (
                      <span className={badgeClass}>Low confidence</span>
                    ) : null}
                    {item.rawLineText ? (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {item.rawLineText}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {errors?.[index] ? (
                  <p className={errorClass}>{errors[index]}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}
