# Vision Guardrails

## Purpose

These guardrails define what Course Creator OS must protect even when implementation details, tooling, or sequencing change. If a proposal conflicts with these rules, the proposal is wrong unless a logged decision explicitly replaces the guardrail.

## Guardrail Matrix

| Guardrail | Required Behavior | Failure Signal |
| --- | --- | --- |
| Premium product quality | Core screens must feel deliberate, modern, polished, and useful. | The product feels like a hobbyist utility, a developer console, or a generic admin dashboard. |
| Navy-led visual identity | Navy blue anchors the theme, token system, and visual brand posture. | The UI drifts into inconsistent color language or loses its visual center. |
| UX equals technical capability | Workflow clarity, hierarchy, and guidance carry equal weight with feature depth. | A technically capable module still leaves users confused or anxious. |
| Orientation at all times | Users can always identify current location, edited object, health state, and next step. | A user can get stuck in a screen without obvious action or explanation. |
| Theme-agnostic architecture | The platform must support many course types while showcasing a theme park flagship. | Systems, labels, or schemas become hard-wired to one world style. |
| Believable flagship execution | The flagship theme park course must feel premium, coherent, and worldbuilt. | Spectacle becomes random, disconnected, or hostile to playability. |
| In-app simulator logic authority | Tee, pin, metadata, surface, hazard, drop-zone, flyover, and minimap data have a first-class home in the app. | Export-critical simulator logic lives in hidden files, side tools, or ad hoc workflows. |
| Unified experience over tool chaos | Managed integrations may exist, but product flow must remain coherent and understandable. | UI screens directly expose vendor-specific complexity or brittle external assumptions. |
| Reliable GSPro-ready path | Validation, packaging, and compatibility rules must protect playable output. | “Ready” states can be reached while export-critical data is missing or ambiguous. |
| Repeatable elite creation over gimmicks | The product optimizes for sustained course creation quality, not flashy one-off demos. | Features look impressive in a demo but do not improve repeatable creator throughput or output quality. |

## Practical Enforcement Rules

- Every warning must explain why it matters and what the user should do next.
- Every advanced control must be progressively disclosed behind a baseline workflow that is safe for first use.
- Every module must report status into a project-health model visible outside the module itself.
- Every integration decision must be judged on whether the creator still experiences one coherent product.
- Every screen must have a dominant primary action.
- Every destructive action must include either a recovery path or explicit confirmation.

## Guardrail Review Questions

Use these questions before accepting a feature, workflow, or technical shortcut:

1. Does this make the product clearer or more confusing?
2. Does this preserve creator control without forcing expert knowledge too early?
3. Does this improve or weaken simulator/output reliability?
4. Does this stay useful outside the flagship theme park context?
5. Does this make the product feel more premium or more improvised?

## Recorded Assumptions

- The premium dark-first navy direction remains stable for Version 1.0.
- The creator’s confidence is a product requirement, not a marketing outcome.
- Unified UX takes precedence over exposing raw external-tool behavior.
