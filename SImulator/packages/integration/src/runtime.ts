import type {
  AssetImportBridge,
  ExecutionBridge,
  PackagingBridge,
  ToolHealthChecker,
  ToolPathProvider
} from "./adapters";
import type {
  AssetImportRequest,
  AssetImportResult,
  ExecutionRequest,
  ExecutionResult,
  IntegrationDefinition,
  IntegrationHealth,
  PackagingExecutionMode,
  PackagingBridgeStepResult,
  PackagingBridgeResult,
  PackagingRequest,
  ToolHealthCheck,
  ToolPathDefinition
} from "./models";
import {
  packagingBridgeStepResultSchema,
  toolHealthCheckSchema
} from "./models";

export class InMemoryToolPathProvider implements ToolPathProvider {
  constructor(private toolPaths: ToolPathDefinition[]) {}

  async listToolPaths() {
    return [...this.toolPaths];
  }

  async getToolPath(toolId: string) {
    return this.toolPaths.find((tool) => tool.toolId === toolId) ?? null;
  }

  async setToolPath(toolId: string, executablePath: string | null) {
    const existing = this.toolPaths.find((tool) => tool.toolId === toolId);
    if (!existing) {
      throw new Error(`Unknown tool path ${toolId}.`);
    }

    const next = {
      ...existing,
      executablePath
    };

    this.toolPaths = this.toolPaths.map((tool) => (tool.toolId === toolId ? next : tool));
    return next;
  }
}

export class ProbeDrivenToolHealthChecker implements ToolHealthChecker {
  constructor(
    private readonly probePath: (
      executablePath: string | null,
      tool: ToolPathDefinition,
    ) => Promise<{
      exists: boolean;
      executable: boolean;
      summary: string;
      resolvedPath?: string | null;
      versionText?: string | null;
    }>,
  ) {}

  async checkTool(tool: ToolPathDefinition): Promise<ToolHealthCheck> {
    if (!tool.executablePath) {
      return toolHealthCheckSchema.parse({
        toolId: tool.toolId,
        status: tool.required ? "needs-config" : "disabled",
        checkedAt: new Date().toISOString(),
      summary: tool.required
          ? "Executable path is not configured yet."
          : "Optional tool is not configured.",
        resolvedPath: null,
        versionText: null
      });
    }

    const result = await this.probePath(tool.executablePath, tool);
    return toolHealthCheckSchema.parse({
      toolId: tool.toolId,
      status: result.exists && result.executable ? "connected" : "error",
      checkedAt: new Date().toISOString(),
      summary: result.summary,
      resolvedPath: result.resolvedPath ?? tool.executablePath,
      versionText: result.versionText ?? null
    });
  }

  async checkIntegration(
    integration: IntegrationDefinition,
    tools: ToolPathDefinition[],
  ): Promise<IntegrationHealth> {
    const relatedTools = tools.filter((tool) => integration.requiredToolIds.includes(tool.toolId));
    const checks = await Promise.all(relatedTools.map((tool) => this.checkTool(tool)));
    const connectedCount = checks.filter((check) => check.status === "connected").length;
    const errorCheck = checks.find((check) => check.status === "error");
    const latestCheck = [...checks]
      .sort((left, right) => right.checkedAt.localeCompare(left.checkedAt))[0]
      ?.checkedAt ?? null;

    if (errorCheck) {
      return {
        integrationId: integration.integrationId,
        name: integration.name,
        capabilities: integration.capabilities,
        status: "error",
        configurationState: "partial",
        lastCheckedAt: latestCheck,
        issueSummary: errorCheck.summary,
        relatedToolIds: integration.requiredToolIds,
        settingsRouteHint: integration.settingsRouteHint
      };
    }

    if (connectedCount === 0) {
      return {
        integrationId: integration.integrationId,
        name: integration.name,
        capabilities: integration.capabilities,
        status: "needs-config",
        configurationState: "unconfigured",
        lastCheckedAt: latestCheck,
        issueSummary: "Required tool paths are not configured or verified yet.",
        relatedToolIds: integration.requiredToolIds,
        settingsRouteHint: integration.settingsRouteHint
      };
    }

    if (connectedCount < relatedTools.length) {
      return {
        integrationId: integration.integrationId,
        name: integration.name,
        capabilities: integration.capabilities,
        status: "degraded",
        configurationState: "partial",
        lastCheckedAt: latestCheck,
        issueSummary: "Some bridge inputs are verified, but the integration is not fully healthy yet.",
        relatedToolIds: integration.requiredToolIds,
        settingsRouteHint: integration.settingsRouteHint
      };
    }

    return {
      integrationId: integration.integrationId,
      name: integration.name,
      capabilities: integration.capabilities,
      status: "connected",
      configurationState: "configured",
      lastCheckedAt: latestCheck,
      issueSummary: "Bridge inputs are verified and ready for managed execution.",
      relatedToolIds: integration.requiredToolIds,
      settingsRouteHint: integration.settingsRouteHint
    };
  }
}

