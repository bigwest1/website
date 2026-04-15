import { describe, expect, it } from "vitest";

import {
  createManualSnapshotUpdate,
  createRestoreExecutionUpdate,
  createRestorePointPromotionUpdate
} from "./services";
import { summarizeVersioningState } from "./summary";

describe("summarizeVersioningState", () => {
  it("summarizes stable snapshots and restore posture", () => {
    const summary = summarizeVersioningState({
      snapshots: [
        {
          snapshotId: "snapshot-1",
          label: "Foundation",
          createdAt: "2026-04-13T00:00:00.000Z",
          source: "manual",
          posture: "stable",
          summary: "Foundation checkpoint",
          changeSummaryRefs: [],
          bundleAvailable: false
        },
        {
          snapshotId: "snapshot-2",
          label: "Preview Pass",
          createdAt: "2026-04-14T00:00:00.000Z",
          source: "autosave",
          posture: "watch",
          summary: "Preview edits in progress",
          changeSummaryRefs: [],
          bundleAvailable: false
        }
      ],
      restorePoints: [
        {
          restorePointId: "restore-1",
          label: "Safe return",
          createdAt: "2026-04-14T01:00:00.000Z",
          sourceSnapshotId: "snapshot-1",
          state: "recommended",
          reason: "safe-edit-return",
          summary: "Return here before deep world edits.",
          riskNotes: [],
          changeSummaryRefs: []
        }
      ],
      changeSummaries: [
        {
          changeSummaryId: "change-1",
          title: "Added preview structures",
          summary: "Flyover and screenshot planning entered project state.",
          createdAt: "2026-04-14T00:30:00.000Z",
          impact: "moderate",
          moduleRefs: ["preview"],
          relatedSnapshotId: "snapshot-2",
          note: ""
        }
      ],
      versioningState: {
        latestSnapshotId: "snapshot-2",
        latestRestorePointId: "restore-1",
        snapshotCount: 2,
        restorePointCount: 1,
        restoreAvailable: true,
        autosaveProtected: true,
        recoveryConfidence: "watch",
        lastRecoveryCheckAt: "2026-04-14T01:05:00.000Z"
      }
    });

    expect(summary.latestSnapshot?.snapshotId).toBe("snapshot-2");
    expect(summary.latestRestorePoint?.restorePointId).toBe("restore-1");
    expect(summary.stableSnapshotCount).toBe(1);
    expect(summary.recommendedRestorePointCount).toBe(1);
    expect(summary.confidence).toBe("watch");
  });
});

