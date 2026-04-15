# ADR-0029 — Camera Capture Execution, Landmark View Corridor Tools, Surface Rule Cleanup Review, And Presentation Share Delivery Confidence

## Status

Accepted — 2026-04-15

## Context

Batch 48 moved Course Creator OS from presentation diagnosis into direct correction:

1. Preview could already diagnose and correct weak camera-path posture, but creators still lacked calmer finish-stage capture execution support for flyovers, showcase paths, screenshots, and approval passes
2. Build could already re-stage landmarks, but landmark readability still needed broader view-corridor tools rather than only object-level restaging
3. `scene-authoring` could already automate surface-rule cleanup, but creators still lacked a clearer review-and-approval posture before that cleanup should be trusted course-wide
4. `packaging` could already generate a presentation share packet, but Package, Preview, and Publish still needed a stronger shared delivery-confidence layer that explained whether the packet was actually ready to hand off

The authority boundaries still hold:

- `scene-authoring` remains the spatial authority for landmark corridor changes and cleanup review state
- `preview` owns shared camera-capture execution posture and landmark corridor guidance, not screen-local heuristics
- `packaging` owns the final presentation-share delivery contract
- desktop surfaces orchestrate and explain these contracts, but do not become competing authorities

## Decision

Course Creator OS will treat camera capture execution, landmark view-corridor tooling, surface-rule cleanup review, and presentation-share delivery confidence as one shared Batch 49 correction-and-delivery contract.

Concretely:

- `preview` now owns shared camera-capture execution summaries plus executable capture actions so Preview can move from correction into calmer finish-stage capture passes
- `scene-authoring` now owns landmark view-corridor actions and surface-rule cleanup review records so Build can guide broader corridor repair and cleanup approval without app-local spatial state
- `packaging` now owns a shared presentation-share delivery-confidence summary layered on top of creator delivery, handoff, final delivery, and packet-finalization truth
- Build, Preview, Package, and Publish now share one Batch 49 story: which holes still need capture execution, which landmark corridors still need repair, which cleanup passes are awaiting approval, and whether the current presentation-share packet is actually ready to deliver

## Consequences

### Positive

- creators can now move from playback and packet warnings into direct capture and corridor actions without leaving the calmer world-first flow
- surface-rule automation now has explicit review posture instead of silently becoming the new truth
- Package, Preview, and Publish now speak one clearer delivery-confidence language instead of parallel handoff interpretations
- Batch 49 strengthens the transition from authoring into show-and-share behavior without turning Preview or Build into engineering consoles

### Tradeoffs

- the shared presentation layer now carries more delivery and execution summaries, so surfaces must stay summary-first and action-oriented
- landmark corridor tooling is intentionally lighter than a full corridor editor, which keeps it premium but not fully exhaustive
- cleanup review remains deliberately semi-automatic, so creators still need to approve broader terrain-rule changes instead of relying on blind automation

## Follow-on Work

- deepen camera capture from execution posture into stronger shot sequencing and presentation capture confidence
- extend landmark corridor repair into stronger corridor staging and corrective review flows
- deepen cleanup review into broader batch approval and review-of-changes confidence
- keep strengthening the final presentation-share delivery layer until the product feels clearly share-ready instead of only technically complete
