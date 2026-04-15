# ADR-0012 — Verified Host Paths And Tool-Backed Release Operations

## Status

Accepted — 2026-04-14

## Context

Batch 32 established GSPro recipe truth, stronger host-verification reporting, and structured managed-adapter execution. That still left a critical operational gap:

1. host verification was clearer, but the build record still did not carry enough durable evidence about what was actually verified on the host
2. GSPro recipe execution still behaved too much like a candidate-build foundation instead of a tool-backed operational release run
3. Package, Preview, and Publish were reading shared release truth, but not enough step-level execution detail to explain failures and stale relationships cleanly

## Decision

Course Creator OS will treat host-verification evidence, tool-backed recipe steps, and release-operation reconciliation as first-class package-owned release truth.

- `packaging` owns the durable release-run record, including recipe-step results, runtime-verification summary/evidence, and failure-mode artifact generation
- `integration` owns structured tool-backed adapter step results and host-facing notes behind the existing clean bridge interfaces
- `scene-authoring` remains the single spatial authority, and nothing in this batch creates a second geometry or renderer model
- Package, Preview, and Publish must consume the same release-step and runtime-trust data instead of inventing separate operational explanations
- host verification must stay honest: Rust/Cargo/Tauri absence or missing managed command readiness keeps the system below fully verified posture even when other runtime checks succeed

## Why

The product is now close enough to serious release behavior that creators need real operational evidence, not only stronger summaries. A failed managed package runner should become a failed release run with inspectable artifacts and step logs. A runtime state should carry the evidence that produced it. Preview and Publish should be able to explain stale or mismatched release posture from the same build truth that Package generated.

## Implications

- failed tool-backed GSPro runs now produce durable failure manifests, step reports, runtime reports, and export logs instead of only UI-level warnings
- successful release runs now record tool-linked recipe steps, adapter identity, runtime-verification evidence, and richer artifact manifests
- Package, Preview, and Publish can now surface release-step failures and adapter-backed execution posture from one shared source
- Settings now shows richer host-verification evidence and degraded reasons instead of only a coarse runtime summary
- future release execution work must extend this shared recipe/build/runtime record rather than adding per-screen operational state

## Follow-On

The next batch should focus on fully verified Tauri/host execution on a machine with the real native prerequisites installed, deeper tool-backed GSPro export execution, and stronger production-grade adapters that move beyond the current structured bridge layer.
