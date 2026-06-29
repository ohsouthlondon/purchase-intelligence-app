import { expect, test } from "@playwright/test";

test("home page shows the app brand and inbox screen", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /purchase intelligence/i }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /inbox/i })).toBeVisible();
});
