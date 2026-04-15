import type {
  DropZoneArea,
  GreenZone,
  HazardZone,
  OutOfBoundsZone,
  PlayRouteEnvelope,
  RoutingPath,
  SceneSpatialReference,
  TeeZone,
  VisibilityCorridor
} from "@course-creator-os/scene-authoring";
import type {
  DropZoneSpatialBinding,
  HazardSpatialBinding,
  HolePlayProfile,
  OutOfBoundsSpatialBinding,
  PinSpatialBinding,
  PreviewAnchorBinding,
  TeeSpatialBinding
} from "@course-creator-os/sim-logic";
import {
  summarizePreviewOperationalFlow,
  summarizePreviewReadiness,
  type FlyoverPlan,
  type PreviewPath,
  type PreviewReadinessSummary,
  type ScreenshotPlan,
  type ShowcaseSequence
} from "@course-creator-os/preview";

import {
  exportGeometryReportSchema,
  packagingResultSchema,
  type ExportGeometryDiagnostic,
  type ExportGeometryDiagnosticCategory,
  type ExportGeometryDiagnosticSeverity,
  type PackageBuild,
  type PackagingChecklist,
  type PackagingResult,
  type ReleaseRecord
} from "./models";

type ValidationIssueLike = {
  severity: "info" | "warning" | "high" | "critical";
  ownerModule: string;
};

export type PackagingProjectLike = {
  id: string;
  manifest: {
    name: string;
    slug: string;
    version: string;
    projectMode: string;
    holeCount: number;
  };
  courseBible: {
    visionOverview: {
      statement: string;
    };
  };
  assets: Array<{
    queueState: string;
    approvalStatus: string;
  }>;
  previewPaths: PreviewPath[];
  flyoverPlans: FlyoverPlan[];
  screenshotPlans: ScreenshotPlan[];
  showcaseSequences: ShowcaseSequence[];
  sceneAuthoring: {
    teeZones: TeeZone[];
    greenZones: GreenZone[];
    hazardZones: HazardZone[];
    outOfBoundsZones: OutOfBoundsZone[];
    dropZoneAreas: DropZoneArea[];
    routingPaths: RoutingPath[];
    visibilityCorridors: VisibilityCorridor[];
    playRouteEnvelopes: PlayRouteEnvelope[];
  };
  simulatorLogic: {
    teeSpatialBindings: TeeSpatialBinding[];
    pinSpatialBindings: PinSpatialBinding[];
    hazardSpatialBindings: HazardSpatialBinding[];
    outOfBoundsSpatialBindings: OutOfBoundsSpatialBinding[];
    dropZoneSpatialBindings: DropZoneSpatialBinding[];
    previewAnchorBindings: PreviewAnchorBinding[];
    holePlayProfiles: HolePlayProfile[];
  };
  packagingState: {
    readiness: string;
    releaseCandidateReady: boolean;
  };
  releaseRecords: ReleaseRecord[];
  packageBuilds: PackageBuild[];
};

export type ReleaseConvergenceIssue = {
  issueId: string;
  severity: "warning" | "critical";
  ownerModule: "build" | "gameplay" | "preview" | "package" | "publish";
  title: string;
  summary: string;
  actionPath: string;
};

export type ReleaseConvergenceSummary = {
  overallReadiness: "blocked" | "watch" | "ready";
  blockerCount: number;
  warningCount: number;
  previewSummary: PreviewReadinessSummary;
  publishSummary: ReturnType<typeof summarizePublishReadiness>;
  packagingResult: PackagingResult;
  exportGeometry: ReturnType<typeof deriveExportGeometryReport>;
  issues: ReleaseConvergenceIssue[];
  recommendedAction: string;
};

export type ReleaseExecutionIssue = {
  issueId: string;
  severity: "warning" | "critical";
  ownerModule: "package" | "preview" | "publish" | "settings";
  title: string;
  summary: string;
  actionPath: string;
};

export type ReleaseRemediationAction = {
  actionId: string;
  severity: "warning" | "critical";
  ownerModule: "package" | "preview" | "publish" | "settings";
  label: string;
  actionPath: string;
};

export type ReleaseExecutionSummary = {
  overallReadiness: "blocked" | "watch" | "ready";
  latestBuild: PackageBuild | null;
  latestRelease: ReleaseRecord | null;
  executionMode: PackageBuild["executionMode"] | "unconfigured";
  missingArtifactCount: number;
  failedStepCount: number;
  toolLinkedStepCount: number;
  externalToolStepCount: number;
  managedOutputCount: number;
  retryRecommended: boolean;
  issues: ReleaseExecutionIssue[];
  remediationActions: ReleaseRemediationAction[];
  nextAction: string;
};

export type CreatorDeliveryIssue = {
  issueId: string;
  severity: "warning" | "critical";
  ownerModule: "package" | "preview" | "publish";
  title: string;
  summary: string;
  actionPath: string;
};

export type CreatorDeliverySummary = {
  overallReadiness: "blocked" | "watch" | "ready";
  latestBuildId: string | null;
  latestReleaseId: string | null;
  deliveryReady: boolean;
  generatedArtifactCount: number;
  deliveryArtifactCount: number;
  missingArtifactCount: number;
  previewLinkedOutputCount: number;
  staleOutputCount: number;
  missingOutputCount: number;
  failedOutputCount: number;
  releaseDraftAligned: boolean;
  issues: CreatorDeliveryIssue[];
  nextAction: string;
};

export type CreatorReleaseHandoffArtifact = {
  artifactId: string;
  label: string;
  artifactType: PackageBuild["artifactRefs"][number]["artifactType"];
  relativePath: string;
  status: PackageBuild["artifactRefs"][number]["status"];
  generatedAt: string | null;
  note: string;
};

export type CreatorReleaseHandoffSummary = {
  overallReadiness: "blocked" | "watch" | "ready";
  handoffReady: boolean;
  latestBuildId: string | null;
  latestReleaseId: string | null;
  executionMode: PackageBuild["executionMode"] | "unconfigured";
  completedReleaseRun: boolean;
  artifactManifestLinked: boolean;
  releaseDraftAligned: boolean;
  previewFresh: boolean;
  externalToolEvidenceCount: number;
  handoffArtifactCount: number;
  missingHandoffCount: number;
  handoffArtifacts: CreatorReleaseHandoffArtifact[];
  issues: CreatorDeliveryIssue[];
  nextActions: string[];
};

export type FinalCreatorDeliverySummary = {
  overallReadiness: "blocked" | "watch" | "ready";
  deliveryReady: boolean;
  latestBuildId: string | null;
  latestReleaseId: string | null;
  executionMode: PackageBuild["executionMode"] | "unconfigured";
  handoffReady: boolean;
  finalDeliveryAutomated: boolean;
  previewFresh: boolean;
  publishDraftAligned: boolean;
  externalToolEvidenceCount: number;
  deliveryArtifactCount: number;
  missingDeliveryArtifactCount: number;
  deliveryArtifacts: CreatorReleaseHandoffArtifact[];
  issues: CreatorDeliveryIssue[];
  nextActions: string[];
};

export type ShareReadyPresentationSignal = {
  overallState: "rough" | "watch" | "ready";
  blockedHoleCount?: number;
  presentationGapHoleCount?: number;
  abruptHoleCount?: number;
  polishGapHoleCount?: number;
  correctiveHoleCount?: number;
  recommendedAction: string;
};

export type ShareReadyPresentationHandoffSummary = {
  overallReadiness: "blocked" | "watch" | "ready";
  shareReady: boolean;
  previewAssetCount: number;
  missingPresentationAssetCount: number;
  blockedHoleCount: number;
  polishGapHoleCount: number;
  handoffAligned: boolean;
  issues: CreatorDeliveryIssue[];
  nextActions: string[];
};

export type PresentationSharePacketFinalizationSummary = {
  overallReadiness: "blocked" | "watch" | "ready";
  packetReady: boolean;
  packetGenerated: boolean;
  packetArtifactPath: string | null;
  includedArtifactCount: number;
  shareableAssetCount: number;
  missingPacketRequirementCount: number;
  blockedHoleCount: number;
  polishGapHoleCount: number;
  issues: CreatorDeliveryIssue[];
  nextActions: string[];
};

export type PresentationPacketProofingSummary = {
  overallReadiness: "blocked" | "watch" | "ready";
  proofedReady: boolean;
  packetReady: boolean;
  packetGenerated: boolean;
  alignmentState: "blocked" | "watch" | "aligned";
  assetCoverageState: "blocked" | "watch" | "ready";
  sequenceConfidenceState: "blocked" | "watch" | "ready";
  corridorSupportState: "blocked" | "watch" | "ready";
  proofingGapCount: number;
  blockedHoleCount: number;
  issues: CreatorDeliveryIssue[];
  nextActions: string[];
};

export type PresentationShareDeliveryConfidenceSummary = {
  overallReadiness: "blocked" | "watch" | "ready";
  deliveryReady: boolean;
  alignmentState: "blocked" | "watch" | "aligned";
  packetReady: boolean;
  packetConfidenceState: "blocked" | "watch" | "ready";
  proofingState: "blocked" | "watch" | "ready";
  shotApprovalState: "blocked" | "watch" | "ready";
  shotVariantState: "blocked" | "watch" | "ready";
  variantShippingState: "blocked" | "watch" | "ready";
  variantManifestState: "blocked" | "watch" | "ready";
  corridorKitState: "blocked" | "watch" | "ready";
  corridorBundleState: "blocked" | "watch" | "ready";
  corridorLibraryState: "blocked" | "watch" | "ready";
  corridorRecommendationState: "blocked" | "watch" | "ready";
  cleanupReplayState: "blocked" | "watch" | "ready";
  sequencingState: "blocked" | "watch" | "ready";
  corridorStagingState: "blocked" | "watch" | "ready";
  assetCoverageState: "blocked" | "watch" | "ready";
  trustedToShare: boolean;
  shareableAssetCount: number;
  deliveryGapCount: number;
  blockedHoleCount: number;
  polishGapHoleCount: number;
  issues: CreatorDeliveryIssue[];
  nextActions: string[];
};

export type FinalShareGateApprovalSummary = {
  overallReadiness: "blocked" | "watch" | "ready";
  gateApproved: boolean;
  gateState: "blocked" | "watch" | "approved";
  alignmentState: "blocked" | "watch" | "aligned";
  packetConfidenceState: "blocked" | "watch" | "ready";
  proofingState: "blocked" | "watch" | "ready";
  shotVariantState: "blocked" | "watch" | "ready";
  variantShippingState: "blocked" | "watch" | "ready";
  variantManifestState: "blocked" | "watch" | "ready";
  corridorBundleState: "blocked" | "watch" | "ready";
  corridorLibraryState: "blocked" | "watch" | "ready";
  corridorRecommendationState: "blocked" | "watch" | "ready";
  cleanupReplayState: "blocked" | "watch" | "ready";
  signoffArtifactState: "missing" | "watch" | "ready";
  signoffArtifactPath: string | null;
  signoffLockState: "missing" | "watch" | "locked";
  signoffLockPath: string | null;
  approvalGapCount: number;
  blockedHoleCount: number;
  issues: CreatorDeliveryIssue[];
  nextActions: string[];
};

function hasReference(
  reference: SceneSpatialReference | null,
  ids: Set<string>,
) {
  return Boolean(reference && ids.has(reference.entityId));
}

function createDiagnostic(input: {
  diagnosticId: string;
  category: ExportGeometryDiagnosticCategory;
  severity: ExportGeometryDiagnosticSeverity;
  holeId?: string | null;
  title: string;
  summary: string;
  recommendedAction: string;
}): ExportGeometryDiagnostic {
  return {
    diagnosticId: input.diagnosticId,
    category: input.category,
    severity: input.severity,
    holeId: input.holeId ?? null,
    title: input.title,
    summary: input.summary,
    recommendedAction: input.recommendedAction
  };
}

export function getLatestPackageBuild(builds: PackageBuild[]) {
  return builds[0] ?? null;
}

export function derivePackagingResult(checklist: PackagingChecklist[]): PackagingResult {
  const blockerCount = checklist.filter((item) => item.state === "blocked").length;
  const warningCount = checklist.filter((item) => item.state === "warning").length;
  const completeCount = checklist.filter((item) => item.state === "complete").length;
  const pendingCount = checklist.filter((item) => item.state === "pending").length;

  const readiness =
    blockerCount > 0 ? "blocked" : warningCount > 0 || pendingCount > 0 ? "watch" : "ready";

  const summary =
    readiness === "blocked"
      ? `${blockerCount} blockers still prevent a reliable release candidate.`
      : readiness === "watch"
        ? `${warningCount + pendingCount} checklist items still need attention before confidence is strong.`
        : "Packaging checklist is currently clear enough for release-candidate confidence.";

  const recommendedAction =
    checklist.find((item) => item.state === "blocked")?.summary ??
    checklist.find((item) => item.state === "warning" || item.state === "pending")?.summary ??
    "Generate or review the next release candidate build.";

  return packagingResultSchema.parse({
    readiness,
    blockerCount,
    warningCount,
    completeCount,
    pendingCount,
    summary,
    recommendedAction
  });
}

export function summarizeBuildArtifacts(build: PackageBuild | null) {
  if (!build) {
    return {
      generatedCount: 0,
      missingCount: 0,
      failedCount: 0
    };
  }

  return {
    generatedCount: build.artifactRefs.filter((artifact) => artifact.status === "generated").length,
    missingCount: build.artifactRefs.filter((artifact) => artifact.status === "missing").length,
    failedCount: build.artifactRefs.filter((artifact) => artifact.status === "failed").length
  };
}

export function summarizePublishReadiness(releases: ReleaseRecord[]) {
  const latestRelease = releases[0] ?? null;
  const publicSafeRelease = releases.find((release) => release.publicSafe) ?? null;

  return {
    latestRelease,
    publicSafeRelease,
    hasReleaseNotes: Boolean(latestRelease?.releaseNotes.length),
    hasMediaChecklist: Boolean(latestRelease?.mediaChecklist.length),
    hasCourseDescription: Boolean(latestRelease?.courseDescription),
    hasCreditsSummary: Boolean(latestRelease?.creditsSummary),
    hasArtifactManifest: Boolean(latestRelease?.artifactManifestRef),
    hasReleaseRecipeLink: Boolean(latestRelease?.releaseRecipeRef),
    creditsComplete: Boolean(latestRelease?.creditsComplete),
    sourceAuditComplete: Boolean(latestRelease?.sourceAuditComplete),
    previewReady: Boolean(latestRelease?.previewReady)
  };
}

