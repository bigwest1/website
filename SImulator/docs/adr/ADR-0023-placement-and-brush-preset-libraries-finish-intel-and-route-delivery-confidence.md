# ADR-0023 — Placement And Brush Preset Libraries, Finish Intel, And Route Delivery Confidence

## Status

Accepted — 2026-04-15

## Context

Batch 42 turned reusable placement and brush behavior into real package-owned presets, and it materially improved terrain-finish analytics plus finish-stage route refinement. That solved the “rebuild the same settings every session” problem, but it exposed the next bottleneck:

1. creators could save presets, but Build still needed a calmer library layer for favorites, recents, and quick-apply behavior during long sessions
2. terrain finish had stronger summaries, but creators still needed clearer in-viewport finish-balance guidance for coverage gaps, patchiness, and dominant-material overuse
3. route refinement was stronger, but finish-stage confidence still needed a clearer “are we ready to trust this route?” signal
4. the Build HUD needed to keep reusable preset workflows and finish-stage confidence visible without turning into a cluttered management panel

The existing architecture guardrails still hold:

- `scene-authoring` remains the single spatial authority
- preset-library metadata belongs to package-owned authoring state, not app-local UI memory
- terrain sculpt, terrain finish, and terrain analysis remain separate but coordinated
- route-delivery confidence must come from package-owned route analysis, not screen-local interpretation

## Decision

Course Creator OS will treat placement preset libraries, brush preset libraries, terrain-finish balancing overlays, and final route-delivery confidence as package-owned creation-speed infrastructure surfaced through Build.

Concretely:

- placement presets now carry favorite, recent-use, and context-summary metadata so Build can expose a real quick-apply library instead of a flat save/apply list
- brush presets now carry the same library posture so creators can switch between reusable dressing passes without losing pack continuity
- terrain-finish analysis now emits region-level hotspot identifiers for coverage gaps, patchy finish, and dominant-material overuse, and the renderer surfaces those as calm in-viewport finish-intel overlays
- routing continuity now reports width harmony, elevation harmony, merge confidence, completion confidence, and overall delivery confidence so creators can finish a route with clearer trust signals
- Build treats preset libraries, finish intel, and route-delivery confidence as part of one world-first workflow lane rather than separate admin or dashboard surfaces

## Consequences

### Positive

- creators can work from favorites and recents instead of re-reading the same preset lists every pass
- terrain finish is easier to correct because the viewport now points at the actual problem regions, not only abstract summary counts
- route finishing is more confidence-building because the creator can see when width, elevation, merge behavior, and completion are drifting apart
- Build keeps its world-first posture while gaining stronger reusable workflow memory and clearer finish-stage trust

### Tradeoffs

- preset libraries add another layer of visible state, so Build must stay disciplined about summaries and avoid turning the drawer into a settings manager
- terrain-finish overlays must stay readable and calm or they will become noise during active creation
- route-delivery confidence is stronger, but it still depends on future runtime and simulator/export verification depth

## Follow-on Work

- deepen preset libraries into broader surface-rule and finish-stage workflow presets where repeated authoring patterns exist
- expand terrain-finish balancing from hotspot overlays into stronger course-scale balancing and corrective overlays
- continue route authoring toward better merge-resolution, route-finish reconciliation, and preview/export-facing confidence checks
- keep Build, Preview, and release-facing surfaces aligned on one creator-first finish language
