import type { HealthState } from "@course-creator-os/core-types";

import type {
  ChangeSummary,
  RestorePoint,
  Snapshot,
  SnapshotBundle,
  SnapshotBundleFile,
  VersioningStateSummary
} from "./models";
import { getLatestSnapshot } from "./summary";

export type ManualSnapshotUpdate = {
  snapshots: Snapshot[];
  snapshotBundles: SnapshotBundle[];
  changeSummaries: ChangeSummary[];
  versioningState: VersioningStateSummary;
};

export type RestorePointPromotionUpdate = {
  restorePoints: RestorePoint[];
  versioningState: VersioningStateSummary;
};

export type RestoreExecutionUpdate =
  | {
      status: "failed";
      message: string;
      versioningState: VersioningStateSummary;
    }
  | {
      status: "succeeded";
      message: string;
      restoredSnapshotId: string;
      restoredFiles: SnapshotBundleFile[];
      snapshots: Snapshot[];
      snapshotBundles: SnapshotBundle[];
      restorePoints: RestorePoint[];
      changeSummaries: ChangeSummary[];
      versioningState: VersioningStateSummary;
    };

type ManualSnapshotOptions = {
  projectId: string;
  snapshots: Snapshot[];
  snapshotBundles: SnapshotBundle[];
  changeSummaries: ChangeSummary[];
  versioningState: VersioningStateSummary;
  validationHealthState: HealthState;
  snapshotFiles?: SnapshotBundleFile[];
  manifestUpdatedAt?: string;
  spatialFingerprint?: string;
  createdAt?: string;
  label?: string;
};

type RestorePointPromotionOptions = {
  snapshots: Snapshot[];
  restorePoints: RestorePoint[];
  versioningState: VersioningStateSummary;
  validationHealthState: HealthState;
  snapshotId?: string;
  createdAt?: string;
  label?: string;
  snapshotBundles?: SnapshotBundle[];
};

type RestoreExecutionOptions = {
  projectId: string;
  snapshots: Snapshot[];
  snapshotBundles: SnapshotBundle[];
  restorePoints: RestorePoint[];
  changeSummaries: ChangeSummary[];
  versioningState: VersioningStateSummary;
  validationHealthState: HealthState;
  currentStateFiles: SnapshotBundleFile[];
  currentManifestUpdatedAt: string;
  currentSpatialFingerprint: string;
  restorePointId?: string;
  createdAt?: string;
};

export function createManualSnapshotUpdate({
  projectId,
  snapshots,
  changeSummaries,
  versioningState,
  validationHealthState,
  snapshotBundles,
  snapshotFiles = [],
  manifestUpdatedAt,
  spatialFingerprint = "unknown",
  createdAt = new Date().toISOString(),
  label
}: ManualSnapshotOptions): ManualSnapshotUpdate {
  const nextManifestUpdatedAt = manifestUpdatedAt ?? createdAt;
  const snapshotId = `snapshot-${createdAt}`;
  const changeSummaryId = `change-${createdAt}`;
  const bundleAvailable = snapshotFiles.length > 0;
  const nextSnapshot: Snapshot = {
    snapshotId,
    projectId,
    label: label ?? "Manual Checkpoint",
    createdAt,
    source: "manual",
    posture: validationHealthState === "Blocked" ? "watch" : "stable",
    summary: "Manual checkpoint recorded from the Version Control Center.",
    changeSummary: "Captured the current project state before the next major edit pass.",
    changeSummaryRefs: [changeSummaryId],
    bundleAvailable
  };
  const nextChangeSummary: ChangeSummary = {
    changeSummaryId,
    title: "Manual checkpoint recorded",
    summary: "Saved the current state so planning, world, or packaging changes can be reversed safely.",
    createdAt,
    impact: "moderate",
    moduleRefs: ["version-control"],
    relatedSnapshotId: snapshotId,
      note: "Generated from the Version Control Center."
  };
  const nextSnapshotBundles = bundleAvailable
    ? [
        {
          snapshotId,
          projectId,
          createdAt,
          manifestUpdatedAt: nextManifestUpdatedAt,
          spatialFingerprint,
          summary: "Restorable bundle captured from the active project state.",
          files: snapshotFiles
        },
        ...snapshotBundles
      ]
    : snapshotBundles;

  return {
    snapshots: [nextSnapshot, ...snapshots],
    snapshotBundles: nextSnapshotBundles,
    changeSummaries: [nextChangeSummary, ...changeSummaries],
    versioningState: {
      ...versioningState,
      latestSnapshotId: snapshotId,
      snapshotCount: snapshots.length + 1,
      autosaveProtected: true,
      recoveryConfidence:
        versioningState.restorePointCount > 0 ? versioningState.recoveryConfidence : "watch",
      lastRecoveryCheckAt: createdAt
    }
  };
}

