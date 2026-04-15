# Strategic Capability Expansion Audit

## Status

Prepared on 2026-04-15 as a non-destructive roadmap-integration pass after Batch 49.

This document does not authorize a giant implementation jump. It absorbs broader feature ambition into the current package architecture, release-truth rules, and batch sequence without creating overlapping systems or duplicate authorities.

## Audit Assumption

The repository does not currently contain one checked-in "large expert capability list" document. For this audit, the capability domains named in the user request are treated as the canonical strategic source spine until a fuller source document is committed into the repo.

## Primary Guardrails

- `scene-authoring` remains the only spatial authority for in-world placement, terrain, routing, surface rules, and direct correction flows.
- `preview` remains the authority for shared framing, camera, capture, and presentation-confidence summaries.
- `packaging` remains the authority for release, handoff, delivery, and share-packet truth.
- `asset-system`, `world-system`, `sim-logic`, `validation`, `playability`, and `performance` should be extended through their current contracts before any new package is introduced.
- Large systems that would destabilize the current build sequence are deferred until prerequisite layers mature.

## Classification Legend

- `already implemented`: real product behavior exists and is already owned by a durable package/surface.
- `partially implemented`: meaningful product behavior exists, but depth or operational maturity is still incomplete.
- `architecturally represented but not surfaced`: the models/contracts already acknowledge the capability, but the creator-facing workflow is still thin or absent.
- `missing but strategically important`: the capability is not materially delivered yet and should enter a near-term or mid-term roadmap bucket.
- `missing but should be deferred`: the capability is useful, but should wait until current foundations are stronger.
- `out of near-term scope`: the capability is intentionally outside the next practical delivery windows.

## Capability Domain Audit

