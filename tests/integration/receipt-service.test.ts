// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { AppDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { createReceiptUpload } from "@/lib/receipts/service";
import type {
  ReceiptStorage,
  ReceiptStorageUpload,
} from "@/lib/receipts/storage";

// In-process Postgres running the same generated migration as production, so
// the service exercises the real `receipts` schema.
const client = new PGlite();
const drizzleDb = drizzle(client, { schema });
const db = drizzleDb as unknown as AppDb;

/** Records every upload so the test can assert what reached storage. */
function createFakeStorage(): ReceiptStorage & {
  uploads: ReceiptStorageUpload[];
} {
  const uploads: ReceiptStorageUpload[] = [];
  return {
    uploads,
    async upload(upload) {
      uploads.push(upload);
      return {
        bucket: "receipts",
        path: upload.objectKey,
        reference: `receipts/${upload.objectKey}`,
      };
    },
  };
}

function jpegFile(): File {
  return new File([new Uint8Array([10, 20, 30])], "receipt.jpg", {
    type: "image/jpeg",
  });
}

beforeAll(async () => {
  await migrate(drizzleDb, { migrationsFolder: "./drizzle" });
});

afterAll(async () => {
  await client.close();
});

describe("createReceiptUpload", () => {
  it("uploads the image and persists a pending receipt row", async () => {
    const storage = createFakeStorage();

    const result = await createReceiptUpload(
      { db, storage },
      { image: jpegFile() },
    );

    // The bytes and content type reached storage.
    expect(storage.uploads).toHaveLength(1);
    expect(storage.uploads[0].contentType).toBe("image/jpeg");
    expect(storage.uploads[0].body.byteLength).toBe(3);
    expect(storage.uploads[0].objectKey).toMatch(/\.jpg$/);

    // The receipt row references the stored object and is pending OCR.
    const [receipt] = await drizzleDb
      .select()
      .from(schema.receipts)
      .where(eq(schema.receipts.id, result.receiptId));

    expect(receipt.sourceImageUrl).toBe(result.imageReference);
    expect(receipt.sourceImageUrl).toMatch(/^receipts\//);
    expect(receipt.ocrStatus).toBe("pending");
    expect(receipt.reviewStatus).toBe("unreviewed");
  });

  it("writes no receipt row when storage fails", async () => {
    const failingStorage: ReceiptStorage = {
      async upload() {
        throw new Error("storage offline");
      },
    };

    const before = await drizzleDb.select().from(schema.receipts);

    await expect(
      createReceiptUpload(
        { db, storage: failingStorage },
        { image: jpegFile() },
      ),
    ).rejects.toThrow(/storage offline/);

    const after = await drizzleDb.select().from(schema.receipts);
    expect(after).toHaveLength(before.length);
  });
});
