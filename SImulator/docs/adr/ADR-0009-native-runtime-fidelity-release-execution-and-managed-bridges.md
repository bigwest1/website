# ADR-0009: Native Runtime Fidelity, Release Execution, and Managed Bridges

## Status

Accepted — 2026-04-14

## Context

By the end of Batch 29, Course Creator OS had a credible spatial-authoring substrate, stronger trust and recovery layers, and shared release convergence across Preview, Package, and Publish.

What was still missing was the next operational layer:

- Build still relied on a bridge-first runtime posture rather than a more fidelity-aware rendering path.
- Package Center could explain readiness, but not execute a meaningful candidate-build flow with generated artifacts.
- Preview and Publish consumed shared readiness, but they still behaved more like reporting surfaces than operational destinations.
- Integration remained interface-first, with no concrete managed bridge foundations behind tool-path and execution contracts.
- Native/runtime verification was still too implicit about what was verified, degraded, or unverified in the current environment.

## Decision

Course Creator OS will deepen the current product foundation through four connected rules:

1. `scene-authoring` remains the single spatial authority, while the desktop app owns only the concrete runtime adapter needed to present higher-fidelity rendering and interaction.
2. `packaging` owns executable candidate-build foundations, generated artifact records, execution logs, and release-record creation rules; Preview and Publish consume those shared outputs instead of inventing parallel release logic.
3. `integration` remains the package boundary for external tool assumptions, but concrete managed bridge foundations may now live behind its contracts so Settings and release workflows can operate against real health and execution posture.
4. Native/runtime verification must stay honest and explicit: the product should distinguish preview-only posture, degraded native posture, and verified native posture rather than implying the host path is fully proven when it is not.

## Consequences

### Positive

- Build can move toward a more native-feeling runtime without duplicating spatial or renderer state in the app layer.
- Package execution now has a real path from readiness to candidate-build artifacts and operational logs.
- Preview, Package, and Publish now share one execution/trust/release-convergence backbone.
- Integration and native verification can evolve into real operational capabilities without leaking external-tool details into generic UI modules.

### Constraints

- File-based project truth remains canonical; generated artifacts and SQLite indexes are secondary operational layers.
- Release execution must fail safely and record explicit diagnostics when shared readiness still blocks the pipeline.
- Managed bridges must stay optional and replaceable; they cannot become hidden hard dependencies inside creator-facing modules.
- Native verification messaging must remain conservative until the Tauri/Rust path is actually exercised in a verified environment.

## Follow-On Work

- Push the Build runtime beyond the current bridge-backed canvas path toward the next higher-fidelity environment.
- Replace managed-bridge foundation handlers with real tool-specific adapters where those integrations are justified.
- Turn candidate-build foundations into end-to-end export execution for GSPro-facing release paths.
- Expand native verification and operational recovery coverage with real host execution and longer-session testing.
