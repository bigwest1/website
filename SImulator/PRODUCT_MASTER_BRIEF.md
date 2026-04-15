# Product Master Brief

## Status

Approved for execution. This document is the executive product brief for Course Creator OS and should be read alongside the approved specs in `/docs/spec`.

## Product Definition

Course Creator OS is a desktop-first, premium, creator-first application for designing, configuring, validating, packaging, and releasing GSPro-compatible golf simulator courses.

It is not a one-theme authoring utility, a glorified settings panel, or a wrapper around unmanaged tool chaos. It is the primary working environment for creators who want to plan, build, debug, and release courses with confidence.

## Mission

Make course creation feel like one deliberate creative suite instead of a brittle workflow spread across documents, side tools, and hidden simulator assumptions.

## Product Promise

- Support any course style or theme without hard-coding the product around a single aesthetic.
- Put simulator logic that materially affects playability and export readiness inside the application.
- Preserve a reliable path to GSPro-ready output through validation, packaging, and compatibility contracts.
- Make advanced creation feel powerful without making creators feel lost.
- Deliver a premium creator experience that people prefer, recommend, and trust.

## Core User

Independent and small-team course creators building premium simulator courses for GSPro and adjacent communities.

This user wants:

- full project control
- clear planning structure
- in-app simulator logic visibility
- better worldbuilding organization
- strong validation and packaging confidence
- a polished tool that feels professional rather than improvised

## Flagship Constraint

The first hero course is a premium modern theme park course with districts, landmarks, ambient life, spectacle, and believable support spaces.

This flagship must raise the quality bar without narrowing the product. Every core system must remain useful for realistic, fantasy, resort, municipal, competition, and stylized course directions.

## Version 1.0 Product Surface

- Home
- Project Wizard
- Course Bible
- Hole Planner
- Terrain & Routing Workspace
- Gameplay & Simulator Logic Center
- Asset Library
- World Builder
- Animation & Events
- Playability Center
- Performance Center
- Preview Studio
- Package Center
- Publish Center
- Version Control Center
- Agent Command Center
- Settings

## Product Outcomes

Version 1.0 is on track when the product can do all of the following with real structure:

- initialize a project with sane defaults
- capture course identity and per-hole intent
- model simulator-critical metadata
- organize assets and world structure
- surface validation and performance risk early
- prepare preview and packaging data in-app
- maintain project history, diagnostics, and recovery posture

## Experience Standards

- The user always knows where they are.
- Every major screen presents a clear next action.
- Warnings explain both impact and fix path.
- Advanced control is available through progressive disclosure rather than clutter.
- Navigation reflects creator workflow, not internal architecture.
- The application feels calm, premium, and trustworthy at all times.

## Technical Stance

- Desktop-first shell using Tauri.
- React + TypeScript for the creator UX.
- Monorepo with typed shared packages and explicit domain ownership.
- JSON project files as portable source of truth.
- Local SQLite as indexed working state, not the sole authority.
- Managed integrations isolated behind stable product contracts when native recreation would weaken reliability.

## Success Measures

Leading indicators:

- time to first usable project setup without confusion
- percentage of required gameplay metadata configured in-app
- number of export-blocking issues caught before packaging
- number of recovery paths available for destructive or risky operations
- clarity of next-step guidance across major workspaces

Outcome indicators:

- successful packaging rate for GSPro-ready candidates
- creator confidence in simulator-readiness checks
- repeatable workflow quality across multiple course themes

## Execution Standard

- This is a full-product foundation, not a toy, MVP, or throwaway prototype.
- Architecture, UX, simulator logic, validation, packaging, and release readiness must evolve together.
- Core logic belongs in owned packages and services, not buried in UI files.
- Product docs in the repo are controlling guidance for implementation decisions.
- Reversible decisions should be made quickly; irreversible ones require explicit reasoning.
- The product should move aggressively, but never by sacrificing clarity or long-term structure.
- Execution should follow the approved prompt usage order when that stack is being used to drive work.
- Emergency refocus is mandatory when visible drift appears against the product vision, UX specification, architecture specification, roadmap, or simulator-logic requirements.
- The standard is not “it runs.” The standard is whether the product is becoming the course creation platform creators will prefer.

## Recorded Assumptions

- Navy blue remains the primary visual anchor of the interface.
- The creator must never be left without a next step or recovery path.
- The target high-end playback machine remains `i7-8086K / RTX 4080 Super / 64 GB / NVMe`.
- Managed integrations are acceptable where they preserve capability and keep the creator experience unified.
