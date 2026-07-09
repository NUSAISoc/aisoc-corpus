# Contributing to AI Soc Corpus

> "Knowledge, like air, is vital to life. And like air, no one should be denied it."
> — Alan Moore

We welcome contributions from all NUS AI Society members. Every topic you add strengthens the graph and helps future learners find their path.

## How to Contribute

All contributions are made via **Git pull requests**. There is no web editor — this ensures academic quality through peer review.

### 1. Fork & Clone

Fork the repo first! Here's how you can do that: [Fork a repository](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo).

```bash
git clone https://github.com/YOUR-USERNAME/aisoc-corpus.git
cd aisoc-corpus
npm install
```

### 2. Create a Topic

Add a new Markdown file at `src/content/topics/<category>/<your-slug>.md`. Place it in the subfolder matching your topic's `category` field:

```
src/content/topics/
  classical-ml/
  deep-learning/
  generative/
  reinforcement-learning/
  world-modelling/
```

#### Understanding Key Frontmatter Fields:

- **What is a Slug?**
  A **slug** is the URL-friendly identifier for a topic. It is used as the filename (e.g. `<slug>.md`) and must be **strictly lowercase**, with spaces replaced by hyphens (`-`), and containing only alphanumeric characters and hyphens.
  - _Example_: For "Gradient Descent", the file must be named `gradient-descent.md` and the slug is `gradient-descent`. For "Q-Learning", it is `q-learning.md`.
- **Domains**:
  Broad branches of machine learning or mathematics that the topic falls under.
  - _Examples_: `["supervised-learning", "unsupervised-learning", "optimization", "deep-learning", "computer-vision", "nlp", "rl", "statistics", "calculus", "linear-algebra"]`.
  - _Limits_: All domain list items must be entirely **lowercase**, contain **no spaces** (use hyphens `-` instead), and contain no punctuation.

```yaml
---
title: Your Topic Title
description: A one-sentence summary of the concept.
difficulty: beginner # beginner | intermediate | advanced
category: classical-ml # classical-ml | deep-learning | generative | reinforcement-learning | world-modelling
domains: ["supervised-learning", "regression"]
tags: ["relevant", "tags", "here"]
prerequisites: ["slug-of-prerequisite"] # optional, must match target topic file's slug
citations:
  - title: "Paper or Book Title"
    url: "https://example.com"
---
Your content here...
```

### 3. Writing Content

- Use standard Markdown with LaTeX via `$inline$` and `$$display$$` syntax.
- Link to other topics using WikiLink syntax: `[[Topic Name]]` or `[[slug|Custom Label]]`.
- Keep explanations concise and technically accurate.
- Include at least one citation to a primary source!

#### Article Length & Subpages

Keep each article **short and focused**. If you want to go into detail on a subtopic, create a subpage rather than expanding the parent article. This keeps the knowledge graph navigable and encourages readers to explore related nodes rather than scrolling through a single long page.

### 4. LaTeX Guidelines

The corpus compiles math equations server-side during the build using **KaTeX** (via the `remark-math` and `rehype-katex` plugins). While writing LaTeX, follow these strict rules to avoid compilation failures or layout shifts:

- **Inline Math**:
  - Enclose math in single dollar signs: `$...$`.
  - **Crucial Rule**: Do NOT leave spaces directly inside the dollar signs. For example, write `$\mathcal{L}(\theta)$` (correct) instead of `$ \mathcal{L}(\theta) $` (incorrect). Spaces can prevent the Markdown parser from identifying it as inline math.
- **Display Math (Block Level)**:
  - Enclose block equations in double dollar signs: `$$...$$`.
  - **Crucial Rule**: The starting `$$` and ending `$$` fences **must be on their own separate lines**. Do not put equations or text on the same line as the fences.
  - _Correct Example_:
    ```markdown
    $$
    \nabla_\theta \mathcal{L} = \frac{1}{n}\sum_{i=1}^n \nabla_\theta \ell(f_\theta(x_i), y_i)
    $$
    ```
- **Special Characters**:
  - To avoid breaking compilation, do not use raw HTML angle brackets (`<` or `>`) inside equations. Use KaTeX commands like `\lt` (less than) and `\gt` (greater than) instead.

Let's see them in action:

```markdown
Inline math works like this: The loss function $\mathcal{L}(\theta)$ measures error.

Display math works like this:

$$
\nabla_\theta \mathcal{L} = \frac{1}{n}\sum_{i=1}^n \nabla_\theta \ell(f_\theta(x_i), y_i)
$$
```

### 5. Local Validation

Before submitting your PR, run the following and ensure they work:

```bash
./scripts/validate-content.sh   # Schema + links + LaTeX
npm run build                    # Full site build
npm test                         # Unit tests
```

#### Automated Validation with an AI Agent

If you have access to an AI coding agent (e.g. Codex, Cursor, Claude Code), you can paste the following prompt to have it thoroughly verify your changes are deployment-ready:

> **Agent Prompt:**
>
> ```
> I've made changes to topic files in this repository. Please verify that everything is ready to deploy:
>
> 1. Run `./scripts/validate-content.sh` and fix any errors.
> 2. Run `npm run build` and ensure there are no build failures.
> 3. Run `npm test` and confirm all unit tests pass.
> 4. Run `npm run preview` and use a browser tool to visit the site.
> 5. Navigate to each page affected by my changes and verify:
>    - The page renders without layout issues.
>    - All LaTeX equations display correctly (no raw syntax or KaTeX errors).
>    - All WikiLinks resolve to valid pages (no broken links).
>    - The Table of Contents sidebar generates correctly from headings.
>    - The knowledge graph still loads and displays nodes/edges properly.
> 6. Check that no unrelated pages are broken by my changes.
> 7. Report a summary of what passed, what failed, and what needs fixing.
> ```

