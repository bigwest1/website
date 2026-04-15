import {
  authoringPreviewStateSchema,
  buildEditingStateSchema,
  type AuthoringWorkspaceMode,
  type BuildEditingState,
  type CameraState,
  placementAssetDraftSchema,
  placementPresetSchema,
  type PlacementPreset,
  type PlacementConstraintKind,
  surfaceRuleDraftSettingsSchema,
  type SurfaceRuleDraftSettings,
  surfaceRulePresetSchema,
  type SurfaceRulePreset,
  sceneAuthoringSnapshotSchema,
  sceneAuthoringStateSchema,
  sceneCollectionSchema,
  sceneGroupSchema,
  sceneObjectSchema,
  sceneSpatialReferenceSchema,
  placementConstraintSchema,
  landmarkCorridorBundleLibraryEntrySchema,
  placementHistoryActionSchema,
  placementLayerSchema,
  type PlacementHistoryActionType,
  type PivotMode,
  routingGuideSettingsSchema,
  type RoutingNodeKind,
  routingNodeSchema,
  routingPathSchema,
  sceneryBrushPresetSchema,
  type LandmarkCorridorBundleLibraryEntry,
  type SceneryBrushPreset,
  sceneryBrushSettingsSchema,
  type RoutingSegmentKind,
  terrainMaterialSwatchSchema,
  terrainPaintStrokeSchema,
  routingSegmentSchema,
  type SceneAuthoringSnapshot,
  type SceneAuthoringState,
  type SceneCollection,
  type SceneGroup,
  type SceneObject,
  type SceneObjectCategory,
  type ScenePlacementRule,
  type SceneSpatialReference,
  type SurfaceRuleOrientationPosture,
  type SurfaceRulePackInfluenceMode,
  type SurfaceRuleSlopeHandlingMode,
  dropZoneAreaSchema,
  fairwayCorridorSchema,
  greenZoneSchema,
  hazardZoneSchema,
  outOfBoundsZoneSchema,
  playRouteEnvelopeSchema,
  spatialPolygonSchema,
  spatialPolylineSchema,
  type TerrainGameplayPurpose,
  type TerrainMaterialBlendMode,
  terrainModifierSchema,
  type TerrainModifierKind,
  type TerrainSculptMode,
  terrainProfileSchema,
  terrainRegionSchema,
  terrainSurfaceSchema,
  transformInteractionPipelineSchema,
  type Transform,
  type Vector3,
  teeZoneSchema,
  visibilityCorridorSchema,
  viewportStateSchema
} from "./models";

const ZERO_VECTOR: Vector3 = {
  x: 0,
  y: 0,
  z: 0
};

const IDENTITY_SCALE: Vector3 = {
  x: 1,
  y: 1,
  z: 1
};

export function createVector3(overrides?: Partial<Vector3>) {
  return {
    ...ZERO_VECTOR,
    ...overrides
  };
}

export function createSpatialPolyline(points: Array<Partial<Vector3>>) {
  return spatialPolylineSchema.parse({
    points: points.map((point) => createVector3(point))
  });
}

export function createSpatialPolygon(points: Array<Partial<Vector3>>) {
  return spatialPolygonSchema.parse({
    points: points.map((point) => createVector3(point))
  });
}

export function createTransform(overrides?: Partial<Transform>): Transform {
  return {
    position: createVector3(overrides?.position),
    rotation: createVector3(overrides?.rotation),
    scale: {
      ...IDENTITY_SCALE,
      ...overrides?.scale
    },
    pivotOffset: createVector3(overrides?.pivotOffset),
    originPreset: overrides?.originPreset ?? "asset-origin"
  };
}

export function createPlacementLayer(input: {
  layerId: string;
  name: string;
  description: string;
  colorToken: string;
  visible?: boolean;
  locked?: boolean;
  filterCategories?: SceneObjectCategory[];
}) {
  return placementLayerSchema.parse({
    ...input,
    visible: input.visible ?? true,
    locked: input.locked ?? false,
    filterCategories: input.filterCategories ?? []
  });
}

export function createSceneCollection(input: {
  collectionId: string;
  name: string;
  description: string;
  defaultLayerId: string;
  routeSummary: string;
  tags?: string[];
}) {
  return sceneCollectionSchema.parse({
    ...input,
    tags: input.tags ?? []
  });
}

export function createPlacementConstraint(input: {
  constraintId: string;
  kind: PlacementConstraintKind;
  enabled?: boolean;
  axes?: ("x" | "y" | "z")[];
  value?: number | null;
  note: string;
}) {
  return placementConstraintSchema.parse({
    ...input,
    enabled: input.enabled ?? true,
    axes: input.axes ?? [],
    value: input.value ?? null
  });
}

export function createSceneSpatialReference(input: {
  entityType: SceneSpatialReference["entityType"];
  entityId: string;
  holeId?: string | null;
  note?: string;
}) {
  return sceneSpatialReferenceSchema.parse({
    ...input,
    holeId: input.holeId ?? null,
    note: input.note ?? ""
  });
}