export function summarizeReleaseExecutionState(
  project: PackagingProjectLike,
): ReleaseExecutionSummary {
  const latestBuild = getLatestPackageBuild(project.packageBuilds);
  const latestRelease = project.releaseRecords[0] ?? null;
  const previewFlow = summarizePreviewOperationalFlow({
    previewPaths: project.previewPaths,
    flyoverPlans: project.flyoverPlans,
    screenshotPlans: project.screenshotPlans,
    showcaseSequences: project.showcaseSequences,
    holeCount: project.manifest.holeCount,
    latestBuildId: latestBuild?.buildId ?? null
  });
  const issues: ReleaseExecutionIssue[] = [];
  const recipeSteps = latestBuild?.releaseRecipe?.steps ?? [];
  const failedRecipeSteps = recipeSteps.filter((step) => step.status === "failed");
  const toolLinkedStepCount = recipeSteps.filter(
    (step) => step.toolId || step.executedCommand,
  ).length;
  const externalToolStepCount = recipeSteps.filter(
    (step) => step.toolId === "gspro-export-tool" && step.status !== "skipped",
  ).length;
  const managedBridgeOutputs = latestBuild?.artifactRefs.filter(
    (artifact) => artifact.artifactType === "managed-bridge-output",
  ) ?? [];

  if (!latestBuild) {
    issues.push({
      issueId: "release-build-missing",
      severity: "critical",
      ownerModule: "package",
      title: "No release build has been executed yet",
      summary: "Package Center has not produced a build record, so release truth is still theoretical.",
      actionPath: "/package"
    });
  } else {
    if (latestBuild.executionState === "failed") {
      issues.push({
        issueId: "release-build-failed",
        severity: "critical",
        ownerModule: "package",
        title: "Latest release build failed",
        summary: latestBuild.failureReason ?? latestBuild.diagnosticsSummary,
        actionPath: "/package"
      });
    }

    if (latestBuild.runtimeVerificationState === "unavailable") {
      issues.push({
        issueId: "release-runtime-unavailable",
        severity: "critical",
        ownerModule: "settings",
        title: "Host/runtime execution is unavailable",
        summary: "The latest build could not verify native host execution strongly enough to trust release output.",
        actionPath: "/settings"
      });
    } else if (latestBuild.runtimeVerificationState === "degraded") {
      issues.push({
        issueId: "release-runtime-degraded",
        severity: "warning",
        ownerModule: "settings",
        title: "Native/runtime posture is degraded",
        summary: "The latest build ran under degraded native/runtime conditions, which reduces export trust.",
        actionPath: "/settings"
      });
    } else if (latestBuild.runtimeVerificationState === "preview-only") {
      issues.push({
        issueId: "release-runtime-preview-only",
        severity: "warning",
        ownerModule: "settings",
        title: "Latest build only ran in preview mode",
        summary: "Artifacts were generated without verified native runtime support.",
        actionPath: "/settings"
      });
    } else if (latestBuild.runtimeVerificationState === "partially-verified") {
      issues.push({
        issueId: "release-runtime-partial",
        severity: "warning",
        ownerModule: "settings",
        title: "Latest build only has partial host verification",
        summary: "Artifacts exist, but some native host prerequisites are still only partially verified.",
        actionPath: "/settings"
      });
    }

    if (!latestBuild.releaseRecipe) {
      issues.push({
        issueId: "release-recipe-missing",
        severity: "critical",
        ownerModule: "package",
        title: "GSPro release recipe is missing from the latest build",
        summary: "Package execution did not record a recipe definition for the current release run.",
        actionPath: "/package"
      });
    }

    if (failedRecipeSteps.length > 0) {
      issues.push({
        issueId: "release-recipe-step-failed",
        severity: "critical",
        ownerModule: "package",
        title: "Tool-backed GSPro recipe steps failed",
        summary: `${failedRecipeSteps.length} release steps failed in the latest build, including ${failedRecipeSteps[0]?.label}.`,
        actionPath: "/package"
      });
    }

    if (latestBuild.bridgeAdapterId && toolLinkedStepCount === 0) {
      issues.push({
        issueId: "release-tool-evidence-missing",
        severity: "warning",
        ownerModule: "package",
        title: "Managed adapter execution was not captured clearly",
        summary: "The latest build references a managed adapter, but the recipe does not record tool-linked execution steps.",
        actionPath: "/package"
      });
    }

    if (
      latestBuild.executionState === "succeeded" &&
      (latestBuild.executionMode === "repo-backed" || latestBuild.executionMode === "package-owned") &&
      externalToolStepCount === 0
    ) {
      issues.push({
        issueId: "release-external-tool-evidence-missing",
        severity: "warning",
        ownerModule: "settings",
        title: "External GSPro export evidence is still missing",
        summary: "The latest release run completed without recording an external GSPro export tool step, so production-toolchain confidence remains limited.",
        actionPath: "/settings"
      });
    }

    if (latestBuild.bridgeAdapterId && toolLinkedStepCount > 0 && managedBridgeOutputs.length === 0) {
      issues.push({
        issueId: "release-managed-output-missing",
        severity: "warning",
        ownerModule: "package",
        title: "Managed adapter outputs are missing",
        summary: "The latest build recorded tool-backed release steps, but no managed bridge output artifacts were attached to the build record.",
        actionPath: "/package"
      });
    }

    if (
      !latestBuild.artifactRefs.some(
        (artifact) =>
          artifact.artifactType === "creator-handoff" && artifact.status === "generated",
      )
    ) {
      issues.push({
        issueId: "release-handoff-missing",
        severity: "warning",
        ownerModule: "package",
        title: "Creator handoff guide is missing",
        summary: "The latest build did not produce a creator-facing handoff artifact that explains what is ready, stale, or still blocked.",
        actionPath: "/package"
      });
    }

    if (
      !latestBuild.artifactRefs.some(
        (artifact) =>
          artifact.artifactType === "delivery-report" && artifact.status === "generated",
      )
    ) {
      issues.push({
        issueId: "release-delivery-report-missing",
        severity: "warning",
        ownerModule: "package",
        title: "Final delivery summary is missing",
        summary: "The latest build did not produce a final delivery summary artifact that closes the loop from handoff to creator delivery.",
        actionPath: "/package"
      });
    }

    if (latestBuild.runtimeVerificationEvidence.length === 0) {
      issues.push({
        issueId: "release-runtime-evidence-missing",
        severity: "warning",
        ownerModule: "settings",
        title: "Runtime verification evidence is thin",
        summary: "The latest build recorded a runtime state, but no detailed host verification evidence was carried into the build record.",
        actionPath: "/settings"
      });
    }

    const missingCoreReleaseArtifacts = latestBuild.artifactRefs.filter(
      (artifact) =>
        (artifact.artifactType === "gspro-recipe" ||
          artifact.artifactType === "recipe-step-results" ||
          artifact.artifactType === "runtime-report" ||
          artifact.artifactType === "export-log" ||
          artifact.artifactType === "artifact-manifest") &&
        artifact.status !== "generated",
    );

    if (missingCoreReleaseArtifacts.length > 0) {
      issues.push({
        issueId: "release-recipe-artifacts-missing",
        severity: "critical",
        ownerModule: "package",
        title: "Core GSPro release artifacts are missing",
        summary: `${missingCoreReleaseArtifacts.length} recipe, runtime, log, or manifest artifacts are still missing from the latest build.`,
        actionPath: "/package"
      });
    }
  }

  for (const issue of previewFlow.issues) {
    if (issue.issueId === "preview-build-output-stale" || issue.issueId === "preview-build-output-mismatch") {
      issues.push({
        issueId: issue.issueId,
        severity: issue.severity,
        ownerModule: "preview",
        title: issue.title,
        summary: issue.summary,
        actionPath: "/preview"
      });
    }
  }

  const missingArtifactCount = latestBuild
    ? latestBuild.artifactRefs.filter((artifact) => artifact.status !== "generated").length
    : 0;
  if (latestBuild && missingArtifactCount > 0) {
    issues.push({
      issueId: "release-artifacts-missing",
      severity: "critical",
      ownerModule: "package",
      title: "Generated artifact set is incomplete",
      summary: `${missingArtifactCount} artifacts are missing or failed for the latest build.`,
      actionPath: "/package"
    });
  }

  if (!latestRelease) {
    issues.push({
      issueId: "release-record-missing",
      severity: "warning",
      ownerModule: "publish",
      title: "No release record is linked yet",
      summary: "Publish still needs a release record tied to the latest build truth.",
      actionPath: "/publish"
    });
  } else {
    if (latestBuild && latestRelease.packageBuildRef !== latestBuild.buildId) {
      issues.push({
        issueId: "release-build-mismatch",
        severity: "warning",
        ownerModule: "publish",
        title: "Latest release record points at an older build",
        summary: "Publish metadata is out of sync with the newest package execution.",
        actionPath: "/publish"
      });
    }

    if (latestBuild?.releaseRecipe && latestRelease.releaseRecipeRef !== latestBuild.releaseRecipe.recipeId) {
      issues.push({
        issueId: "release-recipe-mismatch",
        severity: "warning",
        ownerModule: "publish",
        title: "Release draft points at an older or missing recipe",
        summary: "Publish metadata is not linked to the latest GSPro release recipe execution.",
        actionPath: "/publish"
      });
    }

    if (!latestRelease.artifactManifestRef) {
      issues.push({
        issueId: "release-manifest-missing",
        severity: "warning",
        ownerModule: "publish",
        title: "Artifact manifest linkage is missing",
        summary: "The current release draft does not point to an artifact manifest for audit and handoff.",
        actionPath: "/publish"
      });
    }

    if (!latestRelease.previewReady) {
      issues.push({
        issueId: "release-preview-missing",
        severity: "warning",
        ownerModule: "preview",
        title: "Preview outputs are not fully linked to the release draft",
        summary: "Preview media is not yet trusted as part of the current release draft.",
        actionPath: "/preview"
      });
    }

    if (!latestRelease.creditsComplete || !latestRelease.sourceAuditComplete) {
      issues.push({
        issueId: "release-credits-incomplete",
        severity: "warning",
        ownerModule: "publish",
        title: "Credits or source audit is incomplete",
        summary: "Publish metadata still needs stronger credits/source coverage before release confidence is high.",
        actionPath: "/publish"
      });
    }
  }

  const blockerCount = issues.filter((issue) => issue.severity === "critical").length;
  const overallReadiness =
    blockerCount > 0 ? "blocked" : issues.length > 0 ? "watch" : "ready";
  const retryRecommended =
    Boolean(
      latestBuild &&
        latestBuild.runtimeVerificationState !== "unavailable" &&
        (
          latestBuild.executionState === "failed" ||
          failedRecipeSteps.length > 0 ||
          missingArtifactCount > 0 ||
          issues.some((issue) =>
            issue.issueId === "release-managed-output-missing" ||
            issue.issueId === "preview-build-output-mismatch" ||
            issue.issueId === "preview-build-output-stale",
          )
        ),
    );
  const remediationActions: ReleaseRemediationAction[] = [];

  if (retryRecommended) {
    remediationActions.push({
      actionId: "retry-latest-release-run",
      severity: blockerCount > 0 ? "critical" : "warning",
      ownerModule: "package",
      label: "Retry the latest release run after fixing the top blocker",
      actionPath: "/package"
    });
  }

  const seenActions = new Set(remediationActions.map((action) => action.actionPath));
  for (const issue of issues) {
    const actionKey = `${issue.actionPath}:${issue.title}`;
    if (seenActions.has(actionKey)) {
      continue;
    }

    seenActions.add(actionKey);
    remediationActions.push({
      actionId: `action-${issue.issueId}`,
      severity: issue.severity,
      ownerModule: issue.ownerModule,
      label: issue.title,
      actionPath: issue.actionPath
    });

    if (remediationActions.length >= 5) {
      break;
    }
  }

  return {
    overallReadiness,
    latestBuild,
    latestRelease,
    executionMode: latestBuild?.executionMode ?? "unconfigured",
    missingArtifactCount,
    failedStepCount: failedRecipeSteps.length,
    toolLinkedStepCount,
    externalToolStepCount,
    managedOutputCount: managedBridgeOutputs.length,
    retryRecommended,
    issues,
    remediationActions,
    nextAction:
      issues[0]?.summary ??
      "Release execution state is aligned closely enough across Package, Preview, and Publish."
  };
}

