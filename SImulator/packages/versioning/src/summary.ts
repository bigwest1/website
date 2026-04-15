import type {
  ChangeSummary,
  RecoveryConfidence,
  RestorePoint,
  Snapshot,
  SnapshotPosture,
  VersioningStateSummary
} from "./models";

type VersioningSummary = {
  latestSnapshot: Snapshot | null;
  latestRestorePoint: RestorePoint | null;
  latestChangeSummary: ChangeSummary | null;
  stableSnapshotCount: number;
  recommendedRestorePointCount: number;
  confidence: RecoveryConfidence;
  summary: string;
};

function compareByCreatedAt<T extends { createdAt: string }>(left: T, right: T) {
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

export function getLatestSnapshot(snapshots: Snapshot[]) {
  return [...snapshots].sort(compareByCreatedAt)[0] ?? null;
}

export function getLatestRestorePoint(restorePoints: RestorePoint[]) {
  return [...restorePoints].sort(compareByCreatedAt)[0] ?? null;
}

export function getLatestChangeSummary(changeSummaries: ChangeSummary[]) {
  return [...changeSummaries].sort(compareByCreatedAt)[0] ?? null;
}

export function getSnapshotPostureCount(snapshots: Snapshot[], posture: SnapshotPosture) {
  return snapshots.filter((snapshot) => snapshot.posture === posture).length;
}

export function summarizeVersioningState({
  snapshots,
  restorePoints,
  changeSummaries,
  versioningState
}: {
  snapshots: Snapshot[];
  restorePoints: RestorePoint[];
  changeSummaries: ChangeSummary[];
  versioningState: VersioningStateSummary;
}): VersioningSummary {
  const latestSnapshot = getLatestSnapshot(snapshots);
  const latestRestorePoint = getLatestRestorePoint(restorePoints);
  const latestChangeSummary = getLatestChangeSummary(changeSummaries);
  const stableSnapshotCount = getSnapshotPostureCount(snapshots, "stable");
  const recommendedRestorePointCount = restorePoints.filter(
    (restorePoint) => restorePoint.state === "recommended",
  ).length;

  const summary =
    versioningState.recoveryConfidence === "strong"
      ? "Recovery posture is strong. Recent stable checkpoints and restore points are available."
      : versioningState.recoveryConfidence === "watch"
        ? "Recovery posture is usable, but recent checkpoint or restore hygiene should be improved."
        : "Recovery posture is fragile. The next major change should happen only after a fresh snapshot and restore point.";

  return {
    latestSnapshot,
    latestRestorePoint,
    latestChangeSummary,
    stableSnapshotCount,
    recommendedRestorePointCount,
    confidence: versioningState.recoveryConfidence,
    summary
  };
}
