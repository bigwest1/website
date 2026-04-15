import { useSyncExternalStore } from "react";
import { isTauri } from "@tauri-apps/api/core";

import {
  appConfigSchema,
  createDefaultAppConfig,
  type AppConfig
} from "@course-creator-os/config";
import {
  createConfiguredToolDefinitions,
  defaultIntegrationCatalog,
  defaultToolCatalog,
  deriveIntegrationHealth,
  summarizeIntegrationHealth,
  type IntegrationDefinition,
  type IntegrationHealth,
  type IntegrationHealthSummary,
  type ToolPathDefinition
} from "@course-creator-os/integration";
import type { ProjectPersistenceMode } from "./services/project-persistence";
import {
  refreshIntegrationRuntime,
  type IntegrationRuntimeSnapshot
} from "./services/integration-runtime";
import {
  createPreviewOnlyNativeRuntimeReport,
  inspectNativeRuntimeVerification,
  type NativeRuntimeVerificationReport
} from "./services/native-runtime";

const APP_SETTINGS_STORAGE_KEY = "cco:app-settings";

type SettingsSnapshot = {
  appConfig: AppConfig;
  toolDefinitions: ToolPathDefinition[];
  integrationDefinitions: readonly IntegrationDefinition[];
  integrationHealth: IntegrationHealth[];
  integrationHealthSummary: IntegrationHealthSummary;
  nativeRuntimeReport: NativeRuntimeVerificationReport;
  saveStatus: {
    label: string;
    detail: string;
  };
  verificationStatus: {
    label: string;
    detail: string;
  };
};

const listeners = new Set<() => void>();

type SettingsRuntimeState = {
  toolDefinitions: ToolPathDefinition[] | null;
  integrationHealth: IntegrationHealth[] | null;
  integrationHealthSummary: IntegrationHealthSummary | null;
  nativeRuntimeReport: NativeRuntimeVerificationReport;
  verificationStatus: SettingsSnapshot["verificationStatus"];
};

function readStoredSettings(): AppConfig | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return appConfigSchema.parse(JSON.parse(raw));
  } catch {
    window.localStorage.removeItem(APP_SETTINGS_STORAGE_KEY);
    return null;
  }
}

function persistSettings(settings: AppConfig) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

let settingsRuntimeState: SettingsRuntimeState = {
  toolDefinitions: null,
  integrationHealth: null,
  integrationHealthSummary: null,
  nativeRuntimeReport: createPreviewOnlyNativeRuntimeReport(null),
  verificationStatus: {
    label: "Verification Pending",
    detail: "Native runtime and integration inputs have not been actively checked in this session yet."
  }
};

function allowSuggestedToolPaths() {
  return typeof window !== "undefined" && isTauri();
}

function buildSnapshot(appConfig: AppConfig): SettingsSnapshot {
  const configuredToolDefinitions = createConfiguredToolDefinitions({
    toolCatalog: defaultToolCatalog,
    storedToolPathSettings: appConfig.toolPaths,
    allowSuggestedPaths: allowSuggestedToolPaths()
  });
  const configuredIntegrationHealth = deriveIntegrationHealth({
    integrations: defaultIntegrationCatalog,
    toolPaths: configuredToolDefinitions,
    integrationPreferences: appConfig.integrationPreferences
  });
  const integrationHealthSummary = settingsRuntimeState.integrationHealthSummary ??
    summarizeIntegrationHealth(configuredIntegrationHealth);

  return {
    appConfig,
    toolDefinitions: settingsRuntimeState.toolDefinitions ?? configuredToolDefinitions,
    integrationDefinitions: defaultIntegrationCatalog,
    integrationHealth: settingsRuntimeState.integrationHealth ?? configuredIntegrationHealth,
    integrationHealthSummary,
    nativeRuntimeReport: settingsRuntimeState.nativeRuntimeReport,
    saveStatus: {
      label: "Settings Saved",
      detail: "Integration preferences and app defaults are stored locally."
    },
    verificationStatus: settingsRuntimeState.verificationStatus
      ? settingsRuntimeState.verificationStatus
      : {
          label: "Verification Pending",
          detail: "Integration inputs are configured, but native/runtime verification has not been refreshed yet."
        }
  };
}

const storedSettings = readStoredSettings();
let settingsSnapshot = buildSnapshot(storedSettings ?? createDefaultAppConfig());

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return settingsSnapshot;
}

