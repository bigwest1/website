# ADR-0002: Domain-First Compatibility Architecture

## Status

Accepted

## Context

GSPro-ready output requires strict authoring rules, but the creator experience cannot expose raw technical chaos. We need a stable domain layer that can drive UI, validation, and packaging consistently.

## Decision

Define Course Creator OS around typed project manifests and compatibility-aware domain services. The shell consumes derived health and readiness signals instead of inventing its own interpretation of simulator correctness.

## Consequences

- Gameplay and compatibility rules become testable and traceable.
- Packaging logic has a stable upstream contract.
- The UI can remain high-level without becoming detached from output reality.

