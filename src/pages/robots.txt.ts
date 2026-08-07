import { canonicalUrl } from "../lib/seo";

export function GET() {
  return new Response(
    `${[
      "User-agent: *",
      "Allow: /",
      "",
      `Sitemap: ${canonicalUrl("/sitemap.xml")}`,
    ].join("\n")}\n`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
