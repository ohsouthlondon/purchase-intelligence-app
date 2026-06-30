"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { createReceiptParser } from "@/lib/receipts/parsing/create-parser";
import { parseReceipt } from "@/lib/receipts/parsing/service";
import { reviewReceiptSchema } from "@/lib/receipts/review/schema";
import { saveReviewedReceipt } from "@/lib/receipts/review/service";

/**
 * Server Actions for the receipt review flow (Milestone 2, Slice 1).
 *
 * The page reads the `id` from the dynamic segment and passes it explicitly as
 * the first argument, so the actions never depend on closure or routing magic.
 * The parser is chosen by `createReceiptParser` (live provider with mock
 * fallback, or mock when unconfigured), so this action is provider-agnostic.
 */

export interface ReceiptActionResult {
  status: "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Validation messages for edited line items, keyed by their row index. */
  itemErrors?: Record<number, string>;
}

/**
 * Splits a review validation failure into header field errors and per-item
 * errors (keyed by row index) so each control can show its own message.
 */
function collectReviewErrors(error: z.ZodError): {
  fieldErrors: Record<string, string[]>;
  itemErrors: Record<number, string>;
} {
  const fieldErrors: Record<string, string[]> = {};
  const itemErrors: Record<number, string> = {};

  for (const issue of error.issues) {
    const [first, second] = issue.path;
    if (first === "items" && typeof second === "number") {
      itemErrors[second] ??= issue.message;
    } else if (typeof first === "string") {
      (fieldErrors[first] ??= []).push(issue.message);
    }
  }

  return { fieldErrors, itemErrors };
}

export async function runParse(
  receiptId: string,
): Promise<ReceiptActionResult> {
  try {
    const result = await parseReceipt(
      { db: getDb(), parser: createReceiptParser() },
      receiptId,
    );
    revalidatePath(`/capture/receipt/${receiptId}/review`);
    return {
      status: result.status === "failed" ? "error" : "success",
      message: result.message,
    };
  } catch (error) {
    console.error("Failed to parse receipt", error);
    return {
      status: "error",
      message: "Could not parse the receipt. Please try again.",
    };
  }
}

export async function submitReview(
  receiptId: string,
  input: unknown,
): Promise<ReceiptActionResult> {
  const parsed = reviewReceiptSchema.safeParse(input);

  if (!parsed.success) {
    const { fieldErrors, itemErrors } = collectReviewErrors(parsed.error);
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
      itemErrors,
    };
  }

  try {
    await saveReviewedReceipt(getDb(), receiptId, parsed.data);
  } catch (error) {
    console.error("Failed to save reviewed receipt", error);
    return {
      status: "error",
      message: "Could not save the review. Please try again.",
    };
  }

  revalidatePath(`/capture/receipt/${receiptId}/review`);
  revalidatePath("/");

  return { status: "success", message: "Review saved." };
}
