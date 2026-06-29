import type {
  ReceiptStorage,
  ReceiptStorageUpload,
  StoredReceiptImage,
} from "@/lib/receipts/storage";

/**
 * Supabase Storage adapter for receipt images (Slice 4).
 *
 * Uploads run server-side with the service-role key (never exposed to the
 * client). Implemented as a single REST call to the Storage API rather than the
 * full `@supabase/supabase-js` SDK to keep the dependency footprint small
 * (decision D13) — the only operation this slice needs is one object upload.
 * Swapping to the SDK later is a localized change behind the `ReceiptStorage`
 * port.
 */

const DEFAULT_BUCKET = "receipts";

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `${name} is not set. Configure Supabase Storage environment variables before uploading receipts.`,
    );
  }
  return value;
}

export function createSupabaseReceiptStorage(): ReceiptStorage {
  const baseUrl = requireEnv(
    "SUPABASE_URL",
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  ).replace(/\/+$/, "");
  const serviceRoleKey = requireEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const bucket = process.env.SUPABASE_RECEIPTS_BUCKET ?? DEFAULT_BUCKET;

  return {
    async upload({
      objectKey,
      contentType,
      body,
    }: ReceiptStorageUpload): Promise<StoredReceiptImage> {
      const endpoint = `${baseUrl}/storage/v1/object/${bucket}/${objectKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": contentType,
          // Never silently overwrite an existing object; keys are unique anyway.
          "x-upsert": "false",
        },
        body,
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(
          `Supabase Storage upload failed (${response.status}): ${detail}`,
        );
      }

      return { bucket, path: objectKey, reference: `${bucket}/${objectKey}` };
    },
  };
}
