import { describe, it, expect } from "vitest";
import { jaccard } from "../lib/jaccard";

describe("jaccard", () => {
  it("returns 1 for identical sets", () => {
    expect(jaccard(["a", "b", "c"], ["a", "b", "c"])).toBe(1);
  });

  it("returns 0 for disjoint sets", () => {
    expect(jaccard(["a", "b"], ["c", "d"])).toBe(0);
  });

  it("returns 0 for empty sets", () => {
    expect(jaccard([], [])).toBe(0);
  });

  it("computes partial overlap correctly", () => {
    // intersection: {a,b} = 2, union: {a,b,c,d} = 4 => 0.5
    expect(jaccard(["a", "b", "c"], ["a", "b", "d"])).toBeCloseTo(0.5);
  });

  it("handles duplicates as a set", () => {
    expect(jaccard(["a", "a", "b"], ["a", "b"])).toBe(1);
  });
});
