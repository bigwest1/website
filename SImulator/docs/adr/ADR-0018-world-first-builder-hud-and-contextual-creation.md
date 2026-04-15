# ADR-0018 — World-First Builder HUD And Contextual Creation

## Status

Accepted — 2026-04-14

## Context

Course Creator OS already had strong spatial architecture, a renderer-backed Build workspace, deeper routing/terrain authoring, and stronger release truth. The remaining UX risk was not missing domain contracts. It was interaction grammar.

Build still read more like a cluster of powerful panels than a deliberately guided world-first creation environment. Asset browsing also risked separating intake context from in-world creation, and downstream Package/Preview/Publish surfaces still needed a clearer creator-facing next-step posture after builds completed.

The product needed to borrow the strongest ideas from premium simulation builders:

1. a persistent builder HUD that keeps mode, next action, and camera posture visible
2. world-first creation where the viewport remains the primary place to act
3. content-pack-aware browsing that preserves creator context
4. management and delivery lenses that stay connected to the creation flow

It also needed to explicitly avoid the weaker patterns often associated with over-tabbed builder tools:

- pathing/routing flows that fragment across too many tabs and micro-modes
- asset browsers that cause creators to lose their place while inspecting items
- empty inspectors that do not explain the next useful action

## Decision

Course Creator OS will adopt a world-first builder HUD and contextual editing model inspired by the strongest simulation-builder patterns, while explicitly avoiding tab-sprawl and browser/context loss.

Concretely:

- Build now uses a persistent builder HUD with mode cards, mode-aware next-action guidance, and creator-management overview lenses
- viewport interaction now prioritizes creation on the ground for creation-oriented terrain, routing, and simulator tools instead of over-prioritizing passive hit geometry
- Build now exposes a pack-aware scenery palette that keeps approved content packs visible beside the viewport and uses pack categories as quick placement/filter lenses
- the inspector now becomes more explicitly mode-aware when nothing is selected, explaining the next in-context action rather than only reporting an empty state
- Asset Library now exposes content-pack focus and quick brush-like pack filters so creators can browse large scenery sets without losing browser context
- Package, Preview, and Publish now expose stronger “compass” guidance so post-build handoff and delivery remain connected to the same release truth

## Consequences

### Positive

- Build feels more like a premium world-first creation workspace and less like an engineering dashboard
- terrain, routing, and simulator placement modes are easier to understand because the next action stays visible
- asset browsing is calmer because pack context is preserved while assets are inspected
- release surfaces now behave more like connected creator-delivery destinations instead of isolated status pages

### Tradeoffs

- the HUD layer adds more UI structure, so visual restraint must remain deliberate to avoid recreating clutter in a different form
- content-pack browsing is now clearer, but true placement-from-library flows still depend on future deeper asset-to-scene authoring integration
- this pass improves the interaction architecture substantially, but it is still not the final highest-fidelity native runtime

## Follow-on Work

- deepen true asset-to-scene placement and brush workflows so the scenery palette can place approved assets directly, not only guide filtering and context
- continue tightening terrain and routing direct-manipulation so the world-first HUD remains faster than inspector-first editing
- keep post-build delivery flows converged so creator handoff, media freshness, and publish readiness stay legible without screen-by-screen interpretation
