/**
 * Scans all topic markdown files and builds a backlinks index.
 * Output: src/lib/backlinks.json - maps slug -> array of {slug, title} referrers
 */
import fs from "node:fs";
import path from "node:path";

const TOPICS_DIR = path.resolve("src/content/topics");
const OUTPUT_PATH = path.resolve("src/lib/backlinks.json");

const wikiLinkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

export function generateBacklinks() {
  const files = fs.readdirSync(TOPICS_DIR).filter((f) => f.endsWith(".md"));
  /** @type {Record<string, {slug: string, title: string}[]>} */
  const backlinks = {};

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const content = fs.readFileSync(path.join(TOPICS_DIR, file), "utf-8");
    const titleMatch = content.match(/^title:\s*(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : slug;

    let match;
    wikiLinkRegex.lastIndex = 0;
    while ((match = wikiLinkRegex.exec(content)) !== null) {
      const targetSlug = match[1].trim().toLowerCase().replace(/\s+/g, "-");
      if (!backlinks[targetSlug]) backlinks[targetSlug] = [];
      if (!backlinks[targetSlug].some((b) => b.slug === slug)) {
        backlinks[targetSlug].push({ slug, title });
      }
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(backlinks, null, 2));
  return backlinks;
}

// Run directly when called as a script
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.url.replace("file://", ""))) {
  generateBacklinks();
}
