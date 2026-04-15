import type {
  IntegrationDefinition,
  IntegrationHealth,
  IntegrationHealthSummary,
  IntegrationStatus,
  ToolPathDefinition
} from "./models";

function deriveToolStatus(tool: Pick<ToolPathDefinition, "executablePath" | "required">, enabled: boolean): IntegrationStatus {
  if (!enabled) {
    return "disabled";
  }

  if (!tool.executablePath) {
    return "needs-config";
  }

  return "connected";
}

export function createConfiguredToolDefinitions({
  toolCatalog,
  storedToolPathSettings,
  allowSuggestedPaths = false
}: {
  toolCatalog: readonly Omit<ToolPathDefinition, "executablePath" | "status" | "lastCheckedAt">[];
  storedToolPathSettings: Array<{
    toolId: string;
    executablePath: string | null;
    enabled: boolean;
    note?: string;
  }>;
  allowSuggestedPaths?: boolean;
}): ToolPathDefinition[] {
  return toolCatalog.map((tool) => {
    const stored = storedToolPathSettings.find((item) => item.toolId === tool.toolId);
    const executablePath =
      stored?.executablePath ??
      (allowSuggestedPaths ? tool.suggestedExecutablePath ?? null : null);
    return {
      ...tool,
      executablePath,
      status: deriveToolStatus(
        {
          executablePath,
          required: tool.required
        },
        stored?.enabled ?? true,
      ),
      lastCheckedAt: null,
      note: stored?.note ?? tool.note
    };
  });
}

export function deriveIntegrationHealth({
  integrations,
  toolPaths,
  integrationPreferences
}: {
  integrations: readonly IntegrationDefinition[];
  toolPaths: readonly ToolPathDefinition[];
  integrationPreferences: Array<{ integrationId: string; enabled: boolean }>;
}): IntegrationHealth[] {
  return integrations.map((integration) => {
    const preference = integrationPreferences.find(
      (item) => item.integrationId === integration.integrationId,
    );
    const enabled = preference?.enabled ?? true;
    const relatedTools = toolPaths.filter((tool) => integration.requiredToolIds.includes(tool.toolId));
    const connectedToolCount = relatedTools.filter((tool) => tool.status === "connected").length;
    const errorTool = relatedTools.find((tool) => tool.status === "error");

    if (!enabled) {
      return {
        integrationId: integration.integrationId,
        name: integration.name,
        capabilities: integration.capabilities,
        status: "disabled",
        configurationState: "disabled",
        lastCheckedAt: null,
        issueSummary: "Integration is disabled in settings.",
        relatedToolIds: integration.requiredToolIds,
        settingsRouteHint: integration.settingsRouteHint
      };
    }

    if (errorTool) {
      return {
        integrationId: integration.integrationId,
        name: integration.name,
        capabilities: integration.capabilities,
        status: "error",
        configurationState: "partial",
        lastCheckedAt: errorTool.lastCheckedAt,
        issueSummary: `${errorTool.label} reported an error state.`,
        relatedToolIds: integration.requiredToolIds,
        settingsRouteHint: integration.settingsRouteHint
      };
    }

    if (relatedTools.length === 0 || connectedToolCount === 0) {
      return {
        integrationId: integration.integrationId,
        name: integration.name,
        capabilities: integration.capabilities,
        status: "needs-config",
        configurationState: "unconfigured",
        lastCheckedAt: null,
        issueSummary: "Required tool paths are not configured yet.",
        relatedToolIds: integration.requiredToolIds,
        settingsRouteHint: integration.settingsRouteHint
      };
    }

    if (connectedToolCount < relatedTools.length) {
      return {
        integrationId: integration.integrationId,
        name: integration.name,
        capabilities: integration.capabilities,
        status: "degraded",
        configurationState: "partial",
        lastCheckedAt: null,
        issueSummary: "Some required tools are configured, but the integration is not fully ready.",
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
        lastCheckedAt: null,
        issueSummary: "Required adapters are configured and ready for managed execution.",
        relatedToolIds: integration.requiredToolIds,
        settingsRouteHint: integration.settingsRouteHint
      };
  });
}

function statusRank(status: IntegrationStatus) {
  switch (status) {
    case "error":
      return 5;
    case "degraded":
      return 4;
    case "needs-config":
      return 3;
    case "disabled":
      return 2;
    case "connected":
    default:
      return 1;
  }
}

export function summarizeIntegrationHealth(
  integrations: readonly IntegrationHealth[],
): IntegrationHealthSummary {
  const connectedCount = integrations.filter((item) => item.status === "connected").length;
  const needsConfigCount = integrations.filter((item) => item.status === "needs-config").length;
  const disabledCount = integrations.filter((item) => item.status === "disabled").length;
  const degradedCount = integrations.filter((item) => item.status === "degraded").length;
  const errorCount = integrations.filter((item) => item.status === "error").length;
  const overallStatus = [...integrations]
    .sort((left, right) => statusRank(right.status) - statusRank(left.status))[0]?.status ?? "connected";

  const nextAction =
    errorCount > 0
      ? "Resolve integration bridge errors before relying on external execution."
      : needsConfigCount > 0
        ? "Configure required tool paths in Settings before enabling managed integrations."
        : degradedCount > 0
          ? "Finish partially configured adapters so the integration layer is predictable."
          : "Integration posture is healthy enough for production-minded managed orchestration.";

  return {
    overallStatus,
    connectedCount,
    needsConfigCount,
    disabledCount,
    degradedCount,
    errorCount,
    nextAction
  };
}
