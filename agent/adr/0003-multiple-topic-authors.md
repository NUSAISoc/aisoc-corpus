# ADR 0003: Represent Topic Authors as a List

## Status

Accepted

## Context

Corpus Topics can be co-authored, but the Content Collection previously stored one `author` string. Joining usernames into that string fails frontmatter validation and causes the reader, search index, and structured metadata to treat multiple people as one invalid GitHub account.

## Decision

- Replace `author` with a required, non-empty, ordered `authors` list in Corpus Topic frontmatter.
- Treat every entry as an equal co-author identified by a GitHub username-style value.
- Migrate the corpus and every consumer atomically; do not support both metadata shapes.
- Preserve author order in the reader, topic discovery, and structured metadata.
- Keep the existing multi-value `tags` contract unchanged.

## Consequences

- **Benefit:** Co-authors receive independent attribution, valid profile links, search indexing, and schema.org `Person` entries.
- **Benefit:** Contributors use one unambiguous metadata shape for both single- and multi-author topics.
- **Tradeoff:** Every existing topic must use list syntax, including topics with one author.
- **Tradeoff:** Older topic files using `author` fail validation and must be migrated before building.
