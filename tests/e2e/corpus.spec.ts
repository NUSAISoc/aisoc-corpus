import { test, expect } from "@playwright/test";

test("homepage loads with graph and category buttons", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("The Corpus");
  await expect(page.locator(".category-nav")).toBeVisible();
  await expect(
    page.locator("svg[aria-label='Knowledge graph visualization']"),
  ).toBeVisible();
});

test("topics page lists all topics", async ({ page }) => {
  await page.goto("/topics");
  await expect(page.locator("h1")).toContainText("Topics");
  await expect(page.locator(".topic-card")).toHaveCount(6);
  await expect(
    page.locator(".topic-card", { hasText: "Transformers" }),
  ).toBeVisible();
  await expect(
    page.locator(".topic-card", { hasText: "Q-Learning" }),
  ).toBeVisible();
});

test("category page lists topics", async ({ page }) => {
  await page.goto("/categories/classical-ml");
  await expect(page.locator("h1")).toContainText("Classical Ml");
  await expect(page.locator(".topic-card")).toHaveCount(3);
});

test("graph keeps edges attached when switching relation modes", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.locator("svg[aria-label='Knowledge graph visualization']"),
  ).toBeVisible();

  const assertEdgesAttached = async () => {
    await expect
      .poll(
        async () =>
          page
            .locator("svg[aria-label='Knowledge graph visualization']")
            .evaluate((svg) => {
              const nodeCenters = Array.from(svg.querySelectorAll(".nodes > g"))
                .map((node) => {
                  const transform = node.getAttribute("transform") ?? "";
                  const match = transform.match(
                    /translate\(([-\d.]+),([-\d.]+)\)/,
                  );
                  return match
                    ? { x: Number(match[1]), y: Number(match[2]) }
                    : null;
                })
                .filter(
                  (point): point is { x: number; y: number } => point !== null,
                );

              const lines = Array.from(svg.querySelectorAll(".links line")).map(
                (line) => ({
                  x1: Number(line.getAttribute("x1")),
                  y1: Number(line.getAttribute("y1")),
                  x2: Number(line.getAttribute("x2")),
                  y2: Number(line.getAttribute("y2")),
                }),
              );

              const closeToNode = (x: number, y: number) =>
                nodeCenters.some(
                  (node) => Math.hypot(node.x - x, node.y - y) < 2,
                );

              return (
                lines.length > 0 &&
                lines.every(
                  (line) =>
                    closeToNode(line.x1, line.y1) &&
                    closeToNode(line.x2, line.y2),
                )
              );
            }),
        { timeout: 5000 },
      )
      .toBe(true);
  };

  await page.getByRole("button", { name: "Learning Path" }).click();
  await assertEdgesAttached();

  await page.getByRole("button", { name: "Semantic" }).click();
  await assertEdgesAttached();
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
