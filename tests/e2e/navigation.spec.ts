import { expect, test } from "@playwright/test";

test("bottom nav moves between sections", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: /primary/i });

  await nav.getByRole("link", { name: /dashboard/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();

  await nav.getByRole("link", { name: /insights/i }).click();
  await expect(page).toHaveURL(/\/insights$/);
  await expect(page.getByRole("heading", { name: /insights/i })).toBeVisible();
});

test("theme toggle flips the dark class on <html>", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  const toggle = page.getByRole("button", {
    name: /switch to (light|dark) mode/i,
  });

  const startedDark = await html.evaluate((el) =>
    el.classList.contains("dark"),
  );
  await toggle.click();

  await expect
    .poll(() => html.evaluate((el) => el.classList.contains("dark")))
    .toBe(!startedDark);
});
