import { useEffect, useState } from "react";

import {
  createRecoveryDiagnosticLogs,
  createSpatialTrustDiagnosticLogs,
  deriveRecoveryExpectations,
  summarizeRecoveryDiagnostics
} from "@course-creator-os/logging";
import { Button, Inline, MetricChip } from "@course-creator-os/ui";
import {
  getLatestChangeSummary,
  getLatestRestorePoint,
  getLatestSnapshot,
  summarizeVersioningState
} from "@course-creator-os/versioning";

import {
  executeRestorePoint,
  promoteRestorePoint,
  rebuildSpatialIndex,
  recordManualSnapshot,
  useProjectSession
} from "../../app/project-session";
import { StatusPill } from "../../components/StatusPill";

function toneForConfidence(confidence: "strong" | "watch" | "fragile") {
  switch (confidence) {
    case "strong":
      return "success";
    case "watch":
      return "warning";
    case "fragile":
    default:
      return "danger";
  }
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not yet recorded";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function VersionControlCenter() {
  const { project, indexHealth, operations } = useProjectSession();
  const [selectedSnapshotId, setSelectedSnapshotId] = useState(project.snapshots[0]?.snapshotId ?? null);
  const [selectedRestorePointId, setSelectedRestorePointId] = useState(
    project.restorePoints[0]?.restorePointId ?? null,
  );

  useEffect(() => {
    if (!project.snapshots.some((snapshot) => snapshot.snapshotId === selectedSnapshotId)) {
      setSelectedSnapshotId(project.snapshots[0]?.snapshotId ?? null);
    }
  }, [project.snapshots, selectedSnapshotId]);

  useEffect(() => {
    if (!project.restorePoints.some((restorePoint) => restorePoint.restorePointId === selectedRestorePointId)) {
      setSelectedRestorePointId(project.restorePoints[0]?.restorePointId ?? null);
    }
  }, [project.restorePoints, selectedRestorePointId]);

  const versioningSummary = summarizeVersioningState({
    snapshots: project.snapshots,
    restorePoints: project.restorePoints,
    changeSummaries: project.changeSummaries,
    versioningState: project.versioningState
  });
  const failedTaskCount = project.backgroundJobs.filter((job) => job.status === "failed").length;
  const blockedTaskCount = project.backgroundJobs.filter((job) => job.status === "blocked").length;
  const recoveryInput = {
    snapshotCount: project.versioningState.snapshotCount,
    restorePointCount: project.versioningState.restorePointCount,
    latestSnapshotAt: versioningSummary.latestSnapshot?.createdAt ?? null,
    latestRecoveryCheckAt: project.versioningState.lastRecoveryCheckAt,
    recoveryConfidence: project.versioningState.recoveryConfidence,
    failedTaskCount,
    blockedTaskCount,
    packagingBlocked: project.packagingState.readiness === "blocked",
    indexHealth
  };
  const recoveryExpectations = deriveRecoveryExpectations(recoveryInput);
  const recoveryLogs = [
    ...operations.logs,
    ...createSpatialTrustDiagnosticLogs(indexHealth),
    ...createRecoveryDiagnosticLogs(recoveryInput)
  ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  const recoverySummary = summarizeRecoveryDiagnostics(recoveryExpectations, recoveryLogs);
  const selectedSnapshot =
    project.snapshots.find((snapshot) => snapshot.snapshotId === selectedSnapshotId) ??
    getLatestSnapshot(project.snapshots);
  const selectedRestorePoint =
    project.restorePoints.find((restorePoint) => restorePoint.restorePointId === selectedRestorePointId) ??
    getLatestRestorePoint(project.restorePoints);
  const latestChangeSummary = getLatestChangeSummary(project.changeSummaries);

  return (
    <div className="mode-stack version-control-center">
      <section className="panel package-center-hero">
        <div>
          <p className="eyebrow">Version Control Center</p>
          <h3>Safe checkpoints, restore posture, and recovery confidence</h3>
          <p className="body-copy">
            This space should make long-running work feel safe. Every risky pass needs a clear
            rollback path, visible change context, and recovery guidance the creator can trust.
          </p>
        </div>
        <div className="package-center-hero-meta">
          <StatusPill
            label={project.versioningState.restoreAvailable ? "restore available" : "restore unavailable"}
            tone={project.versioningState.restoreAvailable ? "success" : "warning"}
          />
          <StatusPill
            label={project.versioningState.recoveryConfidence}
            tone={toneForConfidence(project.versioningState.recoveryConfidence)}
          />
        </div>
      </section>

      <div className="package-center-metrics">
        <MetricChip label="Snapshots" value={project.versioningState.snapshotCount} tone="info" />
        <MetricChip label="Restore Points" value={project.versioningState.restorePointCount} tone="accent" />
        <MetricChip label="Change Summaries" value={project.changeSummaries.length} tone="info" />
        <MetricChip
          label="Spatial Trust"
          value={indexHealth.health}
          note={indexHealth.driftState}
          tone={indexHealth.health === "healthy" ? "success" : indexHealth.health === "attention" ? "warning" : "error"}
        />
        <MetricChip
          label="Recovery Health"
          value={recoverySummary.health}
          note={`${recoverySummary.criticalCount} critical`}
          tone={recoverySummary.health === "healthy" ? "success" : recoverySummary.health === "attention" ? "warning" : "error"}
        />
      </div>

      <div className="workspace-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Snapshot Listing</p>
              <h3>Checkpoint trail</h3>
            </div>
            <Button onClick={() => recordManualSnapshot()} size="sm" tone="secondary">
              Record Snapshot
            </Button>
          </div>
          <div className="versioning-selector-list">
            {project.snapshots.map((snapshot) => (
              <button
                key={snapshot.snapshotId}
                className="versioning-selector-card"
                data-active={snapshot.snapshotId === selectedSnapshot?.snapshotId}
                onClick={() => setSelectedSnapshotId(snapshot.snapshotId)}
                type="button"
              >
                <div className="project-card-meta">
                  <span>{snapshot.source}</span>
                  <strong>{snapshot.posture}</strong>
                </div>
                <p className="module-card-title">{snapshot.label}</p>
                <p className="body-copy">{snapshot.summary}</p>
                <p className="muted-copy">
                  {formatTimestamp(snapshot.createdAt)} · {snapshot.bundleAvailable ? "restorable" : "metadata only"}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Snapshot Detail</p>
              <h3>Selected checkpoint context</h3>
            </div>
          </div>
          {selectedSnapshot ? (
            <div className="issue-card-list">
              <article className="module-card">
                <div className="project-card-meta">
                  <span>{selectedSnapshot.source}</span>
                  <strong>{selectedSnapshot.posture}</strong>
                </div>
                <p className="module-card-title">{selectedSnapshot.label}</p>
                <p className="body-copy">{selectedSnapshot.summary}</p>
                <p className="muted-copy">{selectedSnapshot.changeSummary ?? "No change summary recorded."}</p>
              </article>
              <article className="module-card">
                <p className="module-card-title">Recorded at</p>
                <p className="body-copy">{formatTimestamp(selectedSnapshot.createdAt)}</p>
              </article>
              <article className="module-card">
                <p className="module-card-title">Restore bundle</p>
                <p className="body-copy">
                  {selectedSnapshot.bundleAvailable
                    ? "A restorable bundle is captured for this snapshot."
                    : "This snapshot is metadata-only. Record a fresh manual snapshot before relying on it for restore execution."}
                </p>
              </article>
              <article className="module-card">
                <p className="module-card-title">Linked change summaries</p>
                <ul className="rail-list">
                  {(selectedSnapshot.changeSummaryRefs.length > 0
                    ? selectedSnapshot.changeSummaryRefs
                    : ["No linked change summaries recorded."]).map((item, index) => (
                    <li key={`${selectedSnapshot.snapshotId}-change-${index}`}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>
          ) : (
            <article className="module-card">
              <p className="module-card-title">No snapshot selected</p>
              <p className="body-copy">Record a snapshot to establish the first restore-safe checkpoint.</p>
            </article>
          )}
        </section>
      </div>

      <div className="workspace-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Restore Points</p>
              <h3>Recommended safe return paths</h3>
            </div>
            <Button
              onClick={() => promoteRestorePoint(selectedSnapshot?.snapshotId)}
              size="sm"
              tone="primary"
            >
              Promote Restore Point
            </Button>
          </div>
          <div className="versioning-selector-list">
            {project.restorePoints.map((restorePoint) => (
              <button
                key={restorePoint.restorePointId}
                className="versioning-selector-card"
                data-active={restorePoint.restorePointId === selectedRestorePoint?.restorePointId}
                onClick={() => setSelectedRestorePointId(restorePoint.restorePointId)}
                type="button"
              >
                <div className="project-card-meta">
                  <span>{restorePoint.reason}</span>
                  <strong>{restorePoint.state}</strong>
                </div>
                <p className="module-card-title">{restorePoint.label}</p>
                <p className="body-copy">{restorePoint.summary}</p>
                <p className="muted-copy">{formatTimestamp(restorePoint.createdAt)}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Restore Preview</p>
              <h3>What the selected restore point protects</h3>
            </div>
          </div>
          {selectedRestorePoint ? (
            <div className="issue-card-list">
              <article className="module-card">
                <div className="project-card-meta">
                  <span>{selectedRestorePoint.reason}</span>
                  <strong>{selectedRestorePoint.state}</strong>
                </div>
                <p className="module-card-title">{selectedRestorePoint.label}</p>
                <p className="body-copy">{selectedRestorePoint.summary}</p>
                <p className="muted-copy">
                  Source snapshot: {selectedRestorePoint.sourceSnapshotId}
                </p>
              </article>
              <article className="module-card">
                <p className="module-card-title">Execution readiness</p>
                <p className="body-copy">
                  {project.snapshots.find((snapshot) => snapshot.snapshotId === selectedRestorePoint.sourceSnapshotId)
                    ?.bundleAvailable
                    ? "This restore point has a captured bundle and can be executed safely."
                    : "This restore point still points at a snapshot without a captured restore bundle."}
                </p>
              </article>
              <article className="module-card">
                <p className="module-card-title">Risk notes</p>
                <ul className="rail-list">
                  {(selectedRestorePoint.riskNotes.length > 0
                    ? selectedRestorePoint.riskNotes
                    : ["No special risk notes recorded for this restore point."]).map((note, index) => (
                    <li key={`${selectedRestorePoint.restorePointId}-risk-${index}`}>{note}</li>
                  ))}
                </ul>
              </article>
            </div>
          ) : (
            <article className="module-card">
              <p className="module-card-title">No restore point selected</p>
              <p className="body-copy">Promote a stable snapshot into a restore point to make rollback posture explicit.</p>
            </article>
          )}
        </section>
      </div>

      <div className="workspace-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Change Summaries</p>
              <h3>Recent continuity notes</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {project.changeSummaries.map((changeSummary) => (
              <article key={changeSummary.changeSummaryId} className="module-card">
                <div className="project-card-meta">
                  <span>{changeSummary.impact}</span>
                  <strong>{formatTimestamp(changeSummary.createdAt)}</strong>
                </div>
                <p className="module-card-title">{changeSummary.title}</p>
                <p className="body-copy">{changeSummary.summary}</p>
                <p className="muted-copy">
                  {changeSummary.moduleRefs.join(" · ") || "No module refs recorded"}
                </p>
              </article>
            ))}
            {!project.changeSummaries.length ? (
              <article className="module-card">
                <p className="module-card-title">No change summaries recorded yet</p>
                <p className="body-copy">Use change summaries to explain why a snapshot or restore point matters.</p>
              </article>
            ) : null}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Spatial Trust</p>
              <h3>Index and rebuild posture for long-session Build work</h3>
            </div>
          </div>
          <div className="issue-card-list">
            <article className="module-card">
              <div className="project-card-meta">
                <span>{indexHealth.driftState}</span>
                <strong>{indexHealth.health}</strong>
              </div>
              <p className="module-card-title">Spatial index confidence</p>
              <p className="body-copy">{indexHealth.summary}</p>
              <p className="muted-copy">{indexHealth.recommendedAction}</p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>rebuild</span>
                <strong>{operations.rebuild.status}</strong>
              </div>
              <p className="module-card-title">Latest rebuild operation</p>
              <p className="body-copy">
                {operations.rebuild.message ?? "No explicit rebuild has been run in this session yet."}
              </p>
              <p className="muted-copy">{formatTimestamp(operations.rebuild.ranAt)}</p>
            </article>
            {(indexHealth.issues.length > 0 ? indexHealth.issues : []).slice(0, 3).map((issue) => (
              <article key={issue.issueId} className="module-card">
                <div className="project-card-meta">
                  <span>spatial trust</span>
                  <strong>{issue.severity}</strong>
                </div>
                <p className="module-card-title">{issue.title}</p>
                <p className="body-copy">{issue.summary}</p>
                <p className="muted-copy">{issue.recommendedAction}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Recovery Expectations</p>
              <h3>What should stay true before risky work</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {recoveryExpectations.map((expectation) => (
              <article key={expectation.expectationId} className="module-card">
                <div className="project-card-meta">
                  <span>recovery</span>
                  <strong>{expectation.status}</strong>
                </div>
                <p className="module-card-title">{expectation.title}</p>
                <p className="body-copy">{expectation.summary}</p>
                <p className="muted-copy">{expectation.recommendedAction}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="workspace-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Recovery Diagnostics</p>
              <h3>Useful logs, not noise</h3>
            </div>
            <Inline gap={8}>
              <Button onClick={() => rebuildSpatialIndex()} size="sm" tone="secondary">
                Rebuild Spatial Index
              </Button>
              <Button onClick={() => executeRestorePoint(selectedRestorePoint?.restorePointId)} size="sm" tone="primary">
                Execute Restore
              </Button>
            </Inline>
          </div>
          <div className="issue-card-list">
            {recoveryLogs.map((log) => (
              <article key={log.logId} className="module-card">
                <div className="project-card-meta">
                  <span>{log.category}</span>
                  <strong>{log.severity}</strong>
                </div>
                <p className="body-copy">{log.message}</p>
                <p className="muted-copy">
                  {log.source} · {formatTimestamp(log.createdAt)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Continuity Summary</p>
              <h3>Current recovery posture</h3>
            </div>
          </div>
          <div className="issue-card-list">
            <article className="module-card">
              <p className="module-card-title">{versioningSummary.summary}</p>
              <p className="body-copy">
                Latest snapshot: {formatTimestamp(versioningSummary.latestSnapshot?.createdAt ?? null)}
              </p>
              <p className="muted-copy">
                Latest restore point: {formatTimestamp(versioningSummary.latestRestorePoint?.createdAt ?? null)}
              </p>
            </article>
            <article className="module-card">
              <p className="module-card-title">Latest change summary</p>
              <p className="body-copy">
                {latestChangeSummary?.summary ?? "No change summary has been recorded yet."}
              </p>
              <p className="muted-copy">
                Last recovery check: {formatTimestamp(project.versioningState.lastRecoveryCheckAt)}
              </p>
            </article>
            <article className="module-card">
              <p className="module-card-title">Latest restore execution</p>
              <p className="body-copy">
                {operations.restore.message ?? "No restore has been executed in this session yet."}
              </p>
              <p className="muted-copy">{formatTimestamp(operations.restore.ranAt)}</p>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
