# Scene Authoring And 3D Placement System

## Status

Approved as a product-critical pillar and now implemented through the renderer bridge, spatial simulator binding, direct-manipulation, terrain sculpting, higher-confidence spatial analysis, spatial-trust/export-diagnostics hardening, the first operational persistence/restore/release-convergence pass, the first native/runtime-fidelity and candidate-build execution convergence pass, and GSPro recipe-linked release execution with clearer host-verification posture.

## Purpose

Define the first-class 3D placement and scene-authoring system for Course Creator OS.

This system is the missing build substrate between planning metadata and true course creation. It owns spatial scene state, terrain/routing geometry, hierarchy, transform editing, selection, snapping, placement layers, viewport state, and the first build-facing path toward simulator-spatial truth.

## 1. Architecture

### 1.1 Owned Domain

The scene-authoring system owns:

- scene entities and transforms
- terrain surfaces, profiles, regions, and modifiers
- routing nodes, segments, and connected paths
- fairway corridors and playable zone geometry
- placement layers and filtering
- grouping and hierarchy state
- selection and gizmo posture
- snapping and pivot behavior
- placement action history
- viewport/camera/overlay authoring state
- scene collections for major authoring scopes

### 1.2 Package Boundary

Primary package:

- `packages/scene-authoring`

This package is distinct from:

- `world-system`, which owns world identity, districts, landmarks, and support-space planning
- `asset-system`, which owns asset registry and normalization health
- `sim-logic`, which owns simulator logic and gameplay correctness

`scene-authoring` is the spatial assembly layer that brings those domains into a placed scene.

### 1.3 App Integration

The system is surfaced through the `Build` module as a first-class workspace with:

- viewport scaffold
- scene outliner
- transform inspector
- snapping controls
- validation overlays
- density/performance overlays
- quick placement actions

### 1.4 Persistence Contract

Project truth now includes:

- `build/scene-authoring.json`
- `build/SCENE_AUTHORING.md`
- `versioning/snapshot-bundles.json`

Scene state is also indexed in SQLite through `scene_objects_index`.

Spatial terrain, routing, and simulator binding support now add:

- `terrain_regions_index`
- `routing_paths_index`
- `simulator_spatial_bindings_index`
- `index_state`
- `spatial_trust_reports`

Spatial trust and index diagnostics now persist alongside local indexed state through:

- `.course-creator-os/index-manifest.json`
- `.course-creator-os/spatial-trust-report.json`
- `.course-creator-os/project-index.sqlite3`

### 1.5 Compatibility And Integration Direction

The system preserves a path to GSPro-compatible output and managed integrations through:

- `binding` metadata on scene objects for gameplay/spatial entities
- `exportRole` on bindings to distinguish gameplay-critical vs visual-only objects
- `managedBridgeMode` on scene objects so future managed integrations can own specific placed objects without leaking tool-specific assumptions into UI modules
- recipe-linked release execution where Package, Preview, and Publish consume the same geometry-trust and host-verification truth

## 2. Data Model

### 2.1 Core Types

- `SceneObject`
- `Transform`
- `PlacementMode`
- `SelectionState`
- `SceneGroup`
- `ParentRelationship`
- `PlacementLayer`
- `PlacementConstraint`
- `SnapSettings`
- `GizmoMode`
- `SceneCollection`
- `PlacementHistoryAction`
- `SceneAuthoringState`
- `TerrainSurface`
- `TerrainProfile`
- `TerrainRegion`
- `TerrainModifier`
- `RoutingNode`
- `RoutingSegment`
- `RoutingPath`
- `FairwayCorridor`
- `GreenZone`
- `TeeZone`
- `HazardZone`
- `OutOfBoundsZone`
- `DropZoneArea`
- `VisibilityCorridor`
- `PlayRouteEnvelope`
- `ViewportState`
- `CameraState`
- `TransformInteractionPipeline`

### 2.2 Key Entity Rules

