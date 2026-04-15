import type { Hole } from "@course-creator-os/hole-planner";
import type { PreviewPath } from "@course-creator-os/preview";
import type { SceneAuthoringState } from "@course-creator-os/scene-authoring";
import { createSceneSpatialReference } from "@course-creator-os/scene-authoring";

import {
  flyoverMetadataSchema,
  holePlayProfileSchema,
  minimapMetadataSchema,
  simulatorLogicConfigSchema,
  type DropZone,
  type DropZoneSpatialBinding,
  dropZoneSpatialBindingSchema,
  type FlyoverMetadata,
  type HazardProfile,
  type HazardSpatialBinding,
  hazardSpatialBindingSchema,
  type HolePlayProfile,
  type MinimapMetadata,
  type OutOfBoundsSpatialBinding,
  outOfBoundsSpatialBindingSchema,
  type PinSet,
  type PinSpatialBinding,
  pinSpatialBindingSchema,
  type PreviewAnchorBinding,
  previewAnchorBindingSchema,
  type PreviewInputState,
  type SimulatorLogicConfig,
  type SurfaceProfile,
  type TeeSet,
  type TeeSpatialBinding,
  teeSpatialBindingSchema
} from "./models";

type CreateSimulatorLogicConfigInput = {
  holes: Hole[];
  teeSets: TeeSet[];
  pinSets: PinSet[];
  surfaceProfiles: SurfaceProfile[];
  hazardProfiles: HazardProfile[];
  dropZones: DropZone[];
  previewPaths?: PreviewPath[];
  sceneAuthoring?: SceneAuthoringState;
  outOfBoundsConfigured?: boolean;
  exportProfileNotes?: string[];
};

function findSurfaceId(surfaceProfiles: SurfaceProfile[], type: SurfaceProfile["type"]) {
  return surfaceProfiles.find((surface) => surface.type === type)?.surfaceId ?? null;
}

function findPreviewPathRef(
  previewPaths: PreviewPath[],
  holeId: string,
  previewType: PreviewPath["previewType"],
) {
  return (
    previewPaths.find(
      (previewPath) =>
        previewPath.previewType === previewType && previewPath.holeRefs.includes(holeId),
    ) ?? null
  );
}

function previewStateForPath(path: PreviewPath | null): PreviewInputState {
  if (!path) {
    return "missing";
  }

  return path.readinessState === "approved" ? "ready" : path.readinessState;
}

function findTeeZones(sceneAuthoring: SceneAuthoringState | undefined, holeId: string, teeSetId: string) {
  if (!sceneAuthoring) {
    return [];
  }

  return sceneAuthoring.teeZones.filter(
    (teeZone) => teeZone.holeId === holeId && teeZone.teeSetRefs.includes(teeSetId),
  );
}

function findGreenZone(sceneAuthoring: SceneAuthoringState | undefined, holeId: string) {
  return sceneAuthoring?.greenZones.find((greenZone) => greenZone.holeId === holeId) ?? null;
}

function findFairwayCorridor(sceneAuthoring: SceneAuthoringState | undefined, holeId: string) {
  return sceneAuthoring?.fairwayCorridors.find((corridor) => corridor.holeId === holeId) ?? null;
}

function findVisibilityCorridor(sceneAuthoring: SceneAuthoringState | undefined, holeId: string) {
  return sceneAuthoring?.visibilityCorridors.find((corridor) => corridor.holeId === holeId) ?? null;
}

function findPlayRouteEnvelope(sceneAuthoring: SceneAuthoringState | undefined, holeId: string) {
  return sceneAuthoring?.playRouteEnvelopes.find((envelope) => envelope.holeId === holeId) ?? null;
}

function findGameplaySceneObject(sceneAuthoring: SceneAuthoringState | undefined, holeId: string) {
  return (
    sceneAuthoring?.sceneObjects.find(
      (sceneObject) =>
        sceneObject.category === "gameplay-course-object" &&
        sceneObject.binding?.entityId === holeId,
    ) ?? null
  );
}

function findPreviewNode(sceneAuthoring: SceneAuthoringState | undefined, holeId: string) {
  return (
    sceneAuthoring?.routingNodes.find(
      (routingNode) => routingNode.holeId === holeId && routingNode.kind === "preview-anchor",
    ) ?? null
  );
}

