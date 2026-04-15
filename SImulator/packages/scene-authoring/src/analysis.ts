import type {
  SceneAuthoringState,
  SceneObject,
  SceneSpatialReference,
  SpatialPolygon,
  SpatialPolyline,
  Vector3
} from "./models";
import { findBlockedPlayRouteConflicts, findRoutingGaps } from "./services";

export type SpatialAnalysisSeverity = "warning" | "high" | "critical";

export type BlockedLineOfPlayIssue = {
  holeId: string;
  playRouteEnvelopeId: string;
  blockingSceneObjectIds: string[];
  blockedZoneIds: string[];
  severity: SpatialAnalysisSeverity;
};

export type SightlineQualityIssue = {
  holeId: string;
  visibilityCorridorId: string | null;
  severity: SpatialAnalysisSeverity;
  reason: string;
  blockingSceneObjectIds: string[];
};

export type RouteDiscontinuityIssue = {
  holeId: string;
  severity: SpatialAnalysisSeverity;
  reason: string;
};

export type CollisionConflict = {
  leftRef: SceneSpatialReference;
  rightRef: SceneSpatialReference;
  severity: SpatialAnalysisSeverity;
  reason: string;
};

export type LandingZoneObstructionRisk = {
  holeId: string;
  fairwayCorridorId: string;
  severity: SpatialAnalysisSeverity;
  obstructingSceneObjectIds: string[];
  reason: string;
};

export type OcclusionRisk = {
  holeId: string;
  visibilityCorridorId: string | null;
  severity: SpatialAnalysisSeverity;
  blockingSceneObjectIds: string[];
  reason: string;
};

export type SimulatorAnchorConflict = {
  holeId: string;
  bindingId: string;
  bindingType: "tee" | "pin" | "hazard" | "ob" | "drop-zone" | "preview";
  severity: SpatialAnalysisSeverity;
  reason: string;
};

export type PreviewFramingWeakness = {
  holeId: string;
  role: "minimap" | "flyover";
  severity: SpatialAnalysisSeverity;
  reason: string;
};

export type SpatialAnalysisReport = {
  blockedLineOfPlayIssues: BlockedLineOfPlayIssue[];
  sightlineQualityIssues: SightlineQualityIssue[];
  routeDiscontinuities: RouteDiscontinuityIssue[];
  collisionConflicts: CollisionConflict[];
  invalidOverlapConditions: CollisionConflict[];
  landingZoneObstructionRisks: LandingZoneObstructionRisk[];
  occlusionRisks: OcclusionRisk[];
  simulatorAnchorConflicts: SimulatorAnchorConflict[];
  previewFramingWeaknesses: PreviewFramingWeakness[];
};

export type SimulatorGeometryLike = {
  teeSpatialBindings?: Array<{
    teeSpatialBindingId: string;
    holeId: string;
    readinessState: string;
    teeZoneRef: SceneSpatialReference | null;
    sceneObjectRef: SceneSpatialReference | null;
    positionHint: Vector3 | null;
  }>;
  pinSpatialBindings?: Array<{
    pinSpatialBindingId: string;
    holeId: string;
    readinessState: string;
    greenZoneRef: SceneSpatialReference | null;
    sceneObjectRef: SceneSpatialReference | null;
    positionHint: Vector3 | null;
  }>;
  hazardSpatialBindings?: Array<{
    hazardSpatialBindingId: string;
    holeId: string;
    readinessState: string;
    hazardZoneRef: SceneSpatialReference | null;
  }>;
  outOfBoundsSpatialBindings?: Array<{
    outOfBoundsSpatialBindingId: string;
    holeId: string;
    readinessState: string;
    boundaryRefs: SceneSpatialReference[];
  }>;
  dropZoneSpatialBindings?: Array<{
    dropZoneSpatialBindingId: string;
    holeId: string;
    readinessState: string;
    dropZoneAreaRef: SceneSpatialReference | null;
  }>;
  previewAnchorBindings?: Array<{
    previewAnchorBindingId: string;
    holeId: string;
    role: string;
    readinessState: string;
    anchorRef: SceneSpatialReference | null;
  }>;
  minimapMetadata?: Array<{
    holeId: string;
    frameAnchorRef: SceneSpatialReference | null;
    northReferenceAnchorRef: SceneSpatialReference | null;
  }>;
  flyoverMetadata?: Array<{
    holeId: string;
    startAnchorRef: SceneSpatialReference | null;
    apexAnchorRef: SceneSpatialReference | null;
    endAnchorRef: SceneSpatialReference | null;
  }>;
};

