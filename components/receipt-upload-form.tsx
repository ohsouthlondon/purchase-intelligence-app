"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  submitReceiptUpload,
  type ReceiptUploadActionResult,
} from "@/app/capture/receipt/actions";
import { RECEIPT_ALLOWED_TYPES } from "@/lib/receipts/schema";

/**
 * Receipt image upload form (Slice 4).
 *
 * Posts the raw `File` to the Server Action via FormData (a binary file's
 * natural carrier), which re-validates with Zod. Client-side `accept` and the
 * preview are convenience only — the action is the source of truth.
 */

const fieldClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none file:mr-3 file:rounded file:border-0 file:bg-neutral-100 file:px-3 file:py-1 file:text-sm focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 dark:file:bg-neutral-800 dark:file:text-neutral-200";
const labelClass = "text-sm font-medium text-neutral-700 dark:text-neutral-300";
const errorClass = "text-xs text-red-600 dark:text-red-400";

export function ReceiptUploadForm() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ReceiptUploadActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const imageError =
    result?.status === "error" ? result.fieldErrors?.image?.[0] : undefined;

  function clearPreview() {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setResult(null);
    clearPreview();
    if (!file) {
      setFileName(null);
      return;
    }
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function resetForm() {
    clearPreview();
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = inputRef.current?.files?.[0] ?? null;
    const formData = new FormData();
    if (file) formData.set("image", file);

    startTransition(async () => {
      const actionResult = await submitReceiptUpload(formData);
      setResult(actionResult);
      if (actionResult.status === "success") {
        resetForm();
        if (actionResult.receiptId) {
          router.push(`/capture/receipt/${actionResult.receiptId}/review`);
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="receipt-image" className={labelClass}>
          Receipt image
        </label>
        <input
          ref={inputRef}
          id="receipt-image"
          name="image"
          type="file"
          accept={RECEIPT_ALLOWED_TYPES.join(",")}
          onChange={handleFileChange}
          className={fieldClass}
          aria-describedby={imageError ? "receipt-image-error" : undefined}
        />
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          JPEG, PNG, or WebP, up to 10 MB.
        </p>
        {imageError ? (
          <p id="receipt-image-error" className={errorClass}>
            {imageError}
          </p>
        ) : null}
      </div>

      {previewUrl ? (
        <div className="flex flex-col gap-2">
          <span className={labelClass}>Preview</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={`Selected receipt: ${fileName ?? "image"}`}
            className="max-h-64 w-auto rounded-md border border-neutral-200 object-contain dark:border-neutral-800"
          />
          {fileName ? (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {fileName}
            </span>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !fileName}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {isPending ? "Uploading…" : "Upload receipt"}
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
