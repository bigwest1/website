# ADR-0032 — Shot Order Approval, Corridor Support Kits, Cleanup Review Diffing, And Presentation Packet Proofing

## Status

Accepted — 2026-04-15

## Context

Batch 50 made finish-stage sequencing, corridor staging, cleanup approval depth, and delivery-packet confidence materially stronger. The remaining gap was no longer basic sequencing or delivery posture. It was the creator-facing review loop right before final sharing:

1. shot sequencing still needed explicit order approval, not only sequence posture
2. landmark corridor work still needed reusable support kits rather than only single corrective actions
3. cleanup review still needed before-and-after comparison so approval depth had stronger evidence
4. presentation packets still needed a calmer proofing layer before the final share gate

The correction still had to preserve the current package boundaries:

- `preview` remains the authority for shot order, presentation sequencing, and proofing-facing media posture
- `scene-authoring` remains the authority for corridor support actions and cleanup-review state
- `packaging` remains the authority for packet proofing and creator-facing share confidence

## Decision

Course Creator OS will treat shot order approval, landmark corridor support kits, cleanup review diffing, and presentation packet proofing as one shared Batch 51 finish-stage review-and-proofing contract.

Concretely:

- `preview` now owns a dedicated shot-order approval summary and approval action path layered on top of shot sequencing
- `scene-authoring` now records cleanup-review diffs and exposes landmark corridor support kits through the shared spatial authority
- `packaging` now owns a presentation-packet proofing summary that sits between packet finalization and final share-delivery confidence
- Build, Preview, Package, and Publish consume those shared summaries instead of inventing screen-local proofing logic

## Consequences

### Positive

- creators can explicitly approve route, flyover, still-image, and showcase order before final share
- corridor correction now reads as reusable support kits instead of only isolated corridor tweaks
- cleanup approvals now carry before-and-after evidence instead of only confidence labels
- packet proofing now communicates whether the final share packet is actually ready to trust before final delivery

### Tradeoffs

- Preview and Packaging now carry another layer of finish-stage summary logic, which increases coordination pressure across final media surfaces
- cleanup diffing is still summary-based rather than a full visual diff viewer
- proofing confidence is much stronger, but it still stops short of real external sharing workflows in this environment

## Follow-on Work

- deepen shot approval into variant-set and alternate-sequence review
- turn corridor support kits into richer composed support kits and reusable staging bundles
- extend cleanup diffing into stronger audit-trail and comparison history
- strengthen final share-gate approval and proofing signoff on top of the new packet-proofing layer
