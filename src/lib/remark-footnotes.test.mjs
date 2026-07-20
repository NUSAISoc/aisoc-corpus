import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import {
  parseFootnoteDefinitions,
  remarkFootnotes,
} from "../lib/remark-footnotes.mjs";

async function processMarkdown(md) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkFootnotes)
    .use(remarkStringify)
    .process(md);
  return String(result);
}

describe("remarkFootnotes", () => {
  it("transforms matching references into superscript links", async () => {
    const output = await processMarkdown(
      "A useful aside.[^note]\n\n[^note]: Extra context.",
    );

    expect(output).toContain(
      '<sup class="footnote-reference"><a id="footnote-ref-note" href="#footnote-note" aria-label="Footnote 1">[1]</a></sup>',
    );
    expect(output).not.toContain("[^note]: Extra context.");
  });

  it("reuses the same number for repeated references", async () => {
    const output = await processMarkdown(
      "First.[^same] Second.[^same]\n\n[^same]: Extra context.",
    );

    expect(output.match(/Footnote 1/g)).toHaveLength(2);
    expect(output.match(/id="footnote-ref-same"/g)).toHaveLength(1);
    expect(output).not.toContain("Footnote 2");
  });

  it("leaves references without definitions untouched", async () => {
    const output = await processMarkdown("Missing note.[^missing]");

    expect(output).toContain("[^missing]");
  });
});

describe("parseFootnoteDefinitions", () => {
  it("extracts footnote definitions for page-level rendering", () => {
    expect(
      parseFootnoteDefinitions(
        "Second.[^two] First.[^one]\n\n[^one]: First note.\n[^two]: Second note.",
      ),
    ).toEqual([
      {
        label: "two",
        content: "Second note.",
        id: "footnote-two",
        referenceId: "footnote-ref-two",
      },
      {
        label: "one",
        content: "First note.",
        id: "footnote-one",
        referenceId: "footnote-ref-one",
      },
    ]);
  });

  it("keeps unreferenced definitions after referenced definitions", () => {
    expect(
      parseFootnoteDefinitions(
        "Used.[^used]\n\n[^unused]: Extra note.\n[^used]: Used note.",
      ),
    ).toEqual([
      {
        label: "used",
        content: "Used note.",
        id: "footnote-used",
        referenceId: "footnote-ref-used",
      },
      {
        label: "unused",
        content: "Extra note.",
        id: "footnote-unused",
        referenceId: "footnote-ref-unused",
      },
    ]);
  });
});
