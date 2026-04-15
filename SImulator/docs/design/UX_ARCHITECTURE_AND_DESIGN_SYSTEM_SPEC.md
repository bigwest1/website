# UX Architecture And Design System Specification

## Status

Approved for execution and now partially implemented in the desktop shell.

## UX Vision

Course Creator OS must feel premium, calm, powerful, modern, obvious, and trustworthy. The product should make creators feel oriented, capable, and confident that they are building inside a serious professional tool rather than a brittle modding utility.

## Core Shell Model

- Left rail: persistent navigation, quick-jump, and project tree
- Center workspace: the current mode’s main execution surface
- Right rail: inspector, validation, AI guidance, notes, and activity
- Top bar: project identity, mode context, save status, profile, release posture, validation summary, and primary action
- Bottom utility tray: jobs, packaging progress, and diagnostics

## Required UX Behaviors

- Every major screen communicates where the user is, what object is active, current progress, what needs attention, and what to do next.
- Each screen has one visually dominant primary action.
- Validation is shown before failure and always includes fix guidance.
- Advanced control is progressively disclosed rather than dumped into flat forms or tables.
- Managed integrations stay behind coherent product framing.

## Implemented Foundation

- Premium three-rail shell
- Tabbed right rail with validation, guidance, notes, and activity modes
- Global health banner
- Command palette trigger and keyboard shortcut
- Home, Create, Plan, Gameplay, Asset Library, World, and Performance mode frameworks
- Reusable status pills and validation issue cards

## Immediate Follow-Ons

- Flesh out full editor interactions inside `Create`, `Plan`, `Gameplay`, and `Asset Library`
- Add richer keyboard navigation and command palette actions
- Expand empty/loading/error state templates into reusable primitives
- Build full domain-specific components such as `HoleCard`, `EventTimeline`, and `PackageChecklist`

