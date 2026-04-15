# ADR-0005: Renderer Bridge And Spatial Analysis

## Status

Accepted — 2026-04-14

## Context

After `scene-authoring` became the single spatial authority in Batch 25, Build still needed a real interaction layer. The risk was that the product would either:

1. keep a decorative pseudo-viewport in the app shell and never attach real runtime behavior, or
2. let renderer/runtime assumptions leak directly into generic UI modules and recreate a second authoring authority.

At the same time, playability and performance still depended too heavily on metadata heuristics instead of scene truth.

## Decision

Use a renderer-bridge architecture where:

- `scene-authoring` owns the generic render snapshot contract, spatial analysis, and interaction/state models
- the desktop app owns a local renderer adapter that consumes the generic snapshot and emits selection/drag/camera signals back through package-owned services
- runtime undo/redo stays attached to `scene-authoring` history rather than a renderer-local stack
- performance and playability consume scene-derived telemetry and spatial analysis instead of inventing parallel heuristics

The first concrete renderer adapter is a canvas-backed viewport. It is an implementation detail of the desktop Build workspace, not a new domain authority.

## Consequences

Positive:

- Build now has a real renderer-backed path without coupling shared packages to a specific 3D engine
- scene-authoring remains the only spatial truth for terrain, routing, and simulator geometry
- playability and performance now react to real scene conditions
- future renderer evolution can swap adapters without reworking the package contracts again

Tradeoffs:

- the current renderer is still a bridge layer, not the final high-fidelity 3D authoring runtime
- direct sculpting, full gizmo manipulation, and deeper collision/sightline analysis still need another batch

## Follow-up

- attach higher-fidelity viewport rendering and gizmo interaction without breaking the bridge contract
- deepen terrain sculpting and routing editing tools
- extend collision, sightline, and landing analysis into richer authoring diagnostics
- feed renderer/runtime telemetry into performance profiles more precisely
