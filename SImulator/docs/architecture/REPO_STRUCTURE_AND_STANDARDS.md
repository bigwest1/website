# Repo Structure And Standards

## Structure

- `apps/desktop`: desktop shell, routing, panels, and Tauri host.
- `packages/design-tokens`: source of truth for semantic and raw visual tokens.
- `packages/ui`: reusable UI exports and token runtime helpers.
- `packages/core-types`: background jobs, shared statuses, and common value objects.
- `packages/course-bible`: course identity and design-truth entities.
- `packages/hole-planner`: hole planning entities and metadata.
- `packages/asset-system`: asset registry and normalization state.
- `packages/world-system`: districts, landmarks, and world composition metadata.
- `packages/event-system`: animation and event definitions.
- `packages/project-model`: typed project aggregate, manifests, module definitions, and seed project.
- `packages/validation`: validation categories, issue model, and report engine.
- `packages/performance`: profile definitions and performance assessment.
- `packages/sim-logic`: tees, pins, surfaces, hazards, drop zones, and logic config.
- `packages/preview`: flyover, minimap, and screenshot structures.
- `packages/packaging`: package builds and release records.
- `packages/versioning`: snapshots and restore-state contracts.
- `packages/agent-system`: AI roster, task, and recommendation contracts.
- `packages/storage`: repository interfaces, SQLite adapters, and file-layout contracts.
- `packages/logging`: structured diagnostics and task logs.
- `packages/config`: app config, project defaults, and feature flags.
- `packages/integration`: managed integration contracts and adapter interfaces.
- `packages/utils`: low-level helpers only.
- `docs`: governance, spec, design, QA, architecture, ADRs, and agent charters.

## Standards

- Shared domain logic belongs in packages, not buried in component files.
- Each domain entity has one owning package and should not be redefined elsewhere.
- New creator-facing modules must declare ownership, deliverables, and quality gates.
- Compatibility logic must remain testable outside the UI.
- Warnings must map to action paths.
- Design tokens should change centrally before local CSS overrides are introduced.
- JSON project files remain the recoverable source of truth even if the SQLite index is rebuilt.
