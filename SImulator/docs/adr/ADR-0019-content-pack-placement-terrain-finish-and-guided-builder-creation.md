# ADR-0019 — Content-Pack Placement, Terrain Finish, And Guided Builder Creation

## Status

Accepted — 2026-04-14

## Context

The world-first builder HUD pass made Build calmer and more legible, but it still left an important speed gap between browsing content and acting in the world.

Creators could understand modes better, but they still needed faster placement continuity, a true scenery-brush workflow, a clear distinction between terrain shaping and terrain finishing, simpler routing ergonomics, and more deliberate first-use guidance. Without that layer, the product still risked feeling like a strong architecture with a slower-than-necessary creation loop.

The product needed to borrow the strongest ideas from premium world-building tools without recreating their common weaknesses:

1. content packs should remain visible and useful while the creator is placing assets
2. repeated scenery should be placeable through a controllable brush, not only one-object-at-a-time placement
3. terrain finish should behave like a distinct material-paint workflow, not a hidden side effect of sculpting
4. routing should feel direct and in-world instead of split across many sub-tabs and context-breaking panels
5. onboarding should remain embedded and dismissible rather than becoming a modal tutorial layer

## Decision

Course Creator OS will treat approved content packs, scenery-brush drafts, terrain material painting, routing guide settings, and guided builder help as package-owned creation state inside `scene-authoring`, then surface that state through Build and Asset Library without introducing app-local authoring models.

Concretely:

- approved assets can now be armed as direct placement drafts and placed into the world without losing pack context
- Build now supports a scenery-brush authoring mode with explicit density, randomness, rotation variance, scale variance, brush size, and asset/category filtering controls
- terrain sculpting and terrain finishing are now separate authoring concepts, with terrain material palette, paint strokes, and blend mode captured as authored scene state
- routing ergonomics are centralized around guide settings such as angle snap, working height, auto-connect, auto-merge, visibility mode, and width defaults instead of fragmented sub-workflows
- Build guidance is now embedded, mode-aware, dismissible, and restorable so first-use help does not become tutorial spam or disappear entirely
- Asset Library and Build preserve content-pack continuity by letting creators arm placement or add approved assets to the active brush directly from pack context

## Consequences

### Positive

- creators can move from pack browsing to in-world placement much faster
- repeated vegetation, rock, support, and theme dressing flows now have a real package-owned brush workflow instead of only manual repetition
- terrain sculpt and terrain finish are easier to understand because their state and controls are distinct
- routing feels more teachable and less fragmented because guide settings live in one direct-edit surface
- Build becomes easier to learn without reducing expert access to direct controls

### Tradeoffs

- the Build HUD now owns more live controls, so visual discipline remains important to avoid turning the interface into dense tool chrome
- scenery brush placement is intentionally understandable rather than opaque, which means it is less “magic” than a black-box distribution system
- this pass improves creation speed substantially, but it does not yet deliver full drag-from-browser placement, live brush previews, or the final native runtime fidelity tier

## Follow-on Work

- add direct drag placement from content-pack browser into the viewport
- add live brush preview, stronger ghosting, and richer surface feedback while placing scenery
- deepen terrain finish into richer texture-stack and material-consistency tooling
- add more advanced route handles and vertical/merge ergonomics while keeping the routing UI unified
- continue growing embedded onboarding into a richer help/options system without interrupting expert workflows
