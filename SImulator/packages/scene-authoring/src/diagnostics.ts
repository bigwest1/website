import { z } from "zod";

import type { SimulatorGeometryLike } from "./analysis";
import { createSpatialAnalysisReport } from "./analysis";
import type {
  SceneAuthoringState,
  SceneSpatialEntityType,
  SceneSpatialReference
} from "./models";
import { summarizeSceneAuthoringState } from "./summary";

export const spatialTrustHealthSchema = z.enum(["healthy", "attention", "critical"]);
export const spatialAnalysisConfidenceSchema = z.enum(["low", "medium", "high"]);
export const spatialTrustIssueSeveritySchema = z.enum(["warning", "critical"]);

export const spatialTrustIssueSchema = z.object({
  issueId: z.string(),
  severity: spatialTrustIssueSeveritySchema,
  title: z.string(),
  summary: z.string(),
  recommendedAction: z.string(),
  entityId: z.string().nullable(),
  entityType: z.string().nullable()
});

export const spatialTrustMetricsSchema = z.object({
  collectionCount: z.number().min(0),
  objectCount: z.number().min(0),
  terrainRegionCount: z.number().min(0),
  terrainModifierCount: z.number().min(0),
  routingPathCount: z.number().min(0),
  routingNodeCount: z.number().min(0),
  simulatorZoneCount: z.number().min(0),
  undoDepth: z.number().min(0)
});

export const spatialTrustReportSchema = z.object({
  generatedAt: z.string(),
  fingerprint: z.string(),
  health: spatialTrustHealthSchema,
  analysisConfidence: spatialAnalysisConfidenceSchema,
  issueCount: z.number().min(0),
  warningCount: z.number().min(0),
  criticalCount: z.number().min(0),
  summary: z.string(),
  recommendedAction: z.string(),
  metrics: spatialTrustMetricsSchema,
  issues: z.array(spatialTrustIssueSchema)
});

export type SpatialTrustHealth = z.infer<typeof spatialTrustHealthSchema>;
export type SpatialAnalysisConfidence = z.infer<typeof spatialAnalysisConfidenceSchema>;
export type SpatialTrustIssueSeverity = z.infer<typeof spatialTrustIssueSeveritySchema>;
export type SpatialTrustIssue = z.infer<typeof spatialTrustIssueSchema>;
export type SpatialTrustMetrics = z.infer<typeof spatialTrustMetricsSchema>;
export type SpatialTrustReport = z.infer<typeof spatialTrustReportSchema>;

