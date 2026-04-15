import type {
  SceneAuthoringState,
  SceneObjectCategory,
  SurfaceRuleCleanupReview,
  TerrainGameplayPurpose,
  ViewportRendererMode
} from "./models";
import {
  buildSceneOutliner,
  canRedoSceneAuthoring,
  canUndoSceneAuthoring,
  getActiveSceneCollection,
  getSelectedSceneGroups,
  getSelectedSceneObjects
} from "./services";

export type SceneAuthoringSummary = {
  collectionCount: number;
  layerCount: number;
  objectCount: number;
  placementPresetCount: number;
  surfaceRulePresetCount: number;
  brushPresetCount: number;
  groupCount: number;
  selectedObjectCount: number;
  selectedGroupCount: number;
  gameplayRelevantCount: number;
  hiddenObjectCount: number;
  lockedObjectCount: number;
  visibleObjectCount: number;
  filteredObjectCount: number;
  terrainSurfaceCount: number;
  terrainRegionCount: number;
  terrainModifierCount: number;
  terrainPaintStrokeCount: number;
  terrainFinishCoveragePercent: number;
  terrainFinishUnpaintedRegionCount: number;
  terrainFinishLayeredRegionCount: number;
  terrainFinishMaterialUsageCount: number;
  routingNodeCount: number;
  routingPathCount: number;
  connectedRoutingPathCount: number;
  routingContinuityWatchCount: number;
  routingElevationWatchCount: number;
  routingWidthWatchCount: number;
  simulatorZoneCount: number;
  undoDepth: number;
  redoDepth: number;
  rendererMode: ViewportRendererMode;
  activeHoleId: string | null;
  categoryCounts: Record<SceneObjectCategory, number>;
  outlinerCount: number;
  activeCollectionName: string | null;
};

export type TerrainFinishHoleBalanceSummary = {
  holeId: string;
  regionCount: number;
  coveragePercent: number;
  coverageGapCount: number;
  patchyRegionCount: number;
  dominantMaterialLabel: string | null;
  dominantMaterialPercent: number;
  hotspotCount: number;
  balanceState: "balanced" | "watch" | "imbalanced";
  recommendedAction: string;
};

export type TerrainFinishConsistencySummary = {
  paintedRegionCount: number;
  unpaintedRegionCount: number;
  coveragePercent: number;
  layeredRegionCount: number;
  paletteUsageCount: number;
  favoriteUsageCount: number;
  dominantMaterialLabel: string | null;
  dominantMaterialPercent: number;
  patchyRegionCount: number;
  coverageGapRegionIds: string[];
  patchyRegionIds: string[];
  dominantMaterialOveruseRegionIds: string[];
  completenessState: "missing" | "partial" | "complete";
  balanceState: "balanced" | "watch" | "imbalanced";
  recommendedAction: string;
  usageByMaterial: Array<{
    terrainMaterialId: string;
    label: string;
    regionCount: number;
    strokeCount: number;
  }>;
};

export type CourseScaleTerrainFinishSummary = {
  holeCount: number;
  readyHoleCount: number;
  watchHoleCount: number;
  imbalancedHoleCount: number;
  coverageGapHoleIds: string[];
  patchClusterHoleIds: string[];
  dominantImbalanceHoleIds: string[];
  dominantMaterialLabel: string | null;
  dominantMaterialPercent: number;
  paletteDistributionState: "balanced" | "watch" | "imbalanced";
  overallState: "balanced" | "watch" | "imbalanced";
  recommendedAction: string;
  holeSummaries: TerrainFinishHoleBalanceSummary[];
};

export type RoutingHoleContinuitySummary = {
  holeId: string;
  continuityWatchCount: number;
  widthWatchCount: number;
  elevationWatchCount: number;
  mergeOpportunityCount: number;
  completionConfidence: "incomplete" | "watch" | "ready";
  deliveryConfidence: "rough" | "watch" | "ready";
  recommendedAction: string;
};

export type RoutingContinuitySummary = {
  continuityWatchCount: number;
  elevationWatchCount: number;
  widthWatchCount: number;
  smoothingWatchCount: number;
  mergeOpportunityCount: number;
  mergeClusterCount: number;
  joinWidthWatchCount: number;
  joinElevationWatchCount: number;
  finishConfidence: "rough" | "watch" | "ready";
  widthHarmonyState: "harmonized" | "watch" | "rough";
  elevationHarmonyState: "harmonized" | "watch" | "rough";
  mergeConfidenceState: "harmonized" | "watch" | "rough";
  completionConfidence: "incomplete" | "watch" | "ready";
  deliveryConfidence: "rough" | "watch" | "ready";
  completionPercent: number;
  recommendedAction: string;
  flaggedNodeIds: string[];
  flaggedSegmentIds: string[];
  unresolvedMergeNodeIds: string[];
  holeSummaries: RoutingHoleContinuitySummary[];
};

export type PresetLibraryEntrySummary = {
  presetId: string;
  name: string;
  description: string;
  favorite: boolean;
  recent: boolean;
  useCount: number;
  lastUsedAt: string | null;
  contextSummary: string;
};

export type PlacementPresetLibrarySummary = {
  totalCount: number;
  favoriteCount: number;
  recentCount: number;
  recommendedAction: string;
  entries: PresetLibraryEntrySummary[];
};

export type BrushPresetLibrarySummary = {
  totalCount: number;
  favoriteCount: number;
  recentCount: number;
  recommendedAction: string;
  entries: PresetLibraryEntrySummary[];
};

export type SurfaceRulePresetLibrarySummary = {
  totalCount: number;
  favoriteCount: number;
  recentCount: number;
  recommendedAction: string;
  entries: PresetLibraryEntrySummary[];
};

export type SurfaceRuleAuthoringSummary = {
  orientationPosture: "upright" | "hybrid" | "surface-follow";
  slopeHandlingMode: "strict" | "adaptive" | "expressive";
  packInfluenceMode: "balanced" | "pack-led" | "surface-led";
  slopeLimitDegrees: number;
  preferredSurfacePurposeCount: number;
  avoidedSurfacePurposeCount: number;
  suitabilityBias: number;
  avoidanceBias: number;
  confidenceState: "rough" | "watch" | "ready";
  currentSummary: string;
  recommendedAction: string;
};

export type SurfaceRuleCoverageHoleSummary = {
  holeId: string;
  activeRegionCount: number;
  guardedRegionCount: number;
  uncoveredRegionCount: number;
  conflictingRegionCount: number;
  dominantPurpose: TerrainGameplayPurpose | null;
  confidenceState: "rough" | "watch" | "ready";
  recommendedAction: string;
};

export type SurfaceRuleCoverageMappingSummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  conflictHoleCount: number;
  activeRegionCount: number;
  guardedRegionCount: number;
  uncoveredRegionCount: number;
  conflictingRegionCount: number;
  activeRegionIds: string[];
  guardedRegionIds: string[];
  uncoveredRegionIds: string[];
  conflictingRegionIds: string[];
  recommendedAction: string;
  holeSummaries: SurfaceRuleCoverageHoleSummary[];
};

export type SurfaceRuleConflictResolutionHoleSummary = {
  holeId: string;
  dominantPurpose: TerrainGameplayPurpose | null;
  conflictingRegionCount: number;
  uncoveredRegionCount: number;
  resolutionState: "rough" | "watch" | "resolved";
  conflictPriority: "high" | "medium" | "low";
  primaryAction: string;
  recommendedAction: string;
};

export type SurfaceRuleConflictResolutionSummary = {
  overallState: "rough" | "watch" | "resolved";
  resolvedHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  highPriorityHoleCount: number;
  unresolvedConflictRegionCount: number;
  uncoveredRegionCount: number;
  recommendedAction: string;
  holeSummaries: SurfaceRuleConflictResolutionHoleSummary[];
};

export type SurfaceRuleCleanupAutomationHoleSummary = {
  holeId: string;
  cleanupState: "rough" | "watch" | "clean";
  automationOpportunity: "resolve-conflicts" | "expand-coverage" | "guard-playable-core" | "ready";
  conflictingRegionCount: number;
  uncoveredRegionCount: number;
  recommendedAction: string;
};

export type SurfaceRuleCleanupAutomationSummary = {
  overallState: "rough" | "watch" | "clean";
  cleanHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  autoCleanableHoleCount: number;
  unresolvedHoleCount: number;
  recommendedAction: string;
  holeSummaries: SurfaceRuleCleanupAutomationHoleSummary[];
};

export type SurfaceRuleCleanupReviewSummary = {
  overallState: "rough" | "watch" | "ready";
  approvalDepthState: "shallow" | "balanced" | "deep";
  diffConfidenceState: "weak" | "balanced" | "strong";
  auditTrailState: "thin" | "watch" | "ready";
  pendingReviewCount: number;
  approvedReviewCount: number;
  rejectedReviewCount: number;
  pendingBroadReviewCount: number;
  focusedApprovalCount: number;
  regionalApprovalCount: number;
  courseWideApprovalCount: number;
  readyToApplyCount: number;
  auditEntryCount: number;
  latestAuditSummary: string | null;
  netConflictReduction: number;
  netCoverageGain: number;
  netReadyHoleGain: number;
  latestDiffSummary: string | null;
  latestReview: SurfaceRuleCleanupReview | null;
  recommendedAction: string;
};

