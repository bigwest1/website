# Product-Critical Gap Analysis

## Status

Refreshed on 2026-04-15 after the instruction-system repair, the `scene-authoring` foundation work, Batch 26 renderer/analysis integration, Batch 27 direct-manipulation/sculpting/runtime-depth work, Batch 28 spatial-trust/export-diagnostics hardening, Batch 29 operational persistence/restore/release-convergence work, Batch 30 native-runtime/release-execution/managed-bridge foundations, Batch 31 verified-runtime/release-truth/managed-adapter integration, Batch 32 host-verification / GSPro-recipe / production-adapter hardening, Batch 33 verified-host-path / tool-backed-release-operation work, Batch 34 repo-backed-adapter / host-roundtrip / managed-output hardening, Batch 35 release-automation/remediation work, Batch 36 external-tool-aware delivery convergence, Batch 37 live-host-evidence / external-toolchain-preflight / creator-release-handoff hardening, Batch 38 native-host-session / final-delivery / production-toolchain hardening, Batch 39 content-pack-placement / scenery-brush / terrain-finish / routing-ergonomics / guided-builder-creation work, Batch 40 direct-drag-placement / live-preview-ghosting / advanced-terrain-finish / route-handle-depth work, Batch 41 embedded-asset-drawer / surface-snap / brush-rule-depth / terrain-finish-consistency / route-continuity-polish work, Batch 42 placement-presets / brush-preset-authoring / terrain-finish-analytics / final-route-authoring-fidelity work, Batch 43 preset-library / finish-intel / route-delivery-confidence work, Batch 44 surface-rule-presets / course-scale-finish / route-merge / Build-to-Preview framing work, Batch 45 surface-rule-authoring / preview-camera / route-reconciliation / release-readability work, Batch 46 camera-path-authoring / landmark-correction / surface-rule-coverage / presentation-confidence work, Batch 47 playback-polish / landmark-actions / rule-conflict-resolution / share-ready-handoff work, Batch 48 camera-correction / landmark-restaging / cleanup-automation / presentation-share-packet work, Batch 49 capture-execution / landmark-view-corridors / cleanup-review / presentation-share-delivery-confidence work, Batch 50 shot-sequencing / corridor-staging / cleanup-approval-depth / delivery-packet-confidence work, Batch 51 shot-order-approval / corridor-support-kits / cleanup-review-diffing / presentation-packet-proofing work, Batch 52 shot-variant-sets / corridor-bundle-composition / cleanup-audit-trails / final-share-gate-approval work, Batch 53 variant-shipping-decisions / corridor-bundle-libraries / cleanup-review-replay / share-gate-signoff-artifacts work, Batch 54 variant-shipping-manifests / corridor-bundle-recommendations / cleanup-replay-timelines / final-share-signoff-locks work, and the strategic capability-expansion roadmap-integration pass.

## Scope Reviewed

This audit compares the current repository against:

- [AGENTS.md](/Users/westlunds/Documents/Website/SImulator/AGENTS.md)
- [MASTER_AUTONOMOUS_EXECUTION_CHARTER.md](/Users/westlunds/Documents/Website/SImulator/docs/spec/MASTER_AUTONOMOUS_EXECUTION_CHARTER.md)
- [COURSE_CREATOR_OS_V1_FULL_PRODUCT_SPEC.md](/Users/westlunds/Documents/Website/SImulator/docs/spec/COURSE_CREATOR_OS_V1_FULL_PRODUCT_SPEC.md)
- [UX Architecture and Design System Specification](/Users/westlunds/Documents/Website/SImulator/docs/design/UX_ARCHITECTURE_AND_DESIGN_SYSTEM_SPEC.md)
- [DATA_MODEL_AND_REPOSITORY_ARCHITECTURE_SPEC.md](/Users/westlunds/Documents/Website/SImulator/docs/spec/DATA_MODEL_AND_REPOSITORY_ARCHITECTURE_SPEC.md)
- [AGENT_CHARTERS_AND_OPERATING_MANUAL.md](/Users/westlunds/Documents/Website/SImulator/docs/spec/AGENT_CHARTERS_AND_OPERATING_MANUAL.md)
- [IMPLEMENTATION_ROADMAP_AND_WORKSTREAM_PLAN.md](/Users/westlunds/Documents/Website/SImulator/docs/spec/IMPLEMENTATION_ROADMAP_AND_WORKSTREAM_PLAN.md)
- [CODEX_MASTER_PROMPT_PACK.md](/Users/westlunds/Documents/Website/SImulator/docs/spec/CODEX_MASTER_PROMPT_PACK.md)

