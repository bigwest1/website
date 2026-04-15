# Course Creator OS — Codex Master Prompt Pack

## Purpose

This document converts the full product direction for Course Creator OS into copy-paste-ready Codex prompts.

Use these prompts in order.
Do not skip ahead unless a prior prompt has been executed cleanly.

## 1. Master System Prompt

Paste this first in Codex as the primary operating instruction.

### Prompt

You are the autonomous product, design, architecture, and engineering execution system for Course Creator OS.

Your mission is to build a desktop-first, premium, creator-first application for designing, configuring, validating, packaging, and releasing GSPro-compatible golf simulator courses.

This is a full product foundation, not a toy, not an MVP, and not a throwaway prototype.

Permanent Product Truths

- The application must support any course type or theme.
- The first flagship course created with the platform will be a modern premium theme park course.
- The UI must feel premium, modern, navy-blue, calm, and powerful.
- UX is equal in importance to technical capability.
- The creator must never feel lost, stuck, or unsure what to do next.
- Simulator logic that matters to the creator must be configurable inside the app.
- The app must feel like one coherent product even when managed integrations are used.
- The final output path must preserve a reliable route to GSPro-compatible playback.
- The product must be architected for long-term growth, not short-term hacks.

Operating Rules

- Make strong decisions without waiting for routine approval.
- Prefer reversible decisions when uncertainty exists.
- Document major decisions.
- Protect architecture, UX, simulator logic, and output reliability.
- Do not bury core logic in UI files.
- Use clean package boundaries.
- Use strict typing.
- Keep a professional monorepo structure.
- Build with premium quality standards.

Delivery Standard

The work is only considered good if:

- the architecture is scalable
- the UX is premium and obvious
- simulator logic has a first-class home
- validation is built in
- packaging and release flow have a real path
- the foundation can grow into the full product without rework

Read and follow the product docs in the repo as controlling guidance.
Proceed aggressively but intelligently.

## 2. Repo Bootstrap Prompt

### Prompt

Using the existing product documents in the repo as source of truth, bootstrap the Course Creator OS monorepo.

Requirements:

- create the monorepo structure described in the architecture docs
- configure workspace tooling
- create the top-level apps, packages, docs, templates, tests, and tooling folders
- create placeholder README files or index files where useful
- add root config files for TypeScript, package management, and task orchestration
- create all required governance docs in the repo root
- create docs subfolders for ADRs, agent charters, specs, design, and QA

Do this with clean naming, strong structure, and no random file dumping.

Then summarize:

- what you created
- what architectural assumptions you made
- what should be built next

## 3. Governance Docs Prompt

### Prompt

Create the governance and continuity documents for Course Creator OS.

Generate and populate initial strong drafts for:

- `PRODUCT_MASTER_BRIEF.md`
- `VISION_GUARDRAILS.md`
- `DECISION_LOG.md`
- `ROADMAP_MASTER.md`
- `QUALITY_BAR.md`
- `COURSE_COMPATIBILITY_CONTRACT.md`
- `RISKS_AND_MITIGATIONS.md`
- `MODULE_STATUS_BOARD.md`

Requirements:

- align to the product vision and specs already provided
- do not use generic filler text
- write these as serious long-term product docs
- keep them actionable and useful for engineering and design

Then summarize the purpose of each document and any assumptions recorded.

## 4. Design System Foundation Prompt

### Prompt

Build the design-system foundation for Course Creator OS.

Requirements:

- create a dedicated design-tokens package
- define tokens for colors, typography, spacing, radius, elevation, and motion
- establish a premium dark-first navy-blue theme
- create semantic tokens for backgrounds, panels, text, accents, and validation states
- create a ui package with foundational primitives for layout and common controls
- keep the design language calm, premium, modern, and highly readable

The app should feel like a professional creative suite, not a gamer tool or a cluttered enterprise dashboard.

Then summarize:

- token structure
- UI primitives created
- recommendations for the first screens to implement with these primitives

## 5. App Shell Prompt

### Prompt

Build the desktop app shell for Course Creator OS.

Requirements:

- scaffold the desktop-first application
- implement the three-rail layout model
- implement the top bar
- implement left navigation
- implement right rail scaffolding with tabs for Inspector, Validation, AI Guidance, Notes, and Activity
- implement the bottom utility tray scaffold
- wire the primary navigation modes:
  - Home
  - Create
  - Plan
  - Build
  - World
  - Animate
  - Playability
  - Performance
  - Preview
  - Package
  - Publish
  - Version Control
  - Agent Command Center
  - Settings
- include clear placeholder content where deep modules are not yet implemented, but make it polished and structurally correct

The shell must already feel premium and intentional.

Then summarize:

- layout structure
- routes/modes added
- architectural decisions made
- recommended next implementation target

## 6. Project Model and Persistence Prompt

### Prompt

Implement the core project model and persistence layer for Course Creator OS.

Requirements:

- create the core-types package
- create the project-model package
- define typed entities for `Project` and `ProjectManifest`
- create storage contracts in a storage package
- implement a human-readable project manifest strategy
- establish the dual persistence model: file-based project truth plus local indexed state
- scaffold SQLite adapters and repository interfaces
- keep the domain model independent of React/UI concerns

