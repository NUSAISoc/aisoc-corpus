# Developer Prompt: Build the NUS AI Society "AI Soc Corpus" Web App

You are tasked with building the **AI Soc Corpus** website, an interactive educational knowledge base for the NUS AI Society (AISoc). This is a static web application built using **Astro** and **React**, styled carefully to match the brand identity of the main website [nusaisociety.org](https://nusaisociety.org/).

Please follow this detailed, step-by-step implementation guide to build the application. A high-fidelity UI/UX mockup is provided in the repository root at `aisoc_corpus_homepage_mockup.png` to guide your design, color palette, and layout implementation.

---

## 🎨 Brand Identity & Design Specifications
- **Colors & Styles**: Deep premium dark mode fully defined in `/src/styles/global.css` using custom CSS variables.
  - Background: `#0a0a0c` (void black).
  - Surfaces: `#121218` / `#161b25` for cards and panels.
  - Text: `#f4f5f7` primary, `#a1a1aa` muted.
  - Accents: Neon Lime-Green `#ccff00` (strict primary accent), Indigo `#6366f1` + Purple `#8b5cf6` (secondary glows).
  - Borders: `rgba(255, 255, 255, 0.08)`.
- **Gradients & Glow**: Custom `--gradient-hero` (radial dark-blue/indigo and `#ccff00` backdrop glows) and `--shadow-glow` (neon `#ccff00` highlights) are declared globally.
- **Typography**: STRICT REQUIREMENT: Imports and uses **Tomorrow** (headings) and **JetBrains Mono** (body text / code / all other elements). Global definitions live in `/src/styles/global.css`.
- **Layout & Interaction Model**:
  - **Homepage**: The visual centerpiece is **exclusively the massive, interactive, force-directed KnowledgeGraph**. There are no cards or side-by-side lists shown by default on the homepage.
  - **Witty Introduction**: Positioned elegantly at the top of the homepage, there is a short, elegant, and witty paragraph explaining what the knowledge graph is and how it maps learning prerequisites and tag similarities.
  - **Category Navigation Buttons**: A prominent row of neon-bordered category buttons sits directly above the knowledge graph, representing mutually exclusive AI categories:
    * **CLASSICAL ML**: Supervised & Unsupervised, SVMs, PCA, Random Forests, etc.
    * **DEEP LEARNING**: Deep Representation Learning, MLPs, CNNs, GNNs, Autoencoders.
    * **GENERATIVE**: Generative Models, VAEs, GANs, Diffusion Models, Flow Models, Attention Mechanisms, Self-Attention, RNNs/LSTMs, Transformers.
    * **REINFORCEMENT LEARNING**: MDPs, Q-Learning, Policy Gradients, Actor-Critic, RLHF.
    * **WORLD MODELLING**: World Models, Model-based RL, MCTS, Active Inference.
    * *Clicking a category navigates to the list of topics organized under that specific category.*
  - **No Front-End Contribution Feature**: To ensure high academic quality, there are no "Create a Card" or edit forms on the front-end. All contributions are backend-only, driven by markdown files in Git pull requests.
  - **Contribution Guide**: There should be a contribution guide page that has a witty quote on why collective knowledge is important. Then it should lead people to the contribution guide on GitHub to get further details.
  - **Footer**: The exact base footer layout from `https://nusaisociety.org/` is used, fully implemented in `/src/components/Footer.astro` and styled in `/src/styles/global.css`.
  - **Reader View**: Double-pane view with Sidebar Outline (left) supporting ScrollSpy outline tracking read progress, Center Panel displaying beautifully parsed markdown content, KaTeX equations, and citations, and Right Panel showing backlinks and a mini-graph float index.
  - **Development**: Create all the pages but populate them with sample content of what might be there. This is placeholder text so that I can verify that the content render correctly. However, it should be easy to delete unecessary pages and change the contents of the pages in line with the contribution system.

---

## 🛠 Core Technical Features to Implement

### 1. The Hybrid Knowledge Graph
Instead of a standard flat hierarchy, construct a relation network:
- **Directed Prerequisite Edges (Structural)**: Statically declared in page frontmatter (e.g. `prerequisites: ["linear-algebra", "gradient-descent"]`) forming a Directed Acyclic Graph (DAG) for learning paths.
- **Undirected Similarity Edges (Semantic)**: Computed at build time using the **Jaccard Similarity Index** over shared domains and tags. For any topic $A$ and $B$, compute:
  $$J(A, B) = \frac{|Tags_A \cap Tags_B|}{|Tags_A \cup Tags_B|}$$
  Connect nodes having similarity above a configurable threshold (e.g., $\ge 0.4$), creating a dynamic k-Nearest Neighbors (kNN) discovery network.
- **D3 Interactive Graph Rendering**: A React component powered by D3-force rendering an SVG canvas. Users can drag/zoom nodes, toggle between the **Learning Path View** (prerequisite trees) and the **Semantic View** (kNN similarity clusters), and click a node to jump to that article.

### 2. Obsidian Wiki-Link Parser (`[[Topic Name]]`)
- Develop a custom Remark/Rehype regex-based plugin to match the `[[Topic Slug]]` or `[[Topic Slug | Custom text]]` syntax inside Markdown files.
- Resolve links to `/topics/[slug]` dynamically.
- **Build-Time Verification**: Enforce that if a `[[WikiLink]]` points to a non-existent topic slug, the build fails immediately.
- **Backlinks Engine**: Scan all markdown documents at build time to build a dictionary mapping target topics to their referrer pages. Render this list as a "Backlinks" section at the bottom of every article.
- **Hover Preview Modals**: Pre-load topic metadata (title, summary, difficulty) and display an elegant floating tooltip when hovering over any internal link.

### 3. Contribution Verification System (PR CI)
- Define a strict Zod metadata schema for Astro Content Collections:
  ```typescript
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  domains: z.array(z.string()),
  tags: z.array(z.string()),
  prerequisites: z.array(z.string()).optional(),
  citations: z.array(z.object({ title: z.string(), url: z.string().url() })).optional(),
  ```
- Write a PR validation script (`scripts/validate-content.sh`) to perform build-time static checks:
  1. Frontmatter Zod schema validation.
  2. KaTeX equation parsing check.
  3. Internal `[[WikiLink]]` broken link validation.
  4. Mandatory image citations validator.
- Create a GitHub Actions workflow to run this script on every Pull Request.

---

## 🏃‍♂️ Step-by-Step Implementation Roadmap

### Slice 1: Website Style Extraction & Theme Initialization (Completed ✅)
1. **Status**: Fully completed and validated.
2. **Details**: Global CSS variables, custom dark background radial gradient `--gradient-hero`, Typography (Outfit + Inter fonts), and layout classes are defined in `/src/styles/global.css`.
3. **Components**: The responsive global navigation header (`src/components/Navigation.astro`) and exact official footer (`src/components/Footer.astro` replicating `nusaisociety.org`) are fully functional and integrated with `BaseLayout.astro`.

### Slice 2: Content Collection & LaTeX Markdown Parser (Completed ✅)
1. Setup Astro Content Collections in `src/content/config.ts` using the Zod schema detailed above.
2. Integrate KaTeX and Rehype plugins into `astro.config.mjs` for beautiful, performant server-side LaTeX compilation.
3. Write the custom Remark WikiLink parser. Generate a static build-time `backlinks.json` indexing file linking references.
4. Write unit tests (Vitest) validating your Markdown compiler, Jaccard similarity calculator, and backlinks generator.

### Slice 3: Force-Directed Knowledge Graph React Component (Completed ✅)
1. Compute the graph structure (nodes representing topics, edges representing prerequisites or semantic kNN similarities) at build time, and write it to a static `graph-data.json` file.
2. Build `src/components/KnowledgeGraph.tsx` using React and D3-force to render a responsive, styled SVG network map.
3. Add drag-and-zoom behavior, neon glow animations on active nodes, and hover paths.
4. Implement toggles to swap between the Prerequisite learning tree and Semantic tag similarity groups.

### Slice 4: Double-Pane Reader Layout & Hover Previews (Completed ✅)
1. Build `src/layouts/ReaderLayout.astro`. Implement the double-pane view: Left Sidebar navigation with ScrollSpy outline tracking read progress, Center Panel with the parsed markdown article, and Right Panel with backlinks and a mini interactive float graph.
2. Build the `HoverPreview.tsx` component that retrieves precomputed topic cards asynchronously, rendering a preview popover when mouse-hovering a WikiLink.

### Slice 5: Linter Scripts & Automated PR Verification (Completed ✅)
1. Create `scripts/validate-content.sh` implementing frontmatter schema checks, LaTeX math safety scans, broken internal links checker, and image citation validation.
2. Draft a complete `CONTRIBUTING.md` guide that includes step-by-step instructions on writing markdown, formatting LaTeX formulas, local editor setups (Obsidian/VS Code + Foam), and a Reviewer Checklist for PR maintainers.
3. Setup the GitHub Actions workflow at `.github/workflows/verify-pr.yml` executing the validation script. 
4. Create a `README.md` file that goes in detail to the contribution process and where reviewers can obtain their checklist/where they can use their checklist.

### Slice 6: E2E Playwright Tests & Cloudflare Deployment (Completed ✅)
1. Configure Playwright E2E browser tests under `tests/e2e/` verifying clicking graph nodes navigates pages, KaTeX compiles successfully on pages, and hover popovers work correctly.
2. Deploy the build outputs to Cloudflare Pages. Hook up automated CI triggers to build and publish preview versions of the application. To the `README.md` add a section on how to host the website, covering all the hosting information in detail.

---

## 🎯 Verification Gate before Completion
Before calling your task complete, run the following verification checks:
1. Run `./scripts/check.sh` and ensure all static markdown and formatting checks succeed.
2. Run `npm run typecheck` to verify complete TS safety.
3. Execute `npx playwright test` to verify complete UI/UX correctness in virtual browsers.
4. Confirm KaTeX mathematical equations compile perfectly with no layout shifts.
