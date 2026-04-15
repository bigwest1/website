# ADR-0014 — Package-Owned Release Automation And Remediation

## Status

Accepted — 2026-04-14

## Context

Batch 34 established repo-backed managed adapters, stronger round-trip host evidence, and managed output truth inside packaging artifacts. That was a real operational improvement, but one structural gap remained:

1. release automation still lived too heavily inside the desktop session layer,
2. managed adapters returned richer output than the downstream release modules could act on cleanly,
3. Package, Preview, and Publish still exposed build truth better than they exposed retry/remediation posture.

That left the product with strong release evidence but a thinner automation and correction loop than a serious creator workflow needs.

## Decision

Course Creator OS will treat release automation and remediation posture as package-owned release truth, with the app layer limited to bridge invocation and persistence orchestration.

Concretely:

- `packaging` now owns automated release-run composition through a package-level automation helper that combines:
  - managed bridge results
  - recipe/build execution
  - preview production-state refresh
  - post-run remediation and retry guidance
- `integration` bridge results now carry:
  - `managedOutputRoot`
  - `remediationHints`
- repo-backed managed adapter scripts now emit richer execution artifacts:
  - step-results reports
  - remediation reports
  - compatibility execution logs
- Package, Preview, and Publish now consume the same retry/remediation truth from `packaging` instead of inventing screen-local action posture.
- the desktop session now delegates release automation to focused services instead of re-owning the full release pipeline in one session method.

## Consequences

### Positive

- Release automation is now more inspectable, reusable, and testable.
- Retry posture and remediation actions are shared across Package, Preview, and Publish.
- Managed adapter outputs are more operationally useful because they now include root/output context and remediation hints.
- The app shell is more honest about what is a package-owned release concept vs. a desktop orchestration concern.

### Tradeoffs

- The app layer still owns bridge invocation because it owns native/runtime wiring.
- This does not yet equal fully verified real-tool GSPro export execution on a production-capable host.
- Managed adapters are stronger, but they are still repo-backed integrations rather than final production toolchain bindings.

## Follow-on Work

- Verify the real Tauri/native path on a machine with Rust/Cargo/Tauri installed.
- Replace the current repo-backed managed adapter posture with fuller production-specific tool integrations where warranted.
- Push GSPro export execution from structured repo-backed runs into true production tool-backed end-to-end release flows.
