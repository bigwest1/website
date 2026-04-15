import type {
  CameraState,
  SceneAuthoringState,
  SceneSpatialReference,
  SpatialPolygon,
  SpatialPolyline,
  Vector3,
  ViewportBackendStatus,
  ViewportProjectionMode,
  ViewportRendererMode
} from "./models";
import type { SimulatorGeometryLike, SpatialAnalysisReport } from "./analysis";
import {
  summarizeCourseScaleTerrainFinish,
  summarizeRoutingContinuity,
  summarizeSurfaceRuleCoverageMapping,
  summarizeTerrainFinishConsistency
} from "./summary";

export type RendererPrimitiveLayer = "terrain" | "routing" | "scene" | "simulator" | "analysis";
export type RendererPrimitiveTone = "default" | "accent" | "success" | "warning" | "danger" | "muted";
export type RendererSceneBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  widthMeters: number;
  depthMeters: number;
  center: Vector3;
};
export type RendererOverlayDescriptor = {
  overlayId: string;
  label: string;
  layer: RendererPrimitiveLayer;
  priority: number;
  active: boolean;
  itemCount: number;
  summary: string;
};
export type RendererRuntimeStatus = {
  fidelity: "scaffolded" | "connected" | "high-fidelity-path";
  qualityTier: "preview-canvas" | "high-fidelity-bridge" | "native-ready";
  primitiveCount: number;
  interactivePrimitiveCount: number;
  selectedEntityCount: number;
  activeOverlayCount: number;
  highPriorityIssueCount: number;
  activeTargetLabel: string | null;
  activeTargetPosition: Vector3 | null;
  previewMode: "idle" | "placement" | "scenery-brush" | "terrain-finish";
  previewLabel: string | null;
};
export type RendererRenderPass = {
  passId: string;
  label: string;
  layer: RendererPrimitiveLayer;
  priority: number;
  primitiveIds: string[];
};
export type RendererInteractionTarget =
  | {
      kind: "entity-translate";
      reference: SceneSpatialReference;
    }
  | {
      kind: "entity-rotate";
      reference: SceneSpatialReference;
    }
  | {
      kind: "entity-scale";
      reference: SceneSpatialReference;
    }
  | {
      kind: "routing-bend";
      reference: SceneSpatialReference;
      routingSegmentId: string;
    }
  | {
      kind: "routing-width";
      reference: SceneSpatialReference;
      routingSegmentId: string;
    }
  | {
      kind: "routing-height";
      reference: SceneSpatialReference;
      routingNodeId: string;
    }
  | {
      kind: "corridor-bend";
      reference: SceneSpatialReference;
      corridorId: string;
    }
  | {
      kind: "corridor-width";
      reference: SceneSpatialReference;
      corridorId: string;
    }
  | {
      kind: "visibility-width";
      reference: SceneSpatialReference;
      corridorId: string;
    };

export type RendererInteractionDelta = {
  worldDelta?: Partial<Vector3>;
  worldPoint?: Vector3;
  rotationDegrees?: number;
  scaleFactor?: number;
  widthDeltaMeters?: number;
  heightDeltaMeters?: number;
};

export type RendererPrimitive =
  | {
      id: string;
      layer: RendererPrimitiveLayer;
      geometryType: "point";
      tone: RendererPrimitiveTone;
      label: string;
      selected: boolean;
      interactive: boolean;
      entityRef: SceneSpatialReference | null;
      interactionTarget: RendererInteractionTarget | null;
      renderPriority: number;
      position: Vector3;
      radius: number;
    }
  | {
      id: string;
      layer: RendererPrimitiveLayer;
      geometryType: "polyline";
      tone: RendererPrimitiveTone;
      label: string;
      selected: boolean;
      interactive: boolean;
      entityRef: SceneSpatialReference | null;
      interactionTarget: RendererInteractionTarget | null;
      renderPriority: number;
      polyline: SpatialPolyline;
      width: number;
    }
  | {
      id: string;
      layer: RendererPrimitiveLayer;
      geometryType: "polygon";
      tone: RendererPrimitiveTone;
      label: string;
      selected: boolean;
      interactive: boolean;
      entityRef: SceneSpatialReference | null;
      interactionTarget: RendererInteractionTarget | null;
      renderPriority: number;
      polygon: SpatialPolygon;
    };

export type RendererSceneSnapshot = {
  rendererMode: ViewportRendererMode;
  backendStatus: ViewportBackendStatus;
  projectionMode: ViewportProjectionMode;
  camera: CameraState;
  activeHoleId: string | null;
  primitives: RendererPrimitive[];
  selectedEntityIds: string[];
  hoveredEntityId: string | null;
  sceneBounds: RendererSceneBounds | null;
  overlays: RendererOverlayDescriptor[];
  renderPasses: RendererRenderPass[];
  runtimeStatus: RendererRuntimeStatus;
};

function selectedEntityIds(state: SceneAuthoringState) {
  return new Set([
    ...state.selectionState.selectedObjectIds,
    ...state.selectionState.selectedGroupIds,
    ...state.selectionState.selectedSpatialEntityRefs.map((reference) => reference.entityId),
    state.editingState.selectedTerrainRegionId,
    state.editingState.selectedRoutingNodeId,
    state.editingState.selectedRoutingSegmentId,
    state.editingState.selectedHazardZoneId,
    state.editingState.selectedOutOfBoundsZoneId,
    state.editingState.selectedDropZoneAreaId
  ].filter((value): value is string => typeof value === "string" && value.length > 0));
}

function createRef(
  entityType: SceneSpatialReference["entityType"],
  entityId: string,
  holeId: string | null,
  note: string,
): SceneSpatialReference {
  return {
    entityType,
    entityId,
    holeId,
    note
  };
}

function centroidOfPolygon(polygon: SpatialPolygon): Vector3 {
  if (polygon.points.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  const total = polygon.points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x,
      y: accumulator.y + point.y,
      z: accumulator.z + point.z
    }),
    { x: 0, y: 0, z: 0 },
  );

  return {
    x: total.x / polygon.points.length,
    y: total.y / polygon.points.length,
    z: total.z / polygon.points.length
  };
}

function resolveReferencePosition(state: SceneAuthoringState, reference: SceneSpatialReference): Vector3 | null {
  const centroidForBoundary = (boundary?: SpatialPolygon | null) => (boundary ? centroidOfPolygon(boundary) : null);

  switch (reference.entityType) {
    case "scene-object":
      return state.sceneObjects.find((sceneObject) => sceneObject.sceneObjectId === reference.entityId)?.transform.position ?? null;
    case "routing-node":
      return state.routingNodes.find((routingNode) => routingNode.routingNodeId === reference.entityId)?.position ?? null;
    case "terrain-region":
      return centroidForBoundary(
        state.terrainRegions.find((terrainRegion) => terrainRegion.terrainRegionId === reference.entityId)?.boundary,
      );
    case "hazard-zone":
      return centroidForBoundary(
        state.hazardZones.find((hazardZone) => hazardZone.hazardZoneId === reference.entityId)?.boundary,
      );
    case "out-of-bounds-zone":
      return centroidForBoundary(
        state.outOfBoundsZones.find((zone) => zone.outOfBoundsZoneId === reference.entityId)?.boundary,
      );
    case "drop-zone-area":
      return centroidForBoundary(
        state.dropZoneAreas.find((zone) => zone.dropZoneAreaId === reference.entityId)?.boundary,
      );
    case "tee-zone":
      return centroidForBoundary(
        state.teeZones.find((zone) => zone.teeZoneId === reference.entityId)?.boundary,
      );
    case "green-zone":
      return centroidForBoundary(
        state.greenZones.find((zone) => zone.greenZoneId === reference.entityId)?.boundary,
      );
    case "fairway-corridor": {
      const fairwayCorridor = state.fairwayCorridors.find((corridor) => corridor.fairwayCorridorId === reference.entityId);
      return fairwayCorridor?.centerline.points[Math.floor(fairwayCorridor.centerline.points.length / 2)] ?? null;
    }
    case "visibility-corridor": {
      const visibilityCorridor = state.visibilityCorridors.find(
        (corridor) => corridor.visibilityCorridorId === reference.entityId,
      );
      return visibilityCorridor?.corridorLine.points[Math.floor(visibilityCorridor.corridorLine.points.length / 2)] ?? null;
    }
    case "play-route-envelope":
      return centroidForBoundary(
        state.playRouteEnvelopes.find((envelope) => envelope.playRouteEnvelopeId === reference.entityId)?.boundary,
      );
    default:
      return null;
  }
}

