import type {
  DiagnosticLog,
  RecoveryDiagnosticSummary,
  RecoveryExpectation,
  RecoveryExpectationStatus,
  TaskLog
} from "./models";
import type { ProjectIndexHealthReport } from "@course-creator-os/storage";

type RecoveryExpectationInput = {
  snapshotCount: number;
  restorePointCount: number;
  latestSnapshotAt: string | null;
  latestRecoveryCheckAt: string | null;
  recoveryConfidence: "strong" | "watch" | "fragile";
  failedTaskCount: number;
  blockedTaskCount: number;
  packagingBlocked: boolean;
  indexHealth?: ProjectIndexHealthReport | null;
};

function healthFromCounts(
  criticalCount: number,
  attentionCount: number,
): RecoveryExpectationStatus {
  if (criticalCount > 0) {
    return "critical";
  }

  if (attentionCount > 0) {
    return "attention";
  }

  return "healthy";
}

export function deriveRecoveryExpectations(
  input: RecoveryExpectationInput,
): RecoveryExpectation[] {
  const snapshotExpectation: RecoveryExpectation =
    input.snapshotCount > 0
      ? {
          expectationId: "snapshot-hygiene",
          title: "Recent snapshot coverage",
          status: input.snapshotCount >= 2 ? "healthy" : "attention",
          summary:
            input.snapshotCount >= 2
              ? "Multiple snapshots are available for safe rollback if the next edit goes sideways."
              : "Only one snapshot is available. A new manual snapshot should be taken before broad changes.",
          recommendedAction: "Create a fresh snapshot before deep world, preview, or packaging changes."
        }
      : {
          expectationId: "snapshot-hygiene",
          title: "Recent snapshot coverage",
          status: "critical",
          summary: "No snapshots are available, so rollback posture is unsafe.",
          recommendedAction: "Record an immediate checkpoint before editing further."
        };

  const restoreExpectation: RecoveryExpectation =
    input.restorePointCount > 0
      ? {
          expectationId: "restore-points",
          title: "Restore point availability",
          status: input.restorePointCount >= 2 ? "healthy" : "attention",
          summary:
            input.restorePointCount >= 2
              ? "Dedicated restore points exist for safe return before risky changes."
              : "A restore point exists, but the project would benefit from a clearer fallback checkpoint.",
          recommendedAction: "Promote a stable snapshot into a recommended restore point before packaging."
        }
      : {
          expectationId: "restore-points",
          title: "Restore point availability",
          status: "critical",
          summary: "No restore point is marked as safe to return to.",
          recommendedAction: "Create a restore point from the latest stable snapshot."
        };

  const taskExpectation: RecoveryExpectation =
    input.failedTaskCount > 0 || input.blockedTaskCount > 0
      ? {
          expectationId: "background-jobs",
          title: "Job and queue stability",
          status: input.failedTaskCount > 0 ? "critical" : "attention",
          summary:
            input.failedTaskCount > 0
              ? "One or more background jobs failed, which weakens recovery confidence."
              : "Blocked jobs exist and should be reviewed before calling the project stable.",
          recommendedAction: "Clear failed or blocked jobs and record a fresh recovery check."
        }
      : {
          expectationId: "background-jobs",
          title: "Job and queue stability",
          status: "healthy",
          summary: "No failed or blocked jobs are weakening recovery posture right now.",
          recommendedAction: "Keep monitoring import, preview, and packaging jobs."
        };

  const packagingExpectation: RecoveryExpectation =
    input.packagingBlocked || input.recoveryConfidence === "fragile"
      ? {
          expectationId: "release-continuity",
          title: "Release continuity",
          status: input.packagingBlocked ? "attention" : "critical",
          summary:
            input.packagingBlocked
              ? "Packaging is still blocked, so restore posture matters before the next candidate run."
              : "Recovery confidence is fragile and could compromise release confidence if left untreated.",
          recommendedAction: "Stabilize recovery posture before claiming release-candidate readiness."
        }
      : {
          expectationId: "release-continuity",
          title: "Release continuity",
          status: "healthy",
          summary: "Recovery posture is strong enough to support controlled candidate packaging.",
          recommendedAction: "Link the next candidate build to a recommended restore point."
        };

  const indexExpectation: RecoveryExpectation =
    input.indexHealth?.health === "critical"
      ? {
          expectationId: "spatial-index-health",
          title: "Spatial index trust",
          status: "critical",
          summary: input.indexHealth.summary,
          recommendedAction: input.indexHealth.recommendedAction
        }
      : input.indexHealth?.health === "attention"
        ? {
            expectationId: "spatial-index-health",
            title: "Spatial index trust",
            status: "attention",
            summary: input.indexHealth.summary,
            recommendedAction: input.indexHealth.recommendedAction
          }
        : {
            expectationId: "spatial-index-health",
            title: "Spatial index trust",
            status: "healthy",
            summary:
              input.indexHealth?.summary ??
              "Spatial index state is aligned closely enough with project truth right now.",
            recommendedAction:
              input.indexHealth?.recommendedAction ??
              "Keep rebuild metadata current before broad terrain, routing, or packaging passes."
          };

  return [
    snapshotExpectation,
    restoreExpectation,
    taskExpectation,
    packagingExpectation,
    indexExpectation
  ];
}

