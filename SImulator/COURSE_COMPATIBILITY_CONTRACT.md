# Course Compatibility Contract

## Purpose

This document defines what Course Creator OS must be able to prove before calling a course “GSPro-ready” or “release-candidate ready.”

## Contract Position

- The creator experience may be more elegant than the target simulator format, but output requirements cannot disappear behind abstraction.
- Every creator-facing shortcut must map back to explicit simulator-compatible data.
- Validation must separate polish advice from true export blockers.
- Compatibility is a product contract, not a best-effort aspiration.

## Source-Of-Truth Rules

- Portable project files are the durable project truth.
- SQLite indexing and cached state support speed, diagnostics, and search, but do not replace project truth.
- Export-critical compatibility checks must be reproducible from owned domain data and package rules.

## Minimum Required Authoring Data

The platform must own and validate, at minimum:

- project manifest identity and output posture
- coherent hole count and hole order
- tee sets per playable hole
- pin sets per playable hole
- par and target distance metadata
- required surface assignments
- hazard and out-of-bounds definitions
- drop zones where gameplay rules require them
- line-of-play and shot-readability inputs
- minimap and flyover metadata or explicit profile-based waivers

## Compatibility Gates

### Gate 1 — Structural Completeness

- Project manifest is valid and versioned.
- Hole count, numbering, and ordering are coherent.
- Required project files and folder contracts exist.
- References between project entities are resolvable.

### Gate 2 — Gameplay Correctness

- Tee sets and pin sets are defined for each playable hole.
- Par, yardage, and required metadata are present.
- Surfaces, hazards, out-of-bounds, and drop-zone rules are valid.
- Hole order and line-of-play checks pass rule evaluation.

### Gate 3 — Presentation Readiness

- Flyover and minimap metadata exist, or a profile-specific waiver is explicitly recorded.
- First-shot readability and spectacle-interference issues remain below blocking tolerance.
- Preview assets needed for packaging and publish flows are present.

### Gate 4 — Performance Readiness

- The selected output profile meets its declared performance budget.
- Asset usage, world density, and event load fit the selected export posture.
- The project has no unresolved critical performance blockers for the selected profile.

### Gate 5 — Packaging Integrity

- No broken references remain in package-critical content.
- No unresolved critical validation issues remain.
- Required build metadata, output-profile selection, and artifact paths are present.
- Packaging diagnostics can explain any failure clearly.

## Output Profiles

- `brother-mode`: targets the known high-end playback machine and allows higher visual ambition.
- `community-safe`: targets broader playability with more conservative budgets.
- `showcase`: supports presentation-first output where visual ambition is prioritized but still tracked explicitly.

## Waiver Rules

- Waivers are allowed only for profile-specific or intentionally optional presentation data.
- Waivers must be explicit, visible, and recorded in project state.
- Waivers cannot bypass missing gameplay-critical or export-critical data.

## Blocking Conditions

- Missing or contradictory gameplay metadata.
- Broken routing or unplayable hole order.
- Undefined required surfaces, hazards, or drop-zone logic.
- Preview or package-critical files missing from a required release flow.
- Output profile violations above hard thresholds.
- Unresolved critical validation issues in compatibility-owned categories.

## Recorded Assumptions

- GSPro-ready means a defensible, validated path to playable output, not a blind export attempt.
- Compatibility rules will evolve, but the contract must remain stricter than convenience-driven shortcuts.
