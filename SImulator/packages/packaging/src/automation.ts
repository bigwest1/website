import { synchronizePreviewProductionState } from "@course-creator-os/preview";

import {
  summarizeFinalCreatorDelivery,
  summarizeReleaseExecutionState,
  type PackagingProjectLike,
  type ReleaseExecutionSummary
} from "./analysis";
import {
  executeReleaseCandidateBuild,
  type PackageBuildExecutionResult
} from "./execution";
import type { BuildExecutionMode, BuildRuntimeVerificationState } from "./models";

type ValidationIssueLike = {
  severity: "info" | "warning" | "high" | "critical";
  ownerModule: string;
  title?: string;
  summary?: string;
  recommendedFix?: string;
};

type ManagedBridgeStepLike = {
  stepId: string;
  label: string;
  phase: string;
  status: "pending" | "succeeded" | "failed" | "skipped";
  summary: string;
  toolId?: string | null;
  executedCommand?: string | null;
  outputPaths?: string[];
  diagnostics?: string[];
};

export type ManagedReleaseAutomationResult = {
  execution: PackageBuildExecutionResult;
  previewProductionState: ReturnType<typeof synchronizePreviewProductionState>;
  releaseExecution: ReleaseExecutionSummary;
  finalDelivery: ReturnType<typeof summarizeFinalCreatorDelivery>;
};

function mergeReleaseRecords(
  existingReleaseRecords: PackagingProjectLike["releaseRecords"],
  nextReleaseRecord: PackagingProjectLike["releaseRecords"][number] | null,
) {
  if (!nextReleaseRecord) {
    return existingReleaseRecords;
  }

  const remainingRecords = existingReleaseRecords.filter(
    (release) =>
      release.releaseId !== nextReleaseRecord.releaseId &&
      release.packageBuildRef !== nextReleaseRecord.packageBuildRef,
  );

  return [nextReleaseRecord, ...remainingRecords];
}

export function executeManagedReleaseAutomation(input: {
  project: PackagingProjectLike;
  validationIssues?: ValidationIssueLike[];
  profileId: "brother-mode" | "community-safe" | "showcase";
  createdAt?: string;
  outputDirectoryRoot?: string;
  bridgeSucceeded?: boolean;
  bridgeAdapterId?: string | null;
  bridgeExecutedCommand?: string | null;
  bridgeSummary?: string;
  bridgeDiagnostics?: string[];
  bridgeArtifactPaths?: string[];
  bridgeStepResults?: ManagedBridgeStepLike[];
  executionMode?: BuildExecutionMode;
  runtimeVerificationState?: BuildRuntimeVerificationState;
  runtimeVerificationSummary?: string;
  runtimeVerificationEvidence?: string[];
  retryCount?: number;
}): ManagedReleaseAutomationResult {
  const execution = executeReleaseCandidateBuild({
    project: input.project,
    validationIssues: input.validationIssues,
    profileId: input.profileId,
    createdAt: input.createdAt,
    outputDirectoryRoot: input.outputDirectoryRoot,
    bridgeSucceeded: input.bridgeSucceeded,
    bridgeAdapterId: input.bridgeAdapterId,
    bridgeExecutedCommand: input.bridgeExecutedCommand,
    bridgeSummary: input.bridgeSummary,
    bridgeDiagnostics: input.bridgeDiagnostics,
    bridgeArtifactPaths: input.bridgeArtifactPaths,
    bridgeStepResults: input.bridgeStepResults,
    executionMode: input.executionMode,
    runtimeVerificationState: input.runtimeVerificationState,
    runtimeVerificationSummary: input.runtimeVerificationSummary,
    runtimeVerificationEvidence: input.runtimeVerificationEvidence,
    retryCount: input.retryCount
  });
  const previewProductionState = synchronizePreviewProductionState({
    previewPaths: input.project.previewPaths,
    flyoverPlans: input.project.flyoverPlans,
    screenshotPlans: input.project.screenshotPlans,
    showcaseSequences: input.project.showcaseSequences,
    buildId: execution.build.buildId,
    buildSucceeded: execution.build.executionState === "succeeded"
  });
  const releaseExecution = summarizeReleaseExecutionState({
    ...input.project,
    packageBuilds: [execution.build, ...input.project.packageBuilds],
    releaseRecords: mergeReleaseRecords(input.project.releaseRecords, execution.releaseRecord),
    previewPaths: previewProductionState.previewPaths,
    flyoverPlans: previewProductionState.flyoverPlans,
    screenshotPlans: previewProductionState.screenshotPlans,
    showcaseSequences: previewProductionState.showcaseSequences
  });
  const finalDelivery = summarizeFinalCreatorDelivery({
    ...input.project,
    packageBuilds: [execution.build, ...input.project.packageBuilds],
    releaseRecords: mergeReleaseRecords(input.project.releaseRecords, execution.releaseRecord),
    previewPaths: previewProductionState.previewPaths,
    flyoverPlans: previewProductionState.flyoverPlans,
    screenshotPlans: previewProductionState.screenshotPlans,
    showcaseSequences: previewProductionState.showcaseSequences
  });

  return {
    execution,
    previewProductionState,
    releaseExecution,
    finalDelivery
  };
}
