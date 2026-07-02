import { test, expect } from "@playwright/test";

test("homepage loads with graph and category buttons", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("The Corpus");
  await expect(page.locator(".category-nav")).toBeVisible();
  await expect(page.locator(".category-nav .category-btn")).toHaveCount(5);
  await expect(page.getByRole("link", { name: "Classical ML" })).toHaveCSS(
    "color",
    "rgb(204, 255, 0)",
  );
  await expect(page.getByRole("link", { name: "Deep Learning" })).toHaveCSS(
    "color",
    "rgb(99, 102, 241)",
  );
  await expect(
    page.locator("svg[aria-label='Knowledge graph visualization']"),
  ).toBeVisible();
  await expect(
    page.locator("svg[aria-label='Knowledge graph visualization'] text", {
      hasText: "lime",
    }),
  ).toBeVisible();
});

test("topics page lists all topics", async ({ page }) => {
  await page.goto("/topics");
  await expect(page.locator("h1")).toContainText("Topics");
  await expect(
    page.getByRole("navigation", { name: "Browse topics by category" }),
  ).toBeVisible();
  await expect(page.locator(".category-nav .category-btn")).toHaveCount(5);
  await expect(page.locator(".topic-card")).toHaveCount(8);
  await expect(
    page.locator(".topic-card", { hasText: "Transformers" }),
  ).toBeVisible();
  await expect(
    page.locator(".topic-card", { hasText: "Q-Learning" }),
  ).toBeVisible();
  await expect(page.locator(".topic-card", { hasText: "LIME" })).toBeVisible();
  await expect(
    page.locator(".topic-card", { hasText: "World Models" }),
  ).toBeVisible();
});

test("topics page category buttons navigate to category pages", async ({
  page,
}) => {
  await page.goto("/topics");
  const categoryNav = page.getByRole("navigation", {
    name: "Browse topics by category",
  });

  await categoryNav.getByRole("link", { name: "Classical ML" }).click();
  await expect(page).toHaveURL(/\/categories\/classical-ml$/);
  await expect(page.locator("h1")).toContainText("Classical ML");
});

test("topics page searches indexed topic metadata", async ({ page }) => {
  await page.goto("/topics");
  const search = page.getByLabel("Search topics");

  await search.fill("reinforcement");
  await expect(page.locator(".topic-card:visible")).toHaveCount(2);
  await expect(
    page.locator(".topic-card:visible", { hasText: "Q-Learning" }),
  ).toBeVisible();
  await expect(
    page.locator(".topic-card:visible", { hasText: "World Models" }),
  ).toBeVisible();
  await expect(page.locator("#topic-search-count")).toContainText("2 shown");

  await search.fill("Praneeth-Suresh calculus");
  await expect(page.locator(".topic-card:visible")).toHaveCount(1);
  await expect(
    page.locator(".topic-card:visible", { hasText: "Gradient Descent" }),
  ).toBeVisible();

  await search.fill("no-such-topic");
  await expect(page.locator(".topic-card:visible")).toHaveCount(0);
  await expect(page.locator(".topic-empty")).toBeVisible();
});

test("category page lists topics", async ({ page }) => {
  await page.goto("/categories/classical-ml");
  await expect(page.locator("h1")).toContainText("Classical ML");
  await expect(page.locator(".topic-card")).toHaveCount(4);
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
  await expect
    .poll(async () =>
      page
        .locator("svg[aria-label='Knowledge graph visualization'] .links line")
        .first()
        .evaluate((line) => ({
          stroke: line.getAttribute("stroke"),
          width: line.getAttribute("stroke-width"),
          dash: line.getAttribute("stroke-dasharray"),
        })),
    )
    .toEqual({
      stroke: "rgba(167,139,250,0.75)",
      width: "2.25",
      dash: "5,5",
    });
});

test("topic page renders KaTeX equations", async ({ page }) => {
  await page.goto("/topics/gradient-descent");
  await expect(page.locator("h1")).toContainText("Gradient Descent");
  // KaTeX renders .katex elements
  await expect(page.locator(".katex").first()).toBeVisible();
});

test("LIME topic page renders", async ({ page }) => {
  await page.goto("/topics/lime");
  await expect(page.locator("h1")).toContainText("LIME");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
});

test("topic page renders tags and author", async ({ page }) => {
  await page.goto("/topics/gradient-descent");
  await expect(page.locator(".topic-tags")).toContainText("learning-rate");
  await expect(page.locator(".topic-author")).toContainText(
    "Author @Praneeth-Suresh",
  );
  await expect(page.locator(".topic-author a")).toHaveAttribute(
    "href",
    "https://github.com/Praneeth-Suresh",
  );
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
