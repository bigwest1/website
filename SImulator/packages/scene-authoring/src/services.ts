import {
  type PlacementAssetDraft,
  type PlacementPreset,
  type RoutingNodeKind,
  type RoutingSegmentKind,
  type SceneryBrushPreset,
  type SurfaceRuleCleanupAuditEntry,
  type SurfaceRuleCleanupDiff,
  type SurfaceRuleCleanupReview,
  type SurfaceRuleDraftSettings,
  type SurfaceRulePreset,
  type TerrainSculptMode,
  type SceneSpatialEntityType,
  type ParentRelationship,
  type PlacementHistoryAction,
  type SceneAuthoringSnapshot,
  type SceneAuthoringState,
  type SceneObjectCategory,
  type ScenePlacementRule,
  type SceneSpatialReference,
  type TerrainGameplayPurpose,
  type TerrainMaterialBlendMode,
  type TerrainModifierKind,
  type Transform,
  type TransformSpace,
  type Vector3
} from "./models";
import {
  createDropZoneArea,
  createFairwayCorridor,
  createGreenZone,
  createHazardZone,
  createPlacementPreset,
  createSurfaceRuleDraftSettings,
  createSurfaceRulePreset,
  createOutOfBoundsZone,
  createPlacementHistoryAction,
  createPlayRouteEnvelope,
  createRoutingNode,
  createRoutingPath,
  createRoutingSegment,
  createLandmarkCorridorBundleLibraryEntry,
  createSceneryBrushPreset,
  createSceneAuthoringSnapshot,
  createSceneGroup,
  createSceneObject,
  createSceneSpatialReference,
  createTeeZone,
  createTerrainPaintStroke,
  createTerrainModifier,
  createTerrainRegion,
  terrainModifierKindForSculptMode,
  createVisibilityCorridor
} from "./create";
import type { RendererInteractionDelta, RendererInteractionTarget } from "./renderer";

export type SceneOutlinerNode = {
  id: string;
  type: "object" | "group";
  label: string;
  category: SceneObjectCategory | "group";
  depth: number;
  locked: boolean;
  visible: boolean;
  selected: boolean;
  layerId: string;
};

export type RoutingGap = {
  holeId: string;
  reason: string;
};

export type InvalidSpatialRelationship = {
  entityType: SceneSpatialReference["entityType"];
  entityId: string;
  detail: string;
};

export type BlockedPlayRouteConflict = {
  holeId: string;
  playRouteEnvelopeId: string;
  blockingSceneObjectIds: string[];
  blockedZoneIds: string[];
};

function trimHistory(state: SceneAuthoringState) {
  return state.historyCursor >= 0
    ? state.placementHistory.slice(0, state.historyCursor + 1)
    : [];
}

function snapshotState(state: SceneAuthoringState): SceneAuthoringSnapshot {
  return createSceneAuthoringSnapshot(state);
}

function restoreFromSnapshot(
  state: SceneAuthoringState,
  snapshot: SceneAuthoringSnapshot,
  historyCursor: number,
): SceneAuthoringState {
  return {
    ...snapshot,
    placementHistory: state.placementHistory,
    historyCursor,
    baselineSnapshot: state.baselineSnapshot
  };
}

function appendHistory(
  state: SceneAuthoringState,
  actionInput: Omit<PlacementHistoryAction, "snapshot">,
): SceneAuthoringState {
  const nextSnapshot = snapshotState(state);
  const nextHistory = [
    ...trimHistory(state),
    createPlacementHistoryAction({
      ...actionInput,
      snapshot: nextSnapshot
    })
  ].slice(-48);

  return {
    ...state,
    placementHistory: nextHistory,
    historyCursor: nextHistory.length - 1
  };
}

function nextId(prefix: string, ids: string[]) {
  return `${prefix}-${ids.length + 1}`;
}

function normalizePresetName(value: string) {
  return value.trim().toLowerCase();
}

function createPresetUsageTimestamp() {
  return new Date().toISOString();
}

function derivePreferredSurfacePurposes(state: SceneAuthoringState) {
  const selectedRegion = state.terrainRegions.find(
    (region) => region.terrainRegionId === state.editingState.selectedTerrainRegionId,
  );
  if (selectedRegion) {
    return [selectedRegion.gameplayPurpose];
  }

  const activeHoleId = state.viewportState.activeHoleId;
  if (!activeHoleId) {
    return [] as TerrainGameplayPurpose[];
  }

  return [...new Set(
    state.terrainRegions
      .filter((region) => region.holeId === activeHoleId)
      .map((region) => region.gameplayPurpose),
  )].slice(0, 3);
}

function deriveOrientationFlags(
  orientationPosture: SurfaceRuleDraftSettings["orientationPosture"],
) {
  return {
    alignToSurfaceNormal: orientationPosture !== "upright",
    keepUpright: orientationPosture !== "surface-follow"
  };
}

function derivePackInfluenceValue(
  packInfluenceMode: SurfaceRuleDraftSettings["packInfluenceMode"],
  suitabilityBias: number,
) {
  const base =
    packInfluenceMode === "pack-led"
      ? 0.84
      : packInfluenceMode === "surface-led"
        ? 0.46
        : 0.68;

  return Math.max(0, Math.min(1, Number((base + (suitabilityBias - 0.5) * 0.18).toFixed(2))));
}

function deriveSlopeLimitDegrees(
  slopeHandlingMode: SurfaceRuleDraftSettings["slopeHandlingMode"],
  slopeLimitDegrees: number,
) {
  const bounded = Math.max(0, Math.min(45, slopeLimitDegrees));
  if (slopeHandlingMode === "strict") {
    return Math.min(bounded, 18);
  }
  if (slopeHandlingMode === "expressive") {
    return Math.max(bounded, 24);
  }
  return bounded;
}

function createSurfaceRuleDraftFromPreset(preset: SurfaceRulePreset): SurfaceRuleDraftSettings {
  return createSurfaceRuleDraftSettings({
    slopeHandlingMode: preset.slopeHandlingMode,
    slopeLimitDegrees: preset.slopeLimitDegrees,
    orientationPosture: preset.orientationPosture,
    preferredSurfacePurposes: preset.preferredSurfacePurposes,
    avoidedSurfacePurposes: preset.avoidedSurfacePurposes,
    preferredPackId: preset.preferredPackId,
    preferredCategory: preset.preferredCategory,
    packInfluenceMode: preset.packInfluenceMode,
    suitabilityBias: preset.suitabilityBias,
    avoidanceBias: preset.avoidanceBias
  });
}

function roughlyEqual(left: number, right: number, tolerance = 0.01) {
  return Math.abs(left - right) <= tolerance;
}

function pointsRoughlyEqual(left: Vector3 | null, right: Vector3 | null, tolerance = 0.2) {
  if (!left || !right) {
    return left === right;
  }

  return (
    roughlyEqual(left.x, right.x, tolerance) &&
    roughlyEqual(left.y, right.y, tolerance) &&
    roughlyEqual(left.z, right.z, tolerance)
  );
}

function planarDistance(left: Vector3, right: Vector3) {
  return Math.hypot(left.x - right.x, left.z - right.z);
}

function createRelationship(
  childId: string,
  childType: ParentRelationship["childType"],
  parentId: string | null,
  parentType: ParentRelationship["parentType"],
): ParentRelationship {
  return {
    relationshipId: `relationship-${childId}`,
    childId,
    childType,
    parentId,
    parentType
  };
}

function hasSpatialEntity(state: SceneAuthoringState, reference: SceneSpatialReference) {
  switch (reference.entityType) {
    case "scene-object":
      return state.sceneObjects.some((sceneObject) => sceneObject.sceneObjectId === reference.entityId);
    case "scene-group":
      return state.sceneGroups.some((sceneGroup) => sceneGroup.groupId === reference.entityId);
    case "terrain-surface":
      return state.terrainSurfaces.some((surface) => surface.terrainSurfaceId === reference.entityId);
    case "terrain-profile":
      return state.terrainProfiles.some((profile) => profile.terrainProfileId === reference.entityId);
    case "terrain-region":
      return state.terrainRegions.some((region) => region.terrainRegionId === reference.entityId);
    case "terrain-modifier":
      return state.terrainModifiers.some((modifier) => modifier.terrainModifierId === reference.entityId);
    case "routing-node":
      return state.routingNodes.some((node) => node.routingNodeId === reference.entityId);
    case "routing-segment":
      return state.routingSegments.some((segment) => segment.routingSegmentId === reference.entityId);
    case "routing-path":
      return state.routingPaths.some((path) => path.routingPathId === reference.entityId);
    case "fairway-corridor":
      return state.fairwayCorridors.some((corridor) => corridor.fairwayCorridorId === reference.entityId);
    case "green-zone":
      return state.greenZones.some((zone) => zone.greenZoneId === reference.entityId);
    case "tee-zone":
      return state.teeZones.some((zone) => zone.teeZoneId === reference.entityId);
    case "hazard-zone":
      return state.hazardZones.some((zone) => zone.hazardZoneId === reference.entityId);
    case "out-of-bounds-zone":
      return state.outOfBoundsZones.some((zone) => zone.outOfBoundsZoneId === reference.entityId);
    case "drop-zone-area":
      return state.dropZoneAreas.some((zone) => zone.dropZoneAreaId === reference.entityId);
    case "visibility-corridor":
      return state.visibilityCorridors.some((corridor) => corridor.visibilityCorridorId === reference.entityId);
    case "play-route-envelope":
      return state.playRouteEnvelopes.some((envelope) => envelope.playRouteEnvelopeId === reference.entityId);
  }
}

export function getActiveSceneCollection(state: SceneAuthoringState) {
  if (!state.activeCollectionId) {
    return null;
  }

  return state.sceneCollections.find((collection) => collection.collectionId === state.activeCollectionId) ?? null;
}

export function getSelectedSceneObjects(state: SceneAuthoringState) {
  const selectedIds = new Set(state.selectionState.selectedObjectIds);
  return state.sceneObjects.filter((sceneObject) => selectedIds.has(sceneObject.sceneObjectId));
}

export function getSelectedSceneGroups(state: SceneAuthoringState) {
  const selectedIds = new Set(state.selectionState.selectedGroupIds);
  return state.sceneGroups.filter((sceneGroup) => selectedIds.has(sceneGroup.groupId));
}

export function buildSceneOutliner(state: SceneAuthoringState): SceneOutlinerNode[] {
  const activeCollection = getActiveSceneCollection(state);
  const collectionId = activeCollection?.collectionId ?? null;
  const relationshipsByParent = new Map<string, ParentRelationship[]>();
  const rootKey = "collection-root";

  for (const relationship of state.parentRelationships) {
    if (collectionId) {
      const belongsToActiveCollection =
        (relationship.childType === "object" &&
          state.sceneObjects.some(
            (sceneObject) =>
              sceneObject.sceneObjectId === relationship.childId &&
              sceneObject.collectionId === collectionId,
          )) ||
        (relationship.childType === "group" &&
          state.sceneGroups.some(
            (sceneGroup) => sceneGroup.groupId === relationship.childId && sceneGroup.collectionId === collectionId,
          ));

      if (!belongsToActiveCollection) {
        continue;
      }
    }

    const key = relationship.parentId ? `${relationship.parentType}:${relationship.parentId}` : rootKey;
    const entries = relationshipsByParent.get(key) ?? [];
    entries.push(relationship);
    relationshipsByParent.set(key, entries);
  }

  const walk = (parentKey: string, depth: number): SceneOutlinerNode[] => {
    const relationships = relationshipsByParent.get(parentKey) ?? [];

    return relationships.flatMap((relationship) => {
      if (relationship.childType === "object") {
        const sceneObject = state.sceneObjects.find((candidate) => candidate.sceneObjectId === relationship.childId);

        if (!sceneObject) {
          return [];
        }

        return [
          {
            id: sceneObject.sceneObjectId,
            type: "object" as const,
            label: sceneObject.name,
            category: sceneObject.category,
            depth,
            locked: sceneObject.locked,
            visible: sceneObject.visible,
            selected: state.selectionState.selectedObjectIds.includes(sceneObject.sceneObjectId),
            layerId: sceneObject.placementLayerId
          }
        ];
      }

      const group = state.sceneGroups.find((candidate) => candidate.groupId === relationship.childId);

      if (!group) {
        return [];
      }

      const children: SceneOutlinerNode[] = walk(`group:${group.groupId}`, depth + 1);
      return [
        {
          id: group.groupId,
          type: "group" as const,
          label: group.name,
          category: "group" as const,
          depth,
          locked: group.locked,
          visible: group.visible,
          selected: state.selectionState.selectedGroupIds.includes(group.groupId),
          layerId: group.placementLayerId
        },
        ...children
      ];
    });
  };

  return walk(rootKey, 0);
}

export function selectSceneObjects(
  state: SceneAuthoringState,
  objectIds: string[],
  options?: {
    append?: boolean;
    includeGroups?: string[];
  },
) {
  const selectedObjectIds = options?.append
    ? Array.from(new Set([...state.selectionState.selectedObjectIds, ...objectIds]))
    : objectIds;
  const selectedGroupIds = options?.append
    ? Array.from(new Set([...state.selectionState.selectedGroupIds, ...(options?.includeGroups ?? [])]))
    : (options?.includeGroups ?? []);

  return appendHistory(
    {
      ...state,
      selectionState: {
        ...state.selectionState,
        selectedObjectIds,
        selectedGroupIds,
        selectedSpatialEntityRefs: [],
        primarySelectionId: objectIds[0] ?? options?.includeGroups?.[0] ?? null
      }
    },
    {
      actionId: `placement-action-select-${state.placementHistory.length + 1}`,
      actionType: "select",
      summary:
        selectedObjectIds.length + selectedGroupIds.length > 1
          ? "Updated multi-selection"
          : "Updated active selection",
      targetIds: [...selectedObjectIds, ...selectedGroupIds],
      createdAt: new Date().toISOString()
    },
  );
}

export function selectSpatialEntities(
  state: SceneAuthoringState,
  references: SceneSpatialReference[],
  options?: {
    append?: boolean;
  },
) {
  const selectedSpatialEntityRefs = options?.append
    ? [
        ...state.selectionState.selectedSpatialEntityRefs,
        ...references.filter(
          (reference) =>
            !state.selectionState.selectedSpatialEntityRefs.some(
              (candidate) =>
                candidate.entityType === reference.entityType && candidate.entityId === reference.entityId,
            ),
        )
      ]
    : references;

  return appendHistory(
    {
      ...state,
      selectionState: {
        ...state.selectionState,
        selectedObjectIds: [],
        selectedGroupIds: [],
        selectedSpatialEntityRefs,
        primarySelectionId: references[0]?.entityId ?? null
      }
    },
    {
      actionId: `placement-action-spatial-select-${state.placementHistory.length + 1}`,
      actionType: "select",
      summary:
        selectedSpatialEntityRefs.length > 1
          ? "Updated spatial multi-selection"
          : "Updated spatial selection",
      targetIds: selectedSpatialEntityRefs.map((reference) => reference.entityId),
      createdAt: new Date().toISOString()
    },
  );
}

export function clearSceneSelection(state: SceneAuthoringState) {
  return {
    ...state,
    selectionState: {
      ...state.selectionState,
      selectedObjectIds: [],
      selectedGroupIds: [],
      selectedSpatialEntityRefs: [],
      primarySelectionId: null
    }
  };
}

export function setHoveredSpatialEntity(
  state: SceneAuthoringState,
  reference: SceneSpatialReference | null,
) {
  return {
    ...state,
    selectionState: {
      ...state.selectionState,
      hoveredObjectId: reference?.entityType === "scene-object" ? reference.entityId : null,
      hoveredSpatialEntityRef: reference
    }
  };
}

export function setPlacementMode(
  state: SceneAuthoringState,
  placementMode: SceneAuthoringState["placementMode"],
) {
  return {
    ...state,
    placementMode
  };
}

export function setGizmoMode(
  state: SceneAuthoringState,
  gizmoMode: SceneAuthoringState["gizmoMode"],
) {
  return {
    ...state,
    gizmoMode
  };
}

export function setTransformSpace(
  state: SceneAuthoringState,
  transformSpace: TransformSpace,
) {
  return appendHistory(
    {
      ...state,
      selectionState: {
        ...state.selectionState,
        transformSpace
      }
    },
    {
      actionId: `placement-action-transform-space-${state.placementHistory.length + 1}`,
      actionType: "transform-space",
      summary: `Switched to ${transformSpace} transform space`,
      targetIds: [],
      createdAt: new Date().toISOString()
    },
  );
}

export function updateSnapSettings(
  state: SceneAuthoringState,
  updater:
    | SceneAuthoringState["snapSettings"]
    | ((snapSettings: SceneAuthoringState["snapSettings"]) => SceneAuthoringState["snapSettings"]),
) {
  const nextSnapSettings = typeof updater === "function" ? updater(state.snapSettings) : updater;

  return appendHistory(
    {
      ...state,
      snapSettings: nextSnapSettings
    },
    {
      actionId: `placement-action-snap-${state.placementHistory.length + 1}`,
      actionType: "snap-update",
      summary: "Updated snapping controls",
      targetIds: [],
      createdAt: new Date().toISOString()
    },
  );
}

export function savePlacementPreset(
  state: SceneAuthoringState,
  input: {
    name: string;
    description?: string;
    preferredPackId?: string | null;
    preferredCategory?: PlacementPreset["preferredCategory"];
  },
) {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    return state;
  }

  const existingPreset =
    state.editingState.placementPresets.find(
      (preset) => normalizePresetName(preset.name) === normalizePresetName(trimmedName),
    ) ?? null;
  const nextPreset = createPlacementPreset({
    presetId:
      existingPreset?.presetId ??
      nextId("placement-preset", state.editingState.placementPresets.map((preset) => preset.presetId)),
    name: trimmedName,
    description:
      input.description ??
      existingPreset?.description ??
      "Saved placement posture and snap/orientation behavior for repeated world-building passes.",
    favorite: existingPreset?.favorite ?? false,
    useCount: existingPreset?.useCount ?? 0,
    lastUsedAt: existingPreset?.lastUsedAt ?? null,
    defaultPlacementMode: state.placementMode,
    preferredPackId:
      input.preferredPackId ??
      state.editingState.activePlacementDraft?.packId ??
      state.editingState.sceneryBrush.activePackId,
    preferredCategory:
      input.preferredCategory ??
      state.editingState.activePlacementDraft?.category ??
      state.selectionState.filterCategories[0] ??
      null,
    gridEnabled: state.snapSettings.gridEnabled,
    rotationSnapEnabled: state.snapSettings.rotationSnapEnabled,
    rotationStepDegrees: state.snapSettings.rotationStepDegrees,
    surfaceSnapEnabled: state.snapSettings.surfaceSnapEnabled,
    terrainSnapEnabled: state.snapSettings.terrainSnapEnabled,
    alignToSurfaceNormal: state.snapSettings.alignToSurfaceNormal,
    keepUpright: state.snapSettings.keepUpright
  });

  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        placementPresets: existingPreset
          ? state.editingState.placementPresets.map((preset) =>
              preset.presetId === existingPreset.presetId ? nextPreset : preset,
            )
          : [...state.editingState.placementPresets, nextPreset]
      }
    },
    {
      actionId: `placement-action-placement-preset-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary: existingPreset ? `Updated placement preset ${trimmedName}` : `Saved placement preset ${trimmedName}`,
      targetIds: [nextPreset.presetId],
      createdAt: new Date().toISOString()
    },
  );
}

export function applyPlacementPreset(
  state: SceneAuthoringState,
  presetId: string,
) {
  const preset = state.editingState.placementPresets.find((candidate) => candidate.presetId === presetId);
  if (!preset) {
    return state;
  }
  const appliedAt = createPresetUsageTimestamp();

  return appendHistory(
    {
      ...state,
      placementMode: preset.defaultPlacementMode,
      snapSettings: {
        ...state.snapSettings,
        gridEnabled: preset.gridEnabled,
        rotationSnapEnabled: preset.rotationSnapEnabled,
        rotationStepDegrees: preset.rotationStepDegrees,
        surfaceSnapEnabled: preset.surfaceSnapEnabled,
        terrainSnapEnabled: preset.terrainSnapEnabled,
        alignToSurfaceNormal: preset.alignToSurfaceNormal,
        keepUpright: preset.keepUpright
      },
      selectionState: {
        ...state.selectionState,
        filterCategories: preset.preferredCategory ? [preset.preferredCategory] : state.selectionState.filterCategories
      },
      viewportState: {
        ...state.viewportState,
        authoringMode: "placement"
      },
      editingState: {
        ...state.editingState,
        placementPresets: state.editingState.placementPresets.map((candidate) =>
          candidate.presetId === presetId
            ? {
                ...candidate,
                useCount: candidate.useCount + 1,
                lastUsedAt: appliedAt
              }
            : candidate,
        ),
        sceneryBrush: {
          ...state.editingState.sceneryBrush,
          activePackId: preset.preferredPackId ?? state.editingState.sceneryBrush.activePackId
        }
      }
    },
    {
      actionId: `placement-action-placement-preset-apply-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary: `Applied placement preset ${preset.name}`,
      targetIds: [presetId],
      createdAt: new Date().toISOString()
    },
  );
}

export function togglePlacementPresetFavorite(
  state: SceneAuthoringState,
  presetId: string,
) {
  const preset = state.editingState.placementPresets.find((candidate) => candidate.presetId === presetId);
  if (!preset) {
    return state;
  }

  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        placementPresets: state.editingState.placementPresets.map((candidate) =>
          candidate.presetId === presetId
            ? {
                ...candidate,
                favorite: !candidate.favorite
              }
            : candidate,
        )
      }
    },
    {
      actionId: `placement-action-placement-preset-favorite-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary: `${preset.favorite ? "Removed" : "Marked"} placement preset ${preset.name} ${preset.favorite ? "from" : "as"} favorite`,
      targetIds: [presetId],
      createdAt: new Date().toISOString()
    },
  );
}

export function saveSurfaceRulePreset(
  state: SceneAuthoringState,
  input: {
    name: string;
    description?: string;
    preferredSurfacePurposes?: TerrainGameplayPurpose[];
    preferredPackId?: string | null;
    preferredCategory?: SurfaceRulePreset["preferredCategory"];
  },
) {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    return state;
  }

  const existingPreset =
    state.editingState.surfaceRulePresets.find(
      (preset) => normalizePresetName(preset.name) === normalizePresetName(trimmedName),
    ) ?? null;
  const nextPreset = createSurfaceRulePreset({
    presetId:
      existingPreset?.presetId ??
      nextId("surface-rule-preset", state.editingState.surfaceRulePresets.map((preset) => preset.presetId)),
    name: trimmedName,
    description:
      input.description ??
      existingPreset?.description ??
      "Saved surface-aware placement rule set for repeated dressing and structure passes.",
    favorite: existingPreset?.favorite ?? false,
    useCount: existingPreset?.useCount ?? 0,
    lastUsedAt: existingPreset?.lastUsedAt ?? null,
    surfaceSnapEnabled: state.snapSettings.surfaceSnapEnabled,
    terrainSnapEnabled: state.snapSettings.terrainSnapEnabled,
    alignToSurfaceNormal: state.snapSettings.alignToSurfaceNormal,
    keepUpright: state.snapSettings.keepUpright,
    slopeHandlingMode: state.editingState.surfaceRuleDraft.slopeHandlingMode,
    orientationPosture: state.editingState.surfaceRuleDraft.orientationPosture,
    slopeLimitDegrees: state.editingState.surfaceRuleDraft.slopeLimitDegrees,
    preferredSurfacePurposes:
      input.preferredSurfacePurposes ??
      state.editingState.surfaceRuleDraft.preferredSurfacePurposes ??
      derivePreferredSurfacePurposes(state),
    avoidedSurfacePurposes: state.editingState.surfaceRuleDraft.avoidedSurfacePurposes,
    preferredPackId:
      input.preferredPackId ??
      state.editingState.surfaceRuleDraft.preferredPackId ??
      state.editingState.activePlacementDraft?.packId ??
      state.editingState.sceneryBrush.activePackId,
    preferredCategory:
      input.preferredCategory ??
      state.editingState.surfaceRuleDraft.preferredCategory ??
      state.editingState.activePlacementDraft?.category ??
      state.selectionState.filterCategories[0] ??
      null,
    packInfluenceMode: state.editingState.surfaceRuleDraft.packInfluenceMode,
    suitabilityBias: state.editingState.surfaceRuleDraft.suitabilityBias,
    avoidanceBias: state.editingState.surfaceRuleDraft.avoidanceBias,
    activePackInfluence: state.editingState.sceneryBrush.activePackInfluence,
    avoidPlayableCoreStrength: state.editingState.sceneryBrush.avoidPlayableCoreStrength,
    placementRules: state.editingState.sceneryBrush.placementRules
  });

  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        surfaceRulePresets: existingPreset
          ? state.editingState.surfaceRulePresets.map((preset) =>
              preset.presetId === existingPreset.presetId ? nextPreset : preset,
            )
          : [...state.editingState.surfaceRulePresets, nextPreset]
      }
    },
    {
      actionId: `placement-action-surface-rule-preset-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary: existingPreset ? `Updated surface rule preset ${trimmedName}` : `Saved surface rule preset ${trimmedName}`,
      targetIds: [nextPreset.presetId],
      createdAt: new Date().toISOString()
    },
  );
}

export function applySurfaceRulePreset(
  state: SceneAuthoringState,
  presetId: string,
) {
  const preset = state.editingState.surfaceRulePresets.find((candidate) => candidate.presetId === presetId);
  if (!preset) {
    return state;
  }
  const appliedAt = createPresetUsageTimestamp();

  return appendHistory(
    {
      ...state,
      snapSettings: {
        ...state.snapSettings,
        surfaceSnapEnabled: preset.surfaceSnapEnabled,
        terrainSnapEnabled: preset.terrainSnapEnabled,
        alignToSurfaceNormal: preset.alignToSurfaceNormal,
        keepUpright: preset.keepUpright
      },
      selectionState: {
        ...state.selectionState,
        filterCategories: preset.preferredCategory ? [preset.preferredCategory] : state.selectionState.filterCategories
      },
      viewportState: {
        ...state.viewportState,
        authoringMode: "placement"
      },
      editingState: {
        ...state.editingState,
        surfaceRuleDraft: createSurfaceRuleDraftFromPreset(preset),
        surfaceRulePresets: state.editingState.surfaceRulePresets.map((candidate) =>
          candidate.presetId === presetId
            ? {
                ...candidate,
                useCount: candidate.useCount + 1,
                lastUsedAt: appliedAt
              }
            : candidate,
        ),
        sceneryBrush: {
          ...state.editingState.sceneryBrush,
          activePackId: preset.preferredPackId ?? state.editingState.sceneryBrush.activePackId,
          activePackInfluence: preset.activePackInfluence,
          avoidPlayableCoreStrength: preset.avoidPlayableCoreStrength,
          slopeLimitDegrees: preset.slopeLimitDegrees,
          placementRules: preset.placementRules
        }
      }
    },
    {
      actionId: `placement-action-surface-rule-preset-apply-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary: `Applied surface rule preset ${preset.name}`,
      targetIds: [presetId],
      createdAt: new Date().toISOString()
    },
  );
}

export function updateSurfaceRuleDraft(
  state: SceneAuthoringState,
  patch: Partial<SurfaceRuleDraftSettings>,
) {
  const nextDraft = createSurfaceRuleDraftSettings({
    ...state.editingState.surfaceRuleDraft,
    ...patch,
    preferredSurfacePurposes:
      patch.preferredSurfacePurposes ?? state.editingState.surfaceRuleDraft.preferredSurfacePurposes,
    avoidedSurfacePurposes:
      patch.avoidedSurfacePurposes ?? state.editingState.surfaceRuleDraft.avoidedSurfacePurposes
  });
  const orientationFlags = deriveOrientationFlags(nextDraft.orientationPosture);

  return appendHistory(
    {
      ...state,
      snapSettings: {
        ...state.snapSettings,
        surfaceSnapEnabled: true,
        terrainSnapEnabled: true,
        alignToSurfaceNormal: orientationFlags.alignToSurfaceNormal,
        keepUpright: orientationFlags.keepUpright
      },
      selectionState: {
        ...state.selectionState,
        filterCategories: nextDraft.preferredCategory ? [nextDraft.preferredCategory] : state.selectionState.filterCategories
      },
      editingState: {
        ...state.editingState,
        surfaceRuleDraft: nextDraft,
        sceneryBrush: {
          ...state.editingState.sceneryBrush,
          activePackId: nextDraft.preferredPackId ?? state.editingState.sceneryBrush.activePackId,
          activePackInfluence: derivePackInfluenceValue(nextDraft.packInfluenceMode, nextDraft.suitabilityBias),
          avoidPlayableCoreStrength: nextDraft.avoidanceBias,
          slopeLimitDegrees: deriveSlopeLimitDegrees(nextDraft.slopeHandlingMode, nextDraft.slopeLimitDegrees)
        }
      }
    },
    {
      actionId: `placement-action-surface-rule-draft-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary: "Updated surface-rule authoring posture",
      targetIds: [],
      createdAt: new Date().toISOString()
    },
  );
}