This saves time and catches rendering or formatting issues that the scripts alone won't detect.

### 6. Submit a Pull Request

Go ahead and create a PR to get your work merged into the Corpus:

- One topic per PR (unless they are tightly coupled).
- The PR template auto-populates — fill in every section.
- Complete the self-review checklist before requesting review.

## Merge Workflow

Every PR follows this exact sequence:

```
1. Contributor opens PR  →  template auto-fills, contributor completes it
2. Reviewer reviews      →  approves OR requests changes
3. If changes requested  →  contributor addresses feedback, re-requests review
4. Once approved         →  the PR author (contributor) merges using merge commit
```

**Rules:**

- The **PR author** always merges — never the reviewer.
- Always use **merge commit** (no squash, no rebase).
- Do not merge until all criteria below are met.

## Merge Criteria

All of the following must be true before you click merge:

- [ ] At least 1 approving review from an assigned reviewer.
- [ ] All CI checks pass (Verify PR + Deterministic Checks).
- [ ] No unresolved review conversations.
- [ ] PR follows the template format completely.

## Reviewer Checklist

Reviewers should verify:

- [ ] Frontmatter is complete and valid.
- [ ] Content is technically accurate and well-explained.
- [ ] LaTeX renders correctly (check the preview deploy).
- [ ] WikiLinks point to existing topics or are flagged as planned.
- [ ] Citations include at least one primary academic source.
- [ ] Writing is clear, concise, and free of AI-generated slop.
- [ ] Difficulty level is appropriate for the content depth.

## CODEOWNERS

Reviewers are automatically assigned via `.github/CODEOWNERS`. When you need to update reviewer assignments:

1. Edit `.github/CODEOWNERS`.
2. Each line is: `<path-pattern>  @github-username` (or `@org/team-name`).
3. The last matching pattern takes precedence.

Examples:

```
# Default reviewer for everything
*                       @Praneeth-Suresh

# Specific reviewer for topic content
/src/content/topics/    @domain-expert

# Multiple reviewers for workflows
/.github/workflows/     @Praneeth-Suresh @ops-reviewer
```

Update CODEOWNERS when:

- A new maintainer joins and should review specific paths.
- Ownership of a directory transfers to someone else.
- You want a domain expert to auto-review topic files in a specific area.

## Editor Setup

While you can write Markdown in any text editor, using tools that support Obsidian-style wiki-links and live LaTeX preview is highly recommended:

### Obsidian (Recommended)

[Obsidian](https://obsidian.md/) is a powerful, free desktop Markdown editor that naturally understands visual relationships and wiki-links.

1. Download and install Obsidian for your operating system.
2. Launch Obsidian, click **"Open folder as vault"**, and select the `src/content/topics/` folder of this repository.
3. Open Obsidian Settings (gear icon in the bottom left) -> Go to **Files and links**:
   - Turn **ON** the toggle for **Use [[Wikilinks]]**.
   - Change **Default location for new notes** to **Vault folder**.
4. You can now use Obsidian's core graph view, interactive link completion, and live math rendering to write topics.

### VS Code + Foam

If you prefer using VS Code:

1. Open VS Code and open the repository folder.
2. Open the Extensions pane (`Ctrl+Shift+X` or `Cmd+Shift+X`) and install the [Foam](https://marketplace.visualstudio.com/items?itemName=foambubble.foam-vscode) extension.
3. Install a LaTeX rendering helper extension, such as **Markdown+Math** or **Markdown Preview Enhanced**, to preview formulas locally.
4. Foam will provide autocomplete for double-bracket links (`[[Topic Slug]]`) and generate reference maps automatically.

## Layout, Generation, & Pitfalls to Avoid

To ensure your contributions render correctly and do not trigger layout or build-time issues, keep the following in mind:

### Table of Contents (TOC) Generation

- **How it works**: The left sidebar on each topic page is automatically generated by parsing the headings in your Markdown file.
- **Scope**: It scans heading depths 2 (`##`) and 3 (`###`). Main topic headers (`#`) should **never** be manually written in the body, as Astro automatically generates the page title (`h1`) using the frontmatter `title` field.
- **Rendering Pitfalls**:
  - **Do not use HTML heading tags** (e.g., `<h2>Heading</h2>`) in your content. The parser only detects markdown headings.
  - Start your article headings at depth 2 (e.g., `## Introduction`), not depth 1 or 4.
  - Ensure all heading titles are unique within a page so they don't produce duplicate URL anchors.

### WikiLink & Reference Resolution

- **WikiLink Syntax**: Internal references must be written as `[[Topic Slug]]` or `[[Topic Slug | Display Name]]`.
- **Case Sensitivity**: The slug inside the wiki-link (the part before the `|`) must match the lowercase filename slug **exactly**.
- **Backlinks panel**: The right sidebar automatically scans and appends backlinks pointing to the current page. Do not write a manual "Backlinks" header in your content.

### Category Color Mapping

- Nodes in the Knowledge Graph are colored based on their `category` field. If you provide a category not in the pre-defined list (e.g., `classical-ml`, `deep-learning`, `generative`, `reinforcement-learning`, `world-modelling`), the build will fail frontmatter validation.

## Questions?

Open a discussion on GitHub or reach out on Telegram.
