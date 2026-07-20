import { visit } from "unist-util-visit";

const FOOTNOTE_REFERENCE_PATTERN = /\[\^([A-Za-z0-9_-]+)\]/g;
const FOOTNOTE_DEFINITION_PATTERN = /^\[\^([A-Za-z0-9_-]+)\]:\s*(.+)$/;

function textValue(node) {
  if (!node) return "";
  if (node.type === "text") return node.value;
  if (!Array.isArray(node.children)) return "";
  return node.children.map(textValue).join("");
}

function footnoteId(label) {
  return `footnote-${label}`;
}

function footnoteReferenceId(label) {
  return `footnote-ref-${label}`;
}

function removeFootnoteDefinitions(node, definitions) {
  if (!node || !Array.isArray(node.children)) return;

  node.children = node.children.filter((child) => {
    if (child.type !== "paragraph") {
      removeFootnoteDefinitions(child, definitions);
      return true;
    }

    const match = textValue(child).match(FOOTNOTE_DEFINITION_PATTERN);
    if (!match) return true;

    definitions.add(match[1]);
    return false;
  });
}

export function parseFootnoteDefinitions(markdown) {
  const definitions = new Map();
  const referenceOrder = [];

  for (const line of markdown.split(/\r?\n/)) {
    const definitionMatch = line.match(FOOTNOTE_DEFINITION_PATTERN);

    if (definitionMatch) {
      definitions.set(definitionMatch[1], {
        label: definitionMatch[1],
        content: definitionMatch[2].trim(),
        id: footnoteId(definitionMatch[1]),
        referenceId: footnoteReferenceId(definitionMatch[1]),
      });
      continue;
    }

    FOOTNOTE_REFERENCE_PATTERN.lastIndex = 0;
    let referenceMatch;
    while ((referenceMatch = FOOTNOTE_REFERENCE_PATTERN.exec(line)) !== null) {
      if (!referenceOrder.includes(referenceMatch[1])) {
        referenceOrder.push(referenceMatch[1]);
      }
    }
  }

  const orderedDefinitions = referenceOrder
    .filter((label) => definitions.has(label))
    .map((label) => definitions.get(label));
  const referencedLabels = new Set(referenceOrder);
  const unreferencedDefinitions = [...definitions.entries()]
    .filter(([label]) => !referencedLabels.has(label))
    .map(([, definition]) => definition);

  return [...orderedDefinitions, ...unreferencedDefinitions];
}

export function remarkFootnotes() {
  return (tree) => {
    const definitions = new Set();
    removeFootnoteDefinitions(tree, definitions);

    if (definitions.size === 0) return;

    const referenceNumbers = new Map();
    const linkedReferenceIds = new Set();

    visit(tree, "text", (node, index, parent) => {
      if (!parent || index === undefined) return;

      const value = node.value;
      FOOTNOTE_REFERENCE_PATTERN.lastIndex = 0;
      if (!FOOTNOTE_REFERENCE_PATTERN.test(value)) return;

      FOOTNOTE_REFERENCE_PATTERN.lastIndex = 0;
      const children = [];
      let lastIndex = 0;
      let match;

      while ((match = FOOTNOTE_REFERENCE_PATTERN.exec(value)) !== null) {
        const label = match[1];

        if (!definitions.has(label)) continue;

        if (match.index > lastIndex) {
          children.push({
            type: "text",
            value: value.slice(lastIndex, match.index),
          });
        }

        if (!referenceNumbers.has(label)) {
          referenceNumbers.set(label, referenceNumbers.size + 1);
        }

        const number = referenceNumbers.get(label);
        const referenceId = footnoteReferenceId(label);
        const referenceIdAttribute = linkedReferenceIds.has(label)
          ? ""
          : ` id="${referenceId}"`;
        linkedReferenceIds.add(label);
        children.push({
          type: "html",
          value: `<sup class="footnote-reference"><a${referenceIdAttribute} href="#${footnoteId(label)}" aria-label="Footnote ${number}">[${number}]</a></sup>`,
        });
        lastIndex = match.index + match[0].length;
      }

      if (children.length === 0) return;

      if (lastIndex < value.length) {
        children.push({ type: "text", value: value.slice(lastIndex) });
      }

      parent.children.splice(index, 1, ...children);
    });
  };
}