export function resolveSurfaceRuleConflicts(
  state: SceneAuthoringState,
  strategy: "favor-placement" | "favor-guardrails" | "balance-active-hole" = "balance-active-hole",
) {
  const draft = state.editingState.surfaceRuleDraft;
  const preferredSet = new Set(draft.preferredSurfacePurposes);
  const avoidedSet = new Set(draft.avoidedSurfacePurposes);
  const overlappingPurposes = [...preferredSet].filter((purpose) => avoidedSet.has(purpose));

  if (overlappingPurposes.length === 0) {
    return state;
  }

  const activeHoleId = state.viewportState.activeHoleId;
  const dominantPurposeForActiveHole =
    activeHoleId === null
      ? null
      : [...state.terrainRegions
          .filter((region) => region.holeId === activeHoleId)
          .reduce((counts, region) => {
            counts.set(region.gameplayPurpose, (counts.get(region.gameplayPurpose) ?? 0) + 1);
            return counts;
          }, new Map<TerrainGameplayPurpose, number>())
          .entries()]
          .sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
  let nextPreferred = [...preferredSet];
  let nextAvoided = [...avoidedSet];

  switch (strategy) {
    case "favor-placement":
      nextAvoided = nextAvoided.filter((purpose) => !preferredSet.has(purpose));
      break;
    case "favor-guardrails":
      nextPreferred = nextPreferred.filter((purpose) => !avoidedSet.has(purpose));
      break;
    case "balance-active-hole": {
      for (const purpose of overlappingPurposes) {
        const keepPreferred =
          dominantPurposeForActiveHole !== null
            ? purpose === dominantPurposeForActiveHole
            : draft.suitabilityBias >= draft.avoidanceBias;
        if (keepPreferred) {
          nextAvoided = nextAvoided.filter((candidate) => candidate !== purpose);
        } else {
          nextPreferred = nextPreferred.filter((candidate) => candidate !== purpose);
        }
      }
      break;
    }
  }

  if (nextPreferred.length === 0) {
    const fallbackPurpose =
      dominantPurposeForActiveHole ??
      state.terrainRegions.find((region) => region.holeId !== null)?.gameplayPurpose ??
      draft.preferredSurfacePurposes[0] ??
      draft.avoidedSurfacePurposes[0] ??
      null;
    if (fallbackPurpose) {
      nextPreferred = [fallbackPurpose];
      nextAvoided = nextAvoided.filter((purpose) => purpose !== fallbackPurpose);
    }
  }

  const nextDraft = createSurfaceRuleDraftSettings({
    ...draft,
    preferredSurfacePurposes: nextPreferred,
    avoidedSurfacePurposes: nextAvoided
  });
  const orientationFlags = deriveOrientationFlags(nextDraft.orientationPosture);
  const resolutionLabel =
    strategy === "favor-placement"
      ? "Resolved surface-rule conflicts by favoring placement support."
      : strategy === "favor-guardrails"
        ? "Resolved surface-rule conflicts by favoring guarded surfaces."
        : "Resolved surface-rule conflicts by balancing the active hole."

  return appendHistory(
    {
      ...state,
      snapSettings: {
        ...state.snapSettings,
        surfaceSnapEnabled: true,
        terrainSnapEnabled: true,
        alignToSurfaceNormal: orientationFlags.alignToSurfaceNormal,
        keepUpright: orientationFlags.keepUpright
      },
      selectionState: {
        ...state.selectionState,
        filterCategories: nextDraft.preferredCategory ? [nextDraft.preferredCategory] : state.selectionState.filterCategories
      },
      editingState: {
        ...state.editingState,
        surfaceRuleDraft: nextDraft,
        sceneryBrush: {
          ...state.editingState.sceneryBrush,
          activePackId: nextDraft.preferredPackId ?? state.editingState.sceneryBrush.activePackId,
          activePackInfluence: derivePackInfluenceValue(nextDraft.packInfluenceMode, nextDraft.suitabilityBias),
          avoidPlayableCoreStrength: nextDraft.avoidanceBias,
          slopeLimitDegrees: deriveSlopeLimitDegrees(nextDraft.slopeHandlingMode, nextDraft.slopeLimitDegrees)
        }
      }
    },
    {
      actionId: `placement-action-surface-rule-conflict-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary: resolutionLabel,
      targetIds: overlappingPurposes,
      createdAt: new Date().toISOString()
    },
  );
}

function deriveActiveHoleRouteVector(state: SceneAuthoringState, holeId: string | null) {
  if (!holeId) {
    return { x: 0, z: 1 };
  }

  const routingPath = state.routingPaths.find((path) => path.holeId === holeId) ?? null;
  const teeNode = routingPath
    ? state.routingNodes.find((node) => node.routingNodeId === routingPath.teeNodeId) ?? null
    : state.routingNodes.find((node) => node.holeId === holeId) ?? null;
  const greenNode = routingPath
    ? state.routingNodes.find((node) => node.routingNodeId === routingPath.greenNodeId) ?? null
    : [...state.routingNodes].reverse().find((node) => node.holeId === holeId) ?? null;

  if (!teeNode || !greenNode) {
    return { x: 0, z: 1 };
  }

  const deltaX = greenNode.position.x - teeNode.position.x;
  const deltaZ = greenNode.position.z - teeNode.position.z;
  const length = Math.hypot(deltaX, deltaZ);
  if (length <= 0.001) {
    return { x: 0, z: 1 };
  }

  return {
    x: deltaX / length,
    z: deltaZ / length
  };
}

function yawDegreesFromRouteVector(vector: { x: number; z: number }) {
  return Number((Math.atan2(vector.x, vector.z) * (180 / Math.PI)).toFixed(2));
}

function getSelectedLandmarkObject(state: SceneAuthoringState) {
  const selectedIds = new Set(state.selectionState.selectedObjectIds);
  return (
    state.sceneObjects.find(
      (sceneObject) =>
        selectedIds.has(sceneObject.sceneObjectId) && sceneObject.category === "landmark",
    ) ?? null
  );
}

function addSceneObjectTag(tags: string[], tag: string) {
  return Array.from(new Set([...tags, tag]));
}

function appendUniqueNote(note: string, addition: string) {
  const trimmedNote = note.trim();
  const trimmedAddition = addition.trim();
  if (trimmedAddition.length === 0) {
    return trimmedNote;
  }
  if (trimmedNote.toLowerCase().includes(trimmedAddition.toLowerCase())) {
    return trimmedNote;
  }
  return trimmedNote.length === 0 ? trimmedAddition : `${trimmedNote} ${trimmedAddition}`;
}

export function restageSelectedLandmark(
  state: SceneAuthoringState,
  action:
    | "stage-landmark-support"
    | "open-view-corridor"
    | "reinforce-route-view"
    | "calm-presentation-view",
) {
  const landmark = getSelectedLandmarkObject(state);
  if (!landmark || landmark.locked) {
    return state;
  }

  const holeId = state.viewportState.activeHoleId ?? state.editingState.pendingPlacementHoleId ?? null;
  const routeVector = deriveActiveHoleRouteVector(state, holeId);
  const lateralVector = {
    x: -routeVector.z,
    z: routeVector.x
  };
  const targetRotationY = yawDegreesFromRouteVector(routeVector);
  let nextPosition = landmark.transform.position;
  let nextScale = landmark.transform.scale;
  let nextRotation = landmark.transform.rotation;
  let nextTag = "landmark-restaged";
  let summary = "Restaged the selected landmark.";

  switch (action) {
    case "stage-landmark-support":
      nextPosition = {
        x: landmark.transform.position.x + routeVector.x * 4,
        y: landmark.transform.position.y + 1.5,
        z: landmark.transform.position.z + routeVector.z * 4
      };
      nextScale = {
        x: clamp(landmark.transform.scale.x * 1.08, 0.2, 64),
        y: clamp(landmark.transform.scale.y * 1.08, 0.2, 64),
        z: clamp(landmark.transform.scale.z * 1.08, 0.2, 64)
      };
      nextRotation = {
        ...landmark.transform.rotation,
        y: targetRotationY
      };
      nextTag = "landmark-staged";
      summary = "Restaged the selected landmark for stronger route support.";
      break;
    case "open-view-corridor":
      nextPosition = {
        x: landmark.transform.position.x + lateralVector.x * 6,
        y: landmark.transform.position.y + 0.6,
        z: landmark.transform.position.z + lateralVector.z * 6
      };
      nextScale = {
        x: clamp(landmark.transform.scale.x * 0.96, 0.2, 64),
        y: clamp(landmark.transform.scale.y * 0.96, 0.2, 64),
        z: clamp(landmark.transform.scale.z * 0.96, 0.2, 64)
      };
      nextTag = "landmark-view-opened";
      summary = "Shifted the selected landmark to reopen its view corridor.";
      break;
    case "reinforce-route-view":
      nextPosition = {
        x: landmark.transform.position.x + routeVector.x * 2,
        y: landmark.transform.position.y + 0.8,
        z: landmark.transform.position.z + routeVector.z * 2
      };
      nextScale = {
        x: clamp(landmark.transform.scale.x * 1.05, 0.2, 64),
        y: clamp(landmark.transform.scale.y * 1.05, 0.2, 64),
        z: clamp(landmark.transform.scale.z * 1.05, 0.2, 64)
      };
      nextRotation = {
        ...landmark.transform.rotation,
        y: targetRotationY
      };
      nextTag = "landmark-route-reinforced";
      summary = "Reinforced the selected landmark for stronger route-view support.";
      break;
    case "calm-presentation-view":
      nextPosition = {
        x: landmark.transform.position.x - routeVector.x * 1.5,
        y: landmark.transform.position.y - 0.2,
        z: landmark.transform.position.z - routeVector.z * 1.5
      };
      nextScale = {
        x: clamp(landmark.transform.scale.x * 0.94, 0.2, 64),
        y: clamp(landmark.transform.scale.y * 0.94, 0.2, 64),
        z: clamp(landmark.transform.scale.z * 0.94, 0.2, 64)
      };
      nextRotation = {
        ...landmark.transform.rotation,
        y: targetRotationY
      };
      nextTag = "landmark-presentation-calmed";
      summary = "Calmed the selected landmark for a cleaner presentation view.";
      break;
  }

  return appendHistory(
    {
      ...state,
      sceneObjects: state.sceneObjects.map((sceneObject) =>
        sceneObject.sceneObjectId === landmark.sceneObjectId
          ? {
              ...sceneObject,
              visible: true,
              transform: {
                ...sceneObject.transform,
                position: nextPosition,
                rotation: nextRotation,
                scale: nextScale
              },
              tags: addSceneObjectTag(sceneObject.tags, nextTag)
            }
          : sceneObject,
      )
    },
    {
      actionId: `placement-action-landmark-restage-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary,
      targetIds: [landmark.sceneObjectId, ...(holeId ? [holeId] : [])],
      createdAt: new Date().toISOString()
    },
  );
}

export function applyLandmarkViewCorridorTool(
  state: SceneAuthoringState,
  action:
    | "widen-view-corridor"
    | "shift-landmark-support"
    | "rebalance-route-corridor"
    | "calm-presentation-corridor",
) {
  const holeId = state.viewportState.activeHoleId ?? state.editingState.pendingPlacementHoleId ?? null;
  if (!holeId) {
    return state;
  }

  const targetFairwayCorridor = state.fairwayCorridors.find((corridor) => corridor.holeId === holeId) ?? null;
  const targetVisibilityCorridor = state.visibilityCorridors.find((corridor) => corridor.holeId === holeId) ?? null;
  if (!targetFairwayCorridor && !targetVisibilityCorridor) {
    return state;
  }
  const selectedLandmark = getSelectedLandmarkObject(state);
  const routeVector = deriveActiveHoleRouteVector(state, holeId);
  const lateralVector = {
    x: -routeVector.z,
    z: routeVector.x,
  };
  const targetRotationY = yawDegreesFromRouteVector(routeVector);

  const fairwayWidthDelta =
    action === "widen-view-corridor"
      ? 2
      : action === "rebalance-route-corridor"
        ? 1.5
        : action === "calm-presentation-corridor"
          ? -1.25
          : 1;
  const visibilityWidthDelta =
    action === "widen-view-corridor"
      ? 4
      : action === "rebalance-route-corridor"
        ? 2.5
        : action === "calm-presentation-corridor"
          ? -1.5
          : 2;
  const corridorNote =
    action === "widen-view-corridor"
      ? "Widened the landmark corridor for clearer presentation views."
      : action === "shift-landmark-support"
        ? "Rebalanced corridor support around the landmark read."
        : action === "rebalance-route-corridor"
          ? "Rebalanced the route corridor to reinforce landmark support."
          : "Calmed the presentation corridor so the landmark read stays deliberate.";
  const summary =
    action === "widen-view-corridor"
      ? "Widened the active hole view corridor."
      : action === "shift-landmark-support"
        ? "Shifted the active hole toward stronger landmark corridor support."
        : action === "rebalance-route-corridor"
          ? "Rebalanced the active hole route corridor."
          : "Calmed the active hole presentation corridor.";
  const landmarkPosition =
    selectedLandmark && !selectedLandmark.locked
      ? action === "widen-view-corridor"
        ? {
            x: selectedLandmark.transform.position.x + lateralVector.x * 4,
            y: selectedLandmark.transform.position.y + 0.6,
            z: selectedLandmark.transform.position.z + lateralVector.z * 4,
          }
        : action === "shift-landmark-support"
          ? {
              x: selectedLandmark.transform.position.x + routeVector.x * 4,
              y: selectedLandmark.transform.position.y + 1,
              z: selectedLandmark.transform.position.z + routeVector.z * 4,
            }
          : action === "rebalance-route-corridor"
            ? {
                x: selectedLandmark.transform.position.x + routeVector.x * 2 + lateralVector.x * 1.5,
                y: selectedLandmark.transform.position.y + 0.6,
                z: selectedLandmark.transform.position.z + routeVector.z * 2 + lateralVector.z * 1.5,
              }
            : {
                x: selectedLandmark.transform.position.x - routeVector.x * 1.5,
                y: selectedLandmark.transform.position.y - 0.2,
                z: selectedLandmark.transform.position.z - routeVector.z * 1.5,
              }
      : null;
  const landmarkScale =
    selectedLandmark && !selectedLandmark.locked
      ? action === "widen-view-corridor"
        ? {
            x: clamp(selectedLandmark.transform.scale.x * 0.96, 0.2, 64),
            y: clamp(selectedLandmark.transform.scale.y * 0.96, 0.2, 64),
            z: clamp(selectedLandmark.transform.scale.z * 0.96, 0.2, 64),
          }
        : action === "shift-landmark-support"
          ? {
              x: clamp(selectedLandmark.transform.scale.x * 1.08, 0.2, 64),
              y: clamp(selectedLandmark.transform.scale.y * 1.08, 0.2, 64),
              z: clamp(selectedLandmark.transform.scale.z * 1.08, 0.2, 64),
            }
          : action === "rebalance-route-corridor"
            ? {
                x: clamp(selectedLandmark.transform.scale.x * 1.04, 0.2, 64),
                y: clamp(selectedLandmark.transform.scale.y * 1.04, 0.2, 64),
                z: clamp(selectedLandmark.transform.scale.z * 1.04, 0.2, 64),
              }
            : {
                x: clamp(selectedLandmark.transform.scale.x * 0.94, 0.2, 64),
                y: clamp(selectedLandmark.transform.scale.y * 0.94, 0.2, 64),
                z: clamp(selectedLandmark.transform.scale.z * 0.94, 0.2, 64),
              }
      : null;
  const landmarkTag =
    action === "widen-view-corridor"
      ? "landmark-corridor-opened"
      : action === "shift-landmark-support"
        ? "landmark-corridor-staged"
        : action === "rebalance-route-corridor"
          ? "landmark-corridor-rebalanced"
          : "landmark-corridor-calmed";

  return appendHistory(
    {
      ...state,
      fairwayCorridors: state.fairwayCorridors.map((corridor) =>
        corridor.holeId === holeId
          ? {
              ...corridor,
              averageWidthMeters: clamp(corridor.averageWidthMeters + fairwayWidthDelta, 14, 48),
              note: appendUniqueNote(corridor.note, corridorNote),
            }
          : corridor,
      ),
      visibilityCorridors: state.visibilityCorridors.map((corridor) =>
        corridor.holeId === holeId
          ? {
              ...corridor,
              minimumWidthMeters: clamp(corridor.minimumWidthMeters + visibilityWidthDelta, 12, 42),
              note: appendUniqueNote(corridor.note, corridorNote),
            }
          : corridor,
      ),
      sceneObjects: state.sceneObjects.map((sceneObject) =>
        selectedLandmark && !selectedLandmark.locked && sceneObject.sceneObjectId === selectedLandmark.sceneObjectId
          ? {
              ...sceneObject,
              transform: {
                ...sceneObject.transform,
                position: landmarkPosition ?? sceneObject.transform.position,
                rotation: {
                  ...sceneObject.transform.rotation,
                  y: targetRotationY,
                },
                scale: landmarkScale ?? sceneObject.transform.scale,
              },
              tags: addSceneObjectTag(sceneObject.tags, landmarkTag),
            }
          : sceneObject,
      ),
    },
    {
      actionId: `placement-action-landmark-corridor-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary,
      targetIds: [
        holeId,
        ...(targetFairwayCorridor ? [targetFairwayCorridor.fairwayCorridorId] : []),
        ...(targetVisibilityCorridor ? [targetVisibilityCorridor.visibilityCorridorId] : []),
        ...(selectedLandmark && !selectedLandmark.locked ? [selectedLandmark.sceneObjectId] : []),
      ],
      createdAt: new Date().toISOString(),
    },
  );
}

export function automateSurfaceRuleCleanup(
  state: SceneAuthoringState,
  mode: "balance-course" | "expand-coverage" | "guard-playable-core" = "balance-course",
) {
  const draft = state.editingState.surfaceRuleDraft;
  const relevantRegions = state.terrainRegions.filter((region) => region.holeId !== null);
  if (relevantRegions.length === 0) {
    return state;
  }

  const preferredSet = new Set(draft.preferredSurfacePurposes);
  const avoidedSet = new Set(draft.avoidedSurfacePurposes);
  const overlappingPurposes = [...preferredSet].filter((purpose) => avoidedSet.has(purpose));
  const activeHoleId = state.viewportState.activeHoleId;
  const dominantPurposeForActiveHole =
    activeHoleId === null
      ? null
      : [...relevantRegions
          .filter((region) => region.holeId === activeHoleId)
          .reduce((counts, region) => {
            counts.set(region.gameplayPurpose, (counts.get(region.gameplayPurpose) ?? 0) + 1);
            return counts;
          }, new Map<TerrainGameplayPurpose, number>())
          .entries()]
          .sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
  let nextPreferred = [...preferredSet];
  let nextAvoided = [...avoidedSet];

  if (mode === "expand-coverage") {
    nextAvoided = nextAvoided.filter((purpose) => !preferredSet.has(purpose));
  } else if (mode === "guard-playable-core") {
    nextPreferred = nextPreferred.filter((purpose) => !avoidedSet.has(purpose));
  } else {
    for (const purpose of overlappingPurposes) {
      const keepPreferred =
        dominantPurposeForActiveHole !== null
          ? purpose === dominantPurposeForActiveHole
          : draft.suitabilityBias >= draft.avoidanceBias;
      if (keepPreferred) {
        nextAvoided = nextAvoided.filter((candidate) => candidate !== purpose);
      } else {
        nextPreferred = nextPreferred.filter((candidate) => candidate !== purpose);
      }
    }
  }

  const uncoveredPurposeCounts = relevantRegions
    .filter(
      (region) =>
        !nextPreferred.includes(region.gameplayPurpose) && !nextAvoided.includes(region.gameplayPurpose),
    )
    .reduce((counts, region) => {
      counts.set(region.gameplayPurpose, (counts.get(region.gameplayPurpose) ?? 0) + 1);
      return counts;
    }, new Map<TerrainGameplayPurpose, number>());
  const uncoveredPurposes = [...uncoveredPurposeCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([purpose]) => purpose);

  if (mode !== "guard-playable-core") {
    for (const purpose of uncoveredPurposes.slice(0, 2)) {
      nextAvoided = nextAvoided.filter((candidate) => candidate !== purpose);
      if (!nextPreferred.includes(purpose)) {
        nextPreferred.push(purpose);
      }
    }
  }

  if (mode !== "expand-coverage") {
    const guardablePurposeCounts = relevantRegions
      .filter((region) =>
        ["hazard", "out-of-bounds", "support", "preview", "scenery"].includes(region.gameplayPurpose),
      )
      .reduce((counts, region) => {
        counts.set(region.gameplayPurpose, (counts.get(region.gameplayPurpose) ?? 0) + 1);
        return counts;
      }, new Map<TerrainGameplayPurpose, number>());
    const guardablePurposes = [...guardablePurposeCounts.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([purpose]) => purpose);

    for (const purpose of guardablePurposes.slice(0, 2)) {
      if (!nextPreferred.includes(purpose) && !nextAvoided.includes(purpose)) {
        nextAvoided.push(purpose);
      }
    }
  }

  if (nextPreferred.length === 0) {
    const fallbackPurpose =
      dominantPurposeForActiveHole ??
      relevantRegions[0]?.gameplayPurpose ??
      draft.preferredSurfacePurposes[0] ??
      draft.avoidedSurfacePurposes[0] ??
      null;
    if (fallbackPurpose) {
      nextPreferred = [fallbackPurpose];
      nextAvoided = nextAvoided.filter((purpose) => purpose !== fallbackPurpose);
    }
  }

  nextPreferred = Array.from(new Set(nextPreferred));
  nextAvoided = Array.from(new Set(nextAvoided)).filter((purpose) => !nextPreferred.includes(purpose));

  const nextDraft = createSurfaceRuleDraftSettings({
    ...draft,
    preferredSurfacePurposes: nextPreferred,
    avoidedSurfacePurposes: nextAvoided,
    slopeHandlingMode:
      mode === "expand-coverage"
        ? "adaptive"
        : mode === "guard-playable-core"
          ? "strict"
          : draft.slopeHandlingMode,
    orientationPosture:
      mode === "guard-playable-core" ? "hybrid" : draft.orientationPosture,
    packInfluenceMode:
      mode === "expand-coverage"
        ? "surface-led"
        : mode === "guard-playable-core"
          ? "balanced"
          : draft.packInfluenceMode,
    suitabilityBias:
      mode === "expand-coverage"
        ? Math.max(draft.suitabilityBias, 0.72)
        : mode === "guard-playable-core"
          ? Math.max(draft.suitabilityBias, 0.58)
          : Math.max(draft.suitabilityBias, 0.64),
    avoidanceBias:
      mode === "expand-coverage"
        ? Math.max(draft.avoidanceBias, 0.48)
        : mode === "guard-playable-core"
          ? Math.max(draft.avoidanceBias, 0.8)
          : Math.max(draft.avoidanceBias, 0.66)
  });
  const orientationFlags = deriveOrientationFlags(nextDraft.orientationPosture);
  const cleanupSummary =
    mode === "expand-coverage"
      ? `Expanded coverage into ${Math.min(2, uncoveredPurposes.length)} uncovered terrain-purpose lanes.`
      : mode === "guard-playable-core"
        ? `Raised guardrails around ${Math.min(2, nextAvoided.length)} terrain-purpose lanes.`
        : `Balanced conflicts and coverage across ${Math.min(2, uncoveredPurposes.length)} terrain-purpose lanes.`;

  return appendHistory(
    {
      ...state,
      snapSettings: {
        ...state.snapSettings,
        surfaceSnapEnabled: true,
        terrainSnapEnabled: true,
        alignToSurfaceNormal: orientationFlags.alignToSurfaceNormal,
        keepUpright: orientationFlags.keepUpright
      },
      selectionState: {
        ...state.selectionState,
        filterCategories: nextDraft.preferredCategory ? [nextDraft.preferredCategory] : state.selectionState.filterCategories
      },
      editingState: {
        ...state.editingState,
        surfaceRuleDraft: nextDraft,
        sceneryBrush: {
          ...state.editingState.sceneryBrush,
          activePackId: nextDraft.preferredPackId ?? state.editingState.sceneryBrush.activePackId,
          activePackInfluence: derivePackInfluenceValue(nextDraft.packInfluenceMode, nextDraft.suitabilityBias),
          avoidPlayableCoreStrength: nextDraft.avoidanceBias,
          slopeLimitDegrees: deriveSlopeLimitDegrees(nextDraft.slopeHandlingMode, nextDraft.slopeLimitDegrees)
        }
      }
    },
    {
      actionId: `placement-action-surface-rule-cleanup-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary: cleanupSummary,
      targetIds: [...nextPreferred, ...nextAvoided],
      createdAt: new Date().toISOString()
    },
  );
}

export function applyLandmarkCorridorSupportKit(
  state: SceneAuthoringState,
  kit:
    | "open-view-corridor-kit"
    | "anchor-landmark-support-kit"
    | "rebalance-route-support-kit"
    | "calm-presentation-corridor-kit",
) {
  const mappedAction =
    kit === "open-view-corridor-kit"
      ? "widen-view-corridor"
      : kit === "anchor-landmark-support-kit"
        ? "shift-landmark-support"
        : kit === "rebalance-route-support-kit"
          ? "rebalance-route-corridor"
          : "calm-presentation-corridor";

  return applyLandmarkViewCorridorTool(state, mappedAction);
}

export function applyLandmarkCorridorSupportKitComposition(
  state: SceneAuthoringState,
  action:
    | "compose-open-support-bundle"
    | "compose-route-support-bundle"
    | "compose-presentation-calm-bundle"
    | "compose-hybrid-support-bundle",
) {
  const actions =
    action === "compose-open-support-bundle"
      ? (["open-view-corridor-kit", "anchor-landmark-support-kit"] as const)
      : action === "compose-route-support-bundle"
        ? (["anchor-landmark-support-kit", "rebalance-route-support-kit"] as const)
        : action === "compose-presentation-calm-bundle"
          ? (["rebalance-route-support-kit", "calm-presentation-corridor-kit"] as const)
          : ([
              "open-view-corridor-kit",
              "anchor-landmark-support-kit",
              "rebalance-route-support-kit",
              "calm-presentation-corridor-kit",
            ] as const);

  return actions.reduce(
    (nextState, nextAction) => applyLandmarkCorridorSupportKit(nextState, nextAction),
    state,
  );
}

