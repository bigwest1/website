import { z } from "zod";

import {
  backgroundJobStatusSchema,
  issueSeveritySchema,
  isoDateStringSchema,
  nullableIsoDateStringSchema
} from "@course-creator-os/core-types";

export const logCategorySchema = z.enum([
  "application",
  "background-job",
  "import",
  "packaging",
  "validation",
  "recovery",
  "integration-health",
  "spatial-index"
]);

export const recoveryExpectationStatusSchema = z.enum([
  "healthy",
  "attention",
  "critical"
]);

export const diagnosticLogSchema = z.object({
  logId: z.string(),
  category: logCategorySchema,
  severity: issueSeveritySchema,
  source: z.string(),
  message: z.string(),
  createdAt: isoDateStringSchema
});

export const taskLogSchema = z.object({
  taskLogId: z.string(),
  label: z.string(),
  moduleKey: z.string(),
  status: backgroundJobStatusSchema,
  detail: z.string(),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema
});

export const recoveryExpectationSchema = z.object({
  expectationId: z.string(),
  title: z.string(),
  status: recoveryExpectationStatusSchema,
  summary: z.string(),
  recommendedAction: z.string()
});

export const recoveryDiagnosticSummarySchema = z.object({
  health: recoveryExpectationStatusSchema,
  healthyCount: z.number().min(0),
  attentionCount: z.number().min(0),
  criticalCount: z.number().min(0),
  latestRecoveryEventAt: nullableIsoDateStringSchema
});

export type LogCategory = z.infer<typeof logCategorySchema>;
export type DiagnosticLog = z.infer<typeof diagnosticLogSchema>;
export type TaskLog = z.infer<typeof taskLogSchema>;
export type RecoveryExpectationStatus = z.infer<typeof recoveryExpectationStatusSchema>;
export type RecoveryExpectation = z.infer<typeof recoveryExpectationSchema>;
export type RecoveryDiagnosticSummary = z.infer<typeof recoveryDiagnosticSummarySchema>;

export interface Logger {
  info(category: LogCategory, message: string, source?: string): void;
  warn(category: LogCategory, message: string, source?: string): void;
  error(category: LogCategory, message: string, source?: string): void;
}
