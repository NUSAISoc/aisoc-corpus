const form = document.querySelector("#login-form");
const status = document.querySelector("#login-status");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!status) return;
  status.textContent = "Checking password...";
  const data = new FormData(form);
  const response = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: data.get("password") }),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    status.textContent = result.error || "Login failed.";
    return;
  }
  location.href = "/admin/";
});
