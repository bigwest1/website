import { useEffect, useState } from "react";

import { moveHoleToNumber } from "@course-creator-os/hole-planner";
import { summarizeSimulatorLogic, type FlyoverMetadata, type HazardProfile, type HolePlayProfile, type MinimapMetadata, type PinSet, type SurfaceProfile, type TeeSet } from "@course-creator-os/sim-logic";
import { Button, Inline, MetricChip, SectionHeader, SelectField, Stack, SurfaceCard, TextAreaField, TextField, TogglePillGroup } from "@course-creator-os/ui";

import { updateHoles, updateSimulatorLogicState, useProjectSession } from "../../app/project-session";
import { StatusPill } from "../../components/StatusPill";
import { ValidationIssueCard } from "../../components/ValidationIssueCard";

const gameplayTabs = [
  "Hole Logic",
  "Tee Sets",
  "Pin Sets",
  "Surfaces",
  "Hazards & OB",
  "Drop Zones",
  "Flyovers & Minimap",
  "Output Validation"
] as const;

const parOptions: Array<{ label: string; value: string }> = [
  { label: "Par 3", value: "3" },
  { label: "Par 4", value: "4" },
  { label: "Par 5", value: "5" },
  { label: "Par 6", value: "6" }
];

const logicStatusOptions: Array<{ label: string; value: HolePlayProfile["lineOfPlayStatus"] }> = [
  { label: "Clear", value: "clear" },
  { label: "Watch", value: "watch" },
  { label: "Blocked", value: "blocked" }
];

const exportReadinessOptions: Array<{ label: string; value: HolePlayProfile["exportReadiness"] }> = [
  { label: "Draft", value: "draft" },
  { label: "Ready", value: "ready" },
  { label: "Blocked", value: "blocked" }
];

const booleanOptions: Array<{ label: string; value: "yes" | "no" }> = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" }
];

const teeColorOptions: Array<{ label: string; value: TeeSet["color"] }> = [
  { label: "Black", value: "black" },
  { label: "Gold", value: "gold" },
  { label: "Blue", value: "blue" },
  { label: "White", value: "white" },
  { label: "Silver", value: "silver" },
  { label: "Red", value: "red" },
  { label: "Green", value: "green" }
];

const pinDifficultyOptions: Array<{ label: string; value: PinSet["difficulty"] }> = [
  { label: "Easy", value: "easy" },
  { label: "Standard", value: "standard" },
  { label: "Tournament", value: "tournament" }
];

const surfaceTypeOptions: Array<{ label: string; value: SurfaceProfile["type"] }> = [
  { label: "Fairway", value: "fairway" },
  { label: "Rough", value: "rough" },
  { label: "Bunker", value: "bunker" },
  { label: "Green", value: "green" },
  { label: "Fringe", value: "fringe" },
  { label: "Water", value: "water" },
  { label: "Cart Path", value: "cart-path" }
];

const hazardTypeOptions: Array<{ label: string; value: HazardProfile["type"] }> = [
  { label: "Water", value: "water" },
  { label: "Bunker", value: "bunker" },
  { label: "Out of Bounds", value: "out-of-bounds" },
  { label: "Waste", value: "waste" },
  { label: "Native Area", value: "native-area" }
];

