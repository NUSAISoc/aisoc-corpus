export type AnalyticsEnv = {
  ANALYTICS?: {
    writeDataPoint(point: {
      blobs: string[];
      doubles: number[];
      indexes: string[];
    }): void;
  };
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_ANALYTICS_API_TOKEN?: string;
  ANALYTICS_DATASET?: string;
};

const DEFAULT_DATASET = "aisoc_corpus_pageviews";

function normalizeDataset(value: string | undefined): string {
  return value && /^[A-Za-z0-9_]+$/.test(value) ? value : DEFAULT_DATASET;
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api"))
    return "";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function deviceFromUserAgent(userAgent: string): string {
  const value = userAgent.toLowerCase();
  if (/ipad|tablet/.test(value)) return "tablet";
  if (/mobile|iphone|android/.test(value)) return "mobile";
  return "desktop";
}

function referrerOrigin(value: string): string {
  if (!value) return "direct";
  try {
    return new URL(value).origin;
  } catch {
    return "unknown";
  }
}

export async function recordPageview(
  request: Request,
  env: AnalyticsEnv,
): Promise<Response> {
  if (request.method !== "POST")
    return new Response("Method not allowed", { status: 405 });

  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const path = normalizePath(String(payload.path || ""));
  if (!path) return new Response(null, { status: 204 });

  env.ANALYTICS?.writeDataPoint({
    blobs: [
      path,
      String(payload.title || "").slice(0, 160),
      referrerOrigin(String(payload.referrer || "")),
      request.headers.get("cf-ipcountry") || "unknown",
      deviceFromUserAgent(request.headers.get("user-agent") || ""),
    ],
    doubles: [1, Number(payload.width || 0), Number(payload.height || 0)],
    indexes: [new URL(request.url).hostname],
  });

  return new Response(null, { status: 204 });
}

export async function queryAnalyticsEngine(
  env: AnalyticsEnv,
  sql: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{
  data?: Record<string, unknown>[];
  unavailable?: boolean;
  error?: string;
}> {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_ANALYTICS_API_TOKEN) {
    return { data: [], unavailable: true };
  }

  const response = await fetchImpl(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_ANALYTICS_API_TOKEN}`,
      },
      body: sql,
    },
  );

  if (!response.ok) {
    return {
      data: [],
      unavailable: true,
      error: `Analytics query failed with ${response.status}`,
    };
  }

  return response.json();
}

export function buildAnalyticsOverviewQueries(days: number, dataset: string) {
  const interval = `INTERVAL '${days}' DAY`;
  return [
    `SELECT SUM(_sample_interval) AS views, count(DISTINCT blob1) AS unique_paths FROM ${dataset} WHERE timestamp > NOW() - ${interval} FORMAT JSON`,
    `SELECT blob1 AS path, argMax(blob2, timestamp) AS title, SUM(_sample_interval) AS views FROM ${dataset} WHERE timestamp > NOW() - ${interval} GROUP BY path ORDER BY views DESC LIMIT 12 FORMAT JSON`,
    `SELECT formatDateTime(timestamp, '%Y-%m-%d') AS day, SUM(_sample_interval) AS views FROM ${dataset} WHERE timestamp > NOW() - ${interval} GROUP BY day ORDER BY day ASC FORMAT JSON`,
    `SELECT blob3 AS referrer, SUM(_sample_interval) AS views FROM ${dataset} WHERE timestamp > NOW() - ${interval} GROUP BY referrer ORDER BY views DESC LIMIT 8 FORMAT JSON`,
    `SELECT blob5 AS device, SUM(_sample_interval) AS views FROM ${dataset} WHERE timestamp > NOW() - ${interval} GROUP BY device ORDER BY views DESC FORMAT JSON`,
    `SELECT blob4 AS country, SUM(_sample_interval) AS views FROM ${dataset} WHERE timestamp > NOW() - ${interval} GROUP BY country ORDER BY views DESC LIMIT 10 FORMAT JSON`,
  ];
}

export async function buildAnalyticsOverview(
  request: Request,
  env: AnalyticsEnv,
) {
  const url = new URL(request.url);
  const daysRaw = Number(url.searchParams.get("days") || 30);
  const days = Math.min(
    Math.max(Number.isFinite(daysRaw) ? daysRaw : 30, 1),
    90,
  );
  const dataset = normalizeDataset(env.ANALYTICS_DATASET);
  const queries = buildAnalyticsOverviewQueries(days, dataset);

  const [summary, topPages, dailyViews, referrers, devices, countries] =
    await Promise.all(queries.map((query) => queryAnalyticsEngine(env, query)));

  return {
    name: "Signal Deck",
    days,
    summary: summary.data?.[0] || { views: 0, unique_paths: 0 },
    topPages: topPages.data || [],
    dailyViews: dailyViews.data || [],
    referrers: referrers.data || [],
    devices: devices.data || [],
    countries: countries.data || [],
    unavailable: Boolean(
      summary.unavailable ||
        topPages.unavailable ||
        dailyViews.unavailable ||
        referrers.unavailable ||
        devices.unavailable ||
        countries.unavailable,
    ),
  };
}

export async function monthlyPageViews(
  env: AnalyticsEnv,
  startIso: string,
  endIso: string,
) {
  const dataset = normalizeDataset(env.ANALYTICS_DATASET);
  const result = await queryAnalyticsEngine(
    env,
    `SELECT blob1 AS path, any(blob2) AS title, SUM(_sample_interval) AS views FROM ${dataset} WHERE timestamp >= toDateTime('${startIso}') AND timestamp < toDateTime('${endIso}') GROUP BY path ORDER BY views DESC LIMIT 200 FORMAT JSON`,
  );
  const views = new Map<string, number>();
  for (const row of result.data || [])
    views.set(String(row.path), Number(row.views || 0));
  return views;
}