export function getAppSettingsSnapshot() {
  return settingsSnapshot;
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function updateSettings(updater: (config: AppConfig) => AppConfig) {
  const nextConfig = appConfigSchema.parse(updater(settingsSnapshot.appConfig));
  settingsSnapshot = buildSnapshot(nextConfig);
  persistSettings(nextConfig);
  emitChange();
}

export async function refreshIntegrationHealth(
  projectRoot: string | null = null,
  persistenceMode: ProjectPersistenceMode | "seed" = "seed",
) {
  settingsRuntimeState = {
    ...settingsRuntimeState,
    verificationStatus: {
      label: "Verifying Runtime",
      detail: "Checking native runtime posture and managed bridge inputs."
    }
  };
  settingsSnapshot = buildSnapshot(settingsSnapshot.appConfig);
  emitChange();

  try {
    const runtimeSnapshot: IntegrationRuntimeSnapshot = await refreshIntegrationRuntime({
      appConfig: settingsSnapshot.appConfig,
      toolDefinitions: createConfiguredToolDefinitions({
        toolCatalog: defaultToolCatalog,
        storedToolPathSettings: settingsSnapshot.appConfig.toolPaths,
        allowSuggestedPaths: allowSuggestedToolPaths()
      }),
      integrationDefinitions: defaultIntegrationCatalog
    });
    const nativeRuntimeReport = await inspectNativeRuntimeVerification(projectRoot, persistenceMode);

    settingsRuntimeState = {
      toolDefinitions: runtimeSnapshot.toolDefinitions,
      integrationHealth: runtimeSnapshot.integrationHealth,
      integrationHealthSummary: runtimeSnapshot.integrationHealthSummary,
      nativeRuntimeReport,
      verificationStatus: {
        label:
          nativeRuntimeReport.status === "verified"
            ? "Runtime Verified"
            : nativeRuntimeReport.status === "partially-verified"
              ? "Runtime Partially Verified"
              : nativeRuntimeReport.status === "unavailable"
                ? "Runtime Unavailable"
              : nativeRuntimeReport.status === "degraded"
                ? "Runtime Degraded"
                : "Preview Runtime",
        detail: `${nativeRuntimeReport.summary} ${runtimeSnapshot.integrationHealthSummary.nextAction}`
      }
    };
  } catch (error) {
    settingsRuntimeState = {
      ...settingsRuntimeState,
      nativeRuntimeReport: createPreviewOnlyNativeRuntimeReport(projectRoot),
      verificationStatus: {
        label: "Verification Failed",
        detail: error instanceof Error ? error.message : "Runtime verification failed."
      }
    };
  }

  settingsSnapshot = buildSnapshot(settingsSnapshot.appConfig);
  emitChange();
}

export function useAppSettings() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function updateToolPath(toolId: string, executablePath: string | null) {
  updateSettings((config) => ({
    ...config,
    toolPaths: config.toolPaths.map((tool) =>
      tool.toolId === toolId
        ? {
            ...tool,
            executablePath
          }
        : tool,
    )
  }));
}

export function setToolEnabled(toolId: string, enabled: boolean) {
  updateSettings((config) => ({
    ...config,
    toolPaths: config.toolPaths.map((tool) =>
      tool.toolId === toolId
        ? {
            ...tool,
            enabled
          }
        : tool,
    )
  }));
}

export function setIntegrationEnabled(integrationId: string, enabled: boolean) {
  updateSettings((config) => ({
    ...config,
    integrationPreferences: config.integrationPreferences.map((integration) =>
      integration.integrationId === integrationId
        ? {
            ...integration,
            enabled
          }
        : integration,
    )
  }));
}

export function updateProjectDefaults(
  updater: (defaults: AppConfig["projectDefaults"]) => AppConfig["projectDefaults"],
) {
  updateSettings((config) => ({
    ...config,
    projectDefaults: updater(config.projectDefaults)
  }));
}

export function setThemeMode(themeMode: AppConfig["themeMode"]) {
  updateSettings((config) => ({
    ...config,
    themeMode
  }));
}

export function setDiagnosticsEnabled(diagnosticsEnabled: boolean) {
  updateSettings((config) => ({
    ...config,
    diagnosticsEnabled
  }));
}