function findHazardZone(sceneAuthoring: SceneAuthoringState | undefined, hazardId: string, holeId: string) {
  return (
    sceneAuthoring?.hazardZones.find(
      (hazardZone) => hazardZone.holeId === holeId && hazardZone.linkedHazardIds.includes(hazardId),
    ) ?? null
  );
}

function findOutOfBoundsZones(sceneAuthoring: SceneAuthoringState | undefined, holeId: string) {
  return sceneAuthoring?.outOfBoundsZones.filter((zone) => zone.holeId === holeId) ?? [];
}

function findDropZoneArea(sceneAuthoring: SceneAuthoringState | undefined, dropZoneId: string, holeId: string) {
  return (
    sceneAuthoring?.dropZoneAreas.find(
      (dropZoneArea) =>
        dropZoneArea.holeId === holeId && dropZoneArea.linkedDropZoneIds.includes(dropZoneId),
    ) ?? null
  );
}

function createHoleSpatialStatus({
  fairwayCorridorExists,
  greenZoneExists,
  visibilityCorridorBlocked,
  routeConnected
}: {
  fairwayCorridorExists: boolean;
  greenZoneExists: boolean;
  visibilityCorridorBlocked: boolean;
  routeConnected: boolean;
}) {
  if (!routeConnected || !fairwayCorridorExists || !greenZoneExists) {
    return {
      lineOfPlayStatus: "blocked" as const,
      shotReadabilityStatus: "blocked" as const,
      exportReadiness: "blocked" as const
    };
  }

  if (visibilityCorridorBlocked) {
    return {
      lineOfPlayStatus: "watch" as const,
      shotReadabilityStatus: "watch" as const,
      exportReadiness: "draft" as const
    };
  }

  return {
    lineOfPlayStatus: "clear" as const,
    shotReadabilityStatus: "clear" as const,
    exportReadiness: "draft" as const
  };
}

export function createHolePlayProfiles(
  holes: Hole[],
  surfaceProfiles: SurfaceProfile[],
  sceneAuthoring?: SceneAuthoringState,
): HolePlayProfile[] {
  const fairwaySurfaceId = findSurfaceId(surfaceProfiles, "fairway") ?? "surface-fairway";
  const greenSurfaceId = findSurfaceId(surfaceProfiles, "green") ?? "surface-green";
  const roughSurfaceId = findSurfaceId(surfaceProfiles, "rough");
  const bunkerSurfaceId = findSurfaceId(surfaceProfiles, "bunker");
  const waterSurfaceId = findSurfaceId(surfaceProfiles, "water");

  return holes.map((hole) => {
    const fairwayCorridor = findFairwayCorridor(sceneAuthoring, hole.holeId);
    const greenZone = findGreenZone(sceneAuthoring, hole.holeId);
    const visibilityCorridor = findVisibilityCorridor(sceneAuthoring, hole.holeId);
    const playRouteEnvelope = findPlayRouteEnvelope(sceneAuthoring, hole.holeId);
    const routingPath = sceneAuthoring?.routingPaths.find((path) => path.holeId === hole.holeId) ?? null;
    const status = createHoleSpatialStatus({
      fairwayCorridorExists: fairwayCorridor !== null,
      greenZoneExists: greenZone !== null,
      visibilityCorridorBlocked: (visibilityCorridor?.blockedSceneObjectIds.length ?? 0) > 0,
      routeConnected: routingPath?.routeStatus === "connected"
    });

    return holePlayProfileSchema.parse({
      holeId: hole.holeId,
      holeNumber: hole.number,
      par: hole.par,
      targetYardage: hole.targetYardage,
      teeSetRefs: hole.teeSetRefs,
      pinSetRefs: hole.pinSetRefs,
      surfaceAssignments: {
        fairwaySurfaceId,
        greenSurfaceId,
        roughSurfaceId,
        bunkerSurfaceId,
        waterSurfaceId
      },
      hazardRefs: hole.hazardRefs,
      outOfBounds: false,
      playRouteEnvelopeRef: playRouteEnvelope
        ? createSceneSpatialReference({
            entityType: "play-route-envelope",
            entityId: playRouteEnvelope.playRouteEnvelopeId,
            holeId: hole.holeId,
            note: "Primary playable envelope."
          })
        : null,
      fairwayCorridorRef: fairwayCorridor
        ? createSceneSpatialReference({
            entityType: "fairway-corridor",
            entityId: fairwayCorridor.fairwayCorridorId,
            holeId: hole.holeId,
            note: "Primary fairway corridor."
          })
        : null,
      greenZoneRef: greenZone
        ? createSceneSpatialReference({
            entityType: "green-zone",
            entityId: greenZone.greenZoneId,
            holeId: hole.holeId,
            note: "Primary green target."
          })
        : null,
      visibilityCorridorRef: visibilityCorridor
        ? createSceneSpatialReference({
            entityType: "visibility-corridor",
            entityId: visibilityCorridor.visibilityCorridorId,
            holeId: hole.holeId,
            note: "Primary readability corridor."
          })
        : null,
      lineOfPlayStatus: status.lineOfPlayStatus,
      shotReadabilityStatus: status.shotReadabilityStatus,
      exportReadiness: status.exportReadiness,
      logicNote: `Confirm simulator logic intent for Hole ${hole.number}.`
    });
  });
}