| Domain | Classification | Current Repo Posture | Safe Roadmap Posture | Main Architecture Risk |
| --- | --- | --- | --- | --- |
| Core world editing | already implemented | `scene-authoring`, Build, world-first HUD, direct manipulation, presets, history, recovery, and release-linked overlays are real. | Keep deepening fidelity inside current packages. | Creating a second scene model in app or renderer code. |
| Terrain systems | partially implemented | Terrain regions, modifiers, sculpting, finish painting, palette/coverage analysis, and surface rules exist. | Continue material/finish depth and terrain-readability work in `scene-authoring`. | Forking into a second terrain stack or jumping to voxel terrain too early. |
| Surface and ground painting | partially implemented | Material palette, blend modes, layering, coverage analytics, and course-scale finish balance now exist. | Near-term deepen material-balance workflows and creator correction loops. | Collapsing sculpt, finish, and analysis into one cluttered editor. |
| Golf-specific tools | partially implemented | Tee, pin, hazard, OB, drop-zone, preview-anchor, and export-readiness bindings exist in `sim-logic`. | Near-term deepen measurement, play-test, and golf-specific readability tools. | Splitting gameplay truth away from shared scene references. |
| Vegetation and natural environment | partially implemented | Asset categories, scenery brush, content packs, environment zones, and surface-aware placement already support natural dressing. | Near-term add stronger biome/staging presets and course-scale environment continuity. | Introducing a black-box procedural layer that bypasses `scene-authoring`. |
| Water and fluid systems | architecturally represented but not surfaced | Water hazards, `water-carve`, water assets, and water/shoreline environment zones exist in models. | Mid-term evolve into authored shoreline/water workflows within current packages. | Starting full fluid simulation or a separate water editor too early. |
| Spline, path, and routing systems | partially implemented | Routing nodes, segments, paths, merge resolution, corridor tools, reconciliation, and confidence summaries are real. | Continue the current routing lane rather than inventing a second path tool. | Recreating tab-heavy route UX or fragmenting route state. |
| Structures and modular building | partially implemented | Structure categories, grouping, snap posture, presets, and content-pack placement are real foundations. | Near-term add modular kit snapping and reusable assemblies through `scene-authoring` plus `asset-system`. | App-local kit assembly logic or detached building-authority models. |
| Props and object libraries | partially implemented | Asset Library, content packs, embedded Build drawer, recent/favorite usage, and placement continuity are real. | Near-term harden import queue, normalization, and storage-backed asset indexing. | Splitting asset metadata between app state and package truth. |
| Lighting and atmosphere | architecturally represented but not surfaced | Course Bible lighting language, world environment zones, and lighting/effects assets already exist. | Mid-term add direction and presentation-facing lighting posture before runtime lighting systems. | Letting renderer-specific lighting become a second world authority. |
| Dynamic and animated systems | partially implemented | `event-system` and Animation & Events workspace exist, plus animated set-piece categories. | Mid-term deepen sequencing and validation without turning the product into a timeline suite. | Pulling in a heavy DCC-style animation editor too soon. |
| Special gameplay objects | partially implemented | Gameplay-critical scene objects, hazards, drop zones, preview anchors, and simulator bindings exist. | Extend through golf-specific needs first. | Letting novelty object systems sprawl beyond simulator and playability truth. |
| Camera and presentation tools | partially implemented | Preview framing, path authoring, playback polish, correction actions, capture execution, handoff, and share-packet posture exist. | Batch 50 should continue this lane before unrelated large systems. | Turning Preview into a full cinematic editor. |
| Measurement and analysis | missing but strategically important | Validation, playability, performance, framing, and terrain/route summaries exist, but direct ruler/grade/yardage tooling is still thin. | Safe near-term addition after the current Batch 50 sequence. | Duplicated metrics across Build, Preview, Playability, and Packaging. |
| Brushes, stamps, and procedural tools | partially implemented | Scenery brush, sculpt, paint, presets, and surface rules exist. | Mid-term targeted stamps and course-safe automation are reasonable. | Jumping to broad procedural generation before review/control layers are mature. |
| Asset libraries and starter packs | partially implemented | Approved content packs, starter seeds, preset continuity, and drag placement already exist. | Near-term deepen storage-backed starter packs and pack-driven continuity. | Multiple starter-pack authorities or ad hoc asset pack state. |
| Import, export, and custom content | partially implemented | Packaging/export layers are strong, and asset import models exist, but import execution and custom-content polish are incomplete. | Near-term harden import queue and normalization; mid-term deepen custom content and tool-backed export flows. | Leaking tool-specific assumptions into generic UI modules. |
| Audio | architecturally represented but not surfaced | Audio assets and audio environment zones are modeled, but no creator-facing authoring flow exists. | Mid-term at most, and only as authored environment direction first. | Pulling in a runtime audio stack before preview/world foundations justify it. |
| Physics and simulation | partially implemented | Surface profiles, playability checks, collision/occlusion signals, and GSPro-facing simulator truth already exist. | Keep near-term scope focused on golf-simulator correctness and play-test confidence. | Expanding into a general-purpose physics sandbox. |
| Testing and play mode | missing but strategically important | Preview and Playability diagnose well, but there is still no real in-app play/walkthrough mode. | Safe near-term addition after measurement/framing work. | Duplicating Preview and simulator logic in a second runtime lane. |
| Organization and workflow | already implemented | Course Bible, Hole Planner, World Builder, Version Control, Agent, Package, Preview, and Publish all operate on real package truth. | Continue refinement, not reinvention. | Workflow fragmentation across disconnected planners. |
| Collaboration | out of near-term scope | No real multi-user authority, merge model, or collaboration UI exists. | Long-term only, after versioning, persistence, and review flows mature further. | Massive authority, storage, and UX overlap with current local-first assumptions. |
| Performance and optimization | partially implemented | Performance Center, asset analysis, scene telemetry, and readiness summaries are real. | Near-term deepen renderer/runtime budgets and capture costs. | Claiming performance authority without verified runtime evidence. |
| Editor accessibility and usability | partially implemented | World-first HUD, embedded guidance, shortcut discoverability, and calmer continuity flows are real. | Continue iterative usability and accessibility passes across Build and Preview. | Letting advanced systems add hidden complexity faster than guidance improves. |

## Non-Destructive Architecture Mapping

### Fits naturally into existing packages

- `scene-authoring`: measurement tools, modular snap kits, biome-aware brush presets, route finish depth, surface-rule cleanup/review depth, play-test helpers, corridor staging, and terrain-finish correction layers.
- `asset-system`: storage-backed import queue, starter-pack continuity, kit metadata, normalization posture, and custom-content readiness.
- `world-system`: district-scale environment direction, landmark posture, lighting/atmosphere direction, water/shoreline intent, and audio/environment zoning.
- `sim-logic`: golf-specific gameplay objects, simulator export posture, shot-readability support, and play-test correctness.
- `preview`: camera shot sequencing, capture readiness, play/walkthrough framing, landmark readability, and presentation confidence.
- `packaging` and `publish`: delivery-packet confidence, share-ready asset coverage, and release-facing presentation posture.
- `playability`, `validation`, and `performance`: measurement-derived diagnostics, runtime precision, sightline confidence, and optimization posture.

### Candidate new packages only when the scope becomes real enough

