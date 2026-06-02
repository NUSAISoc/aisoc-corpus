import { test, expect } from "@playwright/test";

test("homepage loads with graph and category buttons", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("The Corpus");
  await expect(page.locator(".category-nav")).toBeVisible();
  await expect(page.locator("svg[aria-label='Knowledge graph visualization']")).toBeVisible();
});

test("category page lists topics", async ({ page }) => {
  await page.goto("/categories/classical-ml");
  await expect(page.locator("h1")).toContainText("Classical Ml");
  await expect(page.locator(".topic-card")).toHaveCount(3);
});

test("topic page renders KaTeX equations", async ({ page }) => {
  await page.goto("/topics/gradient-descent");
  await expect(page.locator("h1")).toContainText("Gradient Descent");
  // KaTeX renders .katex elements
  await expect(page.locator(".katex").first()).toBeVisible();
});

test("topic page shows backlinks panel", async ({ page }) => {
  await page.goto("/topics/gradient-descent");
  await expect(page.locator(".reader-panel")).toBeVisible();
  await expect(page.locator(".backlinks-list a").first()).toBeVisible();
});

test("wikilinks navigate to topic pages", async ({ page }) => {
  await page.goto("/topics/linear-regression");
  const wikilink = page.locator("a.wikilink").first();
  await expect(wikilink).toBeVisible();
  await wikilink.click();
  await expect(page).toHaveURL(/\/topics\//);
});
