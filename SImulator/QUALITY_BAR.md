# Quality Bar

## Purpose

This document defines the minimum quality threshold for saying a feature, module, or workflow is actually on track. “Compiles” is not enough.

## Product Quality

- Every major module states purpose, readiness, warnings, and next step without ambiguity.
- Core workflows are navigable without hidden prerequisites or undocumented side paths.
- The creator can move from planning to validation without leaving the product confused about project state.
- Warnings and blockers explain impact and remediation rather than merely naming a problem.

Fail condition:

- A technically working surface still leaves the user unsure what to do next.

## UX And Design Quality

- The interface remains dark-first, navy-led, calm, and premium.
- Visual hierarchy, spacing, and contrast must support dense authoring work without fatigue.
- Right-rail, health, and inspector behaviors remain consistent across workspaces.
- Motion is restrained and structural, not decorative noise.
- Empty, loading, and error states are explicit and useful.

Fail condition:

- A module adds control density or visual noise faster than it adds clarity.

## Domain Quality

- Domain ownership is explicit; core rules are not hidden in UI components.
- State transitions use named statuses rather than vague booleans where behavior matters.
- Simulator logic rules are modeled in typed schemas and testable services.
- World, preview, packaging, and versioning data have real owned contracts.

Fail condition:

- A future engineer would need to reverse-engineer business rules from screens or local hooks.

## Validation Quality

- Every validation issue includes severity, impact, owner module, related entity, and fix guidance.
- Validation categories cover project integrity, planning, simulator logic, assets, performance, preview, packaging, and publish posture.
- Readiness states are understandable at both module and project level.

Fail condition:

- The system can detect a problem but cannot guide the user toward a fix.

## Engineering Quality

- Strict TypeScript stays enabled across shared packages and the app shell.
- Package APIs remain intentional and low-coupling.
- Storage, logging, validation, and integration behavior remain testable outside React.
- New code follows package ownership instead of creating convenience bypasses.

Fail condition:

- The app shell or a utility package becomes a dumping ground for domain logic.

## Reliability Quality

- Destructive or risky flows have confirmation, diagnostics, or recovery posture.
- Snapshots, logs, and background task visibility are part of the product contract.
- Project truth remains recoverable if the SQLite index is rebuilt.

Fail condition:

- A creator can lose meaningful work without a clear recovery path.

## Release Quality

- Packaging surfaces blockers before an export attempt.
- Preview, package, and publish readiness are visible and profile-aware.
- “GSPro-ready” cannot be claimed while export-critical data is missing or invalid.

Fail condition:

- Release flows can advance while known critical gaps remain unresolved.

## Minimum Evidence Before A Module Is Ready

- The module uses shared design tokens and UI patterns.
- The module operates on real or intentionally contracted data.
- Critical state transitions are covered by tests or validator output.
- Empty, loading, error, and blocker states are handled.
- The next-step relationship to the creator is obvious.

## Recorded Assumptions

- Premium UX quality is a release criterion, not a later polish pass.
- Validation and recovery quality are part of the product definition, not optional hardening work.
