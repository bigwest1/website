# ADR-0016 — Live Host Evidence And Creator Release Handoff

## Status

Accepted — 2026-04-14

## Context

Batch 36 established external-tool-aware release truth, shared creator-delivery summaries, and stronger production-toolchain posture. That still left three gaps:

1. host verification could still under-report valid tools when they were installed on `PATH` instead of configured as literal filesystem paths
2. external GSPro execution could run, but it lacked a stronger preflight/toolchain evidence step before export
3. Package, Preview, and Publish still needed a more explicit shared handoff artifact for post-build creator review

That meant release execution was more capable than before, but creator trust after build completion still depended too much on reading scattered diagnostics rather than one durable handoff posture.

## Decision

Course Creator OS will treat live host evidence and creator handoff as part of the same release-truth hardening layer.

Concretely:

- the native/Tauri bridge now resolves executable references from `PATH` as well as literal filesystem paths, so host/tool verification is more honest for real toolchain installs
- the managed package runner now attempts an explicit external-tool `probe-toolchain --json` preflight before `run-export --json`, capturing stronger step-level toolchain evidence when the external tool supports it
- `packaging` now generates a durable creator handoff artifact for every release run, including failed runs, and shares a typed release-handoff summary across Package, Preview, and Publish
- creator handoff remains package-owned release truth; the desktop app renders it, but does not invent a second handoff model

## Consequences

### Positive

- host verification is more accurate for real command-line tools installed on `PATH`
- external GSPro toolchains can contribute preflight evidence before export, not just final export output
- creators now get one explicit post-build handoff artifact and one shared handoff summary across downstream release modules
- missing handoff artifacts are now actionable release issues instead of implicit quality drift

### Tradeoffs

- a host without Rust/Cargo/Tauri still cannot be claimed as fully verified, even with better evidence capture
- external-tool preflight is capability-aware, but it still depends on the real external tool implementing the expected JSON contract
- creator handoff is stronger, but final publish/delivery automation still needs another pass

## Follow-on Work

- verify the native/Tauri host path on a machine with Rust/Cargo/Tauri actually installed
- exercise the external GSPro toolchain path against a real production export tool instead of test doubles
- deepen creator delivery from handoff clarity into fuller publish completion and release handoff automation
