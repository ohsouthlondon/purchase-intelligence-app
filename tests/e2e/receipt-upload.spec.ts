import { expect, test } from "@playwright/test";

// These cover the capture → receipt-upload UI flow. Persisting requires
// DATABASE_URL and Supabase Storage env (absent in the test env), so the
// successful save path is verified by the PGlite integration test, not here.

test("capture hub links to the receipt upload form", async ({ page }) => {
  await page.goto("/capture");

  await page.getByRole("link", { name: /upload receipt/i }).click();

  await expect(page).toHaveURL(/\/capture\/receipt$/);
  await expect(
    page.getByRole("heading", { name: /upload receipt/i }),
  ).toBeVisible();
});

test("selecting a file shows a preview and enables upload", async ({
  page,
}) => {
  await page.goto("/capture/receipt");

  const uploadButton = page.getByRole("button", { name: /upload receipt/i });
  await expect(uploadButton).toBeDisabled();

  await page.getByLabel(/receipt image/i).setInputFiles({
    name: "receipt.png",
    mimeType: "image/png",
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  });

  await expect(page.getByText("receipt.png")).toBeVisible();
  await expect(
    page.getByRole("img", { name: /selected receipt/i }),
  ).toBeVisible();
  await expect(uploadButton).toBeEnabled();
});
