import { z } from "zod";

import type { Project } from "@course-creator-os/project-model";
import {
  createSpatialTrustReport,
  type SpatialTrustHealth,
  type SpatialTrustReport,
  spatialAnalysisConfidenceSchema,
  spatialTrustHealthSchema
} from "@course-creator-os/scene-authoring";

import { sqliteTableSchema, type SQLiteTableName } from "./contracts";

export const projectIndexDriftStateSchema = z.enum(["aligned", "stale", "missing", "corrupt"]);
export const indexHealthIssueSeveritySchema = z.enum(["warning", "critical"]);

export const projectIndexSnapshotSchema = z.object({
  projectId: z.string(),
  projectSlug: z.string(),
  manifestUpdatedAt: z.string(),
  generatedAt: z.string(),
  spatialFingerprint: z.string(),
  trustHealth: spatialTrustHealthSchema,
  analysisConfidence: spatialAnalysisConfidenceSchema,
  sceneObjectCount: z.number().min(0),
  terrainRegionCount: z.number().min(0),
  terrainModifierCount: z.number().min(0),
  routingPathCount: z.number().min(0),
  simulatorBindingCount: z.number().min(0),
  snapshotCount: z.number().min(0),
  tablesExpected: z.array(sqliteTableSchema)
});

export const projectIndexedSpatialStatsSchema = z.object({
  availableTables: z.array(sqliteTableSchema),
  sceneObjectCount: z.number().min(0),
  terrainRegionCount: z.number().min(0),
  terrainModifierCount: z.number().min(0),
  routingPathCount: z.number().min(0),
  simulatorBindingCount: z.number().min(0),
  validationIssueCount: z.number().min(0),
  snapshotCount: z.number().min(0)
});

export const indexHealthIssueSchema = z.object({
  issueId: z.string(),
  severity: indexHealthIssueSeveritySchema,
  title: z.string(),
  summary: z.string(),
  recommendedAction: z.string()
});

export const projectIndexHealthReportSchema = z.object({
  health: spatialTrustHealthSchema,
  driftState: projectIndexDriftStateSchema,
  summary: z.string(),
  recommendedAction: z.string(),
  lastIndexedAt: z.string().nullable(),
  lastVerifiedAt: z.string(),
  fingerprintMatches: z.boolean(),
  trustHealth: spatialTrustHealthSchema,
  issueCount: z.number().min(0),
  warningCount: z.number().min(0),
  criticalCount: z.number().min(0),
  snapshot: projectIndexSnapshotSchema.nullable(),
  issues: z.array(indexHealthIssueSchema)
});

export type ProjectIndexDriftState = z.infer<typeof projectIndexDriftStateSchema>;
export type IndexHealthIssueSeverity = z.infer<typeof indexHealthIssueSeveritySchema>;
export type ProjectIndexSnapshot = z.infer<typeof projectIndexSnapshotSchema>;
export type ProjectIndexedSpatialStats = z.infer<typeof projectIndexedSpatialStatsSchema>;
export type IndexHealthIssue = z.infer<typeof indexHealthIssueSchema>;
export type ProjectIndexHealthReport = z.infer<typeof projectIndexHealthReportSchema>;

function createIssue(input: {
  issueId: string;
  severity: IndexHealthIssueSeverity;
  title: string;
  summary: string;
  recommendedAction: string;
}): IndexHealthIssue {
  return indexHealthIssueSchema.parse(input);
}

export function serializeProjectIndexSnapshot(snapshot: ProjectIndexSnapshot) {
  return `${JSON.stringify(projectIndexSnapshotSchema.parse(snapshot), null, 2)}\n`;
}

export function parseProjectIndexSnapshot(text: string) {
  return projectIndexSnapshotSchema.parse(JSON.parse(text));
}

export function serializeProjectIndexHealthReport(report: ProjectIndexHealthReport) {
  return `${JSON.stringify(projectIndexHealthReportSchema.parse(report), null, 2)}\n`;
}

export function parseProjectIndexHealthReport(text: string) {
  return projectIndexHealthReportSchema.parse(JSON.parse(text));
}