export function createSceneObject(input: {
  sceneObjectId: string;
  collectionId: string;
  name: string;
  category: SceneObjectCategory;
  objectType: string;
  placementLayerId: string;
  assetRef?: string | null;
  transform?: Partial<Transform>;
  locked?: boolean;
  visible?: boolean;
  castShadows?: boolean;
  receiveShadows?: boolean;
  managedBridgeMode?: SceneObject["managedBridgeMode"];
  binding?: SceneObject["binding"];
  placementConstraints?: SceneObject["placementConstraints"];
  tags?: string[];
}) {
  return sceneObjectSchema.parse({
    ...input,
    assetRef: input.assetRef ?? null,
    transform: createTransform(input.transform),
    locked: input.locked ?? false,
    visible: input.visible ?? true,
    castShadows: input.castShadows ?? true,
    receiveShadows: input.receiveShadows ?? true,
    managedBridgeMode: input.managedBridgeMode ?? "native",
    binding: input.binding ?? null,
    placementConstraints: input.placementConstraints ?? [],
    tags: input.tags ?? []
  });
}

export function createSceneGroup(input: {
  groupId: string;
  collectionId: string;
  name: string;
  placementLayerId: string;
  locked?: boolean;
  visible?: boolean;
  pivot?: Partial<Vector3>;
  tags?: string[];
}) {
  return sceneGroupSchema.parse({
    ...input,
    locked: input.locked ?? false,
    visible: input.visible ?? true,
    pivot: createVector3(input.pivot),
    tags: input.tags ?? []
  });
}

export function createPlacementAssetDraft(input: {
  draftId: string;
  assetRef: string;
  label: string;
  objectType: string;
  category: SceneObjectCategory;
  footprintRadiusMeters?: number;
  packId?: string | null;
  tags?: string[];
  placementRules?: ScenePlacementRule[];
}) {
  return placementAssetDraftSchema.parse({
    ...input,
    footprintRadiusMeters:
      input.footprintRadiusMeters ??
      (input.category === "structure" || input.category === "landmark"
        ? 7.5
        : input.category === "vegetation"
          ? 4.5
          : 5.5),
    packId: input.packId ?? null,
    tags: input.tags ?? [],
    placementRules: input.placementRules ?? []
  });
}

export function createTerrainSurface(input: {
  terrainSurfaceId: string;
  name: string;
  gameplayPurpose: TerrainGameplayPurpose;
  materialFamily: string;
  playable?: boolean;
  visualRole: string;
  note?: string;
}) {
  return terrainSurfaceSchema.parse({
    ...input,
    playable: input.playable ?? true,
    note: input.note ?? ""
  });
}

export function createTerrainProfile(input: {
  terrainProfileId: string;
  name: string;
  description: string;
  primarySurfaceId: string;
  slopeToleranceDegrees?: number;
  roughness?: number;
  drainageBias?: number;
  themeTags?: string[];
}) {
  return terrainProfileSchema.parse({
    ...input,
    slopeToleranceDegrees: input.slopeToleranceDegrees ?? 14,
    roughness: input.roughness ?? 0.28,
    drainageBias: input.drainageBias ?? 0.45,
    themeTags: input.themeTags ?? []
  });
}

export function createTerrainRegion(input: {
  terrainRegionId: string;
  collectionId: string;
  holeId?: string | null;
  name: string;
  gameplayPurpose: TerrainGameplayPurpose;
  terrainProfileId: string;
  boundary: Array<Partial<Vector3>>;
  elevationMin?: number;
  elevationMax?: number;
  paintedMaterialIds?: string[];
  linkedZoneIds?: string[];
  linkedSceneObjectIds?: string[];
  tags?: string[];
}) {
  return terrainRegionSchema.parse({
    ...input,
    holeId: input.holeId ?? null,
    boundary: createSpatialPolygon(input.boundary),
    elevationMin: input.elevationMin ?? 0,
    elevationMax: input.elevationMax ?? 0,
    paintedMaterialIds: input.paintedMaterialIds ?? [],
    linkedZoneIds: input.linkedZoneIds ?? [],
    linkedSceneObjectIds: input.linkedSceneObjectIds ?? [],
    tags: input.tags ?? []
  });
}

export function createTerrainModifier(input: {
  terrainModifierId: string;
  holeId?: string | null;
  regionId?: string | null;
  kind: TerrainModifierKind;
  strength?: number;
  falloffMeters?: number;
  targetHeight?: number | null;
  bounds: Array<Partial<Vector3>>;
  note: string;
}) {
  return terrainModifierSchema.parse({
    ...input,
    holeId: input.holeId ?? null,
    regionId: input.regionId ?? null,
    strength: input.strength ?? 0.5,
    falloffMeters: input.falloffMeters ?? 5,
    targetHeight: input.targetHeight ?? null,
    bounds: createSpatialPolygon(input.bounds)
  });
}

export function createTerrainMaterialSwatch(input: {
  terrainMaterialId: string;
  label: string;
  materialFamily: string;
  colorToken: string;
  paletteSlot?: number;
  stackRole?: "base" | "accent" | "detail";
  favorite?: boolean;
  blendBias?: number;
  visualFinish: string;
  gameplayPurpose?: TerrainGameplayPurpose | null;
  note?: string;
}) {
  return terrainMaterialSwatchSchema.parse({
    ...input,
    paletteSlot: input.paletteSlot ?? 1,
    stackRole: input.stackRole ?? "base",
    favorite: input.favorite ?? false,
    blendBias: input.blendBias ?? 0.5,
    gameplayPurpose: input.gameplayPurpose ?? null,
    note: input.note ?? ""
  });
}

