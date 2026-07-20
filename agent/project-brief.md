# Project Brief

## Product Goal

Build the **AI Soc Corpus** website for **NUS AI Society members and beginners** so they can **attain high proficiency in modern AI/ML concepts through a highly navigable, beautifully styled, and interconnected knowledge base with shared foundations**.

## Primary Workflows

1. **Interconnected Knowledge Graph Exploration**: Users browse and visual-navigate the corpus using an interactive, Obsidian-style relation graph, seeing how topics connect semantically and structurally (prerequisites).
2. **Seamless Single-Page Reading & Navigation**: Users study specific topics on a single-page layout featuring LaTeX equations, code syntax highlighting, hover-previews of linked concepts, inline source links, and Further Reading.
3. **CCA Contribution & PR Workflows**: CCA members contribute material easily via pull requests guided by a comprehensive contribution/reviewer standard, with CI automation verifying LaTeX, source links, Further Reading, and internal links.

## Non-Goals

- Creating a web-based CMS or online editor for direct non-git content updates (all additions are Git-based PRs).
- Hosting heavy video assets natively (embed external links instead).
- Writing the actual ML teaching content itself (this brief is to build the framework and structure for the corpus).

## External Systems

| System              | Why it exists                                                                     | Interface owner                                           | Failure fallback                                            |
| ------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| Cloudflare Pages    | Free hosting and automated preview builds for Astro/React.                        | Deployment adapter / GitHub integration.                  | Manual build output to public domain.                       |
| GitHub CI (Actions) | Runs automated verification checks (LaTeX, links, Further Reading checks) on PRs. | GitHub workflows configuration.                           | Local pre-commit / pre-push check scripts run by reviewers. |
| aisoc-website repo  | Source of truth for brand typography, colors, and layout components.              | Styling adapter / copied global CSS and React components. | Fallback style guide defined manually.                      |

## Definition Of Done

A feature is complete only when it has all of the following:

1. A small design artifact update (`design-tree.md` and/or ADR) when design changes.
2. Clear boundary types/interfaces between the Astro page routing, content collection schema, and graph visualization component.
3. Automated unit/behavior checks verifying content parsers (Remark/Rehype plugins) and frontmatter validation.
4. Deterministic checks run (`./scripts/check.sh` and browser-level UI validation).
5. Accurate source links, Further Reading, and LaTeX compilation without visual defects.
