# ADR-0026 — Camera Path Authoring Depth, Landmark Readability Correction, Surface Rule Coverage Mapping, And Final Release Presentation Confidence

## Status

Accepted — 2026-04-15

## Context

Batch 45 improved deeper surface-rule authoring, Preview camera readability, finish-stage route reconciliation, and release-facing world readability. That created a stronger presentation-confidence layer, but it still left four gaps:

1. camera-path authoring was still implied through flyovers, screenshots, minimaps, and showcase sequences rather than summarized as one creator-facing authoring-confidence model
2. landmark-readability issues were visible, but creators still lacked a clearer correction posture spanning Build, Preview, Package, and Publish
3. surface-rule authoring could express stronger intent, but course-scale coverage visibility still was not explicit enough to show where rules were active, weak, or conflicting
4. release-facing presentation confidence still depended on combining several adjacent summaries mentally instead of reading one calm final presentation posture

The existing rules remain unchanged:

- `scene-authoring` remains the single spatial authority
- `preview` owns preview- and presentation-facing summary logic, not screen-local heuristics
- desktop surfaces may explain and orchestrate shared presentation signals, but they do not become competing authorities
- new visibility layers must stay calm, visual, and creator-readable rather than becoming engineering consoles

## Decision

Course Creator OS will treat camera-path authoring depth, landmark-readability correction, surface-rule coverage mapping, and final release-presentation confidence as one shared Batch 46 presentation-stage contract.

Concretely:

- `preview` now owns shared summaries for camera-path authoring confidence, landmark-readability correction, and final release-presentation confidence, on top of the existing Build-to-Preview framing and Preview camera readability summaries
- `scene-authoring` now owns a shared surface-rule coverage mapping summary and a dedicated surface-rule coverage overlay so creators can see where rules are active, weak, guarded, or conflicting without leaving the world-first Build flow
- the desktop app now uses one `presentation-insights` adapter to feed Build, Preview, Package, and Publish the same camera-path, landmark-correction, and final-presentation story
- Build remains the place where surface rules, preview anchors, and authoring context are corrected, while Preview, Package, and Publish remain presentation and release surfaces over the same shared truth

## Consequences

### Positive

- creators can now judge whether flyovers, screenshots, showcase flows, and landmark support are complete enough without parsing several separate module-local signals
- surface-rule coverage is now visible at course scale and in-world, which makes terrain-aware placement behavior easier to trust and correct
- Package and Publish can now speak about final release presentation using the same language as Build and Preview instead of inventing separate share-readiness heuristics
- the new overlay and summary layer stays package-owned, which preserves the single-spatial-authority rule

### Tradeoffs

- the product now has more presentation-stage signals, so the UI must stay summary-first or it risks feeling like a diagnostics dashboard
- camera-path authoring is still confidence-oriented rather than a full cinematic editor, which is deliberate but means deeper shot-editing will still need future work
- surface-rule coverage mapping makes gaps and conflicts much clearer, but it does not yet provide the full corrective authoring workflow on its own

## Follow-on Work

- deepen camera-path authoring from confidence summaries into stronger playback and shot-polish workflows
- add clearer landmark-correction actions, not only better landmark-correction posture
- push surface-rule coverage from mapping into stronger conflict-resolution and course-scale correction flows
- keep tightening share-ready presentation confidence across Preview, Package, and Publish without breaking the calm world-first product tone
