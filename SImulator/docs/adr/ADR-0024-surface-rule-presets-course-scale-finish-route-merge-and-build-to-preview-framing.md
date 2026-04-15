# ADR-0024 — Surface Rule Presets, Course-Scale Finish Balance, Route Merge Resolution, And Build-To-Preview Framing

## Status

Accepted — 2026-04-15

## Context

Batch 43 turned placement and brush presets into real libraries, added terrain-finish hotspot overlays, and made route-delivery confidence visible in Build. That materially improved reusable workflow speed and finish-stage trust, but it exposed the next layer of friction:

1. creators could save placement posture, but they still lacked a reusable surface-aware rule library for slope, snap, and suitability behavior during repeated world-dressing passes
2. terrain-finish analytics could point at local hotspots, but creators still needed course-scale intelligence about which holes or regions were strong versus weak
3. route delivery confidence was stronger, but finish-stage route quality still needed a clearer merge-resolution workflow and cleaner join confidence
4. Build and Preview were closer, but creators still needed a calmer shared signal about whether what they were authoring would actually frame well in presentation media

The same guardrails still apply:

- `scene-authoring` remains the single spatial authority
- Build, Preview, and other app-layer surfaces may orchestrate and explain, but they do not own competing spatial or finish-stage truth
- terrain sculpt, terrain finish, and terrain analysis remain distinct capabilities even when surfaced together
- route merge resolution and Build-to-Preview framing must come from package-owned summaries, not screen-local heuristics

## Decision

Course Creator OS will treat surface-rule preset libraries, course-scale terrain-finish balance, route merge resolution, and Build-to-Preview framing as one shared Batch 44 finish-stage contract owned by package logic and surfaced through Build and Preview.

Concretely:

- `scene-authoring` now owns reusable surface-rule presets that capture surface snap posture, orientation posture, slope handling, preferred surface purposes, and pack/category influence for repeated terrain-aware placement passes
- `scene-authoring` now emits course-scale terrain-finish summaries that group finish posture by hole, exposing weak-hole counts, palette-distribution posture, and recommended corrective action beyond local hotspot markers
- routing continuity now reports merge clusters, unresolved merge-node IDs, join width/elevation watches, and hole-level delivery confidence so creators can resolve final route joins more deliberately
- `preview` now emits a shared Build-to-Preview framing summary that combines route-delivery confidence, preview-anchor coverage, minimap/flyover presence, screenshots, and landmark support into one presentation-trust signal
- Build and Preview consume the same shared framing and finish summaries so creators see one finish-stage story instead of parallel interpretations

## Consequences

### Positive

- creators can reuse terrain-aware placement posture instead of rebuilding slope/surface settings each session
- finish quality can now be judged at course scale, which makes final terrain passes more strategic and less reactive
- route merge cleanup becomes easier to trust because merge clusters and unresolved joins are visible as explicit finish-stage signals
- Build and Preview now reinforce the same framing language, which reduces late-stage surprise when presentation quality lags behind worldbuilding intent

### Tradeoffs

- surface-rule presets add another reusable-workflow layer that must stay calm and summary-driven or Build will start to resemble a settings manager
- course-scale finish intelligence is only useful if it stays connected to local correction paths rather than becoming a detached dashboard
- Build-to-Preview framing is stronger, but it still stops short of a fully validated final camera-blocking and delivery choreography system

## Follow-on Work

- deepen surface-rule presets into richer authoring depth where placement suitability and avoidance rules repeat across long sessions
- add stronger Preview-facing camera-blocking and world-readability checks so framing trust extends beyond summary posture
- continue route authoring toward route-finish reconciliation and cleaner merge-resolution correction loops
- keep Preview, Build, and release-facing surfaces aligned on one creator-first finish and presentation language