export function createTeeSpatialBindings(
  holes: Hole[],
  teeSets: TeeSet[],
  sceneAuthoring?: SceneAuthoringState,
): TeeSpatialBinding[] {
  return holes.flatMap((hole) =>
    teeSets
      .filter((teeSet) => hole.teeSetRefs.includes(teeSet.teeSetId))
      .map((teeSet) => {
        const teeZone = findTeeZones(sceneAuthoring, hole.holeId, teeSet.teeSetId)[0] ?? null;
        const sceneObject = findGameplaySceneObject(sceneAuthoring, hole.holeId);

        return teeSpatialBindingSchema.parse({
          teeSpatialBindingId: `tee-binding-${hole.holeId}-${teeSet.teeSetId}`,
          holeId: hole.holeId,
          teeSetId: teeSet.teeSetId,
          teeZoneRef: teeZone
            ? createSceneSpatialReference({
                entityType: "tee-zone",
                entityId: teeZone.teeZoneId,
                holeId: hole.holeId,
                note: `Tee area for ${teeSet.name}.`
              })
            : null,
          sceneObjectRef: sceneObject
            ? createSceneSpatialReference({
                entityType: "scene-object",
                entityId: sceneObject.sceneObjectId,
                holeId: hole.holeId,
                note: "Gameplay tee anchor."
              })
            : null,
          positionHint: sceneObject?.transform.position ?? null,
          facingDirectionDegrees: teeZone?.facingDirectionDegrees ?? null,
          readinessState: teeZone && sceneObject ? "ready" : teeZone || sceneObject ? "draft" : "missing",
          note: `Spatial tee binding for Hole ${hole.number}.`
        });
      }),
  );
}

export function createPinSpatialBindings(
  holes: Hole[],
  pinSets: PinSet[],
  sceneAuthoring?: SceneAuthoringState,
): PinSpatialBinding[] {
  return holes.flatMap((hole) =>
    pinSets
      .filter((pinSet) => pinSet.enabledHoleIds.includes(hole.holeId))
      .map((pinSet) => {
        const greenZone = findGreenZone(sceneAuthoring, hole.holeId);
        const previewNode = findPreviewNode(sceneAuthoring, hole.holeId);

        return pinSpatialBindingSchema.parse({
          pinSpatialBindingId: `pin-binding-${hole.holeId}-${pinSet.pinSetId}`,
          holeId: hole.holeId,
          pinSetId: pinSet.pinSetId,
          greenZoneRef: greenZone
            ? createSceneSpatialReference({
                entityType: "green-zone",
                entityId: greenZone.greenZoneId,
                holeId: hole.holeId,
                note: `Green target for ${pinSet.name}.`
              })
            : null,
          sceneObjectRef: previewNode
            ? createSceneSpatialReference({
                entityType: "routing-node",
                entityId: previewNode.routingNodeId,
                holeId: hole.holeId,
                note: "Preview-aligned pin framing anchor."
              })
            : null,
          positionHint: previewNode?.position ?? null,
          readinessState: greenZone ? "ready" : previewNode ? "draft" : "missing",
          note: `Spatial pin binding for Hole ${hole.number}.`
        });
      }),
  );
}

export function createHazardSpatialBindings(
  hazardProfiles: HazardProfile[],
  sceneAuthoring?: SceneAuthoringState,
): HazardSpatialBinding[] {
  return hazardProfiles.map((hazard) => {
    const hazardZone = findHazardZone(sceneAuthoring, hazard.hazardId, hazard.holeId);

    return hazardSpatialBindingSchema.parse({
      hazardSpatialBindingId: `hazard-binding-${hazard.hazardId}`,
      holeId: hazard.holeId,
      hazardId: hazard.hazardId,
      hazardZoneRef: hazardZone
        ? createSceneSpatialReference({
            entityType: "hazard-zone",
            entityId: hazardZone.hazardZoneId,
            holeId: hazard.holeId,
            note: "Hazard geometry anchor."
          })
        : null,
      relatedSceneObjectRefs: [],
      readinessState: hazardZone ? "ready" : "missing",
      note: `Spatial hazard binding for ${hazard.type}.`
    });
  });
}

