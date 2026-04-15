# ADR-0007: Spatial Trust Hardening And Export Diagnostics

## Status

Accepted - 2026-04-14

## Context

Batch 27 left Course Creator OS with a materially stronger Build workspace, but serious long-running authoring trust was still too weak:

- the renderer bridge had better interaction depth, but runtime fidelity and overlay posture still needed another layer
- scene-derived analysis existed, but trust in corrupted, stale, or drifting spatial state was not strong enough
- packaging and release flows still lacked geometry-aware diagnostics tied cleanly to the authored scene
- project recovery and diagnostics did not yet reflect index drift or damaged spatial relationships in a creator-friendly way

At this point the product risk had shifted again. The biggest remaining problem was no longer “Build lacks a real authoring substrate.” It was “Build still needs a stronger fidelity and trust layer to support serious course work.”

## Decision

Course Creator OS will harden spatial trust and export readiness by extending the existing spatial-authority model rather than introducing new operational side channels.

This means:

- `scene-authoring` remains the single spatial truth, and now also produces spatial trust and analysis-confidence reports
- `storage` owns project-index health snapshots and drift diagnostics for spatial state
- `logging` owns structured recovery and spatial-index diagnostics rather than leaving those conditions hidden in UI logic
- `packaging` owns export-geometry diagnostics derived from authored geometry and simulator bindings, not from app-local heuristics
- the desktop app surfaces runtime status, trust posture, and creator-facing drift diagnostics, but does not become the authority for those calculations

## Consequences

### Positive

- long-session authoring trust now has a package-owned diagnostic path instead of ad hoc app-level warnings
- package and publish flows can consume geometry readiness from the same source of truth as Build and Gameplay
- performance pressure can react to trust and analysis quality rather than pretending all scene telemetry is equally reliable
- recovery and versioning surfaces can explain stale indexes, damaged scene state, and rebuild posture in a creator-readable way

### Negative

- the system now carries more diagnostic and indexing structure, which raises the cost of keeping package contracts disciplined
- SQLite execution and full restore execution are still not operationally complete, so trust hardening is materially better but not final
- the renderer is still a bridge runtime rather than the final high-fidelity 3D environment

## Follow-Up

- wire a concrete SQLite executor and real restore execution around the stronger index/trust model
- deepen package/publish flows so release gating consumes geometry diagnostics end to end
- continue pushing the renderer path toward a higher-fidelity 3D runtime without violating the spatial-authority boundary
