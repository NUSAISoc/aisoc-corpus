import { canonicalUrl } from "../lib/seo";

export function GET() {
  return new Response(
    [
      "User-agent: *",
      "Allow: /",
      "",
      `Sitemap: ${canonicalUrl("/sitemap.xml")}`,
      "",
      "# Content signal: search=yes",
      "# Content signal: ai-input=yes",
      "# Content signal: ai-train=no",
    ].join("\n"),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
