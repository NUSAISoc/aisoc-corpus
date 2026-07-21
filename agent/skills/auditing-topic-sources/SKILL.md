---
name: auditing-topic-sources
description: Audit claims and citations in Corpus Topics and recommend repairs. Use when finding sources or checking factual support, provenance, reproducibility, publication status, lawful access, corrections, or retractions.
---

# Workflow

1. Read `CONTRIBUTING.md` and the target Corpus Topic. Inspect sources relevant to its material claims, expanding the search when support, priority, or consensus is unclear.
2. Record the audit date and build a claim-to-source map. Prioritize definitions, quantitative results, comparisons, historical claims, and claims likely to be disputed or outdated.
3. Verify each source's identity and provenance before using it. Match its title, authors, version, date, venue, and stable identifier against an official publisher, proceedings, DOI, repository, author, or institution page.
4. Inspect the source itself. Do not infer support from a title, search snippet, citation graph, abstract alone, or another model's summary when the claim depends on methods, conditions, or results.
5. Verify that each citation is placed closely enough to identify its exact claim and does not appear to support stronger adjacent claims.
6. Assign a verdict and recommend an exact edit for every finding. Apply repairs only when the user's task explicitly requests them.
7. Run `./scripts/validate-content.sh` and `./scripts/check.sh` when each script exists and is executable. Otherwise report the unavailable check.

# Integrity

- Be honest about what was checked. State when full text, data, code, or an authoritative record was unavailable.
- For priority claims, distinguish the first proposal, formalization, demonstration, and later popularization when relevant. Preserve ambiguity when the historical record is disputed.
- Use reviews and explainers for synthesis, not as substitutes for the original source when asserting who introduced or demonstrated something.
- Match the claim's specificity. Evidence for a related idea does not support a stronger, broader, causal, or universal claim.
- Treat peer review, conference acceptance, arXiv presence, citation count, institutional prestige, and polished presentation as signals, not guarantees of truth.
- Check for corrections, retractions, superseding versions, conflicting evidence, and material author conflicts when they could change the reader's interpretation.
- Check claims about state of the art, adoption, benchmark leadership, publication status, and open research questions as of the audit date.
- Never invent bibliographic details, evidence locations, access status, or a verification result.

# Reproducibility

For empirical claims, record enough context to understand what was actually shown: the task, data, comparison, metric, experimental conditions, and important limitations. Prefer sources that expose methods and evidence. Link to data or code only when their ownership and provenance are clear.

For mathematical or theoretical claims, record the assumptions and identify the relevant definition, theorem, proposition, proof statement, or counterexample.

Use a stable canonical landing page or identifier. Identify the supporting section, page, theorem, table, figure, or experiment whenever it is needed to reproduce the check.

# Access And Legality

- Prefer lawful, freely readable copies from official proceedings, public repositories, institutional archives, or author-controlled pages.
- When the canonical record is paywalled, look for a lawful preprint or accepted manuscript and retain enough metadata to identify the version of record.
- If no lawful free full text exists, minimize reliance on the source. Cite the canonical record only when necessary, disclose the access limitation, and do not claim to have verified text that was not inspected.
- Reject pirate libraries, scraped document hosts, unauthorized mirrors, link farms, and files with uncertain upload history.
- Accept an author-posted textbook or manuscript only when the author's or publisher's public page establishes that the copy was intentionally shared.
- Do not treat free access as proof of permission, provenance, or quality.

# Verdicts

Assign each audited claim one verdict:

- `supported`: the inspected source directly supports the claim under the stated conditions;
- `partially supported`: only a narrower or qualified version is supported;
- `contradicted`: the source or stronger evidence conflicts with the claim;
- `not verified`: provenance, access, or evidence is insufficient.

For every verdict except `supported`, state the exact edit or human check required. Finish with unresolved uncertainties and access limitations; never hide them to make the topic appear complete.

# Output

Return the audit in the final response. Do not create a repository audit file.

```md
Audit date: YYYY-MM-DD

| Claim or passage | Verdict | Source | Evidence location | Support rationale | Required edit | Unresolved limitation |
| --- | --- | --- | --- | --- | --- | --- |
| ... | ... | ... | ... | ... | ... | ... |
```

Include every audited material claim. Keep the support rationale concise and evidence-based. Unresolved findings do not block completion, but must remain visible in the table and must not be described as verified.