export function saveLandmarkCorridorBundleLibraryEntry(
  state: SceneAuthoringState,
  input: {
    name: string;
    description?: string;
    bundleAction:
      | "compose-open-support-bundle"
      | "compose-route-support-bundle"
      | "compose-presentation-calm-bundle"
      | "compose-hybrid-support-bundle";
  },
) {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    return state;
  }

  const existingEntry =
    state.editingState.landmarkCorridorBundleLibrary.find(
      (entry) => normalizePresetName(entry.name) === normalizePresetName(trimmedName),
    ) ?? null;
  const nextEntry = createLandmarkCorridorBundleLibraryEntry({
    bundleId:
      existingEntry?.bundleId ??
      nextId(
        "corridor-bundle-library",
        state.editingState.landmarkCorridorBundleLibrary.map((entry) => entry.bundleId),
      ),
    name: trimmedName,
    description:
      input.description ??
      existingEntry?.description ??
      "Reusable landmark corridor bundle for final presentation cleanup and calmer route support.",
    bundleAction: input.bundleAction,
    favorite: existingEntry?.favorite ?? false,
    useCount: existingEntry?.useCount ?? 0,
    lastUsedAt: existingEntry?.lastUsedAt ?? null,
  });

  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        landmarkCorridorBundleLibrary: existingEntry
          ? state.editingState.landmarkCorridorBundleLibrary.map((entry) =>
              entry.bundleId === existingEntry.bundleId ? nextEntry : entry,
            )
          : [nextEntry, ...state.editingState.landmarkCorridorBundleLibrary].slice(0, 12),
      },
    },
    {
      actionId: `placement-action-corridor-bundle-library-save-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary: existingEntry
        ? `Updated corridor bundle library entry ${trimmedName}`
        : `Saved corridor bundle library entry ${trimmedName}`,
      targetIds: [nextEntry.bundleId],
      createdAt: new Date().toISOString(),
    },
  );
}

export function applyLandmarkCorridorBundleLibraryEntry(
  state: SceneAuthoringState,
  bundleId: string,
) {
  const entry = state.editingState.landmarkCorridorBundleLibrary.find((candidate) => candidate.bundleId === bundleId);
  if (!entry) {
    return state;
  }

  const appliedAt = createPresetUsageTimestamp();
  const nextState = applyLandmarkCorridorSupportKitComposition(state, entry.bundleAction);
  return {
    ...nextState,
    editingState: {
      ...nextState.editingState,
      landmarkCorridorBundleLibrary: nextState.editingState.landmarkCorridorBundleLibrary.map((candidate) =>
        candidate.bundleId === bundleId
          ? {
              ...candidate,
              useCount: candidate.useCount + 1,
              lastUsedAt: appliedAt,
            }
          : candidate,
      ),
    },
  };
}

export function toggleLandmarkCorridorBundleLibraryFavorite(
  state: SceneAuthoringState,
  bundleId: string,
) {
  const entry = state.editingState.landmarkCorridorBundleLibrary.find((candidate) => candidate.bundleId === bundleId);
  if (!entry) {
    return state;
  }

  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        landmarkCorridorBundleLibrary: state.editingState.landmarkCorridorBundleLibrary.map((candidate) =>
          candidate.bundleId === bundleId
            ? {
                ...candidate,
                favorite: !candidate.favorite,
              }
            : candidate,
        ),
      },
    },
    {
      actionId: `placement-action-corridor-bundle-library-favorite-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary: `${entry.favorite ? "Removed" : "Marked"} corridor bundle ${entry.name} ${entry.favorite ? "from" : "as"} favorite`,
      targetIds: [bundleId],
      createdAt: new Date().toISOString(),
    },
  );
}

type SurfaceRuleCleanupDiffSnapshot = {
  conflictingRegionCount: number;
  uncoveredRegionCount: number;
  guardedRegionCount: number;
  roughHoleCount: number;
  readyHoleCount: number;
};

function summarizeSurfaceRuleCleanupDiffSnapshot(state: SceneAuthoringState): SurfaceRuleCleanupDiffSnapshot {
  const draft = state.editingState.surfaceRuleDraft;
  const preferredPurposes = new Set(draft.preferredSurfacePurposes);
  const avoidedPurposes = new Set(draft.avoidedSurfacePurposes);
  const relevantRegions = state.terrainRegions.filter((region) => region.holeId !== null);
  const holeIds = [...new Set(relevantRegions.map((region) => region.holeId!))];
  let conflictingRegionCount = 0;
  let uncoveredRegionCount = 0;
  let guardedRegionCount = 0;
  let roughHoleCount = 0;
  let readyHoleCount = 0;

  for (const holeId of holeIds) {
    const regions = relevantRegions.filter((region) => region.holeId === holeId);
    let activeRegionCount = 0;
    let guardedHoleRegionCount = 0;
    let uncoveredHoleRegionCount = 0;
    let conflictingHoleRegionCount = 0;

    for (const region of regions) {
      const preferred = preferredPurposes.has(region.gameplayPurpose);
      const avoided = avoidedPurposes.has(region.gameplayPurpose);

      if (preferred && avoided) {
        conflictingHoleRegionCount += 1;
      } else if (preferred) {
        activeRegionCount += 1;
      } else if (avoided) {
        guardedHoleRegionCount += 1;
      } else {
        uncoveredHoleRegionCount += 1;
      }
    }

    conflictingRegionCount += conflictingHoleRegionCount;
    uncoveredRegionCount += uncoveredHoleRegionCount;
    guardedRegionCount += guardedHoleRegionCount;

    if (conflictingHoleRegionCount > 0 || activeRegionCount === 0) {
      roughHoleCount += 1;
    } else if (uncoveredHoleRegionCount === 0 && guardedHoleRegionCount > 0) {
      readyHoleCount += 1;
    }
  }

  return {
    conflictingRegionCount,
    uncoveredRegionCount,
    guardedRegionCount,
    roughHoleCount,
    readyHoleCount,
  };
}

function createSurfaceRuleCleanupDiff(
  before: SurfaceRuleCleanupDiffSnapshot,
  after: SurfaceRuleCleanupDiffSnapshot,
): SurfaceRuleCleanupDiff {
  const conflictReduction = before.conflictingRegionCount - after.conflictingRegionCount;
  const coverageGain = before.uncoveredRegionCount - after.uncoveredRegionCount;
  const guardedGain = after.guardedRegionCount - before.guardedRegionCount;
  const readyHoleGain = after.readyHoleCount - before.readyHoleCount;

  return {
    conflictingRegionCountBefore: before.conflictingRegionCount,
    conflictingRegionCountAfter: after.conflictingRegionCount,
    uncoveredRegionCountBefore: before.uncoveredRegionCount,
    uncoveredRegionCountAfter: after.uncoveredRegionCount,
    guardedRegionCountBefore: before.guardedRegionCount,
    guardedRegionCountAfter: after.guardedRegionCount,
    roughHoleCountBefore: before.roughHoleCount,
    roughHoleCountAfter: after.roughHoleCount,
    readyHoleCountBefore: before.readyHoleCount,
    readyHoleCountAfter: after.readyHoleCount,
    diffSummary: `Conflicts ${before.conflictingRegionCount} -> ${after.conflictingRegionCount}, uncovered ${before.uncoveredRegionCount} -> ${after.uncoveredRegionCount}, guarded ${before.guardedRegionCount} -> ${after.guardedRegionCount}, ready holes ${before.readyHoleCount} -> ${after.readyHoleCount}.${conflictReduction > 0 || coverageGain > 0 || guardedGain > 0 || readyHoleGain > 0 ? " The proposed cleanup is reducing drift." : " The proposed cleanup still needs a closer review."}`,
  };
}

function createSurfaceRuleCleanupAuditEntry(input: {
  entryId: string;
  recordedAt: string;
  entryType: SurfaceRuleCleanupAuditEntry["entryType"];
  status: SurfaceRuleCleanupAuditEntry["status"];
  approvalDepth?: SurfaceRuleCleanupAuditEntry["approvalDepth"];
  summary: string;
  diffSummary: string;
}): SurfaceRuleCleanupAuditEntry {
  return {
    entryId: input.entryId,
    recordedAt: input.recordedAt,
    entryType: input.entryType,
    status: input.status,
    approvalDepth: input.approvalDepth ?? null,
    summary: input.summary,
    diffSummary: input.diffSummary,
  };
}

export function createSurfaceRuleCleanupReview(
  state: SceneAuthoringState,
  mode: "balance-course" | "expand-coverage" | "guard-playable-core" = "balance-course",
) {
  const proposed = automateSurfaceRuleCleanup(state, mode);
  const proposedDraft = proposed.editingState.surfaceRuleDraft;
  const proposedSnapSettings = proposed.snapSettings;
  const proposedBrushSettings = proposed.editingState.sceneryBrush;
  const unchanged =
    JSON.stringify(proposedDraft) === JSON.stringify(state.editingState.surfaceRuleDraft) &&
    JSON.stringify(proposedSnapSettings) === JSON.stringify(state.snapSettings) &&
    JSON.stringify(proposedBrushSettings) === JSON.stringify(state.editingState.sceneryBrush);
  if (unchanged) {
    return state;
  }

  const beforeDiffSnapshot = summarizeSurfaceRuleCleanupDiffSnapshot(state);
  const afterDiffSnapshot = summarizeSurfaceRuleCleanupDiffSnapshot(proposed);
  const cleanupDiff = createSurfaceRuleCleanupDiff(beforeDiffSnapshot, afterDiffSnapshot);
  const improvesConflictPosture =
    cleanupDiff.conflictingRegionCountAfter < cleanupDiff.conflictingRegionCountBefore ||
    cleanupDiff.uncoveredRegionCountAfter < cleanupDiff.uncoveredRegionCountBefore ||
    cleanupDiff.readyHoleCountAfter > cleanupDiff.readyHoleCountBefore;

  const affectedHoleIds = Array.from(
    new Set(
      state.terrainRegions
        .map((region) => region.holeId)
        .filter((holeId): holeId is string => holeId !== null),
    ),
  );
  const confidenceState =
    !improvesConflictPosture
      ? "rough"
      : mode === "balance-course" && affectedHoleIds.length <= 2
        ? "clean"
        : mode === "guard-playable-core"
          ? "watch"
          : "watch";
  const requiresBroadApproval = affectedHoleIds.length >= 6 || mode === "balance-course";
  const proposedAction =
    mode === "expand-coverage"
      ? "Review the broader coverage expansion and approve it only if the added terrain purposes still feel intentional."
      : mode === "guard-playable-core"
        ? "Review the new guard rails around playable surfaces before approving the cleanup pass."
        : "Review the course-balance cleanup pass and approve it if the broader terrain-purpose posture now reads calmer.";
  const createdAt = new Date().toISOString();
  const review: SurfaceRuleCleanupReview = {
    reviewId: `surface-rule-cleanup-review-${state.editingState.surfaceRuleCleanupReviews.length + 1}`,
    createdAt,
    reviewedAt: null,
    mode,
    status: "pending",
    confidenceState,
    requiresBroadApproval,
    approvalDepth: null,
    affectedHoleIds,
    summary:
      mode === "expand-coverage"
        ? "Prepared a cleanup review that expands uncovered terrain-purpose support."
        : mode === "guard-playable-core"
          ? "Prepared a cleanup review that tightens guard rails around playable surfaces."
          : "Prepared a cleanup review that balances conflicts and broader course coverage.",
    proposedAction,
    cleanupDiff,
    auditTrail: [
      createSurfaceRuleCleanupAuditEntry({
        entryId: `surface-rule-cleanup-review-${state.editingState.surfaceRuleCleanupReviews.length + 1}-audit-created`,
        recordedAt: createdAt,
        entryType: "created",
        status: "pending",
        summary:
          mode === "expand-coverage"
            ? "Created a cleanup review for broader coverage support."
            : mode === "guard-playable-core"
              ? "Created a cleanup review for playable-core guard rails."
              : "Created a cleanup review for broader course balancing.",
        diffSummary: cleanupDiff.diffSummary,
      }),
    ],
    proposedDraft,
    proposedSnapSettings,
    proposedBrushSettings,
  };

  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        surfaceRuleCleanupReviews: [
          review,
          ...state.editingState.surfaceRuleCleanupReviews,
        ].slice(0, 8),
      },
    },
    {
      actionId: `placement-action-surface-rule-cleanup-review-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary: "Prepared a surface-rule cleanup review.",
      targetIds: affectedHoleIds,
      createdAt: new Date().toISOString(),
    },
  );
}

export function reviewSurfaceRuleCleanupPass(
  state: SceneAuthoringState,
  reviewId: string,
  decision: "approve-focused" | "approve-regional" | "approve-course-wide" | "reject",
) {
  const review = state.editingState.surfaceRuleCleanupReviews.find((candidate) => candidate.reviewId === reviewId);
  if (!review || review.status !== "pending") {
    return state;
  }

  const reviewedAt = new Date().toISOString();
  const approving = decision !== "reject";
  const approvalDepth =
    decision === "approve-focused"
      ? "focused"
      : decision === "approve-regional"
        ? "regional"
        : decision === "approve-course-wide"
          ? "course-wide"
          : null;

  return appendHistory(
    {
      ...state,
      snapSettings: approving ? review.proposedSnapSettings : state.snapSettings,
      editingState: {
        ...state.editingState,
        surfaceRuleDraft: approving ? review.proposedDraft : state.editingState.surfaceRuleDraft,
        sceneryBrush: approving ? review.proposedBrushSettings : state.editingState.sceneryBrush,
        surfaceRuleCleanupReviews: state.editingState.surfaceRuleCleanupReviews.map((candidate) =>
          candidate.reviewId === reviewId
            ? {
                ...candidate,
                status: approving ? "approved" : "rejected",
                approvalDepth,
                reviewedAt,
                auditTrail: [
                  createSurfaceRuleCleanupAuditEntry({
                    entryId: `${candidate.reviewId}-audit-${candidate.auditTrail.length + 1}`,
                    recordedAt: reviewedAt,
                    entryType: approving ? "approved" : "rejected",
                    status: approving ? "approved" : "rejected",
                    approvalDepth,
                    summary:
                      decision === "approve-course-wide"
                        ? "Approved the cleanup review for course-wide rollout."
                        : decision === "approve-regional"
                          ? "Approved the cleanup review for a regional rollout."
                          : decision === "approve-focused"
                            ? "Approved the cleanup review as a focused pass."
                            : "Rejected the cleanup review after diff comparison.",
                    diffSummary: candidate.cleanupDiff.diffSummary,
                  }),
                  ...candidate.auditTrail,
                ].slice(0, 12),
              }
            : candidate,
        ),
      },
    },
    {
      actionId: `placement-action-surface-rule-cleanup-${decision}-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary:
        decision === "approve-course-wide"
          ? "Approved the surface-rule cleanup review for the full course."
          : decision === "approve-regional"
            ? "Approved the surface-rule cleanup review at regional depth."
            : decision === "approve-focused"
              ? "Approved the surface-rule cleanup review as a focused pass."
              : "Rejected the surface-rule cleanup review.",
      targetIds: review.affectedHoleIds,
      createdAt: reviewedAt,
    },
  );
}

