import { SOCIAL_LINKS } from "./socialLinks";

export const SITE_URL = "https://aisoc-corpus.aisocietysoc.workers.dev";
export const SITE_NAME = "AI Soc Corpus";
export const ORGANIZATION_NAME = "NUS AI Society";
export const DEFAULT_DESCRIPTION =
  "An interconnected AI and machine learning knowledge base by NUS AI Society.";
export const DEFAULT_SOCIAL_IMAGE = "/favicon.svg";

export interface BreadcrumbItem {
  readonly name: string;
  readonly path: string;
}

export interface TopicSeoInput {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly author: string;
  readonly difficulty: string;
  readonly category: string;
  readonly domains: readonly string[];
  readonly tags: readonly string[];
  readonly citations: readonly { title: string; url: string }[];
  readonly updatedDate?: string;
}

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

export const canonicalUrl = (path = "/") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, SITE_URL).toString();
};

export const socialImageUrl = (path = DEFAULT_SOCIAL_IMAGE) =>
  path.startsWith("http") ? path : canonicalUrl(path);

export const serializeJsonLd = (items: readonly unknown[]) =>
  JSON.stringify(items.length === 1 ? items[0] : items, (_key, value) =>
    value === undefined ? undefined : value,
  ).replace(/</g, "\\u003c");

export const organizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: ORGANIZATION_NAME,
  alternateName: "NUS SoC AI Society",
  url: SITE_URL,
  logo: socialImageUrl(),
  email: SOCIAL_LINKS.email.href.replace("mailto:", ""),
  address: {
    "@type": "PostalAddress",
    streetAddress: "COM1, 13 Computing Dr",
    addressLocality: "Singapore",
    postalCode: "117417",
    addressCountry: "SG",
  },
  sameAs: [
    SOCIAL_LINKS.github.href,
    SOCIAL_LINKS.linkedin.href,
    SOCIAL_LINKS.telegramAlerts.href,
  ],
});

export const websiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  publisher: {
    "@type": "EducationalOrganization",
    name: ORGANIZATION_NAME,
  },
  inLanguage: "en",
});

export const breadcrumbSchema = (items: readonly BreadcrumbItem[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: canonicalUrl(item.path),
  })),
});

export const topicSchema = (topic: TopicSeoInput) => ({
  "@context": "https://schema.org",
  "@type": ["TechArticle", "LearningResource"],
  headline: topic.title,
  description: topic.description,
  url: canonicalUrl(topic.path),
  author: {
    "@type": "Person",
    name: topic.author,
    url: `https://github.com/${topic.author}`,
  },
  publisher: {
    "@type": "EducationalOrganization",
    name: ORGANIZATION_NAME,
    url: SITE_URL,
  },
  educationalLevel: topic.difficulty,
  about: [...topic.domains, ...topic.tags, topic.category],
  citation: topic.citations.map((citation) => citation.url),
  dateModified: topic.updatedDate,
  inLanguage: "en",
});

export const faqSchema = (items: readonly FaqItem[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
});
