import { z } from "zod";

export const sceneObjectCategorySchema = z.enum([
  "gameplay-course-object",
  "structure",
  "prop",
  "landmark",
  "vegetation",
  "supporting-scenery",
  "animated-set-piece"
]);
export const scenePlacementRuleSchema = z.enum([
  "hero-placement",
  "scatter",
  "avoid-playable-core",
  "edge-follow",
  "support-space"
]);

export const placementModeSchema = z.enum([
  "select",
  "move",
  "rotate",
  "scale",
  "duplicate",
  "group"
]);

export const gizmoModeSchema = z.enum(["move", "rotate", "scale", "universal"]);
export const transformSpaceSchema = z.enum(["local", "world"]);
export const pivotModeSchema = z.enum(["object-origin", "selection-center", "custom-pivot"]);
export const parentNodeTypeSchema = z.enum(["collection", "group", "object"]);
export const sceneNodeTypeSchema = z.enum(["object", "group"]);
export const placementConstraintKindSchema = z.enum([
  "grid",
  "terrain-surface",
  "surface-normal",
  "axis-lock",
  "uniform-scale",
  "keep-upright",
  "bounds"
]);
export const exportRoleSchema = z.enum([
  "visual-only",
  "gameplay-critical",
  "preview-critical",
  "managed-integration"
]);
export const managedBridgeModeSchema = z.enum(["native", "managed-integration"]);
export const sceneBindingTypeSchema = z.enum([
  "hole",
  "tee",
  "pin",
  "hazard",
  "drop-zone",
  "preview",
  "event",
  "landmark",
  "district",
  "custom"
]);
export const placementHistoryActionTypeSchema = z.enum([
  "select",
  "placement-update",
  "move",
  "rotate",
  "scale",
  "duplicate",
  "group",
  "ungroup",
  "lock",
  "unlock",
  "hide",
  "show",
  "snap-update",
  "transform-space",
  "pivot-update",
  "filter-update",
  "viewport-update",
  "terrain-update",
  "routing-update",
  "simulator-anchor-update",
  "undo",
  "redo"
]);
export const terrainGameplayPurposeSchema = z.enum([
  "tee-complex",
  "fairway",
  "rough",
  "green-complex",
  "hazard",
  "out-of-bounds",
  "transition",
  "support",
  "preview",
  "scenery"
]);
export const terrainModifierKindSchema = z.enum([
  "flatten",
  "raise",
  "lower",
  "smooth",
  "noise",
  "cut",
  "bunker-carve",
  "water-carve"
]);
export const routingNodeKindSchema = z.enum([
  "tee",
  "carry-target",
  "landing-zone",
  "decision-point",
  "approach",
  "green-center",
  "exit",
  "preview-anchor"
]);
export const routingSegmentKindSchema = z.enum([
  "primary-shot",
  "layup",
  "approach",
  "transition",
  "support-path"
]);
export const routingPathStatusSchema = z.enum(["draft", "connected", "blocked"]);
export const terrainMaterialBlendModeSchema = z.enum(["paint", "blend"]);
export const terrainMaterialStackRoleSchema = z.enum(["base", "accent", "detail"]);
export const terrainMaterialVisibilityModeSchema = z.enum([
  "all",
  "active-material",
  "selected-region"
]);
export const surfaceSnapModeSchema = z.enum([
  "none",
  "terrain-region",
  "simulator-surface"
]);
export const routingVisibilityModeSchema = z.enum([
  "all",
  "active-hole",
  "selected-route",
  "routing-only"
]);
export const authoringPreviewModeSchema = z.enum([
  "idle",
  "placement",
  "scenery-brush",
  "terrain-finish"
]);
export const authoringPreviewSourceSchema = z.enum([
  "content-pack",
  "asset-library",
  "viewport-arm"
]);
export const sceneSpatialEntityTypeSchema = z.enum([
  "scene-object",
  "scene-group",
  "terrain-surface",
  "terrain-profile",
  "terrain-region",
  "terrain-modifier",
  "routing-node",
  "routing-segment",
  "routing-path",
  "fairway-corridor",
  "green-zone",
  "tee-zone",
  "hazard-zone",
  "out-of-bounds-zone",
  "drop-zone-area",
  "visibility-corridor",
  "play-route-envelope"
]);
export const viewportRendererModeSchema = z.enum([
  "schematic-2d",
  "hybrid-preview",
  "renderer-backed"
]);
export const viewportBackendStatusSchema = z.enum(["planned", "scaffolded", "connected"]);
export const viewportProjectionModeSchema = z.enum([
  "top-down",
  "orbit",
  "isometric",
  "cinematic"
]);
export const authoringWorkspaceModeSchema = z.enum([
  "placement",
  "scenery-brush",
  "terrain",
  "routing",
  "simulator-anchors"
]);
export const viewportDensityModeSchema = z.enum(["off", "collection", "hole", "district"]);
export const interactionHandleSchema = z.enum(["x", "y", "z", "xy", "xz", "yz", "free"]);
export const interactionStateSchema = z.enum(["idle", "armed", "dragging"]);
export const terrainToolModeSchema = z.enum([
  "select-region",
  "create-region",
  "reshape-region",
  "classify-region",
  "modifier-edit",
  "paint-material"
]);
export const terrainSculptModeSchema = z.enum(["raise", "lower", "smooth", "flatten"]);
export const routingToolModeSchema = z.enum([
  "select-route",
  "add-node",
  "move-node",
  "connect-segment",
  "split-segment",
  "delete-segment",
  "assign-role",
  "corridor-edit",
  "envelope-edit"
]);
export const simulatorAnchorToolModeSchema = z.enum([
  "select-anchor",
  "tee-anchor",
  "pin-anchor",
  "hazard-zone",
  "oob-boundary",
  "drop-zone",
  "preview-anchor"
]);