## Executive Read

The repository is now materially stronger in the product-critical Build layer, the long-session trust layer, and the release-execution layer: the product has a real `scene-authoring` package, Build has a renderer-backed scene-authoring workspace, direct-manipulation interaction is real, terrain sculpting exists as authored state, terrain material painting now exists as authored state, routing handles are deeper, approved content packs can now drive direct placement and scenery-brush workflows, direct drag-from-browser placement now exists, live placement/brush/terrain preview ghosting now exists, placement and brush presets now preserve reusable creator workflows, terrain finish now has richer layer/visibility depth plus course-scale analytics, finish-stage route continuity now exposes stronger confidence and polish signals, embedded builder guidance now exists, spatial analysis is materially stronger, concrete rebuild/restore execution now exists, tool-backed GSPro recipe-linked release runs now emit step-level records and durable failure artifacts, Preview/Package/Publish consume a shared release-convergence layer, native/runtime posture now distinguishes verified vs partial vs degraded vs unavailable vs preview-only conditions, repo-backed managed adapter scripts now exist inside the repository, managed bridge outputs are first-class release artifacts, external-toolchain preflight can now be captured before export when supported, creator handoff now has a durable package-owned artifact, native host-session evidence is now captured when the environment supports it, final-delivery artifacts now exist as package-owned release truth, and integration/native execution are no longer interface-only abstractions.

That correction closes the biggest earlier gap, but it still does not finish the core creation loop.

Course Creator OS is now beyond “missing spatial authoring substrate,” beyond “metadata-only Build scaffolding,” beyond “direct-manipulation missing entirely,” beyond “spatial trust is mostly implicit,” beyond “restore/rebuild are only conceptual,” and beyond “release posture is only checklist-level,” and beyond “managed integrations are only empty contracts.” The remaining gap has now split into three calmer fronts: the product still needs actual live native host sessions, fuller GSPro-facing real-tool execution on a production-capable environment, and the next measured creator-power pass around shipping manifests, corridor-bundle recommendations, cleanup replay timelines, final share signoff locks, measurement tooling, modular snap kits, and play-test posture.

The broader world-class creator capability ambition is now also safely integrated into repo planning through [STRATEGIC_CAPABILITY_EXPANSION_AUDIT_2026-04-15.md](/Users/westlunds/Documents/Website/SImulator/docs/spec/STRATEGIC_CAPABILITY_EXPANSION_AUDIT_2026-04-15.md). That audit does not change the next implementation batch. It formalizes which larger systems are already represented, which can safely enter near-term work, and which must stay deferred until current package-owned foundations mature.

## Strategic Capability Expansion Integration

Immediate sequencing does not change:

- Batch 54 is now complete enough to shift the exact next implementation batch to Batch 55.
- Near-term additions after that should favor low-disruption creator power that extends existing owners:
  - measurement, grade, and yardage tools
  - modular structure snap kits and reusable assemblies
  - starter-pack and import-queue continuity
  - presentation-facing lighting and atmosphere direction
  - play-test and walkthrough posture grounded in existing preview and simulator truth
- Explicitly deferred until later phases:
  - voxel or mesh-hybrid terrain
  - full visual scripting
  - deep collaboration UI
  - broad procedural generation
  - marketplace or mod-platform scope
  - advanced physics sandbox or full fluid simulation

