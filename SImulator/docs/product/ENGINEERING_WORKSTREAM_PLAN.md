# Engineering Workstream Plan

## Workstream A — Governance, Product, and Decision Continuity

Owner: `NORTHSTAR + BLACKBOOK`

- governance docs
- product briefs
- acceptance criteria
- decision logging
- roadmap upkeep
- module status board

Current focus: keep planning artifacts aligned to actual implementation rather than stale intent.

## Workstream B — Architecture and Package Foundation

Owner: `BLUEPRINT`

- monorepo structure
- package boundaries
- dependency rules
- service architecture
- persistence strategy
- ADRs

Current focus: keep explicit package ownership intact as the system grows.

## Workstream C — Design System and UX Foundation

Owner: `VELVET GRID`

- design tokens
- AppShell layouts
- navigation standards
- screen structure
- component patterns
- global health and validation patterns

Current focus: keep premium UX quality moving in parallel with domain work.

## Workstream D — App Shell and Platform Composition

Owner: `SPARK ENGINE`

- desktop shell
- workspace routing
- navigation wiring
- app composition
- command palette foundation
- utility tray framework

Depends on: `Workstream B`, `Workstream C`

## Workstream E — Project Model and Persistence

Owner: `BLUEPRINT + SPARK ENGINE`

- project manifest
- core entities
- storage adapters
- SQLite foundations
- project creation flow
- snapshots foundation

Depends on: `Workstream B`

## Workstream F — Simulator Logic Center

Owner: `FAIRWAY MIND`

- tee/pin schemas
- hole metadata rules
- surface/hazard models
- drop zone model
- logic completeness rules
- simulator validation contracts

Depends on: `Workstream B`, `Workstream E`

## Workstream G — Asset and World Systems

Owner: `WORLDSMITH + SPARK ENGINE`

- asset model
- import normalization state
- asset browser foundations
- districts and landmarks
- world composition structures
- theme pack readiness

Depends on: `Workstream B`, `Workstream E`

## Workstream H — Validation and QA

Owner: `STEEL CHECK`

- validation issue model
- validation engines
- severity system
- readiness states
- issue card behaviors
- quality gates
- test planning

Depends on: `Workstream B`, `Workstream E`, `Workstream F`, `Workstream G`

## Workstream I — Performance and Diagnostics

Owner: `GLASSHOUSE`

- performance profiles
- project diagnostics
- logging standards
- task logging
- issue triage surfaces
- restore/recovery patterns

Depends on: `Workstream E`, `Workstream H`

## Workstream J — Preview and Packaging

Owner: `LENSWORK + SPARK ENGINE`

- preview entities
- flyover/minimap structures
- package model
- publish metadata model
- release candidate flow

Depends on: `Workstream E`, `Workstream F`, `Workstream H`

## Workstream K — Integration Layer

Owner: `DEEP CURRENT`

- adapter interfaces
- tool path model
- integration health
- bridge abstractions
- managed execution contracts

Depends on: `Workstream B`, `Workstream E`

## Workstream L — Agent Command Center

Owner: `IRON FORGE + SPARK ENGINE`

- agent state model
- recommendation surfaces
- active queue visibility
- decision summaries
- module progress visibility

Depends on: `Workstream D`, `Workstream E`, `Workstream A`

## No-Idle Protocol

If a lane is blocked, reassign effort immediately to one of:

- docs and ADR completion
- design system refinement
- component library buildout
- test coverage expansion
- validator implementation
- storage adapters
- issue card and health surfaces
- preview shell work
- logging and diagnostics work
