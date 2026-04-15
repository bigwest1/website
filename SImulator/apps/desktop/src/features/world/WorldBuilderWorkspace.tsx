import { useEffect, useMemo, useState } from "react";

import {
  createDistrictRecord,
  createEnvironmentZoneRecord,
  createLandmarkRecord,
  createSupportSpaceRecord,
  districtTypes,
  environmentZoneTypes,
  getDistrictWorldProfile,
  landmarkTypes,
  summarizeWorldSystem,
  supportSpaceTypes,
  visibilityPriorities,
  zoneDensities,
  type District,
  type EnvironmentZone,
  type Landmark,
  type SupportSpace
} from "@course-creator-os/world-system";
import {
  Button,
  EmptyStatePanel,
  Inline,
  MetricChip,
  SectionHeader,
  Stack,
  SurfaceCard,
  SelectField,
  TextAreaField,
  TextField
} from "@course-creator-os/ui";

import { updateWorldState, useProjectSession } from "../../app/project-session";
import { StatusPill } from "../../components/StatusPill";
import { ValidationIssueCard } from "../../components/ValidationIssueCard";

function humanize(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function splitListInput(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinListInput(values: string[]) {
  return values.join("\n");
}

export function WorldBuilderWorkspace() {
  const { project, validationReport } = useProjectSession();
  const [selectedDistrictId, setSelectedDistrictId] = useState(project.districts[0]?.districtId ?? "");
  const [selectedLandmarkId, setSelectedLandmarkId] = useState(project.landmarks[0]?.landmarkId ?? "");
  const [selectedSupportSpaceId, setSelectedSupportSpaceId] = useState(project.supportSpaces[0]?.supportSpaceId ?? "");
  const [selectedEnvironmentZoneId, setSelectedEnvironmentZoneId] = useState(
    project.environmentZones[0]?.environmentZoneId ?? "",
  );

  const worldIssues = validationReport.issues.filter((issue) => issue.ownerModule === "world");
  const worldSummary = summarizeWorldSystem(
    project.districts,
    project.landmarks,
    project.supportSpaces,
    project.environmentZones,
  );

  useEffect(() => {
    if (!project.districts.some((district) => district.districtId === selectedDistrictId)) {
      setSelectedDistrictId(project.districts[0]?.districtId ?? "");
    }
  }, [project.districts, selectedDistrictId]);

  useEffect(() => {
    if (!project.landmarks.some((landmark) => landmark.landmarkId === selectedLandmarkId)) {
      setSelectedLandmarkId(project.landmarks[0]?.landmarkId ?? "");
    }
  }, [project.landmarks, selectedLandmarkId]);

  useEffect(() => {
    if (!project.supportSpaces.some((supportSpace) => supportSpace.supportSpaceId === selectedSupportSpaceId)) {
      setSelectedSupportSpaceId(project.supportSpaces[0]?.supportSpaceId ?? "");
    }
  }, [project.supportSpaces, selectedSupportSpaceId]);

  useEffect(() => {
    if (
      !project.environmentZones.some(
        (environmentZone) => environmentZone.environmentZoneId === selectedEnvironmentZoneId,
      )
    ) {
      setSelectedEnvironmentZoneId(project.environmentZones[0]?.environmentZoneId ?? "");
    }
  }, [project.environmentZones, selectedEnvironmentZoneId]);

  const selectedDistrict = project.districts.find((district) => district.districtId === selectedDistrictId) ?? null;
  const selectedLandmark =
    project.landmarks.find((landmark) => landmark.landmarkId === selectedLandmarkId) ?? null;
  const selectedSupportSpace =
    project.supportSpaces.find((supportSpace) => supportSpace.supportSpaceId === selectedSupportSpaceId) ?? null;
  const selectedEnvironmentZone =
    project.environmentZones.find(
      (environmentZone) => environmentZone.environmentZoneId === selectedEnvironmentZoneId,
    ) ?? null;
  const districtProfile = selectedDistrict
    ? getDistrictWorldProfile(selectedDistrict.districtId, {
        districts: project.districts,
        landmarks: project.landmarks,
        supportSpaces: project.supportSpaces,
        environmentZones: project.environmentZones
      })
    : null;

  const linkedHoles = useMemo(() => {
    if (!districtProfile) {
      return [];
    }

    const holeLookup = new Map(project.holes.map((hole) => [hole.holeId, hole]));
    return districtProfile.linkedHoleRefs
      .map((holeId) => holeLookup.get(holeId))
      .filter((hole): hole is NonNullable<typeof hole> => Boolean(hole));
  }, [districtProfile, project.holes]);

  function updateDistrictRecord(
    districtId: string,
    updater: (district: District) => District,
  ) {
    updateWorldState((current) => ({
      ...current,
      districts: current.districts.map((district) =>
        district.districtId === districtId ? updater(district) : district,
      )
    }));
  }

  function updateLandmarkRecord(
    landmarkId: string,
    updater: (landmark: Landmark) => Landmark,
  ) {
    updateWorldState((current) => ({
      ...current,
      landmarks: current.landmarks.map((landmark) =>
        landmark.landmarkId === landmarkId ? updater(landmark) : landmark,
      )
    }));
  }

  function updateSupportSpaceRecord(
    supportSpaceId: string,
    updater: (supportSpace: SupportSpace) => SupportSpace,
  ) {
    updateWorldState((current) => ({
      ...current,
      supportSpaces: current.supportSpaces.map((supportSpace) =>
        supportSpace.supportSpaceId === supportSpaceId ? updater(supportSpace) : supportSpace,
      )
    }));
  }

  function updateEnvironmentZoneRecord(
    environmentZoneId: string,
    updater: (environmentZone: EnvironmentZone) => EnvironmentZone,
  ) {
    updateWorldState((current) => ({
      ...current,
      environmentZones: current.environmentZones.map((environmentZone) =>
        environmentZone.environmentZoneId === environmentZoneId
          ? updater(environmentZone)
          : environmentZone,
      )
    }));
  }

  function addDistrict() {
    const record = createDistrictRecord({
      name: `District ${project.districts.length + 1}`,
      districtType: "primary",
      theme: "Theme direction to be defined",
      visualRole: "World composition role still needs definition."
    });

    updateWorldState((current) => ({
      ...current,
      districts: [...current.districts, record]
    }));
    setSelectedDistrictId(record.districtId);
  }

  function addLandmark() {
    const districtRef = selectedDistrict?.districtId ?? project.districts[0]?.districtId;
    if (!districtRef) {
      return;
    }

    const record = createLandmarkRecord({
      name: `Landmark ${project.landmarks.length + 1}`,
      districtRef
    });

    updateWorldState((current) => ({
      ...current,
      landmarks: [...current.landmarks, record]
    }));
    setSelectedLandmarkId(record.landmarkId);
  }

  function addSupportSpace() {
    const districtRef = selectedDistrict?.districtId ?? project.districts[0]?.districtId;
    if (!districtRef) {
      return;
    }

    const record = createSupportSpaceRecord({
      name: `Support Space ${project.supportSpaces.length + 1}`,
      districtRef
    });

    updateWorldState((current) => ({
      ...current,
      supportSpaces: [...current.supportSpaces, record]
    }));
    setSelectedSupportSpaceId(record.supportSpaceId);
  }

  function addEnvironmentZone() {
    const districtRef = selectedDistrict?.districtId ?? project.districts[0]?.districtId;
    if (!districtRef) {
      return;
    }

    const record = createEnvironmentZoneRecord({
      name: `Environment Zone ${project.environmentZones.length + 1}`,
      districtRef
    });

    updateWorldState((current) => ({
      ...current,
      environmentZones: [...current.environmentZones, record]
    }));
    setSelectedEnvironmentZoneId(record.environmentZoneId);
  }

  return (
    <section className="panel world-builder-shell">
      <Stack gap={6}>
        <SurfaceCard padding={6}>
          <SectionHeader
            eyebrow="World Builder"
            title="Strategic world composition"
            description="Shape districts, support spaces, landmarks, and environmental zoning so the course reads like one intentional place."
            actions={
              <Inline gap={2}>
                <StatusPill label={`${project.districts.length} districts`} tone="info" />
                <StatusPill label={`${project.landmarks.length} landmarks`} />
              </Inline>
            }
          />
          <div className="world-builder-summary-grid">
            <MetricChip
              label="District Coverage"
              value={`${worldSummary.districtsWithLandmarks}/${worldSummary.districtCount}`}
              note="Districts with landmark anchors"
              tone={worldSummary.districtsWithLandmarks === worldSummary.districtCount ? "success" : "warning"}
            />
            <MetricChip
              label="Support Spaces"
              value={worldSummary.supportSpaceCount}
              note={`${worldSummary.playerFacingSupportSpaces} player-facing`}
              tone={worldSummary.supportSpaceCount > 0 ? "accent" : "warning"}
            />
            <MetricChip
              label="Environmental Zones"
              value={worldSummary.environmentZoneCount}
              note="Lighting, vegetation, material, or atmosphere layers"
              tone={worldSummary.environmentZoneCount > 0 ? "accent" : "warning"}
            />
            <MetricChip
              label="Linked Hole Coverage"
              value={`${worldSummary.linkedHoleCoveragePercent}%`}
              note="World entities tied back to hole planning"
              tone={worldSummary.linkedHoleCoveragePercent >= 60 ? "success" : "warning"}
            />
          </div>
        </SurfaceCard>

        <div className="world-builder-layout">
          <div className="world-builder-main">
            <SurfaceCard padding={6}>
              <SectionHeader
                eyebrow="District Composition"
                title="Lands and districts"
                description="Treat districts as strategic containers for visual rhythm, support logic, and landmark identity."
                actions={
                  <Button tone="primary" onClick={addDistrict}>
                    Add District
                  </Button>
                }
              />
              <div className="world-builder-district-grid">
                {project.districts.map((district) => {
                  const profile = getDistrictWorldProfile(district.districtId, {
                    districts: project.districts,
                    landmarks: project.landmarks,
                    supportSpaces: project.supportSpaces,
                    environmentZones: project.environmentZones
                  });

                  return (
                    <button
                      key={district.districtId}
                      className="world-builder-district-card"
                      data-active={selectedDistrict?.districtId === district.districtId}
                      onClick={() => setSelectedDistrictId(district.districtId)}
                      type="button"
                    >
                      <div className="world-builder-district-head">
                        <strong>{district.name}</strong>
                        <StatusPill
                          label={`${profile?.readinessScore ?? 0}%`}
                          tone={(profile?.readinessScore ?? 0) >= 75 ? "success" : "warning"}
                        />
                      </div>
                      <span>{district.theme}</span>
                      <p>{district.visualRole}</p>
                    </button>
                  );
                })}
              </div>

              {selectedDistrict ? (
                <div className="world-builder-form-grid">
                  <TextField
                    label="District Name"
                    value={selectedDistrict.name}
                    onChange={(event) =>
                      updateDistrictRecord(selectedDistrict.districtId, (district) => ({
                        ...district,
                        name: event.target.value
                      }))
                    }
                  />
                  <SelectField
                    label="District Type"
                    options={districtTypes.map((value) => ({ label: humanize(value), value }))}
                    value={selectedDistrict.districtType}
                    onChange={(event) =>
                      updateDistrictRecord(selectedDistrict.districtId, (district) => ({
                        ...district,
                        districtType: event.target.value as District["districtType"]
                      }))
                    }
                  />
                  <TextField
                    label="Theme Direction"
                    value={selectedDistrict.theme}
                    onChange={(event) =>
                      updateDistrictRecord(selectedDistrict.districtId, (district) => ({
                        ...district,
                        theme: event.target.value
                      }))
                    }
                  />
                  <TextField
                    label="Mood"
                    value={selectedDistrict.mood ?? ""}
                    onChange={(event) =>
                      updateDistrictRecord(selectedDistrict.districtId, (district) => ({
                        ...district,
                        mood: event.target.value || undefined
                      }))
                    }
                  />
                  <TextAreaField
                    label="Visual Role"
                    rows={4}
                    value={selectedDistrict.visualRole}
                    onChange={(event) =>
                      updateDistrictRecord(selectedDistrict.districtId, (district) => ({
                        ...district,
                        visualRole: event.target.value
                      }))
                    }
                  />
                  <TextAreaField
                    label="Support Realism Notes"
                    hint="One note per line."
                    rows={4}
                    value={joinListInput(selectedDistrict.supportRealismNotes)}
                    onChange={(event) =>
                      updateDistrictRecord(selectedDistrict.districtId, (district) => ({
                        ...district,
                        supportRealismNotes: splitListInput(event.target.value)
                      }))
                    }
                  />
                  <TextAreaField
                    label="District Notes"
                    rows={4}
                    value={selectedDistrict.notes ?? ""}
                    onChange={(event) =>
                      updateDistrictRecord(selectedDistrict.districtId, (district) => ({
                        ...district,
                        notes: event.target.value || undefined
                      }))
                    }
                  />
                </div>
              ) : null}
            </SurfaceCard>

            <SurfaceCard padding={6}>
              <SectionHeader
                eyebrow="World Identity Overlays"
                title="Creative overlays tied back to planning"
                description="The world layer should inherit creative truth from the Course Bible and practical shot logic from the Hole Planner."
              />
              <div className="world-builder-overlay-grid">
                <article className="world-builder-overlay-card">
                  <span>Setting Summary</span>
                  <strong>{project.courseBible.worldIdentity.settingSummary}</strong>
                  <p>{project.courseBible.courseIdentity}</p>
                </article>
                <article className="world-builder-overlay-card">
                  <span>Style Grammar</span>
                  <strong>{project.courseBible.styleGrammar.join(" · ")}</strong>
                  <p>{project.courseBible.materialLanguage.join(" · ")}</p>
                </article>
                <article className="world-builder-overlay-card">
                  <span>Pacing Arc</span>
                  <strong>{project.courseBible.pacingAndEmotionalArc.emotionalArcSummary}</strong>
                  <p>
                    Open: {project.courseBible.pacingAndEmotionalArc.openingBeat}
                    <br />
                    Close: {project.courseBible.pacingAndEmotionalArc.closingBeat}
                  </p>
                </article>
                <article className="world-builder-overlay-card">
                  <span>Hole Planner Link</span>
                  <strong>{linkedHoles.length} holes tied to the active district</strong>
                  <p>
                    {linkedHoles.length > 0
                      ? linkedHoles
                          .slice(0, 4)
                          .map((hole) => `Hole ${hole.number}`)
                          .join(" · ")
                      : "Link landmarks, support spaces, or zones to holes for stronger routing context."}
                  </p>
                </article>
              </div>
            </SurfaceCard>
          </div>

          <aside className="world-builder-sidebar">
            <SurfaceCard padding={6}>
              <SectionHeader
                eyebrow="Landmark Registry"
                title="Focal anchors"
                description="Landmarks should orient the player and sharpen the visual identity of each district."
                actions={
                  <Button tone="secondary" onClick={addLandmark}>
                    Add Landmark
                  </Button>
                }
              />
              <div className="world-builder-entity-list">
                {project.landmarks.map((landmark) => (
                  <button
                    key={landmark.landmarkId}
                    className="world-builder-entity-row"
                    data-active={selectedLandmark?.landmarkId === landmark.landmarkId}
                    onClick={() => setSelectedLandmarkId(landmark.landmarkId)}
                    type="button"
                  >
                    <div>
                      <strong>{landmark.name}</strong>
                      <span>{humanize(landmark.landmarkType)}</span>
                    </div>
                    <StatusPill label={humanize(landmark.visibilityPriority)} />
                  </button>
                ))}
              </div>

              {selectedLandmark ? (
                <div className="world-builder-form-grid world-builder-form-grid-compact">
                  <TextField
                    label="Landmark Name"
                    value={selectedLandmark.name}
                    onChange={(event) =>
                      updateLandmarkRecord(selectedLandmark.landmarkId, (landmark) => ({
                        ...landmark,
                        name: event.target.value
                      }))
                    }
                  />
                  <SelectField
                    label="District"
                    options={project.districts.map((district) => ({ label: district.name, value: district.districtId }))}
                    value={selectedLandmark.districtRef}
                    onChange={(event) =>
                      updateLandmarkRecord(selectedLandmark.landmarkId, (landmark) => ({
                        ...landmark,
                        districtRef: event.target.value
                      }))
                    }
                  />
                  <SelectField
                    label="Landmark Type"
                    options={landmarkTypes.map((value) => ({ label: humanize(value), value }))}
                    value={selectedLandmark.landmarkType}
                    onChange={(event) =>
                      updateLandmarkRecord(selectedLandmark.landmarkId, (landmark) => ({
                        ...landmark,
                        landmarkType: event.target.value as Landmark["landmarkType"]
                      }))
                    }
                  />
                  <SelectField
                    label="Visibility Priority"
                    options={visibilityPriorities.map((value) => ({ label: humanize(value), value }))}
                    value={selectedLandmark.visibilityPriority}
                    onChange={(event) =>
                      updateLandmarkRecord(selectedLandmark.landmarkId, (landmark) => ({
                        ...landmark,
                        visibilityPriority: event.target.value as Landmark["visibilityPriority"]
                      }))
                    }
                  />
                  <TextAreaField
                    label="Visibility Role"
                    rows={3}
                    value={selectedLandmark.visibilityRole}
                    onChange={(event) =>
                      updateLandmarkRecord(selectedLandmark.landmarkId, (landmark) => ({
                        ...landmark,
                        visibilityRole: event.target.value
                      }))
                    }
                  />
                  <TextAreaField
                    label="Linked Holes"
                    hint="One hole ref per line."
                    rows={3}
                    value={joinListInput(selectedLandmark.linkedHoleRefs)}
                    onChange={(event) =>
                      updateLandmarkRecord(selectedLandmark.landmarkId, (landmark) => ({
                        ...landmark,
                        linkedHoleRefs: splitListInput(event.target.value)
                      }))
                    }
                  />
                </div>
              ) : (
                <EmptyStatePanel
                  eyebrow="Landmarks"
                  title="No landmark selected"
                  description="Add or select a landmark to control district anchoring and orientation logic."
                />
              )}
            </SurfaceCard>

            <SurfaceCard padding={6}>
              <SectionHeader
                eyebrow="Support-Space Planning"
                title="Believability layer"
                description="Plan the spaces that make the world feel operationally real, not just visually busy."
                actions={
                  <Button tone="secondary" onClick={addSupportSpace}>
                    Add Support Space
                  </Button>
                }
              />
              <div className="world-builder-entity-list">
                {project.supportSpaces.map((supportSpace) => (
                  <button
                    key={supportSpace.supportSpaceId}
                    className="world-builder-entity-row"
                    data-active={selectedSupportSpace?.supportSpaceId === supportSpace.supportSpaceId}
                    onClick={() => setSelectedSupportSpaceId(supportSpace.supportSpaceId)}
                    type="button"
                  >
                    <div>
                      <strong>{supportSpace.name}</strong>
                      <span>{humanize(supportSpace.spaceType)}</span>
                    </div>
                    <StatusPill label={supportSpace.playerFacing ? "Player-Facing" : "Backstage"} />
                  </button>
                ))}
              </div>

              {selectedSupportSpace ? (
                <div className="world-builder-form-grid world-builder-form-grid-compact">
                  <TextField
                    label="Support Space Name"
                    value={selectedSupportSpace.name}
                    onChange={(event) =>
                      updateSupportSpaceRecord(selectedSupportSpace.supportSpaceId, (supportSpace) => ({
                        ...supportSpace,
                        name: event.target.value
                      }))
                    }
                  />
                  <SelectField
                    label="District"
                    options={project.districts.map((district) => ({ label: district.name, value: district.districtId }))}
                    value={selectedSupportSpace.districtRef}
                    onChange={(event) =>
                      updateSupportSpaceRecord(selectedSupportSpace.supportSpaceId, (supportSpace) => ({
                        ...supportSpace,
                        districtRef: event.target.value
                      }))
                    }
                  />
                  <SelectField
                    label="Space Type"
                    options={supportSpaceTypes.map((value) => ({ label: humanize(value), value }))}
                    value={selectedSupportSpace.spaceType}
                    onChange={(event) =>
                      updateSupportSpaceRecord(selectedSupportSpace.supportSpaceId, (supportSpace) => ({
                        ...supportSpace,
                        spaceType: event.target.value as SupportSpace["spaceType"]
                      }))
                    }
                  />
                  <SelectField
                    label="Visibility"
                    options={[
                      { label: "Player-Facing", value: "true" },
                      { label: "Backstage", value: "false" }
                    ]}
                    value={String(selectedSupportSpace.playerFacing)}
                    onChange={(event) =>
                      updateSupportSpaceRecord(selectedSupportSpace.supportSpaceId, (supportSpace) => ({
                        ...supportSpace,
                        playerFacing: event.target.value === "true"
                      }))
                    }
                  />
                  <TextAreaField
                    label="Role Summary"
                    rows={3}
                    value={selectedSupportSpace.roleSummary}
                    onChange={(event) =>
                      updateSupportSpaceRecord(selectedSupportSpace.supportSpaceId, (supportSpace) => ({
                        ...supportSpace,
                        roleSummary: event.target.value
                      }))
                    }
                  />
                  <TextAreaField
                    label="Linked Holes"
                    hint="One hole ref per line."
                    rows={3}
                    value={joinListInput(selectedSupportSpace.linkedHoleRefs)}
                    onChange={(event) =>
                      updateSupportSpaceRecord(selectedSupportSpace.supportSpaceId, (supportSpace) => ({
                        ...supportSpace,
                        linkedHoleRefs: splitListInput(event.target.value)
                      }))
                    }
                  />
                </div>
              ) : null}
            </SurfaceCard>

            <SurfaceCard padding={6}>
              <SectionHeader
                eyebrow="Environmental Zoning"
                title="Atmosphere and composition layers"
                description="Use zones to keep planting, materials, light, and atmosphere consistent across the route."
                actions={
                  <Button tone="secondary" onClick={addEnvironmentZone}>
                    Add Zone
                  </Button>
                }
              />
              <div className="world-builder-entity-list">
                {project.environmentZones.map((environmentZone) => (
                  <button
                    key={environmentZone.environmentZoneId}
                    className="world-builder-entity-row"
                    data-active={
                      selectedEnvironmentZone?.environmentZoneId === environmentZone.environmentZoneId
                    }
                    onClick={() => setSelectedEnvironmentZoneId(environmentZone.environmentZoneId)}
                    type="button"
                  >
                    <div>
                      <strong>{environmentZone.name}</strong>
                      <span>{humanize(environmentZone.zoneType)}</span>
                    </div>
                    <StatusPill label={humanize(environmentZone.density)} />
                  </button>
                ))}
              </div>

              {selectedEnvironmentZone ? (
                <div className="world-builder-form-grid world-builder-form-grid-compact">
                  <TextField
                    label="Zone Name"
                    value={selectedEnvironmentZone.name}
                    onChange={(event) =>
                      updateEnvironmentZoneRecord(selectedEnvironmentZone.environmentZoneId, (environmentZone) => ({
                        ...environmentZone,
                        name: event.target.value
                      }))
                    }
                  />
                  <SelectField
                    label="District"
                    options={project.districts.map((district) => ({ label: district.name, value: district.districtId }))}
                    value={selectedEnvironmentZone.districtRef}
                    onChange={(event) =>
                      updateEnvironmentZoneRecord(selectedEnvironmentZone.environmentZoneId, (environmentZone) => ({
                        ...environmentZone,
                        districtRef: event.target.value
                      }))
                    }
                  />
                  <SelectField
                    label="Zone Type"
                    options={environmentZoneTypes.map((value) => ({ label: humanize(value), value }))}
                    value={selectedEnvironmentZone.zoneType}
                    onChange={(event) =>
                      updateEnvironmentZoneRecord(selectedEnvironmentZone.environmentZoneId, (environmentZone) => ({
                        ...environmentZone,
                        zoneType: event.target.value as EnvironmentZone["zoneType"]
                      }))
                    }
                  />
                  <SelectField
                    label="Density"
                    options={zoneDensities.map((value) => ({ label: humanize(value), value }))}
                    value={selectedEnvironmentZone.density}
                    onChange={(event) =>
                      updateEnvironmentZoneRecord(selectedEnvironmentZone.environmentZoneId, (environmentZone) => ({
                        ...environmentZone,
                        density: event.target.value as EnvironmentZone["density"]
                      }))
                    }
                  />
                  <TextAreaField
                    label="Treatment Summary"
                    rows={3}
                    value={selectedEnvironmentZone.treatmentSummary}
                    onChange={(event) =>
                      updateEnvironmentZoneRecord(selectedEnvironmentZone.environmentZoneId, (environmentZone) => ({
                        ...environmentZone,
                        treatmentSummary: event.target.value
                      }))
                    }
                  />
                  <TextAreaField
                    label="Dominant Palette"
                    hint="One palette cue per line."
                    rows={3}
                    value={joinListInput(selectedEnvironmentZone.dominantPalette)}
                    onChange={(event) =>
                      updateEnvironmentZoneRecord(selectedEnvironmentZone.environmentZoneId, (environmentZone) => ({
                        ...environmentZone,
                        dominantPalette: splitListInput(event.target.value)
                      }))
                    }
                  />
                </div>
              ) : null}
            </SurfaceCard>

            <SurfaceCard padding={6}>
              <SectionHeader
                eyebrow="World Issues"
                title="Fix paths"
                description="These issues protect coherence before Preview and Packaging depend on the world layer."
              />
              <div className="issue-card-list">
                {worldIssues.length > 0 ? (
                  worldIssues.map((issue) => <ValidationIssueCard key={issue.issueId} issue={issue} compact />)
                ) : (
                  <p className="body-copy muted-copy">No world-specific validation issues are currently open.</p>
                )}
              </div>
            </SurfaceCard>
          </aside>
        </div>
      </Stack>
    </section>
  );
}