export function toggleSurfaceRulePresetFavorite(
  state: SceneAuthoringState,
  presetId: string,
) {
  const preset = state.editingState.surfaceRulePresets.find((candidate) => candidate.presetId === presetId);
  if (!preset) {
    return state;
  }

  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        surfaceRulePresets: state.editingState.surfaceRulePresets.map((candidate) =>
          candidate.presetId === presetId
            ? {
                ...candidate,
                favorite: !candidate.favorite
              }
            : candidate,
        )
      }
    },
    {
      actionId: `placement-action-surface-rule-preset-favorite-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary: `${preset.favorite ? "Removed" : "Marked"} surface rule preset ${preset.name} ${preset.favorite ? "from" : "as"} favorite`,
      targetIds: [presetId],
      createdAt: new Date().toISOString()
    },
  );
}

export function updateViewportState(
  state: SceneAuthoringState,
  updater:
    | SceneAuthoringState["viewportState"]
    | ((viewportState: SceneAuthoringState["viewportState"]) => SceneAuthoringState["viewportState"]),
) {
  const nextViewportState =
    typeof updater === "function" ? updater(state.viewportState) : updater;

  return appendHistory(
    {
      ...state,
      viewportState: nextViewportState
    },
    {
      actionId: `placement-action-viewport-${state.placementHistory.length + 1}`,
      actionType: "viewport-update",
      summary: "Updated viewport posture",
      targetIds: [],
      createdAt: new Date().toISOString()
    },
  );
}

export function syncViewportRuntimeState(
  state: SceneAuthoringState,
  patch: Partial<SceneAuthoringState["viewportState"]>,
) {
  return {
    ...state,
    viewportState: {
      ...state.viewportState,
      ...patch
    }
  };
}

export function syncViewportCamera(
  state: SceneAuthoringState,
  patch: Partial<SceneAuthoringState["viewportState"]["camera"]>,
) {
  return {
    ...state,
    viewportState: {
      ...state.viewportState,
      camera: {
        ...state.viewportState.camera,
        ...patch
      }
    }
  };
}

export function panViewportCamera(
  state: SceneAuthoringState,
  delta: {
    x?: number;
    z?: number;
  },
) {
  return syncViewportCamera(state, {
    target: {
      ...state.viewportState.camera.target,
      x: state.viewportState.camera.target.x + (delta.x ?? 0),
      z: state.viewportState.camera.target.z + (delta.z ?? 0)
    }
  });
}

export function orbitViewportCamera(
  state: SceneAuthoringState,
  delta: {
    yawDegrees?: number;
    pitchDegrees?: number;
  },
) {
  return syncViewportCamera(state, {
    yawDegrees: state.viewportState.camera.yawDegrees + (delta.yawDegrees ?? 0),
    pitchDegrees: clamp(state.viewportState.camera.pitchDegrees + (delta.pitchDegrees ?? 0), 20, 85)
  });
}

export function focusViewportOnReference(
  state: SceneAuthoringState,
  reference: SceneSpatialReference,
) {
  const position = resolveSpatialReferencePosition(state, reference);
  if (!position) {
    return state;
  }

  return syncViewportCamera(state, {
    target: {
      x: position.x,
      y: position.y,
      z: position.z
    }
  });
}

export function syncViewportInteractionPipeline(
  state: SceneAuthoringState,
  patch: Partial<SceneAuthoringState["viewportState"]["interactionPipeline"]>,
) {
  return {
    ...state,
    viewportState: {
      ...state.viewportState,
      interactionPipeline: {
        ...state.viewportState.interactionPipeline,
        ...patch
      }
    }
  };
}

export function updateSceneObjectTransform(
  state: SceneAuthoringState,
  sceneObjectId: string,
  transform: Transform,
) {
  return appendHistory(
    {
      ...state,
      sceneObjects: state.sceneObjects.map((sceneObject) =>
        sceneObject.sceneObjectId === sceneObjectId
          ? {
              ...sceneObject,
              transform
            }
          : sceneObject,
      ),
      viewportState: {
        ...state.viewportState,
        interactionPipeline: {
          ...state.viewportState.interactionPipeline,
          draggingEntityId: sceneObjectId,
          draggingEntityType: "scene-object",
          pendingActionLabel: `Transform ${sceneObjectId}`,
          state: "dragging"
        }
      }
    },
    {
      actionId: `placement-action-transform-${state.placementHistory.length + 1}`,
      actionType: "move",
      summary: `Updated transform for ${sceneObjectId}`,
      targetIds: [sceneObjectId],
      createdAt: new Date().toISOString()
    },
  );
}

export function moveSceneObjectByDelta(
  state: SceneAuthoringState,
  sceneObjectId: string,
  delta: Partial<Vector3>,
) {
  const sceneObject = state.sceneObjects.find((candidate) => candidate.sceneObjectId === sceneObjectId);
  if (!sceneObject) {
    return state;
  }

  return updateSceneObjectTransform(state, sceneObjectId, {
    ...sceneObject.transform,
    position: {
      x: sceneObject.transform.position.x + (delta.x ?? 0),
      y: sceneObject.transform.position.y + (delta.y ?? 0),
      z: sceneObject.transform.position.z + (delta.z ?? 0)
    }
  });
}

export function rotateSceneObjectByDegrees(
  state: SceneAuthoringState,
  sceneObjectId: string,
  deltaDegrees: number,
) {
  const sceneObject = state.sceneObjects.find((candidate) => candidate.sceneObjectId === sceneObjectId);
  if (!sceneObject) {
    return state;
  }

  return appendHistory(
    {
      ...state,
      sceneObjects: state.sceneObjects.map((candidate) =>
        candidate.sceneObjectId === sceneObjectId
          ? {
              ...candidate,
              transform: {
                ...candidate.transform,
                rotation: {
                  ...candidate.transform.rotation,
                  y: candidate.transform.rotation.y + deltaDegrees
                }
              }
            }
          : candidate,
      )
    },
    {
      actionId: `placement-action-rotate-${state.placementHistory.length + 1}`,
      actionType: "rotate",
      summary: `Rotated ${sceneObject.name}`,
      targetIds: [sceneObjectId],
      createdAt: new Date().toISOString()
    },
  );
}

export function scaleSceneObjectUniform(
  state: SceneAuthoringState,
  sceneObjectId: string,
  scaleFactor: number,
) {
  const sceneObject = state.sceneObjects.find((candidate) => candidate.sceneObjectId === sceneObjectId);
  if (!sceneObject) {
    return state;
  }

  return appendHistory(
    {
      ...state,
      sceneObjects: state.sceneObjects.map((candidate) =>
        candidate.sceneObjectId === sceneObjectId
          ? {
              ...candidate,
              transform: {
                ...candidate.transform,
                scale: {
                  x: clamp(candidate.transform.scale.x * scaleFactor, 0.2, 64),
                  y: clamp(candidate.transform.scale.y * scaleFactor, 0.2, 64),
                  z: clamp(candidate.transform.scale.z * scaleFactor, 0.2, 64)
                }
              }
            }
          : candidate,
      )
    },
    {
      actionId: `placement-action-scale-${state.placementHistory.length + 1}`,
      actionType: "scale",
      summary: `Scaled ${sceneObject.name}`,
      targetIds: [sceneObjectId],
      createdAt: new Date().toISOString()
    },
  );
}

export function duplicateSceneObjects(state: SceneAuthoringState, objectIds?: string[]) {
  const idsToDuplicate = objectIds ?? state.selectionState.selectedObjectIds;
  const sourceObjects = state.sceneObjects.filter((sceneObject) => idsToDuplicate.includes(sceneObject.sceneObjectId));

  if (sourceObjects.length === 0) {
    return state;
  }

  const duplicates = sourceObjects.map((sceneObject, index) =>
    createSceneObject({
      ...sceneObject,
      sceneObjectId: `${sceneObject.sceneObjectId}-copy-${state.sceneObjects.length + index + 1}`,
      name: `${sceneObject.name} Copy`,
      transform: {
        ...sceneObject.transform,
        position: {
          x: sceneObject.transform.position.x + 4,
          y: sceneObject.transform.position.y,
          z: sceneObject.transform.position.z + 4
        }
      }
    }),
  );

  return appendHistory(
    {
      ...state,
      sceneObjects: [...state.sceneObjects, ...duplicates],
      selectionState: {
        ...state.selectionState,
        selectedObjectIds: duplicates.map((sceneObject) => sceneObject.sceneObjectId),
        selectedGroupIds: [],
        selectedSpatialEntityRefs: [],
        primarySelectionId: duplicates[0]?.sceneObjectId ?? null
      }
    },
    {
      actionId: `placement-action-duplicate-${state.placementHistory.length + 1}`,
      actionType: "duplicate",
      summary: `Duplicated ${duplicates.length} scene object${duplicates.length === 1 ? "" : "s"}`,
      targetIds: duplicates.map((sceneObject) => sceneObject.sceneObjectId),
      createdAt: new Date().toISOString()
    },
  );
}

export function groupSceneObjects(
  state: SceneAuthoringState,
  options?: {
    groupName?: string;
    layerId?: string;
  },
) {
  const selectedObjects = getSelectedSceneObjects(state);

  if (selectedObjects.length < 2) {
    return state;
  }

  const activeCollection = getActiveSceneCollection(state);

  if (!activeCollection) {
    return state;
  }

  const layerId = options?.layerId ?? selectedObjects[0]?.placementLayerId ?? activeCollection.defaultLayerId;
  const groupId = nextId("group", state.sceneGroups.map((group) => group.groupId));
  const pivot = selectedObjects.reduce(
    (accumulator, sceneObject) => ({
      x: accumulator.x + sceneObject.transform.position.x,
      y: accumulator.y + sceneObject.transform.position.y,
      z: accumulator.z + sceneObject.transform.position.z
    }),
    { x: 0, y: 0, z: 0 },
  );
  const nextGroup = createSceneGroup({
    groupId,
    collectionId: activeCollection.collectionId,
    name: options?.groupName ?? "Placement Group",
    placementLayerId: layerId,
    pivot: {
      x: pivot.x / selectedObjects.length,
      y: pivot.y / selectedObjects.length,
      z: pivot.z / selectedObjects.length
    }
  });
  const targetIds = selectedObjects.map((sceneObject) => sceneObject.sceneObjectId);
  const filteredRelationships = state.parentRelationships.filter(
    (relationship) => !targetIds.includes(relationship.childId),
  );
  const nextRelationships = [
    ...filteredRelationships,
    createRelationship(groupId, "group", null, "collection"),
    ...targetIds.map((sceneObjectId) => createRelationship(sceneObjectId, "object", groupId, "group"))
  ];

  return appendHistory(
    {
      ...state,
      sceneGroups: [...state.sceneGroups, nextGroup],
      parentRelationships: nextRelationships,
      selectionState: {
        ...state.selectionState,
        selectedObjectIds: [],
        selectedGroupIds: [groupId],
        selectedSpatialEntityRefs: [],
        primarySelectionId: groupId
      }
    },
    {
      actionId: `placement-action-group-${state.placementHistory.length + 1}`,
      actionType: "group",
      summary: `Grouped ${targetIds.length} objects into ${nextGroup.name}`,
      targetIds: [groupId, ...targetIds],
      createdAt: new Date().toISOString()
    },
  );
}

export function ungroupSceneGroup(state: SceneAuthoringState, groupId?: string) {
  const targetGroupId = groupId ?? state.selectionState.selectedGroupIds[0];

  if (!targetGroupId) {
    return state;
  }

  const group = state.sceneGroups.find((candidate) => candidate.groupId === targetGroupId);

  if (!group) {
    return state;
  }

  const childRelationships = state.parentRelationships.filter(
    (relationship) => relationship.parentId === group.groupId && relationship.parentType === "group",
  );
  const nextRelationships = state.parentRelationships
    .filter(
      (relationship) =>
        relationship.childId !== group.groupId && relationship.parentId !== group.groupId,
    )
    .concat(
      childRelationships.map((relationship) =>
        createRelationship(relationship.childId, relationship.childType, null, "collection"),
      ),
    );

  return appendHistory(
    {
      ...state,
      sceneGroups: state.sceneGroups.filter((candidate) => candidate.groupId !== group.groupId),
      parentRelationships: nextRelationships,
      selectionState: {
        ...state.selectionState,
        selectedGroupIds: [],
        selectedObjectIds: childRelationships
          .filter((relationship) => relationship.childType === "object")
          .map((relationship) => relationship.childId),
        selectedSpatialEntityRefs: [],
        primarySelectionId:
          childRelationships.find((relationship) => relationship.childType === "object")?.childId ?? null
      }
    },
    {
      actionId: `placement-action-ungroup-${state.placementHistory.length + 1}`,
      actionType: "ungroup",
      summary: `Ungrouped ${group.name}`,
      targetIds: [group.groupId, ...childRelationships.map((relationship) => relationship.childId)],
      createdAt: new Date().toISOString()
    },
  );
}

export function setSceneObjectLockState(
  state: SceneAuthoringState,
  objectIds: string[],
  locked: boolean,
) {
  return appendHistory(
    {
      ...state,
      sceneObjects: state.sceneObjects.map((sceneObject) =>
        objectIds.includes(sceneObject.sceneObjectId)
          ? {
              ...sceneObject,
              locked
            }
          : sceneObject,
      )
    },
    {
      actionId: `placement-action-lock-${state.placementHistory.length + 1}`,
      actionType: locked ? "lock" : "unlock",
      summary: locked ? "Locked selected objects" : "Unlocked selected objects",
      targetIds: objectIds,
      createdAt: new Date().toISOString()
    },
  );
}

export function setSceneObjectVisibility(
  state: SceneAuthoringState,
  objectIds: string[],
  visible: boolean,
) {
  return appendHistory(
    {
      ...state,
      sceneObjects: state.sceneObjects.map((sceneObject) =>
        objectIds.includes(sceneObject.sceneObjectId)
          ? {
              ...sceneObject,
              visible
            }
          : sceneObject,
      )
    },
    {
      actionId: `placement-action-visibility-${state.placementHistory.length + 1}`,
      actionType: visible ? "show" : "hide",
      summary: visible ? "Made selected objects visible" : "Hid selected objects",
      targetIds: objectIds,
      createdAt: new Date().toISOString()
    },
  );
}

export function updateSelectionFilter(
  state: SceneAuthoringState,
  filterCategories: SceneObjectCategory[],
) {
  return appendHistory(
    {
      ...state,
      selectionState: {
        ...state.selectionState,
        filterCategories
      }
    },
    {
      actionId: `placement-action-filter-${state.placementHistory.length + 1}`,
      actionType: "filter-update",
      summary: "Updated placement filters",
      targetIds: filterCategories,
      createdAt: new Date().toISOString()
    },
  );
}

function inferHoleOrdinal(holeId: string) {
  const match = /(\d+)$/.exec(holeId);
  const parsed = match ? Number(match[1]) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 1;
}

function createHoleCenter(holeId: string): Vector3 {
  const ordinal = inferHoleOrdinal(holeId);
  return {
    x: (ordinal - 1) * 36,
    y: 0,
    z: Math.floor((ordinal - 1) / 3) * 72
  };
}

function createRectBoundary(center: Vector3, width: number, depth: number) {
  return [
    { x: center.x - width / 2, y: center.y, z: center.z - depth / 2 },
    { x: center.x + width / 2, y: center.y, z: center.z - depth / 2 },
    { x: center.x + width / 2, y: center.y, z: center.z + depth / 2 },
    { x: center.x - width / 2, y: center.y, z: center.z + depth / 2 }
  ];
}

function centroidOfPolygon(points: Vector3[]) {
  const total = points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x,
      y: accumulator.y + point.y,
      z: accumulator.z + point.z
    }),
    { x: 0, y: 0, z: 0 },
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
    z: total.z / points.length
  };
}

function translatePoints(points: Vector3[], delta: Partial<Vector3>) {
  return points.map((point) => ({
    x: point.x + (delta.x ?? 0),
    y: point.y + (delta.y ?? 0),
    z: point.z + (delta.z ?? 0)
  }));
}

function scalePointsFromCentroid(points: Vector3[], scaleX: number, scaleZ: number) {
  const centroid = centroidOfPolygon(points);

  return points.map((point) => ({
    x: centroid.x + (point.x - centroid.x) * scaleX,
    y: point.y,
    z: centroid.z + (point.z - centroid.z) * scaleZ
  }));
}

function rotatePointsAroundCentroid(points: Vector3[], deltaDegrees: number) {
  const centroid = centroidOfPolygon(points);
  const radians = (deltaDegrees * Math.PI) / 180;
  const sin = Math.sin(radians);
  const cos = Math.cos(radians);

  return points.map((point) => {
    const localX = point.x - centroid.x;
    const localZ = point.z - centroid.z;

    return {
      x: centroid.x + localX * cos - localZ * sin,
      y: point.y,
      z: centroid.z + localX * sin + localZ * cos
    };
  });
}

function createCircularBoundary(center: Vector3, radiusMeters: number, segments = 12) {
  return Array.from({ length: segments }, (_, index) => {
    const angle = (Math.PI * 2 * index) / segments;
    return {
      x: center.x + Math.cos(angle) * radiusMeters,
      y: center.y,
      z: center.z + Math.sin(angle) * radiusMeters
    };
  });
}

function midpointOfPolyline(points: Vector3[]) {
  if (points.length === 0) {
    return null;
  }

  return points[Math.floor(points.length / 2)] ?? points[0] ?? null;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function snapScalar(value: number, step: number) {
  if (!Number.isFinite(step) || step <= 0) {
    return value;
  }

  return Math.round(value / step) * step;
}

function snapWorldDelta(state: SceneAuthoringState, delta: Partial<Vector3>) {
  if (!state.snapSettings.gridEnabled) {
    return {
      x: delta.x ?? 0,
      y: delta.y ?? 0,
      z: delta.z ?? 0
    };
  }

  return {
    x: snapScalar(delta.x ?? 0, state.snapSettings.gridSizeMeters),
    y: delta.y ?? 0,
    z: snapScalar(delta.z ?? 0, state.snapSettings.gridSizeMeters)
  };
}

function snapWorldPoint(state: SceneAuthoringState, point: Vector3) {
  if (!state.snapSettings.gridEnabled) {
    return point;
  }

  return {
    x: snapScalar(point.x, state.snapSettings.gridSizeMeters),
    y: point.y,
    z: snapScalar(point.z, state.snapSettings.gridSizeMeters)
  };
}

function snapRotationDegrees(state: SceneAuthoringState, degrees: number) {
  return snapScalar(degrees, state.snapSettings.rotationStepDegrees);
}

function snapScaleFactor(state: SceneAuthoringState, scaleFactor: number) {
  const step = (state.snapSettings.scaleStepPercent || 0) / 100;
  if (step <= 0) {
    return scaleFactor;
  }

  return clamp(snapScalar(scaleFactor - 1, step) + 1, 0.25, 4);
}

type PlacementSurfaceSample = {
  snapMode: "none" | "terrain-region" | "simulator-surface";
  surfaceLabel: string | null;
  position: Vector3;
  slopeDegrees: number;
  tiltXDegrees: number;
  tiltZDegrees: number;
};

function pointInPolygon(point: Vector3, polygon: { points: Vector3[] }) {
  let inside = false;

  for (let index = 0, previousIndex = polygon.points.length - 1; index < polygon.points.length; previousIndex = index, index += 1) {
    const current = polygon.points[index]!;
    const previous = polygon.points[previousIndex]!;
    const intersects =
      current.z > point.z !== previous.z > point.z &&
      point.x <
        ((previous.x - current.x) * (point.z - current.z)) / (previous.z - current.z || 0.00001) + current.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function boundaryBounds(points: Vector3[]) {
  const xs = points.map((point) => point.x);
  const zs = points.map((point) => point.z);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs)
  };
}

function centroidDistanceToPoint(points: Vector3[], point: Vector3) {
  return planarDistance(centroidOfPolygon(points), point);
}

function estimateTerrainSurfaceSample(
  state: SceneAuthoringState,
  point: Vector3,
): PlacementSurfaceSample {
  const terrainRegion = state.terrainRegions.find((candidate) => pointInPolygon(point, candidate.boundary)) ?? null;
  if (terrainRegion && (state.snapSettings.terrainSnapEnabled || state.snapSettings.surfaceSnapEnabled)) {
    const bounds = boundaryBounds(terrainRegion.boundary.points);
    const width = Math.max(1, bounds.maxX - bounds.minX);
    const depth = Math.max(1, bounds.maxZ - bounds.minZ);
    const center = centroidOfPolygon(terrainRegion.boundary.points);
    const span = Math.max(0, terrainRegion.elevationMax - terrainRegion.elevationMin);
    const relativeX = clamp((point.x - center.x) / (width / 2), -1, 1);
    const relativeZ = clamp((point.z - center.z) / (depth / 2), -1, 1);
    const baseY =
      terrainRegion.elevationMin +
      span * 0.5 +
      span * 0.18 * relativeX +
      span * 0.22 * relativeZ;
    const slopeMagnitude = (Math.atan2(span, Math.max(width, depth)) * 180) / Math.PI;
    const slopeDegrees = clamp(
      Number((slopeMagnitude * (0.7 + (Math.abs(relativeX) + Math.abs(relativeZ)) * 0.45)).toFixed(2)),
      0,
      32,
    );
    const tiltXDegrees =
      state.snapSettings.alignToSurfaceNormal && !state.snapSettings.keepUpright
        ? clamp(Number((relativeZ * slopeDegrees * 0.72).toFixed(2)), -18, 18)
        : 0;
    const tiltZDegrees =
      state.snapSettings.alignToSurfaceNormal && !state.snapSettings.keepUpright
        ? clamp(Number((-relativeX * slopeDegrees * 0.72).toFixed(2)), -18, 18)
        : 0;

    return {
      snapMode: "terrain-region",
      surfaceLabel: terrainRegion.name,
      position: {
        x: point.x,
        y: Number(baseY.toFixed(2)),
        z: point.z
      },
      slopeDegrees,
      tiltXDegrees,
      tiltZDegrees
    };
  }

  if (state.snapSettings.surfaceSnapEnabled) {
    const simulatorSurfaceCandidates = [
      ...state.teeZones.map((zone) => ({
        label: "Tee Zone",
        boundary: zone.boundary
      })),
      ...state.greenZones.map((zone) => ({
        label: "Green Zone",
        boundary: zone.boundary
      })),
      ...state.hazardZones.map((zone) => ({
        label: zone.hazardLabel,
        boundary: zone.boundary
      })),
      ...state.outOfBoundsZones.map((zone) => ({
        label: zone.sideLabel,
        boundary: zone.boundary
      })),
      ...state.dropZoneAreas.map((zone) => ({
        label: "Drop Zone",
        boundary: zone.boundary
      }))
    ];
    const surface = simulatorSurfaceCandidates.find((candidate) => pointInPolygon(point, candidate.boundary)) ?? null;
    if (surface) {
      const center = centroidOfPolygon(surface.boundary.points);
      return {
        snapMode: "simulator-surface",
        surfaceLabel: surface.label,
        position: {
          x: point.x,
          y: center.y,
          z: point.z
        },
        slopeDegrees: 0,
        tiltXDegrees: 0,
        tiltZDegrees: 0
      };
    }
  }

  return {
    snapMode: "none",
    surfaceLabel: null,
    position: point,
    slopeDegrees: 0,
    tiltXDegrees: 0,
    tiltZDegrees: 0
  };
}

function resolvePlacementPose(
  state: SceneAuthoringState,
  point: Vector3,
) {
  const snappedPoint = snapWorldPoint(state, point);
  const surfaceSample = estimateTerrainSurfaceSample(state, snappedPoint);

  return {
    snappedPosition: surfaceSample.position,
    snapMode: surfaceSample.snapMode,
    surfaceLabel: surfaceSample.surfaceLabel,
    surfaceSlopeDegrees: surfaceSample.slopeDegrees,
    rotation: {
      x: surfaceSample.tiltXDegrees,
      y: 0,
      z: surfaceSample.tiltZDegrees
    }
  };
}

function normalizeSceneObjectCategory(category: SceneObjectCategory) {
  return category === "supporting-scenery" ? "prop" : category;
}

function defaultPlacementRulesForCategory(category: SceneObjectCategory): ScenePlacementRule[] {
  switch (category) {
    case "vegetation":
      return ["scatter", "avoid-playable-core"];
    case "landmark":
    case "animated-set-piece":
      return ["hero-placement"];
    case "structure":
      return ["edge-follow", "support-space"];
    case "gameplay-course-object":
      return ["avoid-playable-core"];
    case "supporting-scenery":
    case "prop":
    default:
      return ["scatter"];
  }
}

function resolvePlacementLayerIdForCategory(
  state: SceneAuthoringState,
  category: SceneObjectCategory,
) {
  const activeCollection = getActiveSceneCollection(state);
  const normalizedCategory = normalizeSceneObjectCategory(category);
  const activeCollectionLayer = activeCollection?.defaultLayerId ?? null;
  if (
    activeCollectionLayer &&
    state.placementLayers.some((layer) => layer.layerId === activeCollectionLayer)
  ) {
    const defaultLayer = state.placementLayers.find((layer) => layer.layerId === activeCollectionLayer) ?? null;
    if (!defaultLayer?.filterCategories.length || defaultLayer.filterCategories.includes(category)) {
      return activeCollectionLayer;
    }
  }

  const matchedLayer = state.placementLayers.find((layer) =>
    layer.filterCategories.some((candidate) => normalizeSceneObjectCategory(candidate) === normalizedCategory),
  );
  return matchedLayer?.layerId ?? state.placementLayers[0]?.layerId ?? activeCollectionLayer ?? "layer-gameplay";
}

function nextSceneObjectId(state: SceneAuthoringState) {
  return nextId("scene-object", state.sceneObjects.map((sceneObject) => sceneObject.sceneObjectId));
}

function pseudoRandom(seed: number) {
  const raw = Math.sin(seed * 12.9898) * 43758.5453;
  return raw - Math.floor(raw);
}

function randomCentered(seed: number) {
  return pseudoRandom(seed) * 2 - 1;
}

function resolveBrushCategoryWeight(
  state: SceneAuthoringState,
  category: SceneObjectCategory,
) {
  return (
    state.editingState.sceneryBrush.categoryWeights.find((entry) => entry.category === category)?.weight ??
    1
  );
}

function resolveBrushAssetWeight(
  state: SceneAuthoringState,
  draft: PlacementAssetDraft,
) {
  const explicitWeight =
    state.editingState.sceneryBrush.assetWeights.find((entry) => entry.assetRef === draft.assetRef)?.weight ?? 1;
  const packBias =
    state.editingState.sceneryBrush.activePackId && draft.packId
      ? draft.packId === state.editingState.sceneryBrush.activePackId
        ? 1 + state.editingState.sceneryBrush.activePackInfluence
        : Math.max(0.25, 1 - state.editingState.sceneryBrush.activePackInfluence * 0.55)
      : 1;

  return explicitWeight * resolveBrushCategoryWeight(state, draft.category) * packBias;
}

function pickWeightedPlacementDraft(
  state: SceneAuthoringState,
  drafts: PlacementAssetDraft[],
  seed: number,
) {
  const weightedDrafts = drafts.map((draft) => ({
    draft,
    weight: resolveBrushAssetWeight(state, draft)
  }));
  const totalWeight = weightedDrafts.reduce((total, entry) => total + entry.weight, 0);

  if (totalWeight <= 0) {
    return drafts[seed % drafts.length] ?? null;
  }

  let threshold = pseudoRandom(seed + 101) * totalWeight;

  for (const entry of weightedDrafts) {
    threshold -= entry.weight;
    if (threshold <= 0) {
      return entry.draft;
    }
  }

  return weightedDrafts.at(-1)?.draft ?? null;
}

function collectPlayableCoreAnchors(state: SceneAuthoringState) {
  return [
    ...state.sceneObjects
      .filter((sceneObject) => sceneObject.category === "gameplay-course-object")
      .map((sceneObject) => sceneObject.transform.position),
    ...state.teeZones.map((zone) => centroidOfPolygon(zone.boundary.points)),
    ...state.greenZones.map((zone) => centroidOfPolygon(zone.boundary.points))
  ];
}

function isPlacementTooClose(candidate: Vector3, existingPositions: Vector3[], minimumSpacingMeters: number) {
  if (minimumSpacingMeters <= 0) {
    return false;
  }

  return existingPositions.some((existing) => planarDistance(existing, candidate) < minimumSpacingMeters);
}

function violatesPlayableCoreTendency(
  candidate: Vector3,
  anchors: Vector3[],
  radiusMeters: number,
  strength: number,
) {
  if (strength <= 0 || anchors.length === 0) {
    return false;
  }

  const exclusionRadius = Math.max(3, radiusMeters * (0.28 + strength * 0.48));
  return anchors.some((anchor) => planarDistance(anchor, candidate) < exclusionRadius);
}

function applyBrushPlacementRuleOffset(
  center: Vector3,
  radiusMeters: number,
  rules: ScenePlacementRule[],
  seed: number,
) {
  const scatterBias = rules.includes("hero-placement") ? 0.28 : 1;
  const edgeBias = rules.includes("edge-follow") ? 0.82 : 0.44 + pseudoRandom(seed + 5) * 0.36;
  const radialFactor = rules.includes("edge-follow") ? edgeBias : pseudoRandom(seed + 2) * scatterBias;
  const theta = pseudoRandom(seed + 3) * Math.PI * 2;

  return {
    x: center.x + Math.cos(theta) * radiusMeters * radialFactor,
    y: center.y,
    z: center.z + Math.sin(theta) * radiusMeters * radialFactor
  };
}

function applyRoutingAngleSnap(
  state: SceneAuthoringState,
  anchor: Vector3,
  point: Vector3,
) {
  const settings = state.editingState.routingGuideSettings;
  if (!settings.angleSnapEnabled) {
    return point;
  }

  const deltaX = point.x - anchor.x;
  const deltaZ = point.z - anchor.z;
  const angle = Math.atan2(deltaZ, deltaX);
  const length = Math.hypot(deltaX, deltaZ);
  const stepRadians = (settings.angleStepDegrees * Math.PI) / 180;
  if (!Number.isFinite(length) || length === 0 || !Number.isFinite(stepRadians) || stepRadians <= 0) {
    return point;
  }

  const snappedAngle = Math.round(angle / stepRadians) * stepRadians;
  return {
    x: anchor.x + Math.cos(snappedAngle) * length,
    y: point.y,
    z: anchor.z + Math.sin(snappedAngle) * length
  };
}

function resolveRoutingAnchorNode(state: SceneAuthoringState, holeId: string) {
  const pendingNodeId = state.editingState.pendingConnectionStartNodeId;
  if (pendingNodeId) {
    const pendingNode = state.routingNodes.find((node) => node.routingNodeId === pendingNodeId) ?? null;
    if (pendingNode?.holeId === holeId) {
      return pendingNode;
    }
  }

  const selectedNodeId = state.editingState.selectedRoutingNodeId;
  if (selectedNodeId) {
    const selectedNode = state.routingNodes.find((node) => node.routingNodeId === selectedNodeId) ?? null;
    if (selectedNode?.holeId === holeId) {
      return selectedNode;
    }
  }

  return null;
}

function updateSpatialSelection(
  state: SceneAuthoringState,
  references: SceneSpatialReference[],
  editingState: Partial<SceneAuthoringState["editingState"]>,
) {
  return {
    ...state,
    selectionState: {
      ...state.selectionState,
      selectedObjectIds: [],
      selectedGroupIds: [],
      selectedSpatialEntityRefs: references,
      primarySelectionId: references[0]?.entityId ?? null
    },
    editingState: {
      ...state.editingState,
      ...editingState
    }
  };
}

function resolveSpatialReferencePosition(
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
      return segment ? midpointOfPolyline(segment.controlLine.points) : null;
    }
    case "terrain-region":
      return state.terrainRegions.find((region) => region.terrainRegionId === reference.entityId)
        ? centroidOfPolygon(
            state.terrainRegions.find((region) => region.terrainRegionId === reference.entityId)!.boundary.points,
          )
        : null;
    case "fairway-corridor": {
      const corridor = state.fairwayCorridors.find((candidate) => candidate.fairwayCorridorId === reference.entityId);
      return corridor ? midpointOfPolyline(corridor.centerline.points) : null;
    }
    case "visibility-corridor": {
      const corridor = state.visibilityCorridors.find(
        (candidate) => candidate.visibilityCorridorId === reference.entityId,
      );
      return corridor ? midpointOfPolyline(corridor.corridorLine.points) : null;
    }
    case "play-route-envelope":
      return state.playRouteEnvelopes.find((envelope) => envelope.playRouteEnvelopeId === reference.entityId)
        ? centroidOfPolygon(
            state.playRouteEnvelopes.find((envelope) => envelope.playRouteEnvelopeId === reference.entityId)!.boundary.points,
          )
        : null;
    case "tee-zone":
      return state.teeZones.find((zone) => zone.teeZoneId === reference.entityId)
        ? centroidOfPolygon(state.teeZones.find((zone) => zone.teeZoneId === reference.entityId)!.boundary.points)
        : null;
    case "green-zone":
      return state.greenZones.find((zone) => zone.greenZoneId === reference.entityId)
        ? centroidOfPolygon(state.greenZones.find((zone) => zone.greenZoneId === reference.entityId)!.boundary.points)
        : null;
    case "hazard-zone":
      return state.hazardZones.find((zone) => zone.hazardZoneId === reference.entityId)
        ? centroidOfPolygon(state.hazardZones.find((zone) => zone.hazardZoneId === reference.entityId)!.boundary.points)
        : null;
    case "out-of-bounds-zone":
      return state.outOfBoundsZones.find((zone) => zone.outOfBoundsZoneId === reference.entityId)
        ? centroidOfPolygon(
            state.outOfBoundsZones.find((zone) => zone.outOfBoundsZoneId === reference.entityId)!.boundary.points,
          )
        : null;
    case "drop-zone-area":
      return state.dropZoneAreas.find((zone) => zone.dropZoneAreaId === reference.entityId)
        ? centroidOfPolygon(state.dropZoneAreas.find((zone) => zone.dropZoneAreaId === reference.entityId)!.boundary.points)
        : null;
    default:
      return null;
  }
}

function defaultRoutingLabel(kind: RoutingNodeKind, holeId: string) {
  const ordinal = inferHoleOrdinal(holeId);

  switch (kind) {
    case "tee":
      return `Hole ${ordinal} Tee`;
    case "landing-zone":
      return `Hole ${ordinal} Landing`;
    case "approach":
      return `Hole ${ordinal} Approach`;
    case "green-center":
      return `Hole ${ordinal} Green`;
    case "preview-anchor":
      return `Hole ${ordinal} Preview`;
    case "carry-target":
      return `Hole ${ordinal} Carry`;
    case "decision-point":
      return `Hole ${ordinal} Decision`;
    case "exit":
    default:
      return `Hole ${ordinal} Exit`;
  }
}

function orderRoutingNodes(state: SceneAuthoringState, holeId: string) {
  const preferredKindOrder: RoutingNodeKind[] = [
    "tee",
    "carry-target",
    "landing-zone",
    "decision-point",
    "approach",
    "green-center",
    "exit"
  ];

  return state.routingNodes
    .filter((node) => node.holeId === holeId && node.kind !== "preview-anchor")
    .slice()
    .sort((left, right) => {
      const kindDelta =
        preferredKindOrder.indexOf(left.kind) - preferredKindOrder.indexOf(right.kind);

      if (kindDelta !== 0) {
        return kindDelta;
      }

      return left.position.x - right.position.x || left.position.z - right.position.z;
    });
}

function buildPolylineFromOrderedNodes(nodes: Array<{ position: Vector3 }>) {
  return nodes.map((node) => node.position);
}

function buildPolylineFromRoutingSegments(
  nodes: Array<{ routingNodeId: string; position: Vector3 }>,
  segments: SceneAuthoringState["routingSegments"],
) {
  if (nodes.length <= 1 || segments.length === 0) {
    return buildPolylineFromOrderedNodes(nodes);
  }

  const points: Vector3[] = [];

  for (let index = 0; index < nodes.length - 1; index += 1) {
    const current = nodes[index]!;
    const next = nodes[index + 1]!;
    const segment = segments.find(
      (candidate) =>
        (candidate.fromNodeId === current.routingNodeId && candidate.toNodeId === next.routingNodeId) ||
        (candidate.fromNodeId === next.routingNodeId && candidate.toNodeId === current.routingNodeId),
    );

    if (!segment) {
      if (points.length === 0) {
        points.push(current.position);
      }
      points.push(next.position);
      continue;
    }

    const orderedPoints =
      segment.fromNodeId === current.routingNodeId
        ? segment.controlLine.points
        : [...segment.controlLine.points].reverse();

    if (points.length === 0) {
      points.push(...orderedPoints);
    } else {
      points.push(...orderedPoints.slice(1));
    }
  }

  return points.length > 0 ? points : buildPolylineFromOrderedNodes(nodes);
}

function upsertHoleRoutingArtifacts(state: SceneAuthoringState, holeId: string): SceneAuthoringState {
  const orderedNodes = orderRoutingNodes(state, holeId);
  const teeNode = orderedNodes.find((node) => node.kind === "tee") ?? orderedNodes[0] ?? null;
  const greenNode =
    orderedNodes.find((node) => node.kind === "green-center") ?? orderedNodes.at(-1) ?? null;
  const holeSegments = state.routingSegments.filter((segment) => segment.holeId === holeId);
  const existingPath =
    state.routingPaths.find((routingPath) => routingPath.holeId === holeId) ?? null;

  if (!teeNode || !greenNode || holeSegments.length === 0) {
    return {
      ...state,
      routingPaths: state.routingPaths.map((routingPath) =>
        routingPath.holeId === holeId
          ? {
              ...routingPath,
              routeStatus: "draft" as const
            }
          : routingPath,
      )
    };
  }

  const nodeIds = orderedNodes.map((node) => node.routingNodeId);
  const segmentIds = holeSegments.map((segment) => segment.routingSegmentId);
  const routeLinePoints = buildPolylineFromRoutingSegments(orderedNodes, holeSegments);
  const pathId = existingPath?.routingPathId ?? `routing-path-${holeId}`;
  const existingVisibilityCorridor =
    state.visibilityCorridors.find((corridor) => corridor.holeId === holeId) ?? null;
  const existingFairwayCorridor =
    state.fairwayCorridors.find((corridor) => corridor.holeId === holeId) ?? null;
  const existingPlayRouteEnvelope =
    state.playRouteEnvelopes.find((envelope) => envelope.holeId === holeId) ?? null;
  const visibilityCorridorId =
    existingVisibilityCorridor?.visibilityCorridorId ?? `visibility-corridor-${holeId}`;
  const fairwayCorridorId =
    existingFairwayCorridor?.fairwayCorridorId ?? `fairway-corridor-${holeId}`;
  const playRouteEnvelopeId =
    existingPlayRouteEnvelope?.playRouteEnvelopeId ?? `play-route-envelope-${holeId}`;
  const boundingXs = routeLinePoints.map((point) => point.x);
  const boundingZs = routeLinePoints.map((point) => point.z);
  const envelopeBoundary = createRectBoundary(
    {
      x: (Math.min(...boundingXs) + Math.max(...boundingXs)) / 2,
      y: 0,
      z: (Math.min(...boundingZs) + Math.max(...boundingZs)) / 2
    },
    Math.max(36, Math.max(...boundingXs) - Math.min(...boundingXs) + 28),
    Math.max(24, Math.max(...boundingZs) - Math.min(...boundingZs) + 28),
  );

  return {
    ...state,
    routingPaths: [
      ...state.routingPaths.filter((routingPath) => routingPath.holeId !== holeId),
      createRoutingPath({
        routingPathId: pathId,
        holeId,
        name: existingPath?.name ?? `Hole ${inferHoleOrdinal(holeId)} Primary Route`,
        teeNodeId: teeNode.routingNodeId,
        greenNodeId: greenNode.routingNodeId,
        nodeIds,
        segmentIds,
        routeStatus: "connected",
        note: existingPath?.note ?? "Derived from current routing graph."
      })
    ],
    fairwayCorridors: [
      ...state.fairwayCorridors.filter((corridor) => corridor.holeId !== holeId),
      createFairwayCorridor({
        fairwayCorridorId,
        holeId,
        routingPathId: pathId,
        centerline: routeLinePoints,
        averageWidthMeters:
          existingFairwayCorridor?.averageWidthMeters ??
          state.editingState.routingGuideSettings.defaultCorridorWidthMeters,
        landingZoneCount: Math.max(
          existingFairwayCorridor?.landingZoneCount ?? 0,
          1,
          orderedNodes.filter((node) => node.kind === "landing-zone").length,
        ),
        note: existingFairwayCorridor?.note ?? "Derived from routed line."
      })
    ],
    visibilityCorridors: [
      ...state.visibilityCorridors.filter((corridor) => corridor.holeId !== holeId),
      createVisibilityCorridor({
        visibilityCorridorId,
        holeId,
        fromNodeId: teeNode.routingNodeId,
        toNodeId: greenNode.routingNodeId,
        corridorLine: routeLinePoints,
        minimumWidthMeters:
          existingVisibilityCorridor?.minimumWidthMeters ??
          Math.max(10, state.editingState.routingGuideSettings.defaultCorridorWidthMeters * 0.55),
        note: existingVisibilityCorridor?.note ?? "Derived from routed line for readability checks."
      })
    ],
    playRouteEnvelopes: [
      ...state.playRouteEnvelopes.filter((envelope) => envelope.holeId !== holeId),
      createPlayRouteEnvelope({
        playRouteEnvelopeId,
        holeId,
        routingPathId: pathId,
        boundary: envelopeBoundary,
        note: existingPlayRouteEnvelope?.note ?? "Derived from routed line for play-space validation."
      })
    ]
  };
}

export function createTeeZoneForHole(
  state: SceneAuthoringState,
  input: {
    holeId: string;
    teeSetRefs?: string[];
    facingDirectionDegrees?: number;
    center?: Partial<Vector3>;
  },
) {
  const existingZone = state.teeZones.find((candidate) => candidate.holeId === input.holeId);
  if (existingZone) {
    return selectSpatialEntities(
      {
        ...state,
        editingState: {
          ...state.editingState,
          pendingPlacementHoleId: input.holeId
        }
      },
      [
        createSceneSpatialReference({
          entityType: "tee-zone",
          entityId: existingZone.teeZoneId,
          holeId: input.holeId,
          note: existingZone.note
        })
      ],
    );
  }

  const holeCenter = {
    ...createHoleCenter(input.holeId),
    ...input.center
  };
  const teeZoneId = `tee-zone-${input.holeId}`;
  const nextZone = createTeeZone({
    teeZoneId,
    holeId: input.holeId,
    teeSetRefs: input.teeSetRefs ?? [],
    boundary: createRectBoundary(
      {
        x: holeCenter.x - 44,
        y: 0,
        z: holeCenter.z
      },
      16,
      10,
    ),
    facingDirectionDegrees: input.facingDirectionDegrees ?? 12,
    note: `Hole ${inferHoleOrdinal(input.holeId)} tee zone`
  });

  return appendHistory(
    {
      ...state,
      teeZones: [...state.teeZones, nextZone],
      selectionState: {
        ...state.selectionState,
        selectedObjectIds: [],
        selectedGroupIds: [],
        selectedSpatialEntityRefs: [
          createSceneSpatialReference({
            entityType: "tee-zone",
            entityId: teeZoneId,
            holeId: input.holeId,
            note: nextZone.note
          })
        ],
        primarySelectionId: teeZoneId
      }
    },
    {
      actionId: `placement-action-tee-zone-${state.placementHistory.length + 1}`,
      actionType: "simulator-anchor-update",
      summary: `Created tee zone for Hole ${inferHoleOrdinal(input.holeId)}`,
      targetIds: [teeZoneId],
      createdAt: new Date().toISOString()
    },
  );
}

export function createGreenZoneForHole(state: SceneAuthoringState, holeId: string) {
  return createGreenZoneForHoleAt(state, {
    holeId
  });
}

export function createGreenZoneForHoleAt(
  state: SceneAuthoringState,
  input: {
    holeId: string;
    center?: Partial<Vector3>;
  },
) {
  const existingZone = state.greenZones.find((candidate) => candidate.holeId === input.holeId);
  if (existingZone) {
    return selectSpatialEntities(
      state,
      [
        createSceneSpatialReference({
          entityType: "green-zone",
          entityId: existingZone.greenZoneId,
          holeId: input.holeId,
          note: existingZone.note
        })
      ],
    );
  }

  const holeCenter = {
    ...createHoleCenter(input.holeId),
    ...input.center
  };
  const greenZoneId = `green-zone-${input.holeId}`;
  const approachNode =
    state.routingNodes.find(
      (candidate) => candidate.holeId === input.holeId && candidate.kind === "approach",
    ) ?? null;
  const nextZone = createGreenZone({
    greenZoneId,
    holeId: input.holeId,
    boundary: createRectBoundary(
      {
        x: holeCenter.x + 38,
        y: 0,
        z: holeCenter.z
      },
      18,
      14,
    ),
    targetPinCapacity: 4,
    approachNodeId: approachNode?.routingNodeId ?? null,
    note: `Hole ${inferHoleOrdinal(input.holeId)} green target zone`
  });

    return appendHistory(
      {
        ...state,
        greenZones: [...state.greenZones, nextZone],
      selectionState: {
        ...state.selectionState,
        selectedObjectIds: [],
        selectedGroupIds: [],
        selectedSpatialEntityRefs: [
          createSceneSpatialReference({
            entityType: "green-zone",
            entityId: greenZoneId,
            holeId: input.holeId,
            note: nextZone.note
          })
        ],
        primarySelectionId: greenZoneId
      }
    },
    {
      actionId: `placement-action-green-zone-${state.placementHistory.length + 1}`,
      actionType: "simulator-anchor-update",
      summary: `Created green zone for Hole ${inferHoleOrdinal(input.holeId)}`,
      targetIds: [greenZoneId],
      createdAt: new Date().toISOString()
    },
  );
}

export function setTerrainToolMode(
  state: SceneAuthoringState,
  activeTerrainTool: SceneAuthoringState["editingState"]["activeTerrainTool"],
) {
  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        activeTerrainTool
      }
    },
    {
      actionId: `placement-action-terrain-tool-${state.placementHistory.length + 1}`,
      actionType: "terrain-update",
      summary: `Switched terrain tool to ${activeTerrainTool}`,
      targetIds: [activeTerrainTool],
      createdAt: new Date().toISOString()
    },
  );
}

export function setTerrainSculptMode(
  state: SceneAuthoringState,
  terrainSculptMode: TerrainSculptMode,
) {
  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        terrainSculptMode
      }
    },
    {
      actionId: `placement-action-terrain-sculpt-mode-${state.placementHistory.length + 1}`,
      actionType: "terrain-update",
      summary: `Switched terrain sculpt mode to ${terrainSculptMode}`,
      targetIds: [terrainSculptMode],
      createdAt: new Date().toISOString()
    },
  );
}

export function updateTerrainBrushSettings(
  state: SceneAuthoringState,
  patch: Partial<
    Pick<
      SceneAuthoringState["editingState"],
      | "terrainBrushRadiusMeters"
      | "terrainBrushStrength"
      | "terrainBrushFalloffMeters"
      | "terrainBrushTargetHeight"
    >
  >,
) {
  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        ...patch
      }
    },
    {
      actionId: `placement-action-terrain-brush-${state.placementHistory.length + 1}`,
      actionType: "terrain-update",
      summary: "Updated terrain sculpt brush",
      targetIds: [],
      createdAt: new Date().toISOString()
    },
  );
}

export function setActivePlacementDraft(
  state: SceneAuthoringState,
  draft: PlacementAssetDraft | null,
) {
  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        activePlacementDraft: draft,
        sceneryBrush: {
          ...state.editingState.sceneryBrush,
          activePackId: draft?.packId ?? state.editingState.sceneryBrush.activePackId
        },
        authoringPreview:
          state.editingState.authoringPreview.mode === "placement"
            ? {
                ...state.editingState.authoringPreview,
                draft,
                label: draft ? `Preview ${draft.label}` : null,
                activeCategory: draft?.category ?? null,
                previewRadiusMeters: draft?.footprintRadiusMeters ?? 0,
                visible: draft ? state.editingState.authoringPreview.visible : false
              }
            : state.editingState.authoringPreview
      }
    },
    {
      actionId: `placement-action-placement-draft-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary: draft ? `Armed ${draft.label} for placement` : "Cleared active placement draft",
      targetIds: draft ? [draft.assetRef] : [],
      createdAt: new Date().toISOString()
    },
  );
}

