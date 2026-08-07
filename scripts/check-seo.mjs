import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

const fail = (message) => {
  throw new Error(`SEO check failed: ${message}`);
};

const readDist = (relativePath, encoding = "utf8") =>
  readFile(path.join(dist, relativePath), encoding);

const expectMatch = (value, pattern, message) => {
  const match = value.match(pattern);
  if (!match) fail(message);
  return match;
};

const homepage = await readDist("index.html");
const canonicalOrigin = new URL(
  expectMatch(
    homepage,
    /<link rel="canonical" href="([^"]+)">/,
    "homepage canonical URL is missing",
  )[1],
).origin;

const robots = await readDist("robots.txt");
if (!robots.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`)) {
  fail("robots.txt and the canonical origin disagree");
}

const sitemap = await readDist("sitemap.xml");
if (sitemap.includes("<changefreq>") || sitemap.includes("<priority>")) {
  fail("sitemap contains unsupported scheduling or priority hints");
}

const sitemapUrls = Array.from(
  sitemap.matchAll(/<loc>([^<]+)<\/loc>/g),
  (match) => match[1].replaceAll("&amp;", "&"),
);
if (sitemapUrls.length === 0) fail("sitemap has no URLs");

for (const sitemapUrl of sitemapUrls) {
  const url = new URL(sitemapUrl);
  if (url.origin !== canonicalOrigin) {
    fail(`sitemap origin mismatch for ${sitemapUrl}`);
  }
  if (url.pathname.startsWith("/admin")) {
    fail(`private admin URL appears in sitemap: ${sitemapUrl}`);
  }

  const routeFile = url.pathname.endsWith("/")
    ? path.join(url.pathname.slice(1), "index.html")
    : url.pathname.slice(1);
  const html = await readDist(routeFile || "index.html");
  if (!html.includes(`<link rel="canonical" href="${sitemapUrl}">`)) {
    fail(`canonical tag does not match sitemap URL: ${sitemapUrl}`);
  }
  if (
    !html.includes(
      '<meta name="robots" content="index, follow, max-image-preview:large">',
    )
  ) {
    fail(`public page is missing its indexing directive: ${sitemapUrl}`);
  }
  if (!html.includes('<meta name="description" content="')) {
    fail(`public page is missing its description: ${sitemapUrl}`);
  }
}

const adminFiles = (
  await readdir(path.join(dist, "admin"), {
    recursive: true,
  })
).filter((entry) => entry.endsWith("index.html"));
for (const adminFile of adminFiles) {
  const html = await readDist(path.join("admin", adminFile));
  if (!html.includes('<meta name="robots" content="noindex, nofollow">')) {
    fail(`admin page is indexable: /admin/${adminFile}`);
  }
}

const socialImagePath = "images/ai-soc-corpus-social-card.png";
const socialImage = await readDist(socialImagePath, null);
const socialImageInfo = await stat(path.join(dist, socialImagePath));
const width = socialImage.readUInt32BE(16);
const height = socialImage.readUInt32BE(20);
if (width !== 1200 || height !== 630) {
  fail(`social image must be 1200x630, received ${width}x${height}`);
}
if (socialImageInfo.size > 1_000_000) {
  fail("social image must stay below 1 MB");
}
if (
  !homepage.includes(
    `<meta property="og:image" content="${canonicalOrigin}/${socialImagePath}">`,
  )
) {
  fail("homepage does not reference the canonical social image");
}

console.log(
  `check-seo: ${sitemapUrls.length} public URLs and ${adminFiles.length} private pages verified (OK)`,
);
