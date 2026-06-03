# AI Soc Corpus

[![Verify PR](https://github.com/NUSAISoc/aisoc-corpus/actions/workflows/verify-pr.yml/badge.svg)](https://github.com/NUSAISoc/aisoc-corpus/actions/workflows/verify-pr.yml)
[![Deterministic Checks](https://github.com/NUSAISoc/aisoc-corpus/actions/workflows/deterministic-checks.yml/badge.svg)](https://github.com/NUSAISoc/aisoc-corpus/actions/workflows/deterministic-checks.yml)
[![License: CC BY-SA 4.0](https://img.shields.io/badge/License-CC%20BY--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)
[![Astro](https://img.shields.io/badge/Astro-5.2-ff5d01.svg?logo=astro&logoColor=white)](https://astro.build)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg?logo=react&logoColor=black)](https://react.dev)
[![D3.js](https://img.shields.io/badge/D3.js-3.0-f9a03f.svg?logo=d3.js&logoColor=white)](https://d3js.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

An interactive knowledge corpus for the NUS AI Society.

## Overview

AI Soc Corpus is a static website that presents AI/ML topics as an interconnected knowledge graph. Each topic is a Markdown file with structured frontmatter. These are connected with:

- **Prerequisite edges** (directed, from frontmatter declarations)
- **Similarity edges** (undirected, via Jaccard index over shared tags/domains)
- **Backlinks** (which topics reference each other via WikiLinks)

The result is a navigable, explorable network of concepts rendered as an interactive force-directed graph.

## Project Structure

```
src/
  content/topics/     # Markdown topic files (the knowledge base)
  components/         # React components (KnowledgeGraph, HoverPreview)
  layouts/            # Astro layouts (BaseLayout, ReaderLayout)
  pages/              # Route pages (index, categories, topics)
  lib/                # Utilities (jaccard, backlinks, wikilink plugin)
  styles/             # Global CSS with brand variables
scripts/
  generate-graph.mjs  # Build-time graph data generation
  validate-content.sh # Content validation (frontmatter, links, LaTeX)
tests/                # E2E tests (Playwright)
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed instructions on adding topics, writing LaTeX, and the reviewer checklist.

### TL;DR

1. Add a `.md` file to `src/content/topics/` with valid frontmatter.
2. Use `[[WikiLinks]]` to connect to other topics.
3. Run `./scripts/validate-content.sh` locally.
4. Open a pull request. CI runs automatically.

## Commands

| Command                           | Description                           |
| --------------------------------- | ------------------------------------- |
| `npm run dev`                   | Start development server              |
| `npm run build`                 | Generate graph + build for production |
| `npm run preview`               | Preview production build              |
| `npm test`                      | Run unit tests (Vitest)               |
| `npm run test:e2e`              | Run E2E tests (Playwright)            |
| `./scripts/validate-content.sh` | Validate content files                |
| `./scripts/check.sh`            | Run all deterministic checks          |

### Environment Configuration

| Variable      | Value             |
| ------------- | ----------------- |
| Build command | `npm run build` |
| Build output  | `dist`          |
| Node version  | `20`            |

## Tech Stack

- **Framework**: [Astro](https://astro.build) (static site generation)
- **Interactive components**: React 19
- **Graph visualization**: D3-force (SVG)
- **Math rendering**: KaTeX (via remark-math + rehype-katex)
- **Content**: Astro Content Collections with Zod validation
- **Testing**: Vitest (unit) + Playwright (E2E)

## License

This project is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](file:///home/prane/coding/aisoc-corpus/LICENSE) license.

_Built by Praneeth-Suresh for NUS AI Society._
