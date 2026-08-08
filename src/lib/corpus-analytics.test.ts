import { describe, expect, test } from "vitest";
import { buildAnalyticsOverviewQueries } from "./corpus-analytics";

describe("Signal Deck Analytics Engine queries", () => {
  test("uses documented Analytics Engine SQL functions", () => {
    const queries = buildAnalyticsOverviewQueries(30, "aisoc_corpus_pageviews");

    expect(queries).toHaveLength(6);
    expect(queries.join(" ")).toContain("INTERVAL '30' DAY");
    expect(queries[0]).toContain("count(DISTINCT blob1)");
    expect(queries[1]).toContain("argMax(blob2, timestamp) AS title");
    expect(queries[2]).toContain("formatDateTime(timestamp, '%Y-%m-%d')");
    expect(queries.join(" ")).not.toMatch(/\b(any|uniq|toDate)\(/);
  });
});