export const vector3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number()
});

export const spatialPolylineSchema = z.object({
  points: z.array(vector3Schema).min(2)
});

export const spatialPolygonSchema = z.object({
  points: z.array(vector3Schema).min(3)
});

export const transformSchema = z.object({
  position: vector3Schema,
  rotation: vector3Schema,
  scale: vector3Schema,
  pivotOffset: vector3Schema,
  originPreset: z.enum(["asset-origin", "base-center", "custom"])
});

export const placementConstraintSchema = z.object({
  constraintId: z.string(),
  kind: placementConstraintKindSchema,
  enabled: z.boolean(),
  axes: z.array(z.enum(["x", "y", "z"])).default([]),
  value: z.number().nullable(),
  note: z.string()
});

export const sceneBindingSchema = z.object({
  bindingType: sceneBindingTypeSchema,
  entityId: z.string(),
  exportRole: exportRoleSchema
});

export const sceneSpatialReferenceSchema = z.object({
  entityType: sceneSpatialEntityTypeSchema,
  entityId: z.string(),
  holeId: z.string().nullable(),
  note: z.string()
});

export const placementLayerSchema = z.object({
  layerId: z.string(),
  name: z.string(),
  description: z.string(),
  visible: z.boolean(),
  locked: z.boolean(),
  colorToken: z.string(),
  filterCategories: z.array(sceneObjectCategorySchema).default([])
});

export const sceneCollectionSchema = z.object({
  collectionId: z.string(),
  name: z.string(),
  description: z.string(),
  defaultLayerId: z.string(),
  routeSummary: z.string(),
  tags: z.array(z.string()).default([])
});

export const sceneObjectSchema = z.object({
  sceneObjectId: z.string(),
  collectionId: z.string(),
  name: z.string(),
  category: sceneObjectCategorySchema,
  objectType: z.string(),
  assetRef: z.string().nullable(),
  placementLayerId: z.string(),
  transform: transformSchema,
  locked: z.boolean(),
  visible: z.boolean(),
  castShadows: z.boolean(),
  receiveShadows: z.boolean(),
  managedBridgeMode: managedBridgeModeSchema,
  binding: sceneBindingSchema.nullable(),
  placementConstraints: z.array(placementConstraintSchema),
  tags: z.array(z.string()).default([])
});

export const sceneGroupSchema = z.object({
  groupId: z.string(),
  collectionId: z.string(),
  name: z.string(),
  placementLayerId: z.string(),
  locked: z.boolean(),
  visible: z.boolean(),
  pivot: vector3Schema,
  tags: z.array(z.string()).default([])
});

export const placementAssetDraftSchema = z.object({
  draftId: z.string(),
  assetRef: z.string(),
  label: z.string(),
  objectType: z.string(),
  category: sceneObjectCategorySchema,
  footprintRadiusMeters: z.number().positive(),
  packId: z.string().nullable(),
  tags: z.array(z.string()).default([]),
  placementRules: z.array(scenePlacementRuleSchema).default([])
});

export const sceneryBrushCategoryWeightSchema = z.object({
  category: sceneObjectCategorySchema,
  weight: z.number().min(0.1).max(5)
});

export const sceneryBrushAssetWeightSchema = z.object({
  assetRef: z.string(),
  weight: z.number().min(0.1).max(5)
});

export const parentRelationshipSchema = z.object({
  relationshipId: z.string(),
  childId: z.string(),
  childType: sceneNodeTypeSchema,
  parentId: z.string().nullable(),
  parentType: parentNodeTypeSchema.nullable()
});

export const selectionStateSchema = z.object({
  selectedObjectIds: z.array(z.string()).default([]),
  selectedGroupIds: z.array(z.string()).default([]),
  selectedSpatialEntityRefs: z.array(sceneSpatialReferenceSchema).default([]),
  primarySelectionId: z.string().nullable(),
  hoveredObjectId: z.string().nullable(),
  hoveredSpatialEntityRef: sceneSpatialReferenceSchema.nullable(),
  transformSpace: transformSpaceSchema,
  pivotMode: pivotModeSchema,
  filterCategories: z.array(sceneObjectCategorySchema).default([]),
  includeHiddenObjects: z.boolean()
});