export function createTerrainPaintStroke(input: {
  terrainPaintStrokeId: string;
  holeId?: string | null;
  regionId?: string | null;
  terrainMaterialId: string;
  blendMode?: TerrainMaterialBlendMode;
  layerIndex?: number;
  opacity?: number;
  brushRadiusMeters: number;
  brushStrength: number;
  brushFalloffMeters: number;
  bounds: Array<Partial<Vector3>>;
  note: string;
}) {
  return terrainPaintStrokeSchema.parse({
    ...input,
    holeId: input.holeId ?? null,
    regionId: input.regionId ?? null,
    blendMode: input.blendMode ?? "paint",
    layerIndex: input.layerIndex ?? 0,
    opacity: input.opacity ?? 0.82,
    bounds: createSpatialPolygon(input.bounds)
  });
}

export function createRoutingNode(input: {
  routingNodeId: string;
  holeId: string;
  kind: RoutingNodeKind;
  label: string;
  position: Partial<Vector3>;
  linkedSceneObjectId?: string | null;
  linkedZoneId?: string | null;
}) {
  return routingNodeSchema.parse({
    ...input,
    position: createVector3(input.position),
    linkedSceneObjectId: input.linkedSceneObjectId ?? null,
    linkedZoneId: input.linkedZoneId ?? null
  });
}

export function createRoutingSegment(input: {
  routingSegmentId: string;
  holeId: string;
  fromNodeId: string;
  toNodeId: string;
  kind: RoutingSegmentKind;
  controlLine: Array<Partial<Vector3>>;
  targetWidthMeters?: number;
  blockedSceneObjectIds?: string[];
  visibilityCorridorId?: string | null;
}) {
  return routingSegmentSchema.parse({
    ...input,
    controlLine: createSpatialPolyline(input.controlLine),
    targetWidthMeters: input.targetWidthMeters ?? 28,
    blockedSceneObjectIds: input.blockedSceneObjectIds ?? [],
    visibilityCorridorId: input.visibilityCorridorId ?? null
  });
}

export function createRoutingPath(input: {
  routingPathId: string;
  holeId: string;
  name: string;
  teeNodeId: string;
  greenNodeId: string;
  nodeIds: string[];
  segmentIds: string[];
  routeStatus?: "draft" | "connected" | "blocked";
  note?: string;
}) {
  return routingPathSchema.parse({
    ...input,
    routeStatus: input.routeStatus ?? "draft",
    note: input.note ?? ""
  });
}

export function createFairwayCorridor(input: {
  fairwayCorridorId: string;
  holeId: string;
  routingPathId: string;
  centerline: Array<Partial<Vector3>>;
  averageWidthMeters?: number;
  landingZoneCount?: number;
  note?: string;
}) {
  return fairwayCorridorSchema.parse({
    fairwayCorridorId: input.fairwayCorridorId,
    holeId: input.holeId,
    routingPathId: input.routingPathId,
    centerline: createSpatialPolyline(input.centerline),
    averageWidthMeters: input.averageWidthMeters ?? 28,
    landingZoneCount: input.landingZoneCount ?? 1,
    note: input.note ?? ""
  });
}

export function createGreenZone(input: {
  greenZoneId: string;
  holeId: string;
  boundary: Array<Partial<Vector3>>;
  targetPinCapacity?: number;
  approachNodeId?: string | null;
  note?: string;
}) {
  return greenZoneSchema.parse({
    greenZoneId: input.greenZoneId,
    holeId: input.holeId,
    boundary: createSpatialPolygon(input.boundary),
    targetPinCapacity: input.targetPinCapacity ?? 3,
    approachNodeId: input.approachNodeId ?? null,
    note: input.note ?? ""
  });
}

export function createTeeZone(input: {
  teeZoneId: string;
  holeId: string;
  boundary: Array<Partial<Vector3>>;
  teeSetRefs?: string[];
  facingDirectionDegrees?: number;
  note?: string;
}) {
  return teeZoneSchema.parse({
    teeZoneId: input.teeZoneId,
    holeId: input.holeId,
    boundary: createSpatialPolygon(input.boundary),
    teeSetRefs: input.teeSetRefs ?? [],
    facingDirectionDegrees: input.facingDirectionDegrees ?? 0,
    note: input.note ?? ""
  });
}

export function createHazardZone(input: {
  hazardZoneId: string;
  holeId: string;
  hazardLabel: string;
  boundary: Array<Partial<Vector3>>;
  linkedHazardIds?: string[];
  note?: string;
}) {
  return hazardZoneSchema.parse({
    hazardZoneId: input.hazardZoneId,
    holeId: input.holeId,
    hazardLabel: input.hazardLabel,
    boundary: createSpatialPolygon(input.boundary),
    linkedHazardIds: input.linkedHazardIds ?? [],
    note: input.note ?? ""
  });
}

export function createOutOfBoundsZone(input: {
  outOfBoundsZoneId: string;
  holeId: string;
  sideLabel: string;
  boundary: Array<Partial<Vector3>>;
  enforced?: boolean;
  note?: string;
}) {
  return outOfBoundsZoneSchema.parse({
    outOfBoundsZoneId: input.outOfBoundsZoneId,
    holeId: input.holeId,
    sideLabel: input.sideLabel,
    boundary: createSpatialPolygon(input.boundary),
    enforced: input.enforced ?? true,
    note: input.note ?? ""
  });
}

export function createDropZoneArea(input: {
  dropZoneAreaId: string;
  holeId: string;
  boundary: Array<Partial<Vector3>>;
  linkedDropZoneIds?: string[];
  facingDirectionDegrees?: number;
  note?: string;
}) {
  return dropZoneAreaSchema.parse({
    dropZoneAreaId: input.dropZoneAreaId,
    holeId: input.holeId,
    boundary: createSpatialPolygon(input.boundary),
    linkedDropZoneIds: input.linkedDropZoneIds ?? [],
    facingDirectionDegrees: input.facingDirectionDegrees ?? 0,
    note: input.note ?? ""
  });
}

