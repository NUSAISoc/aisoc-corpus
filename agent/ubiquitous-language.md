# Ubiquitous Language

| Business Term | Technical Symbol | Definition | Constraints | Avoid |
| --- | --- | --- | --- | --- |
| Design Concept | `DesignConcept` | The shared organizing model guiding architecture and implementation choices. | Must be coherent across contexts. | `Idea`, `GeneralModel` |
| Design Tree | `DesignTree` | Living map of open and settled decisions. | Updated when design moves. | `PlanDump` |
| Bounded Context | `BoundedContext` | A domain boundary with explicit ownership and language. | Owns its internal model and API. | `Module` (too generic) |
| Ubiquitous Language | `UbiquitousLanguage` | Shared domain vocabulary in docs and code. | Terms must be stable and explicit. | Ambiguous nouns like `Data` |
| Feedback Loop | `FeedbackLoop` | Generate-check-fix cycle using deterministic tools. | Must include real tool output. | `TryAgainLoop` |
| Entropy Hotspot | `EntropyHotspot` | High-churn and high-complexity area likely to degrade maintainability. | Used for targeted refactoring. | `MessyFile` |
| Vertical Slice | `VerticalSlice` | Smallest end-to-end behavior change through one boundary. | Must be testable in isolation. | `BigRefactor` |
| Adapter | `Adapter` | Boundary object that isolates external systems from domain logic. | Domain must not depend on vendor details. | `ServiceHelper` |
| Seam | `Seam` | Intentional change point for behavior substitution without invasive edits. | Should be protected by tests. | `HackPoint` |
| ADR | `ADR` | Architecture Decision Record for durable decisions. | Required for lasting boundary changes. | `RandomNote` |
| Corpus Topic | `CorpusTopic` | A distinct educational unit containing markdown, LaTeX, and metadata. | Must have validated frontmatter schema. | `Article`, `Page` |
| Knowledge Graph | `KnowledgeGraph` | The visual force-directed interactive node network representing topics and connections. | Rendered in React, supports drag and zoom. | `ObsidianChart`, `Map` |
| Prerequisite Edge | `PrerequisiteEdge` | A directed graph edge representing strict learning sequence dependency. | Must not form cycles (Directed Acyclic Graph). | `HardLink` |
| kNN Relation | `kNNRelation` | A dynamic undirected connection between nodes based on semantic tag similarity. | Calculated based on frontmatter overlap or tag lists. | `SoftLink`, `RelatedTopic` |
| Hover Preview | `HoverPreview` | UI tooltip displaying a snapshot of a topic when hovering over its link. | Loaded asynchronously or from build-time manifest. | `Tooltip` |
| Reviewer Checklist | `ReviewerChecklist` | Pre-merge manual list of checks for PR maintainers. | Verifies quality of explanations, slop, and tone. | `PRRules` |
| Automated Topic Review | `AutomatedTopicReview` | Maintainer-run local review flow that packages changed topic markdown, asks a selected coding agent for advisory feedback, and posts a marked PR comment. | Must remain advisory and must not execute PR code. | `AutoApproval`, `MergeBot` |
| Verification CI | `VerificationCI` | Automated pipeline validating Markdown, LaTeX, citations, and links. | Must run and pass on every pull request. | `BuildCheck` |