export function createRecoveryDiagnosticLogs({
  latestSnapshotAt,
  latestRecoveryCheckAt,
  failedTaskCount,
  blockedTaskCount,
  packagingBlocked,
  indexHealth
}: RecoveryExpectationInput): DiagnosticLog[] {
  const logs: DiagnosticLog[] = [];

  if (latestSnapshotAt) {
    logs.push({
      logId: "log-latest-snapshot",
      category: "recovery",
      severity: "info",
      source: "SnapshotService",
      message: `Latest snapshot recorded at ${latestSnapshotAt}.`,
      createdAt: latestSnapshotAt
    });
  }

  if (latestRecoveryCheckAt) {
    logs.push({
      logId: "log-recovery-check",
      category: "recovery",
      severity: "info",
      source: "RecoveryMonitor",
      message: `Recovery posture last reviewed at ${latestRecoveryCheckAt}.`,
      createdAt: latestRecoveryCheckAt
    });
  }

  if (failedTaskCount > 0) {
    logs.push({
      logId: "log-failed-tasks",
      category: "background-job",
      severity: "high",
      source: "TaskQueue",
      message: `${failedTaskCount} background jobs failed and may need recovery review.`,
      createdAt: latestRecoveryCheckAt ?? latestSnapshotAt ?? new Date(0).toISOString()
    });
  } else if (blockedTaskCount > 0) {
    logs.push({
      logId: "log-blocked-tasks",
      category: "background-job",
      severity: "warning",
      source: "TaskQueue",
      message: `${blockedTaskCount} background jobs are blocked and should be resolved before a risky edit pass.`,
      createdAt: latestRecoveryCheckAt ?? latestSnapshotAt ?? new Date(0).toISOString()
    });
  }

  if (packagingBlocked) {
    logs.push({
      logId: "log-packaging-continuity",
      category: "packaging",
      severity: "warning",
      source: "PackagingService",
      message: "Packaging is still blocked, so recovery checkpoints should stay current.",
      createdAt: latestRecoveryCheckAt ?? latestSnapshotAt ?? new Date(0).toISOString()
    });
  }

  if (indexHealth) {
    logs.push({
      logId: "log-spatial-index-health",
      category: "spatial-index",
      severity:
        indexHealth.health === "critical"
          ? "high"
          : indexHealth.health === "attention"
            ? "warning"
            : "info",
      source: "SpatialIndex",
      message: indexHealth.summary,
      createdAt: indexHealth.lastVerifiedAt
    });
  }

  return logs.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export function createSpatialTrustDiagnosticLogs(indexHealth: ProjectIndexHealthReport | null): DiagnosticLog[] {
  if (!indexHealth) {
    return [];
  }

  const baseLog: DiagnosticLog = {
    logId: "log-spatial-index-status",
    category: "spatial-index",
    severity:
      indexHealth.health === "critical"
        ? "high"
        : indexHealth.health === "attention"
          ? "warning"
          : "info",
    source: "SpatialTrust",
    message: indexHealth.summary,
    createdAt: indexHealth.lastVerifiedAt
  };

  const issueLogs: DiagnosticLog[] = indexHealth.issues.map((issue, index) => ({
    logId: `log-spatial-index-issue-${index}`,
    category: "spatial-index",
    severity: issue.severity === "critical" ? "high" : "warning",
    source: "SpatialTrust",
    message: `${issue.title}: ${issue.summary}`,
    createdAt: indexHealth.lastVerifiedAt
  }));

  return [
    baseLog,
    ...issueLogs
  ];
}

export function summarizeRecoveryDiagnostics(
  expectations: RecoveryExpectation[],
  logs: DiagnosticLog[],
): RecoveryDiagnosticSummary {
  const healthyCount = expectations.filter((expectation) => expectation.status === "healthy").length;
  const attentionCount = expectations.filter((expectation) => expectation.status === "attention").length;
  const criticalCount = expectations.filter((expectation) => expectation.status === "critical").length;

  return {
    health: healthFromCounts(criticalCount, attentionCount),
    healthyCount,
    attentionCount,
    criticalCount,
    latestRecoveryEventAt: logs[0]?.createdAt ?? null
  };
}

export function mapTasksToLogs(tasks: TaskLog[]): DiagnosticLog[] {
  return tasks.map((task) => ({
    logId: `task-${task.taskLogId}`,
    category: "background-job",
    severity:
      task.status === "failed"
        ? "high"
        : task.status === "blocked"
          ? "warning"
          : "info",
    source: task.moduleKey,
    message: task.detail,
    createdAt: task.updatedAt
  }));
}
