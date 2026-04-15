# Course Creator OS Version 1.0 Full Product Specification

## Status

Approved for execution.

## Product Summary

Course Creator OS is a desktop-first, premium, creator-first platform for designing, configuring, validating, packaging, and releasing GSPro-compatible golf simulator courses. It must support realistic, stylized, fantasy, amusement, resort, urban, surreal, historical, and other course directions without collapsing into a niche tool.

The first flagship output is a premium modern theme park course, but the platform architecture must remain theme-agnostic.

## Product Modes

1. Home
2. Create
3. Plan
4. Build
5. Gameplay
6. Asset Library
7. World
8. Animate
9. Playability
10. Performance
11. Preview
12. Package
13. Publish
14. Version Control
15. Agent Command Center
16. Settings

## Version 1.0 Scope

- Desktop-first app shell
- Project setup and templates
- Course bible and hole planning
- Terrain and routing planning
- Gameplay and simulator logic configuration
- Asset normalization and approval posture
- Worldbuilding, events, preview, playability, performance, packaging, and publish posture
- Local project state, snapshots, logs, and package diagnostics

## Data Model Direction

Primary objects:

- Project / ProjectManifest
- CourseBible
- Hole
- TeeSet
- PinSet
- SurfaceProfile
- HazardProfile
- District
- Landmark
- Asset
- EventSequence
- PreviewPath
- ValidationIssue
- PerformanceProfile
- PackageBuild
- ReleaseRecord
- Snapshot

## Validation System

Required categories:

- Project Integrity
- Course Bible Completeness
- Hole Metadata Completeness
- Simulator Logic Correctness
- Asset Health
- Style Consistency
- Playability
- Performance Risk
- Preview Readiness
- Packaging Readiness
- Publish-Safe Readiness

Required severities:

- Info
- Warning
- High
- Critical

Every issue must explain why it matters, where it lives, how to fix it, and which module owns it.

## Performance Profiles

- Brother Mode: targets the known high-end playback machine.
- Community Safe: more conservative expectations for wider distribution.
- Showcase: high-ambition presentation and promo posture.

## Packaging And Publish Contract

Packaging must check broken references, invalid assets, metadata gaps, unresolved critical validation issues, output/profile mismatch, and preview coverage gaps before calling a build release-ready.

Publish must distinguish private experimental posture from public-safe release posture and prepare release notes, credits, version labels, and showcase media requirements.

## Technical Direction

- Tauri desktop shell
- React + TypeScript frontend
- Shared TypeScript packages
- JSON project manifests
- SQLite-backed local indexing and service state
- Local background service layer for indexing, validation, packaging, orchestration, and diagnostics

## Governance Requirements

The repository must maintain:

- Root governance docs
- `docs/adr/`
- `docs/agent-charters/`
- `docs/spec/`
- `docs/design/`
- `docs/qa/`

## Immediate Execution Implications

- The shell navigation must follow creator workflow rather than engineering internals.
- Simulator logic remains a first-class domain, not a side settings page.
- Validation is proactive and action-oriented.
- Performance posture and package readiness are visible throughout the product.

