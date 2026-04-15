# ADR-0030 — Non-Destructive Capability Expansion Roadmap Integration

## Status

Accepted — 2026-04-15

## Context

Course Creator OS now has a much stronger world-first builder, preview, packaging, and presentation-finish layer, but the broader strategic capability ambition around world-class 3D golf and world creation is much larger than the next safe implementation window.

The repo needed a durable way to absorb that ambition without repeating earlier mistakes:

1. creating overlapping authorities beside `scene-authoring`, `preview`, or `packaging`
2. destabilizing the current Batch 50 presentation-finish sequence
3. treating every requested high-end editor feature as an immediate implementation commitment
4. letting heavy systems such as voxel terrain, deep collaboration, visual scripting, broad procedural generation, marketplace scope, or physics-sandbox behavior enter the roadmap before prerequisite foundations are ready

The product already has clear authority boundaries and package ownership. The integration work needed to strengthen those boundaries, not reopen them.

## Decision

Course Creator OS will absorb the broader creator-capability ambition through a non-destructive audit and phased roadmap integration rather than through immediate broad implementation.

Concretely:

- the capability domains named in the strategic prompt become the current audit spine until a fuller source document is checked into the repo
- [STRATEGIC_CAPABILITY_EXPANSION_AUDIT_2026-04-15.md](/Users/westlunds/Documents/Website/SImulator/docs/spec/STRATEGIC_CAPABILITY_EXPANSION_AUDIT_2026-04-15.md) becomes the durable planning reference for what is already covered, partially covered, missing-but-near-term, deferred, or out of near-term scope
- near-term additions must attach to existing package owners such as `scene-authoring`, `asset-system`, `world-system`, `sim-logic`, `preview`, `packaging`, `playability`, and `performance`
- new packages should only be introduced when a capability truly outgrows those current authorities
- Batch 50 remains the exact next implementation batch

## Consequences

### Positive

- the roadmap can absorb broader ambition without derailing current momentum
- future feature work has a clearer sequencing model and authority map
- the repo now explicitly distinguishes high-value near-term additions from large deferred systems
- Build, Preview, Package, and Publish stay converged on shared truth instead of expanding through disconnected feature silos

### Tradeoffs

- some high-ambition systems are now explicitly delayed even if they sound attractive
- the current audit uses capability domains from the strategic prompt because a single checked-in source list is not yet present in the repo
- future roadmap updates need discipline so the phased buckets stay real instead of becoming a parking lot for every possible feature

## Follow-on Work

- execute Batch 50 without letting the broader audit dilute the current presentation-finish sequence
- pull the safest next additions from the near-term bucket after Batch 50, especially measurement tools, modular snap kits, starter-pack/import continuity, lighting-direction surfaces, and play-test posture
- keep deferring voxel terrain, full visual scripting, deep collaboration, procedural generation, marketplace scope, and physics-sandbox systems until the current foundations justify them
