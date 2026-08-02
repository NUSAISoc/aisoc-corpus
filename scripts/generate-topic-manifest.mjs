/**
 * Generates public/data/topics.json for Worker-side reports and admin tooling.
 */
import fs from "node:fs";
import path from "node:path";

const TOPICS_DIR = path.resolve("src/content/topics");
const OUTPUT_PATH = path.resolve("public/data/topics.json");

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatter = {};
  const lines = match[1].split("\n");
  const parseInlineArray = (value) =>
    value
      .replace(/[\[\]]/g, "")
      .split(",")
      .map((entry) => entry.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);

  for (let i = 0; i < lines.length; i += 1) {
    const kv = lines[i].match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rawValue] = kv;

    if (rawValue.startsWith("[")) {
      const arrayLines = [rawValue];
      while (!arrayLines.join("\n").includes("]") && i + 1 < lines.length) {
        i += 1;
        arrayLines.push(lines[i]);
      }
      frontmatter[key] = parseInlineArray(arrayLines.join("\n"));
      continue;
    }

    if (rawValue === "") {
      const arrayItems = [];
      while (i + 1 < lines.length && lines[i + 1].match(/^\s+-\s/)) {
        i += 1;
        arrayItems.push(lines[i].replace(/^\s+-\s*["']?|["']?\s*$/g, ""));
      }
      frontmatter[key] = arrayItems;
      continue;
    }

    frontmatter[key] = rawValue.replace(/^["']|["']$/g, "");
  }

  return frontmatter;
}

function findMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findMarkdownFiles(fullPath));
    } else if (entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}

function countWords(markdown) {
  const body = markdown.replace(/^---\n[\s\S]*?\n---/, "");
  return body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

export function generateTopicManifest() {
  const topics = findMarkdownFiles(TOPICS_DIR).map((file) => {
    const content = fs.readFileSync(file, "utf-8");
    const frontmatter = parseFrontmatter(content);
    const relativePath = path
      .relative(TOPICS_DIR, file)
      .replaceAll(path.sep, "/");
    const slug = path.basename(file, ".md");

    return {
      slug,
      path: `/topics/${slug}/`,
      sourcePath: `src/content/topics/${relativePath}`,
      title: frontmatter.title || slug,
      description: frontmatter.description || "",
      authors: Array.isArray(frontmatter.authors) ? frontmatter.authors : [],
      updatedDate: frontmatter.updatedDate || null,
      difficulty: frontmatter.difficulty || "beginner",
      category: frontmatter.category || relativePath.split("/")[0],
      domains: Array.isArray(frontmatter.domains) ? frontmatter.domains : [],
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
      wordCount: countWords(content),
    };
  });

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify({ generatedAt: new Date().toISOString(), topics }, null, 2),
  );
  return topics;
}

generateTopicManifest();
console.log("Generated topic manifest");
