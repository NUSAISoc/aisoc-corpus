export const TOPIC_CATEGORIES = [
  "classical-ml",
  "deep-learning",
  "generative",
  "reinforcement-learning",
  "world-modelling",
] as const;

export const TOPIC_DIFFICULTIES = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

export const TOPIC_IMAGE_CONSTRAINTS = {
  maxFiles: 8,
  maxBytesPerFile: 2 * 1024 * 1024,
  allowedTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
};

export type TopicCategory = (typeof TOPIC_CATEGORIES)[number];
export type TopicDifficulty = (typeof TOPIC_DIFFICULTIES)[number];

export type FurtherReadingInput = {
  title: string;
  url: string;
};

export type TopicSubmissionInput = {
  title: string;
  slug: string;
  description: string;
  authors: string[];
  difficulty: TopicDifficulty;
  category: TopicCategory;
  domains: string[];
  tags: string[];
  prerequisites: string[];
  furtherReading: FurtherReadingInput[];
  markdown: string;
};

export type TopicImageInput = {
  name: string;
  type: string;
  size: number;
  contentBase64: string;
};

export type PreparedTopicImage = TopicImageInput & {
  safeName: string;
  path: string;
};

export type PreparedTopicSubmission = {
  topic: TopicSubmissionInput;
  topicPath: string;
  markdown: string;
  images: PreparedTopicImage[];
};

export type TopicSubmissionIssue = {
  field: string;
  message: string;
};

export class TopicSubmissionError extends Error {
  readonly issues: TopicSubmissionIssue[];

  constructor(issues: TopicSubmissionIssue[]) {
    super("Topic submission failed validation");
    this.name = "TopicSubmissionError";
    this.issues = issues;
  }
}

function isTopicCategory(value: string): value is TopicCategory {
  return TOPIC_CATEGORIES.includes(value as TopicCategory);
}

function isTopicDifficulty(value: string): value is TopicDifficulty {
  return TOPIC_DIFFICULTIES.includes(value as TopicDifficulty);
}

export function slugifyTopicTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function parseDelimitedList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseFurtherReadingJson(value: string): FurtherReadingInput[] {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) => {
      if (!item || typeof item !== "object") {
        return { title: "", url: "" };
      }
      const candidate = item as Record<string, unknown>;
      return {
        title: String(candidate.title ?? "").trim(),
        url: String(candidate.url ?? "").trim(),
      };
    })
    .filter((item) => item.title || item.url);
}

function isSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isGithubUsername(value: string): boolean {
  return /^[A-Za-z0-9-]+$/.test(value);
}

function isTaxonomyToken(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isSafeImageName(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]*\.(png|jpe?g|webp|gif)$/i.test(value);
}

function sanitizeImageName(value: string): string {
  return value
    .trim()
    .replace(/\\/g, "/")
    .split("/")
    .pop()!
    .replace(/[^A-Za-z0-9._-]/g, "-")
    .replace(/-{2,}/g, "-");
}

function validateUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function yamlStringArray(values: string[]): string {
  return `[${values.map((value) => yamlString(value)).join(", ")}]`;
}

export function renderTopicMarkdown(topic: TopicSubmissionInput): string {
  const prerequisites =
    topic.prerequisites.length > 0
      ? `prerequisites: ${yamlStringArray(topic.prerequisites)}\n`
      : "";
  const furtherReading = topic.furtherReading
    .map(
      (item) =>
        `  - title: ${yamlString(item.title)}\n    url: ${yamlString(item.url)}`,
    )
    .join("\n");

  return `---\ntitle: ${yamlString(topic.title)}\ndescription: ${yamlString(topic.description)}\nauthors: ${yamlStringArray(topic.authors)}\ndifficulty: ${topic.difficulty}\ncategory: ${topic.category}\ndomains: ${yamlStringArray(topic.domains)}\ntags: ${yamlStringArray(topic.tags)}\n${prerequisites}furtherReading:\n${furtherReading}\n---\n\n${topic.markdown.trim()}\n`;
}

