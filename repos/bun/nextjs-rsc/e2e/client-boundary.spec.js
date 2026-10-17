import { expect, test } from "@playwright/test";

test("serves HTML rendered through nested client exports", async ({
  request,
}) => {
  const response = await request.get("/");
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("Server child");
  for (const id of [
    "provider",
    "deep",
    "memo",
    "private",
    "same-name",
    "external",
  ]) {
    expect(html).toContain(`id="${id}"`);
  }
});

test("hydrates ReScript and external component state", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Nested client components" }),
  ).toBeVisible();
  const counter = page.getByRole("button", { name: "Count: 0", exact: true });
  await counter.click();
  await expect(
    page.getByRole("button", { name: "Count: 1", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "External: 0", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "External: 1", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