export function createProjectIndexSnapshot(
  project: Project,
  generatedAt = new Date().toISOString(),
  tablesExpected: readonly SQLiteTableName[] = sqliteTableSchema.options,
): ProjectIndexSnapshot {
  const trustReport = createSpatialTrustReport(project.sceneAuthoring, project.simulatorLogic, generatedAt);

  return projectIndexSnapshotSchema.parse({
    projectId: project.id,
    projectSlug: project.manifest.slug,
    manifestUpdatedAt: project.manifest.updatedAt,
    generatedAt,
    spatialFingerprint: trustReport.fingerprint,
    trustHealth: trustReport.health,
    analysisConfidence: trustReport.analysisConfidence,
    sceneObjectCount: trustReport.metrics.objectCount,
    terrainRegionCount: trustReport.metrics.terrainRegionCount,
    terrainModifierCount: trustReport.metrics.terrainModifierCount,
    routingPathCount: trustReport.metrics.routingPathCount,
    simulatorBindingCount:
      project.simulatorLogic.teeSpatialBindings.length +
      project.simulatorLogic.pinSpatialBindings.length +
      project.simulatorLogic.hazardSpatialBindings.length +
      project.simulatorLogic.outOfBoundsSpatialBindings.length +
      project.simulatorLogic.dropZoneSpatialBindings.length +
      project.simulatorLogic.previewAnchorBindings.length,
    snapshotCount: project.snapshots.length,
    tablesExpected: [...tablesExpected]
  });
}

function healthFromIssues(
  criticalCount: number,
  warningCount: number,
  trustHealth: SpatialTrustHealth,
) {
  if (criticalCount > 0 || trustHealth === "critical") {
    return "critical" satisfies SpatialTrustHealth;
  }

  if (warningCount > 0 || trustHealth === "attention") {
    return "attention" satisfies SpatialTrustHealth;
  }

  return "healthy" satisfies SpatialTrustHealth;
}