export function createVisibilityCorridor(input: {
  visibilityCorridorId: string;
  holeId: string;
  fromNodeId: string;
  toNodeId: string;
  corridorLine: Array<Partial<Vector3>>;
  minimumWidthMeters?: number;
  blockedSceneObjectIds?: string[];
  note?: string;
}) {
  return visibilityCorridorSchema.parse({
    visibilityCorridorId: input.visibilityCorridorId,
    holeId: input.holeId,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    corridorLine: createSpatialPolyline(input.corridorLine),
    minimumWidthMeters: input.minimumWidthMeters ?? 16,
    blockedSceneObjectIds: input.blockedSceneObjectIds ?? [],
    note: input.note ?? ""
  });
}

export function createPlayRouteEnvelope(input: {
  playRouteEnvelopeId: string;
  holeId: string;
  routingPathId: string;
  boundary: Array<Partial<Vector3>>;
  blockedSceneObjectIds?: string[];
  blockedZoneIds?: string[];
  note?: string;
}) {
  return playRouteEnvelopeSchema.parse({
    playRouteEnvelopeId: input.playRouteEnvelopeId,
    holeId: input.holeId,
    routingPathId: input.routingPathId,
    boundary: createSpatialPolygon(input.boundary),
    blockedSceneObjectIds: input.blockedSceneObjectIds ?? [],
    blockedZoneIds: input.blockedZoneIds ?? [],
    note: input.note ?? ""
  });
}

export function createCameraState(overrides?: Partial<CameraState>) {
  return {
    position: createVector3(overrides?.position ?? { x: 0, y: 48, z: 0 }),
    target: createVector3(overrides?.target),
    zoom: overrides?.zoom ?? 1,
    pitchDegrees: overrides?.pitchDegrees ?? 65,
    yawDegrees: overrides?.yawDegrees ?? 0
  };
}

export function createTransformInteractionPipeline() {
  return transformInteractionPipelineSchema.parse({
    activeHandle: null,
    state: "idle",
    draggingEntityId: null,
    draggingEntityType: null,
    pendingActionLabel: null
  });
}

export function createViewportState(input?: {
  rendererMode?: "schematic-2d" | "hybrid-preview" | "renderer-backed";
  backendStatus?: "planned" | "scaffolded" | "connected";
  projectionMode?: "top-down" | "orbit" | "isometric" | "cinematic";
  authoringMode?: AuthoringWorkspaceMode;
  activeHoleId?: string | null;
  selectedRoutingPathId?: string | null;
  selectedTerrainRegionId?: string | null;
  densityMode?: "off" | "collection" | "hole" | "district";
  camera?: Partial<CameraState>;
  showGrid?: boolean;
  showCompass?: boolean;
}) {
  return viewportStateSchema.parse({
    rendererMode: input?.rendererMode ?? "hybrid-preview",
    backendStatus: input?.backendStatus ?? "scaffolded",
    projectionMode: input?.projectionMode ?? "top-down",
    authoringMode: input?.authoringMode ?? "placement",
    activeHoleId: input?.activeHoleId ?? null,
    selectedRoutingPathId: input?.selectedRoutingPathId ?? null,
    selectedTerrainRegionId: input?.selectedTerrainRegionId ?? null,
    densityMode: input?.densityMode ?? "collection",
    camera: createCameraState(input?.camera),
    interactionPipeline: createTransformInteractionPipeline(),
    showGrid: input?.showGrid ?? true,
    showCompass: input?.showCompass ?? true
  });
}

export function createPlacementHistoryAction(input: {
  actionId: string;
  actionType: PlacementHistoryActionType;
  summary: string;
  targetIds: string[];
  snapshot: SceneAuthoringSnapshot;
  createdAt?: string;
}) {
  return placementHistoryActionSchema.parse({
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString()
  });
}

export function createDefaultSelectionState(pivotMode: PivotMode = "selection-center") {
  return {
    selectedObjectIds: [],
    selectedGroupIds: [],
    selectedSpatialEntityRefs: [],
    primarySelectionId: null,
    hoveredObjectId: null,
    hoveredSpatialEntityRef: null,
    transformSpace: "world" as const,
    pivotMode,
    filterCategories: [],
    includeHiddenObjects: false
  };
}

export function createDefaultSnapSettings() {
  return {
    gridEnabled: true,
    gridSizeMeters: 1,
    rotationSnapEnabled: true,
    rotationStepDegrees: 15,
    scaleSnapEnabled: false,
    scaleStepPercent: 10,
    surfaceSnapEnabled: true,
    terrainSnapEnabled: true,
    alignToSurfaceNormal: false,
    keepUpright: true
  };
}