export const snapSettingsSchema = z.object({
  gridEnabled: z.boolean(),
  gridSizeMeters: z.number().positive(),
  rotationSnapEnabled: z.boolean(),
  rotationStepDegrees: z.number().positive(),
  scaleSnapEnabled: z.boolean(),
  scaleStepPercent: z.number().positive(),
  surfaceSnapEnabled: z.boolean(),
  terrainSnapEnabled: z.boolean(),
  alignToSurfaceNormal: z.boolean(),
  keepUpright: z.boolean()
});

export const placementPresetSchema = z.object({
  presetId: z.string(),
  name: z.string(),
  description: z.string(),
  favorite: z.boolean().default(false),
  useCount: z.number().int().nonnegative().default(0),
  lastUsedAt: z.string().nullable().default(null),
  defaultPlacementMode: placementModeSchema,
  preferredPackId: z.string().nullable(),
  preferredCategory: sceneObjectCategorySchema.nullable(),
  gridEnabled: z.boolean(),
  rotationSnapEnabled: z.boolean(),
  rotationStepDegrees: z.number().positive(),
  surfaceSnapEnabled: z.boolean(),
  terrainSnapEnabled: z.boolean(),
  alignToSurfaceNormal: z.boolean(),
  keepUpright: z.boolean()
});

export const surfaceRuleSlopeHandlingModeSchema = z.enum(["strict", "adaptive", "expressive"]);
export const surfaceRuleOrientationPostureSchema = z.enum(["upright", "hybrid", "surface-follow"]);
export const surfaceRulePackInfluenceModeSchema = z.enum(["balanced", "pack-led", "surface-led"]);

export const surfaceRuleDraftSettingsSchema = z.object({
  slopeHandlingMode: surfaceRuleSlopeHandlingModeSchema,
  slopeLimitDegrees: z.number().min(0).max(45),
  orientationPosture: surfaceRuleOrientationPostureSchema,
  preferredSurfacePurposes: z.array(terrainGameplayPurposeSchema).default([]),
  avoidedSurfacePurposes: z.array(terrainGameplayPurposeSchema).default([]),
  preferredPackId: z.string().nullable(),
  preferredCategory: sceneObjectCategorySchema.nullable(),
  packInfluenceMode: surfaceRulePackInfluenceModeSchema,
  suitabilityBias: z.number().min(0).max(1),
  avoidanceBias: z.number().min(0).max(1)
});

export const surfaceRulePresetSchema = z.object({
  presetId: z.string(),
  name: z.string(),
  description: z.string(),
  favorite: z.boolean().default(false),
  useCount: z.number().int().nonnegative().default(0),
  lastUsedAt: z.string().nullable().default(null),
  surfaceSnapEnabled: z.boolean(),
  terrainSnapEnabled: z.boolean(),
  alignToSurfaceNormal: z.boolean(),
  keepUpright: z.boolean(),
  slopeHandlingMode: surfaceRuleSlopeHandlingModeSchema,
  orientationPosture: surfaceRuleOrientationPostureSchema,
  slopeLimitDegrees: z.number().min(0).max(45),
  preferredSurfacePurposes: z.array(terrainGameplayPurposeSchema).default([]),
  avoidedSurfacePurposes: z.array(terrainGameplayPurposeSchema).default([]),
  preferredPackId: z.string().nullable(),
  preferredCategory: sceneObjectCategorySchema.nullable(),
  packInfluenceMode: surfaceRulePackInfluenceModeSchema,
  suitabilityBias: z.number().min(0).max(1),
  avoidanceBias: z.number().min(0).max(1),
  activePackInfluence: z.number().min(0).max(1),
  avoidPlayableCoreStrength: z.number().min(0).max(1),
  placementRules: z.array(scenePlacementRuleSchema).default([])
});

export const placementOverlayStateSchema = z.object({
  showValidationOverlay: z.boolean(),
  showDensityOverlay: z.boolean(),
  showPerformanceOverlay: z.boolean(),
  showLayerOverlay: z.boolean(),
  showHiddenGhosts: z.boolean(),
  showRoutingOverlay: z.boolean(),
  showSurfaceRuleCoverageOverlay: z.boolean(),
  showTerrainOverlay: z.boolean(),
  showTerrainFinishOverlay: z.boolean(),
  showSimulatorAnchorsOverlay: z.boolean()
});

export const terrainSurfaceSchema = z.object({
  terrainSurfaceId: z.string(),
  name: z.string(),
  gameplayPurpose: terrainGameplayPurposeSchema,
  materialFamily: z.string(),
  playable: z.boolean(),
  visualRole: z.string(),
  note: z.string()
});

export const terrainProfileSchema = z.object({
  terrainProfileId: z.string(),
  name: z.string(),
  description: z.string(),
  primarySurfaceId: z.string(),
  slopeToleranceDegrees: z.number().nonnegative(),
  roughness: z.number().min(0).max(1),
  drainageBias: z.number().min(0).max(1),
  themeTags: z.array(z.string()).default([])
});