export function summarizeCreatorDeliveryFlow(
  project: PackagingProjectLike,
): CreatorDeliverySummary {
  const latestBuild = getLatestPackageBuild(project.packageBuilds);
  const latestRelease = project.releaseRecords[0] ?? null;
  const previewFlow = summarizePreviewOperationalFlow({
    previewPaths: project.previewPaths,
    flyoverPlans: project.flyoverPlans,
    screenshotPlans: project.screenshotPlans,
    showcaseSequences: project.showcaseSequences,
    holeCount: project.manifest.holeCount,
    latestBuildId: latestBuild?.buildId ?? null
  });
  const issues: CreatorDeliveryIssue[] = [];
  const generatedArtifacts = latestBuild?.artifactRefs.filter((artifact) => artifact.status === "generated") ?? [];
  const deliveryArtifacts = generatedArtifacts.filter((artifact) =>
    artifact.artifactType === "course-package" ||
    artifact.artifactType === "artifact-manifest" ||
    artifact.artifactType === "publish-record" ||
    artifact.artifactType === "creator-handoff" ||
    artifact.artifactType === "delivery-report" ||
    artifact.artifactType === "presentation-share-packet" ||
    artifact.artifactType === "release-notes" ||
    artifact.artifactType === "preview-media" ||
    artifact.artifactType === "compatibility-report" ||
    artifact.artifactType === "runtime-report" ||
    artifact.artifactType === "export-log" ||
    artifact.artifactType === "managed-bridge-output",
  );
  const missingArtifactCount = latestBuild
    ? latestBuild.artifactRefs.filter((artifact) => artifact.status !== "generated").length
    : 0;
  const releaseDraftAligned = Boolean(
    latestBuild && latestRelease && latestRelease.packageBuildRef === latestBuild.buildId,
  );

  if (!latestBuild) {
    issues.push({
      issueId: "delivery-build-missing",
      severity: "critical",
      ownerModule: "package",
      title: "No completed release build exists yet",
      summary: "Creator delivery cannot start until Package records a release run with durable outputs.",
      actionPath: "/package"
    });
  } else {
    if (latestBuild.executionState !== "succeeded") {
      issues.push({
        issueId: "delivery-build-incomplete",
        severity: "critical",
        ownerModule: "package",
        title: "Latest release build did not complete cleanly",
        summary: latestBuild.failureReason ?? latestBuild.diagnosticsSummary,
        actionPath: "/package"
      });
    }

    if (!generatedArtifacts.some((artifact) => artifact.artifactType === "course-package")) {
      issues.push({
        issueId: "delivery-package-missing",
        severity: "critical",
        ownerModule: "package",
        title: "Course package output is missing",
        summary: "The latest release run does not include a generated course package artifact for creator delivery.",
        actionPath: "/package"
      });
    }

    if (!generatedArtifacts.some((artifact) => artifact.artifactType === "artifact-manifest")) {
      issues.push({
        issueId: "delivery-manifest-missing",
        severity: "critical",
        ownerModule: "package",
        title: "Artifact manifest is missing",
        summary: "Creators do not yet have a durable artifact index for the latest release run.",
        actionPath: "/package"
      });
    }

    if (!generatedArtifacts.some((artifact) => artifact.artifactType === "creator-handoff")) {
      issues.push({
        issueId: "delivery-handoff-missing",
        severity: "warning",
        ownerModule: "package",
        title: "Creator handoff guide is missing",
        summary: "The latest release run does not include a creator-facing handoff guide for final inspection and delivery.",
        actionPath: "/package"
      });
    }

    if (!generatedArtifacts.some((artifact) => artifact.artifactType === "delivery-report")) {
      issues.push({
        issueId: "delivery-report-missing",
        severity: "warning",
        ownerModule: "package",
        title: "Final delivery summary is missing",
        summary: "The latest release run does not include a final delivery summary artifact for creators to verify before final handoff.",
        actionPath: "/package"
      });
    }
  }

  if (!latestRelease) {
    issues.push({
      issueId: "delivery-release-draft-missing",
      severity: "warning",
      ownerModule: "publish",
      title: "Release draft is missing",
      summary: "Publish still needs a release draft linked to the latest build before delivery posture is trustworthy.",
      actionPath: "/publish"
    });
  } else {
    if (!releaseDraftAligned) {
      issues.push({
        issueId: "delivery-release-draft-stale",
        severity: "warning",
        ownerModule: "publish",
        title: "Release draft is stale against the latest build",
        summary: "The publish draft still points at an older build or has not been refreshed from the latest release run.",
        actionPath: "/publish"
      });
    }

    if (!latestRelease.previewReady) {
      issues.push({
        issueId: "delivery-preview-dependency-missing",
        severity: "warning",
        ownerModule: "preview",
        title: "Preview deliverables are not fully trusted yet",
        summary: "Preview output readiness is still weaker than the latest release draft expects.",
        actionPath: "/preview"
      });
    }

    if (!latestRelease.creditsComplete || !latestRelease.sourceAuditComplete) {
      issues.push({
        issueId: "delivery-credits-incomplete",
        severity: "warning",
        ownerModule: "publish",
        title: "Credits or source data is incomplete",
        summary: "Delivery confidence stays limited until publish-side credits and source audits are complete.",
        actionPath: "/publish"
      });
    }
  }

  if (previewFlow.staleOutputCount > 0) {
    issues.push({
      issueId: "delivery-preview-stale",
      severity: "warning",
      ownerModule: "preview",
      title: "Preview outputs are stale against the latest build",
      summary: `${previewFlow.staleOutputCount} preview outputs still point at an older build.`,
      actionPath: "/preview"
    });
  }

  if (previewFlow.missingOutputCount > 0 || previewFlow.failedOutputCount > 0) {
    issues.push({
      issueId: "delivery-preview-missing",
      severity: "critical",
      ownerModule: "preview",
      title: "Preview delivery outputs are missing or failed",
      summary: `${previewFlow.missingOutputCount} preview outputs are missing and ${previewFlow.failedOutputCount} failed for the current release path.`,
      actionPath: "/preview"
    });
  }

  const blockerCount = issues.filter((issue) => issue.severity === "critical").length;
  const overallReadiness =
    blockerCount > 0 ? "blocked" : issues.length > 0 ? "watch" : "ready";

  return {
    overallReadiness,
    latestBuildId: latestBuild?.buildId ?? null,
    latestReleaseId: latestRelease?.releaseId ?? null,
    deliveryReady: overallReadiness === "ready",
    generatedArtifactCount: generatedArtifacts.length,
    deliveryArtifactCount: deliveryArtifacts.length,
    missingArtifactCount,
    previewLinkedOutputCount: previewFlow.buildLinkedOutputCount,
    staleOutputCount: previewFlow.staleOutputCount,
    missingOutputCount: previewFlow.missingOutputCount,
    failedOutputCount: previewFlow.failedOutputCount,
    releaseDraftAligned,
    issues,
    nextAction:
      issues[0]?.summary ??
      "Build outputs, preview media, and publish draft posture are aligned closely enough for creator delivery."
  };
}

export function summarizeCreatorReleaseHandoff(
  project: PackagingProjectLike,
): CreatorReleaseHandoffSummary {
  const latestBuild = getLatestPackageBuild(project.packageBuilds);
  const latestRelease = project.releaseRecords[0] ?? null;
  const creatorDelivery = summarizeCreatorDeliveryFlow(project);
  const releaseExecution = summarizeReleaseExecutionState(project);
  const previewFlow = summarizePreviewOperationalFlow({
    previewPaths: project.previewPaths,
    flyoverPlans: project.flyoverPlans,
    screenshotPlans: project.screenshotPlans,
    showcaseSequences: project.showcaseSequences,
    holeCount: project.manifest.holeCount,
    latestBuildId: latestBuild?.buildId ?? null
  });
  const handoffArtifacts =
    latestBuild?.artifactRefs
      .filter(
        (artifact) =>
          artifact.status === "generated" &&
          (
            artifact.artifactType === "course-package" ||
            artifact.artifactType === "artifact-manifest" ||
            artifact.artifactType === "publish-record" ||
            artifact.artifactType === "creator-handoff" ||
            artifact.artifactType === "presentation-share-packet" ||
            artifact.artifactType === "release-notes" ||
            artifact.artifactType === "preview-media" ||
            artifact.artifactType === "compatibility-report" ||
            artifact.artifactType === "runtime-report" ||
            artifact.artifactType === "export-log" ||
            artifact.artifactType === "managed-bridge-output"
          ),
      )
      .map((artifact) => ({
        artifactId: artifact.artifactId,
        label: artifact.label,
        artifactType: artifact.artifactType,
        relativePath: artifact.relativePath,
        status: artifact.status,
        generatedAt: artifact.generatedAt,
        note: artifact.note
      })) ?? [];
  const missingHandoffCount = latestBuild
    ? [
        !latestBuild.artifactRefs.some(
          (artifact) =>
            artifact.artifactType === "course-package" && artifact.status === "generated",
        ),
        !latestBuild.artifactRefs.some(
          (artifact) =>
            artifact.artifactType === "artifact-manifest" && artifact.status === "generated",
        ),
        !latestBuild.artifactRefs.some(
          (artifact) =>
            artifact.artifactType === "publish-record" && artifact.status === "generated",
        ),
        !latestBuild.artifactRefs.some(
          (artifact) =>
            artifact.artifactType === "creator-handoff" && artifact.status === "generated",
        )
      ].filter(Boolean).length
    : 4;
  const nextActions = [
    creatorDelivery.nextAction,
    ...releaseExecution.remediationActions.slice(0, 3).map((action) => action.label),
    creatorDelivery.releaseDraftAligned
      ? "Inspect the latest delivery artifacts before final creator handoff."
      : "Refresh the release draft so Publish matches the latest build before handoff."
  ].filter((value, index, items) => value && items.indexOf(value) === index);

  return {
    overallReadiness: creatorDelivery.overallReadiness,
    handoffReady:
      creatorDelivery.deliveryReady &&
      releaseExecution.overallReadiness !== "blocked" &&
      missingHandoffCount === 0,
    latestBuildId: creatorDelivery.latestBuildId,
    latestReleaseId: creatorDelivery.latestReleaseId,
    executionMode: releaseExecution.executionMode,
    completedReleaseRun: latestBuild?.executionState === "succeeded",
    artifactManifestLinked: Boolean(latestRelease?.artifactManifestRef),
    releaseDraftAligned: creatorDelivery.releaseDraftAligned,
    previewFresh:
      previewFlow.staleOutputCount === 0 &&
      previewFlow.missingOutputCount === 0 &&
      previewFlow.failedOutputCount === 0,
    externalToolEvidenceCount: releaseExecution.externalToolStepCount,
    handoffArtifactCount: handoffArtifacts.length,
    missingHandoffCount,
    handoffArtifacts: handoffArtifacts.slice(0, 8),
    issues: creatorDelivery.issues,
    nextActions
  };
}

export function summarizeFinalCreatorDelivery(
  project: PackagingProjectLike,
): FinalCreatorDeliverySummary {
  const latestBuild = getLatestPackageBuild(project.packageBuilds);
  const latestRelease = project.releaseRecords[0] ?? null;
  const creatorDelivery = summarizeCreatorDeliveryFlow(project);
  const releaseHandoff = summarizeCreatorReleaseHandoff(project);
  const releaseExecution = summarizeReleaseExecutionState(project);
  const previewFlow = summarizePreviewOperationalFlow({
    previewPaths: project.previewPaths,
    flyoverPlans: project.flyoverPlans,
    screenshotPlans: project.screenshotPlans,
    showcaseSequences: project.showcaseSequences,
    holeCount: project.manifest.holeCount,
    latestBuildId: latestBuild?.buildId ?? null
  });
  const deliveryArtifacts =
    latestBuild?.artifactRefs
      .filter(
        (artifact) =>
          artifact.status === "generated" &&
          (
            artifact.artifactType === "course-package" ||
            artifact.artifactType === "artifact-manifest" ||
            artifact.artifactType === "publish-record" ||
            artifact.artifactType === "creator-handoff" ||
            artifact.artifactType === "delivery-report" ||
            artifact.artifactType === "presentation-share-packet" ||
            artifact.artifactType === "release-notes" ||
            artifact.artifactType === "preview-media" ||
            artifact.artifactType === "compatibility-report" ||
            artifact.artifactType === "runtime-report" ||
            artifact.artifactType === "export-log" ||
            artifact.artifactType === "managed-bridge-output"
          ),
      )
      .map((artifact) => ({
        artifactId: artifact.artifactId,
        label: artifact.label,
        artifactType: artifact.artifactType,
        relativePath: artifact.relativePath,
        status: artifact.status,
        generatedAt: artifact.generatedAt,
        note: artifact.note
      })) ?? [];
  const missingDeliveryArtifactCount = latestBuild
    ? [
        !latestBuild.artifactRefs.some(
          (artifact) =>
            artifact.artifactType === "course-package" && artifact.status === "generated",
        ),
        !latestBuild.artifactRefs.some(
          (artifact) =>
            artifact.artifactType === "artifact-manifest" && artifact.status === "generated",
        ),
        !latestBuild.artifactRefs.some(
          (artifact) =>
            artifact.artifactType === "publish-record" && artifact.status === "generated",
        ),
        !latestBuild.artifactRefs.some(
          (artifact) =>
            artifact.artifactType === "creator-handoff" && artifact.status === "generated",
        ),
        !latestBuild.artifactRefs.some(
          (artifact) =>
            artifact.artifactType === "delivery-report" && artifact.status === "generated",
        )
      ].filter(Boolean).length
    : 5;
  const nextActions = [
    ...releaseHandoff.nextActions,
    ...releaseExecution.remediationActions.slice(0, 3).map((action) => action.label),
    previewFlow.staleOutputCount > 0
      ? "Refresh stale preview outputs before final creator delivery."
      : "Inspect the final delivery summary and creator handoff guide before final delivery."
  ].filter((value, index, items) => value && items.indexOf(value) === index);

  return {
    overallReadiness:
      creatorDelivery.overallReadiness === "blocked" || releaseExecution.overallReadiness === "blocked"
        ? "blocked"
        : creatorDelivery.overallReadiness === "watch" || releaseHandoff.overallReadiness === "watch"
          ? "watch"
          : "ready",
    deliveryReady:
      creatorDelivery.deliveryReady &&
      releaseHandoff.handoffReady &&
      releaseExecution.overallReadiness !== "blocked" &&
      missingDeliveryArtifactCount === 0 &&
      previewFlow.staleOutputCount === 0 &&
      previewFlow.missingOutputCount === 0 &&
      previewFlow.failedOutputCount === 0,
    latestBuildId: creatorDelivery.latestBuildId,
    latestReleaseId: creatorDelivery.latestReleaseId,
    executionMode: releaseExecution.executionMode,
    handoffReady: releaseHandoff.handoffReady,
    finalDeliveryAutomated: latestBuild?.artifactRefs.some(
      (artifact) => artifact.artifactType === "delivery-report" && artifact.status === "generated",
    ) ?? false,
    previewFresh:
      previewFlow.staleOutputCount === 0 &&
      previewFlow.missingOutputCount === 0 &&
      previewFlow.failedOutputCount === 0,
    publishDraftAligned: Boolean(
      latestBuild && latestRelease && latestRelease.packageBuildRef === latestBuild.buildId,
    ),
    externalToolEvidenceCount: releaseExecution.externalToolStepCount,
    deliveryArtifactCount: deliveryArtifacts.length,
    missingDeliveryArtifactCount,
    deliveryArtifacts: deliveryArtifacts.slice(0, 10),
    issues: creatorDelivery.issues,
    nextActions
  };
}

