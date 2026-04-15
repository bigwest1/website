# ADR-0020 — Direct Drag Placement, Live Preview Ghosting, Terrain Finish Depth, And Route Handle Refinement

## Status

Accepted — 2026-04-14

## Context

Batch 39 made the Build workspace more world-first and easier to learn, but creators still had to bridge too much distance between browsing content and acting in the scene.

The highest remaining creation-speed gaps were clear:

1. approved assets could arm placement, but not yet flow through real drag-from-browser placement into the viewport
2. scenery brush, placement, and terrain finish lacked stronger live ghosting before commit
3. terrain finish needed more authored depth than a single material-and-blend switch
4. routing refinement needed clearer width, height, and merge ergonomics in-world without falling into path-tab sprawl
5. the app still needed to preserve package ownership and avoid inventing app-local placement or preview state

The correction had to stay inside the existing architecture guardrails:

- `scene-authoring` remains the only spatial authority
- drag transport can exist in the app layer, but not a second placement model
- renderer/runtime previews must stay bridge-driven from package state
- Build and Asset Library should remain premium shells over package-owned creation behavior

## Decision

Course Creator OS will treat direct drag placement, live authoring previews, terrain finish layering/visibility, and deeper route-handle refinement as package-owned creation-speed infrastructure owned by `scene-authoring`, with the desktop app only handling drag transport and viewport event forwarding.

Concretely:

- Asset Library and Build content-pack palettes now emit structured drag payloads that carry approved placement drafts without creating separate app-owned placement state
- `scene-authoring` now owns a typed `authoringPreview` model for placement, scenery-brush, and terrain-finish preview behavior, including preview source, footprint radius, density, active category, terrain material, and layer context
- the renderer bridge now renders live placement footprints, scenery-brush ghost points, terrain-finish preview footprints, terrain-finish visibility filtering, and route width/height/merge affordances from package-owned state
- terrain finish now captures layer index, opacity, stack role, palette slot, and visibility-mode concepts so sculpt and finish remain distinct while the finish workflow becomes more expressive
- routing refinement now includes package-owned merge tolerance, route-width handles, working-height handles, and merge-aware node movement instead of fragmented route-edit subpanels
- Build HUD guidance now explains drag placement, preview commit/cancel, terrain-finish layering, and route-handle refinement without modal tutorial interruption

## Consequences

### Positive

- creators can drag approved assets from pack-aware browser surfaces directly into the world while keeping browser context intact
- placement, scenery-brush, and terrain-finish actions now provide stronger confidence before commit through live ghosting
- terrain finish is materially more expressive without being collapsed back into sculpting
- routing now feels more tactile and teachable through in-world width, height, and merge refinement
- package boundaries remain intact because app state only transports drag intent and forwards viewport interactions

### Tradeoffs

- the viewport bridge now renders more transient preview primitives, so performance discipline still matters as preview depth grows
- direct drag placement currently improves speed and continuity, but it is not yet the final embedded asset-drawer or surface-snap workflow
- route refinement is materially better, but continuity/elevation polish still has another pass ahead before it reaches the final intended depth

## Follow-on Work

- embed a stronger asset drawer directly into Build so creators need the separate library less often during heavy placement sessions
- add surface-snap/orientation-aware placement refinement and richer ghosting for single objects
- deepen scenery-brush rules around terrain/slope/content distribution without turning the brush into a black box
- add terrain-finish consistency and coverage lenses that help creators judge finish quality at course scale
- continue refining route continuity and elevation workflows without fragmenting routing into over-tabbed UI