function createHash(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `scene-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function referenceExists(state: SceneAuthoringState, reference: SceneSpatialReference) {
  switch (reference.entityType) {
    case "scene-object":
      return state.sceneObjects.some((entry) => entry.sceneObjectId === reference.entityId);
    case "scene-group":
      return state.sceneGroups.some((entry) => entry.groupId === reference.entityId);
    case "terrain-surface":
      return state.terrainSurfaces.some((entry) => entry.terrainSurfaceId === reference.entityId);
    case "terrain-profile":
      return state.terrainProfiles.some((entry) => entry.terrainProfileId === reference.entityId);
    case "terrain-region":
      return state.terrainRegions.some((entry) => entry.terrainRegionId === reference.entityId);
    case "terrain-modifier":
      return state.terrainModifiers.some((entry) => entry.terrainModifierId === reference.entityId);
    case "routing-node":
      return state.routingNodes.some((entry) => entry.routingNodeId === reference.entityId);
    case "routing-segment":
      return state.routingSegments.some((entry) => entry.routingSegmentId === reference.entityId);
    case "routing-path":
      return state.routingPaths.some((entry) => entry.routingPathId === reference.entityId);
    case "fairway-corridor":
      return state.fairwayCorridors.some((entry) => entry.fairwayCorridorId === reference.entityId);
    case "green-zone":
      return state.greenZones.some((entry) => entry.greenZoneId === reference.entityId);
    case "tee-zone":
      return state.teeZones.some((entry) => entry.teeZoneId === reference.entityId);
    case "hazard-zone":
      return state.hazardZones.some((entry) => entry.hazardZoneId === reference.entityId);
    case "out-of-bounds-zone":
      return state.outOfBoundsZones.some((entry) => entry.outOfBoundsZoneId === reference.entityId);
    case "drop-zone-area":
      return state.dropZoneAreas.some((entry) => entry.dropZoneAreaId === reference.entityId);
    case "visibility-corridor":
      return state.visibilityCorridors.some((entry) => entry.visibilityCorridorId === reference.entityId);
    case "play-route-envelope":
      return state.playRouteEnvelopes.some((entry) => entry.playRouteEnvelopeId === reference.entityId);
    default:
      return false;
  }
}

function createIssue(input: {
  issueId: string;
  severity: SpatialTrustIssueSeverity;
  title: string;
  summary: string;
  recommendedAction: string;
  entityId?: string | null;
  entityType?: SceneSpatialEntityType | null;
}): SpatialTrustIssue {
  return spatialTrustIssueSchema.parse({
    issueId: input.issueId,
    severity: input.severity,
    title: input.title,
    summary: input.summary,
    recommendedAction: input.recommendedAction,
    entityId: input.entityId ?? null,
    entityType: input.entityType ?? null
  });
}

function confidenceFromSignals(input: {
  missingRefCount: number;
  routeGapCount: number;
  collisionCount: number;
  occlusionCount: number;
  simulatorConflictCount: number;
  previewWeaknessCount: number;
  routingPathCount: number;
  simulatorZoneCount: number;
}) {
  let score = 100;

  if (input.routingPathCount === 0) {
    score -= 22;
  }

  if (input.simulatorZoneCount === 0) {
    score -= 16;
  }

  score -= Math.min(20, input.missingRefCount * 6);
  score -= Math.min(18, input.routeGapCount * 7);
  score -= Math.min(12, input.collisionCount * 2);
  score -= Math.min(10, input.occlusionCount * 2);
  score -= Math.min(14, input.simulatorConflictCount * 4);
  score -= Math.min(8, input.previewWeaknessCount * 2);

  if (score >= 72) {
    return "high" satisfies SpatialAnalysisConfidence;
  }

  if (score >= 46) {
    return "medium" satisfies SpatialAnalysisConfidence;
  }

  return "low" satisfies SpatialAnalysisConfidence;
}

export function createSpatialStateFingerprint(state: SceneAuthoringState) {
  const summary = summarizeSceneAuthoringState(state);

  return createHash(
    JSON.stringify({
      activeCollectionId: state.activeCollectionId,
      selection: {
        objects: state.selectionState.selectedObjectIds,
        groups: state.selectionState.selectedGroupIds,
        spatial: state.selectionState.selectedSpatialEntityRefs.map((reference) => ({
          entityType: reference.entityType,
          entityId: reference.entityId
        }))
      },
      sceneObjects: state.sceneObjects.map((entry) => ({
        id: entry.sceneObjectId,
        collectionId: entry.collectionId,
        layerId: entry.placementLayerId,
        position: entry.transform.position
      })),
      terrainRegions: state.terrainRegions.map((entry) => ({
        id: entry.terrainRegionId,
        holeId: entry.holeId,
        gameplayPurpose: entry.gameplayPurpose
      })),
      routingPaths: state.routingPaths.map((entry) => ({
        id: entry.routingPathId,
        holeId: entry.holeId,
        routeStatus: entry.routeStatus
      })),
      simulatorZones: {
        tee: state.teeZones.map((entry) => entry.teeZoneId),
        green: state.greenZones.map((entry) => entry.greenZoneId),
        hazard: state.hazardZones.map((entry) => entry.hazardZoneId),
        outOfBounds: state.outOfBoundsZones.map((entry) => entry.outOfBoundsZoneId),
        drop: state.dropZoneAreas.map((entry) => entry.dropZoneAreaId)
      },
      historyCursor: state.historyCursor,
      historyDepth: summary.undoDepth + summary.redoDepth
    }),
  );
}

export function createSpatialTrustReport(
  state: SceneAuthoringState,
  simulatorGeometry?: SimulatorGeometryLike,
  generatedAt = new Date().toISOString(),
): SpatialTrustReport {
  const summary = summarizeSceneAuthoringState(state);
  const analysis = createSpatialAnalysisReport(state, simulatorGeometry);
  const issues: SpatialTrustIssue[] = [];

  const collectionIds = new Set(state.sceneCollections.map((entry) => entry.collectionId));
  const layerIds = new Set(state.placementLayers.map((entry) => entry.layerId));
  const sceneGroupIds = new Set(state.sceneGroups.map((entry) => entry.groupId));
  const sceneObjectIds = new Set(state.sceneObjects.map((entry) => entry.sceneObjectId));
  const terrainProfileIds = new Set(state.terrainProfiles.map((entry) => entry.terrainProfileId));
  const routingNodeIds = new Set(state.routingNodes.map((entry) => entry.routingNodeId));
  const routingSegmentIds = new Set(state.routingSegments.map((entry) => entry.routingSegmentId));
  const routingPathIds = new Set(state.routingPaths.map((entry) => entry.routingPathId));

  if (state.activeCollectionId && !collectionIds.has(state.activeCollectionId)) {
    issues.push(
      createIssue({
        issueId: "missing-active-collection",
        severity: "critical",
        title: "Active collection is missing",
        summary: "The active scene collection no longer exists, which weakens outliner and placement continuity.",
        recommendedAction: "Choose a valid collection before continuing authoring.",
        entityId: state.activeCollectionId
      }),
    );
  }

  const missingSelectedRefs = state.selectionState.selectedSpatialEntityRefs.filter(
    (reference) => !referenceExists(state, reference),
  );
  if (missingSelectedRefs.length > 0) {
    issues.push(
      createIssue({
        issueId: "missing-selected-spatial-refs",
        severity: "warning",
        title: "Some selected spatial references no longer resolve",
        summary: `${missingSelectedRefs.length} selected spatial references point at missing geometry.`,
        recommendedAction: "Clear the stale selection and reselect the intended geometry."
      }),
    );
  }

  for (const sceneObject of state.sceneObjects) {
    if (!collectionIds.has(sceneObject.collectionId) || !layerIds.has(sceneObject.placementLayerId)) {
      issues.push(
        createIssue({
          issueId: `scene-object-orphan-${sceneObject.sceneObjectId}`,
          severity: "critical",
          title: "Scene object lost its collection or layer",
          summary: `${sceneObject.name} references a missing collection or layer.`,
          recommendedAction: "Repair the object’s collection and layer ownership before continuing placement work.",
          entityId: sceneObject.sceneObjectId,
          entityType: "scene-object"
        }),
      );
    }
  }

  for (const relationship of state.parentRelationships) {
    const childExists =
      relationship.childType === "group"
        ? sceneGroupIds.has(relationship.childId)
        : sceneObjectIds.has(relationship.childId);
    const parentExists =
      relationship.parentId === null ||
      relationship.parentType === "collection"
        ? relationship.parentId === null || collectionIds.has(relationship.parentId)
        : relationship.parentType === "group"
          ? sceneGroupIds.has(relationship.parentId)
          : sceneObjectIds.has(relationship.parentId);

    if (!childExists || !parentExists) {
      issues.push(
        createIssue({
          issueId: `relationship-drift-${relationship.relationshipId}`,
          severity: "warning",
          title: "Hierarchy relationship drifted",
          summary: "A scene hierarchy relationship points at a missing child or parent node.",
          recommendedAction: "Repair or remove the stale hierarchy relationship in the outliner."
        }),
      );
    }
  }

  for (const terrainRegion of state.terrainRegions) {
    if (!collectionIds.has(terrainRegion.collectionId) || !terrainProfileIds.has(terrainRegion.terrainProfileId)) {
      issues.push(
        createIssue({
          issueId: `terrain-region-drift-${terrainRegion.terrainRegionId}`,
          severity: "critical",
          title: "Terrain region lost a required dependency",
          summary: `${terrainRegion.name} references a missing collection or terrain profile.`,
          recommendedAction: "Repair the terrain region profile assignment before relying on terrain analysis.",
          entityId: terrainRegion.terrainRegionId,
          entityType: "terrain-region"
        }),
      );
    }
  }

  for (const routingSegment of state.routingSegments) {
    if (!routingNodeIds.has(routingSegment.fromNodeId) || !routingNodeIds.has(routingSegment.toNodeId)) {
      issues.push(
        createIssue({
          issueId: `routing-segment-drift-${routingSegment.routingSegmentId}`,
          severity: "critical",
          title: "Routing segment lost one of its nodes",
          summary: `${routingSegment.routingSegmentId} references a missing from/to routing node.`,
          recommendedAction: "Reconnect the routing segment to valid nodes before trusting route continuity.",
          entityId: routingSegment.routingSegmentId,
          entityType: "routing-segment"
        }),
      );
    }
  }

  for (const routingPath of state.routingPaths) {
    const invalidNodeIds = routingPath.nodeIds.filter((nodeId) => !routingNodeIds.has(nodeId));
    const invalidSegmentIds = routingPath.segmentIds.filter((segmentId) => !routingSegmentIds.has(segmentId));
    if (invalidNodeIds.length > 0 || invalidSegmentIds.length > 0) {
      issues.push(
        createIssue({
          issueId: `routing-path-drift-${routingPath.routingPathId}`,
          severity: "critical",
          title: "Routing path references missing nodes or segments",
          summary: `${routingPath.name} has stale routing references that weaken tee-to-green trust.`,
          recommendedAction: "Repair the routing path membership before continuing hole flow edits.",
          entityId: routingPath.routingPathId,
          entityType: "routing-path"
        }),
      );
    }
  }

  for (const fairwayCorridor of state.fairwayCorridors) {
    if (!routingPathIds.has(fairwayCorridor.routingPathId)) {
      issues.push(
        createIssue({
          issueId: `fairway-corridor-drift-${fairwayCorridor.fairwayCorridorId}`,
          severity: "warning",
          title: "Fairway corridor lost its routing path",
          summary: "A fairway corridor is no longer anchored to a valid routing path.",
          recommendedAction: "Rebind the corridor to a valid route before trusting landing-zone analysis.",
          entityId: fairwayCorridor.fairwayCorridorId,
          entityType: "fairway-corridor"
        }),
      );
    }
  }

  for (const visibilityCorridor of state.visibilityCorridors) {
    if (!routingNodeIds.has(visibilityCorridor.fromNodeId) || !routingNodeIds.has(visibilityCorridor.toNodeId)) {
      issues.push(
        createIssue({
          issueId: `visibility-corridor-drift-${visibilityCorridor.visibilityCorridorId}`,
          severity: "warning",
          title: "Visibility corridor lost an anchor node",
          summary: "A visibility corridor references a missing start or end node.",
          recommendedAction: "Reconnect the corridor before relying on sightline diagnostics.",
          entityId: visibilityCorridor.visibilityCorridorId,
          entityType: "visibility-corridor"
        }),
      );
    }
  }

  for (const envelope of state.playRouteEnvelopes) {
    if (!routingPathIds.has(envelope.routingPathId)) {
      issues.push(
        createIssue({
          issueId: `play-route-envelope-drift-${envelope.playRouteEnvelopeId}`,
          severity: "warning",
          title: "Play-route envelope lost its route binding",
          summary: "A play-route envelope is detached from a valid routing path.",
          recommendedAction: "Repair the play-route envelope binding before trusting blocked-line analysis.",
          entityId: envelope.playRouteEnvelopeId,
          entityType: "play-route-envelope"
        }),
      );
    }
  }

  if (state.historyCursor < -1 || state.historyCursor >= state.placementHistory.length) {
    issues.push(
      createIssue({
        issueId: "history-cursor-drift",
        severity: "critical",
        title: "Undo/redo history cursor is invalid",
        summary: "Runtime history no longer lines up with the authored action stack.",
        recommendedAction: "Rebuild runtime history from the baseline snapshot before continuing large edits."
      }),
    );
  }

  for (const binding of simulatorGeometry?.teeSpatialBindings ?? []) {
    if (
      (binding.teeZoneRef && !referenceExists(state, binding.teeZoneRef)) ||
      (binding.sceneObjectRef && !referenceExists(state, binding.sceneObjectRef))
    ) {
      issues.push(
        createIssue({
          issueId: `sim-tee-drift-${binding.teeSpatialBindingId}`,
          severity: "critical",
          title: "A tee spatial binding points at missing Build geometry",
          summary: "Simulator tee output is no longer anchored to valid scene-authoring geometry.",
          recommendedAction: "Repair the tee zone or scene object binding before trusting export readiness."
        }),
      );
    }
  }

  for (const binding of simulatorGeometry?.pinSpatialBindings ?? []) {
    if (
      (binding.greenZoneRef && !referenceExists(state, binding.greenZoneRef)) ||
      (binding.sceneObjectRef && !referenceExists(state, binding.sceneObjectRef))
    ) {
      issues.push(
        createIssue({
          issueId: `sim-pin-drift-${binding.pinSpatialBindingId}`,
          severity: "critical",
          title: "A pin spatial binding points at missing Build geometry",
          summary: "Pin output is no longer anchored to valid green or scene geometry.",
          recommendedAction: "Repair the pin binding before trusting simulator export posture."
        }),
      );
    }
  }

  const analysisConfidence = confidenceFromSignals({
    missingRefCount: missingSelectedRefs.length,
    routeGapCount: analysis.routeDiscontinuities.length,
    collisionCount: analysis.collisionConflicts.length + analysis.invalidOverlapConditions.length,
    occlusionCount: analysis.occlusionRisks.length,
    simulatorConflictCount: analysis.simulatorAnchorConflicts.length,
    previewWeaknessCount: analysis.previewFramingWeaknesses.length,
    routingPathCount: summary.routingPathCount,
    simulatorZoneCount: summary.simulatorZoneCount
  });

  const criticalCount = issues.filter((issue) => issue.severity === "critical").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const health: SpatialTrustHealth =
    criticalCount > 0
      ? "critical"
      : warningCount > 0 || analysisConfidence === "low"
        ? "attention"
        : "healthy";

  const summaryText =
    health === "critical"
      ? "Spatial trust is degraded. Build state, bindings, or history need repair before a serious authoring pass."
      : health === "attention"
        ? "Spatial trust is usable but not clean. Indexing, bindings, or analysis confidence still need attention."
        : "Spatial authority is internally consistent enough for a deeper Build pass.";

  const recommendedAction =
    issues.find((issue) => issue.severity === "critical")?.recommendedAction ??
    issues[0]?.recommendedAction ??
    (analysisConfidence === "low"
      ? "Strengthen routing, simulator anchors, and preview framing before relying on advanced analysis."
      : "Keep snapshots and index rebuilds current before the next deep authoring session.");

  return spatialTrustReportSchema.parse({
    generatedAt,
    fingerprint: createSpatialStateFingerprint(state),
    health,
    analysisConfidence,
    issueCount: issues.length,
    warningCount,
    criticalCount,
    summary: summaryText,
    recommendedAction,
    metrics: {
      collectionCount: summary.collectionCount,
      objectCount: summary.objectCount,
      terrainRegionCount: summary.terrainRegionCount,
      terrainModifierCount: summary.terrainModifierCount,
      routingPathCount: summary.routingPathCount,
      routingNodeCount: summary.routingNodeCount,
      simulatorZoneCount: summary.simulatorZoneCount,
      undoDepth: summary.undoDepth
    },
    issues: issues.sort((left, right) =>
      left.severity === right.severity ? left.title.localeCompare(right.title) : left.severity === "critical" ? -1 : 1,
    )
  });
}