export type LandmarkCorridorBundleLibrarySummary = {
  overallState: "rough" | "watch" | "ready";
  totalCount: number;
  favoriteCount: number;
  recentCount: number;
  quickApplyCount: number;
  recommendedAction: string;
  entries: PresetLibraryEntrySummary[];
};

export type LandmarkCorridorBundleRecommendationHoleInput = {
  holeId: string;
  holeNumber: number;
  blockedViewCount: number;
  weakViewCount: number;
  routeDeliveryConfidence: "rough" | "watch" | "ready";
};

export type LandmarkCorridorBundleRecommendationEntrySummary = {
  holeId: string;
  holeNumber: number;
  bundleId: string | null;
  bundleName: string;
  bundleAction:
    | "compose-open-support-bundle"
    | "compose-route-support-bundle"
    | "compose-presentation-calm-bundle"
    | "compose-hybrid-support-bundle";
  recommendationState: "rough" | "watch" | "ready";
  readinessState: "missing" | "suggested" | "ready";
  reason: string;
  recommendedAction: string;
};

export type LandmarkCorridorBundleRecommendationSummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  recommendationCount: number;
  missingBundleHoleCount: number;
  recommendedBundleCount: number;
  recommendedAction: string;
  entries: LandmarkCorridorBundleRecommendationEntrySummary[];
};

export type SurfaceRuleCleanupReviewReplayEntrySummary = {
  reviewId: string;
  status: SurfaceRuleCleanupReview["status"];
  approvalDepth: SurfaceRuleCleanupReview["approvalDepth"];
  mode: SurfaceRuleCleanupReview["mode"];
  createdAt: string;
  reviewedAt: string | null;
  replaySummary: string;
};

export type SurfaceRuleCleanupReviewReplaySummary = {
  overallState: "rough" | "watch" | "ready";
  replayableReviewCount: number;
  acceptedReplayCount: number;
  rejectedReplayCount: number;
  pendingReplayCount: number;
  courseRegionReplayCount: number;
  latestReplaySummary: string | null;
  recommendedAction: string;
  entries: SurfaceRuleCleanupReviewReplayEntrySummary[];
};

export type SurfaceRuleCleanupReviewReplayTimelineEntrySummary = {
  reviewId: string;
  timelineIndex: number;
  status: SurfaceRuleCleanupReview["status"];
  approvalDepth: SurfaceRuleCleanupReview["approvalDepth"];
  mode: SurfaceRuleCleanupReview["mode"];
  occurredAt: string;
  affectedHoleCount: number;
  timelineLabel: string;
  diffDeltaSummary: string;
};

export type SurfaceRuleCleanupReviewReplayTimelineSummary = {
  overallState: "rough" | "watch" | "ready";
  timelineEntryCount: number;
  acceptedTimelineCount: number;
  rejectedTimelineCount: number;
  pendingTimelineCount: number;
  courseRegionTimelineCount: number;
  latestTimelineSummary: string | null;
  recommendedAction: string;
  entries: SurfaceRuleCleanupReviewReplayTimelineEntrySummary[];
};

export type RouteFinishReconciliationHoleSummary = {
  holeId: string;
  reconciliationState: "rough" | "watch" | "reconciled";
  unresolvedJoinCount: number;
  recommendedAction: string;
};

export type RouteFinishReconciliationSummary = {
  overallState: "rough" | "watch" | "reconciled";
  reconciledHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  unresolvedHoleCount: number;
  recommendedAction: string;
  holeSummaries: RouteFinishReconciliationHoleSummary[];
};

function summarizeRoutingContinuityInternal(state: SceneAuthoringState): RoutingContinuitySummary {
  const flaggedNodeIds = new Set<string>();
  const flaggedSegmentIds = new Set<string>();
  const smoothingSegmentIds = new Set<string>();
  const joinWidthWatchNodeIds = new Set<string>();
  const joinElevationWatchNodeIds = new Set<string>();

  for (const path of state.routingPaths.filter((candidate) => candidate.routeStatus === "connected")) {
    const pathSegments = path.segmentIds
      .map((segmentId) => state.routingSegments.find((segment) => segment.routingSegmentId === segmentId) ?? null)
      .filter((segment): segment is NonNullable<typeof segment> => segment !== null);
    const pathNodes = path.nodeIds
      .map((nodeId) => state.routingNodes.find((node) => node.routingNodeId === nodeId) ?? null)
      .filter((node): node is NonNullable<typeof node> => node !== null);

    for (let index = 1; index < pathSegments.length; index += 1) {
      const previous = pathSegments[index - 1]!;
      const current = pathSegments[index]!;
      if (Math.abs(previous.targetWidthMeters - current.targetWidthMeters) > 8) {
        flaggedSegmentIds.add(previous.routingSegmentId);
        flaggedSegmentIds.add(current.routingSegmentId);
      }
    }

    for (let index = 1; index < pathNodes.length; index += 1) {
      const previous = pathNodes[index - 1]!;
      const current = pathNodes[index]!;
      if (Math.abs(previous.position.y - current.position.y) > 4) {
        flaggedNodeIds.add(previous.routingNodeId);
        flaggedNodeIds.add(current.routingNodeId);
      }
    }

    for (const segment of pathSegments) {
      const midpoint = segment.controlLine.points[Math.floor(segment.controlLine.points.length / 2)] ?? null;
      const start = segment.controlLine.points[0] ?? null;
      const end = segment.controlLine.points[segment.controlLine.points.length - 1] ?? null;
      if (!midpoint || !start || !end || segment.controlLine.points.length <= 2) {
        continue;
      }

      const straightMidpoint = {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
        z: (start.z + end.z) / 2
      };
      const deviation = Math.hypot(midpoint.x - straightMidpoint.x, midpoint.z - straightMidpoint.z);
      if (deviation > Math.max(10, segment.targetWidthMeters * 0.45)) {
        flaggedSegmentIds.add(segment.routingSegmentId);
        smoothingSegmentIds.add(segment.routingSegmentId);
      }
    }
  }

  for (const node of state.routingNodes) {
    const connectedSegments = state.routingSegments.filter(
      (segment) => segment.fromNodeId === node.routingNodeId || segment.toNodeId === node.routingNodeId,
    );
    if (connectedSegments.length < 2) {
      continue;
    }

    const widths = connectedSegments.map((segment) => segment.targetWidthMeters);
    if (Math.max(...widths) - Math.min(...widths) > 6) {
      joinWidthWatchNodeIds.add(node.routingNodeId);
      flaggedNodeIds.add(node.routingNodeId);
    }

    const connectedNodeElevations = connectedSegments
      .map((segment) => {
        const siblingId = segment.fromNodeId === node.routingNodeId ? segment.toNodeId : segment.fromNodeId;
        return state.routingNodes.find((candidate) => candidate.routingNodeId === siblingId)?.position.y ?? null;
      })
      .filter((value): value is number => value !== null);
    if (connectedNodeElevations.length >= 2) {
      const range = Math.max(...connectedNodeElevations) - Math.min(...connectedNodeElevations);
      if (range > 4) {
        joinElevationWatchNodeIds.add(node.routingNodeId);
        flaggedNodeIds.add(node.routingNodeId);
      }
    }
  }

  const mergeOpportunityPairs = new Set<string>();
  for (let index = 0; index < state.routingNodes.length; index += 1) {
    const node = state.routingNodes[index]!;
    for (let compareIndex = index + 1; compareIndex < state.routingNodes.length; compareIndex += 1) {
      const candidate = state.routingNodes[compareIndex]!;
      if (node.holeId !== candidate.holeId) {
        continue;
      }
      const distance = Math.hypot(
        node.position.x - candidate.position.x,
        node.position.y - candidate.position.y,
        node.position.z - candidate.position.z,
      );
      if (distance <= Math.max(1.5, state.editingState.routingGuideSettings.mergeToleranceMeters * 0.7)) {
        mergeOpportunityPairs.add(
          [node.routingNodeId, candidate.routingNodeId].sort().join("::"),
        );
      }
    }
  }

  const unresolvedMergeNodeIds = [...new Set([...mergeOpportunityPairs].flatMap((pair) => pair.split("::")))];
  const widthWatchCount = [...flaggedSegmentIds].filter((segmentId) =>
    state.routingSegments.some((segment) => segment.routingSegmentId === segmentId),
  ).length;
  const elevationWatchCount = flaggedNodeIds.size;
  const smoothingWatchCount = [...smoothingSegmentIds].length;
  const mergeOpportunityCount = mergeOpportunityPairs.size;
  const mergeClusterCount = mergeOpportunityPairs.size;
  const joinWidthWatchCount = joinWidthWatchNodeIds.size;
  const joinElevationWatchCount = joinElevationWatchNodeIds.size;
  const continuityWatchCount = new Set([...flaggedSegmentIds, ...flaggedNodeIds]).size;
  const widthHarmonyState =
    widthWatchCount + joinWidthWatchCount === 0 ? "harmonized" : widthWatchCount + joinWidthWatchCount <= 2 ? "watch" : "rough";
  const elevationHarmonyState =
    elevationWatchCount + joinElevationWatchCount === 0 ? "harmonized" : elevationWatchCount + joinElevationWatchCount <= 2 ? "watch" : "rough";
  const mergeConfidenceState =
    mergeOpportunityCount === 0 && joinWidthWatchCount === 0 && joinElevationWatchCount === 0
      ? "harmonized"
      : mergeOpportunityCount <= 1 && joinWidthWatchCount <= 1 && joinElevationWatchCount <= 1
        ? "watch"
        : "rough";
  const allHoleIds = [...new Set([
    ...state.routingPaths.map((path) => path.holeId),
    ...state.routingNodes.map((node) => node.holeId),
  ])];
  const totalHoleCount = allHoleIds.length;
  const connectedHoleCount = new Set(
    state.routingPaths.filter((path) => path.routeStatus === "connected").map((path) => path.holeId),
  ).size;
  const completionPercent = totalHoleCount === 0 ? 0 : Math.round((connectedHoleCount / totalHoleCount) * 100);
  const completionConfidence =
    totalHoleCount === 0
      ? "incomplete"
      : connectedHoleCount === totalHoleCount
        ? "ready"
        : connectedHoleCount > 0
          ? "watch"
          : "incomplete";
  const finishConfidence =
    continuityWatchCount === 0 && mergeOpportunityCount === 0 && joinWidthWatchCount === 0 && joinElevationWatchCount === 0
      ? "ready"
      : continuityWatchCount <= 2 && mergeOpportunityCount <= 1 && joinWidthWatchCount <= 1 && joinElevationWatchCount <= 1
        ? "watch"
        : "rough";
  const deliveryConfidence =
    completionConfidence === "ready" && finishConfidence === "ready"
      ? "ready"
      : completionConfidence === "incomplete" || finishConfidence === "rough"
        ? "rough"
        : "watch";

  const holeSummaries: RoutingHoleContinuitySummary[] = allHoleIds.map((holeId) => {
    const holeSegmentIds = state.routingSegments
      .filter((segment) => segment.holeId === holeId)
      .map((segment) => segment.routingSegmentId);
    const holeNodeIds = state.routingNodes
      .filter((node) => node.holeId === holeId)
      .map((node) => node.routingNodeId);
    const holeContinuityWatchCount = [
      ...flaggedSegmentIds,
      ...flaggedNodeIds,
    ].filter((id) => holeSegmentIds.includes(id) || holeNodeIds.includes(id)).length;
    const holeWidthWatchCount = [...flaggedSegmentIds].filter((id) => holeSegmentIds.includes(id)).length;
    const holeElevationWatchCount = [...flaggedNodeIds].filter((id) => holeNodeIds.includes(id)).length;
    const holeMergeOpportunityCount = [...mergeOpportunityPairs].filter((pair) => pair.startsWith(`${holeNodeIds[0] ?? ""}`) || pair.split("::").some((id) => holeNodeIds.includes(id))).length;
    const holeCompletionConfidence: RoutingHoleContinuitySummary["completionConfidence"] =
      state.routingPaths.some((path) => path.holeId === holeId && path.routeStatus === "connected")
        ? "ready"
        : state.routingPaths.some((path) => path.holeId === holeId)
          ? "watch"
          : "incomplete";
    const holeDeliveryConfidence: RoutingHoleContinuitySummary["deliveryConfidence"] =
      holeCompletionConfidence === "ready" && holeContinuityWatchCount === 0 && holeMergeOpportunityCount === 0
        ? "ready"
        : holeCompletionConfidence === "incomplete" || holeContinuityWatchCount > 2 || holeMergeOpportunityCount > 1
          ? "rough"
          : "watch";

    return {
      holeId,
      continuityWatchCount: holeContinuityWatchCount,
      widthWatchCount: holeWidthWatchCount,
      elevationWatchCount: holeElevationWatchCount,
      mergeOpportunityCount: holeMergeOpportunityCount,
      completionConfidence: holeCompletionConfidence,
      deliveryConfidence: holeDeliveryConfidence,
      recommendedAction:
        holeDeliveryConfidence === "ready"
          ? "Route confidence is strong enough for preview and simulator framing checks."
          : holeDeliveryConfidence === "watch"
            ? "Calm the remaining join or continuity watches before treating this hole as finished."
            : "Resolve merge joins and continuity drift before trusting this hole for delivery."
    };
  });

  return {
    continuityWatchCount,
    elevationWatchCount,
    widthWatchCount,
    smoothingWatchCount,
    mergeOpportunityCount,
    mergeClusterCount,
    joinWidthWatchCount,
    joinElevationWatchCount,
    finishConfidence,
    widthHarmonyState,
    elevationHarmonyState,
    mergeConfidenceState,
    completionConfidence,
    deliveryConfidence,
    completionPercent,
    recommendedAction:
      deliveryConfidence === "ready"
        ? "Route delivery confidence is high enough for final simulator and preview review."
        : deliveryConfidence === "watch"
          ? "Calm the remaining width, elevation, or merge watches before calling the route finished."
          : "Finish the missing route structure, resolve merge clusters, and polish rough joins before trusting final route delivery.",
    flaggedNodeIds: [...flaggedNodeIds],
    flaggedSegmentIds: [...flaggedSegmentIds],
    unresolvedMergeNodeIds,
    holeSummaries
  };
}