export class LocalCliExecutionBridge implements ExecutionBridge {
  constructor(
    private readonly runCommand: (
      request: ExecutionRequest,
    ) => Promise<ExecutionResult>,
  ) {}

  execute(request: ExecutionRequest) {
    return this.runCommand(request);
  }
}

async function resolveRequiredTool(
  toolPathProvider: ToolPathProvider,
  toolId: string,
) {
  const tool = await toolPathProvider.getToolPath(toolId);
  if (!tool || !tool.executablePath) {
    return null;
  }

  return tool;
}

function parseManagedJsonOutput(stdout: string) {
  const trimmed = stdout.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readOptionalBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function readExecutionMode(value: unknown): PackagingExecutionMode | null {
  switch (value) {
    case "package-owned":
    case "repo-backed":
    case "external-tool":
    case "mixed":
    case "unconfigured":
      return value;
    default:
      return null;
  }
}

function readOptionalObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readPackagingBridgeStepResults(value: unknown): PackagingBridgeStepResult[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry, index) => {
    const record = readOptionalObject(entry);
    if (!record) {
      return [];
    }

    const parsed = packagingBridgeStepResultSchema.safeParse({
      stepId:
        readOptionalString(record.stepId) ??
        readOptionalString(record.id) ??
        `managed-step-${index + 1}`,
      label:
        readOptionalString(record.label) ??
        readOptionalString(record.title) ??
        `Managed Step ${index + 1}`,
      phase: readOptionalString(record.phase) ?? "recipe-execution",
      status: readOptionalString(record.status) ?? "pending",
      summary:
        readOptionalString(record.summary) ??
        readOptionalString(record.message) ??
        "Managed bridge step completed without a detailed summary.",
      toolId: readOptionalString(record.toolId),
      executedCommand:
        readOptionalString(record.executedCommand) ??
        readOptionalString(record.commandLine),
      outputPaths:
        readStringArray(record.outputPaths).length > 0
          ? readStringArray(record.outputPaths)
          : readStringArray(record.artifactPaths),
      diagnostics: readStringArray(record.diagnostics)
    });

    return parsed.success ? [parsed.data] : [];
  });
}

export class ManagedPackagingBridge implements PackagingBridge {
  constructor(
    private readonly buildHandler: (
      request: PackagingRequest,
    ) => Promise<PackagingBridgeResult>,
  ) {}

  buildReleaseCandidate(request: PackagingRequest) {
    return this.buildHandler(request);
  }
}

export class GsproCompatibilityExecutionBridge implements ExecutionBridge {
  constructor(
    private readonly toolPathProvider: ToolPathProvider,
    private readonly executionBridge: ExecutionBridge,
    private readonly toolId = "gspro-compatibility-bridge",
  ) {}

  async execute(request: ExecutionRequest) {
    const tool = await resolveRequiredTool(this.toolPathProvider, this.toolId);
    if (!tool) {
      return {
        success: false,
        exitCode: null,
        summary: "GSPro compatibility bridge is not configured yet.",
        commandLine: null,
        stdout: "",
        stderr: "Configure the GSPro Compatibility Bridge executable path in Settings first."
      };
    }

    return this.executionBridge.execute({
      ...request,
      commandId: this.toolId,
      commandPath: tool.executablePath
    });
  }
}

export class PackageBuildRunnerBridge implements PackagingBridge {
  constructor(
    private readonly toolPathProvider: ToolPathProvider,
    private readonly executionBridge: ExecutionBridge,
    private readonly packageToolId = "package-build-runner",
    private readonly compatibilityToolId = "gspro-compatibility-bridge",
    private readonly exportToolId = "gspro-export-tool",
  ) {}