export function createProjectIndexHealthReport(
  project: Project,
  snapshot: ProjectIndexSnapshot | null,
  generatedAt = new Date().toISOString(),
  indexedStats?: ProjectIndexedSpatialStats | null,
): ProjectIndexHealthReport {
  const trustReport = createSpatialTrustReport(project.sceneAuthoring, project.simulatorLogic, generatedAt);
  const currentSnapshot = createProjectIndexSnapshot(project, generatedAt);
  const issues: IndexHealthIssue[] = [];

  if (!snapshot) {
    issues.push(
      createIssue({
        issueId: "index-snapshot-missing",
        severity: "warning",
        title: "Index manifest is missing",
        summary: "Project truth is available, but no local index manifest exists to confirm spatial trust and rebuild posture.",
        recommendedAction: "Rebuild the local index manifest before long-session editing or export review."
      }),
    );
  }

  if (snapshot) {
    if (snapshot.projectId !== project.id || snapshot.projectSlug !== project.manifest.slug) {
      issues.push(
        createIssue({
          issueId: "index-project-identity-drift",
          severity: "critical",
          title: "Index manifest points at a different project identity",
          summary: "The local index metadata no longer matches the loaded project manifest.",
          recommendedAction: "Discard the stale local index state and rebuild it from project truth."
        }),
      );
    }

    if (snapshot.spatialFingerprint !== currentSnapshot.spatialFingerprint) {
      issues.push(
        createIssue({
          issueId: "index-fingerprint-drift",
          severity: snapshot.manifestUpdatedAt !== project.manifest.updatedAt ? "critical" : "warning",
          title: "Spatial index drift detected",
          summary: "Local index metadata no longer matches the authored spatial state fingerprint.",
          recommendedAction: "Rebuild the spatial index and refresh trust diagnostics before continuing."
        }),
      );
    }

    if (
      snapshot.sceneObjectCount !== currentSnapshot.sceneObjectCount ||
      snapshot.terrainRegionCount !== currentSnapshot.terrainRegionCount ||
      snapshot.routingPathCount !== currentSnapshot.routingPathCount ||
      snapshot.simulatorBindingCount !== currentSnapshot.simulatorBindingCount
    ) {
      issues.push(
        createIssue({
          issueId: "index-count-drift",
          severity: "warning",
          title: "Indexed spatial counts are stale",
          summary: "One or more scene, terrain, routing, or simulator-binding counts no longer align with project truth.",
          recommendedAction: "Refresh the local index snapshot so recovery and export tooling stay trustworthy."
        }),
      );
    }

    if (snapshot.tablesExpected.length < currentSnapshot.tablesExpected.length) {
      issues.push(
        createIssue({
          issueId: "index-schema-version-drift",
          severity: "warning",
          title: "Index manifest predates the current schema expectations",
          summary: "Expected index tables have expanded since the snapshot was generated.",
          recommendedAction: "Rebuild local index state so storage and diagnostics reflect the latest schema."
        }),
      );
    }
  }

  if (indexedStats) {
    if (
      indexedStats.sceneObjectCount !== currentSnapshot.sceneObjectCount ||
      indexedStats.terrainRegionCount !== currentSnapshot.terrainRegionCount ||
      indexedStats.routingPathCount !== currentSnapshot.routingPathCount ||
      indexedStats.simulatorBindingCount !== currentSnapshot.simulatorBindingCount ||
      indexedStats.snapshotCount !== currentSnapshot.snapshotCount
    ) {
      issues.push(
        createIssue({
          issueId: "index-record-drift",
          severity: "critical",
          title: "Indexed records do not match project truth",
          summary:
            "One or more indexed scene, terrain, routing, simulator-binding, or snapshot counts no longer match the authored project files.",
          recommendedAction:
            "Run a controlled index rebuild so recovery and release tooling stop relying on stale SQLite rows."
        }),
      );
    }

    if (indexedStats.availableTables.length < currentSnapshot.tablesExpected.length) {
      issues.push(
        createIssue({
          issueId: "index-table-missing",
          severity: "critical",
          title: "Indexed tables are incomplete",
          summary:
            "Expected SQLite tables for the current spatial workflow are missing from local indexed state.",
          recommendedAction:
            "Recreate the local index schema and rebuild it from project truth."
        }),
      );
    }
  }

  if (trustReport.health === "critical") {
    issues.push(
      createIssue({
        issueId: "spatial-trust-critical",
        severity: "critical",
        title: "Spatial trust is currently degraded",
        summary: trustReport.summary,
        recommendedAction: trustReport.recommendedAction
      }),
    );
  } else if (trustReport.health === "attention") {
    issues.push(
      createIssue({
        issueId: "spatial-trust-attention",
        severity: "warning",
        title: "Spatial trust still needs attention",
        summary: trustReport.summary,
        recommendedAction: trustReport.recommendedAction
      }),
    );
  }

  const criticalCount = issues.filter((issue) => issue.severity === "critical").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const driftState: ProjectIndexDriftState = !snapshot
    ? "missing"
    : issues.some((issue) => issue.issueId === "index-fingerprint-drift" || issue.issueId === "index-count-drift")
      ? "stale"
      : "aligned";
  const health = healthFromIssues(criticalCount, warningCount, trustReport.health);

  return projectIndexHealthReportSchema.parse({
    health,
    driftState,
    summary:
      health === "critical"
        ? "Local spatial trust or index state is degraded. Repair it before relying on recovery or export posture."
        : health === "attention"
          ? "Local index and spatial trust are usable but should be refreshed before a deep authoring pass."
          : "Local index metadata is aligned with authored spatial truth.",
    recommendedAction:
      issues[0]?.recommendedAction ??
      "Keep snapshots and index rebuild metadata current as the spatial workload grows.",
    lastIndexedAt: snapshot?.generatedAt ?? null,
    lastVerifiedAt: generatedAt,
    fingerprintMatches: snapshot?.spatialFingerprint === currentSnapshot.spatialFingerprint,
    trustHealth: trustReport.health,
    issueCount: issues.length,
    warningCount,
    criticalCount,
    snapshot,
    issues
  });
}

export function createSpatialTrustBundle(
  project: Project,
  generatedAt = new Date().toISOString(),
): {
  trustReport: SpatialTrustReport;
  indexSnapshot: ProjectIndexSnapshot;
  indexHealth: ProjectIndexHealthReport;
} {
  const trustReport = createSpatialTrustReport(project.sceneAuthoring, project.simulatorLogic, generatedAt);
  const indexSnapshot = createProjectIndexSnapshot(project, generatedAt);
  const indexHealth = createProjectIndexHealthReport(project, indexSnapshot, generatedAt);

  return {
    trustReport,
    indexSnapshot,
    indexHealth
  };
}

export function shouldRebuildProjectIndex(report: ProjectIndexHealthReport) {
  return report.driftState !== "aligned" || report.health !== "healthy";
}
