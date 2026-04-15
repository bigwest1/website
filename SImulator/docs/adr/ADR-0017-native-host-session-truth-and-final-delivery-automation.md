# ADR-0017 — Native Host-Session Truth And Final Delivery Automation

## Status

Accepted — 2026-04-14

## Context

Batch 37 established stronger live host evidence, external-tool preflight, and a shared creator handoff artifact. That still left three operational gaps:

1. native verification was still stronger on command/path evidence than on durable host-session evidence
2. external GSPro execution could preflight and export, but final creator-delivery finalization was still weaker than the rest of the release path
3. Package, Preview, and Publish still needed a shared final-delivery posture after creator handoff existed

That meant the product could explain release execution better, but the creator-facing end of the flow still depended too much on interpreting multiple surfaces instead of one stronger package-owned delivery truth.

## Decision

Course Creator OS will treat native host-session evidence and final creator delivery as part of the same package-owned release-trust layer.

Concretely:

- the native/Tauri bridge now attempts to write a durable host-session evidence file inside the runtime state root, so persisted sessions can be distinguished from command/path-only posture
- `native-runtime` now carries explicit `hostSessionReady` and `hostSessionEvidencePath` fields so Settings can surface live session evidence honestly
- the managed package runner now supports a post-export `finalize-delivery` step for external GSPro toolchains when available, recording step-level evidence without inventing app-local delivery truth
- `packaging` now generates a durable final-delivery artifact and shared final-delivery summary so Package, Preview, Publish, and release automation converge on the same post-build delivery posture

## Consequences

### Positive

- native verification is stronger because it now captures session-level filesystem evidence, not only command/path availability
- external GSPro toolchains can now contribute creator-delivery finalization evidence after export
- Package, Preview, and Publish now share one package-owned final-delivery posture instead of separate post-build interpretations
- missing final-delivery artifacts are now explicit actionable release issues

### Tradeoffs

- this environment still cannot honestly claim verified native host sessions because `cargo`, `rustc`, and `tauri` are still absent here
- external delivery finalization is capability-aware, but still depends on the real external tool implementing the expected JSON contract
- the creator-facing final-delivery layer is stronger, but true production publish automation and real host-verified toolchains still need another pass

## Follow-on Work

- verify native host sessions on a machine with Rust/Cargo/Tauri actually installed
- exercise the external GSPro path against a real production export toolchain, not only repo-backed and test-script runners
- deepen final creator delivery from summary/handoff posture into stronger creator-facing release completion and automation
