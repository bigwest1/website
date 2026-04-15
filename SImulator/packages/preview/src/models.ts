import { z } from "zod";

export const previewTypeSchema = z.enum([
  "flyover",
  "minimap",
  "screenshot-sequence",
  "showcase"
]);
export const previewReadinessStateSchema = z.enum(["missing", "draft", "ready", "approved"]);
export const screenshotStatusSchema = z.enum(["planned", "captured", "approved"]);
export const showcaseChannelSchema = z.enum(["private", "community", "showcase"]);
export const previewOverallReadinessSchema = z.enum(["blocked", "watch", "ready"]);
export const previewOutputStatusSchema = z.enum(["not-run", "generated", "missing", "failed"]);
export const shotVariantRoleSchema = z.enum(["primary", "alternate"]);
export const shotVariantShippingStateSchema = z.enum(["candidate", "selected", "hold"]);

const shotVariantFields = {
  shotVariantSetId: z.string().nullable().optional(),
  shotVariantLabel: z.string().nullable().optional(),
  shotVariantRole: shotVariantRoleSchema.optional(),
  shotVariantShippingState: shotVariantShippingStateSchema.optional()
};

export const previewPathSchema = z.object({
  previewPathId: z.string(),
  name: z.string(),
  previewType: previewTypeSchema,
  holeRefs: z.array(z.string()),
  readinessState: previewReadinessStateSchema,
  outputStatus: previewOutputStatusSchema.default("not-run"),
  lastBuildRef: z.string().nullable().default(null),
  note: z.string(),
  ...shotVariantFields
});

export const flyoverPlanSchema = z.object({
  flyoverPlanId: z.string(),
  holeRef: z.string(),
  previewPathRef: z.string().nullable(),
  cameraIntent: z.string(),
  introBeat: z.string(),
  outroBeat: z.string(),
  durationSeconds: z.number().positive(),
  readinessState: previewReadinessStateSchema,
  outputStatus: previewOutputStatusSchema.default("not-run"),
  lastBuildRef: z.string().nullable().default(null),
  note: z.string(),
  ...shotVariantFields
});

export const screenshotPlanSchema = z.object({
  screenshotId: z.string(),
  label: z.string(),
  holeRef: z.string().nullable(),
  previewPathRef: z.string().nullable().default(null),
  framingNote: z.string(),
  status: screenshotStatusSchema,
  outputStatus: previewOutputStatusSchema.default("not-run"),
  capturedAt: z.string().nullable().default(null),
  lastBuildRef: z.string().nullable().default(null),
  ...shotVariantFields
});

export const showcaseSequenceSchema = z.object({
  showcaseSequenceId: z.string(),
  title: z.string(),
  targetChannel: showcaseChannelSchema,
  shotRefs: z.array(z.string()),
  narrativeGoal: z.string(),
  readinessState: previewReadinessStateSchema,
  outputStatus: previewOutputStatusSchema.default("not-run"),
  lastBuildRef: z.string().nullable().default(null),
  note: z.string(),
  ...shotVariantFields
});

export const previewReadinessSummarySchema = z.object({
  flyoverCoverage: z.number().min(0).max(1),
  minimapCoverage: z.number().min(0).max(1),
  flyoverReadyCount: z.number().min(0),
  minimapReadyCount: z.number().min(0),
  screenshotApprovedCount: z.number().min(0),
  totalScreenshotCount: z.number().min(0),
  showcaseReadyCount: z.number().min(0),
  totalShowcaseCount: z.number().min(0),
  overallReadiness: previewOverallReadinessSchema
});

export type PreviewType = z.infer<typeof previewTypeSchema>;
export type PreviewReadinessState = z.infer<typeof previewReadinessStateSchema>;
export type ScreenshotStatus = z.infer<typeof screenshotStatusSchema>;
export type ShowcaseChannel = z.infer<typeof showcaseChannelSchema>;
export type PreviewOverallReadiness = z.infer<typeof previewOverallReadinessSchema>;
export type PreviewOutputStatus = z.infer<typeof previewOutputStatusSchema>;
export type ShotVariantRole = z.infer<typeof shotVariantRoleSchema>;
export type ShotVariantShippingState = z.infer<typeof shotVariantShippingStateSchema>;
export type PreviewPath = z.infer<typeof previewPathSchema>;
export type FlyoverPlan = z.infer<typeof flyoverPlanSchema>;
export type ScreenshotPlan = z.infer<typeof screenshotPlanSchema>;
export type ShowcaseSequence = z.infer<typeof showcaseSequenceSchema>;
export type PreviewReadinessSummary = z.infer<typeof previewReadinessSummarySchema>;
