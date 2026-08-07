import { getCollection } from "astro:content";
import { TOPIC_CATEGORIES } from "../lib/categories";
import { canonicalUrl } from "../lib/seo";
import { topicSlugFromId } from "../lib/topic-slugs";

const xmlEscape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

interface SitemapUrl {
  readonly path: string;
  readonly lastmod?: string;
}

export async function GET() {
  const topics = await getCollection("topics");
  const urls: SitemapUrl[] = [
    { path: "/" },
    { path: "/topics/" },
    { path: "/about/" },
    { path: "/contribute/" },
    ...TOPIC_CATEGORIES.map((category) => ({
      path: `/categories/${category.id}/`,
    })),
    ...topics.map((topic) => ({
      path: `/topics/${topicSlugFromId(topic.id)}/`,
      lastmod: topic.data.updatedDate,
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${xmlEscape(canonicalUrl(url.path))}</loc>${
      url.lastmod ? `\n    <lastmod>${xmlEscape(url.lastmod)}</lastmod>` : ""
    }
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
