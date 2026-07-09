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
  readonly priority: string;
  readonly lastmod?: string;
}

export async function GET() {
  const topics = await getCollection("topics");
  const urls: SitemapUrl[] = [
    { path: "/", priority: "1.0" },
    { path: "/topics/", priority: "0.9" },
    { path: "/about/", priority: "0.7" },
    { path: "/contribute/", priority: "0.6" },
    ...TOPIC_CATEGORIES.map((category) => ({
      path: `/categories/${category.id}/`,
      priority: "0.7",
    })),
    ...topics.map((topic) => ({
      path: `/topics/${topicSlugFromId(topic.id)}/`,
      priority: "0.8",
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
    <changefreq>weekly</changefreq>
    <priority>${url.priority}</priority>
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
