import type {
  IntegrationDefinition,
  ToolPathDefinition
} from "./models";

export const defaultToolCatalog: readonly Omit<ToolPathDefinition, "executablePath" | "status" | "lastCheckedAt">[] = [
  {
    toolId: "gspro-export-tool",
    label: "GSPro Export Tool",
    description: "Optional external GSPro-facing export executable used to deepen release runs beyond repo-backed managed simulation.",
    executableName: "gspro-export-tool",
    versionArgs: ["--version"],
    suggestedExecutablePath: null,
    required: false,
    runtime: "local-cli",
    managedBy: "DEEP CURRENT",
    note: "Configure a real external export executable or wrapper to capture stronger production-side release evidence."
  },
  {
    toolId: "gspro-compatibility-bridge",
    label: "GSPro Compatibility Bridge",
    description: "Managed execution layer used to validate and prepare compatibility-facing output steps.",
    executableName: "gspro-compatibility-bridge",
    versionArgs: ["--version"],
    suggestedExecutablePath: "scripts/managed-adapters/gspro-compatibility-bridge.mjs",
    required: true,
    runtime: "managed-bridge",
    managedBy: "DEEP CURRENT",
    note: "Repo-backed compatibility adapter script used by managed release execution."
  },
  {
    toolId: "asset-import-runner",
    label: "Asset Import Runner",
    description: "Optional local tool that handles normalization and intake handoff for imported assets.",
    executableName: "asset-import-runner",
    versionArgs: ["--version"],
    suggestedExecutablePath: "scripts/managed-adapters/asset-import-runner.mjs",
    required: false,
    runtime: "local-cli",
    managedBy: "DEEP CURRENT",
    note: "Repo-backed import adapter used when the desktop host can execute managed asset tooling."
  },
  {
    toolId: "package-build-runner",
    label: "Package Build Runner",
    description: "Optional release builder bridge for candidate-package orchestration and artifact generation.",
    executableName: "package-build-runner",
    versionArgs: ["--version"],
    suggestedExecutablePath: "scripts/managed-adapters/package-build-runner.mjs",
    required: false,
    runtime: "local-cli",
    managedBy: "DEEP CURRENT",
    note: "Repo-backed release adapter used by PackagingBridge implementations, not directly by the UI."
  }
] as const;

export const defaultIntegrationCatalog: readonly IntegrationDefinition[] = [
  {
    integrationId: "gspro-export",
    name: "GSPro Export Toolchain",
    description: "Adds optional external-tool execution evidence to GSPro-facing release recipes without leaking tool specifics into product modules.",
    adapterInterface: "ExecutionBridge",
    runtime: "local-cli",
    capabilities: ["tool-path-resolution", "command-execution", "health-check"],
    requiredToolIds: ["gspro-export-tool"],
    settingsRouteHint: "/settings",
    ownerAgent: "DEEP CURRENT"
  },
  {
    integrationId: "gspro-compatibility",
    name: "GSPro Compatibility Layer",
    description: "Isolates compatibility-facing validation and managed execution behind bridge interfaces.",
    adapterInterface: "ExecutionBridge",
    runtime: "managed-bridge",
    capabilities: ["tool-path-resolution", "command-execution", "health-check"],
    requiredToolIds: ["gspro-compatibility-bridge"],
    settingsRouteHint: "/settings",
    ownerAgent: "DEEP CURRENT"
  },
  {
    integrationId: "asset-import",
    name: "Asset Import Layer",
    description: "Handles external ingestion and normalization adapters without leaking tool assumptions into the Asset Library UI.",
    adapterInterface: "AssetImportBridge",
    runtime: "local-cli",
    capabilities: ["tool-path-resolution", "asset-import", "health-check"],
    requiredToolIds: ["asset-import-runner"],
    settingsRouteHint: "/settings",
    ownerAgent: "DEEP CURRENT"
  },
  {
    integrationId: "package-build",
    name: "Package Build Layer",
    description: "Provides an adapter boundary for release-candidate build execution and artifact handoff.",
    adapterInterface: "PackagingBridge",
    runtime: "local-cli",
    capabilities: ["tool-path-resolution", "package-build", "health-check"],
    requiredToolIds: ["package-build-runner", "gspro-compatibility-bridge"],
    settingsRouteHint: "/settings",
    ownerAgent: "DEEP CURRENT"
  }
] as const;