export function summarizeShareReadyPresentationHandoff(input: {
  releaseHandoff: CreatorReleaseHandoffSummary;
  finalDelivery: FinalCreatorDeliverySummary;
  cameraPlayback: ShareReadyPresentationSignal;
  landmarkActions: ShareReadyPresentationSignal;
  finalPresentation: ShareReadyPresentationSignal;
}): ShareReadyPresentationHandoffSummary {
  const previewArtifactCount = input.releaseHandoff.handoffArtifacts.filter(
    (artifact) =>
      artifact.artifactType === "preview-media" ||
      artifact.artifactType === "creator-handoff" ||
      artifact.artifactType === "release-notes",
  ).length;
  const expectedPresentationArtifactTypes: Array<CreatorReleaseHandoffArtifact["artifactType"]> = [
    "preview-media",
    "creator-handoff",
    "release-notes"
  ];
  const missingPresentationAssetCount = expectedPresentationArtifactTypes.filter(
    (artifactType) =>
      !input.releaseHandoff.handoffArtifacts.some((artifact) => artifact.artifactType === artifactType),
  ).length;
  const issues: CreatorDeliveryIssue[] = [];

  if (!input.releaseHandoff.handoffReady) {
    issues.push({
      issueId: "share-ready-handoff-incomplete",
      severity: input.releaseHandoff.overallReadiness === "blocked" ? "critical" : "warning",
      ownerModule: "package",
      title: "Presentation handoff is not aligned to the latest release run",
      summary: input.releaseHandoff.nextActions[0] ?? "Creator handoff still needs stronger package and preview alignment.",
      actionPath: "/package"
    });
  }

  if (!input.finalDelivery.deliveryReady) {
    issues.push({
      issueId: "share-ready-delivery-incomplete",
      severity: input.finalDelivery.overallReadiness === "blocked" ? "critical" : "warning",
      ownerModule: "publish",
      title: "Final delivery posture is not share-ready yet",
      summary: input.finalDelivery.nextActions[0] ?? "Final delivery still needs stronger publish and artifact alignment.",
      actionPath: "/publish"
    });
  }

  if (input.cameraPlayback.overallState === "rough" || (input.cameraPlayback.abruptHoleCount ?? 0) > 0) {
    issues.push({
      issueId: "share-ready-camera-playback-rough",
      severity: "critical",
      ownerModule: "preview",
      title: "Camera playback still has abrupt or weak presentation segments",
      summary: input.cameraPlayback.recommendedAction,
      actionPath: "/preview"
    });
  } else if (input.cameraPlayback.overallState === "watch") {
    issues.push({
      issueId: "share-ready-camera-playback-watch",
      severity: "warning",
      ownerModule: "preview",
      title: "Camera playback still needs polish before sharing",
      summary: input.cameraPlayback.recommendedAction,
      actionPath: "/preview"
    });
  }

  if (input.landmarkActions.overallState === "rough") {
    issues.push({
      issueId: "share-ready-landmark-corrections-rough",
      severity: "critical",
      ownerModule: "preview",
      title: "Landmark correction still blocks share-ready readability",
      summary: input.landmarkActions.recommendedAction,
      actionPath: "/build"
    });
  } else if (input.landmarkActions.overallState === "watch") {
    issues.push({
      issueId: "share-ready-landmark-corrections-watch",
      severity: "warning",
      ownerModule: "preview",
      title: "Landmark correction still needs one more cleanup pass",
      summary: input.landmarkActions.recommendedAction,
      actionPath: "/build"
    });
  }

  if (input.finalPresentation.overallState === "rough") {
    issues.push({
      issueId: "share-ready-presentation-rough",
      severity: "critical",
      ownerModule: "preview",
      title: "Final presentation confidence is still rough",
      summary: input.finalPresentation.recommendedAction,
      actionPath: "/preview"
    });
  } else if (input.finalPresentation.overallState === "watch") {
    issues.push({
      issueId: "share-ready-presentation-watch",
      severity: "warning",
      ownerModule: "preview",
      title: "Final presentation still needs polish before sharing",
      summary: input.finalPresentation.recommendedAction,
      actionPath: "/preview"
    });
  }

  if (missingPresentationAssetCount > 0) {
    issues.push({
      issueId: "share-ready-presentation-assets-missing",
      severity: "warning",
      ownerModule: "package",
      title: "Share-ready presentation assets are incomplete",
      summary: `${missingPresentationAssetCount} core presentation artifacts are still missing from the current handoff set.`,
      actionPath: "/package"
    });
  }

  const blockerCount = issues.filter((issue) => issue.severity === "critical").length;
  const overallReadiness =
    blockerCount > 0 ? "blocked" : issues.length > 0 ? "watch" : "ready";

  return {
    overallReadiness,
    shareReady: overallReadiness === "ready",
    previewAssetCount: previewArtifactCount,
    missingPresentationAssetCount,
    blockedHoleCount:
      Math.max(
        input.cameraPlayback.abruptHoleCount ?? 0,
        input.landmarkActions.blockedHoleCount ?? 0,
        input.finalPresentation.blockedHoleCount ?? 0,
      ),
    polishGapHoleCount:
      Math.max(
        input.cameraPlayback.polishGapHoleCount ?? 0,
        input.landmarkActions.correctiveHoleCount ?? 0,
        input.finalPresentation.presentationGapHoleCount ?? 0,
      ),
    handoffAligned: input.releaseHandoff.handoffReady && input.finalDelivery.deliveryReady,
    issues,
    nextActions: [
      issues[0]?.summary,
      input.cameraPlayback.recommendedAction,
      input.landmarkActions.recommendedAction,
      input.finalPresentation.recommendedAction,
      input.releaseHandoff.nextActions[0],
      input.finalDelivery.nextActions[0]
    ].filter((value, index, items): value is string => Boolean(value) && items.indexOf(value) === index)
  };
}

export function summarizePresentationSharePacketFinalization(input: {
  releaseExecution: ReleaseExecutionSummary;
  releaseHandoff: CreatorReleaseHandoffSummary;
  finalDelivery: FinalCreatorDeliverySummary;
  shareReadyPresentation: ShareReadyPresentationHandoffSummary;
}): PresentationSharePacketFinalizationSummary {
  const latestBuild = input.releaseExecution.latestBuild;
  const generatedArtifacts = latestBuild?.artifactRefs.filter((artifact) => artifact.status === "generated") ?? [];
  const requiredArtifactTypes: Array<CreatorReleaseHandoffArtifact["artifactType"]> = [
    "preview-media",
    "creator-handoff",
    "release-notes",
    "delivery-report",
    "presentation-share-packet"
  ];
  const includedArtifacts = generatedArtifacts.filter((artifact) =>
    requiredArtifactTypes.includes(artifact.artifactType),
  );
  const packetArtifact =
    includedArtifacts.find((artifact) => artifact.artifactType === "presentation-share-packet") ?? null;
  const missingPacketRequirementCount = requiredArtifactTypes.filter(
    (artifactType) => !includedArtifacts.some((artifact) => artifact.artifactType === artifactType),
  ).length;
  const issues: CreatorDeliveryIssue[] = [];

  if (!input.shareReadyPresentation.shareReady) {
    issues.push({
      issueId: "presentation-share-packet-share-ready-blocked",
      severity: input.shareReadyPresentation.overallReadiness === "blocked" ? "critical" : "warning",
      ownerModule: "preview",
      title: "Presentation posture still blocks the final share packet",
      summary:
        input.shareReadyPresentation.nextActions[0] ??
        "Polish gaps still reduce confidence in the final presentation packet.",
      actionPath: "/preview"
    });
  }

  if (!input.finalDelivery.deliveryReady) {
    issues.push({
      issueId: "presentation-share-packet-delivery-incomplete",
      severity: input.finalDelivery.overallReadiness === "blocked" ? "critical" : "warning",
      ownerModule: "publish",
      title: "Final delivery posture is not ready for a share packet",
      summary:
        input.finalDelivery.nextActions[0] ??
        "Delivery alignment still needs one more pass before the packet is trustworthy.",
      actionPath: "/publish"
    });
  }

  if (!packetArtifact) {
    issues.push({
      issueId: "presentation-share-packet-missing",
      severity: latestBuild?.executionState === "succeeded" ? "warning" : "critical",
      ownerModule: "package",
      title: "Presentation share packet artifact is missing",
      summary:
        latestBuild
          ? "Rerun packaging so the final presentation packet is generated beside the current release artifacts."
          : "No completed release build exists yet, so the presentation packet cannot be generated.",
      actionPath: "/package"
    });
  }

  if (missingPacketRequirementCount > 0) {
    issues.push({
      issueId: "presentation-share-packet-assets-missing",
      severity: missingPacketRequirementCount > 2 ? "critical" : "warning",
      ownerModule: "package",
      title: "The presentation share packet is missing core support artifacts",
      summary: `${missingPacketRequirementCount} required packet artifacts are still missing from the latest generated set.`,
      actionPath: "/package"
    });
  }

  const blockerCount = issues.filter((issue) => issue.severity === "critical").length;
  const overallReadiness =
    blockerCount > 0 ? "blocked" : issues.length > 0 ? "watch" : "ready";

  return {
    overallReadiness,
    packetReady: overallReadiness === "ready",
    packetGenerated: Boolean(packetArtifact),
    packetArtifactPath: packetArtifact?.relativePath ?? null,
    includedArtifactCount: includedArtifacts.length,
    shareableAssetCount: includedArtifacts.filter((artifact) => artifact.artifactType !== "presentation-share-packet").length,
    missingPacketRequirementCount,
    blockedHoleCount: input.shareReadyPresentation.blockedHoleCount,
    polishGapHoleCount: input.shareReadyPresentation.polishGapHoleCount,
    issues,
    nextActions: [
      issues[0]?.summary,
      input.shareReadyPresentation.nextActions[0],
      input.releaseHandoff.nextActions[0],
      input.finalDelivery.nextActions[0]
    ].filter((value, index, items): value is string => Boolean(value) && items.indexOf(value) === index)
  };
}

export function summarizePresentationPacketProofing(input: {
  releaseHandoff: CreatorReleaseHandoffSummary;
  finalDelivery: FinalCreatorDeliverySummary;
  shareReadyPresentation: ShareReadyPresentationHandoffSummary;
  presentationSharePacket: PresentationSharePacketFinalizationSummary;
  shotOrderApproval: ShareReadyPresentationSignal;
  corridorSupportKits: ShareReadyPresentationSignal;
}): PresentationPacketProofingSummary {
  const issues: CreatorDeliveryIssue[] = [];

  if (!input.presentationSharePacket.packetReady) {
    issues.push({
      issueId: "presentation-packet-proofing-packet-incomplete",
      severity: input.presentationSharePacket.overallReadiness === "blocked" ? "critical" : "warning",
      ownerModule: "package",
      title: "Presentation packet still needs proofing support",
      summary:
        input.presentationSharePacket.nextActions[0] ??
        "The packet still needs one more pass before creators can trust it for final share.",
      actionPath: "/package"
    });
  }

  if (input.shotOrderApproval.overallState === "rough") {
    issues.push({
      issueId: "presentation-packet-proofing-shot-order-rough",
      severity: "critical",
      ownerModule: "preview",
      title: "Shot order approval still blocks packet proofing",
      summary: input.shotOrderApproval.recommendedAction,
      actionPath: "/preview"
    });
  } else if (input.shotOrderApproval.overallState === "watch") {
    issues.push({
      issueId: "presentation-packet-proofing-shot-order-watch",
      severity: "warning",
      ownerModule: "preview",
      title: "Shot order approval still needs one more proofing pass",
      summary: input.shotOrderApproval.recommendedAction,
      actionPath: "/preview"
    });
  }

  if (input.corridorSupportKits.overallState === "rough") {
    issues.push({
      issueId: "presentation-packet-proofing-corridor-kits-rough",
      severity: "critical",
      ownerModule: "preview",
      title: "Landmark corridor support still blocks packet proofing",
      summary: input.corridorSupportKits.recommendedAction,
      actionPath: "/build"
    });
  } else if (input.corridorSupportKits.overallState === "watch") {
    issues.push({
      issueId: "presentation-packet-proofing-corridor-kits-watch",
      severity: "warning",
      ownerModule: "preview",
      title: "Landmark corridor support still needs one more proofing pass",
      summary: input.corridorSupportKits.recommendedAction,
      actionPath: "/build"
    });
  }

  if (!input.shareReadyPresentation.shareReady || !input.finalDelivery.deliveryReady || !input.releaseHandoff.handoffReady) {
    issues.push({
      issueId: "presentation-packet-proofing-alignment-watch",
      severity:
        input.finalDelivery.overallReadiness === "blocked" || input.shareReadyPresentation.overallReadiness === "blocked"
          ? "critical"
          : "warning",
      ownerModule: "publish",
      title: "Preview, package, and publish still need one more proofing alignment pass",
      summary:
        input.finalDelivery.nextActions[0] ??
        input.shareReadyPresentation.nextActions[0] ??
        input.releaseHandoff.nextActions[0] ??
        "Proof the current packet against the latest preview and publish posture before sharing.",
      actionPath: "/publish"
    });
  }

  const blockerCount = issues.filter((issue) => issue.severity === "critical").length;
  const overallReadiness = blockerCount > 0 ? "blocked" : issues.length > 0 ? "watch" : "ready";
  const alignmentState: PresentationPacketProofingSummary["alignmentState"] =
    !input.releaseHandoff.handoffReady || !input.finalDelivery.deliveryReady
      ? "blocked"
      : !input.shareReadyPresentation.handoffAligned || !input.presentationSharePacket.packetGenerated
        ? "watch"
        : "aligned";
  const assetCoverageState: PresentationPacketProofingSummary["assetCoverageState"] =
    input.presentationSharePacket.shareableAssetCount === 0
      ? "blocked"
      : input.presentationSharePacket.missingPacketRequirementCount > 0
        ? "watch"
        : "ready";
  const sequenceConfidenceState: PresentationPacketProofingSummary["sequenceConfidenceState"] =
    input.shotOrderApproval.overallState === "rough"
      ? "blocked"
      : input.shotOrderApproval.overallState === "watch"
        ? "watch"
        : "ready";
  const corridorSupportState: PresentationPacketProofingSummary["corridorSupportState"] =
    input.corridorSupportKits.overallState === "rough"
      ? "blocked"
      : input.corridorSupportKits.overallState === "watch"
        ? "watch"
        : "ready";
  const proofedReady =
    overallReadiness === "ready" &&
    alignmentState === "aligned" &&
    assetCoverageState === "ready" &&
    sequenceConfidenceState === "ready" &&
    corridorSupportState === "ready";

  return {
    overallReadiness,
    proofedReady,
    packetReady: input.presentationSharePacket.packetReady,
    packetGenerated: input.presentationSharePacket.packetGenerated,
    alignmentState,
    assetCoverageState,
    sequenceConfidenceState,
    corridorSupportState,
    proofingGapCount:
      input.presentationSharePacket.missingPacketRequirementCount +
      (input.shotOrderApproval.polishGapHoleCount ?? input.shotOrderApproval.presentationGapHoleCount ?? 0) +
      (input.corridorSupportKits.correctiveHoleCount ?? input.corridorSupportKits.presentationGapHoleCount ?? 0),
    blockedHoleCount: Math.max(
      input.presentationSharePacket.blockedHoleCount,
      input.shotOrderApproval.blockedHoleCount ?? 0,
      input.corridorSupportKits.blockedHoleCount ?? 0,
    ),
    issues,
    nextActions: [
      issues[0]?.summary,
      input.shotOrderApproval.recommendedAction,
      input.corridorSupportKits.recommendedAction,
      input.presentationSharePacket.nextActions[0],
      input.shareReadyPresentation.nextActions[0],
      input.finalDelivery.nextActions[0],
      input.releaseHandoff.nextActions[0],
    ].filter((value, index, items): value is string => Boolean(value) && items.indexOf(value) === index),
  };
}

