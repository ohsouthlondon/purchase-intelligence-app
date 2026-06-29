import { expect, test } from "@playwright/test";

// These cover the capture → manual-entry UI flow. Persisting to the database
// requires DATABASE_URL (absent in the test env), so the successful save path is
// verified by the PGlite integration test, not here.

test("capture hub links to the manual entry form", async ({ page }) => {
  await page.goto("/capture");

  await page.getByRole("link", { name: /add manual entry/i }).click();

  await expect(page).toHaveURL(/\/capture\/manual$/);
  await expect(
    page.getByRole("heading", { name: /add manual entry/i }),
  ).toBeVisible();
});

test("form switches between total and itemized modes", async ({ page }) => {
  await page.goto("/capture/manual");

  // Total-only by default.
  await expect(page.getByLabel(/amount/i)).toBeVisible();

  // Switch to itemized: amount disappears, item entry appears. The radio is
  // visually hidden behind a styled label, so click the label a user would tap.
  await page.getByText("Itemized", { exact: true }).click();
  await expect(page.getByRole("radio", { name: /itemized/i })).toBeChecked();
  await expect(page.getByLabel(/amount/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /add item/i })).toBeVisible();
  await expect(page.getByRole("group", { name: /item 1/i })).toBeVisible();

  // Add and remove a line.
  await page.getByRole("button", { name: /add item/i }).click();
  await expect(page.getByRole("group", { name: /item 2/i })).toBeVisible();
  await page.getByRole("button", { name: /remove item 2/i }).click();
  await expect(page.getByRole("group", { name: /item 2/i })).toHaveCount(0);
});
