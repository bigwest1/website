import { useEffect, useEffectEvent, useState, type DragEvent as ReactDragEvent } from "react";

import {
  Badge,
  Button,
  Inline,
  MetricChip,
  SectionHeader,
  SelectField,
  Stack,
  SurfaceCard,
  TextAreaField,
  TextField,
  TogglePillGroup
} from "@course-creator-os/ui";
import {
  listAssetPlacementPalette,
  listRecentPlacementPaletteEntries,
  summarizeAssetContentPacks,
  type AssetPlacementPaletteEntry
} from "@course-creator-os/asset-system";
import {
  summarizeCreatorDeliveryFlow,
  summarizeCreatorReleaseHandoff,
  summarizeFinalCreatorDelivery,
  summarizeFinalShareGateApproval,
  summarizePresentationPacketProofing,
  summarizePresentationShareDeliveryConfidence,
  summarizePresentationSharePacketFinalization,
  summarizeReleaseExecutionState,
  summarizeShareReadyPresentationHandoff
} from "@course-creator-os/packaging";
import {
  addPlacementDraftsToSceneryBrush,
  addRoutingNodeForHole,
  adjustRoutingSegmentWidth,
  applyLandmarkCorridorSupportKit,
  applyLandmarkCorridorBundleLibraryEntry,
  applyLandmarkCorridorSupportKitComposition,
  applyPlacementPreset,
  applySurfaceRulePreset,
  applySceneryBrushPreset,
  applySceneryBrushStroke,
  applyLandmarkViewCorridorTool,
  applyRendererInteractionDelta,
  applyTerrainMaterialStroke,
  applyTerrainSculptStroke,
  automateSurfaceRuleCleanup,
  assignRoutingSegmentRole,
  assignTerrainRegionPurpose,
  buildRendererSceneSnapshot,
  buildSceneOutliner,
  canRedoSceneAuthoring,
  canUndoSceneAuthoring,
  clearAuthoringPreview,
  commitAuthoringPreview,
  clearSceneSelection,
  createGreenZoneForHoleAt,
  createHazardZoneForHole,
  createOutOfBoundsZoneForHole,
  createPlacementAssetDraft,
  createPreviewAnchorForHole,
  createSurfaceRuleCleanupReview,
  createSpatialAnalysisReport,
  createTeeZoneForHole,
  createTerrainRegionForHole,
  dismissBuilderGuide,
  duplicateSceneObjects,
  focusViewportOnReference,
  groupSceneObjects,
  harmonizeRoutingSegmentWidth,
  orbitViewportCamera,
  panViewportCamera,
  placeSceneObjectFromDraft,
  polishRoutingNodeElevation,
  polishRoutingHoleContinuity,
  previewPlacementDraft,
  previewSceneryBrush,
  previewTerrainFinish,
  redoSceneAuthoring,
  reconcileRoutingHoleFinish,
  reviewSurfaceRuleCleanupPass,
  resolveSurfaceRuleConflicts,
  resolveRoutingMergeCandidates,
  restageSelectedLandmark,
  restoreBuilderGuides,
  rotateSpatialBoundary,
  scaleSpatialBoundary,
  selectDropZoneAreaForEditing,
  selectFairwayCorridorForEditing,
  selectHazardZoneForEditing,
  selectOutOfBoundsZoneForEditing,
  selectPlayRouteEnvelopeForEditing,
  selectRoutingNodeForEditing,
  selectRoutingSegmentForEditing,
  selectSceneObjects,
  selectSpatialEntities,
  selectTerrainRegionForEditing,
  selectVisibilityCorridorForEditing,
  savePlacementPreset,
  saveSurfaceRulePreset,
  saveSceneryBrushPreset,
  setActivePlacementDraft,
  setActiveTerrainMaterial,
  setActiveTerrainMaterialLayerIndex,
  setBuilderGuidanceVisibility,
  setGizmoMode,
  setHoveredSpatialEntity,
  setPlacementMode,
  setRoutingToolMode,
  setSceneObjectLockState,
  setSceneObjectVisibility,
  setSimulatorAnchorToolMode,
  setTerrainPaintBlendMode,
  setTerrainMaterialVisibilityMode,
  setTerrainSculptMode,
  setTerrainToolMode,
  setTransformSpace,
  splitRoutingSegment,
  summarizeCourseScaleTerrainFinish,
  summarizePlacementPresetLibrary,
  summarizeRouteFinishReconciliation,
  summarizeRoutingContinuity,
  summarizeSceneryBrushPresetLibrary,
  summarizeSceneAuthoringState,
  summarizeSurfaceRuleAuthoring,
  summarizeLandmarkCorridorBundleLibrary,
  summarizeSurfaceRuleCleanupAutomation,
  summarizeSurfaceRuleCleanupReview,
  summarizeSurfaceRuleCleanupReviewReplay,
  summarizeSurfaceRuleCleanupReviewReplayTimeline,
  summarizeSurfaceRuleConflictResolution,
  summarizeSurfaceRuleCoverageMapping,
  summarizeSurfaceRulePresetLibrary,
  summarizeTerrainFinishConsistency,
  smoothRoutingSegmentShape,
  syncViewportCamera,
  syncViewportInteractionPipeline,
  syncViewportRuntimeState,
  undoSceneAuthoring,
  ungroupSceneGroup,
  updateSurfaceRuleDraft,
  updateFairwayCorridor,
  updateGreenZone,
  updateRoutingGuideSettings,
  updateSceneObjectTransform,
  updateSceneryBrushSettings,
  updateSelectionFilter,
  updateSnapSettings,
  updateTerrainBrushSettings,
  updateTerrainModifier,
  updateTeeZone,
  updateViewportState,
  createDropZoneAreaForHole,
  connectRoutingNodes,
  createSpatialTrustReport,
  moveRoutingNode,
  togglePlacementPresetFavorite,
  toggleLandmarkCorridorBundleLibraryFavorite,
  toggleSurfaceRulePresetFavorite,
  toggleSceneryBrushPresetFavorite,
  type AuthoringWorkspaceMode,
  type GizmoMode,
  type PlacementAssetDraft,
  type PlacementMode,
  type PivotMode,
  type RendererInteractionDelta,
  type RendererInteractionTarget,
  type RoutingNodeKind,
  type RoutingSegmentKind,
  type SceneObjectCategory,
  type SceneSpatialReference,
  type SimulatorAnchorToolMode,
  type TerrainSculptMode,
  type TerrainGameplayPurpose,
  type TerrainToolMode,
  type TransformSpace,
  type RoutingToolMode,
  type Vector3
} from "@course-creator-os/scene-authoring";
import { createPerformanceSnapshotFromSpatialState } from "@course-creator-os/performance";

import { writePlacementDragPayload, type PlacementDragPayload } from "../../app/placement-drag";
import { summarizeProjectPresentationInsights } from "../../app/presentation-insights";
import { updateSceneAuthoringState, useProjectSession } from "../../app/project-session";
import { StatusPill } from "../../components/StatusPill";
import { ValidationIssueCard } from "../../components/ValidationIssueCard";
import { CanvasSceneViewport } from "./CanvasSceneViewport";

const placementModeOptions: { label: string; value: PlacementMode }[] = [
  { label: "Select", value: "select" },
  { label: "Move", value: "move" },
  { label: "Rotate", value: "rotate" },
  { label: "Scale", value: "scale" },
  { label: "Duplicate", value: "duplicate" },
  { label: "Group", value: "group" }
];

const gizmoModeOptions: { label: string; value: GizmoMode }[] = [
  { label: "Move", value: "move" },
  { label: "Rotate", value: "rotate" },
  { label: "Scale", value: "scale" },
  { label: "Universal", value: "universal" }
];

const transformSpaceOptions: { label: string; value: TransformSpace }[] = [
  { label: "World", value: "world" },
  { label: "Local", value: "local" }
];

const projectionModeOptions: Array<{
  label: string;
  value: "top-down" | "isometric" | "orbit" | "cinematic";
}> = [
  { label: "Top Down", value: "top-down" },
  { label: "Isometric", value: "isometric" },
  { label: "Orbit", value: "orbit" },
  { label: "Cinematic", value: "cinematic" }
];

const pivotModeOptions: { label: string; value: PivotMode }[] = [
  { label: "Object Origin", value: "object-origin" },
  { label: "Selection Center", value: "selection-center" },
  { label: "Custom Pivot", value: "custom-pivot" }
];

const originPresetOptions: { label: string; value: "asset-origin" | "base-center" | "custom" }[] = [
  { label: "Asset Origin", value: "asset-origin" },
  { label: "Base Center", value: "base-center" },
  { label: "Custom", value: "custom" }
];

const categoryOptions: { label: string; value: SceneObjectCategory }[] = [
  { label: "Gameplay", value: "gameplay-course-object" },
  { label: "Structures", value: "structure" },
  { label: "Props", value: "prop" },
  { label: "Landmarks", value: "landmark" },
  { label: "Vegetation", value: "vegetation" },
  { label: "Support", value: "supporting-scenery" },
  { label: "Animated", value: "animated-set-piece" }
];

const terrainToolOptions: { label: string; value: TerrainToolMode }[] = [
  { label: "Select", value: "select-region" },
  { label: "Create", value: "create-region" },
  { label: "Reshape", value: "reshape-region" },
  { label: "Classify", value: "classify-region" },
  { label: "Modifiers", value: "modifier-edit" },
  { label: "Paint", value: "paint-material" }
];

const terrainSculptModeOptions: { label: string; value: TerrainSculptMode }[] = [
  { label: "Raise", value: "raise" },
  { label: "Lower", value: "lower" },
  { label: "Smooth", value: "smooth" },
  { label: "Flatten", value: "flatten" }
];

const routingToolOptions: { label: string; value: RoutingToolMode }[] = [
  { label: "Select", value: "select-route" },
  { label: "Add Node", value: "add-node" },
  { label: "Move Node", value: "move-node" },
  { label: "Connect", value: "connect-segment" },
  { label: "Split", value: "split-segment" },
  { label: "Assign", value: "assign-role" },
  { label: "Corridor", value: "corridor-edit" },
  { label: "Envelope", value: "envelope-edit" }
];

const simulatorToolOptions: { label: string; value: SimulatorAnchorToolMode }[] = [
  { label: "Select", value: "select-anchor" },
  { label: "Tee", value: "tee-anchor" },
  { label: "Pin", value: "pin-anchor" },
  { label: "Hazard", value: "hazard-zone" },
  { label: "OB", value: "oob-boundary" },
  { label: "Drop", value: "drop-zone" },
  { label: "Preview", value: "preview-anchor" }
];

const terrainPurposeOptions: { label: string; value: TerrainGameplayPurpose }[] = [
  { label: "Tee Complex", value: "tee-complex" },
  { label: "Fairway", value: "fairway" },
  { label: "Rough", value: "rough" },
  { label: "Green Complex", value: "green-complex" },
  { label: "Hazard", value: "hazard" },
  { label: "OB", value: "out-of-bounds" },
  { label: "Transition", value: "transition" },
  { label: "Support", value: "support" },
  { label: "Preview", value: "preview" },
  { label: "Scenery", value: "scenery" }
];

const surfaceRuleSlopeOptions = [
  { label: "Strict", value: "strict" },
  { label: "Adaptive", value: "adaptive" },
  { label: "Expressive", value: "expressive" }
] as const;

const surfaceRuleOrientationOptions = [
  { label: "Upright", value: "upright" },
  { label: "Hybrid", value: "hybrid" },
  { label: "Surface Follow", value: "surface-follow" }
] as const;

const surfaceRulePackInfluenceOptions = [
  { label: "Balanced", value: "balanced" },
  { label: "Pack Led", value: "pack-led" },
  { label: "Surface Led", value: "surface-led" }
] as const;

const routingNodeKindOptions: { label: string; value: RoutingNodeKind }[] = [
  { label: "Tee", value: "tee" },
  { label: "Carry", value: "carry-target" },
  { label: "Landing", value: "landing-zone" },
  { label: "Decision", value: "decision-point" },
  { label: "Approach", value: "approach" },
  { label: "Green", value: "green-center" },
  { label: "Exit", value: "exit" },
  { label: "Preview", value: "preview-anchor" }
];

const routingSegmentRoleOptions: { label: string; value: RoutingSegmentKind }[] = [
  { label: "Primary", value: "primary-shot" },
  { label: "Layup", value: "layup" },
  { label: "Approach", value: "approach" },
  { label: "Transition", value: "transition" },
  { label: "Support", value: "support-path" }
];

const routingVisibilityOptions: Array<{
  label: string;
  value: "all" | "active-hole" | "selected-route" | "routing-only";
}> = [
  { label: "All", value: "all" },
  { label: "Active Hole", value: "active-hole" },
  { label: "Selected Route", value: "selected-route" },
  { label: "Routing Focus", value: "routing-only" }
];

const terrainPaintBlendOptions: Array<{ label: string; value: "paint" | "blend" }> = [
  { label: "Paint", value: "paint" },
  { label: "Blend", value: "blend" }
];

const terrainMaterialVisibilityOptions: Array<{
  label: string;
  value: "all" | "active-material" | "selected-region";
}> = [
  { label: "All Finish", value: "all" },
  { label: "Active Material", value: "active-material" },
  { label: "Selected Region", value: "selected-region" }
];

type BuilderGuideCard = {
  guideId: string;
  title: string;
  detail: string;
  shortcut: string;
  action: string;
  modes: AuthoringWorkspaceMode[];
  terrainTools?: TerrainToolMode[];
};

function parseNumericInput(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatCategoryLabel(category: SceneObjectCategory) {
  return category.replace(/-/g, " ");
}

function formatTitle(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isTypingElement(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) {
    return false;
  }

  const tagName = element.tagName;
  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    element.isContentEditable
  );
}

function mapAssetCategoryToSceneCategories(category: string): SceneObjectCategory[] {
  switch (category) {
    case "architecture":
      return ["structure"];
    case "vegetation":
      return ["vegetation"];
    case "landmark":
      return ["landmark"];
    case "gameplay":
      return ["gameplay-course-object"];
    case "props":
      return ["prop", "supporting-scenery"];
    default:
      return ["prop", "supporting-scenery"];
  }
}

function createPlacementDraftFromPaletteEntry(entry: AssetPlacementPaletteEntry): PlacementAssetDraft {
  return createPlacementAssetDraft({
    draftId: `placement-draft-${entry.assetId}`,
    assetRef: entry.assetId,
    label: entry.label,
    objectType: entry.assetCategory,
    category: entry.sceneCategory,
    footprintRadiusMeters: entry.footprintRadiusMeters,
    packId: entry.packId,
    tags: entry.styleTags,
    placementRules:
      entry.sceneCategory === "vegetation"
        ? ["scatter", "avoid-playable-core"]
        : entry.sceneCategory === "structure" || entry.sceneCategory === "landmark"
          ? ["hero-placement"]
          : ["scatter"]
  });
}

function createPlacementDragPayload(entry: AssetPlacementPaletteEntry): PlacementDragPayload {
  return {
    draft: createPlacementDraftFromPaletteEntry(entry),
    source: "content-pack"
  };
}

function issueTone(severity: "warning" | "high" | "critical") {
  switch (severity) {
    case "critical":
      return "error";
    case "high":
      return "warning";
    case "warning":
    default:
      return "info";
  }
}

function getBrushCategoryWeight(
  weights: Array<{ category: SceneObjectCategory; weight: number }>,
  category: SceneObjectCategory,
) {
  return weights.find((entry) => entry.category === category)?.weight ?? 1;
}

function getBrushAssetWeight(
  weights: Array<{ assetRef: string; weight: number }>,
  assetRef: string | null,
) {
  if (!assetRef) {
    return 1;
  }

  return weights.find((entry) => entry.assetRef === assetRef)?.weight ?? 1;
}