export function summarizePresentationShareDeliveryConfidence(input: {
  creatorDelivery: CreatorDeliverySummary;
  releaseHandoff: CreatorReleaseHandoffSummary;
  finalDelivery: FinalCreatorDeliverySummary;
  shareReadyPresentation: ShareReadyPresentationHandoffSummary;
  presentationSharePacket: PresentationSharePacketFinalizationSummary;
  presentationPacketProofing: PresentationPacketProofingSummary;
  cameraCapture: ShareReadyPresentationSignal;
  landmarkCorridors: ShareReadyPresentationSignal;
  cameraSequencing: ShareReadyPresentationSignal;
  landmarkStaging: ShareReadyPresentationSignal;
  shotOrderApproval: ShareReadyPresentationSignal;
  shotVariantSets: ShareReadyPresentationSignal;
  variantShippingDecisions: ShareReadyPresentationSignal;
  variantShippingManifest: ShareReadyPresentationSignal;
  corridorSupportKits: ShareReadyPresentationSignal;
  corridorKitComposition: ShareReadyPresentationSignal;
  corridorBundleLibraries: ShareReadyPresentationSignal;
  corridorBundleRecommendations: ShareReadyPresentationSignal;
  cleanupReplayTimeline: ShareReadyPresentationSignal;
}): PresentationShareDeliveryConfidenceSummary {
  const issues: CreatorDeliveryIssue[] = [];

  if (!input.presentationSharePacket.packetReady) {
    issues.push({
      issueId: "presentation-share-delivery-packet-incomplete",
      severity: input.presentationSharePacket.overallReadiness === "blocked" ? "critical" : "warning",
      ownerModule: "package",
      title: "Presentation share packet is not complete enough to deliver",
      summary:
        input.presentationSharePacket.nextActions[0] ??
        "The share packet still needs more asset or polish support before delivery.",
      actionPath: "/package",
    });
  }

  if (!input.shareReadyPresentation.shareReady) {
    issues.push({
      issueId: "presentation-share-delivery-share-ready-blocked",
      severity: input.shareReadyPresentation.overallReadiness === "blocked" ? "critical" : "warning",
      ownerModule: "preview",
      title: "Presentation posture still blocks final delivery confidence",
      summary:
        input.shareReadyPresentation.nextActions[0] ??
        "Presentation polish still needs another pass before delivery.",
      actionPath: "/preview",
    });
  }

  if (!input.presentationPacketProofing.proofedReady) {
    issues.push({
      issueId: "presentation-share-delivery-proofing-incomplete",
      severity: input.presentationPacketProofing.overallReadiness === "blocked" ? "critical" : "warning",
      ownerModule: "package",
      title: "Presentation packet proofing is not complete enough to trust the final share",
      summary:
        input.presentationPacketProofing.nextActions[0] ??
        "Packet proofing still needs one more pass before final share.",
      actionPath: "/package",
    });
  }

  if (input.cameraCapture.overallState === "rough") {
    issues.push({
      issueId: "presentation-share-delivery-capture-rough",
      severity: "critical",
      ownerModule: "preview",
      title: "Camera capture execution still has rough delivery gaps",
      summary: input.cameraCapture.recommendedAction,
      actionPath: "/preview",
    });
  } else if (input.cameraCapture.overallState === "watch") {
    issues.push({
      issueId: "presentation-share-delivery-capture-watch",
      severity: "warning",
      ownerModule: "preview",
      title: "Camera capture execution still needs one more pass",
      summary: input.cameraCapture.recommendedAction,
      actionPath: "/preview",
    });
  }

  if (input.cameraSequencing.overallState === "rough") {
    issues.push({
      issueId: "presentation-share-delivery-sequencing-rough",
      severity: "critical",
      ownerModule: "preview",
      title: "Camera shot sequencing still breaks delivery confidence",
      summary: input.cameraSequencing.recommendedAction,
      actionPath: "/preview",
    });
  } else if (input.cameraSequencing.overallState === "watch") {
    issues.push({
      issueId: "presentation-share-delivery-sequencing-watch",
      severity: "warning",
      ownerModule: "preview",
      title: "Camera shot sequencing still needs one more pass",
      summary: input.cameraSequencing.recommendedAction,
      actionPath: "/preview",
    });
  }

  if (input.shotOrderApproval.overallState === "rough") {
    issues.push({
      issueId: "presentation-share-delivery-shot-approval-rough",
      severity: "critical",
      ownerModule: "preview",
      title: "Shot order approval still breaks delivery confidence",
      summary: input.shotOrderApproval.recommendedAction,
      actionPath: "/preview",
    });
  } else if (input.shotOrderApproval.overallState === "watch") {
    issues.push({
      issueId: "presentation-share-delivery-shot-approval-watch",
      severity: "warning",
      ownerModule: "preview",
      title: "Shot order approval still needs one more pass",
      summary: input.shotOrderApproval.recommendedAction,
      actionPath: "/preview",
    });
  }

  if (input.shotVariantSets.overallState === "rough") {
    issues.push({
      issueId: "presentation-share-delivery-shot-variants-rough",
      severity: "critical",
      ownerModule: "preview",
      title: "Shot variant sets still weaken final share confidence",
      summary: input.shotVariantSets.recommendedAction,
      actionPath: "/preview",
    });
  } else if (input.shotVariantSets.overallState === "watch") {
    issues.push({
      issueId: "presentation-share-delivery-shot-variants-watch",
      severity: "warning",
      ownerModule: "preview",
      title: "Shot variant sets still need one more pass",
      summary: input.shotVariantSets.recommendedAction,
      actionPath: "/preview",
    });
  }

  if (input.variantShippingDecisions.overallState === "rough") {
    issues.push({
      issueId: "presentation-share-delivery-variant-shipping-rough",
      severity: "critical",
      ownerModule: "preview",
      title: "Variant shipping decisions still weaken final share confidence",
      summary: input.variantShippingDecisions.recommendedAction,
      actionPath: "/preview",
    });
  } else if (input.variantShippingDecisions.overallState === "watch") {
    issues.push({
      issueId: "presentation-share-delivery-variant-shipping-watch",
      severity: "warning",
      ownerModule: "preview",
      title: "Variant shipping decisions still need one more pass",
      summary: input.variantShippingDecisions.recommendedAction,
      actionPath: "/preview",
    });
  }

  if (input.variantShippingManifest.overallState === "rough") {
    issues.push({
      issueId: "presentation-share-delivery-variant-manifest-rough",
      severity: "critical",
      ownerModule: "preview",
      title: "Variant shipping manifest still weakens final share confidence",
      summary: input.variantShippingManifest.recommendedAction,
      actionPath: "/preview",
    });
  } else if (input.variantShippingManifest.overallState === "watch") {
    issues.push({
      issueId: "presentation-share-delivery-variant-manifest-watch",
      severity: "warning",
      ownerModule: "preview",
      title: "Variant shipping manifest still needs one more pass",
      summary: input.variantShippingManifest.recommendedAction,
      actionPath: "/preview",
    });
  }

  if (input.landmarkCorridors.overallState === "rough") {
    issues.push({
      issueId: "presentation-share-delivery-corridors-rough",
      severity: "critical",
      ownerModule: "preview",
      title: "Landmark view corridors still weaken delivery confidence",
      summary: input.landmarkCorridors.recommendedAction,
      actionPath: "/build",
    });
  } else if (input.landmarkCorridors.overallState === "watch") {
    issues.push({
      issueId: "presentation-share-delivery-corridors-watch",
      severity: "warning",
      ownerModule: "preview",
      title: "Landmark view corridors still need one more cleanup pass",
      summary: input.landmarkCorridors.recommendedAction,
      actionPath: "/build",
    });
  }

  if (input.landmarkStaging.overallState === "rough") {
    issues.push({
      issueId: "presentation-share-delivery-staging-rough",
      severity: "critical",
      ownerModule: "preview",
      title: "Landmark corridor staging still weakens share delivery confidence",
      summary: input.landmarkStaging.recommendedAction,
      actionPath: "/build",
    });
  } else if (input.landmarkStaging.overallState === "watch") {
    issues.push({
      issueId: "presentation-share-delivery-staging-watch",
      severity: "warning",
      ownerModule: "preview",
      title: "Landmark corridor staging still needs one more pass",
      summary: input.landmarkStaging.recommendedAction,
      actionPath: "/build",
    });
  }

  if (input.corridorSupportKits.overallState === "rough") {
    issues.push({
      issueId: "presentation-share-delivery-corridor-kits-rough",
      severity: "critical",
      ownerModule: "preview",
      title: "Landmark corridor support kits still weaken delivery confidence",
      summary: input.corridorSupportKits.recommendedAction,
      actionPath: "/build",
    });
  } else if (input.corridorSupportKits.overallState === "watch") {
    issues.push({
      issueId: "presentation-share-delivery-corridor-kits-watch",
      severity: "warning",
      ownerModule: "preview",
      title: "Landmark corridor support kits still need one more pass",
      summary: input.corridorSupportKits.recommendedAction,
      actionPath: "/build",
    });
  }

  if (input.corridorKitComposition.overallState === "rough") {
    issues.push({
      issueId: "presentation-share-delivery-corridor-bundles-rough",
      severity: "critical",
      ownerModule: "preview",
      title: "Corridor bundle composition still weakens final share confidence",
      summary: input.corridorKitComposition.recommendedAction,
      actionPath: "/build",
    });
  } else if (input.corridorKitComposition.overallState === "watch") {
    issues.push({
      issueId: "presentation-share-delivery-corridor-bundles-watch",
      severity: "warning",
      ownerModule: "preview",
      title: "Corridor bundle composition still needs one more pass",
      summary: input.corridorKitComposition.recommendedAction,
      actionPath: "/build",
    });
  }

  if (input.corridorBundleLibraries.overallState === "rough") {
    issues.push({
      issueId: "presentation-share-delivery-corridor-library-rough",
      severity: "critical",
      ownerModule: "preview",
      title: "Corridor bundle libraries are not stable enough for final share support",
      summary: input.corridorBundleLibraries.recommendedAction,
      actionPath: "/build",
    });
  } else if (input.corridorBundleLibraries.overallState === "watch") {
    issues.push({
      issueId: "presentation-share-delivery-corridor-library-watch",
      severity: "warning",
      ownerModule: "preview",
      title: "Corridor bundle libraries still need one more pass",
      summary: input.corridorBundleLibraries.recommendedAction,
      actionPath: "/build",
    });
  }

  if (input.corridorBundleRecommendations.overallState === "rough") {
    issues.push({
      issueId: "presentation-share-delivery-corridor-recommendations-rough",
      severity: "critical",
      ownerModule: "preview",
      title: "Corridor bundle recommendations are not stable enough for final share support",
      summary: input.corridorBundleRecommendations.recommendedAction,
      actionPath: "/build",
    });
  } else if (input.corridorBundleRecommendations.overallState === "watch") {
    issues.push({
      issueId: "presentation-share-delivery-corridor-recommendations-watch",
      severity: "warning",
      ownerModule: "preview",
      title: "Corridor bundle recommendations still need one more pass",
      summary: input.corridorBundleRecommendations.recommendedAction,
      actionPath: "/build",
    });
  }

  if (input.cleanupReplayTimeline.overallState === "rough") {
    issues.push({
      issueId: "presentation-share-delivery-cleanup-replay-rough",
      severity: "critical",
      ownerModule: "preview",
      title: "Cleanup replay timeline still weakens final share confidence",
      summary: input.cleanupReplayTimeline.recommendedAction,
      actionPath: "/build",
    });
  } else if (input.cleanupReplayTimeline.overallState === "watch") {
    issues.push({
      issueId: "presentation-share-delivery-cleanup-replay-watch",
      severity: "warning",
      ownerModule: "preview",
      title: "Cleanup replay timeline still needs one more inspection pass",
      summary: input.cleanupReplayTimeline.recommendedAction,
      actionPath: "/build",
    });
  }

  if (!input.finalDelivery.deliveryReady || !input.creatorDelivery.deliveryReady) {
    issues.push({
      issueId: "presentation-share-delivery-final-delivery-incomplete",
      severity:
        input.finalDelivery.overallReadiness === "blocked" || input.creatorDelivery.overallReadiness === "blocked"
          ? "critical"
          : "warning",
      ownerModule: "publish",
      title: "Final delivery posture is not aligned to the current share packet",
      summary:
        input.finalDelivery.nextActions[0] ??
        input.creatorDelivery.nextAction,
      actionPath: "/publish",
    });
  }

  const blockerCount = issues.filter((issue) => issue.severity === "critical").length;
  const overallReadiness =
    blockerCount > 0 ? "blocked" : issues.length > 0 ? "watch" : "ready";
  const alignmentState: PresentationShareDeliveryConfidenceSummary["alignmentState"] =
    !input.releaseHandoff.handoffReady || !input.finalDelivery.deliveryReady
      ? "blocked"
      : !input.shareReadyPresentation.handoffAligned || !input.presentationSharePacket.packetGenerated
        ? "watch"
        : "aligned";
  const packetConfidenceState: PresentationShareDeliveryConfidenceSummary["packetConfidenceState"] =
    !input.presentationSharePacket.packetReady
      ? "blocked"
      : input.presentationSharePacket.missingPacketRequirementCount > 0 ||
          input.presentationSharePacket.polishGapHoleCount > 0
        ? "watch"
        : "ready";
  const proofingState: PresentationShareDeliveryConfidenceSummary["proofingState"] =
    input.presentationPacketProofing.overallReadiness === "blocked"
      ? "blocked"
      : input.presentationPacketProofing.overallReadiness === "watch"
        ? "watch"
        : "ready";
  const shotApprovalState: PresentationShareDeliveryConfidenceSummary["shotApprovalState"] =
    input.shotOrderApproval.overallState === "rough"
      ? "blocked"
      : input.shotOrderApproval.overallState === "watch"
        ? "watch"
        : "ready";
  const shotVariantState: PresentationShareDeliveryConfidenceSummary["shotVariantState"] =
    input.shotVariantSets.overallState === "rough"
      ? "blocked"
      : input.shotVariantSets.overallState === "watch"
        ? "watch"
        : "ready";
  const variantShippingState: PresentationShareDeliveryConfidenceSummary["variantShippingState"] =
    input.variantShippingDecisions.overallState === "rough"
      ? "blocked"
      : input.variantShippingDecisions.overallState === "watch"
        ? "watch"
        : "ready";
  const variantManifestState: PresentationShareDeliveryConfidenceSummary["variantManifestState"] =
    input.variantShippingManifest.overallState === "rough"
      ? "blocked"
      : input.variantShippingManifest.overallState === "watch"
        ? "watch"
        : "ready";
  const corridorKitState: PresentationShareDeliveryConfidenceSummary["corridorKitState"] =
    input.corridorSupportKits.overallState === "rough"
      ? "blocked"
      : input.corridorSupportKits.overallState === "watch"
        ? "watch"
        : "ready";
  const corridorBundleState: PresentationShareDeliveryConfidenceSummary["corridorBundleState"] =
    input.corridorKitComposition.overallState === "rough"
      ? "blocked"
      : input.corridorKitComposition.overallState === "watch"
        ? "watch"
        : "ready";
  const corridorLibraryState: PresentationShareDeliveryConfidenceSummary["corridorLibraryState"] =
    input.corridorBundleLibraries.overallState === "rough"
      ? "blocked"
      : input.corridorBundleLibraries.overallState === "watch"
        ? "watch"
        : "ready";
  const corridorRecommendationState: PresentationShareDeliveryConfidenceSummary["corridorRecommendationState"] =
    input.corridorBundleRecommendations.overallState === "rough"
      ? "blocked"
      : input.corridorBundleRecommendations.overallState === "watch"
        ? "watch"
        : "ready";
  const cleanupReplayState: PresentationShareDeliveryConfidenceSummary["cleanupReplayState"] =
    input.cleanupReplayTimeline.overallState === "rough"
      ? "blocked"
      : input.cleanupReplayTimeline.overallState === "watch"
        ? "watch"
        : "ready";
  const sequencingState: PresentationShareDeliveryConfidenceSummary["sequencingState"] =
    input.cameraSequencing.overallState === "rough"
      ? "blocked"
      : input.cameraSequencing.overallState === "watch"
        ? "watch"
        : "ready";
  const corridorStagingState: PresentationShareDeliveryConfidenceSummary["corridorStagingState"] =
    input.landmarkStaging.overallState === "rough"
      ? "blocked"
      : input.landmarkStaging.overallState === "watch"
        ? "watch"
        : "ready";
  const assetCoverageState: PresentationShareDeliveryConfidenceSummary["assetCoverageState"] =
    input.presentationSharePacket.shareableAssetCount === 0
      ? "blocked"
      : input.creatorDelivery.missingArtifactCount > 0 || input.finalDelivery.missingDeliveryArtifactCount > 0
        ? "watch"
        : "ready";
  const trustedToShare =
    overallReadiness === "ready" &&
    packetConfidenceState === "ready" &&
    proofingState === "ready" &&
    shotApprovalState === "ready" &&
    shotVariantState === "ready" &&
    variantShippingState === "ready" &&
    variantManifestState === "ready" &&
    corridorKitState === "ready" &&
    corridorBundleState === "ready" &&
    corridorLibraryState === "ready" &&
    corridorRecommendationState === "ready" &&
    cleanupReplayState === "ready" &&
    sequencingState === "ready" &&
    corridorStagingState === "ready" &&
    assetCoverageState === "ready" &&
    alignmentState === "aligned";

  return {
    overallReadiness,
    deliveryReady: trustedToShare,
    alignmentState,
    packetReady: input.presentationSharePacket.packetReady,
    packetConfidenceState,
    proofingState,
    shotApprovalState,
    shotVariantState,
    variantShippingState,
    variantManifestState,
    corridorKitState,
    corridorBundleState,
    corridorLibraryState,
    corridorRecommendationState,
    cleanupReplayState,
    sequencingState,
    corridorStagingState,
    assetCoverageState,
    trustedToShare,
    shareableAssetCount: input.presentationSharePacket.shareableAssetCount,
    deliveryGapCount:
      input.presentationSharePacket.missingPacketRequirementCount +
      input.finalDelivery.missingDeliveryArtifactCount +
      input.creatorDelivery.missingArtifactCount,
    blockedHoleCount: Math.max(
      input.presentationSharePacket.blockedHoleCount,
      input.shareReadyPresentation.blockedHoleCount,
      input.cameraCapture.blockedHoleCount ?? 0,
      input.landmarkCorridors.blockedHoleCount ?? 0,
      input.cameraSequencing.blockedHoleCount ?? 0,
      input.landmarkStaging.blockedHoleCount ?? 0,
      input.shotOrderApproval.blockedHoleCount ?? 0,
      input.shotVariantSets.blockedHoleCount ?? 0,
      input.variantShippingDecisions.blockedHoleCount ?? 0,
      input.variantShippingManifest.blockedHoleCount ?? 0,
      input.corridorSupportKits.blockedHoleCount ?? 0,
      input.corridorKitComposition.blockedHoleCount ?? 0,
      input.corridorBundleLibraries.blockedHoleCount ?? 0,
      input.corridorBundleRecommendations.blockedHoleCount ?? 0,
      input.cleanupReplayTimeline.blockedHoleCount ?? 0,
      input.presentationPacketProofing.blockedHoleCount,
    ),
    polishGapHoleCount: Math.max(
      input.presentationSharePacket.polishGapHoleCount,
      input.shareReadyPresentation.polishGapHoleCount,
      input.cameraCapture.polishGapHoleCount ?? 0,
      input.landmarkCorridors.correctiveHoleCount ?? input.landmarkCorridors.presentationGapHoleCount ?? 0,
      input.cameraSequencing.polishGapHoleCount ?? 0,
      input.landmarkStaging.correctiveHoleCount ?? input.landmarkStaging.presentationGapHoleCount ?? 0,
      input.shotOrderApproval.polishGapHoleCount ?? input.shotOrderApproval.presentationGapHoleCount ?? 0,
      input.shotVariantSets.polishGapHoleCount ?? input.shotVariantSets.presentationGapHoleCount ?? 0,
      input.variantShippingDecisions.polishGapHoleCount ?? input.variantShippingDecisions.presentationGapHoleCount ?? 0,
      input.variantShippingManifest.polishGapHoleCount ?? input.variantShippingManifest.presentationGapHoleCount ?? 0,
      input.corridorSupportKits.correctiveHoleCount ?? input.corridorSupportKits.presentationGapHoleCount ?? 0,
      input.corridorKitComposition.correctiveHoleCount ?? input.corridorKitComposition.presentationGapHoleCount ?? 0,
      input.corridorBundleLibraries.correctiveHoleCount ??
        input.corridorBundleLibraries.presentationGapHoleCount ??
        0,
      input.corridorBundleRecommendations.correctiveHoleCount ??
        input.corridorBundleRecommendations.presentationGapHoleCount ??
        0,
      input.cleanupReplayTimeline.polishGapHoleCount ?? input.cleanupReplayTimeline.presentationGapHoleCount ?? 0,
      input.presentationPacketProofing.proofingGapCount,
    ),
    issues,
    nextActions: [
      input.shotVariantSets.recommendedAction,
      input.variantShippingDecisions.recommendedAction,
      input.variantShippingManifest.recommendedAction,
      input.corridorKitComposition.recommendedAction,
      input.corridorBundleLibraries.recommendedAction,
      input.corridorBundleRecommendations.recommendedAction,
      input.cleanupReplayTimeline.recommendedAction,
      input.shotOrderApproval.recommendedAction,
      input.corridorSupportKits.recommendedAction,
      input.presentationPacketProofing.nextActions[0],
      input.cameraSequencing.recommendedAction,
      input.landmarkStaging.recommendedAction,
      issues[0]?.summary,
      input.presentationSharePacket.nextActions[0],
      input.shareReadyPresentation.nextActions[0],
      input.finalDelivery.nextActions[0],
      input.creatorDelivery.nextAction,
      input.cameraCapture.recommendedAction,
      input.landmarkCorridors.recommendedAction,
    ].filter((value, index, items): value is string => Boolean(value) && items.indexOf(value) === index),
  };
}

