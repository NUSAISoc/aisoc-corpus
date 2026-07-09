import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { remarkWikiLink } from "./src/lib/remark-wikilink.mjs";

export default defineConfig({
  site: "https://aisoc-corpus.aisocietysoc.workers.dev",
  integrations: [react()],
  markdown: {
    remarkPlugins: [remarkMath, remarkWikiLink],
    rehypePlugins: [rehypeKatex],
  },
});
