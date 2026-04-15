import { z } from "zod";

import {
  isoDateStringSchema,
  nullableIsoDateStringSchema
} from "@course-creator-os/core-types";

export const snapshotSourceSchema = z.enum([
  "autosave",
  "manual",
  "package-candidate",
  "pre-recovery"
]);

export const snapshotPostureSchema = z.enum([
  "stable",
  "watch",
  "superseded"
]);

export const changeImpactSchema = z.enum([
  "low",
  "moderate",
  "high"
]);

export const restorePointStateSchema = z.enum([
  "available",
  "recommended",
  "superseded"
]);

export const restorePointReasonSchema = z.enum([
  "safe-edit-return",
  "package-candidate",
  "publish-candidate",
  "pre-integration"
]);

export const recoveryConfidenceSchema = z.enum([
  "strong",
  "watch",
  "fragile"
]);

export const snapshotSchema = z.object({
  snapshotId: z.string(),
  projectId: z.string().optional(),
  label: z.string(),
  createdAt: isoDateStringSchema,
  source: snapshotSourceSchema,
  posture: snapshotPostureSchema.default("stable"),
  summary: z.string(),
  changeSummary: z.string().optional(),
  changeSummaryRefs: z.array(z.string()).default([]),
  bundleAvailable: z.boolean().default(false)
});

export const snapshotBundleFileSchema = z.object({
  relativePath: z.string(),
  content: z.string()
});

export const snapshotBundleSchema = z.object({
  snapshotId: z.string(),
  projectId: z.string(),
  createdAt: isoDateStringSchema,
  manifestUpdatedAt: isoDateStringSchema,
  spatialFingerprint: z.string(),
  summary: z.string(),
  files: z.array(snapshotBundleFileSchema).min(1)
});

export const changeSummarySchema = z.object({
  changeSummaryId: z.string(),
  title: z.string(),
  summary: z.string(),
  createdAt: isoDateStringSchema,
  impact: changeImpactSchema,
  moduleRefs: z.array(z.string()).default([]),
  relatedSnapshotId: z.string().nullable().default(null),
  note: z.string().default("")
});

export const restorePointSchema = z.object({
  restorePointId: z.string(),
  label: z.string(),
  createdAt: isoDateStringSchema,
  sourceSnapshotId: z.string(),
  state: restorePointStateSchema,
  reason: restorePointReasonSchema,
  summary: z.string(),
  riskNotes: z.array(z.string()).default([]),
  changeSummaryRefs: z.array(z.string()).default([])
});

export const versioningStateSummarySchema = z.object({
  latestSnapshotId: z.string().nullable(),
  latestRestorePointId: z.string().nullable().default(null),
  snapshotCount: z.number().min(0),
  restorePointCount: z.number().min(0).default(0),
  restoreAvailable: z.boolean(),
  autosaveProtected: z.boolean().default(true),
  recoveryConfidence: recoveryConfidenceSchema.default("watch"),
  lastRecoveryCheckAt: nullableIsoDateStringSchema.default(null)
});

export type SnapshotSource = z.infer<typeof snapshotSourceSchema>;
export type SnapshotPosture = z.infer<typeof snapshotPostureSchema>;
export type ChangeImpact = z.infer<typeof changeImpactSchema>;
export type RestorePointState = z.infer<typeof restorePointStateSchema>;
export type RestorePointReason = z.infer<typeof restorePointReasonSchema>;
export type RecoveryConfidence = z.infer<typeof recoveryConfidenceSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export type SnapshotBundleFile = z.infer<typeof snapshotBundleFileSchema>;
export type SnapshotBundle = z.infer<typeof snapshotBundleSchema>;
export type ChangeSummary = z.infer<typeof changeSummarySchema>;
export type RestorePoint = z.infer<typeof restorePointSchema>;
export type VersioningStateSummary = z.infer<typeof versioningStateSummarySchema>;
