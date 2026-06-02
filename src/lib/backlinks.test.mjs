import { describe, it, expect } from "vitest";
import { generateBacklinks } from "../lib/generate-backlinks.mjs";

describe("generateBacklinks", () => {
  it("generates a non-empty backlinks map", () => {
    const backlinks = generateBacklinks();
    expect(Object.keys(backlinks).length).toBeGreaterThan(0);
  });

  it("gradient-descent is referenced by multiple topics", () => {
    const backlinks = generateBacklinks();
    expect(backlinks["gradient-descent"]).toBeDefined();
    expect(backlinks["gradient-descent"].length).toBeGreaterThanOrEqual(2);
  });

  it("each backlink entry has slug and title", () => {
    const backlinks = generateBacklinks();
    for (const refs of Object.values(backlinks)) {
      for (const ref of refs) {
        expect(ref).toHaveProperty("slug");
        expect(ref).toHaveProperty("title");
      }
    }
  });
});
