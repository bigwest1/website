# Data Model And Repository Architecture Specification

## Status

Approved for execution and now reflected in the workspace package split.

## Architectural Direction

- Use a monorepo with `apps/desktop` as the product-composition layer and domain/system logic in `packages/*`.
- Keep domain ownership explicit so no major entity lives only inside `project-model` or screen files.
- Preserve dual persistence: human-readable project files as truth, SQLite as indexed local state.

## Package Ownership

- `packages/design-tokens`: token source of truth
- `packages/ui`: reusable UI exports and token runtime helpers
- `packages/core-types`: shared operational and status contracts
- `packages/course-bible`: course identity and design-truth model
- `packages/hole-planner`: hole planning model and metadata
- `packages/sim-logic`: tee, pin, hazard, surface, and drop-zone logic
- `packages/asset-system`: asset registry and normalization state
- `packages/world-system`: districts, landmarks, and world composition
- `packages/event-system`: event and animation contracts
- `packages/project-model`: project aggregate, manifest, and module registry
- `packages/validation`: validator outputs and issue aggregation
- `packages/performance`: performance profiles and assessment
- `packages/preview`: preview metadata and coverage calculations
- `packages/packaging`: package and release contracts
- `packages/versioning`: snapshots and restore-state ownership
- `packages/agent-system`: agent roster, task, recommendation, and decision summaries
- `packages/scene-authoring`: spatial scene entities, placement state, hierarchy, and transform authoring
- `packages/storage`: repository interfaces and persistence contracts
- `packages/logging`: diagnostics ownership
- `packages/config`: app runtime and project-default config
- `packages/integration`: managed integration adapters
- `packages/utils`: low-level helpers only

## Current Implementation Notes

- `project-model` now aggregates owned schemas from dedicated domain packages rather than defining course bible, hole, asset, world, and event objects inline.
- `ui` now consumes `design-tokens` instead of owning token definitions directly.
- `core-types` replaces the earlier `core` package as the shared contract layer.
- `storage`, `logging`, `config`, `versioning`, `agent-system`, and `scene-authoring` are scaffolded as first-class packages so later service work lands in the correct boundary.

## Persistence Contract

- Project files stay recoverable and portable independent of any SQLite index rebuild.
- SQLite remains the fast local index for assets, validation issues, history, logs, and background tasks.
- Packaging and validation must be reproducible from manifest-backed project data plus referenced assets.

## Immediate Follow-Ons

- Add real storage adapters and migrations under `packages/storage`.
- Move more generic shell primitives from `apps/desktop` into `packages/ui`.
- Replace seed summaries with service-derived summaries as persistence and validation services mature.
