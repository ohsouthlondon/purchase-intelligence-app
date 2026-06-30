"use client";

import { useState, useTransition } from "react";

import {
  submitManualEntry,
  type ManualEntryActionResult,
} from "@/app/capture/manual/actions";

/**
 * Manual purchase entry form (Slice 3).
 *
 * Collects either a "total only" purchase or an itemized one (a dynamic list of
 * line items) and submits a plain serializable object to the Server Action,
 * which re-validates with Zod. Client-side checks are convenience only — the
 * action is the source of truth.
 */

type Mode = "simple" | "itemized";

interface LineItemState {
  name: string;
  price: string;
  quantity: string;
}

interface ManualEntryFormProps {
  categories: readonly string[];
}

const fieldClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-xs outline-none transition-colors placeholder:text-neutral-400 focus:border-accent focus:ring-2 focus:ring-accent/30 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500";
const labelClass = "text-sm font-medium text-neutral-700 dark:text-neutral-300";
const errorClass = "text-xs text-red-600 dark:text-red-400";

function todayIso(): string {
  const now = new Date();
  const localMs = now.getTime() - now.getTimezoneOffset() * 60_000;
  return new Date(localMs).toISOString().slice(0, 10);
}

function emptyItem(): LineItemState {
  return { name: "", price: "", quantity: "" };
}

export function ManualEntryForm({ categories }: ManualEntryFormProps) {
  const [mode, setMode] = useState<Mode>("simple");
  const [merchant, setMerchant] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(todayIso);
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [items, setItems] = useState<LineItemState[]>([emptyItem()]);
  const [result, setResult] = useState<ManualEntryActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const fieldErrors =
    result?.status === "error" ? result.fieldErrors : undefined;
  const errorFor = (field: string): string | undefined =>
    fieldErrors?.[field]?.[0];

  const itemizedTotal = items.reduce((sum, item) => {
    const value = Number(item.price);
    return item.price.trim() !== "" && Number.isFinite(value)
      ? sum + value
      : sum;
  }, 0);

  function updateItem(index: number, patch: Partial<LineItemState>) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function addItem() {
    setItems((current) => [...current, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems((current) =>
      current.length === 1 ? current : current.filter((_, i) => i !== index),
    );
  }

  function resetForm() {
    setMerchant("");
    setPurchaseDate(todayIso());
    setCategory("");
    setNotes("");
    setAmount("");
    setItems([emptyItem()]);
  }

  function buildPayload(): Record<string, unknown> {
    const base = { merchant, purchaseDate, category, notes };
    if (mode === "simple") {
      return { mode, ...base, amount };
    }
    return {
      mode,
      ...base,
      items: items.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity.trim() === "" ? undefined : item.quantity,
      })),
    };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const actionResult = await submitManualEntry(buildPayload());
      setResult(actionResult);
      if (actionResult.status === "success") {
        resetForm();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <fieldset className="flex flex-col gap-2">
        <legend className={labelClass}>Entry type</legend>
        <div className="flex gap-2">
          {(["simple", "itemized"] as const).map((value) => (
            <label
              key={value}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                mode === value
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              <input
                type="radio"
                name="mode"
                value={value}
                checked={mode === value}
                onChange={() => setMode(value)}
                className="sr-only"
              />
              {value === "simple" ? "Total only" : "Itemized"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="merchant" className={labelClass}>
          Merchant <span className="text-neutral-400">(optional)</span>
        </label>
        <input
          id="merchant"
          name="merchant"
          type="text"
          value={merchant}
          onChange={(event) => setMerchant(event.target.value)}
          className={fieldClass}
          placeholder="e.g. Shell, Tesco"
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

      <div className="flex flex-col gap-1">
        <label htmlFor="category" className={labelClass}>
          Category <span className="text-neutral-400">(optional)</span>
        </label>
        <input
          id="category"
          name="category"
          type="text"
          list="category-options"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className={fieldClass}
          placeholder="e.g. fuel"
        />
        <datalist id="category-options">
          {categories.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
        {errorFor("category") ? (
          <p className={errorClass}>{errorFor("category")}</p>
        ) : null}
      </div>

      {mode === "simple" ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="amount" className={labelClass}>
            Amount (£)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className={fieldClass}
            placeholder="0.00"
            aria-describedby={errorFor("amount") ? "amount-error" : undefined}
          />
          {errorFor("amount") ? (
            <p id="amount-error" className={errorClass}>
              {errorFor("amount")}
            </p>
          ) : null}
        </div>
      ) : (
        <fieldset className="flex flex-col gap-3">
          <legend className={labelClass}>Items</legend>
          {items.map((item, index) => (
            <div
              key={index}
              role="group"
              aria-label={`Item ${index + 1}`}
              className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
            >
              <input
                type="text"
                required
                aria-label={`Item ${index + 1} name`}
                value={item.name}
                onChange={(event) =>
                  updateItem(index, { name: event.target.value })
                }
                className={fieldClass}
                placeholder="Item name"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  required
                  aria-label={`Item ${index + 1} price`}
                  value={item.price}
                  onChange={(event) =>
                    updateItem(index, { price: event.target.value })
                  }
                  className={fieldClass}
                  placeholder="Price (£)"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  aria-label={`Item ${index + 1} quantity`}
                  value={item.quantity}
                  onChange={(event) =>
                    updateItem(index, { quantity: event.target.value })
                  }
                  className={fieldClass}
                  placeholder="Qty (optional)"
                />
              </div>
              {items.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="self-start text-xs text-red-600 hover:underline dark:text-red-400"
                >
                  Remove item {index + 1}
                </button>
              ) : null}
            </div>
          ))}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={addItem}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Add item
            </button>
            <span className="text-sm text-neutral-500 tabular-nums dark:text-neutral-400">
              Total: £{itemizedTotal.toFixed(2)}
            </span>
          </div>
          {errorFor("items") ? (
            <p className={errorClass}>{errorFor("items")}</p>
          ) : null}
        </fieldset>
      )}

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
        {isPending ? "Saving…" : "Save entry"}
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
