# Course Creator OS

Course Creator OS is a desktop-first creative suite for designing, validating, packaging, and releasing GSPro-compatible golf simulator courses.

This repository starts with a product-grade foundation rather than an MVP shell:

- A governance and architecture layer that fixes the product direction early.
- A desktop app shell aligned to the required Version 1.0 modules.
- Typed shared packages for project manifests, course bible, hole planning, simulator logic, assets, world systems, events, validation, preview, performance, packaging, storage, integrations, and design tokens.
- A Tauri-first desktop structure with clear local-service and compatibility boundaries.

## Workspace Layout

- `apps/desktop`: React + TypeScript + Vite desktop shell and Tauri host.
- `packages/design-tokens`: single source of truth for theme and semantic token values.
- `packages/ui`: reusable UI-layer exports and design-token runtime helpers.
- `packages/core-types`: shared status enums, background-job types, and common core contracts.
- `packages/course-bible`: course identity and design-truth domain model.
- `packages/hole-planner`: hole planning domain model and metadata.
- `packages/asset-system`: asset registry and normalization model.
- `packages/world-system`: districts, landmarks, and world composition types.
- `packages/event-system`: living-world event and sequence contracts.
- `packages/project-model`: typed project schema, manifest, module definitions, and seed project data.
- `packages/validation`: validation categories, issue model, and report generation.
- `packages/performance`: performance profiles and risk assessment.
- `packages/sim-logic`: simulator logic schemas for tees, pins, surfaces, hazards, and drop zones.
- `packages/preview`: preview, flyover, minimap, and screenshot planning models.
- `packages/packaging`: package build and release record contracts.
- `packages/versioning`: snapshots and restore-state contracts.
- `packages/agent-system`: agent roster, task, recommendation, and risk model.
- `packages/integration`: managed tool adapter contracts and health models.
- `packages/storage`: repository interfaces, file-layout contracts, and SQLite index ownership.
- `packages/logging`: diagnostics and structured logging contracts.
- `packages/config`: app config, project defaults, and feature flags.
- `packages/utils`: low-level helpers only.
- `docs`: spec, design, QA, architecture, ADRs, and agent charters.

## Quick Start

```bash
npm install
npm run dev
```

For the native shell:

```bash
npm run tauri:dev
```

The current environment used to bootstrap this repo does not include Rust/Cargo, so the web shell is fully bootstrapped and the Tauri native layer is scaffolded but not yet verified locally.
