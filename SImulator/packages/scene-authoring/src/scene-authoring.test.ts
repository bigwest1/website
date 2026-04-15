import { describe, expect, it } from "vitest";

import {
  createPlacementAssetDraft,
  createSceneAuthoringState,
  createSceneCollection,
  createSceneSpatialReference,
  createSceneObject,
  createPlacementLayer,
  createFairwayCorridor,
  createTeeZone,
  createGreenZone,
  createVisibilityCorridor
} from "./create";
import { buildRendererSceneSnapshot } from "./renderer";
import {
  addRoutingNodeForHole,
  addPlacementDraftsToSceneryBrush,
  applySceneryBrushStroke,
  applyPlacementPreset,
  applySurfaceRulePreset,
  applySceneryBrushPreset,
  applyRendererInteractionDelta,
  applyLandmarkCorridorSupportKit,
  applyLandmarkCorridorBundleLibraryEntry,
  applyLandmarkCorridorSupportKitComposition,
  applyLandmarkViewCorridorTool,
  clearAuthoringPreview,
  commitAuthoringPreview,
  createSurfaceRuleCleanupReview,
  applyTerrainMaterialStroke,
  applyTerrainSculptStroke,
  adjustRoutingNodeHeight,
  adjustRoutingSegmentWidth,
  automateSurfaceRuleCleanup,
  canRedoSceneAuthoring,
  canUndoSceneAuthoring,
  connectRoutingNodes,
  createGreenZoneForHole,
  createHazardZoneForHole,
  createTerrainRegionForHole,
  createTeeZoneForHole,
  dismissBuilderGuide,
  duplicateSceneObjects,
  findRoutingGaps,
  moveRoutingNode,
  groupSceneObjects,
  placeSceneObjectFromDraft,
  harmonizeRoutingSegmentWidth,
  polishRoutingNodeElevation,
  polishRoutingHoleContinuity,
  previewPlacementDraft,
  previewSceneryBrush,
  previewTerrainFinish,
  reconcileRoutingHoleFinish,
  redoSceneAuthoring,
  reviewSurfaceRuleCleanupPass,
  resolveSurfaceRuleConflicts,
  resolveRoutingMergeCandidates,
  restoreBuilderGuides,
  restageSelectedLandmark,
  savePlacementPreset,
  saveLandmarkCorridorBundleLibraryEntry,
  saveSurfaceRulePreset,
  saveSceneryBrushPreset,
  selectSceneObjects,
  selectSpatialEntities,
  setActiveTerrainMaterial,
  setActiveTerrainMaterialLayerIndex,
  setPlacementMode,
  setTerrainMaterialVisibilityMode,
  updateRoutingGuideSettings,
  updateSceneryBrushSettings,
  updateSnapSettings,
  setSceneObjectLockState,
  smoothRoutingSegmentShape,
  togglePlacementPresetFavorite,
  toggleLandmarkCorridorBundleLibraryFavorite,
  toggleSurfaceRulePresetFavorite,
  toggleSceneryBrushPresetFavorite,
  ungroupSceneGroup,
  undoSceneAuthoring,
  updateSurfaceRuleDraft,
  updateViewportState,
  updateSceneObjectTransform
} from "./services";
import { createSpatialAnalysisReport } from "./analysis";
import { createSpatialTrustReport } from "./diagnostics";
import {
  summarizePlacementPresetLibrary,
  summarizeCourseScaleTerrainFinish,
  summarizeLandmarkCorridorBundleLibrary,
  summarizeLandmarkCorridorBundleRecommendations,
  summarizeRouteFinishReconciliation,
  summarizeRoutingContinuity,
  summarizeSceneryBrushPresetLibrary,
  summarizeSceneAuthoringState,
  summarizeSurfaceRuleAuthoring,
  summarizeSurfaceRuleCleanupAutomation,
  summarizeSurfaceRuleCleanupReview,
  summarizeSurfaceRuleCleanupReviewReplay,
  summarizeSurfaceRuleCleanupReviewReplayTimeline,
  summarizeSurfaceRuleConflictResolution,
  summarizeSurfaceRuleCoverageMapping,
  summarizeSurfaceRulePresetLibrary,
  summarizeTerrainFinishConsistency
} from "./summary";

function createTestState() {
  return createSceneAuthoringState({
    activeCollectionId: "collection-main",
    sceneCollections: [
      createSceneCollection({
        collectionId: "collection-main",
        name: "Main Scene",
        description: "Primary course placement collection.",
        defaultLayerId: "layer-gameplay",
        routeSummary: "Focus on the opening route and landmark stack."
      })
    ],
    placementLayers: [
      createPlacementLayer({
        layerId: "layer-gameplay",
        name: "Gameplay",
        description: "Gameplay-relevant placement.",
        colorToken: "accent.primary"
      })
    ],
    sceneObjects: [
      createSceneObject({
        sceneObjectId: "scene-tee-1",
        collectionId: "collection-main",
        name: "Hole 1 Tee Complex",
        category: "gameplay-course-object",
        objectType: "tee-complex",
        placementLayerId: "layer-gameplay",
        transform: {
          position: { x: 0, y: 0, z: 0 }
        }
      }),
      createSceneObject({
        sceneObjectId: "scene-landmark-1",
        collectionId: "collection-main",
        name: "Arrival Arch",
        category: "landmark",
        objectType: "archway",
        placementLayerId: "layer-gameplay",
        transform: {
          position: { x: 12, y: 0, z: 5 }
        }
      })
    ],
    parentRelationships: [
      {
        relationshipId: "relationship-scene-tee-1",
        childId: "scene-tee-1",
        childType: "object",
        parentId: null,
        parentType: "collection"
      },
      {
        relationshipId: "relationship-scene-landmark-1",
        childId: "scene-landmark-1",
        childType: "object",
        parentId: null,
        parentType: "collection"
      }
    ]
  });
}

