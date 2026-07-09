#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const COMMENT_MARKER = "<!-- aisoc-topic-auto-review -->";

export const SUPPORTED_AGENTS = [
  "codex",
  "claude-code",
  "kiro-cli",
  "antigravity",
];

const AGENT_SPECIFIC_ENV = {
  codex: "AUTO_REVIEWER_CODEX_CMD",
  "claude-code": "AUTO_REVIEWER_CLAUDE_CODE_CMD",
  "kiro-cli": "AUTO_REVIEWER_KIRO_CLI_CMD",
  antigravity: "AUTO_REVIEWER_ANTIGRAVITY_CMD",
};

const DEFAULT_AGENT_COMMANDS = {
  codex: "codex exec < {prompt_file}",
  "claude-code": 'claude -p "$(cat {prompt_file})"',
  "kiro-cli": "kiro --prompt-file {prompt_file}",
  antigravity: "antigravity run --prompt-file {prompt_file}",
};

const AGENT_ALIASES = {
  codex: "codex",
  claude: "claude-code",
  "claude code": "claude-code",
  "claude-code": "claude-code",
  claudecode: "claude-code",
  kiro: "kiro-cli",
  "kiro-cli": "kiro-cli",
  antigravity: "antigravity",
};

const TOPIC_PREFIX = "src/content/topics/";

function repoRootFromScript() {
  const scriptPath = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(scriptPath), "..");
}

export function isTopicMarkdownPath(filePath) {
  return filePath.startsWith(TOPIC_PREFIX) && filePath.endsWith(".md");
}

export function normalizePrFiles(files = []) {
  return files
    .map((file) => {
      if (typeof file === "string") {
        return { path: file, status: "unknown" };
      }
      return {
        path: file.path || file.filename || file.name,
        status: (file.status || file.changeType || "unknown").toLowerCase(),
        additions: file.additions,
        deletions: file.deletions,
      };
    })
    .filter((file) => file.path);
}

export function selectReviewableTopicFiles(files = []) {
  return normalizePrFiles(files).filter((file) => {
    if (!isTopicMarkdownPath(file.path)) {
      return false;
    }
    return !["removed", "deleted"].includes(file.status);
  });
}

export function shellEscape(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

export function normalizeAgentName(agent) {
  return (
    AGENT_ALIASES[
      String(agent || "")
        .trim()
        .toLowerCase()
    ] || agent
  );
}

export function resolveAgentCommandTemplate(agent, env = process.env) {
  agent = normalizeAgentName(agent);
  if (!SUPPORTED_AGENTS.includes(agent)) {
    throw new Error(
      `Unsupported agent '${agent}'. Choose one of: ${SUPPORTED_AGENTS.join(", ")}`,
    );
  }

  return (
    env.AUTO_REVIEWER_AGENT_CMD ||
    env[AGENT_SPECIFIC_ENV[agent]] ||
    DEFAULT_AGENT_COMMANDS[agent]
  );
}

export function renderAgentCommand(template, promptFile) {
  const escapedPromptFile = shellEscape(promptFile);
  if (template.includes("{prompt_file}")) {
    return template.replaceAll("{prompt_file}", escapedPromptFile);
  }
  return `${template} < ${escapedPromptFile}`;
}

export function buildReviewPacket({
  promptText,
  contributingText,
  pr,
  topicFiles,
  agent,
}) {
  const topicSections = topicFiles
    .map(
      (file) => `### ${file.path}

Status: ${file.status || "unknown"}

\`\`\`md
${file.content || ""}
\`\`\``,
    )
    .join("\n\n");

  return `# Local Topic PR Review Packet

${promptText.trim()}

---

## Repository Contribution Standard

\`\`\`md
${contributingText.trim()}
\`\`\`

---

## Pull Request Metadata

- Number: ${pr.number}
- Title: ${pr.title}
- Author: ${pr.author?.login || pr.author?.name || "unknown"}
- URL: ${pr.url || "unknown"}
- Base branch: ${pr.baseRefName || "unknown"}
- Head branch: ${pr.headRefName || "unknown"}
- Selected local agent: ${agent}

### PR Body

\`\`\`md
${pr.body || ""}
\`\`\`

---

## Changed Topic Files

${topicSections || "No reviewable topic markdown files were found."}
`;
}

export function formatReviewComment({
  agent,
  agentOutput,
  prNumber,
  topicFileCount,
}) {
  const output = String(agentOutput || "").trim();
  if (!output) {
    throw new Error("Agent returned an empty review.");
  }

  return `${COMMENT_MARKER}

${output}

---

_Generated locally with \`${agent}\` for PR #${prNumber}. Reviewed ${topicFileCount} topic file(s). This is advisory; a human maintainer still owns the final review._`;
}

function usage() {
  return `Usage: ./scripts/review-topic-pr.sh <pr-number> [options]

Options:
  --agent <name>       codex | claude-code | kiro-cli | antigravity
  --dry-run            Build the packet and run the agent, but do not comment
  --prompt-only        Print the review packet without running an agent
  --no-comment         Run the agent and print the comment without posting it
  --prompt-out <path>  Write the review packet to a file
  --body-out <path>    Write the final PR comment body to a file
  --help               Show this help

Environment:
  AUTO_REVIEWER_AGENT      Default agent name
  AUTO_REVIEWER_AGENT_CMD  Shell command template. Use {prompt_file}.
`;
}

export function parseArgs(argv) {
  const options = {
    agent: process.env.AUTO_REVIEWER_AGENT || "codex",
    dryRun: false,
    promptOnly: false,
    comment: true,
    promptOut: null,
    bodyOut: null,
  };
  const positional = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
      options.comment = false;
    } else if (arg === "--prompt-only") {
      options.promptOnly = true;
      options.comment = false;
    } else if (arg === "--no-comment") {
      options.comment = false;
    } else if (arg === "--agent") {
      options.agent = argv[++i];
    } else if (arg === "--prompt-out") {
      options.promptOut = argv[++i];
    } else if (arg === "--body-out") {
      options.bodyOut = argv[++i];
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  options.prNumber = positional[0];
  options.agent = normalizeAgentName(options.agent);
  if (!options.help && !options.prNumber) {
    throw new Error("Missing PR number.");
  }
  if (!SUPPORTED_AGENTS.includes(options.agent)) {
    throw new Error(
      `Unsupported agent '${options.agent}'. Choose one of: ${SUPPORTED_AGENTS.join(", ")}`,
    );
  }

  return options;
}

function run(command, args, { cwd, input, allowFailure = false } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    input,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });

  if (result.status !== 0 && !allowFailure) {
    const stderr = result.stderr?.trim();
    throw new Error(
      `${command} ${args.join(" ")} failed${stderr ? `:\n${stderr}` : "."}`,
    );
  }

  return result.stdout || "";
}

