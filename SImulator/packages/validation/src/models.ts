import { z } from "zod";

import {
  healthStateSchema,
  issueSeveritySchema,
  issueStatusSchema,
  type HealthState,
  type IssueSeverity,
  type IssueStatus
} from "@course-creator-os/core-types";
import { MODULE_KEYS, type CourseProject, type ModuleKey } from "@course-creator-os/project-model";

export const validationCategorySchema = z.enum([
  "Project Integrity",
  "Course Bible Completeness",
  "Hole Metadata Completeness",
  "Simulator Logic Correctness",
  "Asset Health",
  "Style Consistency",
  "Playability",
  "Performance Risk",
  "Preview Readiness",
  "Packaging Readiness",
  "Publish-Safe Readiness"
]);

export const validationSeveritySchema = issueSeveritySchema;
export const validationStatusSchema = issueStatusSchema;
export const validationReadinessSchema = z.enum(["blocked", "watch", "ready"]);
export const validationHealthStateSchema = healthStateSchema;

export const validationIssueCountsSchema = z.object({
  info: z.number().min(0),
  warning: z.number().min(0),
  high: z.number().min(0),
  critical: z.number().min(0)
});

export const validationIssueSchema = z.object({
  issueId: z.string(),
  validatorId: z.string(),
  category: validationCategorySchema,
  module: z.enum(MODULE_KEYS),
  severity: validationSeveritySchema,
  status: validationStatusSchema,
  title: z.string(),
  description: z.string(),
  recommendedFix: z.string(),
  relatedEntityId: z.string().nullable(),
  whyItMatters: z.string(),
  ownerModule: z.enum(MODULE_KEYS),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const validationResultSchema = z.object({
  validatorId: z.string(),
  label: z.string(),
  category: validationCategorySchema,
  readiness: validationReadinessSchema,
  issueCounts: validationIssueCountsSchema,
  issues: z.array(validationIssueSchema),
  summary: z.string()
});

export const nextActionSchema = z.object({
  moduleKey: z.enum(MODULE_KEYS),
  title: z.string(),
  reason: z.string()
});

export const validationReportSchema = z.object({
  healthState: validationHealthStateSchema,
  readiness: validationReadinessSchema,
  issueCounts: validationIssueCountsSchema,
  issues: z.array(validationIssueSchema),
  results: z.array(validationResultSchema),
  nextActions: z.array(nextActionSchema),
  completion: z.number().min(0).max(1)
});

export type ValidationIssue = z.infer<typeof validationIssueSchema>;
export type ValidationSeverity = IssueSeverity;
export type ValidationCategory = z.infer<typeof validationCategorySchema>;
export type ValidationStatus = IssueStatus;
export type ValidationReadiness = z.infer<typeof validationReadinessSchema>;
export type ValidationHealthState = HealthState;
export type ValidationIssueCounts = z.infer<typeof validationIssueCountsSchema>;
export type ValidationResult = z.infer<typeof validationResultSchema>;
export type ValidationReport = z.infer<typeof validationReportSchema>;
export type NextAction = {
  moduleKey: ModuleKey;
  title: string;
  reason: string;
};

export type ValidationValidator = {
  validatorId: string;
  label: string;
  category: ValidationCategory;
  validate: (project: CourseProject) => ValidationResult;
};
