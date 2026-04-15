# ADR-0028 — Camera Path Correction Tools, Landmark Re-Staging, Surface Rule Cleanup Automation, And Presentation Share Packet Finalization

## Status

Accepted — 2026-04-15

## Context

Batch 47 made presentation playback, landmark correction, rule-conflict cleanup, and share-ready handoff more trustworthy, but it still stopped short of the next direct correction layer:

1. camera-path playback could be diagnosed, but creators still lacked calmer direct correction tools for weak or abrupt segments
2. landmark correction was more actionable, but the Build loop still lacked a stronger in-world re-staging flow for selected landmarks
3. surface-rule conflict handling had become visible and partially correctable, but broader course-region cleanup still needed package-owned automation help
4. the creator had a share-ready handoff summary, but not yet a stronger final presentation share packet artifact that clearly said what was ready to show or still needed polish

The existing authority constraints still hold:

- `scene-authoring` remains the only spatial authority
- `preview` owns shared camera- and presentation-facing correction posture, not screen-local heuristics
- `packaging` owns creator-facing handoff and packet truth, even when it consumes presentation signals
- desktop surfaces may orchestrate and explain those contracts, but they do not become competing authorities

## Decision

Course Creator OS will treat direct camera correction, landmark re-staging, surface-rule cleanup automation, and presentation share packet finalization as one shared Batch 48 correction-and-share contract.

Concretely:

- `preview` now owns shared camera-path correction summaries and direct corrective helpers so Preview can move from diagnosis into calmer correction actions
- `scene-authoring` now owns landmark re-staging actions and broader surface-rule cleanup automation so Build can correct presentation and placement trust without inventing app-local spatial logic
- `packaging` now owns a durable `presentation-share-packet` artifact plus a shared packet-finalization summary so Package, Preview, and Publish all speak the same final presentation language
- Build, Preview, Package, and Publish now share one final Batch 48 story: which camera paths still need correction, which landmarks still need re-staging, how much surface-rule cleanup can be automated safely, and whether the current course is actually ready to hand off as presentation media

## Consequences

### Positive

- creators can now move from playback warnings into direct corrective actions without leaving the calmer Preview workflow
- landmark readability can now turn into an in-world corrective pass instead of remaining an abstract suggestion
- surface-rule cleanup now has broader automation posture, which makes long placement and brush passes more trustworthy
- the release path now has a clearer creator-facing presentation share packet instead of stopping at generic handoff posture

### Tradeoffs

- the shared presentation layer now carries more correction and handoff summaries, so surfaces must stay summary-first to avoid slipping into debug-panel clutter
- landmark re-staging is intentionally lightweight and creator-friendly, which means it is still not a full corridor-editing or cinematic-staging system
- surface-rule cleanup automation is deliberately semi-automatic and draft-owned, so creators still retain the final say over unusual course regions

## Follow-on Work

- add camera capture execution and stronger shot-level correction depth on top of the new correction tools
- deepen landmark correction from selected-object re-staging into broader view-corridor support tools
- expand surface-rule cleanup automation into a stronger review-and-approval workflow for course-scale cleanup passes
- turn the presentation share packet into a more complete media-delivery layer with clearer share confidence and asset coverage
