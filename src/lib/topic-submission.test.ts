import { describe, expect, it } from "vitest";

import {
  TopicSubmissionError,
  prepareTopicSubmission,
  renderTopicMarkdown,
  slugifyTopicTitle,
} from "./topic-submission";

const validTopic = {
  title: "Mixture of Experts",
  slug: "mixture-of-experts",
  description:
    "A sparse neural network architecture that routes tokens to expert subnetworks.",
  authors: ["contributor-one", "contributor-two"],
  difficulty: "intermediate" as const,
  category: "deep-learning" as const,
  domains: ["deep-learning", "sparse-models"],
  tags: ["routing", "transformers"],
  prerequisites: ["neural-networks"],
  furtherReading: [
    {
      title: "Switch Transformers",
      url: "https://arxiv.org/abs/2101.03961",
    },
  ],
  markdown:
    "## Overview\n\nSparse expert routing sends each token to a smaller subset of parameters.",
};

describe("topic submission preparation", () => {
  it("normalizes a topic submission into a canonical corpus topic file", () => {
    const prepared = prepareTopicSubmission(validTopic, [
      {
        name: "routing-diagram.png",
        type: "image/png",
        size: 512,
        contentBase64: "aW1hZ2U=",
      },
    ]);

    expect(prepared.topicPath).toBe(
      "src/content/topics/deep-learning/mixture-of-experts.md",
    );
    expect(prepared.images[0].path).toBe(
      "public/corpus-uploads/mixture-of-experts/routing-diagram.png",
    );
    expect(prepared.markdown).toContain(
      'authors: ["contributor-one", "contributor-two"]',
    );
    expect(prepared.markdown).toContain("furtherReading:");
    expect(prepared.markdown).toContain("## Overview");
  });

  it("rejects unsafe slugs, H1 content, missing further reading, and oversized images", () => {
    expect(() =>
      prepareTopicSubmission(
        {
          ...validTopic,
          slug: "../bad",
          furtherReading: [],
          markdown: "# Duplicate title\n\nBody",
        },
        [
          {
            name: "diagram.svg",
            type: "image/svg+xml",
            size: 3 * 1024 * 1024,
            contentBase64: "aW1hZ2U=",
          },
        ],
      ),
    ).toThrow(TopicSubmissionError);
  });

  it("renders frontmatter with quoted strings and optional prerequisites", () => {
    expect(
      renderTopicMarkdown({ ...validTopic, prerequisites: [] }),
    ).not.toContain("prerequisites:");
    expect(renderTopicMarkdown(validTopic)).toContain(
      'title: "Mixture of Experts"',
    );
    expect(slugifyTopicTitle("Q-Learning: Basics")).toBe("q-learning-basics");
  });
});
