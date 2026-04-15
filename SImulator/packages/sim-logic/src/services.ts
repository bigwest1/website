import type { Hole } from "@course-creator-os/hole-planner";
import type { PreviewPath } from "@course-creator-os/preview";
import type { SceneAuthoringState } from "@course-creator-os/scene-authoring";

import {
  createDropZoneSpatialBindings,
  createFlyoverMetadata,
  createHazardSpatialBindings,
  createHolePlayProfiles,
  createMinimapMetadata,
  createOutOfBoundsSpatialBindings,
  createPinSpatialBindings,
  createPreviewAnchorBindings,
  createTeeSpatialBindings
} from "./create";
import {
  simulatorLogicConfigSchema,
  type DropZone,
  type HazardProfile,
  type PinSet,
  type SimulatorLogicConfig,
  type SurfaceProfile,
  type TeeSet
} from "./models";

type SyncSimulatorLogicConfigInput = {
  holes: Hole[];
  teeSets: TeeSet[];
  pinSets: PinSet[];
  surfaceProfiles: SurfaceProfile[];
  hazardProfiles: HazardProfile[];
  dropZones: DropZone[];
  previewPaths?: PreviewPath[];
  sceneAuthoring?: SceneAuthoringState;
  currentConfig: SimulatorLogicConfig;
};

function mergeHolePlayProfiles(
  holes: Hole[],
  surfaceProfiles: SurfaceProfile[],
  sceneAuthoring: SceneAuthoringState | undefined,
  existingProfiles: SimulatorLogicConfig["holePlayProfiles"],
) {
  const draftProfiles = createHolePlayProfiles(holes, surfaceProfiles, sceneAuthoring);

  return draftProfiles.map((draftProfile) => {
    const existingProfile = existingProfiles.find((profile) => profile.holeId === draftProfile.holeId);

    if (!existingProfile) {
      return draftProfile;
    }

    return {
      ...existingProfile,
      holeNumber: draftProfile.holeNumber,
      par: draftProfile.par,
      targetYardage: draftProfile.targetYardage,
      teeSetRefs: draftProfile.teeSetRefs,
      pinSetRefs: draftProfile.pinSetRefs,
      hazardRefs: draftProfile.hazardRefs,
      surfaceAssignments:
        existingProfile.surfaceAssignments ?? draftProfile.surfaceAssignments,
      playRouteEnvelopeRef: existingProfile.playRouteEnvelopeRef ?? draftProfile.playRouteEnvelopeRef,
      fairwayCorridorRef: existingProfile.fairwayCorridorRef ?? draftProfile.fairwayCorridorRef,
      greenZoneRef: existingProfile.greenZoneRef ?? draftProfile.greenZoneRef,
      visibilityCorridorRef: existingProfile.visibilityCorridorRef ?? draftProfile.visibilityCorridorRef,
      lineOfPlayStatus:
        existingProfile.lineOfPlayStatus === "blocked" && draftProfile.lineOfPlayStatus !== "blocked"
          ? draftProfile.lineOfPlayStatus
          : existingProfile.lineOfPlayStatus,
      shotReadabilityStatus:
        existingProfile.shotReadabilityStatus === "blocked" && draftProfile.shotReadabilityStatus !== "blocked"
          ? draftProfile.shotReadabilityStatus
          : existingProfile.shotReadabilityStatus
    };
  });
}

function mergeById<T extends Record<string, unknown>>(
  existingItems: T[],
  draftItems: T[],
  idKey: keyof T,
) {
  return draftItems.map((draftItem) => {
    const existingItem = existingItems.find((item) => item[idKey] === draftItem[idKey]);
    return existingItem ? { ...draftItem, ...existingItem } : draftItem;
  });
}

function mergeMinimapMetadata(
  holes: Hole[],
  previewPaths: PreviewPath[],
  sceneAuthoring: SceneAuthoringState | undefined,
  existingMetadata: SimulatorLogicConfig["minimapMetadata"],
) {
  const draftMetadata = createMinimapMetadata(holes, previewPaths, sceneAuthoring);

  return draftMetadata.map((draftEntry) => {
    const existingEntry = existingMetadata.find((entry) => entry.holeId === draftEntry.holeId);

    return existingEntry
      ? {
          ...draftEntry,
          ...existingEntry,
          previewPathRef: existingEntry.previewPathRef ?? draftEntry.previewPathRef,
          frameAnchorRef: existingEntry.frameAnchorRef ?? draftEntry.frameAnchorRef,
          northReferenceAnchorRef:
            existingEntry.northReferenceAnchorRef ?? draftEntry.northReferenceAnchorRef
        }
      : draftEntry;
  });
}

