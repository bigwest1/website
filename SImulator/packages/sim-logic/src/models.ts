import { z } from "zod";

import {
  sceneSpatialReferenceSchema,
  vector3Schema
} from "@course-creator-os/scene-authoring";

export const teeColors = [
  "black",
  "gold",
  "blue",
  "white",
  "silver",
  "red",
  "green"
] as const;
export const pinDifficulties = ["easy", "standard", "tournament"] as const;
export const surfaceTypes = [
  "fairway",
  "rough",
  "bunker",
  "green",
  "fringe",
  "water",
  "cart-path"
] as const;
export const hazardTypes = ["water", "bunker", "out-of-bounds", "waste", "native-area"] as const;
export const logicStatuses = ["clear", "watch", "blocked"] as const;
export const exportReadinessStates = ["draft", "ready", "blocked"] as const;
export const previewInputStates = ["missing", "draft", "ready"] as const;
export const spatialBindingStates = ["missing", "draft", "ready"] as const;
export const previewAnchorRoles = [
  "flyover-start",
  "flyover-apex",
  "flyover-end",
  "minimap-center",
  "minimap-north",
  "hero-frame"
] as const;

export const teeColorSchema = z.enum(teeColors);
export const pinDifficultySchema = z.enum(pinDifficulties);
export const surfaceTypeSchema = z.enum(surfaceTypes);
export const hazardTypeSchema = z.enum(hazardTypes);
export const logicStatusSchema = z.enum(logicStatuses);
export const exportReadinessSchema = z.enum(exportReadinessStates);
export const previewInputStateSchema = z.enum(previewInputStates);
export const spatialBindingStateSchema = z.enum(spatialBindingStates);
export const previewAnchorRoleSchema = z.enum(previewAnchorRoles);

export const teeSetSchema = z.object({
  teeSetId: z.string(),
  name: z.string(),
  color: teeColorSchema,
  totalYardage: z.number().positive(),
  defaultTee: z.boolean(),
  holeYardages: z.record(z.string(), z.number().positive())
});

export const pinSetSchema = z.object({
  pinSetId: z.string(),
  name: z.string(),
  difficulty: pinDifficultySchema,
  enabledHoleIds: z.array(z.string()).min(1)
});

export const surfaceProfileSchema = z.object({
  surfaceId: z.string(),
  name: z.string(),
  type: surfaceTypeSchema,
  physicsNote: z.string(),
  playable: z.boolean()
});

export const hazardProfileSchema = z.object({
  hazardId: z.string(),
  type: hazardTypeSchema,
  holeId: z.string(),
  playRule: z.string(),
  dropZoneRequired: z.boolean(),
  note: z.string()
});

export const dropZoneSchema = z.object({
  dropZoneId: z.string(),
  holeId: z.string(),
  label: z.string(),
  triggerHazardId: z.string(),
  note: z.string()
});

export const surfaceAssignmentsSchema = z.object({
  fairwaySurfaceId: z.string(),
  greenSurfaceId: z.string(),
  roughSurfaceId: z.string().nullable(),
  bunkerSurfaceId: z.string().nullable(),
  waterSurfaceId: z.string().nullable()
});

export const holePlayProfileSchema = z.object({
  holeId: z.string(),
  holeNumber: z.number().int().min(1).max(18),
  par: z.number().int().min(3).max(6),
  targetYardage: z.number().positive(),
  teeSetRefs: z.array(z.string()).min(1),
  pinSetRefs: z.array(z.string()).min(1),
  surfaceAssignments: surfaceAssignmentsSchema,
  hazardRefs: z.array(z.string()),
  outOfBounds: z.boolean(),
  playRouteEnvelopeRef: sceneSpatialReferenceSchema.nullable(),
  fairwayCorridorRef: sceneSpatialReferenceSchema.nullable(),
  greenZoneRef: sceneSpatialReferenceSchema.nullable(),
  visibilityCorridorRef: sceneSpatialReferenceSchema.nullable(),
  lineOfPlayStatus: logicStatusSchema,
  shotReadabilityStatus: logicStatusSchema,
  exportReadiness: exportReadinessSchema,
  logicNote: z.string()
});

export const teeSpatialBindingSchema = z.object({
  teeSpatialBindingId: z.string(),
  holeId: z.string(),
  teeSetId: z.string(),
  teeZoneRef: sceneSpatialReferenceSchema.nullable(),
  sceneObjectRef: sceneSpatialReferenceSchema.nullable(),
  positionHint: vector3Schema.nullable(),
  facingDirectionDegrees: z.number().nullable(),
  readinessState: spatialBindingStateSchema,
  note: z.string()
});

export const pinSpatialBindingSchema = z.object({
  pinSpatialBindingId: z.string(),
  holeId: z.string(),
  pinSetId: z.string(),
  greenZoneRef: sceneSpatialReferenceSchema.nullable(),
  sceneObjectRef: sceneSpatialReferenceSchema.nullable(),
  positionHint: vector3Schema.nullable(),
  readinessState: spatialBindingStateSchema,
  note: z.string()
});

export const hazardSpatialBindingSchema = z.object({
  hazardSpatialBindingId: z.string(),
  holeId: z.string(),
  hazardId: z.string(),
  hazardZoneRef: sceneSpatialReferenceSchema.nullable(),
  relatedSceneObjectRefs: z.array(sceneSpatialReferenceSchema).default([]),
  readinessState: spatialBindingStateSchema,
  note: z.string()
});

