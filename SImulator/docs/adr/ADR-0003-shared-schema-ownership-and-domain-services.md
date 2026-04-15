# ADR-0003: Shared Schema Ownership And Domain Services

## Status

Accepted

## Context

The hardening review found three structural drift risks:

- validation duplicated shared severity, status, and health-state schemas that already belong to `core-types`
- versioning mutations for snapshots and restore points were implemented inside the desktop session layer instead of the `versioning` package
- the validation package exposed its validator internals through the public package root, which made its API broader than the app actually needs

If those patterns continue, package ownership will blur and the app shell will slowly become the place where domain behavior lives.

## Decision

Reinforce three rules:

- shared operational schemas and enums must be owned once in the package that defines the canonical contract, then imported elsewhere
- domain mutations must live in domain packages as pure services, while the app shell only orchestrates them
- package roots should export stable public contracts, not every internal implementation detail by default

## Consequences

- shared status semantics stay consistent across validation, diagnostics, and project health surfaces
- versioning behavior becomes testable without React or session state
- package APIs become easier to understand and less likely to create accidental coupling to internals