type BoundingBox = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

function bboxForPolygon(boundary: SpatialPolygon): BoundingBox {
  const xs = boundary.points.map((point) => point.x);
  const zs = boundary.points.map((point) => point.z);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs)
  };
}

function bboxForSceneObject(sceneObject: SceneObject): BoundingBox {
  const halfWidth = Math.max(3, Math.abs(sceneObject.transform.scale.x) * 2);
  const halfDepth = Math.max(3, Math.abs(sceneObject.transform.scale.z) * 2);

  return {
    minX: sceneObject.transform.position.x - halfWidth,
    maxX: sceneObject.transform.position.x + halfWidth,
    minZ: sceneObject.transform.position.z - halfDepth,
    maxZ: sceneObject.transform.position.z + halfDepth
  };
}

function centroidOfPolygon(polygon: SpatialPolygon): Vector3 {
  const pointCount = polygon.points.length || 1;
  const total = polygon.points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x,
      y: accumulator.y + point.y,
      z: accumulator.z + point.z
    }),
    { x: 0, y: 0, z: 0 },
  );

  return {
    x: total.x / pointCount,
    y: total.y / pointCount,
    z: total.z / pointCount
  };
}

function boxesOverlap(left: BoundingBox, right: BoundingBox) {
  return left.minX <= right.maxX && left.maxX >= right.minX && left.minZ <= right.maxZ && left.maxZ >= right.minZ;
}

function pointInPolygon(point: Vector3, polygon: SpatialPolygon) {
  let inside = false;

  for (let index = 0, nextIndex = polygon.points.length - 1; index < polygon.points.length; nextIndex = index++) {
    const current = polygon.points[index]!;
    const previous = polygon.points[nextIndex]!;
    const intersects =
      current.z > point.z !== previous.z > point.z &&
      point.x <
        ((previous.x - current.x) * (point.z - current.z)) / (previous.z - current.z || 1e-6) +
          current.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function distancePointToSegment(point: Vector3, start: Vector3, end: Vector3) {
  const deltaX = end.x - start.x;
  const deltaZ = end.z - start.z;
  const lengthSquared = deltaX * deltaX + deltaZ * deltaZ;
  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.z - start.z);
  }

  const projection =
    ((point.x - start.x) * deltaX + (point.z - start.z) * deltaZ) / lengthSquared;
  const t = Math.max(0, Math.min(1, projection));
  const projectedX = start.x + deltaX * t;
  const projectedZ = start.z + deltaZ * t;
  return Math.hypot(point.x - projectedX, point.z - projectedZ);
}

function distancePointToPolyline(point: Vector3, line: SpatialPolyline) {
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < line.points.length - 1; index += 1) {
    const nextDistance = distancePointToSegment(point, line.points[index]!, line.points[index + 1]!);
    bestDistance = Math.min(bestDistance, nextDistance);
  }

  return bestDistance;
}

function midpointOfPolyline(line: SpatialPolyline) {
  return line.points[Math.floor(line.points.length / 2)] ?? line.points[0] ?? null;
}