export const terrainRegionSchema = z.object({
  terrainRegionId: z.string(),
  collectionId: z.string(),
  holeId: z.string().nullable(),
  name: z.string(),
  gameplayPurpose: terrainGameplayPurposeSchema,
  terrainProfileId: z.string(),
  boundary: spatialPolygonSchema,
  elevationMin: z.number(),
  elevationMax: z.number(),
  paintedMaterialIds: z.array(z.string()).default([]),
  linkedZoneIds: z.array(z.string()).default([]),
  linkedSceneObjectIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([])
});

export const terrainModifierSchema = z.object({
  terrainModifierId: z.string(),
  holeId: z.string().nullable(),
  regionId: z.string().nullable(),
  kind: terrainModifierKindSchema,
  strength: z.number().min(0).max(1),
  falloffMeters: z.number().nonnegative(),
  targetHeight: z.number().nullable(),
  bounds: spatialPolygonSchema,
  note: z.string()
});

export const terrainMaterialSwatchSchema = z.object({
  terrainMaterialId: z.string(),
  label: z.string(),
  materialFamily: z.string(),
  colorToken: z.string(),
  paletteSlot: z.number().int().min(1).max(12),
  stackRole: terrainMaterialStackRoleSchema,
  favorite: z.boolean(),
  blendBias: z.number().min(0).max(1),
  visualFinish: z.string(),
  gameplayPurpose: terrainGameplayPurposeSchema.nullable(),
  note: z.string()
});

export const terrainPaintStrokeSchema = z.object({
  terrainPaintStrokeId: z.string(),
  holeId: z.string().nullable(),
  regionId: z.string().nullable(),
  terrainMaterialId: z.string(),
  blendMode: terrainMaterialBlendModeSchema,
  layerIndex: z.number().int().min(0).max(4),
  opacity: z.number().min(0.1).max(1),
  brushRadiusMeters: z.number().positive(),
  brushStrength: z.number().min(0).max(1),
  brushFalloffMeters: z.number().nonnegative(),
  bounds: spatialPolygonSchema,
  note: z.string()
});

export const routingNodeSchema = z.object({
  routingNodeId: z.string(),
  holeId: z.string(),
  kind: routingNodeKindSchema,
  label: z.string(),
  position: vector3Schema,
  linkedSceneObjectId: z.string().nullable(),
  linkedZoneId: z.string().nullable()
});

export const routingSegmentSchema = z.object({
  routingSegmentId: z.string(),
  holeId: z.string(),
  fromNodeId: z.string(),
  toNodeId: z.string(),
  kind: routingSegmentKindSchema,
  controlLine: spatialPolylineSchema,
  targetWidthMeters: z.number().positive(),
  blockedSceneObjectIds: z.array(z.string()).default([]),
  visibilityCorridorId: z.string().nullable()
});

export const routingPathSchema = z.object({
  routingPathId: z.string(),
  holeId: z.string(),
  name: z.string(),
  teeNodeId: z.string(),
  greenNodeId: z.string(),
  nodeIds: z.array(z.string()).min(2),
  segmentIds: z.array(z.string()).min(1),
  routeStatus: routingPathStatusSchema,
  note: z.string()
});

export const fairwayCorridorSchema = z.object({
  fairwayCorridorId: z.string(),
  holeId: z.string(),
  routingPathId: z.string(),
  centerline: spatialPolylineSchema,
  averageWidthMeters: z.number().positive(),
  landingZoneCount: z.number().int().min(0),
  note: z.string()
});

export const greenZoneSchema = z.object({
  greenZoneId: z.string(),
  holeId: z.string(),
  boundary: spatialPolygonSchema,
  targetPinCapacity: z.number().int().min(1),
  approachNodeId: z.string().nullable(),
  note: z.string()
});

export const teeZoneSchema = z.object({
  teeZoneId: z.string(),
  holeId: z.string(),
  boundary: spatialPolygonSchema,
  teeSetRefs: z.array(z.string()).default([]),
  facingDirectionDegrees: z.number(),
  note: z.string()
});

export const hazardZoneSchema = z.object({
  hazardZoneId: z.string(),
  holeId: z.string(),
  hazardLabel: z.string(),
  boundary: spatialPolygonSchema,
  linkedHazardIds: z.array(z.string()).default([]),
  note: z.string()
});

export const outOfBoundsZoneSchema = z.object({
  outOfBoundsZoneId: z.string(),
  holeId: z.string(),
  sideLabel: z.string(),
  boundary: spatialPolygonSchema,
  enforced: z.boolean(),
  note: z.string()
});

export const dropZoneAreaSchema = z.object({
  dropZoneAreaId: z.string(),
  holeId: z.string(),
  boundary: spatialPolygonSchema,
  linkedDropZoneIds: z.array(z.string()).default([]),
  facingDirectionDegrees: z.number(),
  note: z.string()
});

