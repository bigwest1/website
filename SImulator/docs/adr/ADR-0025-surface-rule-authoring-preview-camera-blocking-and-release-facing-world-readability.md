# ADR-0025 — Surface Rule Authoring Depth, Preview Camera Blocking, Route Finish Reconciliation, And Release-Facing World Readability

## Status

Accepted — 2026-04-15

## Context

Batch 44 turned surface-rule presets into reusable library assets, pushed terrain-finish analysis to course scale, improved merge resolution, and aligned Build with Preview through shared framing summaries. That materially improved finish-stage trust, but it exposed the next friction layer:

1. surface rules were reusable, but creators still lacked a deeper authoring lane for tuning orientation posture, slope handling, preferred and avoided surface purposes, suitability bias, avoidance bias, and pack influence without falling back to hidden heuristics
2. Build-to-Preview framing existed, but creators still needed a clearer shared signal about blocked or weak camera reads in Preview and how that affected release-facing world readability
3. route finish quality still depended too heavily on merge cleanup and continuity metrics alone, without a clearer reconciliation summary for unresolved finish-stage drift
4. Package, Preview, and Publish needed stronger presentation-facing confidence signals so creators could judge whether the course reads well for release, not only whether it is technically complete

The existing architecture rules still apply:

- `scene-authoring` remains the single spatial authority
- `preview` owns preview-facing presentation summaries, not Build
- desktop surfaces may orchestrate and explain shared summaries, but they do not own competing geometry, framing, or release-readability truth
- Build, Preview, Package, and Publish should consume one creator-facing presentation-confidence story

## Decision

Course Creator OS will treat deeper surface-rule authoring, Preview camera blocking/readability, finish-stage route reconciliation, and release-facing world readability as one shared Batch 45 finish-stage and presentation-confidence contract.

Concretely:

- `scene-authoring` now owns a richer `surfaceRuleDraft` authoring posture with slope-handling mode, orientation posture, pack-influence mode, preferred and avoided surface purposes, pack/category bias, and suitability/avoidance tuning, plus a shared authoring-confidence summary
- `scene-authoring` now emits a finish-stage route-reconciliation summary and a package-owned `reconcileRoutingHoleFinish(...)` helper so Build can push active holes toward calmer final delivery without inventing app-local routing logic
- the desktop app now uses shared presentation summaries so Build, Preview, Package, and Publish consume the same Build-to-Preview framing, Preview camera readability, and release-facing world readability signals
- Preview-side camera blocking and release-facing readability remain summary-driven and creator-readable rather than turning into raw diagnostic consoles

## Consequences

### Positive

- creators can author nuanced surface behavior without leaving the world-first Build flow or rebuilding the same rule logic repeatedly
- Preview confidence is clearer because blocked or weak route views are now summarized explicitly instead of being buried in separate issue lists
- route finish cleanup is easier to trust because reconciliation posture sits beside continuity and merge information, not somewhere else in the product
- Package, Preview, and Publish now reinforce the same release-facing world-readability language instead of inventing separate presentation heuristics

### Tradeoffs

- deeper surface-rule authoring adds more controls, so the UI must stay summary-first and avoid collapsing into a technical rules editor
- shared presentation summaries increase coupling between Build and Preview expectations, which means those summaries must stay calm and stable
- route reconciliation helpers improve finish-stage cleanup, but they are still not a full final-form route-authoring system on their own

## Follow-on Work

- deepen surface-rule authoring into coverage mapping and stronger course-wide rule visibility
- push Preview toward richer camera-path authoring and landmark-readability correction
- continue route authoring toward richer final-form reconciliation and delivery confidence
- tighten release-facing presentation confidence across Build, Preview, Package, and Publish without adding dashboard clutter
