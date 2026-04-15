# ADR-0006: Direct Manipulation, Terrain Sculpting, And Runtime Depth

## Status

Accepted - 2026-04-14

## Context

Batch 26 established the renderer bridge, spatial analysis, terrain/routing contracts, and simulator bindings, but Build still risked feeling like a strong structural shell rather than a genuinely capable authoring environment.

The next step had to deepen interaction without violating the spatial-authority rules established in ADR-0004 and ADR-0005:

- `scene-authoring` must remain the single spatial authority
- the desktop app must not create a second interaction or geometry model
- renderer-specific behavior must remain behind adapter contracts
- Build must become more powerful without collapsing into an internal engineering console

## Decision

Course Creator OS will deepen Build by pushing direct-manipulation interaction, terrain sculpting, richer routing handles, stronger camera/runtime behavior, and higher-confidence spatial analysis through the existing `scene-authoring` package and renderer-bridge path.

This means:

- transform gizmos stay represented as renderer interaction targets, not app-owned geometry tools
- terrain sculpting is authored as package-owned terrain modifiers and brush settings, not viewport-local mutations
- routing refinement continues through shared routing entities, with direct handles mapped back to package services
- hover, active-target, and drag state remain synchronized through `scene-authoring` selection and viewport contracts
- Build surfaces richer analysis and simulator diagnostics, but validation and readiness continue to consume package-owned spatial truth

## Consequences

### Positive

- Build now has a real direct-manipulation path instead of relying on inspector-only geometry changes
- terrain sculpting can evolve without rewriting the persistence model
- routing, terrain, simulator anchors, and analysis remain coherent because they still share one substrate
- playability and performance can consume better scene telemetry without inventing side channels

### Negative

- the current runtime is still a bridge-based canvas implementation rather than the final high-fidelity 3D renderer
- some direct-manipulation depth remains approximate until full 3D gizmos, mesh-aware collisions, and stronger runtime telemetry land
- the package surface becomes richer, which increases the need for disciplined tests and API boundaries

## Follow-Up

- push the renderer bridge toward a higher-fidelity runtime without changing the authority boundary
- harden SQLite indexing, restore execution, and long-running authoring trust around the richer spatial state
- deepen export-grade simulator geometry diagnostics and packaging checks from the same shared geometry
