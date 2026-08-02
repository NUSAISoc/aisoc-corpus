import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  verifyAdminPassword,
  verifyAdminSession,
} from "../lib/admin-auth";
import {
  buildAnalyticsOverview,
  recordPageview,
  type AnalyticsEnv,
} from "../lib/corpus-analytics";
import {
  buildMonthlyReport,
  renderContributorPosterHtml,
} from "../lib/corpus-report";
import { createTopicSubmissionPullRequest } from "../lib/github-topic-pr";
import {
  TopicSubmissionError,
  parseDelimitedList,
  parseFurtherReadingJson,
  prepareTopicSubmission,
  type TopicCategory,
  type TopicDifficulty,
  type TopicImageInput,
} from "../lib/topic-submission";

type Env = AnalyticsEnv & {
  ASSETS: { fetch(request: Request): Promise<Response> };
  BROWSER?: {
    quickAction(
      action: string,
      payload: Record<string, unknown>,
    ): Promise<Response>;
  };
  EMAIL?: {
    send(message: Record<string, unknown>): Promise<unknown>;
  };
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
  GITHUB_TOKEN?: string;
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_BASE_BRANCH?: string;
  REPORT_RECIPIENT_EMAIL?: string;
  REPORT_FROM_EMAIL?: string;
};

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...init?.headers,
    },
  });
}

function redirect(location: string): Response {
  return new Response(null, { status: 302, headers: { Location: location } });
}

async function login(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse(
      { ok: false, error: "Method not allowed." },
      { status: 405 },
    );
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  if (!(await verifyAdminPassword(payload.password, env.ADMIN_PASSWORD))) {
    return jsonResponse(
      { ok: false, error: "The password is incorrect." },
      { status: 401 },
    );
  }

  if (!env.SESSION_SECRET) {
    return jsonResponse(
      { ok: false, error: "SESSION_SECRET is not configured." },
      { status: 500 },
    );
  }

  return jsonResponse(
    { ok: true },
    {
      headers: {
        "Set-Cookie": await createAdminSessionCookie(env.SESSION_SECRET),
      },
    },
  );
}

function logout(): Response {
  return jsonResponse(
    { ok: true },
    { headers: { "Set-Cookie": clearAdminSessionCookie() } },
  );
}

async function requireAdmin(
  request: Request,
  env: Env,
): Promise<Response | null> {
  if (await verifyAdminSession(request, env.SESSION_SECRET)) return null;
  if (request.headers.get("Accept")?.includes("text/html"))
    return redirect("/admin/login/");
  return jsonResponse(
    { ok: false, error: "Admin session required." },
    { status: 401 },
  );
}

function stringField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function parseTopicImages(
  formData: FormData,
): Promise<TopicImageInput[]> {
  const imageEntries = formData
    .getAll("images")
    .filter((entry) => entry instanceof File);
  return Promise.all(
    imageEntries.map(async (entry) => {
      const file = entry as File;
      return {
        name: file.name,
        type: file.type,
        size: file.size,
        contentBase64: await fileToBase64(file),
      };
    }),
  );
}

async function submitTopic(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse(
      { ok: false, error: "Method not allowed." },
      { status: 405 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse(
      { ok: false, error: "Expected multipart form data." },
      { status: 400 },
    );
  }

  try {
    const submission = prepareTopicSubmission(
      {
        title: stringField(formData, "title"),
        slug: stringField(formData, "slug"),
        description: stringField(formData, "description"),
        authors: parseDelimitedList(stringField(formData, "authors")),
        difficulty: stringField(formData, "difficulty") as TopicDifficulty,
        category: stringField(formData, "category") as TopicCategory,
        domains: parseDelimitedList(stringField(formData, "domains")),
        tags: parseDelimitedList(stringField(formData, "tags")),
        prerequisites: parseDelimitedList(
          stringField(formData, "prerequisites"),
        ),
        furtherReading: parseFurtherReadingJson(
          stringField(formData, "furtherReading"),
        ),
        markdown: stringField(formData, "markdown"),
      },
      await parseTopicImages(formData),
    );

    const pullRequest = await createTopicSubmissionPullRequest(submission, {
      owner: env.GITHUB_OWNER || "NUSAISoc",
      repo: env.GITHUB_REPO || "aisoc-corpus",
      token: env.GITHUB_TOKEN || "",
      baseBranch: env.GITHUB_BASE_BRANCH || "main",
    });

    return jsonResponse({
      ok: true,
      submission: { path: submission.topicPath },
      pullRequest,
    });
  } catch (error) {
    if (error instanceof TopicSubmissionError) {
      return jsonResponse({ ok: false, issues: error.issues }, { status: 400 });
    }
    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Topic submission failed.",
      },
      { status: 502 },
    );
  }
}

