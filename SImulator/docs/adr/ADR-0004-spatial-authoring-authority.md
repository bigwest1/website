# ADR-0004: Spatial Authoring Authority

## Status

Accepted — 2026-04-14

## Context

Course Creator OS now has a first-class `scene-authoring` package and Build workspace, but Batch 25 required a deeper decision: where terrain, routing, simulator anchor geometry, and viewport interaction state should live.

There were two risks:

1. storing terrain/routing geometry separately from scene authoring and creating parallel spatial truth
2. extending `sim-logic` into a second geometry store instead of keeping it as simulator-facing bindings over shared world-space entities

Either path would create drift between Build, Gameplay, validation, storage, and eventual export/integration flows.

## Decision

Use `scene-authoring` as the single owned spatial substrate for:

- terrain surfaces, profiles, regions, and modifiers
- routing nodes, segments, and connected paths
- fairway corridors, green zones, tee zones, hazard zones, OB zones, drop-zone areas, visibility corridors, and play-route envelopes
- viewport state, camera posture, authoring mode, overlay state, and transform interaction pipeline
- placement history snapshots that support undo/redo-ready authoring

`sim-logic` must not own duplicate geometry. It owns simulator-facing bindings and readiness over `scene-authoring` entities.

## Consequences

Positive:

- Build, Gameplay, validation, storage, and future export flows share one spatial truth
- simulator-critical entities can be validated against actual authored geometry
- persistence stays human-readable while SQLite indexes remain rebuildable
- future renderer integration can attach to stable viewport and interaction contracts without a second refactor

Tradeoffs:

- `scene-authoring` becomes a more central package and must be kept disciplined
- some validators now span multiple package boundaries through explicit references
- Build still needs deeper renderer and editing behavior before the UX reaches full power

## Follow-up

- deepen renderer-backed interaction on top of the new viewport contracts
- expand geometry-backed validation beyond missing anchors/gaps into richer collision and sightline analysis
- feed terrain/routing and route-envelope telemetry into playability, performance, and packaging confidence
