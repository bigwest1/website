# Architecture Overview

## Layer Model

### Layer 1: Creator UX Shell

Owns navigation, workspace composition, guidance, validation surfacing, and project-health visibility.

### Layer 2: Creation Services

Owns project persistence, asset indexing, validation, diagnostics, packaging orchestration, performance grading, and event state coordination.

### Layer 3: Managed Integrations

Wraps external authoring or heavy-lift execution systems behind stable service adapters. Integration complexity must not leak into the creator-facing workflow.

### Layer 4: Compatibility Contract

Defines the non-negotiable rules that decide whether output is structurally complete, simulator-correct, performant enough, and package-ready for GSPro-compatible playback.

## Application Shape

- `apps/desktop`: creator-facing shell, route composition, panels, and orchestration entrypoints.
- `packages/design-tokens`: semantic token source for the desktop product.
- `packages/ui`: reusable UI exports and runtime helpers that stay separate from app composition.
- `packages/core-types`: shared statuses, IDs, and operational value objects.
- `packages/course-bible`: course identity and design-truth domain.
- `packages/hole-planner`: hole planning entities and intent metadata.
- `packages/asset-system`: asset registry, normalization, and approval model.
- `packages/world-system`: districts, landmarks, and world composition metadata.
- `packages/event-system`: ambient, triggered, scheduled, and payoff event contracts.
- `packages/project-model`: typed project aggregate, manifest, module definitions, and seed project data.
- `packages/validation`: issue model, validation categories, and report synthesis.
- `packages/performance`: profile definitions and performance risk assessment.
- `packages/sim-logic`: simulator logic model for tees, pins, hazards, surfaces, and drop zones.
- `packages/preview`: flyover, minimap, and screenshot planning structures.
- `packages/packaging`: package build and release contracts.
- `packages/versioning`: snapshot and restore-state ownership.
- `packages/agent-system`: recommendation, task, and decision-summary structures.
- `packages/storage`: JSON/SQLite persistence interfaces and file layout contracts.
- `packages/logging`: diagnostics ownership.
- `packages/config`: app runtime and project-default configuration.
- `packages/integration`: managed integration adapters and health contracts.

## State Direction

- Project state is modeled through typed manifests that can be persisted to JSON and mirrored into SQLite.
- Validation and health summaries are derived from domain rules rather than hand-maintained UI flags.
- UI state remains workspace-specific and reversible; domain state remains durable and compatibility-focused.

## Persistence Direction

- Project truth lives in human-readable project files and can be rebuilt into indexes.
- SQLite remains an indexed local state service for fast search, diagnostics, history, and task records.
- UI composition remains downstream of package-owned domain services rather than becoming the source of truth.
