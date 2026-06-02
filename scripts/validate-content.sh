#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOPICS_DIR="${ROOT_DIR}/src/content/topics"

fail() {
  printf "FAIL: %s\n" "$*" >&2
  exit 1
}

# 1. Frontmatter required fields check
printf "Validating frontmatter...\n"
required_fields=("title" "description" "difficulty" "category" "domains" "tags")

for f in "${TOPICS_DIR}"/*.md; do
  [ -f "$f" ] || continue
  basename_f="$(basename "$f")"
  for field in "${required_fields[@]}"; do
    if ! grep -q "^${field}:" "$f"; then
      fail "${basename_f}: missing required field '${field}'"
    fi
  done
  # Validate difficulty is one of the allowed values
  diff_val=$(grep "^difficulty:" "$f" | sed 's/difficulty:\s*//')
  case "$diff_val" in
    beginner|intermediate|advanced) ;;
    *) fail "${basename_f}: invalid difficulty '${diff_val}'" ;;
  esac
done
printf "  Frontmatter: OK\n"

# 2. KaTeX equation balance check (multi-line $$ fences must be paired)
printf "Validating LaTeX equations...\n"
for f in "${TOPICS_DIR}"/*.md; do
  [ -f "$f" ] || continue
  basename_f="$(basename "$f")"
  # Count lines that are ONLY $$ (standalone fence lines for multi-line math)
  # Lines like $$...$$ on one line are self-closing and valid
  fence_count=$(grep -cP '^\$\$\s*$' "$f" || true)
  if (( fence_count % 2 != 0 )); then
    fail "${basename_f}: unbalanced display math fence (\$\$ count: ${fence_count})"
  fi
done
printf "  LaTeX: OK\n"

# 3. Internal wikilink broken link check
printf "Validating internal links...\n"
existing_slugs=()
for f in "${TOPICS_DIR}"/*.md; do
  [ -f "$f" ] || continue
  existing_slugs+=("$(basename "$f" .md)")
done

for f in "${TOPICS_DIR}"/*.md; do
  [ -f "$f" ] || continue
  basename_f="$(basename "$f")"
  # Extract wikilink targets
  while IFS= read -r slug; do
    [ -z "$slug" ] && continue
    normalized=$(echo "$slug" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g')
    found=0
    for s in "${existing_slugs[@]}"; do
      if [[ "$s" == "$normalized" ]]; then
        found=1
        break
      fi
    done
    if (( found == 0 )); then
      fail "${basename_f}: broken wikilink [[${slug}]] -> '${normalized}' not found"
    fi
  done < <(grep -oP '\[\[\K[^\]|]+' "$f" || true)
done
printf "  Internal links: OK\n"

# 4. Citation URL format check
printf "Validating citations...\n"
for f in "${TOPICS_DIR}"/*.md; do
  [ -f "$f" ] || continue
  basename_f="$(basename "$f")"
  while IFS= read -r url; do
    [ -z "$url" ] && continue
    if [[ ! "$url" =~ ^https?:// ]]; then
      fail "${basename_f}: citation URL not valid: '${url}'"
    fi
  done < <(grep -oP '^\s+url:\s*["'"'"']?\K[^"'"'"'\s]+' "$f" || true)
done
printf "  Citations: OK\n"

printf "\nAll content validation checks passed.\n"
