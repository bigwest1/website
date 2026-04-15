import {
  AssetImportRunnerBridge,
  GsproCompatibilityExecutionBridge,
  InMemoryToolPathProvider,
  LocalCliExecutionBridge,
  PackageBuildRunnerBridge,
  ProbeDrivenToolHealthChecker,
  deriveIntegrationHealth,
  summarizeIntegrationHealth,
  type AssetImportBridge,
  type ExecutionBridge,
  type IntegrationDefinition,
  type IntegrationHealth,
  type IntegrationHealthSummary,
  type PackagingBridge,
  type ToolPathDefinition
} from "@course-creator-os/integration";
import type { AppConfig } from "@course-creator-os/config";

import { probeNativeToolPath, runNativeCommand } from "./native-runtime";

export type IntegrationRuntimeSnapshot = {
  toolDefinitions: ToolPathDefinition[];
  integrationDefinitions: readonly IntegrationDefinition[];
  integrationHealth: IntegrationHealth[];
  integrationHealthSummary: IntegrationHealthSummary;
};

export async function refreshIntegrationRuntime(input: {
  appConfig: AppConfig;
  toolDefinitions: ToolPathDefinition[];
  integrationDefinitions: readonly IntegrationDefinition[];
}): Promise<IntegrationRuntimeSnapshot> {
  const pathProvider = new InMemoryToolPathProvider([...input.toolDefinitions]);
  const checker = new ProbeDrivenToolHealthChecker((executablePath, tool) =>
    probeNativeToolPath(executablePath, tool.versionArgs),
  );
  const baseToolDefinitions = await pathProvider.listToolPaths();
  const toolChecks = await Promise.all(baseToolDefinitions.map((tool) => checker.checkTool(tool)));
  const toolDefinitions = baseToolDefinitions.map((tool) => {
    const check = toolChecks.find((entry) => entry.toolId === tool.toolId);
    return check
      ? {
          ...tool,
          status: check.status,
          lastCheckedAt: check.checkedAt,
          executablePath: check.resolvedPath ?? tool.executablePath,
          note: check.summary
        }
      : tool;
  });
  const integrationHealth = deriveIntegrationHealth({
    integrations: input.integrationDefinitions,
    toolPaths: toolDefinitions,
    integrationPreferences: input.appConfig.integrationPreferences
  });
  const checkedIntegrationHealth = await Promise.all(
    input.integrationDefinitions.map(async (integration) => {
      const checked = await checker.checkIntegration(integration, toolDefinitions);
      const fallback = integrationHealth.find((entry) => entry.integrationId === integration.integrationId);
      return fallback
        ? {
            ...fallback,
            status: checked.status,
            configurationState: checked.configurationState,
            lastCheckedAt: checked.lastCheckedAt,
            issueSummary: checked.issueSummary
          }
        : checked;
    }),
  );

  return {
    toolDefinitions,
    integrationDefinitions: input.integrationDefinitions,
    integrationHealth: checkedIntegrationHealth,
    integrationHealthSummary: summarizeIntegrationHealth(checkedIntegrationHealth)
  };
}

function createNativeCliExecutionBridge(): ExecutionBridge {
  return new LocalCliExecutionBridge(async (request) => {
    if (!request.commandPath) {
      return {
        success: false,
        exitCode: null,
        summary: `No executable path is configured for ${request.commandId}.`,
        commandLine: null,
        stdout: "",
        stderr: "Configure the tool path in Settings before relying on managed execution."
      };
    }

    return runNativeCommand(request.commandPath, request.args, request.workingDirectory);
  });
}

export function createManagedPackagingBridge(toolDefinitions: ToolPathDefinition[]): PackagingBridge {
  const provider = new InMemoryToolPathProvider([...toolDefinitions]);
  return new PackageBuildRunnerBridge(provider, createNativeCliExecutionBridge());
}

export function createManagedCompatibilityBridge(toolDefinitions: ToolPathDefinition[]): ExecutionBridge {
  const provider = new InMemoryToolPathProvider([...toolDefinitions]);
  return new GsproCompatibilityExecutionBridge(provider, createNativeCliExecutionBridge());
}

export function createManagedAssetImportBridge(toolDefinitions: ToolPathDefinition[]): AssetImportBridge {
  const provider = new InMemoryToolPathProvider([...toolDefinitions]);
  return new AssetImportRunnerBridge(provider, createNativeCliExecutionBridge());
}