export function setSceneryBrushDrafts(
  state: SceneAuthoringState,
  drafts: PlacementAssetDraft[],
) {
  const activePackId = drafts[0]?.packId ?? state.editingState.sceneryBrush.activePackId;
  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        sceneryBrushDrafts: drafts,
        sceneryBrush: {
          ...state.editingState.sceneryBrush,
          activePackId
        }
      }
    },
    {
      actionId: `placement-action-scenery-brush-drafts-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary:
        drafts.length > 0
          ? `Loaded ${drafts.length} assets into the scenery brush`
          : "Cleared scenery brush palette",
      targetIds: drafts.map((draft) => draft.assetRef),
      createdAt: new Date().toISOString()
    },
  );
}

export function addPlacementDraftsToSceneryBrush(
  state: SceneAuthoringState,
  drafts: PlacementAssetDraft[],
) {
  const nextDrafts = [
    ...state.editingState.sceneryBrushDrafts,
    ...drafts.filter(
      (draft) =>
        !state.editingState.sceneryBrushDrafts.some((candidate) => candidate.assetRef === draft.assetRef),
    )
  ];
  return setSceneryBrushDrafts(state, nextDrafts);
}

export function updateSceneryBrushSettings(
  state: SceneAuthoringState,
  patch: Partial<SceneAuthoringState["editingState"]["sceneryBrush"]>,
) {
  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        sceneryBrush: {
          ...state.editingState.sceneryBrush,
          ...patch
        }
      }
    },
    {
      actionId: `placement-action-scenery-brush-settings-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary: "Updated scenery brush settings",
      targetIds: [],
      createdAt: new Date().toISOString()
    },
  );
}

export function saveSceneryBrushPreset(
  state: SceneAuthoringState,
  input: {
    name: string;
    description?: string;
  },
) {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    return state;
  }

  const existingPreset =
    state.editingState.sceneryBrushPresets.find(
      (preset) => normalizePresetName(preset.name) === normalizePresetName(trimmedName),
    ) ?? null;
  const nextPreset = createSceneryBrushPreset({
    presetId:
      existingPreset?.presetId ??
      nextId("brush-preset", state.editingState.sceneryBrushPresets.map((preset) => preset.presetId)),
    name: trimmedName,
    description:
      input.description ??
      existingPreset?.description ??
      "Saved brush mix for repeatable world-dressing passes.",
    favorite: existingPreset?.favorite ?? false,
    useCount: existingPreset?.useCount ?? 0,
    lastUsedAt: existingPreset?.lastUsedAt ?? null,
    settings: state.editingState.sceneryBrush
  });

  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        sceneryBrushPresets: existingPreset
          ? state.editingState.sceneryBrushPresets.map((preset) =>
              preset.presetId === existingPreset.presetId ? nextPreset : preset,
            )
          : [...state.editingState.sceneryBrushPresets, nextPreset]
      }
    },
    {
      actionId: `placement-action-brush-preset-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary: existingPreset ? `Updated brush preset ${trimmedName}` : `Saved brush preset ${trimmedName}`,
      targetIds: [nextPreset.presetId],
      createdAt: new Date().toISOString()
    },
  );
}

export function applySceneryBrushPreset(
  state: SceneAuthoringState,
  presetId: string,
) {
  const preset = state.editingState.sceneryBrushPresets.find((candidate) => candidate.presetId === presetId);
  if (!preset) {
    return state;
  }
  const appliedAt = createPresetUsageTimestamp();

  return appendHistory(
    {
      ...state,
      viewportState: {
        ...state.viewportState,
        authoringMode: "scenery-brush"
      },
      editingState: {
        ...state.editingState,
        sceneryBrushPresets: state.editingState.sceneryBrushPresets.map((candidate) =>
          candidate.presetId === presetId
            ? {
                ...candidate,
                useCount: candidate.useCount + 1,
                lastUsedAt: appliedAt
              }
            : candidate,
        ),
        sceneryBrush: preset.settings
      }
    },
    {
      actionId: `placement-action-brush-preset-apply-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary: `Applied brush preset ${preset.name}`,
      targetIds: [presetId],
      createdAt: new Date().toISOString()
    },
  );
}