export const visibilityCorridorSchema = z.object({
  visibilityCorridorId: z.string(),
  holeId: z.string(),
  fromNodeId: z.string(),
  toNodeId: z.string(),
  corridorLine: spatialPolylineSchema,
  minimumWidthMeters: z.number().positive(),
  blockedSceneObjectIds: z.array(z.string()).default([]),
  note: z.string()
});

export const playRouteEnvelopeSchema = z.object({
  playRouteEnvelopeId: z.string(),
  holeId: z.string(),
  routingPathId: z.string(),
  boundary: spatialPolygonSchema,
  blockedSceneObjectIds: z.array(z.string()).default([]),
  blockedZoneIds: z.array(z.string()).default([]),
  note: z.string()
});

export const cameraStateSchema = z.object({
  position: vector3Schema,
  target: vector3Schema,
  zoom: z.number().positive(),
  pitchDegrees: z.number(),
  yawDegrees: z.number()
});

export const transformInteractionPipelineSchema = z.object({
  activeHandle: interactionHandleSchema.nullable(),
  state: interactionStateSchema,
  draggingEntityId: z.string().nullable(),
  draggingEntityType: sceneSpatialEntityTypeSchema.nullable(),
  pendingActionLabel: z.string().nullable()
});

export const viewportStateSchema = z.object({
  rendererMode: viewportRendererModeSchema,
  backendStatus: viewportBackendStatusSchema,
  projectionMode: viewportProjectionModeSchema,
  authoringMode: authoringWorkspaceModeSchema,
  activeHoleId: z.string().nullable(),
  selectedRoutingPathId: z.string().nullable(),
  selectedTerrainRegionId: z.string().nullable(),
  densityMode: viewportDensityModeSchema,
  camera: cameraStateSchema,
  interactionPipeline: transformInteractionPipelineSchema,
  showGrid: z.boolean(),
  showCompass: z.boolean()
});

export const sceneryBrushSettingsSchema = z.object({
  brushRadiusMeters: z.number().positive(),
  density: z.number().int().min(1).max(24),
  randomness: z.number().min(0).max(1),
  rotationVarianceDegrees: z.number().min(0).max(180),
  scaleVariancePercent: z.number().min(0).max(100),
  activePackId: z.string().nullable(),
  categoryFilters: z.array(sceneObjectCategorySchema).default([]),
  categoryWeights: z.array(sceneryBrushCategoryWeightSchema).default([]),
  assetWeights: z.array(sceneryBrushAssetWeightSchema).default([]),
  minimumSpacingMeters: z.number().nonnegative(),
  activePackInfluence: z.number().min(0).max(1),
  avoidPlayableCoreStrength: z.number().min(0).max(1),
  slopeLimitDegrees: z.number().min(0).max(45),
  placementRules: z.array(scenePlacementRuleSchema).default([])
});

export const landmarkCorridorBundleLibraryEntrySchema = z.object({
  bundleId: z.string(),
  name: z.string(),
  description: z.string(),
  bundleAction: z.enum([
    "compose-open-support-bundle",
    "compose-route-support-bundle",
    "compose-presentation-calm-bundle",
    "compose-hybrid-support-bundle"
  ]),
  favorite: z.boolean().default(false),
  useCount: z.number().int().nonnegative().default(0),
  lastUsedAt: z.string().nullable().default(null)
});

export const surfaceRuleCleanupReviewModeSchema = z.enum([
  "balance-course",
  "expand-coverage",
  "guard-playable-core"
]);
export const surfaceRuleCleanupReviewStatusSchema = z.enum(["pending", "approved", "rejected"]);
export const surfaceRuleCleanupApprovalDepthSchema = z.enum(["focused", "regional", "course-wide"]);
export const surfaceRuleCleanupAuditEntrySchema = z.object({
  entryId: z.string(),
  recordedAt: z.string(),
  entryType: z.enum(["created", "approved", "rejected"]),
  status: surfaceRuleCleanupReviewStatusSchema,
  approvalDepth: surfaceRuleCleanupApprovalDepthSchema.nullable().default(null),
  summary: z.string(),
  diffSummary: z.string()
});
export const surfaceRuleCleanupDiffSchema = z.object({
  conflictingRegionCountBefore: z.number().int().nonnegative(),
  conflictingRegionCountAfter: z.number().int().nonnegative(),
  uncoveredRegionCountBefore: z.number().int().nonnegative(),
  uncoveredRegionCountAfter: z.number().int().nonnegative(),
  guardedRegionCountBefore: z.number().int().nonnegative(),
  guardedRegionCountAfter: z.number().int().nonnegative(),
  roughHoleCountBefore: z.number().int().nonnegative(),
  roughHoleCountAfter: z.number().int().nonnegative(),
  readyHoleCountBefore: z.number().int().nonnegative(),
  readyHoleCountAfter: z.number().int().nonnegative(),
  diffSummary: z.string()
});
export const surfaceRuleCleanupReviewSchema = z.object({
  reviewId: z.string(),
  createdAt: z.string(),
  reviewedAt: z.string().nullable().default(null),
  mode: surfaceRuleCleanupReviewModeSchema,
  status: surfaceRuleCleanupReviewStatusSchema,
  confidenceState: z.enum(["rough", "watch", "clean"]),
  requiresBroadApproval: z.boolean().default(false),
  approvalDepth: surfaceRuleCleanupApprovalDepthSchema.nullable().default(null),
  affectedHoleIds: z.array(z.string()).default([]),
  summary: z.string(),
  proposedAction: z.string(),
  cleanupDiff: surfaceRuleCleanupDiffSchema,
  auditTrail: z.array(surfaceRuleCleanupAuditEntrySchema).default([]),
  proposedDraft: surfaceRuleDraftSettingsSchema,
  proposedSnapSettings: snapSettingsSchema,
  proposedBrushSettings: sceneryBrushSettingsSchema
});

