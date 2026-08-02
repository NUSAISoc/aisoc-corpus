export interface PageviewPayload {
  path?: unknown;
  title?: unknown;
  referrer?: unknown;
  viewport?: unknown;
  language?: unknown;
}

export interface AnalyticsPoint {
  path: string;
  title: string;
  referrer: string;
  viewport: string;
  language: string;
}

export interface AnalyticsSummary {
  configured: boolean;
  generatedAt: string;
  rangeDays: number;
  overview: {
    pageviews: number;
    uniquePages: number;
    topPage: string | null;
  };
  topPages: Array<{ path: string; title: string; views: number }>;
  referrers: Array<{ referrer: string; views: number }>;
  usagePatterns: Array<{ bucket: string; views: number }>;
}

const DATASET = "corpus_pageviews";

function asShortString(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return (trimmed || fallback).slice(0, maxLength);
}

export function normalizePageviewPayload(
  payload: PageviewPayload,
): AnalyticsPoint {
  const rawPath = asShortString(payload.path, "/", 240);
  let path = rawPath.startsWith("/") ? rawPath : "/";
  path = path.split("#")[0]?.split("?")[0] || "/";

  return {
    path,
    title: asShortString(payload.title, "Untitled", 180),
    referrer: normalizeReferrer(payload.referrer),
    viewport: asShortString(payload.viewport, "unknown", 40),
    language: asShortString(payload.language, "unknown", 32),
  };
}

export function normalizeReferrer(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    return "Direct";
  }

  try {
    const url = new URL(value);
    return url.hostname || "Direct";
  } catch {
    return "Direct";
  }
}

function datasetName(name = DATASET): string {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    return DATASET;
  }
  return name;
}

export function buildAnalyticsQueries(rangeDays: number, dataset = DATASET) {
  const days = Math.min(Math.max(Math.floor(rangeDays), 1), 90);
  const table = datasetName(dataset);
  const where = `timestamp > NOW() - INTERVAL '${days}' DAY`;

  return {
    overview: `SELECT sum(_sample_interval) AS pageviews, uniq(index1) AS uniquePages FROM ${table} WHERE ${where} FORMAT JSON`,
    topPages: `SELECT index1 AS path, any(blob1) AS title, sum(_sample_interval) AS views FROM ${table} WHERE ${where} GROUP BY path ORDER BY views DESC LIMIT 12 FORMAT JSON`,
    referrers: `SELECT blob2 AS referrer, sum(_sample_interval) AS views FROM ${table} WHERE ${where} GROUP BY referrer ORDER BY views DESC LIMIT 10 FORMAT JSON`,
    usagePatterns: `SELECT toStartOfHour(timestamp) AS bucket, sum(_sample_interval) AS views FROM ${table} WHERE ${where} GROUP BY bucket ORDER BY bucket ASC FORMAT JSON`,
  };
}

export function emptyAnalyticsSummary(rangeDays = 30): AnalyticsSummary {
  return {
    configured: false,
    generatedAt: new Date().toISOString(),
    rangeDays,
    overview: {
      pageviews: 0,
      uniquePages: 0,
      topPage: null,
    },
    topPages: [],
    referrers: [],
    usagePatterns: [],
  };
}