function polylineLength(line: SpatialPolyline) {
  let total = 0;
  for (let index = 0; index < line.points.length - 1; index += 1) {
    total += Math.hypot(
      line.points[index + 1]!.x - line.points[index]!.x,
      line.points[index + 1]!.z - line.points[index]!.z,
    );
  }
  return total;
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

function resolveReferencePosition(
  state: SceneAuthoringState,
  reference: SceneSpatialReference,
): Vector3 | null {
  switch (reference.entityType) {
    case "scene-object":
      return state.sceneObjects.find((sceneObject) => sceneObject.sceneObjectId === reference.entityId)?.transform.position ?? null;
    case "routing-node":
      return state.routingNodes.find((routingNode) => routingNode.routingNodeId === reference.entityId)?.position ?? null;
    case "routing-segment": {
      const segment = state.routingSegments.find((candidate) => candidate.routingSegmentId === reference.entityId);
      return segment ? midpointOfPolyline(segment.controlLine) : null;
    }
    case "terrain-region":
      return state.terrainRegions.find((region) => region.terrainRegionId === reference.entityId)
        ? centroidOfPolygon(
            state.terrainRegions.find((region) => region.terrainRegionId === reference.entityId)!.boundary,
          )
        : null;
    case "tee-zone":
      return state.teeZones.find((zone) => zone.teeZoneId === reference.entityId)
        ? centroidOfPolygon(state.teeZones.find((zone) => zone.teeZoneId === reference.entityId)!.boundary)
        : null;
    case "green-zone":
      return state.greenZones.find((zone) => zone.greenZoneId === reference.entityId)
        ? centroidOfPolygon(state.greenZones.find((zone) => zone.greenZoneId === reference.entityId)!.boundary)
        : null;
    case "hazard-zone":
      return state.hazardZones.find((zone) => zone.hazardZoneId === reference.entityId)
        ? centroidOfPolygon(state.hazardZones.find((zone) => zone.hazardZoneId === reference.entityId)!.boundary)
        : null;
    case "out-of-bounds-zone":
      return state.outOfBoundsZones.find((zone) => zone.outOfBoundsZoneId === reference.entityId)
        ? centroidOfPolygon(
            state.outOfBoundsZones.find((zone) => zone.outOfBoundsZoneId === reference.entityId)!.boundary,
          )
        : null;
    case "drop-zone-area":
      return state.dropZoneAreas.find((zone) => zone.dropZoneAreaId === reference.entityId)
        ? centroidOfPolygon(state.dropZoneAreas.find((zone) => zone.dropZoneAreaId === reference.entityId)!.boundary)
        : null;
    default:
      return null;
  }
}

export function analyzeBlockedLineOfPlay(state: SceneAuthoringState): BlockedLineOfPlayIssue[] {
  const explicitConflicts = findBlockedPlayRouteConflicts(state).map((conflict) => ({
    ...conflict,
    severity: conflict.blockingSceneObjectIds.length > 0 ? "critical" : "high" as SpatialAnalysisSeverity
  }));

  const implicitConflicts = state.playRouteEnvelopes.flatMap((envelope) => {
    const blockingSceneObjectIds = state.sceneObjects
      .filter(
        (sceneObject) =>
          sceneObject.visible &&
          ["structure", "prop", "landmark", "animated-set-piece"].includes(sceneObject.category) &&
          pointInPolygon(sceneObject.transform.position, envelope.boundary),
      )
      .map((sceneObject) => sceneObject.sceneObjectId);

    if (blockingSceneObjectIds.length === 0) {
      return [];
    }

    return [
      {
        holeId: envelope.holeId,
        playRouteEnvelopeId: envelope.playRouteEnvelopeId,
        blockingSceneObjectIds,
        blockedZoneIds: envelope.blockedZoneIds,
        severity: "high" as SpatialAnalysisSeverity
      }
    ];
  });

  return [...explicitConflicts, ...implicitConflicts];
}

export function analyzeSightlineQuality(state: SceneAuthoringState): SightlineQualityIssue[] {
  return state.routingPaths.flatMap<SightlineQualityIssue>((routingPath) => {
    const visibilityCorridor =
      state.visibilityCorridors.find((candidate) => candidate.holeId === routingPath.holeId) ?? null;

    if (!visibilityCorridor) {
      return [
        {
          holeId: routingPath.holeId,
          visibilityCorridorId: null,
          severity: "high" as SpatialAnalysisSeverity,
          reason: "No visibility corridor exists for the routed hole.",
          blockingSceneObjectIds: []
        }
      ];
    }

    const nearCorridorBlockingIds = state.sceneObjects
      .filter(
        (sceneObject) =>
          sceneObject.visible &&
          ["structure", "landmark", "animated-set-piece", "prop"].includes(sceneObject.category) &&
          distancePointToPolyline(sceneObject.transform.position, visibilityCorridor.corridorLine) <=
            visibilityCorridor.minimumWidthMeters / 2 + 3,
      )
      .map((sceneObject) => sceneObject.sceneObjectId);

    const blockingSceneObjectIds = Array.from(
      new Set([...visibilityCorridor.blockedSceneObjectIds, ...nearCorridorBlockingIds]),
    );

    if (blockingSceneObjectIds.length > 0) {
      return [
        {
          holeId: routingPath.holeId,
          visibilityCorridorId: visibilityCorridor.visibilityCorridorId,
          severity: "critical" as SpatialAnalysisSeverity,
          reason: "Blocking geometry is registered inside or too close to the visibility corridor.",
          blockingSceneObjectIds
        }
      ];
    }

    if (visibilityCorridor.minimumWidthMeters < 10) {
      return [
        {
          holeId: routingPath.holeId,
          visibilityCorridorId: visibilityCorridor.visibilityCorridorId,
          severity: "high" as SpatialAnalysisSeverity,
          reason: "The visibility corridor is critically narrow for reliable shot readability.",
          blockingSceneObjectIds: []
        }
      ];
    }

    if (visibilityCorridor.minimumWidthMeters < 14 || polylineLength(visibilityCorridor.corridorLine) < 24) {
      return [
        {
          holeId: routingPath.holeId,
          visibilityCorridorId: visibilityCorridor.visibilityCorridorId,
          severity: "warning" as SpatialAnalysisSeverity,
          reason: "The visibility corridor is narrow or too short to provide a confident shot read.",
          blockingSceneObjectIds: []
        }
      ];
    }

    return [];
  });
}

export function analyzeRouteDiscontinuities(state: SceneAuthoringState): RouteDiscontinuityIssue[] {
  return findRoutingGaps(
    state,
    state.routingPaths.map((routingPath) => routingPath.holeId),
  ).map((gap) => ({
    holeId: gap.holeId,
    severity: "critical" as SpatialAnalysisSeverity,
    reason: gap.reason
  }));
}

export function analyzeCollisionConflicts(state: SceneAuthoringState): CollisionConflict[] {
  const conflicts: CollisionConflict[] = [];

  for (const greenZone of state.greenZones) {
    const greenBox = bboxForPolygon(greenZone.boundary);

    for (const hazardZone of state.hazardZones.filter((zone) => zone.holeId === greenZone.holeId)) {
      if (boxesOverlap(greenBox, bboxForPolygon(hazardZone.boundary))) {
        conflicts.push({
          leftRef: createRef("green-zone", greenZone.greenZoneId, greenZone.holeId, greenZone.note),
          rightRef: createRef("hazard-zone", hazardZone.hazardZoneId, hazardZone.holeId, hazardZone.note),
          severity: "high",
          reason: "Green target overlaps hazard geometry."
        });
      }
    }

    for (const outOfBoundsZone of state.outOfBoundsZones.filter((zone) => zone.holeId === greenZone.holeId)) {
      if (boxesOverlap(greenBox, bboxForPolygon(outOfBoundsZone.boundary))) {
        conflicts.push({
          leftRef: createRef("green-zone", greenZone.greenZoneId, greenZone.holeId, greenZone.note),
          rightRef: createRef(
            "out-of-bounds-zone",
            outOfBoundsZone.outOfBoundsZoneId,
            outOfBoundsZone.holeId,
            outOfBoundsZone.note,
          ),
          severity: "critical",
          reason: "Green target overlaps an enforced OB boundary."
        });
      }
    }
  }

  for (const teeZone of state.teeZones) {
    const teeBox = bboxForPolygon(teeZone.boundary);
    for (const hazardZone of state.hazardZones.filter((zone) => zone.holeId === teeZone.holeId)) {
      if (boxesOverlap(teeBox, bboxForPolygon(hazardZone.boundary))) {
        conflicts.push({
          leftRef: createRef("tee-zone", teeZone.teeZoneId, teeZone.holeId, teeZone.note),
          rightRef: createRef("hazard-zone", hazardZone.hazardZoneId, hazardZone.holeId, hazardZone.note),
          severity: "high",
          reason: "Tee zone overlaps a hazard zone."
        });
      }
    }

    for (const sceneObject of state.sceneObjects.filter((candidate) => candidate.visible && candidate.category === "structure")) {
      if (boxesOverlap(teeBox, bboxForSceneObject(sceneObject))) {
        conflicts.push({
          leftRef: createRef("tee-zone", teeZone.teeZoneId, teeZone.holeId, teeZone.note),
          rightRef: createRef("scene-object", sceneObject.sceneObjectId, teeZone.holeId, sceneObject.name),
          severity: "high",
          reason: "Tee zone overlaps a blocking structure."
        });
      }
    }
  }

  for (const dropZoneArea of state.dropZoneAreas) {
    const dropZoneBox = bboxForPolygon(dropZoneArea.boundary);

    for (const sceneObject of state.sceneObjects.filter(
      (candidate) => candidate.visible && ["structure", "landmark", "animated-set-piece"].includes(candidate.category),
    )) {
      if (boxesOverlap(dropZoneBox, bboxForSceneObject(sceneObject))) {
        conflicts.push({
          leftRef: createRef("drop-zone-area", dropZoneArea.dropZoneAreaId, dropZoneArea.holeId, dropZoneArea.note),
          rightRef: createRef("scene-object", sceneObject.sceneObjectId, dropZoneArea.holeId, sceneObject.name),
          severity: "high",
          reason: "Drop-zone recovery space overlaps blocking scene geometry."
        });
      }
    }
  }

  return conflicts;
}

export function analyzeLandingZoneObstructionRisks(state: SceneAuthoringState): LandingZoneObstructionRisk[] {
  return state.fairwayCorridors.flatMap((corridor) => {
    const midpointIndex = Math.max(0, Math.floor(corridor.centerline.points.length / 2) - 1);
    const midpoint = corridor.centerline.points[midpointIndex] ?? corridor.centerline.points[0];
    if (!midpoint) {
      return [];
    }

    const obstructingSceneObjectIds = state.sceneObjects
      .filter(
        (sceneObject) =>
          sceneObject.visible &&
          ["structure", "prop", "landmark", "animated-set-piece"].includes(sceneObject.category) &&
          distancePointToPolyline(sceneObject.transform.position, corridor.centerline) <=
            corridor.averageWidthMeters / 2,
      )
      .map((sceneObject) => sceneObject.sceneObjectId);

    if (obstructingSceneObjectIds.length === 0 && corridor.averageWidthMeters >= 18) {
      return [];
    }

    return [
      {
        holeId: corridor.holeId,
        fairwayCorridorId: corridor.fairwayCorridorId,
        severity:
          corridor.averageWidthMeters < 14 || obstructingSceneObjectIds.length > 2
            ? "high"
            : "warning",
        obstructingSceneObjectIds,
        reason:
          corridor.averageWidthMeters < 14
            ? "The fairway corridor is narrow enough to create landing-zone pressure."
            : "Objects are crowding the fairway corridor near a primary landing area."
      }
    ];
  });
}

export function analyzeOcclusionRisks(state: SceneAuthoringState): OcclusionRisk[] {
  return state.visibilityCorridors.flatMap((corridor) => {
    const blockingSceneObjectIds = state.sceneObjects
      .filter(
        (sceneObject) =>
          sceneObject.visible &&
          ["structure", "landmark", "animated-set-piece", "vegetation"].includes(sceneObject.category) &&
          distancePointToPolyline(sceneObject.transform.position, corridor.corridorLine) <=
            corridor.minimumWidthMeters / 2 + 5,
      )
      .map((sceneObject) => sceneObject.sceneObjectId);

    if (blockingSceneObjectIds.length === 0) {
      return [];
    }

    return [
      {
        holeId: corridor.holeId,
        visibilityCorridorId: corridor.visibilityCorridorId,
        severity: blockingSceneObjectIds.length > 3 ? "critical" : "high",
        blockingSceneObjectIds,
        reason: "Sightline corridor is materially occluded by authored scene geometry."
      }
    ];
  });
}

export function analyzeSimulatorAnchorConflicts(
  state: SceneAuthoringState,
  simulatorGeometry?: SimulatorGeometryLike,
): SimulatorAnchorConflict[] {
  if (!simulatorGeometry) {
    return [];
  }

  const conflicts: SimulatorAnchorConflict[] = [];

  for (const binding of simulatorGeometry.teeSpatialBindings ?? []) {
    const teeZone = binding.teeZoneRef
      ? state.teeZones.find((zone) => zone.teeZoneId === binding.teeZoneRef?.entityId)
      : null;

    if (binding.readinessState === "ready" && teeZone && binding.positionHint && !pointInPolygon(binding.positionHint, teeZone.boundary)) {
      conflicts.push({
        holeId: binding.holeId,
        bindingId: binding.teeSpatialBindingId,
        bindingType: "tee",
        severity: "high",
        reason: "Tee anchor position hint sits outside the bound tee zone."
      });
    }

    if (binding.readinessState === "ready" && teeZone && teeZone.boundary.points.length < 4) {
      conflicts.push({
        holeId: binding.holeId,
        bindingId: binding.teeSpatialBindingId,
        bindingType: "tee",
        severity: "high",
        reason: "Ready tee binding points to an underspecified tee zone."
      });
    }
  }

  for (const binding of simulatorGeometry.pinSpatialBindings ?? []) {
    const greenZoneRef = binding.greenZoneRef;
    const greenZone = greenZoneRef
      ? state.greenZones.find((zone) => zone.greenZoneId === greenZoneRef.entityId)
      : null;

    if (binding.readinessState === "ready" && !greenZone) {
      conflicts.push({
        holeId: binding.holeId,
        bindingId: binding.pinSpatialBindingId,
        bindingType: "pin",
        severity: "critical",
        reason: "Pin binding is marked ready without a valid green-zone reference."
      });
    }

    if (
      binding.readinessState === "ready" &&
      binding.greenZoneRef &&
      greenZone &&
      binding.positionHint &&
      !pointInPolygon(binding.positionHint, greenZone.boundary)
    ) {
      conflicts.push({
        holeId: binding.holeId,
        bindingId: binding.pinSpatialBindingId,
        bindingType: "pin",
        severity: "high",
        reason: "Pin anchor position hint sits outside the green-zone boundary."
      });
    }
  }

  for (const binding of simulatorGeometry.hazardSpatialBindings ?? []) {
    const hazardZoneRef = binding.hazardZoneRef;
    const hazardZone = hazardZoneRef
      ? state.hazardZones.find((zone) => zone.hazardZoneId === hazardZoneRef.entityId)
      : null;

    if (binding.readinessState === "ready" && !hazardZone) {
      conflicts.push({
        holeId: binding.holeId,
        bindingId: binding.hazardSpatialBindingId,
        bindingType: "hazard",
        severity: "high",
        reason: "Hazard binding is marked ready without a hazard-zone reference."
      });
    }

    if (
      binding.readinessState === "ready" &&
      binding.hazardZoneRef &&
      hazardZone &&
      hazardZone.boundary.points.length < 4
    ) {
      conflicts.push({
        holeId: binding.holeId,
        bindingId: binding.hazardSpatialBindingId,
        bindingType: "hazard",
        severity: "warning",
        reason: "Hazard binding uses a thin or underspecified hazard zone."
      });
    }
  }

  for (const binding of simulatorGeometry.outOfBoundsSpatialBindings ?? []) {
    if (binding.readinessState === "ready" && binding.boundaryRefs.length === 0) {
      conflicts.push({
        holeId: binding.holeId,
        bindingId: binding.outOfBoundsSpatialBindingId,
        bindingType: "ob",
        severity: "critical",
        reason: "OB binding is marked ready without any boundary references."
      });
    }
  }

  for (const binding of simulatorGeometry.dropZoneSpatialBindings ?? []) {
    const dropZoneAreaRef = binding.dropZoneAreaRef;
    const dropZoneArea = dropZoneAreaRef
      ? state.dropZoneAreas.find((zone) => zone.dropZoneAreaId === dropZoneAreaRef.entityId)
      : null;

    if (binding.readinessState === "ready" && !dropZoneArea) {
      conflicts.push({
        holeId: binding.holeId,
        bindingId: binding.dropZoneSpatialBindingId,
        bindingType: "drop-zone",
        severity: "high",
        reason: "Drop-zone binding is marked ready without a drop-zone area."
      });
    }

    if (
      binding.readinessState === "ready" &&
      binding.dropZoneAreaRef &&
      dropZoneArea &&
      dropZoneArea.boundary.points.length < 4
    ) {
      conflicts.push({
        holeId: binding.holeId,
        bindingId: binding.dropZoneSpatialBindingId,
        bindingType: "drop-zone",
        severity: "warning",
        reason: "Drop-zone binding points to underspecified recovery geometry."
      });
    }
  }

  for (const binding of simulatorGeometry.previewAnchorBindings ?? []) {
    if (binding.readinessState === "ready" && !binding.anchorRef) {
      conflicts.push({
        holeId: binding.holeId,
        bindingId: binding.previewAnchorBindingId,
        bindingType: "preview",
        severity: "high",
        reason: "Preview binding is marked ready without an anchor reference."
      });
    }
  }

  return conflicts;
}

export function analyzePreviewFramingWeaknesses(
  state: SceneAuthoringState,
  simulatorGeometry?: SimulatorGeometryLike,
): PreviewFramingWeakness[] {
  if (!simulatorGeometry) {
    return [];
  }

  const weaknesses: PreviewFramingWeakness[] = [];

  for (const minimap of simulatorGeometry.minimapMetadata ?? []) {
    if (!minimap.frameAnchorRef || !minimap.northReferenceAnchorRef) {
      weaknesses.push({
        holeId: minimap.holeId,
        role: "minimap",
        severity: "warning",
        reason: "Minimap framing is missing a center or north-reference anchor."
      });
    }

    const frameAnchorPosition = minimap.frameAnchorRef ? resolveReferencePosition(state, minimap.frameAnchorRef) : null;
    const northAnchorPosition = minimap.northReferenceAnchorRef
      ? resolveReferencePosition(state, minimap.northReferenceAnchorRef)
      : null;

    if (
      frameAnchorPosition &&
      northAnchorPosition &&
      Math.hypot(frameAnchorPosition.x - northAnchorPosition.x, frameAnchorPosition.z - northAnchorPosition.z) < 8
    ) {
      weaknesses.push({
        holeId: minimap.holeId,
        role: "minimap",
        severity: "warning",
        reason: "Minimap framing anchors are too close together to define a stable orientation."
      });
    }
  }

  for (const flyover of simulatorGeometry.flyoverMetadata ?? []) {
    if (!flyover.startAnchorRef || !flyover.apexAnchorRef || !flyover.endAnchorRef) {
      weaknesses.push({
        holeId: flyover.holeId,
        role: "flyover",
        severity: "high",
        reason: "Flyover framing is missing one or more spatial anchors."
      });
      continue;
    }

    if (
      flyover.startAnchorRef.entityId === flyover.endAnchorRef.entityId &&
      flyover.startAnchorRef.entityType === flyover.endAnchorRef.entityType
    ) {
      weaknesses.push({
        holeId: flyover.holeId,
        role: "flyover",
        severity: "warning",
        reason: "Flyover start and end anchors collapse to the same spatial reference."
      });
    }

    const startPosition = resolveReferencePosition(state, flyover.startAnchorRef);
    const apexPosition = resolveReferencePosition(state, flyover.apexAnchorRef);
    const endPosition = resolveReferencePosition(state, flyover.endAnchorRef);
    if (
      startPosition &&
      apexPosition &&
      endPosition &&
      (Math.hypot(startPosition.x - endPosition.x, startPosition.z - endPosition.z) < 16 ||
        apexPosition.y < 6)
    ) {
      weaknesses.push({
        holeId: flyover.holeId,
        role: "flyover",
        severity: "warning",
        reason: "Flyover anchors are too compressed or too low to produce a strong preview move."
      });
    }
  }

  return weaknesses;
}

export function createSpatialAnalysisReport(
  state: SceneAuthoringState,
  simulatorGeometry?: SimulatorGeometryLike,
): SpatialAnalysisReport {
  const collisionConflicts = analyzeCollisionConflicts(state);

  return {
    blockedLineOfPlayIssues: analyzeBlockedLineOfPlay(state),
    sightlineQualityIssues: analyzeSightlineQuality(state),
    routeDiscontinuities: analyzeRouteDiscontinuities(state),
    collisionConflicts,
    invalidOverlapConditions: collisionConflicts.filter((conflict) => conflict.severity !== "warning"),
    landingZoneObstructionRisks: analyzeLandingZoneObstructionRisks(state),
    occlusionRisks: analyzeOcclusionRisks(state),
    simulatorAnchorConflicts: analyzeSimulatorAnchorConflicts(state, simulatorGeometry),
    previewFramingWeaknesses: analyzePreviewFramingWeaknesses(state, simulatorGeometry)
  };
}
