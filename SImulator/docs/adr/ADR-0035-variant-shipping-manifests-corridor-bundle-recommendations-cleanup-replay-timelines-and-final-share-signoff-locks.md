# ADR-0035 — Variant Shipping Manifests, Corridor Bundle Recommendations, Cleanup Replay Timelines, And Final Share Signoff Locks

## Status

Accepted — 2026-04-15

## Context

Batch 53 made finish-stage signoff materially stronger. Preview could decide which variants should ship, `scene-authoring` could store reusable corridor-bundle libraries and replay cleanup history, and `packaging` could emit durable share-gate signoff artifacts. The next gap shifted again:

1. shot shipping still needed an explicit manifest that says what actually leaves the product versus what stays alternate or held back
2. corridor bundles still needed contextual recommendation and curation instead of only library presence and quick apply
3. cleanup replay still needed timeline-grade inspection rather than only replay summaries and audit entries
4. the final share gate still needed a firmer lock posture rather than only signoff artifacts and approval posture

The correction still had to preserve the same package boundaries:

- `preview` remains the authority for shot sequencing, shot approval, shot variants, shipping decisions, and shipping manifests
- `scene-authoring` remains the authority for corridor support outcomes, corridor-bundle libraries, recommendations, and cleanup-review history
- `packaging` remains the authority for creator-facing delivery confidence, final share-gate approval, and durable lock/signoff artifacts

## Decision

Course Creator OS will treat variant shipping manifests, corridor bundle recommendations, cleanup replay timelines, and final share signoff locks as one shared Batch 54 signoff-and-shipping-confidence contract.

Concretely:

- `preview` now derives shipping manifests from selected, alternate, and held-back variant truth and exposes that state across Build, Preview, Package, and Publish
- `scene-authoring` now derives contextual corridor-bundle recommendations and timeline-style cleanup replay inspection from the existing library and review history
- `packaging` now treats the final share gate as a lock-bearing contract and emits a durable `share-gate-lock` artifact alongside the existing signoff record
- Build, Preview, Package, and Publish consume those shared summaries instead of inventing screen-local manifest, recommendation, replay-timeline, or lock logic

## Consequences

### Positive

- creators can see a calmer manifest of what actually ships, what stays alternate, and what remains held back
- corridor-bundle guidance now recommends the right reusable support bundle instead of forcing creators to infer the best correction from the library alone
- cleanup review history is easier to inspect over time instead of only reading the latest replay or audit snapshot
- final share approval now has a firmer lock posture and durable lock artifact before external sharing

### Tradeoffs

- more finish-stage truth now flows through `preview`, `scene-authoring`, and `packaging`, so summary drift would be more visible if contracts diverge
- cleanup replay is now timeline-grade, but still summary-oriented rather than a fully visual comparison player
- signoff locks are still local/generated package artifacts rather than externally validated publishing receipts in this environment

## Follow-on Work

- deepen manifests into clearer shipping-packet selections and final shipping manifests for creators
- deepen corridor recommendations into auto-curation and stronger bundle guidance
- deepen cleanup replay into richer comparison views and long-lived replay inspection
- deepen signoff locks into calmer locked-share confirmation and stronger final share controls
