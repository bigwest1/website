import { z } from "zod";

export const buildStatusSchema = z.enum(["draft", "candidate", "ready", "failed"]);
export const buildExecutionStateSchema = z.enum(["not-run", "running", "succeeded", "failed"]);
export const buildExecutionModeSchema = z.enum([
  "package-owned",
  "repo-backed",
  "external-tool",
  "mixed",
  "unconfigured"
]);
export const buildExecutionPhaseSchema = z.enum([
  "preflight",
  "bridge-handshake",
  "recipe-preparation",
  "recipe-execution",
  "recipe-validation",
  "artifact-generation",
  "preview-sync",
  "publish-sync",
  "artifact-persist",
  "finalizing"
]);
export const buildExecutionLogLevelSchema = z.enum(["info", "warning", "error"]);
export const buildRuntimeVerificationStateSchema = z.enum([
  "verified",
  "partially-verified",
  "degraded",
  "unavailable",
  "preview-only"
]);
export const buildArtifactTypeSchema = z.enum([
  "course-package",
  "managed-bridge-output",
  "preview-media",
  "minimap-bundle",
  "flyover-bundle",
  "creator-handoff",
  "delivery-report",
  "presentation-share-packet",
  "share-gate-signoff",
  "share-gate-lock",
  "release-notes",
  "manifest",
  "compatibility-report",
  "artifact-manifest",
  "publish-record",
  "credits-report",
  "gspro-recipe",
  "recipe-step-results",
  "runtime-report",
  "export-log"
]);
export const buildArtifactStatusSchema = z.enum(["planned", "generated", "missing", "failed"]);
export const packagingChecklistCategorySchema = z.enum([
  "validation",
  "simulator-logic",
  "preview",
  "dependencies",
  "metadata",
  "compatibility"
]);
export const packagingChecklistStateSchema = z.enum(["complete", "warning", "blocked", "pending"]);
export const packagingReadinessSchema = z.enum(["blocked", "watch", "ready"]);
export const releaseChannelSchema = z.enum(["private", "community", "showcase"]);
export const releaseRecordStatusSchema = z.enum(["draft", "candidate", "published"]);
export const releaseRecipeTypeSchema = z.enum([
  "gspro-brother-mode",
  "gspro-community-safe",
  "gspro-showcase"
]);
export const releaseRecipeStepStatusSchema = z.enum([
  "pending",
  "succeeded",
  "failed",
  "skipped"
]);
export const exportGeometryDiagnosticCategorySchema = z.enum([
  "tee-anchor",
  "pin-anchor",
  "hazard-geometry",
  "ob-boundary",
  "drop-zone",
  "preview-anchor",
  "route-readability"
]);
export const exportGeometryDiagnosticSeveritySchema = z.enum(["warning", "critical"]);

export const buildArtifactSchema = z.object({
  artifactId: z.string(),
  label: z.string(),
  artifactType: buildArtifactTypeSchema,
  relativePath: z.string(),
  status: buildArtifactStatusSchema,
  generatedAt: z.string().nullable().default(null),
  sizeBytes: z.number().min(0).nullable().default(null),
  note: z.string().default("")
});

export const buildExecutionLogSchema = z.object({
  logId: z.string(),
  phase: buildExecutionPhaseSchema,
  level: buildExecutionLogLevelSchema,
  message: z.string(),
  createdAt: z.string()
});

export const packagingChecklistItemSchema = z.object({
  itemId: z.string(),
  label: z.string(),
  category: packagingChecklistCategorySchema,
  state: packagingChecklistStateSchema,
  summary: z.string(),
  actionPath: z.string(),
  ownerModule: z.string()
});

export const packagingResultSchema = z.object({
  readiness: packagingReadinessSchema,
  blockerCount: z.number().min(0),
  warningCount: z.number().min(0),
  completeCount: z.number().min(0),
  pendingCount: z.number().min(0),
  summary: z.string(),
  recommendedAction: z.string()
});

export const exportGeometryDiagnosticSchema = z.object({
  diagnosticId: z.string(),
  category: exportGeometryDiagnosticCategorySchema,
  severity: exportGeometryDiagnosticSeveritySchema,
  holeId: z.string().nullable(),
  title: z.string(),
  summary: z.string(),
  recommendedAction: z.string()
});

export const exportGeometryReportSchema = z.object({
  readiness: packagingReadinessSchema,
  blockerCount: z.number().min(0),
  warningCount: z.number().min(0),
  summary: z.string(),
  recommendedAction: z.string(),
  diagnostics: z.array(exportGeometryDiagnosticSchema)
});

export const releaseRecipeStepSchema = z.object({
  stepId: z.string(),
  label: z.string(),
  phase: buildExecutionPhaseSchema,
  ownerModule: z.string(),
  status: releaseRecipeStepStatusSchema,
  summary: z.string(),
  toolId: z.string().nullable().default(null),
  executedCommand: z.string().nullable().default(null),
  attemptCount: z.number().min(0).default(0),
  outputPaths: z.array(z.string()).default([]),
  diagnostics: z.array(z.string()).default([])
});

