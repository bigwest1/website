# ADR-0011 — GSPro Recipes, Host Verification, And Production Adapters

## Status

Accepted — 2026-04-14

## Context

Batch 31 made native/runtime posture clearer, connected Package, Preview, and Publish to shared release truth, and introduced concrete managed adapter execution paths. That still left three operational gaps:

1. host verification was clearer, but still not explicit enough about `unavailable` host conditions versus `preview-only` browser posture
2. release execution had stronger artifacts, but it still lacked a first-class GSPro recipe structure and recipe-linked manifest/log outputs
3. managed adapters executed real commands, but they still behaved too much like thin passthroughs instead of production-oriented bridges that can consume structured tool output

## Decision

Course Creator OS will treat GSPro release recipes, host verification, and managed adapter execution as one operational layer.

- `packaging` owns the GSPro-facing release recipe structure, recipe-linked artifacts, runtime reports, and export logs
- `scene-authoring` remains the single spatial authority, with `sim-logic` and validation continuing to build trust on top of it
- `preview` and `publish` must consume recipe-linked build truth rather than inventing separate operational state
- `integration` owns structured adapter execution for package builds and asset import, including parsing bridge-produced JSON outputs when available
- the desktop runtime must distinguish `verified`, `partially-verified`, `degraded`, `unavailable`, and `preview-only` honestly; it must not imply real host execution is verified when Rust/Cargo/Tauri capability is absent

## Why

The product is now close enough to real release behavior that creators need clearer operational trust, not more generic status language. A release build should point to a recipe, a manifest, runtime verification output, and export logs. Preview and Publish should read that same truth. Adapter execution should behave like production-oriented bridges, not demo stubs.

## Implications

- Package Center now records GSPro recipe identity and the artifact set that belongs to it
- Preview Studio now shows when preview outputs are stale against the latest build truth
- Publish Center now expects artifact-manifest and recipe linkage, not just generic release metadata
- host verification now separates unavailable native execution from preview-only browser posture
- managed adapters can consume structured CLI output for artifact paths, diagnostics, and import outcomes
- future release work must extend the recipe/build truth already owned by `packaging`, not create parallel export state

## Follow-On

The next batch should focus on verified host-path execution, richer GSPro-facing release recipes that drive real tool runs, and stronger tool-specific production adapters where the release path materially depends on them.
