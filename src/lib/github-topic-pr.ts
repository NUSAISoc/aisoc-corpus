import type { PreparedTopicSubmission } from "./topic-submission";

export type GitHubTopicPullRequestConfig = {
  owner: string;
  repo: string;
  token: string;
  baseBranch?: string;
};

export type GitHubTopicPullRequestResult = {
  branch: string;
  pullRequestUrl: string;
  pullRequestNumber: number;
};

export type GitHubFetch = typeof fetch;

type GitHubRefResponse = {
  object: {
    sha: string;
  };
};

type GitHubPullRequestResponse = {
  html_url: string;
  number: number;
};

function assertGitHubConfig(config: GitHubTopicPullRequestConfig): void {
  const missing = [
    ["owner", config.owner],
    ["repo", config.repo],
    ["token", config.token],
  ].filter(([, value]) => !value);

  if (missing.length > 0) {
    throw new Error(
      `Missing GitHub configuration: ${missing.map(([key]) => key).join(", ")}`,
    );
  }
}

function gitHubHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "aisoc-corpus-admin-submission",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `GitHub request failed with ${response.status}: ${text.slice(0, 300)}`,
    );
  }
  return JSON.parse(text) as T;
}

async function putFile(params: {
  fetchImpl: GitHubFetch;
  config: GitHubTopicPullRequestConfig;
  branch: string;
  path: string;
  message: string;
  contentBase64: string;
}): Promise<void> {
  const { fetchImpl, config, branch, path, message, contentBase64 } = params;
  const response = await fetchImpl(
    `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`,
    {
      method: "PUT",
      headers: gitHubHeaders(config.token),
      body: JSON.stringify({
        branch,
        message,
        content: contentBase64,
      }),
    },
  );
  await readJson(response);
}

export async function createTopicSubmissionPullRequest(
  submission: PreparedTopicSubmission,
  config: GitHubTopicPullRequestConfig,
  fetchImpl: GitHubFetch = fetch,
): Promise<GitHubTopicPullRequestResult> {
  assertGitHubConfig(config);

  const baseBranch = config.baseBranch || "main";
  const branch = `topic-submission/${submission.topic.slug}-${Date.now()}`;
  const headers = gitHubHeaders(config.token);

  const baseRef = await readJson<GitHubRefResponse>(
    await fetchImpl(
      `https://api.github.com/repos/${config.owner}/${config.repo}/git/ref/heads/${baseBranch}`,
      { headers },
    ),
  );

  await readJson(
    await fetchImpl(
      `https://api.github.com/repos/${config.owner}/${config.repo}/git/refs`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          ref: `refs/heads/${branch}`,
          sha: baseRef.object.sha,
        }),
      },
    ),
  );

  await putFile({
    fetchImpl,
    config,
    branch,
    path: submission.topicPath,
    message: `Add ${submission.topic.title}`,
    contentBase64: utf8ToBase64(submission.markdown),
  });

  for (const image of submission.images) {
    await putFile({
      fetchImpl,
      config,
      branch,
      path: image.path,
      message: `Add image for ${submission.topic.title}`,
      contentBase64: image.contentBase64,
    });
  }

  const pullRequest = await readJson<GitHubPullRequestResponse>(
    await fetchImpl(
      `https://api.github.com/repos/${config.owner}/${config.repo}/pulls`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: `Add topic: ${submission.topic.title}`,
          head: branch,
          base: baseBranch,
          body: [
            "## Topic submission",
            "",
            `This PR was created from the AI Soc Corpus admin submission form for \`${submission.topicPath}\`.`,
            "",
            "## Submitted metadata",
            "",
            `- Authors: ${submission.topic.authors.map((author) => `@${author}`).join(", ")}`,
            `- Difficulty: ${submission.topic.difficulty}`,
            `- Category: ${submission.topic.category}`,
            `- Images: ${submission.images.length}`,
            "",
            "Review this topic using the standard corpus contribution checklist before merging.",
          ].join("\n"),
          maintainer_can_modify: true,
        }),
      },
    ),
  );

  return {
    branch,
    pullRequestUrl: pullRequest.html_url,
    pullRequestNumber: pullRequest.number,
  };
}
