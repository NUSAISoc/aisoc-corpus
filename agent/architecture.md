# Architecture

## Bounded Contexts

| Context | Owns | Does Not Own | Public Entry Point |
| --- | --- | --- | --- |
| **Content Collection** | Markdown/MDX topic files, frontmatter schemas (Zod validation), Remark/Rehype plugins, KaTeX equations, link resolution. | Graph rendering, UI templates, style sheets. | `src/content/config.ts` |
| **Graph Visualization Engine** | Relationship calculation (prerequisites, Jaccard kNN similarity), precomputed graph JSON, React interactive D3 force-directed SVG graph. | Markdown formatting, KaTeX equations, page layouts. | `src/components/KnowledgeGraph.tsx` |
| **Navigation & Reader Shell** | Global layout, brand theme, navigation menus, sidebar, single-page routing, backlinks index, HoverPreviews. | Content validation, similarity algorithms. | `src/layouts/ReaderLayout.astro` |
| **Verification & CI** | Pull Request checks, LaTeX compile syntax checkers, link and citation validators, reviewer checklists, local automated topic PR review. | Runtime pages, styles. | `scripts/validate-content.sh`, `scripts/review-topic-pr.sh` |

## Boundary Rules

1. A context may import only another context's public entry point.
2. Internal files of another context are forbidden imports.
3. External APIs, SDKs, and persistence details must be accessed through adapters (e.g., custom D3 adapters for React state).
4. Domain logic (like the similarity algorithm or prerequisite resolver) must not depend directly on HTTP objects, UI state, or vendor client types.

## Public Interface Rule

Each context exposes one explicit public entry point:

- Content Collections: `src/content/config.ts`
- Graph Engine: `src/components/KnowledgeGraph.tsx`
- Navigation/Reader UI: `src/layouts/ReaderLayout.astro`
- Verification Script: `scripts/validate-pr.sh`

## Forbidden Import Policy

Record concrete forbidden import patterns here once contexts exist:

- `src/components/KnowledgeGraph.tsx -> src/content/topics/*.md` (Components must not directly import raw markdown files; they must read from precalculated static JSON or content collection API).
- `src/content/topics/*.md -> src/components/**` (Markdown content must not import UI layout components directly; MDX components are allowed only if explicitly registered in the layout).

Keep this list small and high-signal. Add rules only after repeated boundary mistakes.