describe("versioning services", () => {
  it("creates manual snapshot updates without relying on app-session logic", () => {
    const update = createManualSnapshotUpdate({
      projectId: "project-1",
      snapshots: [],
      snapshotBundles: [],
      changeSummaries: [],
      versioningState: {
        latestSnapshotId: null,
        latestRestorePointId: null,
        snapshotCount: 0,
        restorePointCount: 0,
        restoreAvailable: false,
        autosaveProtected: false,
        recoveryConfidence: "fragile",
        lastRecoveryCheckAt: null
      },
      validationHealthState: "Healthy",
      snapshotFiles: [
        {
          relativePath: "project.manifest.json",
          content: "{\"id\":\"project-1\"}"
        }
      ],
      manifestUpdatedAt: "2026-04-15T00:00:00.000Z",
      spatialFingerprint: "fingerprint-1",
      createdAt: "2026-04-15T00:00:00.000Z",
      label: "Foundation lock"
    });

    expect(update.snapshots[0]?.label).toBe("Foundation lock");
    expect(update.snapshots[0]?.bundleAvailable).toBe(true);
    expect(update.snapshotBundles[0]?.snapshotId).toBe("snapshot-2026-04-15T00:00:00.000Z");
    expect(update.changeSummaries[0]?.relatedSnapshotId).toBe("snapshot-2026-04-15T00:00:00.000Z");
    expect(update.versioningState.latestSnapshotId).toBe("snapshot-2026-04-15T00:00:00.000Z");
    expect(update.versioningState.snapshotCount).toBe(1);
    expect(update.versioningState.recoveryConfidence).toBe("watch");
  });

  it("promotes the latest snapshot into a recommended restore point", () => {
    const update = createRestorePointPromotionUpdate({
      snapshots: [
        {
          snapshotId: "snapshot-1",
          projectId: "project-1",
          label: "Latest safe state",
          createdAt: "2026-04-16T00:00:00.000Z",
          source: "manual",
          posture: "stable",
          summary: "Current safe baseline",
          changeSummaryRefs: ["change-1"],
          bundleAvailable: true
        }
      ],
      snapshotBundles: [
        {
          snapshotId: "snapshot-1",
          projectId: "project-1",
          createdAt: "2026-04-16T00:00:00.000Z",
          manifestUpdatedAt: "2026-04-16T00:00:00.000Z",
          spatialFingerprint: "fingerprint-1",
          summary: "Restorable bundle",
          files: [
            {
              relativePath: "project.manifest.json",
              content: "{\"id\":\"project-1\"}"
            }
          ]
        }
      ],
      restorePoints: [
        {
          restorePointId: "restore-older",
          label: "Older restore point",
          createdAt: "2026-04-14T00:00:00.000Z",
          sourceSnapshotId: "snapshot-older",
          state: "recommended",
          reason: "safe-edit-return",
          summary: "Earlier checkpoint",
          riskNotes: [],
          changeSummaryRefs: []
        }
      ],
      versioningState: {
        latestSnapshotId: "snapshot-1",
        latestRestorePointId: "restore-older",
        snapshotCount: 1,
        restorePointCount: 1,
        restoreAvailable: true,
        autosaveProtected: true,
        recoveryConfidence: "watch",
        lastRecoveryCheckAt: "2026-04-14T00:00:00.000Z"
      },
      validationHealthState: "Blocked",
      createdAt: "2026-04-16T01:00:00.000Z"
    });

    expect(update).not.toBeNull();
    expect(update?.restorePoints[0]?.state).toBe("recommended");
    expect(update?.restorePoints[1]?.state).toBe("available");
    expect(update?.restorePoints[0]?.riskNotes[0]).toContain("blocking validation issues");
    expect(update?.versioningState.recoveryConfidence).toBe("strong");
    expect(update?.versioningState.restorePointCount).toBe(2);
  });

  it("executes restore using a captured snapshot bundle and creates a pre-recovery fallback", () => {
    const update = createRestoreExecutionUpdate({
      projectId: "project-1",
      snapshots: [
        {
          snapshotId: "snapshot-1",
          projectId: "project-1",
          label: "Latest safe state",
          createdAt: "2026-04-16T00:00:00.000Z",
          source: "manual",
          posture: "stable",
          summary: "Current safe baseline",
          changeSummaryRefs: ["change-1"],
          bundleAvailable: true
        }
      ],
      snapshotBundles: [
        {
          snapshotId: "snapshot-1",
          projectId: "project-1",
          createdAt: "2026-04-16T00:00:00.000Z",
          manifestUpdatedAt: "2026-04-16T00:00:00.000Z",
          spatialFingerprint: "fingerprint-1",
          summary: "Restorable bundle",
          files: [
            {
              relativePath: "project.manifest.json",
              content: "{\"id\":\"project-1\"}"
            }
          ]
        }
      ],
      restorePoints: [
        {
          restorePointId: "restore-1",
          label: "Safe return",
          createdAt: "2026-04-16T01:00:00.000Z",
          sourceSnapshotId: "snapshot-1",
          state: "recommended",
          reason: "safe-edit-return",
          summary: "Return here before deeper edits.",
          riskNotes: [],
          changeSummaryRefs: ["change-1"]
        }
      ],
      changeSummaries: [],
      versioningState: {
        latestSnapshotId: "snapshot-1",
        latestRestorePointId: "restore-1",
        snapshotCount: 1,
        restorePointCount: 1,
        restoreAvailable: true,
        autosaveProtected: true,
        recoveryConfidence: "watch",
        lastRecoveryCheckAt: "2026-04-16T01:00:00.000Z"
      },
      validationHealthState: "Healthy",
      currentStateFiles: [
        {
          relativePath: "project.manifest.json",
          content: "{\"id\":\"project-1\",\"state\":\"before-restore\"}"
        }
      ],
      currentManifestUpdatedAt: "2026-04-16T02:00:00.000Z",
      currentSpatialFingerprint: "fingerprint-current",
      createdAt: "2026-04-16T02:15:00.000Z"
    });

    expect(update.status).toBe("succeeded");
    if (update.status !== "succeeded") {
      throw new Error("Expected restore execution to succeed");
    }

    expect(update.restoredSnapshotId).toBe("snapshot-1");
    expect(update.snapshots[0]?.source).toBe("pre-recovery");
    expect(update.snapshotBundles[0]?.snapshotId).toBe("snapshot-pre-recovery-2026-04-16T02:15:00.000Z");
    expect(update.changeSummaries[0]?.title).toContain("Restore executed");
    expect(update.versioningState.snapshotCount).toBe(2);
    expect(update.versioningState.recoveryConfidence).toBe("strong");
  });
});