  async buildReleaseCandidate(request: PackagingRequest): Promise<PackagingBridgeResult> {
    const packageTool = await resolveRequiredTool(this.toolPathProvider, this.packageToolId);
    if (!packageTool) {
      return {
        success: false,
        adapterId: this.packageToolId,
        executionMode: "unconfigured",
        summary: "Package build runner is not configured yet.",
        executedCommand: null,
        managedOutputRoot: null,
        artifactPaths: [],
        diagnostics: ["Configure the Package Build Runner executable path in Settings."],
        stepResults: [
          {
            stepId: "managed-package-runner-missing",
            label: "Package Build Runner",
            phase: "bridge-handshake",
            status: "failed",
            summary: "Package build runner is not configured yet.",
            toolId: this.packageToolId,
            executedCommand: null,
            outputPaths: [],
            diagnostics: ["Configure the Package Build Runner executable path in Settings."]
          }
        ],
        hostVerificationNotes: [],
        remediationHints: ["Configure the Package Build Runner executable path in Settings."],
        retrySuggested: false
      };
    }

    const compatibilityTool = await resolveRequiredTool(this.toolPathProvider, this.compatibilityToolId);
    const exportTool = await resolveRequiredTool(this.toolPathProvider, this.exportToolId);
    const args = [
      "build-release-candidate",
      "--json",
      "--project-root",
      request.projectRoot,
      "--output-profile",
      request.outputProfile
    ];

    if (request.manifestPath) {
      args.push("--manifest-path", request.manifestPath);
    }

    if (request.buildId) {
      args.push("--build-id", request.buildId);
    }

    if (request.recipeHint) {
      args.push("--recipe-hint", request.recipeHint);
    }

    if (request.releaseOutputRoot) {
      args.push("--release-output-root", request.releaseOutputRoot);
    }

    if (compatibilityTool?.executablePath) {
      args.push("--compatibility-bridge", compatibilityTool.executablePath);
    }

    if (exportTool?.executablePath) {
      args.push("--external-export-tool", exportTool.executablePath);
    }

    const result = await this.executionBridge.execute({
      commandId: this.packageToolId,
      commandPath: packageTool.executablePath,
      args,
      workingDirectory: request.projectRoot
    });
    const parsedOutput = parseManagedJsonOutput(result.stdout);
    const parsedArtifactPaths = readStringArray(parsedOutput?.artifactPaths);
    const parsedDiagnostics = readStringArray(parsedOutput?.diagnostics);
    const parsedSummary = readOptionalString(parsedOutput?.summary);
    const parsedManagedOutputRoot = readOptionalString(parsedOutput?.managedOutputRoot);
    const parsedRetrySuggested = readOptionalBoolean(parsedOutput?.retrySuggested);
    const parsedStepResults = readPackagingBridgeStepResults(parsedOutput?.stepResults);
    const parsedRemediationHints = readStringArray(parsedOutput?.remediationHints);
    const parsedExecutionMode = readExecutionMode(parsedOutput?.executionMode);
    const hostVerificationNotes = readStringArray(parsedOutput?.hostVerificationNotes).length > 0
      ? readStringArray(parsedOutput?.hostVerificationNotes)
      : [
          `Package build runner resolved at ${packageTool.executablePath}.`,
          compatibilityTool?.executablePath
            ? `GSPro compatibility bridge linked from ${compatibilityTool.executablePath}.`
            : "GSPro compatibility bridge is not linked into this managed package run.",
          exportTool?.executablePath
            ? `External GSPro export tool linked from ${exportTool.executablePath}.`
            : "External GSPro export tool is not linked into this managed package run."
        ];
    const synthesizedStepResults =
      parsedStepResults.length > 0
        ? parsedStepResults
        : [
            packagingBridgeStepResultSchema.parse({
              stepId: `${request.buildId ?? "release"}-managed-package-runner`,
              label: "Managed Package Runner",
              phase: "recipe-execution",
              status: result.success ? "succeeded" : "failed",
              summary:
                parsedSummary ??
                (result.success
                  ? `Package build runner completed for ${request.outputProfile}.`
                  : result.summary),
              toolId: this.packageToolId,
              executedCommand: result.commandLine,
              outputPaths: parsedArtifactPaths,
              diagnostics: parsedDiagnostics
            }),
            packagingBridgeStepResultSchema.parse({
              stepId: `${request.buildId ?? "release"}-compatibility-bridge`,
              label: "GSPro Compatibility Bridge",
              phase: "recipe-validation",
              status: compatibilityTool?.executablePath ? "succeeded" : "skipped",
              summary: compatibilityTool?.executablePath
                ? "GSPro compatibility bridge path was linked into the release run."
                : "GSPro compatibility bridge was not linked into the managed package run.",
              toolId: this.compatibilityToolId,
              executedCommand: compatibilityTool?.executablePath ?? null,
              outputPaths: [],
              diagnostics: compatibilityTool?.executablePath
                ? []
                : ["Configure the GSPro Compatibility Bridge to deepen recipe-backed validation."]
            }),
            packagingBridgeStepResultSchema.parse({
              stepId: `${request.buildId ?? "release"}-external-gspro-export`,
              label: "External GSPro Export Tool",
              phase: "recipe-execution",
              status: exportTool?.executablePath ? "succeeded" : "skipped",
              summary: exportTool?.executablePath
                ? "External GSPro export tool path was linked into the release run."
                : "External GSPro export tool was not linked into the managed package run.",
              toolId: this.exportToolId,
              executedCommand: exportTool?.executablePath ?? null,
              outputPaths: [],
              diagnostics: exportTool?.executablePath
                ? []
                : ["Configure a real external GSPro export tool to deepen production release evidence."]
            })
          ];

    return {
      success: result.success,
      adapterId: this.packageToolId,
      executionMode:
        parsedExecutionMode ??
        (exportTool?.executablePath
          ? compatibilityTool?.executablePath
            ? "mixed"
            : "external-tool"
          : "repo-backed"),
      summary:
        parsedSummary ??
        (result.success
          ? `Package build runner completed for ${request.outputProfile}.`
          : result.summary),
      executedCommand: result.commandLine,
      managedOutputRoot: parsedManagedOutputRoot,
      artifactPaths: parsedArtifactPaths,
      diagnostics: [
        ...parsedDiagnostics,
        result.summary,
        ...(result.stderr ? [result.stderr] : [])
      ].filter(Boolean),
      stepResults: synthesizedStepResults,
      hostVerificationNotes,
      remediationHints:
        parsedRemediationHints.length > 0
          ? parsedRemediationHints
          : result.success
            ? []
            : [
                "Review the failed managed release step output, then retry the latest release run from Package Center."
              ],
      retrySuggested: parsedRetrySuggested ?? !result.success
    };
  }
}

