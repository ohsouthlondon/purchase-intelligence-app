"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/lib/db";
import { receiptUploadSchema } from "@/lib/receipts/schema";
import { createReceiptUpload } from "@/lib/receipts/service";
import { createSupabaseReceiptStorage } from "@/lib/receipts/supabase-storage";

/**
 * Server Action for the receipt image upload form (Slice 4).
 *
 * `formData` carries the untrusted `File`, so it is validated with Zod before
 * any upload or DB write. The image is uploaded to Supabase Storage and a
 * `receipts` row is persisted in `pending` OCR state — parsing/review is
 * Milestone 2 and out of scope here.
 */

export interface ReceiptUploadActionResult {
  status: "success" | "error";
  message: string;
  receiptId?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function submitReceiptUpload(
  formData: FormData,
): Promise<ReceiptUploadActionResult> {
  const parsed = receiptUploadSchema.safeParse({
    image: formData.get("image"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please choose a valid receipt image.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let receiptId: string;
  try {
    const created = await createReceiptUpload(
      { db: getDb(), storage: createSupabaseReceiptStorage() },
      parsed.data,
    );
    receiptId = created.receiptId;
  } catch (error) {
    console.error("Failed to upload receipt", error);
    return {
      status: "error",
      message: "Could not upload the receipt. Please try again.",
    };
  }

  // The Inbox (and later dashboards) read this data; refresh their caches.
  revalidatePath("/");

  return { status: "success", message: "Receipt uploaded.", receiptId };
}
