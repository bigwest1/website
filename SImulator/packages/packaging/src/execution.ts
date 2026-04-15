import {
  buildArtifactSchema,
  buildExecutionLogSchema,
  packageBuildSchema,
  releaseRecipeSchema,
  releaseRecordSchema,
  type BuildArtifact,
  type BuildExecutionMode,
  type BuildExecutionPhase,
  type BuildExecutionLog,
  type BuildRuntimeVerificationState,
  type PackageBuild,
  type ReleaseChannel,
  type ReleaseRecipe,
  type ReleaseRecord
} from "./models";
import {
  buildPackagingChecklist,
  derivePackagingResult,
  summarizeReleaseConvergence
} from "./analysis";

type ValidationIssueLike = {
  severity: "info" | "warning" | "high" | "critical";
  ownerModule: string;
  title?: string;
  summary?: string;
  recommendedFix?: string;
};

type PackagingExecutionProjectLike = Parameters<typeof summarizeReleaseConvergence>[0];
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

export type GeneratedBuildArtifactFile = {
  relativePath: string;
  content: string;
};

export type PackageBuildExecutionResult = {
  build: PackageBuild;
  releaseRecord: ReleaseRecord | null;
  packagingState: {
    latestBuildId: string;
    readiness: "blocked" | "in-progress" | "ready";
    releaseCandidateReady: boolean;
  };
  generatedFiles: GeneratedBuildArtifactFile[];
};

