import { describe, expect, it, vi } from "vitest";

import { createTopicSubmissionPullRequest } from "./github-topic-pr";
import { prepareTopicSubmission } from "./topic-submission";

describe("GitHub topic PR adapter", () => {
  it("creates a branch, writes markdown and images, then opens a pull request", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-02T00:00:00Z"));

    const submission = prepareTopicSubmission(
      {
        title: "Mixture of Experts",
        slug: "mixture-of-experts",
        description: "Sparse expert routing.",
        authors: ["contributor-one"],
        difficulty: "intermediate",
        category: "deep-learning",
        domains: ["deep-learning"],
        tags: ["routing"],
        prerequisites: [],
        furtherReading: [
          {
            title: "Switch Transformers",
            url: "https://arxiv.org/abs/2101.03961",
          },
        ],
        markdown: "## Overview\n\nBody.",
      },
      [
        {
          name: "routing.png",
          type: "image/png",
          size: 128,
          contentBase64: "aW1hZ2U=",
        },
      ],
    );

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ object: { sha: "base-sha" } }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ref: "created" }), { status: 201 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ content: { path: submission.topicPath } }),
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ content: { path: submission.images[0].path } }),
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            html_url: "https://github.com/NUSAISoc/aisoc-corpus/pull/99",
            number: 99,
          }),
          {
            status: 201,
          },
        ),
      );

    const result = await createTopicSubmissionPullRequest(
      submission,
      {
        owner: "NUSAISoc",
        repo: "aisoc-corpus",
        token: "secret-token",
        baseBranch: "main",
      },
      fetchImpl,
    );

    expect(result).toEqual({
      branch: "topic-submission/mixture-of-experts-1785628800000",
      pullRequestUrl: "https://github.com/NUSAISoc/aisoc-corpus/pull/99",
      pullRequestNumber: 99,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(5);
    expect(fetchImpl.mock.calls[1][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({
        ref: result.branch.replace(/^/, "refs/heads/"),
        sha: "base-sha",
      }),
    });
    expect(fetchImpl.mock.calls[2][0]).toContain(
      "/contents/src/content/topics/deep-learning/mixture-of-experts.md",
    );
    expect(fetchImpl.mock.calls[3][0]).toContain(
      "/contents/public/corpus-uploads/mixture-of-experts/routing.png",
    );

    vi.useRealTimers();
  });
});