export const sceneryBrushPresetSchema = z.object({
  presetId: z.string(),
  name: z.string(),
  description: z.string(),
  favorite: z.boolean().default(false),
  useCount: z.number().int().nonnegative().default(0),
  lastUsedAt: z.string().nullable().default(null),
  settings: sceneryBrushSettingsSchema
});

export const routingGuideSettingsSchema = z.object({
  angleSnapEnabled: z.boolean(),
  angleStepDegrees: z.number().positive(),
  workingHeightMeters: z.number(),
  autoConnectEnabled: z.boolean(),
  autoMergeEnabled: z.boolean(),
  mergeToleranceMeters: z.number().positive(),
  visibilityMode: routingVisibilityModeSchema,
  defaultSegmentWidthMeters: z.number().positive(),
  defaultCorridorWidthMeters: z.number().positive()
});

export const authoringPreviewStateSchema = z.object({
  mode: authoringPreviewModeSchema,
  source: authoringPreviewSourceSchema.nullable(),
  draft: placementAssetDraftSchema.nullable(),
  worldPoint: vector3Schema.nullable(),
  label: z.string().nullable(),
  surfaceLabel: z.string().nullable(),
  surfaceSlopeDegrees: z.number().nonnegative(),
  surfaceSnapMode: surfaceSnapModeSchema,
  terrainMaterialId: z.string().nullable(),
  terrainLayerIndex: z.number().int().min(0).max(4),
  previewRadiusMeters: z.number().nonnegative(),
  previewDensity: z.number().int().min(0).max(24),
  activeCategory: sceneObjectCategorySchema.nullable(),
  visible: z.boolean()
});

export const buildEditingStateSchema = z.object({
  activeTerrainTool: terrainToolModeSchema,
  terrainSculptMode: terrainSculptModeSchema,
  terrainBrushRadiusMeters: z.number().positive(),
  terrainBrushStrength: z.number().min(0).max(1),
  terrainBrushFalloffMeters: z.number().nonnegative(),
  terrainBrushTargetHeight: z.number().nullable(),
  activeTerrainMaterialId: z.string().nullable(),
  activeTerrainMaterialLayerIndex: z.number().int().min(0).max(4),
  terrainPaintBlendMode: terrainMaterialBlendModeSchema,
  terrainMaterialVisibilityMode: terrainMaterialVisibilityModeSchema,
  activeRoutingTool: routingToolModeSchema,
  activeSimulatorAnchorTool: simulatorAnchorToolModeSchema,
  activePlacementDraft: placementAssetDraftSchema.nullable(),
  placementPresets: z.array(placementPresetSchema).default([]),
  surfaceRulePresets: z.array(surfaceRulePresetSchema).default([]),
  surfaceRuleDraft: surfaceRuleDraftSettingsSchema,
  surfaceRuleCleanupReviews: z.array(surfaceRuleCleanupReviewSchema).default([]),
  landmarkCorridorBundleLibrary: z.array(landmarkCorridorBundleLibraryEntrySchema).default([]),
  sceneryBrushDrafts: z.array(placementAssetDraftSchema).default([]),
  sceneryBrushPresets: z.array(sceneryBrushPresetSchema).default([]),
  sceneryBrush: sceneryBrushSettingsSchema,
  routingGuideSettings: routingGuideSettingsSchema,
  authoringPreview: authoringPreviewStateSchema,
  showBuilderGuidance: z.boolean(),
  dismissedGuideIds: z.array(z.string()).default([]),
  selectedTerrainRegionId: z.string().nullable(),
  selectedTerrainModifierId: z.string().nullable(),
  selectedRoutingNodeId: z.string().nullable(),
  selectedRoutingSegmentId: z.string().nullable(),
  selectedFairwayCorridorId: z.string().nullable(),
  selectedVisibilityCorridorId: z.string().nullable(),
  selectedPlayRouteEnvelopeId: z.string().nullable(),
  selectedHazardZoneId: z.string().nullable(),
  selectedOutOfBoundsZoneId: z.string().nullable(),
  selectedDropZoneAreaId: z.string().nullable(),
  pendingConnectionStartNodeId: z.string().nullable(),
  pendingPlacementHoleId: z.string().nullable()
});