export function toggleSceneryBrushPresetFavorite(
  state: SceneAuthoringState,
  presetId: string,
) {
  const preset = state.editingState.sceneryBrushPresets.find((candidate) => candidate.presetId === presetId);
  if (!preset) {
    return state;
  }

  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        sceneryBrushPresets: state.editingState.sceneryBrushPresets.map((candidate) =>
          candidate.presetId === presetId
            ? {
                ...candidate,
                favorite: !candidate.favorite
              }
            : candidate,
        )
      }
    },
    {
      actionId: `placement-action-brush-preset-favorite-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary: `${preset.favorite ? "Removed" : "Marked"} brush preset ${preset.name} ${preset.favorite ? "from" : "as"} favorite`,
      targetIds: [presetId],
      createdAt: new Date().toISOString()
    },
  );
}

export function setActiveTerrainMaterial(
  state: SceneAuthoringState,
  terrainMaterialId: string | null,
) {
  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        activeTerrainMaterialId: terrainMaterialId,
        authoringPreview:
          state.editingState.authoringPreview.mode === "terrain-finish"
            ? {
                ...state.editingState.authoringPreview,
                terrainMaterialId,
                label: terrainMaterialId ? `Preview terrain finish ${terrainMaterialId}` : null
              }
            : state.editingState.authoringPreview
      }
    },
    {
      actionId: `placement-action-terrain-material-${state.placementHistory.length + 1}`,
      actionType: "terrain-update",
      summary: terrainMaterialId ? `Selected terrain material ${terrainMaterialId}` : "Cleared terrain material",
      targetIds: terrainMaterialId ? [terrainMaterialId] : [],
      createdAt: new Date().toISOString()
    },
  );
}

export function setTerrainPaintBlendMode(
  state: SceneAuthoringState,
  blendMode: TerrainMaterialBlendMode,
) {
  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        terrainPaintBlendMode: blendMode
      }
    },
    {
      actionId: `placement-action-terrain-paint-blend-${state.placementHistory.length + 1}`,
      actionType: "terrain-update",
      summary: `Switched terrain paint blend to ${blendMode}`,
      targetIds: [blendMode],
      createdAt: new Date().toISOString()
    },
  );
}

export function setActiveTerrainMaterialLayerIndex(
  state: SceneAuthoringState,
  layerIndex: number,
) {
  const nextLayerIndex = Math.max(0, Math.min(4, Math.round(layerIndex)));
  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        activeTerrainMaterialLayerIndex: nextLayerIndex,
        authoringPreview:
          state.editingState.authoringPreview.mode === "terrain-finish"
            ? {
                ...state.editingState.authoringPreview,
                terrainLayerIndex: nextLayerIndex
              }
            : state.editingState.authoringPreview
      }
    },
    {
      actionId: `placement-action-terrain-layer-${state.placementHistory.length + 1}`,
      actionType: "terrain-update",
      summary: `Switched terrain finish layer to ${nextLayerIndex + 1}`,
      targetIds: [String(nextLayerIndex)],
      createdAt: new Date().toISOString()
    },
  );
}

export function setTerrainMaterialVisibilityMode(
  state: SceneAuthoringState,
  visibilityMode: SceneAuthoringState["editingState"]["terrainMaterialVisibilityMode"],
) {
  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        terrainMaterialVisibilityMode: visibilityMode
      }
    },
    {
      actionId: `placement-action-terrain-visibility-${state.placementHistory.length + 1}`,
      actionType: "terrain-update",
      summary: `Switched terrain finish visibility to ${visibilityMode}`,
      targetIds: [visibilityMode],
      createdAt: new Date().toISOString()
    },
  );
}

function updateAuthoringPreviewState(
  state: SceneAuthoringState,
  patch: Partial<SceneAuthoringState["editingState"]["authoringPreview"]>,
) {
  const nextPreview = {
    ...state.editingState.authoringPreview,
    ...patch
  };
  const currentPreview = state.editingState.authoringPreview;

  if (
    currentPreview.mode === nextPreview.mode &&
    currentPreview.source === nextPreview.source &&
    currentPreview.label === nextPreview.label &&
    currentPreview.surfaceLabel === nextPreview.surfaceLabel &&
    currentPreview.surfaceSlopeDegrees === nextPreview.surfaceSlopeDegrees &&
    currentPreview.surfaceSnapMode === nextPreview.surfaceSnapMode &&
    currentPreview.terrainMaterialId === nextPreview.terrainMaterialId &&
    currentPreview.terrainLayerIndex === nextPreview.terrainLayerIndex &&
    currentPreview.previewDensity === nextPreview.previewDensity &&
    currentPreview.previewRadiusMeters === nextPreview.previewRadiusMeters &&
    currentPreview.visible === nextPreview.visible &&
    currentPreview.activeCategory === nextPreview.activeCategory &&
    currentPreview.draft?.assetRef === nextPreview.draft?.assetRef &&
    pointsRoughlyEqual(currentPreview.worldPoint, nextPreview.worldPoint)
  ) {
    return state;
  }

  return {
    ...state,
    editingState: {
      ...state.editingState,
      authoringPreview: nextPreview
    }
  };
}

export function previewPlacementDraft(
  state: SceneAuthoringState,
  input: {
    draft: PlacementAssetDraft;
    worldPoint: Vector3 | null;
    source?: SceneAuthoringState["editingState"]["authoringPreview"]["source"];
  },
) {
  const pose = input.worldPoint ? resolvePlacementPose(state, input.worldPoint) : null;
  return updateAuthoringPreviewState(state, {
    mode: "placement",
    source: input.source ?? "viewport-arm",
    draft: input.draft,
    worldPoint: pose?.snappedPosition ?? null,
    label:
      pose && input.worldPoint
        ? [
            `Drop ${input.draft.label}`,
            pose.surfaceLabel ? `on ${pose.surfaceLabel}` : "free place",
            pose.surfaceSlopeDegrees > 0 ? `${pose.surfaceSlopeDegrees}° slope` : null
          ]
            .filter((part) => part !== null)
            .join(" · ")
        : `Preview ${input.draft.label}`,
    surfaceLabel: pose?.surfaceLabel ?? null,
    surfaceSlopeDegrees: pose?.surfaceSlopeDegrees ?? 0,
    surfaceSnapMode: pose?.snapMode ?? "none",
    terrainMaterialId: null,
    terrainLayerIndex: 0,
    previewRadiusMeters: input.draft.footprintRadiusMeters,
    previewDensity: 1,
    activeCategory: input.draft.category,
    visible: pose !== null
  });
}

export function previewSceneryBrush(
  state: SceneAuthoringState,
  worldPoint: Vector3 | null,
) {
  const pose = worldPoint ? resolvePlacementPose(state, worldPoint) : null;
  return updateAuthoringPreviewState(state, {
    mode: "scenery-brush",
    source: "viewport-arm",
    draft: null,
    worldPoint: pose?.snappedPosition ?? null,
    label:
      state.editingState.sceneryBrushDrafts.length > 0
        ? `Brush ${state.editingState.sceneryBrushDrafts.length} assets · ${state.editingState.sceneryBrush.minimumSpacingMeters}m spacing`
        : "Load brush-ready assets",
    surfaceLabel: pose?.surfaceLabel ?? null,
    surfaceSlopeDegrees: pose?.surfaceSlopeDegrees ?? 0,
    surfaceSnapMode: pose?.snapMode ?? "none",
    terrainMaterialId: null,
    terrainLayerIndex: 0,
    previewRadiusMeters: state.editingState.sceneryBrush.brushRadiusMeters,
    previewDensity: state.editingState.sceneryBrush.density,
    activeCategory: state.editingState.sceneryBrush.categoryFilters[0] ?? null,
    visible: pose !== null && state.editingState.sceneryBrushDrafts.length > 0
  });
}

export function previewTerrainFinish(
  state: SceneAuthoringState,
  worldPoint: Vector3 | null,
) {
  const pose = worldPoint ? resolvePlacementPose(state, worldPoint) : null;
  return updateAuthoringPreviewState(state, {
    mode: "terrain-finish",
    source: "viewport-arm",
    draft: null,
    worldPoint: pose?.snappedPosition ?? null,
    label: state.editingState.activeTerrainMaterialId
      ? `Paint ${state.editingState.activeTerrainMaterialId}`
      : "Select terrain finish",
    surfaceLabel: pose?.surfaceLabel ?? null,
    surfaceSlopeDegrees: pose?.surfaceSlopeDegrees ?? 0,
    surfaceSnapMode: pose?.snapMode ?? "none",
    terrainMaterialId: state.editingState.activeTerrainMaterialId,
    terrainLayerIndex: state.editingState.activeTerrainMaterialLayerIndex,
    previewRadiusMeters: state.editingState.terrainBrushRadiusMeters,
    previewDensity: 1,
    activeCategory: null,
    visible:
      worldPoint !== null &&
      state.editingState.selectedTerrainRegionId !== null &&
      state.editingState.activeTerrainMaterialId !== null
  });
}

export function clearAuthoringPreview(state: SceneAuthoringState) {
  return updateAuthoringPreviewState(state, {
    mode: "idle",
    source: null,
    draft: null,
    worldPoint: null,
    label: null,
    surfaceLabel: null,
    surfaceSlopeDegrees: 0,
    surfaceSnapMode: "none",
    terrainMaterialId: null,
    terrainLayerIndex: state.editingState.activeTerrainMaterialLayerIndex,
    previewRadiusMeters: 0,
    previewDensity: 0,
    activeCategory: null,
    visible: false
  });
}

export function commitAuthoringPreview(
  state: SceneAuthoringState,
  input?: {
    holeId?: string | null;
  },
) {
  const preview = state.editingState.authoringPreview;
  if (!preview.visible || !preview.worldPoint) {
    return state;
  }

  const holeId = input?.holeId ?? state.viewportState.activeHoleId ?? state.editingState.pendingPlacementHoleId;

  if (preview.mode === "placement" && preview.draft) {
    return clearAuthoringPreview(
      placeSceneObjectFromDraft(state, {
        draft: preview.draft,
        position: preview.worldPoint,
        holeId
      }),
    );
  }

  if (preview.mode === "scenery-brush") {
    return clearAuthoringPreview(
      applySceneryBrushStroke(state, {
        center: preview.worldPoint,
        holeId
      }),
    );
  }

  if (preview.mode === "terrain-finish" && state.editingState.selectedTerrainRegionId) {
    return clearAuthoringPreview(
      applyTerrainMaterialStroke(state, {
        regionId: state.editingState.selectedTerrainRegionId,
        center: preview.worldPoint
      }),
    );
  }

  return state;
}

export function updateRoutingGuideSettings(
  state: SceneAuthoringState,
  patch: Partial<SceneAuthoringState["editingState"]["routingGuideSettings"]>,
) {
  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        routingGuideSettings: {
          ...state.editingState.routingGuideSettings,
          ...patch
        }
      }
    },
    {
      actionId: `placement-action-routing-guide-${state.placementHistory.length + 1}`,
      actionType: "routing-update",
      summary: "Updated routing guide settings",
      targetIds: [],
      createdAt: new Date().toISOString()
    },
  );
}

export function setBuilderGuidanceVisibility(
  state: SceneAuthoringState,
  showBuilderGuidance: boolean,
) {
  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        showBuilderGuidance
      }
    },
    {
      actionId: `placement-action-builder-guidance-${state.placementHistory.length + 1}`,
      actionType: "viewport-update",
      summary: showBuilderGuidance ? "Opened builder guidance" : "Dismissed builder guidance",
      targetIds: [],
      createdAt: new Date().toISOString()
    },
  );
}

export function dismissBuilderGuide(
  state: SceneAuthoringState,
  guideId: string,
) {
  if (state.editingState.dismissedGuideIds.includes(guideId)) {
    return state;
  }

  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        dismissedGuideIds: [...state.editingState.dismissedGuideIds, guideId]
      }
    },
    {
      actionId: `placement-action-builder-guide-dismiss-${state.placementHistory.length + 1}`,
      actionType: "viewport-update",
      summary: `Dismissed builder guide ${guideId}`,
      targetIds: [guideId],
      createdAt: new Date().toISOString()
    },
  );
}

export function restoreBuilderGuides(state: SceneAuthoringState) {
  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        dismissedGuideIds: [],
        showBuilderGuidance: true
      }
    },
    {
      actionId: `placement-action-builder-guide-restore-${state.placementHistory.length + 1}`,
      actionType: "viewport-update",
      summary: "Restored builder guidance cards",
      targetIds: [],
      createdAt: new Date().toISOString()
    },
  );
}

export function setRoutingToolMode(
  state: SceneAuthoringState,
  activeRoutingTool: SceneAuthoringState["editingState"]["activeRoutingTool"],
) {
  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        activeRoutingTool
      }
    },
    {
      actionId: `placement-action-routing-tool-${state.placementHistory.length + 1}`,
      actionType: "routing-update",
      summary: `Switched routing tool to ${activeRoutingTool}`,
      targetIds: [activeRoutingTool],
      createdAt: new Date().toISOString()
    },
  );
}

export function setSimulatorAnchorToolMode(
  state: SceneAuthoringState,
  activeSimulatorAnchorTool: SceneAuthoringState["editingState"]["activeSimulatorAnchorTool"],
) {
  return appendHistory(
    {
      ...state,
      editingState: {
        ...state.editingState,
        activeSimulatorAnchorTool
      }
    },
    {
      actionId: `placement-action-sim-tool-${state.placementHistory.length + 1}`,
      actionType: "simulator-anchor-update",
      summary: `Switched simulator anchor tool to ${activeSimulatorAnchorTool}`,
      targetIds: [activeSimulatorAnchorTool],
      createdAt: new Date().toISOString()
    },
  );
}

export function selectTerrainRegionForEditing(state: SceneAuthoringState, terrainRegionId: string) {
  const region = state.terrainRegions.find((candidate) => candidate.terrainRegionId === terrainRegionId);
  if (!region) {
    return state;
  }

  return appendHistory(
    updateSpatialSelection(
      state,
      [
        {
          entityType: "terrain-region",
          entityId: terrainRegionId,
          holeId: region.holeId,
          note: region.name
        }
      ],
      {
        selectedTerrainRegionId: terrainRegionId,
        pendingPlacementHoleId: region.holeId
      },
    ),
    {
      actionId: `placement-action-select-terrain-${state.placementHistory.length + 1}`,
      actionType: "select",
      summary: `Selected terrain region ${region.name}`,
      targetIds: [terrainRegionId],
      createdAt: new Date().toISOString()
    },
  );
}

export function selectRoutingNodeForEditing(state: SceneAuthoringState, routingNodeId: string) {
  const routingNode = state.routingNodes.find((candidate) => candidate.routingNodeId === routingNodeId);
  if (!routingNode) {
    return state;
  }

  return appendHistory(
    updateSpatialSelection(
      state,
      [
        {
          entityType: "routing-node",
          entityId: routingNodeId,
          holeId: routingNode.holeId,
          note: routingNode.label
        }
      ],
      {
        selectedRoutingNodeId: routingNodeId,
        pendingPlacementHoleId: routingNode.holeId
      },
    ),
    {
      actionId: `placement-action-select-routing-node-${state.placementHistory.length + 1}`,
      actionType: "select",
      summary: `Selected routing node ${routingNode.label}`,
      targetIds: [routingNodeId],
      createdAt: new Date().toISOString()
    },
  );
}

export function selectRoutingSegmentForEditing(state: SceneAuthoringState, routingSegmentId: string) {
  const routingSegment = state.routingSegments.find(
    (candidate) => candidate.routingSegmentId === routingSegmentId,
  );
  if (!routingSegment) {
    return state;
  }

  return appendHistory(
    updateSpatialSelection(
      state,
      [
        {
          entityType: "routing-segment",
          entityId: routingSegmentId,
          holeId: routingSegment.holeId,
          note: routingSegment.kind
        }
      ],
      {
        selectedRoutingSegmentId: routingSegmentId,
        pendingPlacementHoleId: routingSegment.holeId
      },
    ),
    {
      actionId: `placement-action-select-routing-segment-${state.placementHistory.length + 1}`,
      actionType: "select",
      summary: `Selected routing segment ${routingSegment.kind}`,
      targetIds: [routingSegmentId],
      createdAt: new Date().toISOString()
    },
  );
}

export function selectFairwayCorridorForEditing(state: SceneAuthoringState, fairwayCorridorId: string) {
  const corridor = state.fairwayCorridors.find((candidate) => candidate.fairwayCorridorId === fairwayCorridorId);
  if (!corridor) {
    return state;
  }

  return appendHistory(
    updateSpatialSelection(
      state,
      [
        {
          entityType: "fairway-corridor",
          entityId: fairwayCorridorId,
          holeId: corridor.holeId,
          note: corridor.note
        }
      ],
      {
        selectedFairwayCorridorId: fairwayCorridorId,
        pendingPlacementHoleId: corridor.holeId
      },
    ),
    {
      actionId: `placement-action-select-fairway-corridor-${state.placementHistory.length + 1}`,
      actionType: "select",
      summary: "Selected fairway corridor",
      targetIds: [fairwayCorridorId],
      createdAt: new Date().toISOString()
    },
  );
}

export function selectVisibilityCorridorForEditing(state: SceneAuthoringState, visibilityCorridorId: string) {
  const corridor = state.visibilityCorridors.find(
    (candidate) => candidate.visibilityCorridorId === visibilityCorridorId,
  );
  if (!corridor) {
    return state;
  }

  return appendHistory(
    updateSpatialSelection(
      state,
      [
        {
          entityType: "visibility-corridor",
          entityId: visibilityCorridorId,
          holeId: corridor.holeId,
          note: corridor.note
        }
      ],
      {
        selectedVisibilityCorridorId: visibilityCorridorId,
        pendingPlacementHoleId: corridor.holeId
      },
    ),
    {
      actionId: `placement-action-select-visibility-corridor-${state.placementHistory.length + 1}`,
      actionType: "select",
      summary: "Selected visibility corridor",
      targetIds: [visibilityCorridorId],
      createdAt: new Date().toISOString()
    },
  );
}

export function selectPlayRouteEnvelopeForEditing(state: SceneAuthoringState, playRouteEnvelopeId: string) {
  const envelope = state.playRouteEnvelopes.find(
    (candidate) => candidate.playRouteEnvelopeId === playRouteEnvelopeId,
  );
  if (!envelope) {
    return state;
  }

  return appendHistory(
    updateSpatialSelection(
      state,
      [
        {
          entityType: "play-route-envelope",
          entityId: playRouteEnvelopeId,
          holeId: envelope.holeId,
          note: envelope.note
        }
      ],
      {
        selectedPlayRouteEnvelopeId: playRouteEnvelopeId,
        pendingPlacementHoleId: envelope.holeId
      },
    ),
    {
      actionId: `placement-action-select-play-route-envelope-${state.placementHistory.length + 1}`,
      actionType: "select",
      summary: "Selected play-route envelope",
      targetIds: [playRouteEnvelopeId],
      createdAt: new Date().toISOString()
    },
  );
}

export function selectHazardZoneForEditing(state: SceneAuthoringState, hazardZoneId: string) {
  const zone = state.hazardZones.find((candidate) => candidate.hazardZoneId === hazardZoneId);
  if (!zone) {
    return state;
  }

  return appendHistory(
    updateSpatialSelection(
      state,
      [
        {
          entityType: "hazard-zone",
          entityId: hazardZoneId,
          holeId: zone.holeId,
          note: zone.hazardLabel
        }
      ],
      {
        selectedHazardZoneId: hazardZoneId,
        pendingPlacementHoleId: zone.holeId
      },
    ),
    {
      actionId: `placement-action-select-hazard-zone-${state.placementHistory.length + 1}`,
      actionType: "select",
      summary: `Selected hazard zone ${zone.hazardLabel}`,
      targetIds: [hazardZoneId],
      createdAt: new Date().toISOString()
    },
  );
}

export function selectOutOfBoundsZoneForEditing(state: SceneAuthoringState, outOfBoundsZoneId: string) {
  const zone = state.outOfBoundsZones.find((candidate) => candidate.outOfBoundsZoneId === outOfBoundsZoneId);
  if (!zone) {
    return state;
  }

  return appendHistory(
    updateSpatialSelection(
      state,
      [
        {
          entityType: "out-of-bounds-zone",
          entityId: outOfBoundsZoneId,
          holeId: zone.holeId,
          note: zone.sideLabel
        }
      ],
      {
        selectedOutOfBoundsZoneId: outOfBoundsZoneId,
        pendingPlacementHoleId: zone.holeId
      },
    ),
    {
      actionId: `placement-action-select-oob-zone-${state.placementHistory.length + 1}`,
      actionType: "select",
      summary: `Selected OB boundary ${zone.sideLabel}`,
      targetIds: [outOfBoundsZoneId],
      createdAt: new Date().toISOString()
    },
  );
}

export function selectDropZoneAreaForEditing(state: SceneAuthoringState, dropZoneAreaId: string) {
  const zone = state.dropZoneAreas.find((candidate) => candidate.dropZoneAreaId === dropZoneAreaId);
  if (!zone) {
    return state;
  }

  return appendHistory(
    updateSpatialSelection(
      state,
      [
        {
          entityType: "drop-zone-area",
          entityId: dropZoneAreaId,
          holeId: zone.holeId,
          note: "Drop zone area"
        }
      ],
      {
        selectedDropZoneAreaId: dropZoneAreaId,
        pendingPlacementHoleId: zone.holeId
      },
    ),
    {
      actionId: `placement-action-select-drop-zone-${state.placementHistory.length + 1}`,
      actionType: "select",
      summary: "Selected drop zone area",
      targetIds: [dropZoneAreaId],
      createdAt: new Date().toISOString()
    },
  );
}

export function createTerrainRegionForHole(
  state: SceneAuthoringState,
  input: {
    holeId: string;
    gameplayPurpose: TerrainGameplayPurpose;
    terrainProfileId?: string;
    name?: string;
    center?: Partial<Vector3>;
  },
) {
  const activeCollection = getActiveSceneCollection(state);
  if (!activeCollection) {
    return state;
  }

  const holeCenter = {
    ...createHoleCenter(input.holeId),
    ...input.center
  };
  const terrainRegionId = nextId(
    "terrain-region",
    state.terrainRegions.map((region) => region.terrainRegionId),
  );
  const nextRegion = createTerrainRegion({
    terrainRegionId,
    collectionId: activeCollection.collectionId,
    holeId: input.holeId,
    name: input.name ?? `Hole ${inferHoleOrdinal(input.holeId)} ${input.gameplayPurpose}`,
    gameplayPurpose: input.gameplayPurpose,
    terrainProfileId:
      input.terrainProfileId ?? state.terrainProfiles[0]?.terrainProfileId ?? "terrain-profile-fairway",
    boundary: createRectBoundary(holeCenter, 42, 22),
    elevationMin: holeCenter.y,
    elevationMax: holeCenter.y + 1
  });

  return appendHistory(
    updateSpatialSelection(
      {
        ...state,
        terrainRegions: [...state.terrainRegions, nextRegion]
      },
      [
        {
          entityType: "terrain-region",
          entityId: terrainRegionId,
          holeId: input.holeId,
          note: nextRegion.name
        }
      ],
      {
        selectedTerrainRegionId: terrainRegionId,
        pendingPlacementHoleId: input.holeId
      },
    ),
    {
      actionId: `placement-action-terrain-create-${state.placementHistory.length + 1}`,
      actionType: "terrain-update",
      summary: `Created terrain region ${nextRegion.name}`,
      targetIds: [terrainRegionId],
      createdAt: new Date().toISOString()
    },
  );
}

export function reshapeTerrainRegionBoundary(
  state: SceneAuthoringState,
  terrainRegionId: string,
  options: {
    boundary?: Vector3[];
    translateBy?: Partial<Vector3>;
    scaleX?: number;
    scaleZ?: number;
  },
) {
  const terrainRegion = state.terrainRegions.find((candidate) => candidate.terrainRegionId === terrainRegionId);
  if (!terrainRegion) {
    return state;
  }

  let nextBoundary = options.boundary ?? terrainRegion.boundary.points;
  if (options.translateBy) {
    nextBoundary = translatePoints(nextBoundary, options.translateBy);
  }
  if (options.scaleX || options.scaleZ) {
    nextBoundary = scalePointsFromCentroid(nextBoundary, options.scaleX ?? 1, options.scaleZ ?? 1);
  }

  return appendHistory(
    {
      ...state,
      terrainRegions: state.terrainRegions.map((candidate) =>
        candidate.terrainRegionId === terrainRegionId
          ? {
              ...candidate,
              boundary: {
                points: nextBoundary
              }
            }
          : candidate,
      )
    },
    {
      actionId: `placement-action-terrain-reshape-${state.placementHistory.length + 1}`,
      actionType: "terrain-update",
      summary: `Reshaped terrain region ${terrainRegion.name}`,
      targetIds: [terrainRegionId],
      createdAt: new Date().toISOString()
    },
  );
}

export function assignTerrainRegionPurpose(
  state: SceneAuthoringState,
  terrainRegionId: string,
  gameplayPurpose: TerrainGameplayPurpose,
) {
  return appendHistory(
    {
      ...state,
      terrainRegions: state.terrainRegions.map((candidate) =>
        candidate.terrainRegionId === terrainRegionId
          ? {
              ...candidate,
              gameplayPurpose
            }
          : candidate,
      )
    },
    {
      actionId: `placement-action-terrain-purpose-${state.placementHistory.length + 1}`,
      actionType: "terrain-update",
      summary: `Assigned terrain gameplay purpose ${gameplayPurpose}`,
      targetIds: [terrainRegionId],
      createdAt: new Date().toISOString()
    },
  );
}

export function assignTerrainRegionProfile(
  state: SceneAuthoringState,
  terrainRegionId: string,
  terrainProfileId: string,
) {
  return appendHistory(
    {
      ...state,
      terrainRegions: state.terrainRegions.map((candidate) =>
        candidate.terrainRegionId === terrainRegionId
          ? {
              ...candidate,
              terrainProfileId
            }
          : candidate,
      )
    },
    {
      actionId: `placement-action-terrain-profile-${state.placementHistory.length + 1}`,
      actionType: "terrain-update",
      summary: `Assigned terrain profile ${terrainProfileId}`,
      targetIds: [terrainRegionId],
      createdAt: new Date().toISOString()
    },
  );
}

export function attachTerrainRegionToHole(
  state: SceneAuthoringState,
  terrainRegionId: string,
  holeId: string | null,
) {
  return appendHistory(
    {
      ...state,
      terrainRegions: state.terrainRegions.map((candidate) =>
        candidate.terrainRegionId === terrainRegionId
          ? {
              ...candidate,
              holeId
            }
          : candidate,
      ),
      editingState: {
        ...state.editingState,
        pendingPlacementHoleId: holeId
      }
    },
    {
      actionId: `placement-action-terrain-hole-${state.placementHistory.length + 1}`,
      actionType: "terrain-update",
      summary: holeId ? `Attached terrain region to ${holeId}` : "Cleared terrain region hole attachment",
      targetIds: [terrainRegionId, ...(holeId ? [holeId] : [])],
      createdAt: new Date().toISOString()
    },
  );
}

export function upsertTerrainModifierForRegion(
  state: SceneAuthoringState,
  input: {
    regionId: string;
    kind: TerrainModifierKind;
    strength?: number;
    targetHeight?: number | null;
  },
) {
  const region = state.terrainRegions.find((candidate) => candidate.terrainRegionId === input.regionId);
  if (!region) {
    return state;
  }

  const existingModifier =
    state.terrainModifiers.find((modifier) => modifier.regionId === input.regionId && modifier.kind === input.kind) ??
    null;
  const terrainModifierId =
    existingModifier?.terrainModifierId ??
    nextId("terrain-modifier", state.terrainModifiers.map((modifier) => modifier.terrainModifierId));
  const nextModifier = createTerrainModifier({
    terrainModifierId,
    holeId: region.holeId,
    regionId: region.terrainRegionId,
    kind: input.kind,
    strength: input.strength ?? existingModifier?.strength ?? 0.45,
    targetHeight: input.targetHeight ?? existingModifier?.targetHeight ?? null,
    falloffMeters: existingModifier?.falloffMeters ?? 8,
    bounds: region.boundary.points,
    note: existingModifier?.note ?? `${input.kind} modifier for ${region.name}.`
  });

  return appendHistory(
    {
      ...state,
      terrainModifiers: [
        ...state.terrainModifiers.filter((modifier) => modifier.terrainModifierId !== terrainModifierId),
        nextModifier
      ],
      editingState: {
        ...state.editingState,
        selectedTerrainModifierId: terrainModifierId
      }
    },
    {
      actionId: `placement-action-terrain-modifier-${state.placementHistory.length + 1}`,
      actionType: "terrain-update",
      summary: `${existingModifier ? "Updated" : "Created"} terrain modifier ${input.kind}`,
      targetIds: [terrainModifierId, region.terrainRegionId],
      createdAt: new Date().toISOString()
    },
  );
}

export function updateTerrainModifier(
  state: SceneAuthoringState,
  terrainModifierId: string,
  patch: Partial<
    Pick<
      SceneAuthoringState["terrainModifiers"][number],
      "strength" | "falloffMeters" | "targetHeight" | "note"
    >
  >,
) {
  return appendHistory(
    {
      ...state,
      terrainModifiers: state.terrainModifiers.map((modifier) =>
        modifier.terrainModifierId === terrainModifierId
          ? {
              ...modifier,
              ...patch
            }
          : modifier,
      )
    },
    {
      actionId: `placement-action-terrain-modifier-update-${state.placementHistory.length + 1}`,
      actionType: "terrain-update",
      summary: "Updated terrain modifier",
      targetIds: [terrainModifierId],
      createdAt: new Date().toISOString()
    },
  );
}

export function applyTerrainSculptStroke(
  state: SceneAuthoringState,
  input: {
    regionId: string;
    center: Vector3;
    mode?: TerrainSculptMode;
    radiusMeters?: number;
    strength?: number;
    falloffMeters?: number;
    targetHeight?: number | null;
  },
) {
  const region = state.terrainRegions.find((candidate) => candidate.terrainRegionId === input.regionId);
  if (!region) {
    return state;
  }

  const mode = input.mode ?? state.editingState.terrainSculptMode;
  const radiusMeters = input.radiusMeters ?? state.editingState.terrainBrushRadiusMeters;
  const strength = input.strength ?? state.editingState.terrainBrushStrength;
  const falloffMeters = input.falloffMeters ?? state.editingState.terrainBrushFalloffMeters;
  const targetHeight = input.targetHeight ?? state.editingState.terrainBrushTargetHeight ?? null;
  const modifierId = nextId(
    `terrain-modifier-${mode}`,
    state.terrainModifiers.map((modifier) => modifier.terrainModifierId),
  );
  const modifierKind = terrainModifierKindForSculptMode(mode);
  const elevationDelta =
    mode === "raise"
      ? strength * 2.4
      : mode === "lower"
        ? -strength * 2.4
        : mode === "flatten"
          ? 0
          : 0;
  const currentSpan = region.elevationMax - region.elevationMin;
  const nextRegion =
    mode === "smooth"
      ? {
          ...region,
          elevationMin: region.elevationMin + currentSpan * 0.18 * strength,
          elevationMax: region.elevationMax - currentSpan * 0.18 * strength
        }
      : mode === "flatten"
        ? {
            ...region,
            elevationMin: (targetHeight ?? region.elevationMin + currentSpan / 2) - 0.2,
            elevationMax: (targetHeight ?? region.elevationMin + currentSpan / 2) + 0.2
          }
        : {
            ...region,
            elevationMin: region.elevationMin + elevationDelta,
            elevationMax: region.elevationMax + elevationDelta
          };

  return appendHistory(
    {
      ...state,
      terrainRegions: state.terrainRegions.map((candidate) =>
        candidate.terrainRegionId === region.terrainRegionId ? nextRegion : candidate,
      ),
      terrainModifiers: [
        ...state.terrainModifiers,
        createTerrainModifier({
          terrainModifierId: modifierId,
          holeId: region.holeId,
          regionId: region.terrainRegionId,
          kind: modifierKind,
          strength,
          falloffMeters,
          targetHeight,
          bounds: createCircularBoundary(input.center, radiusMeters),
          note: `${mode} sculpt stroke on ${region.name}`
        })
      ],
      editingState: {
        ...state.editingState,
        selectedTerrainModifierId: modifierId
      }
    },
    {
      actionId: `placement-action-terrain-sculpt-${state.placementHistory.length + 1}`,
      actionType: "terrain-update",
      summary: `${mode} sculpted ${region.name}`,
      targetIds: [region.terrainRegionId, modifierId],
      createdAt: new Date().toISOString()
    },
  );
}

export function applyTerrainMaterialStroke(
  state: SceneAuthoringState,
  input: {
    regionId: string;
    center: Vector3;
    terrainMaterialId?: string | null;
    blendMode?: TerrainMaterialBlendMode;
    brushRadiusMeters?: number;
    brushStrength?: number;
    brushFalloffMeters?: number;
  },
) {
  const region = state.terrainRegions.find((candidate) => candidate.terrainRegionId === input.regionId);
  const terrainMaterialId = input.terrainMaterialId ?? state.editingState.activeTerrainMaterialId;
  if (!region || !terrainMaterialId) {
    return state;
  }

  const material = state.terrainMaterialPalette.find((candidate) => candidate.terrainMaterialId === terrainMaterialId);
  if (!material) {
    return state;
  }

  const brushRadiusMeters = input.brushRadiusMeters ?? state.editingState.terrainBrushRadiusMeters;
  const brushStrength = input.brushStrength ?? state.editingState.terrainBrushStrength;
  const brushFalloffMeters = input.brushFalloffMeters ?? state.editingState.terrainBrushFalloffMeters;
  const blendMode = input.blendMode ?? state.editingState.terrainPaintBlendMode;
  const layerIndex = state.editingState.activeTerrainMaterialLayerIndex;
  const terrainPaintStrokeId = nextId(
    "terrain-paint-stroke",
    state.terrainPaintStrokes.map((stroke) => stroke.terrainPaintStrokeId),
  );

  return appendHistory(
    {
      ...state,
      terrainRegions: state.terrainRegions.map((candidate) =>
        candidate.terrainRegionId === region.terrainRegionId
          ? {
              ...candidate,
              paintedMaterialIds: Array.from(new Set([...candidate.paintedMaterialIds, terrainMaterialId]))
            }
          : candidate,
      ),
      terrainPaintStrokes: [
        ...state.terrainPaintStrokes,
        createTerrainPaintStroke({
          terrainPaintStrokeId,
          holeId: region.holeId,
          regionId: region.terrainRegionId,
          terrainMaterialId,
          blendMode,
          layerIndex,
          opacity: Number(
            Math.min(
              1,
              Math.max(0.18, blendMode === "blend" ? material.blendBias + brushStrength * 0.32 : 0.62 + brushStrength * 0.36),
            ).toFixed(2),
          ),
          brushRadiusMeters,
          brushStrength,
          brushFalloffMeters,
          bounds: createCircularBoundary(input.center, brushRadiusMeters),
          note: `${material.label} ${blendMode} stroke on ${region.name} (layer ${layerIndex + 1})`
        })
      ]
    },
    {
      actionId: `placement-action-terrain-paint-${state.placementHistory.length + 1}`,
      actionType: "terrain-update",
      summary: `Painted ${material.label} onto ${region.name}`,
      targetIds: [region.terrainRegionId, terrainPaintStrokeId, terrainMaterialId],
      createdAt: new Date().toISOString()
    },
  );
}

export function placeSceneObjectFromDraft(
  state: SceneAuthoringState,
  input: {
    draft: PlacementAssetDraft;
    position: Vector3;
    holeId?: string | null;
  },
) {
  const activeCollection = getActiveSceneCollection(state);
  if (!activeCollection) {
    return state;
  }

  const placementPose = resolvePlacementPose(state, input.position);
  const sceneObjectId = nextSceneObjectId(state);
  const placementLayerId = resolvePlacementLayerIdForCategory(state, input.draft.category);
  const nextSceneObject = createSceneObject({
    sceneObjectId,
    collectionId: activeCollection.collectionId,
    name: input.draft.label,
    category: input.draft.category,
    objectType: input.draft.objectType,
    assetRef: input.draft.assetRef,
    placementLayerId,
    transform: {
      position: placementPose.snappedPosition,
      rotation: {
        ...placementPose.rotation
      },
      scale: {
        x: 1,
        y: 1,
        z: 1
      },
      pivotOffset: {
        x: 0,
        y: 0,
        z: 0
      },
      originPreset: "asset-origin"
    },
    tags: Array.from(
      new Set([
        ...input.draft.tags,
        ...(input.draft.packId ? [input.draft.packId] : []),
        ...(placementPose.snapMode === "terrain-region" ? ["terrain-snapped"] : []),
        ...(placementPose.snapMode === "simulator-surface" ? ["surface-snapped"] : []),
        "placed-from-pack"
      ]),
    )
  });

  return appendHistory(
    {
      ...state,
      sceneObjects: [...state.sceneObjects, nextSceneObject],
      parentRelationships: [
        ...state.parentRelationships,
        createRelationship(sceneObjectId, "object", null, "collection")
      ],
      selectionState: {
        ...state.selectionState,
        selectedObjectIds: [sceneObjectId],
        selectedGroupIds: [],
        selectedSpatialEntityRefs: [],
        primarySelectionId: sceneObjectId
      },
      editingState: {
        ...state.editingState,
        pendingPlacementHoleId: input.holeId ?? state.editingState.pendingPlacementHoleId
      }
    },
    {
      actionId: `placement-action-scene-object-place-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary: `Placed ${input.draft.label}`,
      targetIds: [sceneObjectId, input.draft.assetRef],
      createdAt: new Date().toISOString()
    },
  );
}

export function applySceneryBrushStroke(
  state: SceneAuthoringState,
  input: {
    center: Vector3;
    holeId?: string | null;
  },
) {
  if (state.editingState.sceneryBrushDrafts.length === 0) {
    return state;
  }

  const activeCollection = getActiveSceneCollection(state);
  if (!activeCollection) {
    return state;
  }

  const {
    brushRadiusMeters,
    density,
    randomness,
    rotationVarianceDegrees,
    scaleVariancePercent,
    minimumSpacingMeters,
    avoidPlayableCoreStrength,
    slopeLimitDegrees,
    placementRules
  } = state.editingState.sceneryBrush;
  const categoryFilters = new Set(state.editingState.sceneryBrush.categoryFilters);
  const eligibleDrafts = state.editingState.sceneryBrushDrafts.filter((draft) =>
    categoryFilters.size === 0 ? true : categoryFilters.has(draft.category),
  );
  if (eligibleDrafts.length === 0) {
    return state;
  }

  const playableCoreAnchors = collectPlayableCoreAnchors(state);
  const occupiedPositions = state.sceneObjects.map((sceneObject) => sceneObject.transform.position);

  const nextObjects = Array.from({ length: density }, (_, index) => {
    const seed = state.sceneObjects.length + index + 1;
    const draft = pickWeightedPlacementDraft(state, eligibleDrafts, seed) ?? eligibleDrafts[0]!;
    const ruleSet = draft.placementRules.length > 0 ? draft.placementRules : placementRules;
    const jitterStrength = randomness * brushRadiusMeters * 0.24;
    let placementPose = resolvePlacementPose(state, input.center);

    for (let attempt = 0; attempt < 7; attempt += 1) {
      const basePoint = applyBrushPlacementRuleOffset(input.center, brushRadiusMeters, ruleSet, seed + attempt * 13);
      const candidatePoint = {
        x: basePoint.x + randomCentered(seed + 11 + attempt * 17) * jitterStrength,
        y: input.center.y,
        z: basePoint.z + randomCentered(seed + 19 + attempt * 19) * jitterStrength
      };
      const candidatePose = resolvePlacementPose(state, candidatePoint);
      const candidateRejected =
        isPlacementTooClose(candidatePose.snappedPosition, occupiedPositions, minimumSpacingMeters) ||
        (candidatePose.surfaceSlopeDegrees > slopeLimitDegrees && candidatePose.snapMode === "terrain-region") ||
        ((ruleSet.includes("avoid-playable-core") || avoidPlayableCoreStrength > 0) &&
          violatesPlayableCoreTendency(
            candidatePose.snappedPosition,
            playableCoreAnchors,
            brushRadiusMeters,
            avoidPlayableCoreStrength,
          ));

      placementPose = candidatePose;
      if (!candidateRejected) {
        break;
      }
    }

    occupiedPositions.push(placementPose.snappedPosition);
    const rotationY = snapRotationDegrees(state, randomCentered(seed + 23) * rotationVarianceDegrees);
    const scaleFactor = clamp(
      1 + randomCentered(seed + 31) * (scaleVariancePercent / 100),
      0.4,
      2.2,
    );
    const sceneObjectId = `${nextSceneObjectId(state)}-brush-${index + 1}`;

    return createSceneObject({
      sceneObjectId,
      collectionId: activeCollection.collectionId,
      name: `${draft.label} ${index + 1}`,
      category: draft.category,
      objectType: draft.objectType,
      assetRef: draft.assetRef,
      placementLayerId: resolvePlacementLayerIdForCategory(state, draft.category),
      transform: {
        position: placementPose.snappedPosition,
        rotation: {
          x: placementPose.rotation.x,
          y: rotationY,
          z: placementPose.rotation.z
        },
        scale: { x: scaleFactor, y: scaleFactor, z: scaleFactor },
        pivotOffset: { x: 0, y: 0, z: 0 },
        originPreset: "asset-origin"
      },
      tags: Array.from(
        new Set([
          ...draft.tags,
          ...(draft.packId ? [draft.packId] : []),
          ...(placementPose.snapMode === "terrain-region" ? ["terrain-snapped"] : []),
          ...(placementPose.snapMode === "simulator-surface" ? ["surface-snapped"] : []),
          "scenery-brush"
        ]),
      )
    });
  });

  return appendHistory(
    {
      ...state,
      sceneObjects: [...state.sceneObjects, ...nextObjects],
      parentRelationships: [
        ...state.parentRelationships,
        ...nextObjects.map((sceneObject) => createRelationship(sceneObject.sceneObjectId, "object", null, "collection"))
      ],
      selectionState: {
        ...state.selectionState,
        selectedObjectIds: nextObjects.map((sceneObject) => sceneObject.sceneObjectId),
        selectedGroupIds: [],
        selectedSpatialEntityRefs: [],
        primarySelectionId: nextObjects[0]?.sceneObjectId ?? null
      },
      editingState: {
        ...state.editingState,
        pendingPlacementHoleId: input.holeId ?? state.editingState.pendingPlacementHoleId
      }
    },
    {
      actionId: `placement-action-scenery-brush-${state.placementHistory.length + 1}`,
      actionType: "placement-update",
      summary: `Brushed ${nextObjects.length} scenery placements`,
      targetIds: nextObjects.map((sceneObject) => sceneObject.sceneObjectId),
      createdAt: new Date().toISOString()
    },
  );
}

export function addRoutingNodeForHole(
  state: SceneAuthoringState,
  input: {
    holeId: string;
    kind: RoutingNodeKind;
    position?: Partial<Vector3>;
    linkedSceneObjectId?: string | null;
    linkedZoneId?: string | null;
    label?: string;
  },
) {
  const nodeCenter = createHoleCenter(input.holeId);
  const routingAnchor = resolveRoutingAnchorNode(state, input.holeId);
  const requestedPosition = {
    ...nodeCenter,
    ...input.position
  };
  const guideSettings = state.editingState.routingGuideSettings;
  const snappedPosition = routingAnchor
    ? applyRoutingAngleSnap(
        state,
        routingAnchor.position,
        {
          ...requestedPosition,
          y: guideSettings.workingHeightMeters
        },
      )
    : requestedPosition;
  const position = snapWorldPoint(state, {
    ...snappedPosition,
    y: guideSettings.workingHeightMeters
  });
  const routingNodeId = nextId("routing-node", state.routingNodes.map((node) => node.routingNodeId));
  const nextNode = createRoutingNode({
    routingNodeId,
    holeId: input.holeId,
    kind: input.kind,
    label: input.label ?? defaultRoutingLabel(input.kind, input.holeId),
    position,
    linkedSceneObjectId: input.linkedSceneObjectId ?? null,
    linkedZoneId: input.linkedZoneId ?? null
  });
  let nextRoutingSegments = state.routingSegments.slice();
  let selectedRoutingSegmentId: string | null = null;

  if (guideSettings.autoConnectEnabled && routingAnchor) {
    const duplicateSegment = nextRoutingSegments.some(
      (segment) =>
        segment.holeId === input.holeId &&
        segment.fromNodeId === routingAnchor.routingNodeId &&
        segment.toNodeId === routingNodeId,
    );

    if (!duplicateSegment) {
      const routingSegmentId = nextId(
        "routing-segment",
        nextRoutingSegments.map((segment) => segment.routingSegmentId),
      );
      nextRoutingSegments = [
        ...nextRoutingSegments,
        createRoutingSegment({
          routingSegmentId,
          holeId: input.holeId,
          fromNodeId: routingAnchor.routingNodeId,
          toNodeId: routingNodeId,
          kind: "primary-shot",
          controlLine: [routingAnchor.position, position],
          targetWidthMeters: guideSettings.defaultSegmentWidthMeters
        })
      ];
      selectedRoutingSegmentId = routingSegmentId;
    }
  }

  const nextState = upsertHoleRoutingArtifacts(
    {
      ...state,
      routingNodes: [...state.routingNodes, nextNode],
      routingSegments: nextRoutingSegments,
      editingState: {
        ...state.editingState,
        selectedRoutingNodeId: routingNodeId,
        selectedRoutingSegmentId,
        pendingPlacementHoleId: input.holeId
      },
      selectionState: {
        ...state.selectionState,
        selectedSpatialEntityRefs: [
          {
            entityType: "routing-node",
            entityId: routingNodeId,
            holeId: input.holeId,
            note: nextNode.label
          }
        ],
        primarySelectionId: routingNodeId
      }
    },
    input.holeId,
  );

  return appendHistory(
    nextState,
    {
      actionId: `placement-action-routing-node-add-${state.placementHistory.length + 1}`,
      actionType: "routing-update",
      summary: guideSettings.autoConnectEnabled && routingAnchor
        ? `Added routing node ${nextNode.label} and auto-connected it`
        : `Added routing node ${nextNode.label}`,
      targetIds: [routingNodeId, ...(selectedRoutingSegmentId ? [selectedRoutingSegmentId] : [])],
      createdAt: new Date().toISOString()
    },
  );
}