export function summarizeTerrainFinishConsistency(state: SceneAuthoringState): TerrainFinishConsistencySummary {
  const paintedRegionCount = state.terrainRegions.filter((region) => region.paintedMaterialIds.length > 0).length;
  const unpaintedRegionCount = Math.max(0, state.terrainRegions.length - paintedRegionCount);
  const coverageGapRegionIds = state.terrainRegions
    .filter((region) => region.paintedMaterialIds.length === 0)
    .map((region) => region.terrainRegionId);
  const layeredRegionCount = state.terrainRegions.filter((region) => region.paintedMaterialIds.length > 1).length;
  const favoriteMaterialIds = new Set(
    state.terrainMaterialPalette.filter((material) => material.favorite).map((material) => material.terrainMaterialId),
  );
  const usageByMaterial = state.terrainMaterialPalette
    .map((material) => {
      const regionCount = state.terrainRegions.filter((region) =>
        region.paintedMaterialIds.includes(material.terrainMaterialId),
      ).length;
      const strokeCount = state.terrainPaintStrokes.filter(
        (stroke) => stroke.terrainMaterialId === material.terrainMaterialId,
      ).length;

      return {
        terrainMaterialId: material.terrainMaterialId,
        label: material.label,
        regionCount,
        strokeCount
      };
    })
    .filter((material) => material.regionCount > 0 || material.strokeCount > 0)
    .sort((left, right) => right.strokeCount - left.strokeCount || right.regionCount - left.regionCount);
  const totalStrokeCount = usageByMaterial.reduce((total, material) => total + material.strokeCount, 0);
  const dominantMaterial = usageByMaterial[0] ?? null;
  const dominantMaterialPercent =
    dominantMaterial && totalStrokeCount > 0
      ? Math.round((dominantMaterial.strokeCount / totalStrokeCount) * 100)
      : 0;
  const strokeCountByRegion = new Map<string, { strokes: number; materialIds: Set<string> }>();
  for (const stroke of state.terrainPaintStrokes) {
    if (!stroke.regionId) {
      continue;
    }
    const current = strokeCountByRegion.get(stroke.regionId) ?? {
      strokes: 0,
      materialIds: new Set<string>()
    };
    current.strokes += 1;
    current.materialIds.add(stroke.terrainMaterialId);
    strokeCountByRegion.set(stroke.regionId, current);
  }
  const patchyRegionIds = [...strokeCountByRegion.entries()]
    .filter(([, region]) => region.strokes >= 4 || region.materialIds.size >= 3)
    .map(([regionId]) => regionId);
  const patchyRegionCount = patchyRegionIds.length;
  const dominantMaterialOveruseRegionIds =
    dominantMaterial && dominantMaterialPercent >= 65
      ? state.terrainRegions
          .filter((region) => region.paintedMaterialIds.includes(dominantMaterial.terrainMaterialId))
          .map((region) => region.terrainRegionId)
      : [];
  const completenessState =
    state.terrainRegions.length === 0
      ? "missing"
      : unpaintedRegionCount === 0
        ? "complete"
        : paintedRegionCount > 0
          ? "partial"
          : "missing";
  const balanceState =
    completenessState === "complete" && patchyRegionCount === 0 && dominantMaterialPercent <= 65
      ? "balanced"
      : completenessState !== "missing" && patchyRegionCount <= Math.max(1, Math.round(state.terrainRegions.length * 0.35))
        ? "watch"
        : "imbalanced";

  return {
    paintedRegionCount,
    unpaintedRegionCount,
    coveragePercent: state.terrainRegions.length === 0 ? 0 : Math.round((paintedRegionCount / state.terrainRegions.length) * 100),
    layeredRegionCount,
    paletteUsageCount: usageByMaterial.length,
    favoriteUsageCount: usageByMaterial.filter((material) => favoriteMaterialIds.has(material.terrainMaterialId)).length,
    dominantMaterialLabel: dominantMaterial?.label ?? null,
    dominantMaterialPercent,
    patchyRegionCount,
    coverageGapRegionIds,
    patchyRegionIds,
    dominantMaterialOveruseRegionIds,
    completenessState,
    balanceState,
    recommendedAction:
      balanceState === "balanced"
        ? "Terrain finish reads consistently enough for final aesthetic review."
        : balanceState === "watch"
          ? "Tidy coverage gaps or overworked patches before treating finish as complete."
          : "Rebalance the finish palette and cover unpainted or patchy regions before release confidence increases.",
    usageByMaterial
  };
}

