#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

GENERATED_PATHS=(
  "src/lib/backlinks.json"
  "src/lib/graph-data.json"
)

fail() {
  printf "ERROR: %s\n" "$*" >&2
  exit 1
}

for rel in "${GENERATED_PATHS[@]}"; do
  if git -C "${ROOT_DIR}" ls-files --error-unmatch "${rel}" >/dev/null 2>&1; then
    fail "${rel} is generated and must not be committed. Run npm run generate:data locally instead."
  fi
done

if [[ -n "${GITHUB_BASE_REF:-}" ]]; then
  git -C "${ROOT_DIR}" fetch --no-tags --depth=1 origin "${GITHUB_BASE_REF}" >/dev/null 2>&1 || true
  base_ref="origin/${GITHUB_BASE_REF}"
elif git -C "${ROOT_DIR}" rev-parse --verify origin/main >/dev/null 2>&1; then
  base_ref="origin/main"
else
  base_ref=""
fi

if [[ -n "${base_ref}" ]]; then
  changed_paths="$(git -C "${ROOT_DIR}" diff --name-only "${base_ref}...HEAD" -- "${GENERATED_PATHS[@]}" || true)"
  if [[ -n "${changed_paths}" ]]; then
    fail "generated artifacts changed in this branch: ${changed_paths//$'\n'/, }"
  fi
fi

printf "check-generated-artifacts: OK\n"
