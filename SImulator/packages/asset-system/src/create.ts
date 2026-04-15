import { z } from "zod";

import {
  approvalStatusSchema,
  normalizationStateSchema
} from "@course-creator-os/core-types";

import {
  assetAnalysisStatusSchema,
  assetCategorySchema,
  assetComplexityGradeSchema,
  assetFileTypeSchema,
  assetSchema,
  assetSourceSchema,
  importQueueStateSchema,
  orientationStatusSchema,
  scaleStatusSchema,
  type Asset,
  type AssetAnalysis
} from "./models";

function slugifyAssetName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export const createAssetRecordInputSchema = z.object({
  assetId: z.string().optional(),
  displayName: z.string().trim().min(1),
  source: assetSourceSchema.optional(),
  importPath: z.string().optional(),
  normalizedPath: z.string().optional(),
  fileType: assetFileTypeSchema.optional(),
  category: assetCategorySchema.optional(),
  styleTags: z.array(z.string()).optional(),
  queueState: importQueueStateSchema.optional(),
  normalizationState: normalizationStateSchema.optional(),
  scaleStatus: scaleStatusSchema.optional(),
  orientationStatus: orientationStatusSchema.optional(),
  analysis: z
    .object({
      analysisStatus: assetAnalysisStatusSchema.optional(),
      polyEstimate: z.number().min(0).nullable().optional(),
      materialCount: z.number().min(0).nullable().optional(),
      textureCount: z.number().min(0).nullable().optional(),
      textureMemoryEstimateMb: z.number().min(0).nullable().optional(),
      animationClipCount: z.number().min(0).nullable().optional(),
      complexityGrade: assetComplexityGradeSchema.nullable().optional(),
      note: z.string().optional()
    })
    .optional(),
  approvalStatus: approvalStatusSchema.optional(),
  dimensions: z
    .object({
      widthMeters: z.number().positive(),
      depthMeters: z.number().positive(),
      heightMeters: z.number().positive()
    })
    .optional(),
  notes: z.string().optional()
});

export type CreateAssetRecordInput = z.infer<typeof createAssetRecordInputSchema>;

function createDefaultAnalysis(partial?: CreateAssetRecordInput["analysis"]): AssetAnalysis {
  return {
    analysisStatus: partial?.analysisStatus ?? "not-started",
    polyEstimate: partial?.polyEstimate ?? null,
    materialCount: partial?.materialCount ?? null,
    textureCount: partial?.textureCount ?? null,
    textureMemoryEstimateMb: partial?.textureMemoryEstimateMb ?? null,
    animationClipCount: partial?.animationClipCount ?? null,
    complexityGrade: partial?.complexityGrade ?? null,
    note: partial?.note
  };
}

export function createAssetRecord(input: CreateAssetRecordInput): Asset {
  const parsed = createAssetRecordInputSchema.parse(input);
  const assetSlug = slugifyAssetName(parsed.displayName) || "asset";
  const assetId = parsed.assetId ?? `asset-${assetSlug}`;
  const fileType = parsed.fileType ?? "fbx";
  const queueState =
    parsed.queueState ??
    (parsed.approvalStatus === "approved" && parsed.normalizationState === "normalized"
      ? "cataloged"
      : "queued");

  return assetSchema.parse({
    assetId,
    displayName: parsed.displayName,
    source: parsed.source ?? { sourceType: "scratch" },
    importPath: parsed.importPath ?? `/intake/${assetSlug}.${fileType}`,
    normalizedPath:
      parsed.normalizedPath ??
      (parsed.normalizationState === "normalized" ? `/normalized/${assetSlug}.glb` : undefined),
    fileType,
    category: parsed.category ?? "props",
    styleTags: parsed.styleTags ?? [],
    queueState,
    dimensions: parsed.dimensions,
    normalizationState: parsed.normalizationState ?? "imported",
    scaleStatus: parsed.scaleStatus ?? "needs-review",
    orientationStatus: parsed.orientationStatus ?? "needs-review",
    analysis: createDefaultAnalysis(parsed.analysis),
    approvalStatus: parsed.approvalStatus ?? "pending",
    notes: parsed.notes
  });
}
