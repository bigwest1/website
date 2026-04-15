# ADR-0010 — Verified Native Runtime And Shared Release Truth

## Status

Accepted — 2026-04-14

## Context

Batch 30 established candidate-build execution, release artifacts, managed bridge foundations, and native/runtime health reporting. That was enough to move the product out of readiness-only posture, but it still left three risks:

1. native/runtime reporting could drift from actual host capability if it stayed too coarse
2. Package, Preview, and Publish could still interpret release truth differently
3. managed integration bridges could stay abstract even when the product needed real execution paths

The product now has enough Build and release infrastructure that these risks are operational, not theoretical.

## Decision

Course Creator OS will treat native/runtime posture, release execution state, and managed adapter execution as one shared operational layer.

- `scene-authoring` remains the only spatial authority
- `packaging` remains the owner of executable build truth, artifact records, and release-record linkage
- `preview` remains responsible for preview-domain output state, but it must synchronize to build truth rather than invent an isolated readiness model
- `publish` must consume the same release-record and build truth as Package and Preview
- `integration` owns concrete managed adapters and tool-health execution behind stable interfaces
- the desktop app remains an orchestration surface; it must not create a second runtime, release, or integration truth model

## Why

This keeps the product honest. A creator should not see one answer in Package Center, another in Preview Studio, and a third in Publish Center. Likewise, native/runtime posture should be explicit about verified, partially verified, degraded, and preview-only states instead of collapsing everything into generic health language.

## Implications

- candidate builds now carry runtime-verification state, bridge summaries, release-record linkage, retry count, and richer artifact sets
- Preview Studio tracks build-linked output state for flyovers, minimaps, screenshots, and showcase sequences
- Publish Center reads build-linked release truth instead of acting as a disconnected metadata screen
- Settings surfaces host command verification and clearer runtime posture
- managed adapters now have concrete runtime paths for package execution, compatibility execution, and asset import execution
- future release work must extend the same package-owned truth instead of inventing new readiness summaries

## Follow-On

The next batch should verify the real native/Tauri host path, deepen true end-to-end GSPro-facing export execution, and replace the current managed adapter foundations with production-specific adapters where the product truly depends on them.
