# Roadmap Master

## Purpose

This roadmap defines the build order, active delivery posture, and stage-level exit expectations for Course Creator OS. It is an execution document, not a marketing roadmap.

## Delivery Rules

- Structure before sprawl.
- Shared foundations before duplicated feature work.
- Domain contracts before deep implementation.
- Validation early, not late.
- Keep lanes moving in parallel.
- No module is done if it is not usable, understandable, and testable.
- The user experience remains a first-class delivery stream.

## Stage Summary

| Stage | Status | Goal | Exit Criteria |
| --- | --- | --- | --- |
| Stage 0 — Governance and Product Lock | Complete | Lock the product definition, architecture direction, agent operating model, and design principles. | Foundational specs, charters, guardrails, and roadmap exist in repo. |
| Stage 1 — Foundation and Shell | Complete | Establish the monorepo, design-token system, UI layer, and desktop shell. | Major routes exist, shell runs, and package boundaries are explicit. |
| Stage 2 — Core Domain Systems | Active | Build the typed domain contracts and persistence foundations required for real behavior. | Core entities, storage paths, and testable packages exist beyond UI-only state. |
| Stage 3 — Core Workspaces | Active | Build the primary creator-facing workspaces on real contracts. | Users can create, navigate, edit, and persist core project data. |
| Stage 4 — Validation, Performance, and Recovery | Active | Make the product safe, diagnosable, and trust-building. | Validation, diagnostics, performance posture, and recovery flows are actionable. |
| Stage 5 — Preview, Packaging, and Publish | Active | Build release-facing confidence systems and output workflows. | Preview, packaging, and publish flows can drive a project toward release-candidate status. |
| Stage 6 — Agent Command and Hardening | Planned | Refine guidance, polish the product, and harden the codebase. | Agent guidance feels authoritative, UX is cohesive, and quality bars are met. |

## Stage Details

### Stage 2 — Core Domain Systems

Current focus:

- implement storage adapters instead of interface-only persistence
- deepen the `scene-authoring` domain into terrain, routing, viewport, and spatial gameplay state
- extend simulator logic schemas from metadata into spatial gameplay truth through bindings
- keep project files, indexes, and package ownership aligned

Critical dependencies:

- package boundaries remain stable
- project creation writes real project structure
- validation can target owned domain schemas

### Stage 3 — Core Workspaces

Current focus:

- wire Home, Create, Plan, Gameplay, Asset Library, World Builder, and Agent Command Center to real project data
- deepen Build from the current canvas bridge into the next creation-speed and higher-fidelity runtime tier while preserving the current renderer bridge and single-spatial-authority rules
- keep approved content packs, the embedded Build drawer, placement and brush preset libraries, richer surface-rule authoring, surface-rule cleanup automation, route-finish reconciliation, camera-path correction tools, landmark re-staging, and release-facing presentation confidence in one calm world-first creation lane
- replace seed-only interactions with storage-backed edits
- keep right-rail, health, and next-step guidance consistent across modules

Critical dependencies:

- stable domain package contracts
- working storage layer
- shared UI primitives and readiness surfaces

### Stage 4 — Validation, Performance, and Recovery

Current focus:

- expand validation categories into usable issue feeds
- deepen playability and packaging checks from shared geometry into higher-confidence spatial and export diagnostics
- improve performance summaries from scene-derived telemetry toward renderer/runtime-aware profile diagnostics and hotspot overlays
- harden spatial index health, rebuild execution, restore execution, native verification posture, and creator-facing recovery controls before stronger release-facing claims
- make native/runtime trust explicit across verified, partially verified, degraded, unavailable, and preview-only host conditions, with durable evidence rather than summary-only posture
- carry SQLite and command round-trip evidence into host/runtime trust instead of relying on inspection-only posture

Critical dependencies:

- richer domain state
- durable storage and logging contracts
- actionable issue structure

### Stage 5 — Preview, Packaging, and Publish

Current focus:

- converge Preview, Package, and Publish on one geometry-trust, execution, and export-readiness layer
- move from readiness posture into real candidate-build execution, GSPro recipe-linked artifact generation, preview-shot operations, publish-draft flows, shared release-record truth, package-owned remediation posture, and creator-facing delivery summaries
- deepen tool-backed recipe steps, failure-mode artifacts, managed bridge outputs, retry guidance, external export-tool evidence, creator-handoff artifacts, final-delivery artifacts, and release-operation reconciliation so creators can inspect and correct real execution outcomes instead of summary-only status
- keep package/export blockers clearly tied back to Build and Gameplay remediation paths
- strengthen repo-backed managed adapter execution, automated release orchestration, live external toolchain probing, external GSPro export-tool linkage, native host-session evidence, connected delivery/handoff/final-delivery readiness, share-ready presentation handoff, and durable presentation share-packet truth across Package, Preview, and Publish

Critical dependencies:

- operational storage and recovery layer
- shared geometry diagnostics
- creator-readable release workflows

## Milestones

| Milestone | Status | Meaning |
| --- | --- | --- |
| Milestone 1 — Product Skeleton Exists | Complete | Repo, shell, navigation, and design-token foundation exist. |
| Milestone 2 — Core Domain Model Exists | Active | Typed project, planning, simulator, world, validation, and packaging entities exist. |
| Milestone 3 — Creator Workflow Exists | Active | Major workspaces operate on real project state rather than disconnected scaffolds. |
| Milestone 4 — Trust Layer Exists | Active | Validation, diagnostics, performance posture, and recovery logic protect creators. |
| Milestone 5 — Release Path Exists | Active | Preview, package, and publish workflows form a real release pipeline. |
| Milestone 6 — Product Feels Premium | Planned | UX polish, guidance quality, and module readiness reach a serious product standard. |

## Active Priorities

1. Deepen shipping manifests into clearer packet-selection posture, corridor bundle guidance into stronger auto-curation flows, cleanup replay into comparison-grade review confidence, and signoff locks into calmer locked-share confirmation while preserving `scene-authoring` as the only spatial authority.
2. Absorb broader creator-capability ambition through the strategic audit buckets: prefer low-disruption additions that extend `scene-authoring`, `asset-system`, `world-system`, `sim-logic`, `preview`, `packaging`, `playability`, and `performance`, and explicitly defer large overlapping systems until prerequisite foundations mature.
3. Verify native host sessions on a machine that actually has Rust/Cargo/Tauri installed and keep runtime posture honest about what is verified, partially verified, degraded, unavailable, or preview-only.
4. Exercise the external GSPro export-tool path against a real production-capable toolchain that supports live preflight, export, and final-delivery evidence instead of repo-only adapters or test stubs.
5. Keep Preview, Package, and Publish converged on one recipe/build/artifact/remediation/handoff/final-delivery truth while creator-facing delivery flows continue to deepen.

## Strategic Capability Expansion Integration

- The broader world-class creator capability list is now formally tracked in [STRATEGIC_CAPABILITY_EXPANSION_AUDIT_2026-04-15.md](/Users/westlunds/Documents/Website/SImulator/docs/spec/STRATEGIC_CAPABILITY_EXPANSION_AUDIT_2026-04-15.md).
- Batch 54 is now complete and recorded in [ADR-0035 — Variant Shipping Manifests, Corridor Bundle Recommendations, Cleanup Replay Timelines, And Final Share Signoff Locks](/Users/westlunds/Documents/Website/SImulator/docs/adr/ADR-0035-variant-shipping-manifests-corridor-bundle-recommendations-cleanup-replay-timelines-and-final-share-signoff-locks.md).
- The exact next implementation batch is now [Batch 55 — Shipping Packet Selections, Corridor Bundle Auto-Curation, Cleanup Replay Comparison Views, And Locked Share Confirmation](/Users/westlunds/Documents/Website/SImulator/docs/spec/PRODUCT_CRITICAL_GAP_ANALYSIS_2026-04-14.md).
- The safest post-Batch-50 expansion lanes are measurement and sightline tools, modular snap kits, starter-pack/import continuity, presentation-facing lighting and atmosphere direction, and play-test posture grounded in current preview and simulator truth.
- Explicitly deferred until later phases: voxel or mesh-hybrid terrain, full visual scripting, deep collaboration UI, broad procedural generation, marketplace/mod scope, and physics-sandbox behavior.

## Tracking Assumptions

- Multiple stages can remain active at once if dependencies are respected.
- “Planned” does not mean idle; supporting contracts may begin earlier when they do not create rework.
- The capability domains named in the strategic audit prompt are the current planning spine until a fuller checked-in source list is added to the repo.