function midpointOfPolyline(polyline: SpatialPolyline): Vector3 | null {
  const midpointIndex = Math.floor(polyline.points.length / 2);
  return polyline.points[midpointIndex] ?? null;
}

function centroidOfPolyline(polyline: SpatialPolyline): Vector3 | null {
  if (polyline.points.length === 0) {
    return null;
  }

  const total = polyline.points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x,
      y: accumulator.y + point.y,
      z: accumulator.z + point.z
    }),
    { x: 0, y: 0, z: 0 },
  );

  return {
    x: total.x / polyline.points.length,
    y: total.y / polyline.points.length,
    z: total.z / polyline.points.length
  };
}

function offsetPoint(point: Vector3, delta: Partial<Vector3>): Vector3 {
  return {
    x: point.x + (delta.x ?? 0),
    y: point.y + (delta.y ?? 0),
    z: point.z + (delta.z ?? 0)
  };
}

function planarDistance(left: Vector3, right: Vector3) {
  return Math.hypot(left.x - right.x, left.z - right.z);
}

function createCircularPolygon(center: Vector3, radius: number, segments = 18): SpatialPolygon {
  return {
    points: Array.from({ length: segments }, (_, index) => {
      const angle = (Math.PI * 2 * index) / segments;
      return {
        x: center.x + Math.cos(angle) * radius,
        y: center.y,
        z: center.z + Math.sin(angle) * radius
      };
    })
  };
}

function previewHash(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 2147483647;
  }
  return hash || 17;
}

function previewRandom(seed: number) {
  return ((seed * 48271) % 2147483647) / 2147483647;
}

function createBrushPreviewGhostPoints(
  center: Vector3,
  radius: number,
  count: number,
  seedInput: string,
) {
  const ghostCount = Math.max(1, Math.min(10, count));
  const baseSeed = previewHash(seedInput);

  return Array.from({ length: ghostCount }, (_, index) => {
    const angleSeed = previewRandom(baseSeed + index * 17);
    const distanceSeed = previewRandom(baseSeed + index * 43);
    const angle = angleSeed * Math.PI * 2;
    const distance = Math.sqrt(distanceSeed) * radius * 0.82;

    return {
      x: center.x + Math.cos(angle) * distance,
      y: center.y,
      z: center.z + Math.sin(angle) * distance
    };
  });
}

function pointBounds(point: Vector3, radius = 2): RendererSceneBounds {
  return {
    minX: point.x - radius,
    maxX: point.x + radius,
    minZ: point.z - radius,
    maxZ: point.z + radius,
    widthMeters: radius * 2,
    depthMeters: radius * 2,
    center: point
  };
}

function polygonBounds(polygon: SpatialPolygon): RendererSceneBounds {
  const xs = polygon.points.map((point) => point.x);
  const zs = polygon.points.map((point) => point.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);

  return {
    minX,
    maxX,
    minZ,
    maxZ,
    widthMeters: maxX - minX,
    depthMeters: maxZ - minZ,
    center: centroidOfPolygon(polygon)
  };
}

function polylineBounds(polyline: SpatialPolyline): RendererSceneBounds {
  const xs = polyline.points.map((point) => point.x);
  const zs = polyline.points.map((point) => point.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);

  return {
    minX,
    maxX,
    minZ,
    maxZ,
    widthMeters: maxX - minX,
    depthMeters: maxZ - minZ,
    center: centroidOfPolyline(polyline) ?? polyline.points[0]!
  };
}

function primitiveBounds(primitive: RendererPrimitive): RendererSceneBounds {
  switch (primitive.geometryType) {
    case "polygon":
      return polygonBounds(primitive.polygon);
    case "polyline":
      return polylineBounds(primitive.polyline);
    case "point":
    default:
      return pointBounds(primitive.position, primitive.radius);
  }
}

function mergeBounds(bounds: RendererSceneBounds[]): RendererSceneBounds | null {
  if (bounds.length === 0) {
    return null;
  }

  const minX = Math.min(...bounds.map((entry) => entry.minX));
  const maxX = Math.max(...bounds.map((entry) => entry.maxX));
  const minZ = Math.min(...bounds.map((entry) => entry.minZ));
  const maxZ = Math.max(...bounds.map((entry) => entry.maxZ));

  return {
    minX,
    maxX,
    minZ,
    maxZ,
    widthMeters: maxX - minX,
    depthMeters: maxZ - minZ,
    center: {
      x: (minX + maxX) / 2,
      y: 0,
      z: (minZ + maxZ) / 2
    }
  };
}

function createOverlays(
  state: SceneAuthoringState,
  analysisReport?: SpatialAnalysisReport,
): RendererOverlayDescriptor[] {
  const terrainFinish = summarizeTerrainFinishConsistency(state);
  const courseScaleTerrainFinish = summarizeCourseScaleTerrainFinish(state);
  const surfaceRuleCoverage = summarizeSurfaceRuleCoverageMapping(state);
  const terrainFinishHotspotCount =
    terrainFinish.coverageGapRegionIds.length +
    terrainFinish.patchyRegionIds.length +
    terrainFinish.dominantMaterialOveruseRegionIds.length;
  const routingContinuity = summarizeRoutingContinuity(state);
  return [
    {
      overlayId: "terrain",
      label: "Terrain",
      layer: "terrain",
      priority: 10,
      active: state.overlayState.showTerrainOverlay,
      itemCount:
        state.terrainRegions.length + state.terrainModifiers.length + state.terrainPaintStrokes.length,
      summary: `${state.terrainRegions.length} regions, ${state.terrainModifiers.length} modifiers, ${state.terrainPaintStrokes.length} finish strokes`
    },
    {
      overlayId: "terrain-finish",
      label: "Finish Intel",
      layer: "analysis",
      priority: 15,
      active: state.overlayState.showTerrainFinishOverlay,
      itemCount: terrainFinishHotspotCount + courseScaleTerrainFinish.imbalancedHoleCount,
      summary:
        terrainFinishHotspotCount > 0 || courseScaleTerrainFinish.imbalancedHoleCount > 0
          ? `${terrainFinish.balanceState} balance · ${terrainFinishHotspotCount} hotspots · ${courseScaleTerrainFinish.imbalancedHoleCount} weak holes`
          : "Terrain finish reads calm"
    },
    {
      overlayId: "surface-rules",
      label: "Surface Rules",
      layer: "analysis",
      priority: 18,
      active: state.overlayState.showSurfaceRuleCoverageOverlay,
      itemCount:
        surfaceRuleCoverage.activeRegionCount +
        surfaceRuleCoverage.uncoveredRegionCount +
        surfaceRuleCoverage.conflictingRegionCount,
      summary:
        surfaceRuleCoverage.activeRegionCount > 0 ||
        surfaceRuleCoverage.uncoveredRegionCount > 0 ||
        surfaceRuleCoverage.conflictingRegionCount > 0
          ? `${surfaceRuleCoverage.overallState} coverage · ${surfaceRuleCoverage.uncoveredRegionCount} weak · ${surfaceRuleCoverage.conflictingRegionCount} conflicts`
          : "No surface-rule coverage is mapped yet"
    },
    {
      overlayId: "routing",
      label: "Routing",
      layer: "routing",
      priority: 20,
      active: state.overlayState.showRoutingOverlay,
      itemCount: state.routingNodes.length + state.routingSegments.length + state.routingPaths.length,
      summary: `${routingContinuity.deliveryConfidence} delivery · ${routingContinuity.completionPercent}% connected · ${routingContinuity.mergeClusterCount} merge clusters`
    },
    {
      overlayId: "simulator",
      label: "Simulator",
      layer: "simulator",
      priority: 30,
      active: state.overlayState.showSimulatorAnchorsOverlay,
      itemCount:
        state.teeZones.length +
        state.greenZones.length +
        state.hazardZones.length +
        state.outOfBoundsZones.length +
        state.dropZoneAreas.length,
      summary: `${state.teeZones.length + state.greenZones.length + state.hazardZones.length + state.outOfBoundsZones.length + state.dropZoneAreas.length} bound zones`
    },
    {
      overlayId: "analysis",
      label: "Analysis",
      layer: "analysis",
      priority: 40,
      active: state.overlayState.showValidationOverlay,
      itemCount:
        (analysisReport?.blockedLineOfPlayIssues.length ?? 0) +
        (analysisReport?.collisionConflicts.length ?? 0) +
        (analysisReport?.occlusionRisks.length ?? 0) +
        (analysisReport?.simulatorAnchorConflicts.length ?? 0),
      summary: analysisReport
        ? `${analysisReport.blockedLineOfPlayIssues.length + analysisReport.collisionConflicts.length + analysisReport.occlusionRisks.length + analysisReport.simulatorAnchorConflicts.length} active trust markers`
        : "No analysis markers"
    }
  ];
}

