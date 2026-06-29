"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/lib/db";
import { createManualEntry } from "@/lib/manual-entry/service";
import { manualEntryFormSchema } from "@/lib/manual-entry/schema";

/**
 * Server Action for the manual purchase entry form (Slice 3).
 *
 * `input` is untrusted client data, so it is validated with Zod before any DB
 * write. Field-level errors are returned to the form; unexpected failures are
 * logged server-side and surfaced as a generic message.
 */

export interface ManualEntryActionResult {
  status: "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function submitManualEntry(
  input: unknown,
): Promise<ManualEntryActionResult> {
  const parsed = manualEntryFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await createManualEntry(getDb(), parsed.data);
  } catch (error) {
    console.error("Failed to save manual entry", error);
    return {
      status: "error",
      message: "Could not save the entry. Please try again.",
    };
  }

  // The Inbox (and later dashboards) read this data; refresh their caches.
  revalidatePath("/");

  return { status: "success", message: "Manual entry saved." };
}
