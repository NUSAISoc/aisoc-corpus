import { describe, expect, it } from "vitest";
import {
  DEFAULT_SOCIAL_IMAGE,
  SITE_URL,
  canonicalUrl,
  robotsDirective,
  serializeJsonLd,
  topicSchema,
  organizationSchema,
} from "./seo";
import { normalizeSiteUrl } from "../config/site";

describe("seo helpers", () => {
  it("builds canonical URLs from site-relative paths", () => {
    expect(canonicalUrl("/topics/linear-regression/")).toBe(
      `${SITE_URL}/topics/linear-regression/`,
    );
    expect(canonicalUrl("about/")).toBe(`${SITE_URL}/about/`);
  });

  it("normalizes a configured canonical origin and rejects paths", () => {
    expect(normalizeSiteUrl("https://corpus.example.org/")).toBe(
      "https://corpus.example.org",
    );
    expect(() => normalizeSiteUrl("https://example.org/corpus")).toThrow(
      "without a path",
    );
  });

  it("uses a share-ready default social image", () => {
    expect(DEFAULT_SOCIAL_IMAGE).toBe("/images/ai-soc-corpus-social-card.png");
  });

  it("keeps private pages out of search results", () => {
    expect(robotsDirective(true)).toBe(
      "index, follow, max-image-preview:large",
    );
    expect(robotsDirective(false)).toBe("noindex, nofollow");
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
      authors: ["Praneeth-Suresh", "N00bcak"],
      difficulty: "beginner",
      category: "Classical ML",
      domains: ["supervised-learning"],
      tags: ["least-squares"],
      furtherReading: [{ title: "ISLR", url: "https://www.statlearning.com/" }],
      updatedDate: "2026-06-24",
    });

    expect(schema).toMatchObject({
      headline: "Linear Regression",
      url: `${SITE_URL}/topics/linear-regression/`,
      educationalLevel: "beginner",
      author: [
        {
          "@type": "Person",
          name: "Praneeth-Suresh",
          url: "https://github.com/Praneeth-Suresh",
        },
        {
          "@type": "Person",
          name: "N00bcak",
          url: "https://github.com/N00bcak",
        },
      ],
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
