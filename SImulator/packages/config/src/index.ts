import { z } from "zod";

import {
  projectModeSchema,
  validationProfileSchema
} from "@course-creator-os/core-types";
import {
  defaultIntegrationCatalog,
  defaultToolCatalog
} from "@course-creator-os/integration";
import { performanceProfileIdSchema } from "@course-creator-os/performance";

export const featureFlagSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
  note: z.string().optional()
});

export const toolPathSettingSchema = z.object({
  toolId: z.string(),
  executablePath: z.string().nullable(),
  enabled: z.boolean(),
  note: z.string().optional()
});

export const integrationPreferenceSchema = z.object({
  integrationId: z.string(),
  enabled: z.boolean(),
  note: z.string().optional()
});

export const projectDefaultsSchema = z.object({
  defaultProjectMode: projectModeSchema,
  defaultValidationProfile: validationProfileSchema,
  defaultOutputProfile: performanceProfileIdSchema,
  defaultHoleCount: z.number().min(1).max(18)
});

export const appConfigSchema = z.object({
  themeMode: z.enum(["dark", "system"]),
  diagnosticsEnabled: z.boolean(),
  projectDefaults: projectDefaultsSchema,
  toolPaths: z.array(toolPathSettingSchema),
  integrationPreferences: z.array(integrationPreferenceSchema),
  featureFlags: z.array(featureFlagSchema)
});

export type FeatureFlag = z.infer<typeof featureFlagSchema>;
export type ToolPathSetting = z.infer<typeof toolPathSettingSchema>;
export type IntegrationPreference = z.infer<typeof integrationPreferenceSchema>;
export type ProjectDefaults = z.infer<typeof projectDefaultsSchema>;
export type AppConfig = z.infer<typeof appConfigSchema>;

export function createDefaultAppConfig(): AppConfig {
  return {
    themeMode: "dark",
    diagnosticsEnabled: true,
    projectDefaults: {
      defaultProjectMode: "public-safe",
      defaultValidationProfile: "balanced",
      defaultOutputProfile: "brother-mode",
      defaultHoleCount: 18
    },
    toolPaths: defaultToolCatalog.map((tool) => ({
      toolId: tool.toolId,
      executablePath: null,
      enabled: true,
      note: tool.note
    })),
    integrationPreferences: defaultIntegrationCatalog.map((integration) => ({
      integrationId: integration.integrationId,
      enabled: true
    })),
    featureFlags: [
      {
        key: "managed_integrations_ui",
        enabled: true,
        note: "Expose integration health and adapter settings in the Settings workspace."
      }
    ]
  };
}