export const releaseRecipeSchema = z.object({
  recipeId: z.string(),
  recipeType: releaseRecipeTypeSchema,
  label: z.string(),
  profileId: z.enum(["brother-mode", "community-safe", "showcase"]),
  exportTarget: z.literal("gspro-compatible"),
  outputRoot: z.string(),
  diagnostics: z.array(z.string()).default([]),
  steps: z.array(releaseRecipeStepSchema).default([])
});

export const packageBuildSchema = z.object({
  buildId: z.string(),
  profileId: z.enum(["brother-mode", "community-safe", "showcase"]),
  createdAt: z.string(),
  status: buildStatusSchema,
  executionState: buildExecutionStateSchema.default("not-run"),
  executionMode: buildExecutionModeSchema.default("package-owned"),
  runtimeVerificationState: buildRuntimeVerificationStateSchema.default("preview-only"),
  progressPercent: z.number().min(0).max(100).default(0),
  startedAt: z.string().nullable().default(null),
  completedAt: z.string().nullable().default(null),
  outputDirectory: z.string().nullable().default(null),
  artifactCount: z.number().min(0),
  diagnosticsSummary: z.string(),
  artifactRefs: z.array(buildArtifactSchema).default([]),
  executionLogs: z.array(buildExecutionLogSchema).default([]),
  failureReason: z.string().nullable().default(null),
  retryCount: z.number().min(0).default(0),
  releaseRecordRef: z.string().nullable().default(null),
  bridgeSummary: z.string().default(""),
  bridgeAdapterId: z.string().nullable().default(null),
  runtimeVerificationSummary: z.string().default(""),
  runtimeVerificationEvidence: z.array(z.string()).default([]),
  releaseRecipe: releaseRecipeSchema.nullable().default(null),
  checklist: z.array(packagingChecklistItemSchema).default([]),
  result: packagingResultSchema.nullable().default(null),
  notes: z.string().default("")
});

export const releaseRecordSchema = z.object({
  releaseId: z.string(),
  versionLabel: z.string(),
  createdAt: z.string(),
  channel: releaseChannelSchema,
  status: releaseRecordStatusSchema.default("draft"),
  packageBuildRef: z.string().nullable().default(null),
  releaseRecipeRef: z.string().nullable().default(null),
  artifactManifestRef: z.string().nullable().default(null),
  previewReady: z.boolean().default(false),
  creditsComplete: z.boolean().default(false),
  sourceAuditComplete: z.boolean().default(false),
  publishedAt: z.string().nullable().default(null),
  publicSafe: z.boolean(),
  notes: z.string(),
  courseDescription: z.string().default(""),
  creditsSummary: z.string().default(""),
  mediaChecklist: z.array(z.string()).default([]),
  releaseNotes: z.array(z.string()).default([])
});

export type BuildStatus = z.infer<typeof buildStatusSchema>;
export type BuildExecutionState = z.infer<typeof buildExecutionStateSchema>;
export type BuildExecutionMode = z.infer<typeof buildExecutionModeSchema>;
export type BuildExecutionPhase = z.infer<typeof buildExecutionPhaseSchema>;
export type BuildExecutionLogLevel = z.infer<typeof buildExecutionLogLevelSchema>;
export type BuildRuntimeVerificationState = z.infer<typeof buildRuntimeVerificationStateSchema>;
export type BuildArtifactType = z.infer<typeof buildArtifactTypeSchema>;
export type BuildArtifactStatus = z.infer<typeof buildArtifactStatusSchema>;
export type PackagingChecklistCategory = z.infer<typeof packagingChecklistCategorySchema>;
export type PackagingChecklistState = z.infer<typeof packagingChecklistStateSchema>;
export type PackagingReadiness = z.infer<typeof packagingReadinessSchema>;
export type ReleaseChannel = z.infer<typeof releaseChannelSchema>;
export type ReleaseRecordStatus = z.infer<typeof releaseRecordStatusSchema>;
export type ReleaseRecipeType = z.infer<typeof releaseRecipeTypeSchema>;
export type ReleaseRecipeStepStatus = z.infer<typeof releaseRecipeStepStatusSchema>;
export type ExportGeometryDiagnosticCategory = z.infer<typeof exportGeometryDiagnosticCategorySchema>;
export type ExportGeometryDiagnosticSeverity = z.infer<typeof exportGeometryDiagnosticSeveritySchema>;
export type BuildArtifact = z.infer<typeof buildArtifactSchema>;
export type BuildExecutionLog = z.infer<typeof buildExecutionLogSchema>;
export type PackagingChecklist = z.infer<typeof packagingChecklistItemSchema>;
export type PackagingResult = z.infer<typeof packagingResultSchema>;
export type ExportGeometryDiagnostic = z.infer<typeof exportGeometryDiagnosticSchema>;
export type ExportGeometryReport = z.infer<typeof exportGeometryReportSchema>;
export type ReleaseRecipeStep = z.infer<typeof releaseRecipeStepSchema>;
export type ReleaseRecipe = z.infer<typeof releaseRecipeSchema>;
export type PackageBuild = z.infer<typeof packageBuildSchema>;
export type ReleaseRecord = z.infer<typeof releaseRecordSchema>;