export function summarizeCourseScaleTerrainFinish(state: SceneAuthoringState): CourseScaleTerrainFinishSummary {
  const terrainFinish = summarizeTerrainFinishConsistency(state);
  const holeIds = [...new Set(state.terrainRegions.map((region) => region.holeId ?? "scene-wide"))];
  const holeSummaries: TerrainFinishHoleBalanceSummary[] = holeIds.map((holeId) => {
    const holeRegions = state.terrainRegions.filter((region) => (region.holeId ?? "scene-wide") === holeId);
    const coverageGapCount = holeRegions.filter((region) => terrainFinish.coverageGapRegionIds.includes(region.terrainRegionId)).length;
    const patchyRegionCount = holeRegions.filter((region) => terrainFinish.patchyRegionIds.includes(region.terrainRegionId)).length;
    const overuseCount = holeRegions.filter((region) =>
      terrainFinish.dominantMaterialOveruseRegionIds.includes(region.terrainRegionId),
    ).length;
    const holeStrokeUsage = terrainFinish.usageByMaterial
      .map((material) => {
        const strokeCount = state.terrainPaintStrokes.filter(
          (stroke) =>
            stroke.terrainMaterialId === material.terrainMaterialId &&
            holeRegions.some((region) => region.terrainRegionId === stroke.regionId),
        ).length;
        return {
          label: material.label,
          strokeCount
        };
      })
      .filter((material) => material.strokeCount > 0)
      .sort((left, right) => right.strokeCount - left.strokeCount);
    const totalHoleStrokes = holeStrokeUsage.reduce((total, material) => total + material.strokeCount, 0);
    const dominantMaterial = holeStrokeUsage[0] ?? null;
    const dominantMaterialPercent =
      dominantMaterial && totalHoleStrokes > 0
        ? Math.round((dominantMaterial.strokeCount / totalHoleStrokes) * 100)
        : 0;
    const paintedRegionCount = holeRegions.filter((region) => region.paintedMaterialIds.length > 0).length;
    const coveragePercent = holeRegions.length === 0 ? 0 : Math.round((paintedRegionCount / holeRegions.length) * 100);
    const balanceState: TerrainFinishHoleBalanceSummary["balanceState"] =
      paintedRegionCount === 0 || coveragePercent < 50
        ? "imbalanced"
        : coverageGapCount === 0 && patchyRegionCount === 0 && overuseCount === 0
        ? "balanced"
        : coverageGapCount <= 1 && patchyRegionCount <= 1
          ? "watch"
          : "imbalanced";

    return {
      holeId,
      regionCount: holeRegions.length,
      coveragePercent,
      coverageGapCount,
      patchyRegionCount,
      dominantMaterialLabel: dominantMaterial?.label ?? null,
      dominantMaterialPercent,
      hotspotCount: coverageGapCount + patchyRegionCount + overuseCount,
      balanceState,
      recommendedAction:
        balanceState === "balanced"
          ? "Finish posture reads calm from hole to hole."
          : balanceState === "watch"
            ? "Tidy the visible finish hotspots before treating this hole as presentation-ready."
            : "Rebalance finish coverage and material dominance before trusting this hole at preview scale."
    };
  });
  const readyHoleCount = holeSummaries.filter((hole) => hole.balanceState === "balanced").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.balanceState === "watch").length;
  const imbalancedHoleCount = holeSummaries.filter((hole) => hole.balanceState === "imbalanced").length;
  const coverageGapHoleIds = holeSummaries.filter((hole) => hole.coverageGapCount > 0).map((hole) => hole.holeId);
  const patchClusterHoleIds = holeSummaries.filter((hole) => hole.patchyRegionCount > 0).map((hole) => hole.holeId);
  const dominantImbalanceHoleIds = holeSummaries
    .filter((hole) => hole.dominantMaterialPercent >= 65)
    .map((hole) => hole.holeId);
  const paletteDistributionState: CourseScaleTerrainFinishSummary["paletteDistributionState"] =
    terrainFinish.dominantMaterialPercent <= 55
      ? "balanced"
      : terrainFinish.dominantMaterialPercent <= 70
        ? "watch"
        : "imbalanced";
  const overallState: CourseScaleTerrainFinishSummary["overallState"] =
    imbalancedHoleCount > 0
      ? "imbalanced"
      : watchHoleCount > 0 || paletteDistributionState !== "balanced"
        ? "watch"
        : "balanced";

  return {
    holeCount: holeSummaries.length,
    readyHoleCount,
    watchHoleCount,
    imbalancedHoleCount,
    coverageGapHoleIds,
    patchClusterHoleIds,
    dominantImbalanceHoleIds,
    dominantMaterialLabel: terrainFinish.dominantMaterialLabel,
    dominantMaterialPercent: terrainFinish.dominantMaterialPercent,
    paletteDistributionState,
    overallState,
    recommendedAction:
      overallState === "balanced"
        ? "Terrain finish balance now reads calm enough across the course for preview staging."
        : overallState === "watch"
          ? "Use hole-scale finish hotspots to even out the course before final preview framing."
          : "Rebalance finish across the weakest holes before trusting course-scale presentation quality.",
    holeSummaries
  };
}

export function summarizeRoutingContinuity(state: SceneAuthoringState): RoutingContinuitySummary {
  return summarizeRoutingContinuityInternal(state);
}

function isRecentPreset(lastUsedAt: string | null) {
  if (!lastUsedAt) {
    return false;
  }

  const parsed = Date.parse(lastUsedAt);
  return Number.isFinite(parsed);
}

export function summarizePlacementPresetLibrary(state: SceneAuthoringState): PlacementPresetLibrarySummary {
  const sortedPresets = [...state.editingState.placementPresets].sort((left, right) => {
    if (left.favorite !== right.favorite) {
      return left.favorite ? -1 : 1;
    }

    const rightUsed = right.lastUsedAt ? Date.parse(right.lastUsedAt) : 0;
    const leftUsed = left.lastUsedAt ? Date.parse(left.lastUsedAt) : 0;
    if (rightUsed !== leftUsed) {
      return rightUsed - leftUsed;
    }

    if (right.useCount !== left.useCount) {
      return right.useCount - left.useCount;
    }

    return left.name.localeCompare(right.name);
  });

  const entries = sortedPresets.map((preset) => ({
    presetId: preset.presetId,
    name: preset.name,
    description: preset.description,
    favorite: preset.favorite,
    recent: isRecentPreset(preset.lastUsedAt),
    useCount: preset.useCount,
    lastUsedAt: preset.lastUsedAt,
    contextSummary: `${preset.defaultPlacementMode.replace(/-/g, " ")} · ${preset.surfaceSnapEnabled ? "surface snap" : "free"} · ${preset.keepUpright ? "upright" : "surface follow"}${preset.preferredCategory ? ` · ${preset.preferredCategory}` : ""}`
  }));

  const favoriteCount = entries.filter((entry) => entry.favorite).length;
  const recentCount = entries.filter((entry) => entry.recent).length;

  return {
    totalCount: entries.length,
    favoriteCount,
    recentCount,
    recommendedAction:
      entries.length === 0
        ? "Save one strong placement posture so favorite packs and surface behavior stay reusable."
        : favoriteCount === 0
          ? "Mark the best placement posture as favorite so quick-apply stays fast during long sessions."
          : "Use favorites for repeatable placement and let recents carry the active creation pass.",
    entries
  };
}

export function summarizeLandmarkCorridorBundleLibrary(
  state: SceneAuthoringState,
): LandmarkCorridorBundleLibrarySummary {
  const sortedEntries = [...state.editingState.landmarkCorridorBundleLibrary].sort((left, right) => {
    if (left.favorite !== right.favorite) {
      return left.favorite ? -1 : 1;
    }

    const rightUsed = right.lastUsedAt ? Date.parse(right.lastUsedAt) : 0;
    const leftUsed = left.lastUsedAt ? Date.parse(left.lastUsedAt) : 0;
    if (rightUsed !== leftUsed) {
      return rightUsed - leftUsed;
    }

    if (right.useCount !== left.useCount) {
      return right.useCount - left.useCount;
    }

    return left.name.localeCompare(right.name);
  });

  const entries = sortedEntries.map((entry) => ({
    presetId: entry.bundleId,
    name: entry.name,
    description: entry.description,
    favorite: entry.favorite,
    recent: isRecentPreset(entry.lastUsedAt),
    useCount: entry.useCount,
    lastUsedAt: entry.lastUsedAt,
    contextSummary: `${entry.bundleAction.replace(/compose-|-/g, " ").trim()} bundle · ${entry.useCount} uses`,
  }));
  const favoriteCount = entries.filter((entry) => entry.favorite).length;
  const recentCount = entries.filter((entry) => entry.recent).length;
  const quickApplyCount = entries.filter((entry) => entry.favorite || entry.recent).length;
  const overallState: LandmarkCorridorBundleLibrarySummary["overallState"] =
    entries.length === 0 ? "rough" : quickApplyCount === 0 ? "watch" : "ready";

  return {
    overallState,
    totalCount: entries.length,
    favoriteCount,
    recentCount,
    quickApplyCount,
    recommendedAction:
      entries.length === 0
        ? "Save one corridor bundle so landmark support corrections stay reusable instead of being rebuilt hole by hole."
        : quickApplyCount === 0
          ? "Mark or apply the strongest corridor bundle so quick-apply support stays fast during finish-stage cleanup."
          : "Use favorite and recent corridor bundles to restage landmark support without losing the world-first flow.",
    entries,
  };
}