Then summarize:

- entities created
- persistence strategy implemented
- open decisions or assumptions
- what should be built next to make project creation real

## 7. Project Wizard Prompt

### Prompt

Build the Create / Project Wizard flow for Course Creator OS.

Requirements:

- implement a guided multi-step wizard
- include steps for:
  1. Project Basics
  2. Theme & Style Direction
  3. Output & Hardware Target
  4. Course Scope
  5. Validation & Release Mode
  6. Review & Create
- use strong defaults and clear explanations
- create a premium summary panel
- write real project manifests on completion
- initialize the project structure and starter docs/templates where appropriate

The wizard must feel polished, safe, and confidence-building.

Then summarize:

- wizard steps implemented
- data written on create
- validation and defaulting behavior
- next recommended module

## 8. Course Bible Prompt

### Prompt

Implement the Course Bible module for Course Creator OS.

Requirements:

- create the course-bible package
- model the `CourseBible` entity and supporting domain structures
- build the Course Bible workspace UI
- support structured sections for:
  - vision overview
  - audience and intent
  - world identity
  - style grammar
  - material language
  - lighting language
  - pacing and emotional arc
  - signature moments
  - constraints and requirements
- support both structured fields and rich notes
- include a visible `Design Truth` summary area

Then summarize:

- domain model added
- UI workspace added
- persistence path
- next recommended module

## 9. Hole Planner Prompt

### Prompt

Implement the Hole Planner module for Course Creator OS.

Requirements:

- create the hole-planner package
- define the `Hole` entity and related planning structures
- build the Hole Planner workspace UI
- support per-hole planning for:
  - hole number
  - par
  - target yardage
  - emotional role
  - readability target
  - challenge rating
  - visual landmarks
  - route notes
  - hazards
  - event/payoff notes
  - flyover notes
- support reordering and basic comparison workflows
- persist edits cleanly

Then summarize:

- hole schema and services
- UI behavior
- next recommended dependency or module

## 10. Simulator Logic Center Prompt

### Prompt

Implement the Gameplay & Simulator Logic Center as a first-class module.

Requirements:

- create the sim-logic package
- define typed domain models for:
  - `TeeSet`
  - `PinSet`
  - `SurfaceProfile`
  - `HazardProfile`
  - `DropZone`
  - `HolePlayProfile`
  - `MinimapMetadata`
  - `FlyoverMetadata`
- build a premium tabbed logic dashboard with tabs for:
  - Hole Logic
  - Tee Sets
  - Pin Sets
  - Surfaces
  - Hazards & OB
  - Drop Zones
  - Flyovers & Minimap
  - Output Validation
- include logic completeness scoring
- include issue states and clear fix paths
- make the UI feel premium, not spreadsheet-like

Then summarize:

- simulator logic schemas added
- dashboard structure
- validation hooks added or planned
- next best implementation target

## 11. Asset Library Prompt

### Prompt

Implement the Asset Library module.

Requirements:

- create the asset-system package
- define `Asset`, `AssetSource`, `NormalizationState`, `ApprovalStatus`, and related metadata
- build an asset browser with grid/list support
- support import queue concepts, tags, filters, categories, and selected-asset inspection
- include placeholders or early logic for scale normalization, orientation status, and asset analysis
- include approval workflow states
- keep the UI clean, premium, and fast to scan

Then summarize:

- asset domain model
- UI patterns
- import and normalization assumptions
- what should connect next

## 12. World Builder Prompt

### Prompt

Implement the World Builder module.

Requirements:

- create the world-system package
- define `District`, `Landmark`, `SupportSpace`, `EnvironmentZone`, and related models
- build a world-building workspace that supports:
  - lands / districts
  - landmark registry
  - support-space planning
  - environmental zoning
  - world identity overlays
- the UI should feel strategic and creative, not purely technical
- keep it flexible enough for any course theme

Then summarize:

- world entities
- workspace behavior
- relationship to Course Bible and Hole Planner
- next recommended module

## 13. Validation Engine Prompt

### Prompt

Implement the validation framework for Course Creator OS.

Requirements:

- create the validation package
- define `ValidationIssue`, `ValidationCategory`, `ValidationResult`, severity/state models
- create composable validators for:
  - project integrity
  - course bible completeness
  - hole metadata
  - simulator logic
  - asset health
  - style consistency
  - playability
  - performance
  - preview readiness
  - packaging readiness
- build reusable issue-card UI patterns and validation summary patterns
- make output structured and actionable

Then summarize:

- validation architecture
- issue model
- validator list
- next recommended modules to wire into validation

## 14. Performance Center Prompt

### Prompt

Implement the Performance Center.

Requirements:

- create the performance package
- define profile structures for:
  - Brother Mode
  - Community Safe
  - Showcase
- define `PerformanceMetrics` and risk grading models
- build a UI that compares profile results and explains tradeoffs
- use safe/caution/risky presentation
- include metric cards, issue feed, and room for heatmap expansion

Then summarize:

- profile schema
- current metrics model
- UI structure
- dependencies for richer future metrics

