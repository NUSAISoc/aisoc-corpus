# AutoReviwer

This repository includes a laptop-controlled workflow for producing automated
topic PR feedback. It does not run in GitHub Actions. You run it locally, choose
the coding agent, inspect the output if desired, and let the script post or
update a PR comment through the GitHub CLI.

## What The Workflow Does

Given a pull request number, the script:

1. reads PR metadata with `gh pr view`;
2. finds new or modified `src/content/topics/**/*.md` files;
3. fetches those topic files from the PR head commit through `gh api`;
4. builds a review packet using `scripts/topic-review-prompt.md` and
   `CONTRIBUTING.md`;
5. calls your chosen local coding agent;
6. posts or updates one marked PR comment with the generated feedback.

The automated review is advisory. Human maintainers still own technical review,
approval, and merge decisions.

## Prerequisites

Install and authenticate the GitHub CLI:

```bash
gh auth login
gh auth status
```

Install at least one supported coding agent locally:

- `codex`
- `claude-code`
- `kiro-cli`
- `antigravity`

The script accepts these agent names:

```bash
codex
claude-code
kiro-cli
antigravity
```

It also accepts the friendly aliases `claude code`, `claude`, and `kiro`.

## Recommended Setup

Choose an agent by setting `AUTO_REVIEWER_AGENT`:

```bash
export AUTO_REVIEWER_AGENT=codex
```

If your agent command differs from the defaults, set
`AUTO_REVIEWER_AGENT_CMD`. Use `{prompt_file}` where the generated review packet
path should be inserted.

```bash
export AUTO_REVIEWER_AGENT_CMD='codex exec < {prompt_file}'
```

Agent-specific command overrides are also supported:

```bash
export AUTO_REVIEWER_CODEX_CMD='codex exec < {prompt_file}'
export AUTO_REVIEWER_CLAUDE_CODE_CMD='claude -p "$(cat {prompt_file})"'
export AUTO_REVIEWER_KIRO_CLI_CMD='kiro --prompt-file {prompt_file}'
export AUTO_REVIEWER_ANTIGRAVITY_CMD='antigravity run --prompt-file {prompt_file}'
```

`AUTO_REVIEWER_AGENT_CMD` takes precedence over the agent-specific variables.

## Usage

From the repository root, run:

```bash
./scripts/review-topic-pr.sh 123 --agent codex
```

Replace `123` with the pull request number.

To preview the exact packet that will be sent to the coding agent:

```bash
./scripts/review-topic-pr.sh 123 --agent codex --prompt-only
```

To run the agent but avoid posting a GitHub comment:

```bash
./scripts/review-topic-pr.sh 123 --agent claude-code --no-comment
```

To write the prompt packet and final comment body to files:

```bash
./scripts/review-topic-pr.sh 123 \
  --agent kiro-cli \
  --no-comment \
  --prompt-out tmp-review-prompt.md \
  --body-out tmp-review-comment.md
```

To post the comment after reviewing the local output:

```bash
./scripts/review-topic-pr.sh 123 --agent kiro-cli
```

The script updates its previous automated review comment when it finds one. It
uses this marker internally:

```md
<!-- aisoc-topic-auto-review -->
```

## Agent Choices

### Codex

```bash
./scripts/review-topic-pr.sh 123 --agent codex
```

Override the command if your local Codex CLI uses a different invocation:

```bash
export AUTO_REVIEWER_CODEX_CMD='codex exec < {prompt_file}'
```

### Claude Code

```bash
./scripts/review-topic-pr.sh 123 --agent claude-code
```

Example override:

```bash
export AUTO_REVIEWER_CLAUDE_CODE_CMD='claude -p "$(cat {prompt_file})"'
```

### Kiro CLI

```bash
./scripts/review-topic-pr.sh 123 --agent kiro-cli
```

Example override:

```bash
export AUTO_REVIEWER_KIRO_CLI_CMD='kiro --prompt-file {prompt_file}'
```

### Antigravity

```bash
./scripts/review-topic-pr.sh 123 --agent antigravity
```

Example override:

```bash
export AUTO_REVIEWER_ANTIGRAVITY_CMD='antigravity run --prompt-file {prompt_file}'
```

## Safety Notes

The script does not check out the PR branch by default and does not execute PR
code. It treats PR title, body, and topic markdown as untrusted review input.

The local agent command runs on your laptop, so inspect your command template
before use. The prompt is passed through a temporary file path, not interpolated
directly into the shell command.

## Troubleshooting

If no topic files are found, confirm the PR adds or modifies files under:

```text
src/content/topics/**/*.md
```

If GitHub posting fails, check:

```bash
gh auth status
gh pr view 123
```

If the agent command fails, run with `--prompt-only`, then test your
`AUTO_REVIEWER_AGENT_CMD` manually against the generated prompt file.
