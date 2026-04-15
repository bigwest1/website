import { z } from "zod";

import {
  approvalStatusSchema,
  displayNameSchema,
  normalizationStateSchema
} from "@course-creator-os/core-types";

export { approvalStatusSchema, normalizationStateSchema } from "@course-creator-os/core-types";

export const assetSourceTypes = [
  "scratch",
  "licensed",
  "kitbash",
  "photogrammetry",
  "marketplace",
  "in-house"
] as const;
export const assetFileTypes = [
  "glb",
  "gltf",
  "fbx",
  "obj",
  "blend",
  "usd",
  "png",
  "jpg",
  "wav"
] as const;
export const assetCategories = [
  "architecture",
  "landmark",
  "vegetation",
  "props",
  "terrain",
  "water",
  "lighting",
  "signage",
  "transport",
  "effects",
  "audio",
  "gameplay"
] as const;
export const importQueueStates = [
  "queued",
  "ingesting",
  "ready-for-review",
  "blocked",
  "cataloged"
] as const;
export const scaleStatuses = ["normalized", "needs-review", "mismatch"] as const;
export const orientationStatuses = ["ready", "needs-review", "flipped"] as const;
export const assetAnalysisStatuses = ["not-started", "estimated", "verified"] as const;
export const assetComplexityGrades = ["light", "moderate", "heavy", "extreme"] as const;

export const assetSourceTypeSchema = z.enum(assetSourceTypes);
export const assetFileTypeSchema = z.enum(assetFileTypes);
export const assetCategorySchema = z.enum(assetCategories);
export const importQueueStateSchema = z.enum(importQueueStates);
export const scaleStatusSchema = z.enum(scaleStatuses);
export const orientationStatusSchema = z.enum(orientationStatuses);
export const assetAnalysisStatusSchema = z.enum(assetAnalysisStatuses);
export const assetComplexityGradeSchema = z.enum(assetComplexityGrades);

export const assetSourceSchema = z.object({
  sourceType: assetSourceTypeSchema,
  providerName: displayNameSchema.optional(),
  packageName: displayNameSchema.optional(),
  author: displayNameSchema.optional(),
  licenseSummary: z.string().min(1).optional(),
  sourceUri: z.string().min(1).optional()
});

export const assetDimensionsSchema = z.object({
  widthMeters: z.number().positive(),
  depthMeters: z.number().positive(),
  heightMeters: z.number().positive()
});

export const assetAnalysisSchema = z.object({
  analysisStatus: assetAnalysisStatusSchema,
  polyEstimate: z.number().min(0).nullable(),
  materialCount: z.number().min(0).nullable(),
  textureCount: z.number().min(0).nullable(),
  textureMemoryEstimateMb: z.number().min(0).nullable(),
  animationClipCount: z.number().min(0).nullable(),
  complexityGrade: assetComplexityGradeSchema.nullable(),
  note: z.string().optional()
});

export const assetSchema = z.object({
  assetId: z.string(),
  displayName: displayNameSchema,
  source: assetSourceSchema,
  importPath: z.string(),
  normalizedPath: z.string().optional(),
  fileType: assetFileTypeSchema,
  category: assetCategorySchema,
  styleTags: z.array(z.string()),
  queueState: importQueueStateSchema,
  dimensions: assetDimensionsSchema.optional(),
  normalizationState: normalizationStateSchema,
  scaleStatus: scaleStatusSchema,
  orientationStatus: orientationStatusSchema,
  analysis: assetAnalysisSchema,
  approvalStatus: approvalStatusSchema,
  notes: z.string().optional()
});

export type AssetSourceType = z.infer<typeof assetSourceTypeSchema>;
export type AssetFileType = z.infer<typeof assetFileTypeSchema>;
export type AssetCategory = z.infer<typeof assetCategorySchema>;
export type ImportQueueState = z.infer<typeof importQueueStateSchema>;
export type ScaleStatus = z.infer<typeof scaleStatusSchema>;
export type OrientationStatus = z.infer<typeof orientationStatusSchema>;
export type ApprovalStatus = z.infer<typeof approvalStatusSchema>;
export type NormalizationState = z.infer<typeof normalizationStateSchema>;
export type AssetAnalysisStatus = z.infer<typeof assetAnalysisStatusSchema>;
export type AssetComplexityGrade = z.infer<typeof assetComplexityGradeSchema>;
export type AssetSource = z.infer<typeof assetSourceSchema>;
export type AssetDimensions = z.infer<typeof assetDimensionsSchema>;
export type AssetAnalysis = z.infer<typeof assetAnalysisSchema>;
export type Asset = z.infer<typeof assetSchema>;
