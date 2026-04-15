# Risks And Mitigations

## Purpose

This register tracks the risks most likely to damage product quality, delivery integrity, or creator trust if left unmanaged.

## Risk Register

| ID | Risk | Trigger Signal | Impact | Owner | Mitigation | Current Posture |
| --- | --- | --- | --- | --- | --- | --- |
| R-001 | Overfitting to the flagship theme park course | New schemas, labels, or features only make sense for theme-park content. | The platform becomes a niche tool instead of a category leader. | WORLDSMITH | Keep domain language and module contracts theme-agnostic while using the flagship as a stress test, not the schema template. | Active monitoring |
| R-002 | Rebuilding heavy external capabilities too early | Pressure grows to replace mature tooling before the product has equivalent depth. | Delivery slows while capability and reliability drop. | DEEP CURRENT | Keep managed integrations behind stable contracts and own the UX shell natively where creator confidence matters most. | Active monitoring |
| R-003 | Weak simulator logic modeling | Gameplay rules are represented as notes or UI fields without enforceable contracts. | Export readiness becomes unreliable and trust collapses. | FAIRWAY MIND | Keep tee, pin, surface, hazard, drop-zone, and metadata logic in owned schemas plus validators. | Active mitigation |
| R-004 | Shell polish outruns persistence and domain reality | Screens look premium but remain disconnected from real project state. | The product demos well but cannot support serious work. | SPARK ENGINE | Prioritize storage-backed editing, project creation writes, and domain-service wiring in active workspace builds. | Active mitigation |
| R-005 | UI sprawl across many modules | New modules add controls without consistent grammar or health signals. | Creators feel lost and navigation anxiety increases. | VELVET GRID | Enforce shared layout primitives, a dominant primary action, consistent rails, and visible project-health state. | Active monitoring |
| R-006 | Validation arrives too late | Modules ship without issue models, fix paths, or readiness surfaces. | Trust problems surface only near packaging or release. | STEEL CHECK | Keep validators, issue cards, and readiness scoring active during domain implementation rather than after it. | Active mitigation |
| R-007 | Persistence and index layers drift apart | SQLite state starts behaving like the only real source of truth. | Recovery becomes brittle and project portability weakens. | BLUEPRINT | Preserve file-based project truth, version migrations, and index-rebuild capability as non-negotiable rules. | Active monitoring |
| R-008 | Native shell assumptions block forward progress | Local environment lacks Rust/Cargo or native prerequisites. | Execution stalls on native verification instead of product progress. | SPARK ENGINE | Keep the web shell independently runnable and document native prerequisites without making them a blocker for all work. | Known constraint |
| R-009 | Performance posture remains too abstract | Metrics stay summary-level and fail to explain tradeoffs. | Creators cannot make informed optimization decisions. | GLASSHOUSE | Build profile-relative diagnostics, density scoring, and clear safe/caution/risky explanations. | Active mitigation |
| R-010 | Preview and packaging lag behind authoring work | Release-facing systems stay shallow while core editing grows. | The product cannot credibly claim release readiness. | LENSWORK | Start preview metadata, packaging blockers, and publish posture before “finished course” messaging appears. | Planned mitigation |

## Review Expectations

- Revisit this register when a new module begins, a roadmap stage changes, or a blocking issue persists across turns.
- Promote repeated delivery blockers into explicit risks instead of treating them as one-off inconveniences.

## Recorded Assumptions

- The highest-value risks are the ones that threaten trust, not just schedule.
- Mitigations should favor architecture and workflow discipline before adding process overhead.
