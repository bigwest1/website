import { useEffect, useMemo, useState } from "react";

import {
  Button,
  Inline,
  MetricChip,
  SectionHeader,
  SelectField,
  TextAreaField
} from "@course-creator-os/ui";
import { exportReadinessStates, logicStatuses, type ExportReadiness, type LogicStatus } from "@course-creator-os/sim-logic";

import { updatePlayabilityState, useProjectSession } from "../../app/project-session";
import { StatusPill } from "../../components/StatusPill";
import { ValidationIssueCard } from "../../components/ValidationIssueCard";

const playabilityStatusOptions: Array<{
  label: string;
  value: "ready" | "needs-review" | "blocked";
}> = [
  { label: "Ready", value: "ready" },
  { label: "Needs Review", value: "needs-review" },
  { label: "Blocked", value: "blocked" }
];

const logicStatusOptions = logicStatuses.map((value) => ({
  label: humanize(value),
  value
}));

const exportReadinessOptions = exportReadinessStates.map((value) => ({
  label: humanize(value),
  value
}));

function humanize(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toneForReviewStatus(status: "ready" | "needs-review" | "blocked") {
  switch (status) {
    case "ready":
      return "success";
    case "blocked":
      return "danger";
    case "needs-review":
    default:
      return "warning";
  }
}

function toneForLogicStatus(status: LogicStatus) {
  switch (status) {
    case "clear":
      return "success";
    case "blocked":
      return "danger";
    case "watch":
    default:
      return "warning";
  }
}

function riskScore({
  playabilityStatus,
  lineOfPlayStatus,
  shotReadabilityStatus,
  conflictCount
}: {
  playabilityStatus: "ready" | "needs-review" | "blocked";
  lineOfPlayStatus: LogicStatus;
  shotReadabilityStatus: LogicStatus;
  conflictCount: number;
}) {
  let score = 0;

  if (playabilityStatus === "blocked") {
    score += 4;
  } else if (playabilityStatus === "needs-review") {
    score += 2;
  }

  if (lineOfPlayStatus === "blocked") {
    score += 4;
  } else if (lineOfPlayStatus === "watch") {
    score += 2;
  }

  if (shotReadabilityStatus === "blocked") {
    score += 4;
  } else if (shotReadabilityStatus === "watch") {
    score += 2;
  }

  return score + conflictCount * 3;
}

export function PlayabilityCenter() {
  const { project, validationReport } = useProjectSession();
  const [selectedHoleId, setSelectedHoleId] = useState<string | null>(project.holes[0]?.holeId ?? null);

  const queue = useMemo(() => {
    return [...project.holes]
      .map((hole) => {
        const playProfile = project.simulatorLogic.holePlayProfiles.find(
          (profile) => profile.holeId === hole.holeId,
        );
        const conflictEvents = project.eventSequences.filter(
          (event) => event.state === "conflict" && event.linkedHoleRefs.includes(hole.holeId),
        );

        return {
          hole,
          playProfile,
          conflictEvents,
          score: riskScore({
            playabilityStatus: hole.playabilityStatus,
            lineOfPlayStatus: playProfile?.lineOfPlayStatus ?? "watch",
            shotReadabilityStatus: playProfile?.shotReadabilityStatus ?? "watch",
            conflictCount: conflictEvents.length
          })
        };
      })
      .sort((left, right) => right.score - left.score || left.hole.number - right.hole.number);
  }, [project.eventSequences, project.holes, project.simulatorLogic.holePlayProfiles]);

  const selectedQueueEntry = queue.find((entry) => entry.hole.holeId === selectedHoleId) ?? queue[0] ?? null;
  const selectedHole = selectedQueueEntry?.hole ?? null;
  const selectedProfile = selectedQueueEntry?.playProfile ?? null;
  const selectedConflictEvents = selectedQueueEntry?.conflictEvents ?? [];
  const playabilityIssues = validationReport.issues.filter(
    (issue) =>
      issue.ownerModule === "playability" &&
      (!selectedHole || issue.relatedEntityId === null || issue.relatedEntityId === selectedHole.holeId),
  );

  const blockedCount = queue.filter((entry) => entry.score >= 8).length;
  const watchCount = queue.filter((entry) => entry.score >= 4 && entry.score < 8).length;
  const readyCount = queue.length - blockedCount - watchCount;
  const lineOfPlayWatchCount = project.simulatorLogic.holePlayProfiles.filter(
    (profile) => profile.lineOfPlayStatus !== "clear",
  ).length;
  const readabilityWatchCount = project.simulatorLogic.holePlayProfiles.filter(
    (profile) => profile.shotReadabilityStatus !== "clear",
  ).length;
  const conflictEventCount = project.eventSequences.filter((event) => event.state === "conflict").length;

  useEffect(() => {
    if (queue.length === 0) {
      if (selectedHoleId !== null) {
        setSelectedHoleId(null);
      }
      return;
    }

    if (!selectedHoleId || !queue.some((entry) => entry.hole.holeId === selectedHoleId)) {
      setSelectedHoleId(queue[0]!.hole.holeId);
    }
  }, [queue, selectedHoleId]);

  function patchSelectedHole(
    updater: (state: {
      hole: NonNullable<typeof selectedHole>;
      profile: NonNullable<typeof selectedProfile>;
    }) => {
      hole: NonNullable<typeof selectedHole>;
      profile: NonNullable<typeof selectedProfile>;
    },
  ) {
    if (!selectedHole || !selectedProfile) {
      return;
    }

    updatePlayabilityState((state) => {
      const next = updater({
        hole: selectedHole,
        profile: selectedProfile
      });

      return {
        holes: state.holes.map((hole) => (hole.holeId === next.hole.holeId ? next.hole : hole)),
        holePlayProfiles: state.holePlayProfiles.map((profile) =>
          profile.holeId === next.profile.holeId ? next.profile : profile,
        )
      };
    });
  }

  function markSelectedReady() {
    patchSelectedHole(({ hole, profile }) => ({
      hole: {
        ...hole,
        playabilityStatus: "ready"
      },
      profile: {
        ...profile,
        lineOfPlayStatus: "clear",
        shotReadabilityStatus: "clear",
        exportReadiness: "ready"
      }
    }));
  }

  return (
    <div className="mode-stack">
      <section className="panel">
        <SectionHeader
          eyebrow="Playability Center"
          title="Fairness, readability, and spectacle review"
          description="This screen now behaves like a real issue-driven review center instead of a static dashboard stub."
          actions={
            <Inline gap={2}>
              <StatusPill label={`${blockedCount} blocked`} tone={blockedCount > 0 ? "danger" : "success"} />
              <Button disabled={!selectedHole || !selectedProfile} onClick={markSelectedReady} tone="primary">
                Mark Selected Hole Ready
              </Button>
            </Inline>
          }
        />
        <div className="wizard-success-grid">
          <MetricChip label="Ready Holes" value={readyCount} note="Clear for review sign-off" tone="success" />
          <MetricChip label="Watch Queue" value={watchCount} note="Needs clearer routing or readability" tone={watchCount > 0 ? "warning" : "accent"} />
          <MetricChip label="Blocked Holes" value={blockedCount} note="Core gameplay risk still present" tone={blockedCount > 0 ? "warning" : "success"} />
          <MetricChip label="Conflict Events" value={conflictEventCount} note="Spectacle overlaps with play space" tone={conflictEventCount > 0 ? "warning" : "accent"} />
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Review Heatmap</p>
            <h3>What is putting holes at risk</h3>
          </div>
        </div>
        <div className="heatmap-grid">
          <div className={`heat-cell ${lineOfPlayWatchCount > 0 ? "tone-watch" : "tone-safe"}`}>
            <div className="heat-cell-copy">
              <strong>Line Of Play</strong>
              <span>{lineOfPlayWatchCount} holes need a cleaner route read</span>
            </div>
          </div>
          <div className={`heat-cell ${readabilityWatchCount > 0 ? "tone-watch" : "tone-safe"}`}>
            <div className="heat-cell-copy">
              <strong>Shot Readability</strong>
              <span>{readabilityWatchCount} holes still obscure the opening shot</span>
            </div>
          </div>
          <div className={`heat-cell ${conflictEventCount > 0 ? "tone-risk" : "tone-safe"}`}>
            <div className="heat-cell-copy">
              <strong>Spectacle Interference</strong>
              <span>{conflictEventCount} event conflicts currently touch play space</span>
            </div>
          </div>
          <div className={`heat-cell ${blockedCount > 0 ? "tone-risk" : "tone-safe"}`}>
            <div className="heat-cell-copy">
              <strong>Release Readiness</strong>
              <span>{blockedCount} holes are still blocking clean simulator sign-off</span>
            </div>
          </div>
        </div>
      </section>

      <div className="workspace-columns mode-feature-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Review Queue</p>
              <h3>Priority holes by risk</h3>
            </div>
            <StatusPill label={`${queue.length} holes`} tone="info" />
          </div>
          <div className="wizard-stepper wizard-stepper-rich">
            {queue.map((entry) => (
              <button
                key={entry.hole.holeId}
                className={`wizard-step wizard-step-rich ${selectedHoleId === entry.hole.holeId ? "is-active" : ""}`}
                onClick={() => setSelectedHoleId(entry.hole.holeId)}
                type="button"
              >
                <div className="wizard-step-copy">
                  <strong>
                    Hole {entry.hole.number} · {entry.hole.readabilityTarget}
                  </strong>
                  <span>
                    {entry.conflictEvents.length} conflict events · {entry.playProfile?.lineOfPlayStatus ?? "watch"} line
                  </span>
                </div>
                <StatusPill
                  label={entry.hole.playabilityStatus}
                  tone={toneForReviewStatus(entry.hole.playabilityStatus)}
                />
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          {selectedHole && selectedProfile ? (
            <>
              <SectionHeader
                eyebrow="Selected Hole"
                title={`Hole ${selectedHole.number} playability review`}
                description={selectedHole.metadata.greenIntent}
                actions={
                  <Inline gap={2}>
                    <StatusPill label={selectedHole.playabilityStatus} tone={toneForReviewStatus(selectedHole.playabilityStatus)} />
                    <StatusPill label={selectedProfile.exportReadiness} tone={selectedProfile.exportReadiness === "blocked" ? "danger" : selectedProfile.exportReadiness === "ready" ? "success" : "warning"} />
                  </Inline>
                }
              />
              <div className="wizard-form-grid">
                <SelectField
                  label="Playability Status"
                  options={playabilityStatusOptions}
                  value={selectedHole.playabilityStatus}
                  onChange={(event) =>
                    patchSelectedHole(({ hole, profile }) => ({
                      hole: {
                        ...hole,
                        playabilityStatus: event.target.value as typeof hole.playabilityStatus
                      },
                      profile
                    }))
                  }
                />
                <SelectField
                  label="Line Of Play"
                  options={logicStatusOptions}
                  value={selectedProfile.lineOfPlayStatus}
                  onChange={(event) =>
                    patchSelectedHole(({ hole, profile }) => ({
                      hole,
                      profile: {
                        ...profile,
                        lineOfPlayStatus: event.target.value as LogicStatus
                      }
                    }))
                  }
                />
                <SelectField
                  label="Shot Readability"
                  options={logicStatusOptions}
                  value={selectedProfile.shotReadabilityStatus}
                  onChange={(event) =>
                    patchSelectedHole(({ hole, profile }) => ({
                      hole,
                      profile: {
                        ...profile,
                        shotReadabilityStatus: event.target.value as LogicStatus
                      }
                    }))
                  }
                />
                <SelectField
                  label="Export Readiness"
                  options={exportReadinessOptions}
                  value={selectedProfile.exportReadiness}
                  onChange={(event) =>
                    patchSelectedHole(({ hole, profile }) => ({
                      hole,
                      profile: {
                        ...profile,
                        exportReadiness: event.target.value as ExportReadiness
                      }
                    }))
                  }
                />
              </div>
              <TextAreaField
                label="Logic Note"
                hint="Capture the actual fix path for readability, fairness, or spectacle conflicts."
                rows={5}
                value={selectedProfile.logicNote}
                onChange={(event) =>
                  patchSelectedHole(({ hole, profile }) => ({
                    hole,
                    profile: {
                      ...profile,
                      logicNote: event.target.value
                    }
                  }))
                }
              />
              <div className="issue-card-list">
                <article className="module-card">
                  <div className="project-card-meta">
                    <span>Hazards</span>
                    <strong>{selectedHole.hazardRefs.length} linked</strong>
                  </div>
                  <p className="module-card-title">{selectedHole.metadata.hazardNotes}</p>
                  <p className="body-copy">{selectedHole.metadata.routeNotes}</p>
                </article>
                <article className="module-card">
                  <div className="project-card-meta">
                    <span>Event Pressure</span>
                    <strong>{selectedConflictEvents.length} conflicts</strong>
                  </div>
                  <p className="module-card-title">
                    {selectedConflictEvents.length > 0
                      ? selectedConflictEvents.map((event) => event.name).join(", ")
                      : "No conflicting event timing on this hole"}
                  </p>
                  <p className="body-copy">{selectedHole.metadata.eventPayoffNotes}</p>
                </article>
              </div>
            </>
          ) : (
            <article className="module-card">
              <p className="module-card-title">No hole selected</p>
              <p className="body-copy">
                Select a hole from the review queue to inspect gameplay readability, route
                clarity, and spectacle interference together.
              </p>
            </article>
          )}
        </section>
      </div>

      <div className="workspace-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Actionable Issues</p>
              <h3>Validation and review findings</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {(playabilityIssues.length > 0 ? playabilityIssues : validationReport.issues.slice(0, 2)).map((issue) => (
              <ValidationIssueCard key={issue.issueId} issue={issue} compact />
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Review Standard</p>
              <h3>What must be true before sign-off</h3>
            </div>
          </div>
          <ul className="rail-list">
            <li>
              <strong>Readable first shot</strong>
              <span>The tee view must communicate the intended line without guessing.</span>
            </li>
            <li>
              <strong>Fair punishment</strong>
              <span>Hazards should punish committed mistakes, not unclear information.</span>
            </li>
            <li>
              <strong>Spectacle discipline</strong>
              <span>Events can elevate the hole, but not compete with active play space.</span>
            </li>
            <li>
              <strong>Simulator sign-off</strong>
              <span>Line of play, readability, and export posture must all be clean before packaging.</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
