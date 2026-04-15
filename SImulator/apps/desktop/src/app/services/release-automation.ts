import {
  executeManagedReleaseAutomation,
  type ManagedReleaseAutomationResult
} from "@course-creator-os/packaging";
import type { CourseProject } from "@course-creator-os/project-model";
import type { PackagingBridgeResult } from "@course-creator-os/integration";

import { getAppSettingsSnapshot } from "../settings-session";
import { createManagedPackagingBridge } from "./integration-runtime";

type ValidationIssueLike = {
  severity: "info" | "warning" | "high" | "critical";
  ownerModule: string;
  title?: string;
  summary?: string;
  recommendedFix?: string;
};

function buildPackagingBridgeSummary(input: {
  bridgeStatus: "connected" | "needs-config" | "disabled" | "degraded" | "error" | null;
  bridgeSummary: string;
  executionMode: PackagingBridgeResult["executionMode"];
  diagnostics: string[];
}) {
  const executionModeSummary =
    input.executionMode && input.executionMode !== "unconfigured"
      ? ` Execution mode: ${input.executionMode}.`
      : "";
  const bridgePreamble =
    input.bridgeStatus && input.bridgeStatus !== "connected"
      ? `${input.bridgeSummary}${executionModeSummary} Bridge status: ${input.bridgeStatus}.`
      : `${input.bridgeSummary}${executionModeSummary}`;
  const diagnostics = input.diagnostics.filter(Boolean);

  if (diagnostics.length === 0) {
    return bridgePreamble;
  }

  return `${bridgePreamble} Diagnostics: ${diagnostics.join(" | ")}`;
}

function buildRecipeHint(profileId: "brother-mode" | "community-safe" | "showcase") {
  switch (profileId) {
    case "brother-mode":
      return "gspro-brother-mode";
    case "showcase":
      return "gspro-showcase";
    case "community-safe":
    default:
      return "gspro-community-safe";
  }
}

export type ReleaseAutomationRun = {
  startedAt: string;
  bridgeResult: PackagingBridgeResult;
  automation: ManagedReleaseAutomationResult;
};

export async function runManagedReleaseAutomation(input: {
  project: CourseProject;
  validationIssues: ValidationIssueLike[];
  profileId: "brother-mode" | "community-safe" | "showcase";
  projectRoot: string | null;
  manifestPath: string | null;
}): Promise<ReleaseAutomationRun> {
  const startedAt = new Date().toISOString();
  const buildId = `build-${startedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`;
  const settings = getAppSettingsSnapshot();
  const packageBuildIntegration = settings.integrationHealth.find(
    (integration) => integration.integrationId === "package-build",
  );
  const packagingBridge = createManagedPackagingBridge(settings.toolDefinitions);
  const bridgeResult = await packagingBridge.buildReleaseCandidate({
    projectRoot: input.projectRoot ?? "/preview",
    outputProfile: input.profileId,
    manifestPath: input.manifestPath,
    buildId,
    recipeHint: buildRecipeHint(input.profileId),
    releaseOutputRoot: "exports/gspro-release-runs"
  });
  const bridgeDiagnostics = [
    ...bridgeResult.diagnostics,
    ...bridgeResult.hostVerificationNotes,
    ...bridgeResult.remediationHints
  ];
  const retryCount =
    input.project.packageBuilds.find((build) => build.profileId === input.profileId)?.retryCount ?? 0;
  const automation = executeManagedReleaseAutomation({
    project: input.project,
    validationIssues: input.validationIssues,
    profileId: input.profileId,
    createdAt: startedAt,
    outputDirectoryRoot: "exports/gspro-release-runs",
    bridgeSucceeded: bridgeResult.success,
    bridgeAdapterId: bridgeResult.adapterId,
    bridgeExecutedCommand: bridgeResult.executedCommand,
    bridgeSummary: buildPackagingBridgeSummary({
      bridgeStatus: packageBuildIntegration?.status ?? null,
      bridgeSummary: bridgeResult.summary,
      executionMode: bridgeResult.executionMode,
      diagnostics: bridgeDiagnostics
    }),
    bridgeDiagnostics,
    bridgeArtifactPaths: bridgeResult.artifactPaths,
    bridgeStepResults: bridgeResult.stepResults,
    executionMode: bridgeResult.executionMode,
    runtimeVerificationState: settings.nativeRuntimeReport.status,
    runtimeVerificationSummary: settings.nativeRuntimeReport.summary,
    runtimeVerificationEvidence: settings.nativeRuntimeReport.verificationEvidence.map(
      (evidence) => `${evidence.label}: ${evidence.detail}`,
    ),
    retryCount: bridgeResult.success ? retryCount : retryCount + 1
  });

  return {
    startedAt,
    bridgeResult,
    automation
  };
}
