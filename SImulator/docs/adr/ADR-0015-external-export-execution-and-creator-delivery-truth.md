# ADR-0015 — External Export Execution And Creator Delivery Truth

## Status

Accepted — 2026-04-14

## Context

Batch 35 gave Course Creator OS package-owned release automation, remediation posture, repo-backed managed adapters, and stronger host/runtime evidence. That was enough to make release execution operational, but it still left three product-critical gaps:

1. GSPro-facing release runs were still primarily repo-backed rather than able to consume real external export tools.
2. Package, Preview, and Publish had stronger shared release truth, but their post-build creator-delivery posture was still too implicit.
3. Settings and integration health could verify repo-backed bridges, but they did not yet treat an external GSPro export tool as a first-class production toolchain input.

That meant the product could automate release runs, but it could not yet distinguish clearly between repo-backed execution and more production-capable external-tool evidence, and it still made creators work too hard to understand what was actually ready for delivery after a build completed.

## Decision

Course Creator OS will treat external export execution and creator delivery posture as part of the same package-owned release truth layer.

Concretely:

- `integration` now owns a first-class optional `gspro-export-tool` path and a corresponding `gspro-export` integration health surface.
- the managed package runner can now pass a configured external GSPro export executable into the release run and capture structured step-level evidence, logs, and output paths when that tool is available.
- `packaging` now records `executionMode` on package builds so the product can distinguish `package-owned`, `repo-backed`, `external-tool`, `mixed`, and `unconfigured` release execution posture.
- `packaging` also owns a shared creator-delivery summary so Package, Preview, and Publish can read one post-build truth for delivery readiness, stale outputs, artifact completeness, and release-draft alignment.
- the desktop app continues to orchestrate host/runtime invocation, but it does not invent separate delivery or release-trust models outside package-owned state.

## Consequences

### Positive

- The product can now capture stronger evidence when a real external GSPro export tool is configured.
- Repo-backed managed execution and external-tool execution are no longer collapsed into the same vague “tool-backed” label.
- Package, Preview, and Publish now share one creator-delivery posture instead of screen-local build-to-delivery heuristics.
- Settings can surface external GSPro export readiness as a real production-toolchain concern.

### Tradeoffs

- This still does not equal a fully verified live host run on a machine that lacks Rust/Cargo/Tauri or a real GSPro export tool.
- External-tool execution is capability-ready, but final production confidence still depends on exercising it against real host/toolchain environments.
- Delivery posture is stronger, but publish-side handoff and creator delivery automation still need to deepen.

## Follow-on Work

- Run the live Tauri/native stack on a machine with Rust/Cargo/Tauri installed and record real host verification evidence.
- Exercise the new external GSPro export path against a real toolchain instead of repo-only adapters or test stubs.
- Deepen creator release handoff, publish automation, and delivery-ready artifact workflows on top of the new shared delivery summary.
