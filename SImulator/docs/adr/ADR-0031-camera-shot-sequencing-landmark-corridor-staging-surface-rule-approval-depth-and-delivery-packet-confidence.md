# ADR-0031 — Camera Shot Sequencing, Landmark Corridor Staging, Surface Rule Cleanup Approval Depth, And Delivery Packet Confidence

## Status

Accepted — 2026-04-15

## Context

Batch 49 moved Course Creator OS into stronger presentation-finish execution, corridor tooling, cleanup review, and share-delivery confidence. The remaining risk was no longer basic posture. It was the last creator-facing finish loop:

1. shot sequencing still needed a clearer package-owned contract beyond path and capture posture
2. landmark corridor work still needed to read as actionable staging rather than only correction tooling
3. cleanup review still needed broader approval-depth confidence before creators could trust course-wide cleanup passes
4. presentation-share delivery still needed a stronger packet-confidence contract across Preview, Package, and Publish

The correction needed to preserve current authorities:

- `preview` stays the owner of sequencing and presentation-media posture
- `scene-authoring` stays the owner of spatial cleanup and corridor-stage actions
- `packaging` stays the owner of delivery-packet confidence and creator-facing handoff truth

## Decision

Course Creator OS will treat shot sequencing, corridor staging, cleanup approval depth, and delivery-packet confidence as one shared Batch 50 finish-stage contract.

Concretely:

- `preview` now owns a dedicated shot-sequencing summary and sequencing-action path in addition to playback and capture posture
- `scene-authoring` now records cleanup reviews with explicit approval depth and broader-approval requirements, and landmark corridor actions now stage selected landmark support as part of corridor repair
- `packaging` now treats delivery-packet trust as more than packet generation alone by carrying packet-confidence, sequencing, corridor-staging, and asset-coverage states in one shared delivery-confidence summary
- Build, Preview, Package, and Publish consume those shared summaries rather than inventing screen-local finish-stage logic

## Consequences

### Positive

- creators get clearer finish-stage sequencing guidance instead of only capture readiness
- landmark corridor work now reads as staged authoring support, not just width adjustments
- cleanup review approval can now distinguish focused, regional, and course-wide confidence
- share delivery now communicates whether the packet is actually trustworthy to show and hand off

### Tradeoffs

- Preview now owns another presentation summary, which increases coordination pressure with Package and Publish
- cleanup review depth is still expressed through approval posture rather than full visual diff tooling
- delivery-packet confidence is stronger, but it still depends on heuristic summary state instead of real external sharing workflows in this environment

## Follow-on Work

- deepen shot sequencing into stronger shot-order approval and proofing
- add stronger corridor-stage kits and support-lane correction tools
- deepen cleanup review into clearer diffing and approval-comparison workflows
- strengthen final share-packet proofing and delivery verification on top of the new confidence contract