export const sceneAuthoringSnapshotSchema = z.object({
  activeCollectionId: z.string().nullable(),
  placementMode: placementModeSchema,
  gizmoMode: gizmoModeSchema,
  selectionState: selectionStateSchema,
  snapSettings: snapSettingsSchema,
  overlayState: placementOverlayStateSchema,
  viewportState: viewportStateSchema,
  editingState: buildEditingStateSchema,
  sceneCollections: z.array(sceneCollectionSchema),
  placementLayers: z.array(placementLayerSchema),
  sceneObjects: z.array(sceneObjectSchema),
  sceneGroups: z.array(sceneGroupSchema),
  parentRelationships: z.array(parentRelationshipSchema),
  terrainSurfaces: z.array(terrainSurfaceSchema),
  terrainProfiles: z.array(terrainProfileSchema),
  terrainRegions: z.array(terrainRegionSchema),
  terrainModifiers: z.array(terrainModifierSchema),
  terrainMaterialPalette: z.array(terrainMaterialSwatchSchema),
  terrainPaintStrokes: z.array(terrainPaintStrokeSchema),
  routingNodes: z.array(routingNodeSchema),
  routingSegments: z.array(routingSegmentSchema),
  routingPaths: z.array(routingPathSchema),
  fairwayCorridors: z.array(fairwayCorridorSchema),
  greenZones: z.array(greenZoneSchema),
  teeZones: z.array(teeZoneSchema),
  hazardZones: z.array(hazardZoneSchema),
  outOfBoundsZones: z.array(outOfBoundsZoneSchema),
  dropZoneAreas: z.array(dropZoneAreaSchema),
  visibilityCorridors: z.array(visibilityCorridorSchema),
  playRouteEnvelopes: z.array(playRouteEnvelopeSchema)
});

export const placementHistoryActionSchema = z.object({
  actionId: z.string(),
  actionType: placementHistoryActionTypeSchema,
  summary: z.string(),
  targetIds: z.array(z.string()),
  createdAt: z.string(),
  snapshot: sceneAuthoringSnapshotSchema
});

export const sceneAuthoringStateSchema = sceneAuthoringSnapshotSchema.extend({
  placementHistory: z.array(placementHistoryActionSchema),
  historyCursor: z.number().int().min(-1),
  baselineSnapshot: sceneAuthoringSnapshotSchema
});