function mergeRoutingNodeIntoCandidateState(
  state: SceneAuthoringState,
  routingNodeId: string,
  mergeCandidateId: string,
) {
  const routingNode = state.routingNodes.find((candidate) => candidate.routingNodeId === routingNodeId);
  const mergeCandidate = state.routingNodes.find((candidate) => candidate.routingNodeId === mergeCandidateId);
  if (!routingNode || !mergeCandidate) {
    return state;
  }

  const rewiredSegments = state.routingSegments
    .map((segment) => {
      if (segment.fromNodeId !== routingNodeId && segment.toNodeId !== routingNodeId) {
        return segment;
      }

      const nextFromNodeId =
        segment.fromNodeId === routingNodeId ? mergeCandidate.routingNodeId : segment.fromNodeId;
      const nextToNodeId =
        segment.toNodeId === routingNodeId ? mergeCandidate.routingNodeId : segment.toNodeId;

      if (nextFromNodeId === nextToNodeId) {
        return null;
      }

      return {
        ...segment,
        fromNodeId: nextFromNodeId,
        toNodeId: nextToNodeId,
        controlLine: {
          points: segment.controlLine.points.map((point, index, points) =>
            index === 0
              ? nextFromNodeId === mergeCandidate.routingNodeId
                ? mergeCandidate.position
                : point
              : index === points.length - 1
                ? nextToNodeId === mergeCandidate.routingNodeId
                  ? mergeCandidate.position
                  : point
                : point,
          )
        }
      };
    })
    .filter((segment): segment is NonNullable<typeof segment> => segment !== null);

  const dedupedSegments = rewiredSegments.filter((segment, index, candidates) => {
    const key = `${segment.holeId}:${segment.fromNodeId}->${segment.toNodeId}`;
    return (
      candidates.findIndex(
        (candidate) => `${candidate.holeId}:${candidate.fromNodeId}->${candidate.toNodeId}` === key,
      ) === index
    );
  });

  return upsertHoleRoutingArtifacts(
    {
      ...state,
      routingNodes: state.routingNodes.filter((candidate) => candidate.routingNodeId !== routingNodeId),
      routingSegments: dedupedSegments,
      selectionState: {
        ...state.selectionState,
        selectedSpatialEntityRefs: state.selectionState.selectedSpatialEntityRefs.map((reference) =>
          reference.entityType === "routing-node" && reference.entityId === routingNodeId
            ? {
                ...reference,
                entityId: mergeCandidate.routingNodeId,
                note: mergeCandidate.label
              }
            : reference,
        )
      },
      editingState: {
        ...state.editingState,
        selectedRoutingNodeId:
          state.editingState.selectedRoutingNodeId === routingNodeId
            ? mergeCandidate.routingNodeId
            : state.editingState.selectedRoutingNodeId,
        pendingConnectionStartNodeId:
          state.editingState.pendingConnectionStartNodeId === routingNodeId
            ? mergeCandidate.routingNodeId
            : state.editingState.pendingConnectionStartNodeId
      }
    },
    routingNode.holeId,
  );
}

function findClosestRoutingMergePair(
  state: SceneAuthoringState,
  holeId?: string | null,
) {
  let bestPair:
    | {
        distance: number;
        sourceId: string;
        targetId: string;
        holeId: string;
      }
    | null = null;

  for (let index = 0; index < state.routingNodes.length; index += 1) {
    const node = state.routingNodes[index]!;
    if (holeId && node.holeId !== holeId) {
      continue;
    }
    for (let compareIndex = index + 1; compareIndex < state.routingNodes.length; compareIndex += 1) {
      const candidate = state.routingNodes[compareIndex]!;
      if (node.holeId !== candidate.holeId || (holeId && candidate.holeId !== holeId)) {
        continue;
      }
      const distance = planarDistance(node.position, candidate.position);
      if (distance > state.editingState.routingGuideSettings.mergeToleranceMeters) {
        continue;
      }
      if (!bestPair || distance < bestPair.distance) {
        bestPair = {
          distance,
          sourceId: candidate.routingNodeId,
          targetId: node.routingNodeId,
          holeId: node.holeId
        };
      }
    }
  }

  return bestPair;
}

export function moveRoutingNode(
  state: SceneAuthoringState,
  routingNodeId: string,
  position: Partial<Vector3>,
) {
  const routingNode = state.routingNodes.find((candidate) => candidate.routingNodeId === routingNodeId);
  if (!routingNode) {
    return state;
  }

  const nextPosition = {
    ...routingNode.position,
    ...position
  };
  const mergeCandidate =
    state.editingState.routingGuideSettings.autoMergeEnabled
      ? state.routingNodes
          .filter(
            (candidate) =>
              candidate.routingNodeId !== routingNodeId &&
              candidate.holeId === routingNode.holeId &&
              planarDistance(candidate.position, nextPosition) <=
                state.editingState.routingGuideSettings.mergeToleranceMeters,
          )
          .sort(
            (left, right) =>
              planarDistance(left.position, nextPosition) - planarDistance(right.position, nextPosition),
          )[0] ?? null
      : null;

  if (mergeCandidate) {
    const nextState = mergeRoutingNodeIntoCandidateState(state, routingNodeId, mergeCandidate.routingNodeId);

    return appendHistory(
      nextState,
      {
        actionId: `placement-action-routing-node-merge-${state.placementHistory.length + 1}`,
        actionType: "routing-update",
        summary: `Merged routing node ${routingNode.label} into ${mergeCandidate.label}`,
        targetIds: [routingNodeId, mergeCandidate.routingNodeId],
        createdAt: new Date().toISOString()
      },
    );
  }

  const nextState = upsertHoleRoutingArtifacts(
    {
      ...state,
      routingNodes: state.routingNodes.map((candidate) =>
        candidate.routingNodeId === routingNodeId
          ? {
              ...candidate,
              position: nextPosition
            }
          : candidate,
      ),
      routingSegments: state.routingSegments.map((segment) => {
        if (segment.fromNodeId !== routingNodeId && segment.toNodeId !== routingNodeId) {
          return segment;
        }

        const nextControlPoints = segment.controlLine.points.slice();
        if (segment.fromNodeId === routingNodeId) {
          nextControlPoints[0] = nextPosition;
        }
        if (segment.toNodeId === routingNodeId) {
          nextControlPoints[nextControlPoints.length - 1] = nextPosition;
        }

        return {
          ...segment,
          controlLine: {
            points: nextControlPoints
          }
        };
      })
    },
    routingNode.holeId,
  );

  return appendHistory(
    nextState,
    {
      actionId: `placement-action-routing-node-move-${state.placementHistory.length + 1}`,
      actionType: "routing-update",
      summary: `Moved routing node ${routingNode.label}`,
      targetIds: [routingNodeId],
      createdAt: new Date().toISOString()
    },
  );
}

export function resolveRoutingMergeCandidates(
  state: SceneAuthoringState,
  holeId?: string,
) {
  let nextState = state;
  const mergedNodeIds: string[] = [];
  const targetHoleId = holeId ?? state.viewportState.activeHoleId ?? null;

  while (true) {
    const mergePair = findClosestRoutingMergePair(nextState, targetHoleId);
    if (!mergePair) {
      break;
    }

    nextState = mergeRoutingNodeIntoCandidateState(nextState, mergePair.sourceId, mergePair.targetId);
    mergedNodeIds.push(mergePair.sourceId, mergePair.targetId);
  }

  if (nextState === state) {
    return state;
  }

  if (targetHoleId) {
    nextState = polishRoutingHoleContinuity(nextState, targetHoleId);
  }

  return appendHistory(
    nextState,
    {
      actionId: `placement-action-routing-merge-resolution-${state.placementHistory.length + 1}`,
      actionType: "routing-update",
      summary:
        targetHoleId
          ? `Resolved routing merge candidates for ${targetHoleId}`
          : "Resolved routing merge candidates",
      targetIds: [...new Set(mergedNodeIds)],
      createdAt: new Date().toISOString()
    },
  );
}

export function reconcileRoutingHoleFinish(
  state: SceneAuthoringState,
  holeId: string,
) {
  const merged = resolveRoutingMergeCandidates(state, holeId);
  const holeSegmentIds = merged.routingSegments
    .filter((segment) => segment.holeId === holeId)
    .map((segment) => segment.routingSegmentId);
  const holeNodeIds = merged.routingNodes
    .filter((node) => node.holeId === holeId)
    .map((node) => node.routingNodeId);

  let nextState = merged;
  for (const segmentId of holeSegmentIds) {
    nextState = smoothRoutingSegmentShape(nextState, segmentId);
    nextState = harmonizeRoutingSegmentWidth(nextState, segmentId);
  }
  for (const nodeId of holeNodeIds) {
    nextState = polishRoutingNodeElevation(nextState, nodeId);
  }

  return polishRoutingHoleContinuity(nextState, holeId);
}

export function adjustRoutingNodeHeight(
  state: SceneAuthoringState,
  routingNodeId: string,
  heightDeltaMeters: number,
) {
  const routingNode = state.routingNodes.find((candidate) => candidate.routingNodeId === routingNodeId);
  if (!routingNode) {
    return state;
  }

  const nextY = Number((routingNode.position.y + heightDeltaMeters).toFixed(2));
  return moveRoutingNode(state, routingNodeId, {
    y: nextY
  });
}

export function polishRoutingNodeElevation(
  state: SceneAuthoringState,
  routingNodeId: string,
) {
  const routingNode = state.routingNodes.find((candidate) => candidate.routingNodeId === routingNodeId);
  if (!routingNode) {
    return state;
  }

  const connectedNodeIds = state.routingSegments.flatMap((segment) => {
    if (segment.fromNodeId === routingNodeId) {
      return [segment.toNodeId];
    }
    if (segment.toNodeId === routingNodeId) {
      return [segment.fromNodeId];
    }
    return [];
  });
  const connectedNodes = connectedNodeIds
    .map((nodeId) => state.routingNodes.find((candidate) => candidate.routingNodeId === nodeId) ?? null)
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null);

  if (connectedNodes.length === 0) {
    return state;
  }

  const nextY = Number(
    (
      (routingNode.position.y + connectedNodes.reduce((total, node) => total + node.position.y, 0)) /
      (connectedNodes.length + 1)
    ).toFixed(2),
  );

  return moveRoutingNode(state, routingNodeId, {
    y: nextY
  });
}

export function bendRoutingSegment(
  state: SceneAuthoringState,
  routingSegmentId: string,
  worldPoint: Vector3,
) {
  const segment = state.routingSegments.find((candidate) => candidate.routingSegmentId === routingSegmentId);
  if (!segment) {
    return state;
  }

  const startPoint = segment.controlLine.points[0];
  const endPoint = segment.controlLine.points[segment.controlLine.points.length - 1];
  if (!startPoint || !endPoint) {
    return state;
  }

  const nextControlLine =
    segment.controlLine.points.length <= 2
      ? [startPoint, worldPoint, endPoint]
      : segment.controlLine.points.map((point, index) =>
          index === Math.floor(segment.controlLine.points.length / 2) ? worldPoint : point,
        );

  const nextState = upsertHoleRoutingArtifacts(
    {
      ...state,
      routingSegments: state.routingSegments.map((candidate) =>
        candidate.routingSegmentId === routingSegmentId
          ? {
              ...candidate,
              controlLine: {
                points: nextControlLine
              }
            }
          : candidate,
      )
    },
    segment.holeId,
  );

  return appendHistory(
    nextState,
    {
      actionId: `placement-action-routing-bend-${state.placementHistory.length + 1}`,
      actionType: "routing-update",
      summary: "Refined routing segment shape",
      targetIds: [routingSegmentId],
      createdAt: new Date().toISOString()
    },
  );
}

export function adjustRoutingSegmentWidth(
  state: SceneAuthoringState,
  routingSegmentId: string,
  widthDeltaMeters: number,
) {
  const segment = state.routingSegments.find((candidate) => candidate.routingSegmentId === routingSegmentId);
  if (!segment) {
    return state;
  }

  return appendHistory(
    {
      ...state,
      routingSegments: state.routingSegments.map((candidate) =>
        candidate.routingSegmentId === routingSegmentId
          ? {
              ...candidate,
              targetWidthMeters: clamp(candidate.targetWidthMeters + widthDeltaMeters, 6, 54)
            }
          : candidate,
      )
    },
    {
      actionId: `placement-action-routing-width-${state.placementHistory.length + 1}`,
      actionType: "routing-update",
      summary: "Adjusted route segment width",
      targetIds: [routingSegmentId],
      createdAt: new Date().toISOString()
    },
  );
}

export function harmonizeRoutingSegmentWidth(
  state: SceneAuthoringState,
  routingSegmentId: string,
) {
  const segment = state.routingSegments.find((candidate) => candidate.routingSegmentId === routingSegmentId);
  if (!segment) {
    return state;
  }

  const neighboringSegments = state.routingSegments.filter(
    (candidate) =>
      candidate.routingSegmentId !== routingSegmentId &&
      candidate.holeId === segment.holeId &&
      (candidate.fromNodeId === segment.fromNodeId ||
        candidate.fromNodeId === segment.toNodeId ||
        candidate.toNodeId === segment.fromNodeId ||
        candidate.toNodeId === segment.toNodeId),
  );
  const widthSamples = [segment.targetWidthMeters, ...neighboringSegments.map((candidate) => candidate.targetWidthMeters)];
  const nextWidth = Number((widthSamples.reduce((total, width) => total + width, 0) / widthSamples.length).toFixed(2));

  return appendHistory(
    {
      ...state,
      routingSegments: state.routingSegments.map((candidate) =>
        candidate.routingSegmentId === routingSegmentId
          ? {
              ...candidate,
              targetWidthMeters: nextWidth
            }
          : candidate,
      )
    },
    {
      actionId: `placement-action-routing-width-harmonize-${state.placementHistory.length + 1}`,
      actionType: "routing-update",
      summary: "Harmonized route segment width",
      targetIds: [routingSegmentId],
      createdAt: new Date().toISOString()
    },
  );
}

export function smoothRoutingSegmentShape(
  state: SceneAuthoringState,
  routingSegmentId: string,
) {
  const segment = state.routingSegments.find((candidate) => candidate.routingSegmentId === routingSegmentId);
  if (!segment || segment.controlLine.points.length <= 2) {
    return state;
  }

  const startPoint = segment.controlLine.points[0]!;
  const endPoint = segment.controlLine.points[segment.controlLine.points.length - 1]!;
  const midpoint = {
    x: Number(((startPoint.x + endPoint.x) / 2).toFixed(2)),
    y: Number(((startPoint.y + endPoint.y) / 2).toFixed(2)),
    z: Number(((startPoint.z + endPoint.z) / 2).toFixed(2))
  };
  const middleIndex = Math.floor(segment.controlLine.points.length / 2);
  const nextPoints = segment.controlLine.points.map((point, index) =>
    index === 0 || index === segment.controlLine.points.length - 1
      ? point
      : index === middleIndex
        ? {
            x: Number(((point.x + midpoint.x) / 2).toFixed(2)),
            y: Number(((point.y + midpoint.y) / 2).toFixed(2)),
            z: Number(((point.z + midpoint.z) / 2).toFixed(2))
          }
        : point,
  );

  const nextState = upsertHoleRoutingArtifacts(
    {
      ...state,
      routingSegments: state.routingSegments.map((candidate) =>
        candidate.routingSegmentId === routingSegmentId
          ? {
              ...candidate,
              controlLine: {
                points: nextPoints
              }
            }
          : candidate,
      )
    },
    segment.holeId,
  );

  return appendHistory(nextState, {
    actionId: `placement-action-routing-smooth-${state.placementHistory.length + 1}`,
    actionType: "routing-update",
    summary: "Smoothed route segment continuity",
    targetIds: [routingSegmentId],
    createdAt: new Date().toISOString()
  });
}

export function polishRoutingHoleContinuity(
  state: SceneAuthoringState,
  holeId: string,
) {
  const holeSegments = state.routingSegments.filter((segment) => segment.holeId === holeId);
  const holeNodes = orderRoutingNodes(state, holeId);
  if (holeSegments.length === 0 || holeNodes.length === 0) {
    return state;
  }

  const averageSegmentWidth =
    holeSegments.reduce((total, segment) => total + segment.targetWidthMeters, 0) / holeSegments.length;
  const nextNodes = state.routingNodes.map((node) => {
    if (node.holeId !== holeId) {
      return node;
    }

    const index = holeNodes.findIndex((candidate) => candidate.routingNodeId === node.routingNodeId);
    if (index <= 0 || index >= holeNodes.length - 1) {
      return node;
    }

    const previousNode = holeNodes[index - 1]!;
    const nextNode = holeNodes[index + 1]!;
    return {
      ...node,
      position: {
        ...node.position,
        y: Number(((previousNode.position.y + node.position.y + nextNode.position.y) / 3).toFixed(2))
      }
    };
  });
  const nextSegments = state.routingSegments.map((segment) => {
    if (segment.holeId !== holeId) {
      return segment;
    }

    const smoothedWidth = Number(((segment.targetWidthMeters + averageSegmentWidth) / 2).toFixed(2));
    if (segment.controlLine.points.length <= 2) {
      return {
        ...segment,
        targetWidthMeters: smoothedWidth
      };
    }

    const startPoint = segment.controlLine.points[0]!;
    const endPoint = segment.controlLine.points[segment.controlLine.points.length - 1]!;
    const midpoint = {
      x: Number(((startPoint.x + endPoint.x) / 2).toFixed(2)),
      y: Number(((startPoint.y + endPoint.y) / 2).toFixed(2)),
      z: Number(((startPoint.z + endPoint.z) / 2).toFixed(2))
    };
    const middleIndex = Math.floor(segment.controlLine.points.length / 2);

    return {
      ...segment,
      targetWidthMeters: smoothedWidth,
      controlLine: {
        points: segment.controlLine.points.map((point, index) =>
          index === 0 || index === segment.controlLine.points.length - 1
            ? point
            : index === middleIndex
              ? {
                  x: Number(((point.x + midpoint.x) / 2).toFixed(2)),
                  y: Number(((point.y + midpoint.y) / 2).toFixed(2)),
                  z: Number(((point.z + midpoint.z) / 2).toFixed(2))
                }
              : point,
        )
      }
    };
  });

  const nextState = upsertHoleRoutingArtifacts(
    {
      ...state,
      routingNodes: nextNodes,
      routingSegments: nextSegments
    },
    holeId,
  );

  return appendHistory(nextState, {
    actionId: `placement-action-routing-polish-${state.placementHistory.length + 1}`,
    actionType: "routing-update",
    summary: `Polished route continuity for ${holeId}`,
    targetIds: [holeId, ...holeSegments.map((segment) => segment.routingSegmentId)],
    createdAt: new Date().toISOString()
  });
}

export function connectRoutingNodes(
  state: SceneAuthoringState,
  input: {
    holeId: string;
    fromNodeId: string;
    toNodeId: string;
    kind?: RoutingSegmentKind;
  },
) {
  if (input.fromNodeId === input.toNodeId) {
    return state;
  }

  const fromNode = state.routingNodes.find((candidate) => candidate.routingNodeId === input.fromNodeId);
  const toNode = state.routingNodes.find((candidate) => candidate.routingNodeId === input.toNodeId);

  if (!fromNode || !toNode) {
    return state;
  }

  if (
    state.routingSegments.some(
      (segment) =>
        segment.holeId === input.holeId &&
        ((segment.fromNodeId === input.fromNodeId && segment.toNodeId === input.toNodeId) ||
          (state.editingState.routingGuideSettings.autoMergeEnabled &&
            segment.fromNodeId === input.toNodeId &&
            segment.toNodeId === input.fromNodeId)),
    )
  ) {
    return state;
  }

  const routingSegmentId = nextId(
    "routing-segment",
    state.routingSegments.map((segment) => segment.routingSegmentId),
  );
  const nextSegment = createRoutingSegment({
    routingSegmentId,
    holeId: input.holeId,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    kind: input.kind ?? "primary-shot",
    controlLine: [fromNode.position, toNode.position],
    targetWidthMeters: state.editingState.routingGuideSettings.defaultSegmentWidthMeters
  });
  const nextState = upsertHoleRoutingArtifacts(
    {
      ...state,
      routingSegments: [...state.routingSegments, nextSegment],
      editingState: {
        ...state.editingState,
        selectedRoutingSegmentId: routingSegmentId,
        pendingConnectionStartNodeId: null
      }
    },
    input.holeId,
  );

  return appendHistory(
    nextState,
    {
      actionId: `placement-action-routing-connect-${state.placementHistory.length + 1}`,
      actionType: "routing-update",
      summary: `Connected routing nodes for ${input.holeId}`,
      targetIds: [routingSegmentId, input.fromNodeId, input.toNodeId],
      createdAt: new Date().toISOString()
    },
  );
}

export function splitRoutingSegment(state: SceneAuthoringState, routingSegmentId: string) {
  const segment = state.routingSegments.find((candidate) => candidate.routingSegmentId === routingSegmentId);
  if (!segment) {
    return state;
  }

  const startPoint = segment.controlLine.points[0]!;
  const endPoint = segment.controlLine.points[segment.controlLine.points.length - 1]!;
  const midpoint = {
    x: (startPoint.x + endPoint.x) / 2,
    y: (startPoint.y + endPoint.y) / 2,
    z: (startPoint.z + endPoint.z) / 2
  };
  const newNodeId = nextId("routing-node", state.routingNodes.map((node) => node.routingNodeId));
  const firstSegmentId = nextId("routing-segment", state.routingSegments.map((candidate) => candidate.routingSegmentId));
  const secondSegmentId = `${firstSegmentId}-split`;
  const splitNode = createRoutingNode({
    routingNodeId: newNodeId,
    holeId: segment.holeId,
    kind: "decision-point",
    label: `${defaultRoutingLabel("decision-point", segment.holeId)} Split`,
    position: midpoint
  });
  const nextState = upsertHoleRoutingArtifacts(
    {
      ...state,
      routingNodes: [...state.routingNodes, splitNode],
      routingSegments: [
        ...state.routingSegments.filter((candidate) => candidate.routingSegmentId !== routingSegmentId),
        createRoutingSegment({
          routingSegmentId: firstSegmentId,
          holeId: segment.holeId,
          fromNodeId: segment.fromNodeId,
          toNodeId: newNodeId,
          kind: segment.kind,
          controlLine: [startPoint, midpoint]
        }),
        createRoutingSegment({
          routingSegmentId: secondSegmentId,
          holeId: segment.holeId,
          fromNodeId: newNodeId,
          toNodeId: segment.toNodeId,
          kind: segment.kind,
          controlLine: [midpoint, endPoint]
        })
      ],
      editingState: {
        ...state.editingState,
        selectedRoutingNodeId: newNodeId,
        selectedRoutingSegmentId: null
      }
    },
    segment.holeId,
  );

  return appendHistory(
    nextState,
    {
      actionId: `placement-action-routing-split-${state.placementHistory.length + 1}`,
      actionType: "routing-update",
      summary: `Split routing segment ${routingSegmentId}`,
      targetIds: [routingSegmentId, newNodeId, firstSegmentId, secondSegmentId],
      createdAt: new Date().toISOString()
    },
  );
}

export function deleteRoutingSegment(state: SceneAuthoringState, routingSegmentId: string) {
  const segment = state.routingSegments.find((candidate) => candidate.routingSegmentId === routingSegmentId);
  if (!segment) {
    return state;
  }

  const nextState = upsertHoleRoutingArtifacts(
    {
      ...state,
      routingSegments: state.routingSegments.filter((candidate) => candidate.routingSegmentId !== routingSegmentId),
      editingState: {
        ...state.editingState,
        selectedRoutingSegmentId: null
      }
    },
    segment.holeId,
  );

  return appendHistory(
    nextState,
    {
      actionId: `placement-action-routing-delete-${state.placementHistory.length + 1}`,
      actionType: "routing-update",
      summary: `Deleted routing segment ${routingSegmentId}`,
      targetIds: [routingSegmentId],
      createdAt: new Date().toISOString()
    },
  );
}

export function assignRoutingSegmentRole(
  state: SceneAuthoringState,
  routingSegmentId: string,
  kind: RoutingSegmentKind,
) {
  const segment = state.routingSegments.find((candidate) => candidate.routingSegmentId === routingSegmentId);
  if (!segment) {
    return state;
  }

  return appendHistory(
    {
      ...state,
      routingSegments: state.routingSegments.map((candidate) =>
        candidate.routingSegmentId === routingSegmentId
          ? {
              ...candidate,
              kind
            }
          : candidate,
      )
    },
    {
      actionId: `placement-action-routing-role-${state.placementHistory.length + 1}`,
      actionType: "routing-update",
      summary: `Assigned routing segment role ${kind}`,
      targetIds: [routingSegmentId],
      createdAt: new Date().toISOString()
    },
  );
}

export function bindRoutingPathToHole(
  state: SceneAuthoringState,
  routingPathId: string,
  holeId: string,
) {
  const path = state.routingPaths.find((candidate) => candidate.routingPathId === routingPathId);
  if (!path) {
    return state;
  }

  return appendHistory(
    {
      ...state,
      routingPaths: state.routingPaths.map((candidate) =>
        candidate.routingPathId === routingPathId
          ? {
              ...candidate,
              holeId
            }
          : candidate,
      ),
      editingState: {
        ...state.editingState,
        pendingPlacementHoleId: holeId
      }
    },
    {
      actionId: `placement-action-routing-bind-hole-${state.placementHistory.length + 1}`,
      actionType: "routing-update",
      summary: `Bound routing path ${routingPathId} to ${holeId}`,
      targetIds: [routingPathId, holeId],
      createdAt: new Date().toISOString()
    },
  );
}

export function createHazardZoneForHole(
  state: SceneAuthoringState,
  input: {
    holeId: string;
    hazardLabel?: string;
    linkedHazardIds?: string[];
    center?: Partial<Vector3>;
  },
) {
  const center = {
    ...createHoleCenter(input.holeId),
    ...input.center
  };
  const hazardZoneId = nextId("hazard-zone", state.hazardZones.map((zone) => zone.hazardZoneId));
  const nextZone = createHazardZone({
    hazardZoneId,
    holeId: input.holeId,
    hazardLabel: input.hazardLabel ?? `Hole ${inferHoleOrdinal(input.holeId)} Hazard`,
    linkedHazardIds: input.linkedHazardIds ?? [],
    boundary: createRectBoundary({ ...center, x: center.x + 28, z: center.z + 10 }, 18, 14),
    note: "Build-authored hazard zone."
  });

  return appendHistory(
    updateSpatialSelection(
      {
        ...state,
        hazardZones: [...state.hazardZones, nextZone]
      },
      [
        {
          entityType: "hazard-zone",
          entityId: hazardZoneId,
          holeId: input.holeId,
          note: nextZone.hazardLabel
        }
      ],
      {
        selectedHazardZoneId: hazardZoneId,
        pendingPlacementHoleId: input.holeId
      },
    ),
    {
      actionId: `placement-action-sim-hazard-${state.placementHistory.length + 1}`,
      actionType: "simulator-anchor-update",
      summary: `Created hazard zone ${nextZone.hazardLabel}`,
      targetIds: [hazardZoneId],
      createdAt: new Date().toISOString()
    },
  );
}

