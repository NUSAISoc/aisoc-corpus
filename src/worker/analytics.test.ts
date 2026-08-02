import { describe, expect, test } from "vitest";
import {
  buildAnalyticsQueries,
  normalizePageviewPayload,
  normalizeReferrer,
} from "./analytics";

describe("analytics ingestion", () => {
  test("normalizes pageview payloads before writing", () => {
    expect(
      normalizePageviewPayload({
        path: "/topics/gradient-descent?utm=test#intro",
        title: "Gradient Descent",
        referrer: "https://google.com/search?q=gd",
        viewport: "1440x900",
        language: "en-SG",
      }),
    ).toEqual({
      path: "/topics/gradient-descent",
      title: "Gradient Descent",
      referrer: "google.com",
      viewport: "1440x900",
      language: "en-SG",
    });
  });

  test("falls back to direct for missing or malformed referrers", () => {
    expect(normalizeReferrer("")).toBe("Direct");
    expect(normalizeReferrer("not a url")).toBe("Direct");
  });

  test("builds bounded whitelisted Analytics Engine queries", () => {
    const queries = buildAnalyticsQueries(365, "corpus_pageviews;DROP");

    expect(queries.overview).toContain("FROM corpus_pageviews");
    expect(queries.overview).toContain("INTERVAL '90' DAY");
    expect(queries.topPages).toContain("GROUP BY path");
    expect(queries.referrers).toContain("GROUP BY referrer");
    expect(queries.usagePatterns).toContain("toStartOfHour(timestamp)");
  });
});