export const outOfBoundsSpatialBindingSchema = z.object({
  outOfBoundsSpatialBindingId: z.string(),
  holeId: z.string(),
  boundaryRefs: z.array(sceneSpatialReferenceSchema).default([]),
  readinessState: spatialBindingStateSchema,
  note: z.string()
});

export const dropZoneSpatialBindingSchema = z.object({
  dropZoneSpatialBindingId: z.string(),
  holeId: z.string(),
  dropZoneId: z.string(),
  dropZoneAreaRef: sceneSpatialReferenceSchema.nullable(),
  sceneObjectRef: sceneSpatialReferenceSchema.nullable(),
  readinessState: spatialBindingStateSchema,
  note: z.string()
});

export const previewAnchorBindingSchema = z.object({
  previewAnchorBindingId: z.string(),
  holeId: z.string(),
  role: previewAnchorRoleSchema,
  anchorRef: sceneSpatialReferenceSchema.nullable(),
  readinessState: spatialBindingStateSchema,
  note: z.string()
});

export const minimapMetadataSchema = z.object({
  holeId: z.string(),
  previewPathRef: z.string().nullable(),
  overlayState: previewInputStateSchema,
  framingNote: z.string(),
  focalLandmark: z.string(),
  orientationHint: z.string(),
  frameAnchorRef: sceneSpatialReferenceSchema.nullable(),
  northReferenceAnchorRef: sceneSpatialReferenceSchema.nullable()
});

export const flyoverMetadataSchema = z.object({
  holeId: z.string(),
  previewPathRef: z.string().nullable(),
  readinessState: previewInputStateSchema,
  cameraIntent: z.string(),
  introBeat: z.string(),
  outroBeat: z.string(),
  durationSeconds: z.number().positive(),
  startAnchorRef: sceneSpatialReferenceSchema.nullable(),
  apexAnchorRef: sceneSpatialReferenceSchema.nullable(),
  endAnchorRef: sceneSpatialReferenceSchema.nullable()
});

export const simulatorLogicConfigSchema = z.object({
  holeSequence: z.array(z.string()).min(1),
  teeSets: z.array(teeSetSchema).min(1),
  pinSets: z.array(pinSetSchema).min(1),
  surfaceProfiles: z.array(surfaceProfileSchema).min(1),
  hazardProfiles: z.array(hazardProfileSchema),
  dropZones: z.array(dropZoneSchema),
  holePlayProfiles: z.array(holePlayProfileSchema).min(1),
  teeSpatialBindings: z.array(teeSpatialBindingSchema),
  pinSpatialBindings: z.array(pinSpatialBindingSchema),
  hazardSpatialBindings: z.array(hazardSpatialBindingSchema),
  outOfBoundsSpatialBindings: z.array(outOfBoundsSpatialBindingSchema),
  dropZoneSpatialBindings: z.array(dropZoneSpatialBindingSchema),
  previewAnchorBindings: z.array(previewAnchorBindingSchema),
  minimapMetadata: z.array(minimapMetadataSchema),
  flyoverMetadata: z.array(flyoverMetadataSchema),
  outOfBoundsConfigured: z.boolean(),
  minimapCoverage: z.number().min(0).max(1),
  flyoverCoverage: z.number().min(0).max(1),
  exportProfileNotes: z.array(z.string())
});

export type TeeColor = z.infer<typeof teeColorSchema>;
export type PinDifficulty = z.infer<typeof pinDifficultySchema>;
export type SurfaceType = z.infer<typeof surfaceTypeSchema>;
export type HazardType = z.infer<typeof hazardTypeSchema>;
export type LogicStatus = z.infer<typeof logicStatusSchema>;
export type ExportReadiness = z.infer<typeof exportReadinessSchema>;
export type PreviewInputState = z.infer<typeof previewInputStateSchema>;
export type SpatialBindingState = z.infer<typeof spatialBindingStateSchema>;
export type PreviewAnchorRole = z.infer<typeof previewAnchorRoleSchema>;
export type TeeSet = z.infer<typeof teeSetSchema>;
export type PinSet = z.infer<typeof pinSetSchema>;
export type SurfaceProfile = z.infer<typeof surfaceProfileSchema>;
export type HazardProfile = z.infer<typeof hazardProfileSchema>;
export type DropZone = z.infer<typeof dropZoneSchema>;
export type SurfaceAssignments = z.infer<typeof surfaceAssignmentsSchema>;
export type HolePlayProfile = z.infer<typeof holePlayProfileSchema>;
export type TeeSpatialBinding = z.infer<typeof teeSpatialBindingSchema>;
export type PinSpatialBinding = z.infer<typeof pinSpatialBindingSchema>;
export type HazardSpatialBinding = z.infer<typeof hazardSpatialBindingSchema>;
export type OutOfBoundsSpatialBinding = z.infer<typeof outOfBoundsSpatialBindingSchema>;
export type DropZoneSpatialBinding = z.infer<typeof dropZoneSpatialBindingSchema>;
export type PreviewAnchorBinding = z.infer<typeof previewAnchorBindingSchema>;
export type MinimapMetadata = z.infer<typeof minimapMetadataSchema>;
export type FlyoverMetadata = z.infer<typeof flyoverMetadataSchema>;
export type SimulatorLogicConfig = z.infer<typeof simulatorLogicConfigSchema>;