export type SceneObjectCategory = z.infer<typeof sceneObjectCategorySchema>;
export type ScenePlacementRule = z.infer<typeof scenePlacementRuleSchema>;
export type PlacementMode = z.infer<typeof placementModeSchema>;
export type GizmoMode = z.infer<typeof gizmoModeSchema>;
export type TransformSpace = z.infer<typeof transformSpaceSchema>;
export type PivotMode = z.infer<typeof pivotModeSchema>;
export type PlacementConstraintKind = z.infer<typeof placementConstraintKindSchema>;
export type PlacementConstraint = z.infer<typeof placementConstraintSchema>;
export type Vector3 = z.infer<typeof vector3Schema>;
export type SpatialPolyline = z.infer<typeof spatialPolylineSchema>;
export type SpatialPolygon = z.infer<typeof spatialPolygonSchema>;
export type Transform = z.infer<typeof transformSchema>;
export type SceneBinding = z.infer<typeof sceneBindingSchema>;
export type SceneSpatialEntityType = z.infer<typeof sceneSpatialEntityTypeSchema>;
export type SceneSpatialReference = z.infer<typeof sceneSpatialReferenceSchema>;
export type PlacementLayer = z.infer<typeof placementLayerSchema>;
export type SceneCollection = z.infer<typeof sceneCollectionSchema>;
export type SceneObject = z.infer<typeof sceneObjectSchema>;
export type SceneGroup = z.infer<typeof sceneGroupSchema>;
export type ParentRelationship = z.infer<typeof parentRelationshipSchema>;
export type SelectionState = z.infer<typeof selectionStateSchema>;
export type SnapSettings = z.infer<typeof snapSettingsSchema>;
export type PlacementPreset = z.infer<typeof placementPresetSchema>;
export type SurfaceRuleSlopeHandlingMode = z.infer<typeof surfaceRuleSlopeHandlingModeSchema>;
export type SurfaceRuleOrientationPosture = z.infer<typeof surfaceRuleOrientationPostureSchema>;
export type SurfaceRulePackInfluenceMode = z.infer<typeof surfaceRulePackInfluenceModeSchema>;
export type SurfaceRuleDraftSettings = z.infer<typeof surfaceRuleDraftSettingsSchema>;
export type SurfaceRulePreset = z.infer<typeof surfaceRulePresetSchema>;
export type SurfaceRuleCleanupReviewMode = z.infer<typeof surfaceRuleCleanupReviewModeSchema>;
export type SurfaceRuleCleanupReviewStatus = z.infer<typeof surfaceRuleCleanupReviewStatusSchema>;
export type SurfaceRuleCleanupAuditEntry = z.infer<typeof surfaceRuleCleanupAuditEntrySchema>;
export type SurfaceRuleCleanupDiff = z.infer<typeof surfaceRuleCleanupDiffSchema>;
export type SurfaceRuleCleanupReview = z.infer<typeof surfaceRuleCleanupReviewSchema>;
export type PlacementOverlayState = z.infer<typeof placementOverlayStateSchema>;
export type TerrainGameplayPurpose = z.infer<typeof terrainGameplayPurposeSchema>;
export type TerrainSurface = z.infer<typeof terrainSurfaceSchema>;
export type TerrainProfile = z.infer<typeof terrainProfileSchema>;
export type TerrainModifierKind = z.infer<typeof terrainModifierKindSchema>;
export type TerrainMaterialBlendMode = z.infer<typeof terrainMaterialBlendModeSchema>;
export type TerrainMaterialStackRole = z.infer<typeof terrainMaterialStackRoleSchema>;
export type TerrainMaterialVisibilityMode = z.infer<typeof terrainMaterialVisibilityModeSchema>;
export type SurfaceSnapMode = z.infer<typeof surfaceSnapModeSchema>;
export type TerrainRegion = z.infer<typeof terrainRegionSchema>;
export type TerrainModifier = z.infer<typeof terrainModifierSchema>;
export type TerrainMaterialSwatch = z.infer<typeof terrainMaterialSwatchSchema>;
export type TerrainPaintStroke = z.infer<typeof terrainPaintStrokeSchema>;
export type RoutingNodeKind = z.infer<typeof routingNodeKindSchema>;
export type RoutingNode = z.infer<typeof routingNodeSchema>;
export type RoutingSegmentKind = z.infer<typeof routingSegmentKindSchema>;
export type RoutingSegment = z.infer<typeof routingSegmentSchema>;
export type RoutingPathStatus = z.infer<typeof routingPathStatusSchema>;
export type RoutingPath = z.infer<typeof routingPathSchema>;
export type FairwayCorridor = z.infer<typeof fairwayCorridorSchema>;
export type GreenZone = z.infer<typeof greenZoneSchema>;
export type TeeZone = z.infer<typeof teeZoneSchema>;
export type HazardZone = z.infer<typeof hazardZoneSchema>;
export type OutOfBoundsZone = z.infer<typeof outOfBoundsZoneSchema>;
export type DropZoneArea = z.infer<typeof dropZoneAreaSchema>;
export type VisibilityCorridor = z.infer<typeof visibilityCorridorSchema>;
export type PlayRouteEnvelope = z.infer<typeof playRouteEnvelopeSchema>;
export type ViewportRendererMode = z.infer<typeof viewportRendererModeSchema>;
export type ViewportBackendStatus = z.infer<typeof viewportBackendStatusSchema>;
export type ViewportProjectionMode = z.infer<typeof viewportProjectionModeSchema>;
export type AuthoringWorkspaceMode = z.infer<typeof authoringWorkspaceModeSchema>;
export type ViewportDensityMode = z.infer<typeof viewportDensityModeSchema>;
export type TerrainToolMode = z.infer<typeof terrainToolModeSchema>;
export type TerrainSculptMode = z.infer<typeof terrainSculptModeSchema>;
export type RoutingToolMode = z.infer<typeof routingToolModeSchema>;
export type RoutingVisibilityMode = z.infer<typeof routingVisibilityModeSchema>;
export type SimulatorAnchorToolMode = z.infer<typeof simulatorAnchorToolModeSchema>;
export type AuthoringPreviewMode = z.infer<typeof authoringPreviewModeSchema>;
export type AuthoringPreviewSource = z.infer<typeof authoringPreviewSourceSchema>;
export type CameraState = z.infer<typeof cameraStateSchema>;
export type TransformInteractionPipeline = z.infer<typeof transformInteractionPipelineSchema>;
export type ViewportState = z.infer<typeof viewportStateSchema>;
export type PlacementAssetDraft = z.infer<typeof placementAssetDraftSchema>;
export type SceneryBrushCategoryWeight = z.infer<typeof sceneryBrushCategoryWeightSchema>;
export type SceneryBrushAssetWeight = z.infer<typeof sceneryBrushAssetWeightSchema>;
export type SceneryBrushSettings = z.infer<typeof sceneryBrushSettingsSchema>;
export type LandmarkCorridorBundleLibraryEntry = z.infer<typeof landmarkCorridorBundleLibraryEntrySchema>;
export type SceneryBrushPreset = z.infer<typeof sceneryBrushPresetSchema>;
export type RoutingGuideSettings = z.infer<typeof routingGuideSettingsSchema>;
export type AuthoringPreviewState = z.infer<typeof authoringPreviewStateSchema>;
export type BuildEditingState = z.infer<typeof buildEditingStateSchema>;
export type SceneAuthoringSnapshot = z.infer<typeof sceneAuthoringSnapshotSchema>;
export type PlacementHistoryAction = z.infer<typeof placementHistoryActionSchema>;
export type PlacementHistoryActionType = z.infer<typeof placementHistoryActionTypeSchema>;
export type SceneAuthoringState = z.infer<typeof sceneAuthoringStateSchema>;