function scoreCorridorBundleRecommendationEntry(entry: {
  favorite: boolean;
  useCount: number;
  lastUsedAt: string | null;
}) {
  return (
    (entry.favorite ? 100 : 0) +
    (isRecentPreset(entry.lastUsedAt) ? 40 : 0) +
    Math.min(entry.useCount, 20)
  );
}

function corridorBundleRecommendationReason(input: {
  blockedViewCount: number;
  weakViewCount: number;
  routeDeliveryConfidence: "rough" | "watch" | "ready";
}) {
  if (input.blockedViewCount > 0 && (input.weakViewCount > 0 || input.routeDeliveryConfidence === "rough")) {
    return {
      bundleAction: "compose-hybrid-support-bundle" as const,
      reason: "Blocked landmark views and route pressure both need calmer support in the same pass.",
    };
  }

  if (input.blockedViewCount > 0) {
    return {
      bundleAction: "compose-open-support-bundle" as const,
      reason: "Blocked landmark views need an open-support pass before Preview can trust the corridor.",
    };
  }

  if (input.routeDeliveryConfidence === "rough") {
    return {
      bundleAction: "compose-route-support-bundle" as const,
      reason: "Route-view support is still rough enough that the corridor should be rebalanced before signoff.",
    };
  }

  if (input.weakViewCount > 0 || input.routeDeliveryConfidence === "watch") {
    return {
      bundleAction: "compose-presentation-calm-bundle" as const,
      reason: "Presentation-facing landmark support still needs a calmer corridor pass.",
    };
  }

  return null;
}

export function summarizeLandmarkCorridorBundleRecommendations(
  state: SceneAuthoringState,
  input: { holes: LandmarkCorridorBundleRecommendationHoleInput[] },
): LandmarkCorridorBundleRecommendationSummary {
  const entries: LandmarkCorridorBundleRecommendationEntrySummary[] = input.holes.map((hole) => {
    const recommendation = corridorBundleRecommendationReason(hole);
    if (recommendation === null) {
      return {
        holeId: hole.holeId,
        holeNumber: hole.holeNumber,
        bundleId: null,
        bundleName: "No additional bundle needed",
        bundleAction: "compose-presentation-calm-bundle" as const,
        recommendationState: "ready" as const,
        readinessState: "ready" as const,
        reason: "Current landmark corridor posture is calm enough that no additional support bundle is recommended.",
        recommendedAction: "Corridor support is calm enough that the current library can stay in reserve for later finish-stage passes.",
      };
    }

    const matchingEntry =
      [...state.editingState.landmarkCorridorBundleLibrary]
        .filter((entry) => entry.bundleAction === recommendation.bundleAction)
        .sort((left, right) => scoreCorridorBundleRecommendationEntry(right) - scoreCorridorBundleRecommendationEntry(left))[0] ??
      null;

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      bundleId: matchingEntry?.bundleId ?? null,
      bundleName:
        matchingEntry?.name ??
        recommendation.bundleAction.replace(/compose-|-/g, " ").trim().replace(/\b\w/g, (value) => value.toUpperCase()),
      bundleAction: recommendation.bundleAction,
      recommendationState: matchingEntry === null ? "rough" : "watch",
      readinessState: matchingEntry === null ? "missing" : "suggested",
      reason: recommendation.reason,
      recommendedAction:
        matchingEntry === null
          ? `Save a ${recommendation.bundleAction.replace(/compose-|-/g, " ").trim()} bundle so this corridor fix can be applied without rebuilding support logic.`
          : `Apply ${matchingEntry.name} on hole ${hole.holeNumber} to resolve the current corridor weakness without leaving the world-first flow.`,
    };
  });

  const readyHoleCount = entries.filter((entry) => entry.recommendationState === "ready").length;
  const watchHoleCount = entries.filter((entry) => entry.recommendationState === "watch").length;
  const roughHoleCount = entries.filter((entry) => entry.recommendationState === "rough").length;
  const recommendationCount = entries.filter((entry) => entry.recommendationState !== "ready").length;
  const missingBundleHoleCount = entries.filter((entry) => entry.readinessState === "missing").length;
  const recommendedBundleCount = new Set(
    entries
      .filter((entry) => entry.bundleId !== null)
      .map((entry) => entry.bundleId),
  ).size;
  const overallState: LandmarkCorridorBundleRecommendationSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    recommendationCount,
    missingBundleHoleCount,
    recommendedBundleCount,
    recommendedAction:
      overallState === "ready"
        ? "Corridor recommendations are calm enough that creators can trust the library without needing another support pass."
        : overallState === "watch"
          ? "Use the suggested corridor bundles to fix the remaining weak views while keeping the strongest entries ready for quick apply."
          : "Save the missing corridor bundles first so recommendation guidance can point at real reusable support instead of generic cleanup advice.",
    entries,
  };
}

export function summarizeSurfaceRulePresetLibrary(state: SceneAuthoringState): SurfaceRulePresetLibrarySummary {
  const sortedPresets = [...state.editingState.surfaceRulePresets].sort((left, right) => {
    if (left.favorite !== right.favorite) {
      return left.favorite ? -1 : 1;
    }

    const rightUsed = right.lastUsedAt ? Date.parse(right.lastUsedAt) : 0;
    const leftUsed = left.lastUsedAt ? Date.parse(left.lastUsedAt) : 0;
    if (rightUsed !== leftUsed) {
      return rightUsed - leftUsed;
    }

    if (right.useCount !== left.useCount) {
      return right.useCount - left.useCount;
    }

    return left.name.localeCompare(right.name);
  });

  const entries = sortedPresets.map((preset) => ({
    presetId: preset.presetId,
    name: preset.name,
    description: preset.description,
    favorite: preset.favorite,
    recent: isRecentPreset(preset.lastUsedAt),
    useCount: preset.useCount,
    lastUsedAt: preset.lastUsedAt,
    contextSummary: `${preset.orientationPosture.replace(/-/g, " ")} · ${preset.slopeHandlingMode} slope · ${preset.slopeLimitDegrees}° · ${preset.packInfluenceMode}${preset.preferredSurfacePurposes[0] ? ` · ${preset.preferredSurfacePurposes[0]}` : ""}`
  }));

  const favoriteCount = entries.filter((entry) => entry.favorite).length;
  const recentCount = entries.filter((entry) => entry.recent).length;

  return {
    totalCount: entries.length,
    favoriteCount,
    recentCount,
    recommendedAction:
      entries.length === 0
        ? "Save one strong surface rule so slope, snap, and placement tendencies stay reusable."
        : favoriteCount === 0
          ? "Mark the strongest surface rule as favorite so slope-aware placement stays fast."
          : "Use favorite surface rules for repeated terrain-aware placement and recents for current polish passes.",
    entries
  };
}

export function summarizeSurfaceRuleAuthoring(state: SceneAuthoringState): SurfaceRuleAuthoringSummary {
  const draft = state.editingState.surfaceRuleDraft;
  const overlappingPurposes = draft.preferredSurfacePurposes.filter((purpose) =>
    draft.avoidedSurfacePurposes.includes(purpose),
  );
  const confidenceState: SurfaceRuleAuthoringSummary["confidenceState"] =
    draft.preferredSurfacePurposes.length === 0 ||
    overlappingPurposes.length > 0 ||
    (draft.slopeHandlingMode === "expressive" && draft.avoidanceBias < 0.4)
      ? "rough"
      : draft.avoidedSurfacePurposes.length === 0 ||
          draft.suitabilityBias < 0.55 ||
          draft.avoidanceBias < 0.55
        ? "watch"
        : "ready";

  return {
    orientationPosture: draft.orientationPosture,
    slopeHandlingMode: draft.slopeHandlingMode,
    packInfluenceMode: draft.packInfluenceMode,
    slopeLimitDegrees: draft.slopeLimitDegrees,
    preferredSurfacePurposeCount: draft.preferredSurfacePurposes.length,
    avoidedSurfacePurposeCount: draft.avoidedSurfacePurposes.length,
    suitabilityBias: draft.suitabilityBias,
    avoidanceBias: draft.avoidanceBias,
    confidenceState,
    currentSummary: `${draft.orientationPosture.replace(/-/g, " ")} · ${draft.slopeHandlingMode} slope · ${draft.packInfluenceMode} influence`,
    recommendedAction:
      confidenceState === "ready"
        ? "Surface-rule authoring is specific enough to keep placement behavior calm during finish-stage passes."
        : confidenceState === "watch"
          ? "Tighten suitability, avoidance, or avoided-surface posture before trusting this rule for repeated finish work."
          : "Resolve conflicting or underspecified surface purposes before trusting this rule across the course."
  };
}