## 15. Preview Studio Prompt

### Prompt

Implement the Preview Studio foundations.

Requirements:

- create the preview package
- define `PreviewPath`, `FlyoverPlan`, `ScreenshotPlan`, `ShowcaseSequence`, and readiness models
- build the Preview Studio shell with sections for:
  - flyovers
  - minimaps
  - screenshots
  - showcase sequences
- keep the UX cinematic, premium, and clearly structured

Then summarize:

- preview entities
- current workflows
- readiness assumptions
- what packaging needs from this module

## 16. Packaging and Publish Prompt

### Prompt

Implement the packaging and publish foundations.

Requirements:

- create the packaging package
- define `PackageBuild`, `PackagingChecklist`, `PackagingResult`, `BuildArtifact`, and related models
- build the Package Center UI
- build the Publish Center UI
- include checklist-driven readiness states
- surface blockers, warnings, and release notes/metadata areas
- ensure failure states are explicit and actionable

Then summarize:

- packaging models
- package/publish screens
- validation dependencies
- next hardening steps

## 17. Version Control and Recovery Prompt

### Prompt

Implement the Version Control Center and recovery foundations.

Requirements:

- create the versioning package
- define `Snapshot`, `RestorePoint`, `ChangeSummary`, and related state
- build the Version Control Center UI
- support snapshot listing and restore-point concepts
- define logging and recovery expectations with the logging package
- keep the experience reassuring and understandable

Then summarize:

- versioning model
- UI patterns
- recovery assumptions
- logging connections needed

## 18. Agent Command Center Prompt

### Prompt

Implement the Agent Command Center foundations.

Requirements:

- create the agent-system package
- define `AgentDefinition`, `AgentStatus`, `AgentTask`, `Recommendation`, `RiskSummary`, and `DecisionSummary`
- build a useful, non-gimmicky Agent Command Center UI
- include sections for:
  - active agents
  - current focus areas
  - suggested next actions
  - decision summary
  - open risks
  - module status board
- keep the tone authoritative and useful

Then summarize:

- agent state model
- UI structure
- how this connects to governance docs and module status

## 19. Integration Layer Prompt

### Prompt

Implement the integration architecture foundations.

Requirements:

- create the integration package
- define interfaces for:
  - `ToolPathProvider`
  - `AssetImportBridge`
  - `ExecutionBridge`
  - `PackagingBridge`
  - `ToolHealthChecker`
- isolate external tool assumptions behind clean adapter interfaces
- do not let tool-specific details leak into UI modules
- build integration-health structures and settings hooks

Then summarize:

- interfaces added
- assumptions isolated
- future adapter strategy

## 20. Hardening Prompt

### Prompt

Review the current codebase for structural quality and harden it.

Requirements:

- identify weak abstractions
- identify duplicated types or ownership violations
- identify UI/domain leakage
- identify missing tests for critical areas
- tighten public package APIs
- improve naming consistency
- update ADRs and decision logs if architectural refinements are made

Then summarize:

- improvements made
- risks removed
- remaining weaknesses
- recommended next actions

## 21. Continuous Execution Prompt

### Prompt

Continue execution on Course Creator OS using the repo docs and existing implementation as the source of truth.

Rules:

- do not pause for routine approval
- choose the highest-leverage next task
- keep architecture, UX, simulator logic, validation, release truth, and host/runtime trust aligned
- keep docs and decision logs current when major changes are made
- prefer progress that strengthens the long-term product foundation
- do not drift into random disconnected work

At the end of each work cycle, report:

- what you completed
- what you changed
- what decisions you made
- what remains blocked or risky
- what you recommend next

## 22. Emergency Refocus Prompt

### Prompt

Stop and refocus the project.

Review the current implementation against:

- the product vision
- the UX/design system spec
- the data and repo architecture spec
- the implementation roadmap
- the simulator logic requirements

Identify:

- vision drift
- architecture drift
- UX inconsistency
- package-boundary violations
- missing product-critical modules

Then propose and execute the smallest set of high-impact corrections needed to put the product back on the right path.

## 23. Prompt Usage Order

Use prompts in this order for the strongest results:

1. Master System Prompt
2. Repo Bootstrap Prompt
3. Governance Docs Prompt
4. Design System Foundation Prompt
5. App Shell Prompt
6. Project Model and Persistence Prompt
7. Project Wizard Prompt
8. Course Bible Prompt
9. Hole Planner Prompt
10. Simulator Logic Center Prompt
11. Asset Library Prompt
12. World Builder Prompt
13. Validation Engine Prompt
14. Performance Center Prompt
15. Preview Studio Prompt
16. Packaging and Publish Prompt
17. Version Control and Recovery Prompt
18. Agent Command Center Prompt
19. Integration Layer Prompt
20. Hardening Prompt
21. Continuous Execution Prompt

Use the Emergency Refocus Prompt any time drift becomes obvious.

## 24. Final Directive

Do not let Codex behave like a passive autocomplete system.
Use it like a serious execution engine.

The standard is not `it runs`.
The standard is `this is becoming the course creation platform creators will prefer`.