function createRenderPasses(primitives: RendererPrimitive[]): RendererRenderPass[] {
  const passDefinitions: Array<{
    passId: string;
    label: string;
    layer: RendererPrimitiveLayer;
    priority: number;
  }> = [
    { passId: "terrain-base", label: "Terrain Base", layer: "terrain", priority: 10 },
    { passId: "routing-flow", label: "Routing Flow", layer: "routing", priority: 20 },
    { passId: "scene-objects", label: "Scene Objects", layer: "scene", priority: 30 },
    { passId: "simulator-zones", label: "Simulator Zones", layer: "simulator", priority: 40 },
    { passId: "analysis-gizmos", label: "Analysis & Gizmos", layer: "analysis", priority: 50 }
  ];

  return passDefinitions.map((definition) => ({
    ...definition,
    primitiveIds: primitives
      .filter((primitive) => primitive.layer === definition.layer)
      .sort((left, right) => left.renderPriority - right.renderPriority)
      .map((primitive) => primitive.id)
  }));
}

function addTransformGizmo(
  primitives: RendererPrimitive[],
  reference: SceneSpatialReference,
  position: Vector3,
) {
  primitives.push(
    {
      id: `gizmo-move-${reference.entityType}-${reference.entityId}`,
      layer: "analysis",
      geometryType: "point",
      tone: "accent",
      label: "Move",
      selected: true,
      interactive: true,
      entityRef: reference,
      interactionTarget: {
        kind: "entity-translate",
        reference
      },
      renderPriority: 62,
      position,
      radius: 7
    },
    {
      id: `gizmo-rotate-${reference.entityType}-${reference.entityId}`,
      layer: "analysis",
      geometryType: "point",
      tone: "warning",
      label: "Rotate",
      selected: true,
      interactive: true,
      entityRef: reference,
      interactionTarget: {
        kind: "entity-rotate",
        reference
      },
      renderPriority: 63,
      position: offsetPoint(position, { x: 10, z: -10 }),
      radius: 5
    },
    {
      id: `gizmo-scale-${reference.entityType}-${reference.entityId}`,
      layer: "analysis",
      geometryType: "point",
      tone: "success",
      label: "Scale",
      selected: true,
      interactive: true,
      entityRef: reference,
      interactionTarget: {
        kind: "entity-scale",
        reference
      },
      renderPriority: 64,
      position: offsetPoint(position, { x: -10, z: -10 }),
      radius: 5
    }
  );
}

