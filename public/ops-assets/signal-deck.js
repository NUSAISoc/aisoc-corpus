const status = document.querySelector("#status");
const format = (value) =>
  new Intl.NumberFormat("en").format(Math.round(Number(value || 0)));

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}

function renderBars(target, rows, labelKey) {
  if (!target) return;
  const max = Math.max(...rows.map((row) => Number(row.views || 0)), 1);
  target.innerHTML = rows
    .map((row) => {
      const label = row[labelKey] || row.path || "unknown";
      const width = Math.max(4, (Number(row.views || 0) / max) * 100);
      return `<div class="bar-row"><header><span>${label}</span><strong>${format(row.views)}</strong></header><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div></div>`;
    })
    .join("");
}

async function load() {
  const response = await fetch("/api/admin/analytics/overview?days=30");
  if (!response.ok) {
    location.href = "/admin/login/";
    return;
  }
  const data = await response.json();
  setText("#range-label", String(data.days));
  setText("#total-views", format(data.summary?.views));
  setText("#unique-pages", format(data.summary?.unique_paths));
  setText("#top-device", data.devices?.[0]?.device || "-");
  renderBars(
    document.querySelector("#top-pages"),
    data.topPages || [],
    "title",
  );
  renderBars(
    document.querySelector("#referrers"),
    data.referrers || [],
    "referrer",
  );
  renderBars(
    document.querySelector("#countries"),
    data.countries || [],
    "country",
  );
  if (status) {
    status.textContent = data.unavailable
      ? "Analytics data is not available yet. Confirm Cloudflare Analytics Engine credentials after deployment."
      : "Signal Deck is live.";
  }
}

load().catch(() => {
  if (status) status.textContent = "Signal Deck could not load analytics data.";
});
