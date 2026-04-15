# Course Creator OS — AGENTS

## Scope

These instructions apply to the entire repository.

Read this file before making changes. For major work, follow it alongside:

1. [PRODUCT_MASTER_BRIEF.md](/Users/westlunds/Documents/Website/SImulator/PRODUCT_MASTER_BRIEF.md)
2. [docs/spec/MASTER_AUTONOMOUS_EXECUTION_CHARTER.md](/Users/westlunds/Documents/Website/SImulator/docs/spec/MASTER_AUTONOMOUS_EXECUTION_CHARTER.md)
3. [docs/spec/CODEX_MASTER_PROMPT_PACK.md](/Users/westlunds/Documents/Website/SImulator/docs/spec/CODEX_MASTER_PROMPT_PACK.md)
4. the approved product, UX, architecture, and roadmap specs in `/docs/spec`

## Product Vision Guardrails

- Build a premium, desktop-first, creator-first product, not a toy or MVP shell.
- Keep the platform theme-agnostic. The flagship theme park course raises the quality bar; it must not theme-lock the product.
- Preserve a clear route to GSPro-compatible output through in-app authoring, simulator logic, validation, packaging, and publish posture.
- The creator must never feel lost, stuck, or unsure what to do next.
- Treat 3D placement, terrain/routing, simulator logic, and validation as core product pillars, not side utilities.
- Maintain one coherent product experience even when managed integrations are used.
- The standard is not merely that the app runs. The standard is that it is becoming the course creation platform creators will prefer.

## Architecture Guardrails

- Keep domain logic in owned packages. The app layer composes; it must not become the business-logic dump.
- Do not duplicate domain types. Every persistent concept has one owning package.
- Preserve the dual-persistence model: human-readable project files are durable truth; SQLite is rebuildable indexed working state.
- Keep external tool assumptions behind integration adapters. UI modules should not depend on tool-specific implementations.
- Prefer explicit state models over vague booleans for readiness, approval, and playability.
- Keep package APIs intentional and narrow. Avoid exporting internal implementation details by default.

## UX Guardrails

- Respect the creator workflow: define, plan, build, configure, enrich, validate, preview, package, publish.
- Every major screen needs an obvious primary action and a visible next step.
- Keep the interface dark-first, navy-anchored, calm, highly readable, and premium.
- Do not let expert power collapse into clutter. Use progressive disclosure.
- Build workspaces should feel like serious creative tools, not spreadsheet dumps, gamer HUDs, or generic dashboards.

## Simulator Logic And Compatibility Guardrails

- Simulator-critical logic is first-class product scope.
- Do not let spectacle hide broken golf logic.
- Tees, pins, hazards, OB, drop zones, flyovers, and minimap data must have in-app ownership and a path to spatial truth.
- Gameplay correctness, readability, and compatibility matter as much as visual ambition.

## Package Boundary Rules

- `apps/desktop` owns product composition, routing, shell layout, and native bridge wiring.
- Domain packages own schemas, services, summaries, validation hooks, and persistence-facing contracts for their concepts.
- `project-model` aggregates project state; it must not re-own domain rules that belong in packages like `course-bible`, `hole-planner`, `sim-logic`, `scene-authoring`, `asset-system`, or `world-system`.
- Screen files may orchestrate package services and selectors, but must not define durable domain types or core business rules.
- If a new durable concept appears more than once, create or extend the owning package instead of adding one-off screen logic.

## Validation And Reliability Expectations

- Validation is part of feature delivery, not a cleanup pass.
- New product-critical domains need typed validators, actionable issue output, and tests for core state changes.
- Destructive or risky flows must have a recovery path, explicit confirmation, or both.
- Build confidence comes from actionable diagnostics, not silent failure or optimistic assumptions.

## Documentation And Governance Rules

- Update [DECISION_LOG.md](/Users/westlunds/Documents/Website/SImulator/DECISION_LOG.md) when package boundaries, execution posture, persistence strategy, UX architecture, or product scope materially change.
- Update [MODULE_STATUS_BOARD.md](/Users/westlunds/Documents/Website/SImulator/MODULE_STATUS_BOARD.md) when a module’s readiness state, blocker, or next action changes materially.
- Update roadmap/spec/ADR docs when changes alter long-term direction, not just local implementation details.
- If the same correction keeps reappearing across tasks, update this `AGENTS.md` so the repo learns from it.

## Plan-First Rule For Major Work

- Use plan mode first for major features, repo-wide structural changes, new top-level packages, cross-cutting refactors, persistence architecture changes, major workspace rewrites, or emergency refocus work.
- Audit against the controlling product docs before implementing structural changes.
- Do not continue coding blindly when drift is visible. Refocus first, then resume.
- If the canonical prompt pack is updated and recurring execution corrections appear, record the stronger rule here so repo instructions improve with the product.

## Working Norms

- Favor the smallest high-leverage correction set when repairing drift.
- Keep architecture, UX, simulator logic, validation, release truth, and host/runtime trust aligned in the same implementation cycle when they materially touch the same feature.
- Verify structural changes with typecheck, tests, and build when feasible.
- Keep docs and implementation consistent enough that a future agent can resume without chat history.