export class PassthroughAssetImportBridge implements AssetImportBridge {
  canImport(assetPath: string) {
    return assetPath.trim().length > 0;
  }

  async importAsset(request: AssetImportRequest): Promise<AssetImportResult> {
    return {
      normalizedPath: request.assetPath,
      importedAssetId: null,
      summary: "Asset import bridge accepted the request but no concrete importer is wired yet."
    };
  }
}

export class AssetImportRunnerBridge implements AssetImportBridge {
  constructor(
    private readonly toolPathProvider: ToolPathProvider,
    private readonly executionBridge: ExecutionBridge,
    private readonly toolId = "asset-import-runner",
  ) {}

  canImport(assetPath: string) {
    return assetPath.trim().length > 0;
  }

  async importAsset(request: AssetImportRequest): Promise<AssetImportResult> {
    const tool = await resolveRequiredTool(this.toolPathProvider, this.toolId);
    if (!tool) {
      return {
        normalizedPath: request.assetPath,
        importedAssetId: null,
        summary: "Asset import runner is not configured yet."
      };
    }

    const args = [
      "import-asset",
      "--json",
      "--asset-path",
      request.assetPath,
      "--destination-root",
      request.destinationRoot
    ];

    if (request.categoryHint) {
      args.push("--category-hint", request.categoryHint);
    }

    const result = await this.executionBridge.execute({
      commandId: this.toolId,
      commandPath: tool.executablePath,
      args,
      workingDirectory: null
    });
    const parsedOutput = parseManagedJsonOutput(result.stdout);
    const normalizedPath = readOptionalString(parsedOutput?.normalizedPath) ?? request.assetPath;
    const importedAssetId = readOptionalString(parsedOutput?.importedAssetId);
    const parsedSummary = readOptionalString(parsedOutput?.summary);

    return {
      normalizedPath,
      importedAssetId,
      summary:
        parsedSummary ??
        (result.success
          ? "Asset import runner completed successfully."
          : result.summary)
    };
  }
}
