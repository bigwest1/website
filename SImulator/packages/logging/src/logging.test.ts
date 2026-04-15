import { describe, expect, it } from "vitest";

import {
  createRecoveryDiagnosticLogs,
  createSpatialTrustDiagnosticLogs,
  deriveRecoveryExpectations,
  summarizeRecoveryDiagnostics
} from "./summary";

describe("logging recovery summaries", () => {
  it("creates actionable recovery expectations and a summarized health posture", () => {
    const expectations = deriveRecoveryExpectations({
      snapshotCount: 1,
      restorePointCount: 0,
      latestSnapshotAt: "2026-04-13T00:00:00.000Z",
      latestRecoveryCheckAt: "2026-04-13T01:00:00.000Z",
      recoveryConfidence: "watch",
      failedTaskCount: 0,
      blockedTaskCount: 1,
      packagingBlocked: true,
      indexHealth: {
        health: "attention",
        driftState: "stale",
        summary: "Spatial index is stale.",
        recommendedAction: "Rebuild the local spatial index.",
        lastIndexedAt: "2026-04-13T00:30:00.000Z",
        lastVerifiedAt: "2026-04-13T01:00:00.000Z",
        fingerprintMatches: false,
        trustHealth: "attention",
        issueCount: 1,
        warningCount: 1,
        criticalCount: 0,
        snapshot: null,
        issues: []
      }
    });
    const logs = createRecoveryDiagnosticLogs({
      snapshotCount: 1,
      restorePointCount: 0,
      latestSnapshotAt: "2026-04-13T00:00:00.000Z",
      latestRecoveryCheckAt: "2026-04-13T01:00:00.000Z",
      recoveryConfidence: "watch",
      failedTaskCount: 0,
      blockedTaskCount: 1,
      packagingBlocked: true,
      indexHealth: {
        health: "attention",
        driftState: "stale",
        summary: "Spatial index is stale.",
        recommendedAction: "Rebuild the local spatial index.",
        lastIndexedAt: "2026-04-13T00:30:00.000Z",
        lastVerifiedAt: "2026-04-13T01:00:00.000Z",
        fingerprintMatches: false,
        trustHealth: "attention",
        issueCount: 1,
        warningCount: 1,
        criticalCount: 0,
        snapshot: null,
        issues: []
      }
    });
    const summary = summarizeRecoveryDiagnostics(expectations, logs);

    expect(expectations.some((expectation) => expectation.status === "critical")).toBe(true);
    expect(logs[0]?.createdAt).toBe("2026-04-13T01:00:00.000Z");
    expect(summary.health).toBe("critical");
  });

  it("emits creator-readable spatial trust diagnostics", () => {
    const logs = createSpatialTrustDiagnosticLogs({
      health: "critical",
      driftState: "corrupt",
      summary: "Spatial trust metadata is damaged.",
      recommendedAction: "Rebuild the trust files.",
      lastIndexedAt: null,
      lastVerifiedAt: "2026-04-13T02:00:00.000Z",
      fingerprintMatches: false,
      trustHealth: "critical",
      issueCount: 1,
      warningCount: 0,
      criticalCount: 1,
      snapshot: null,
      issues: [
        {
          issueId: "index-metadata-corrupt",
          severity: "critical",
          title: "Index metadata is damaged",
          summary: "Failed to parse trust metadata.",
          recommendedAction: "Discard and rebuild the local files."
        }
      ]
    });

    expect(logs.some((log) => log.category === "spatial-index")).toBe(true);
    expect(logs.some((log) => log.message.includes("Index metadata is damaged"))).toBe(true);
  });
});
