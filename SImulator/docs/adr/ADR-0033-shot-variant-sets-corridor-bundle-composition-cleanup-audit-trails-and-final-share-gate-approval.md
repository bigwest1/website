# ADR-0033 — Shot Variant Sets, Corridor Bundle Composition, Cleanup Audit Trails, And Final Share Gate Approval

## Status

Accepted — 2026-04-15

## Context

Batch 51 made finish-stage proofing materially stronger. Shot order could be approved, landmark corridor support kits existed, cleanup review had before/after diffs, and packet proofing could calm the creator before final share. The remaining gap shifted again:

1. shot approval still needed reusable primary-vs-alternate reveal sets rather than one ordered lane
2. corridor support kits still needed composed support bundles rather than only single reusable kits
3. cleanup review still needed historical audit evidence rather than only the latest diff
4. packet proofing still needed a calmer final share gate that decides whether the work is truly trusted to share

The correction still had to preserve the same package boundaries:

- `preview` remains the authority for shot sequencing, shot approval, and reveal-variant posture
- `scene-authoring` remains the authority for corridor support outcomes and cleanup-review history
- `packaging` remains the authority for creator-facing packet, proofing, delivery, and final share approval posture

## Decision

Course Creator OS will treat shot variant sets, corridor bundle composition, cleanup diff audit trails, and final share gate approval as one shared Batch 52 proofing-and-approval contract.

Concretely:

- `preview` now derives reusable shot variant sets from existing preview-path, flyover, screenshot, and showcase truth and exposes direct actions to approve a primary set or compose alternate reveal variants
- `scene-authoring` now records cleanup-review audit entries and supports composed corridor support bundles on top of the existing corridor-kit layer
- `packaging` now owns a final share gate summary that sits above delivery confidence and proofing to answer whether the packet is actually trusted to share
- Build, Preview, Package, and Publish consume those shared summaries instead of inventing screen-local variant, bundle, audit, or approval logic

## Consequences

### Positive

- creators can choose between primary and alternate reveal lanes without losing a calm default shipping path
- corridor support now reads as composable bundles rather than a flat list of isolated fixes
- cleanup review carries historical created/approved/rejected evidence instead of only the latest diff snapshot
- final share approval is now a deliberate gate with calmer variant, bundle, proofing, and delivery confidence signals

### Tradeoffs

- Preview, Build, Package, and Publish now coordinate one more finish-stage contract, which increases surface coupling if the shared summaries drift
- cleanup audit trails are still summary/history oriented rather than a visual timeline or replay viewer
- the final share gate is stronger, but it is still an in-app approval layer rather than a real external publishing workflow in this environment

## Follow-on Work

- deepen shot variants into clearer shipping-decision and signoff posture
- deepen corridor bundles into reusable bundle libraries
- extend cleanup audit trails into replayable review history
- strengthen the final share gate with calmer signoff artifacts and creator-facing approval evidence
