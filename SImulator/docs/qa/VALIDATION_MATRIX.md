# Validation Matrix

| Category | Example Checks | Primary Owner Module | Typical Severity Range |
| --- | --- | --- | --- |
| Project Integrity | hole count mismatch, broken manifest, missing base structure | Create | High-Critical |
| Course Bible Completeness | missing vision, weak signature moments, no release intent | Plan | Warning-High |
| Hole Metadata Completeness | missing yardage, incomplete preview refs, weak role notes | Plan | Warning-High |
| Simulator Logic Correctness | missing tee/pin depth, OB gaps, missing drop zones | Gameplay | Warning-Critical |
| Asset Health | pending approval, scale/orientation issues, invalid source hygiene | Asset Library | Info-High |
| Style Consistency | assets fighting the intended world language | Asset Library / World | Info-Warning |
| Playability | blind openings, unfair hazards, spectacle conflicts | Playability | Warning-High |
| Performance Risk | over-budget density, animation load, visibility complexity | Performance | Warning-High |
| Preview Readiness | incomplete flyover/minimap coverage, missing screenshot plans | Preview | Warning-High |
| Packaging Readiness | failed package candidate, missing artifacts, unresolved blockers | Package | High-Critical |
| Publish-Safe Readiness | no public-safe release record, incomplete metadata | Publish | Warning-High |

## UX Rules

- Every issue includes why it matters, where it lives, and how to fix it.
- High and Critical issues must point to an explicit owner workspace.
- Validation should be visible across the shell, not trapped inside one screen.