- `SceneObject` is a placed entity with transform, layer, category, visibility, locking, constraints, and optional export binding.
- `Transform` carries `position`, `rotation`, `scale`, `pivotOffset`, and `originPreset`.
- `SceneGroup` is an outliner-level grouping construct with its own pivot and layer membership.
- `ParentRelationship` keeps hierarchy explicit rather than hiding it inside UI state.
- `SelectionState` owns object/group selection, filter categories, transform space, and pivot mode.
- `SnapSettings` owns grid, terrain, surface, rotation, scale, and upright behavior.
- `SceneCollection` provides a durable authoring scope for major scene sets.
- `PlacementHistoryAction` is the first durable path toward undo/redo and authoring diagnostics.
- Terrain and routing entities keep hole-scale playable geometry in the same substrate as placed scene objects.
- Simulator-critical geometry stays in `scene-authoring`; `sim-logic` consumes it through typed spatial bindings.

### 2.3 Supported Categories

- `gameplay-course-object`
- `structure`
- `prop`
- `landmark`
- `vegetation`
- `supporting-scenery`
- `animated-set-piece`

## 3. Workspace Design

### 3.1 Viewport Workspace

The viewport now uses a renderer-bridge architecture rather than a decorative mock stage.

The current concrete adapter is a canvas-backed Build viewport that consumes package-owned render snapshots and emits camera, selection, drag, and interaction signals back through `scene-authoring` services.

It already supports:

- placement mode controls
- authoring modes for placement, terrain, routing, and simulator anchors
- gizmo mode controls
- local/world transform mode
- quick actions for duplicate, group, ungroup, lock, unlock, hide, show, undo, and redo
- validation, terrain, routing, simulator-anchor, density, performance, and hidden-object overlay toggles
- selection visualization, hit testing, and drag-commit interaction on renderer primitives
- terrain/routing/simulator anchor visualization through generic render snapshots
- viewport camera posture and runtime interaction-pipeline state
- direct-manipulation interaction targets for move, rotate, scale, routing bends, and corridor width refinement
- hover, active-target, and drag feedback synchronized through package-owned selection state
- terrain sculpt brush state and first usable sculpting strokes
- richer routing-handle editing through corridor, segment, and envelope interactions

### 3.2 Scene Outliner

The outliner provides:

- hierarchy visibility
- object/group selection
- append-to-selection behavior for multi-select
- collection switching
- category filtering by object type

### 3.3 Transform Inspector

The inspector provides:

- position editing
- rotation editing
- scale editing
- pivot offset editing
- origin preset selection
- pivot mode selection
- snapping controls

### 3.4 Overlay UX

Overlay UX is intentionally part of the workspace contract, not an afterthought:

- validation overlay
- terrain overlay
- routing overlay
- simulator-anchor overlay
- density overlay
- performance overlay
- hidden ghost overlay

### 3.5 Editing UX

The Build workspace now includes creator-facing editing tools for:

- creating and classifying terrain regions
- assigning gameplay purpose to spatial regions
- creating and editing routing nodes and segments
- generating and editing fairway corridors, tee zones, and green zones
- creating hazard areas, OB boundaries, drop zones, and preview anchors
- in-context simulator geometry authoring while preserving `scene-authoring -> sim-logic -> validation/readiness`
- history-backed undo/redo over scene, terrain, routing, and simulator-anchor edits
- viewport-driven terrain sculpting with raise, lower, smooth, and flatten concepts
- richer camera behavior through pan, orbit, zoom, and focus-selection posture
- higher-confidence analysis surfaces for occlusion and preview-framing weakness
- runtime-tier visibility and stronger overlay/render-pass posture for a more fidelity-aware Build environment
- candidate-build awareness and release-path feedback tied to the shared geometry-trust layer

## 4. Package Structure

### 4.1 `packages/scene-authoring`

Files:

- `models.ts`
- `create.ts`
- `services.ts`
- `renderer.ts`
- `analysis.ts`
- `summary.ts`
- `scene-authoring.test.ts`
- `index.ts`

### 4.2 Cross-Package Wiring

