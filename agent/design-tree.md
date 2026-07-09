# Design Tree

## Current Design Concept

An interconnected learning ecosystem that leverages Astro's performance for content reading and React's interactivity for an Obsidian-style **KnowledgeGraph**. Content is authored in standard Markdown/MDX with frontmatter defining metadata (difficulty, domains, prerequisites, tags, author). At build time, Astro compiles these topics into a static single-page-routing structure, resolves relationships (hierarchical and semantic similarity), generates a precomputed graph JSON, renders a force-directed interactive node visualization with a category colour legend backed by shared category presentation metadata, exposes matching colour-coded category navigation on discovery pages, and serializes a topic search index for fast metadata filtering on the topics page.

## Open Decisions

| Decision | Options | Current Lean | Why |
| --- | --- | --- | --- |
| Dynamic Relation Engine | A) Pre-defined Hierarchy<br>B) Build-time Jaccard Tag Similarity<br>C) Vector embeddings (kNN) | B) Jaccard Similarity (shared tags & domains) + Directed Prerequisite Edges | Highly scalable, fully automated, operates entirely at build time, and perfectly captures ML relationships without heavy runtime overhead. |
| Graph Visualization Tool | A) Custom SVG + D3-force React<br>B) `react-force-graph` canvas<br>C) Vis.js / Sigma.js | A) Custom SVG + D3-force React | Lightweight, highly styleable using standard Tailwind/CSS matching main site, responsive, and easy to keep performant. |
| Wiki-Link Syntax Parser | A) `remark-wiki-link` package<br>B) Custom RegExp Remark/Rehype plugin | B) Custom RegExp Remark/Rehype plugin | Allows direct mapping to Astro content collection paths and automatic generation of HoverPreview metadata and Backlinks list. |

## Settled Decisions

| Decision | Choice | Date | ADR |
| --- | --- | --- | --- |
| Core Framework | Astro + React | 2026-06-02 | [ADR 0002](file:///home/prane/coding/aisoc-corpus/agent/adr/0002-ai-soc-corpus-plan.md) |
| Hosting Platform | Cloudflare Pages | 2026-06-02 | [ADR 0002](file:///home/prane/coding/aisoc-corpus/agent/adr/0002-ai-soc-corpus-plan.md) |
| Styling Source | Direct extraction from cloned `NUSAISoc/aisoc-website` | 2026-06-02 | [ADR 0002](file:///home/prane/coding/aisoc-corpus/agent/adr/0002-ai-soc-corpus-plan.md) |
| PR Verification CI | GitHub Actions running custom markdown lint, LaTeX compile validation, and link-check | 2026-06-02 | [ADR 0002](file:///home/prane/coding/aisoc-corpus/agent/adr/0002-ai-soc-corpus-plan.md) |
| Local Topic PR Auto-Review | Maintainer-run GitHub CLI workflow invokes a selected local coding agent and posts an advisory sticky PR comment | 2026-06-24 | — |
| Sharp Corners      | All `border-radius` must be `0`. No rounded edges anywhere on the site.               | 2026-06-04 | —                                                                                       |

## Pressure Points

- **LaTeX & Code rendering**: Ensuring KaTeX parses LaTeX equations flawlessly in MDX files at build time without breaking the layout or causing Cumulative Layout Shift.
- **Graph Responsiveness**: Displaying a complex multi-node force-directed graph beautifully and interactively on mobile screens without lagging.
- **Website Style Integrity**: Accurately copying fonts (like 'Outfit' / 'Inter') and the dark-mode color schema from the main site.

## Recording Rule (Design Tree vs ADR)

Add or update this file when:

- A decision is still evolving.
- You are comparing options before implementation.
- The choice may still change after one or two implementation iterations.

Create an ADR when:

- The decision changes module boundaries, persistence shape, adapter contracts, security model, naming conventions used across contexts, or test strategy.
- Future contributors are likely to revisit the choice without clear repo history.