describe("scene authoring services", () => {
  it("supports multi-select and duplication", () => {
    const selected = selectSceneObjects(createTestState(), ["scene-tee-1", "scene-landmark-1"]);
    const duplicated = duplicateSceneObjects(selected);

    expect(duplicated.sceneObjects).toHaveLength(4);
    expect(duplicated.selectionState.selectedObjectIds).toHaveLength(2);
    expect(duplicated.placementHistory.at(-1)?.actionType).toBe("duplicate");
  });

  it("tracks undo and redo history for placement actions", () => {
    const selected = selectSceneObjects(createTestState(), ["scene-tee-1", "scene-landmark-1"]);
    const duplicated = duplicateSceneObjects(selected);
    const undone = undoSceneAuthoring(duplicated);
    const redone = redoSceneAuthoring(undone);

    expect(canUndoSceneAuthoring(duplicated)).toBe(true);
    expect(canRedoSceneAuthoring(undone)).toBe(true);
    expect(undone.sceneObjects).toHaveLength(2);
    expect(redone.sceneObjects).toHaveLength(4);
  });

  it("groups and ungroups selected objects", () => {
    const selected = selectSceneObjects(createTestState(), ["scene-tee-1", "scene-landmark-1"]);
    const grouped = groupSceneObjects(selected, { groupName: "Arrival Group" });

    expect(grouped.sceneGroups).toHaveLength(1);
    expect(grouped.selectionState.selectedGroupIds).toEqual([grouped.sceneGroups[0]?.groupId]);

    const ungrouped = ungroupSceneGroup(grouped, grouped.sceneGroups[0]?.groupId);
    expect(ungrouped.sceneGroups).toHaveLength(0);
    expect(ungrouped.selectionState.selectedObjectIds).toHaveLength(2);
  });

  it("updates transforms and lock state", () => {
    const moved = updateSceneObjectTransform(createTestState(), "scene-tee-1", {
      position: { x: 20, y: 1, z: 10 },
      rotation: { x: 0, y: 45, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      pivotOffset: { x: 0, y: 0, z: 0 },
      originPreset: "asset-origin"
    });
    const locked = setSceneObjectLockState(moved, ["scene-tee-1"], true);

    expect(locked.sceneObjects.find((sceneObject) => sceneObject.sceneObjectId === "scene-tee-1")?.locked).toBe(
      true,
    );
    expect(locked.sceneObjects.find((sceneObject) => sceneObject.sceneObjectId === "scene-tee-1")?.transform.position.x).toBe(
      20,
    );
  });

  it("summarizes the active collection", () => {
    const summary = summarizeSceneAuthoringState(createTestState());

    expect(summary.collectionCount).toBe(1);
    expect(summary.objectCount).toBe(2);
    expect(summary.gameplayRelevantCount).toBe(1);
    expect(summary.activeCollectionName).toBe("Main Scene");
    expect(summary.placementPresetCount).toBeGreaterThan(0);
    expect(summary.brushPresetCount).toBeGreaterThan(0);
  });

  it("detects routing gaps when playable tee-to-green flow is disconnected", () => {
    const state = createTestState();
    const routingGaps = findRoutingGaps(state, ["hole-1"]);

    expect(routingGaps).toHaveLength(1);
    expect(routingGaps[0]?.reason).toContain("No routing path");
  });

  it("creates tee and green zones as first-class simulator geometry", () => {
    const teeState = createTeeZoneForHole(createTestState(), {
      holeId: "hole-1",
      teeSetRefs: ["tee-black"]
    });
    const greenState = createGreenZoneForHole(teeState, "hole-1");

    expect(greenState.teeZones).toHaveLength(1);
    expect(greenState.greenZones).toHaveLength(1);
    expect(greenState.selectionState.selectedSpatialEntityRefs[0]?.entityType).toBe("green-zone");
  });

  it("supports routing edits and renderer snapshot generation", () => {
    let state = createTestState();
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "tee",
      position: { x: 0, y: 0, z: 0 }
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "green-center",
      position: { x: 120, y: 0, z: 0 }
    });
    state = connectRoutingNodes(state, {
      holeId: "hole-1",
      fromNodeId: "routing-node-1",
      toNodeId: "routing-node-2"
    });
    state = createTeeZoneForHole(state, {
      holeId: "hole-1",
      teeSetRefs: ["tee-black"]
    });
    state = createGreenZoneForHole(state, "hole-1");
    state = selectSpatialEntities(state, [
      createSceneSpatialReference({
        entityType: "fairway-corridor",
        entityId: "fairway-corridor-hole-1",
        holeId: "hole-1"
      })
    ]);

    const snapshot = buildRendererSceneSnapshot(state);

    expect(snapshot.primitives.some((primitive) => primitive.id === "routing-segment-1")).toBe(true);
    expect(snapshot.primitives.some((primitive) => primitive.id === "fairway-corridor-hole-1")).toBe(true);
    expect(snapshot.primitives.some((primitive) => primitive.id === "tee-zone-hole-1")).toBe(true);
    expect(snapshot.sceneBounds).not.toBeNull();
    expect(snapshot.overlays.some((overlay) => overlay.overlayId === "routing")).toBe(true);
    expect(snapshot.runtimeStatus.primitiveCount).toBeGreaterThan(0);
  });

  it("surfaces blocked line-of-play and anchor conflicts from spatial analysis", () => {
    let state = createTestState();
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "tee",
      position: { x: 0, y: 0, z: 0 }
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "green-center",
      position: { x: 120, y: 0, z: 0 }
    });
    state = connectRoutingNodes(state, {
      holeId: "hole-1",
      fromNodeId: "routing-node-1",
      toNodeId: "routing-node-2"
    });
    state.sceneObjects.push(
      createSceneObject({
        sceneObjectId: "scene-blocker-1",
        collectionId: "collection-main",
        name: "Route Blocker",
        category: "structure",
        objectType: "maintenance-wall",
        placementLayerId: "layer-gameplay",
        transform: {
          position: { x: 60, y: 0, z: 0 }
        }
      }),
    );
    state.teeZones = [
      createTeeZone({
        teeZoneId: "tee-zone-hole-1",
        holeId: "hole-1",
        teeSetRefs: ["tee-black"],
        boundary: [
          { x: -6, y: 0, z: -6 },
          { x: 6, y: 0, z: -6 },
          { x: 6, y: 0, z: 6 },
          { x: -6, y: 0, z: 6 }
        ],
        facingDirectionDegrees: 12
      })
    ];
    state.greenZones = [
      createGreenZone({
        greenZoneId: "green-zone-hole-1",
        holeId: "hole-1",
        boundary: [
          { x: 112, y: 0, z: -8 },
          { x: 128, y: 0, z: -8 },
          { x: 128, y: 0, z: 8 },
          { x: 112, y: 0, z: 8 }
        ],
        targetPinCapacity: 4
      })
    ];

    const analysis = createSpatialAnalysisReport(state, {
      teeSpatialBindings: [
        {
          teeSpatialBindingId: "tee-binding-hole-1",
          holeId: "hole-1",
          teeZoneRef: createSceneSpatialReference({
            entityType: "tee-zone",
            entityId: "tee-zone-hole-1",
            holeId: "hole-1"
          }),
          sceneObjectRef: null,
          positionHint: { x: 30, y: 0, z: 30 },
          readinessState: "ready"
        }
      ]
    });

    expect(analysis.blockedLineOfPlayIssues.length).toBeGreaterThan(0);
    expect(analysis.simulatorAnchorConflicts.length).toBeGreaterThan(0);
  });

  it("records terrain sculpt strokes as authored terrain modifiers", () => {
    let state = createTestState();
    state = createTerrainRegionForHole(state, {
      holeId: "hole-1",
      gameplayPurpose: "fairway"
    });

    const terrainRegionId = state.terrainRegions[0]!.terrainRegionId;
    const sculpted = applyTerrainSculptStroke(state, {
      regionId: terrainRegionId,
      center: { x: 30, y: 0, z: 4 },
      mode: "raise",
      radiusMeters: 12,
      strength: 0.55
    });

    expect(sculpted.terrainModifiers).toHaveLength(1);
    expect(sculpted.editingState.selectedTerrainModifierId).toBe(
      sculpted.terrainModifiers[0]!.terrainModifierId,
    );
    expect(sculpted.terrainRegions[0]!.elevationMax).toBeGreaterThan(state.terrainRegions[0]!.elevationMax);
  });

  it("places approved pack assets directly into the scene from a placement draft", () => {
    const draft = createPlacementAssetDraft({
      draftId: "placement-draft-marina-lantern",
      assetRef: "asset-marina-lantern",
      label: "Marina Lantern Cluster",
      objectType: "props",
      category: "supporting-scenery",
      packId: "twilight-boardwalk",
      tags: ["festival", "twilight"],
      placementRules: ["scatter"]
    });

    const placed = placeSceneObjectFromDraft(createTestState(), {
      draft,
      position: { x: 24.4, y: 0, z: 18.7 },
      holeId: "hole-1"
    });

    expect(placed.sceneObjects.at(-1)?.assetRef).toBe("asset-marina-lantern");
    expect(placed.sceneObjects.at(-1)?.tags).toContain("twilight-boardwalk");
    expect(placed.selectionState.selectedObjectIds).toHaveLength(1);
  });

  it("applies scenery brush strokes using loaded brush drafts", () => {
    const brushDrafts = [
      createPlacementAssetDraft({
        draftId: "brush-pine",
        assetRef: "asset-pine-cluster",
        label: "Pine Cluster",
        objectType: "vegetation",
        category: "vegetation",
        packId: "northwoods",
        tags: ["pine"],
        placementRules: ["scatter", "avoid-playable-core"]
      }),
      createPlacementAssetDraft({
        draftId: "brush-boulder",
        assetRef: "asset-boulder-group",
        label: "Boulder Group",
        objectType: "props",
        category: "supporting-scenery",
        packId: "northwoods",
        tags: ["rock"],
        placementRules: ["scatter"]
      })
    ];
    const state = addPlacementDraftsToSceneryBrush(createTestState(), brushDrafts);
    const brushed = applySceneryBrushStroke(state, {
      center: { x: 50, y: 0, z: 12 },
      holeId: "hole-1"
    });

    expect(brushed.sceneObjects.length).toBeGreaterThan(state.sceneObjects.length);
    expect(brushed.sceneObjects.some((sceneObject) => sceneObject.tags.includes("scenery-brush"))).toBe(true);
    expect(brushed.selectionState.selectedObjectIds.length).toBeGreaterThan(0);
  });

  it("records terrain material paint strokes separately from sculpting", () => {
    let state = createTestState();
    state = createTerrainRegionForHole(state, {
      holeId: "hole-1",
      gameplayPurpose: "fairway"
    });
    state = setActiveTerrainMaterial(state, "terrain-material-bunker-sand");

    const painted = applyTerrainMaterialStroke(state, {
      regionId: state.terrainRegions[0]!.terrainRegionId,
      center: { x: 26, y: 0, z: 5 }
    });

    expect(painted.terrainPaintStrokes).toHaveLength(1);
    expect(painted.terrainRegions[0]!.paintedMaterialIds).toContain("terrain-material-bunker-sand");
  });

  it("builds live placement previews and commits them without app-owned placement state", () => {
    const draft = createPlacementAssetDraft({
      draftId: "placement-draft-garden-arch",
      assetRef: "asset-garden-arch",
      label: "Garden Arch",
      objectType: "archway",
      category: "structure",
      packId: "festival-gardens",
      footprintRadiusMeters: 9
    });

    const previewed = previewPlacementDraft(createTestState(), {
      draft,
      worldPoint: { x: 28.3, y: 0, z: 17.9 },
      source: "content-pack"
    });
    const previewSnapshot = buildRendererSceneSnapshot(previewed);
    const committed = commitAuthoringPreview(previewed, {
      holeId: "hole-1"
    });

    expect(previewed.editingState.authoringPreview.mode).toBe("placement");
    expect(previewed.editingState.authoringPreview.visible).toBe(true);
    expect(previewSnapshot.runtimeStatus.previewMode).toBe("placement");
    expect(previewSnapshot.primitives.some((primitive) => primitive.id === "preview-placement-footprint")).toBe(
      true,
    );
    expect(committed.sceneObjects.at(-1)?.assetRef).toBe("asset-garden-arch");
    expect(committed.editingState.authoringPreview.mode).toBe("idle");
    expect(committed.editingState.authoringPreview.visible).toBe(false);
  });

  it("saves and reapplies placement presets from the current placement posture", () => {
    let state = createTestState();
    state = updateSnapSettings(state, (snapSettings) => ({
      ...snapSettings,
      surfaceSnapEnabled: true,
      terrainSnapEnabled: true,
      alignToSurfaceNormal: true,
      keepUpright: false
    }));
    state = setPlacementMode(state, "rotate");
    state = savePlacementPreset(state, {
      name: "Surface Follow Hero",
      preferredPackId: "northwoods",
      preferredCategory: "landmark"
    });
    state = updateSnapSettings(state, (snapSettings) => ({
      ...snapSettings,
      surfaceSnapEnabled: false,
      terrainSnapEnabled: false,
      alignToSurfaceNormal: false,
      keepUpright: true
    }));
    state = setPlacementMode(state, "select");

    const savedPreset = state.editingState.placementPresets.find((preset) => preset.name === "Surface Follow Hero");
    const reapplied = applyPlacementPreset(state, savedPreset!.presetId);
    const appliedPreset = reapplied.editingState.placementPresets.find((preset) => preset.presetId === savedPreset!.presetId);

    expect(reapplied.placementMode).toBe("rotate");
    expect(reapplied.snapSettings.surfaceSnapEnabled).toBe(true);
    expect(reapplied.snapSettings.alignToSurfaceNormal).toBe(true);
    expect(reapplied.selectionState.filterCategories).toEqual(["landmark"]);
    expect(reapplied.editingState.sceneryBrush.activePackId).toBe("northwoods");
    expect(appliedPreset?.useCount).toBe(1);
    expect(appliedPreset?.lastUsedAt).toBeTruthy();
  });

  it("organizes placement presets into favorite and recent library lanes", () => {
    let state = createTestState();
    state = savePlacementPreset(state, {
      name: "Cliffside Landmark",
      preferredPackId: "highlands",
      preferredCategory: "landmark"
    });

    const createdPreset = state.editingState.placementPresets.find((preset) => preset.name === "Cliffside Landmark");
    state = togglePlacementPresetFavorite(state, createdPreset!.presetId);
    state = applyPlacementPreset(state, createdPreset!.presetId);

    const library = summarizePlacementPresetLibrary(state);
    const entry = library.entries.find((preset) => preset.presetId === createdPreset!.presetId);

    expect(library.totalCount).toBeGreaterThan(0);
    expect(library.favoriteCount).toBeGreaterThan(0);
    expect(library.recentCount).toBeGreaterThan(0);
    expect(library.entries[0]?.presetId).toBe(createdPreset!.presetId);
    expect(entry?.favorite).toBe(true);
    expect(entry?.recent).toBe(true);
    expect(entry?.contextSummary).toContain("landmark");
  });

  it("saves, applies, and organizes surface-rule presets as reusable terrain-aware rules", () => {
    let state = createTestState();
    state = updateSnapSettings(state, {
      ...state.snapSettings,
      terrainSnapEnabled: true,
      surfaceSnapEnabled: true,
      alignToSurfaceNormal: true,
      keepUpright: false
    });
    state = updateSurfaceRuleDraft(state, {
      slopeHandlingMode: "adaptive",
      orientationPosture: "surface-follow",
      preferredSurfacePurposes: ["rough", "support"],
      avoidedSurfacePurposes: ["fairway"],
      packInfluenceMode: "pack-led",
      suitabilityBias: 0.78,
      avoidanceBias: 0.7,
      preferredPackId: "highlands",
      preferredCategory: "supporting-scenery"
    });
    state = updateSceneryBrushSettings(state, {
      activePackId: "highlands",
      activePackInfluence: 0.85,
      avoidPlayableCoreStrength: 0.75,
      slopeLimitDegrees: 18
    });
    state = saveSurfaceRulePreset(state, {
      name: "Highlands Slope Follow",
      preferredSurfacePurposes: ["rough", "support"],
      preferredPackId: "highlands",
      preferredCategory: "supporting-scenery"
    });

    const savedPreset = state.editingState.surfaceRulePresets.find(
      (preset) => preset.name === "Highlands Slope Follow",
    );
    expect(savedPreset).toBeTruthy();

    state = toggleSurfaceRulePresetFavorite(state, savedPreset!.presetId);
    state = updateSnapSettings(state, {
      ...state.snapSettings,
      terrainSnapEnabled: false,
      surfaceSnapEnabled: false,
      alignToSurfaceNormal: false,
      keepUpright: true
    });
    state = updateSceneryBrushSettings(state, {
      activePackId: null,
      activePackInfluence: 0.25,
      avoidPlayableCoreStrength: 0.1,
      slopeLimitDegrees: 40
    });

    const applied = applySurfaceRulePreset(state, savedPreset!.presetId);
    const library = summarizeSurfaceRulePresetLibrary(applied);
    const entry = library.entries.find((preset) => preset.presetId === savedPreset!.presetId);

    expect(applied.viewportState.authoringMode).toBe("placement");
    expect(applied.snapSettings.surfaceSnapEnabled).toBe(true);
    expect(applied.snapSettings.alignToSurfaceNormal).toBe(true);
    expect(applied.snapSettings.keepUpright).toBe(false);
    expect(applied.editingState.sceneryBrush.activePackId).toBe("highlands");
    expect(applied.editingState.sceneryBrush.slopeLimitDegrees).toBe(18);
    expect(applied.editingState.sceneryBrush.avoidPlayableCoreStrength).toBe(0.75);
    expect(library.favoriteCount).toBeGreaterThan(0);
    expect(library.recentCount).toBeGreaterThan(0);
    expect(library.entries[0]?.presetId).toBe(savedPreset!.presetId);
    expect(entry?.contextSummary).toContain("surface follow");
  });

  it("supports deeper surface-rule authoring with explicit confidence signals", () => {
    const authored = updateSurfaceRuleDraft(createTestState(), {
      slopeHandlingMode: "adaptive",
      slopeLimitDegrees: 26,
      orientationPosture: "hybrid",
      preferredSurfacePurposes: ["rough", "support", "scenery"],
      avoidedSurfacePurposes: ["fairway", "green-complex"],
      preferredPackId: "twilight-boardwalk",
      preferredCategory: "structure",
      packInfluenceMode: "pack-led",
      suitabilityBias: 0.82,
      avoidanceBias: 0.74
    });
    const summary = summarizeSurfaceRuleAuthoring(authored);

    expect(authored.snapSettings.surfaceSnapEnabled).toBe(true);
    expect(authored.snapSettings.terrainSnapEnabled).toBe(true);
    expect(authored.snapSettings.alignToSurfaceNormal).toBe(true);
    expect(authored.snapSettings.keepUpright).toBe(true);
    expect(authored.selectionState.filterCategories).toEqual(["structure"]);
    expect(authored.editingState.sceneryBrush.activePackId).toBe("twilight-boardwalk");
    expect(authored.editingState.sceneryBrush.slopeLimitDegrees).toBe(26);
    expect(authored.editingState.sceneryBrush.activePackInfluence).toBeGreaterThan(0.8);
    expect(summary.confidenceState).toBe("ready");
    expect(summary.currentSummary).toContain("hybrid");
    expect(summary.preferredSurfacePurposeCount).toBe(3);
    expect(summary.avoidedSurfacePurposeCount).toBe(2);
  });

  it("maps surface-rule coverage across terrain regions and flags gaps or conflicts", () => {
    let state = createTestState();
    state = createTerrainRegionForHole(state, {
      holeId: "hole-1",
      gameplayPurpose: "rough",
      center: { x: 20, y: 2, z: 20 }
    });
    state = createTerrainRegionForHole(state, {
      holeId: "hole-1",
      gameplayPurpose: "fairway",
      center: { x: 40, y: 2, z: 20 }
    });
    state = createTerrainRegionForHole(state, {
      holeId: "hole-2",
      gameplayPurpose: "support",
      center: { x: 80, y: 2, z: 20 }
    });
    state = updateSurfaceRuleDraft(state, {
      preferredSurfacePurposes: ["rough", "support"],
      avoidedSurfacePurposes: ["fairway", "support"],
      suitabilityBias: 0.78,
      avoidanceBias: 0.72
    });

    const summary = summarizeSurfaceRuleCoverageMapping(state);
    const holeOne = summary.holeSummaries.find((hole) => hole.holeId === "hole-1");
    const holeTwo = summary.holeSummaries.find((hole) => hole.holeId === "hole-2");

    expect(summary.overallState).toBe("rough");
    expect(summary.activeRegionCount).toBe(1);
    expect(summary.guardedRegionCount).toBe(1);
    expect(summary.conflictingRegionCount).toBe(1);
    expect(summary.uncoveredRegionCount).toBe(0);
    expect(holeOne?.confidenceState).toBe("ready");
    expect(holeTwo?.confidenceState).toBe("rough");
  });

  it("resolves surface-rule conflicts and summarizes cleanup posture", () => {
    let state = createTestState();
    state = createTerrainRegionForHole(state, {
      holeId: "hole-1",
      gameplayPurpose: "support",
      center: { x: 20, y: 2, z: 20 }
    });
    state = createTerrainRegionForHole(state, {
      holeId: "hole-1",
      gameplayPurpose: "rough",
      center: { x: 32, y: 2, z: 24 }
    });
    state = createTerrainRegionForHole(state, {
      holeId: "hole-2",
      gameplayPurpose: "fairway",
      center: { x: 72, y: 2, z: 20 }
    });
    state = updateViewportState(state, {
      ...state.viewportState,
      activeHoleId: "hole-1"
    });
    state = updateSurfaceRuleDraft(state, {
      preferredSurfacePurposes: ["support", "rough"],
      avoidedSurfacePurposes: ["support", "fairway"],
      suitabilityBias: 0.76,
      avoidanceBias: 0.62
    });

    const before = summarizeSurfaceRuleConflictResolution(state);
    const resolved = resolveSurfaceRuleConflicts(state, "balance-active-hole");
    const after = summarizeSurfaceRuleConflictResolution(resolved);

    expect(before.overallState).toBe("rough");
    expect(before.unresolvedConflictRegionCount).toBeGreaterThan(0);
    expect(before.highPriorityHoleCount).toBeGreaterThan(0);
    expect(resolved.editingState.surfaceRuleDraft.preferredSurfacePurposes).toContain("support");
    expect(resolved.editingState.surfaceRuleDraft.avoidedSurfacePurposes).not.toContain("support");
    expect(after.unresolvedConflictRegionCount).toBe(0);
    expect(after.overallState).toBe("resolved");
  });

  it("automates surface-rule cleanup across conflicts and uncovered course regions", () => {
    let state = createTestState();
    state = createTerrainRegionForHole(state, {
      holeId: "hole-1",
      gameplayPurpose: "support",
      center: { x: 20, y: 2, z: 20 }
    });
    state = createTerrainRegionForHole(state, {
      holeId: "hole-1",
      gameplayPurpose: "rough",
      center: { x: 32, y: 2, z: 24 }
    });
    state = createTerrainRegionForHole(state, {
      holeId: "hole-2",
      gameplayPurpose: "fairway",
      center: { x: 72, y: 2, z: 20 }
    });
    state = updateViewportState(state, {
      ...state.viewportState,
      activeHoleId: "hole-1"
    });
    state = updateSurfaceRuleDraft(state, {
      preferredSurfacePurposes: ["support"],
      avoidedSurfacePurposes: ["support"],
      suitabilityBias: 0.76,
      avoidanceBias: 0.62
    });

    const before = summarizeSurfaceRuleCleanupAutomation(state);
    const cleaned = automateSurfaceRuleCleanup(state, "balance-course");
    const after = summarizeSurfaceRuleCleanupAutomation(cleaned);

    expect(before.overallState).toBe("rough");
    expect(before.autoCleanableHoleCount).toBeGreaterThan(0);
    expect(cleaned.editingState.surfaceRuleDraft.avoidedSurfacePurposes).not.toContain("support");
    expect(cleaned.editingState.surfaceRuleDraft.preferredSurfacePurposes).toContain("fairway");
    expect(after.roughHoleCount).toBe(0);
    expect(after.unresolvedHoleCount).toBeLessThan(before.unresolvedHoleCount);
  });

  it("prepares and approves cleanup reviews before applying broader surface-rule cleanup", () => {
    let state = createTestState();
    state = createTerrainRegionForHole(state, {
      holeId: "hole-1",
      gameplayPurpose: "support",
      center: { x: 20, y: 2, z: 20 }
    });
    state = createTerrainRegionForHole(state, {
      holeId: "hole-2",
      gameplayPurpose: "fairway",
      center: { x: 72, y: 2, z: 20 }
    });
    state = updateSurfaceRuleDraft(state, {
      preferredSurfacePurposes: ["support"],
      avoidedSurfacePurposes: ["support"],
      suitabilityBias: 0.76,
      avoidanceBias: 0.62
    });

    const reviewed = createSurfaceRuleCleanupReview(state, "balance-course");
    const reviewSummary = summarizeSurfaceRuleCleanupReview(reviewed);
    const latestReview = reviewSummary.latestReview;
    const approved = reviewSurfaceRuleCleanupPass(reviewed, latestReview!.reviewId, "approve-course-wide");
    const approvedSummary = summarizeSurfaceRuleCleanupReview(approved);

    expect(reviewSummary.pendingReviewCount).toBe(1);
    expect(reviewSummary.pendingBroadReviewCount).toBe(1);
    expect(reviewSummary.auditEntryCount).toBe(1);
    expect(reviewSummary.latestAuditSummary).toContain("created");
    expect(reviewSummary.latestDiffSummary).toContain("Conflicts");
    expect(reviewSummary.latestReview?.status).toBe("pending");
    expect(reviewSummary.recommendedAction).toContain("approve");
    expect(approvedSummary.approvedReviewCount).toBe(1);
    expect(approvedSummary.pendingReviewCount).toBe(0);
    expect(approvedSummary.courseWideApprovalCount).toBe(1);
    expect(approvedSummary.approvalDepthState).toBe("deep");
    expect(approvedSummary.auditEntryCount).toBe(2);
    expect(approvedSummary.latestAuditSummary).toContain("approved");
    expect(approvedSummary.auditTrailState).toBe("ready");
    expect(approvedSummary.diffConfidenceState).not.toBe("weak");
    expect(approved.editingState.surfaceRuleDraft.avoidedSurfacePurposes).not.toContain("support");
  });

  it("records cleanup review audit history across rejection decisions", () => {
    let state = createTestState();
    state = createTerrainRegionForHole(state, {
      holeId: "hole-1",
      gameplayPurpose: "support",
      center: { x: 20, y: 2, z: 20 }
    });
    state = updateSurfaceRuleDraft(state, {
      preferredSurfacePurposes: ["support"],
      avoidedSurfacePurposes: ["support"],
      suitabilityBias: 0.76,
      avoidanceBias: 0.62
    });

    const reviewed = createSurfaceRuleCleanupReview(state, "balance-course");
    const reviewId = summarizeSurfaceRuleCleanupReview(reviewed).latestReview!.reviewId;
    const rejected = reviewSurfaceRuleCleanupPass(reviewed, reviewId, "reject");
    const summary = summarizeSurfaceRuleCleanupReview(rejected);

    expect(summary.rejectedReviewCount).toBe(1);
    expect(summary.auditEntryCount).toBe(2);
    expect(summary.latestAuditSummary).toContain("rejected");
    expect(summary.auditTrailState).toBe("watch");
  });

  it("summarizes replayable cleanup review history across approval decisions", () => {
    let state = createTestState();
    state = createTerrainRegionForHole(state, {
      holeId: "hole-1",
      gameplayPurpose: "support",
      center: { x: 20, y: 2, z: 20 }
    });
    state = updateSurfaceRuleDraft(state, {
      preferredSurfacePurposes: ["support"],
      avoidedSurfacePurposes: ["support"]
    });

    const reviewed = createSurfaceRuleCleanupReview(state, "balance-course");
    const reviewId = summarizeSurfaceRuleCleanupReview(reviewed).latestReview!.reviewId;
    const approved = reviewSurfaceRuleCleanupPass(reviewed, reviewId, "approve-regional");
    const replay = summarizeSurfaceRuleCleanupReviewReplay(approved);

    expect(replay.overallState).toBe("ready");
    expect(replay.replayableReviewCount).toBe(1);
    expect(replay.acceptedReplayCount).toBe(1);
    expect(replay.courseRegionReplayCount).toBe(1);
    expect(replay.latestReplaySummary).toContain("approved");
  });

  it("summarizes cleanup review timelines as an inspectable sequence over time", () => {
    let state = createTestState();
    state = createTerrainRegionForHole(state, {
      holeId: "hole-1",
      gameplayPurpose: "support",
      center: { x: 20, y: 2, z: 20 }
    });
    state = updateSurfaceRuleDraft(state, {
      preferredSurfacePurposes: ["support"],
      avoidedSurfacePurposes: ["support"]
    });

    state = createSurfaceRuleCleanupReview(state, "balance-course");
    let latestReviewId = summarizeSurfaceRuleCleanupReview(state).latestReview!.reviewId;
    state = reviewSurfaceRuleCleanupPass(state, latestReviewId, "approve-regional");
    state = createSurfaceRuleCleanupReview(state, "expand-coverage");
    latestReviewId = summarizeSurfaceRuleCleanupReview(state).latestReview!.reviewId;
    state = reviewSurfaceRuleCleanupPass(state, latestReviewId, "reject");

    const timeline = summarizeSurfaceRuleCleanupReviewReplayTimeline(state);

    expect(timeline.overallState).toBe("ready");
    expect(timeline.timelineEntryCount).toBe(2);
    expect(timeline.acceptedTimelineCount).toBe(1);
    expect(timeline.rejectedTimelineCount).toBe(1);
    expect(timeline.courseRegionTimelineCount).toBe(1);
    expect(timeline.entries[0]?.timelineIndex).toBe(1);
    expect(timeline.entries[1]?.timelineLabel).toContain("rejected");
    expect(timeline.latestTimelineSummary).toContain("rejected");
  });

  it("applies landmark corridor support kits through the shared corridor authority", () => {
    let state = createTestState();
    state = updateViewportState(state, {
      ...state.viewportState,
      activeHoleId: "hole-1"
    });
    state = selectSceneObjects(state, ["scene-landmark-1"]);
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "tee",
      position: { x: 0, y: 0, z: 0 }
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "green-center",
      position: { x: 120, y: 0, z: 0 }
    });

    const updated = applyLandmarkCorridorSupportKit(state, "anchor-landmark-support-kit");
    const selected = updated.sceneObjects.find((sceneObject) => sceneObject.sceneObjectId === "scene-landmark-1");

    expect(updated.visibilityCorridors[0]?.minimumWidthMeters).toBeGreaterThan(state.visibilityCorridors[0]!.minimumWidthMeters);
    expect(selected?.tags.some((tag) => tag.startsWith("landmark-corridor-"))).toBe(true);
  });

  it("composes landmark corridor support bundles through the shared corridor authority", () => {
    let state = createTestState();
    state = updateViewportState(state, {
      ...state.viewportState,
      activeHoleId: "hole-1"
    });
    state = selectSceneObjects(state, ["scene-landmark-1"]);
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "tee",
      position: { x: 0, y: 0, z: 0 }
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "green-center",
      position: { x: 120, y: 0, z: 0 }
    });

    const updated = applyLandmarkCorridorSupportKitComposition(state, "compose-hybrid-support-bundle");
    const selected = updated.sceneObjects.find((sceneObject) => sceneObject.sceneObjectId === "scene-landmark-1");

    expect(updated.fairwayCorridors[0]?.averageWidthMeters).toBeGreaterThan(0);
    expect(updated.visibilityCorridors[0]?.minimumWidthMeters).toBeGreaterThan(0);
    expect(selected?.tags.some((tag) => tag.startsWith("landmark-corridor-"))).toBe(true);
    expect(updated.placementHistory.at(-1)?.summary).toContain("presentation corridor");
  });

  it("organizes corridor bundles as a reusable quick-apply library", () => {
    let state = createTestState();
    const seededLibrary = summarizeLandmarkCorridorBundleLibrary(state);
    state = saveLandmarkCorridorBundleLibraryEntry(state, {
      name: "Hole Calm Bundle",
      bundleAction: "compose-presentation-calm-bundle"
    });
    const savedEntry =
      state.editingState.landmarkCorridorBundleLibrary.find((entry) => entry.name === "Hole Calm Bundle") ?? null;
    state = toggleLandmarkCorridorBundleLibraryFavorite(state, savedEntry!.bundleId);
    state = applyLandmarkCorridorBundleLibraryEntry(state, savedEntry!.bundleId);
    const summary = summarizeLandmarkCorridorBundleLibrary(state);

    expect(seededLibrary.totalCount).toBeGreaterThan(0);
    expect(savedEntry).not.toBeNull();
    expect(summary.totalCount).toBeGreaterThan(seededLibrary.totalCount);
    expect(summary.favoriteCount).toBeGreaterThanOrEqual(seededLibrary.favoriteCount);
    expect(summary.quickApplyCount).toBeGreaterThan(0);
    expect(
      state.editingState.landmarkCorridorBundleLibrary.find((entry) => entry.bundleId === savedEntry!.bundleId)?.useCount,
    ).toBe(1);
  });

  it("recommends corridor bundles from the library for holes that still need support", () => {
    let state = createTestState();
    state = {
      ...state,
      editingState: {
        ...state.editingState,
        landmarkCorridorBundleLibrary: []
      }
    };
    state = saveLandmarkCorridorBundleLibraryEntry(state, {
      name: "Open Support Bundle",
      bundleAction: "compose-open-support-bundle"
    });
    state = saveLandmarkCorridorBundleLibraryEntry(state, {
      name: "Route Support Bundle",
      bundleAction: "compose-route-support-bundle"
    });

    const recommendations = summarizeLandmarkCorridorBundleRecommendations(state, {
      holes: [
        {
          holeId: "hole-1",
          holeNumber: 1,
          blockedViewCount: 1,
          weakViewCount: 0,
          routeDeliveryConfidence: "watch"
        },
        {
          holeId: "hole-2",
          holeNumber: 2,
          blockedViewCount: 0,
          weakViewCount: 1,
          routeDeliveryConfidence: "watch"
        },
        {
          holeId: "hole-3",
          holeNumber: 3,
          blockedViewCount: 0,
          weakViewCount: 0,
          routeDeliveryConfidence: "ready"
        }
      ]
    });

    expect(recommendations.overallState).toBe("rough");
    expect(recommendations.recommendationCount).toBe(2);
    expect(recommendations.recommendedBundleCount).toBe(1);
    expect(recommendations.missingBundleHoleCount).toBe(1);
    expect(recommendations.entries.find((entry) => entry.holeId === "hole-1")?.bundleName).toBe("Open Support Bundle");
    expect(recommendations.entries.find((entry) => entry.holeId === "hole-1")?.recommendationState).toBe("watch");
    expect(recommendations.entries.find((entry) => entry.holeId === "hole-2")?.readinessState).toBe("missing");
    expect(recommendations.entries.find((entry) => entry.holeId === "hole-3")?.recommendationState).toBe("ready");
  });

  it("re-stages the selected landmark with direct corrective actions", () => {
    let state = createTestState();
    state = updateViewportState(state, {
      ...state.viewportState,
      activeHoleId: "hole-1"
    });
    state = selectSceneObjects(state, ["scene-landmark-1"]);
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "tee",
      position: { x: 0, y: 0, z: 0 }
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "green-center",
      position: { x: 120, y: 0, z: 0 }
    });
    state = connectRoutingNodes(state, {
      holeId: "hole-1",
      fromNodeId: "routing-node-1",
      toNodeId: "routing-node-2"
    });

    const restaged = restageSelectedLandmark(state, "reinforce-route-view");
    const landmark = restaged.sceneObjects.find((sceneObject) => sceneObject.sceneObjectId === "scene-landmark-1");

    expect(landmark?.transform.position.x).toBeGreaterThan(state.sceneObjects[1]!.transform.position.x);
    expect(landmark?.tags).toContain("landmark-route-reinforced");
    expect(landmark?.transform.rotation.y).not.toBe(state.sceneObjects[1]!.transform.rotation.y);
    expect(restaged.placementHistory.at(-1)?.summary).toContain("route-view support");
  });

  it("widens and rebalances landmark view corridors on the active hole", () => {
    let state = createTestState();
    state = {
      ...state,
      fairwayCorridors: [
        createFairwayCorridor({
          fairwayCorridorId: "fairway-corridor-hole-1",
          holeId: "hole-1",
          routingPathId: "routing-path-hole-1",
          centerline: [
            { x: 0, y: 0, z: 0 },
            { x: 80, y: 0, z: 0 }
          ],
          averageWidthMeters: 24
        })
      ],
      visibilityCorridors: [
        createVisibilityCorridor({
          visibilityCorridorId: "visibility-corridor-hole-1",
          holeId: "hole-1",
          fromNodeId: "routing-node-1",
          toNodeId: "routing-node-2",
          corridorLine: [
            { x: 0, y: 0, z: 0 },
            { x: 80, y: 0, z: 0 }
          ],
          minimumWidthMeters: 18
        })
      ]
    };
    state = updateViewportState(state, {
      ...state.viewportState,
      activeHoleId: "hole-1"
    });
    state = selectSceneObjects(state, ["scene-landmark-1"]);

    const widened = applyLandmarkViewCorridorTool(state, "widen-view-corridor");
    const rebalanced = applyLandmarkViewCorridorTool(widened, "rebalance-route-corridor");
    const fairwayCorridor = rebalanced.fairwayCorridors.find((corridor) => corridor.holeId === "hole-1");
    const visibilityCorridor = rebalanced.visibilityCorridors.find((corridor) => corridor.holeId === "hole-1");
    const landmark = rebalanced.sceneObjects.find((sceneObject) => sceneObject.sceneObjectId === "scene-landmark-1");

    expect(fairwayCorridor?.averageWidthMeters).toBeGreaterThan(
      state.fairwayCorridors.find((corridor) => corridor.holeId === "hole-1")!.averageWidthMeters,
    );
    expect(visibilityCorridor?.minimumWidthMeters).toBeGreaterThan(
      state.visibilityCorridors.find((corridor) => corridor.holeId === "hole-1")!.minimumWidthMeters,
    );
    expect(fairwayCorridor?.note).toContain("landmark corridor");
    expect(landmark?.tags.some((tag) => tag.startsWith("landmark-corridor-"))).toBe(true);
  });

  it("snaps direct placement onto terrain surfaces with orientation-aware posture", () => {
    let state = createTestState();
    state = createTerrainRegionForHole(state, {
      holeId: "hole-1",
      gameplayPurpose: "fairway",
      center: { x: 30, y: 4, z: 12 }
    });
    state = updateSnapSettings(state, {
      ...state.snapSettings,
      terrainSnapEnabled: true,
      surfaceSnapEnabled: true,
      alignToSurfaceNormal: true,
      keepUpright: false
    });
    state = {
      ...state,
      terrainRegions: state.terrainRegions.map((region) =>
        region.terrainRegionId === "terrain-region-1"
          ? {
              ...region,
              elevationMax: 14
            }
          : region,
      )
    };

    const draft = createPlacementAssetDraft({
      draftId: "placement-draft-stone-wall",
      assetRef: "asset-stone-wall",
      label: "Stone Wall",
      objectType: "wall",
      category: "structure",
      packId: "highlands",
      footprintRadiusMeters: 8
    });
    const previewed = previewPlacementDraft(state, {
      draft,
      worldPoint: { x: 34, y: 0, z: 14 }
    });
    const committed = commitAuthoringPreview(previewed, {
      holeId: "hole-1"
    });
    const placed = committed.sceneObjects.at(-1);

    expect(previewed.editingState.authoringPreview.surfaceSnapMode).toBe("terrain-region");
    expect(previewed.editingState.authoringPreview.surfaceLabel).toBeTruthy();
    expect(previewed.editingState.authoringPreview.surfaceSlopeDegrees).toBeGreaterThan(0);
    expect(placed?.transform.position.y).toBeGreaterThan(0);
    expect(Math.abs(placed?.transform.rotation.x ?? 0) + Math.abs(placed?.transform.rotation.z ?? 0)).toBeGreaterThan(0);
    expect(placed?.tags).toContain("terrain-snapped");
  });

  it("renders live scenery-brush and terrain-finish previews with layer-aware finish painting", () => {
    const brushState = addPlacementDraftsToSceneryBrush(createTestState(), [
      createPlacementAssetDraft({
        draftId: "brush-pine-preview",
        assetRef: "asset-pine-preview",
        label: "Pine Preview",
        objectType: "tree-cluster",
        category: "vegetation",
        packId: "northwoods",
        footprintRadiusMeters: 5
      })
    ]);
    const brushPreviewed = previewSceneryBrush(brushState, {
      x: 42,
      y: 0,
      z: 18
    });
    const brushSnapshot = buildRendererSceneSnapshot(brushPreviewed);

    let terrainState = createTerrainRegionForHole(createTestState(), {
      holeId: "hole-1",
      gameplayPurpose: "fairway"
    });
    terrainState = setActiveTerrainMaterial(terrainState, "terrain-material-fairway-mow");
    terrainState = setActiveTerrainMaterialLayerIndex(terrainState, 2);
    terrainState = setTerrainMaterialVisibilityMode(terrainState, "active-material");
    terrainState = previewTerrainFinish(terrainState, {
      x: 26,
      y: 0,
      z: 5
    });
    const terrainSnapshot = buildRendererSceneSnapshot(terrainState);
    const painted = commitAuthoringPreview(terrainState);
    const cleared = clearAuthoringPreview(painted);

    expect(brushSnapshot.primitives.some((primitive) => primitive.id === "preview-brush-footprint")).toBe(true);
    expect(
      brushSnapshot.primitives.filter((primitive) => primitive.id.startsWith("preview-brush-ghost-")).length,
    ).toBeGreaterThan(0);
    expect(terrainState.editingState.terrainMaterialVisibilityMode).toBe("active-material");
    expect(terrainSnapshot.runtimeStatus.previewMode).toBe("terrain-finish");
    expect(
      terrainSnapshot.primitives.some((primitive) => primitive.id === "preview-terrain-finish-footprint"),
    ).toBe(true);
    expect(painted.terrainPaintStrokes.at(-1)?.layerIndex).toBe(2);
    expect(painted.terrainPaintStrokes.at(-1)?.opacity).toBeGreaterThan(0);
    expect(cleared.editingState.authoringPreview.visible).toBe(false);
  });

  it("applies deeper brush rules for spacing, pack influence, and explicit asset weighting", () => {
    const brushDrafts = [
      createPlacementAssetDraft({
        draftId: "brush-pine",
        assetRef: "asset-pine-cluster",
        label: "Pine Cluster",
        objectType: "vegetation",
        category: "vegetation",
        packId: "northwoods",
        tags: ["pine"],
        placementRules: ["scatter", "avoid-playable-core"]
      }),
      createPlacementAssetDraft({
        draftId: "brush-rock",
        assetRef: "asset-rock-detail",
        label: "Rock Detail",
        objectType: "rock",
        category: "supporting-scenery",
        packId: "northwoods",
        tags: ["rock"],
        placementRules: ["scatter"]
      })
    ];
    let state = createTerrainRegionForHole(createTestState(), {
      holeId: "hole-1",
      gameplayPurpose: "rough",
      center: { x: 84, y: 0, z: 18 }
    });
    state = addPlacementDraftsToSceneryBrush(state, brushDrafts);
    state = updateSceneryBrushSettings(state, {
      density: 6,
      brushRadiusMeters: 18,
      minimumSpacingMeters: 1000,
      activePackId: "northwoods",
      activePackInfluence: 1,
      avoidPlayableCoreStrength: 1,
      categoryFilters: ["vegetation"],
      categoryWeights: [{ category: "vegetation", weight: 3 }],
      assetWeights: [
        { assetRef: "asset-pine-cluster", weight: 4 },
        { assetRef: "asset-rock-detail", weight: 0.1 }
      ]
    });

    const brushed = applySceneryBrushStroke(state, {
      center: { x: 84, y: 0, z: 18 },
      holeId: "hole-1"
    });
    const newObjects = brushed.sceneObjects.slice(state.sceneObjects.length);

    expect(newObjects.length).toBeGreaterThan(0);
    expect(newObjects.every((sceneObject) => sceneObject.assetRef === "asset-pine-cluster")).toBe(true);
    expect(newObjects.every((sceneObject) => sceneObject.tags.includes("northwoods"))).toBe(true);
    expect(newObjects.every((sceneObject) => sceneObject.tags.includes("terrain-snapped"))).toBe(true);
  });

  it("saves and reapplies scenery-brush presets for reusable dressing passes", () => {
    let state = createTestState();
    state = addPlacementDraftsToSceneryBrush(state, [
      createPlacementAssetDraft({
        draftId: "brush-pine",
        assetRef: "asset-pine-cluster",
        label: "Pine Cluster",
        objectType: "vegetation",
        category: "vegetation",
        footprintRadiusMeters: 3,
        packId: "northwoods",
        tags: ["northwoods", "tree"],
        placementRules: ["scatter", "avoid-playable-core"]
      })
    ]);
    state = updateSceneryBrushSettings(state, {
      activePackId: "northwoods",
      brushRadiusMeters: 14,
      density: 8,
      minimumSpacingMeters: 2.5,
      activePackInfluence: 0.9,
      slopeLimitDegrees: 18
    });
    state = saveSceneryBrushPreset(state, {
      name: "Northwoods Edge"
    });
    state = updateSceneryBrushSettings(state, {
      density: 2,
      minimumSpacingMeters: 0.5,
      activePackInfluence: 0.2,
      slopeLimitDegrees: 45
    });

    const savedPreset = state.editingState.sceneryBrushPresets.find((preset) => preset.name === "Northwoods Edge");
    const reapplied = applySceneryBrushPreset(state, savedPreset!.presetId);
    const appliedPreset = reapplied.editingState.sceneryBrushPresets.find((preset) => preset.presetId === savedPreset!.presetId);

    expect(reapplied.viewportState.authoringMode).toBe("scenery-brush");
    expect(reapplied.editingState.sceneryBrush.density).toBe(8);
    expect(reapplied.editingState.sceneryBrush.minimumSpacingMeters).toBe(2.5);
    expect(reapplied.editingState.sceneryBrush.activePackId).toBe("northwoods");
    expect(reapplied.editingState.sceneryBrush.activePackInfluence).toBe(0.9);
    expect(appliedPreset?.useCount).toBe(1);
    expect(appliedPreset?.lastUsedAt).toBeTruthy();
  });

  it("organizes brush presets into favorite and recent library lanes", () => {
    let state = createTestState();
    state = addPlacementDraftsToSceneryBrush(state, [
      createPlacementAssetDraft({
        draftId: "brush-mossy-rock",
        assetRef: "asset-mossy-rock",
        label: "Mossy Rock",
        objectType: "rock",
        category: "supporting-scenery",
        footprintRadiusMeters: 2,
        packId: "highlands",
        tags: ["highlands", "rock"]
      })
    ]);
    state = updateSceneryBrushSettings(state, {
      activePackId: "highlands",
      density: 5,
      minimumSpacingMeters: 4,
      activePackInfluence: 0.8
    });
    state = saveSceneryBrushPreset(state, {
      name: "Highlands Edge"
    });

    const createdPreset = state.editingState.sceneryBrushPresets.find((preset) => preset.name === "Highlands Edge");
    state = toggleSceneryBrushPresetFavorite(state, createdPreset!.presetId);
    state = applySceneryBrushPreset(state, createdPreset!.presetId);

    const library = summarizeSceneryBrushPresetLibrary(state);
    const entry = library.entries.find((preset) => preset.presetId === createdPreset!.presetId);

    expect(library.totalCount).toBeGreaterThan(0);
    expect(library.favoriteCount).toBeGreaterThan(0);
    expect(library.recentCount).toBeGreaterThan(0);
    expect(library.entries[0]?.presetId).toBe(createdPreset!.presetId);
    expect(entry?.favorite).toBe(true);
    expect(entry?.recent).toBe(true);
    expect(entry?.contextSummary).toContain("density");
  });

  it("summarizes terrain finish coverage, layering, and palette usage", () => {
    let state = createTestState();
    state = createTerrainRegionForHole(state, {
      holeId: "hole-1",
      gameplayPurpose: "fairway",
      center: { x: 28, y: 0, z: 0 }
    });
    state = createTerrainRegionForHole(state, {
      holeId: "hole-1",
      gameplayPurpose: "rough",
      center: { x: 92, y: 0, z: 0 }
    });
    state = setActiveTerrainMaterial(state, "terrain-material-fairway-mow");
    state = applyTerrainMaterialStroke(state, {
      regionId: "terrain-region-1",
      center: { x: 28, y: 0, z: 0 }
    });
    state = setActiveTerrainMaterial(state, "terrain-material-bunker-sand");
    state = setActiveTerrainMaterialLayerIndex(state, 1);
    state = applyTerrainMaterialStroke(state, {
      regionId: "terrain-region-1",
      center: { x: 30, y: 0, z: 2 }
    });

    const summary = summarizeTerrainFinishConsistency(state);
    const snapshot = buildRendererSceneSnapshot(state);

    expect(summary.coveragePercent).toBe(50);
    expect(summary.unpaintedRegionCount).toBe(1);
    expect(summary.layeredRegionCount).toBe(1);
    expect(summary.paletteUsageCount).toBe(2);
    expect(summary.dominantMaterialLabel).toBe("Fairway Mow");
    expect(summary.completenessState).toBe("partial");
    expect(summary.balanceState).toBe("watch");
    expect(summary.coverageGapRegionIds).toEqual(["terrain-region-2"]);
    expect(summary.patchyRegionIds).toEqual([]);
    expect(summary.dominantMaterialOveruseRegionIds).toEqual([]);
    expect(summary.recommendedAction).toContain("coverage");
    expect(snapshot.overlays.some((overlay) => overlay.overlayId === "terrain-finish")).toBe(true);
    expect(snapshot.primitives.some((primitive) => primitive.id.startsWith("terrain-finish-gap-"))).toBe(true);
  });

  it("surfaces terrain finish patchiness and imbalance when finish layers fragment", () => {
    let state = createTestState();
    state = createTerrainRegionForHole(state, {
      holeId: "hole-1",
      gameplayPurpose: "fairway",
      center: { x: 28, y: 0, z: 0 }
    });
    state = createTerrainRegionForHole(state, {
      holeId: "hole-1",
      gameplayPurpose: "rough",
      center: { x: 54, y: 0, z: 0 }
    });
    state = setActiveTerrainMaterial(state, "terrain-material-fairway-mow");
    state = applyTerrainMaterialStroke(state, {
      regionId: "terrain-region-1",
      center: { x: 28, y: 0, z: 0 }
    });
    state = setActiveTerrainMaterial(state, "terrain-material-rough-native");
    state = applyTerrainMaterialStroke(state, {
      regionId: "terrain-region-1",
      center: { x: 31, y: 0, z: 2 }
    });
    state = setActiveTerrainMaterial(state, "terrain-material-bunker-sand");
    state = setActiveTerrainMaterialLayerIndex(state, 1);
    state = applyTerrainMaterialStroke(state, {
      regionId: "terrain-region-1",
      center: { x: 30, y: 0, z: -1 }
    });
    state = applyTerrainMaterialStroke(state, {
      regionId: "terrain-region-2",
      center: { x: 54, y: 0, z: 0 }
    });
    state = applyTerrainMaterialStroke(state, {
      regionId: "terrain-region-1",
      center: { x: 29, y: 0, z: 1 }
    });
    state = applyTerrainMaterialStroke(state, {
      regionId: "terrain-region-2",
      center: { x: 56, y: 0, z: 1 }
    });

    const summary = summarizeTerrainFinishConsistency(state);
    const snapshot = buildRendererSceneSnapshot(state);

    expect(summary.patchyRegionCount).toBeGreaterThan(0);
    expect(summary.balanceState).toBe("watch");
    expect(summary.patchyRegionIds).toContain("terrain-region-1");
    expect(summary.dominantMaterialOveruseRegionIds).toContain("terrain-region-1");
    expect(summary.dominantMaterialOveruseRegionIds).toContain("terrain-region-2");
    expect(summary.recommendedAction).toContain("patch");
    expect(snapshot.primitives.some((primitive) => primitive.id.startsWith("terrain-finish-patchy-"))).toBe(true);
    expect(snapshot.primitives.some((primitive) => primitive.id.startsWith("terrain-finish-overuse-"))).toBe(true);
  });

  it("surfaces course-scale terrain finish imbalance across holes", () => {
    let state = createTestState();
    state = createTerrainRegionForHole(state, {
      holeId: "hole-1",
      gameplayPurpose: "fairway",
      center: { x: 28, y: 0, z: 0 }
    });
    state = createTerrainRegionForHole(state, {
      holeId: "hole-1",
      gameplayPurpose: "rough",
      center: { x: 56, y: 0, z: 0 }
    });
    state = createTerrainRegionForHole(state, {
      holeId: "hole-2",
      gameplayPurpose: "fairway",
      center: { x: 132, y: 0, z: 0 }
    });
    state = setActiveTerrainMaterial(state, "terrain-material-fairway-mow");
    state = applyTerrainMaterialStroke(state, {
      regionId: "terrain-region-1",
      center: { x: 28, y: 0, z: 0 }
    });
    state = setActiveTerrainMaterial(state, "terrain-material-rough-native");
    state = applyTerrainMaterialStroke(state, {
      regionId: "terrain-region-2",
      center: { x: 56, y: 0, z: 0 }
    });

    const courseScaleSummary = summarizeCourseScaleTerrainFinish(state);
    const snapshot = buildRendererSceneSnapshot(state);

    expect(courseScaleSummary.holeCount).toBe(2);
    expect(courseScaleSummary.readyHoleCount).toBe(1);
    expect(courseScaleSummary.imbalancedHoleCount).toBe(1);
    expect(courseScaleSummary.coverageGapHoleIds).toContain("hole-2");
    expect(courseScaleSummary.overallState).toBe("imbalanced");
    expect(courseScaleSummary.recommendedAction).toContain("weakest holes");
    expect(
      snapshot.primitives.some((primitive) => primitive.id.startsWith("terrain-finish-hole-balance-hole-2")),
    ).toBe(true);
  });

  it("applies renderer interaction deltas for transforms and routing edits", () => {
    let state = createTestState();
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "tee",
      position: { x: 0, y: 0, z: 0 }
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "green-center",
      position: { x: 120, y: 0, z: 0 }
    });
    state = connectRoutingNodes(state, {
      holeId: "hole-1",
      fromNodeId: "routing-node-1",
      toNodeId: "routing-node-2"
    });

    const moved = applyRendererInteractionDelta(
      state,
      {
        kind: "entity-translate",
        reference: createSceneSpatialReference({
          entityType: "scene-object",
          entityId: "scene-tee-1"
        })
      },
      {
        worldDelta: { x: 8, y: 0, z: 4 }
      },
    );

    const rotated = applyRendererInteractionDelta(
      moved,
      {
        kind: "entity-rotate",
        reference: createSceneSpatialReference({
          entityType: "scene-object",
          entityId: "scene-tee-1"
        })
      },
      {
        rotationDegrees: 17
      },
    );

    const bent = applyRendererInteractionDelta(
      rotated,
      {
        kind: "routing-bend",
        reference: createSceneSpatialReference({
          entityType: "routing-segment",
          entityId: "routing-segment-1",
          holeId: "hole-1"
        }),
        routingSegmentId: "routing-segment-1"
      },
      {
        worldPoint: { x: 64, y: 0, z: 18 }
      },
    );

    expect(
      bent.sceneObjects.find((sceneObject) => sceneObject.sceneObjectId === "scene-tee-1")?.transform.position.x,
    ).toBe(8);
    expect(
      bent.sceneObjects.find((sceneObject) => sceneObject.sceneObjectId === "scene-tee-1")?.transform.rotation.y,
    ).toBe(15);
    expect(
      bent.routingSegments.find((segment) => segment.routingSegmentId === "routing-segment-1")?.controlLine.points[1]?.z,
    ).toBe(18);
  });

  it("surfaces occlusion and weak preview framing from richer spatial analysis", () => {
    let state = createTestState();
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "tee",
      position: { x: 0, y: 0, z: 0 }
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "green-center",
      position: { x: 120, y: 0, z: 0 }
    });
    state = connectRoutingNodes(state, {
      holeId: "hole-1",
      fromNodeId: "routing-node-1",
      toNodeId: "routing-node-2"
    });
    state = createTeeZoneForHole(state, {
      holeId: "hole-1",
      teeSetRefs: ["tee-black"]
    });
    state = createGreenZoneForHole(state, "hole-1");
    state = createHazardZoneForHole(state, {
      holeId: "hole-1"
    });
    state.sceneObjects.push(
      createSceneObject({
        sceneObjectId: "scene-occluder-1",
        collectionId: "collection-main",
        name: "Occluding Tree Wall",
        category: "vegetation",
        objectType: "dense-tree-cluster",
        placementLayerId: "layer-gameplay",
        transform: {
          position: { x: 60, y: 0, z: 3 }
        }
      }),
    );
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "preview-anchor",
      position: { x: 96, y: 12, z: -12 }
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "preview-anchor",
      position: { x: 98, y: 13, z: -11 }
    });

    const analysis = createSpatialAnalysisReport(state, {
      previewAnchorBindings: [
        {
          previewAnchorBindingId: "preview-binding-flyover-start",
          holeId: "hole-1",
          role: "flyover-start",
          readinessState: "ready",
          anchorRef: createSceneSpatialReference({
            entityType: "routing-node",
            entityId: "routing-node-3",
            holeId: "hole-1"
          })
        },
        {
          previewAnchorBindingId: "preview-binding-flyover-end",
          holeId: "hole-1",
          role: "flyover-end",
          readinessState: "ready",
          anchorRef: createSceneSpatialReference({
            entityType: "routing-node",
            entityId: "routing-node-4",
            holeId: "hole-1"
          })
        }
      ],
      minimapMetadata: [
        {
          holeId: "hole-1",
          frameAnchorRef: createSceneSpatialReference({
            entityType: "routing-node",
            entityId: "routing-node-3",
            holeId: "hole-1"
          }),
          northReferenceAnchorRef: createSceneSpatialReference({
            entityType: "routing-node",
            entityId: "routing-node-4",
            holeId: "hole-1"
          })
        }
      ],
      flyoverMetadata: [
        {
          holeId: "hole-1",
          startAnchorRef: createSceneSpatialReference({
            entityType: "routing-node",
            entityId: "routing-node-3",
            holeId: "hole-1"
          }),
          apexAnchorRef: createSceneSpatialReference({
            entityType: "routing-node",
            entityId: "routing-node-4",
            holeId: "hole-1"
          }),
          endAnchorRef: createSceneSpatialReference({
            entityType: "routing-node",
            entityId: "routing-node-2",
            holeId: "hole-1"
          })
        }
      ]
    });

    expect(analysis.occlusionRisks.length).toBeGreaterThan(0);
    expect(analysis.previewFramingWeaknesses.length).toBeGreaterThan(0);
  });

  it("uses routing guide settings for angle snap, working height, and auto-connect", () => {
    let state = createTestState();
    state = updateRoutingGuideSettings(state, {
      angleSnapEnabled: true,
      angleStepDegrees: 45,
      workingHeightMeters: 3,
      autoConnectEnabled: true
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "tee",
      position: { x: 0, y: 0, z: 0 }
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "landing-zone",
      position: { x: 37, y: 0, z: 11 }
    });

    expect(state.routingNodes[1]?.position.y).toBe(3);
    expect(state.routingSegments).toHaveLength(1);
    expect(state.routingNodes[1]?.position.z).toBe(0);
  });

  it("adds route width and working-height handles for direct refinement", () => {
    let state = createTestState();
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "tee",
      position: { x: 0, y: 0, z: 0 }
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "green-center",
      position: { x: 120, y: 0, z: 0 }
    });
    state = connectRoutingNodes(state, {
      holeId: "hole-1",
      fromNodeId: "routing-node-1",
      toNodeId: "routing-node-2"
    });

    const segmentSelected = selectSpatialEntities(state, [
      createSceneSpatialReference({
        entityType: "routing-segment",
        entityId: "routing-segment-1",
        holeId: "hole-1"
      })
    ]);
    const segmentSnapshot = buildRendererSceneSnapshot(segmentSelected);
    const widthAdjusted = adjustRoutingSegmentWidth(segmentSelected, "routing-segment-1", 8);

    const nodeSelected = selectSpatialEntities(widthAdjusted, [
      createSceneSpatialReference({
        entityType: "routing-node",
        entityId: "routing-node-2",
        holeId: "hole-1"
      })
    ]);
    const nodeSnapshot = buildRendererSceneSnapshot(nodeSelected);
    const heightAdjusted = adjustRoutingNodeHeight(nodeSelected, "routing-node-2", 4);

    expect(segmentSnapshot.primitives.some((primitive) => primitive.id === "gizmo-routing-width-routing-segment-1")).toBe(
      true,
    );
    expect(widthAdjusted.routingSegments[0]?.targetWidthMeters).toBeGreaterThan(state.routingSegments[0]!.targetWidthMeters);
    expect(nodeSnapshot.primitives.some((primitive) => primitive.id === "gizmo-routing-height-routing-node-2")).toBe(
      true,
    );
    expect(heightAdjusted.routingNodes[1]?.position.y).toBe(4);
  });

  it("merges nearby routing nodes using merge tolerance and preserves a connected route", () => {
    let state = createTestState();
    state = updateRoutingGuideSettings(state, {
      autoMergeEnabled: true,
      mergeToleranceMeters: 8
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "tee",
      position: { x: 0, y: 0, z: 0 }
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "landing-zone",
      position: { x: 116, y: 0, z: 0 }
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "green-center",
      position: { x: 120, y: 0, z: 0 }
    });
    state = connectRoutingNodes(state, {
      holeId: "hole-1",
      fromNodeId: "routing-node-1",
      toNodeId: "routing-node-2"
    });
    state = connectRoutingNodes(state, {
      holeId: "hole-1",
      fromNodeId: "routing-node-2",
      toNodeId: "routing-node-3"
    });

    const mergePreviewState = selectSpatialEntities(state, [
      createSceneSpatialReference({
        entityType: "routing-node",
        entityId: "routing-node-2",
        holeId: "hole-1"
      })
    ]);
    const mergePreviewSnapshot = buildRendererSceneSnapshot(mergePreviewState);
    const merged = moveRoutingNode(mergePreviewState, "routing-node-2", {
      x: 116,
      z: 0
    });

    expect(
      mergePreviewSnapshot.primitives.some((primitive) => primitive.id.includes("gizmo-routing-merge-")),
    ).toBe(true);
    expect(merged.routingNodes).toHaveLength(2);
    expect(merged.routingSegments).toHaveLength(1);
    expect(merged.routingPaths[0]?.nodeIds).toEqual(["routing-node-1", "routing-node-3"]);
  });

  it("summarizes and polishes route continuity, width, and elevation drift", () => {
    let state = createTestState();
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "tee",
      position: { x: 0, y: 0, z: 0 }
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "landing-zone",
      position: { x: 54, y: 0, z: 12 }
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "green-center",
      position: { x: 120, y: 0, z: 0 }
    });
    state = connectRoutingNodes(state, {
      holeId: "hole-1",
      fromNodeId: "routing-node-1",
      toNodeId: "routing-node-2"
    });
    state = connectRoutingNodes(state, {
      holeId: "hole-1",
      fromNodeId: "routing-node-2",
      toNodeId: "routing-node-3"
    });
    state = adjustRoutingSegmentWidth(state, "routing-segment-1", 18);
    state = moveRoutingNode(state, "routing-node-2", {
      y: 8,
      z: 20
    });

    const continuity = summarizeRoutingContinuity(state);
    const continuitySnapshot = buildRendererSceneSnapshot(state);
    const smoothed = smoothRoutingSegmentShape(state, "routing-segment-1");
    const widthHarmonized = harmonizeRoutingSegmentWidth(smoothed, "routing-segment-1");
    const nodePolished = polishRoutingNodeElevation(widthHarmonized, "routing-node-2");
    const polished = polishRoutingHoleContinuity(nodePolished, "hole-1");
    const polishedContinuity = summarizeRoutingContinuity(polished);

    expect(continuity.widthWatchCount).toBeGreaterThan(0);
    expect(continuity.elevationWatchCount).toBeGreaterThan(0);
    expect(continuity.finishConfidence).toBe("rough");
    expect(continuity.widthHarmonyState).toBe("rough");
    expect(continuity.elevationHarmonyState).toBe("rough");
    expect(continuity.mergeConfidenceState).toBe("watch");
    expect(continuity.completionConfidence).toBe("ready");
    expect(continuity.deliveryConfidence).toMatch(/rough|watch/);
    expect(continuity.completionPercent).toBe(100);
    expect(
      continuitySnapshot.primitives.some((primitive) => primitive.id.startsWith("routing-delivery-confidence-")),
    ).toBe(true);
    expect(polished.routingNodes.find((node) => node.routingNodeId === "routing-node-2")?.position.y).toBeLessThan(8);
    expect(polished.routingSegments[0]?.targetWidthMeters).toBeLessThan(state.routingSegments[0]!.targetWidthMeters);
    expect(polishedContinuity.continuityWatchCount).toBeLessThanOrEqual(continuity.continuityWatchCount);
    expect(polishedContinuity.finishConfidence).toMatch(/watch|ready/);
    expect(polishedContinuity.deliveryConfidence).toMatch(/watch|ready/);
    expect(polishedContinuity.completionPercent).toBe(100);
  });

  it("resolves routing merge clusters for finish-stage route cleanup", () => {
    let state = createTestState();
    state = updateRoutingGuideSettings(state, {
      autoMergeEnabled: true,
      mergeToleranceMeters: 8
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "tee",
      position: { x: 0, y: 0, z: 0 }
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "landing-zone",
      position: { x: 60, y: 0, z: 0 }
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "landing-zone",
      position: { x: 63, y: 0, z: 0 }
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "green-center",
      position: { x: 120, y: 0, z: 0 }
    });
    state = connectRoutingNodes(state, {
      holeId: "hole-1",
      fromNodeId: "routing-node-1",
      toNodeId: "routing-node-2"
    });
    state = connectRoutingNodes(state, {
      holeId: "hole-1",
      fromNodeId: "routing-node-3",
      toNodeId: "routing-node-4"
    });

    const before = summarizeRoutingContinuity(state);
    const resolved = resolveRoutingMergeCandidates(state, "hole-1");
    const after = summarizeRoutingContinuity(resolved);

    expect(before.mergeClusterCount).toBeGreaterThan(0);
    expect(before.unresolvedMergeNodeIds.length).toBeGreaterThan(0);
    expect(resolved.routingNodes.length).toBeLessThan(state.routingNodes.length);
    expect(after.mergeClusterCount).toBeLessThan(before.mergeClusterCount);
    expect(after.unresolvedMergeNodeIds.length).toBeLessThan(before.unresolvedMergeNodeIds.length);
    expect(after.deliveryConfidence).toBe("ready");
  });

  it("reconciles finish-stage route drift into calmer delivery posture", () => {
    let state = createTestState();
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "tee",
      position: { x: 0, y: 0, z: 0 }
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "landing-zone",
      position: { x: 55, y: 9, z: 0 }
    });
    state = addRoutingNodeForHole(state, {
      holeId: "hole-1",
      kind: "green-center",
      position: { x: 120, y: 1, z: 0 }
    });
    state = connectRoutingNodes(state, {
      holeId: "hole-1",
      fromNodeId: "routing-node-1",
      toNodeId: "routing-node-2"
    });
    state = connectRoutingNodes(state, {
      holeId: "hole-1",
      fromNodeId: "routing-node-2",
      toNodeId: "routing-node-3"
    });
    state = adjustRoutingSegmentWidth(state, "routing-segment-2", 18);
    state = adjustRoutingNodeHeight(state, "routing-node-2", 7);

    const before = summarizeRouteFinishReconciliation(state);
    const reconciled = reconcileRoutingHoleFinish(state, "hole-1");
    const after = summarizeRouteFinishReconciliation(reconciled);

    expect(before.unresolvedHoleCount).toBeGreaterThan(0);
    expect(before.holeSummaries[0]?.unresolvedJoinCount).toBeGreaterThan(0);
    expect(after.holeSummaries[0]?.unresolvedJoinCount).toBeLessThan(before.holeSummaries[0]!.unresolvedJoinCount);
    expect(after.overallState === "watch" || after.overallState === "reconciled").toBe(true);
    expect(after.recommendedAction).not.toBe(before.recommendedAction);
  });

  it("stores dismissible builder guidance state for onboarding and recovery", () => {
    const dismissed = dismissBuilderGuide(createTestState(), "placement-pack-flow");
    const restored = restoreBuilderGuides(dismissed);

    expect(dismissed.editingState.dismissedGuideIds).toContain("placement-pack-flow");
    expect(restored.editingState.dismissedGuideIds).toHaveLength(0);
    expect(restored.editingState.showBuilderGuidance).toBe(true);
  });

  it("builds a spatial trust report when authored state drifts", () => {
    const state = createSceneAuthoringState({
      ...createTestState(),
      activeCollectionId: "missing-collection",
      selectionState: {
        ...createTestState().selectionState,
        selectedSpatialEntityRefs: [
          createSceneSpatialReference({
            entityType: "terrain-region",
            entityId: "missing-region",
            holeId: "hole-1"
          })
        ]
      }
    });

    const trust = createSpatialTrustReport(state);

    expect(trust.health).toBe("critical");
    expect(trust.issues.some((issue) => issue.issueId === "missing-active-collection")).toBe(true);
    expect(trust.analysisConfidence).not.toBe("high");
  });
});
