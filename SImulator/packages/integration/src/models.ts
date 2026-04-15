import { z } from "zod";

import { isoDateStringSchema } from "@course-creator-os/core-types";

export const integrationStatusSchema = z.enum([
  "connected",
  "needs-config",
  "disabled",
  "degraded",
  "error"
]);

export const toolRuntimeSchema = z.enum([
  "local-cli",
  "managed-bridge",
  "native-shell"
]);

export const packagingExecutionModeSchema = z.enum([
  "package-owned",
  "repo-backed",
  "external-tool",
  "mixed",
  "unconfigured"
]);

export const integrationCapabilitySchema = z.enum([
  "tool-path-resolution",
  "asset-import",
  "command-execution",
  "package-build",
  "health-check"
]);

export const integrationConfigurationStateSchema = z.enum([
  "unconfigured",
  "partial",
  "configured",
  "disabled"
]);

export const toolPathDefinitionSchema = z.object({
  toolId: z.string(),
  label: z.string(),
  description: z.string(),
  executableName: z.string(),
  versionArgs: z.array(z.string()).default(["--version"]),
  executablePath: z.string().nullable(),
  suggestedExecutablePath: z.string().nullable().default(null),
  required: z.boolean(),
  runtime: toolRuntimeSchema,
  managedBy: z.string(),
  status: integrationStatusSchema,
  lastCheckedAt: isoDateStringSchema.nullable(),
  note: z.string().default("")
});

export const integrationDefinitionSchema = z.object({
  integrationId: z.string(),
  name: z.string(),
  description: z.string(),
  adapterInterface: z.string(),
  runtime: toolRuntimeSchema,
  capabilities: z.array(integrationCapabilitySchema),
  requiredToolIds: z.array(z.string()),
  settingsRouteHint: z.string(),
  ownerAgent: z.string()
});

export const integrationHealthSchema = z.object({
  integrationId: z.string(),
  name: z.string(),
  capabilities: z.array(integrationCapabilitySchema),
  status: integrationStatusSchema,
  configurationState: integrationConfigurationStateSchema,
  lastCheckedAt: isoDateStringSchema.nullable(),
  issueSummary: z.string(),
  relatedToolIds: z.array(z.string()),
  settingsRouteHint: z.string()
});

export const integrationHealthSummarySchema = z.object({
  overallStatus: integrationStatusSchema,
  connectedCount: z.number().min(0),
  needsConfigCount: z.number().min(0),
  disabledCount: z.number().min(0),
  degradedCount: z.number().min(0),
  errorCount: z.number().min(0),
  nextAction: z.string()
});

export const toolHealthCheckSchema = z.object({
  toolId: z.string(),
  status: integrationStatusSchema,
  checkedAt: isoDateStringSchema,
  summary: z.string(),
  resolvedPath: z.string().nullable().default(null),
  versionText: z.string().nullable().default(null)
});

export const assetImportRequestSchema = z.object({
  assetPath: z.string(),
  destinationRoot: z.string(),
  categoryHint: z.string().nullable().default(null)
});

export const assetImportResultSchema = z.object({
  normalizedPath: z.string(),
  importedAssetId: z.string().nullable().default(null),
  summary: z.string()
});

export const executionRequestSchema = z.object({
  commandId: z.string(),
  commandPath: z.string().nullable().default(null),
  args: z.array(z.string()),
  workingDirectory: z.string().nullable().default(null)
});

export const executionResultSchema = z.object({
  success: z.boolean(),
  exitCode: z.number().nullable().default(null),
  summary: z.string(),
  commandLine: z.string().nullable().default(null),
  stdout: z.string().default(""),
  stderr: z.string().default("")
});

export const packagingBridgeStepResultSchema = z.object({
  stepId: z.string(),
  label: z.string(),
  phase: z.string(),
  status: z.enum(["pending", "succeeded", "failed", "skipped"]),
  summary: z.string(),
  toolId: z.string().nullable().default(null),
  executedCommand: z.string().nullable().default(null),
  outputPaths: z.array(z.string()).default([]),
  diagnostics: z.array(z.string()).default([])
});

export const packagingRequestSchema = z.object({
  projectRoot: z.string(),
  outputProfile: z.string(),
  manifestPath: z.string().nullable().default(null),
  buildId: z.string().nullable().default(null),
  recipeHint: z.string().nullable().default(null),
  releaseOutputRoot: z.string().nullable().default(null)
});

export const packagingBridgeResultSchema = z.object({
  success: z.boolean(),
  adapterId: z.string().nullable().default(null),
  executionMode: packagingExecutionModeSchema.default("unconfigured"),
  summary: z.string(),
  executedCommand: z.string().nullable().default(null),
  managedOutputRoot: z.string().nullable().default(null),
  artifactPaths: z.array(z.string()).default([]),
  diagnostics: z.array(z.string()).default([]),
  stepResults: z.array(packagingBridgeStepResultSchema).default([]),
  hostVerificationNotes: z.array(z.string()).default([]),
  remediationHints: z.array(z.string()).default([]),
  retrySuggested: z.boolean().default(false)
});

export type IntegrationStatus = z.infer<typeof integrationStatusSchema>;
export type ToolRuntime = z.infer<typeof toolRuntimeSchema>;
export type PackagingExecutionMode = z.infer<typeof packagingExecutionModeSchema>;
export type IntegrationCapability = z.infer<typeof integrationCapabilitySchema>;
export type IntegrationConfigurationState = z.infer<typeof integrationConfigurationStateSchema>;
export type ToolPathDefinition = z.infer<typeof toolPathDefinitionSchema>;
export type IntegrationDefinition = z.infer<typeof integrationDefinitionSchema>;
export type IntegrationHealth = z.infer<typeof integrationHealthSchema>;
export type IntegrationHealthSummary = z.infer<typeof integrationHealthSummarySchema>;
export type ToolHealthCheck = z.infer<typeof toolHealthCheckSchema>;
export type AssetImportRequest = z.infer<typeof assetImportRequestSchema>;
export type AssetImportResult = z.infer<typeof assetImportResultSchema>;
export type ExecutionRequest = z.infer<typeof executionRequestSchema>;
export type ExecutionResult = z.infer<typeof executionResultSchema>;
export type PackagingBridgeStepResult = z.infer<typeof packagingBridgeStepResultSchema>;
export type PackagingRequest = z.infer<typeof packagingRequestSchema>;
export type PackagingBridgeResult = z.infer<typeof packagingBridgeResultSchema>;