export function SceneAuthoringWorkspace() {
  const { project, validationReport, performanceAssessment, indexHealth } = useProjectSession();
  const sceneAuthoring = project.sceneAuthoring;
  const summary = summarizeSceneAuthoringState(sceneAuthoring);
  const placementPresetLibrary = summarizePlacementPresetLibrary(sceneAuthoring);
  const surfaceRulePresetLibrary = summarizeSurfaceRulePresetLibrary(sceneAuthoring);
  const surfaceRuleAuthoringSummary = summarizeSurfaceRuleAuthoring(sceneAuthoring);
  const surfaceRuleCoverage = summarizeSurfaceRuleCoverageMapping(sceneAuthoring);
  const surfaceRuleConflictResolution = summarizeSurfaceRuleConflictResolution(sceneAuthoring);
  const surfaceRuleCleanupAutomation = summarizeSurfaceRuleCleanupAutomation(sceneAuthoring);
  const surfaceRuleCleanupReview = summarizeSurfaceRuleCleanupReview(sceneAuthoring);
  const corridorBundleLibrary = summarizeLandmarkCorridorBundleLibrary(sceneAuthoring);
  const cleanupReviewReplay = summarizeSurfaceRuleCleanupReviewReplay(sceneAuthoring);
  const cleanupReviewReplayTimeline = summarizeSurfaceRuleCleanupReviewReplayTimeline(sceneAuthoring);
  const brushPresetLibrary = summarizeSceneryBrushPresetLibrary(sceneAuthoring);
  const terrainFinishSummary = summarizeTerrainFinishConsistency(sceneAuthoring);
  const courseScaleTerrainFinish = summarizeCourseScaleTerrainFinish(sceneAuthoring);
  const routingContinuitySummary = summarizeRoutingContinuity(sceneAuthoring);
  const routeFinishReconciliation = summarizeRouteFinishReconciliation(sceneAuthoring);
  const spatialAnalysis = createSpatialAnalysisReport(sceneAuthoring, project.simulatorLogic);
  const spatialTrust = createSpatialTrustReport(sceneAuthoring, project.simulatorLogic);
  const {
    buildPreviewFraming,
    cameraPathAuthoring,
    cameraPathPlaybackPolish,
    cameraPathCorrections,
    cameraCaptureExecution,
    cameraShotSequencing,
    shotOrderApproval,
    shotVariantSets,
    shotVariantShippingDecisions,
    shotVariantShippingManifest,
    previewCameraReadability,
    landmarkReadabilityCorrection,
    landmarkCorrectionActions,
    landmarkViewCorridorTools,
    landmarkCorridorStaging,
    landmarkCorridorSupportKits,
    landmarkCorridorKitComposition,
    corridorBundleRecommendations,
    releaseFacingWorldReadability,
    finalReleasePresentationConfidence
  } = summarizeProjectPresentationInsights(project);
  const rendererSnapshot = buildRendererSceneSnapshot(sceneAuthoring, {
    simulatorGeometry: project.simulatorLogic,
    analysisReport: spatialAnalysis
  });
  const activeCollection = sceneAuthoring.sceneCollections.find(
    (collection) => collection.collectionId === sceneAuthoring.activeCollectionId,
  ) ?? null;
  const outlinerNodes = buildSceneOutliner(sceneAuthoring);
  const canUndo = canUndoSceneAuthoring(sceneAuthoring);
  const canRedo = canRedoSceneAuthoring(sceneAuthoring);
  const categoryFilter = new Set(sceneAuthoring.selectionState.filterCategories);
  const fallbackHoleId = project.holes[0]?.holeId ?? "";
  const activeHoleId = sceneAuthoring.viewportState.activeHoleId ?? fallbackHoleId;
  const holeFocusOptions = project.holes.map((hole) => ({
    label: `Hole ${hole.number}`,
    value: hole.holeId
  }));
  const selectedObject = sceneAuthoring.sceneObjects.find(
    (sceneObject) => sceneObject.sceneObjectId === sceneAuthoring.selectionState.selectedObjectIds[0],
  ) ?? null;
  const selectedLandmarkObject = selectedObject?.category === "landmark" ? selectedObject : null;
  const selectedTerrainRegion = sceneAuthoring.terrainRegions.find(
    (terrainRegion) => terrainRegion.terrainRegionId === sceneAuthoring.editingState.selectedTerrainRegionId,
  ) ?? null;
  const selectedTerrainModifier = sceneAuthoring.terrainModifiers.find(
    (terrainModifier) => terrainModifier.terrainModifierId === sceneAuthoring.editingState.selectedTerrainModifierId,
  ) ?? null;
  const selectedRoutingNode = sceneAuthoring.routingNodes.find(
    (routingNode) => routingNode.routingNodeId === sceneAuthoring.editingState.selectedRoutingNodeId,
  ) ?? null;
  const selectedRoutingSegment = sceneAuthoring.routingSegments.find(
    (routingSegment) => routingSegment.routingSegmentId === sceneAuthoring.editingState.selectedRoutingSegmentId,
  ) ?? null;
  const selectedHazardZone = sceneAuthoring.hazardZones.find(
    (hazardZone) => hazardZone.hazardZoneId === sceneAuthoring.editingState.selectedHazardZoneId,
  ) ?? null;
  const selectedOutOfBoundsZone = sceneAuthoring.outOfBoundsZones.find(
    (zone) => zone.outOfBoundsZoneId === sceneAuthoring.editingState.selectedOutOfBoundsZoneId,
  ) ?? null;
  const selectedDropZoneArea = sceneAuthoring.dropZoneAreas.find(
    (area) => area.dropZoneAreaId === sceneAuthoring.editingState.selectedDropZoneAreaId,
  ) ?? null;
  const selectedSpatialRefs = sceneAuthoring.selectionState.selectedSpatialEntityRefs;
  const selectedTeeZoneRef = selectedSpatialRefs.find((reference) => reference.entityType === "tee-zone") ?? null;
  const selectedGreenZoneRef = selectedSpatialRefs.find((reference) => reference.entityType === "green-zone") ?? null;
  const selectedFairwayCorridorRef = selectedSpatialRefs.find(
    (reference) => reference.entityType === "fairway-corridor",
  ) ?? null;
  const selectedVisibilityCorridorRef = selectedSpatialRefs.find(
    (reference) => reference.entityType === "visibility-corridor",
  ) ?? null;
  const selectedPlayRouteEnvelopeRef = selectedSpatialRefs.find(
    (reference) => reference.entityType === "play-route-envelope",
  ) ?? null;
  const selectedTeeZone = selectedTeeZoneRef
    ? sceneAuthoring.teeZones.find((zone) => zone.teeZoneId === selectedTeeZoneRef.entityId) ?? null
    : null;
  const selectedGreenZone = selectedGreenZoneRef
    ? sceneAuthoring.greenZones.find((zone) => zone.greenZoneId === selectedGreenZoneRef.entityId) ?? null
    : null;
  const selectedFairwayCorridor = selectedFairwayCorridorRef
    ? sceneAuthoring.fairwayCorridors.find((corridor) => corridor.fairwayCorridorId === selectedFairwayCorridorRef.entityId) ?? null
    : null;
  const selectedVisibilityCorridor = selectedVisibilityCorridorRef
    ? sceneAuthoring.visibilityCorridors.find(
        (corridor) => corridor.visibilityCorridorId === selectedVisibilityCorridorRef.entityId,
      ) ?? null
    : null;
  const selectedPlayRouteEnvelope = selectedPlayRouteEnvelopeRef
    ? sceneAuthoring.playRouteEnvelopes.find(
        (envelope) => envelope.playRouteEnvelopeId === selectedPlayRouteEnvelopeRef.entityId,
      ) ?? null
    : null;
  const activeHolePlayProfile = project.simulatorLogic.holePlayProfiles.find(
    (profile) => profile.holeId === activeHoleId,
  ) ?? null;
  const buildIssues = validationReport.issues.filter((issue) => issue.ownerModule === "build");
  const activeHoleIssues = validationReport.issues.filter(
    (issue) =>
      issue.ownerModule === "playability" ||
      issue.ownerModule === "gameplay" ||
      (issue.ownerModule === "build" && (!activeHoleId || issue.relatedEntityId === activeHoleId || issue.relatedEntityId === null)),
  );
  const analysisCards: Array<{
    id: string;
    label: string;
    count: number;
    severity: "warning" | "high" | "critical";
    detail: string;
  }> = [
    {
      id: "blocked-line",
      label: "Blocked line of play",
      count: spatialAnalysis.blockedLineOfPlayIssues.length,
      severity: spatialAnalysis.blockedLineOfPlayIssues.some((issue) => issue.severity === "critical")
        ? "critical"
        : "warning",
      detail: "Route envelopes still intersect blocking geometry or blocked zones."
    },
    {
      id: "sightlines",
      label: "Sightline concerns",
      count: spatialAnalysis.sightlineQualityIssues.length,
      severity: spatialAnalysis.sightlineQualityIssues.some((issue) => issue.severity === "critical")
        ? "high"
        : "warning",
      detail: "Visibility corridors are missing, narrow, or already blocked."
    },
    {
      id: "route-gaps",
      label: "Route discontinuities",
      count: spatialAnalysis.routeDiscontinuities.length,
      severity: "critical",
      detail: "Disconnected routing breaks tee-to-green flow."
    },
    {
      id: "collisions",
      label: "Collision conflicts",
      count: spatialAnalysis.collisionConflicts.length,
      severity: spatialAnalysis.collisionConflicts.some((issue) => issue.severity === "critical") ? "high" : "warning",
      detail: "Playable geometry still overlaps scene objects or zones."
    },
    {
      id: "landing",
      label: "Landing obstruction",
      count: spatialAnalysis.landingZoneObstructionRisks.length,
      severity: spatialAnalysis.landingZoneObstructionRisks.some((issue) => issue.severity === "critical")
        ? "high"
        : "warning",
      detail: "Fairway corridors still carry landing-zone obstruction risk."
    },
    {
      id: "occlusion",
      label: "Occlusion pressure",
      count: spatialAnalysis.occlusionRisks.length,
      severity: spatialAnalysis.occlusionRisks.some((issue) => issue.severity === "critical")
        ? "high"
        : "warning",
      detail: "Structures, landmarks, or dense vegetation still crowd critical sightlines."
    },
    {
      id: "anchors",
      label: "Simulator anchor conflicts",
      count: spatialAnalysis.simulatorAnchorConflicts.length,
      severity: spatialAnalysis.simulatorAnchorConflicts.some((issue) => issue.severity === "critical")
        ? "critical"
        : "warning",
      detail: "Simulator bindings still point at weak or conflicting geometry."
    },
    {
      id: "preview",
      label: "Preview framing",
      count: spatialAnalysis.previewFramingWeaknesses.length,
      severity: spatialAnalysis.previewFramingWeaknesses.some((issue) => issue.severity === "critical")
        ? "high"
        : "warning",
      detail: "Preview and flyover anchors still need stronger staging and spacing."
    }
  ];
  const performanceSnapshot = createPerformanceSnapshotFromSpatialState(sceneAuthoring);
  const creatorDelivery = summarizeCreatorDeliveryFlow(project);
  const releaseHandoff = summarizeCreatorReleaseHandoff(project);
  const finalDelivery = summarizeFinalCreatorDelivery(project);
  const releaseExecution = summarizeReleaseExecutionState(project);
  const shareReadyPresentation = summarizeShareReadyPresentationHandoff({
    releaseHandoff,
    finalDelivery,
    cameraPlayback: cameraPathPlaybackPolish,
    landmarkActions: landmarkCorrectionActions,
    finalPresentation: finalReleasePresentationConfidence
  });
  const presentationSharePacket = summarizePresentationSharePacketFinalization({
    releaseExecution,
    releaseHandoff,
    finalDelivery,
    shareReadyPresentation
  });
  const presentationPacketProofing = summarizePresentationPacketProofing({
    releaseHandoff,
    finalDelivery,
    shareReadyPresentation,
    presentationSharePacket,
    shotOrderApproval,
    corridorSupportKits: landmarkCorridorSupportKits
  });
  const presentationShareDelivery = summarizePresentationShareDeliveryConfidence({
    creatorDelivery,
    releaseHandoff,
    finalDelivery,
    shareReadyPresentation,
    presentationSharePacket,
    presentationPacketProofing,
    cameraCapture: cameraCaptureExecution,
    landmarkCorridors: landmarkViewCorridorTools,
    cameraSequencing: cameraShotSequencing,
    landmarkStaging: landmarkCorridorStaging,
    shotOrderApproval,
    shotVariantSets,
    variantShippingDecisions: shotVariantShippingDecisions,
    variantShippingManifest: shotVariantShippingManifest,
    corridorSupportKits: landmarkCorridorSupportKits,
    corridorKitComposition: landmarkCorridorKitComposition,
    corridorBundleLibraries: {
      overallState: corridorBundleLibrary.overallState,
      correctiveHoleCount: Math.max(0, landmarkCorridorKitComposition.correctiveHoleCount - corridorBundleLibrary.quickApplyCount),
      recommendedAction: corridorBundleLibrary.recommendedAction
    },
    corridorBundleRecommendations,
    cleanupReplayTimeline: cleanupReviewReplayTimeline
  });
  const finalShareGate = summarizeFinalShareGateApproval({
    releaseExecution,
    presentationShareDelivery,
    presentationPacketProofing,
    presentationSharePacket,
    shotVariantSets,
    variantShippingDecisions: shotVariantShippingDecisions,
    variantShippingManifest: shotVariantShippingManifest,
    corridorKitComposition: landmarkCorridorKitComposition,
    corridorBundleLibraries: {
      overallState: corridorBundleLibrary.overallState,
      correctiveHoleCount: Math.max(0, landmarkCorridorKitComposition.correctiveHoleCount - corridorBundleLibrary.quickApplyCount),
      recommendedAction: corridorBundleLibrary.recommendedAction
    },
    corridorBundleRecommendations,
    cleanupReplayTimeline: cleanupReviewReplayTimeline
  });
  const contentPacks = summarizeAssetContentPacks(project.assets);
  const allPlacementEntries = listAssetPlacementPalette(project.assets);
  const activePlacementDraft = sceneAuthoring.editingState.activePlacementDraft;
  const authoringPreview = sceneAuthoring.editingState.authoringPreview;
  const activeTerrainMaterial =
    sceneAuthoring.terrainMaterialPalette.find(
      (material) => material.terrainMaterialId === sceneAuthoring.editingState.activeTerrainMaterialId,
    ) ?? sceneAuthoring.terrainMaterialPalette[0] ?? null;
  const totalPlacedPackObjects = sceneAuthoring.sceneObjects.filter((sceneObject) => sceneObject.assetRef !== null).length;
  const spatialIssueFeed = [
    ...spatialAnalysis.blockedLineOfPlayIssues.map((issue) => ({
      issueId: `blocked-${issue.playRouteEnvelopeId}`,
      title: "Blocked line of play",
      detail: `${issue.blockingSceneObjectIds.length} scene blockers and ${issue.blockedZoneIds.length} blocked zones still sit inside the playable corridor.`,
      recommendedAction: "Widen or reposition the play-route envelope, or move blocking scene objects out of the shot corridor.",
      severity: issue.severity
    })),
    ...spatialAnalysis.sightlineQualityIssues.map((issue) => ({
      issueId: `sightline-${issue.holeId}-${issue.visibilityCorridorId ?? "missing"}`,
      title: "Sightline weakness",
      detail: issue.reason,
      recommendedAction: "Refine visibility corridor width or remove blocking structures from the presentation lane.",
      severity: issue.severity
    })),
    ...spatialAnalysis.routeDiscontinuities.map((issue) => ({
      issueId: `route-gap-${issue.holeId}`,
      title: "Route discontinuity",
      detail: issue.reason,
      recommendedAction: "Reconnect routing nodes and confirm tee-to-green flow remains contiguous.",
      severity: issue.severity
    })),
    ...spatialAnalysis.collisionConflicts.map((issue) => ({
      issueId: `collision-${issue.leftRef.entityId}-${issue.rightRef.entityId}`,
      title: "Collision conflict",
      detail: issue.reason,
      recommendedAction: "Move or resize the conflicting zones or scene objects until the overlap is intentional and safe.",
      severity: issue.severity
    })),
    ...spatialAnalysis.landingZoneObstructionRisks.map((issue) => ({
      issueId: `landing-${issue.fairwayCorridorId}`,
      title: "Landing-zone obstruction risk",
      detail: issue.reason,
      recommendedAction: "Open the fairway corridor or relocate the obstructing assets around the intended landing areas.",
      severity: issue.severity
    })),
    ...spatialAnalysis.occlusionRisks.map((issue) => ({
      issueId: `occlusion-${issue.holeId}-${issue.visibilityCorridorId ?? "none"}`,
      title: "Occlusion pressure",
      detail: issue.reason,
      recommendedAction: "Trim or move dense blockers, or widen the visibility corridor to preserve readable framing.",
      severity: issue.severity
    })),
    ...spatialAnalysis.simulatorAnchorConflicts.map((issue) => ({
      issueId: `sim-${issue.bindingType}-${issue.bindingId}`,
      title: "Simulator geometry conflict",
      detail: issue.reason,
      recommendedAction: "Repair the bound Build geometry before relying on simulator readiness for this hole.",
      severity: issue.severity
    })),
    ...spatialAnalysis.previewFramingWeaknesses.map((issue) => ({
      issueId: `preview-${issue.holeId}-${issue.role}`,
      title: "Preview framing weakness",
      detail: issue.reason,
      recommendedAction: "Reposition or spread the preview anchors so minimap and flyover framing reads clearly in motion.",
      severity: issue.severity
    }))
  ].slice(0, 8);
  const [terrainDraftPurpose, setTerrainDraftPurpose] = useState<TerrainGameplayPurpose>("fairway");
  const [routingNodeDraftKind, setRoutingNodeDraftKind] = useState<RoutingNodeKind>("landing-zone");
  const [selectedBuildPackId, setSelectedBuildPackId] = useState<string | null>(contentPacks[0]?.packId ?? null);
  const [assetDrawerOpen, setAssetDrawerOpen] = useState(true);
  const [assetDrawerQuery, setAssetDrawerQuery] = useState("");
  const [assetDrawerCategory, setAssetDrawerCategory] = useState<SceneObjectCategory | "all">("all");
  const [assetDrawerTag, setAssetDrawerTag] = useState<string | "all">("all");
  const [assetDrawerRecentOnly, setAssetDrawerRecentOnly] = useState(false);
  const [placementPresetName, setPlacementPresetName] = useState("");
  const [surfaceRulePresetName, setSurfaceRulePresetName] = useState("");
  const [brushPresetName, setBrushPresetName] = useState("");
  const selectedBuildPack =
    contentPacks.find((pack) => pack.packId === selectedBuildPackId) ?? contentPacks[0] ?? null;
  const buildPaletteEntries = listAssetPlacementPalette(project.assets, {
    packId: selectedBuildPack?.packId ?? null
  });
  const recentPlacedAssetRefs = sceneAuthoring.sceneObjects
    .slice()
    .reverse()
    .map((sceneObject) => sceneObject.assetRef)
    .filter((assetRef): assetRef is string => assetRef !== null);
  const recentDrawerEntries = listRecentPlacementPaletteEntries(allPlacementEntries, recentPlacedAssetRefs, 8);
  const availableDrawerTags = [...new Set(buildPaletteEntries.flatMap((entry) => entry.styleTags))].sort();
  const drawerEntries = buildPaletteEntries.filter((entry) => {
    const matchesQuery =
      assetDrawerQuery.trim().length === 0 ||
      entry.label.toLowerCase().includes(assetDrawerQuery.trim().toLowerCase()) ||
      entry.styleTags.some((tag) => tag.toLowerCase().includes(assetDrawerQuery.trim().toLowerCase()));
    const matchesCategory = assetDrawerCategory === "all" ? true : entry.sceneCategory === assetDrawerCategory;
    const matchesTag = assetDrawerTag === "all" ? true : entry.styleTags.includes(assetDrawerTag);
    const matchesRecent = assetDrawerRecentOnly ? recentDrawerEntries.some((recent) => recent.assetId === entry.assetId) : true;
    return matchesQuery && matchesCategory && matchesTag && matchesRecent;
  });
  const brushReadyEntries = buildPaletteEntries.filter((entry) => entry.brushEligible);
  const selectedPackPlacedObjectCount = selectedBuildPack
    ? sceneAuthoring.sceneObjects.filter((sceneObject) => sceneObject.tags.includes(selectedBuildPack.packId)).length
    : totalPlacedPackObjects;
  const routingVisibilitySummary =
    sceneAuthoring.editingState.routingGuideSettings.visibilityMode === "all"
      ? "All routing overlays visible"
      : sceneAuthoring.editingState.routingGuideSettings.visibilityMode === "active-hole"
        ? "Only the active hole stays emphasized"
        : sceneAuthoring.editingState.routingGuideSettings.visibilityMode === "selected-route"
          ? "Selected route stays isolated while editing"
          : "Routing overlay stays visually dominant";
  const terrainFinishHotspotCount =
    terrainFinishSummary.coverageGapRegionIds.length +
    terrainFinishSummary.patchyRegionIds.length +
    terrainFinishSummary.dominantMaterialOveruseRegionIds.length;
  const builderGuideCards: BuilderGuideCard[] = [
    {
      guideId: "placement-pack-flow",
      title: "Place from approved packs without losing the world",
      detail:
        "Arm one approved asset or drag it straight from the embedded drawer into the viewport. Placement preset libraries, surface-rule presets, and the coverage overlay keep snap, slope posture, and terrain intent reusable without burying the creator in setup.",
      shortcut: "1 + drag or click",
      action: activePlacementDraft
        ? `Placing ${activePlacementDraft.label}${authoringPreview.surfaceLabel ? ` on ${authoringPreview.surfaceLabel}` : ""}`
        : placementPresetLibrary.totalCount > 0
          ? `${placementPresetLibrary.favoriteCount} placement favorites · ${surfaceRuleCleanupAutomation.autoCleanableHoleCount} cleanup targets · ${surfaceRuleAuthoringSummary.currentSummary}`
          : "Open the drawer, arm one approved asset, or drag it into the world for direct placement",
      modes: ["placement"]
    },
    {
      guideId: "brush-pack-flow",
      title: "Use scenery brush as guided world dressing",
      detail:
        "Brush-ready vegetation, rocks, and support props stay pack-aware. Brush preset libraries keep density, weighting, spacing, slope limits, and pack influence reusable instead of forcing creators to rebuild brush logic each pass.",
      shortcut: "5 + click",
      action:
        sceneAuthoring.editingState.sceneryBrushDrafts.length > 0
          ? `${sceneAuthoring.editingState.sceneryBrushDrafts.length} assets loaded · ${brushPresetLibrary.favoriteCount} favorite brush presets ready`
          : "Load brush-ready assets from the current pack",
      modes: ["scenery-brush"]
    },
    {
      guideId: "terrain-sculpt-separation",
      title: "Keep shaping and finishing separate",
      detail:
        "Use sculpt tools to change landform and paint tools to change finish. Layer, balance, patchiness, coverage gaps, dominant-material signals, and weak-hole cues keep finish work readable while routing is still moving.",
      shortcut: "2 terrain",
      action:
        sceneAuthoring.editingState.activeTerrainTool === "paint-material"
          ? `Painting ${activeTerrainMaterial?.label ?? "terrain finish"} · ${terrainFinishHotspotCount} hotspots · ${courseScaleTerrainFinish.imbalancedHoleCount} weak holes`
          : courseScaleTerrainFinish.recommendedAction,
      modes: ["terrain"],
      terrainTools: ["modifier-edit", "paint-material"]
    },
    {
      guideId: "routing-ergonomics",
      title: "Route with guides, not nested tabs",
      detail:
        "Angle snap, working height, merge tolerance, merge resolution, continuity smoothing, width harmonizing, node elevation polish, delivery confidence, and visibility all live in one routing lane so finish-stage route shaping stays direct and teachable.",
      shortcut: "3 routing",
      action: `${routingContinuitySummary.deliveryConfidence} delivery confidence · ${routeFinishReconciliation.unresolvedHoleCount} unresolved holes · ${routeFinishReconciliation.recommendedAction}`,
      modes: ["routing"]
    },
    {
      guideId: "sim-export-context",
      title: "Keep simulator geometry in the same camera space",
      detail:
        "Author tee, green, hazard, OB, drop, and preview anchors beside the actual course so camera paths, landmark readability, and release presentation never drift away from what Preview will actually frame.",
      shortcut: "4 anchors",
      action: `${shotVariantShippingManifest.overallState} shipping manifest · ${corridorBundleRecommendations.overallState} corridor guidance · ${finalShareGate.signoffLockState} share lock`,
      modes: ["simulator-anchors"]
    }
  ];
  const visibleBuilderGuides = builderGuideCards.filter((guide) => {
    if (!guide.modes.includes(sceneAuthoring.viewportState.authoringMode)) {
      return false;
    }
    if (guide.terrainTools && !guide.terrainTools.includes(sceneAuthoring.editingState.activeTerrainTool)) {
      return false;
    }
    return !sceneAuthoring.editingState.dismissedGuideIds.includes(guide.guideId);
  });
  const activeHoleNumber = project.holes.find((hole) => hole.holeId === activeHoleId)?.number ?? null;
  const activeHoleSurfaceRuleCoverage =
    surfaceRuleCoverage.holeSummaries.find((summary) => summary.holeId === activeHoleId) ?? null;
  const activeModeSummary =
    sceneAuthoring.viewportState.authoringMode === "placement"
      ? {
          eyebrow: "Scenery + Placement",
          title: "World-first placement and transforms",
          detail:
            "Keep the world in view while you select, move, rotate, duplicate, and group scenery without dropping into disconnected editor tabs.",
          nextAction:
            authoringPreview.visible && authoringPreview.mode === "placement"
              ? authoringPreview.label ?? "Drop the dragged asset to commit placement."
              : activePlacementDraft
              ? `Click the world to place ${activePlacementDraft.label}, or drag another approved pack asset straight into the viewport for low-friction placement swaps.`
              : sceneAuthoring.placementMode === "select"
                ? "Click scenery to select it, then use gizmos or the inspector to refine transforms."
                : placementPresetLibrary.totalCount > 0
                  ? `Use ${sceneAuthoring.placementMode.replace(/-/g, " ")} in the viewport, then quick-apply placement favorites while ${surfaceRuleAuthoringSummary.currentSummary.toLowerCase()} keeps surface behavior coherent.`
                  : `Use ${sceneAuthoring.placementMode.replace(/-/g, " ")} in the viewport, then fine-tune the result in the contextual inspector.`,
          controlHint: "Shortcuts: 1 placement · Drag from pack browser · placement + surface-rule favorites live in Build · G move gizmo · R rotate gizmo · S scale gizmo · F focus"
        }
      : sceneAuthoring.viewportState.authoringMode === "scenery-brush"
        ? {
            eyebrow: "Scenery Brush",
            title: "Brush world dressing without losing pack context",
            detail:
              "Scatter vegetation, rock detail, and support scenery from approved packs with visible density and variance controls instead of hidden automation.",
            nextAction:
              sceneAuthoring.editingState.sceneryBrushDrafts.length > 0
                ? authoringPreview.visible && authoringPreview.mode === "scenery-brush"
                  ? authoringPreview.label ?? "Brush preview is live in the viewport."
                  : brushPresetLibrary.favoriteCount > 0
                    ? "Hover to preview the live footprint, then click the viewport to brush scenery while favorite brush presets stay one switch away."
                    : "Hover to preview the live footprint, then click the viewport to brush scenery from the current pack palette while density and variation stay visible."
                : "Load brush-ready assets from a content pack, then use the brush to world-dress terrain edges, support spaces, and scenic rhythm.",
            controlHint: "Shortcut: 5 scenery brush · preset libraries keep favorite mixes hot"
          }
      : sceneAuthoring.viewportState.authoringMode === "terrain"
        ? {
            eyebrow: "Terrain",
            title: "Sculpt broad landform first, then detail",
            detail:
              "Use large readable terrain passes first, then tighten regions, brush falloff, and gameplay purpose without leaving the world view.",
            nextAction:
              sceneAuthoring.editingState.activeTerrainTool === "create-region"
                ? "Click the viewport to stamp a new terrain region on the active hole."
                : sceneAuthoring.editingState.activeTerrainTool === "paint-material"
                  ? authoringPreview.visible && authoringPreview.mode === "terrain-finish"
                  ? authoringPreview.label ?? "Terrain finish preview is live in the viewport."
                    : `Hover to preview ${activeTerrainMaterial?.label ?? "terrain finish"}, then click the selected region to paint finish while finish-intel overlays keep weak holes, gaps, and imbalance visible.`
                  : sceneAuthoring.editingState.activeTerrainTool === "modifier-edit"
                    ? "Click the selected region to paint the current sculpt brush and keep landforms readable."
                    : "Select a terrain region, then classify, reshape, or edit modifiers directly in context.",
            controlHint: "Shortcut: 2 terrain · Finish Intel overlay keeps hole-scale balance and coverage readable"
          }
        : sceneAuthoring.viewportState.authoringMode === "routing"
          ? {
              eyebrow: "Routing",
              title: "Lay out flow the way players read it",
              detail:
                "Place nodes and refine corridors in the world so tee-to-green flow stays obvious before you chase micro-detail.",
              nextAction:
                sceneAuthoring.editingState.activeRoutingTool === "add-node"
                  ? "Click the viewport to add the next routing node, then connect it into the playable chain."
                  : `Select nodes, segments, or corridor handles to refine continuity, merge resolution, width, height, and final route delivery confidence (${routingContinuitySummary.deliveryConfidence}) while ${routeFinishReconciliation.unresolvedHoleCount} unresolved holes stay visible for cleanup.`,
              controlHint: "Shortcut: 3 routing · merge clusters, replayable cleanup reviews, and delivery confidence stay visible while you polish"
            }
          : {
              eyebrow: "Simulator Geometry",
              title: "Author export-critical zones in place",
              detail:
                "Tee anchors, greens, hazards, OB, drop zones, and preview anchors stay readable when they are placed in the same camera space as the course.",
              nextAction:
                sceneAuthoring.editingState.activeSimulatorAnchorTool === "select-anchor"
                  ? "Select a simulator zone to inspect export quality, scale, and spatial conflict notes."
                  : `Click the viewport to place the active simulator geometry directly on the hole while the shipping manifest stays ${shotVariantShippingManifest.overallState}, corridor guidance stays ${corridorBundleRecommendations.overallState}, and the share lock stays ${finalShareGate.signoffLockState}.`,
              controlHint: "Shortcut: 4 simulator anchors · Keep export geometry visible while you refine shipping decisions, corridor libraries, and final share-gate confidence"
            };
  const builderModeCards = [
    {
      mode: "placement" as const,
      label: "Placement",
      shortcut: "1",
      value: summary.objectCount,
      note: `${summary.gameplayRelevantCount} gameplay-aware objects · ${placementPresetLibrary.favoriteCount + surfaceRulePresetLibrary.favoriteCount} preset favorites`
    },
    {
      mode: "scenery-brush" as const,
      label: "Brush",
      shortcut: "5",
      value: sceneAuthoring.editingState.sceneryBrushDrafts.length,
      note: `${brushReadyEntries.length} brush-ready pack assets · ${summary.brushPresetCount} presets`
    },
    {
      mode: "terrain" as const,
      label: "Terrain",
      shortcut: "2",
      value: summary.terrainRegionCount,
      note: `${sceneAuthoring.terrainModifiers.length} sculpt modifiers · ${terrainFinishHotspotCount} hotspots · ${courseScaleTerrainFinish.imbalancedHoleCount} weak holes`
    },
    {
      mode: "routing" as const,
      label: "Routing",
      shortcut: "3",
      value: `${summary.connectedRoutingPathCount}/${summary.routingPathCount}`,
      note: `${routingContinuitySummary.deliveryConfidence} delivery confidence · ${routingContinuitySummary.mergeClusterCount} merge clusters`
    },
    {
      mode: "simulator-anchors" as const,
      label: "Sim Anchors",
      shortcut: "4",
      value: summary.simulatorZoneCount,
      note: "Export-critical geometry"
    }
  ];

  useEffect(() => {
    if (!contentPacks.length) {
      if (selectedBuildPackId !== null) {
        setSelectedBuildPackId(null);
      }
      return;
    }

    if (!selectedBuildPackId || !contentPacks.some((pack) => pack.packId === selectedBuildPackId)) {
      setSelectedBuildPackId(contentPacks[0]?.packId ?? null);
    }
  }, [contentPacks, selectedBuildPackId]);

  useEffect(() => {
    if (
      sceneAuthoring.viewportState.rendererMode === "renderer-backed" &&
      sceneAuthoring.viewportState.backendStatus === "connected"
    ) {
      return;
    }

    updateSceneAuthoringState((state) =>
      syncViewportRuntimeState(state, {
        rendererMode: "renderer-backed",
        backendStatus: "connected"
      }),
    );
  }, [sceneAuthoring.viewportState.backendStatus, sceneAuthoring.viewportState.rendererMode]);

  useEffect(() => {
    const placementPreviewStillValid =
      sceneAuthoring.viewportState.authoringMode === "placement" &&
      sceneAuthoring.editingState.activePlacementDraft !== null;
    const brushPreviewStillValid =
      sceneAuthoring.viewportState.authoringMode === "scenery-brush" &&
      sceneAuthoring.editingState.sceneryBrushDrafts.length > 0;
    const terrainFinishPreviewStillValid =
      sceneAuthoring.viewportState.authoringMode === "terrain" &&
      sceneAuthoring.editingState.activeTerrainTool === "paint-material" &&
      sceneAuthoring.editingState.selectedTerrainRegionId !== null &&
      sceneAuthoring.editingState.activeTerrainMaterialId !== null;

    if (placementPreviewStillValid || brushPreviewStillValid || terrainFinishPreviewStillValid) {
      return;
    }

    if (!sceneAuthoring.editingState.authoringPreview.visible && sceneAuthoring.editingState.authoringPreview.mode === "idle") {
      return;
    }

    updateSceneAuthoringState((state) => clearAuthoringPreview(state));
  }, [
    sceneAuthoring.editingState.activePlacementDraft,
    sceneAuthoring.editingState.activeTerrainMaterialId,
    sceneAuthoring.editingState.activeTerrainTool,
    sceneAuthoring.editingState.authoringPreview.mode,
    sceneAuthoring.editingState.authoringPreview.visible,
    sceneAuthoring.editingState.sceneryBrushDrafts.length,
    sceneAuthoring.editingState.selectedTerrainRegionId,
    sceneAuthoring.viewportState.authoringMode
  ]);

  const focusSelection = useEffectEvent(() => {
    const focusReference =
      selectedSpatialRefs[0] ??
      (selectedObject
        ? ({
            entityType: "scene-object",
            entityId: selectedObject.sceneObjectId,
            holeId: activeHoleId ?? null,
            note: selectedObject.name
          } satisfies SceneSpatialReference)
        : null);
    if (!focusReference) {
      return;
    }

    updateSceneAuthoringState((state) => focusViewportOnReference(state, focusReference));
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingElement(event.target)) {
        return;
      }

      const isModifier = event.metaKey || event.ctrlKey;
      const normalizedKey = event.key.toLowerCase();

      if (isModifier) {
        if (normalizedKey === "z" && !event.shiftKey) {
          event.preventDefault();
          updateSceneAuthoringState((state) => undoSceneAuthoring(state));
          return;
        }

        if (normalizedKey === "y" || (normalizedKey === "z" && event.shiftKey)) {
          event.preventDefault();
          updateSceneAuthoringState((state) => redoSceneAuthoring(state));
          return;
        }
      }

      if (
        normalizedKey === "1" ||
        normalizedKey === "2" ||
        normalizedKey === "3" ||
        normalizedKey === "4" ||
        normalizedKey === "5"
      ) {
        const modeMap: Record<string, AuthoringWorkspaceMode> = {
          "1": "placement",
          "5": "scenery-brush",
          "2": "terrain",
          "3": "routing",
          "4": "simulator-anchors"
        };
        const nextMode = modeMap[normalizedKey];
        if (!nextMode) {
          return;
        }
        event.preventDefault();
        updateSceneAuthoringState((state) =>
          updateViewportState(state, {
            ...state.viewportState,
            authoringMode: nextMode
          }),
        );
        return;
      }

      if (normalizedKey === "f") {
        event.preventDefault();
        focusSelection();
        return;
      }

      if (normalizedKey === "g" || normalizedKey === "r" || normalizedKey === "s") {
        const nextGizmoMode: GizmoMode =
          normalizedKey === "g" ? "move" : normalizedKey === "r" ? "rotate" : "scale";
        event.preventDefault();
        updateSceneAuthoringState((state) => setGizmoMode(state, nextGizmoMode));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function toggleOverlay(key: keyof typeof sceneAuthoring.overlayState) {
    updateSceneAuthoringState((state) => ({
      ...state,
      overlayState: {
        ...state.overlayState,
        [key]: !state.overlayState[key]
      }
    }));
  }

  function switchAuthoringMode(nextMode: AuthoringWorkspaceMode) {
    updateSceneAuthoringState((state) =>
      updateViewportState(state, {
        ...state.viewportState,
        authoringMode: nextMode
      }),
    );
  }

  function setHoleFocus(nextHoleId: string) {
    updateSceneAuthoringState((state) =>
      updateViewportState(state, {
        ...state.viewportState,
        activeHoleId: nextHoleId
      }),
    );
  }

  function selectEntity(reference: SceneSpatialReference, append: boolean) {
    updateSceneAuthoringState((state) => {
      switch (reference.entityType) {
        case "scene-object":
          return selectSceneObjects(state, [reference.entityId], { append });
        case "terrain-region":
          return selectTerrainRegionForEditing(state, reference.entityId);
        case "routing-node":
          return selectRoutingNodeForEditing(state, reference.entityId);
        case "routing-segment":
          return selectRoutingSegmentForEditing(state, reference.entityId);
        case "fairway-corridor":
          return selectFairwayCorridorForEditing(state, reference.entityId);
        case "visibility-corridor":
          return selectVisibilityCorridorForEditing(state, reference.entityId);
        case "play-route-envelope":
          return selectPlayRouteEnvelopeForEditing(state, reference.entityId);
        case "hazard-zone":
          return selectHazardZoneForEditing(state, reference.entityId);
        case "out-of-bounds-zone":
          return selectOutOfBoundsZoneForEditing(state, reference.entityId);
        case "drop-zone-area":
          return selectDropZoneAreaForEditing(state, reference.entityId);
        default:
          return selectSpatialEntities(state, [reference], { append });
      }
    });
  }

  function commitViewportInteraction(
    target: RendererInteractionTarget,
    delta: RendererInteractionDelta,
  ) {
    updateSceneAuthoringState((state) => applyRendererInteractionDelta(state, target, delta));
  }

  function handleViewportGroundAction(worldPoint: Vector3) {
    updateSceneAuthoringState((state) => {
      if (state.viewportState.authoringMode === "placement" && state.editingState.activePlacementDraft) {
        return placeSceneObjectFromDraft(state, {
          draft: state.editingState.activePlacementDraft,
          position: worldPoint,
          holeId: activeHoleId
        });
      }

      if (state.viewportState.authoringMode === "scenery-brush") {
        return applySceneryBrushStroke(state, {
          center: worldPoint,
          holeId: activeHoleId
        });
      }

      if (state.viewportState.authoringMode === "terrain") {
        if (state.editingState.activeTerrainTool === "paint-material" && state.editingState.selectedTerrainRegionId) {
          return applyTerrainMaterialStroke(state, {
            regionId: state.editingState.selectedTerrainRegionId,
            center: worldPoint
          });
        }

        if (state.editingState.activeTerrainTool === "modifier-edit" && state.editingState.selectedTerrainRegionId) {
          return applyTerrainSculptStroke(state, {
            regionId: state.editingState.selectedTerrainRegionId,
            center: worldPoint
          });
        }

        if (state.editingState.activeTerrainTool === "create-region" && activeHoleId) {
          return createTerrainRegionForHole(state, {
            holeId: activeHoleId,
            gameplayPurpose: terrainDraftPurpose,
            terrainProfileId: state.terrainProfiles[0]?.terrainProfileId,
            name: `Hole ${project.holes.find((hole) => hole.holeId === activeHoleId)?.number ?? ""} Terrain`,
            center: worldPoint
          });
        }

        return state;
      }

      if (state.viewportState.authoringMode === "routing" && activeHoleId) {
        if (state.editingState.activeRoutingTool === "add-node") {
          return addRoutingNodeForHole(state, {
            holeId: activeHoleId,
            kind: routingNodeDraftKind,
            position: worldPoint
          });
        }

        return state;
      }

      if (state.viewportState.authoringMode === "simulator-anchors" && activeHoleId) {
        switch (state.editingState.activeSimulatorAnchorTool) {
          case "tee-anchor":
            return createTeeZoneForHole(state, {
              holeId: activeHoleId,
              teeSetRefs: project.teeSets
                .filter((teeSet) => teeSet.holeYardages[activeHoleId])
                .map((teeSet) => teeSet.teeSetId),
              center: worldPoint
            });
          case "pin-anchor":
            return createGreenZoneForHoleAt(state, {
              holeId: activeHoleId,
              center: worldPoint
            });
          case "hazard-zone":
            return createHazardZoneForHole(state, {
              holeId: activeHoleId,
              center: worldPoint
            });
          case "oob-boundary":
            return createOutOfBoundsZoneForHole(state, {
              holeId: activeHoleId,
              center: worldPoint
            });
          case "drop-zone":
            return createDropZoneAreaForHole(state, {
              holeId: activeHoleId,
              center: worldPoint
            });
          case "preview-anchor":
            return createPreviewAnchorForHole(state, {
              holeId: activeHoleId,
              position: {
                ...worldPoint,
                y: 14
              }
            });
          default:
            return state;
        }
      }

      return state;
    });
  }

  function syncHoveredReference(reference: SceneSpatialReference | null) {
    updateSceneAuthoringState((state) => setHoveredSpatialEntity(state, reference));
  }

  function setCameraZoom(nextZoom: number) {
    updateSceneAuthoringState((state) =>
      syncViewportCamera(state, {
        zoom: nextZoom
      }),
    );
  }

  function nudgeCamera(deltaX: number, deltaZ: number) {
    updateSceneAuthoringState((state) => panViewportCamera(state, { x: deltaX, z: deltaZ }));
  }

  function orbitCamera(yawDegrees: number, pitchDegrees: number) {
    updateSceneAuthoringState((state) => orbitViewportCamera(state, { yawDegrees, pitchDegrees }));
  }

  function focusBuildPalette(category: string) {
    const mappedCategories = mapAssetCategoryToSceneCategories(category);
    setAssetDrawerOpen(true);
    setAssetDrawerRecentOnly(false);
    setAssetDrawerQuery("");
    setAssetDrawerTag("all");
    setAssetDrawerCategory(mappedCategories[0] ?? "all");
    updateSceneAuthoringState((state) =>
      updateSelectionFilter(state, mappedCategories),
    );
    switchAuthoringMode("placement");
  }

  function armPlacementDraft(entry: AssetPlacementPaletteEntry) {
    const draft = createPlacementDraftFromPaletteEntry(entry);
    updateSceneAuthoringState((state) => setActivePlacementDraft(state, draft));
    switchAuthoringMode("placement");
  }

  function saveCurrentPlacementPreset() {
    const trimmedName = placementPresetName.trim();
    if (!trimmedName) {
      return;
    }

    updateSceneAuthoringState((state) =>
      savePlacementPreset(state, {
        name: trimmedName,
        preferredPackId: selectedBuildPack?.packId ?? null,
        preferredCategory: assetDrawerCategory === "all" ? null : assetDrawerCategory
      }),
    );
    setPlacementPresetName("");
  }

  function applyPlacementPresetById(presetId: string) {
    const preset = sceneAuthoring.editingState.placementPresets.find((candidate) => candidate.presetId === presetId);
    if (!preset) {
      return;
    }

    setAssetDrawerOpen(true);
    setAssetDrawerRecentOnly(false);
    if (preset.preferredPackId) {
      setSelectedBuildPackId(preset.preferredPackId);
    }
    setAssetDrawerCategory(preset.preferredCategory ?? "all");
    updateSceneAuthoringState((state) => applyPlacementPreset(state, presetId));
  }

  function togglePlacementPresetFavoriteById(presetId: string) {
    updateSceneAuthoringState((state) => togglePlacementPresetFavorite(state, presetId));
  }

  function saveCurrentSurfaceRulePreset() {
    const trimmedName = surfaceRulePresetName.trim();
    if (!trimmedName) {
      return;
    }

    updateSceneAuthoringState((state) =>
      saveSurfaceRulePreset(state, {
        name: trimmedName,
        preferredPackId: selectedBuildPack?.packId ?? null,
        preferredCategory: assetDrawerCategory === "all" ? null : assetDrawerCategory
      }),
    );
    setSurfaceRulePresetName("");
  }

  function applySurfaceRulePresetById(presetId: string) {
    const preset = sceneAuthoring.editingState.surfaceRulePresets.find((candidate) => candidate.presetId === presetId);
    if (!preset) {
      return;
    }

    if (preset.preferredPackId) {
      setSelectedBuildPackId(preset.preferredPackId);
    }
    setAssetDrawerCategory(preset.preferredCategory ?? "all");
    updateSceneAuthoringState((state) => applySurfaceRulePreset(state, presetId));
  }

  function toggleSurfaceRulePresetFavoriteById(presetId: string) {
    updateSceneAuthoringState((state) => toggleSurfaceRulePresetFavorite(state, presetId));
  }

  function updateSurfaceRuleDraftPatch(
    patch: Partial<typeof sceneAuthoring.editingState.surfaceRuleDraft>,
  ) {
    updateSceneAuthoringState((state) => updateSurfaceRuleDraft(state, patch));
  }

  function toggleSurfaceRulePurpose(
    purpose: TerrainGameplayPurpose,
    lane: "preferred" | "avoided",
  ) {
    const draft = sceneAuthoring.editingState.surfaceRuleDraft;
    const key = lane === "preferred" ? "preferredSurfacePurposes" : "avoidedSurfacePurposes";
    const currentValues = draft[key];
    const nextValues = currentValues.includes(purpose)
      ? currentValues.filter((value) => value !== purpose)
      : [...currentValues, purpose];

    updateSurfaceRuleDraftPatch({
      [key]: nextValues
    });
  }

  function bindCurrentPackToSurfaceRuleDraft() {
    updateSurfaceRuleDraftPatch({
      preferredPackId: selectedBuildPack?.packId ?? null
    });
  }

  function resolveSurfaceRuleDraftConflicts(
    strategy: Parameters<typeof resolveSurfaceRuleConflicts>[1],
  ) {
    updateSceneAuthoringState((state) => resolveSurfaceRuleConflicts(state, strategy));
  }

  function runSurfaceRuleCleanupAutomation(
    mode: Parameters<typeof automateSurfaceRuleCleanup>[1],
  ) {
    updateSceneAuthoringState((state) => automateSurfaceRuleCleanup(state, mode));
  }

  function createCleanupReviewPass(
    mode: Parameters<typeof createSurfaceRuleCleanupReview>[1],
  ) {
    updateSceneAuthoringState((state) => createSurfaceRuleCleanupReview(state, mode));
  }

  function reviewCleanupPass(
    reviewId: string,
    decision: Parameters<typeof reviewSurfaceRuleCleanupPass>[2],
  ) {
    updateSceneAuthoringState((state) => reviewSurfaceRuleCleanupPass(state, reviewId, decision));
  }

  function applyLandmarkRestagingAction(
    action: Parameters<typeof restageSelectedLandmark>[1],
  ) {
    updateSceneAuthoringState((state) => restageSelectedLandmark(state, action));
  }

  function applyLandmarkCorridorAction(
    action: Parameters<typeof applyLandmarkViewCorridorTool>[1],
  ) {
    updateSceneAuthoringState((state) => applyLandmarkViewCorridorTool(state, action));
  }

  function applyLandmarkCorridorSupportKitAction(
    kit: Parameters<typeof applyLandmarkCorridorSupportKit>[1],
  ) {
    updateSceneAuthoringState((state) => applyLandmarkCorridorSupportKit(state, kit));
  }

  function applyLandmarkCorridorSupportBundleAction(
    action: Parameters<typeof applyLandmarkCorridorSupportKitComposition>[1],
  ) {
    updateSceneAuthoringState((state) => applyLandmarkCorridorSupportKitComposition(state, action));
  }

  function applyCorridorBundleLibraryEntryById(bundleId: string) {
    updateSceneAuthoringState((state) => applyLandmarkCorridorBundleLibraryEntry(state, bundleId));
  }

  function toggleCorridorBundleLibraryFavoriteById(bundleId: string) {
    updateSceneAuthoringState((state) => toggleLandmarkCorridorBundleLibraryFavorite(state, bundleId));
  }

  function reconcileActiveHoleFinish() {
    updateSceneAuthoringState((state) =>
      activeHoleId ? reconcileRoutingHoleFinish(state, activeHoleId) : state,
    );
  }

  function startPaletteDrag(
    event: ReactDragEvent<HTMLButtonElement>,
    entry: AssetPlacementPaletteEntry,
  ) {
    writePlacementDragPayload(event.dataTransfer, createPlacementDragPayload(entry));
  }

  function addPaletteEntryToBrush(entry: AssetPlacementPaletteEntry) {
    const draft = createPlacementDraftFromPaletteEntry(entry);
    updateSceneAuthoringState((state) =>
      addPlacementDraftsToSceneryBrush(
        updateSceneryBrushSettings(state, {
          activePackId: entry.packId
        }),
        [draft],
      ),
    );
    switchAuthoringMode("scenery-brush");
  }

  function updateBrushCategoryWeight(category: SceneObjectCategory, nextWeight: number) {
    updateSceneAuthoringState((state) =>
      updateSceneryBrushSettings(state, {
        categoryWeights: [
          ...state.editingState.sceneryBrush.categoryWeights.filter((entry) => entry.category !== category),
          {
            category,
            weight: Math.max(0, Number(nextWeight.toFixed(2)))
          }
        ]
      }),
    );
  }

  function updateBrushAssetWeight(assetRef: string | null, nextWeight: number) {
    if (!assetRef) {
      return;
    }

    updateSceneAuthoringState((state) =>
      updateSceneryBrushSettings(state, {
        assetWeights: [
          ...state.editingState.sceneryBrush.assetWeights.filter((entry) => entry.assetRef !== assetRef),
          {
            assetRef,
            weight: Math.max(0, Number(nextWeight.toFixed(2)))
          }
        ]
      }),
    );
  }

  function loadBrushReadyPackAssets() {
    if (brushReadyEntries.length === 0) {
      return;
    }

    updateSceneAuthoringState((state) =>
      updateSceneryBrushSettings(
        addPlacementDraftsToSceneryBrush(
          state,
          brushReadyEntries.map((entry) => createPlacementDraftFromPaletteEntry(entry)),
        ),
        {
          activePackId: selectedBuildPack?.packId ?? null
        },
      ),
    );
    switchAuthoringMode("scenery-brush");
  }

  function saveCurrentBrushPreset() {
    const trimmedName = brushPresetName.trim();
    if (!trimmedName) {
      return;
    }

    updateSceneAuthoringState((state) =>
      saveSceneryBrushPreset(state, {
        name: trimmedName,
        description:
          state.editingState.sceneryBrush.activePackId != null
            ? `Pack-focused brush for ${state.editingState.sceneryBrush.activePackId}.`
            : undefined
      }),
    );
    setBrushPresetName("");
  }

  function applyBrushPresetById(presetId: string) {
    const preset = sceneAuthoring.editingState.sceneryBrushPresets.find((candidate) => candidate.presetId === presetId);
    if (!preset) {
      return;
    }

    if (preset.settings.activePackId) {
      setSelectedBuildPackId(preset.settings.activePackId);
    }
    updateSceneAuthoringState((state) => applySceneryBrushPreset(state, presetId));
  }

  function toggleBrushPresetFavoriteById(presetId: string) {
    updateSceneAuthoringState((state) => toggleSceneryBrushPresetFavorite(state, presetId));
  }

  function resolveActiveHoleMergeClusters() {
    updateSceneAuthoringState((state) =>
      activeHoleId ? resolveRoutingMergeCandidates(state, activeHoleId) : state,
    );
  }

  function syncAuthoringPreviewWorldPoint(worldPoint: Vector3 | null) {
    updateSceneAuthoringState((state) => {
      if (state.viewportState.authoringMode === "placement" && state.editingState.activePlacementDraft) {
        return previewPlacementDraft(state, {
          draft: state.editingState.activePlacementDraft,
          worldPoint
        });
      }

      if (
        state.viewportState.authoringMode === "scenery-brush" &&
        state.editingState.sceneryBrushDrafts.length > 0
      ) {
        return previewSceneryBrush(state, worldPoint);
      }

      if (
        state.viewportState.authoringMode === "terrain" &&
        state.editingState.activeTerrainTool === "paint-material" &&
        state.editingState.selectedTerrainRegionId !== null &&
        state.editingState.activeTerrainMaterialId !== null
      ) {
        return previewTerrainFinish(state, worldPoint);
      }

      return clearAuthoringPreview(state);
    });
  }

  function previewDraggedPlacement(payload: PlacementDragPayload, worldPoint: Vector3) {
    updateSceneAuthoringState((state) =>
      previewPlacementDraft(
        syncViewportRuntimeState(state, {
          authoringMode: "placement"
        }),
        {
          draft: payload.draft,
          worldPoint,
          source: payload.source
        },
      ),
    );
  }

  function commitDraggedPlacement(payload: PlacementDragPayload, worldPoint: Vector3) {
    updateSceneAuthoringState((state) =>
      commitAuthoringPreview(
        previewPlacementDraft(
          syncViewportRuntimeState(state, {
            authoringMode: "placement"
          }),
          {
            draft: payload.draft,
            worldPoint,
            source: payload.source
          },
        ),
        {
          holeId: activeHoleId
        },
      ),
    );
  }

  function updateTransformAxis(
    section: "position" | "rotation" | "scale" | "pivotOffset",
    axis: "x" | "y" | "z",
    value: number,
  ) {
    if (!selectedObject) {
      return;
    }

    updateSceneAuthoringState((state) => {
      const sceneObject = state.sceneObjects.find((candidate) => candidate.sceneObjectId === selectedObject.sceneObjectId);
      if (!sceneObject) {
        return state;
      }

      return updateSceneObjectTransform(state, sceneObject.sceneObjectId, {
        ...sceneObject.transform,
        [section]: {
          ...sceneObject.transform[section],
          [axis]: value
        }
      });
    });
  }

  function setPendingConnectionStart() {
    if (!selectedRoutingNode) {
      return;
    }

    updateSceneAuthoringState((state) => ({
      ...state,
      editingState: {
        ...state.editingState,
        pendingConnectionStartNodeId: selectedRoutingNode.routingNodeId
      }
    }));
  }

  function connectPendingToSelectedNode() {
    if (!selectedRoutingNode || !sceneAuthoring.editingState.pendingConnectionStartNodeId || !activeHoleId) {
      return;
    }

    updateSceneAuthoringState((state) =>
      connectRoutingNodes(state, {
        holeId: activeHoleId,
        fromNodeId: state.editingState.pendingConnectionStartNodeId!,
        toNodeId: selectedRoutingNode.routingNodeId
      }),
    );
  }

  return (
    <div className="mode-stack scene-authoring-shell">
      <section className="panel scene-authoring-hero">
        <SectionHeader
          eyebrow="3D Placement System"
          title="Renderer-backed terrain and routing authoring"
          description="Build now runs through the real scene-authoring authority: viewport, terrain, routing, simulator anchors, history, and spatial analysis all share the same package-owned state."
          actions={<StatusPill label={activeCollection?.name ?? "No Active Collection"} tone="info" />}
        />
        <div className="wizard-success-grid">
          <MetricChip label="Collections" value={summary.collectionCount} note="Scene sets" />
          <MetricChip label="Objects" value={summary.objectCount} note="Placed scene entities" tone="accent" />
          <MetricChip label="Terrain Regions" value={summary.terrainRegionCount} note="Gameplay and scenic terrain" tone="info" />
          <MetricChip
            label="Routing"
            value={`${summary.connectedRoutingPathCount}/${summary.routingPathCount}`}
            note="Connected tee-to-green routes"
            tone={summary.connectedRoutingPathCount > 0 ? "success" : "warning"}
          />
          <MetricChip
            label="Sim Zones"
            value={summary.simulatorZoneCount}
            note="Tee, green, hazard, OB, and recovery geometry"
            tone={summary.simulatorZoneCount > 0 ? "success" : "warning"}
          />
          <MetricChip
            label="Spatial Risks"
            value={
              spatialAnalysis.blockedLineOfPlayIssues.length +
              spatialAnalysis.sightlineQualityIssues.length +
              spatialAnalysis.collisionConflicts.length +
              spatialAnalysis.occlusionRisks.length
            }
            note="Live geometry-backed analysis"
            tone={
              spatialAnalysis.blockedLineOfPlayIssues.length +
                spatialAnalysis.sightlineQualityIssues.length +
                spatialAnalysis.collisionConflicts.length +
                spatialAnalysis.occlusionRisks.length >
              0
                ? "warning"
                : "success"
            }
          />
          <MetricChip
            label="Spatial Trust"
            value={spatialTrust.health}
            note={spatialTrust.analysisConfidence}
            tone={
              spatialTrust.health === "healthy"
                ? "success"
                : spatialTrust.health === "attention"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="Runtime Tier"
            value={rendererSnapshot.runtimeStatus.qualityTier}
            note={`${rendererSnapshot.renderPasses.length} render passes`}
            tone={
              rendererSnapshot.runtimeStatus.qualityTier === "native-ready"
                ? "success"
                : rendererSnapshot.runtimeStatus.qualityTier === "high-fidelity-bridge"
                  ? "accent"
                  : "warning"
            }
          />
          <MetricChip
            label="Index Drift"
            value={indexHealth.driftState}
            note={indexHealth.health}
            tone={
              indexHealth.health === "healthy"
                ? "success"
                : indexHealth.health === "attention"
                  ? "warning"
                  : "error"
            }
          />
        </div>
      </section>

      <section className="panel scene-builder-hud">
        <div className="scene-builder-hud-grid">
          <div className="scene-builder-mode-grid">
            {builderModeCards.map((card) => (
              <button
                key={card.mode}
                className="scene-builder-mode-card"
                data-active={sceneAuthoring.viewportState.authoringMode === card.mode}
                onClick={() => switchAuthoringMode(card.mode)}
                type="button"
              >
                <span className="scene-builder-mode-shortcut">[{card.shortcut}]</span>
                <strong>{card.label}</strong>
                <p>{card.note}</p>
                <span className="scene-builder-mode-value">{card.value}</span>
              </button>
            ))}
          </div>

          <SurfaceCard padding={6} tone="ghost" border="subtle">
            <Stack gap={3}>
              <span className="scene-toolbar-label">{activeModeSummary.eyebrow}</span>
              <strong>{activeModeSummary.title}</strong>
              <p className="body-copy">{activeModeSummary.detail}</p>
              <p className="body-copy">{activeModeSummary.nextAction}</p>
              <p className="muted-copy">{activeModeSummary.controlHint}</p>
              <Inline gap={2}>
                <StatusPill label={`Hole ${activeHoleNumber ?? "?"}`} tone="info" />
                <StatusPill label={sceneAuthoring.viewportState.interactionPipeline.state} tone="info" />
                <StatusPill label={sceneAuthoring.viewportState.projectionMode} tone="info" />
              </Inline>
            </Stack>
          </SurfaceCard>

          <SurfaceCard padding={6} tone="ghost" border="subtle">
            <Stack gap={3}>
              <span className="scene-toolbar-label">Creator Overview</span>
              <strong>Readability, density, and delivery in one loop</strong>
              <div className="scene-builder-overview-grid">
                <article className="scene-builder-overview-card">
                  <span>Readability Lens</span>
                  <strong>
                    {spatialAnalysis.sightlineQualityIssues.length + spatialAnalysis.routeDiscontinuities.length}
                  </strong>
                  <p>Keep holes legible before chasing detail. Routing and sightline issues should fall first.</p>
                </article>
                <article className="scene-builder-overview-card">
                  <span>Density Lens</span>
                  <strong>{performanceSnapshot.sceneDensity}</strong>
                  <p>World-first decoration is only helpful when it stays simulator-safe and visually calm.</p>
                </article>
                <article className="scene-builder-overview-card">
                  <span>Delivery Lens</span>
                  <strong>{creatorDelivery.overallReadiness}</strong>
                  <p>{creatorDelivery.nextAction}</p>
                </article>
                <article className="scene-builder-overview-card">
                  <span>Pack Usage</span>
                  <strong>{selectedPackPlacedObjectCount}</strong>
                  <p>
                    {selectedBuildPack
                      ? `${selectedBuildPack.label} placements already shape this area.`
                      : "Approved pack assets already placed into the scene."}
                  </p>
                </article>
                <article className="scene-builder-overview-card">
                  <span>Terrain Finish</span>
                  <strong>{terrainFinishSummary.coveragePercent}%</strong>
                  <p>
                    {terrainFinishSummary.unpaintedRegionCount} regions still need finish coverage ·{" "}
                    {terrainFinishSummary.layeredRegionCount} layered regions.
                  </p>
                </article>
                <article className="scene-builder-overview-card">
                  <span>Routing Guides</span>
                  <strong>{routingContinuitySummary.continuityWatchCount}</strong>
                  <p>
                    {routingContinuitySummary.widthWatchCount} width watches ·{" "}
                    {routingContinuitySummary.elevationWatchCount} elevation watches.
                  </p>
                </article>
              </div>
            </Stack>
          </SurfaceCard>
        </div>
      </section>

      <div className="workspace-columns scene-authoring-main-grid">
        <section className="panel scene-viewport-panel">
          <SectionHeader
            eyebrow="Build Viewport"
            title="Renderer bridge and authoring overlays"
            description="The viewport is now backed by a real renderer adapter. Selection, drag interaction, spatial overlays, and simulator geometry all route through scene-authoring rather than a UI-only diagram."
            actions={
              <Inline gap={2}>
                <StatusPill label={sceneAuthoring.viewportState.backendStatus} tone="success" />
                <StatusPill label={sceneAuthoring.viewportState.projectionMode} tone="info" />
              </Inline>
            }
          />

          <div className="scene-toolbar-cluster">
            <SurfaceCard className="scene-toolbar-card" padding={4}>
              <Stack gap={3}>
                <span className="scene-toolbar-label">Builder Compass</span>
                <strong>{activeModeSummary.title}</strong>
                <p className="body-copy">{activeModeSummary.nextAction}</p>
                <Inline gap={2}>
                  <StatusPill
                    label={sceneAuthoring.viewportState.interactionPipeline.pendingActionLabel ?? "Viewport ready"}
                    tone="info"
                  />
                </Inline>
              </Stack>
            </SurfaceCard>
            <SurfaceCard className="scene-toolbar-card" padding={4}>
              <Stack gap={3}>
                <span className="scene-toolbar-label">Placement Mode</span>
                <TogglePillGroup
                  ariaLabel="Placement mode"
                  options={placementModeOptions}
                  value={sceneAuthoring.placementMode}
                  onChange={(value) => updateSceneAuthoringState((state) => setPlacementMode(state, value))}
                />
              </Stack>
            </SurfaceCard>
            <SurfaceCard className="scene-toolbar-card" padding={4}>
              <Stack gap={3}>
                <span className="scene-toolbar-label">Gizmo / Space</span>
                <TogglePillGroup
                  ariaLabel="Gizmo mode"
                  options={gizmoModeOptions}
                  value={sceneAuthoring.gizmoMode}
                  onChange={(value) => updateSceneAuthoringState((state) => setGizmoMode(state, value))}
                />
                <TogglePillGroup
                  ariaLabel="Transform space"
                  options={transformSpaceOptions}
                  value={sceneAuthoring.selectionState.transformSpace}
                  onChange={(value) => updateSceneAuthoringState((state) => setTransformSpace(state, value))}
                />
              </Stack>
            </SurfaceCard>
          </div>

          <div className="scene-viewport-status-strip">
            <SurfaceCard padding={4} tone="ghost" border="subtle">
              <Stack gap={3}>
                <span className="scene-toolbar-label">Hole Focus</span>
                <SelectField
                  label="Active hole"
                  value={activeHoleId}
                  options={holeFocusOptions}
                  onChange={(event) => setHoleFocus(event.currentTarget.value)}
                />
              </Stack>
            </SurfaceCard>
            <SurfaceCard padding={4} tone="ghost" border="subtle">
              <Stack gap={3}>
                <span className="scene-toolbar-label">Camera</span>
                <Inline gap={2}>
                  <Button tone="ghost" onClick={() => nudgeCamera(-12, 0)}>Pan West</Button>
                  <Button tone="ghost" onClick={() => nudgeCamera(12, 0)}>Pan East</Button>
                  <Button tone="ghost" onClick={() => nudgeCamera(0, -12)}>Pan North</Button>
                  <Button tone="ghost" onClick={() => nudgeCamera(0, 12)}>Pan South</Button>
                </Inline>
                <Inline gap={2}>
                  <Button tone="secondary" onClick={() => setCameraZoom(Math.max(0.45, sceneAuthoring.viewportState.camera.zoom - 0.12))}>Zoom Out</Button>
                  <Button tone="secondary" onClick={() => setCameraZoom(Math.min(3.2, sceneAuthoring.viewportState.camera.zoom + 0.12))}>Zoom In</Button>
                  <Button tone="ghost" onClick={() => orbitCamera(-8, 0)}>Orbit Left</Button>
                  <Button tone="ghost" onClick={() => orbitCamera(8, 0)}>Orbit Right</Button>
                  <Button tone="ghost" onClick={() => orbitCamera(0, 4)}>Pitch Up</Button>
                  <Button tone="ghost" onClick={() => orbitCamera(0, -4)}>Pitch Down</Button>
                  <Button tone="ghost" onClick={focusSelection} disabled={!selectedObject && selectedSpatialRefs.length === 0}>Focus Selection</Button>
                </Inline>
                <p className="body-copy">
                  Zoom {sceneAuthoring.viewportState.camera.zoom.toFixed(2)} · Yaw {Math.round(sceneAuthoring.viewportState.camera.yawDegrees)}° · Pitch {Math.round(sceneAuthoring.viewportState.camera.pitchDegrees)}°
                </p>
                <TogglePillGroup
                  ariaLabel="Projection mode"
                  options={projectionModeOptions}
                  value={sceneAuthoring.viewportState.projectionMode}
                  onChange={(value) =>
                    updateSceneAuthoringState((state) =>
                      updateViewportState(state, {
                        ...state.viewportState,
                        projectionMode: value
                      }),
                    )
                  }
                />
              </Stack>
            </SurfaceCard>
          </div>

          <div className="scene-quick-actions">
            <Button disabled={!canUndo} onClick={() => updateSceneAuthoringState((state) => undoSceneAuthoring(state))} tone="secondary">
              Undo
            </Button>
            <Button disabled={!canRedo} onClick={() => updateSceneAuthoringState((state) => redoSceneAuthoring(state))} tone="secondary">
              Redo
            </Button>
            <Button
              disabled={sceneAuthoring.selectionState.selectedObjectIds.length === 0}
              onClick={() => updateSceneAuthoringState((state) => duplicateSceneObjects(state))}
              tone="secondary"
            >
              Duplicate
            </Button>
            <Button
              disabled={sceneAuthoring.selectionState.selectedObjectIds.length < 2}
              onClick={() => updateSceneAuthoringState((state) => groupSceneObjects(state, { groupName: "Placement Group" }))}
              tone="secondary"
            >
              Group
            </Button>
            <Button
              disabled={sceneAuthoring.selectionState.selectedGroupIds.length !== 1}
              onClick={() => updateSceneAuthoringState((state) => ungroupSceneGroup(state))}
              tone="secondary"
            >
              Ungroup
            </Button>
            <Button
              disabled={sceneAuthoring.selectionState.selectedObjectIds.length === 0}
              onClick={() =>
                updateSceneAuthoringState((state) =>
                  setSceneObjectLockState(state, state.selectionState.selectedObjectIds, true),
                )
              }
              tone="ghost"
            >
              Lock
            </Button>
            <Button
              disabled={sceneAuthoring.selectionState.selectedObjectIds.length === 0}
              onClick={() =>
                updateSceneAuthoringState((state) =>
                  setSceneObjectLockState(state, state.selectionState.selectedObjectIds, false),
                )
              }
              tone="ghost"
            >
              Unlock
            </Button>
            <Button
              disabled={sceneAuthoring.selectionState.selectedObjectIds.length === 0}
              onClick={() =>
                updateSceneAuthoringState((state) =>
                  setSceneObjectVisibility(state, state.selectionState.selectedObjectIds, false),
                )
              }
              tone="ghost"
            >
              Hide
            </Button>
            <Button onClick={() => updateSceneAuthoringState((state) => clearSceneSelection(state))} tone="ghost">
              Clear Selection
            </Button>
          </div>

          <div className="scene-overlay-row">
            <button className="scene-overlay-toggle" data-active={sceneAuthoring.overlayState.showTerrainOverlay} onClick={() => toggleOverlay("showTerrainOverlay")} type="button">Terrain</button>
            <button className="scene-overlay-toggle" data-active={sceneAuthoring.overlayState.showTerrainFinishOverlay} onClick={() => toggleOverlay("showTerrainFinishOverlay")} type="button">Finish Intel</button>
            <button className="scene-overlay-toggle" data-active={sceneAuthoring.overlayState.showSurfaceRuleCoverageOverlay} onClick={() => toggleOverlay("showSurfaceRuleCoverageOverlay")} type="button">Surface Rules</button>
            <button className="scene-overlay-toggle" data-active={sceneAuthoring.overlayState.showRoutingOverlay} onClick={() => toggleOverlay("showRoutingOverlay")} type="button">Routing</button>
            <button className="scene-overlay-toggle" data-active={sceneAuthoring.overlayState.showSimulatorAnchorsOverlay} onClick={() => toggleOverlay("showSimulatorAnchorsOverlay")} type="button">Sim Anchors</button>
            <button className="scene-overlay-toggle" data-active={sceneAuthoring.overlayState.showValidationOverlay} onClick={() => toggleOverlay("showValidationOverlay")} type="button">Validation</button>
            <button className="scene-overlay-toggle" data-active={sceneAuthoring.overlayState.showDensityOverlay} onClick={() => toggleOverlay("showDensityOverlay")} type="button">Density</button>
            <button className="scene-overlay-toggle" data-active={sceneAuthoring.overlayState.showPerformanceOverlay} onClick={() => toggleOverlay("showPerformanceOverlay")} type="button">Performance</button>
            <button className="scene-overlay-toggle" data-active={sceneAuthoring.overlayState.showHiddenGhosts} onClick={() => toggleOverlay("showHiddenGhosts")} type="button">Hidden Ghosts</button>
          </div>

          <div className="scene-tool-grid">
            <SurfaceCard padding={4} tone="ghost" border="subtle">
              <Stack gap={3}>
                <span className="scene-toolbar-label">Placement + Packs</span>
                <Inline gap={2}>
                  <Button tone={assetDrawerOpen ? "primary" : "secondary"} onClick={() => setAssetDrawerOpen((open) => !open)}>
                    {assetDrawerOpen ? "Hide Asset Drawer" : "Open Asset Drawer"}
                  </Button>
                  <Button
                    tone="secondary"
                    disabled={!activePlacementDraft}
                    onClick={() => switchAuthoringMode("placement")}
                  >
                    Place Armed Asset
                  </Button>
                  <Button
                    tone="secondary"
                    disabled={sceneAuthoring.editingState.sceneryBrushDrafts.length === 0}
                    onClick={() => switchAuthoringMode("scenery-brush")}
                  >
                    Use Scenery Brush
                  </Button>
                  <Button
                    tone="ghost"
                    disabled={!activePlacementDraft}
                    onClick={() => updateSceneAuthoringState((state) => setActivePlacementDraft(state, null))}
                  >
                    Clear Armed Asset
                  </Button>
                </Inline>
                <p className="body-copy">
                  {activePlacementDraft
                    ? `${activePlacementDraft.label} is armed for direct placement. Click the viewport to stamp repeated placements without leaving pack context.`
                    : "Arm one approved asset for direct placement, or load a pack into the scenery brush for fast world dressing."}
                </p>
                {authoringPreview.visible &&
                (authoringPreview.mode === "placement" || authoringPreview.mode === "scenery-brush") ? (
                  <SurfaceCard padding={4} tone="ghost" border="subtle">
                    <Stack gap={2}>
                      <strong>{authoringPreview.label ?? "Live placement preview"}</strong>
                      <p className="muted-copy">
                        {authoringPreview.surfaceLabel
                          ? `${authoringPreview.surfaceLabel} · ${Math.round(authoringPreview.surfaceSlopeDegrees)}° slope · ${authoringPreview.surfaceSnapMode}`
                          : "Preview is active in the viewport before commit."}
                      </p>
                    </Stack>
                  </SurfaceCard>
                ) : null}
                <div className="scene-builder-overview-grid">
                  <article className="scene-builder-overview-card">
                    <span>Pack Focus</span>
                    <strong>{selectedBuildPack?.label ?? "No pack pinned"}</strong>
                    <p>{selectedBuildPack ? `${selectedBuildPack.readyForPlacementCount} approved assets ready.` : "Pin a content pack to build around it."}</p>
                  </article>
                  <article className="scene-builder-overview-card">
                    <span>Placement Presets</span>
                    <strong>{placementPresetLibrary.totalCount}</strong>
                    <p>
                      {placementPresetLibrary.totalCount > 0
                        ? `${placementPresetLibrary.favoriteCount} favorites · ${placementPresetLibrary.recentCount} recent presets keep placement continuity reusable.`
                        : "Save one placement posture once the current snap and orientation settings feel right."}
                    </p>
                  </article>
                  <article className="scene-builder-overview-card">
                    <span>Surface Rules</span>
                    <strong>{surfaceRuleCoverage.overallState}</strong>
                    <p>
                      {surfaceRuleCoverage.uncoveredRegionCount > 0 || surfaceRuleCoverage.conflictingRegionCount > 0
                        ? `${surfaceRuleCoverage.uncoveredRegionCount} uncovered regions · ${surfaceRuleCleanupAutomation.autoCleanableHoleCount} cleanup targets`
                        : `${surfaceRulePresetLibrary.favoriteCount} favorites · coverage reads calm course-wide`}
                    </p>
                  </article>
                  <article className="scene-builder-overview-card">
                    <span>Brush Palette</span>
                    <strong>{sceneAuthoring.editingState.sceneryBrushDrafts.length}</strong>
                    <p>{brushReadyEntries.length} brush-ready assets are visible in the current pack.</p>
                  </article>
                  <article className="scene-builder-overview-card">
                    <span>Path Corrections</span>
                    <strong>{cameraPathCorrections.overallState}</strong>
                    <p>
                      {cameraPathCorrections.blockedHoleCount} blocked segments · {cameraPathCorrections.smoothingHoleCount} smoothing passes ·{" "}
                      {landmarkCorrectionActions.correctiveHoleCount} landmark actions
                    </p>
                  </article>
                  <article className="scene-builder-overview-card">
                    <span>Recent Assets</span>
                    <strong>{recentDrawerEntries.length}</strong>
                    <p>
                      {recentDrawerEntries.length > 0
                        ? `${recentDrawerEntries[0]?.label ?? "Latest asset"} keeps placement continuity hot.`
                        : "Recently placed assets will surface here once you start dressing the scene."}
                    </p>
                  </article>
                </div>
                <Inline gap={2}>
                  <Button tone="secondary" disabled={brushReadyEntries.length === 0} onClick={loadBrushReadyPackAssets}>
                    Load Brush-Ready Pack Assets
                  </Button>
                  <Button
                    tone="ghost"
                    disabled={sceneAuthoring.editingState.sceneryBrushDrafts.length === 0}
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        updateSceneryBrushSettings(state, {
                          categoryFilters: []
                        }),
                      )
                    }
                  >
                    Clear Brush Filters
                  </Button>
                </Inline>
                <SurfaceCard padding={4} tone="ghost" border="subtle">
                  <Stack gap={3}>
                    <strong>Placement Presets</strong>
                    <p className="body-copy">
                      Save reusable placement posture so surface snap, orientation, and pack focus stay one click away while worldbuilding accelerates.
                    </p>
                    <p className="muted-copy">{placementPresetLibrary.recommendedAction}</p>
                    <div className="scene-vector-fields">
                      <TextField
                        label="Preset Name"
                        value={placementPresetName}
                        onChange={(event) => setPlacementPresetName(event.currentTarget.value)}
                      />
                    </div>
                    <Inline gap={2}>
                      <Button tone="primary" disabled={placementPresetName.trim().length === 0} onClick={saveCurrentPlacementPreset}>
                        Save Placement Preset
                      </Button>
                    </Inline>
                    <div className="scene-builder-overview-grid">
                      <article className="scene-builder-overview-card">
                        <span>Favorites</span>
                        <strong>{placementPresetLibrary.favoriteCount}</strong>
                        <p>Quick-apply placement recipes that stay visible in the main Build loop.</p>
                      </article>
                      <article className="scene-builder-overview-card">
                        <span>Recent</span>
                        <strong>{placementPresetLibrary.recentCount}</strong>
                        <p>Recently used placement posture stays easy to recover during long sessions.</p>
                      </article>
                      <article className="scene-builder-overview-card">
                        <span>Current Context</span>
                        <strong>{sceneAuthoring.placementMode}</strong>
                        <p>
                          {selectedBuildPack?.label ?? "No pack"} · {assetDrawerCategory === "all" ? "all categories" : assetDrawerCategory}
                        </p>
                      </article>
                    </div>
                    <div className="scene-outliner-list">
                      {placementPresetLibrary.entries.map((preset) => (
                        <div key={preset.presetId} className="scene-outliner-row">
                          <button
                            className="scene-outliner-button"
                            onClick={() => applyPlacementPresetById(preset.presetId)}
                            type="button"
                          >
                            <span>{preset.favorite ? `Favorite · ${preset.name}` : preset.name}</span>
                            <small>
                              {preset.contextSummary} · {preset.useCount} uses{preset.recent ? " · recent" : ""}
                            </small>
                          </button>
                          <button
                            className="scene-outliner-append"
                            onClick={() => togglePlacementPresetFavoriteById(preset.presetId)}
                            type="button"
                          >
                            {preset.favorite ? "Unstar" : "Star"}
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="muted-copy">
                      Presets capture placement mode, snap posture, and preferred pack/category focus without moving placement authority out of scene authoring.
                    </p>
                  </Stack>
                </SurfaceCard>
                <SurfaceCard padding={4} tone="ghost" border="subtle">
                  <Stack gap={3}>
                    <strong>Surface Rule Presets</strong>
                    <p className="body-copy">
                      Save reusable terrain-aware behavior so slope handling, surface posture, pack influence, and playable-core avoidance stay one click away during finish-stage worldbuilding.
                    </p>
                    <p className="muted-copy">{surfaceRulePresetLibrary.recommendedAction}</p>
                    <div className="scene-vector-fields">
                      <TextField
                        label="Rule Name"
                        value={surfaceRulePresetName}
                        onChange={(event) => setSurfaceRulePresetName(event.currentTarget.value)}
                      />
                    </div>
                    <Inline gap={2}>
                      <Button tone="primary" disabled={surfaceRulePresetName.trim().length === 0} onClick={saveCurrentSurfaceRulePreset}>
                        Save Surface Rule
                      </Button>
                    </Inline>
                    <div className="scene-builder-overview-grid">
                      <article className="scene-builder-overview-card">
                        <span>Favorites</span>
                        <strong>{surfaceRulePresetLibrary.favoriteCount}</strong>
                        <p>Favorite surface rules keep slope-aware placement fast during long sessions.</p>
                      </article>
                      <article className="scene-builder-overview-card">
                        <span>Recent</span>
                        <strong>{surfaceRulePresetLibrary.recentCount}</strong>
                        <p>Recently used rules stay near the current asset and terrain pass.</p>
                      </article>
                      <article className="scene-builder-overview-card">
                        <span>Current Surface Posture</span>
                        <strong>{surfaceRuleAuthoringSummary.confidenceState}</strong>
                        <p>{surfaceRuleAuthoringSummary.currentSummary}</p>
                      </article>
                      <article className="scene-builder-overview-card">
                        <span>Rule Bias</span>
                        <strong>{Math.round(surfaceRuleAuthoringSummary.suitabilityBias * 100)} / {Math.round(surfaceRuleAuthoringSummary.avoidanceBias * 100)}</strong>
                        <p>Suitability vs avoidance keeps surface behavior deliberate instead of generic.</p>
                      </article>
                      <article className="scene-builder-overview-card">
                        <span>Surface Purpose Split</span>
                        <strong>{surfaceRuleAuthoringSummary.preferredSurfacePurposeCount}/{surfaceRuleAuthoringSummary.avoidedSurfacePurposeCount}</strong>
                        <p>Preferred vs avoided purposes keep placement behavior readable at finish stage.</p>
                      </article>
                      <article className="scene-builder-overview-card">
                        <span>Coverage Map</span>
                        <strong>{surfaceRuleCoverage.overallState}</strong>
                        <p>
                          {surfaceRuleCoverage.uncoveredRegionCount} uncovered regions · {surfaceRuleCoverage.conflictingRegionCount} conflicts ·{" "}
                          {surfaceRuleCoverage.activeRegionCount} active matches
                        </p>
                      </article>
                      <article className="scene-builder-overview-card">
                        <span>Active Hole Coverage</span>
                        <strong>{activeHoleSurfaceRuleCoverage?.confidenceState ?? "n/a"}</strong>
                        <p>
                          {activeHoleSurfaceRuleCoverage
                            ? `${activeHoleSurfaceRuleCoverage.uncoveredRegionCount} uncovered · ${activeHoleSurfaceRuleCoverage.conflictingRegionCount} conflicts on Hole ${activeHoleNumber ?? "?"}`
                            : "Select a hole with terrain regions to inspect surface-rule coverage."}
                        </p>
                      </article>
                      <article className="scene-builder-overview-card">
                        <span>Conflict Resolution</span>
                        <strong>{surfaceRuleConflictResolution.overallState}</strong>
                        <p>
                          {surfaceRuleConflictResolution.unresolvedConflictRegionCount} unresolved conflicts ·{" "}
                          {surfaceRuleConflictResolution.highPriorityHoleCount} high-priority holes
                        </p>
                      </article>
                      <article className="scene-builder-overview-card">
                        <span>Cleanup Automation</span>
                        <strong>{surfaceRuleCleanupAutomation.overallState}</strong>
                        <p>
                          {surfaceRuleCleanupAutomation.autoCleanableHoleCount} cleanup targets ·{" "}
                          {surfaceRuleCleanupAutomation.roughHoleCount} rough holes
                        </p>
                      </article>
                      <article className="scene-builder-overview-card">
                        <span>Cleanup Review</span>
                        <strong>{surfaceRuleCleanupReview.overallState}</strong>
                        <p>
                          {surfaceRuleCleanupReview.pendingReviewCount} pending reviews ·{" "}
                          {surfaceRuleCleanupReview.approvedReviewCount} approved passes ·{" "}
                          {surfaceRuleCleanupReview.diffConfidenceState} diff posture
                        </p>
                      </article>
                    </div>
                    <p className="muted-copy">{surfaceRuleAuthoringSummary.recommendedAction}</p>
                    <p className="muted-copy">{surfaceRuleCoverage.recommendedAction}</p>
                    <p className="muted-copy">{surfaceRuleConflictResolution.recommendedAction}</p>
                    <p className="muted-copy">{surfaceRuleCleanupAutomation.recommendedAction}</p>
                    <p className="muted-copy">{surfaceRuleCleanupReview.recommendedAction}</p>
                    <SurfaceCard padding={4} tone="ghost" border="subtle">
                      <Stack gap={2}>
                        <strong>Conflict Resolution</strong>
                        <p className="body-copy">
                          {surfaceRuleConflictResolution.resolvedHoleCount} holes resolve cleanly, {surfaceRuleConflictResolution.watchHoleCount} stay on watch, and {surfaceRuleConflictResolution.roughHoleCount} still need direct correction.
                        </p>
                        <p className="muted-copy">
                          {surfaceRuleConflictResolution.unresolvedConflictRegionCount} conflicting regions · {surfaceRuleConflictResolution.uncoveredRegionCount} uncovered regions · {surfaceRuleConflictResolution.highPriorityHoleCount} high-priority holes.
                        </p>
                        <Inline gap={2}>
                          <Button tone="secondary" onClick={() => resolveSurfaceRuleDraftConflicts("favor-placement")}>
                            Favor Placement
                          </Button>
                          <Button tone="secondary" onClick={() => resolveSurfaceRuleDraftConflicts("favor-guardrails")}>
                            Favor Guard Rails
                          </Button>
                          <Button tone="ghost" onClick={() => resolveSurfaceRuleDraftConflicts("balance-active-hole")}>
                            Balance Active Hole
                          </Button>
                        </Inline>
                        <p className="muted-copy">
                          {surfaceRuleConflictResolution.holeSummaries
                            .filter((hole) => hole.resolutionState !== "resolved")
                            .slice(0, 2)
                            .map((hole) => `${hole.holeId}: ${hole.primaryAction}`)
                            .join(" · ") || "Surface-rule conflicts are already calm enough for broader placement passes."}
                        </p>
                      </Stack>
                    </SurfaceCard>
                    <SurfaceCard padding={4} tone="ghost" border="subtle">
                      <Stack gap={2}>
                        <strong>Cleanup Automation</strong>
                        <p className="body-copy">
                          {surfaceRuleCleanupAutomation.cleanHoleCount} holes already read clean, {surfaceRuleCleanupAutomation.watchHoleCount} can use guided cleanup, and {surfaceRuleCleanupAutomation.roughHoleCount} still need harder conflict repair.
                        </p>
                        <p className="muted-copy">
                          {surfaceRuleCleanupAutomation.autoCleanableHoleCount} holes can use semi-automatic coverage or guardrail cleanup right now.
                        </p>
                        <Inline gap={2}>
                          <Button tone="secondary" onClick={() => runSurfaceRuleCleanupAutomation("expand-coverage")}>
                            Expand Coverage
                          </Button>
                          <Button tone="secondary" onClick={() => runSurfaceRuleCleanupAutomation("guard-playable-core")}>
                            Guard Playable Core
                          </Button>
                          <Button tone="ghost" onClick={() => runSurfaceRuleCleanupAutomation("balance-course")}>
                            Balance Course
                          </Button>
                        </Inline>
                        <p className="muted-copy">
                          {surfaceRuleCleanupAutomation.holeSummaries
                            .filter((hole) => hole.cleanupState !== "clean")
                            .slice(0, 2)
                            .map((hole) => `${hole.holeId}: ${hole.recommendedAction}`)
                            .join(" · ") || "Surface-rule cleanup automation is calm enough for broader placement passes."}
                        </p>
                      </Stack>
                    </SurfaceCard>
                    <SurfaceCard padding={4} tone="ghost" border="subtle">
                      <Stack gap={2}>
                        <strong>Cleanup Review</strong>
                        <p className="body-copy">
                          {surfaceRuleCleanupReview.pendingReviewCount} cleanup passes are waiting for review and{" "}
                          {surfaceRuleCleanupReview.pendingBroadReviewCount} still need broader approval depth before the active surface-rule posture is fully trustworthy.
                        </p>
                        <p className="muted-copy">
                          {surfaceRuleCleanupReview.latestReview
                            ? `${surfaceRuleCleanupReview.latestReview.mode} · ${surfaceRuleCleanupReview.latestReview.status} · ${
                                surfaceRuleCleanupReview.latestReview.approvalDepth ?? "pending depth"
                              } · ${surfaceRuleCleanupReview.latestReview.proposedAction}`
                            : "No cleanup review is prepared yet. Use the buttons below to create a reviewable cleanup pass instead of applying the automation immediately."}
                        </p>
                        <p className="muted-copy">
                          Approval depth: {surfaceRuleCleanupReview.approvalDepthState} · {surfaceRuleCleanupReview.focusedApprovalCount} focused ·{" "}
                          {surfaceRuleCleanupReview.regionalApprovalCount} regional · {surfaceRuleCleanupReview.courseWideApprovalCount} course-wide approvals.
                        </p>
                        <p className="muted-copy">
                          Audit trail: {surfaceRuleCleanupReview.auditTrailState} · {surfaceRuleCleanupReview.auditEntryCount} entries ·{" "}
                          {surfaceRuleCleanupReview.rejectedReviewCount} rejected reviews.
                        </p>
                        <p className="muted-copy">
                          Replay: {cleanupReviewReplay.overallState} · {cleanupReviewReplay.replayableReviewCount} replayable passes ·{" "}
                          {cleanupReviewReplay.acceptedReplayCount} accepted · {cleanupReviewReplay.rejectedReplayCount} rejected.
                        </p>
                        <p className="muted-copy">
                          Timeline: {cleanupReviewReplayTimeline.overallState} · {cleanupReviewReplayTimeline.timelineEntryCount} steps ·{" "}
                          {cleanupReviewReplayTimeline.courseRegionTimelineCount} regional or course-wide timeline entries.
                        </p>
                        <p className="muted-copy">
                          Diffing: {surfaceRuleCleanupReview.diffConfidenceState} · {surfaceRuleCleanupReview.netConflictReduction} conflicts reduced ·{" "}
                          {surfaceRuleCleanupReview.netCoverageGain} coverage gaps closed · {surfaceRuleCleanupReview.netReadyHoleGain} ready-hole gain.
                        </p>
                        <p className="muted-copy">
                          {surfaceRuleCleanupReview.latestDiffSummary ??
                            "Create a cleanup review to compare before-and-after course coverage and conflict posture before approving it."}
                        </p>
                        <p className="muted-copy">
                          {surfaceRuleCleanupReview.latestAuditSummary ??
                            "Each cleanup review now records an audit entry so approval and rejection history stays visible."}
                        </p>
                        <p className="muted-copy">
                          {cleanupReviewReplay.latestReplaySummary ??
                            "Replayable cleanup history will appear here once at least one review pass has been recorded."}
                        </p>
                        <p className="muted-copy">
                          {cleanupReviewReplayTimeline.latestTimelineSummary ??
                            "A timeline view of cleanup review history will appear here once at least one review pass has been recorded."}
                        </p>
                        <Inline gap={2}>
                          <Button tone="secondary" onClick={() => createCleanupReviewPass("expand-coverage")}>
                            Review Coverage
                          </Button>
                          <Button tone="secondary" onClick={() => createCleanupReviewPass("guard-playable-core")}>
                            Review Guard Rails
                          </Button>
                          <Button tone="ghost" onClick={() => createCleanupReviewPass("balance-course")}>
                            Review Balance
                          </Button>
                        </Inline>
                        {surfaceRuleCleanupReview.latestReview?.status === "pending" ? (
                          <Inline gap={2}>
                            <Button
                              tone="primary"
                              onClick={() => reviewCleanupPass(surfaceRuleCleanupReview.latestReview!.reviewId, "approve-focused")}
                            >
                              Approve Focused
                            </Button>
                            <Button
                              tone="secondary"
                              onClick={() => reviewCleanupPass(surfaceRuleCleanupReview.latestReview!.reviewId, "approve-regional")}
                            >
                              Approve Regional
                            </Button>
                            <Button
                              tone="secondary"
                              onClick={() => reviewCleanupPass(surfaceRuleCleanupReview.latestReview!.reviewId, "approve-course-wide")}
                            >
                              Approve Course-Wide
                            </Button>
                            <Button
                              tone="ghost"
                              onClick={() => reviewCleanupPass(surfaceRuleCleanupReview.latestReview!.reviewId, "reject")}
                            >
                              Reject Review
                            </Button>
                          </Inline>
                        ) : null}
                      </Stack>
                    </SurfaceCard>
                    <TogglePillGroup
                      ariaLabel="Surface rule slope handling"
                      options={[...surfaceRuleSlopeOptions]}
                      value={sceneAuthoring.editingState.surfaceRuleDraft.slopeHandlingMode}
                      onChange={(value) => updateSurfaceRuleDraftPatch({ slopeHandlingMode: value })}
                    />
                    <TogglePillGroup
                      ariaLabel="Surface rule orientation posture"
                      options={[...surfaceRuleOrientationOptions]}
                      value={sceneAuthoring.editingState.surfaceRuleDraft.orientationPosture}
                      onChange={(value) => updateSurfaceRuleDraftPatch({ orientationPosture: value })}
                    />
                    <TogglePillGroup
                      ariaLabel="Surface rule pack influence mode"
                      options={[...surfaceRulePackInfluenceOptions]}
                      value={sceneAuthoring.editingState.surfaceRuleDraft.packInfluenceMode}
                      onChange={(value) => updateSurfaceRuleDraftPatch({ packInfluenceMode: value })}
                    />
                    <div className="scene-vector-fields">
                      <TextField
                        label="Slope Limit"
                        type="number"
                        value={String(sceneAuthoring.editingState.surfaceRuleDraft.slopeLimitDegrees)}
                        onChange={(event) =>
                          updateSurfaceRuleDraftPatch({
                            slopeLimitDegrees: Math.max(
                              0,
                              Math.min(
                                45,
                                parseNumericInput(
                                  event.currentTarget.value,
                                  sceneAuthoring.editingState.surfaceRuleDraft.slopeLimitDegrees,
                                ),
                              ),
                            )
                          })
                        }
                      />
                      <TextField
                        label="Suitability Bias %"
                        type="number"
                        value={String(Math.round(sceneAuthoring.editingState.surfaceRuleDraft.suitabilityBias * 100))}
                        onChange={(event) =>
                          updateSurfaceRuleDraftPatch({
                            suitabilityBias: Math.max(
                              0,
                              Math.min(
                                1,
                                parseNumericInput(
                                  event.currentTarget.value,
                                  Math.round(sceneAuthoring.editingState.surfaceRuleDraft.suitabilityBias * 100),
                                ) / 100,
                              ),
                            )
                          })
                        }
                      />
                      <TextField
                        label="Avoidance Bias %"
                        type="number"
                        value={String(Math.round(sceneAuthoring.editingState.surfaceRuleDraft.avoidanceBias * 100))}
                        onChange={(event) =>
                          updateSurfaceRuleDraftPatch({
                            avoidanceBias: Math.max(
                              0,
                              Math.min(
                                1,
                                parseNumericInput(
                                  event.currentTarget.value,
                                  Math.round(sceneAuthoring.editingState.surfaceRuleDraft.avoidanceBias * 100),
                                ) / 100,
                              ),
                            )
                          })
                        }
                      />
                      <SelectField
                        label="Preferred Category"
                        value={sceneAuthoring.editingState.surfaceRuleDraft.preferredCategory ?? ""}
                        options={[
                          { label: "All Categories", value: "" },
                          ...categoryOptions.map((option) => ({
                            label: option.label,
                            value: option.value
                          }))
                        ]}
                        onChange={(event) =>
                          updateSurfaceRuleDraftPatch({
                            preferredCategory: event.currentTarget.value === "" ? null : (event.currentTarget.value as SceneObjectCategory)
                          })
                        }
                      />
                    </div>
                    <Inline gap={2}>
                      <Button tone="secondary" onClick={bindCurrentPackToSurfaceRuleDraft}>
                        {sceneAuthoring.editingState.surfaceRuleDraft.preferredPackId === selectedBuildPack?.packId
                          ? "Pack Bound"
                          : "Bind Current Pack"}
                      </Button>
                      <Button
                        tone="ghost"
                        disabled={sceneAuthoring.editingState.surfaceRuleDraft.preferredPackId === null}
                        onClick={() => updateSurfaceRuleDraftPatch({ preferredPackId: null })}
                      >
                        Clear Pack Bias
                      </Button>
                    </Inline>
                    <p className="muted-copy">
                      Preferred pack: {sceneAuthoring.editingState.surfaceRuleDraft.preferredPackId ?? "none"} · preferred category:{" "}
                      {sceneAuthoring.editingState.surfaceRuleDraft.preferredCategory ?? "all"}
                    </p>
                    <div className="scene-pack-chip-row">
                      {terrainPurposeOptions.map((option) => (
                        <button
                          key={`surface-pref-${option.value}`}
                          className="scene-filter-chip"
                          data-active={sceneAuthoring.editingState.surfaceRuleDraft.preferredSurfacePurposes.includes(option.value)}
                          onClick={() => toggleSurfaceRulePurpose(option.value, "preferred")}
                          type="button"
                        >
                          Prefer · {option.label}
                        </button>
                      ))}
                    </div>
                    <div className="scene-pack-chip-row">
                      {terrainPurposeOptions.map((option) => (
                        <button
                          key={`surface-avoid-${option.value}`}
                          className="scene-filter-chip"
                          data-active={sceneAuthoring.editingState.surfaceRuleDraft.avoidedSurfacePurposes.includes(option.value)}
                          onClick={() => toggleSurfaceRulePurpose(option.value, "avoided")}
                          type="button"
                        >
                          Avoid · {option.label}
                        </button>
                      ))}
                    </div>
                    <div className="scene-outliner-list">
                      {surfaceRulePresetLibrary.entries.map((preset) => (
                        <div key={preset.presetId} className="scene-outliner-row">
                          <button
                            className="scene-outliner-button"
                            onClick={() => applySurfaceRulePresetById(preset.presetId)}
                            type="button"
                          >
                            <span>{preset.favorite ? `Favorite · ${preset.name}` : preset.name}</span>
                            <small>
                              {preset.contextSummary} · {preset.useCount} uses{preset.recent ? " · recent" : ""}
                            </small>
                          </button>
                          <button
                            className="scene-outliner-append"
                            onClick={() => toggleSurfaceRulePresetFavoriteById(preset.presetId)}
                            type="button"
                          >
                            {preset.favorite ? "Unstar" : "Star"}
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="muted-copy">
                      Surface rules keep terrain snap, orientation posture, slope tolerance, pack influence, and avoidance tendencies reusable without turning Build into a technical rules editor.
                    </p>
                  </Stack>
                </SurfaceCard>
              </Stack>
            </SurfaceCard>

            <SurfaceCard padding={4} tone="ghost" border="subtle">
              <Stack gap={3}>
                <span className="scene-toolbar-label">Terrain Editing</span>
                <TogglePillGroup
                  ariaLabel="Terrain tool mode"
                  options={terrainToolOptions}
                  value={sceneAuthoring.editingState.activeTerrainTool}
                  onChange={(value) => updateSceneAuthoringState((state) => setTerrainToolMode(state, value))}
                />
                <Inline gap={2}>
                  <Button
                    tone="primary"
                    disabled={!activeHoleId || !sceneAuthoring.terrainProfiles[0]}
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        createTerrainRegionForHole(state, {
                          holeId: activeHoleId,
                          name: `Hole ${project.holes.find((hole) => hole.holeId === activeHoleId)?.number ?? ""} Terrain`,
                          gameplayPurpose: terrainDraftPurpose,
                          terrainProfileId: state.terrainProfiles[0]!.terrainProfileId
                        }),
                      )
                    }
                  >
                    Create Region
                  </Button>
                  <Button
                    tone="secondary"
                    disabled={!selectedTerrainRegion}
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        selectedTerrainRegion
                          ? scaleSpatialBoundary(state, "terrain-region", selectedTerrainRegion.terrainRegionId, 1.08)
                          : state,
                      )
                    }
                  >
                    Grow
                  </Button>
                  <Button
                    tone="secondary"
                    disabled={!selectedTerrainRegion}
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        selectedTerrainRegion
                          ? scaleSpatialBoundary(state, "terrain-region", selectedTerrainRegion.terrainRegionId, 0.92)
                          : state,
                      )
                    }
                  >
                    Tighten
                  </Button>
                </Inline>
                <SelectField
                  label="New Region Purpose"
                  value={terrainDraftPurpose}
                  options={terrainPurposeOptions}
                  onChange={(event) => setTerrainDraftPurpose(event.currentTarget.value as TerrainGameplayPurpose)}
                />
                <TogglePillGroup
                  ariaLabel="Terrain sculpt mode"
                  options={terrainSculptModeOptions}
                  value={sceneAuthoring.editingState.terrainSculptMode}
                  onChange={(value) => updateSceneAuthoringState((state) => setTerrainSculptMode(state, value))}
                />
                <div className="scene-vector-fields">
                  <TextField
                    label="Brush Radius"
                    type="number"
                    value={String(sceneAuthoring.editingState.terrainBrushRadiusMeters)}
                    onChange={(event) =>
                      updateSceneAuthoringState((state) =>
                        updateTerrainBrushSettings(state, {
                          terrainBrushRadiusMeters: Math.max(
                            1,
                            parseNumericInput(
                              event.currentTarget.value,
                              state.editingState.terrainBrushRadiusMeters,
                            ),
                          )
                        }),
                      )
                    }
                  />
                  <TextField
                    label="Brush Strength"
                    type="number"
                    value={String(sceneAuthoring.editingState.terrainBrushStrength)}
                    onChange={(event) =>
                      updateSceneAuthoringState((state) =>
                        updateTerrainBrushSettings(state, {
                          terrainBrushStrength: Math.max(
                            0.05,
                            parseNumericInput(event.currentTarget.value, state.editingState.terrainBrushStrength),
                          )
                        }),
                      )
                    }
                  />
                  <TextField
                    label="Falloff"
                    type="number"
                    value={String(sceneAuthoring.editingState.terrainBrushFalloffMeters)}
                    onChange={(event) =>
                      updateSceneAuthoringState((state) =>
                        updateTerrainBrushSettings(state, {
                          terrainBrushFalloffMeters: Math.max(
                            0,
                            parseNumericInput(
                              event.currentTarget.value,
                              state.editingState.terrainBrushFalloffMeters,
                            ),
                          )
                        }),
                      )
                    }
                  />
                </div>
                <TextField
                  label="Target Height"
                  type="number"
                  value={sceneAuthoring.editingState.terrainBrushTargetHeight == null ? "" : String(sceneAuthoring.editingState.terrainBrushTargetHeight)}
                  onChange={(event) =>
                    updateSceneAuthoringState((state) =>
                      updateTerrainBrushSettings(state, {
                        terrainBrushTargetHeight:
                          event.currentTarget.value === ""
                            ? null
                            : parseNumericInput(
                                event.currentTarget.value,
                                state.editingState.terrainBrushTargetHeight ?? 0,
                              )
                      }),
                    )
                  }
                />
                <p className="body-copy">
                  {sceneAuthoring.editingState.activeTerrainTool === "paint-material"
                    ? "Paint material finish onto the selected terrain region. Sculpt still changes shape; paint only changes finish and finish-tag consistency."
                    : "Click the viewport to create terrain at the current brush settings, or sculpt the selected region directly when Modifier mode is active."}
                </p>
                <TogglePillGroup
                  ariaLabel="Terrain paint blend mode"
                  options={terrainPaintBlendOptions}
                  value={sceneAuthoring.editingState.terrainPaintBlendMode}
                  onChange={(value) => updateSceneAuthoringState((state) => setTerrainPaintBlendMode(state, value))}
                />
                <TogglePillGroup
                  ariaLabel="Terrain finish visibility mode"
                  options={terrainMaterialVisibilityOptions}
                  value={sceneAuthoring.editingState.terrainMaterialVisibilityMode}
                  onChange={(value) =>
                    updateSceneAuthoringState((state) => setTerrainMaterialVisibilityMode(state, value))
                  }
                />
                <Inline gap={2}>
                  {[0, 1, 2].map((layerIndex) => (
                    <Button
                      key={`terrain-layer-${layerIndex}`}
                      tone={sceneAuthoring.editingState.activeTerrainMaterialLayerIndex === layerIndex ? "primary" : "ghost"}
                      onClick={() =>
                        updateSceneAuthoringState((state) => setActiveTerrainMaterialLayerIndex(state, layerIndex))
                      }
                    >
                      Layer {layerIndex + 1}
                    </Button>
                  ))}
                </Inline>
                <div className="scene-pack-chip-row">
                  {sceneAuthoring.terrainMaterialPalette.map((material) => (
                    <button
                      key={material.terrainMaterialId}
                      className="scene-filter-chip"
                      data-active={material.terrainMaterialId === sceneAuthoring.editingState.activeTerrainMaterialId}
                      onClick={() =>
                        updateSceneAuthoringState((state) => setActiveTerrainMaterial(state, material.terrainMaterialId))
                      }
                      type="button"
                    >
                      {material.label} · {formatTitle(material.stackRole)}
                    </button>
                  ))}
                </div>
                {activeTerrainMaterial ? (
                  <SurfaceCard padding={4} tone="ghost" border="subtle">
                    <Stack gap={2}>
                      <strong>{activeTerrainMaterial.label}</strong>
                      <p className="body-copy">{activeTerrainMaterial.visualFinish}</p>
                      <p className="muted-copy">
                        Slot {activeTerrainMaterial.paletteSlot} · {formatTitle(activeTerrainMaterial.stackRole)} · Blend bias{" "}
                        {Math.round(activeTerrainMaterial.blendBias * 100)}%
                      </p>
                      <p className="muted-copy">{activeTerrainMaterial.note}</p>
                    </Stack>
                  </SurfaceCard>
                ) : null}
                <SurfaceCard padding={4} tone="ghost" border="subtle">
                  <Stack gap={2}>
                    <strong>Terrain Finish Consistency</strong>
                    <Inline gap={2}>
                      <Button
                        tone={sceneAuthoring.overlayState.showTerrainFinishOverlay ? "primary" : "secondary"}
                        onClick={() => toggleOverlay("showTerrainFinishOverlay")}
                      >
                        {sceneAuthoring.overlayState.showTerrainFinishOverlay ? "Hide Finish Intel" : "Show Finish Intel"}
                      </Button>
                    </Inline>
                    <p className="body-copy">
                      {terrainFinishSummary.coveragePercent}% coverage · {terrainFinishSummary.unpaintedRegionCount} unpainted
                      regions · {terrainFinishSummary.layeredRegionCount} layered regions
                    </p>
                    <p className="muted-copy">
                      {terrainFinishSummary.paletteUsageCount} materials in active use ·{" "}
                      {terrainFinishSummary.favoriteUsageCount} favorite finishes represented ·{" "}
                      {terrainFinishSummary.balanceState} balance.
                    </p>
                    <p className="muted-copy">
                      {terrainFinishSummary.dominantMaterialLabel
                        ? `${terrainFinishSummary.dominantMaterialLabel} leads at ${terrainFinishSummary.dominantMaterialPercent}% coverage.`
                        : "No dominant finish yet."}{" "}
                      {terrainFinishSummary.patchyRegionCount} patchy regions · {terrainFinishSummary.completenessState} completeness.
                    </p>
                    <p className="muted-copy">
                      Course scale: {courseScaleTerrainFinish.readyHoleCount} holes balanced · {courseScaleTerrainFinish.watchHoleCount} on watch ·{" "}
                      {courseScaleTerrainFinish.imbalancedHoleCount} weak holes · palette {courseScaleTerrainFinish.paletteDistributionState}.
                    </p>
                    <p className="muted-copy">
                      Finish Intel overlay: {terrainFinishSummary.coverageGapRegionIds.length} coverage gaps ·{" "}
                      {terrainFinishSummary.patchyRegionIds.length} patchy regions ·{" "}
                      {terrainFinishSummary.dominantMaterialOveruseRegionIds.length} dominant-overuse regions.
                    </p>
                    <p className="muted-copy">{courseScaleTerrainFinish.recommendedAction}</p>
                    {courseScaleTerrainFinish.holeSummaries.length > 0 ? (
                      <div className="scene-pack-chip-row">
                        {courseScaleTerrainFinish.holeSummaries
                          .filter((hole) => hole.balanceState !== "balanced")
                          .slice(0, 3)
                          .map((hole) => (
                            <StatusPill
                              key={`finish-hole-${hole.holeId}`}
                              label={`${hole.holeId} · ${hole.balanceState} · ${hole.hotspotCount} hotspots`}
                              tone={hole.balanceState === "imbalanced" ? "warning" : "info"}
                            />
                          ))}
                      </div>
                    ) : null}
                    {terrainFinishSummary.usageByMaterial.length > 0 ? (
                      <div className="scene-pack-chip-row">
                        {terrainFinishSummary.usageByMaterial.slice(0, 4).map((material) => (
                          <StatusPill
                            key={material.terrainMaterialId}
                            label={`${material.label} · ${material.regionCount} regions`}
                            tone="info"
                          />
                        ))}
                      </div>
                    ) : null}
                  </Stack>
                </SurfaceCard>
                {selectedTerrainRegion ? (
                  <SelectField
                    label="Gameplay purpose"
                    value={selectedTerrainRegion.gameplayPurpose}
                    options={terrainPurposeOptions}
                    onChange={(event) =>
                      updateSceneAuthoringState((state) =>
                        assignTerrainRegionPurpose(
                          state,
                          selectedTerrainRegion.terrainRegionId,
                          event.currentTarget.value as TerrainGameplayPurpose,
                        ),
                      )
                    }
                  />
                ) : null}
                {selectedTerrainModifier ? (
                  <TextAreaField
                    label="Latest Sculpt Note"
                    rows={2}
                    value={selectedTerrainModifier.note}
                    onChange={(event) =>
                      updateSceneAuthoringState((state) =>
                        updateTerrainModifier(state, selectedTerrainModifier.terrainModifierId, {
                          note: event.currentTarget.value
                        }),
                      )
                    }
                  />
                ) : null}
                {sceneAuthoring.editingState.activeTerrainTool === "paint-material" && selectedTerrainRegion ? (
                  <p className="muted-copy">
                    {selectedTerrainRegion.paintedMaterialIds.length} material finishes tagged on this region so far. Preview stays live so creators can see finish coverage before committing the stroke.
                  </p>
                ) : null}
              </Stack>
            </SurfaceCard>

            <SurfaceCard padding={4} tone="ghost" border="subtle">
              <Stack gap={3}>
                <span className="scene-toolbar-label">Routing Editing</span>
                <TogglePillGroup
                  ariaLabel="Routing tool mode"
                  options={routingToolOptions}
                  value={sceneAuthoring.editingState.activeRoutingTool}
                  onChange={(value) => updateSceneAuthoringState((state) => setRoutingToolMode(state, value))}
                />
                <Inline gap={2}>
                  <SelectField
                    label="Node kind"
                    value={routingNodeDraftKind}
                    options={routingNodeKindOptions}
                    onChange={(event) => setRoutingNodeDraftKind(event.currentTarget.value as RoutingNodeKind)}
                  />
                  <Button
                    tone="primary"
                    disabled={!activeHoleId}
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        addRoutingNodeForHole(state, {
                          holeId: activeHoleId,
                          kind: routingNodeDraftKind,
                          position: {
                            x: state.viewportState.camera.target.x,
                            y: 0,
                            z: state.viewportState.camera.target.z
                          }
                        }),
                      )
                    }
                  >
                    Add Node
                  </Button>
                </Inline>
                <Inline gap={2}>
                  <Button tone="secondary" disabled={!selectedRoutingNode} onClick={setPendingConnectionStart}>
                    Set Connect Start
                  </Button>
                  <Button
                    tone="secondary"
                    disabled={!selectedRoutingNode || !sceneAuthoring.editingState.pendingConnectionStartNodeId}
                    onClick={connectPendingToSelectedNode}
                  >
                    Connect To Selected
                  </Button>
                  <Button
                    tone="ghost"
                    disabled={!selectedRoutingSegment}
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        selectedRoutingSegment ? splitRoutingSegment(state, selectedRoutingSegment.routingSegmentId) : state,
                      )
                    }
                  >
                    Split Segment
                  </Button>
                </Inline>
                <Inline gap={2}>
                  <Button
                    tone="secondary"
                    disabled={!selectedRoutingSegment}
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        selectedRoutingSegment
                          ? smoothRoutingSegmentShape(state, selectedRoutingSegment.routingSegmentId)
                          : state,
                      )
                    }
                  >
                    Smooth Selected Segment
                  </Button>
                  <Button
                    tone="secondary"
                    disabled={!selectedRoutingSegment}
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        selectedRoutingSegment
                          ? harmonizeRoutingSegmentWidth(state, selectedRoutingSegment.routingSegmentId)
                          : state,
                      )
                    }
                  >
                    Harmonize Width
                  </Button>
                  <Button
                    tone="secondary"
                    disabled={!selectedRoutingNode}
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        selectedRoutingNode ? polishRoutingNodeElevation(state, selectedRoutingNode.routingNodeId) : state,
                      )
                    }
                  >
                    Polish Node Height
                  </Button>
                  <Button
                    tone="ghost"
                    disabled={!activeHoleId}
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        activeHoleId ? polishRoutingHoleContinuity(state, activeHoleId) : state,
                      )
                    }
                  >
                    Polish Active Hole
                  </Button>
                  <Button
                    tone="ghost"
                    disabled={!activeHoleId || routingContinuitySummary.mergeClusterCount === 0}
                    onClick={resolveActiveHoleMergeClusters}
                  >
                    Resolve Merge Clusters
                  </Button>
                  <Button
                    tone="ghost"
                    disabled={!activeHoleId}
                    onClick={reconcileActiveHoleFinish}
                  >
                    Reconcile Active Hole
                  </Button>
                </Inline>
                {selectedRoutingSegment ? (
                  <SelectField
                    label="Segment role"
                    value={selectedRoutingSegment.kind}
                    options={routingSegmentRoleOptions}
                    onChange={(event) =>
                      updateSceneAuthoringState((state) =>
                        assignRoutingSegmentRole(
                          state,
                          selectedRoutingSegment.routingSegmentId,
                          event.currentTarget.value as RoutingSegmentKind,
                        ),
                      )
                    }
                  />
                ) : null}
                <div className="scene-snap-grid">
                  <button
                    className="scene-snap-toggle"
                    data-active={sceneAuthoring.editingState.routingGuideSettings.angleSnapEnabled}
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        updateRoutingGuideSettings(state, {
                          angleSnapEnabled: !state.editingState.routingGuideSettings.angleSnapEnabled
                        }),
                      )
                    }
                    type="button"
                  >
                    Angle Snap
                  </button>
                  <button
                    className="scene-snap-toggle"
                    data-active={sceneAuthoring.editingState.routingGuideSettings.autoConnectEnabled}
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        updateRoutingGuideSettings(state, {
                          autoConnectEnabled: !state.editingState.routingGuideSettings.autoConnectEnabled
                        }),
                      )
                    }
                    type="button"
                  >
                    Auto Connect
                  </button>
                  <button
                    className="scene-snap-toggle"
                    data-active={sceneAuthoring.editingState.routingGuideSettings.autoMergeEnabled}
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        updateRoutingGuideSettings(state, {
                          autoMergeEnabled: !state.editingState.routingGuideSettings.autoMergeEnabled
                        }),
                      )
                    }
                    type="button"
                  >
                    Auto Merge
                  </button>
                </div>
                <div className="scene-vector-fields">
                  <TextField
                    label="Angle Step"
                    type="number"
                    value={String(sceneAuthoring.editingState.routingGuideSettings.angleStepDegrees)}
                    onChange={(event) =>
                      updateSceneAuthoringState((state) =>
                        updateRoutingGuideSettings(state, {
                          angleStepDegrees: Math.max(
                            1,
                            parseNumericInput(
                              event.currentTarget.value,
                              state.editingState.routingGuideSettings.angleStepDegrees,
                            ),
                          )
                        }),
                      )
                    }
                  />
                  <TextField
                    label="Working Height"
                    type="number"
                    value={String(sceneAuthoring.editingState.routingGuideSettings.workingHeightMeters)}
                    onChange={(event) =>
                      updateSceneAuthoringState((state) =>
                        updateRoutingGuideSettings(state, {
                          workingHeightMeters: parseNumericInput(
                            event.currentTarget.value,
                            state.editingState.routingGuideSettings.workingHeightMeters,
                          )
                        }),
                      )
                    }
                  />
                  <TextField
                    label="Default Width"
                    type="number"
                    value={String(sceneAuthoring.editingState.routingGuideSettings.defaultCorridorWidthMeters)}
                    onChange={(event) =>
                      updateSceneAuthoringState((state) =>
                        updateRoutingGuideSettings(state, {
                          defaultCorridorWidthMeters: Math.max(
                            8,
                            parseNumericInput(
                              event.currentTarget.value,
                              state.editingState.routingGuideSettings.defaultCorridorWidthMeters,
                            ),
                          )
                        }),
                      )
                    }
                  />
                  <TextField
                    label="Merge Tolerance"
                    type="number"
                    value={String(sceneAuthoring.editingState.routingGuideSettings.mergeToleranceMeters)}
                    onChange={(event) =>
                      updateSceneAuthoringState((state) =>
                        updateRoutingGuideSettings(state, {
                          mergeToleranceMeters: Math.max(
                            1,
                            parseNumericInput(
                              event.currentTarget.value,
                              state.editingState.routingGuideSettings.mergeToleranceMeters,
                            ),
                          )
                        }),
                      )
                    }
                  />
                </div>
                <TogglePillGroup
                  ariaLabel="Routing visibility mode"
                  options={routingVisibilityOptions}
                  value={sceneAuthoring.editingState.routingGuideSettings.visibilityMode}
                  onChange={(value) => updateSceneAuthoringState((state) => updateRoutingGuideSettings(state, { visibilityMode: value }))}
                />
                <p className="body-copy">
                  Add nodes directly in the viewport, then drag route width, route height, corridor, and visibility handles to refine continuity, landing shape, merge behavior, and visibility posture without dropping into nested path tabs.
                </p>
                <p className="muted-copy">{routingVisibilitySummary}</p>
                <SurfaceCard padding={4} tone="ghost" border="subtle">
                  <Stack gap={2}>
                    <strong>Route Continuity</strong>
                    <p className="body-copy">
                      {routingContinuitySummary.continuityWatchCount} continuity watches ·{" "}
                      {routingContinuitySummary.widthWatchCount} width watches ·{" "}
                      {routingContinuitySummary.elevationWatchCount} elevation watches
                    </p>
                    <p className="muted-copy">
                      {routingContinuitySummary.smoothingWatchCount} smoothing watches ·{" "}
                      {routingContinuitySummary.mergeOpportunityCount} merge opportunities ·{" "}
                      {routingContinuitySummary.mergeClusterCount} merge clusters ·{" "}
                      {routingContinuitySummary.deliveryConfidence} delivery confidence.
                    </p>
                    <p className="muted-copy">
                      Width {routingContinuitySummary.widthHarmonyState} · elevation {routingContinuitySummary.elevationHarmonyState} · merge {routingContinuitySummary.mergeConfidenceState} · completion {routingContinuitySummary.completionPercent}%.
                    </p>
                    <p className="muted-copy">
                      Join width watches {routingContinuitySummary.joinWidthWatchCount} · join elevation watches {routingContinuitySummary.joinElevationWatchCount} · unresolved merge nodes {routingContinuitySummary.unresolvedMergeNodeIds.length}.
                    </p>
                    <p className="muted-copy">{routingContinuitySummary.recommendedAction}</p>
                  </Stack>
                </SurfaceCard>
                <SurfaceCard padding={4} tone="ghost" border="subtle">
                  <Stack gap={2}>
                    <strong>Route Finish Reconciliation</strong>
                    <p className="body-copy">
                      {routeFinishReconciliation.reconciledHoleCount} holes reconciled · {routeFinishReconciliation.watchHoleCount} on watch ·{" "}
                      {routeFinishReconciliation.roughHoleCount} still rough.
                    </p>
                    <p className="muted-copy">
                      {routeFinishReconciliation.unresolvedHoleCount} holes still need finish-stage cleanup across merge, width, elevation, or continuity posture.
                    </p>
                    <p className="muted-copy">{routeFinishReconciliation.recommendedAction}</p>
                    {routeFinishReconciliation.holeSummaries.length > 0 ? (
                      <div className="scene-pack-chip-row">
                        {routeFinishReconciliation.holeSummaries
                          .filter((hole) => hole.reconciliationState !== "reconciled")
                          .slice(0, 4)
                          .map((hole) => (
                            <StatusPill
                              key={`route-reconcile-${hole.holeId}`}
                              label={`${hole.holeId} · ${hole.reconciliationState} · ${hole.unresolvedJoinCount} joins`}
                              tone={hole.reconciliationState === "rough" ? "warning" : "info"}
                            />
                          ))}
                      </div>
                    ) : null}
                  </Stack>
                </SurfaceCard>
              </Stack>
            </SurfaceCard>

            <SurfaceCard padding={4} tone="ghost" border="subtle">
              <Stack gap={3}>
                <span className="scene-toolbar-label">Simulator Geometry</span>
                <TogglePillGroup
                  ariaLabel="Simulator anchor tool mode"
                  options={simulatorToolOptions}
                  value={sceneAuthoring.editingState.activeSimulatorAnchorTool}
                  onChange={(value) => updateSceneAuthoringState((state) => setSimulatorAnchorToolMode(state, value))}
                />
                <Inline gap={2}>
                  <Button tone="primary" disabled={!activeHoleId} onClick={() => updateSceneAuthoringState((state) => createTeeZoneForHole(state, { holeId: activeHoleId, teeSetRefs: project.teeSets.filter((teeSet) => teeSet.holeYardages[activeHoleId]).map((teeSet) => teeSet.teeSetId) }))}>Tee Zone</Button>
                  <Button tone="primary" disabled={!activeHoleId} onClick={() => updateSceneAuthoringState((state) => createGreenZoneForHoleAt(state, { holeId: activeHoleId }))}>Green Zone</Button>
                  <Button tone="secondary" disabled={!activeHoleId} onClick={() => updateSceneAuthoringState((state) => createHazardZoneForHole(state, { holeId: activeHoleId }))}>Hazard</Button>
                  <Button tone="secondary" disabled={!activeHoleId} onClick={() => updateSceneAuthoringState((state) => createOutOfBoundsZoneForHole(state, activeHoleId))}>OB</Button>
                  <Button tone="secondary" disabled={!activeHoleId} onClick={() => updateSceneAuthoringState((state) => createDropZoneAreaForHole(state, { holeId: activeHoleId }))}>Drop Zone</Button>
                  <Button tone="ghost" disabled={!activeHoleId} onClick={() => updateSceneAuthoringState((state) => createPreviewAnchorForHole(state, activeHoleId))}>Preview Anchor</Button>
                </Inline>
                <p className="body-copy">
                  In Sim Anchors mode, click the viewport to place or stage simulator-critical geometry in context instead of authoring it only through abstract forms.
                </p>
                <SurfaceCard padding={4} tone="ghost" border="subtle">
                  <Stack gap={2}>
                    <strong>Build-to-Preview Framing</strong>
                    <p className="body-copy">
                      {buildPreviewFraming.readyHoleCount} holes frame ready, {buildPreviewFraming.watchHoleCount} stay on watch, and {buildPreviewFraming.roughHoleCount} still read rough from build into preview.
                    </p>
                    <p className="muted-copy">{buildPreviewFraming.recommendedAction}</p>
                    <p className="muted-copy">
                      Preview camera: {previewCameraReadability.overallState} · {previewCameraReadability.blockedHoleCount} blocked holes ·{" "}
                      {previewCameraReadability.watchHoleCount} on watch.
                    </p>
                    <p className="muted-copy">
                      Camera paths: {cameraPathAuthoring.overallState} · {cameraPathAuthoring.incompleteHoleCount} incomplete holes ·{" "}
                      {cameraPathAuthoring.blockedHoleCount} blocked path reads.
                    </p>
                    <p className="muted-copy">
                      Playback polish: {cameraPathPlaybackPolish.overallState} · {cameraPathPlaybackPolish.polishGapHoleCount} polish gaps ·{" "}
                      {cameraPathPlaybackPolish.abruptHoleCount} abrupt transitions.
                    </p>
                    <p className="muted-copy">
                      Camera corrections: {cameraPathCorrections.overallState} · {cameraPathCorrections.blockedHoleCount} blocked-segment fixes ·{" "}
                      {cameraPathCorrections.smoothingHoleCount} smoothing passes.
                    </p>
                    <p className="muted-copy">
                      Capture execution: {cameraCaptureExecution.overallState} · {cameraCaptureExecution.captureHoleCount} key captures ·{" "}
                      {cameraCaptureExecution.approvalHoleCount} approval passes.
                    </p>
                    <p className="muted-copy">
                      Shot sequencing: {cameraShotSequencing.overallState} · {cameraShotSequencing.sequenceGapHoleCount} sequencing gaps ·{" "}
                      {cameraShotSequencing.weakSequenceHoleCount} weak sequence segments.
                    </p>
                    <p className="muted-copy">
                      Shot approval: {shotOrderApproval.overallState} · {shotOrderApproval.approvalGapHoleCount} approval gaps ·{" "}
                      {shotOrderApproval.unapprovedHoleCount} unapproved segments.
                    </p>
                    <p className="muted-copy">
                      Shot variants: {shotVariantSets.overallState} · {shotVariantSets.primaryVariantHoleCount} primary variant holes ·{" "}
                      {shotVariantSets.alternateVariantHoleCount} alternate variant holes.
                    </p>
                    <p className="muted-copy">
                      Variant shipping: {shotVariantShippingDecisions.overallState} · {shotVariantShippingDecisions.selectedHoleCount} selected shipping holes ·{" "}
                      {shotVariantShippingDecisions.approvedNonShippingHoleCount} approved backup holes.
                    </p>
                    <p className="muted-copy">
                      Shipping manifest: {shotVariantShippingManifest.overallState} · {shotVariantShippingManifest.selectedHoleCount} selected manifests ·{" "}
                      {shotVariantShippingManifest.heldBackHoleCount} held-back backup holes.
                    </p>
                    <p className="muted-copy">
                      Landmark correction: {landmarkReadabilityCorrection.overallState} ·{" "}
                      {landmarkReadabilityCorrection.missingLandmarkHoleCount} landmark-thin holes ·{" "}
                      {landmarkReadabilityCorrection.blockedHoleCount} blocked corrections.
                    </p>
                    <p className="muted-copy">
                      Landmark actions: {landmarkCorrectionActions.overallState} · {landmarkCorrectionActions.correctiveHoleCount} corrective holes ·{" "}
                      {landmarkCorrectionActions.openViewHoleCount} open-view actions.
                    </p>
                    <p className="muted-copy">
                      Corridor tools: {landmarkViewCorridorTools.overallState} · {landmarkViewCorridorTools.blockedHoleCount} blocked corridors ·{" "}
                      {landmarkViewCorridorTools.rebalanceHoleCount} rebalance passes.
                    </p>
                    <p className="muted-copy">
                      Corridor staging: {landmarkCorridorStaging.overallState} · {landmarkCorridorStaging.stagingHoleCount} staging passes ·{" "}
                      {landmarkCorridorStaging.reinforceHoleCount} route-support reinforcements.
                    </p>
                    <p className="muted-copy">
                      Corridor kits: {landmarkCorridorSupportKits.overallState} · {landmarkCorridorSupportKits.correctiveHoleCount} support-kit holes ·{" "}
                      {landmarkCorridorSupportKits.openKitHoleCount} open-view kits.
                    </p>
                    <p className="muted-copy">
                      Corridor bundles: {landmarkCorridorKitComposition.overallState} · {landmarkCorridorKitComposition.correctiveHoleCount} bundle holes ·{" "}
                      {landmarkCorridorKitComposition.hybridBundleHoleCount} hybrid bundles.
                    </p>
                    <p className="muted-copy">
                      Corridor library: {corridorBundleLibrary.overallState} · {corridorBundleLibrary.quickApplyCount} quick-apply bundles ·{" "}
                      {corridorBundleLibrary.favoriteCount} favorites.
                    </p>
                    <p className="muted-copy">
                      Corridor recommendations: {corridorBundleRecommendations.overallState} · {corridorBundleRecommendations.recommendationCount} guided holes ·{" "}
                      {corridorBundleRecommendations.recommendedBundleCount} recommended bundles.
                    </p>
                    <p className="muted-copy">
                      Release-facing world readability: {releaseFacingWorldReadability.overallState} ·{" "}
                      {releaseFacingWorldReadability.weakLandmarkHoleCount} landmark-thin holes ·{" "}
                      {releaseFacingWorldReadability.routeWatchHoleCount} route-watch holes.
                    </p>
                    <p className="muted-copy">
                      Final presentation: {finalReleasePresentationConfidence.overallState} ·{" "}
                      {finalReleasePresentationConfidence.presentationGapHoleCount} presentation-gap holes.
                    </p>
                    <p className="muted-copy">
                      Packet proofing: {presentationPacketProofing.overallReadiness} · {presentationPacketProofing.proofingGapCount} proofing gaps ·{" "}
                      {presentationPacketProofing.sequenceConfidenceState} sequence confidence.
                    </p>
                    <p className="muted-copy">
                      Share gate: {finalShareGate.gateState} · {finalShareGate.approvalGapCount} approval gaps ·{" "}
                      {finalShareGate.signoffLockState} share lock.
                    </p>
                    <p className="muted-copy">{releaseFacingWorldReadability.recommendedAction}</p>
                    <p className="muted-copy">{finalReleasePresentationConfidence.recommendedAction}</p>
                    <p className="muted-copy">{presentationPacketProofing.nextActions[0] ?? "Packet proofing is aligned with the current presentation posture."}</p>
                    <SurfaceCard padding={4} tone="ghost" border="subtle">
                      <Stack gap={2}>
                        <strong>Landmark Re-Staging</strong>
                        <p className="body-copy">
                          {selectedLandmarkObject
                            ? `${selectedLandmarkObject.name} is selected for direct re-staging on the current route.`
                            : "Select one landmark object in the viewport to use the direct re-staging actions."}
                        </p>
                        <p className="muted-copy">{landmarkCorrectionActions.recommendedAction}</p>
                        <p className="muted-copy">{landmarkCorridorSupportKits.recommendedAction}</p>
                        <Inline gap={2}>
                          <Button
                            tone="secondary"
                            disabled={!selectedLandmarkObject || selectedLandmarkObject.locked}
                            onClick={() => applyLandmarkRestagingAction("stage-landmark-support")}
                          >
                            Stage Support
                          </Button>
                          <Button
                            tone="secondary"
                            disabled={!selectedLandmarkObject || selectedLandmarkObject.locked}
                            onClick={() => applyLandmarkRestagingAction("open-view-corridor")}
                          >
                            Open View
                          </Button>
                          <Button
                            tone="secondary"
                            disabled={!selectedLandmarkObject || selectedLandmarkObject.locked}
                            onClick={() => applyLandmarkRestagingAction("reinforce-route-view")}
                          >
                            Reinforce Route
                          </Button>
                          <Button
                            tone="ghost"
                            disabled={!selectedLandmarkObject || selectedLandmarkObject.locked}
                            onClick={() => applyLandmarkRestagingAction("calm-presentation-view")}
                          >
                            Calm Presentation
                          </Button>
                        </Inline>
                        <Inline gap={2}>
                          <Button tone="ghost" onClick={() => applyLandmarkCorridorSupportKitAction("open-view-corridor-kit")}>
                            Open-View Kit
                          </Button>
                          <Button tone="ghost" onClick={() => applyLandmarkCorridorSupportKitAction("anchor-landmark-support-kit")}>
                            Anchor Kit
                          </Button>
                          <Button tone="ghost" onClick={() => applyLandmarkCorridorSupportKitAction("rebalance-route-support-kit")}>
                            Route Kit
                          </Button>
                          <Button tone="ghost" onClick={() => applyLandmarkCorridorSupportKitAction("calm-presentation-corridor-kit")}>
                            Calm Kit
                          </Button>
                        </Inline>
                        <Inline gap={2}>
                          <Button tone="secondary" onClick={() => applyLandmarkCorridorSupportBundleAction("compose-open-support-bundle")}>
                            Open Bundle
                          </Button>
                          <Button tone="secondary" onClick={() => applyLandmarkCorridorSupportBundleAction("compose-route-support-bundle")}>
                            Route Bundle
                          </Button>
                          <Button tone="ghost" onClick={() => applyLandmarkCorridorSupportBundleAction("compose-presentation-calm-bundle")}>
                            Calm Bundle
                          </Button>
                          <Button tone="ghost" onClick={() => applyLandmarkCorridorSupportBundleAction("compose-hybrid-support-bundle")}>
                            Hybrid Bundle
                          </Button>
                        </Inline>
                      </Stack>
                    </SurfaceCard>
                    <SurfaceCard padding={4} tone="ghost" border="subtle">
                      <Stack gap={2}>
                        <strong>Landmark View Corridors</strong>
                        <p className="body-copy">
                          Use corridor tools to widen blocked reads, restage landmark support, rebalance route-facing support, and calm the presentation lane without dropping into a separate routing editor.
                        </p>
                        <p className="muted-copy">{landmarkViewCorridorTools.recommendedAction}</p>
                        <p className="muted-copy">{landmarkCorridorStaging.recommendedAction}</p>
                        <p className="muted-copy">{landmarkCorridorSupportKits.recommendedAction}</p>
                        <Inline gap={2}>
                          <Button tone="secondary" onClick={() => applyLandmarkCorridorAction("widen-view-corridor")}>
                            Widen Corridor
                          </Button>
                          <Button tone="secondary" onClick={() => applyLandmarkCorridorAction("shift-landmark-support")}>
                            Shift Support
                          </Button>
                          <Button tone="secondary" onClick={() => applyLandmarkCorridorAction("rebalance-route-corridor")}>
                            Rebalance Route
                          </Button>
                          <Button tone="ghost" onClick={() => applyLandmarkCorridorAction("calm-presentation-corridor")}>
                            Calm Corridor
                          </Button>
                        </Inline>
                      </Stack>
                    </SurfaceCard>
                    <SurfaceCard padding={4} tone="ghost" border="subtle">
                      <Stack gap={2}>
                        <strong>Corridor Bundle Library</strong>
                        <p className="body-copy">
                          {corridorBundleLibrary.totalCount} named corridor bundles are available, {corridorBundleLibrary.favoriteCount} are favorites, and {corridorBundleLibrary.quickApplyCount} stay ready for quick apply during finish-stage support cleanup.
                        </p>
                        <p className="muted-copy">{corridorBundleLibrary.recommendedAction}</p>
                        <p className="muted-copy">
                          Recommendations: {corridorBundleRecommendations.overallState} · {corridorBundleRecommendations.recommendationCount} holes currently need guided bundle support.
                        </p>
                        <Inline gap={2}>
                          {corridorBundleLibrary.entries.slice(0, 4).map((entry) => (
                            <Button
                              key={entry.presetId}
                              tone={entry.favorite ? "secondary" : "ghost"}
                              onClick={() => applyCorridorBundleLibraryEntryById(entry.presetId)}
                            >
                              {entry.name}
                            </Button>
                          ))}
                        </Inline>
                        <Inline gap={2}>
                          {corridorBundleLibrary.entries.slice(0, 3).map((entry) => (
                            <Button
                              key={`${entry.presetId}-favorite`}
                              tone="ghost"
                              onClick={() => toggleCorridorBundleLibraryFavoriteById(entry.presetId)}
                            >
                              {entry.favorite ? `Unfavorite ${entry.name}` : `Favorite ${entry.name}`}
                            </Button>
                          ))}
                        </Inline>
                      </Stack>
                    </SurfaceCard>
                    <SurfaceCard padding={4} tone="ghost" border="subtle">
                      <Stack gap={2}>
                        <strong>Corridor Bundle Recommendations</strong>
                        <p className="body-copy">{corridorBundleRecommendations.recommendedAction}</p>
                        <div className="scene-outliner-list">
                          {corridorBundleRecommendations.entries
                            .filter((entry) => entry.recommendationState !== "ready")
                            .slice(0, 4)
                            .map((entry) => (
                              <div key={`corridor-recommendation-${entry.holeId}`} className="scene-outliner-row">
                                <button
                                  className="scene-outliner-button"
                                  disabled={!entry.bundleId}
                                  onClick={() => (entry.bundleId ? applyCorridorBundleLibraryEntryById(entry.bundleId) : undefined)}
                                  type="button"
                                >
                                  <span>{`Hole ${entry.holeNumber} · ${entry.bundleName}`}</span>
                                  <small>{entry.reason}</small>
                                </button>
                                <span className="scene-outliner-meta">
                                  {entry.readinessState === "missing" ? "Save bundle" : entry.readinessState}
                                </span>
                              </div>
                            ))}
                        </div>
                      </Stack>
                    </SurfaceCard>
                  </Stack>
                </SurfaceCard>
              </Stack>
            </SurfaceCard>
          </div>

          <CanvasSceneViewport
            snapshot={rendererSnapshot}
            activeMode={sceneAuthoring.viewportState.authoringMode}
            placementDraftArmed={sceneAuthoring.editingState.activePlacementDraft !== null}
            sceneryBrushArmed={sceneAuthoring.editingState.sceneryBrushDrafts.length > 0}
            terrainMaterialPaintArmed={
              sceneAuthoring.editingState.activeTerrainTool === "paint-material" &&
              sceneAuthoring.editingState.selectedTerrainRegionId !== null &&
              sceneAuthoring.editingState.activeTerrainMaterialId !== null
            }
            terrainToolMode={sceneAuthoring.editingState.activeTerrainTool}
            routingToolMode={sceneAuthoring.editingState.activeRoutingTool}
            simulatorAnchorToolMode={sceneAuthoring.editingState.activeSimulatorAnchorTool}
            onSelectEntity={selectEntity}
            onCommitInteraction={commitViewportInteraction}
            onViewportGroundAction={handleViewportGroundAction}
            onHoverEntityChange={syncHoveredReference}
            onPreviewWorldPointChange={syncAuthoringPreviewWorldPoint}
            onExternalPlacementPreview={previewDraggedPlacement}
            onExternalPlacementCommit={commitDraggedPlacement}
            onExternalPlacementCancel={() => updateSceneAuthoringState((state) => clearAuthoringPreview(state))}
            onZoomChange={setCameraZoom}
            onCameraPan={(delta) => updateSceneAuthoringState((state) => panViewportCamera(state, delta))}
            onCameraOrbit={(delta) => updateSceneAuthoringState((state) => orbitViewportCamera(state, delta))}
            onDragStateChange={({ state: interactionState, reference, pendingActionLabel }) =>
              updateSceneAuthoringState((state) =>
                syncViewportInteractionPipeline(state, {
                  state: interactionState,
                  draggingEntityId: reference?.entityId ?? null,
                  draggingEntityType: reference?.entityType ?? null,
                  pendingActionLabel
                }),
              )
            }
          />
        </section>

        <div className="scene-authoring-side-stack">
          <section className="panel">
            <SectionHeader
              eyebrow="Embedded Asset Drawer"
              title="Content packs, recent assets, and direct world access"
              description="Browse approved content packs inside Build, arm or drag assets directly into the viewport, and keep brush context hot without leaving the world-first workflow."
              actions={
                <Inline gap={2}>
                  <Button tone={assetDrawerOpen ? "secondary" : "primary"} onClick={() => setAssetDrawerOpen((open) => !open)}>
                    {assetDrawerOpen ? "Collapse Drawer" : "Open Drawer"}
                  </Button>
                  <Button
                    tone="ghost"
                    disabled={recentDrawerEntries.length === 0}
                    onClick={() => {
                      setAssetDrawerOpen(true);
                      setAssetDrawerRecentOnly((current) => !current);
                    }}
                  >
                    {assetDrawerRecentOnly ? "Show All Assets" : "Show Recent Assets"}
                  </Button>
                </Inline>
              }
            />
            {selectedBuildPack ? (
              <div className="scene-pack-focus-shell">
                <div className="scene-pack-list">
                  {contentPacks.slice(0, 6).map((pack) => (
                    <button
                      key={pack.packId}
                      className="scene-pack-card"
                      data-active={pack.packId === selectedBuildPack.packId}
                      onClick={() => setSelectedBuildPackId(pack.packId)}
                      type="button"
                    >
                      <span>{pack.label}</span>
                      <strong>{pack.readyForPlacementCount} ready</strong>
                      <small>{pack.assetCount} assets</small>
                    </button>
                  ))}
                </div>

                <SurfaceCard padding={4} tone="ghost" border="subtle">
                  <Stack gap={3}>
                    <Inline justify="space-between">
                      <div>
                        <strong>{selectedBuildPack.label}</strong>
                        <p className="body-copy">{selectedBuildPack.note}</p>
                      </div>
                      <StatusPill
                        label={selectedBuildPack.dominantQueueState}
                        tone={selectedBuildPack.readyForPlacementCount > 0 ? "success" : "warning"}
                      />
                    </Inline>
                    <Inline gap={2}>
                      <Button tone="primary" disabled={brushReadyEntries.length === 0} onClick={loadBrushReadyPackAssets}>
                        Load Pack Into Brush
                      </Button>
                      <Button
                        tone="secondary"
                        disabled={buildPaletteEntries.length === 0}
                        onClick={() => armPlacementDraft(buildPaletteEntries[0]!)}
                      >
                        Arm First Ready Asset
                      </Button>
                    </Inline>
                    <div className="scene-builder-overview-grid">
                      <article className="scene-builder-overview-card">
                        <span>Pack Focus</span>
                        <strong>{selectedBuildPack.readyForPlacementCount}</strong>
                        <p>Approved assets ready to arm or drag straight into the viewport.</p>
                      </article>
                      <article className="scene-builder-overview-card">
                        <span>Recent Placements</span>
                        <strong>{recentDrawerEntries.length}</strong>
                        <p>Recently placed assets stay one click away so repeated dressing remains fast.</p>
                      </article>
                      <article className="scene-builder-overview-card">
                        <span>Brush Candidates</span>
                        <strong>{brushReadyEntries.length}</strong>
                        <p>Brush-eligible assets can be pushed into the current world-dressing mix instantly.</p>
                      </article>
                    </div>
                    <div className="scene-pack-chip-row">
                      {selectedBuildPack.categories.map((category) => (
                        <button
                          key={category}
                          className="scene-filter-chip"
                          onClick={() => focusBuildPalette(category)}
                          type="button"
                        >
                          {formatTitle(category)}
                        </button>
                      ))}
                    </div>
                    <div className="scene-pack-chip-row">
                      {selectedBuildPack.styleTags.slice(0, 6).map((tag) => (
                        <StatusPill key={tag} label={tag} tone="info" />
                      ))}
                    </div>
                    {assetDrawerOpen ? (
                      <SurfaceCard padding={4} tone="ghost" border="subtle">
                        <Stack gap={3}>
                          <span className="scene-toolbar-label">Drawer Filters</span>
                          <div className="scene-vector-fields">
                            <TextField
                              label="Search Assets"
                              value={assetDrawerQuery}
                              onChange={(event) => setAssetDrawerQuery(event.currentTarget.value)}
                            />
                            <SelectField
                              label="Category"
                              value={assetDrawerCategory}
                              options={[
                                { label: "All", value: "all" },
                                ...categoryOptions.map((option) => ({
                                  label: option.label,
                                  value: option.value
                                }))
                              ]}
                              onChange={(event) =>
                                setAssetDrawerCategory(event.currentTarget.value as SceneObjectCategory | "all")
                              }
                            />
                            <SelectField
                              label="Tag"
                              value={assetDrawerTag}
                              options={[
                                { label: "All Tags", value: "all" },
                                ...availableDrawerTags.map((tag) => ({
                                  label: tag,
                                  value: tag
                                }))
                              ]}
                              onChange={(event) => setAssetDrawerTag(event.currentTarget.value as string | "all")}
                            />
                          </div>
                          <Inline gap={2}>
                            <Button
                              tone={assetDrawerRecentOnly ? "primary" : "ghost"}
                              onClick={() => setAssetDrawerRecentOnly((current) => !current)}
                            >
                              {assetDrawerRecentOnly ? "Recent Only" : "Include All"}
                            </Button>
                            <Button
                              tone="ghost"
                              onClick={() => {
                                setAssetDrawerQuery("");
                                setAssetDrawerCategory("all");
                                setAssetDrawerTag("all");
                                setAssetDrawerRecentOnly(false);
                              }}
                            >
                              Reset Filters
                            </Button>
                          </Inline>
                          {recentDrawerEntries.length > 0 ? (
                            <div className="scene-pack-chip-row">
                              {recentDrawerEntries.slice(0, 6).map((entry) => (
                                <button
                                  key={`recent-${entry.assetId}`}
                                  className="scene-filter-chip"
                                  onClick={() => armPlacementDraft(entry)}
                                  type="button"
                                >
                                  Recent · {entry.label}
                                </button>
                              ))}
                            </div>
                          ) : null}
                          <div className="scene-outliner-list">
                            {drawerEntries.slice(0, 10).map((entry) => (
                              <div key={entry.assetId} className="scene-outliner-row">
                                <button
                                  className="scene-outliner-button"
                                  draggable
                                  onClick={() => armPlacementDraft(entry)}
                                  onDragStart={(event) => startPaletteDrag(event, entry)}
                                  type="button"
                                >
                                  <span>{entry.label}</span>
                                  <small>
                                    {formatTitle(entry.assetCategory)} · {entry.packLabel ?? "approved asset"} · drag to place
                                  </small>
                                </button>
                                <button
                                  className="scene-outliner-append"
                                  disabled={!entry.brushEligible}
                                  onClick={() => addPaletteEntryToBrush(entry)}
                                  type="button"
                                >
                                  Brush
                                </button>
                              </div>
                            ))}
                          </div>
                          <p className="muted-copy">
                            Drag from the drawer to place directly in the world, or click to arm placement while keeping pack, tag, and recent-asset context intact.
                          </p>
                        </Stack>
                      </SurfaceCard>
                    ) : null}
                    <SurfaceCard padding={4} tone="ghost" border="subtle">
                      <Stack gap={3}>
                        <span className="scene-toolbar-label">Brush Rule Depth</span>
                        <div className="scene-vector-fields">
                          <TextField
                            label="Brush Radius"
                            type="number"
                            value={String(sceneAuthoring.editingState.sceneryBrush.brushRadiusMeters)}
                            onChange={(event) =>
                              updateSceneAuthoringState((state) =>
                                updateSceneryBrushSettings(state, {
                                  brushRadiusMeters: Math.max(
                                    1,
                                    parseNumericInput(
                                      event.currentTarget.value,
                                      state.editingState.sceneryBrush.brushRadiusMeters,
                                    ),
                                  )
                                }),
                              )
                            }
                          />
                          <TextField
                            label="Density"
                            type="number"
                            value={String(sceneAuthoring.editingState.sceneryBrush.density)}
                            onChange={(event) =>
                              updateSceneAuthoringState((state) =>
                                updateSceneryBrushSettings(state, {
                                  density: Math.max(
                                    1,
                                    Math.min(
                                      24,
                                      Math.round(
                                        parseNumericInput(
                                          event.currentTarget.value,
                                          state.editingState.sceneryBrush.density,
                                        ),
                                      ),
                                    ),
                                  )
                                }),
                              )
                            }
                          />
                          <TextField
                            label="Spacing"
                            type="number"
                            value={String(sceneAuthoring.editingState.sceneryBrush.minimumSpacingMeters)}
                            onChange={(event) =>
                              updateSceneAuthoringState((state) =>
                                updateSceneryBrushSettings(state, {
                                  minimumSpacingMeters: Math.max(
                                    0,
                                    parseNumericInput(
                                      event.currentTarget.value,
                                      state.editingState.sceneryBrush.minimumSpacingMeters,
                                    ),
                                  )
                                }),
                              )
                            }
                          />
                          <TextField
                            label="Slope Limit"
                            type="number"
                            value={String(sceneAuthoring.editingState.sceneryBrush.slopeLimitDegrees)}
                            onChange={(event) =>
                              updateSceneAuthoringState((state) =>
                                updateSceneryBrushSettings(state, {
                                  slopeLimitDegrees: Math.max(
                                    0,
                                    Math.min(
                                      45,
                                      parseNumericInput(
                                        event.currentTarget.value,
                                        state.editingState.sceneryBrush.slopeLimitDegrees,
                                      ),
                                    ),
                                  )
                                }),
                              )
                            }
                          />
                          <TextField
                            label="Variance %"
                            type="number"
                            value={String(sceneAuthoring.editingState.sceneryBrush.scaleVariancePercent)}
                            onChange={(event) =>
                              updateSceneAuthoringState((state) =>
                                updateSceneryBrushSettings(state, {
                                  scaleVariancePercent: Math.max(
                                    0,
                                    parseNumericInput(
                                      event.currentTarget.value,
                                      state.editingState.sceneryBrush.scaleVariancePercent,
                                    ),
                                  )
                                }),
                              )
                            }
                          />
                          <TextField
                            label="Pack Influence %"
                            type="number"
                            value={String(Math.round(sceneAuthoring.editingState.sceneryBrush.activePackInfluence * 100))}
                            onChange={(event) =>
                              updateSceneAuthoringState((state) =>
                                updateSceneryBrushSettings(state, {
                                  activePackInfluence: Math.max(
                                    0,
                                    Math.min(
                                      1,
                                      parseNumericInput(
                                        event.currentTarget.value,
                                        Math.round(state.editingState.sceneryBrush.activePackInfluence * 100),
                                      ) / 100,
                                    ),
                                  )
                                }),
                              )
                            }
                          />
                          <TextField
                            label="Playable-Core Avoid %"
                            type="number"
                            value={String(Math.round(sceneAuthoring.editingState.sceneryBrush.avoidPlayableCoreStrength * 100))}
                            onChange={(event) =>
                              updateSceneAuthoringState((state) =>
                                updateSceneryBrushSettings(state, {
                                  avoidPlayableCoreStrength: Math.max(
                                    0,
                                    Math.min(
                                      1,
                                      parseNumericInput(
                                        event.currentTarget.value,
                                        Math.round(state.editingState.sceneryBrush.avoidPlayableCoreStrength * 100),
                                      ) / 100,
                                    ),
                                  )
                                }),
                              )
                            }
                          />
                        </div>
                        <div className="scene-pack-chip-row">
                          {categoryOptions.map((option) => (
                            <button
                              key={`brush-${option.value}`}
                              className="scene-filter-chip"
                              data-active={sceneAuthoring.editingState.sceneryBrush.categoryFilters.includes(option.value)}
                              onClick={() =>
                                updateSceneAuthoringState((state) =>
                                  updateSceneryBrushSettings(state, {
                                    categoryFilters: state.editingState.sceneryBrush.categoryFilters.includes(option.value)
                                      ? state.editingState.sceneryBrush.categoryFilters.filter((category) => category !== option.value)
                                      : [...state.editingState.sceneryBrush.categoryFilters, option.value]
                                  }),
                                )
                              }
                              type="button"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <div className="scene-vector-fields">
                          {categoryOptions.slice(0, 4).map((option) => (
                            <TextField
                              key={`weight-${option.value}`}
                              label={`${option.label} Weight`}
                              type="number"
                              value={String(getBrushCategoryWeight(sceneAuthoring.editingState.sceneryBrush.categoryWeights, option.value))}
                              onChange={(event) =>
                                updateBrushCategoryWeight(
                                  option.value,
                                  parseNumericInput(
                                    event.currentTarget.value,
                                    getBrushCategoryWeight(
                                      sceneAuthoring.editingState.sceneryBrush.categoryWeights,
                                      option.value,
                                    ),
                                  ),
                                )
                              }
                            />
                          ))}
                        </div>
                        {sceneAuthoring.editingState.sceneryBrushDrafts.length > 0 ? (
                          <div className="scene-vector-fields">
                            {sceneAuthoring.editingState.sceneryBrushDrafts.slice(0, 4).map((draft) => (
                              <TextField
                                key={`asset-weight-${draft.draftId}`}
                                label={`${draft.label} Weight`}
                                type="number"
                                value={String(getBrushAssetWeight(sceneAuthoring.editingState.sceneryBrush.assetWeights, draft.assetRef))}
                                onChange={(event) =>
                                  updateBrushAssetWeight(
                                    draft.assetRef,
                                    parseNumericInput(
                                      event.currentTarget.value,
                                      getBrushAssetWeight(
                                        sceneAuthoring.editingState.sceneryBrush.assetWeights,
                                        draft.assetRef,
                                      ),
                                    ),
                                  )
                                }
                              />
                            ))}
                          </div>
                        ) : null}
                        <p className="muted-copy">
                          Brush rules stay explicit: category and asset weights bias the mix, spacing keeps clutter readable,
                          pack influence keeps the chosen theme dominant, and playable-core avoidance resists accidental fairway noise.
                        </p>
                        <SurfaceCard padding={4} tone="ghost" border="subtle">
                          <Stack gap={3}>
                            <strong>Brush Presets</strong>
                            <p className="body-copy">
                              Save repeatable world-dressing logic for vegetation edges, support dressing, and themed detail passes without rebuilding the rule stack every time.
                            </p>
                            <p className="muted-copy">{brushPresetLibrary.recommendedAction}</p>
                            <div className="scene-vector-fields">
                              <TextField
                                label="Preset Name"
                                value={brushPresetName}
                                onChange={(event) => setBrushPresetName(event.currentTarget.value)}
                              />
                            </div>
                            <Inline gap={2}>
                              <Button tone="primary" disabled={brushPresetName.trim().length === 0} onClick={saveCurrentBrushPreset}>
                                Save Brush Preset
                              </Button>
                            </Inline>
                            <div className="scene-builder-overview-grid">
                              <article className="scene-builder-overview-card">
                                <span>Favorites</span>
                                <strong>{brushPresetLibrary.favoriteCount}</strong>
                                <p>Favorite brush mixes stay ready for repeat world-dressing passes.</p>
                              </article>
                              <article className="scene-builder-overview-card">
                                <span>Recent</span>
                                <strong>{brushPresetLibrary.recentCount}</strong>
                                <p>Recently used brush recipes stay near the active dressing pass.</p>
                              </article>
                              <article className="scene-builder-overview-card">
                                <span>Active Pack</span>
                                <strong>{sceneAuthoring.editingState.sceneryBrush.activePackId ?? "Mixed"}</strong>
                                <p>{sceneAuthoring.editingState.sceneryBrush.density} density · {sceneAuthoring.editingState.sceneryBrush.minimumSpacingMeters}m spacing</p>
                              </article>
                            </div>
                            <div className="scene-outliner-list">
                              {brushPresetLibrary.entries.map((preset) => (
                                <div key={preset.presetId} className="scene-outliner-row">
                                  <button
                                    className="scene-outliner-button"
                                    onClick={() => applyBrushPresetById(preset.presetId)}
                                    type="button"
                                  >
                                    <span>{preset.favorite ? `Favorite · ${preset.name}` : preset.name}</span>
                                    <small>
                                      {preset.contextSummary} · {preset.useCount} uses{preset.recent ? " · recent" : ""}
                                    </small>
                                  </button>
                                  <button
                                    className="scene-outliner-append"
                                    onClick={() => toggleBrushPresetFavoriteById(preset.presetId)}
                                    type="button"
                                  >
                                    {preset.favorite ? "Unstar" : "Star"}
                                  </button>
                                </div>
                              ))}
                            </div>
                            <p className="muted-copy">
                              Presets capture density, variance, weighting, spacing, pack influence, slope limits, and playable-core avoidance in one reusable authoring move.
                            </p>
                          </Stack>
                        </SurfaceCard>
                      </Stack>
                    </SurfaceCard>
                  </Stack>
                </SurfaceCard>
              </div>
            ) : (
              <SurfaceCard padding={6} tone="ghost" border="subtle">
                <p className="body-copy">
                  The asset library has not exposed any content packs yet. Intake and approval still happen in Asset Library, then Build inherits the calm browsing palette here.
                </p>
              </SurfaceCard>
            )}
          </section>

          <section className="panel">
            <SectionHeader
              eyebrow="Guided Builder"
              title="Embedded help, shortcuts, and recovery"
              description="Learn modes in place without losing expert speed. Guidance stays dismissible, mode-aware, and connected to the current tool."
              actions={
                <Inline gap={2}>
                  <Button
                    tone="ghost"
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        setBuilderGuidanceVisibility(state, !state.editingState.showBuilderGuidance),
                      )
                    }
                  >
                    {sceneAuthoring.editingState.showBuilderGuidance ? "Hide Guidance" : "Show Guidance"}
                  </Button>
                  <Button tone="ghost" onClick={() => updateSceneAuthoringState((state) => restoreBuilderGuides(state))}>
                    Restore Guides
                  </Button>
                </Inline>
              }
            />
            {sceneAuthoring.editingState.showBuilderGuidance ? (
              <div className="analysis-grid">
                {visibleBuilderGuides.map((guide) => (
                  <SurfaceCard key={guide.guideId} padding={4} tone="ghost" border="subtle">
                    <Stack gap={2}>
                      <Inline justify="space-between">
                        <strong>{guide.title}</strong>
                        <Button
                          tone="ghost"
                          onClick={() => updateSceneAuthoringState((state) => dismissBuilderGuide(state, guide.guideId))}
                        >
                          Dismiss
                        </Button>
                      </Inline>
                      <p className="body-copy">{guide.detail}</p>
                      <p className="muted-copy">Shortcut: {guide.shortcut}</p>
                      <p className="body-copy">{guide.action}</p>
                    </Stack>
                  </SurfaceCard>
                ))}
                {visibleBuilderGuides.length === 0 ? (
                  <SurfaceCard padding={4} tone="ghost" border="subtle">
                    <p className="body-copy">
                      The current mode has no active guide cards left. Restore guides if you want the first-use coaching back.
                    </p>
                  </SurfaceCard>
                ) : null}
              </div>
            ) : (
              <SurfaceCard padding={4} tone="ghost" border="subtle">
                <p className="body-copy">
                  Guidance is hidden. Bring it back any time if you need shortcuts, mode explanations, or a reset on what to do next.
                </p>
              </SurfaceCard>
            )}
          </section>

          <section className="panel">
            <SectionHeader
              eyebrow="Outliner"
              title="Hierarchy and filters"
              description="The outliner remains the calm structural view for scene hierarchy while the viewport handles direct spatial editing."
            />
            <div className="scene-category-filters">
              {categoryOptions.map((option) => {
                const isActive = categoryFilter.has(option.value);
                return (
                  <button
                    key={option.value}
                    className="scene-filter-chip"
                    data-active={isActive}
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        updateSelectionFilter(
                          state,
                          state.selectionState.filterCategories.includes(option.value)
                            ? state.selectionState.filterCategories.filter((category) => category !== option.value)
                            : [...state.selectionState.filterCategories, option.value],
                        ),
                      )
                    }
                    type="button"
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <div className="scene-outliner-list">
              {outlinerNodes.map((node) => (
                <div key={node.id} className="scene-outliner-row" style={{ paddingLeft: `${node.depth * 18 + 12}px` }}>
                  <button
                    className="scene-outliner-button"
                    data-selected={node.selected}
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        node.type === "object"
                          ? selectSceneObjects(state, [node.id])
                          : selectSceneObjects(state, [], { includeGroups: [node.id] }),
                      )
                    }
                    type="button"
                  >
                    <span>{node.label}</span>
                    <small>{node.type === "group" ? "group" : node.category}</small>
                  </button>
                  {node.type === "object" ? (
                    <button
                      className="scene-outliner-append"
                      onClick={() =>
                        updateSceneAuthoringState((state) =>
                          selectSceneObjects(state, [node.id], { append: true }),
                        )
                      }
                      type="button"
                    >
                      Add
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="scene-collection-list">
              {sceneAuthoring.sceneCollections.map((collection) => (
                <button
                  key={collection.collectionId}
                  className="scene-collection-button"
                  data-active={collection.collectionId === sceneAuthoring.activeCollectionId}
                  onClick={() =>
                    updateSceneAuthoringState((state) => ({
                      ...state,
                      activeCollectionId: collection.collectionId
                    }))
                  }
                  type="button"
                >
                  <strong>{collection.name}</strong>
                  <p className="body-copy">{collection.routeSummary}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <SectionHeader
              eyebrow="Inspector"
              title="Transform, zone, and route detail"
              description="The inspector stays mode-aware so creators always know what they can refine next."
            />

            {selectedObject ? (
              <Stack gap={4}>
                <Inline justify="space-between">
                  <div>
                    <strong>{selectedObject.name}</strong>
                    <p className="body-copy">{selectedObject.objectType}</p>
                  </div>
                  <Badge tone="accent">{formatCategoryLabel(selectedObject.category)}</Badge>
                </Inline>
                <TogglePillGroup
                  ariaLabel="Pivot mode"
                  options={pivotModeOptions}
                  value={sceneAuthoring.selectionState.pivotMode}
                  onChange={(value) =>
                    updateSceneAuthoringState((state) => ({
                      ...state,
                      selectionState: {
                        ...state.selectionState,
                        pivotMode: value
                      }
                    }))
                  }
                />
                <SelectField
                  label="Origin Preset"
                  value={selectedObject.transform.originPreset}
                  options={originPresetOptions}
                  onChange={(event) =>
                    updateSceneAuthoringState((state) => {
                      const sceneObject = state.sceneObjects.find((candidate) => candidate.sceneObjectId === selectedObject.sceneObjectId);
                      if (!sceneObject) {
                        return state;
                      }

                      return updateSceneObjectTransform(state, sceneObject.sceneObjectId, {
                        ...sceneObject.transform,
                        originPreset: event.currentTarget.value as "asset-origin" | "base-center" | "custom"
                      });
                    })
                  }
                />
                <div className="scene-transform-grid">
                  {(["position", "rotation", "scale", "pivotOffset"] as const).map((section) => (
                    <SurfaceCard key={section} padding={4} tone="ghost" border="subtle">
                      <Stack gap={3}>
                        <span className="scene-toolbar-label">{section}</span>
                        <div className="scene-vector-fields">
                          {(["x", "y", "z"] as const).map((axis) => (
                            <TextField
                              key={`${section}-${axis}`}
                              label={axis.toUpperCase()}
                              type="number"
                              value={String(selectedObject.transform[section][axis])}
                              onChange={(event) =>
                                updateTransformAxis(
                                  section,
                                  axis,
                                  parseNumericInput(event.currentTarget.value, selectedObject.transform[section][axis]),
                                )
                              }
                            />
                          ))}
                        </div>
                      </Stack>
                    </SurfaceCard>
                  ))}
                </div>
              </Stack>
            ) : selectedTerrainRegion ? (
              <Stack gap={4}>
                <strong>{selectedTerrainRegion.name}</strong>
                <SelectField
                  label="Gameplay Purpose"
                  value={selectedTerrainRegion.gameplayPurpose}
                  options={terrainPurposeOptions}
                  onChange={(event) =>
                    updateSceneAuthoringState((state) =>
                      assignTerrainRegionPurpose(
                        state,
                        selectedTerrainRegion.terrainRegionId,
                        event.currentTarget.value as TerrainGameplayPurpose,
                      ),
                    )
                  }
                />
                <Inline gap={2}>
                  <Button tone="secondary" onClick={() => updateSceneAuthoringState((state) => scaleSpatialBoundary(state, "terrain-region", selectedTerrainRegion.terrainRegionId, 1.08))}>Expand</Button>
                  <Button tone="secondary" onClick={() => updateSceneAuthoringState((state) => scaleSpatialBoundary(state, "terrain-region", selectedTerrainRegion.terrainRegionId, 0.92))}>Contract</Button>
                </Inline>
                <p className="body-copy">
                  Elevation {selectedTerrainRegion.elevationMin} to {selectedTerrainRegion.elevationMax}. {selectedTerrainRegion.linkedSceneObjectIds.length} scene links.
                </p>
                <p className="body-copy">
                  Sculpt mode {sceneAuthoring.editingState.terrainSculptMode}. Click the viewport to apply the current brush to this region.
                </p>
              </Stack>
            ) : selectedRoutingNode ? (
              <Stack gap={4}>
                <strong>{selectedRoutingNode.label}</strong>
                <p className="body-copy">{formatTitle(selectedRoutingNode.kind)} for {selectedRoutingNode.holeId}.</p>
                <div className="scene-vector-fields">
                  {(["x", "y", "z"] as const).map((axis) => (
                    <TextField
                      key={axis}
                      label={axis.toUpperCase()}
                      type="number"
                      value={String(selectedRoutingNode.position[axis])}
                      onChange={(event) =>
                        updateSceneAuthoringState((state) =>
                          moveRoutingNode(state, selectedRoutingNode.routingNodeId, {
                            [axis]: parseNumericInput(event.currentTarget.value, selectedRoutingNode.position[axis])
                          }),
                        )
                      }
                    />
                  ))}
                </div>
                <Inline gap={2}>
                  <Button tone="secondary" onClick={setPendingConnectionStart}>Use As Connection Start</Button>
                  <Button
                    tone="ghost"
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        polishRoutingNodeElevation(state, selectedRoutingNode.routingNodeId),
                      )
                    }
                  >
                    Polish Elevation
                  </Button>
                </Inline>
                <p className="muted-copy">
                  Node elevation polish averages this waypoint against its connected neighbors so the final run reads smoother before export.
                </p>
              </Stack>
            ) : selectedRoutingSegment ? (
              <Stack gap={4}>
                <strong>{selectedRoutingSegment.routingSegmentId}</strong>
                <SelectField
                  label="Segment Role"
                  value={selectedRoutingSegment.kind}
                  options={routingSegmentRoleOptions}
                  onChange={(event) =>
                    updateSceneAuthoringState((state) =>
                      assignRoutingSegmentRole(
                        state,
                        selectedRoutingSegment.routingSegmentId,
                        event.currentTarget.value as RoutingSegmentKind,
                      ),
                    )
                  }
                />
                <TextField
                  label="Target Width"
                  type="number"
                  value={String(selectedRoutingSegment.targetWidthMeters)}
                  onChange={(event) =>
                    updateSceneAuthoringState((state) =>
                      adjustRoutingSegmentWidth(
                        state,
                        selectedRoutingSegment.routingSegmentId,
                        Math.max(4, parseNumericInput(event.currentTarget.value, selectedRoutingSegment.targetWidthMeters)),
                      ),
                    )
                  }
                />
                <Inline gap={2}>
                  <Button
                    tone="secondary"
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        smoothRoutingSegmentShape(state, selectedRoutingSegment.routingSegmentId),
                      )
                    }
                  >
                    Smooth Segment
                  </Button>
                  <Button
                    tone="ghost"
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        harmonizeRoutingSegmentWidth(state, selectedRoutingSegment.routingSegmentId),
                      )
                    }
                  >
                    Harmonize Width
                  </Button>
                </Inline>
                <p className="body-copy">
                  Width target {selectedRoutingSegment.targetWidthMeters}m. Move the nodes in viewport to reshape the route, then use smoothing and width harmonizing when finish-stage continuity needs a calmer final form.
                </p>
              </Stack>
            ) : selectedFairwayCorridor ? (
              <Stack gap={4}>
                <strong>Fairway Corridor</strong>
                <TextField
                  label="Average Width"
                  type="number"
                  value={String(selectedFairwayCorridor.averageWidthMeters)}
                  onChange={(event) =>
                    updateSceneAuthoringState((state) =>
                      updateFairwayCorridor(
                        state,
                        selectedFairwayCorridor.fairwayCorridorId,
                        {
                          averageWidthMeters: parseNumericInput(event.currentTarget.value, selectedFairwayCorridor.averageWidthMeters)
                        },
                      ),
                    )
                  }
                />
                <TextField
                  label="Landing Zones"
                  type="number"
                  value={String(selectedFairwayCorridor.landingZoneCount)}
                  onChange={(event) =>
                    updateSceneAuthoringState((state) =>
                      updateFairwayCorridor(
                        state,
                        selectedFairwayCorridor.fairwayCorridorId,
                        {
                          landingZoneCount: Math.max(
                            1,
                            Math.round(parseNumericInput(event.currentTarget.value, selectedFairwayCorridor.landingZoneCount)),
                          )
                        },
                      ),
                    )
                  }
                />
                <TextAreaField
                  label="Fairway Notes"
                  rows={3}
                  value={selectedFairwayCorridor.note}
                  onChange={(event) =>
                    updateSceneAuthoringState((state) =>
                      updateFairwayCorridor(state, selectedFairwayCorridor.fairwayCorridorId, {
                        note: event.currentTarget.value
                      }),
                    )
                  }
                />
                <p className="body-copy">
                  Drag the corridor bend and width handles in the viewport to refine landing shape and playable breadth.
                </p>
              </Stack>
            ) : selectedVisibilityCorridor ? (
              <Stack gap={4}>
                <strong>Visibility Corridor</strong>
                <p className="body-copy">
                  Minimum width {selectedVisibilityCorridor.minimumWidthMeters}m · {selectedVisibilityCorridor.blockedSceneObjectIds.length} blocking scene objects tracked.
                </p>
                <p className="body-copy">
                  Use the viewport width handle to open or tighten the sightline envelope while the risk feed tracks occlusion pressure.
                </p>
              </Stack>
            ) : selectedPlayRouteEnvelope ? (
              <Stack gap={4}>
                <strong>Play Route Envelope</strong>
                <Inline gap={2}>
                  <Button
                    tone="secondary"
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        scaleSpatialBoundary(
                          state,
                          "play-route-envelope",
                          selectedPlayRouteEnvelope.playRouteEnvelopeId,
                          1.06,
                        ),
                      )
                    }
                  >
                    Widen
                  </Button>
                  <Button
                    tone="secondary"
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        scaleSpatialBoundary(
                          state,
                          "play-route-envelope",
                          selectedPlayRouteEnvelope.playRouteEnvelopeId,
                          0.94,
                        ),
                      )
                    }
                  >
                    Tighten
                  </Button>
                  <Button
                    tone="ghost"
                    onClick={() =>
                      updateSceneAuthoringState((state) =>
                        rotateSpatialBoundary(
                          state,
                          "play-route-envelope",
                          selectedPlayRouteEnvelope.playRouteEnvelopeId,
                          4,
                        ),
                      )
                    }
                  >
                    Rotate
                  </Button>
                </Inline>
                <p className="body-copy">
                  This envelope is the playable corridor used for blocked-line and landing-zone analysis.
                </p>
              </Stack>
            ) : selectedGreenZone ? (
              <Stack gap={4}>
                <strong>Green Zone</strong>
                <TextField
                  label="Target Pin Capacity"
                  type="number"
                  value={String(selectedGreenZone.targetPinCapacity)}
                  onChange={(event) =>
                    updateSceneAuthoringState((state) =>
                      updateGreenZone(state, selectedGreenZone.greenZoneId, {
                        targetPinCapacity: Math.max(
                          1,
                          Math.round(parseNumericInput(event.currentTarget.value, selectedGreenZone.targetPinCapacity)),
                        )
                      }),
                    )
                  }
                />
                <Inline gap={2}>
                  <Button tone="secondary" onClick={() => updateSceneAuthoringState((state) => scaleSpatialBoundary(state, "green-zone", selectedGreenZone.greenZoneId, 1.08))}>Expand</Button>
                  <Button tone="secondary" onClick={() => updateSceneAuthoringState((state) => scaleSpatialBoundary(state, "green-zone", selectedGreenZone.greenZoneId, 0.92))}>Contract</Button>
                </Inline>
                <TextAreaField
                  label="Green Notes"
                  rows={3}
                  value={selectedGreenZone.note}
                  onChange={(event) =>
                    updateSceneAuthoringState((state) =>
                      updateGreenZone(state, selectedGreenZone.greenZoneId, {
                        note: event.currentTarget.value
                      }),
                    )
                  }
                />
              </Stack>
            ) : selectedTeeZone ? (
              <Stack gap={4}>
                <strong>Tee Zone</strong>
                <TextField
                  label="Facing Direction"
                  type="number"
                  value={String(selectedTeeZone.facingDirectionDegrees)}
                  onChange={(event) =>
                    updateSceneAuthoringState((state) =>
                      updateTeeZone(state, selectedTeeZone.teeZoneId, {
                        facingDirectionDegrees: parseNumericInput(event.currentTarget.value, selectedTeeZone.facingDirectionDegrees)
                      }),
                    )
                  }
                />
                <Inline gap={2}>
                  <Button tone="secondary" onClick={() => updateSceneAuthoringState((state) => scaleSpatialBoundary(state, "tee-zone", selectedTeeZone.teeZoneId, 1.08))}>Expand</Button>
                  <Button tone="secondary" onClick={() => updateSceneAuthoringState((state) => scaleSpatialBoundary(state, "tee-zone", selectedTeeZone.teeZoneId, 0.92))}>Contract</Button>
                </Inline>
                <TextAreaField
                  label="Tee Notes"
                  rows={3}
                  value={selectedTeeZone.note}
                  onChange={(event) =>
                    updateSceneAuthoringState((state) =>
                      updateTeeZone(state, selectedTeeZone.teeZoneId, {
                        note: event.currentTarget.value
                      }),
                    )
                  }
                />
              </Stack>
            ) : selectedHazardZone ? (
              <Stack gap={4}>
                <strong>{selectedHazardZone.hazardLabel}</strong>
                <Inline gap={2}>
                  <Button tone="secondary" onClick={() => updateSceneAuthoringState((state) => scaleSpatialBoundary(state, "hazard-zone", selectedHazardZone.hazardZoneId, 1.08))}>Expand</Button>
                  <Button tone="secondary" onClick={() => updateSceneAuthoringState((state) => scaleSpatialBoundary(state, "hazard-zone", selectedHazardZone.hazardZoneId, 0.92))}>Contract</Button>
                </Inline>
                <p className="body-copy">Hazard geometry now lives in Build and feeds simulator hazard bindings automatically.</p>
              </Stack>
            ) : selectedOutOfBoundsZone ? (
              <Stack gap={4}>
                <strong>{selectedOutOfBoundsZone.sideLabel}</strong>
                <Inline gap={2}>
                  <Button tone="secondary" onClick={() => updateSceneAuthoringState((state) => scaleSpatialBoundary(state, "out-of-bounds-zone", selectedOutOfBoundsZone.outOfBoundsZoneId, 1.08))}>Expand</Button>
                  <Button tone="secondary" onClick={() => updateSceneAuthoringState((state) => scaleSpatialBoundary(state, "out-of-bounds-zone", selectedOutOfBoundsZone.outOfBoundsZoneId, 0.92))}>Contract</Button>
                </Inline>
                <p className="body-copy">OB boundaries now author directly in the viewport and validate against simulator bindings.</p>
              </Stack>
            ) : selectedDropZoneArea ? (
              <Stack gap={4}>
                <strong>Drop Zone Area</strong>
                <Inline gap={2}>
                  <Button tone="secondary" onClick={() => updateSceneAuthoringState((state) => scaleSpatialBoundary(state, "drop-zone-area", selectedDropZoneArea.dropZoneAreaId, 1.08))}>Expand</Button>
                  <Button tone="secondary" onClick={() => updateSceneAuthoringState((state) => scaleSpatialBoundary(state, "drop-zone-area", selectedDropZoneArea.dropZoneAreaId, 0.92))}>Contract</Button>
                </Inline>
                <p className="body-copy">Recovery geometry is now authored in context instead of living only in simulator forms.</p>
              </Stack>
            ) : (
              <SurfaceCard padding={6} tone="contrast">
                <Stack gap={3}>
                  <strong>{activeModeSummary.title}</strong>
                  <p className="body-copy">
                    {activeModeSummary.nextAction}
                  </p>
                  {activePlacementDraft ? (
                    <p className="body-copy">
                      Armed asset: {activePlacementDraft.label}. Click the viewport to place it, or clear the armed state if you want to go back to pure selection.
                    </p>
                  ) : null}
                  {sceneAuthoring.viewportState.authoringMode === "scenery-brush" ? (
                    <p className="body-copy">
                      {sceneAuthoring.editingState.sceneryBrushDrafts.length > 0
                        ? `${sceneAuthoring.editingState.sceneryBrushDrafts.length} brush assets are loaded. Use the scenery brush card or asset browser to refine the pack mix.`
                        : "Load brush-ready assets from the current content pack to start brushing vegetation, rocks, or support scenery."}
                    </p>
                  ) : null}
                  <p className="muted-copy">
                    Select an object, terrain region, routing node, fairway corridor, green zone, or simulator zone in the viewport to open deeper contextual editing here.
                  </p>
                </Stack>
              </SurfaceCard>
            )}

            <SurfaceCard padding={4} tone="ghost" border="subtle">
              <Stack gap={3}>
                <span className="scene-toolbar-label">Snapping</span>
                <div className="scene-snap-grid">
                  <button className="scene-snap-toggle" data-active={sceneAuthoring.snapSettings.gridEnabled} onClick={() => updateSceneAuthoringState((state) => updateSnapSettings(state, { ...state.snapSettings, gridEnabled: !state.snapSettings.gridEnabled }))} type="button">Grid</button>
                  <button className="scene-snap-toggle" data-active={sceneAuthoring.snapSettings.terrainSnapEnabled} onClick={() => updateSceneAuthoringState((state) => updateSnapSettings(state, { ...state.snapSettings, terrainSnapEnabled: !state.snapSettings.terrainSnapEnabled }))} type="button">Terrain</button>
                  <button className="scene-snap-toggle" data-active={sceneAuthoring.snapSettings.surfaceSnapEnabled} onClick={() => updateSceneAuthoringState((state) => updateSnapSettings(state, { ...state.snapSettings, surfaceSnapEnabled: !state.snapSettings.surfaceSnapEnabled }))} type="button">Surface</button>
                  <button className="scene-snap-toggle" data-active={sceneAuthoring.snapSettings.alignToSurfaceNormal} onClick={() => updateSceneAuthoringState((state) => updateSnapSettings(state, { ...state.snapSettings, alignToSurfaceNormal: !state.snapSettings.alignToSurfaceNormal }))} type="button">Align Surface</button>
                  <button className="scene-snap-toggle" data-active={sceneAuthoring.snapSettings.keepUpright} onClick={() => updateSceneAuthoringState((state) => updateSnapSettings(state, { ...state.snapSettings, keepUpright: !state.snapSettings.keepUpright }))} type="button">Keep Upright</button>
                </div>
                <div className="scene-vector-fields">
                  <TextField
                    label="Grid Size"
                    type="number"
                    value={String(sceneAuthoring.snapSettings.gridSizeMeters)}
                    onChange={(event) =>
                      updateSceneAuthoringState((state) =>
                        updateSnapSettings(state, {
                          ...state.snapSettings,
                          gridSizeMeters: parseNumericInput(event.currentTarget.value, state.snapSettings.gridSizeMeters)
                        }),
                      )
                    }
                  />
                  <TextField
                    label="Rotation Step"
                    type="number"
                    value={String(sceneAuthoring.snapSettings.rotationStepDegrees)}
                    onChange={(event) =>
                      updateSceneAuthoringState((state) =>
                        updateSnapSettings(state, {
                          ...state.snapSettings,
                          rotationStepDegrees: parseNumericInput(event.currentTarget.value, state.snapSettings.rotationStepDegrees)
                        }),
                      )
                    }
                  />
                  <TextField
                    label="Scale Step %"
                    type="number"
                    value={String(sceneAuthoring.snapSettings.scaleStepPercent)}
                    onChange={(event) =>
                      updateSceneAuthoringState((state) =>
                        updateSnapSettings(state, {
                          ...state.snapSettings,
                          scaleStepPercent: parseNumericInput(event.currentTarget.value, state.snapSettings.scaleStepPercent)
                        }),
                      )
                    }
                  />
                </div>
                {authoringPreview.visible ? (
                  <SurfaceCard padding={4} tone="ghost" border="subtle">
                    <Stack gap={2}>
                      <strong>Live Snap Preview</strong>
                      <p className="body-copy">
                        {authoringPreview.surfaceLabel
                          ? `${authoringPreview.surfaceLabel} · ${Math.round(authoringPreview.surfaceSlopeDegrees)}° slope · ${authoringPreview.surfaceSnapMode}`
                          : "Preview stays active in the viewport while placement, brush, or finish tools are armed."}
                      </p>
                      <p className="muted-copy">
                        {sceneAuthoring.snapSettings.alignToSurfaceNormal && !sceneAuthoring.snapSettings.keepUpright
                          ? "Surface orientation is allowed to follow terrain posture on placement."
                          : "Keep Upright holds assets vertical even when the surface preview shows slope."}
                      </p>
                    </Stack>
                  </SurfaceCard>
                ) : null}
              </Stack>
            </SurfaceCard>
          </section>
        </div>
      </div>

      <div className="workspace-columns">
        <section className="panel">
          <SectionHeader
            eyebrow="Spatial Analysis"
            title="Live geometry-backed authoring feedback"
            description="Blocked routing, sightline weakness, landing-zone pressure, and anchor conflicts now surface directly from scene geometry instead of generic heuristics."
          />
          <div className="analysis-grid">
            {analysisCards.map((card) => (
              <SurfaceCard key={card.id} padding={4} tone="ghost" border="subtle">
                <Stack gap={2}>
                  <Inline justify="space-between">
                    <strong>{card.label}</strong>
                    <Badge tone={issueTone(card.severity)}>{card.count}</Badge>
                  </Inline>
                  <p className="body-copy">{card.detail}</p>
                </Stack>
              </SurfaceCard>
            ))}
          </div>
        </section>

        <section className="panel">
          <SectionHeader
            eyebrow="Risk Feed"
            title="Validation and playability watchlist"
            description="These surfaces now reflect geometry-backed analysis, not just planning metadata, and the Build-only findings stay visible even before they become release blockers."
          />
          <div className="analysis-grid">
            <SurfaceCard padding={4} tone="ghost" border="subtle">
              <Stack gap={2}>
                <Inline justify="space-between">
                  <strong>Spatial trust</strong>
                  <Badge
                    tone={
                      spatialTrust.health === "healthy"
                        ? "success"
                        : spatialTrust.health === "attention"
                          ? "warning"
                          : "error"
                    }
                  >
                    {spatialTrust.health}
                  </Badge>
                </Inline>
                <p className="body-copy">{spatialTrust.summary}</p>
                <p className="muted-copy">{spatialTrust.recommendedAction}</p>
              </Stack>
            </SurfaceCard>
            <SurfaceCard padding={4} tone="ghost" border="subtle">
              <Stack gap={2}>
                <Inline justify="space-between">
                  <strong>Index drift</strong>
                  <Badge
                    tone={
                      indexHealth.health === "healthy"
                        ? "success"
                        : indexHealth.health === "attention"
                          ? "warning"
                          : "error"
                    }
                  >
                    {indexHealth.driftState}
                  </Badge>
                </Inline>
                <p className="body-copy">{indexHealth.summary}</p>
                <p className="muted-copy">{indexHealth.recommendedAction}</p>
              </Stack>
            </SurfaceCard>
          </div>
          <div className="issue-card-list">
            {spatialIssueFeed.map((issue) => (
              <SurfaceCard key={issue.issueId} padding={4} tone="ghost" border="subtle">
                <Stack gap={2}>
                  <Inline justify="space-between">
                    <strong>{issue.title}</strong>
                    <Badge tone={issueTone(issue.severity)}>{issue.severity}</Badge>
                  </Inline>
                  <p className="body-copy">{issue.detail}</p>
                  <p className="body-copy">{issue.recommendedAction}</p>
                </Stack>
              </SurfaceCard>
            ))}
          </div>
          <div className="issue-card-list">
            {(buildIssues.length > 0 ? buildIssues : activeHoleIssues.slice(0, 6)).map((issue) => (
              <ValidationIssueCard key={issue.issueId} issue={issue} compact />
            ))}
          </div>
        </section>

        <section className="panel">
          <SectionHeader
            eyebrow="Telemetry"
            title="Scene pressure and simulator readiness"
            description="Performance and playability now inherit real scene telemetry from terrain, routing, and simulator geometry."
          />
          <div className="wizard-success-grid">
            <MetricChip label="Geometry" value={performanceSnapshot.geometryEstimate} note="Scene + terrain load" tone="accent" />
            <MetricChip label="Density" value={performanceSnapshot.sceneDensity} note="Object and zone pressure" tone={performanceSnapshot.sceneDensity > 80 ? "warning" : "success"} />
            <MetricChip label="Visibility" value={performanceSnapshot.visibilityComplexity} note="Sightline + route complexity" tone={performanceSnapshot.visibilityComplexity > 80 ? "warning" : "success"} />
            <MetricChip
              label="Profile"
              value={performanceAssessment.profile.name}
              note={performanceAssessment.summary}
              tone={performanceAssessment.riskGrade === "risky" ? "warning" : "info"}
            />
            <MetricChip
              label="Playability"
              value={activeHolePlayProfile?.exportReadiness ?? "draft"}
              note={
                activeHolePlayProfile
                  ? `${activeHolePlayProfile.lineOfPlayStatus} line of play · ${activeHolePlayProfile.shotReadabilityStatus} readability`
                  : "No active hole selected"
              }
              tone={activeHolePlayProfile?.exportReadiness === "ready" ? "success" : "warning"}
            />
            <MetricChip
              label="Interaction"
              value={sceneAuthoring.viewportState.interactionPipeline.state}
              note={sceneAuthoring.viewportState.interactionPipeline.pendingActionLabel ?? "Viewport idle"}
              tone={sceneAuthoring.viewportState.interactionPipeline.state === "dragging" ? "info" : "default"}
            />
          </div>
        </section>

        <section className="panel">
          <SectionHeader
            eyebrow="History"
            title="Runtime undo/redo timeline"
            description="Scene, terrain, routing, and simulator-anchor edits now land on the same reversible history track."
          />
          <ul className="rail-list">
            {sceneAuthoring.placementHistory.slice(0, 8).map((action) => (
              <li key={action.actionId}>
                <strong>{action.summary}</strong>
                <span>
                  {action.createdAt}
                  {sceneAuthoring.placementHistory[sceneAuthoring.historyCursor]?.actionId === action.actionId
                    ? " · current cursor"
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