export function createOutOfBoundsSpatialBindings(
  holes: Hole[],
  sceneAuthoring?: SceneAuthoringState,
): OutOfBoundsSpatialBinding[] {
  return holes.map((hole) => {
    const boundaryRefs = findOutOfBoundsZones(sceneAuthoring, hole.holeId).map((zone) =>
      createSceneSpatialReference({
        entityType: "out-of-bounds-zone",
        entityId: zone.outOfBoundsZoneId,
        holeId: hole.holeId,
        note: `OB boundary ${zone.sideLabel}.`
      }),
    );

    return outOfBoundsSpatialBindingSchema.parse({
      outOfBoundsSpatialBindingId: `oob-binding-${hole.holeId}`,
      holeId: hole.holeId,
      boundaryRefs,
      readinessState: boundaryRefs.length > 0 ? "ready" : "missing",
      note: `Out-of-bounds boundaries for Hole ${hole.number}.`
    });
  });
}

export function createDropZoneSpatialBindings(
  dropZones: DropZone[],
  sceneAuthoring?: SceneAuthoringState,
): DropZoneSpatialBinding[] {
  return dropZones.map((dropZone) => {
    const dropZoneArea = findDropZoneArea(sceneAuthoring, dropZone.dropZoneId, dropZone.holeId);

    return dropZoneSpatialBindingSchema.parse({
      dropZoneSpatialBindingId: `drop-zone-binding-${dropZone.dropZoneId}`,
      holeId: dropZone.holeId,
      dropZoneId: dropZone.dropZoneId,
      dropZoneAreaRef: dropZoneArea
        ? createSceneSpatialReference({
            entityType: "drop-zone-area",
            entityId: dropZoneArea.dropZoneAreaId,
            holeId: dropZone.holeId,
            note: "Drop-zone recovery area."
          })
        : null,
      sceneObjectRef: null,
      readinessState: dropZoneArea ? "ready" : "missing",
      note: `Recovery binding for ${dropZone.label}.`
    });
  });
}

export function createPreviewAnchorBindings(
  holes: Hole[],
  sceneAuthoring?: SceneAuthoringState,
): PreviewAnchorBinding[] {
  return holes.flatMap((hole) => {
    const previewNode = findPreviewNode(sceneAuthoring, hole.holeId);
    const greenZone = findGreenZone(sceneAuthoring, hole.holeId);

    return [
      previewAnchorBindingSchema.parse({
        previewAnchorBindingId: `preview-anchor-${hole.holeId}-flyover-start`,
        holeId: hole.holeId,
        role: "flyover-start",
        anchorRef: previewNode
          ? createSceneSpatialReference({
              entityType: "routing-node",
              entityId: previewNode.routingNodeId,
              holeId: hole.holeId,
              note: "Flyover starting anchor."
            })
          : null,
        readinessState: previewNode ? "ready" : "missing",
        note: `Flyover start anchor for Hole ${hole.number}.`
      }),
      previewAnchorBindingSchema.parse({
        previewAnchorBindingId: `preview-anchor-${hole.holeId}-minimap-center`,
        holeId: hole.holeId,
        role: "minimap-center",
        anchorRef: greenZone
          ? createSceneSpatialReference({
              entityType: "green-zone",
              entityId: greenZone.greenZoneId,
              holeId: hole.holeId,
              note: "Minimap center anchor."
            })
          : null,
        readinessState: greenZone ? "ready" : "missing",
        note: `Minimap center anchor for Hole ${hole.number}.`
      })
    ];
  });
}

