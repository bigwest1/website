import { useEffect, useState } from "react";

import {
  compareHolePlans,
  moveHoleToNumber,
  reorderHoles,
  updateHolePlan
} from "@course-creator-os/hole-planner";
import { Button, Inline, MetricChip, SectionHeader, SelectField, Stack, SurfaceCard, TextAreaField, TextField } from "@course-creator-os/ui";

import { updateHoles, useProjectSession } from "../../app/project-session";
import { StatusPill } from "../../components/StatusPill";
import { ValidationIssueCard } from "../../components/ValidationIssueCard";

const parOptions: Array<{ label: string; value: string }> = [
  { label: "Par 3", value: "3" },
  { label: "Par 4", value: "4" },
  { label: "Par 5", value: "5" },
  { label: "Par 6", value: "6" }
];

const challengeOptions: Array<{ label: string; value: string }> = [
  { label: "1 · Gentle", value: "1" },
  { label: "2 · Manageable", value: "2" },
  { label: "3 · Balanced", value: "3" },
  { label: "4 · Demanding", value: "4" },
  { label: "5 · Signature Test", value: "5" }
];

function splitListInput(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinListInput(values: string[]) {
  return values.join("\n");
}

export function HolePlannerWorkspace() {
  const { project, validationReport } = useProjectSession();
  const holes = project.holes;
  const planIssues = validationReport.issues.filter((issue) => issue.ownerModule === "plan");
  const [selectedHoleId, setSelectedHoleId] = useState(holes[0]?.holeId ?? "");
  const [comparisonHoleId, setComparisonHoleId] = useState(holes[1]?.holeId ?? holes[0]?.holeId ?? "");

  useEffect(() => {
    if (!holes.some((hole) => hole.holeId === selectedHoleId)) {
      setSelectedHoleId(holes[0]?.holeId ?? "");
    }
  }, [holes, selectedHoleId]);

  useEffect(() => {
    if (
      comparisonHoleId &&
      comparisonHoleId !== selectedHoleId &&
      holes.some((hole) => hole.holeId === comparisonHoleId)
    ) {
      return;
    }

    const fallbackComparison = holes.find((hole) => hole.holeId !== selectedHoleId);
    setComparisonHoleId(fallbackComparison?.holeId ?? selectedHoleId);
  }, [comparisonHoleId, holes, selectedHoleId]);

  const selectedHole = holes.find((hole) => hole.holeId === selectedHoleId) ?? holes[0];
  const comparisonHole =
    holes.find((hole) => hole.holeId === comparisonHoleId && hole.holeId !== selectedHole?.holeId) ?? null;

  if (!selectedHole) {
    return null;
  }

  const selectedHoleIdSafe = selectedHole.holeId;
  const comparison = comparisonHole ? compareHolePlans(selectedHole, comparisonHole) : null;
  const averageChallenge =
    holes.length === 0 ? 0 : holes.reduce((total, hole) => total + hole.challengeRating, 0) / holes.length;
  const plannedLandmarkCount = holes.filter((hole) => hole.landmarkRefs.length > 0).length;
  const plannedPreviewCount = holes.filter((hole) => hole.previewRefs.length > 0).length;

  const holeNumberOptions = holes.map((hole) => ({
    label: `Hole ${hole.number}`,
    value: String(hole.number)
  }));
  const comparisonOptions = holes
    .filter((hole) => hole.holeId !== selectedHoleIdSafe)
    .map((hole) => ({
      label: `Hole ${hole.number}`,
      value: hole.holeId
    }));

  function updateSelectedHole(
    updater: Parameters<typeof updateHolePlan>[2],
  ) {
    updateHoles((currentHoles) => updateHolePlan(currentHoles, selectedHoleIdSafe, updater));
  }

  return (
    <section className="panel hole-planner-shell">
      <div className="hole-planner-layout">
        <aside className="hole-planner-list">
          <Stack gap={4}>
            <SectionHeader
              eyebrow="Hole Queue"
              title="Routing order and pacing"
              description="Move holes deliberately. Hole number is treated as sequence, not identity."
            />
            <div className="hole-planner-list-items">
              {holes.map((hole) => (
                <button
                  aria-pressed={hole.holeId === selectedHole.holeId}
                  key={hole.holeId}
                  className={`hole-planner-item ${hole.holeId === selectedHoleIdSafe ? "is-active" : ""}`}
                  onClick={() => setSelectedHoleId(hole.holeId)}
                  type="button"
                >
                  <div>
                    <strong>Hole {hole.number}</strong>
                    <span>
                      Par {hole.par} · {hole.readabilityTarget}
                    </span>
                  </div>
                  <StatusPill
                    label={hole.playabilityStatus}
                    tone={hole.playabilityStatus === "ready" ? "success" : "warning"}
                  />
                </button>
              ))}
            </div>
          </Stack>
        </aside>

        <div className="hole-planner-main">
          <Stack gap={6}>
            <SectionHeader
              eyebrow={`Hole ${selectedHole.number}`}
              title={selectedHole.metadata.holeRole}
              description="Plan each hole as a gameplay beat, a visual composition, and a simulator-readable experience."
              actions={
                <Inline gap={2}>
                  <Button
                    size="sm"
                    tone="ghost"
                    disabled={selectedHole.number === 1}
                    onClick={() =>
                      updateHoles((currentHoles) => reorderHoles(currentHoles, selectedHoleIdSafe, "up"))
                    }
                  >
                    Move Up
                  </Button>
                  <Button
                    size="sm"
                    tone="ghost"
                    disabled={selectedHole.number === holes.length}
                    onClick={() =>
                      updateHoles((currentHoles) => reorderHoles(currentHoles, selectedHoleIdSafe, "down"))
                    }
                  >
                    Move Down
                  </Button>
                </Inline>
              }
            />

            <SurfaceCard padding={6}>
              <SectionHeader
                eyebrow="Core Planning"
                title="Sequence, scoring, and intent"
                description="These are the planning variables later routing, simulator, and preview work will inherit."
              />
              <div className="hole-planner-grid">
                <SelectField
                  label="Hole Number"
                  options={holeNumberOptions}
                  value={String(selectedHole.number)}
                  onChange={(event) =>
                    updateHoles((currentHoles) =>
                      moveHoleToNumber(currentHoles, selectedHoleIdSafe, Number(event.target.value)),
                    )
                  }
                />
                <SelectField
                  label="Par"
                  options={parOptions}
                  value={String(selectedHole.par)}
                  onChange={(event) =>
                    updateSelectedHole((hole) => ({
                      ...hole,
                      par: Number(event.target.value) as 3 | 4 | 5 | 6
                    }))
                  }
                />
                <TextField
                  label="Target Yardage"
                  type="number"
                  min={60}
                  max={760}
                  value={String(selectedHole.targetYardage)}
                  onChange={(event) =>
                    updateSelectedHole((hole) => ({
                      ...hole,
                      targetYardage: Math.max(60, Number(event.target.value) || hole.targetYardage)
                    }))
                  }
                />
                <SelectField
                  label="Challenge Rating"
                  options={challengeOptions}
                  value={String(selectedHole.challengeRating)}
                  onChange={(event) =>
                    updateSelectedHole((hole) => ({
                      ...hole,
                      challengeRating: Number(event.target.value) as 1 | 2 | 3 | 4 | 5
                    }))
                  }
                />
                <TextField
                  label="Readability Target"
                  value={selectedHole.readabilityTarget}
                  onChange={(event) =>
                    updateSelectedHole((hole) => ({
                      ...hole,
                      readabilityTarget: event.target.value
                    }))
                  }
                />
                <TextAreaField
                  label="Emotional Role"
                  rows={4}
                  value={selectedHole.emotionalRole}
                  onChange={(event) =>
                    updateSelectedHole((hole) => ({
                      ...hole,
                      emotionalRole: event.target.value
                    }))
                  }
                />
              </div>
            </SurfaceCard>

            <SurfaceCard padding={6}>
              <SectionHeader
                eyebrow="Routing and Composition"
                title="How the hole should read and resolve"
                description="Landmark planning, route guidance, and fairway/green intent should all reinforce the same story."
              />
              <div className="hole-planner-grid">
                <TextAreaField
                  label="Hole Role"
                  rows={3}
                  value={selectedHole.metadata.holeRole}
                  onChange={(event) =>
                    updateSelectedHole((hole) => ({
                      ...hole,
                      metadata: {
                        ...hole.metadata,
                        holeRole: event.target.value
                      }
                    }))
                  }
                />
                <TextAreaField
                  label="Route Notes"
                  rows={4}
                  value={selectedHole.metadata.routeNotes}
                  onChange={(event) =>
                    updateSelectedHole((hole) => ({
                      ...hole,
                      metadata: {
                        ...hole.metadata,
                        routeNotes: event.target.value
                      }
                    }))
                  }
                />
                <TextAreaField
                  label="Fairway Intent"
                  rows={4}
                  value={selectedHole.metadata.fairwayIntent}
                  onChange={(event) =>
                    updateSelectedHole((hole) => ({
                      ...hole,
                      metadata: {
                        ...hole.metadata,
                        fairwayIntent: event.target.value
                      }
                    }))
                  }
                />
                <TextAreaField
                  label="Green Intent"
                  rows={4}
                  value={selectedHole.metadata.greenIntent}
                  onChange={(event) =>
                    updateSelectedHole((hole) => ({
                      ...hole,
                      metadata: {
                        ...hole.metadata,
                        greenIntent: event.target.value
                      }
                    }))
                  }
                />
                <TextAreaField
                  label="Visual Landmarks"
                  rows={5}
                  hint="One landmark reference per line."
                  value={joinListInput(selectedHole.landmarkRefs)}
                  onChange={(event) =>
                    updateSelectedHole((hole) => ({
                      ...hole,
                      landmarkRefs: splitListInput(event.target.value)
                    }))
                  }
                />
                <TextAreaField
                  label="Hazards"
                  rows={5}
                  hint="One hazard reference per line."
                  value={joinListInput(selectedHole.hazardRefs)}
                  onChange={(event) =>
                    updateSelectedHole((hole) => ({
                      ...hole,
                      hazardRefs: splitListInput(event.target.value)
                    }))
                  }
                />
              </div>
            </SurfaceCard>

            <SurfaceCard padding={6}>
              <SectionHeader
                eyebrow="Payoffs and Preview"
                title="Events, completion beats, and flyover intent"
                description="These notes should help preview, animation, and world modules understand why the hole matters."
              />
              <div className="hole-planner-grid">
                <TextAreaField
                  label="Hazard Notes"
                  rows={4}
                  value={selectedHole.metadata.hazardNotes}
                  onChange={(event) =>
                    updateSelectedHole((hole) => ({
                      ...hole,
                      metadata: {
                        ...hole.metadata,
                        hazardNotes: event.target.value
                      }
                    }))
                  }
                />
                <TextAreaField
                  label="Event / Payoff Notes"
                  rows={4}
                  value={selectedHole.metadata.eventPayoffNotes}
                  onChange={(event) =>
                    updateSelectedHole((hole) => ({
                      ...hole,
                      metadata: {
                        ...hole.metadata,
                        eventPayoffNotes: event.target.value
                      }
                    }))
                  }
                />
                <TextAreaField
                  label="Flyover Notes"
                  rows={4}
                  value={selectedHole.metadata.flyoverNotes}
                  onChange={(event) =>
                    updateSelectedHole((hole) => ({
                      ...hole,
                      metadata: {
                        ...hole.metadata,
                        flyoverNotes: event.target.value
                      }
                    }))
                  }
                />
                <TextAreaField
                  label="Event References"
                  rows={4}
                  hint="One event reference per line."
                  value={joinListInput(selectedHole.eventRefs)}
                  onChange={(event) =>
                    updateSelectedHole((hole) => ({
                      ...hole,
                      eventRefs: splitListInput(event.target.value)
                    }))
                  }
                />
              </div>
            </SurfaceCard>
          </Stack>
        </div>

        <aside className="hole-planner-sidebar">
          <Stack gap={6}>
            <SurfaceCard padding={6} tone="contrast" border="accent">
              <SectionHeader
                eyebrow="Planner Summary"
                title="Plan coverage at a glance"
                description="These signals tell you whether the planning layer is deep enough to hand off."
              />
              <div className="wizard-success-grid">
                <MetricChip label="Average Challenge" value={averageChallenge.toFixed(1)} note="Across all planned holes" />
                <MetricChip
                  label="Landmarked Holes"
                  value={`${plannedLandmarkCount}/${holes.length}`}
                  note="Visual anchors assigned"
                  tone={plannedLandmarkCount === holes.length ? "success" : "warning"}
                />
                <MetricChip
                  label="Preview-Tagged Holes"
                  value={`${plannedPreviewCount}/${holes.length}`}
                  note="Preview refs assigned"
                  tone={plannedPreviewCount === holes.length ? "success" : "warning"}
                />
                <MetricChip
                  label="Selected Hole"
                  value={`Hole ${selectedHole.number}`}
                  note={`Par ${selectedHole.par} · ${selectedHole.targetYardage} yds`}
                  tone="accent"
                />
              </div>
            </SurfaceCard>

            <SurfaceCard padding={6} tone="ghost">
              <SectionHeader
                eyebrow="Hole Comparison"
                title="Basic side-by-side review"
                description="Compare challenge, pacing, and shared references before locking the routing order."
              />
              <Stack gap={4}>
                {comparisonOptions.length > 0 ? (
                  <SelectField
                    label="Compare Against"
                    options={comparisonOptions}
                    value={comparisonHole?.holeId ?? ""}
                    onChange={(event) => setComparisonHoleId(event.target.value)}
                  />
                ) : (
                  <p className="body-copy">
                    Add more than one hole to enable side-by-side comparison.
                  </p>
                )}
                {comparison ? (
                  <div className="hole-planner-comparison-grid">
                    <MetricChip label="Yardage Delta" value={`${comparison.yardageDelta > 0 ? "+" : ""}${comparison.yardageDelta}`} note={`${comparison.primaryLabel} minus ${comparison.secondaryLabel}`} />
                    <MetricChip label="Par Delta" value={`${comparison.parDelta > 0 ? "+" : ""}${comparison.parDelta}`} note="Scoring spread" />
                    <MetricChip label="Challenge Delta" value={`${comparison.challengeDelta > 0 ? "+" : ""}${comparison.challengeDelta}`} note="Relative demand" />
                    <MetricChip
                      label="Readability Match"
                      value={comparison.readabilityMatch ? "Aligned" : "Different"}
                      note="Comparison target"
                      tone={comparison.readabilityMatch ? "success" : "warning"}
                    />
                  </div>
                ) : (
                  <p className="body-copy">Choose another hole to compare pacing and planning posture.</p>
                )}
                {comparison ? (
                  <Stack gap={3}>
                    <div>
                      <p className="eyebrow">Shared Landmarks</p>
                      <p className="body-copy">
                        {comparison.sharedLandmarks.length > 0
                          ? comparison.sharedLandmarks.join(", ")
                          : "No shared landmark references yet."}
                      </p>
                    </div>
                    <div>
                      <p className="eyebrow">Shared Hazards</p>
                      <p className="body-copy">
                        {comparison.sharedHazards.length > 0
                          ? comparison.sharedHazards.join(", ")
                          : "No shared hazard references yet."}
                      </p>
                    </div>
                  </Stack>
                ) : null}
              </Stack>
            </SurfaceCard>

            <SurfaceCard padding={6} tone="ghost">
              <SectionHeader
                eyebrow="Attention"
                title="Planning issues"
                description="Validation should identify the next planning pass before build work starts."
              />
              <div className="issue-card-list">
                {(planIssues.length > 0 ? planIssues : validationReport.issues.slice(0, 2)).map((issue) => (
                  <ValidationIssueCard key={issue.issueId} issue={issue} compact />
                ))}
              </div>
            </SurfaceCard>
          </Stack>
        </aside>
      </div>
    </section>
  );
}
