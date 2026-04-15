# ADR-0027 — Camera Path Playback Polish, Landmark Correction Actions, Surface Rule Conflict Resolution, And Share-Ready Presentation Handoff

## Status

Accepted — 2026-04-15

## Context

Batch 46 made camera-path confidence, landmark-readability correction, surface-rule coverage, and final presentation confidence visible across Build, Preview, Package, and Publish. That improved trust, but it still left four product-critical gaps:

1. camera-path quality still stopped at authoring confidence instead of summarizing playback smoothness and abrupt segment risk
2. landmark-readability posture was visible, but creators still lacked clearer action-oriented correction signals
3. surface-rule coverage showed conflicts, but creators still lacked a package-owned resolution path for cleaning those conflicts up
4. final presentation confidence existed, but the creator still lacked one calm share-ready handoff summary that combined preview polish with delivery and handoff truth

The governing constraints remain the same:

- `scene-authoring` is still the only spatial authority
- `preview` owns camera- and presentation-facing summary logic, not screen-local heuristics
- `packaging` owns delivery and handoff truth, even when that truth consumes upstream preview-facing signals
- desktop surfaces may orchestrate and explain the shared signals, but they do not become competing authorities

## Decision

Course Creator OS will treat playback polish, action-oriented landmark correction, surface-rule conflict resolution, and share-ready presentation handoff as one shared Batch 47 presentation-finish contract.

Concretely:

- `preview` now owns shared playback-polish and landmark-correction-action summaries alongside camera-path authoring, Preview camera readability, and final presentation confidence
- `scene-authoring` now owns a shared surface-rule conflict-resolution summary plus a conflict-resolution action helper, so Build can correct rule conflicts without inventing app-local rule logic
- `packaging` now owns a share-ready presentation handoff summary that combines creator handoff truth, final delivery posture, and presentation-finish signals into one calm readiness model
- Build, Preview, Package, and Publish now read the same Batch 47 story: how smooth the course presents, what landmark corrections still matter, whether terrain-aware rule conflicts are resolved, and whether the course is truly ready to show or share

## Consequences

### Positive

- creators can now tell the difference between “camera paths exist” and “camera playback is polished enough to show”
- landmark correction is more actionable because the product can distinguish staging support, opening blocked views, and weaker route-view reinforcement work
- surface-rule cleanup is now more than a warning state because Build can resolve rule conflicts directly from the package-owned draft
- Preview, Package, and Publish now speak about share-ready presentation from the same handoff contract rather than parallel heuristics

### Tradeoffs

- the shared presentation layer now has more derived summaries, so screens must stay summary-first or risk sliding into dashboard clutter
- surface-rule conflict resolution is intentionally narrow and creator-friendly, which means it is not yet a full rule-debugger or batch cleanup system
- share-ready presentation handoff is still a summary layer over existing handoff artifacts, not yet a separate durable presentation packet

## Follow-on Work

- add direct camera-path correction tools on top of playback-polish summaries
- deepen landmark correction from action guidance into faster in-world re-staging flows
- expand surface-rule conflict cleanup from single-draft resolution into broader course-region cleanup automation
- turn share-ready handoff from summary trust into a stronger final presentation packet for creator showcase use