export function createRestorePointPromotionUpdate({
  snapshots,
  restorePoints,
  versioningState,
  validationHealthState,
  snapshotBundles = [],
  snapshotId,
  createdAt = new Date().toISOString(),
  label
}: RestorePointPromotionOptions): RestorePointPromotionUpdate | null {
  const sourceSnapshot =
    (snapshotId ? snapshots.find((snapshot) => snapshot.snapshotId === snapshotId) : null) ??
    getLatestSnapshot(snapshots);

  if (!sourceSnapshot) {
    return null;
  }

  const bundleAvailable =
    sourceSnapshot.bundleAvailable &&
    snapshotBundles.some((bundle) => bundle.snapshotId === sourceSnapshot.snapshotId);

  const restorePointId = `restore-${createdAt}`;
  const nextRestorePoint: RestorePoint = {
    restorePointId,
    label: label ?? `Restore from ${sourceSnapshot.label}`,
    createdAt,
    sourceSnapshotId: sourceSnapshot.snapshotId,
    state: "recommended",
    reason: "safe-edit-return",
    summary: "Recommended safe return point before deeper edits or release work.",
    riskNotes: [
      ...(validationHealthState === "Blocked"
        ? ["Project still has blocking validation issues. Treat this as a controlled fallback, not a release-safe state."]
        : []),
      ...(bundleAvailable
        ? []
        : ["This restore point does not yet have a captured restorable bundle. Record a fresh manual snapshot before relying on it operationally."])
    ],
    changeSummaryRefs: sourceSnapshot.changeSummaryRefs
  };

  return {
    restorePoints: [nextRestorePoint, ...restorePoints].map((restorePoint, index) => ({
      ...restorePoint,
      state: index === 0 ? "recommended" : restorePoint.state === "recommended" ? "available" : restorePoint.state
    })),
    versioningState: {
      ...versioningState,
      latestRestorePointId: restorePointId,
      restorePointCount: restorePoints.length + 1,
      restoreAvailable: true,
      recoveryConfidence: "strong",
      lastRecoveryCheckAt: createdAt
    }
  };
}