## Prioritized Gap Report

### P0 — Fully Verified Host Execution Is Still Missing

Current state:

- `scene-authoring` now owns terrain, routing, playable zones, viewport state, render snapshots, history, hover state, sculpt brush state, and spatial analysis.
- `Build` now has a renderer-backed canvas viewport, editing modes, overlays, direct interaction targets, and history-backed editing flows.
- concrete SQLite execution, index rebuild execution, restore execution, GSPro recipe-linked candidate-build execution, environment-aware native verification, repo-backed managed adapter scripts, and clearer host command reporting now exist in the product path.

Why this is critical:

- The product is now honest about native/runtime posture and carries round-trip evidence into release records, but the real Tauri/host path is still only partially verified in this environment.
- Without fuller verified host execution, release confidence is still constrained by environment posture rather than only by authored project truth.

### P0 — End-To-End GSPro-Facing Release Execution Is Still Incomplete

Current state:

- `sim-logic` binds tees, pins, hazards, OB, drop zones, and preview/flyover framing back to shared spatial state.
- Package, Publish, and Preview now consume one shared convergence layer and geometry-aware release blockers.
- tool-backed candidate-build execution, generated artifact records, step-level logs, repo-backed managed adapter outputs, release-draft linkage, preview output tracking, and publish-side operational posture now exist.

Missing:

- end-to-end GSPro-facing export execution rather than tool-backed recipe-linked candidate-build foundations only
- fuller preview media production and publish completion flows
- final release-run orchestration that closes the loop from Build through Package/Publish without manual interpretation

Why this is critical:

- The product now has coherent release execution foundations, but not yet the full operational release loop that a serious creator app needs.

### P1 — Spatial Analysis Exists, But It Still Needs Higher-Confidence Runtime Precision

Current state:

- Validation is structured and actionable.
- Scene-authoring integrity checks, blocked line-of-play detection, sightline issues, route discontinuities, obstruction risk, simulator-anchor conflicts, and scene-derived performance telemetry now exist.

Missing:

- richer runtime collision and occlusion analysis
- more precise corridor-width and landing-zone checks
- deeper geometry-backed shot-readability validation
- event interference against placed scene objects
- stronger district and build overlays sourced from richer runtime metrics

Why this matters:

- The product now identifies real spatial risks, but it still cannot yet prove enough of the hard edge cases that will determine creator trust in production-scale projects.

### P1 — The Next Native/High-Fidelity Runtime Jump Is Still Missing

Current state:

- the product now has a concrete SQLite path, rebuild execution, restore execution, creator-facing recovery controls, environment-aware native verification reporting, and host command visibility
- snapshot bundles and operational index-health reporting now exist
- Build now supports direct drag-from-browser placement, an embedded asset drawer, live placement/brush/terrain previews, surface-aware snap posture, deeper brush rules, placement and brush preset libraries, terrain-finish hotspot overlays, richer route-delivery confidence, and embedded builder guidance on top of the current world-first HUD

Missing:

- the next stronger runtime tier beyond the current bridge/canvas posture
- stronger measurement, grade, and yardage tooling inside Build and Preview
- modular structure snap kits and reusable assembly workflows
- a calmer play-test and walkthrough posture grounded in preview and simulator truth
- richer presentation-facing lighting and atmosphere direction surfaces
- deeper long-session recovery polish and index-backed continuity views
- broader operational coverage for more complex corrupted-state and restore edge cases

Why this matters:

- the trust model is now meaningfully operational and the world-first creation loop is much faster, but serious creators will still judge it by runtime fidelity, live in-world editing speed, and how it behaves over long sessions and ugly failure cases.

### P1 — Managed Integrations Still Need Production-Grade Tool-Specific Adapters

Current state:

- The integration architecture is sound.
- Settings now surfaces integration health, tool paths, native/runtime posture, and host command visibility.
- Concrete managed bridge implementations now exist for packaging execution, compatibility execution, asset import execution, and optional external GSPro export-tool linkage behind the current interfaces.

Missing:

- production-grade tool-specific adapters behind the bridge interfaces
- broader live tool-health verification beyond the current managed bridge foundations
- fuller real external-tool execution on machines that actually have the relevant production toolchains installed

Why this matters:

- The product promise allows managed integrations where they strengthen capability, but the bridge layer is still mostly contractual.

### P2 — Prompt-Pack Drift Is Repaired, But It Must Stay Canonical

Current state:

- The repo now has a root `AGENTS.md`.
- The canonical execution naming gap is repaired through `MASTER_AUTONOMOUS_EXECUTION_CHARTER.md` and `CODEX_MASTER_PROMPT_PACK.md`.
- Prompt 21 is confirmed present.

Residual risk:

- Future chat-copied prompt fragments can still reintroduce drift if they are treated as instructions without being reconciled back into repo docs.

## Recommended Correction Plan

### Correction 1 — Deepen Build And Preview Into The Next Presentation-Control Runtime

Build on `scene-authoring`, not beside it.

Next additions should include:

- stronger runtime rendering and final renderer posture
- stronger shot variants and grouped signoff confidence on top of the current preview stack
- stronger landmark corridor kit composition and view-readability repair
- deeper cleanup diff audit trails layered on top of the new automation and review flows
- measurement, grade, and yardage tooling that help creators finish with calmer confidence
- modular structure snap kits and reusable assembly presets that build on the current placement stack
- richer lighting and atmosphere direction surfaces that stay presentation-facing rather than becoming a second renderer authority

### Correction 2 — Turn Candidate-Build Foundations Into End-To-End Release Execution

Extend the now-stronger release model into real creator-facing output workflows.

Priority work:

- live external-tool GSPro export runs on verified hosts
- stronger preview authoring, publish execution flows, and creator delivery handoff
- tighter remediation loops from Build and Gameplay into release tasks

### Correction 3 — Deepen Spatial Analysis Confidence

The next Build pass should focus on analysis and interaction depth, not more dashboard polish.

Priority work:

- richer collision and sightline runtime analysis
- stronger landing and corridor diagnostics
- renderer/runtime telemetry
- event/build interaction checks

### Correction 4 — Continue Hardening Long-Session Trust

Priority work:

- verified native runtime execution
- deeper recovery UX and history/index views
- more restore/rebuild edge-case coverage

### Correction 5 — Turn Bridge Foundations Into Real Managed Adapters

Priority work:

- real tool-specific adapters behind the current integration contracts
- stronger tool-path verification and health-check execution
- managed heavy-lift workflows where native execution is not yet the best path

## Exact Next Implementation Batch

### Batch Name

Batch 55 — Shipping Packet Selections, Corridor Bundle Auto-Curation, Cleanup Replay Comparison Views, And Locked Share Confirmation

### Scope

1. Turn shipping manifests into clearer packet-selection posture and explicit what-ships-versus-what-stays confirmation.
2. Deepen corridor bundle recommendations into stronger auto-curation and creator-guided bundle selection instead of only recommendation posture.
3. Deepen cleanup replay timelines into clearer comparison views rather than only timeline summaries and audit entries.
4. Strengthen share-gate signoff locks into calmer locked-share confirmation and stronger final-share certainty.
5. Continue the runtime path toward a stronger final in-world authoring experience without falling back to tab-heavy control flow.

## Correction Notes

- The earlier repo audit correctly identified the missing build substrate, but that finding is no longer current after `scene-authoring`, Batch 25, and Batch 26 landed.
- Batch 54 materially improved shipping manifests, corridor-bundle recommendations, cleanup replay timelines, and final share signoff locks, but the highest presentation-stage gap has now shifted to “shipping-packet selection clarity, corridor auto-curation, replay comparison views, and calmer locked-share confirmation still need work.”