export function createMinimapMetadata(
  holes: Hole[],
  previewPaths: PreviewPath[] = [],
  sceneAuthoring?: SceneAuthoringState,
): MinimapMetadata[] {
  const previewAnchors = createPreviewAnchorBindings(holes, sceneAuthoring);

  return holes.map((hole) => {
    const previewPath = findPreviewPathRef(previewPaths, hole.holeId, "minimap");
    const centerAnchor =
      previewAnchors.find(
        (binding) => binding.holeId === hole.holeId && binding.role === "minimap-center",
      ) ?? null;

    return minimapMetadataSchema.parse({
      holeId: hole.holeId,
      previewPathRef: previewPath?.previewPathId ?? null,
      overlayState: previewStateForPath(previewPath),
      framingNote: `Frame the primary landing zone for Hole ${hole.number}.`,
      focalLandmark: hole.landmarkRefs[0] ?? "Primary landmark to be assigned",
      orientationHint: "North-up overview with landing zone clarity.",
      frameAnchorRef: centerAnchor?.anchorRef ?? null,
      northReferenceAnchorRef: centerAnchor?.anchorRef ?? null
    });
  });
}

export function createFlyoverMetadata(
  holes: Hole[],
  previewPaths: PreviewPath[] = [],
  sceneAuthoring?: SceneAuthoringState,
): FlyoverMetadata[] {
  const previewAnchors = createPreviewAnchorBindings(holes, sceneAuthoring);

  return holes.map((hole) => {
    const previewPath = findPreviewPathRef(previewPaths, hole.holeId, "flyover");
    const startAnchor =
      previewAnchors.find(
        (binding) => binding.holeId === hole.holeId && binding.role === "flyover-start",
      ) ?? null;
    const apexAnchor = findFairwayCorridor(sceneAuthoring, hole.holeId);
    const endAnchor = findGreenZone(sceneAuthoring, hole.holeId);

    return flyoverMetadataSchema.parse({
      holeId: hole.holeId,
      previewPathRef: previewPath?.previewPathId ?? null,
      readinessState: previewStateForPath(previewPath),
      cameraIntent: `Explain the tee view and preferred line for Hole ${hole.number}.`,
      introBeat: "Open on the primary landmark and first-shot corridor.",
      outroBeat: "Resolve on the green complex and completion payoff.",
      durationSeconds: 18,
      startAnchorRef: startAnchor?.anchorRef ?? null,
      apexAnchorRef: apexAnchor
        ? createSceneSpatialReference({
            entityType: "fairway-corridor",
            entityId: apexAnchor.fairwayCorridorId,
            holeId: hole.holeId,
            note: "Mid-flight corridor anchor."
          })
        : null,
      endAnchorRef: endAnchor
        ? createSceneSpatialReference({
            entityType: "green-zone",
            entityId: endAnchor.greenZoneId,
            holeId: hole.holeId,
            note: "Flyover end anchor."
          })
        : null
    });
  });
}

function calculateCoverage<TState extends string>(
  items: Array<{ state: TState }>,
  readyState: TState,
) {
  return items.length === 0 ? 0 : items.filter((item) => item.state === readyState).length / items.length;
}

export function createSimulatorLogicConfig({
  holes,
  teeSets,
  pinSets,
  surfaceProfiles,
  hazardProfiles,
  dropZones,
  previewPaths = [],
  sceneAuthoring,
  outOfBoundsConfigured = false,
  exportProfileNotes = []
}: CreateSimulatorLogicConfigInput): SimulatorLogicConfig {
  const holePlayProfiles = createHolePlayProfiles(holes, surfaceProfiles, sceneAuthoring);
  const teeSpatialBindings = createTeeSpatialBindings(holes, teeSets, sceneAuthoring);
  const pinSpatialBindings = createPinSpatialBindings(holes, pinSets, sceneAuthoring);
  const hazardSpatialBindings = createHazardSpatialBindings(hazardProfiles, sceneAuthoring);
  const outOfBoundsSpatialBindings = createOutOfBoundsSpatialBindings(holes, sceneAuthoring);
  const dropZoneSpatialBindings = createDropZoneSpatialBindings(dropZones, sceneAuthoring);
  const previewAnchorBindings = createPreviewAnchorBindings(holes, sceneAuthoring);
  const minimapMetadata = createMinimapMetadata(holes, previewPaths, sceneAuthoring);
  const flyoverMetadata = createFlyoverMetadata(holes, previewPaths, sceneAuthoring);

  return simulatorLogicConfigSchema.parse({
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
    outOfBoundsConfigured,
    minimapCoverage: calculateCoverage(
      minimapMetadata.map((metadata) => ({ state: metadata.overlayState })),
      "ready",
    ),
    flyoverCoverage: calculateCoverage(
      flyoverMetadata.map((metadata) => ({ state: metadata.readinessState })),
      "ready",
    ),
    exportProfileNotes
  });
}