export function createRestoreExecutionUpdate({
  projectId,
  snapshots,
  snapshotBundles,
  restorePoints,
  changeSummaries,
  versioningState,
  validationHealthState,
  currentStateFiles,
  currentManifestUpdatedAt,
  currentSpatialFingerprint,
  restorePointId,
  createdAt = new Date().toISOString()
}: RestoreExecutionOptions): RestoreExecutionUpdate {
  const selectedRestorePoint =
    (restorePointId
      ? restorePoints.find((entry) => entry.restorePointId === restorePointId)
      : null) ??
    restorePoints.find((entry) => entry.state === "recommended") ??
    restorePoints[0] ??
    null;

  if (!selectedRestorePoint) {
    return {
      status: "failed",
      message: "No restore point is available for execution.",
      versioningState: {
        ...versioningState,
        lastRecoveryCheckAt: createdAt
      }
    };
  }

  const sourceSnapshot =
    snapshots.find((entry) => entry.snapshotId === selectedRestorePoint.sourceSnapshotId) ?? null;

  if (!sourceSnapshot) {
    return {
      status: "failed",
      message: "The selected restore point refers to a snapshot that no longer exists.",
      versioningState: {
        ...versioningState,
        latestRestorePointId: selectedRestorePoint.restorePointId,
        lastRecoveryCheckAt: createdAt
      }
    };
  }

  const sourceBundle =
    snapshotBundles.find((entry) => entry.snapshotId === sourceSnapshot.snapshotId) ?? null;

  if (!sourceBundle) {
    return {
      status: "failed",
      message:
        "The selected restore point does not have a captured restorable bundle yet. Record a fresh manual snapshot before executing restore.",
      versioningState: {
        ...versioningState,
        latestRestorePointId: selectedRestorePoint.restorePointId,
        lastRecoveryCheckAt: createdAt
      }
    };
  }

  const preRecoverySnapshotId = `snapshot-pre-recovery-${createdAt}`;
  const preRecoveryChangeSummaryId = `change-pre-recovery-${createdAt}`;
  const restoreChangeSummaryId = `change-restore-${createdAt}`;
  const preRecoverySnapshot: Snapshot = {
    snapshotId: preRecoverySnapshotId,
    projectId,
    label: "Pre-Recovery Checkpoint",
    createdAt,
    source: "pre-recovery",
    posture: validationHealthState === "Blocked" ? "watch" : "stable",
    summary: "Captured the current project state immediately before restore execution.",
    changeSummary: "Automatic fallback checkpoint recorded before restore execution.",
    changeSummaryRefs: [preRecoveryChangeSummaryId, restoreChangeSummaryId],
    bundleAvailable: currentStateFiles.length > 0
  };
  const preRecoveryBundle: SnapshotBundle = {
    snapshotId: preRecoverySnapshotId,
    projectId,
    createdAt,
    manifestUpdatedAt: currentManifestUpdatedAt,
    spatialFingerprint: currentSpatialFingerprint,
    summary: "Fallback bundle captured immediately before restore execution.",
    files: currentStateFiles
  };
  const preRecoveryChangeSummary: ChangeSummary = {
    changeSummaryId: preRecoveryChangeSummaryId,
    title: "Pre-recovery checkpoint captured",
    summary: "Recorded the current project state so restore execution can be reversed safely if needed.",
    createdAt,
    impact: "high",
    moduleRefs: ["version-control", "build"],
    relatedSnapshotId: preRecoverySnapshotId,
    note: "Generated automatically before restore execution."
  };
  const restoreChangeSummary: ChangeSummary = {
    changeSummaryId: restoreChangeSummaryId,
    title: `Restore executed from ${selectedRestorePoint.label}`,
    summary: `Reconciled project truth back to ${sourceSnapshot.label} using the selected restore point.`,
    createdAt,
    impact: "high",
    moduleRefs: ["version-control", "build", "gameplay", "package"],
    relatedSnapshotId: sourceSnapshot.snapshotId,
    note: "Restore execution completed through the Version Control Center."
  };

  return {
    status: "succeeded",
    message: `Restored project truth from ${selectedRestorePoint.label}.`,
    restoredSnapshotId: sourceSnapshot.snapshotId,
    restoredFiles: sourceBundle.files,
    snapshots: [preRecoverySnapshot, ...snapshots],
    snapshotBundles: [preRecoveryBundle, ...snapshotBundles],
    restorePoints: restorePoints.map((entry) => ({
      ...entry,
      state:
        entry.restorePointId === selectedRestorePoint.restorePointId
          ? "recommended"
          : entry.state === "recommended"
            ? "available"
            : entry.state
    })),
    changeSummaries: [restoreChangeSummary, preRecoveryChangeSummary, ...changeSummaries],
    versioningState: {
      ...versioningState,
      latestSnapshotId: preRecoverySnapshotId,
      latestRestorePointId: selectedRestorePoint.restorePointId,
      snapshotCount: snapshots.length + 1,
      restorePointCount: restorePoints.length,
      restoreAvailable: true,
      autosaveProtected: true,
      recoveryConfidence: "strong",
      lastRecoveryCheckAt: createdAt
    }
  };
}
