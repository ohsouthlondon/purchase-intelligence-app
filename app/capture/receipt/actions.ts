"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/lib/db";
import { createReceiptParser } from "@/lib/receipts/parsing/create-parser";
import { parseReceipt } from "@/lib/receipts/parsing/service";
import { receiptUploadSchema } from "@/lib/receipts/schema";
import { createReceiptUpload } from "@/lib/receipts/service";
import { createSupabaseReceiptStorage } from "@/lib/receipts/supabase-storage";

/**
 * Server Action for the receipt image upload form (Slice 4).
 *
 * `formData` carries the untrusted `File`, so it is validated with Zod before
 * any upload or DB write. The image is uploaded to Supabase Storage and a
 * `receipts` row is persisted, then parsed best-effort (via the provider seam
 * with mock fallback) so the review screen opens pre-filled.
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

  // Best-effort parse so the review screen opens pre-filled. The parser uses a
  // live provider when configured and falls back to mock output otherwise, so it
  // always produces something locally. A failure here is non-fatal: the receipt
  // is saved and the review screen offers a manual re-parse.
  try {
    await parseReceipt(
      { db: getDb(), parser: createReceiptParser() },
      receiptId,
    );
  } catch (error) {
    console.error("Auto-parse after upload failed", error);
  }

  // The Inbox (and later dashboards) read this data; refresh their caches.
  revalidatePath("/");
  revalidatePath(`/capture/receipt/${receiptId}/review`);

  return { status: "success", message: "Receipt uploaded.", receiptId };
}
