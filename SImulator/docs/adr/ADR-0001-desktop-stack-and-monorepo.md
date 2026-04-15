# ADR-0001: Desktop Stack And Monorepo

## Status

Accepted

## Context

The product needs a desktop-first shell, shared domain packages, clear documentation, and long-term room for local services and integrations without collapsing everything into a single frontend directory.

## Decision

Use a workspace-driven monorepo with:

- `apps/desktop` for the React/Vite/Tauri application shell.
- `packages/design-tokens` for visual tokens.
- `packages/ui` for reusable UI exports and token runtime helpers.
- `packages/core-types` for shared operational and status contracts.
- `packages/course-bible`, `packages/hole-planner`, `packages/asset-system`, `packages/world-system`, and `packages/event-system` for domain-owned entities.
- `packages/project-model` for project aggregation and manifest ownership.
- `packages/validation`, `packages/performance`, `packages/sim-logic`, `packages/preview`, `packages/packaging`, `packages/versioning`, `packages/agent-system`, `packages/storage`, `packages/logging`, `packages/config`, and `packages/integration` for specialized system layers.

## Consequences

- Shared logic stays reusable and testable outside the app shell.
- The shell can evolve without owning all compatibility concerns directly.
- Native verification still depends on the Rust/Tauri toolchain being available locally.