export function summarizeSurfaceRuleCoverageMapping(state: SceneAuthoringState): SurfaceRuleCoverageMappingSummary {
  const draft = state.editingState.surfaceRuleDraft;
  const preferredPurposes = new Set(draft.preferredSurfacePurposes);
  const avoidedPurposes = new Set(draft.avoidedSurfacePurposes);
  const relevantRegions = state.terrainRegions.filter((region) => region.holeId !== null);
  const allHoleIds = [...new Set(relevantRegions.map((region) => region.holeId!))];
  const activeRegionIds: string[] = [];
  const guardedRegionIds: string[] = [];
  const uncoveredRegionIds: string[] = [];
  const conflictingRegionIds: string[] = [];

  const holeSummaries: SurfaceRuleCoverageHoleSummary[] = allHoleIds.map((holeId) => {
    const regions = relevantRegions.filter((region) => region.holeId === holeId);
    const purposeCounts = new Map<TerrainGameplayPurpose, number>();
    let activeRegionCount = 0;
    let guardedRegionCount = 0;
    let uncoveredRegionCount = 0;
    let conflictingRegionCount = 0;

    for (const region of regions) {
      purposeCounts.set(region.gameplayPurpose, (purposeCounts.get(region.gameplayPurpose) ?? 0) + 1);
      const preferred = preferredPurposes.has(region.gameplayPurpose);
      const avoided = avoidedPurposes.has(region.gameplayPurpose);

      if (preferred && avoided) {
        conflictingRegionCount += 1;
        conflictingRegionIds.push(region.terrainRegionId);
      } else if (preferred) {
        activeRegionCount += 1;
        activeRegionIds.push(region.terrainRegionId);
      } else if (avoided) {
        guardedRegionCount += 1;
        guardedRegionIds.push(region.terrainRegionId);
      } else {
        uncoveredRegionCount += 1;
        uncoveredRegionIds.push(region.terrainRegionId);
      }
    }

    const dominantPurpose =
      [...purposeCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
    const confidenceState: SurfaceRuleCoverageHoleSummary["confidenceState"] =
      conflictingRegionCount > 0 || activeRegionCount === 0
        ? "rough"
        : uncoveredRegionCount > 0 || guardedRegionCount === 0
          ? "watch"
          : "ready";

    return {
      holeId,
      activeRegionCount,
      guardedRegionCount,
      uncoveredRegionCount,
      conflictingRegionCount,
      dominantPurpose,
      confidenceState,
      recommendedAction:
        confidenceState === "ready"
          ? "Surface-rule coverage is explicit enough to trust placement behavior across this hole."
          : confidenceState === "watch"
            ? "Cover the remaining unruled terrain purposes so placement stays predictable on this hole."
            : "Resolve conflicting or missing surface-rule coverage before trusting this hole’s placement confidence."
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.confidenceState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.confidenceState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.confidenceState === "rough").length;
  const conflictHoleCount = holeSummaries.filter((hole) => hole.conflictingRegionCount > 0).length;
  const overallState: SurfaceRuleCoverageMappingSummary["overallState"] =
    relevantRegions.length === 0 ? "rough" : roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    conflictHoleCount,
    activeRegionCount: activeRegionIds.length,
    guardedRegionCount: guardedRegionIds.length,
    uncoveredRegionCount: uncoveredRegionIds.length,
    conflictingRegionCount: conflictingRegionIds.length,
    activeRegionIds,
    guardedRegionIds,
    uncoveredRegionIds,
    conflictingRegionIds,
    recommendedAction:
      relevantRegions.length === 0
        ? "Author terrain regions before trusting surface-rule coverage or placement confidence."
        : overallState === "ready"
        ? "Surface-rule coverage now reads clearly enough to trust broader placement passes across the course."
        : overallState === "watch"
          ? "Use the remaining watch holes to close surface-rule gaps and keep placement calm."
          : "Resolve rule gaps or conflicts before trusting surface-aware placement at course scale.",
    holeSummaries
  };
}

export function summarizeSurfaceRuleConflictResolution(
  state: SceneAuthoringState,
): SurfaceRuleConflictResolutionSummary {
  const coverage = summarizeSurfaceRuleCoverageMapping(state);
  const overlappingPurposes = state.editingState.surfaceRuleDraft.preferredSurfacePurposes.filter((purpose) =>
    state.editingState.surfaceRuleDraft.avoidedSurfacePurposes.includes(purpose),
  );
  const overlapSet = new Set(overlappingPurposes);

  const holeSummaries: SurfaceRuleConflictResolutionHoleSummary[] = coverage.holeSummaries.map((hole) => {
    const dominantPurposeConflicted =
      hole.dominantPurpose !== null && overlapSet.has(hole.dominantPurpose);
    const conflictPriority: SurfaceRuleConflictResolutionHoleSummary["conflictPriority"] =
      hole.conflictingRegionCount === 0
        ? hole.uncoveredRegionCount > 0
          ? "medium"
          : "low"
        : dominantPurposeConflicted || hole.conflictingRegionCount > 1
          ? "high"
          : "medium";
    const resolutionState: SurfaceRuleConflictResolutionHoleSummary["resolutionState"] =
      hole.conflictingRegionCount > 0 || dominantPurposeConflicted
        ? "rough"
        : hole.uncoveredRegionCount > 0
          ? "watch"
          : "resolved";
    const primaryAction =
      resolutionState === "resolved"
        ? "Conflict posture is calm enough to trust surface-aware placement on this hole."
        : hole.conflictingRegionCount > 0
          ? dominantPurposeConflicted
            ? `Resolve the ${hole.dominantPurpose?.replace(/-/g, " ") ?? "dominant"} purpose conflict before the active placement rule drifts.`
            : "Clear the overlapping preferred and avoided purposes so placement posture stops fighting itself."
          : "Cover the remaining unruled terrain purposes so the rule reads consistently across the hole.";

    return {
      holeId: hole.holeId,
      dominantPurpose: hole.dominantPurpose,
      conflictingRegionCount: hole.conflictingRegionCount,
      uncoveredRegionCount: hole.uncoveredRegionCount,
      resolutionState,
      conflictPriority,
      primaryAction,
      recommendedAction:
        resolutionState === "resolved"
          ? "Surface-rule conflicts are resolved strongly enough to trust broader placement passes on this hole."
          : resolutionState === "watch"
            ? "Close the remaining uncovered regions so surface behavior stays predictable during finish work."
            : "Resolve the conflicting rule posture before trusting placement confidence on this hole."
    };
  });

  const resolvedHoleCount = holeSummaries.filter((hole) => hole.resolutionState === "resolved").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.resolutionState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.resolutionState === "rough").length;
  const highPriorityHoleCount = holeSummaries.filter((hole) => hole.conflictPriority === "high").length;
  const overallState: SurfaceRuleConflictResolutionSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "resolved";

  return {
    overallState,
    resolvedHoleCount,
    watchHoleCount,
    roughHoleCount,
    highPriorityHoleCount,
    unresolvedConflictRegionCount: coverage.conflictingRegionCount,
    uncoveredRegionCount: coverage.uncoveredRegionCount,
    recommendedAction:
      overallState === "resolved"
        ? "Surface-rule conflicts are calm enough that creators can trust pack-aware placement across the course."
        : overallState === "watch"
          ? "Use the remaining watch holes to close rule gaps before long finish-stage placement passes."
          : "Resolve high-priority rule conflicts before trusting surface-aware placement or brush behavior.",
    holeSummaries
  };
}

export function summarizeSurfaceRuleCleanupAutomation(
  state: SceneAuthoringState,
): SurfaceRuleCleanupAutomationSummary {
  const coverage = summarizeSurfaceRuleCoverageMapping(state);
  const conflictResolution = summarizeSurfaceRuleConflictResolution(state);

  const holeSummaries: SurfaceRuleCleanupAutomationHoleSummary[] = coverage.holeSummaries.map((hole) => {
    const resolution = conflictResolution.holeSummaries.find((entry) => entry.holeId === hole.holeId) ?? null;
    const automationOpportunity: SurfaceRuleCleanupAutomationHoleSummary["automationOpportunity"] =
      hole.conflictingRegionCount > 0
        ? "resolve-conflicts"
        : hole.uncoveredRegionCount > 0
          ? hole.dominantPurpose === "hazard" ||
              hole.dominantPurpose === "out-of-bounds" ||
              hole.dominantPurpose === "support" ||
              hole.dominantPurpose === "preview"
            ? "guard-playable-core"
            : "expand-coverage"
          : "ready";
    const cleanupState: SurfaceRuleCleanupAutomationHoleSummary["cleanupState"] =
      automationOpportunity === "resolve-conflicts"
        ? "rough"
        : automationOpportunity === "ready"
          ? "clean"
          : "watch";

    return {
      holeId: hole.holeId,
      cleanupState,
      automationOpportunity,
      conflictingRegionCount: hole.conflictingRegionCount,
      uncoveredRegionCount: hole.uncoveredRegionCount,
      recommendedAction:
        cleanupState === "clean"
          ? "Surface rules are clean enough that the automation lane can stay quiet on this hole."
          : automationOpportunity === "resolve-conflicts"
            ? resolution?.primaryAction ?? "Resolve the rule conflict before trusting the automation lane on this hole."
            : automationOpportunity === "guard-playable-core"
              ? "Guard the playable core and support surfaces so automated cleanup stops drift around support-heavy regions."
              : "Expand coverage into the remaining uncovered terrain purposes so automated placement support stays predictable."
    };
  });

  const cleanHoleCount = holeSummaries.filter((hole) => hole.cleanupState === "clean").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.cleanupState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.cleanupState === "rough").length;
  const autoCleanableHoleCount = holeSummaries.filter((hole) => hole.automationOpportunity !== "ready").length;
  const unresolvedHoleCount = holeSummaries.filter((hole) => hole.cleanupState !== "clean").length;
  const overallState: SurfaceRuleCleanupAutomationSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "clean";

  return {
    overallState,
    cleanHoleCount,
    watchHoleCount,
    roughHoleCount,
    autoCleanableHoleCount,
    unresolvedHoleCount,
    recommendedAction:
      overallState === "clean"
        ? "Surface-rule cleanup is calm enough that creators can lean on automation without losing placement trust."
        : overallState === "watch"
          ? "Use the remaining watch holes to expand coverage or guard the playable core before long brush or placement passes."
          : "Run conflict cleanup before trusting surface-aware placement or brush behavior across the course.",
    holeSummaries
  };
}

