# ADR-0021 — Embedded Asset Drawer, Surface-Snap Placement, Brush Rule Depth, Terrain Finish Consistency, And Route Continuity Polish

## Status

Accepted — 2026-04-15

## Context

Batch 40 made Build materially faster and more tactile, but the next creation-speed gap was no longer basic placement or preview support. The missing layer was tighter continuity inside the active world-building loop:

1. creators still had to lean too much on the separate Asset Library during heavy placement sessions
2. placement preview existed, but surface posture and slope confidence needed to become clearer and more actionable
3. scenery brush still needed explicit authored rules beyond density and broad variance
4. terrain finish had layering depth, but not enough visibility into coverage and consistency at course scale
5. routing had better width/height handles, but continuity and elevation polish still needed a calmer correction path

The correction still had to preserve the existing guardrails:

- `scene-authoring` remains the single spatial authority
- Build can expose faster workflows, but it cannot create a second placement, brush, or routing model
- Asset Library and Build should share pack and approved-asset truth rather than fork it
- guidance should stay embedded, dismissible, and creator-friendly instead of becoming modal tutorial spam

## Decision

Course Creator OS will treat the embedded asset drawer, surface-aware placement posture, deeper brush rules, terrain-finish consistency summaries, and route continuity polish as package-owned creation infrastructure surfaced through the Build HUD.

Concretely:

- Build now carries an embedded asset drawer that uses the existing approved content-pack palette, recent-placement history, category/tag filters, and direct arm-or-drag placement without abandoning the viewport workflow
- `scene-authoring` now resolves placement poses with explicit surface labels, slope degrees, snap mode, and optional orientation-aware posture instead of exposing only a generic snapped point
- scenery brush settings now include category weights, asset weights, minimum spacing, pack influence, playable-core avoidance tendency, and slope limits so creators can bias the result without entering opaque procedural territory
- terrain-finish summaries now expose coverage, unpainted regions, layered regions, and palette usage so finish quality can be judged as a course-wide consistency problem rather than a hidden brush detail
- routing continuity now has explicit continuity, width, and elevation watch summaries plus local segment smoothing and hole-level polish actions instead of requiring creators to infer continuity issues from raw route geometry alone
- Build HUD guidance and viewport feedback now explain drawer usage, live surface-snap posture, brush-rule depth, terrain-finish consistency, and continuity polish in place

## Consequences

### Positive

- creators can stay in Build for longer placement sessions without losing pack, recent-asset, or brush context
- placement now reads more honestly on sloped or authored surfaces before commit
- brush workflows are stronger without becoming black-box procedural generation
- terrain finish now has a clearer “is this course visually coherent yet?” signal
- routing refinement becomes easier to trust because continuity and elevation drift are surfaced directly

### Tradeoffs

- Build now carries more in-panel controls, so the HUD must stay disciplined to avoid recreating tab sprawl in a new form
- brush rules are more expressive, but they still are not full preset-driven world-dressing systems yet
- terrain finish and routing now have clearer quality signals, but the final best-in-class pass still needs deeper analytics and higher-fidelity direct manipulation

## Follow-on Work

- add placement and brush presets that let creators save and reapply proven pack-and-rule combinations
- deepen terrain-finish analytics beyond coverage into more explicit course-scale consistency and material-balance signals
- continue route authoring toward stronger final continuity/elevation handles and clearer finish-stage route confidence
- keep Build and Asset Library converged while avoiding duplicate browser models
