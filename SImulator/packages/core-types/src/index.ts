import { z } from "zod";

export const isoDateStringSchema = z.string();
export const nullableIsoDateStringSchema = isoDateStringSchema.nullable();
export const identifierSchema = z.string().min(1);
export const displayNameSchema = z.string().trim().min(1);
export const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const versionStringSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/);

export const projectModeSchema = z.enum(["experimental-private", "public-safe"]);
export const validationProfileSchema = z.enum(["balanced", "strict", "showcase-review"]);
export const readinessStateSchema = z.enum([
  "not-started",
  "in-progress",
  "needs-review",
  "ready",
  "blocked"
]);
export const issueSeveritySchema = z.enum(["info", "warning", "high", "critical"]);
export const issueStatusSchema = z.enum(["open", "in-progress", "resolved", "waived"]);
export const approvalStatusSchema = z.enum(["approved", "pending", "rejected"]);
export const normalizationStateSchema = z.enum([
  "imported",
  "normalized",
  "needs-review",
  "rejected"
]);
export const playabilityStatusSchema = z.enum(["ready", "needs-review", "blocked"]);
export const backgroundJobStatusSchema = z.enum([
  "queued",
  "running",
  "blocked",
  "completed",
  "failed"
]);
export const healthStateSchema = z.enum([
  "Healthy",
  "Needs Attention",
  "Blocked",
  "Release Candidate Ready"
]);

export const entityRefSchema = z.object({
  entityType: z.string(),
  entityId: z.string()
});

export const entityIdentitySchema = z.object({
  id: identifierSchema,
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema
});

export const backgroundJobSchema = z.object({
  jobId: z.string(),
  label: z.string(),
  area: z.string(),
  status: backgroundJobStatusSchema,
  progress: z.number().min(0).max(1),
  startedAt: nullableIsoDateStringSchema,
  updatedAt: isoDateStringSchema,
  detail: z.string()
});

export type IsoDateString = z.infer<typeof isoDateStringSchema>;
export type Identifier = z.infer<typeof identifierSchema>;
export type DisplayName = z.infer<typeof displayNameSchema>;
export type Slug = z.infer<typeof slugSchema>;
export type VersionString = z.infer<typeof versionStringSchema>;
export type ProjectMode = z.infer<typeof projectModeSchema>;
export type ValidationProfile = z.infer<typeof validationProfileSchema>;
export type ReadinessState = z.infer<typeof readinessStateSchema>;
export type IssueSeverity = z.infer<typeof issueSeveritySchema>;
export type IssueStatus = z.infer<typeof issueStatusSchema>;
export type ApprovalStatus = z.infer<typeof approvalStatusSchema>;
export type NormalizationState = z.infer<typeof normalizationStateSchema>;
export type PlayabilityStatus = z.infer<typeof playabilityStatusSchema>;
export type BackgroundJobStatus = z.infer<typeof backgroundJobStatusSchema>;
export type HealthState = z.infer<typeof healthStateSchema>;
export type EntityRef = z.infer<typeof entityRefSchema>;
export type EntityIdentity = z.infer<typeof entityIdentitySchema>;
export type BackgroundJob = z.infer<typeof backgroundJobSchema>;