export function createOutOfBoundsZoneForHole(
  state: SceneAuthoringState,
  input:
    | string
    | {
        holeId: string;
        center?: Partial<Vector3>;
      },
) {
  const holeId = typeof input === "string" ? input : input.holeId;
  const center = {
    ...createHoleCenter(holeId),
    ...(typeof input === "string" ? {} : input.center)
  };
  const outOfBoundsZoneId = nextId(
    "out-of-bounds-zone",
    state.outOfBoundsZones.map((zone) => zone.outOfBoundsZoneId),
  );
  const nextZone = createOutOfBoundsZone({
    outOfBoundsZoneId,
    holeId,
    sideLabel: "Right Boundary",
    boundary: createRectBoundary({ ...center, x: center.x + 48, z: center.z + 24 }, 26, 36),
    enforced: true,
    note: "Build-authored OB boundary."
  });

  return appendHistory(
    updateSpatialSelection(
      {
        ...state,
        outOfBoundsZones: [...state.outOfBoundsZones, nextZone]
      },
      [
        {
          entityType: "out-of-bounds-zone",
          entityId: outOfBoundsZoneId,
          holeId,
          note: nextZone.sideLabel
        }
      ],
      {
        selectedOutOfBoundsZoneId: outOfBoundsZoneId,
        pendingPlacementHoleId: holeId
      },
    ),
    {
      actionId: `placement-action-sim-oob-${state.placementHistory.length + 1}`,
      actionType: "simulator-anchor-update",
      summary: `Created OB boundary for ${holeId}`,
      targetIds: [outOfBoundsZoneId],
      createdAt: new Date().toISOString()
    },
  );
}

export function createDropZoneAreaForHole(
  state: SceneAuthoringState,
  input: {
    holeId: string;
    linkedDropZoneIds?: string[];
    center?: Partial<Vector3>;
  },
) {
  const center = {
    ...createHoleCenter(input.holeId),
    ...input.center
  };
  const dropZoneAreaId = nextId(
    "drop-zone-area",
    state.dropZoneAreas.map((zone) => zone.dropZoneAreaId),
  );
  const nextZone = createDropZoneArea({
    dropZoneAreaId,
    holeId: input.holeId,
    linkedDropZoneIds: input.linkedDropZoneIds ?? [],
    boundary: createRectBoundary({ ...center, x: center.x + 12, z: center.z + 16 }, 14, 10),
    facingDirectionDegrees: 18,
    note: "Build-authored drop zone."
  });

  return appendHistory(
    updateSpatialSelection(
      {
        ...state,
        dropZoneAreas: [...state.dropZoneAreas, nextZone]
      },
      [
        {
          entityType: "drop-zone-area",
          entityId: dropZoneAreaId,
          holeId: input.holeId,
          note: "Drop zone area"
        }
      ],
      {
        selectedDropZoneAreaId: dropZoneAreaId,
        pendingPlacementHoleId: input.holeId
      },
    ),
    {
      actionId: `placement-action-sim-drop-zone-${state.placementHistory.length + 1}`,
      actionType: "simulator-anchor-update",
      summary: `Created drop zone area for ${input.holeId}`,
      targetIds: [dropZoneAreaId],
      createdAt: new Date().toISOString()
    },
  );
}

export function createPreviewAnchorForHole(
  state: SceneAuthoringState,
  input:
    | string
    | {
        holeId: string;
        position?: Partial<Vector3>;
      },
) {
  const holeId = typeof input === "string" ? input : input.holeId;
  const position = typeof input === "string" ? null : input.position;
  return addRoutingNodeForHole(state, {
    holeId,
    kind: "preview-anchor",
    position: {
      ...createHoleCenter(holeId),
      x: createHoleCenter(holeId).x + 54,
      y: 16,
      z: createHoleCenter(holeId).z - 18,
      ...position
    },
    label: `Hole ${inferHoleOrdinal(holeId)} Preview Anchor`
  });
}

export function translateSpatialBoundary(
  state: SceneAuthoringState,
  entityType: Extract<
    SceneSpatialEntityType,
    | "terrain-region"
    | "hazard-zone"
    | "out-of-bounds-zone"
    | "drop-zone-area"
    | "tee-zone"
    | "green-zone"
  >,
  entityId: string,
  delta: Partial<Vector3>,
) {
  const translateBoundary = <T extends { boundary: { points: Vector3[] } }>(entity: T) => ({
    ...entity,
    boundary: {
      points: translatePoints(entity.boundary.points, delta)
    }
  });

  const nextState =
    entityType === "terrain-region"
      ? {
          ...state,
          terrainRegions: state.terrainRegions.map((candidate) =>
            candidate.terrainRegionId === entityId ? translateBoundary(candidate) : candidate,
          )
        }
      : entityType === "hazard-zone"
        ? {
            ...state,
            hazardZones: state.hazardZones.map((candidate) =>
              candidate.hazardZoneId === entityId ? translateBoundary(candidate) : candidate,
            )
          }
        : entityType === "out-of-bounds-zone"
          ? {
              ...state,
              outOfBoundsZones: state.outOfBoundsZones.map((candidate) =>
                candidate.outOfBoundsZoneId === entityId ? translateBoundary(candidate) : candidate,
              )
            }
          : entityType === "drop-zone-area"
            ? {
                ...state,
                dropZoneAreas: state.dropZoneAreas.map((candidate) =>
                  candidate.dropZoneAreaId === entityId ? translateBoundary(candidate) : candidate,
                )
              }
            : entityType === "tee-zone"
              ? {
                  ...state,
                  teeZones: state.teeZones.map((candidate) =>
                    candidate.teeZoneId === entityId ? translateBoundary(candidate) : candidate,
                  )
                }
              : {
                  ...state,
                  greenZones: state.greenZones.map((candidate) =>
                    candidate.greenZoneId === entityId ? translateBoundary(candidate) : candidate,
                  )
                };

  return appendHistory(
    nextState,
    {
      actionId: `placement-action-boundary-translate-${state.placementHistory.length + 1}`,
      actionType: entityType === "terrain-region" ? "terrain-update" : "simulator-anchor-update",
      summary: `Moved ${entityType} boundary`,
      targetIds: [entityId],
      createdAt: new Date().toISOString()
    },
  );
}

export function scaleSpatialBoundary(
  state: SceneAuthoringState,
  entityType: Extract<
    SceneSpatialEntityType,
    | "terrain-region"
    | "hazard-zone"
    | "out-of-bounds-zone"
    | "drop-zone-area"
    | "tee-zone"
    | "green-zone"
    | "play-route-envelope"
  >,
  entityId: string,
  scaleFactor: number,
) {
  const scaleBoundary = <T extends { boundary: { points: Vector3[] } }>(entity: T) => ({
    ...entity,
    boundary: {
      points: scalePointsFromCentroid(entity.boundary.points, scaleFactor, scaleFactor)
    }
  });

  const nextState =
    entityType === "terrain-region"
      ? {
          ...state,
          terrainRegions: state.terrainRegions.map((candidate) =>
            candidate.terrainRegionId === entityId ? scaleBoundary(candidate) : candidate,
          )
        }
      : entityType === "hazard-zone"
        ? {
            ...state,
            hazardZones: state.hazardZones.map((candidate) =>
              candidate.hazardZoneId === entityId ? scaleBoundary(candidate) : candidate,
            )
          }
        : entityType === "out-of-bounds-zone"
          ? {
              ...state,
              outOfBoundsZones: state.outOfBoundsZones.map((candidate) =>
                candidate.outOfBoundsZoneId === entityId ? scaleBoundary(candidate) : candidate,
              )
            }
          : entityType === "drop-zone-area"
            ? {
                ...state,
                dropZoneAreas: state.dropZoneAreas.map((candidate) =>
                  candidate.dropZoneAreaId === entityId ? scaleBoundary(candidate) : candidate,
                )
              }
            : entityType === "tee-zone"
              ? {
                  ...state,
                  teeZones: state.teeZones.map((candidate) =>
                    candidate.teeZoneId === entityId ? scaleBoundary(candidate) : candidate,
                  )
                }
              : entityType === "green-zone"
                ? {
                    ...state,
                    greenZones: state.greenZones.map((candidate) =>
                      candidate.greenZoneId === entityId ? scaleBoundary(candidate) : candidate,
                    )
                  }
                : {
                  ...state,
                  playRouteEnvelopes: state.playRouteEnvelopes.map((candidate) =>
                    candidate.playRouteEnvelopeId === entityId ? scaleBoundary(candidate) : candidate,
                  )
                };

  return appendHistory(
    nextState,
    {
      actionId: `placement-action-boundary-scale-${state.placementHistory.length + 1}`,
      actionType:
        entityType === "terrain-region"
          ? "terrain-update"
          : entityType === "play-route-envelope"
            ? "routing-update"
            : "simulator-anchor-update",
      summary: `Reshaped ${entityType} boundary`,
      targetIds: [entityId],
      createdAt: new Date().toISOString()
    },
  );
}

export function rotateSpatialBoundary(
  state: SceneAuthoringState,
  entityType: Extract<
    SceneSpatialEntityType,
    | "terrain-region"
    | "hazard-zone"
    | "out-of-bounds-zone"
    | "drop-zone-area"
    | "tee-zone"
    | "green-zone"
    | "play-route-envelope"
  >,
  entityId: string,
  deltaDegrees: number,
) {
  const rotateBoundary = <T extends { boundary: { points: Vector3[] } }>(entity: T) => ({
    ...entity,
    boundary: {
      points: rotatePointsAroundCentroid(entity.boundary.points, deltaDegrees)
    }
  });

  const nextState =
    entityType === "terrain-region"
      ? {
          ...state,
          terrainRegions: state.terrainRegions.map((candidate) =>
            candidate.terrainRegionId === entityId ? rotateBoundary(candidate) : candidate,
          )
        }
      : entityType === "hazard-zone"
        ? {
            ...state,
            hazardZones: state.hazardZones.map((candidate) =>
              candidate.hazardZoneId === entityId ? rotateBoundary(candidate) : candidate,
            )
          }
        : entityType === "out-of-bounds-zone"
          ? {
              ...state,
              outOfBoundsZones: state.outOfBoundsZones.map((candidate) =>
                candidate.outOfBoundsZoneId === entityId ? rotateBoundary(candidate) : candidate,
              )
            }
          : entityType === "drop-zone-area"
            ? {
                ...state,
                dropZoneAreas: state.dropZoneAreas.map((candidate) =>
                  candidate.dropZoneAreaId === entityId
                    ? {
                        ...rotateBoundary(candidate),
                        facingDirectionDegrees: candidate.facingDirectionDegrees + deltaDegrees
                      }
                    : candidate,
                )
              }
            : entityType === "tee-zone"
              ? {
                  ...state,
                  teeZones: state.teeZones.map((candidate) =>
                    candidate.teeZoneId === entityId
                      ? {
                          ...rotateBoundary(candidate),
                          facingDirectionDegrees: candidate.facingDirectionDegrees + deltaDegrees
                        }
                      : candidate,
                  )
                }
              : entityType === "green-zone"
                ? {
                    ...state,
                    greenZones: state.greenZones.map((candidate) =>
                      candidate.greenZoneId === entityId ? rotateBoundary(candidate) : candidate,
                    )
                  }
                : {
                    ...state,
                    playRouteEnvelopes: state.playRouteEnvelopes.map((candidate) =>
                      candidate.playRouteEnvelopeId === entityId ? rotateBoundary(candidate) : candidate,
                    )
                  };

  return appendHistory(
    nextState,
    {
      actionId: `placement-action-boundary-rotate-${state.placementHistory.length + 1}`,
      actionType:
        entityType === "terrain-region"
          ? "terrain-update"
          : entityType === "play-route-envelope"
            ? "routing-update"
            : "rotate",
      summary: `Rotated ${entityType} geometry`,
      targetIds: [entityId],
      createdAt: new Date().toISOString()
    },
  );
}

export function applyRendererInteractionDelta(
  state: SceneAuthoringState,
  target: RendererInteractionTarget,
  delta: RendererInteractionDelta,
) {
  const snappedWorldDelta = snapWorldDelta(state, delta.worldDelta ?? {});
  const snappedWorldPoint = delta.worldPoint ? snapWorldPoint(state, delta.worldPoint) : null;
  const snappedRotationDegrees = snapRotationDegrees(state, delta.rotationDegrees ?? 0);
  const snappedScale = snapScaleFactor(state, delta.scaleFactor ?? 1);

  switch (target.kind) {
    case "entity-translate":
      if (target.reference.entityType === "scene-object") {
        return moveSceneObjectByDelta(state, target.reference.entityId, snappedWorldDelta);
      }
      if (target.reference.entityType === "routing-node") {
        return moveRoutingNode(state, target.reference.entityId, snappedWorldPoint ?? snappedWorldDelta);
      }
      if (
        [
          "terrain-region",
          "hazard-zone",
          "out-of-bounds-zone",
          "drop-zone-area",
          "tee-zone",
          "green-zone"
        ].includes(target.reference.entityType)
      ) {
        return translateSpatialBoundary(
          state,
          target.reference.entityType as Extract<
            SceneSpatialEntityType,
            "terrain-region" | "hazard-zone" | "out-of-bounds-zone" | "drop-zone-area" | "tee-zone" | "green-zone"
          >,
          target.reference.entityId,
          snappedWorldDelta,
        );
      }
      return state;
    case "entity-rotate":
      if (target.reference.entityType === "scene-object") {
        return rotateSceneObjectByDegrees(state, target.reference.entityId, snappedRotationDegrees);
      }
      if (
        [
          "terrain-region",
          "hazard-zone",
          "out-of-bounds-zone",
          "drop-zone-area",
          "tee-zone",
          "green-zone",
          "play-route-envelope"
        ].includes(target.reference.entityType)
      ) {
        return rotateSpatialBoundary(
          state,
          target.reference.entityType as Extract<
            SceneSpatialEntityType,
            | "terrain-region"
            | "hazard-zone"
            | "out-of-bounds-zone"
            | "drop-zone-area"
            | "tee-zone"
            | "green-zone"
            | "play-route-envelope"
          >,
          target.reference.entityId,
          snappedRotationDegrees,
        );
      }
      return state;
    case "entity-scale":
      if (target.reference.entityType === "scene-object") {
        return scaleSceneObjectUniform(state, target.reference.entityId, snappedScale);
      }
      if (
        [
          "terrain-region",
          "hazard-zone",
          "out-of-bounds-zone",
          "drop-zone-area",
          "tee-zone",
          "green-zone",
          "play-route-envelope"
        ].includes(target.reference.entityType)
      ) {
        return scaleSpatialBoundary(
          state,
          target.reference.entityType as Extract<
            SceneSpatialEntityType,
            | "terrain-region"
            | "hazard-zone"
            | "out-of-bounds-zone"
            | "drop-zone-area"
            | "tee-zone"
            | "green-zone"
            | "play-route-envelope"
          >,
          target.reference.entityId,
          snappedScale,
        );
      }
      return state;
    case "routing-bend":
      return snappedWorldPoint ? bendRoutingSegment(state, target.routingSegmentId, snappedWorldPoint) : state;
    case "routing-width":
      return adjustRoutingSegmentWidth(
        state,
        target.routingSegmentId,
        snapScalar(delta.widthDeltaMeters ?? 0, state.snapSettings.gridSizeMeters * 0.5),
      );
    case "routing-height":
      return adjustRoutingNodeHeight(
        state,
        target.routingNodeId,
        snapScalar(delta.heightDeltaMeters ?? 0, 0.25),
      );
    case "corridor-bend":
      return snappedWorldPoint ? bendFairwayCorridor(state, target.corridorId, snappedWorldPoint) : state;
    case "corridor-width":
      return adjustFairwayCorridorWidth(
        state,
        target.corridorId,
        snapScalar(delta.widthDeltaMeters ?? 0, state.snapSettings.gridSizeMeters * 0.5),
      );
    case "visibility-width":
      return adjustVisibilityCorridorWidth(
        state,
        target.corridorId,
        snapScalar(delta.widthDeltaMeters ?? 0, state.snapSettings.gridSizeMeters * 0.5),
      );
    default:
      return state;
  }
}

export function updateFairwayCorridor(
  state: SceneAuthoringState,
  fairwayCorridorId: string,
  patch: Partial<Pick<SceneAuthoringState["fairwayCorridors"][number], "averageWidthMeters" | "landingZoneCount" | "note">>,
) {
  return appendHistory(
    {
      ...state,
      fairwayCorridors: state.fairwayCorridors.map((candidate) =>
        candidate.fairwayCorridorId === fairwayCorridorId
          ? {
              ...candidate,
              ...patch
            }
          : candidate,
      )
    },
    {
      actionId: `placement-action-fairway-corridor-${state.placementHistory.length + 1}`,
      actionType: "routing-update",
      summary: "Updated fairway corridor structure",
      targetIds: [fairwayCorridorId],
      createdAt: new Date().toISOString()
    },
  );
}

export function bendFairwayCorridor(
  state: SceneAuthoringState,
  fairwayCorridorId: string,
  worldPoint: Vector3,
) {
  return appendHistory(
    {
      ...state,
      fairwayCorridors: state.fairwayCorridors.map((candidate) => {
        if (candidate.fairwayCorridorId !== fairwayCorridorId) {
          return candidate;
        }

        const nextPoints =
          candidate.centerline.points.length <= 2
            ? [candidate.centerline.points[0]!, worldPoint, candidate.centerline.points[candidate.centerline.points.length - 1]!]
            : candidate.centerline.points.map((point, index) =>
                index === Math.floor(candidate.centerline.points.length / 2) ? worldPoint : point,
              );

        return {
          ...candidate,
          centerline: {
            points: nextPoints
          }
        };
      })
    },
    {
      actionId: `placement-action-fairway-corridor-bend-${state.placementHistory.length + 1}`,
      actionType: "routing-update",
      summary: "Refined fairway corridor shape",
      targetIds: [fairwayCorridorId],
      createdAt: new Date().toISOString()
    },
  );
}

export function adjustFairwayCorridorWidth(
  state: SceneAuthoringState,
  fairwayCorridorId: string,
  widthDeltaMeters: number,
) {
  return appendHistory(
    {
      ...state,
      fairwayCorridors: state.fairwayCorridors.map((candidate) =>
        candidate.fairwayCorridorId === fairwayCorridorId
          ? {
              ...candidate,
              averageWidthMeters: clamp(candidate.averageWidthMeters + widthDeltaMeters, 8, 80)
            }
          : candidate,
      )
    },
    {
      actionId: `placement-action-fairway-corridor-width-${state.placementHistory.length + 1}`,
      actionType: "routing-update",
      summary: "Adjusted fairway corridor width",
      targetIds: [fairwayCorridorId],
      createdAt: new Date().toISOString()
    },
  );
}

export function adjustVisibilityCorridorWidth(
  state: SceneAuthoringState,
  visibilityCorridorId: string,
  widthDeltaMeters: number,
) {
  return appendHistory(
    {
      ...state,
      visibilityCorridors: state.visibilityCorridors.map((candidate) =>
        candidate.visibilityCorridorId === visibilityCorridorId
          ? {
              ...candidate,
              minimumWidthMeters: clamp(candidate.minimumWidthMeters + widthDeltaMeters, 6, 48)
            }
          : candidate,
      )
    },
    {
      actionId: `placement-action-visibility-corridor-width-${state.placementHistory.length + 1}`,
      actionType: "routing-update",
      summary: "Adjusted sightline corridor width",
      targetIds: [visibilityCorridorId],
      createdAt: new Date().toISOString()
    },
  );
}

export function updateGreenZone(
  state: SceneAuthoringState,
  greenZoneId: string,
  patch: Partial<Pick<SceneAuthoringState["greenZones"][number], "targetPinCapacity" | "approachNodeId" | "note">>,
) {
  return appendHistory(
    {
      ...state,
      greenZones: state.greenZones.map((candidate) =>
        candidate.greenZoneId === greenZoneId
          ? {
              ...candidate,
              ...patch
            }
          : candidate,
      )
    },
    {
      actionId: `placement-action-green-zone-update-${state.placementHistory.length + 1}`,
      actionType: "simulator-anchor-update",
      summary: "Updated green-zone structure",
      targetIds: [greenZoneId],
      createdAt: new Date().toISOString()
    },
  );
}

export function updateTeeZone(
  state: SceneAuthoringState,
  teeZoneId: string,
  patch: Partial<Pick<SceneAuthoringState["teeZones"][number], "teeSetRefs" | "facingDirectionDegrees" | "note">>,
) {
  return appendHistory(
    {
      ...state,
      teeZones: state.teeZones.map((candidate) =>
        candidate.teeZoneId === teeZoneId
          ? {
              ...candidate,
              ...patch
            }
          : candidate,
      )
    },
    {
      actionId: `placement-action-tee-zone-update-${state.placementHistory.length + 1}`,
      actionType: "simulator-anchor-update",
      summary: "Updated tee-zone structure",
      targetIds: [teeZoneId],
      createdAt: new Date().toISOString()
    },
  );
}

export function canUndoSceneAuthoring(state: SceneAuthoringState) {
  return state.historyCursor >= 0;
}

export function canRedoSceneAuthoring(state: SceneAuthoringState) {
  return state.historyCursor < state.placementHistory.length - 1;
}

export function undoSceneAuthoring(state: SceneAuthoringState): SceneAuthoringState {
  if (!canUndoSceneAuthoring(state)) {
    return state;
  }

  const nextCursor = state.historyCursor - 1;
  const targetSnapshot =
    nextCursor >= 0 ? state.placementHistory[nextCursor]?.snapshot ?? state.baselineSnapshot : state.baselineSnapshot;

  return {
    ...restoreFromSnapshot(state, targetSnapshot, nextCursor),
    viewportState: {
      ...targetSnapshot.viewportState,
      interactionPipeline: {
        ...targetSnapshot.viewportState.interactionPipeline,
        pendingActionLabel: "Undo",
        state: "idle"
      }
    }
  };
}

export function redoSceneAuthoring(state: SceneAuthoringState): SceneAuthoringState {
  if (!canRedoSceneAuthoring(state)) {
    return state;
  }

  const nextCursor = state.historyCursor + 1;
  const targetSnapshot = state.placementHistory[nextCursor]?.snapshot ?? state.baselineSnapshot;

  return {
    ...restoreFromSnapshot(state, targetSnapshot, nextCursor),
    viewportState: {
      ...targetSnapshot.viewportState,
      interactionPipeline: {
        ...targetSnapshot.viewportState.interactionPipeline,
        pendingActionLabel: "Redo",
        state: "idle"
      }
    }
  };
}

export function findRoutingGaps(state: SceneAuthoringState, holeIds: string[]): RoutingGap[] {
  return holeIds.flatMap((holeId) => {
    const teeNodeCount = state.routingNodes.filter((node) => node.holeId === holeId && node.kind === "tee").length;
    const greenNodeCount = state.routingNodes.filter(
      (node) => node.holeId === holeId && node.kind === "green-center",
    ).length;
    const path = state.routingPaths.find((routingPath) => routingPath.holeId === holeId);

    if (!path) {
      return [{ holeId, reason: "No routing path exists for the hole." }];
    }

    if (path.routeStatus !== "connected") {
      return [{ holeId, reason: "The routing path is not marked connected." }];
    }

    if (teeNodeCount === 0 || greenNodeCount === 0) {
      return [{ holeId, reason: "The routing graph is missing tee or green nodes." }];
    }

    const missingSegment = path.segmentIds.some(
      (segmentId) => !state.routingSegments.some((segment) => segment.routingSegmentId === segmentId),
    );
    if (missingSegment) {
      return [{ holeId, reason: "The routing path references missing segments." }];
    }

    const missingNode = path.nodeIds.some(
      (nodeId) => !state.routingNodes.some((node) => node.routingNodeId === nodeId),
    );
    if (missingNode) {
      return [{ holeId, reason: "The routing path references missing nodes." }];
    }

    return [];
  });
}

export function findInvalidSpatialRelationships(state: SceneAuthoringState): InvalidSpatialRelationship[] {
  const issues: InvalidSpatialRelationship[] = [];

  for (const terrainRegion of state.terrainRegions) {
    if (!state.terrainProfiles.some((profile) => profile.terrainProfileId === terrainRegion.terrainProfileId)) {
      issues.push({
        entityType: "terrain-region",
        entityId: terrainRegion.terrainRegionId,
        detail: "Terrain region points at a missing terrain profile."
      });
    }

    for (const linkedSceneObjectId of terrainRegion.linkedSceneObjectIds) {
      if (!state.sceneObjects.some((sceneObject) => sceneObject.sceneObjectId === linkedSceneObjectId)) {
        issues.push({
          entityType: "terrain-region",
          entityId: terrainRegion.terrainRegionId,
          detail: `Terrain region references missing scene object ${linkedSceneObjectId}.`
        });
      }
    }
  }

  for (const routingSegment of state.routingSegments) {
    if (!state.routingNodes.some((node) => node.routingNodeId === routingSegment.fromNodeId)) {
      issues.push({
        entityType: "routing-segment",
        entityId: routingSegment.routingSegmentId,
        detail: "Routing segment references a missing start node."
      });
    }

    if (!state.routingNodes.some((node) => node.routingNodeId === routingSegment.toNodeId)) {
      issues.push({
        entityType: "routing-segment",
        entityId: routingSegment.routingSegmentId,
        detail: "Routing segment references a missing end node."
      });
    }

    for (const blockedSceneObjectId of routingSegment.blockedSceneObjectIds) {
      if (!state.sceneObjects.some((sceneObject) => sceneObject.sceneObjectId === blockedSceneObjectId)) {
        issues.push({
          entityType: "routing-segment",
          entityId: routingSegment.routingSegmentId,
          detail: `Routing segment references missing blocking scene object ${blockedSceneObjectId}.`
        });
      }
    }
  }

  for (const playRouteEnvelope of state.playRouteEnvelopes) {
    if (!state.routingPaths.some((path) => path.routingPathId === playRouteEnvelope.routingPathId)) {
      issues.push({
        entityType: "play-route-envelope",
        entityId: playRouteEnvelope.playRouteEnvelopeId,
        detail: "Play route envelope references a missing routing path."
      });
    }

    for (const blockedZoneId of playRouteEnvelope.blockedZoneIds) {
      const zoneExists =
        state.hazardZones.some((zone) => zone.hazardZoneId === blockedZoneId) ||
        state.outOfBoundsZones.some((zone) => zone.outOfBoundsZoneId === blockedZoneId) ||
        state.dropZoneAreas.some((zone) => zone.dropZoneAreaId === blockedZoneId) ||
        state.greenZones.some((zone) => zone.greenZoneId === blockedZoneId) ||
        state.teeZones.some((zone) => zone.teeZoneId === blockedZoneId);

      if (!zoneExists) {
        issues.push({
          entityType: "play-route-envelope",
          entityId: playRouteEnvelope.playRouteEnvelopeId,
          detail: `Play route envelope references missing zone ${blockedZoneId}.`
        });
      }
    }
  }

  for (const spatialReference of state.selectionState.selectedSpatialEntityRefs) {
    if (!hasSpatialEntity(state, spatialReference)) {
      issues.push({
        entityType: spatialReference.entityType,
        entityId: spatialReference.entityId,
        detail: "Selection references a spatial entity that no longer exists."
      });
    }
  }

  return issues;
}

export function findBlockedPlayRouteConflicts(state: SceneAuthoringState): BlockedPlayRouteConflict[] {
  return state.playRouteEnvelopes
    .filter(
      (playRouteEnvelope) =>
        playRouteEnvelope.blockedSceneObjectIds.length > 0 || playRouteEnvelope.blockedZoneIds.length > 0,
    )
    .map((playRouteEnvelope) => ({
      holeId: playRouteEnvelope.holeId,
      playRouteEnvelopeId: playRouteEnvelope.playRouteEnvelopeId,
      blockingSceneObjectIds: playRouteEnvelope.blockedSceneObjectIds,
      blockedZoneIds: playRouteEnvelope.blockedZoneIds
    }));
}