export function buildRendererSceneSnapshot(
  state: SceneAuthoringState,
  options?: {
    simulatorGeometry?: SimulatorGeometryLike;
    analysisReport?: SpatialAnalysisReport;
  },
): RendererSceneSnapshot {
  const selectedIds = selectedEntityIds(state);
  const primitives: RendererPrimitive[] = [];
  const routingVisibilityMode = state.editingState.routingGuideSettings.visibilityMode;
  const terrainMaterialVisibilityMode = state.editingState.terrainMaterialVisibilityMode;
  const activeTerrainMaterialId = state.editingState.activeTerrainMaterialId;
  const selectedTerrainRegionId = state.editingState.selectedTerrainRegionId;
  const visibleRoutingHoleId = state.viewportState.activeHoleId;
  const selectedRouteHoleId =
    state.routingPaths.find((path) => path.routingPathId === state.viewportState.selectedRoutingPathId)?.holeId ??
    state.routingNodes.find((node) => node.routingNodeId === state.editingState.selectedRoutingNodeId)?.holeId ??
    state.routingSegments.find((segment) => segment.routingSegmentId === state.editingState.selectedRoutingSegmentId)?.holeId ??
    visibleRoutingHoleId;
  const includeRoutingHole = (holeId: string) => {
    switch (routingVisibilityMode) {
      case "active-hole":
        return visibleRoutingHoleId ? holeId === visibleRoutingHoleId : true;
      case "selected-route":
        return selectedRouteHoleId ? holeId === selectedRouteHoleId : true;
      case "routing-only":
      case "all":
      default:
        return true;
    }
  };

  for (const sceneObject of state.sceneObjects) {
    if (!sceneObject.visible && !state.overlayState.showHiddenGhosts) {
      continue;
    }

    primitives.push({
      id: sceneObject.sceneObjectId,
      layer: "scene",
      geometryType: "point",
      tone:
        sceneObject.category === "gameplay-course-object"
          ? "success"
          : sceneObject.category === "landmark"
            ? "accent"
            : sceneObject.category === "vegetation"
              ? "muted"
            : sceneObject.category === "animated-set-piece"
              ? "warning"
              : "default",
      label: sceneObject.name,
      selected: selectedIds.has(sceneObject.sceneObjectId),
      interactive: true,
      entityRef: createRef(
        "scene-object",
        sceneObject.sceneObjectId,
        sceneObject.binding?.entityId ?? null,
        sceneObject.objectType,
      ),
      interactionTarget: {
        kind: "entity-translate",
        reference: createRef(
          "scene-object",
          sceneObject.sceneObjectId,
          sceneObject.binding?.entityId ?? null,
          sceneObject.objectType,
        )
      },
      renderPriority:
        sceneObject.category === "gameplay-course-object"
          ? 52
          : sceneObject.category === "landmark"
            ? 48
            : 42,
      position: sceneObject.transform.position,
      radius: Math.max(3, Math.abs(sceneObject.transform.scale.x) + Math.abs(sceneObject.transform.scale.z))
    });
  }

  if (state.overlayState.showTerrainOverlay) {
    for (const terrainRegion of state.terrainRegions) {
      const primaryPaintMaterialId = terrainRegion.paintedMaterialIds.at(-1) ?? null;
      const primaryPaintMaterial = primaryPaintMaterialId
        ? state.terrainMaterialPalette.find((material) => material.terrainMaterialId === primaryPaintMaterialId) ?? null
        : null;
      const terrainTone =
        primaryPaintMaterial?.gameplayPurpose === "green-complex"
          ? "accent"
          : primaryPaintMaterial?.gameplayPurpose === "hazard"
            ? "warning"
            : terrainRegion.gameplayPurpose === "fairway"
              ? "success"
              : "muted";
      const terrainVisibilityTone =
        terrainMaterialVisibilityMode === "selected-region" &&
        selectedTerrainRegionId &&
        terrainRegion.terrainRegionId !== selectedTerrainRegionId
          ? "muted"
          : terrainMaterialVisibilityMode === "active-material" &&
              activeTerrainMaterialId &&
              !terrainRegion.paintedMaterialIds.includes(activeTerrainMaterialId)
            ? "muted"
            : terrainTone;
      primitives.push({
        id: terrainRegion.terrainRegionId,
        layer: "terrain",
        geometryType: "polygon",
        tone: terrainVisibilityTone,
        label: terrainRegion.name,
        selected: selectedIds.has(terrainRegion.terrainRegionId),
        interactive: true,
        entityRef: createRef(
          "terrain-region",
          terrainRegion.terrainRegionId,
          terrainRegion.holeId,
          terrainRegion.gameplayPurpose,
        ),
        interactionTarget: {
          kind: "entity-translate",
          reference: createRef(
            "terrain-region",
            terrainRegion.terrainRegionId,
            terrainRegion.holeId,
            terrainRegion.gameplayPurpose,
          )
        },
        renderPriority: terrainRegion.gameplayPurpose === "fairway" ? 18 : 12,
        polygon: terrainRegion.boundary
      });
    }

    for (const terrainModifier of state.terrainModifiers) {
      primitives.push({
        id: terrainModifier.terrainModifierId,
        layer: "terrain",
        geometryType: "polygon",
        tone:
          terrainModifier.kind === "raise" || terrainModifier.kind === "flatten"
            ? "accent"
            : terrainModifier.kind === "lower" || terrainModifier.kind === "cut"
              ? "warning"
              : "muted",
        label: `${terrainModifier.kind.replace(/-/g, " ")} modifier`,
        selected: selectedIds.has(terrainModifier.terrainModifierId),
        interactive: false,
        entityRef: createRef(
          "terrain-modifier",
          terrainModifier.terrainModifierId,
          terrainModifier.holeId,
          terrainModifier.note,
        ),
        interactionTarget: null,
        renderPriority: 16,
        polygon: terrainModifier.bounds
      });
    }

    for (const terrainPaintStroke of state.terrainPaintStrokes) {
      const material = state.terrainMaterialPalette.find(
        (candidate) => candidate.terrainMaterialId === terrainPaintStroke.terrainMaterialId,
      );
      const paintTone =
        material?.gameplayPurpose === "green-complex"
          ? "accent"
          : material?.gameplayPurpose === "hazard"
            ? "warning"
            : material?.gameplayPurpose === "fairway"
              ? "success"
              : "muted";
      const visibilityFiltered =
        (terrainMaterialVisibilityMode === "active-material" &&
          activeTerrainMaterialId !== null &&
          terrainPaintStroke.terrainMaterialId !== activeTerrainMaterialId) ||
        (terrainMaterialVisibilityMode === "selected-region" &&
          selectedTerrainRegionId !== null &&
          terrainPaintStroke.regionId !== selectedTerrainRegionId);
      primitives.push({
        id: terrainPaintStroke.terrainPaintStrokeId,
        layer: "terrain",
        geometryType: "polygon",
        tone: visibilityFiltered ? "muted" : paintTone,
        label: `${material?.label ?? "Terrain finish"} ${terrainPaintStroke.blendMode} layer ${terrainPaintStroke.layerIndex + 1}`,
        selected: false,
        interactive: false,
        entityRef: null,
        interactionTarget: null,
        renderPriority: 14 + terrainPaintStroke.layerIndex,
        polygon: terrainPaintStroke.bounds
      });
    }
  }

  if (state.overlayState.showTerrainFinishOverlay) {
    const terrainFinish = summarizeTerrainFinishConsistency(state);
    const courseScaleTerrainFinish = summarizeCourseScaleTerrainFinish(state);
    const activeHoleId = state.viewportState.activeHoleId;
    const includeTerrainRegion = (regionId: string) => {
      const region = state.terrainRegions.find((candidate) => candidate.terrainRegionId === regionId);
      return region ? !activeHoleId || region.holeId === activeHoleId : false;
    };
    const centerForHole = (holeId: string) => {
      const holeRegions = state.terrainRegions.filter((region) => (region.holeId ?? "scene-wide") === holeId);
      if (holeRegions.length > 0) {
        const centers = holeRegions.map((region) => centroidOfPolygon(region.boundary));
        return {
          x: centers.reduce((sum, point) => sum + point.x, 0) / centers.length,
          y: centers.reduce((sum, point) => sum + point.y, 0) / centers.length,
          z: centers.reduce((sum, point) => sum + point.z, 0) / centers.length
        };
      }

      const holeNodes = state.routingNodes.filter((node) => node.holeId === holeId);
      if (holeNodes.length > 0) {
        return {
          x: holeNodes.reduce((sum, node) => sum + node.position.x, 0) / holeNodes.length,
          y: holeNodes.reduce((sum, node) => sum + node.position.y, 0) / holeNodes.length,
          z: holeNodes.reduce((sum, node) => sum + node.position.z, 0) / holeNodes.length
        };
      }

      return null;
    };

    for (const regionId of terrainFinish.coverageGapRegionIds.filter(includeTerrainRegion)) {
      const region = state.terrainRegions.find((candidate) => candidate.terrainRegionId === regionId);
      if (!region) {
        continue;
      }

      primitives.push({
        id: `terrain-finish-gap-${region.terrainRegionId}`,
        layer: "analysis",
        geometryType: "point",
        tone: "warning",
        label: "Coverage Gap",
        selected: false,
        interactive: false,
        entityRef: createRef("terrain-region", region.terrainRegionId, region.holeId, region.name),
        interactionTarget: null,
        renderPriority: 58,
        position: offsetPoint(centroidOfPolygon(region.boundary), { y: 2 }),
        radius: 4
      });
    }

    for (const regionId of terrainFinish.patchyRegionIds.filter(includeTerrainRegion)) {
      const region = state.terrainRegions.find((candidate) => candidate.terrainRegionId === regionId);
      if (!region) {
        continue;
      }

      primitives.push({
        id: `terrain-finish-patchy-${region.terrainRegionId}`,
        layer: "analysis",
        geometryType: "point",
        tone: "warning",
        label: "Patchy Finish",
        selected: false,
        interactive: false,
        entityRef: createRef("terrain-region", region.terrainRegionId, region.holeId, region.name),
        interactionTarget: null,
        renderPriority: 59,
        position: offsetPoint(centroidOfPolygon(region.boundary), { x: 4, y: 3, z: -3 }),
        radius: 3
      });
    }

    for (const regionId of terrainFinish.dominantMaterialOveruseRegionIds.filter(includeTerrainRegion).slice(0, 5)) {
      const region = state.terrainRegions.find((candidate) => candidate.terrainRegionId === regionId);
      if (!region) {
        continue;
      }

      primitives.push({
        id: `terrain-finish-overuse-${region.terrainRegionId}`,
        layer: "analysis",
        geometryType: "point",
        tone: terrainFinish.balanceState === "imbalanced" ? "danger" : "warning",
        label: `${terrainFinish.dominantMaterialLabel ?? "Dominant finish"} overuse`,
        selected: false,
        interactive: false,
        entityRef: createRef("terrain-region", region.terrainRegionId, region.holeId, region.name),
        interactionTarget: null,
        renderPriority: 60,
        position: offsetPoint(centroidOfPolygon(region.boundary), { x: -4, y: 3, z: 3 }),
        radius: 3
      });
    }

    for (const holeSummary of courseScaleTerrainFinish.holeSummaries) {
      if (activeHoleId && holeSummary.holeId !== activeHoleId) {
        continue;
      }
      if (holeSummary.balanceState === "balanced") {
        continue;
      }
      const holeCenter = centerForHole(holeSummary.holeId);
      if (!holeCenter) {
        continue;
      }

      primitives.push({
        id: `terrain-finish-hole-balance-${holeSummary.holeId}`,
        layer: "analysis",
        geometryType: "point",
        tone: holeSummary.balanceState === "imbalanced" ? "danger" : "warning",
        label: `Hole finish ${holeSummary.balanceState}`,
        selected: false,
        interactive: false,
        entityRef: null,
        interactionTarget: null,
        renderPriority: 61,
        position: offsetPoint(holeCenter, { y: 4 }),
        radius: holeSummary.balanceState === "imbalanced" ? 5 : 4
      });
    }
  }

  if (state.overlayState.showSurfaceRuleCoverageOverlay) {
    const surfaceRuleCoverage = summarizeSurfaceRuleCoverageMapping(state);
    const activeHoleId = state.viewportState.activeHoleId;

    for (const terrainRegion of state.terrainRegions) {
      if (activeHoleId && terrainRegion.holeId !== activeHoleId) {
        continue;
      }

      const tone = surfaceRuleCoverage.conflictingRegionIds.includes(terrainRegion.terrainRegionId)
        ? "danger"
        : surfaceRuleCoverage.uncoveredRegionIds.includes(terrainRegion.terrainRegionId)
          ? "warning"
          : surfaceRuleCoverage.activeRegionIds.includes(terrainRegion.terrainRegionId)
            ? "success"
            : surfaceRuleCoverage.guardedRegionIds.includes(terrainRegion.terrainRegionId)
              ? "accent"
              : "muted";
      const label = surfaceRuleCoverage.conflictingRegionIds.includes(terrainRegion.terrainRegionId)
        ? "Rule Conflict"
        : surfaceRuleCoverage.uncoveredRegionIds.includes(terrainRegion.terrainRegionId)
          ? "Rule Coverage Gap"
          : surfaceRuleCoverage.activeRegionIds.includes(terrainRegion.terrainRegionId)
            ? "Rule Active"
            : surfaceRuleCoverage.guardedRegionIds.includes(terrainRegion.terrainRegionId)
              ? "Rule Avoidance"
              : "Rule Watch";

      primitives.push({
        id: `surface-rule-region-${terrainRegion.terrainRegionId}`,
        layer: "analysis",
        geometryType: "polygon",
        tone,
        label,
        selected: false,
        interactive: false,
        entityRef: createRef("terrain-region", terrainRegion.terrainRegionId, terrainRegion.holeId, terrainRegion.name),
        interactionTarget: null,
        renderPriority: 57,
        polygon: terrainRegion.boundary
      });
    }

    for (const holeSummary of surfaceRuleCoverage.holeSummaries) {
      if (activeHoleId && holeSummary.holeId !== activeHoleId) {
        continue;
      }
      if (holeSummary.confidenceState === "ready") {
        continue;
      }
      const holeRegions = state.terrainRegions.filter((region) => region.holeId === holeSummary.holeId);
      if (holeRegions.length === 0) {
        continue;
      }

      const center = {
        x: holeRegions.reduce((sum, region) => sum + centroidOfPolygon(region.boundary).x, 0) / holeRegions.length,
        y: holeRegions.reduce((sum, region) => sum + centroidOfPolygon(region.boundary).y, 0) / holeRegions.length,
        z: holeRegions.reduce((sum, region) => sum + centroidOfPolygon(region.boundary).z, 0) / holeRegions.length
      };

      primitives.push({
        id: `surface-rule-hole-${holeSummary.holeId}`,
        layer: "analysis",
        geometryType: "point",
        tone: holeSummary.confidenceState === "rough" ? "danger" : "warning",
        label: `Surface rules ${holeSummary.confidenceState}`,
        selected: false,
        interactive: false,
        entityRef: null,
        interactionTarget: null,
        renderPriority: 62,
        position: offsetPoint(center, { y: 3 }),
        radius: holeSummary.confidenceState === "rough" ? 5 : 4
      });
    }
  }

  if (state.overlayState.showRoutingOverlay) {
    const routingContinuity = summarizeRoutingContinuity(state);
    for (const routingSegment of state.routingSegments) {
      if (!includeRoutingHole(routingSegment.holeId)) {
        continue;
      }
      primitives.push({
        id: routingSegment.routingSegmentId,
        layer: "routing",
        geometryType: "polyline",
        tone: routingSegment.kind === "approach" ? "accent" : "default",
        label: routingSegment.kind,
        selected: selectedIds.has(routingSegment.routingSegmentId),
        interactive: true,
        entityRef: createRef("routing-segment", routingSegment.routingSegmentId, routingSegment.holeId, routingSegment.kind),
        interactionTarget: null,
        renderPriority: 26,
        polyline: routingSegment.controlLine,
        width: routingSegment.targetWidthMeters
      });
    }

    for (const routingNode of state.routingNodes) {
      if (!includeRoutingHole(routingNode.holeId)) {
        continue;
      }
      primitives.push({
        id: routingNode.routingNodeId,
        layer: "routing",
        geometryType: "point",
        tone: routingNode.kind === "preview-anchor" ? "warning" : "accent",
        label: routingNode.label,
        selected: selectedIds.has(routingNode.routingNodeId),
        interactive: true,
        entityRef: createRef("routing-node", routingNode.routingNodeId, routingNode.holeId, routingNode.kind),
        interactionTarget: {
          kind: "entity-translate",
          reference: createRef("routing-node", routingNode.routingNodeId, routingNode.holeId, routingNode.kind)
        },
        renderPriority: routingNode.kind === "preview-anchor" ? 46 : 34,
        position: routingNode.position,
        radius: routingNode.kind === "preview-anchor" ? 6 : 5
      });
    }

    const activeRoutingHoleId = state.viewportState.activeHoleId;
    for (const segmentId of routingContinuity.flaggedSegmentIds) {
      const segment = state.routingSegments.find((candidate) => candidate.routingSegmentId === segmentId);
      const midpoint = segment ? midpointOfPolyline(segment.controlLine) : null;
      if (!segment || !midpoint || (activeRoutingHoleId && segment.holeId !== activeRoutingHoleId)) {
        continue;
      }

      primitives.push({
        id: `routing-continuity-segment-${segment.routingSegmentId}`,
        layer: "analysis",
        geometryType: "point",
        tone: "warning",
        label: "Continuity Watch",
        selected: false,
        interactive: false,
        entityRef: createRef("routing-segment", segment.routingSegmentId, segment.holeId, segment.kind),
        interactionTarget: null,
        renderPriority: 29,
        position: midpoint,
        radius: 4
      });
    }

    for (const nodeId of routingContinuity.flaggedNodeIds) {
      const node = state.routingNodes.find((candidate) => candidate.routingNodeId === nodeId);
      if (!node || (activeRoutingHoleId && node.holeId !== activeRoutingHoleId)) {
        continue;
      }

      primitives.push({
        id: `routing-continuity-node-${node.routingNodeId}`,
        layer: "analysis",
        geometryType: "point",
        tone: "warning",
        label: "Elevation Watch",
        selected: false,
        interactive: false,
        entityRef: createRef("routing-node", node.routingNodeId, node.holeId, node.kind),
        interactionTarget: null,
        renderPriority: 35,
        position: offsetPoint(node.position, { y: 2 }),
        radius: 3
      });
    }

    if (routingContinuity.mergeOpportunityCount > 0) {
      for (let index = 0; index < state.routingNodes.length; index += 1) {
        const node = state.routingNodes[index]!;
        if (activeRoutingHoleId && node.holeId !== activeRoutingHoleId) {
          continue;
        }
        for (let compareIndex = index + 1; compareIndex < state.routingNodes.length; compareIndex += 1) {
          const candidate = state.routingNodes[compareIndex]!;
          if (node.holeId !== candidate.holeId || (activeRoutingHoleId && candidate.holeId !== activeRoutingHoleId)) {
            continue;
          }
          const distance = Math.hypot(
            node.position.x - candidate.position.x,
            node.position.y - candidate.position.y,
            node.position.z - candidate.position.z,
          );
          if (distance > Math.max(1.5, state.editingState.routingGuideSettings.mergeToleranceMeters * 0.7)) {
            continue;
          }

          primitives.push({
            id: `routing-merge-watch-${node.routingNodeId}-${candidate.routingNodeId}`,
            layer: "analysis",
            geometryType: "point",
            tone: routingContinuity.mergeConfidenceState === "rough" ? "danger" : "warning",
            label: "Merge Watch",
            selected: false,
            interactive: false,
            entityRef: createRef("routing-node", node.routingNodeId, node.holeId, node.kind),
            interactionTarget: null,
            renderPriority: 36,
            position: {
              x: (node.position.x + candidate.position.x) / 2,
              y: (node.position.y + candidate.position.y) / 2 + 2,
              z: (node.position.z + candidate.position.z) / 2
            },
            radius: 3
          });
        }
      }
    }

    const deliveryPath = state.routingPaths.find((path) =>
      path.routeStatus === "connected" && (!activeRoutingHoleId || path.holeId === activeRoutingHoleId),
    );
    if (deliveryPath) {
      const deliverySegments = deliveryPath.segmentIds
        .map((segmentId) => state.routingSegments.find((candidate) => candidate.routingSegmentId === segmentId) ?? null)
        .filter((segment): segment is NonNullable<typeof segment> => segment !== null);
      const deliveryCenter =
        centroidOfPolyline({
          points: deliverySegments.flatMap((segment) => segment.controlLine.points)
        }) ?? null;
      if (deliveryCenter) {
        primitives.push({
          id: `routing-delivery-confidence-${deliveryPath.routingPathId}`,
          layer: "analysis",
          geometryType: "point",
          tone:
            routingContinuity.deliveryConfidence === "ready"
              ? "success"
              : routingContinuity.deliveryConfidence === "watch"
                ? "warning"
                : "danger",
          label: `Route ${routingContinuity.deliveryConfidence}`,
          selected: false,
          interactive: false,
          entityRef: createRef("routing-path", deliveryPath.routingPathId, deliveryPath.holeId, deliveryPath.name),
          interactionTarget: null,
          renderPriority: 37,
          position: offsetPoint(deliveryCenter, { y: 3 }),
          radius: 5
        });
      }
    }

    for (const fairwayCorridor of state.fairwayCorridors) {
      if (!includeRoutingHole(fairwayCorridor.holeId)) {
        continue;
      }
      primitives.push({
        id: fairwayCorridor.fairwayCorridorId,
        layer: "routing",
        geometryType: "polyline",
        tone: "success",
        label: "Fairway Corridor",
        selected: selectedIds.has(fairwayCorridor.fairwayCorridorId),
        interactive: true,
        entityRef: createRef(
          "fairway-corridor",
          fairwayCorridor.fairwayCorridorId,
          fairwayCorridor.holeId,
          fairwayCorridor.note,
        ),
        interactionTarget: null,
        renderPriority: 24,
        polyline: fairwayCorridor.centerline,
        width: fairwayCorridor.averageWidthMeters
      });
    }

    for (const visibilityCorridor of state.visibilityCorridors) {
      if (!includeRoutingHole(visibilityCorridor.holeId)) {
        continue;
      }
      primitives.push({
        id: visibilityCorridor.visibilityCorridorId,
        layer: "routing",
        geometryType: "polyline",
        tone: visibilityCorridor.blockedSceneObjectIds.length > 0 ? "danger" : "accent",
        label: "Sightline Corridor",
        selected: selectedIds.has(visibilityCorridor.visibilityCorridorId),
        interactive: true,
        entityRef: createRef(
          "visibility-corridor",
          visibilityCorridor.visibilityCorridorId,
          visibilityCorridor.holeId,
          visibilityCorridor.note,
        ),
        interactionTarget: null,
        renderPriority: 22,
        polyline: visibilityCorridor.corridorLine,
        width: visibilityCorridor.minimumWidthMeters
      });
    }

    for (const playRouteEnvelope of state.playRouteEnvelopes) {
      if (!includeRoutingHole(playRouteEnvelope.holeId)) {
        continue;
      }
      primitives.push({
        id: playRouteEnvelope.playRouteEnvelopeId,
        layer: "routing",
        geometryType: "polygon",
        tone:
          playRouteEnvelope.blockedSceneObjectIds.length > 0 || playRouteEnvelope.blockedZoneIds.length > 0
            ? "danger"
            : "muted",
        label: "Play Route Envelope",
        selected: selectedIds.has(playRouteEnvelope.playRouteEnvelopeId),
        interactive: true,
        entityRef: createRef(
          "play-route-envelope",
          playRouteEnvelope.playRouteEnvelopeId,
          playRouteEnvelope.holeId,
          playRouteEnvelope.note,
        ),
        interactionTarget: {
          kind: "entity-scale",
          reference: createRef(
            "play-route-envelope",
            playRouteEnvelope.playRouteEnvelopeId,
            playRouteEnvelope.holeId,
            playRouteEnvelope.note,
          )
        },
        renderPriority: 21,
        polygon: playRouteEnvelope.boundary
      });
    }
  }

  if (state.overlayState.showSimulatorAnchorsOverlay) {
    for (const teeZone of state.teeZones) {
      primitives.push({
        id: teeZone.teeZoneId,
        layer: "simulator",
        geometryType: "polygon",
        tone: "success",
        label: "Tee Zone",
        selected: selectedIds.has(teeZone.teeZoneId),
        interactive: true,
        entityRef: createRef("tee-zone", teeZone.teeZoneId, teeZone.holeId, teeZone.note),
        interactionTarget: {
          kind: "entity-translate",
          reference: createRef("tee-zone", teeZone.teeZoneId, teeZone.holeId, teeZone.note)
        },
        renderPriority: 44,
        polygon: teeZone.boundary
      });
    }

    for (const greenZone of state.greenZones) {
      primitives.push({
        id: greenZone.greenZoneId,
        layer: "simulator",
        geometryType: "polygon",
        tone: "accent",
        label: "Green Zone",
        selected: selectedIds.has(greenZone.greenZoneId),
        interactive: true,
        entityRef: createRef("green-zone", greenZone.greenZoneId, greenZone.holeId, greenZone.note),
        interactionTarget: {
          kind: "entity-translate",
          reference: createRef("green-zone", greenZone.greenZoneId, greenZone.holeId, greenZone.note)
        },
        renderPriority: 43,
        polygon: greenZone.boundary
      });
    }

    for (const hazardZone of state.hazardZones) {
      primitives.push({
        id: hazardZone.hazardZoneId,
        layer: "simulator",
        geometryType: "polygon",
        tone: "warning",
        label: hazardZone.hazardLabel,
        selected: selectedIds.has(hazardZone.hazardZoneId),
        interactive: true,
        entityRef: createRef("hazard-zone", hazardZone.hazardZoneId, hazardZone.holeId, hazardZone.note),
        interactionTarget: {
          kind: "entity-translate",
          reference: createRef("hazard-zone", hazardZone.hazardZoneId, hazardZone.holeId, hazardZone.note)
        },
        renderPriority: 41,
        polygon: hazardZone.boundary
      });
    }

    for (const outOfBoundsZone of state.outOfBoundsZones) {
      primitives.push({
        id: outOfBoundsZone.outOfBoundsZoneId,
        layer: "simulator",
        geometryType: "polygon",
        tone: "danger",
        label: outOfBoundsZone.sideLabel,
        selected: selectedIds.has(outOfBoundsZone.outOfBoundsZoneId),
        interactive: true,
        entityRef: createRef(
          "out-of-bounds-zone",
          outOfBoundsZone.outOfBoundsZoneId,
          outOfBoundsZone.holeId,
          outOfBoundsZone.note,
        ),
        interactionTarget: {
          kind: "entity-translate",
          reference: createRef(
            "out-of-bounds-zone",
            outOfBoundsZone.outOfBoundsZoneId,
            outOfBoundsZone.holeId,
            outOfBoundsZone.note,
          )
        },
        renderPriority: 45,
        polygon: outOfBoundsZone.boundary
      });
    }

    for (const dropZoneArea of state.dropZoneAreas) {
      primitives.push({
        id: dropZoneArea.dropZoneAreaId,
        layer: "simulator",
        geometryType: "polygon",
        tone: "accent",
        label: "Drop Zone",
        selected: selectedIds.has(dropZoneArea.dropZoneAreaId),
        interactive: true,
        entityRef: createRef("drop-zone-area", dropZoneArea.dropZoneAreaId, dropZoneArea.holeId, dropZoneArea.note),
        interactionTarget: {
          kind: "entity-translate",
          reference: createRef("drop-zone-area", dropZoneArea.dropZoneAreaId, dropZoneArea.holeId, dropZoneArea.note)
        },
        renderPriority: 42,
        polygon: dropZoneArea.boundary
      });
    }
  }

  if (state.editingState.authoringPreview.visible && state.editingState.authoringPreview.worldPoint) {
    const preview = state.editingState.authoringPreview;
    const previewCenter = preview.worldPoint as Vector3;
    const previewRadius = Math.max(2, preview.previewRadiusMeters);

    if (preview.mode === "placement" && preview.draft) {
      primitives.push(
        {
          id: "preview-placement-footprint",
          layer: "analysis",
          geometryType: "polygon",
          tone: "accent",
          label: preview.label ?? `Preview ${preview.draft.label}`,
          selected: true,
          interactive: false,
          entityRef: null,
          interactionTarget: null,
          renderPriority: 65,
          polygon: createCircularPolygon(previewCenter, previewRadius, 16)
        },
        {
          id: "preview-placement-anchor",
          layer: "analysis",
          geometryType: "point",
          tone: "accent",
          label: preview.draft.label,
          selected: true,
          interactive: false,
          entityRef: null,
          interactionTarget: null,
          renderPriority: 66,
          position: previewCenter,
          radius: 7
        }
      );
    }

    if (preview.mode === "scenery-brush") {
      primitives.push({
        id: "preview-brush-footprint",
        layer: "analysis",
        geometryType: "polygon",
        tone: "success",
        label: preview.label ?? "Scenery brush footprint",
        selected: true,
        interactive: false,
        entityRef: null,
        interactionTarget: null,
        renderPriority: 65,
        polygon: createCircularPolygon(previewCenter, previewRadius, 20)
      });

      const ghostPoints = createBrushPreviewGhostPoints(
        previewCenter,
        previewRadius,
        preview.previewDensity,
        `${preview.label ?? "brush"}-${preview.activeCategory ?? "mixed"}`,
      );

      for (const [index, ghostPoint] of ghostPoints.entries()) {
        primitives.push({
          id: `preview-brush-ghost-${index}`,
          layer: "analysis",
          geometryType: "point",
          tone: preview.activeCategory === "vegetation" ? "success" : "muted",
          label: preview.label ?? "Brush preview",
          selected: false,
          interactive: false,
          entityRef: null,
          interactionTarget: null,
          renderPriority: 66,
          position: ghostPoint,
          radius: 4
        });
      }
    }

    if (preview.mode === "terrain-finish") {
      const activeMaterial = preview.terrainMaterialId
        ? state.terrainMaterialPalette.find((material) => material.terrainMaterialId === preview.terrainMaterialId) ?? null
        : null;
      const previewTone =
        activeMaterial?.stackRole === "detail"
          ? "warning"
          : activeMaterial?.stackRole === "accent"
            ? "accent"
            : "success";

      primitives.push(
        {
          id: "preview-terrain-finish-footprint",
          layer: "analysis",
          geometryType: "polygon",
          tone: previewTone,
          label: preview.label ?? "Terrain finish preview",
          selected: true,
          interactive: false,
          entityRef: null,
          interactionTarget: null,
          renderPriority: 65,
          polygon: createCircularPolygon(previewCenter, previewRadius, 18)
        },
        {
          id: "preview-terrain-finish-anchor",
          layer: "analysis",
          geometryType: "point",
          tone: previewTone,
          label: activeMaterial?.label ?? "Terrain finish",
          selected: true,
          interactive: false,
          entityRef: null,
          interactionTarget: null,
          renderPriority: 66,
          position: previewCenter,
          radius: 5
        }
      );
    }
  }

  if (state.overlayState.showValidationOverlay && options?.analysisReport) {
    const analysisMarkers = [
      ...options.analysisReport.blockedLineOfPlayIssues.map((issue) => ({
        id: `analysis-route-${issue.playRouteEnvelopeId}`,
        tone: "danger" as RendererPrimitiveTone,
        ref: createRef("play-route-envelope", issue.playRouteEnvelopeId, issue.holeId, "Blocked line of play")
      })),
      ...options.analysisReport.sightlineQualityIssues
        .filter((issue) => issue.visibilityCorridorId)
        .map((issue) => ({
          id: `analysis-sightline-${issue.visibilityCorridorId}`,
          tone: issue.severity === "critical" ? "danger" as RendererPrimitiveTone : "warning" as RendererPrimitiveTone,
          ref: createRef(
            "visibility-corridor",
            issue.visibilityCorridorId!,
            issue.holeId,
            issue.reason,
          )
        })),
      ...options.analysisReport.simulatorAnchorConflicts.flatMap((issue) => {
        const matchingBinding = options.simulatorGeometry?.previewAnchorBindings?.find(
          (binding) => binding.previewAnchorBindingId === issue.bindingId,
        );

        return matchingBinding?.anchorRef
          ? [
              {
                id: `analysis-anchor-${issue.bindingId}`,
                tone: issue.severity === "critical" ? "danger" as RendererPrimitiveTone : "warning" as RendererPrimitiveTone,
                ref: matchingBinding.anchorRef
              }
            ]
          : [];
      })
    ];

    for (const marker of analysisMarkers) {
      const position = resolveReferencePosition(state, marker.ref);
      if (!position) {
        continue;
      }

      primitives.push({
        id: marker.id,
        layer: "analysis",
        geometryType: "point",
        tone: marker.tone,
        label: marker.ref.note,
        selected: false,
        interactive: false,
        entityRef: marker.ref,
        interactionTarget: null,
        renderPriority: 60,
        position,
        radius: 7
      });
    }
  }

  const selectedSceneObject = state.sceneObjects.find((sceneObject) =>
    state.selectionState.selectedObjectIds.includes(sceneObject.sceneObjectId),
  );
  if (selectedSceneObject) {
    addTransformGizmo(
      primitives,
      createRef("scene-object", selectedSceneObject.sceneObjectId, selectedSceneObject.binding?.entityId ?? null, selectedSceneObject.objectType),
      selectedSceneObject.transform.position,
    );
  }

  for (const selectedSpatialReference of state.selectionState.selectedSpatialEntityRefs) {
    if (
      [
        "terrain-region",
        "tee-zone",
        "green-zone",
        "hazard-zone",
        "out-of-bounds-zone",
        "drop-zone-area"
      ].includes(selectedSpatialReference.entityType)
    ) {
      const position = resolveReferencePosition(state, selectedSpatialReference);
      if (position) {
        addTransformGizmo(primitives, selectedSpatialReference, position);
      }
    }

    if (selectedSpatialReference.entityType === "routing-segment") {
      const segment = state.routingSegments.find(
        (candidate) => candidate.routingSegmentId === selectedSpatialReference.entityId,
      );
      const midpoint = segment ? midpointOfPolyline(segment.controlLine) : null;
      if (segment && midpoint) {
        primitives.push({
          id: `gizmo-routing-bend-${segment.routingSegmentId}`,
          layer: "analysis",
          geometryType: "point",
          tone: "accent",
          label: "Route Bend",
          selected: true,
          interactive: true,
          entityRef: selectedSpatialReference,
          interactionTarget: {
            kind: "routing-bend",
            reference: selectedSpatialReference,
            routingSegmentId: segment.routingSegmentId
          },
          renderPriority: 61,
          position: midpoint,
          radius: 6
        },
        {
          id: `gizmo-routing-width-${segment.routingSegmentId}`,
          layer: "analysis",
          geometryType: "point",
          tone: "warning",
          label: "Route Width",
          selected: true,
          interactive: true,
          entityRef: selectedSpatialReference,
          interactionTarget: {
            kind: "routing-width",
            reference: selectedSpatialReference,
            routingSegmentId: segment.routingSegmentId
          },
          renderPriority: 62,
          position: offsetPoint(midpoint, { z: segment.targetWidthMeters / 2 }),
          radius: 5
        });
      }
    }

    if (selectedSpatialReference.entityType === "routing-node") {
      const node = state.routingNodes.find((candidate) => candidate.routingNodeId === selectedSpatialReference.entityId);
      if (node) {
        primitives.push({
          id: `gizmo-routing-height-${node.routingNodeId}`,
          layer: "analysis",
          geometryType: "point",
          tone: "warning",
          label: "Working Height",
          selected: true,
          interactive: true,
          entityRef: selectedSpatialReference,
          interactionTarget: {
            kind: "routing-height",
            reference: selectedSpatialReference,
            routingNodeId: node.routingNodeId
          },
          renderPriority: 62,
          position: offsetPoint(node.position, {
            y: Math.max(4, Math.abs(node.position.y) + 10)
          }),
          radius: 5
        });

        const mergeCandidate =
          state.editingState.routingGuideSettings.autoMergeEnabled
            ? state.routingNodes
                .filter(
                  (candidate) =>
                    candidate.routingNodeId !== node.routingNodeId &&
                    candidate.holeId === node.holeId &&
                    planarDistance(candidate.position, node.position) <=
                      state.editingState.routingGuideSettings.mergeToleranceMeters,
                )
                .sort(
                  (left, right) =>
                    planarDistance(left.position, node.position) - planarDistance(right.position, node.position),
                )[0] ?? null
            : null;

        if (mergeCandidate) {
          primitives.push({
            id: `gizmo-routing-merge-${node.routingNodeId}-${mergeCandidate.routingNodeId}`,
            layer: "analysis",
            geometryType: "point",
            tone: "success",
            label: `Merge into ${mergeCandidate.label}`,
            selected: true,
            interactive: false,
            entityRef: selectedSpatialReference,
            interactionTarget: null,
            renderPriority: 63,
            position: mergeCandidate.position,
            radius: 6
          });
        }
      }
    }

    if (selectedSpatialReference.entityType === "fairway-corridor") {
      const corridor = state.fairwayCorridors.find(
        (candidate) => candidate.fairwayCorridorId === selectedSpatialReference.entityId,
      );
      const midpoint = corridor ? midpointOfPolyline(corridor.centerline) : null;
      if (corridor && midpoint) {
        primitives.push(
          {
            id: `gizmo-corridor-bend-${corridor.fairwayCorridorId}`,
            layer: "analysis",
            geometryType: "point",
            tone: "success",
            label: "Refine Corridor",
            selected: true,
            interactive: true,
            entityRef: selectedSpatialReference,
            interactionTarget: {
              kind: "corridor-bend",
              reference: selectedSpatialReference,
              corridorId: corridor.fairwayCorridorId
            },
            renderPriority: 61,
            position: midpoint,
            radius: 6
          },
          {
            id: `gizmo-corridor-width-${corridor.fairwayCorridorId}`,
            layer: "analysis",
            geometryType: "point",
            tone: "warning",
            label: "Corridor Width",
            selected: true,
            interactive: true,
            entityRef: selectedSpatialReference,
            interactionTarget: {
              kind: "corridor-width",
              reference: selectedSpatialReference,
              corridorId: corridor.fairwayCorridorId
            },
            renderPriority: 62,
            position: offsetPoint(midpoint, { z: corridor.averageWidthMeters / 2 }),
            radius: 5
          }
        );
      }
    }

    if (selectedSpatialReference.entityType === "visibility-corridor") {
      const corridor = state.visibilityCorridors.find(
        (candidate) => candidate.visibilityCorridorId === selectedSpatialReference.entityId,
      );
      const midpoint = corridor ? midpointOfPolyline(corridor.corridorLine) : null;
      if (corridor && midpoint) {
        primitives.push({
          id: `gizmo-visibility-width-${corridor.visibilityCorridorId}`,
          layer: "analysis",
          geometryType: "point",
          tone: "warning",
          label: "Sightline Width",
          selected: true,
          interactive: true,
          entityRef: selectedSpatialReference,
          interactionTarget: {
            kind: "visibility-width",
            reference: selectedSpatialReference,
            corridorId: corridor.visibilityCorridorId
          },
          renderPriority: 62,
          position: offsetPoint(midpoint, { z: corridor.minimumWidthMeters / 2 }),
          radius: 5
        });
      }
    }
  }

  const sceneBounds = mergeBounds(primitives.map((primitive) => primitiveBounds(primitive)));
  const overlays = createOverlays(state, options?.analysisReport);
  const renderPasses = createRenderPasses(primitives);
  const activeTargetReference =
    state.selectionState.hoveredSpatialEntityRef ??
    state.selectionState.selectedSpatialEntityRefs[0] ??
    (state.selectionState.selectedObjectIds[0]
      ? createRef("scene-object", state.selectionState.selectedObjectIds[0]!, null, "Selected object")
      : null);
  const activeTargetPosition = activeTargetReference
    ? resolveReferencePosition(state, activeTargetReference)
    : null;

  return {
    rendererMode: state.viewportState.rendererMode,
    backendStatus: state.viewportState.backendStatus,
    projectionMode: state.viewportState.projectionMode,
    camera: state.viewportState.camera,
    activeHoleId: state.viewportState.activeHoleId,
    primitives,
    selectedEntityIds: [...selectedIds],
    hoveredEntityId:
      state.selectionState.hoveredSpatialEntityRef?.entityId ?? state.selectionState.hoveredObjectId ?? null,
    sceneBounds,
    overlays,
    renderPasses,
    runtimeStatus: {
      fidelity:
        state.viewportState.backendStatus === "connected"
          ? state.viewportState.rendererMode === "renderer-backed"
            ? "high-fidelity-path"
            : "connected"
          : "scaffolded",
      qualityTier:
        state.viewportState.rendererMode === "renderer-backed" && state.viewportState.backendStatus === "connected"
          ? state.viewportState.projectionMode === "cinematic" || state.viewportState.projectionMode === "orbit"
            ? "native-ready"
            : "high-fidelity-bridge"
          : "preview-canvas",
      primitiveCount: primitives.length,
      interactivePrimitiveCount: primitives.filter((primitive) => primitive.interactive).length,
      selectedEntityCount: selectedIds.size,
      activeOverlayCount: overlays.filter((overlay) => overlay.active).length,
      highPriorityIssueCount:
        (options?.analysisReport?.blockedLineOfPlayIssues.filter((issue) => issue.severity === "critical").length ??
          0) +
        (options?.analysisReport?.collisionConflicts.filter((issue) => issue.severity === "critical").length ??
          0) +
        (options?.analysisReport?.simulatorAnchorConflicts.filter((issue) => issue.severity === "critical").length ??
          0),
      activeTargetLabel: activeTargetReference?.note ?? null,
      activeTargetPosition,
      previewMode: state.editingState.authoringPreview.visible
        ? state.editingState.authoringPreview.mode
        : "idle",
      previewLabel: state.editingState.authoringPreview.visible
        ? state.editingState.authoringPreview.label
        : null
    }
  };
}