function mergeFlyoverMetadata(
  holes: Hole[],
  previewPaths: PreviewPath[],
  sceneAuthoring: SceneAuthoringState | undefined,
  existingMetadata: SimulatorLogicConfig["flyoverMetadata"],
) {
  const draftMetadata = createFlyoverMetadata(holes, previewPaths, sceneAuthoring);

  return draftMetadata.map((draftEntry) => {
    const existingEntry = existingMetadata.find((entry) => entry.holeId === draftEntry.holeId);

    return existingEntry
      ? {
          ...draftEntry,
          ...existingEntry,
          previewPathRef: existingEntry.previewPathRef ?? draftEntry.previewPathRef,
          startAnchorRef: existingEntry.startAnchorRef ?? draftEntry.startAnchorRef,
          apexAnchorRef: existingEntry.apexAnchorRef ?? draftEntry.apexAnchorRef,
          endAnchorRef: existingEntry.endAnchorRef ?? draftEntry.endAnchorRef
        }
      : draftEntry;
  });
}

function calculateCoverage(
  items: Array<{ state: SimulatorLogicConfig["minimapMetadata"][number]["overlayState"] | SimulatorLogicConfig["flyoverMetadata"][number]["readinessState"] }>,
) {
  return items.length === 0 ? 0 : items.filter((item) => item.state === "ready").length / items.length;
}

export function synchronizeSimulatorLogicConfig({
  holes,
  teeSets,
  pinSets,
  surfaceProfiles,
  hazardProfiles,
  dropZones,
  previewPaths = [],
  sceneAuthoring,
  currentConfig
}: SyncSimulatorLogicConfigInput): SimulatorLogicConfig {
  const holePlayProfiles = mergeHolePlayProfiles(
    holes,
    surfaceProfiles,
    sceneAuthoring,
    currentConfig.holePlayProfiles,
  );
  const teeSpatialBindings = mergeById(
    currentConfig.teeSpatialBindings,
    createTeeSpatialBindings(holes, teeSets, sceneAuthoring),
    "teeSpatialBindingId",
  );
  const pinSpatialBindings = mergeById(
    currentConfig.pinSpatialBindings,
    createPinSpatialBindings(holes, pinSets, sceneAuthoring),
    "pinSpatialBindingId",
  );
  const hazardSpatialBindings = mergeById(
    currentConfig.hazardSpatialBindings,
    createHazardSpatialBindings(hazardProfiles, sceneAuthoring),
    "hazardSpatialBindingId",
  );
  const outOfBoundsSpatialBindings = mergeById(
    currentConfig.outOfBoundsSpatialBindings,
    createOutOfBoundsSpatialBindings(holes, sceneAuthoring),
    "outOfBoundsSpatialBindingId",
  );
  const dropZoneSpatialBindings = mergeById(
    currentConfig.dropZoneSpatialBindings,
    createDropZoneSpatialBindings(dropZones, sceneAuthoring),
    "dropZoneSpatialBindingId",
  );
  const previewAnchorBindings = mergeById(
    currentConfig.previewAnchorBindings,
    createPreviewAnchorBindings(holes, sceneAuthoring),
    "previewAnchorBindingId",
  );
  const minimapMetadata = mergeMinimapMetadata(
    holes,
    previewPaths,
    sceneAuthoring,
    currentConfig.minimapMetadata,
  );
  const flyoverMetadata = mergeFlyoverMetadata(
    holes,
    previewPaths,
    sceneAuthoring,
    currentConfig.flyoverMetadata,
  );

  return simulatorLogicConfigSchema.parse({
    ...currentConfig,
    holeSequence: holes.map((hole) => hole.holeId),
    teeSets,
    pinSets,
    surfaceProfiles,
    hazardProfiles,
    dropZones,
    holePlayProfiles,
    teeSpatialBindings,
    pinSpatialBindings,
    hazardSpatialBindings,
    outOfBoundsSpatialBindings,
    dropZoneSpatialBindings,
    previewAnchorBindings,
    minimapMetadata,
    flyoverMetadata,
    minimapCoverage: calculateCoverage(minimapMetadata.map((entry) => ({ state: entry.overlayState }))),
    flyoverCoverage: calculateCoverage(flyoverMetadata.map((entry) => ({ state: entry.readinessState })))
  });
}
