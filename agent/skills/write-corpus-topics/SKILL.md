---
name: write-corpus-topics
description: Write connected AI primers. Use when drafting or revising Corpus Topics that explain where a concept fits and how it works.
---

# Workflow

1. Read `CONTRIBUTING.md`, the target Corpus Topic, and only the related topics needed for context.
2. Draft or revise the topic while preserving valid frontmatter and useful WikiLinks.
3. For every new topic or revision that materially changes factual claims or citations, load and follow `agent/skills/auditing-topic-sources/SKILL.md` against the final wording and citation placement. Skip this step for copyediting-only changes.
4. Include the source audit's dated claim-level table in the final response. Report unresolved findings without presenting them as verified; they do not block completion.
5. Run `./scripts/validate-content.sh` and `./scripts/check.sh`; repair topic-related failures.

# Purpose

Give readers both a map and a mechanism. The map shows why the concept exists, where it fits, what it builds on, how it differs from nearby ideas, and what it enables. The mechanism covers its inputs, steps, assumptions, mathematics, and practical behavior. Include both, but let their proportions follow the topic.

Write at three depths:

- Help newcomers find their bearings early.
- Give enthusiasts a working technical understanding.
- Give student researchers precise details, caveats, and paths for further study.

# Voice

Write like a knowledgeable senior guiding a capable junior. Take a clear explanatory position: decide what matters, what surprises, and what readers may confuse, then organize around it.

Use concrete language, varied sentence rhythm, and occasional analogies. Never let an analogy replace the real mechanism.

Avoid canned introductions, rhetorical padding, fake anecdotes, em dashes, generic praise, and conclusions that repeat the opening. Do not invent personal experiences or force an informal tone.

# Exposition

Alternate context with technical detail. Give readers enough context to care about a mechanism, then show how it works and what follows.

Use only the moves that help:

- motivate the problem and alternatives;
- establish a useful mental model;
- trace the process from inputs to outputs;
- work through an example, diagram, or algorithm trace;
- compare nearby approaches on the same terms;
- correct likely misconceptions;
- explain assumptions, tradeoffs, and failure modes;
- include extensions that change a capability or assumption;
- connect meaningful prerequisites and next topics.

Explain why connections matter. Use WikiLinks to create useful learning paths.

Do not force fixed headings. Taxonomies, timelines, and paper lists may support the explanation, but must not replace it.

# Mathematics

Include the mathematics needed for honest understanding. Define symbols first. Introduce equations in prose, keep notation stable, and explain their role in the mechanism.

Prefer consequential equations over decorative formalism. Separate the central idea from optional derivations. Use numerical examples, geometry, or traces when they clarify the mathematics.

State assumptions and limit claims to the conditions under which they hold. Distinguish established results, observed behavior, interpretation, and speculation.

# Completion

Finish when readers can place the concept, explain its mechanism, interpret its central mathematics, distinguish it from nearby ideas, recognize its main limitations, and understand what it enables or prepares them to study next.

For work requiring a source audit, finish only after returning the dated audit table. Leave unresolved claims unchanged when necessary, but identify their verdict, required edit, and limitation explicitly.
