import { describe, expect, it } from "vitest";

import {
  COMMENT_MARKER,
  buildReviewPacket,
  formatReviewComment,
  isTopicMarkdownPath,
  normalizeAgentName,
  renderAgentCommand,
  resolveAgentCommandTemplate,
  selectReviewableTopicFiles,
} from "../scripts/review-topic-pr.mjs";

describe("topic PR reviewer helpers", () => {
  it("selects only new or modified topic markdown files", () => {
    const selected = selectReviewableTopicFiles([
      { path: "src/content/topics/classical-ml/new-topic.md", status: "added" },
      {
        path: "src/content/topics/deep-learning/old-topic.md",
        status: "modified",
      },
      {
        path: "src/content/topics/deep-learning/removed.md",
        status: "removed",
      },
      { path: "src/pages/contribute.astro", status: "modified" },
      { path: "README.md", status: "modified" },
    ]);

    expect(selected.map((file) => file.path)).toEqual([
      "src/content/topics/classical-ml/new-topic.md",
      "src/content/topics/deep-learning/old-topic.md",
    ]);
  });

  it("recognizes only corpus topic markdown paths", () => {
    expect(
      isTopicMarkdownPath("src/content/topics/generative/attention.md"),
    ).toBe(true);
    expect(
      isTopicMarkdownPath("src/content/topics/generative/attention.mdx"),
    ).toBe(false);
    expect(isTopicMarkdownPath("docs/topics/generative/attention.md")).toBe(
      false,
    );
  });

  it("builds a review packet with prompt, standards, PR metadata, and topic content", () => {
    const packet = buildReviewPacket({
      promptText: "Review prompt",
      contributingText: "Contribution standard",
      agent: "codex",
      pr: {
        number: 42,
        title: "Add backpropagation",
        body: "Adds a topic.",
        author: { login: "contributor" },
        url: "https://github.com/org/repo/pull/42",
        baseRefName: "main",
        headRefName: "topic/backpropagation",
      },
      topicFiles: [
        {
          path: "src/content/topics/deep-learning/backpropagation.md",
          status: "added",
          content: "---\ntitle: Backpropagation\n---\n\n## Overview\n",
        },
      ],
    });

    expect(packet).toContain("Review prompt");
    expect(packet).toContain("Contribution standard");
    expect(packet).toContain("Add backpropagation");
    expect(packet).toContain(
      "src/content/topics/deep-learning/backpropagation.md",
    );
    expect(packet).toContain("title: Backpropagation");
  });

  it("formats a marked sticky PR comment", () => {
    const comment = formatReviewComment({
      agent: "claude-code",
      agentOutput: "## Automated Topic Review\n\n### Required Changes\n- None.",
      prNumber: 42,
      topicFileCount: 1,
    });

    expect(comment).toContain(COMMENT_MARKER);
    expect(comment).toContain("## Automated Topic Review");
    expect(comment).toContain("`claude-code`");
    expect(comment).toContain("PR #42");
  });

  it("requires a non-empty agent review", () => {
    expect(() =>
      formatReviewComment({
        agent: "codex",
        agentOutput: "   ",
        prNumber: 1,
        topicFileCount: 1,
      }),
    ).toThrow("empty review");
  });

  it("resolves supported agent command templates and substitutes prompt paths safely", () => {
    const template = resolveAgentCommandTemplate("kiro-cli", {
      AUTO_REVIEWER_KIRO_CLI_CMD: "kiro review --file {prompt_file}",
    });
    const command = renderAgentCommand(template, "/tmp/prompt's.md");

    expect(command).toBe("kiro review --file '/tmp/prompt'\\''s.md'");
  });

  it("normalizes friendly agent aliases", () => {
    expect(normalizeAgentName("claude code")).toBe("claude-code");
    expect(normalizeAgentName("claude")).toBe("claude-code");
    expect(normalizeAgentName("kiro")).toBe("kiro-cli");
  });
});
