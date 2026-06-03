# AI Soc Corpus

An interactive knowledge graph and educational corpus for the NUS AI Society. Built with Astro, React, and D3.

## Overview

AI Soc Corpus is a static website that presents AI/ML topics as an interconnected knowledge graph. Each topic is a Markdown file with structured frontmatter; at build time, the system computes:

- **Prerequisite edges** (directed, from frontmatter declarations)
- **Similarity edges** (undirected, via Jaccard index over shared tags/domains)
- **Backlinks** (which topics reference each other via WikiLinks)

The result is a navigable, explorable network of concepts rendered as an interactive force-directed graph.

## Quick Start

```bash
npm install
npm run build    # Generates graph data + builds static site
npm run dev      # Start dev server with hot reload
npm run preview  # Preview production build
```

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

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Generate graph + build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `./scripts/validate-content.sh` | Validate content files |
| `./scripts/check.sh` | Run all deterministic checks |

## Hosting

The site is deployed to **Cloudflare Pages**.

### Manual Deployment

```bash
npm run build
npx wrangler pages deploy dist --project-name aisoc-corpus
```

### Automated Deployment

Cloudflare Pages is connected to the GitHub repository. On push to `main`:

1. Cloudflare triggers a build using `npm run build`.
2. The `dist/` directory is deployed to `aisoc-corpus.pages.dev`.
3. Preview deployments are created for every pull request.

### Environment Configuration

| Variable | Value |
|----------|-------|
| Build command | `npm run build` |
| Build output | `dist` |
| Node version | `20` |

## Tech Stack

- **Framework**: [Astro](https://astro.build) (static site generation)
- **Interactive components**: React 19
- **Graph visualization**: D3-force (SVG)
- **Math rendering**: KaTeX (via remark-math + rehype-katex)
- **Content**: Astro Content Collections with Zod validation
- **Testing**: Vitest (unit) + Playwright (E2E)

## License

MIT

_Built by Praneeth-Suresh for NUS AI Society._