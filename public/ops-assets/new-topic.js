const form = document.querySelector("[data-topic-form]");
const titleInput = document.querySelector("[data-title]");
const slugInput = document.querySelector("[data-slug]");
const statusEl = document.querySelector("[data-form-status]");
const readingList = document.querySelector("[data-reading-list]");
const readingTemplate = document.querySelector("[data-reading-template]");
const addReadingButton = document.querySelector("[data-add-reading]");

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function collectFurtherReading() {
  return Array.from(document.querySelectorAll(".reading-row")).map((row) => {
    const title = row?.querySelector("[data-reading-title]");
    const url = row?.querySelector("[data-reading-url]");
    return {
      title: title instanceof HTMLInputElement ? title.value.trim() : "",
      url: url instanceof HTMLInputElement ? url.value.trim() : "",
    };
  });
}

function setStatus(message, state = "idle") {
  if (!statusEl) return;
  statusEl.textContent = message;
  if (statusEl instanceof HTMLElement) statusEl.dataset.state = state;
}

titleInput?.addEventListener("input", () => {
  if (
    titleInput instanceof HTMLInputElement &&
    slugInput instanceof HTMLInputElement &&
    !slugInput.dataset.touched
  ) {
    slugInput.value = slugify(titleInput.value);
  }
});

slugInput?.addEventListener("input", () => {
  if (!(slugInput instanceof HTMLInputElement)) return;
  slugInput.dataset.touched = "true";
  slugInput.value = slugify(slugInput.value);
});

addReadingButton?.addEventListener("click", () => {
  const fragment =
    readingTemplate instanceof HTMLTemplateElement
      ? readingTemplate.content.cloneNode(true)
      : null;
  if (fragment) readingList?.insertBefore(fragment, addReadingButton);
});

readingList?.addEventListener("click", (event) => {
  const target = event.target;
  if (
    target instanceof HTMLElement &&
    target.matches("[data-remove-reading]")
  ) {
    target.closest(".reading-row")?.remove();
  }
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!(form instanceof HTMLFormElement)) return;

  const formData = new FormData(form);
  formData.set("furtherReading", JSON.stringify(collectFurtherReading()));
  const images = formData
    .getAll("images")
    .filter((entry) => entry instanceof File && entry.size > 0);
  formData.delete("images");
  for (const image of images) formData.append("images", image);

  setStatus("Creating branch and pull request...", "loading");
  const submitButton = form.querySelector("button[type='submit']");
  submitButton?.setAttribute("disabled", "true");

  try {
    const response = await fetch("/api/admin/submissions/topic", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      const issueText = Array.isArray(result.issues)
        ? result.issues
            .map((issue) => `${issue.field}: ${issue.message}`)
            .join(" ")
        : result.error || "Submission failed.";
      setStatus(issueText, "error");
      return;
    }
    setStatus(
      `Pull request created: ${result.pullRequest.pullRequestUrl}`,
      "success",
    );
    form.reset();
  } catch {
    setStatus(
      "The pull request could not be created. Check the Worker logs and GitHub token.",
      "error",
    );
  } finally {
    submitButton?.removeAttribute("disabled");
  }
});
