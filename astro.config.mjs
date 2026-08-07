import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { remarkWikiLink } from "./src/lib/remark-wikilink.mjs";
import { remarkFootnotes } from "./src/lib/remark-footnotes.mjs";
import { SITE_URL } from "./src/config/site.ts";

export default defineConfig({
  site: SITE_URL,
  integrations: [react()],
  markdown: {
    remarkPlugins: [remarkMath, remarkWikiLink, remarkFootnotes],
    rehypePlugins: [rehypeKatex],
  },
});