export function summarizeSurfaceRuleCleanupReview(
  state: SceneAuthoringState,
): SurfaceRuleCleanupReviewSummary {
  const cleanupAutomation = summarizeSurfaceRuleCleanupAutomation(state);
  const reviews = [...state.editingState.surfaceRuleCleanupReviews].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
  const latestReview = reviews[0] ?? null;
  const pendingReviewCount = reviews.filter((review) => review.status === "pending").length;
  const approvedReviewCount = reviews.filter((review) => review.status === "approved").length;
  const rejectedReviewCount = reviews.filter((review) => review.status === "rejected").length;
  const pendingBroadReviewCount = reviews.filter(
    (review) => review.status === "pending" && review.requiresBroadApproval,
  ).length;
  const focusedApprovalCount = reviews.filter(
    (review) => review.status === "approved" && review.approvalDepth === "focused",
  ).length;
  const regionalApprovalCount = reviews.filter(
    (review) => review.status === "approved" && review.approvalDepth === "regional",
  ).length;
  const courseWideApprovalCount = reviews.filter(
    (review) => review.status === "approved" && review.approvalDepth === "course-wide",
  ).length;
  const readyToApplyCount = reviews.filter(
    (review) => review.status === "pending" && review.confidenceState !== "rough",
  ).length;
  const auditEntryCount = reviews.reduce((total, review) => total + review.auditTrail.length, 0);
  const netConflictReduction = reviews.reduce(
    (total, review) => total + Math.max(0, review.cleanupDiff.conflictingRegionCountBefore - review.cleanupDiff.conflictingRegionCountAfter),
    0,
  );
  const netCoverageGain = reviews.reduce(
    (total, review) => total + Math.max(0, review.cleanupDiff.uncoveredRegionCountBefore - review.cleanupDiff.uncoveredRegionCountAfter),
    0,
  );
  const netReadyHoleGain = reviews.reduce(
    (total, review) => total + Math.max(0, review.cleanupDiff.readyHoleCountAfter - review.cleanupDiff.readyHoleCountBefore),
    0,
  );
  const latestDiffSummary = latestReview?.cleanupDiff.diffSummary ?? null;
  const latestAuditSummary =
    latestReview?.auditTrail[0]
      ? `${latestReview.auditTrail[0].entryType} · ${latestReview.auditTrail[0].summary} · ${latestReview.auditTrail[0].diffSummary}`
      : null;
  const overallState: SurfaceRuleCleanupReviewSummary["overallState"] =
    pendingBroadReviewCount > 0
      ? "watch"
      : pendingReviewCount > 0
      ? "watch"
      : cleanupAutomation.overallState === "rough"
        ? "rough"
        : cleanupAutomation.overallState === "clean" || approvedReviewCount > 0
          ? "ready"
          : "watch";
  const approvalDepthState: SurfaceRuleCleanupReviewSummary["approvalDepthState"] =
    courseWideApprovalCount > 0
      ? "deep"
      : regionalApprovalCount > 0
        ? "balanced"
        : approvedReviewCount > 0 || pendingBroadReviewCount > 0
          ? "shallow"
          : "balanced";
  const diffConfidenceState: SurfaceRuleCleanupReviewSummary["diffConfidenceState"] =
    !latestReview
      ? "balanced"
      : latestReview.cleanupDiff.conflictingRegionCountAfter > latestReview.cleanupDiff.conflictingRegionCountBefore ||
          latestReview.cleanupDiff.uncoveredRegionCountAfter > latestReview.cleanupDiff.uncoveredRegionCountBefore
        ? "weak"
      : latestReview.cleanupDiff.conflictingRegionCountAfter < latestReview.cleanupDiff.conflictingRegionCountBefore ||
            latestReview.cleanupDiff.readyHoleCountAfter > latestReview.cleanupDiff.readyHoleCountBefore
          ? "strong"
          : "balanced";
  const auditTrailState: SurfaceRuleCleanupReviewSummary["auditTrailState"] =
    auditEntryCount === 0
      ? "thin"
      : rejectedReviewCount > 0 && approvedReviewCount === 0
        ? "watch"
        : diffConfidenceState === "weak"
          ? "watch"
          : "ready";

  return {
    overallState,
    approvalDepthState,
    diffConfidenceState,
    auditTrailState,
    pendingReviewCount,
    approvedReviewCount,
    rejectedReviewCount,
    pendingBroadReviewCount,
    focusedApprovalCount,
    regionalApprovalCount,
    courseWideApprovalCount,
    readyToApplyCount,
    auditEntryCount,
    latestAuditSummary,
    netConflictReduction,
    netCoverageGain,
    netReadyHoleGain,
    latestDiffSummary,
    latestReview,
    recommendedAction:
      latestReview?.status === "pending"
        ? latestReview.proposedAction
        : diffConfidenceState === "weak"
          ? "Compare the latest cleanup diff again before trusting the current pass as a stable course-wide correction."
          : auditTrailState === "watch"
            ? "Review the cleanup audit trail before treating the latest pass as fully trustworthy across the course."
          : approvalDepthState === "deep"
            ? "Cleanup approval depth is calm enough that creators can trust the broader course-rule posture."
          : approvalDepthState === "shallow" && approvedReviewCount > 0
            ? "Promote the next cleanup pass to regional or course-wide approval before treating cleanup as fully settled."
            : overallState === "ready"
              ? "Cleanup review is calm enough that creators can trust the latest approved surface-rule pass."
              : overallState === "watch"
                ? "Review or approve the pending cleanup pass before treating broader rule cleanup as settled."
                : "Broader surface-rule cleanup still needs another pass before it is safe to approve.",
  };
}

export function summarizeSurfaceRuleCleanupReviewReplay(
  state: SceneAuthoringState,
): SurfaceRuleCleanupReviewReplaySummary {
  const reviews = [...state.editingState.surfaceRuleCleanupReviews].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
  const entries = reviews.map((review) => ({
    reviewId: review.reviewId,
    status: review.status,
    approvalDepth: review.approvalDepth,
    mode: review.mode,
    createdAt: review.createdAt,
    reviewedAt: review.reviewedAt,
    replaySummary: `${review.status} · ${review.cleanupDiff.diffSummary}`,
  }));
  const replayableReviewCount = entries.length;
  const acceptedReplayCount = entries.filter((entry) => entry.status === "approved").length;
  const rejectedReplayCount = entries.filter((entry) => entry.status === "rejected").length;
  const pendingReplayCount = entries.filter((entry) => entry.status === "pending").length;
  const courseRegionReplayCount = entries.filter(
    (entry) => entry.approvalDepth === "regional" || entry.approvalDepth === "course-wide",
  ).length;
  const overallState: SurfaceRuleCleanupReviewReplaySummary["overallState"] =
    replayableReviewCount === 0
      ? "rough"
      : pendingReplayCount > 0 || rejectedReplayCount > acceptedReplayCount
        ? "watch"
        : "ready";

  return {
    overallState,
    replayableReviewCount,
    acceptedReplayCount,
    rejectedReplayCount,
    pendingReplayCount,
    courseRegionReplayCount,
    latestReplaySummary: entries[0]?.replaySummary ?? null,
    recommendedAction:
      replayableReviewCount === 0
        ? "Create one cleanup review so the team can replay before-and-after posture instead of trusting the latest draft blindly."
        : overallState === "watch"
          ? "Replay the latest cleanup history before accepting another pass so rejected or pending diffs stay visible."
          : "Cleanup replay history is calm enough that the last accepted pass can be trusted with context.",
    entries: entries.slice(0, 6),
  };
}

