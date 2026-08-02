const status = document.querySelector("#status");
const format = (value) =>
  new Intl.NumberFormat("en").format(Math.round(Number(value || 0)));

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}

async function loadReport() {
  const response = await fetch("/api/admin/reports/preview");
  if (!response.ok) {
    location.href = "/admin/login/";
    return;
  }
  const report = await response.json();
  setText("#period", report.period.label);
  const contributors = document.querySelector("#contributors");
  const max = Math.max(...report.contributors.map((row) => row.score), 1);
  if (contributors) {
    contributors.innerHTML = report.contributors
      .map((row) => {
        const width = Math.max(6, (row.score / max) * 100);
        return `<div class="bar-row"><header><span>@${row.author}</span><strong>${format(row.popularity)} views</strong></header><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div></div>`;
      })
      .join("");
  }
  if (status) status.textContent = "Poster preview is ready.";
}

loadReport().catch(() => {
  if (status) status.textContent = "Report preview could not load.";
});