export function summarizeFinalShareGateApproval(input: {
  releaseExecution: ReturnType<typeof summarizeReleaseExecutionState>;
  presentationShareDelivery: PresentationShareDeliveryConfidenceSummary;
  presentationPacketProofing: PresentationPacketProofingSummary;
  presentationSharePacket: PresentationSharePacketFinalizationSummary;
  shotVariantSets: ShareReadyPresentationSignal;
  variantShippingDecisions: ShareReadyPresentationSignal;
  variantShippingManifest: ShareReadyPresentationSignal;
  corridorKitComposition: ShareReadyPresentationSignal;
  corridorBundleLibraries: ShareReadyPresentationSignal;
  corridorBundleRecommendations: ShareReadyPresentationSignal;
  cleanupReplayTimeline: ShareReadyPresentationSignal;
}): FinalShareGateApprovalSummary {
  const issues: CreatorDeliveryIssue[] = [];

  if (!input.presentationShareDelivery.trustedToShare) {
    issues.push({
      issueId: "final-share-gate-delivery-untrusted",
      severity:
        input.presentationShareDelivery.overallReadiness === "blocked" ? "critical" : "warning",
      ownerModule: "publish",
      title: "Final share gate still sees unresolved trust gaps",
      summary:
        input.presentationShareDelivery.nextActions[0] ??
        "Final share still needs another readiness pass before approval.",
      actionPath: "/publish",
    });
  }

  if (input.shotVariantSets.overallState === "rough" || input.shotVariantSets.overallState === "watch") {
    issues.push({
      issueId: `final-share-gate-shot-variants-${input.shotVariantSets.overallState}`,
      severity: input.shotVariantSets.overallState === "rough" ? "critical" : "warning",
      ownerModule: "preview",
      title:
        input.shotVariantSets.overallState === "rough"
          ? "Shot variants are not stable enough for final share approval"
          : "Shot variants still need one more review pass",
      summary: input.shotVariantSets.recommendedAction,
      actionPath: "/preview",
    });
  }

  if (
    input.variantShippingDecisions.overallState === "rough" ||
    input.variantShippingDecisions.overallState === "watch"
  ) {
    issues.push({
      issueId: `final-share-gate-variant-shipping-${input.variantShippingDecisions.overallState}`,
      severity: input.variantShippingDecisions.overallState === "rough" ? "critical" : "warning",
      ownerModule: "preview",
      title:
        input.variantShippingDecisions.overallState === "rough"
          ? "Variant shipping decisions still block final share approval"
          : "Variant shipping decisions still need one more review pass",
      summary: input.variantShippingDecisions.recommendedAction,
      actionPath: "/preview",
    });
  }

  if (
    input.variantShippingManifest.overallState === "rough" ||
    input.variantShippingManifest.overallState === "watch"
  ) {
    issues.push({
      issueId: `final-share-gate-variant-manifest-${input.variantShippingManifest.overallState}`,
      severity: input.variantShippingManifest.overallState === "rough" ? "critical" : "warning",
      ownerModule: "preview",
      title:
        input.variantShippingManifest.overallState === "rough"
          ? "Variant shipping manifest still blocks final share approval"
          : "Variant shipping manifest still needs one more review pass",
      summary: input.variantShippingManifest.recommendedAction,
      actionPath: "/preview",
    });
  }

  if (
    input.corridorKitComposition.overallState === "rough" ||
    input.corridorKitComposition.overallState === "watch"
  ) {
    issues.push({
      issueId: `final-share-gate-corridor-bundles-${input.corridorKitComposition.overallState}`,
      severity: input.corridorKitComposition.overallState === "rough" ? "critical" : "warning",
      ownerModule: "preview",
      title:
        input.corridorKitComposition.overallState === "rough"
          ? "Corridor bundle composition still blocks final share approval"
          : "Corridor bundle composition still needs one more review pass",
      summary: input.corridorKitComposition.recommendedAction,
      actionPath: "/build",
    });
  }

  if (
    input.corridorBundleLibraries.overallState === "rough" ||
    input.corridorBundleLibraries.overallState === "watch"
  ) {
    issues.push({
      issueId: `final-share-gate-corridor-library-${input.corridorBundleLibraries.overallState}`,
      severity: input.corridorBundleLibraries.overallState === "rough" ? "critical" : "warning",
      ownerModule: "preview",
      title:
        input.corridorBundleLibraries.overallState === "rough"
          ? "Corridor bundle libraries still block final share approval"
          : "Corridor bundle libraries still need one more review pass",
      summary: input.corridorBundleLibraries.recommendedAction,
      actionPath: "/build",
    });
  }

  if (
    input.corridorBundleRecommendations.overallState === "rough" ||
    input.corridorBundleRecommendations.overallState === "watch"
  ) {
    issues.push({
      issueId: `final-share-gate-corridor-recommendations-${input.corridorBundleRecommendations.overallState}`,
      severity: input.corridorBundleRecommendations.overallState === "rough" ? "critical" : "warning",
      ownerModule: "preview",
      title:
        input.corridorBundleRecommendations.overallState === "rough"
          ? "Corridor bundle recommendations still block final share approval"
          : "Corridor bundle recommendations still need one more review pass",
      summary: input.corridorBundleRecommendations.recommendedAction,
      actionPath: "/build",
    });
  }

  if (
    input.cleanupReplayTimeline.overallState === "rough" ||
    input.cleanupReplayTimeline.overallState === "watch"
  ) {
    issues.push({
      issueId: `final-share-gate-cleanup-replay-${input.cleanupReplayTimeline.overallState}`,
      severity: input.cleanupReplayTimeline.overallState === "rough" ? "critical" : "warning",
      ownerModule: "preview",
      title:
        input.cleanupReplayTimeline.overallState === "rough"
          ? "Cleanup replay timeline still blocks final share approval"
          : "Cleanup replay timeline still needs one more review pass",
      summary: input.cleanupReplayTimeline.recommendedAction,
      actionPath: "/build",
    });
  }

  if (!input.presentationPacketProofing.proofedReady || !input.presentationSharePacket.packetReady) {
    issues.push({
      issueId: "final-share-gate-proofing-incomplete",
      severity:
        input.presentationPacketProofing.overallReadiness === "blocked" ||
        input.presentationSharePacket.overallReadiness === "blocked"
          ? "critical"
          : "warning",
      ownerModule: "package",
      title: "Packet proofing still blocks final share approval",
      summary:
        input.presentationPacketProofing.nextActions[0] ??
        input.presentationSharePacket.nextActions[0] ??
        "Packet proofing still needs one more pass before final approval.",
      actionPath: "/package",
    });
  }

  const signoffArtifact =
    input.releaseExecution.latestBuild?.artifactRefs.find(
      (artifact) => artifact.artifactType === "share-gate-signoff" && artifact.status === "generated",
    ) ?? null;
  const signoffLock =
    input.releaseExecution.latestBuild?.artifactRefs.find(
      (artifact) => artifact.artifactType === "share-gate-lock" && artifact.status === "generated",
    ) ?? null;
  const signoffArtifactState: FinalShareGateApprovalSummary["signoffArtifactState"] =
    signoffArtifact === null
      ? "missing"
      : input.presentationShareDelivery.trustedToShare && input.presentationPacketProofing.proofedReady
        ? "ready"
        : "watch";
  const signoffLockState: FinalShareGateApprovalSummary["signoffLockState"] =
    signoffLock === null
      ? "missing"
      : input.presentationShareDelivery.trustedToShare &&
          input.presentationPacketProofing.proofedReady &&
          input.variantShippingManifest.overallState === "ready" &&
          input.corridorBundleRecommendations.overallState === "ready" &&
          input.cleanupReplayTimeline.overallState === "ready"
        ? "locked"
        : "watch";

  if (signoffArtifactState !== "ready") {
    issues.push({
      issueId: signoffArtifact === null ? "final-share-gate-signoff-missing" : "final-share-gate-signoff-watch",
      severity: signoffArtifact === null ? "warning" : "warning",
      ownerModule: "package",
      title:
        signoffArtifact === null
          ? "Share-gate signoff artifact has not been generated yet"
          : "Share-gate signoff artifact still needs calmer proofing posture",
      summary:
        signoffArtifact === null
          ? "Generate the durable share-gate signoff artifact so final approval leaves behind a proof record."
          : "Refresh the signoff artifact after the remaining proofing gaps are resolved so final approval has a durable proof record.",
      actionPath: "/package",
    });
  }

  if (signoffLockState !== "locked") {
    issues.push({
      issueId: signoffLock === null ? "final-share-gate-lock-missing" : "final-share-gate-lock-watch",
      severity: signoffLock === null ? "warning" : "warning",
      ownerModule: "package",
      title:
        signoffLock === null
          ? "Final share lock artifact has not been generated yet"
          : "Final share lock still needs calmer signoff posture",
      summary:
        signoffLock === null
          ? "Generate the durable final share lock artifact so the creator has one locked signoff record before external sharing."
          : "Refresh the final share lock after the remaining manifest, corridor, or replay gaps are resolved so final share can be locked with confidence.",
      actionPath: "/package",
    });
  }

  const blockerCount = issues.filter((issue) => issue.severity === "critical").length;
  const overallReadiness = blockerCount > 0 ? "blocked" : issues.length > 0 ? "watch" : "ready";
  const gateApproved =
    overallReadiness === "ready" &&
    input.presentationShareDelivery.trustedToShare &&
    signoffLockState === "locked";

  return {
    overallReadiness,
    gateApproved,
    gateState: gateApproved ? "approved" : overallReadiness === "blocked" ? "blocked" : "watch",
    alignmentState: input.presentationShareDelivery.alignmentState,
    packetConfidenceState: input.presentationShareDelivery.packetConfidenceState,
    proofingState: input.presentationShareDelivery.proofingState,
    shotVariantState: input.presentationShareDelivery.shotVariantState,
    variantShippingState: input.presentationShareDelivery.variantShippingState,
    variantManifestState: input.presentationShareDelivery.variantManifestState,
    corridorBundleState: input.presentationShareDelivery.corridorBundleState,
    corridorLibraryState: input.presentationShareDelivery.corridorLibraryState,
    corridorRecommendationState: input.presentationShareDelivery.corridorRecommendationState,
    cleanupReplayState: input.presentationShareDelivery.cleanupReplayState,
    signoffArtifactState,
    signoffArtifactPath: signoffArtifact?.relativePath ?? null,
    signoffLockState,
    signoffLockPath: signoffLock?.relativePath ?? null,
    approvalGapCount:
      input.presentationShareDelivery.deliveryGapCount +
      (input.shotVariantSets.polishGapHoleCount ?? input.shotVariantSets.presentationGapHoleCount ?? 0) +
      (input.variantShippingDecisions.polishGapHoleCount ??
        input.variantShippingDecisions.presentationGapHoleCount ??
        0) +
      (input.variantShippingManifest.polishGapHoleCount ??
        input.variantShippingManifest.presentationGapHoleCount ??
        0) +
      (input.corridorKitComposition.correctiveHoleCount ?? input.corridorKitComposition.presentationGapHoleCount ?? 0) +
      (input.corridorBundleLibraries.correctiveHoleCount ??
        input.corridorBundleLibraries.presentationGapHoleCount ??
        0) +
      (input.corridorBundleRecommendations.correctiveHoleCount ??
        input.corridorBundleRecommendations.presentationGapHoleCount ??
        0) +
      (input.cleanupReplayTimeline.polishGapHoleCount ??
        input.cleanupReplayTimeline.presentationGapHoleCount ??
        0) +
      (signoffArtifactState === "ready" ? 0 : 1) +
      (signoffLockState === "locked" ? 0 : 1),
    blockedHoleCount: Math.max(
      input.presentationShareDelivery.blockedHoleCount,
      input.presentationPacketProofing.blockedHoleCount,
      input.shotVariantSets.blockedHoleCount ?? 0,
      input.variantShippingDecisions.blockedHoleCount ?? 0,
      input.variantShippingManifest.blockedHoleCount ?? 0,
      input.corridorKitComposition.blockedHoleCount ?? 0,
      input.corridorBundleLibraries.blockedHoleCount ?? 0,
      input.corridorBundleRecommendations.blockedHoleCount ?? 0,
      input.cleanupReplayTimeline.blockedHoleCount ?? 0,
    ),
    issues,
    nextActions: [
      issues[0]?.summary,
      input.shotVariantSets.recommendedAction,
      input.variantShippingDecisions.recommendedAction,
      input.variantShippingManifest.recommendedAction,
      input.corridorKitComposition.recommendedAction,
      input.corridorBundleLibraries.recommendedAction,
      input.corridorBundleRecommendations.recommendedAction,
      input.cleanupReplayTimeline.recommendedAction,
      input.presentationPacketProofing.nextActions[0],
      input.presentationShareDelivery.nextActions[0],
    ].filter((value, index, items): value is string => Boolean(value) && items.indexOf(value) === index),
  };
}

