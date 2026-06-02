import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { remarkWikiLink } from "../lib/remark-wikilink.mjs";

async function processMarkdown(md) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkWikiLink)
    .use(remarkStringify)
    .process(md);
  return String(result);
}

describe("remarkWikiLink", () => {
  it("transforms [[slug]] to a link", async () => {
    const output = await processMarkdown("See [[Gradient Descent]] for details.");
    expect(output).toContain("[Gradient Descent](/topics/gradient-descent)");
  });

  it("transforms [[slug|label]] to a link with custom label", async () => {
    const output = await processMarkdown("Read [[neural-networks|Neural Nets]] first.");
    expect(output).toContain("[Neural Nets](/topics/neural-networks)");
  });

  it("handles multiple wikilinks in a single paragraph", async () => {
    const output = await processMarkdown("Use [[gradient-descent]] and [[linear-regression]].");
    expect(output).toContain("/topics/gradient-descent");
    expect(output).toContain("/topics/linear-regression");
  });

  it("leaves normal links untouched", async () => {
    const output = await processMarkdown("[Link](https://example.com)");
    expect(output).toContain("https://example.com");
  });
});