export function summarizeSurfaceRuleCleanupReviewReplayTimeline(
  state: SceneAuthoringState,
): SurfaceRuleCleanupReviewReplayTimelineSummary {
  const reviews = [...state.editingState.surfaceRuleCleanupReviews].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
  const entries = reviews.map((review, index) => {
    const occurredAt = review.reviewedAt ?? review.createdAt;
    const conflictDelta =
      review.cleanupDiff.conflictingRegionCountBefore - review.cleanupDiff.conflictingRegionCountAfter;
    const coverageDelta =
      review.cleanupDiff.guardedRegionCountAfter - review.cleanupDiff.guardedRegionCountBefore;
    const readyHoleDelta = review.cleanupDiff.readyHoleCountAfter - review.cleanupDiff.readyHoleCountBefore;

    return {
      reviewId: review.reviewId,
      timelineIndex: index + 1,
      status: review.status,
      approvalDepth: review.approvalDepth,
      mode: review.mode,
      occurredAt,
      affectedHoleCount: review.affectedHoleIds.length,
      timelineLabel: `${review.status} · ${review.mode.replace(/-/g, " ")} · ${review.approvalDepth ?? "awaiting approval"}`,
      diffDeltaSummary: `Conflicts ${conflictDelta >= 0 ? "-" : "+"}${Math.abs(conflictDelta)} · Coverage ${coverageDelta >= 0 ? "+" : "-"}${Math.abs(coverageDelta)} · Ready holes ${readyHoleDelta >= 0 ? "+" : "-"}${Math.abs(readyHoleDelta)}`,
    };
  });
  const acceptedTimelineCount = entries.filter((entry) => entry.status === "approved").length;
  const rejectedTimelineCount = entries.filter((entry) => entry.status === "rejected").length;
  const pendingTimelineCount = entries.filter((entry) => entry.status === "pending").length;
  const courseRegionTimelineCount = entries.filter(
    (entry) => entry.approvalDepth === "regional" || entry.approvalDepth === "course-wide",
  ).length;
  const overallState: SurfaceRuleCleanupReviewReplayTimelineSummary["overallState"] =
    entries.length === 0
      ? "rough"
      : pendingTimelineCount > 0 || rejectedTimelineCount > acceptedTimelineCount
        ? "watch"
        : "ready";

  return {
    overallState,
    timelineEntryCount: entries.length,
    acceptedTimelineCount,
    rejectedTimelineCount,
    pendingTimelineCount,
    courseRegionTimelineCount,
    latestTimelineSummary: entries.length > 0 ? entries[entries.length - 1]!.timelineLabel : null,
    recommendedAction:
      entries.length === 0
        ? "Create one cleanup review so the team can inspect changes over time instead of trusting the latest pass in isolation."
        : overallState === "watch"
          ? "Replay the cleanup timeline before final acceptance so pending or rejected passes stay visible in sequence."
          : "Cleanup timeline history is calm enough that creators can inspect the accepted progression before final signoff.",
    entries: entries.slice(-8),
  };
}

export function summarizeRouteFinishReconciliation(state: SceneAuthoringState): RouteFinishReconciliationSummary {
  const routingContinuity = summarizeRoutingContinuityInternal(state);
  const holeSummaries: RouteFinishReconciliationHoleSummary[] = routingContinuity.holeSummaries.map((hole) => {
    const unresolvedJoinCount =
      hole.mergeOpportunityCount + hole.widthWatchCount + hole.elevationWatchCount;
    const reconciliationState: RouteFinishReconciliationHoleSummary["reconciliationState"] =
      hole.deliveryConfidence === "ready" && unresolvedJoinCount === 0
        ? "reconciled"
        : hole.deliveryConfidence === "rough" || hole.mergeOpportunityCount > 0 || unresolvedJoinCount > 2
          ? "rough"
          : "watch";

    return {
      holeId: hole.holeId,
      reconciliationState,
      unresolvedJoinCount,
      recommendedAction:
        reconciliationState === "reconciled"
          ? "The route reads finished enough to trust its final joins and delivery shape."
          : reconciliationState === "watch"
            ? "Clean the remaining join, width, or elevation drift before calling this route finished."
            : "Reconcile unresolved joins and finish-stage route drift before trusting this hole’s final route shape."
    };
  });

  const reconciledHoleCount = holeSummaries.filter((hole) => hole.reconciliationState === "reconciled").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.reconciliationState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.reconciliationState === "rough").length;
  const unresolvedHoleCount = holeSummaries.filter((hole) => hole.unresolvedJoinCount > 0).length;
  const overallState: RouteFinishReconciliationSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "reconciled";

  return {
    overallState,
    reconciledHoleCount,
    watchHoleCount,
    roughHoleCount,
    unresolvedHoleCount,
    recommendedAction:
      overallState === "reconciled"
        ? "Route finish reconciliation is calm enough for final preview and release-facing review."
        : overallState === "watch"
          ? "Use the remaining watch holes to reconcile final joins and route harmony."
          : "Resolve rough finish-stage route inconsistencies before trusting route delivery confidence.",
    holeSummaries
  };
}

export function summarizeSceneryBrushPresetLibrary(state: SceneAuthoringState): BrushPresetLibrarySummary {
  const sortedPresets = [...state.editingState.sceneryBrushPresets].sort((left, right) => {
    if (left.favorite !== right.favorite) {
      return left.favorite ? -1 : 1;
    }

    const rightUsed = right.lastUsedAt ? Date.parse(right.lastUsedAt) : 0;
    const leftUsed = left.lastUsedAt ? Date.parse(left.lastUsedAt) : 0;
    if (rightUsed !== leftUsed) {
      return rightUsed - leftUsed;
    }

    if (right.useCount !== left.useCount) {
      return right.useCount - left.useCount;
    }

    return left.name.localeCompare(right.name);
  });

  const entries = sortedPresets.map((preset) => ({
    presetId: preset.presetId,
    name: preset.name,
    description: preset.description,
    favorite: preset.favorite,
    recent: isRecentPreset(preset.lastUsedAt),
    useCount: preset.useCount,
    lastUsedAt: preset.lastUsedAt,
    contextSummary: `${preset.settings.density} density · ${preset.settings.minimumSpacingMeters}m spacing · ${Math.round(preset.settings.activePackInfluence * 100)}% pack`
  }));

  const favoriteCount = entries.filter((entry) => entry.favorite).length;
  const recentCount = entries.filter((entry) => entry.recent).length;

  return {
    totalCount: entries.length,
    favoriteCount,
    recentCount,
    recommendedAction:
      entries.length === 0
        ? "Save one brush mix once the current world-dressing pass reads correctly."
        : favoriteCount === 0
          ? "Mark the strongest brush mix as favorite so quick switching stays calm."
          : "Use favorite brush mixes for reliable world-dressing passes and recent presets for iterative cleanup.",
    entries
  };
}

export function summarizeSceneAuthoringState(state: SceneAuthoringState): SceneAuthoringSummary {
  const activeCollection = getActiveSceneCollection(state);
  const activeCollectionId = activeCollection?.collectionId ?? null;
  const objects = activeCollectionId
    ? state.sceneObjects.filter((sceneObject) => sceneObject.collectionId === activeCollectionId)
    : state.sceneObjects;
  const visibleObjects = objects.filter((sceneObject) => sceneObject.visible);
  const hiddenObjects = objects.filter((sceneObject) => !sceneObject.visible);
  const lockedObjects = objects.filter((sceneObject) => sceneObject.locked);
  const filterCategories = new Set(state.selectionState.filterCategories);
  const filteredObjects =
    filterCategories.size > 0
      ? objects.filter((sceneObject) => filterCategories.has(sceneObject.category))
      : objects;
  const categoryCounts = Object.fromEntries(
    [
      "gameplay-course-object",
      "structure",
      "prop",
      "landmark",
      "vegetation",
      "supporting-scenery",
      "animated-set-piece"
    ].map((category) => [category, objects.filter((sceneObject) => sceneObject.category === category).length]),
  ) as Record<SceneObjectCategory, number>;
  const terrainFinish = summarizeTerrainFinishConsistency(state);
  const routingContinuity = summarizeRoutingContinuityInternal(state);

  return {
    collectionCount: state.sceneCollections.length,
    layerCount: state.placementLayers.length,
    objectCount: objects.length,
    placementPresetCount: state.editingState.placementPresets.length,
    surfaceRulePresetCount: state.editingState.surfaceRulePresets.length,
    brushPresetCount: state.editingState.sceneryBrushPresets.length,
    groupCount: state.sceneGroups.length,
    selectedObjectCount: getSelectedSceneObjects(state).length,
    selectedGroupCount: getSelectedSceneGroups(state).length,
    gameplayRelevantCount: categoryCounts["gameplay-course-object"],
    hiddenObjectCount: hiddenObjects.length,
    lockedObjectCount: lockedObjects.length,
    visibleObjectCount: visibleObjects.length,
    filteredObjectCount: filteredObjects.length,
    terrainSurfaceCount: state.terrainSurfaces.length,
    terrainRegionCount: state.terrainRegions.length,
    terrainModifierCount: state.terrainModifiers.length,
    terrainPaintStrokeCount: state.terrainPaintStrokes.length,
    terrainFinishCoveragePercent: terrainFinish.coveragePercent,
    terrainFinishUnpaintedRegionCount: terrainFinish.unpaintedRegionCount,
    terrainFinishLayeredRegionCount: terrainFinish.layeredRegionCount,
    terrainFinishMaterialUsageCount: terrainFinish.paletteUsageCount,
    routingNodeCount: state.routingNodes.length,
    routingPathCount: state.routingPaths.length,
    connectedRoutingPathCount: state.routingPaths.filter((path) => path.routeStatus === "connected").length,
    routingContinuityWatchCount: routingContinuity.continuityWatchCount,
    routingElevationWatchCount: routingContinuity.elevationWatchCount,
    routingWidthWatchCount: routingContinuity.widthWatchCount,
    simulatorZoneCount:
      state.teeZones.length +
      state.greenZones.length +
      state.hazardZones.length +
      state.outOfBoundsZones.length +
      state.dropZoneAreas.length,
    undoDepth: canUndoSceneAuthoring(state) ? state.historyCursor + 1 : 0,
    redoDepth: canRedoSceneAuthoring(state) ? state.placementHistory.length - state.historyCursor - 1 : 0,
    rendererMode: state.viewportState.rendererMode,
    activeHoleId: state.viewportState.activeHoleId,
    categoryCounts,
    outlinerCount: buildSceneOutliner(state).length,
    activeCollectionName: activeCollection?.name ?? null
  };
}