const previewStateOptions: Array<{ label: string; value: MinimapMetadata["overlayState"] }> = [
  { label: "Missing", value: "missing" },
  { label: "Draft", value: "draft" },
  { label: "Ready", value: "ready" }
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

function toneForCompletenessPill(score: number) {
  if (score >= 85) {
    return "success" as const;
  }

  if (score >= 60) {
    return "warning" as const;
  }

  return "danger" as const;
}

function toneForCompletenessMetric(score: number) {
  if (score >= 85) {
    return "success" as const;
  }

  if (score >= 60) {
    return "warning" as const;
  }

  return "error" as const;
}

function toneForSegment(status: "safe" | "watch" | "risky") {
  if (status === "safe") {
    return "success" as const;
  }

  if (status === "watch") {
    return "warning" as const;
  }

  return "error" as const;
}

export function GameplayLogicCenter() {
  const { project, validationReport } = useProjectSession();
  const [activeTab, setActiveTab] = useState<(typeof gameplayTabs)[number]>("Hole Logic");
  const [selectedHoleId, setSelectedHoleId] = useState(project.holes[0]?.holeId ?? "");
  const gameplayIssues = validationReport.issues.filter((issue) => issue.ownerModule === "gameplay");
  const summary = summarizeSimulatorLogic(project.simulatorLogic);
  const selectedHole = project.holes.find((hole) => hole.holeId === selectedHoleId) ?? project.holes[0];
  const selectedHoleProfile = project.simulatorLogic.holePlayProfiles.find(
    (profile) => profile.holeId === selectedHole?.holeId,
  );
  const selectedMinimapMetadata = project.simulatorLogic.minimapMetadata.find(
    (metadata) => metadata.holeId === selectedHole?.holeId,
  );
  const selectedFlyoverMetadata = project.simulatorLogic.flyoverMetadata.find(
    (metadata) => metadata.holeId === selectedHole?.holeId,
  );

  useEffect(() => {
    if (!project.holes.some((hole) => hole.holeId === selectedHoleId)) {
      setSelectedHoleId(project.holes[0]?.holeId ?? "");
    }
  }, [project.holes, selectedHoleId]);

  if (!selectedHole || !selectedHoleProfile || !selectedMinimapMetadata || !selectedFlyoverMetadata) {
    return null;
  }

  const selectedHoleSafe = selectedHole;
  const selectedHoleProfileSafe = selectedHoleProfile;
  const selectedMinimapMetadataSafe = selectedMinimapMetadata;
  const selectedFlyoverMetadataSafe = selectedFlyoverMetadata;
  const holeNumberOptions = project.holes.map((hole) => ({
    label: `Hole ${hole.number}`,
    value: String(hole.number)
  }));

  function updateHolePlayProfile(
    holeId: string,
    updater: (profile: HolePlayProfile) => HolePlayProfile,
  ) {
    updateSimulatorLogicState((state) => ({
      ...state,
      holePlayProfiles: state.holePlayProfiles.map((profile) =>
        profile.holeId === holeId ? updater(profile) : profile,
      )
    }));
  }

  function updateMinimap(
    holeId: string,
    updater: (metadata: MinimapMetadata) => MinimapMetadata,
  ) {
    updateSimulatorLogicState((state) => ({
      ...state,
      minimapMetadata: state.minimapMetadata.map((metadata) =>
        metadata.holeId === holeId ? updater(metadata) : metadata,
      )
    }));
  }

  function updateFlyover(
    holeId: string,
    updater: (metadata: FlyoverMetadata) => FlyoverMetadata,
  ) {
    updateSimulatorLogicState((state) => ({
      ...state,
      flyoverMetadata: state.flyoverMetadata.map((metadata) =>
        metadata.holeId === holeId ? updater(metadata) : metadata,
      )
    }));
  }

  function renderHoleLogicTab() {
    const selectedHole = selectedHoleSafe;
    const selectedHoleProfile = selectedHoleProfileSafe;

    return (
      <div className="gameplay-tab-stack">
        <SurfaceCard padding={6}>
          <SectionHeader
            eyebrow="Selected Hole"
            title={`Hole ${selectedHole.number} Logic`}
            description="Par, yardage, and simulator readability should stay aligned to the planned route."
            actions={<StatusPill label={selectedHoleProfile.exportReadiness} tone={toneForCompletenessPill(selectedHoleProfile.exportReadiness === "ready" ? 100 : selectedHoleProfile.exportReadiness === "draft" ? 68 : 30)} />}
          />
          <div className="gameplay-field-grid">
            <SelectField
              label="Hole"
              options={project.holes.map((hole) => ({
                label: `Hole ${hole.number}`,
                value: hole.holeId
              }))}
              value={selectedHole.holeId}
              onChange={(event) => setSelectedHoleId(event.target.value)}
            />
            <SelectField
              label="Hole Number"
              options={holeNumberOptions}
              value={String(selectedHole.number)}
              onChange={(event) =>
                updateHoles((holes) =>
                  moveHoleToNumber(holes, selectedHole.holeId, Number(event.target.value)),
                )
              }
            />
            <SelectField
              label="Par"
              options={parOptions}
              value={String(selectedHole.par)}
              onChange={(event) =>
                updateHoles((holes) =>
                  holes.map((hole) =>
                    hole.holeId === selectedHole.holeId
                      ? { ...hole, par: Number(event.target.value) as 3 | 4 | 5 | 6 }
                      : hole,
                  ),
                )
              }
            />
            <TextField
              label="Target Yardage"
              type="number"
              min={60}
              max={760}
              value={String(selectedHole.targetYardage)}
              onChange={(event) =>
                updateHoles((holes) =>
                  holes.map((hole) =>
                    hole.holeId === selectedHole.holeId
                      ? {
                          ...hole,
                          targetYardage: Math.max(60, Number(event.target.value) || hole.targetYardage)
                        }
                      : hole,
                  ),
                )
              }
            />
          </div>
        </SurfaceCard>

        <SurfaceCard padding={6}>
          <SectionHeader
            eyebrow="Logic State"
            title="Line-of-play and output readiness"
            description="Treat these as creator-facing gameplay judgments, not hidden export flags."
          />
          <div className="gameplay-toggle-grid">
            <div>
              <p className="eyebrow">Line of Play</p>
              <TogglePillGroup
                ariaLabel="Line of play status"
                options={logicStatusOptions}
                value={selectedHoleProfile.lineOfPlayStatus}
                onChange={(value) =>
                  updateHolePlayProfile(selectedHole.holeId, (profile) => ({
                    ...profile,
                    lineOfPlayStatus: value
                  }))
                }
              />
            </div>
            <div>
              <p className="eyebrow">Shot Readability</p>
              <TogglePillGroup
                ariaLabel="Shot readability status"
                options={logicStatusOptions}
                value={selectedHoleProfile.shotReadabilityStatus}
                onChange={(value) =>
                  updateHolePlayProfile(selectedHole.holeId, (profile) => ({
                    ...profile,
                    shotReadabilityStatus: value
                  }))
                }
              />
            </div>
            <div>
              <p className="eyebrow">Export Readiness</p>
              <TogglePillGroup
                ariaLabel="Export readiness status"
                options={exportReadinessOptions}
                value={selectedHoleProfile.exportReadiness}
                onChange={(value) =>
                  updateHolePlayProfile(selectedHole.holeId, (profile) => ({
                    ...profile,
                    exportReadiness: value
                  }))
                }
              />
            </div>
            <div>
              <p className="eyebrow">Hole OB State</p>
              <TogglePillGroup
                ariaLabel="Hole OB state"
                options={booleanOptions}
                value={selectedHoleProfile.outOfBounds ? "yes" : "no"}
                onChange={(value) =>
                  updateHolePlayProfile(selectedHole.holeId, (profile) => ({
                    ...profile,
                    outOfBounds: value === "yes"
                  }))
                }
              />
            </div>
          </div>
          <TextAreaField
            label="Logic Note"
            rows={4}
            value={selectedHoleProfile.logicNote}
            onChange={(event) =>
              updateHolePlayProfile(selectedHole.holeId, (profile) => ({
                ...profile,
                logicNote: event.target.value
              }))
            }
          />
        </SurfaceCard>
      </div>
    );
  }

  function renderTeeSetsTab() {
    return (
      <div className="gameplay-card-grid">
        {project.teeSets.map((teeSet) => (
          <SurfaceCard key={teeSet.teeSetId} padding={6} tone="ghost">
            <Stack gap={4}>
              <Inline justify="space-between">
                <div>
                  <p className="eyebrow">Tee Set</p>
                  <h3>{teeSet.name}</h3>
                </div>
                <StatusPill label={teeSet.defaultTee ? "Default" : teeSet.color} tone={teeSet.defaultTee ? "success" : "info"} />
              </Inline>
              <TextField
                label="Name"
                value={teeSet.name}
                onChange={(event) =>
                  updateSimulatorLogicState((state) => ({
                    ...state,
                    teeSets: state.teeSets.map((candidate) =>
                      candidate.teeSetId === teeSet.teeSetId
                        ? { ...candidate, name: event.target.value }
                        : candidate,
                    )
                  }))
                }
              />
              <SelectField
                label="Color"
                options={teeColorOptions}
                value={teeSet.color}
                onChange={(event) =>
                  updateSimulatorLogicState((state) => ({
                    ...state,
                    teeSets: state.teeSets.map((candidate) =>
                      candidate.teeSetId === teeSet.teeSetId
                        ? { ...candidate, color: event.target.value as TeeSet["color"] }
                        : candidate,
                    )
                  }))
                }
              />
              <TextField
                label="Total Yardage"
                type="number"
                min={1000}
                max={9000}
                value={String(teeSet.totalYardage)}
                onChange={(event) =>
                  updateSimulatorLogicState((state) => ({
                    ...state,
                    teeSets: state.teeSets.map((candidate) =>
                      candidate.teeSetId === teeSet.teeSetId
                        ? {
                            ...candidate,
                            totalYardage: Math.max(1000, Number(event.target.value) || candidate.totalYardage)
                          }
                        : candidate,
                    )
                  }))
                }
              />
              <div>
                <p className="eyebrow">Default Tee</p>
                <TogglePillGroup
                  ariaLabel={`Default tee state for ${teeSet.name}`}
                  options={booleanOptions}
                  value={teeSet.defaultTee ? "yes" : "no"}
                  onChange={(value) =>
                    updateSimulatorLogicState((state) => ({
                      ...state,
                      teeSets: state.teeSets.map((candidate) => ({
                        ...candidate,
                        defaultTee:
                          candidate.teeSetId === teeSet.teeSetId ? value === "yes" : value === "yes" ? false : candidate.defaultTee
                      }))
                    }))
                  }
                />
              </div>
            </Stack>
          </SurfaceCard>
        ))}
        <SurfaceCard padding={6} tone="contrast" border="accent">
          <Stack gap={4}>
            <p className="eyebrow">Add Tee Set</p>
            <p className="body-copy">Expand accessibility and release confidence with additional tee coverage.</p>
            <Button
              tone="secondary"
              onClick={() =>
                updateSimulatorLogicState((state) => ({
                  ...state,
                      teeSets: [
                        ...state.teeSets,
                        {
                          teeSetId: `tee-${Date.now()}`,
                          name: "Forward",
                          color: "green",
                          totalYardage: Math.max(
                            4200,
                            (state.teeSets[0]?.totalYardage ?? 6500) - 900,
                          ),
                          defaultTee: false,
                          holeYardages: Object.fromEntries(
                            project.holes.map((hole) => [hole.holeId, Math.max(120, hole.targetYardage - 40)]),
                          )
                    }
                  ]
                }))
              }
            >
              Add Tee Set
            </Button>
          </Stack>
        </SurfaceCard>
      </div>
    );
  }

  function renderPinSetsTab() {
    return (
      <div className="gameplay-card-grid">
        {project.pinSets.map((pinSet) => (
          <SurfaceCard key={pinSet.pinSetId} padding={6} tone="ghost">
            <Stack gap={4}>
              <Inline justify="space-between">
                <div>
                  <p className="eyebrow">Pin Set</p>
                  <h3>{pinSet.name}</h3>
                </div>
                <StatusPill label={`${pinSet.enabledHoleIds.length} holes`} tone="info" />
              </Inline>
              <TextField
                label="Name"
                value={pinSet.name}
                onChange={(event) =>
                  updateSimulatorLogicState((state) => ({
                    ...state,
                    pinSets: state.pinSets.map((candidate) =>
                      candidate.pinSetId === pinSet.pinSetId
                        ? { ...candidate, name: event.target.value }
                        : candidate,
                    )
                  }))
                }
              />
              <SelectField
                label="Difficulty"
                options={pinDifficultyOptions}
                value={pinSet.difficulty}
                onChange={(event) =>
                  updateSimulatorLogicState((state) => ({
                    ...state,
                    pinSets: state.pinSets.map((candidate) =>
                      candidate.pinSetId === pinSet.pinSetId
                        ? { ...candidate, difficulty: event.target.value as PinSet["difficulty"] }
                        : candidate,
                    )
                  }))
                }
              />
              <TextAreaField
                label="Enabled Holes"
                hint="One hole ID per line."
                rows={5}
                value={joinListInput(pinSet.enabledHoleIds)}
                onChange={(event) =>
                  updateSimulatorLogicState((state) => ({
                    ...state,
                    pinSets: state.pinSets.map((candidate) =>
                      candidate.pinSetId === pinSet.pinSetId
                        ? {
                            ...candidate,
                            enabledHoleIds: splitListInput(event.target.value).length > 0
                              ? splitListInput(event.target.value)
                              : [project.holes[0]!.holeId]
                          }
                        : candidate,
                    )
                  }))
                }
              />
            </Stack>
          </SurfaceCard>
        ))}
        <SurfaceCard padding={6} tone="contrast" border="accent">
          <Stack gap={4}>
            <p className="eyebrow">Add Pin Set</p>
            <p className="body-copy">Add another pin posture before calling the course export-ready.</p>
            <Button
              tone="secondary"
              onClick={() =>
                updateSimulatorLogicState((state) => ({
                  ...state,
                  pinSets: [
                    ...state.pinSets,
                    {
                      pinSetId: `pins-${Date.now()}`,
                      name: "Tournament",
                      difficulty: "tournament",
                      enabledHoleIds: project.holes.map((hole) => hole.holeId)
                    }
                  ]
                }))
              }
            >
              Add Pin Set
            </Button>
          </Stack>
        </SurfaceCard>
      </div>
    );
  }

  function renderSurfacesTab() {
    return (
      <div className="gameplay-card-grid">
        {project.surfaceProfiles.map((surface) => (
          <SurfaceCard key={surface.surfaceId} padding={6} tone="ghost">
            <Stack gap={4}>
              <Inline justify="space-between">
                <div>
                  <p className="eyebrow">Surface Profile</p>
                  <h3>{surface.name}</h3>
                </div>
                <StatusPill label={surface.playable ? "Playable" : "Non-playable"} tone={surface.playable ? "success" : "warning"} />
              </Inline>
              <TextField
                label="Name"
                value={surface.name}
                onChange={(event) =>
                  updateSimulatorLogicState((state) => ({
                    ...state,
                    surfaceProfiles: state.surfaceProfiles.map((candidate) =>
                      candidate.surfaceId === surface.surfaceId
                        ? { ...candidate, name: event.target.value }
                        : candidate,
                    )
                  }))
                }
              />
              <SelectField
                label="Surface Type"
                options={surfaceTypeOptions}
                value={surface.type}
                onChange={(event) =>
                  updateSimulatorLogicState((state) => ({
                    ...state,
                    surfaceProfiles: state.surfaceProfiles.map((candidate) =>
                      candidate.surfaceId === surface.surfaceId
                        ? { ...candidate, type: event.target.value as SurfaceProfile["type"] }
                        : candidate,
                    )
                  }))
                }
              />
              <TextAreaField
                label="Physics Note"
                rows={4}
                value={surface.physicsNote}
                onChange={(event) =>
                  updateSimulatorLogicState((state) => ({
                    ...state,
                    surfaceProfiles: state.surfaceProfiles.map((candidate) =>
                      candidate.surfaceId === surface.surfaceId
                        ? { ...candidate, physicsNote: event.target.value }
                        : candidate,
                    )
                  }))
                }
              />
              <div>
                <p className="eyebrow">Playable Surface</p>
                <TogglePillGroup
                  ariaLabel={`Playable state for ${surface.name}`}
                  options={booleanOptions}
                  value={surface.playable ? "yes" : "no"}
                  onChange={(value) =>
                    updateSimulatorLogicState((state) => ({
                      ...state,
                      surfaceProfiles: state.surfaceProfiles.map((candidate) =>
                        candidate.surfaceId === surface.surfaceId
                          ? { ...candidate, playable: value === "yes" }
                          : candidate,
                      )
                    }))
                  }
                />
              </div>
            </Stack>
          </SurfaceCard>
        ))}
      </div>
    );
  }

  function renderHazardsTab() {
    const selectedHole = selectedHoleSafe;

    return (
      <div className="gameplay-tab-stack">
        <SurfaceCard padding={6}>
          <SectionHeader
            eyebrow="Global OB"
            title="Out-of-bounds posture"
            description="Make OB explicit before claiming gameplay correctness."
          />
          <TogglePillGroup
            ariaLabel="Out-of-bounds configured"
            options={booleanOptions}
            value={project.simulatorLogic.outOfBoundsConfigured ? "yes" : "no"}
            onChange={(value) =>
              updateSimulatorLogicState((state) => ({
                ...state,
                outOfBoundsConfigured: value === "yes"
              }))
            }
          />
        </SurfaceCard>

        <div className="gameplay-card-grid">
          {project.hazardProfiles.map((hazard) => (
            <SurfaceCard key={hazard.hazardId} padding={6} tone="ghost">
              <Stack gap={4}>
                <Inline justify="space-between">
                  <div>
                    <p className="eyebrow">Hazard</p>
                    <h3>{hazard.hazardId}</h3>
                  </div>
                  <StatusPill label={hazard.type} tone="warning" />
                </Inline>
                <SelectField
                  label="Hole"
                  options={project.holes.map((hole) => ({
                    label: `Hole ${hole.number}`,
                    value: hole.holeId
                  }))}
                  value={hazard.holeId}
                  onChange={(event) =>
                    updateSimulatorLogicState((state) => ({
                      ...state,
                      hazardProfiles: state.hazardProfiles.map((candidate) =>
                        candidate.hazardId === hazard.hazardId
                          ? { ...candidate, holeId: event.target.value }
                          : candidate,
                      )
                    }))
                  }
                />
                <SelectField
                  label="Type"
                  options={hazardTypeOptions}
                  value={hazard.type}
                  onChange={(event) =>
                    updateSimulatorLogicState((state) => ({
                      ...state,
                      hazardProfiles: state.hazardProfiles.map((candidate) =>
                        candidate.hazardId === hazard.hazardId
                          ? { ...candidate, type: event.target.value as HazardProfile["type"] }
                          : candidate,
                      )
                    }))
                  }
                />
                <TextAreaField
                  label="Play Rule"
                  rows={3}
                  value={hazard.playRule}
                  onChange={(event) =>
                    updateSimulatorLogicState((state) => ({
                      ...state,
                      hazardProfiles: state.hazardProfiles.map((candidate) =>
                        candidate.hazardId === hazard.hazardId
                          ? { ...candidate, playRule: event.target.value }
                          : candidate,
                      )
                    }))
                  }
                />
                <TextAreaField
                  label="Hazard Note"
                  rows={3}
                  value={hazard.note}
                  onChange={(event) =>
                    updateSimulatorLogicState((state) => ({
                      ...state,
                      hazardProfiles: state.hazardProfiles.map((candidate) =>
                        candidate.hazardId === hazard.hazardId
                          ? { ...candidate, note: event.target.value }
                          : candidate,
                      )
                    }))
                  }
                />
                <div>
                  <p className="eyebrow">Drop Zone Required</p>
                  <TogglePillGroup
                    ariaLabel={`Drop-zone requirement for ${hazard.hazardId}`}
                    options={booleanOptions}
                    value={hazard.dropZoneRequired ? "yes" : "no"}
                    onChange={(value) =>
                      updateSimulatorLogicState((state) => ({
                        ...state,
                        hazardProfiles: state.hazardProfiles.map((candidate) =>
                          candidate.hazardId === hazard.hazardId
                            ? { ...candidate, dropZoneRequired: value === "yes" }
                            : candidate,
                        )
                      }))
                    }
                  />
                </div>
              </Stack>
            </SurfaceCard>
          ))}
          <SurfaceCard padding={6} tone="contrast" border="accent">
            <Stack gap={4}>
              <p className="eyebrow">Add Hazard</p>
              <p className="body-copy">Add hazard logic before later packaging work assumes it exists.</p>
              <Button
                tone="secondary"
                onClick={() =>
                  updateSimulatorLogicState((state) => ({
                    ...state,
                    hazardProfiles: [
                      ...state.hazardProfiles,
                      {
                        hazardId: `hazard-${Date.now()}`,
                        type: "water",
                        holeId: selectedHole.holeId,
                        playRule: "Water hazard rule to be defined.",
                        dropZoneRequired: false,
                        note: "Review landing zone and recovery logic."
                      }
                    ]
                  }))
                }
              >
                Add Hazard
              </Button>
            </Stack>
          </SurfaceCard>
        </div>
      </div>
    );
  }

  function renderDropZonesTab() {
    const selectedHole = selectedHoleSafe;

    return (
      <div className="gameplay-card-grid">
        {project.dropZones.map((dropZone) => (
          <SurfaceCard key={dropZone.dropZoneId} padding={6} tone="ghost">
            <Stack gap={4}>
              <Inline justify="space-between">
                <div>
                  <p className="eyebrow">Drop Zone</p>
                  <h3>{dropZone.label}</h3>
                </div>
                <StatusPill label={dropZone.holeId} tone="info" />
              </Inline>
              <SelectField
                label="Hole"
                options={project.holes.map((hole) => ({
                  label: `Hole ${hole.number}`,
                  value: hole.holeId
                }))}
                value={dropZone.holeId}
                onChange={(event) =>
                  updateSimulatorLogicState((state) => ({
                    ...state,
                    dropZones: state.dropZones.map((candidate) =>
                      candidate.dropZoneId === dropZone.dropZoneId
                        ? { ...candidate, holeId: event.target.value }
                        : candidate,
                    )
                  }))
                }
              />
              <TextField
                label="Label"
                value={dropZone.label}
                onChange={(event) =>
                  updateSimulatorLogicState((state) => ({
                    ...state,
                    dropZones: state.dropZones.map((candidate) =>
                      candidate.dropZoneId === dropZone.dropZoneId
                        ? { ...candidate, label: event.target.value }
                        : candidate,
                    )
                  }))
                }
              />
              <SelectField
                label="Trigger Hazard"
                options={project.hazardProfiles.map((hazard) => ({
                  label: hazard.hazardId,
                  value: hazard.hazardId
                }))}
                value={dropZone.triggerHazardId}
                onChange={(event) =>
                  updateSimulatorLogicState((state) => ({
                    ...state,
                    dropZones: state.dropZones.map((candidate) =>
                      candidate.dropZoneId === dropZone.dropZoneId
                        ? { ...candidate, triggerHazardId: event.target.value }
                        : candidate,
                    )
                  }))
                }
              />
              <TextAreaField
                label="Note"
                rows={4}
                value={dropZone.note}
                onChange={(event) =>
                  updateSimulatorLogicState((state) => ({
                    ...state,
                    dropZones: state.dropZones.map((candidate) =>
                      candidate.dropZoneId === dropZone.dropZoneId
                        ? { ...candidate, note: event.target.value }
                        : candidate,
                    )
                  }))
                }
              />
            </Stack>
          </SurfaceCard>
        ))}
        <SurfaceCard padding={6} tone="contrast" border="accent">
          <Stack gap={4}>
            <p className="eyebrow">Add Drop Zone</p>
            <p className="body-copy">Add recovery logic where hazards require a pace-preserving fallback.</p>
            <Button
              tone="secondary"
              onClick={() =>
                updateSimulatorLogicState((state) => ({
                  ...state,
                  dropZones: [
                    ...state.dropZones,
                    {
                      dropZoneId: `drop-zone-${Date.now()}`,
                      holeId: selectedHole.holeId,
                      label: "New recovery zone",
                      triggerHazardId: state.hazardProfiles[0]?.hazardId ?? "hazard-to-link",
                      note: "Confirm placement and fairness."
                    }
                  ]
                }))
              }
            >
              Add Drop Zone
            </Button>
          </Stack>
        </SurfaceCard>
      </div>
    );
  }

  function renderFlyoversAndMinimapTab() {
    const selectedHole = selectedHoleSafe;
    const selectedMinimapMetadata = selectedMinimapMetadataSafe;
    const selectedFlyoverMetadata = selectedFlyoverMetadataSafe;

    return (
      <div className="gameplay-tab-stack">
        <SurfaceCard padding={6}>
          <SectionHeader
            eyebrow="Selected Hole"
            title={`Hole ${selectedHole.number} Preview Inputs`}
            description="Gameplay owns preview correctness inputs even though Preview Studio owns the final polish."
            actions={<StatusPill label={selectedMinimapMetadata.overlayState} tone={selectedMinimapMetadata.overlayState === "ready" ? "success" : "warning"} />}
          />
          <SelectField
            label="Hole"
            options={project.holes.map((hole) => ({
              label: `Hole ${hole.number}`,
              value: hole.holeId
            }))}
            value={selectedHole.holeId}
            onChange={(event) => setSelectedHoleId(event.target.value)}
          />
        </SurfaceCard>

        <div className="workspace-columns">
          <SurfaceCard padding={6}>
            <SectionHeader
              eyebrow="Minimap"
              title="Top-down gameplay input"
              description="The minimap should explain routing, landing zones, and orientation."
            />
            <Stack gap={4}>
              <SelectField
                label="Preview Path"
                options={project.previewPaths
                  .filter((path) => path.previewType === "minimap" && path.holeRefs.includes(selectedHole.holeId))
                  .map((path) => ({ label: path.name, value: path.previewPathId }))}
                placeholder="No minimap path linked"
                value={selectedMinimapMetadata.previewPathRef ?? ""}
                onChange={(event) =>
                  updateMinimap(selectedHole.holeId, (metadata) => ({
                    ...metadata,
                    previewPathRef: event.target.value || null
                  }))
                }
              />
              <div>
                <p className="eyebrow">Overlay State</p>
                <TogglePillGroup
                  ariaLabel="Minimap overlay state"
                  options={previewStateOptions}
                  value={selectedMinimapMetadata.overlayState}
                  onChange={(value) =>
                    updateMinimap(selectedHole.holeId, (metadata) => ({
                      ...metadata,
                      overlayState: value
                    }))
                  }
                />
              </div>
              <TextField
                label="Focal Landmark"
                value={selectedMinimapMetadata.focalLandmark}
                onChange={(event) =>
                  updateMinimap(selectedHole.holeId, (metadata) => ({
                    ...metadata,
                    focalLandmark: event.target.value
                  }))
                }
              />
              <TextField
                label="Orientation Hint"
                value={selectedMinimapMetadata.orientationHint}
                onChange={(event) =>
                  updateMinimap(selectedHole.holeId, (metadata) => ({
                    ...metadata,
                    orientationHint: event.target.value
                  }))
                }
              />
              <TextAreaField
                label="Framing Note"
                rows={4}
                value={selectedMinimapMetadata.framingNote}
                onChange={(event) =>
                  updateMinimap(selectedHole.holeId, (metadata) => ({
                    ...metadata,
                    framingNote: event.target.value
                  }))
                }
              />
            </Stack>
          </SurfaceCard>

          <SurfaceCard padding={6}>
            <SectionHeader
              eyebrow="Flyover"
              title="Cinematic gameplay input"
              description="The flyover should teach the hole, not just celebrate it."
            />
            <Stack gap={4}>
              <SelectField
                label="Preview Path"
                options={project.previewPaths
                  .filter((path) => path.previewType === "flyover" && path.holeRefs.includes(selectedHole.holeId))
                  .map((path) => ({ label: path.name, value: path.previewPathId }))}
                placeholder="No flyover path linked"
                value={selectedFlyoverMetadata.previewPathRef ?? ""}
                onChange={(event) =>
                  updateFlyover(selectedHole.holeId, (metadata) => ({
                    ...metadata,
                    previewPathRef: event.target.value || null
                  }))
                }
              />
              <div>
                <p className="eyebrow">Readiness</p>
                <TogglePillGroup
                  ariaLabel="Flyover readiness state"
                  options={previewStateOptions}
                  value={selectedFlyoverMetadata.readinessState}
                  onChange={(value) =>
                    updateFlyover(selectedHole.holeId, (metadata) => ({
                      ...metadata,
                      readinessState: value
                    }))
                  }
                />
              </div>
              <TextField
                label="Camera Intent"
                value={selectedFlyoverMetadata.cameraIntent}
                onChange={(event) =>
                  updateFlyover(selectedHole.holeId, (metadata) => ({
                    ...metadata,
                    cameraIntent: event.target.value
                  }))
                }
              />
              <TextField
                label="Intro Beat"
                value={selectedFlyoverMetadata.introBeat}
                onChange={(event) =>
                  updateFlyover(selectedHole.holeId, (metadata) => ({
                    ...metadata,
                    introBeat: event.target.value
                  }))
                }
              />
              <TextField
                label="Outro Beat"
                value={selectedFlyoverMetadata.outroBeat}
                onChange={(event) =>
                  updateFlyover(selectedHole.holeId, (metadata) => ({
                    ...metadata,
                    outroBeat: event.target.value
                  }))
                }
              />
              <TextField
                label="Duration Seconds"
                type="number"
                min={4}
                max={60}
                value={String(selectedFlyoverMetadata.durationSeconds)}
                onChange={(event) =>
                  updateFlyover(selectedHole.holeId, (metadata) => ({
                    ...metadata,
                    durationSeconds: Math.max(4, Number(event.target.value) || metadata.durationSeconds)
                  }))
                }
              />
            </Stack>
          </SurfaceCard>
        </div>
      </div>
    );
  }

  function renderOutputValidationTab() {
    const blockedProfiles = project.simulatorLogic.holePlayProfiles.filter(
      (profile) => profile.exportReadiness === "blocked",
    );

    return (
      <div className="gameplay-tab-stack">
        <SurfaceCard padding={6}>
          <SectionHeader
            eyebrow="Output Validation"
            title="Export-facing gameplay readiness"
            description="This tab is where gameplay correctness is judged before packaging claims confidence."
          />
          <TextAreaField
            label="Export Notes"
            hint="One export note per line."
            rows={5}
            value={joinListInput(project.simulatorLogic.exportProfileNotes)}
            onChange={(event) =>
              updateSimulatorLogicState((state) => ({
                ...state,
                exportProfileNotes: splitListInput(event.target.value)
              }))
            }
          />
        </SurfaceCard>

        <div className="gameplay-segment-grid">
          {summary.segments.map((segment) => (
            <MetricChip
              key={segment.segmentId}
              label={segment.label}
              value={`${Math.round(segment.score * 100)}%`}
              note={segment.detail}
              tone={toneForSegment(segment.status)}
            />
          ))}
        </div>

        <div className="workspace-columns">
          <SurfaceCard padding={6}>
            <SectionHeader
              eyebrow="Blocked Holes"
              title="Gameplay blockers"
              description="A blocked hole here means packaging should not pretend the course is ready."
            />
            <div className="issue-card-list">
              {blockedProfiles.length > 0 ? (
                blockedProfiles.map((profile) => (
                  <article key={profile.holeId} className="module-card">
                    <p className="module-card-title">Hole {profile.holeNumber}</p>
                    <p className="body-copy">{profile.logicNote}</p>
                    <div className="module-card-meta">
                      <span>{profile.lineOfPlayStatus}</span>
                      <span>{profile.shotReadabilityStatus}</span>
                      <span>{profile.exportReadiness}</span>
                    </div>
                  </article>
                ))
              ) : (
                <article className="module-card">
                  <p className="module-card-title">No blocked holes</p>
                  <p className="body-copy">Gameplay export posture is clear enough for the current foundation pass.</p>
                </article>
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard padding={6}>
            <SectionHeader
              eyebrow="Fix Paths"
              title="Gameplay issues"
              description="Every warning here should point to a clear configuration action."
            />
            <div className="issue-card-list">
              {(gameplayIssues.length > 0 ? gameplayIssues : validationReport.issues.slice(0, 2)).map((issue) => (
                <ValidationIssueCard key={issue.issueId} issue={issue} compact />
              ))}
            </div>
          </SurfaceCard>
        </div>
      </div>
    );
  }

  function renderActiveTab() {
    switch (activeTab) {
      case "Hole Logic":
        return renderHoleLogicTab();
      case "Tee Sets":
        return renderTeeSetsTab();
      case "Pin Sets":
        return renderPinSetsTab();
      case "Surfaces":
        return renderSurfacesTab();
      case "Hazards & OB":
        return renderHazardsTab();
      case "Drop Zones":
        return renderDropZonesTab();
      case "Flyovers & Minimap":
        return renderFlyoversAndMinimapTab();
      case "Output Validation":
      default:
        return renderOutputValidationTab();
    }
  }

  return (
    <div className="mode-stack">
      <SurfaceCard padding={6} tone="raised">
        <SectionHeader
          eyebrow="Gameplay & Simulator Logic"
          title="Premium configuration center"
          description="Centralize gameplay-critical configuration before packaging and preview claim confidence."
          actions={<StatusPill label={`Completeness ${summary.completenessScore}%`} tone={toneForCompletenessPill(summary.completenessScore)} />}
        />
        <div className="wizard-success-grid">
          <MetricChip label="Tee Sets" value={summary.teeSetCount} note="Access coverage" />
          <MetricChip label="Pin Sets" value={summary.pinSetCount} note="Pin posture depth" />
          <MetricChip label="Minimap" value={`${summary.minimapCoveragePercent}%`} note="Ready metadata" tone={summary.minimapCoveragePercent === 100 ? "success" : "warning"} />
          <MetricChip label="Flyovers" value={`${summary.flyoverCoveragePercent}%`} note="Ready metadata" tone={summary.flyoverCoveragePercent === 100 ? "success" : "warning"} />
        </div>
        <div className="mode-tabs" role="tablist" aria-label="Gameplay logic tabs">
          {gameplayTabs.map((tab) => (
            <button
              key={tab}
              aria-selected={activeTab === tab}
              className={`mode-tab ${activeTab === tab ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab)}
              role="tab"
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>
      </SurfaceCard>

      <div className="gameplay-layout">
        <div className="gameplay-main">{renderActiveTab()}</div>
        <aside className="gameplay-sidebar">
          <Stack gap={6}>
            <SurfaceCard padding={6} tone="contrast" border="accent">
              <SectionHeader
                eyebrow="Completeness"
                title="Logic scoring"
                description="Use the score as a routing signal, not a vanity metric."
              />
              <div className="gameplay-segment-grid">
                {summary.segments.map((segment) => (
                  <MetricChip
                    key={segment.segmentId}
                    label={segment.label}
                    value={`${Math.round(segment.score * 100)}%`}
                    note={segment.detail}
                    tone={toneForSegment(segment.status)}
                  />
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard padding={6} tone="ghost">
              <SectionHeader
                eyebrow="Current Focus"
                title="What still blocks confidence"
                description="These are the simulator-facing items most likely to weaken release quality."
              />
              <div className="issue-card-list">
                {(gameplayIssues.length > 0 ? gameplayIssues : validationReport.issues.slice(0, 2)).map((issue) => (
                  <ValidationIssueCard key={issue.issueId} issue={issue} compact />
                ))}
              </div>
            </SurfaceCard>
          </Stack>
        </aside>
      </div>
    </div>
  );
}
