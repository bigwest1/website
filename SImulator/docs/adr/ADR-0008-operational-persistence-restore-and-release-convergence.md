# ADR-0008: Operational Persistence, Restore Execution, And Release Convergence

## Status

Accepted - 2026-04-14

## Context

Batch 28 hardened spatial trust and export diagnostics, but the product still had a critical operational gap:

- SQLite execution remained mostly contractual rather than meaningfully wired
- index drift could be diagnosed, but rebuild behavior was still more posture than operation
- snapshots and restore points were visible, but restore execution was not yet a real creator-facing recovery path
- Preview, Package, and Publish were stronger individually than they were as one converged release path

At that point the product had a meaningful trust model, but not yet a sufficiently operational one for serious long-session authoring.

## Decision

Course Creator OS will extend the existing dual-persistence model into a more operational product layer without changing the source-of-truth boundary.

This means:

- file-based project truth remains canonical
- SQLite remains an indexed working state and rebuild target, never the only source of truth
- `storage` owns the operational index executor/runtime behavior and index-health evaluation contracts
- `versioning` owns snapshot bundles and restore execution logic rather than leaving restore semantics in the app shell
- the desktop app orchestrates rebuild and restore actions, but package-owned contracts decide the data model and outcomes
- `packaging` owns release convergence summaries so Preview, Package, and Publish do not drift into separate readiness systems

## Consequences

### Positive

- long-session authoring now has a concrete SQLite path, index rebuild execution, and restore execution substrate
- snapshots can carry restorable bundles rather than metadata only
- Package, Publish, and Preview can consume one geometry-trust and release-readiness summary instead of inventing separate posture logic
- recovery UX can expose creator-readable rebuild and restore state without becoming the authority for those calculations

### Negative

- the persistence/recovery surface is now more operationally complex and therefore more sensitive to contract drift
- the native Tauri SQLite path still needs runtime verification outside this environment
- release convergence is stronger, but package execution and final publish workflows are still not complete release operations

## Follow-Up

- move the Build runtime from the current bridge posture toward the next higher-fidelity 3D environment
- implement actual package/build execution flows on top of the converged readiness layer
- deepen preview and publish authoring so release flows are not only diagnostic but fully operational
- add concrete managed-integration bridges where native implementation does not yet cover the full pipeline