export function validateTopicSubmission(
  input: TopicSubmissionInput,
): TopicSubmissionIssue[] {
  const issues: TopicSubmissionIssue[] = [];

  if (!input.title.trim()) {
    issues.push({ field: "title", message: "Title is required." });
  }
  if (!isSlug(input.slug)) {
    issues.push({
      field: "slug",
      message: "Slug must be lowercase letters, numbers, and hyphens only.",
    });
  }
  if (!input.description.trim()) {
    issues.push({ field: "description", message: "Description is required." });
  }
  if (
    input.authors.length < 1 ||
    input.authors.some((item) => !isGithubUsername(item))
  ) {
    issues.push({
      field: "authors",
      message: "List at least one GitHub username, separated by commas.",
    });
  }
  if (!isTopicDifficulty(input.difficulty)) {
    issues.push({ field: "difficulty", message: "Choose a valid difficulty." });
  }
  if (!isTopicCategory(input.category)) {
    issues.push({ field: "category", message: "Choose a valid category." });
  }
  if (
    input.domains.length < 1 ||
    input.domains.some((item) => !isTaxonomyToken(item))
  ) {
    issues.push({
      field: "domains",
      message: "Add lowercase domain tokens, separated by commas.",
    });
  }
  if (
    input.tags.length < 1 ||
    input.tags.some((item) => !isTaxonomyToken(item))
  ) {
    issues.push({
      field: "tags",
      message: "Add lowercase tag tokens, separated by commas.",
    });
  }
  if (input.prerequisites.some((item) => !isSlug(item))) {
    issues.push({
      field: "prerequisites",
      message: "Prerequisite slugs must be lowercase tokens.",
    });
  }
  if (
    input.furtherReading.length < 1 ||
    input.furtherReading.some(
      (item) => !item.title.trim() || !validateUrl(item.url),
    )
  ) {
    issues.push({
      field: "furtherReading",
      message: "Add at least one Further Reading item with a valid URL.",
    });
  }
  if (!input.markdown.trim()) {
    issues.push({
      field: "markdown",
      message: "Markdown content is required.",
    });
  }
  if (/^#\s+/m.test(input.markdown)) {
    issues.push({
      field: "markdown",
      message: "Do not include an H1. The topic title renders automatically.",
    });
  }

  return issues;
}

export function prepareTopicSubmission(
  input: TopicSubmissionInput,
  images: TopicImageInput[],
): PreparedTopicSubmission {
  const normalized: TopicSubmissionInput = {
    ...input,
    title: input.title.trim(),
    slug: input.slug.trim(),
    description: input.description.trim(),
    authors: input.authors.map((item) => item.trim()).filter(Boolean),
    domains: input.domains.map((item) => item.trim()).filter(Boolean),
    tags: input.tags.map((item) => item.trim()).filter(Boolean),
    prerequisites: input.prerequisites
      .map((item) => item.trim())
      .filter(Boolean),
    furtherReading: input.furtherReading.map((item) => ({
      title: item.title.trim(),
      url: item.url.trim(),
    })),
    markdown: input.markdown.trim(),
  };
  const issues = validateTopicSubmission(normalized);

  if (images.length > TOPIC_IMAGE_CONSTRAINTS.maxFiles) {
    issues.push({
      field: "images",
      message: `Upload at most ${TOPIC_IMAGE_CONSTRAINTS.maxFiles} images.`,
    });
  }

  const safeNames = new Set<string>();
  const preparedImages = images.map((image) => {
    const safeName = sanitizeImageName(image.name);
    const lowerName = safeName.toLowerCase();

    if (!isSafeImageName(safeName)) {
      issues.push({
        field: "images",
        message: `${image.name} must be a png, jpg, webp, or gif image with a safe filename.`,
      });
    }
    if (!TOPIC_IMAGE_CONSTRAINTS.allowedTypes.includes(image.type)) {
      issues.push({
        field: "images",
        message: `${image.name} uses an unsupported image type.`,
      });
    }
    if (image.size > TOPIC_IMAGE_CONSTRAINTS.maxBytesPerFile) {
      issues.push({
        field: "images",
        message: `${image.name} exceeds the 2 MB image limit.`,
      });
    }
    if (safeNames.has(lowerName)) {
      issues.push({
        field: "images",
        message: `${image.name} duplicates another uploaded filename.`,
      });
    }
    safeNames.add(lowerName);

    return {
      ...image,
      safeName,
      path: `public/corpus-uploads/${normalized.slug}/${safeName}`,
    };
  });

  if (issues.length > 0) {
    throw new TopicSubmissionError(issues);
  }

  return {
    topic: normalized,
    topicPath: `src/content/topics/${normalized.category}/${normalized.slug}.md`,
    markdown: renderTopicMarkdown(normalized),
    images: preparedImages,
  };
}