async function posterPng(env: Env, useBrowserRun: boolean): Promise<Response> {
  const report = await buildMonthlyReport(env);
  const html = renderContributorPosterHtml(report);

  if (!useBrowserRun || typeof env.BROWSER?.quickAction !== "function") {
    const fallback = await env.ASSETS.fetch(
      new Request(
        `https://assets.local/reports/${report.period.key}-contributor-poster.png`,
      ),
    );
    if (fallback.ok) return fallback;
    return new Response(html, {
      status: 501,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return env.BROWSER.quickAction("screenshot", {
    html,
    viewport: { width: 1080, height: 1350, deviceScaleFactor: 1 },
    screenshotOptions: { type: "png" },
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function sendMonthlyReport(env: Env): Promise<unknown> {
  const report = await buildMonthlyReport(env);
  const imageResponse = await posterPng(env, true);
  const imageBuffer = await imageResponse.arrayBuffer();

  if (!env.EMAIL?.send) throw new Error("EMAIL binding is not configured");
  if (!env.REPORT_RECIPIENT_EMAIL)
    throw new Error("REPORT_RECIPIENT_EMAIL is not configured");

  return env.EMAIL.send({
    to: env.REPORT_RECIPIENT_EMAIL,
    from: env.REPORT_FROM_EMAIL,
    subject: `AI Soc Corpus contributor poster for ${report.period.label}`,
    html: `<p>The ${report.period.label} contributor poster is attached and ready to circulate.</p>`,
    text: `The ${report.period.label} contributor poster is attached and ready to circulate.`,
    attachments: [
      {
        content: arrayBufferToBase64(imageBuffer),
        filename: `aisoc-corpus-${report.period.key}-contributors.png`,
        type: "image/png",
        disposition: "attachment",
      },
    ],
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/analytics/pageview")
      return recordPageview(request, env);
    if (url.pathname === "/api/admin/login") return login(request, env);
    if (url.pathname === "/api/admin/logout") return logout();
    if (url.pathname === "/api/admin/session") {
      return jsonResponse({
        authenticated: await verifyAdminSession(request, env.SESSION_SECRET),
      });
    }

    if (url.pathname.startsWith("/api/admin/")) {
      const blocked = await requireAdmin(request, env);
      if (blocked) return blocked;
      if (url.pathname === "/api/admin/analytics/overview") {
        return jsonResponse(await buildAnalyticsOverview(request, env));
      }
      if (url.pathname === "/api/admin/submissions/topic")
        return submitTopic(request, env);
      if (url.pathname === "/api/admin/reports/preview")
        return jsonResponse(await buildMonthlyReport(env));
      if (url.pathname === "/api/admin/reports/poster.png")
        return posterPng(
          env,
          !["127.0.0.1", "localhost"].includes(url.hostname),
        );
      return jsonResponse(
        { ok: false, error: "Unknown admin endpoint." },
        { status: 404 },
      );
    }

    if (url.pathname.startsWith("/admin") && url.pathname !== "/admin/login/") {
      const blocked = await requireAdmin(request, env);
      if (blocked) return blocked;
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(
    _controller: unknown,
    env: Env,
    ctx: { waitUntil(promise: Promise<unknown>): void },
  ) {
    ctx.waitUntil(sendMonthlyReport(env));
  },
};
