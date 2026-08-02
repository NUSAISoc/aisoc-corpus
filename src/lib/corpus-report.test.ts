import { describe, expect, it } from "vitest";
import { previousMonthRange, scoreContributors } from "./corpus-report";

describe("monthly contributor report", () => {
  it("selects the previous UTC month", () => {
    const period = previousMonthRange(new Date("2026-08-02T00:00:00Z"));
    expect(period.key).toBe("2026-07");
    expect(period.label).toBe("July 2026");
  });

  it("combines contribution magnitude with page popularity", () => {
    const period = previousMonthRange(new Date("2026-08-02T00:00:00Z"));
    const ranked = scoreContributors(
      [
        {
          slug: "popular",
          path: "/topics/popular/",
          title: "Popular",
          authors: ["alice"],
          updatedDate: "2026-07-12",
          wordCount: 1800,
        },
        {
          slug: "deep",
          path: "/topics/deep/",
          title: "Deep",
          authors: ["bob"],
          updatedDate: "2026-07-20",
          wordCount: 3000,
        },
      ],
      new Map([
        ["/topics/popular/", 120],
        ["/topics/deep/", 5],
      ]),
      period,
    );

    expect(ranked[0].author).toBe("alice");
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it("splits co-author credit equally", () => {
    const period = previousMonthRange(new Date("2026-08-02T00:00:00Z"));
    const ranked = scoreContributors(
      [
        {
          slug: "shared",
          path: "/topics/shared/",
          title: "Shared",
          authors: ["alice", "bob"],
          updatedDate: "2026-07-02",
          wordCount: 1200,
        },
      ],
      new Map([["/topics/shared/", 40]]),
      period,
    );

    expect(ranked).toHaveLength(2);
    expect(ranked[0].popularity).toBe(20);
    expect(ranked[1].contributionMagnitude).toBe(
      ranked[0].contributionMagnitude,
    );
  });
});