function buildExecutionLog(
  phase: BuildExecutionLog["phase"],
  level: BuildExecutionLog["level"],
  message: string,
  createdAt: string,
): BuildExecutionLog {
  return buildExecutionLogSchema.parse({
    logId: `build-log-${phase}-${createdAt}-${message.slice(0, 24).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
    phase,
    level,
    message,
    createdAt
  });
}

function buildArtifact(input: BuildArtifact): BuildArtifact {
  return buildArtifactSchema.parse(input);
}

function markdownList(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function createPresentationSharePacketMarkdown(input: {
  courseName: string;
  buildId: string;
  createdAt: string;
  executionMode: BuildExecutionMode;
  readinessLabel: string;
  summary: string;
  assetPaths: string[];
  nextActions: string[];
}) {
  return [
    `# ${input.courseName} — Presentation Share Packet`,
    "",
    `Build ID: ${input.buildId}`,
    `Generated: ${input.createdAt}`,
    `Execution mode: ${input.executionMode}`,
    `Share-ready posture: ${input.readinessLabel}`,
    "",
    "## Summary",
    "",
    input.summary,
    "",
    "## Included Assets",
    "",
    markdownList(input.assetPaths),
    "",
    "## Next Actions",
    "",
    markdownList(input.nextActions)
  ].join("\n");
}

function artifactSizeFor(
  files: GeneratedBuildArtifactFile[],
  relativePath: string,
) {
  return files.find((file) => file.relativePath === relativePath)?.content.length ?? null;
}

function labelForManagedBridgeArtifact(relativePath: string) {
  const leaf = relativePath.split("/").filter(Boolean).at(-1) ?? "bridge-output.json";
  return leaf
    .replace(/\.[^.]+$/, "")
    .split(/[-_]+/)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function createManagedBridgeArtifactRefs(input: {
  buildId: string;
  createdAt: string;
  bridgeArtifactPaths: string[];
}) {
  return input.bridgeArtifactPaths.map((relativePath, index) =>
    buildArtifact({
      artifactId: `${input.buildId}-managed-bridge-${index + 1}`,
      label: labelForManagedBridgeArtifact(relativePath),
      artifactType: "managed-bridge-output",
      relativePath,
      status: "generated",
      generatedAt: input.createdAt,
      sizeBytes: null,
      note: "Managed adapter output generated outside the package-owned artifact writer."
    }),
  );
}

function buildIdForTimestamp(createdAt: string) {
  return `build-${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`;
}

function recipeTypeForProfile(profileId: PackageBuild["profileId"]): ReleaseRecipe["recipeType"] {
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

function recipeLabelForProfile(profileId: PackageBuild["profileId"]) {
  switch (profileId) {
    case "brother-mode":
      return "GSPro Brother Mode Release";
    case "showcase":
      return "GSPro Showcase Release";
    case "community-safe":
    default:
      return "GSPro Community Safe Release";
  }
}

function profileDisplayName(profileId: PackageBuild["profileId"]) {
  switch (profileId) {
    case "brother-mode":
      return "Brother Mode";
    case "showcase":
      return "Showcase";
    case "community-safe":
    default:
      return "Community Safe";
  }
}

function logLevelForDiagnostic(diagnostic: string): BuildExecutionLog["level"] {
  const normalized = diagnostic.toLowerCase();
  return normalized.includes("fail") ||
    normalized.includes("error") ||
    normalized.includes("blocked") ||
    normalized.includes("missing")
    ? "error"
    : "warning";
}

function normalizeExecutionPhase(phase: string): BuildExecutionPhase {
  switch (phase) {
    case "preflight":
    case "bridge-handshake":
    case "recipe-preparation":
    case "recipe-execution":
    case "recipe-validation":
    case "artifact-generation":
    case "preview-sync":
    case "publish-sync":
    case "artifact-persist":
    case "finalizing":
      return phase;
    default:
      return "recipe-execution";
  }
}

function logLevelForStepStatus(
  status: ManagedBridgeStepLike["status"],
): BuildExecutionLog["level"] {
  switch (status) {
    case "failed":
      return "error";
    case "skipped":
      return "warning";
    case "pending":
      return "warning";
    case "succeeded":
    default:
      return "info";
  }
}

function toReleaseRecipeStep(
  step: ManagedBridgeStepLike,
): ReleaseRecipe["steps"][number] {
  return {
    stepId: step.stepId,
    label: step.label,
    phase: normalizeExecutionPhase(step.phase),
    ownerModule: "integration",
    status: step.status,
    summary: step.summary,
    toolId: step.toolId ?? null,
    executedCommand: step.executedCommand ?? null,
    attemptCount: 1,
    outputPaths: step.outputPaths ?? [],
    diagnostics: step.diagnostics ?? []
  };
}

function createBuildPaths(input: {
  outputDirectoryRoot: string;
  buildId: string;
  slug: string;
}) {
  const outputDirectory = `${input.outputDirectoryRoot}/${input.buildId}`;

  return {
    outputDirectory,
    manifestPath: `${outputDirectory}/manifest/build-manifest.json`,
    packagePath: `${outputDirectory}/course/${input.slug}.gspro-release.json`,
    previewSummaryPath: `${outputDirectory}/preview/preview-readiness.json`,
    previewGuidePath: `${outputDirectory}/preview/release-preview-guide.md`,
    compatibilityReportPath: `${outputDirectory}/release/gspro-compatibility-report.json`,
    publishRecordPath: `${outputDirectory}/release/publish-record.json`,
    creatorHandoffPath: `${outputDirectory}/release/creator-release-handoff.md`,
    finalDeliveryReportPath: `${outputDirectory}/delivery/final-delivery-summary.json`,
    presentationSharePacketPath: `${outputDirectory}/delivery/presentation-share-packet.md`,
    shareGateSignoffPath: `${outputDirectory}/delivery/share-gate-signoff.md`,
    shareGateLockPath: `${outputDirectory}/delivery/share-gate-lock.md`,
    creditsReportPath: `${outputDirectory}/release/credits-audit.json`,
    artifactManifestPath: `${outputDirectory}/manifest/artifact-manifest.json`,
    releaseNotesPath: `${outputDirectory}/release/release-notes.md`,
    recipeManifestPath: `${outputDirectory}/recipe/gspro-release-recipe.json`,
    recipeStepResultsPath: `${outputDirectory}/recipe/gspro-step-results.json`,
    runtimeReportPath: `${outputDirectory}/runtime/native-runtime-verification.json`,
    exportLogPath: `${outputDirectory}/logs/gspro-export-log.json`
  };
}

function createReleaseRecipe(input: {
  buildId: string;
  createdAt: string;
  outputDirectory: string;
  profileId: PackageBuild["profileId"];
  executionMode: BuildExecutionMode;
  bridgeSummary: string;
  bridgeAdapterId?: string | null;
  bridgeSucceeded?: boolean;
  bridgeExecutedCommand?: string | null;
  bridgeStepResults?: ManagedBridgeStepLike[];
  bridgeDiagnostics: string[];
  executionSucceeded: boolean;
  generatedPaths: {
    packagePath: string;
    recipeManifestPath: string;
    recipeStepResultsPath: string;
    compatibilityReportPath: string;
    runtimeReportPath: string;
    exportLogPath: string;
    previewSummaryPath: string;
    previewGuidePath: string;
    publishRecordPath: string;
    artifactManifestPath: string;
  };
}) {
  const recipeId = `recipe-${input.buildId}`;
  const bridgeSteps = (input.bridgeStepResults ?? []).map((step) => toReleaseRecipeStep(step));
  const bridgeExecutionFailed = bridgeSteps.some((step) => step.status === "failed") || input.bridgeSucceeded === false;
  const bridgeHandshakeStatus =
    input.bridgeSucceeded === false
      ? "failed"
      : input.bridgeSummary
        ? "succeeded"
        : "skipped";
  const executionStatus =
    !input.executionSucceeded || bridgeExecutionFailed ? "failed" : "succeeded";
  const downstreamStatus = input.executionSucceeded ? "succeeded" : "skipped";

  return releaseRecipeSchema.parse({
    recipeId,
    recipeType: recipeTypeForProfile(input.profileId),
    label: recipeLabelForProfile(input.profileId),
    profileId: input.profileId,
    exportTarget: "gspro-compatible",
    outputRoot: input.outputDirectory,
    diagnostics: [
      `Execution mode: ${input.executionMode}`,
      input.bridgeSummary,
      ...input.bridgeDiagnostics
    ].filter(Boolean),
    steps: [
      {
        stepId: `${recipeId}-bridge`,
        label: "Managed Bridge Handshake",
        phase: "bridge-handshake",
        ownerModule: "integration",
        status: bridgeHandshakeStatus,
        summary: input.bridgeSummary,
        toolId: input.bridgeAdapterId ?? null,
        executedCommand: input.bridgeExecutedCommand ?? null,
        attemptCount: 1,
        outputPaths: [],
        diagnostics: input.bridgeDiagnostics
      },
      ...bridgeSteps,
      {
        stepId: `${recipeId}-prepare`,
        label: "Prepare GSPro Release Recipe",
        phase: "recipe-preparation",
        ownerModule: "packaging",
        status: input.executionSucceeded ? "succeeded" : "skipped",
        summary: `Prepared ${profileDisplayName(input.profileId)} recipe structure and output directories.`,
        toolId: null,
        executedCommand: null,
        attemptCount: 1,
        outputPaths: [input.generatedPaths.recipeManifestPath, input.generatedPaths.recipeStepResultsPath],
        diagnostics: []
      },
      {
        stepId: `${recipeId}-execute`,
        label: "Generate GSPro Release Artifacts",
        phase: "recipe-execution",
        ownerModule: "packaging",
        status: executionStatus,
        summary: input.executionSucceeded
          ? "Release package, runtime report, compatibility report, and export log were generated."
          : "Release execution stopped before the full GSPro artifact set could be generated.",
        toolId: null,
        executedCommand: null,
        attemptCount: 1,
        outputPaths: [
          input.generatedPaths.packagePath,
          input.generatedPaths.compatibilityReportPath,
          input.generatedPaths.runtimeReportPath,
          input.generatedPaths.exportLogPath,
          input.generatedPaths.artifactManifestPath
        ],
        diagnostics: []
      },
      {
        stepId: `${recipeId}-validate`,
        label: "Validate Geometry And Runtime Trust",
        phase: "recipe-validation",
        ownerModule: "validation",
        status: downstreamStatus,
        summary: input.executionSucceeded
          ? "Export geometry and runtime posture were captured for downstream release modules."
          : "Export geometry and runtime posture were recorded in failure mode for diagnosis.",
        toolId: null,
        executedCommand: null,
        attemptCount: 1,
        outputPaths: [input.generatedPaths.compatibilityReportPath, input.generatedPaths.runtimeReportPath],
        diagnostics: []
      },
      {
        stepId: `${recipeId}-preview`,
        label: "Synchronize Preview Outputs",
        phase: "preview-sync",
        ownerModule: "preview",
        status: downstreamStatus,
        summary: input.executionSucceeded
          ? "Preview summaries and release preview guide were linked to this recipe run."
          : "Preview synchronization was skipped because recipe execution did not complete cleanly.",
        toolId: null,
        executedCommand: null,
        attemptCount: 1,
        outputPaths: [input.generatedPaths.previewSummaryPath, input.generatedPaths.previewGuidePath],
        diagnostics: []
      },
      {
        stepId: `${recipeId}-publish`,
        label: "Reconcile Publish Draft",
        phase: "publish-sync",
        ownerModule: "publish",
        status: downstreamStatus,
        summary: input.executionSucceeded
          ? "Publish draft linkage and artifact manifest outputs were synchronized."
          : "Publish reconciliation was skipped because the release run did not complete cleanly.",
        toolId: null,
        executedCommand: null,
        attemptCount: 1,
        outputPaths: [input.generatedPaths.publishRecordPath, input.generatedPaths.artifactManifestPath],
        diagnostics: []
      }
    ]
  });
}

export function executeReleaseRun(input: {
  project: PackagingExecutionProjectLike;
  validationIssues?: ValidationIssueLike[];
  profileId: PackageBuild["profileId"];
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
}): PackageBuildExecutionResult {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const releaseConvergence = summarizeReleaseConvergence(input.project, input.validationIssues ?? []);
  const checklist = buildPackagingChecklist(input.project, input.validationIssues ?? []);
  const result = derivePackagingResult(checklist);
  const buildId = buildIdForTimestamp(createdAt);
  const outputDirectoryRoot = input.outputDirectoryRoot ?? "exports/gspro-release-runs";
  const paths = createBuildPaths({
    outputDirectoryRoot,
    buildId,
    slug: input.project.manifest.slug
  });
  const runtimeVerificationState = input.runtimeVerificationState ?? "preview-only";
  const runtimeVerificationSummary =
    input.runtimeVerificationSummary ??
    (runtimeVerificationState === "verified"
      ? "Native runtime posture is strong enough for persisted Build, recovery, and release execution."
      : runtimeVerificationState === "partially-verified"
        ? "Native runtime posture is only partially verified, so release trust remains limited."
        : runtimeVerificationState === "unavailable"
          ? "Native runtime verification could not complete on this host."
          : runtimeVerificationState === "degraded"
            ? "Native runtime posture is degraded and reduces release trust."
            : "Browser preview posture cannot verify native runtime execution.");
  const runtimeVerificationEvidence = input.runtimeVerificationEvidence ?? [];
  const retryCount = input.retryCount ?? 0;
  const executionMode =
    input.executionMode ??
    (input.bridgeAdapterId ? "repo-backed" : "package-owned");
  const bridgeDiagnostics = input.bridgeDiagnostics ?? [];
  const bridgeArtifactPaths = input.bridgeArtifactPaths ?? [];
  const bridgeStepResults = input.bridgeStepResults ?? [];
  const bridgeFailure = input.bridgeSucceeded === false;
  const executionFailed = result.readiness === "blocked" || bridgeFailure;
  const releaseRecipe = createReleaseRecipe({
    buildId,
    createdAt,
    outputDirectory: paths.outputDirectory,
    profileId: input.profileId,
    executionMode,
    bridgeAdapterId: input.bridgeAdapterId,
    bridgeSucceeded: input.bridgeSucceeded,
    bridgeExecutedCommand: input.bridgeExecutedCommand ?? null,
    bridgeStepResults,
    bridgeSummary:
      input.bridgeSummary ??
      "No managed bridge summary was supplied, so execution relied on the package-owned GSPro release recipe path.",
    bridgeDiagnostics,
    executionSucceeded: !executionFailed,
    generatedPaths: {
      packagePath: paths.packagePath,
      recipeManifestPath: paths.recipeManifestPath,
      recipeStepResultsPath: paths.recipeStepResultsPath,
      compatibilityReportPath: paths.compatibilityReportPath,
      runtimeReportPath: paths.runtimeReportPath,
      exportLogPath: paths.exportLogPath,
      previewSummaryPath: paths.previewSummaryPath,
      previewGuidePath: paths.previewGuidePath,
      publishRecordPath: paths.publishRecordPath,
      artifactManifestPath: paths.artifactManifestPath
    }
  });
  const logs: BuildExecutionLog[] = [
    buildExecutionLog(
      "preflight",
      executionFailed ? "error" : "info",
      `Preflight completed with ${result.blockerCount} blockers and ${result.warningCount} warnings.`,
      createdAt,
    )
  ];

  logs.push(
    buildExecutionLog(
      "bridge-handshake",
      bridgeFailure ? "error" : input.bridgeSummary ? "info" : "warning",
      input.bridgeSummary ??
        "No managed bridge summary was supplied, so execution is relying on the package-owned release path only.",
      createdAt,
    ),
  );

  for (const diagnostic of bridgeDiagnostics) {
    logs.push(
      buildExecutionLog(
        "bridge-handshake",
        logLevelForDiagnostic(diagnostic),
        diagnostic,
        createdAt,
      ),
    );
  }

  for (const step of bridgeStepResults) {
    logs.push(
      buildExecutionLog(
        normalizeExecutionPhase(step.phase),
        logLevelForStepStatus(step.status),
        `${step.label}: ${step.summary}`,
        createdAt,
      ),
    );

    for (const diagnostic of step.diagnostics ?? []) {
      logs.push(
        buildExecutionLog(
          normalizeExecutionPhase(step.phase),
          logLevelForDiagnostic(diagnostic),
          diagnostic,
          createdAt,
        ),
      );
    }
  }

  logs.push(
    buildExecutionLog(
      "recipe-validation",
      runtimeVerificationState === "verified" ? "info" : "warning",
      runtimeVerificationSummary,
      createdAt,
    ),
  );

  if (executionFailed) {
    const failureReason = bridgeFailure
      ? input.bridgeSummary ?? "Managed GSPro release execution failed before artifact generation completed."
      : releaseConvergence.recommendedAction;
    const failureGeneratedFiles: GeneratedBuildArtifactFile[] = [
      {
        relativePath: paths.manifestPath,
        content: JSON.stringify(
          {
            buildId,
            createdAt,
            profileId: input.profileId,
            projectId: input.project.id,
            projectName: input.project.manifest.name,
            status: "failed",
            failureReason,
            releaseRecipe: {
              recipeId: releaseRecipe.recipeId,
              recipeType: releaseRecipe.recipeType,
              outputRoot: releaseRecipe.outputRoot
            },
            runtimeVerificationState,
            runtimeVerificationSummary,
            runtimeVerificationEvidence,
            bridge: {
              adapterId: input.bridgeAdapterId ?? null,
              succeeded: input.bridgeSucceeded ?? null,
              executedCommand: input.bridgeExecutedCommand ?? null,
              summary: input.bridgeSummary ?? "",
              diagnostics: bridgeDiagnostics,
              artifactPaths: bridgeArtifactPaths
            },
            convergence: {
              readiness: releaseConvergence.overallReadiness,
              blockers: releaseConvergence.blockerCount,
              warnings: releaseConvergence.warningCount
            }
          },
          null,
          2,
        )
      },
      {
        relativePath: paths.recipeManifestPath,
        content: JSON.stringify(releaseRecipe, null, 2)
      },
      {
        relativePath: paths.recipeStepResultsPath,
        content: JSON.stringify(releaseRecipe.steps, null, 2)
      },
      {
        relativePath: paths.compatibilityReportPath,
        content: JSON.stringify(
          {
            buildId,
            recipeId: releaseRecipe.recipeId,
            recipeType: releaseRecipe.recipeType,
            runtimeVerificationState,
            runtimeVerificationSummary,
            exportGeometry: releaseConvergence.exportGeometry,
            issues: releaseConvergence.issues,
            bridgeDiagnostics,
            failureReason
          },
          null,
          2,
        )
      },
      {
        relativePath: paths.runtimeReportPath,
        content: JSON.stringify(
          {
            buildId,
            recipeId: releaseRecipe.recipeId,
            checkedAt: createdAt,
            runtimeVerificationState,
            summary: runtimeVerificationSummary,
            evidence: runtimeVerificationEvidence,
            bridgeSummary: input.bridgeSummary ?? "",
            bridgeDiagnostics
          },
          null,
          2,
        )
      },
      {
        relativePath: paths.exportLogPath,
        content: JSON.stringify(
          {
            buildId,
            recipeId: releaseRecipe.recipeId,
            createdAt,
            failureReason,
            logs: logs.map((log) => ({
              phase: log.phase,
              level: log.level,
              message: log.message,
              createdAt: log.createdAt
            })),
            bridgeDiagnostics
          },
          null,
          2,
        )
      },
      {
        relativePath: paths.creatorHandoffPath,
        content: [
          `# ${input.project.manifest.name} — Creator Release Handoff`,
          "",
          `Build ID: ${buildId}`,
          `Generated: ${createdAt}`,
          `Execution mode: ${executionMode}`,
          `Runtime verification: ${runtimeVerificationState}`,
          "",
          "## Handoff Status",
          "",
          "- Release handoff is blocked because the latest run failed before a delivery-ready artifact set was produced.",
          `- Failure reason: ${failureReason}`,
          `- Managed adapter: ${input.bridgeAdapterId ?? "package-owned path"}`,
          "",
          "## Next Steps",
          "",
        markdownList(
          [
            failureReason,
            "Review Package Center failure states and managed bridge diagnostics.",
            "Repair preview, publish, or runtime blockers before retrying the release run.",
            `Inspect the blocked presentation packet: ${paths.presentationSharePacketPath}`
          ],
        )
        ].join("\n")
      },
      {
        relativePath: paths.finalDeliveryReportPath,
        content: JSON.stringify(
          {
            buildId,
            createdAt,
            executionMode,
            deliveryReady: false,
            handoffReady: false,
            releaseRecordReady: false,
            previewFresh: false,
            failureReason,
            nextActions: [
              failureReason,
              "Review Package Center failure states and managed bridge diagnostics.",
              "Repair preview, publish, or runtime blockers before retrying final delivery."
            ]
          },
          null,
          2,
        )
      },
      {
        relativePath: paths.presentationSharePacketPath,
        content: createPresentationSharePacketMarkdown({
          courseName: input.project.manifest.name,
          buildId,
          createdAt,
          executionMode,
          readinessLabel: "blocked",
          summary: "The presentation share packet is not ready because the release run failed before a show-safe artifact set was produced.",
          assetPaths: [
            paths.creatorHandoffPath,
            paths.finalDeliveryReportPath,
            paths.artifactManifestPath,
            paths.exportLogPath
          ],
          nextActions: [
            failureReason,
            "Review Package Center failure states and managed bridge diagnostics.",
            "Repair preview, publish, or runtime blockers before retrying the release run."
          ]
        })
      },
      {
        relativePath: paths.shareGateSignoffPath,
        content: [
          `# ${input.project.manifest.name} — Share Gate Signoff`,
          "",
          `Build ID: ${buildId}`,
          `Generated: ${createdAt}`,
          "",
          "## Signoff Status",
          "",
          "- Final share approval is blocked because the release run failed before a trusted packet could be produced.",
          `- Failure reason: ${failureReason}`,
          "",
          "## Next Steps",
          "",
          markdownList([
            failureReason,
            "Repair the failed release run before treating the share gate as signoff-ready.",
            `Inspect the blocked presentation packet: ${paths.presentationSharePacketPath}`
          ])
        ].join("\n")
      },
      {
        relativePath: paths.shareGateLockPath,
        content: [
          `# ${input.project.manifest.name} — Final Share Lock`,
          "",
          `Build ID: ${buildId}`,
          `Generated: ${createdAt}`,
          "",
          "## Lock Status",
          "",
          "- Final share lock is blocked because the release run failed before a trusted packet could be produced.",
          `- Failure reason: ${failureReason}`,
          "",
          "## Next Steps",
          "",
          markdownList([
            failureReason,
            "Resolve the failed release run before treating the final share lock as trustworthy.",
            `Inspect the blocked signoff artifact: ${paths.shareGateSignoffPath}`,
          ]),
        ].join("\n")
      },
      {
        relativePath: paths.artifactManifestPath,
        content: JSON.stringify(
          {
            buildId,
            outputDirectory: paths.outputDirectory,
            generatedAt: createdAt,
            recipeId: releaseRecipe.recipeId,
            artifactPaths: [
              paths.manifestPath,
              paths.recipeManifestPath,
              paths.recipeStepResultsPath,
              paths.compatibilityReportPath,
              paths.runtimeReportPath,
              paths.exportLogPath,
              paths.creatorHandoffPath,
              paths.finalDeliveryReportPath,
              paths.presentationSharePacketPath,
              paths.shareGateSignoffPath,
              paths.shareGateLockPath,
              paths.artifactManifestPath,
              ...bridgeArtifactPaths
            ],
            bridgeArtifactPaths
          },
          null,
          2,
        )
      }
    ];
    const managedBridgeArtifactRefs = createManagedBridgeArtifactRefs({
      buildId,
      createdAt,
      bridgeArtifactPaths
    });
    const artifactRefs: BuildArtifact[] = [
      buildArtifact({
        artifactId: `${buildId}-manifest`,
        label: "Build Manifest",
        artifactType: "manifest",
        relativePath: paths.manifestPath,
        status: "generated",
        generatedAt: createdAt,
        sizeBytes: artifactSizeFor(failureGeneratedFiles, paths.manifestPath),
        note: "Failure manifest for the current release run."
      }),
      buildArtifact({
        artifactId: `${buildId}-recipe`,
        label: "GSPro Release Recipe",
        artifactType: "gspro-recipe",
        relativePath: paths.recipeManifestPath,
        status: "generated",
        generatedAt: createdAt,
        sizeBytes: artifactSizeFor(failureGeneratedFiles, paths.recipeManifestPath),
        note: "Recipe definition recorded for the failed release run."
      }),
      buildArtifact({
        artifactId: `${buildId}-recipe-steps`,
        label: "GSPro Recipe Step Results",
        artifactType: "recipe-step-results",
        relativePath: paths.recipeStepResultsPath,
        status: "generated",
        generatedAt: createdAt,
        sizeBytes: artifactSizeFor(failureGeneratedFiles, paths.recipeStepResultsPath),
        note: "Step-level execution results for the failed release run."
      }),
      buildArtifact({
        artifactId: `${buildId}-compatibility`,
        label: "Compatibility Report",
        artifactType: "compatibility-report",
        relativePath: paths.compatibilityReportPath,
        status: "generated",
        generatedAt: createdAt,
        sizeBytes: artifactSizeFor(failureGeneratedFiles, paths.compatibilityReportPath),
        note: "Compatibility posture captured during failure handling."
      }),
      buildArtifact({
        artifactId: `${buildId}-runtime-report`,
        label: "Runtime Verification Report",
        artifactType: "runtime-report",
        relativePath: paths.runtimeReportPath,
        status: "generated",
        generatedAt: createdAt,
        sizeBytes: artifactSizeFor(failureGeneratedFiles, paths.runtimeReportPath),
        note: "Host/runtime posture captured for the failed release run."
      }),
      buildArtifact({
        artifactId: `${buildId}-artifact-index`,
        label: "Artifact Index",
        artifactType: "artifact-manifest",
        relativePath: paths.artifactManifestPath,
        status: "generated",
        generatedAt: createdAt,
        sizeBytes: artifactSizeFor(failureGeneratedFiles, paths.artifactManifestPath),
        note: "Failure artifact catalog."
      }),
      buildArtifact({
        artifactId: `${buildId}-export-log`,
        label: "GSPro Export Log",
        artifactType: "export-log",
        relativePath: paths.exportLogPath,
        status: "generated",
        generatedAt: createdAt,
        sizeBytes: artifactSizeFor(failureGeneratedFiles, paths.exportLogPath),
        note: "Structured failure log for the release run."
      }),
      buildArtifact({
        artifactId: `${buildId}-creator-handoff`,
        label: "Creator Release Handoff",
        artifactType: "creator-handoff",
        relativePath: paths.creatorHandoffPath,
        status: "generated",
        generatedAt: createdAt,
        sizeBytes: artifactSizeFor(failureGeneratedFiles, paths.creatorHandoffPath),
        note: "Creator-facing handoff guide for the failed release run."
      }),
      buildArtifact({
        artifactId: `${buildId}-delivery-report`,
        label: "Final Delivery Summary",
        artifactType: "delivery-report",
        relativePath: paths.finalDeliveryReportPath,
        status: "generated",
        generatedAt: createdAt,
        sizeBytes: artifactSizeFor(failureGeneratedFiles, paths.finalDeliveryReportPath),
        note: "Final delivery posture recorded for the failed release run."
      }),
      buildArtifact({
        artifactId: `${buildId}-presentation-share-packet`,
        label: "Presentation Share Packet",
        artifactType: "presentation-share-packet",
        relativePath: paths.presentationSharePacketPath,
        status: "generated",
        generatedAt: createdAt,
        sizeBytes: artifactSizeFor(failureGeneratedFiles, paths.presentationSharePacketPath),
        note: "Creator-facing presentation packet for diagnosing why the latest release run is not show-safe yet."
      }),
      buildArtifact({
        artifactId: `${buildId}-share-gate-signoff`,
        label: "Share Gate Signoff",
        artifactType: "share-gate-signoff",
        relativePath: paths.shareGateSignoffPath,
        status: "generated",
        generatedAt: createdAt,
        sizeBytes: artifactSizeFor(failureGeneratedFiles, paths.shareGateSignoffPath),
        note: "Durable signoff artifact that records the last proof posture before final share approval."
      }),
      buildArtifact({
        artifactId: `${buildId}-share-gate-lock`,
        label: "Share Gate Lock",
        artifactType: "share-gate-lock",
        relativePath: paths.shareGateLockPath,
        status: "generated",
        generatedAt: createdAt,
        sizeBytes: artifactSizeFor(failureGeneratedFiles, paths.shareGateLockPath),
        note: "Durable lock artifact that records whether final share is ready to be locked for release."
      }),
      buildArtifact({
        artifactId: `${buildId}-package`,
        label: "Course Package Snapshot",
        artifactType: "course-package",
        relativePath: paths.packagePath,
        status: "failed",
        generatedAt: null,
        sizeBytes: null,
        note: "Course package output was not generated because the release run failed."
      }),
      ...managedBridgeArtifactRefs
    ];
    const build = packageBuildSchema.parse({
      buildId,
      profileId: input.profileId,
      createdAt,
      status: "failed",
      executionState: "failed",
      executionMode,
      runtimeVerificationState,
      runtimeVerificationSummary,
      runtimeVerificationEvidence,
      progressPercent: 22,
      startedAt: createdAt,
      completedAt: createdAt,
      outputDirectory: paths.outputDirectory,
      artifactCount: artifactRefs.length,
      diagnosticsSummary: failureReason,
      artifactRefs,
      executionLogs: [
        ...logs,
        buildExecutionLog(
          "finalizing",
          "error",
          bridgeFailure
            ? "Build execution stopped because the managed GSPro bridge failed."
            : "Build execution stopped because release convergence is still blocked.",
          createdAt,
        )
      ],
      failureReason,
      retryCount,
      releaseRecordRef: null,
      bridgeSummary: input.bridgeSummary ?? "",
      bridgeAdapterId: input.bridgeAdapterId ?? null,
      checklist,
      releaseRecipe,
      result,
      notes: bridgeFailure
        ? "Tool-backed GSPro release execution failed before the full artifact set could be generated."
        : "Release-candidate execution was halted before artifact generation because convergence is still blocked."
    });

    return {
      build,
      releaseRecord: null,
      packagingState: {
        latestBuildId: build.buildId,
        readiness: "blocked",
        releaseCandidateReady: false
      },
      generatedFiles: failureGeneratedFiles
    };
  }

  const generatedFiles: GeneratedBuildArtifactFile[] = [
    {
      relativePath: paths.manifestPath,
      content: JSON.stringify(
        {
          buildId,
          createdAt,
          profileId: input.profileId,
          projectId: input.project.id,
          projectName: input.project.manifest.name,
          executionMode,
          releaseRecipe: {
            recipeId: releaseRecipe.recipeId,
            recipeType: releaseRecipe.recipeType,
            exportTarget: releaseRecipe.exportTarget,
            outputRoot: releaseRecipe.outputRoot
          },
          runtimeVerificationState,
          runtimeVerificationSummary,
          runtimeVerificationEvidence,
          bridge: {
            adapterId: input.bridgeAdapterId ?? null,
            succeeded: input.bridgeSucceeded ?? null,
            executedCommand: input.bridgeExecutedCommand ?? null,
            summary: input.bridgeSummary ?? "",
            diagnostics: bridgeDiagnostics,
            artifactPaths: bridgeArtifactPaths,
            stepResults: bridgeStepResults
          },
          convergence: {
            readiness: releaseConvergence.overallReadiness,
            blockers: releaseConvergence.blockerCount,
            warnings: releaseConvergence.warningCount
          },
          exportGeometry: releaseConvergence.exportGeometry
        },
        null,
        2,
      )
    },
    {
      relativePath: paths.recipeManifestPath,
      content: JSON.stringify(releaseRecipe, null, 2)
    },
    {
      relativePath: paths.recipeStepResultsPath,
      content: JSON.stringify(releaseRecipe.steps, null, 2)
    },
    {
      relativePath: paths.packagePath,
      content: JSON.stringify(
        {
          buildId,
          generatedAt: createdAt,
          releaseRecipeId: releaseRecipe.recipeId,
          recipeType: releaseRecipe.recipeType,
          executionMode,
          projectManifest: input.project.manifest,
          geometryReadiness: releaseConvergence.exportGeometry.readiness,
          latestPreviewSummary: releaseConvergence.previewSummary,
          packageChecklist: checklist,
          latestValidationIssueCount: input.validationIssues?.length ?? 0,
          bridgeArtifactPaths,
          bridgeStepResults
        },
        null,
        2,
      )
    },
    {
      relativePath: paths.previewSummaryPath,
      content: JSON.stringify(releaseConvergence.previewSummary, null, 2)
    },
    {
      relativePath: paths.previewGuidePath,
      content: [
        `# ${input.project.manifest.name} — Preview Release Guide`,
        "",
        `Generated: ${createdAt}`,
        "",
        "## Release Convergence",
        "",
        `- Overall readiness: ${releaseConvergence.overallReadiness}`,
        `- Blockers: ${releaseConvergence.blockerCount}`,
        `- Warnings: ${releaseConvergence.warningCount}`,
        "",
        "## Preview Gaps",
        "",
        releaseConvergence.issues.length > 0
          ? markdownList(releaseConvergence.issues.map((issue) => `${issue.title}: ${issue.actionPath}`))
          : "- Preview posture is clear enough for this release candidate."
      ].join("\n")
    },
    {
      relativePath: paths.compatibilityReportPath,
      content: JSON.stringify(
        {
          buildId,
          recipeId: releaseRecipe.recipeId,
          recipeType: releaseRecipe.recipeType,
          runtimeVerificationState,
          runtimeVerificationSummary,
          overallReadiness: releaseConvergence.overallReadiness,
          exportGeometry: releaseConvergence.exportGeometry,
          issues: releaseConvergence.issues,
          bridgeDiagnostics,
          bridgeStepResults
        },
        null,
        2,
      )
    },
    {
      relativePath: paths.runtimeReportPath,
      content: JSON.stringify(
        {
          buildId,
          recipeId: releaseRecipe.recipeId,
          checkedAt: createdAt,
          executionMode,
          runtimeVerificationState,
          adapterId: input.bridgeAdapterId ?? null,
          bridgeSummary: input.bridgeSummary ?? "",
          bridgeDiagnostics,
          summary: runtimeVerificationSummary,
          evidence: runtimeVerificationEvidence
        },
        null,
        2,
      )
    },
    {
      relativePath: paths.creditsReportPath,
      content: JSON.stringify(
        {
          buildId,
          creditsSummary:
            input.project.releaseRecords[0]?.creditsSummary ??
            "Course Creator OS project team and source contributors.",
          mediaChecklist:
            input.project.releaseRecords[0]?.mediaChecklist ?? [
              "Approve hero screenshots and preview media.",
              "Record source acknowledgments and contributor credits."
            ]
        },
        null,
        2,
      )
    },
    {
      relativePath: paths.releaseNotesPath,
      content: [
        `# ${input.project.manifest.name} — Candidate Build`,
        "",
        `Build ID: ${buildId}`,
        `Generated: ${createdAt}`,
        `Profile: ${input.profileId}`,
        `Execution mode: ${executionMode}`,
        "",
        "## Summary",
        "",
        result.summary,
        "",
        "## GSPro Release Recipe",
        "",
        `- ${releaseRecipe.label}`,
        `- Runtime verification: ${runtimeVerificationState}`,
        `- Managed adapter: ${input.bridgeAdapterId ?? "package-owned path"}`,
        "",
        "## Recommended Next Action",
        "",
        releaseConvergence.recommendedAction
      ].join("\n")
    },
    {
      relativePath: paths.creatorHandoffPath,
      content: [
        `# ${input.project.manifest.name} — Creator Release Handoff`,
        "",
        `Build ID: ${buildId}`,
        `Generated: ${createdAt}`,
        `Profile: ${input.profileId}`,
        `Execution mode: ${executionMode}`,
        `Runtime verification: ${runtimeVerificationState}`,
        "",
        "## Release Outcome",
        "",
        `- Build status: ${releaseConvergence.warningCount > 0 || runtimeVerificationState !== "verified" || bridgeDiagnostics.length > 0 ? "candidate" : "ready"}`,
        `- Managed adapter: ${input.bridgeAdapterId ?? "package-owned path"}`,
        `- Managed bridge outputs: ${bridgeArtifactPaths.length}`,
        `- Export geometry readiness: ${releaseConvergence.exportGeometry.readiness}`,
        "",
        "## Delivery Assets",
        "",
        markdownList([
          `Course package: ${paths.packagePath}`,
          `Artifact manifest: ${paths.artifactManifestPath}`,
          `Publish draft: ${paths.publishRecordPath}`,
          `Preview guide: ${paths.previewGuidePath}`,
          `Release notes: ${paths.releaseNotesPath}`,
          `Presentation share packet: ${paths.presentationSharePacketPath}`,
          `Share gate signoff: ${paths.shareGateSignoffPath}`,
          `Share gate lock: ${paths.shareGateLockPath}`,
          `Runtime report: ${paths.runtimeReportPath}`
        ]),
        "",
        "## Next Steps",
        "",
        markdownList([
          releaseConvergence.recommendedAction,
          releaseConvergence.previewSummary.overallReadiness === "ready"
            ? "Preview outputs are aligned closely enough to inspect during final handoff."
            : "Review Preview Studio before treating screenshots, flyovers, and showcase sequences as final handoff assets.",
          bridgeArtifactPaths.length > 0
            ? "Inspect managed bridge outputs alongside the artifact manifest before final creator handoff."
            : "Review the artifact manifest and runtime report before final creator handoff."
        ])
      ].join("\n")
    },
    {
      relativePath: paths.finalDeliveryReportPath,
      content: JSON.stringify(
        {
          buildId,
          createdAt,
          executionMode,
          runtimeVerificationState,
          releaseRecipeId: releaseRecipe.recipeId,
          releaseDraftAligned: true,
          previewFresh: releaseConvergence.previewSummary.overallReadiness === "ready",
          handoffReady: true,
          deliveryReady:
            releaseConvergence.overallReadiness === "ready" &&
            runtimeVerificationState !== "unavailable",
          generatedArtifactPaths: [
            paths.packagePath,
            paths.artifactManifestPath,
            paths.publishRecordPath,
            paths.creatorHandoffPath,
            paths.previewGuidePath,
            paths.releaseNotesPath,
            paths.presentationSharePacketPath,
            paths.shareGateSignoffPath,
            paths.shareGateLockPath
          ],
          bridgeArtifactPaths,
          nextActions: [
            releaseConvergence.recommendedAction,
            "Inspect the creator handoff guide and artifact manifest before final delivery.",
            "Confirm preview outputs, release draft, and credits remain aligned to this build."
          ]
        },
        null,
        2,
      )
    },
    {
      relativePath: paths.presentationSharePacketPath,
      content: createPresentationSharePacketMarkdown({
        courseName: input.project.manifest.name,
        buildId,
        createdAt,
        executionMode,
        readinessLabel:
          releaseConvergence.warningCount > 0 || runtimeVerificationState !== "verified"
            ? "watch"
            : "ready",
        summary:
          releaseConvergence.warningCount > 0 || runtimeVerificationState !== "verified"
            ? "The course is close to show-ready, but a smaller set of remaining warnings still deserves one more review pass."
            : "The course is aligned closely enough across preview, package, and publish posture to hand off as a presentation-safe showcase packet.",
        assetPaths: [
          paths.previewGuidePath,
          paths.releaseNotesPath,
          paths.creatorHandoffPath,
          paths.finalDeliveryReportPath,
          paths.artifactManifestPath,
          paths.packagePath
        ],
        nextActions: [
          releaseConvergence.recommendedAction,
          "Inspect Preview, Package, and Publish against this packet before external sharing.",
          "Confirm screenshots, showcase media, and credits still match the current build."
        ]
      })
    },
    {
      relativePath: paths.shareGateSignoffPath,
      content: [
        `# ${input.project.manifest.name} — Share Gate Signoff`,
        "",
        `Build ID: ${buildId}`,
        `Generated: ${createdAt}`,
        `Profile: ${input.profileId}`,
        "",
        "## Signoff Posture",
        "",
        `- Gate posture: ${releaseConvergence.warningCount > 0 || runtimeVerificationState !== "verified" ? "watch" : "approved"}`,
        `- Preview alignment: ${releaseConvergence.previewSummary.overallReadiness}`,
        `- Runtime verification: ${runtimeVerificationState}`,
        `- Packet: ${paths.presentationSharePacketPath}`,
        "",
        "## Signoff Checks",
        "",
        markdownList([
          "Preview, Package, and Publish should agree on the latest build posture before external sharing.",
          "Selected media and release packet assets should already match this build manifest.",
          bridgeArtifactPaths.length > 0
            ? "Managed bridge outputs should be inspected alongside the package-owned packet before final signoff."
            : "Package-owned artifacts are sufficient for the current signoff pass."
        ]),
        "",
        "## Next Action",
        "",
        releaseConvergence.recommendedAction
      ].join("\n")
    },
    {
      relativePath: paths.shareGateLockPath,
      content: [
        `# ${input.project.manifest.name} — Final Share Lock`,
        "",
        `Build ID: ${buildId}`,
        `Generated: ${createdAt}`,
        `Profile: ${input.profileId}`,
        "",
        "## Lock Posture",
        "",
        `- Lock state: ${releaseConvergence.warningCount > 0 || runtimeVerificationState !== "verified" ? "watch" : "locked"}`,
        `- Presentation packet: ${paths.presentationSharePacketPath}`,
        `- Signoff artifact: ${paths.shareGateSignoffPath}`,
        "",
        "## Lock Checks",
        "",
        markdownList([
          "Preview, Package, and Publish should agree on the final packet posture before the lock is treated as final.",
          "Selected shipping media should already match the latest manifest and build truth before the lock is trusted.",
          bridgeArtifactPaths.length > 0
            ? "Managed bridge outputs should still be inspected alongside the locked packet reference."
            : "Package-owned artifacts are sufficient for the current lock reference."
        ]),
        "",
        "## Next Action",
        "",
        releaseConvergence.recommendedAction
      ].join("\n")
    },
    {
      relativePath: paths.exportLogPath,
      content: JSON.stringify(
        {
          buildId,
          recipeId: releaseRecipe.recipeId,
          createdAt,
          executionMode,
          logs: logs.map((log) => ({
            phase: log.phase,
            level: log.level,
            message: log.message,
            createdAt: log.createdAt
          })),
          bridgeDiagnostics,
          bridgeStepResults
        },
        null,
        2,
      )
    },
    {
      relativePath: paths.artifactManifestPath,
      content: JSON.stringify(
        {
          buildId,
          outputDirectory: paths.outputDirectory,
          generatedAt: createdAt,
          executionMode,
          recipeId: releaseRecipe.recipeId,
          recipeType: releaseRecipe.recipeType,
          artifactPaths: [
            paths.manifestPath,
            paths.recipeManifestPath,
            paths.recipeStepResultsPath,
            paths.packagePath,
            paths.previewSummaryPath,
            paths.previewGuidePath,
            paths.compatibilityReportPath,
            paths.runtimeReportPath,
            paths.creditsReportPath,
            paths.publishRecordPath,
            paths.releaseNotesPath,
            paths.creatorHandoffPath,
            paths.finalDeliveryReportPath,
            paths.presentationSharePacketPath,
            paths.shareGateSignoffPath,
            paths.shareGateLockPath,
            paths.exportLogPath,
            ...bridgeArtifactPaths
          ],
          bridgeArtifactPaths
        },
        null,
        2,
      )
    }
  ];

  logs.push(
    buildExecutionLog(
      "recipe-preparation",
      "info",
      `${releaseRecipe.label} was prepared for ${input.project.manifest.name}.`,
      createdAt,
    ),
    buildExecutionLog(
      "recipe-execution",
      bridgeDiagnostics.some((diagnostic) => logLevelForDiagnostic(diagnostic) === "error") ? "warning" : "info",
      `GSPro-facing release recipe generated ${generatedFiles.length} package-owned files${bridgeArtifactPaths.length > 0 ? ` plus ${bridgeArtifactPaths.length} managed bridge outputs` : ""}.`,
      createdAt,
    ),
    buildExecutionLog(
      "recipe-validation",
      releaseConvergence.exportGeometry.readiness === "ready" ? "info" : "warning",
      `Export geometry readiness is ${releaseConvergence.exportGeometry.readiness} for ${releaseRecipe.recipeType}.`,
      createdAt,
    ),
    buildExecutionLog(
      "artifact-generation",
      "info",
      `Generated ${generatedFiles.length} release artifact files in ${paths.outputDirectory}.`,
      createdAt,
    ),
    buildExecutionLog(
      "preview-sync",
      releaseConvergence.previewSummary.overallReadiness === "ready" ? "info" : "warning",
      `Preview readiness is ${releaseConvergence.previewSummary.overallReadiness} for this release run.`,
      createdAt,
    ),
    buildExecutionLog(
      "publish-sync",
      releaseConvergence.publishSummary.hasCourseDescription &&
        releaseConvergence.publishSummary.hasReleaseNotes
        ? "info"
        : "warning",
      releaseConvergence.publishSummary.hasCourseDescription &&
        releaseConvergence.publishSummary.hasReleaseNotes
        ? "Publish metadata is present for this release run."
        : "Publish metadata is still incomplete for a stronger public release posture.",
      createdAt,
    ),
    buildExecutionLog(
      "finalizing",
      releaseConvergence.warningCount > 0 || runtimeVerificationState !== "verified" ? "warning" : "info",
      releaseConvergence.warningCount > 0 || runtimeVerificationState !== "verified"
        ? "Release run completed, but remaining warnings or runtime trust limits still reduce publish confidence."
        : "Release run completed cleanly with strong native/runtime posture.",
      createdAt,
    ),
  );

  const managedBridgeArtifactRefs = createManagedBridgeArtifactRefs({
    buildId,
    createdAt,
    bridgeArtifactPaths
  });
  let artifactRefs: BuildArtifact[] = [
    buildArtifact({
      artifactId: `${buildId}-manifest`,
      label: "Build Manifest",
      artifactType: "manifest",
      relativePath: paths.manifestPath,
      status: "generated",
      generatedAt: createdAt,
      sizeBytes: artifactSizeFor(generatedFiles, paths.manifestPath),
      note: "Execution manifest for the current candidate build."
    }),
    buildArtifact({
      artifactId: `${buildId}-recipe`,
      label: "GSPro Release Recipe",
      artifactType: "gspro-recipe",
      relativePath: paths.recipeManifestPath,
      status: "generated",
      generatedAt: createdAt,
      sizeBytes: artifactSizeFor(generatedFiles, paths.recipeManifestPath),
      note: "Recipe definition for the current GSPro-facing release run."
    }),
    buildArtifact({
      artifactId: `${buildId}-recipe-steps`,
      label: "GSPro Recipe Step Results",
      artifactType: "recipe-step-results",
      relativePath: paths.recipeStepResultsPath,
      status: "generated",
      generatedAt: createdAt,
      sizeBytes: artifactSizeFor(generatedFiles, paths.recipeStepResultsPath),
      note: "Step-level execution results for the GSPro-facing release run."
    }),
    buildArtifact({
      artifactId: `${buildId}-package`,
      label: "Course Package Snapshot",
      artifactType: "course-package",
      relativePath: paths.packagePath,
      status: "generated",
      generatedAt: createdAt,
      sizeBytes: artifactSizeFor(generatedFiles, paths.packagePath),
      note: "Structured export snapshot derived from authored geometry and release convergence."
    }),
    buildArtifact({
      artifactId: `${buildId}-preview`,
      label: "Preview Release Guide",
      artifactType: "preview-media",
      relativePath: paths.previewGuidePath,
      status: "generated",
      generatedAt: createdAt,
      sizeBytes: artifactSizeFor(generatedFiles, paths.previewGuidePath),
      note: "Preview handoff notes tied to the current candidate."
    }),
    buildArtifact({
      artifactId: `${buildId}-compatibility`,
      label: "Compatibility Report",
      artifactType: "compatibility-report",
      relativePath: paths.compatibilityReportPath,
      status: "generated",
      generatedAt: createdAt,
      sizeBytes: artifactSizeFor(generatedFiles, paths.compatibilityReportPath),
      note: "Geometry, validation, and runtime posture summary for this release run."
    }),
    buildArtifact({
      artifactId: `${buildId}-runtime-report`,
      label: "Runtime Verification Report",
      artifactType: "runtime-report",
      relativePath: paths.runtimeReportPath,
      status: "generated",
      generatedAt: createdAt,
      sizeBytes: artifactSizeFor(generatedFiles, paths.runtimeReportPath),
      note: "Host/runtime verification posture captured during the release run."
    }),
    buildArtifact({
      artifactId: `${buildId}-credits`,
      label: "Credits Audit",
      artifactType: "credits-report",
      relativePath: paths.creditsReportPath,
      status: "generated",
      generatedAt: createdAt,
      sizeBytes: artifactSizeFor(generatedFiles, paths.creditsReportPath),
      note: "Credits and media checklist audit captured during the release run."
    }),
    buildArtifact({
      artifactId: `${buildId}-artifact-index`,
      label: "Artifact Index",
      artifactType: "artifact-manifest",
      relativePath: paths.artifactManifestPath,
      status: "generated",
      generatedAt: createdAt,
      sizeBytes: artifactSizeFor(generatedFiles, paths.artifactManifestPath),
      note: "Catalog of files produced by this release run."
    }),
    buildArtifact({
      artifactId: `${buildId}-release-notes`,
      label: "Candidate Release Notes",
      artifactType: "release-notes",
      relativePath: paths.releaseNotesPath,
      status: "generated",
      generatedAt: createdAt,
      sizeBytes: artifactSizeFor(generatedFiles, paths.releaseNotesPath),
      note: "Release summary for preview, package, and publish review."
    }),
    buildArtifact({
      artifactId: `${buildId}-creator-handoff`,
      label: "Creator Release Handoff",
      artifactType: "creator-handoff",
      relativePath: paths.creatorHandoffPath,
      status: "generated",
      generatedAt: createdAt,
      sizeBytes: artifactSizeFor(generatedFiles, paths.creatorHandoffPath),
      note: "Creator-facing handoff guide for the completed release run."
    }),
    buildArtifact({
      artifactId: `${buildId}-delivery-report`,
      label: "Final Delivery Summary",
      artifactType: "delivery-report",
      relativePath: paths.finalDeliveryReportPath,
      status: "generated",
      generatedAt: createdAt,
      sizeBytes: artifactSizeFor(generatedFiles, paths.finalDeliveryReportPath),
      note: "Final delivery posture recorded for the completed release run."
    }),
    buildArtifact({
      artifactId: `${buildId}-presentation-share-packet`,
      label: "Presentation Share Packet",
      artifactType: "presentation-share-packet",
      relativePath: paths.presentationSharePacketPath,
      status: "generated",
      generatedAt: createdAt,
      sizeBytes: artifactSizeFor(generatedFiles, paths.presentationSharePacketPath),
      note: "Calm creator-facing packet that aligns preview, package, and publish posture for sharing."
    }),
    buildArtifact({
      artifactId: `${buildId}-share-gate-signoff`,
      label: "Share Gate Signoff",
      artifactType: "share-gate-signoff",
      relativePath: paths.shareGateSignoffPath,
      status: "generated",
      generatedAt: createdAt,
      sizeBytes: artifactSizeFor(generatedFiles, paths.shareGateSignoffPath),
      note: "Durable signoff record for the final share gate approval pass."
    }),
    buildArtifact({
      artifactId: `${buildId}-share-gate-lock`,
      label: "Share Gate Lock",
      artifactType: "share-gate-lock",
      relativePath: paths.shareGateLockPath,
      status: "generated",
      generatedAt: createdAt,
      sizeBytes: artifactSizeFor(generatedFiles, paths.shareGateLockPath),
      note: "Durable lock record for the final share approval pass."
    }),
    buildArtifact({
      artifactId: `${buildId}-export-log`,
      label: "GSPro Export Log",
      artifactType: "export-log",
      relativePath: paths.exportLogPath,
      status: "generated",
      generatedAt: createdAt,
      sizeBytes: artifactSizeFor(generatedFiles, paths.exportLogPath),
      note: "Structured phase log for the current release recipe."
    }),
    ...managedBridgeArtifactRefs
  ];

  const buildStatus =
    releaseConvergence.warningCount > 0 ||
    runtimeVerificationState !== "verified" ||
    bridgeDiagnostics.length > 0
      ? "candidate"
      : "ready";
  const draftBuild = packageBuildSchema.parse({
    buildId,
    profileId: input.profileId,
    createdAt,
    status: buildStatus,
    executionState: "succeeded",
    executionMode,
    runtimeVerificationState,
    runtimeVerificationSummary,
    runtimeVerificationEvidence,
    progressPercent: 100,
    startedAt: createdAt,
    completedAt: createdAt,
    outputDirectory: paths.outputDirectory,
    artifactCount: artifactRefs.length,
    diagnosticsSummary: releaseConvergence.recommendedAction,
    artifactRefs,
    executionLogs: logs,
    failureReason: null,
    retryCount,
    releaseRecordRef: null,
    bridgeSummary: input.bridgeSummary ?? "",
    bridgeAdapterId: input.bridgeAdapterId ?? null,
    releaseRecipe,
    checklist,
    result,
    notes:
      buildStatus === "ready"
        ? "GSPro-facing release run completed with clear enough posture for publish drafting."
        : "GSPro-facing release run completed, but warnings, bridge diagnostics, or runtime verification limits still reduce publish confidence."
  });
  const releaseRecord = createReleaseRecordFromBuild({
    project: input.project,
    build: draftBuild,
    createdAt
  });
  generatedFiles.push({
    relativePath: paths.publishRecordPath,
    content: JSON.stringify(releaseRecord, null, 2)
  });
  artifactRefs = [
    ...artifactRefs,
    buildArtifact({
      artifactId: `${buildId}-publish-record`,
      label: "Publish Release Draft",
      artifactType: "publish-record",
      relativePath: paths.publishRecordPath,
      status: "generated",
      generatedAt: createdAt,
      sizeBytes: artifactSizeFor(generatedFiles, paths.publishRecordPath),
      note: "Release draft record linked to the current build."
    })
  ];
  const build = packageBuildSchema.parse({
    ...draftBuild,
    artifactRefs,
    artifactCount: artifactRefs.length,
    releaseRecordRef: releaseRecord.releaseId
  });

  return {
    build,
    releaseRecord: {
      ...releaseRecord,
      packageBuildRef: build.buildId,
      releaseRecipeRef: releaseRecipe.recipeId,
      artifactManifestRef: paths.artifactManifestPath
    },
    packagingState: {
      latestBuildId: build.buildId,
      readiness:
        build.status === "ready"
          ? "ready"
          : releaseConvergence.overallReadiness === "blocked"
            ? "blocked"
            : "in-progress",
      releaseCandidateReady: build.status === "ready"
    },
    generatedFiles
  };
}

export function executeReleaseCandidateBuild(input: {
  project: PackagingExecutionProjectLike;
  validationIssues?: ValidationIssueLike[];
  profileId: PackageBuild["profileId"];
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
}): PackageBuildExecutionResult {
  return executeReleaseRun(input);
}

export function createReleaseRecordFromBuild(input: {
  project: PackagingExecutionProjectLike;
  build: PackageBuild;
  channel?: ReleaseChannel;
  createdAt?: string;
}): ReleaseRecord {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const releaseConvergence = summarizeReleaseConvergence(input.project);
  const latestExisting = input.project.releaseRecords[0];

  return releaseRecordSchema.parse({
    releaseId: `release-${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
    versionLabel:
      latestExisting?.versionLabel ??
      `${input.project.manifest.version}-candidate`,
    createdAt,
    channel: input.channel ?? "community",
    status: input.build.status === "ready" ? "candidate" : "draft",
    packageBuildRef: input.build.buildId,
    releaseRecipeRef: input.build.releaseRecipe?.recipeId ?? null,
    artifactManifestRef:
      input.build.artifactRefs.find((artifact) => artifact.artifactType === "artifact-manifest")?.relativePath ?? null,
    previewReady: input.build.artifactRefs.some((artifact) => artifact.artifactType === "preview-media"),
    creditsComplete: Boolean(
      (latestExisting?.creditsSummary ?? "Course Creator OS project team and source contributors.").trim(),
    ),
    sourceAuditComplete: Boolean(
      (latestExisting?.mediaChecklist.length ?? 0) > 0 ||
        input.build.artifactRefs.some((artifact) => artifact.artifactType === "credits-report"),
    ),
    publishedAt: latestExisting?.publishedAt ?? null,
    publicSafe: input.project.manifest.projectMode === "public-safe" && input.build.status !== "failed",
    notes: `Release draft derived from ${input.build.buildId}. ${releaseConvergence.recommendedAction}`,
    courseDescription:
      latestExisting?.courseDescription ??
      input.project.courseBible.visionOverview.statement,
    creditsSummary:
      latestExisting?.creditsSummary ??
      "Course Creator OS project team and source contributors.",
    mediaChecklist:
      latestExisting?.mediaChecklist.length
        ? latestExisting.mediaChecklist
        : [
            "Approve hero screenshot set.",
            "Confirm showcase sequence and flyover opener.",
            "Verify credits and source acknowledgments.",
            "Review the creator release handoff guide before final delivery."
          ],
    releaseNotes:
      latestExisting?.releaseNotes.length
        ? latestExisting.releaseNotes
        : [
            `${input.build.buildId} generated ${input.build.artifactCount} artifacts.`,
            releaseConvergence.recommendedAction
          ]
  });
}
