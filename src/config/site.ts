const DEFAULT_SITE_URL = "https://aisoc-corpus.aisocietysoc.workers.dev";

export const normalizeSiteUrl = (value: string): string => {
  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("PUBLIC_SITE_URL must use http or https");
  }
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== "/" && url.pathname !== "")
  ) {
    throw new Error("PUBLIC_SITE_URL must be an origin without a path");
  }

  return url.origin;
};

const processEnvironment = (
  globalThis as {
    process?: { env?: Record<string, string | undefined> };
  }
).process?.env;

export const SITE_URL = normalizeSiteUrl(
  processEnvironment?.PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
);

export const GOOGLE_SITE_VERIFICATION =
  processEnvironment?.PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || undefined;