function runShell(command, { cwd } = {}) {
  const result = spawnSync(command, {
    cwd,
    shell: true,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    throw new Error(`Agent command failed${stderr ? `:\n${stderr}` : "."}`);
  }

  return result.stdout || "";
}

function ghJson(args, cwd) {
  return JSON.parse(run("gh", args, { cwd }));
}

function encodeContentPath(filePath) {
  return filePath.split("/").map(encodeURIComponent).join("/");
}

async function loadPrData(prNumber, cwd) {
  return ghJson(
    [
      "pr",
      "view",
      prNumber,
      "--json",
      "number,title,body,author,url,headRefOid,baseRefName,headRefName,files",
    ],
    cwd,
  );
}

async function loadFileContent(filePath, ref, cwd) {
  return run(
    "gh",
    [
      "api",
      "-H",
      "Accept: application/vnd.github.raw",
      `repos/:owner/:repo/contents/${encodeContentPath(filePath)}?ref=${ref}`,
    ],
    { cwd },
  );
}

async function loadTopicFiles(pr, cwd) {
  const reviewableFiles = selectReviewableTopicFiles(pr.files || []);
  const topicFiles = [];
  const prHeadRef = pr.number ? `refs/pull/${pr.number}/head` : pr.headRefOid;

  for (const file of reviewableFiles) {
    const content = await loadFileContent(file.path, prHeadRef, cwd);
    topicFiles.push({ ...file, content });
  }

  return topicFiles;
}

function writeJsonTemp(body) {
  const dir = mkdtempSync(path.join(tmpdir(), "aisoc-review-comment-"));
  const file = path.join(dir, "body.json");
  writeFileSync(file, JSON.stringify({ body }), "utf8");
  return { dir, file };
}

async function postOrUpdateComment({ prNumber, body, cwd }) {
  const comments = ghJson(
    ["api", `repos/:owner/:repo/issues/${prNumber}/comments`, "--paginate"],
    cwd,
  );
  const existing = comments.find((comment) =>
    String(comment.body || "").includes(COMMENT_MARKER),
  );
  const { dir, file } = writeJsonTemp(body);

  try {
    if (existing) {
      run(
        "gh",
        [
          "api",
          "--method",
          "PATCH",
          `repos/:owner/:repo/issues/comments/${existing.id}`,
          "--input",
          file,
        ],
        { cwd },
      );
      return "updated";
    }

    run(
      "gh",
      [
        "api",
        "--method",
        "POST",
        `repos/:owner/:repo/issues/${prNumber}/comments`,
        "--input",
        file,
      ],
      { cwd },
    );
    return "created";
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function main() {
  const cwd = repoRootFromScript();
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    process.stdout.write(usage());
    return;
  }

  const pr = await loadPrData(options.prNumber, cwd);
  const topicFiles = await loadTopicFiles(pr, cwd);

  if (topicFiles.length === 0) {
    throw new Error(
      "No new or modified topic markdown files found in this PR.",
    );
  }

  const promptText = readFileSync(
    path.join(cwd, "scripts/topic-review-prompt.md"),
    "utf8",
  );
  const contributingText = readFileSync(
    path.join(cwd, "CONTRIBUTING.md"),
    "utf8",
  );
  const packet = buildReviewPacket({
    promptText,
    contributingText,
    pr,
    topicFiles,
    agent: options.agent,
  });

  if (options.promptOut) {
    writeFileSync(path.resolve(cwd, options.promptOut), packet, "utf8");
  }

  if (options.promptOnly) {
    process.stdout.write(packet);
    return;
  }

  const tempDir = mkdtempSync(path.join(tmpdir(), "aisoc-topic-review-"));
  const promptFile = path.join(tempDir, "prompt.md");

  try {
    writeFileSync(promptFile, packet, "utf8");
    const template = resolveAgentCommandTemplate(options.agent);
    const command = renderAgentCommand(template, promptFile);
    const agentOutput = runShell(command, { cwd });
    const commentBody = formatReviewComment({
      agent: options.agent,
      agentOutput,
      prNumber: pr.number || options.prNumber,
      topicFileCount: topicFiles.length,
    });

    if (options.bodyOut) {
      writeFileSync(path.resolve(cwd, options.bodyOut), commentBody, "utf8");
    }

    if (!options.comment) {
      process.stdout.write(`${commentBody}\n`);
      return;
    }

    const result = await postOrUpdateComment({
      prNumber: options.prNumber,
      body: commentBody,
      cwd,
    });
    process.stdout.write(`Automated topic review comment ${result}.\n`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  });
}
