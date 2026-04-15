# Design System Foundation

## Visual Direction

Course Creator OS uses a dark-first premium creator-suite language anchored by deep navy surfaces, slate support tones, high-clarity text, and restrained accent colors. The interface should feel calm, modern, and expensive without becoming theatrical or noisy.

## Typography

- Primary family: `Sora`
- Technical/diagnostic family: `JetBrains Mono`
- Strong hierarchy between mode headers, panel titles, inspector metadata, and body copy

## Token Families

- `bg.app.primary`
- `bg.panel.primary`
- `bg.panel.secondary`
- `bg.surface.elevated`
- `text.primary`
- `text.secondary`
- `text.tertiary`
- `accent.primary`
- `accent.secondary`
- `state.success`
- `state.warning`
- `state.error`
- `state.info`
- `font.family.base`
- `font.family.display`
- `font.family.mono`
- `font.size.xs` through `font.size.2xl`
- `space.1` through `space.16`
- `radius.sm` through `radius.xl`
- `shadow.sm` through `shadow.lg`
- `motion.fast` through `motion.slow`

## Component Families

- Navigation rail
- Mode headers
- Split-pane workspace sections
- Project cards
- Inspectors
- Status banners
- Issue cards
- Metric chips
- Utility dock panels
- Command and quick-action surfaces

## Interaction Standards

- Smooth but restrained motion
- Keyboard-friendly interactions
- Contextual right-rail guidance
- Spacious layout with deliberate grouping
- Empty states that teach the next move instead of leaving the user hanging

## Shell Primitives

- `AppShell`
- `WorkspaceHeader`
- `GlobalHealthBanner`
- `SidebarNav`
- `ProjectTree`
- `InspectorRail`
- `UtilityDock`
- `CommandPalette`
- `ValidationIssueCard`
- `StatusPill`

## Severity Language

- `info`: useful context, not urgent
- `warning`: review soon
- `high`: materially affects trust or readiness
- `critical`: blocks export or publish confidence