export function createPlacementPreset(input: {
  presetId: string;
  name: string;
  description?: string;
  favorite?: boolean;
  useCount?: number;
  lastUsedAt?: string | null;
  defaultPlacementMode?: PlacementPreset["defaultPlacementMode"];
  preferredPackId?: string | null;
  preferredCategory?: PlacementPreset["preferredCategory"];
  gridEnabled?: boolean;
  rotationSnapEnabled?: boolean;
  rotationStepDegrees?: number;
  surfaceSnapEnabled?: boolean;
  terrainSnapEnabled?: boolean;
  alignToSurfaceNormal?: boolean;
  keepUpright?: boolean;
}): PlacementPreset {
  return placementPresetSchema.parse({
    presetId: input.presetId,
    name: input.name,
    description: input.description ?? "",
    favorite: input.favorite ?? false,
    useCount: input.useCount ?? 0,
    lastUsedAt: input.lastUsedAt ?? null,
    defaultPlacementMode: input.defaultPlacementMode ?? "move",
    preferredPackId: input.preferredPackId ?? null,
    preferredCategory: input.preferredCategory ?? null,
    gridEnabled: input.gridEnabled ?? true,
    rotationSnapEnabled: input.rotationSnapEnabled ?? true,
    rotationStepDegrees: input.rotationStepDegrees ?? 15,
    surfaceSnapEnabled: input.surfaceSnapEnabled ?? true,
    terrainSnapEnabled: input.terrainSnapEnabled ?? true,
    alignToSurfaceNormal: input.alignToSurfaceNormal ?? false,
    keepUpright: input.keepUpright ?? true
  });
}

export function createSurfaceRulePreset(input: {
  presetId: string;
  name: string;
  description?: string;
  favorite?: boolean;
  useCount?: number;
  lastUsedAt?: string | null;
  surfaceSnapEnabled?: boolean;
  terrainSnapEnabled?: boolean;
  alignToSurfaceNormal?: boolean;
  keepUpright?: boolean;
  slopeHandlingMode?: SurfaceRuleSlopeHandlingMode;
  orientationPosture?: SurfaceRuleOrientationPosture;
  slopeLimitDegrees?: number;
  preferredSurfacePurposes?: TerrainGameplayPurpose[];
  avoidedSurfacePurposes?: TerrainGameplayPurpose[];
  preferredPackId?: string | null;
  preferredCategory?: SceneObjectCategory | null;
  packInfluenceMode?: SurfaceRulePackInfluenceMode;
  suitabilityBias?: number;
  avoidanceBias?: number;
  activePackInfluence?: number;
  avoidPlayableCoreStrength?: number;
  placementRules?: ScenePlacementRule[];
}): SurfaceRulePreset {
  return surfaceRulePresetSchema.parse({
    presetId: input.presetId,
    name: input.name,
    description: input.description ?? "",
    favorite: input.favorite ?? false,
    useCount: input.useCount ?? 0,
    lastUsedAt: input.lastUsedAt ?? null,
    surfaceSnapEnabled: input.surfaceSnapEnabled ?? true,
    terrainSnapEnabled: input.terrainSnapEnabled ?? true,
    alignToSurfaceNormal:
      input.alignToSurfaceNormal ??
      (input.orientationPosture ? input.orientationPosture !== "upright" : false),
    keepUpright:
      input.keepUpright ??
      (input.orientationPosture ? input.orientationPosture !== "surface-follow" : true),
    slopeHandlingMode: input.slopeHandlingMode ?? "adaptive",
    orientationPosture: input.orientationPosture ?? "upright",
    slopeLimitDegrees: input.slopeLimitDegrees ?? 24,
    preferredSurfacePurposes: input.preferredSurfacePurposes ?? [],
    avoidedSurfacePurposes: input.avoidedSurfacePurposes ?? [],
    preferredPackId: input.preferredPackId ?? null,
    preferredCategory: input.preferredCategory ?? null,
    packInfluenceMode: input.packInfluenceMode ?? "balanced",
    suitabilityBias: input.suitabilityBias ?? 0.68,
    avoidanceBias: input.avoidanceBias ?? 0.72,
    activePackInfluence: input.activePackInfluence ?? 0.72,
    avoidPlayableCoreStrength: input.avoidPlayableCoreStrength ?? 0.64,
    placementRules: input.placementRules ?? ["scatter"]
  });
}

export function createSurfaceRuleDraftSettings(
  input?: Partial<SurfaceRuleDraftSettings>,
): SurfaceRuleDraftSettings {
  return surfaceRuleDraftSettingsSchema.parse({
    slopeHandlingMode: input?.slopeHandlingMode ?? "adaptive",
    slopeLimitDegrees: input?.slopeLimitDegrees ?? 24,
    orientationPosture: input?.orientationPosture ?? "upright",
    preferredSurfacePurposes: input?.preferredSurfacePurposes ?? ["rough", "transition"],
    avoidedSurfacePurposes: input?.avoidedSurfacePurposes ?? ["tee-complex", "green-complex"],
    preferredPackId: input?.preferredPackId ?? null,
    preferredCategory: input?.preferredCategory ?? null,
    packInfluenceMode: input?.packInfluenceMode ?? "balanced",
    suitabilityBias: input?.suitabilityBias ?? 0.68,
    avoidanceBias: input?.avoidanceBias ?? 0.72
  });
}

export function createSceneryBrushPreset(input: {
  presetId: string;
  name: string;
  description?: string;
  favorite?: boolean;
  useCount?: number;
  lastUsedAt?: string | null;
  settings: BuildEditingState["sceneryBrush"];
}): SceneryBrushPreset {
  return sceneryBrushPresetSchema.parse({
    presetId: input.presetId,
    name: input.name,
    description: input.description ?? "",
    favorite: input.favorite ?? false,
    useCount: input.useCount ?? 0,
    lastUsedAt: input.lastUsedAt ?? null,
    settings: input.settings
  });
}

