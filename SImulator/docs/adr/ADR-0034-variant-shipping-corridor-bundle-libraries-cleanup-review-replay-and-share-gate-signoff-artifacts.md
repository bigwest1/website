# ADR-0034 — Variant Shipping Decisions, Corridor Bundle Libraries, Cleanup Review Replay, And Share Gate Signoff Artifacts

## Status

Accepted — 2026-04-15

## Context

Batch 52 made finish-stage proofing materially stronger. Shot variants could be grouped into reusable sets, corridor support could be composed into bundles, cleanup review had historical audit evidence, and the product had a calmer final share gate. The remaining gap shifted again:

1. shot variants still needed explicit shipping decisions rather than only approved primary-vs-alternate posture
2. corridor bundles still needed reusable library behavior rather than only one-off composition
3. cleanup history still needed replayable review posture rather than only audit entries and summaries
4. the final share gate still needed durable signoff artifacts rather than only in-app approval posture

The correction still had to preserve the same package boundaries:

- `preview` remains the authority for shot sequencing, shot approval, variant posture, and shipping posture
- `scene-authoring` remains the authority for corridor support outcomes, corridor-bundle libraries, and cleanup-review replay history
- `packaging` remains the authority for creator-facing packet, delivery, share gate, and signoff artifact posture

## Decision

Course Creator OS will treat variant shipping decisions, corridor bundle libraries, cleanup review replay, and share-gate signoff artifacts as one shared Batch 53 signoff-and-shipping contract.

Concretely:

- `preview` now derives explicit shipping-decision summaries from preview-path, flyover, screenshot, and showcase truth and exposes direct actions to select what should actually ship
- `scene-authoring` now owns reusable corridor-bundle library entries plus replayable cleanup-review summaries on top of the existing cleanup audit trail
- `packaging` now emits a durable `share-gate-signoff` artifact and owns shared signoff-artifact posture consumed across Build, Preview, Package, and Publish
- Build, Preview, Package, and Publish consume those shared summaries instead of inventing screen-local shipping, bundle-library, replay, or signoff logic

## Consequences

### Positive

- creators can decide what actually ships rather than only which variant is approved
- corridor support now reads as a reusable library with favorite, recent, and quick-apply posture instead of a flat bundle list
- cleanup review now carries replayable summary posture rather than only a static audit history
- final share approval now leaves a durable signoff artifact that makes the final gate calmer and more trustworthy

### Tradeoffs

- more finish-stage state now flows between `preview`, `scene-authoring`, and `packaging`, so summary drift would be more visible if contracts diverge
- cleanup replay is still summary- and history-oriented rather than a visual timeline player
- signoff artifacts are still local/generated package artifacts rather than externally verified publishing receipts in this environment

## Follow-on Work

- deepen shipping decisions into clearer shipping manifests and final selected-media posture
- deepen corridor bundle libraries into stronger recommendation and curation workflows
- deepen cleanup replay into timeline-grade review confidence
- deepen signoff artifacts into stronger final share locks and creator-facing signoff confirmation
