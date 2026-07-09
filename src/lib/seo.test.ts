import { describe, expect, it } from "vitest";
import {
  canonicalUrl,
  serializeJsonLd,
  topicSchema,
  organizationSchema,
} from "./seo";

describe("seo helpers", () => {
  it("builds canonical URLs from site-relative paths", () => {
    expect(canonicalUrl("/topics/linear-regression/")).toBe(
      "https://aisoc-corpus.aisocietysoc.workers.dev/topics/linear-regression/",
    );
    expect(canonicalUrl("about/")).toBe(
      "https://aisoc-corpus.aisocietysoc.workers.dev/about/",
    );
  });

  it("serializes JSON-LD without raw less-than characters", () => {
    const serialized = serializeJsonLd([{ name: "x < y" }]);

    expect(serialized).toContain("\\u003c");
    expect(serialized).not.toContain("x < y");
  });

  it("builds topic learning resource schema from topic metadata", () => {
    const schema = topicSchema({
      title: "Linear Regression",
      description: "Fitting a linear model to data using least squares.",
      path: "/topics/linear-regression/",
      author: "Praneeth-Suresh",
      difficulty: "beginner",
      category: "Classical ML",
      domains: ["supervised-learning"],
      tags: ["least-squares"],
      citations: [{ title: "ISLR", url: "https://www.statlearning.com/" }],
      updatedDate: "2026-06-24",
    });

    expect(schema).toMatchObject({
      headline: "Linear Regression",
      url: "https://aisoc-corpus.aisocietysoc.workers.dev/topics/linear-regression/",
      educationalLevel: "beginner",
      citation: ["https://www.statlearning.com/"],
      dateModified: "2026-06-24",
    });
  });

  it("declares the NUS AI Society organization entity", () => {
    expect(organizationSchema()).toMatchObject({
      "@type": "EducationalOrganization",
      name: "NUS AI Society",
      alternateName: "NUS SoC AI Society",
      email: "outreach@nusaisociety.org",
    });
  });
});