export function createLandmarkCorridorBundleLibraryEntry(input: {
  bundleId: string;
  name: string;
  description?: string;
  bundleAction: LandmarkCorridorBundleLibraryEntry["bundleAction"];
  favorite?: boolean;
  useCount?: number;
  lastUsedAt?: string | null;
}): LandmarkCorridorBundleLibraryEntry {
  return landmarkCorridorBundleLibraryEntrySchema.parse({
    bundleId: input.bundleId,
    name: input.name,
    description: input.description ?? "",
    bundleAction: input.bundleAction,
    favorite: input.favorite ?? false,
    useCount: input.useCount ?? 0,
    lastUsedAt: input.lastUsedAt ?? null,
  });
}

export function createDefaultOverlayState() {
  return {
    showValidationOverlay: true,
    showDensityOverlay: false,
    showPerformanceOverlay: false,
    showLayerOverlay: true,
    showHiddenGhosts: false,
    showRoutingOverlay: true,
    showSurfaceRuleCoverageOverlay: false,
    showTerrainOverlay: true,
    showTerrainFinishOverlay: true,
    showSimulatorAnchorsOverlay: true
  };
}

export function createDefaultBuildEditingState(): BuildEditingState {
  const defaultSceneryBrush = sceneryBrushSettingsSchema.parse({
    brushRadiusMeters: 14,
    density: 6,
    randomness: 0.42,
    rotationVarianceDegrees: 26,
    scaleVariancePercent: 18,
    activePackId: null,
    categoryFilters: ["vegetation", "prop", "supporting-scenery"],
    categoryWeights: [
      { category: "vegetation", weight: 1.25 },
      { category: "supporting-scenery", weight: 1 },
      { category: "prop", weight: 0.9 }
    ],
    assetWeights: [],
    minimumSpacingMeters: 3.5,
    activePackInfluence: 0.72,
    avoidPlayableCoreStrength: 0.64,
    slopeLimitDegrees: 24,
    placementRules: ["scatter"]
  });

  return buildEditingStateSchema.parse({
    activeTerrainTool: "select-region",
    terrainSculptMode: "raise",
    terrainBrushRadiusMeters: 9,
    terrainBrushStrength: 0.42,
    terrainBrushFalloffMeters: 6,
    terrainBrushTargetHeight: null,
    activeTerrainMaterialId: "terrain-material-fairway-mow",
    activeTerrainMaterialLayerIndex: 0,
    terrainPaintBlendMode: "paint",
    terrainMaterialVisibilityMode: "all",
    activeRoutingTool: "select-route",
    activeSimulatorAnchorTool: "select-anchor",
    activePlacementDraft: null,
    placementPresets: [
      createPlacementPreset({
        presetId: "placement-preset-terrain-upright",
        name: "Terrain Upright",
        description: "General scenery placement that stays upright while respecting terrain and surface snap.",
        favorite: true,
        defaultPlacementMode: "move",
        preferredCategory: "prop",
        gridEnabled: false,
        rotationSnapEnabled: true,
        rotationStepDegrees: 15,
        surfaceSnapEnabled: true,
        terrainSnapEnabled: true,
        alignToSurfaceNormal: false,
        keepUpright: true
      }),
      createPlacementPreset({
        presetId: "placement-preset-surface-follow",
        name: "Surface Follow",
        description: "Slope-aware placement for objects that should tilt with authored terrain.",
        favorite: true,
        defaultPlacementMode: "move",
        preferredCategory: "vegetation",
        gridEnabled: false,
        rotationSnapEnabled: false,
        rotationStepDegrees: 10,
        surfaceSnapEnabled: true,
        terrainSnapEnabled: true,
        alignToSurfaceNormal: true,
        keepUpright: false
      }),
      createPlacementPreset({
        presetId: "placement-preset-hero-landmark",
        name: "Hero Landmark",
        description: "Stable landmark placement with stronger rotation discipline and upright posture.",
        defaultPlacementMode: "rotate",
        preferredCategory: "landmark",
        gridEnabled: true,
        rotationSnapEnabled: true,
        rotationStepDegrees: 5,
        surfaceSnapEnabled: true,
        terrainSnapEnabled: true,
        alignToSurfaceNormal: false,
        keepUpright: true
      })
    ],
    surfaceRulePresets: [
      createSurfaceRulePreset({
        presetId: "surface-rule-playable-edge",
        name: "Playable Edge Respect",
        description: "Keeps scenery near fairway and transition edges while resisting playable-core clutter.",
        favorite: true,
        surfaceSnapEnabled: true,
        terrainSnapEnabled: true,
        alignToSurfaceNormal: false,
        keepUpright: true,
        slopeHandlingMode: "strict",
        orientationPosture: "upright",
        slopeLimitDegrees: 18,
        preferredSurfacePurposes: ["fairway", "rough", "transition"],
        avoidedSurfacePurposes: ["tee-complex", "green-complex", "hazard"],
        preferredCategory: "vegetation",
        packInfluenceMode: "balanced",
        suitabilityBias: 0.74,
        avoidanceBias: 0.88,
        activePackInfluence: 0.76,
        avoidPlayableCoreStrength: 0.88,
        placementRules: ["avoid-playable-core", "edge-follow"]
      }),
      createSurfaceRulePreset({
        presetId: "surface-rule-slope-follow",
        name: "Slope Follow Dressing",
        description: "Lets themed scenery follow uneven support and scenic terrain without losing pack dominance.",
        favorite: true,
        surfaceSnapEnabled: true,
        terrainSnapEnabled: true,
        alignToSurfaceNormal: true,
        keepUpright: false,
        slopeHandlingMode: "expressive",
        orientationPosture: "surface-follow",
        slopeLimitDegrees: 28,
        preferredSurfacePurposes: ["rough", "support", "scenery"],
        avoidedSurfacePurposes: ["fairway", "green-complex"],
        preferredCategory: "supporting-scenery",
        packInfluenceMode: "pack-led",
        suitabilityBias: 0.82,
        avoidanceBias: 0.52,
        activePackInfluence: 0.84,
        avoidPlayableCoreStrength: 0.52,
        placementRules: ["scatter", "support-space"]
      }),
      createSurfaceRulePreset({
        presetId: "surface-rule-upright-hero",
        name: "Upright Landmark Pad",
        description: "Stable upright placement for landmark and structure work on calmer surfaces.",
        surfaceSnapEnabled: true,
        terrainSnapEnabled: true,
        alignToSurfaceNormal: false,
        keepUpright: true,
        slopeHandlingMode: "strict",
        orientationPosture: "upright",
        slopeLimitDegrees: 10,
        preferredSurfacePurposes: ["support", "transition", "preview"],
        avoidedSurfacePurposes: ["hazard", "out-of-bounds", "rough"],
        preferredCategory: "landmark",
        packInfluenceMode: "surface-led",
        suitabilityBias: 0.62,
        avoidanceBias: 0.84,
        activePackInfluence: 0.6,
        avoidPlayableCoreStrength: 0.7,
        placementRules: ["hero-placement"]
      })
    ],
    surfaceRuleDraft: createSurfaceRuleDraftSettings({
      slopeHandlingMode: "strict",
      slopeLimitDegrees: 18,
      orientationPosture: "upright",
      preferredSurfacePurposes: ["fairway", "rough", "transition"],
      avoidedSurfacePurposes: ["tee-complex", "green-complex", "hazard"],
      preferredCategory: "vegetation",
      packInfluenceMode: "balanced",
      suitabilityBias: 0.74,
      avoidanceBias: 0.88
    }),
    surfaceRuleCleanupReviews: [],
    landmarkCorridorBundleLibrary: [
      createLandmarkCorridorBundleLibraryEntry({
        bundleId: "corridor-bundle-open-support",
        name: "Open Support Bundle",
        description: "Reopens blocked landmark views while restoring anchor support around the current corridor.",
        bundleAction: "compose-open-support-bundle",
        favorite: true
      }),
      createLandmarkCorridorBundleLibraryEntry({
        bundleId: "corridor-bundle-route-support",
        name: "Route Support Bundle",
        description: "Strengthens route-facing landmark support when corridor reads drift off the playable line.",
        bundleAction: "compose-route-support-bundle",
        favorite: true
      }),
      createLandmarkCorridorBundleLibraryEntry({
        bundleId: "corridor-bundle-presentation-calm",
        name: "Presentation Calm Bundle",
        description: "Calms crowded presentation lanes without stripping landmark clarity from the reveal.",
        bundleAction: "compose-presentation-calm-bundle"
      }),
      createLandmarkCorridorBundleLibraryEntry({
        bundleId: "corridor-bundle-hybrid-support",
        name: "Hybrid Corridor Bundle",
        description: "One-pass corridor recovery for blocked, weak, and overcrowded landmark reads on the same hole.",
        bundleAction: "compose-hybrid-support-bundle"
      })
    ],
    sceneryBrushDrafts: [],
    sceneryBrushPresets: [
      createSceneryBrushPreset({
        presetId: "brush-preset-vegetation-edge",
        name: "Vegetation Edge Scatter",
        description: "Soft vegetation framing that avoids the playable core and keeps a calm edge rhythm.",
        favorite: true,
        settings: defaultSceneryBrush
      }),
      createSceneryBrushPreset({
        presetId: "brush-preset-support-dressing",
        name: "Support Dressing",
        description: "Support-space dressing with wider spacing and stronger support-scenery emphasis.",
        favorite: true,
        settings: {
          ...defaultSceneryBrush,
          density: 4,
          categoryFilters: ["supporting-scenery", "prop"],
          categoryWeights: [
            { category: "supporting-scenery", weight: 1.4 },
            { category: "prop", weight: 1.1 }
          ],
          minimumSpacingMeters: 5.5,
          avoidPlayableCoreStrength: 0.82
        }
      })
    ],
    sceneryBrush: defaultSceneryBrush,
    routingGuideSettings: routingGuideSettingsSchema.parse({
      angleSnapEnabled: true,
      angleStepDegrees: 15,
      workingHeightMeters: 0,
      autoConnectEnabled: true,
      autoMergeEnabled: true,
      mergeToleranceMeters: 5,
      visibilityMode: "active-hole",
      defaultSegmentWidthMeters: 28,
      defaultCorridorWidthMeters: 30
    }),
    authoringPreview: authoringPreviewStateSchema.parse({
      mode: "idle",
      source: null,
      draft: null,
      worldPoint: null,
      label: null,
      surfaceLabel: null,
      surfaceSlopeDegrees: 0,
      surfaceSnapMode: "none",
      terrainMaterialId: null,
      terrainLayerIndex: 0,
      previewRadiusMeters: 0,
      previewDensity: 0,
      activeCategory: null,
      visible: false
    }),
    showBuilderGuidance: true,
    dismissedGuideIds: [],
    selectedTerrainRegionId: null,
    selectedTerrainModifierId: null,
    selectedRoutingNodeId: null,
    selectedRoutingSegmentId: null,
    selectedFairwayCorridorId: null,
    selectedVisibilityCorridorId: null,
    selectedPlayRouteEnvelopeId: null,
    selectedHazardZoneId: null,
    selectedOutOfBoundsZoneId: null,
    selectedDropZoneAreaId: null,
    pendingConnectionStartNodeId: null,
    pendingPlacementHoleId: null
  });
}

