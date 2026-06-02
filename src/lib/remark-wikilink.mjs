import { visit } from "unist-util-visit";

/** Custom remark plugin: transforms [[WikiLink]] and [[slug|label]] into anchor tags */
export function remarkWikiLink() {
  const wikiLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

  return (tree) => {
    visit(tree, "text", (node, index, parent) => {
      if (!parent || index === undefined) return;
      const value = node.value;
      if (!wikiLinkRegex.test(value)) return;
      wikiLinkRegex.lastIndex = 0;

      const children = [];
      let lastIndex = 0;
      let match;
      while ((match = wikiLinkRegex.exec(value)) !== null) {
        if (match.index > lastIndex) {
          children.push({ type: "text", value: value.slice(lastIndex, match.index) });
        }
        const slug = match[1].trim().toLowerCase().replace(/\s+/g, "-");
        const label = (match[2] || match[1]).trim();
        children.push({
          type: "link",
          url: `/topics/${slug}`,
          data: { hProperties: { className: "wikilink", "data-slug": slug } },
          children: [{ type: "text", value: label }],
        });
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < value.length) {
        children.push({ type: "text", value: value.slice(lastIndex) });
      }
      parent.children.splice(index, 1, ...children);
    });
  };
}