function toReleaseConvergenceIssue(
  diagnostic: ExportGeometryDiagnostic,
): ReleaseConvergenceIssue {
  const ownerModule =
    diagnostic.category === "preview-anchor"
      ? "preview"
      : diagnostic.category === "route-readability"
        ? "gameplay"
        : "build";

  return {
    issueId: diagnostic.diagnosticId,
    severity: diagnostic.severity,
    ownerModule,
    title: diagnostic.title,
    summary: diagnostic.summary,
    actionPath:
      ownerModule === "preview"
        ? "Preview Studio > Path Registry"
        : ownerModule === "gameplay"
          ? "Gameplay & Simulator Logic Center > Output Validation"
          : "Build > Scene Authoring"
  };
}

export function deriveExportGeometryReport(
  project: PackagingProjectLike,
  validationIssues: ValidationIssueLike[] = [],
) {
  const diagnostics: ExportGeometryDiagnostic[] = [];
  const teeZoneIds = new Set(project.sceneAuthoring.teeZones.map((entry) => entry.teeZoneId));
  const greenZoneIds = new Set(project.sceneAuthoring.greenZones.map((entry) => entry.greenZoneId));
  const hazardZoneIds = new Set(project.sceneAuthoring.hazardZones.map((entry) => entry.hazardZoneId));
  const outOfBoundsZoneIds = new Set(project.sceneAuthoring.outOfBoundsZones.map((entry) => entry.outOfBoundsZoneId));
  const dropZoneAreaIds = new Set(project.sceneAuthoring.dropZoneAreas.map((entry) => entry.dropZoneAreaId));
  const routingPathIds = new Set(project.sceneAuthoring.routingPaths.map((entry) => entry.routingPathId));
  const visibilityCorridorIds = new Set(
    project.sceneAuthoring.visibilityCorridors.map((entry) => entry.visibilityCorridorId),
  );
  const playRouteEnvelopeIds = new Set(
    project.sceneAuthoring.playRouteEnvelopes.map((entry) => entry.playRouteEnvelopeId),
  );

  for (const binding of project.simulatorLogic.teeSpatialBindings) {
    if (!binding.teeZoneRef && !binding.sceneObjectRef) {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `tee-anchor-missing-${binding.teeSpatialBindingId}`,
          category: "tee-anchor",
          severity: "critical",
          holeId: binding.holeId,
          title: "Tee anchor is missing Build geometry",
          summary: "A tee set is not anchored to a tee zone or scene object in Build.",
          recommendedAction: "Author or rebind the tee anchor in Build before packaging."
        }),
      );
      continue;
    }

    if (binding.teeZoneRef && !hasReference(binding.teeZoneRef, teeZoneIds)) {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `tee-anchor-drift-${binding.teeSpatialBindingId}`,
          category: "tee-anchor",
          severity: "critical",
          holeId: binding.holeId,
          title: "Tee anchor references missing geometry",
          summary: "The tee spatial binding points at a tee zone that no longer exists.",
          recommendedAction: "Repair the tee zone binding before exporting."
        }),
      );
    } else if (!binding.facingDirectionDegrees || binding.readinessState !== "ready") {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `tee-anchor-quality-${binding.teeSpatialBindingId}`,
          category: "tee-anchor",
          severity: "warning",
          holeId: binding.holeId,
          title: "Tee anchor quality still needs review",
          summary: "Facing or readiness posture is still weak for a tee anchor.",
          recommendedAction: "Confirm tee direction and mark the anchor ready before packaging."
        }),
      );
    }
  }

  for (const binding of project.simulatorLogic.pinSpatialBindings) {
    if (!binding.greenZoneRef && !binding.sceneObjectRef && !binding.positionHint) {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `pin-anchor-missing-${binding.pinSpatialBindingId}`,
          category: "pin-anchor",
          severity: "critical",
          holeId: binding.holeId,
          title: "Pin anchor is missing green geometry",
          summary: "A pin set is not anchored to a green zone, scene object, or position hint.",
          recommendedAction: "Author a valid green anchor before exporting."
        }),
      );
      continue;
    }

    if (binding.greenZoneRef && !hasReference(binding.greenZoneRef, greenZoneIds)) {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `pin-anchor-drift-${binding.pinSpatialBindingId}`,
          category: "pin-anchor",
          severity: "critical",
          holeId: binding.holeId,
          title: "Pin anchor references missing green geometry",
          summary: "The pin binding points at a green zone that no longer exists.",
          recommendedAction: "Repair the green-zone binding before packaging."
        }),
      );
    } else if (binding.readinessState !== "ready") {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `pin-anchor-quality-${binding.pinSpatialBindingId}`,
          category: "pin-anchor",
          severity: "warning",
          holeId: binding.holeId,
          title: "Pin anchor still needs readiness review",
          summary: "The pin binding exists, but readiness is not yet strong enough for packaging confidence.",
          recommendedAction: "Review and approve the pin anchor in Build or Gameplay."
        }),
      );
    }
  }

  for (const binding of project.simulatorLogic.hazardSpatialBindings) {
    if (!binding.hazardZoneRef) {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `hazard-geometry-missing-${binding.hazardSpatialBindingId}`,
          category: "hazard-geometry",
          severity: "critical",
          holeId: binding.holeId,
          title: "Hazard geometry is missing",
          summary: "A hazard binding does not point at a Build hazard zone.",
          recommendedAction: "Author or bind the hazard zone before packaging."
        }),
      );
      continue;
    }

    if (!hasReference(binding.hazardZoneRef, hazardZoneIds)) {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `hazard-geometry-drift-${binding.hazardSpatialBindingId}`,
          category: "hazard-geometry",
          severity: "critical",
          holeId: binding.holeId,
          title: "Hazard binding references missing geometry",
          summary: "A hazard binding points at a removed or invalid hazard zone.",
          recommendedAction: "Repair the hazard binding in Build before export."
        }),
      );
    } else if (binding.readinessState !== "ready") {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `hazard-geometry-quality-${binding.hazardSpatialBindingId}`,
          category: "hazard-geometry",
          severity: "warning",
          holeId: binding.holeId,
          title: "Hazard geometry still needs review",
          summary: "Hazard geometry exists, but readiness has not been confirmed.",
          recommendedAction: "Review the hazard geometry and mark it ready before packaging."
        }),
      );
    }
  }

  for (const binding of project.simulatorLogic.outOfBoundsSpatialBindings) {
    if (binding.boundaryRefs.length === 0) {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `oob-boundary-missing-${binding.outOfBoundsSpatialBindingId}`,
          category: "ob-boundary",
          severity: "critical",
          holeId: binding.holeId,
          title: "OB boundary is missing",
          summary: "Out-of-bounds output has no authored Build boundary references.",
          recommendedAction: "Author the OB boundary in Build before exporting."
        }),
      );
      continue;
    }

    if (binding.boundaryRefs.some((reference) => !hasReference(reference, outOfBoundsZoneIds))) {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `oob-boundary-drift-${binding.outOfBoundsSpatialBindingId}`,
          category: "ob-boundary",
          severity: "critical",
          holeId: binding.holeId,
          title: "OB boundary references invalid geometry",
          summary: "One or more OB references no longer resolve to valid Build zones.",
          recommendedAction: "Repair the OB boundary bindings before packaging."
        }),
      );
    } else if (binding.readinessState !== "ready") {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `oob-boundary-quality-${binding.outOfBoundsSpatialBindingId}`,
          category: "ob-boundary",
          severity: "warning",
          holeId: binding.holeId,
          title: "OB boundary still needs readiness review",
          summary: "The OB boundary exists but has not been cleared for export trust.",
          recommendedAction: "Review the OB boundary posture before packaging."
        }),
      );
    }
  }

  for (const binding of project.simulatorLogic.dropZoneSpatialBindings) {
    if (!binding.dropZoneAreaRef) {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `drop-zone-missing-${binding.dropZoneSpatialBindingId}`,
          category: "drop-zone",
          severity: "critical",
          holeId: binding.holeId,
          title: "Drop zone geometry is missing",
          summary: "A drop zone does not point at an authored Build area.",
          recommendedAction: "Author or bind the drop zone in Build before export."
        }),
      );
      continue;
    }

    if (!hasReference(binding.dropZoneAreaRef, dropZoneAreaIds)) {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `drop-zone-drift-${binding.dropZoneSpatialBindingId}`,
          category: "drop-zone",
          severity: "critical",
          holeId: binding.holeId,
          title: "Drop zone references invalid geometry",
          summary: "A drop zone binding points at an area that no longer exists.",
          recommendedAction: "Repair the drop-zone binding before packaging."
        }),
      );
    } else if (binding.readinessState !== "ready") {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `drop-zone-quality-${binding.dropZoneSpatialBindingId}`,
          category: "drop-zone",
          severity: "warning",
          holeId: binding.holeId,
          title: "Drop zone still needs readiness review",
          summary: "Drop zone geometry exists but has not been marked ready for export.",
          recommendedAction: "Review the drop zone and confirm readiness before packaging."
        }),
      );
    }
  }

  for (const binding of project.simulatorLogic.previewAnchorBindings) {
    if (!binding.anchorRef) {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `preview-anchor-missing-${binding.previewAnchorBindingId}`,
          category: "preview-anchor",
          severity: "critical",
          holeId: binding.holeId,
          title: "Preview or flyover anchor is missing",
          summary: "A preview-facing simulator binding has no Build anchor reference.",
          recommendedAction: "Author the preview or flyover anchor before packaging."
        }),
      );
      continue;
    }

    const previewAnchorExists =
      hasReference(binding.anchorRef, visibilityCorridorIds) ||
      hasReference(binding.anchorRef, playRouteEnvelopeIds) ||
      project.sceneAuthoring.routingPaths.some((path) => path.holeId === binding.holeId);

    if (!previewAnchorExists) {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `preview-anchor-drift-${binding.previewAnchorBindingId}`,
          category: "preview-anchor",
          severity: "critical",
          holeId: binding.holeId,
          title: "Preview anchor has weak geometry support",
          summary: "The preview anchor is no longer supported by valid Build route geometry.",
          recommendedAction: "Reposition or rebind the preview anchor before packaging."
        }),
      );
    } else if (binding.readinessState !== "ready") {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `preview-anchor-quality-${binding.previewAnchorBindingId}`,
          category: "preview-anchor",
          severity: "warning",
          holeId: binding.holeId,
          title: "Preview anchor still needs readiness review",
          summary: "Preview framing exists but is not yet trusted for release-facing output.",
          recommendedAction: "Review preview anchor positioning before packaging."
        }),
      );
    }
  }

  for (const profile of project.simulatorLogic.holePlayProfiles) {
    if (
      !profile.playRouteEnvelopeRef ||
      !profile.fairwayCorridorRef ||
      !profile.greenZoneRef ||
      !profile.visibilityCorridorRef
    ) {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `route-readability-missing-${profile.holeId}`,
          category: "route-readability",
          severity: profile.exportReadiness === "blocked" ? "critical" : "warning",
          holeId: profile.holeId,
          title: "Hole flow is missing export-critical route geometry",
          summary: "Play route, fairway, green, or visibility geometry is incomplete for this hole.",
          recommendedAction: "Finish route geometry in Build before packaging."
        }),
      );
      continue;
    }

    if (
      !hasReference(profile.playRouteEnvelopeRef, playRouteEnvelopeIds) ||
      !hasReference(profile.visibilityCorridorRef, visibilityCorridorIds) ||
      profile.lineOfPlayStatus !== "clear" ||
      profile.shotReadabilityStatus !== "clear" ||
      profile.exportReadiness !== "ready"
    ) {
      diagnostics.push(
        createDiagnostic({
          diagnosticId: `route-readability-quality-${profile.holeId}`,
          category: "route-readability",
          severity: profile.exportReadiness === "blocked" ? "critical" : "warning",
          holeId: profile.holeId,
          title: "Hole readability or export posture is still weak",
          summary: "Route continuity, sightline, or export readiness still needs improvement for this hole.",
          recommendedAction: "Resolve Build or Gameplay route-readiness issues before packaging."
        }),
      );
    }
  }

  const packagingIssues = validationIssues.filter(
    (issue) =>
      issue.ownerModule === "package" ||
      issue.ownerModule === "gameplay" ||
      issue.ownerModule === "playability" ||
      issue.ownerModule === "preview",
  );
  if (packagingIssues.some((issue) => issue.severity === "critical")) {
    diagnostics.push(
      createDiagnostic({
        diagnosticId: "route-readability-validation-blocker",
        category: "route-readability",
        severity: "critical",
        title: "Validation still reports packaging-critical geometry blockers",
        summary: "Open high-severity issues still weaken export confidence.",
        recommendedAction: "Resolve the active validation blockers before packaging."
      }),
    );
  }

  const blockerCount = diagnostics.filter((diagnostic) => diagnostic.severity === "critical").length;
  const warningCount = diagnostics.filter((diagnostic) => diagnostic.severity === "warning").length;
  const readiness = blockerCount > 0 ? "blocked" : warningCount > 0 ? "watch" : "ready";

  return exportGeometryReportSchema.parse({
    readiness,
    blockerCount,
    warningCount,
    summary:
      readiness === "blocked"
        ? `${blockerCount} export geometry blockers still need repair.`
        : readiness === "watch"
          ? `${warningCount} export geometry warnings still need review.`
          : "Export geometry posture is aligned closely enough for package confidence.",
    recommendedAction:
      diagnostics.find((diagnostic) => diagnostic.severity === "critical")?.recommendedAction ??
      diagnostics[0]?.recommendedAction ??
      "Generate or review the next release candidate package.",
    diagnostics
  });
}