export function createDefaultTerrainMaterialPalette() {
  return [
    createTerrainMaterialSwatch({
      terrainMaterialId: "terrain-material-fairway-mow",
      label: "Fairway Mow",
      materialFamily: "fairway-grass",
      colorToken: "terrain.fairway",
      paletteSlot: 1,
      stackRole: "base",
      favorite: true,
      blendBias: 0.35,
      visualFinish: "Tight premium mow for primary playable corridors.",
      gameplayPurpose: "fairway",
      note: "Use for fairway definition and routing readability."
    }),
    createTerrainMaterialSwatch({
      terrainMaterialId: "terrain-material-green-cut",
      label: "Green Cut",
      materialFamily: "green-cut",
      colorToken: "terrain.green",
      paletteSlot: 2,
      stackRole: "detail",
      favorite: true,
      blendBias: 0.2,
      visualFinish: "Short tournament finish for target surfaces.",
      gameplayPurpose: "green-complex",
      note: "Use to separate greens and surrounds from fairway grass."
    }),
    createTerrainMaterialSwatch({
      terrainMaterialId: "terrain-material-rough-native",
      label: "Native Rough",
      materialFamily: "rough-native",
      colorToken: "terrain.rough",
      paletteSlot: 3,
      stackRole: "base",
      favorite: true,
      blendBias: 0.45,
      visualFinish: "Secondary rough and native transition finish.",
      gameplayPurpose: "rough",
      note: "Use around playable corridors and scenic transitions."
    }),
    createTerrainMaterialSwatch({
      terrainMaterialId: "terrain-material-bunker-sand",
      label: "Bunker Sand",
      materialFamily: "bunker-sand",
      colorToken: "terrain.sand",
      paletteSlot: 4,
      stackRole: "accent",
      favorite: true,
      blendBias: 0.6,
      visualFinish: "Bright, readable bunker and waste-area finish.",
      gameplayPurpose: "hazard",
      note: "Use for bunker lips, waste zones, and sandy transitions."
    }),
    createTerrainMaterialSwatch({
      terrainMaterialId: "terrain-material-rocky-edge",
      label: "Rocky Edge",
      materialFamily: "rock-detail",
      colorToken: "terrain.rock",
      paletteSlot: 5,
      stackRole: "detail",
      favorite: false,
      blendBias: 0.55,
      visualFinish: "Hardscape and themed edge finish for support spaces.",
      gameplayPurpose: "support",
      note: "Use for retaining edges, plaza transitions, and scenic framing."
    })
  ];
}

