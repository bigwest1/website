# Data Model Draft

## Core Entities

### Project Manifest

- `id`
- `name`
- `slug`
- `projectMode`
- `createdAt`
- `updatedAt`
- `version`
- `holeCount`
- `activeOutputProfiles`
- `primaryTheme`
- `realismTarget`
- `spectacleTarget`
- `targetHardwareProfile`
- `activeStylePack`
- `activeValidationProfile`
- `courseType`

### Course Bible

- `courseIdentity`
- `visionSummary`
- `audienceSummary`
- `worldIdentity`
- `styleGrammar`
- `materialLanguage`
- `lightingLanguage`
- `environmentLogic`
- `pacingPlan`
- `signatureMoments`
- `constraints`
- `notes`
- `releaseIntent`

### Hole

- `holeId`
- `number`
- `par`
- `targetYardage`
- `teeSetRefs`
- `pinSetRefs`
- `emotionalRole`
- `readabilityTarget`
- `challengeRating`
- `metadata`
- `hazardRefs`
- `landmarkRefs`
- `eventRefs`
- `playabilityStatus`
- `previewRefs`

### Supporting Entities

- `TeeSet`
- `PinSet`
- `SurfaceProfile`
- `HazardProfile`
- `District`
- `Landmark`
- `Asset`
- `EventSequence`
- `PreviewPath`
- `ScreenshotPlan`
- `PackageBuild`
- `ReleaseRecord`
- `Snapshot`
- `BackgroundJob`

## Relationship Summary

- One project has one manifest, one course bible, one simulator logic configuration, one performance snapshot, one validation summary, one packaging summary, one versioning summary, and many holes.
- A project owns many assets, districts, landmarks, events, preview paths, package builds, release records, and snapshots.
- Module statuses summarize progress for every product mode.
- Validation issues can target the project, a module, or a specific entity such as a hole, asset, hazard, or package build.

## Persistence Direction

- JSON manifests and project files remain the human-auditable source of truth for project state.
- SQLite stores derived indexes, search metadata, diagnostics, and performance snapshots.
- Packaging artifacts remain reproducible from manifests plus referenced assets.