- `environment-system`: only if lighting, atmosphere, water, shoreline, and audio evolve from direction/metadata into executable authored runtime systems that no longer fit cleanly in `world-system` plus `scene-authoring`.
- `collaboration`: only when multi-user session truth, merge posture, permissions, and conflict resolution are real product commitments.
- `procedural-authoring`: only if stamps, biomes, or cleanup automation outgrow targeted `scene-authoring` extensions and require a separately testable rule-execution layer.

### Explicitly do not start yet

- voxel or mesh-hybrid terrain systems
- full visual scripting or trigger-graph editing
- deep collaboration and branch-management UI
- broad procedural course generation
- marketplace or mod-platform workflows
- advanced physics sandbox or full fluid simulation

These would destabilize current ownership boundaries and slow higher-value near-term delivery.

## Phased Roadmap Integration

### Already in progress or already represented

- world-first Build and `scene-authoring` authority
- terrain sculpt, terrain finish, brush workflows, presets, and surface rules
- routing, corridor tools, merge/reconciliation posture, and route confidence
- content packs, direct placement, embedded Build drawer, and asset-library continuity
- preview framing, camera/capture posture, share packet, and release-presentation confidence
- simulator bindings, playability validation, performance posture, and package/publish convergence

### Near-term expansion

- Batch 50 presentation-finish work:
  - camera shot sequencing
  - landmark corridor staging
  - surface-rule cleanup approval depth
  - presentation-share delivery packet confidence
- measurement, grade, and yardage tools tied to Build, Playability, and Preview
- modular structure snap kits and reusable assembly presets
- starter-pack and import-queue continuity in `asset-system`
- presentation-facing lighting and atmosphere direction surfaces
- play-test and walkthrough posture grounded in existing preview and simulator truth

### Mid-term creator power

- water and shoreline authoring built on current terrain/world foundations
- richer vegetation and biome distribution systems
- stronger event and animated-set-piece sequencing
- custom-content normalization and kit-authoring workflows
- audio and environment-zone authoring beyond placeholder metadata

### Long-term advanced systems

- collaboration, review, and branching flows
- advanced procedural tooling with explicit review/approval posture
- deeper runtime lighting and atmosphere controls
- broader physics-backed readability and simulation layers

### Future experimental or optional

- voxel or mesh-hybrid terrain
- full visual scripting
- marketplace or mod ecosystem
- advanced fluid simulation
- general-purpose physics sandbox behavior

## Immediate Safe Additions After This Planning Pass

1. Keep the exact next implementation batch as Batch 50 so the current presentation-confidence lane lands cleanly.
2. Add measurement, slope, and yardage overlays/actions through `scene-authoring`, `playability`, and `preview`.
3. Add modular kit snapping and reusable structure-assembly presets through `scene-authoring` plus `asset-system`.
4. Harden starter-pack continuity, asset import queue execution, and normalization review through `asset-system`.
5. Add presentation-facing lighting and atmosphere direction surfaces through `course-bible`, `world-system`, and `preview` before attempting runtime lighting systems.
6. Add a calmer play-test or walkthrough posture using existing preview and simulator truth instead of inventing a second runtime stack.

## Deferred Major Systems

- Voxel or mesh-hybrid terrain: too much authority overlap with current terrain, surface-rule, and routing foundations.
- Full visual scripting or trigger graphs: event and simulator logic are not yet mature enough to justify a new logic-authoring substrate.
- Deep collaboration UI: local-first persistence, versioning, restore, and review flows still need more hardening first.
- Advanced procedural generation: the current product needs explicit measurement, modular snapping, and reviewable environment rules before large automation layers.
- Marketplace and mod ecosystem: asset import, normalization, starter-pack continuity, and release-truth still need to mature before opening broader custom-content channels.
- Advanced physics sandbox and fluid simulation: the near-term product promise is authored GSPro-compatible course creation, not open-ended simulation tooling.

## Integration Outcome

The broader capability ambition is now safely integrated into repo planning through:

- [ADR-0030 — Non-Destructive Capability Expansion Roadmap Integration](/Users/westlunds/Documents/Website/SImulator/docs/adr/ADR-0030-non-destructive-capability-expansion-roadmap-integration.md)
- [ROADMAP_MASTER.md](/Users/westlunds/Documents/Website/SImulator/ROADMAP_MASTER.md)
- [MODULE_STATUS_BOARD.md](/Users/westlunds/Documents/Website/SImulator/MODULE_STATUS_BOARD.md)
- [PRODUCT_CRITICAL_GAP_ANALYSIS_2026-04-14.md](/Users/westlunds/Documents/Website/SImulator/docs/spec/PRODUCT_CRITICAL_GAP_ANALYSIS_2026-04-14.md)

This audit does not change the immediate build sequence. It formalizes how broader capabilities should be absorbed without disrupting the current Batch 50 momentum.
