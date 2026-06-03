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

Add a new Markdown file at `src/content/topics/<your-slug>.md` with the required frontmatter:

```yaml
---
title: Your Topic Title
description: A one-sentence summary of the concept.
difficulty: beginner  # beginner | intermediate | advanced
category: classical-ml  # classical-ml | deep-learning | generative | reinforcement-learning | world-modelling
domains: ["supervised-learning", "regression"] # these are just examples
tags: ["relevant", "tags", "here"]
prerequisites: ["slug-of-prerequisite"]  # optional
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

### 4. LaTeX Guidelines

```markdown
Inline: The loss function $\mathcal{L}(\theta)$ measures error.

Display:
$$\nabla_\theta \mathcal{L} = \frac{1}{n}\sum_{i=1}^n \nabla_\theta \ell(f_\theta(x_i), y_i)$$
```

### 5. Local Validation

Before submitting your PR, run the following and ensure they work:

```bash
./scripts/validate-content.sh   # Schema + links + LaTeX
npm run build                    # Full site build
npm test                         # Unit tests
```

### 6. Submit a Pull Request

Go ahead and create a PR to get your work merged into the Corpus:

- One topic per PR (unless they are tightly coupled).
- Fill in the PR template with a summary and self-review checklist.

## Reviewer Checklist

Reviewers should verify:

- [ ] Frontmatter is complete and valid.
- [ ] Content is technically accurate and well-explained.
- [ ] LaTeX renders correctly (check the preview deploy).
- [ ] WikiLinks point to existing topics or are flagged as planned.
- [ ] Citations include at least one primary academic source.
- [ ] Writing is clear, concise, and free of AI-generated slop.
- [ ] Difficulty level is appropriate for the content depth.

## Editor Setup

We know that not everyone swears by markdown. But, its the standard we use so here are some tools you can use to get started with Markdown editing:

### VS Code + Foam

Install the [Foam](https://foambubble.github.io/foam/) extension for WikiLink autocomplete and graph preview.

### Obsidian

Open `src/content/topics/` as an Obsidian vault. WikiLinks will resolve naturally.

## Questions?

Open a discussion on GitHub or reach out on Telegram.