- `project-model` now owns `sceneAuthoring` as part of the project aggregate.
- `storage` persists and reloads scene-authoring state, terrain/routing contracts, and simulator-spatial bindings.
- `sqlite` indexes scene objects, terrain regions, routing paths, and simulator spatial bindings.
- `storage` owns spatial index-health snapshots, rebuild execution, SQLite runtime support, and creator-readable drift reports for spatial state.
- `validation` now checks for invalid scene relationships, missing gameplay-critical anchors, routing gaps, and blocked play-route envelopes.
- `sim-logic` binds tees, pins, OB, drop zones, preview anchors, and hole-play refs back to `scene-authoring`.
- `packaging` derives export-geometry diagnostics from shared scene geometry and simulator bindings.
- `packaging` also provides the shared release-convergence layer, candidate-build execution foundations, and release-draft helpers consumed by Preview, Package, and Publish.
- `versioning` now carries snapshot bundles and restore execution tied back to scene-authoring project truth.
- `logging` records spatial-index, recovery, build-execution, and native/runtime diagnostics tied to the same trust model.
- `integration` now provides managed bridge foundations and tool-health/runtime probing that can sit behind release execution without leaking tool assumptions into Build.
- `apps/desktop` surfaces the workspace through `Build`.

## 5. First Production-Grade Scaffold

Implemented now:

- dedicated `scene-authoring` package
- typed spatial/state models
- typed terrain/routing/zone geometry contracts
- pure placement services for select, multi-select, transform changes, duplicate, group, ungroup, lock, hide/show, terrain/routing edits, simulator-zone creation, filtering, routing-gap detection, and runtime undo/redo history
- scene summary helpers and outliner tree generation
- build-facing seed data and project-creation defaults
- persistent file path and SQLite index support for scene, terrain, routing, and simulator bindings
- Build workspace shell with renderer-backed viewport, outliner, inspector, quick actions, snapping, overlays, viewport state, and history
- direct-manipulation viewport interaction contracts for move/rotate/scale, richer routing handles, camera runtime, hover state, and target feedback
- terrain sculpting brush state, terrain modifier authoring, and first usable viewport sculpt strokes
- simulator-facing spatial bindings for tees, pins, hazards, OB, drop zones, route envelopes, and preview framing
- operational SQLite-backed index inspection and rebuild support for authored spatial state
- snapshot bundles and restore execution aligned to the same project-truth scene state
- release convergence that ties Build-authored geometry into Preview, Package, and Publish readiness
- stronger geometry-backed validation and analysis for missing anchors, routing gaps, blocked line of play, sightline concerns, collision/conflict zones, landing-zone obstruction risk, occlusion pressure, preview framing weakness, blocked route envelopes, and invalid zone/entity relationships
- scene-derived telemetry feeding playability and performance posture
- in-context Build authoring for tee anchors, pin targets, hazards, OB, drop zones, and preview anchors
- spatial trust reports, index-health drift diagnostics, and creator-facing recovery signals for long-running scene work
- export-geometry diagnostics that keep package/release readiness tied to the authored geometry instead of app-local heuristics

Not yet implemented:

- a final high-fidelity 3D runtime beyond the current bridge-based canvas adapter
- mesh-aware terrain sculpt previews and higher-precision sculpt falloff behavior
- richer terrain/surface snapping execution against final geometry
- deeper renderer/runtime collision, sightline, occlusion, and density telemetry
- a concrete SQLite executor and full restore execution over the richer spatial index/trust model
- asset-instance geometry telemetry and stronger long-session recovery/index posture

## 6. Next Recommended Build Steps

1. Upgrade the current renderer bridge into a higher-fidelity 3D runtime with more precise gizmos, sculpt feedback, and richer camera posture.
2. Deepen simulator export posture and package diagnostics from the shared scene geometry.
3. Harden recovery, indexing, and long-session trust around the richer authored spatial state.
4. Extend collision, sightline, landing, and occlusion analysis into stronger mesh-aware creator diagnostics.
5. Add renderer/runtime telemetry and asset-load analysis so performance overlays become profile-trustworthy.
