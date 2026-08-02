import { monthlyPageViews, type AnalyticsEnv } from "./corpus-analytics";

export type TopicManifestTopic = {
  slug: string;
  path: string;
  title: string;
  authors: string[];
  updatedDate: string | null;
  wordCount: number;
};

export type ContributorScore = {
  author: string;
  topics: number;
  monthlyTouches: number;
  contributionMagnitude: number;
  popularity: number;
  score: number;
  highlightedTopics: { title: string; path: string; views: number }[];
};

export type ReportPeriod = {
  start: Date;
  end: Date;
  startIso: string;
  endIso: string;
  key: string;
  label: string;
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function previousMonthRange(now = new Date()): ReportPeriod {
  const currentStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const start = new Date(
    Date.UTC(currentStart.getUTCFullYear(), currentStart.getUTCMonth() - 1, 1),
  );
  const end = currentStart;
  return {
    start,
    end,
    startIso: start.toISOString().slice(0, 19).replace("T", " "),
    endIso: end.toISOString().slice(0, 19).replace("T", " "),
    key: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
    label: `${MONTH_NAMES[start.getUTCMonth()]} ${start.getUTCFullYear()}`,
  };
}

function inRange(dateString: string | null, period: ReportPeriod): boolean {
  if (!dateString) return false;
  const time = Date.parse(`${dateString}T00:00:00Z`);
  return time >= period.start.getTime() && time < period.end.getTime();
}

export function scoreContributors(
  topics: TopicManifestTopic[],
  pageViews: Map<string, number>,
  period: ReportPeriod,
): ContributorScore[] {
  const contributors = new Map<string, ContributorScore>();

  for (const topic of topics) {
    const authors = topic.authors?.length ? topic.authors : ["unknown"];
    const authorShare = 1 / authors.length;
    const views = Number(
      pageViews.get(topic.path) || pageViews.get(`/topics/${topic.slug}/`) || 0,
    );
    const effort = Math.max(
      0.8,
      Math.min(4, Number(topic.wordCount || 0) / 900),
    );
    const recentMultiplier = inRange(topic.updatedDate, period) ? 2.4 : 0.7;

    for (const author of authors) {
      const current = contributors.get(author) || {
        author,
        topics: 0,
        monthlyTouches: 0,
        contributionMagnitude: 0,
        popularity: 0,
        score: 0,
        highlightedTopics: [],
      };
      current.topics += authorShare;
      current.monthlyTouches += inRange(topic.updatedDate, period)
        ? authorShare
        : 0;
      current.contributionMagnitude += effort * recentMultiplier * authorShare;
      current.popularity += views * authorShare;
      current.highlightedTopics.push({
        title: topic.title,
        path: topic.path,
        views,
      });
      contributors.set(author, current);
    }
  }

  const rows = [...contributors.values()];
  const maxMagnitude = Math.max(
    ...rows.map((row) => row.contributionMagnitude),
    1,
  );
  const maxPopularity = Math.max(...rows.map((row) => row.popularity), 1);

  return rows
    .map((row) => ({
      ...row,
      score:
        0.55 * (row.contributionMagnitude / maxMagnitude) +
        0.45 * (row.popularity / maxPopularity),
      highlightedTopics: row.highlightedTopics
        .sort((a, b) => b.views - a.views)
        .slice(0, 3),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

export function renderContributorPosterHtml(report: {
  period: ReportPeriod;
  contributors: ContributorScore[];
}): string {
  const top = report.contributors[0];
  const totalViews = report.contributors.reduce(
    (sum, row) => sum + row.popularity,
    0,
  );
  const cards = report.contributors
    .map(
      (row, index) => `
        <article class="contributor-card ${index === 0 ? "is-lead" : ""}">
          <div class="rank">0${index + 1}</div>
          <div>
            <h2>@${escapeHtml(row.author)}</h2>
            <p>${Math.round(row.contributionMagnitude * 10) / 10} contribution units · ${Math.round(row.popularity)} influenced views</p>
          </div>
          <ul>${row.highlightedTopics
            .map(
              (topic) =>
                `<li>${escapeHtml(topic.title)} <span>${Math.round(topic.views)} views</span></li>`,
            )
            .join("")}</ul>
        </article>`,
    )
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8" /><style>
    @import url("https://fonts.googleapis.com/css2?family=Tomorrow:wght@500;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap");
    *{box-sizing:border-box} body{width:1080px;height:1350px;margin:0;overflow:hidden;background:linear-gradient(rgba(204,255,0,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(204,255,0,.08) 1px,transparent 1px),radial-gradient(circle at 15% 10%,rgba(204,255,0,.24),transparent 28%),radial-gradient(circle at 90% 5%,rgba(99,102,241,.28),transparent 34%),#08090d;background-size:42px 42px,42px 42px,auto,auto,auto;color:#f4f5f7;font-family:"JetBrains Mono",monospace}.poster{position:relative;height:100%;padding:70px}.eyebrow{color:#ccff00;text-transform:uppercase;letter-spacing:.24em;font-size:22px;font-weight:700}h1{width:820px;margin:22px 0 18px;font-family:"Tomorrow",monospace;font-size:94px;line-height:.9;letter-spacing:-.06em;text-transform:uppercase}.summary{width:760px;color:#cbd5f5;font-size:25px;line-height:1.35}.lead-ribbon{display:grid;grid-template-columns:1fr auto;gap:26px;align-items:end;margin:48px 0 32px;padding:34px;border:2px solid #ccff00;background:rgba(204,255,0,.09);box-shadow:0 0 34px rgba(204,255,0,.28)}.lead-ribbon strong{display:block;font-family:"Tomorrow",monospace;font-size:52px;color:#ccff00}.lead-ribbon span{color:#a1a1aa;font-size:20px}.metric{text-align:right;font-family:"Tomorrow",monospace;font-size:58px;font-weight:900}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.contributor-card{min-height:176px;padding:22px;border:1px solid rgba(255,255,255,.13);background:rgba(18,18,24,.86)}.contributor-card.is-lead{display:none}.rank{color:#6366f1;font-family:"Tomorrow",monospace;font-size:20px;font-weight:800}h2{margin:6px 0 2px;font-family:"Tomorrow",monospace;font-size:32px;color:#f4f5f7}p{margin:0;color:#a1a1aa;font-size:15px}ul{margin:14px 0 0;padding:0;list-style:none}li{display:flex;justify-content:space-between;gap:14px;padding-top:6px;color:#cbd5f5;font-size:14px}li span{color:#ccff00;white-space:nowrap}.footer{position:absolute;left:70px;right:70px;bottom:58px;display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,.16);padding-top:24px;color:#a1a1aa;font-size:18px}.stamp{color:#ccff00;text-transform:uppercase;letter-spacing:.18em}
  </style></head><body><main class="poster"><div class="eyebrow">AI Soc Corpus contributor report · ${escapeHtml(report.period.label)}</div><h1>Credits where the graph grew.</h1><p class="summary">Recognition is weighted by topic authorship, contribution magnitude, and the pages the community returned to most this month.</p><section class="lead-ribbon"><div><span>Top contributor signal</span><strong>@${escapeHtml(top?.author || "corpus-team")}</strong></div><div class="metric">${Math.round(totalViews)}</div></section><section class="grid">${cards}</section><footer class="footer"><span>NUS AI Society · AI Soc Corpus</span><span class="stamp">Ready to circulate</span></footer></main></body></html>`;
}

export async function buildMonthlyReport(
  env: AnalyticsEnv & {
    ASSETS: { fetch(request: Request): Promise<Response> };
  },
  now = new Date(),
) {
  const period = previousMonthRange(now);
  const manifestResponse = await env.ASSETS.fetch(
    new Request("https://assets.local/data/topics.json"),
  );
  const manifest = manifestResponse.ok
    ? ((await manifestResponse.json()) as { topics?: TopicManifestTopic[] })
    : {};
  const pageViews = await monthlyPageViews(env, period.startIso, period.endIso);
  const contributors = scoreContributors(
    manifest.topics || [],
    pageViews,
    period,
  );
  return {
    period,
    generatedAt: new Date().toISOString(),
    contributors,
    topicCount: manifest.topics?.length || 0,
    posterUrl: "/api/admin/reports/poster.png",
  };
}
