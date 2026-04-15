# ADR-0013 — Repo-Backed Adapters And Managed Output Truth

## Status

Accepted — 2026-04-14

## Context

Batch 33 left Course Creator OS with stronger structured runners and tool-backed step reporting, but the product still lacked a concrete repo-backed adapter layer that could execute real managed bridge scripts inside the current repository. Host/runtime posture was also still stronger at inspection than at round-trip evidence, and managed bridge outputs were being carried as loose path lists rather than first-class release artifacts.

That created three trust problems:

1. the integration layer still looked more abstract than operational,
2. host verification could still over-index on presence checks instead of actual round trips,
3. Package, Preview, and Publish could not treat managed adapter outputs as durable release truth.

## Decision

Course Creator OS will treat repo-backed managed adapter scripts as the default concrete adapter maturity layer inside the repository, while keeping clean package-owned boundaries around release truth.

Concretely:

- `scripts/managed-adapters` now hosts repo-backed implementations for:
  - `package-build-runner`
  - `gspro-compatibility-bridge`
  - `asset-import-runner`
- `integration` owns the metadata that suggests these adapters on desktop/Tauri-capable hosts, but the UI still consumes only generic tool and integration health models.
- `packaging` owns managed bridge outputs as first-class release artifacts instead of leaving them as loose bridge diagnostics.
- native host verification should prefer real round-trip evidence when possible:
  - SQLite round-trip evidence
  - command-execution round-trip evidence

## Consequences

### Positive

- Batch 34 now has real repo-backed adapter execution instead of only modeled runner behavior.
- Package, Preview, and Publish can reason about managed bridge outputs as durable release evidence.
- Host/runtime trust is more honest because it now distinguishes availability from actual round-trip success more clearly.
- The repo has a better bridge to future production adapters without leaking tool-specific assumptions into creator-facing UI modules.

### Tradeoffs

- The repo-backed adapter path is still not the same as fully verified production-tool execution on a host with Rust/Cargo/Tauri available.
- Suggested tool paths remain environment-sensitive and should not be treated as universally valid outside repo-aware desktop execution.
- Managed scripts improve operational realism, but they do not replace the need for fuller real-tool GSPro export runs.

## Follow-on Work

- Verify the Tauri/native path on a host that actually has Rust/Cargo/Tauri installed.
- Deepen repo-backed adapters into stronger production-specific tool integrations.
- Extend GSPro-facing execution from structured managed bridge runs into fuller end-to-end real-tool export runs.