export function terrainModifierKindForSculptMode(mode: TerrainSculptMode): TerrainModifierKind {
  switch (mode) {
    case "raise":
      return "raise";
    case "lower":
      return "lower";
    case "smooth":
      return "smooth";
    case "flatten":
    default:
      return "flatten";
  }
}

export function createSceneAuthoringSnapshot(input?: Partial<SceneAuthoringSnapshot>) {
  return sceneAuthoringSnapshotSchema.parse({
    activeCollectionId: input?.activeCollectionId ?? null,
    placementMode: input?.placementMode ?? "select",
    gizmoMode: input?.gizmoMode ?? "move",
    selectionState: input?.selectionState ?? createDefaultSelectionState(),
    snapSettings: input?.snapSettings ?? createDefaultSnapSettings(),
    overlayState: input?.overlayState ?? createDefaultOverlayState(),
    viewportState: input?.viewportState ?? createViewportState(),
    editingState: input?.editingState ?? createDefaultBuildEditingState(),
    sceneCollections: input?.sceneCollections ?? [],
    placementLayers: input?.placementLayers ?? [],
    sceneObjects: input?.sceneObjects ?? [],
    sceneGroups: input?.sceneGroups ?? [],
    parentRelationships: input?.parentRelationships ?? [],
    terrainSurfaces: input?.terrainSurfaces ?? [],
    terrainProfiles: input?.terrainProfiles ?? [],
    terrainRegions: input?.terrainRegions ?? [],
    terrainModifiers: input?.terrainModifiers ?? [],
    terrainMaterialPalette: input?.terrainMaterialPalette ?? createDefaultTerrainMaterialPalette(),
    terrainPaintStrokes: input?.terrainPaintStrokes ?? [],
    routingNodes: input?.routingNodes ?? [],
    routingSegments: input?.routingSegments ?? [],
    routingPaths: input?.routingPaths ?? [],
    fairwayCorridors: input?.fairwayCorridors ?? [],
    greenZones: input?.greenZones ?? [],
    teeZones: input?.teeZones ?? [],
    hazardZones: input?.hazardZones ?? [],
    outOfBoundsZones: input?.outOfBoundsZones ?? [],
    dropZoneAreas: input?.dropZoneAreas ?? [],
    visibilityCorridors: input?.visibilityCorridors ?? [],
    playRouteEnvelopes: input?.playRouteEnvelopes ?? []
  });
}

export function createSceneAuthoringState(input?: Partial<SceneAuthoringState>) {
  const snapshot = createSceneAuthoringSnapshot(input);
  const placementHistory = input?.placementHistory ?? [];

  return sceneAuthoringStateSchema.parse({
    ...snapshot,
    placementHistory,
    historyCursor: input?.historyCursor ?? placementHistory.length - 1,
    baselineSnapshot: input?.baselineSnapshot ?? snapshot
  });
}