export function summarizeReleaseConvergence(
  project: PackagingProjectLike,
  validationIssues: ValidationIssueLike[] = [],
): ReleaseConvergenceSummary {
  const previewSummary = summarizePreviewReadiness({
    previewPaths: project.previewPaths,
    flyoverPlans: project.flyoverPlans,
    screenshotPlans: project.screenshotPlans,
    showcaseSequences: project.showcaseSequences,
    holeCount: project.manifest.holeCount
  });
  const publishSummary = summarizePublishReadiness(project.releaseRecords);
  const checklist = buildPackagingChecklist(project, validationIssues);
  const packagingResult = derivePackagingResult(checklist);
  const exportGeometry = deriveExportGeometryReport(project, validationIssues);
  const issues: ReleaseConvergenceIssue[] = [
    ...exportGeometry.diagnostics.map(toReleaseConvergenceIssue)
  ];

  if (previewSummary.flyoverCoverage < 1 || previewSummary.minimapCoverage < 1) {
    issues.push({
      issueId: "preview-coverage-blocked",
      severity: "critical",
      ownerModule: "preview",
      title: "Preview coverage is incomplete",
      summary:
        "Flyover or minimap coverage is still incomplete for playable holes, which weakens package and publish confidence.",
      actionPath: "Preview Studio > Flyovers / Minimaps"
    });
  } else if (
    previewSummary.screenshotApprovedCount === 0 ||
    previewSummary.showcaseReadyCount === 0
  ) {
    issues.push({
      issueId: "preview-release-media-watch",
      severity: "warning",
      ownerModule: "preview",
      title: "Release media still needs attention",
      summary:
        "Approved screenshots or showcase-ready sequences are still missing for a strong release path.",
      actionPath: "Preview Studio > Screenshots / Showcase Sequences"
    });
  }

  if (!publishSummary.hasCourseDescription || !publishSummary.hasReleaseNotes) {
    issues.push({
      issueId: "publish-metadata-incomplete",
      severity: "warning",
      ownerModule: "publish",
      title: "Publish metadata is incomplete",
      summary:
        "Course description or release notes are still incomplete, which weakens public-safe release posture.",
      actionPath: "Publish Center > Release Metadata"
    });
  }

  const blockerCount = issues.filter((issue) => issue.severity === "critical").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const overallReadiness =
    blockerCount > 0
      ? "blocked"
      : packagingResult.readiness === "ready" &&
          previewSummary.overallReadiness === "ready" &&
          publishSummary.hasCourseDescription &&
          publishSummary.hasReleaseNotes
        ? "ready"
        : "watch";

  return {
    overallReadiness,
    blockerCount,
    warningCount,
    previewSummary,
    publishSummary,
    packagingResult,
    exportGeometry,
    issues,
    recommendedAction:
      issues[0]?.summary ??
      exportGeometry.recommendedAction ??
      packagingResult.recommendedAction
  };
}

export function buildPackagingChecklist(
  project: PackagingProjectLike,
  validationIssues: ValidationIssueLike[] = [],
): PackagingChecklist[] {
  const criticalIssues = validationIssues.filter((issue) => issue.severity === "critical");
  const gameplayIssues = validationIssues.filter(
    (issue) => issue.ownerModule === "gameplay" || issue.ownerModule === "playability",
  );
  const blockedAssets = project.assets.filter((asset) => asset.queueState === "blocked");
  const pendingAssets = project.assets.filter((asset) => asset.approvalStatus !== "approved");
  const previewSummary = summarizePreviewReadiness({
    previewPaths: project.previewPaths,
    flyoverPlans: project.flyoverPlans,
    screenshotPlans: project.screenshotPlans,
    showcaseSequences: project.showcaseSequences,
    holeCount: project.manifest.holeCount
  });
  const exportGeometry = deriveExportGeometryReport(project, validationIssues);
  const latestRelease = project.releaseRecords[0] ?? null;

  return [
    {
      itemId: "validation-blockers",
      label: "Critical validation blockers",
      category: "validation",
      state:
        criticalIssues.length > 0
          ? "blocked"
          : validationIssues.some((issue) => issue.severity === "high" || issue.severity === "warning")
            ? "warning"
            : "complete",
      summary:
        criticalIssues.length > 0
          ? `${criticalIssues.length} critical issues still block a trustworthy package.`
          : validationIssues.some((issue) => issue.severity === "high" || issue.severity === "warning")
            ? "High or warning issues remain and should be reviewed before candidate generation."
            : "Validation posture is clear enough for packaging confidence.",
      actionPath: "/playability",
      ownerModule: "package"
    },
    {
      itemId: "simulator-logic",
      label: "Simulator gameplay readiness",
      category: "simulator-logic",
      state:
        gameplayIssues.some((issue) => issue.severity === "critical" || issue.severity === "high")
          ? "blocked"
          : gameplayIssues.length > 0
            ? "warning"
            : "complete",
      summary:
        gameplayIssues.length > 0
          ? "Gameplay & Simulator Logic Center still has unresolved issues that affect output trust."
          : "Gameplay logic is currently clear enough for candidate packaging.",
      actionPath: "/gameplay",
      ownerModule: "gameplay"
    },
    {
      itemId: "export-geometry",
      label: "Export geometry readiness",
      category: "compatibility",
      state:
        exportGeometry.readiness === "blocked"
          ? "blocked"
          : exportGeometry.readiness === "watch"
            ? "warning"
            : "complete",
      summary: exportGeometry.summary,
      actionPath: "/build",
      ownerModule: "build"
    },
    {
      itemId: "preview-assets",
      label: "Preview and media readiness",
      category: "preview",
      state:
        previewSummary.overallReadiness === "blocked"
          ? "blocked"
          : previewSummary.overallReadiness === "watch"
            ? "warning"
            : "complete",
      summary:
        previewSummary.overallReadiness === "blocked"
          ? "Preview Studio still lacks complete playable coverage."
          : previewSummary.overallReadiness === "watch"
            ? "Preview coverage exists, but screenshots or showcase sequencing still need attention."
            : "Preview Studio is aligned with release-media expectations.",
      actionPath: "/preview",
      ownerModule: "preview"
    },
    {
      itemId: "dependencies",
      label: "Dependencies and asset hygiene",
      category: "dependencies",
      state: blockedAssets.length > 0 ? "blocked" : pendingAssets.length > 0 ? "warning" : "complete",
      summary:
        blockedAssets.length > 0
          ? `${blockedAssets.length} assets are still blocked and can invalidate the final package.`
          : pendingAssets.length > 0
            ? `${pendingAssets.length} assets still need approval review before release confidence is strong.`
            : "Asset intake and approval are currently clean enough for packaging.",
      actionPath: "/asset-library",
      ownerModule: "asset-library"
    },
    {
      itemId: "release-metadata",
      label: "Release metadata draft",
      category: "metadata",
      state:
        !latestRelease
          ? "pending"
          : !latestRelease.courseDescription || !latestRelease.releaseNotes.length
            ? "warning"
            : "complete",
      summary:
        !latestRelease
          ? "No release record exists yet, so publish metadata is still blank."
          : !latestRelease.courseDescription || !latestRelease.releaseNotes.length
            ? "Publish metadata exists, but course description or release notes still need completion."
            : "Release metadata has a usable foundation for publish handoff.",
      actionPath: "/publish",
      ownerModule: "publish"
    },
    {
      itemId: "compatibility-contract",
      label: "Compatibility contract posture",
      category: "compatibility",
      state:
        project.packagingState.releaseCandidateReady
          ? "complete"
          : project.packagingState.readiness === "blocked"
            ? "blocked"
            : "warning",
      summary:
        project.packagingState.releaseCandidateReady
          ? "Current project posture supports a release-candidate claim."
          : "Compatibility and packaging posture still need a successful readiness pass.",
      actionPath: "/package",
      ownerModule: "package"
    }
  ];
}
