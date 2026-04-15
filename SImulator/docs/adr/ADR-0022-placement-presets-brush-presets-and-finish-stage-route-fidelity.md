# ADR-0022 — Placement Presets, Brush Presets, Terrain Finish Analytics, And Finish-Stage Route Fidelity

## Status

Accepted — 2026-04-15

## Context

Batch 41 made the Build workflow materially faster through the embedded asset drawer, surface-aware placement posture, richer brush rules, terrain-finish consistency visibility, and calmer route continuity polish. That moved the bottleneck again:

1. creators could now work faster in Build, but they still had to recreate good placement and brush settings manually across long sessions
2. terrain finish could be seen, but course-scale finish intelligence was still too thin for confident final passes
3. route editing had better continuity tools, but finish-stage confidence still needed more direct refinement and summary support
4. the Build HUD risked becoming control-rich but memory-poor unless reusable workflows stayed first-class

The same guardrails still apply:

- `scene-authoring` remains the single spatial authority
- reusable presets belong to package-owned authoring state, not app-local UI memory
- terrain sculpt, terrain finish, and terrain analysis must remain separate but connected
- route fidelity tooling must stay in-world and calm rather than regressing into fragmented path tabs

## Decision

Course Creator OS will treat placement presets, brush preset authoring, terrain-finish analytics, and finish-stage route refinement as package-owned creation-speed infrastructure surfaced through the Build HUD.

Concretely:

- `scene-authoring` now owns durable placement presets that capture placement mode, snap posture, orientation behavior, and preferred pack/category context
- `scene-authoring` now owns reusable scenery-brush presets that capture density, spacing, pack influence, weighting, slope limits, and playable-core avoidance behavior
- terrain-finish summaries now report dominant material posture, balance state, completeness state, patchiness, and recommended next action rather than only raw coverage
- routing continuity summaries now report smoothing watches, merge opportunities, finish confidence, and recommended next action for finish-stage passes
- Build now exposes placement preset save/apply flows, brush preset save/apply flows, richer terrain-finish intelligence, and direct finish-stage routing controls without becoming a second authority
- creator guidance and Build overview lenses now treat reusable workflows and finish-stage confidence as first-class parts of the authoring loop

## Consequences

### Positive

- creators can preserve proven placement and brush workflows instead of rebuilding them every session
- terrain finish is easier to evaluate as a course-wide authored system rather than only local paint strokes
- routing now communicates finish-stage confidence more honestly and supports calmer last-mile refinement
- Build keeps its world-first posture while gaining stronger reusable workflow memory

### Tradeoffs

- presets add more surface area, so naming and quick-switch ergonomics must remain disciplined
- terrain analytics must stay actionable and visual instead of drifting toward a dashboard for its own sake
- route fidelity is stronger, but still not the last word on final route authoring depth

## Follow-on Work

- deepen presets into broader reusable preset libraries and faster swap ergonomics
- add stronger terrain-finish balancing overlays and consistency lenses in the viewport
- continue route authoring toward richer final-form continuity, merge, and elevation handles
- keep Build, Asset Library, and release-facing modules converged on one creator-first workflow language
