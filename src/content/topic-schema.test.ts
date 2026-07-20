import { describe, expect, it } from "vitest";
import { topicFrontmatterSchema } from "./topic-schema";

const validTopic = {
  title: "Gradient Descent",
  description: "An iterative optimisation algorithm.",
  authors: ["Praneeth-Suresh"],
  difficulty: "beginner",
  category: "classical-ml",
  domains: ["optimisation"],
  tags: ["learning-rate"],
};

describe("topic frontmatter schema", () => {
  it("accepts one or more ordered GitHub co-authors", () => {
    const singleAuthor = topicFrontmatterSchema.parse(validTopic);
    const multipleAuthors = topicFrontmatterSchema.parse({
      ...validTopic,
      authors: ["Praneeth-Suresh", "N00bcak"],
    });

    expect(singleAuthor.authors).toEqual(["Praneeth-Suresh"]);
    expect(multipleAuthors.authors).toEqual(["Praneeth-Suresh", "N00bcak"]);
  });

  it.each([
    { ...validTopic, authors: [] },
    { ...validTopic, authors: ["Praneeth-Suresh, N00bcak"] },
    {
      ...validTopic,
      authors: undefined,
      author: "Praneeth-Suresh",
    },
  ])("rejects invalid or legacy author metadata", (topic) => {
    expect(topicFrontmatterSchema.safeParse(topic).success).toBe(false);
  });
});
