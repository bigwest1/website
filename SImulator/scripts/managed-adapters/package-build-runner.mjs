#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import {
  buildHostNotes,
  createStep,
  looksLikeFilesystemPath,
  parseCli,
  parseJsonOutput,
  printVersion,
  readOptionalString,
  resolveOutputRoot,
  runAdapterTool,
  sanitizeIdentifier,
  toProjectRelativePath,
  writeJsonFailure,
  writeJsonFile,
  writeJsonStdout
} from "./shared.mjs";

const TOOL_NAME = "package-build-runner";

const { command, flags } = parseCli(process.argv.slice(2));

if (!command || command === "--version" || flags.version) {
  printVersion(TOOL_NAME);
  process.exit(0);
}

if (command !== "build-release-candidate") {
  writeJsonFailure({
    success: false,
    summary: `Unsupported command '${command}'.`,
    artifactPaths: [],
    diagnostics: [`${TOOL_NAME} only supports 'build-release-candidate'.`],
    hostVerificationNotes: buildHostNotes(),
    retrySuggested: false
  });
}

const projectRoot = readOptionalString(flags["project-root"]);
const outputProfile = readOptionalString(flags["output-profile"]) ?? "community-safe";
const buildId = readOptionalString(flags["build-id"]) ?? `build-${Date.now()}`;
const recipeHint = readOptionalString(flags["recipe-hint"]) ?? `gspro-${outputProfile}`;
const manifestPath =
  readOptionalString(flags["manifest-path"]) ??
  (projectRoot ? path.resolve(projectRoot, "project.manifest.json") : null);
const compatibilityBridgePath = readOptionalString(flags["compatibility-bridge"]);
const externalExportToolPath = readOptionalString(flags["external-export-tool"]);
const outputRoot = resolveOutputRoot(
  projectRoot ?? process.cwd(),
  readOptionalString(flags["release-output-root"]),
  [buildId, "managed-bridge"],
);
const diagnostics = [];
const stepResults = [];
const artifactPaths = [];
const remediationHints = [];
const toRelative = (filePath) => (projectRoot ? toProjectRelativePath(projectRoot, filePath) : filePath);

if (!projectRoot || !fs.existsSync(projectRoot)) {
  diagnostics.push("Project root does not exist, so managed release execution could not begin.");
  remediationHints.push("Open or persist a valid project root before running a managed release build.");
}

if (!manifestPath || !fs.existsSync(manifestPath)) {
  diagnostics.push("Project manifest is missing, so release recipe inputs are incomplete.");
  remediationHints.push("Restore project.manifest.json before relying on managed release execution.");
}

stepResults.push(
  createStep({
    stepId: `${sanitizeIdentifier(buildId, "release")}-input-validation`,
    label: "Validate release inputs",
    phase: "bridge-handshake",
    status: diagnostics.length === 0 ? "succeeded" : "failed",
    summary:
      diagnostics.length === 0
        ? "Managed release input validation completed cleanly."
        : "Managed release input validation found missing or invalid project inputs.",
    toolId: TOOL_NAME,
    executedCommand: `${TOOL_NAME} build-release-candidate --json`,
    diagnostics
  }),
);

if (diagnostics.length > 0) {
  const failureReportPath = path.join(outputRoot, "package-build-runner-report.json");
  artifactPaths.push(
    toRelative(writeJsonFile(failureReportPath, {
      tool: TOOL_NAME,
      buildId,
      recipeHint,
      projectRoot,
      manifestPath,
      outputProfile,
      diagnostics,
      checkedAt: new Date().toISOString()
    })),
  );

  writeJsonFailure({
    success: false,
    executionMode: externalExportToolPath ? "mixed" : "repo-backed",
    summary: "Managed package runner found missing release inputs.",
    managedOutputRoot: toRelative(outputRoot),
    artifactPaths,
    diagnostics,
    stepResults,
    hostVerificationNotes: buildHostNotes(),
    remediationHints,
    retrySuggested: false
  });
}

let compatibilityDiagnostics = [];
if (!compatibilityBridgePath) {
  compatibilityDiagnostics = [
    "GSPro compatibility bridge is not configured, so tool-backed export validation is incomplete."
  ];
  remediationHints.push("Configure the GSPro compatibility bridge path in Settings before trusting GSPro export validation.");
}

if (
  compatibilityBridgePath &&
  looksLikeFilesystemPath(compatibilityBridgePath) &&
  !fs.existsSync(compatibilityBridgePath)
) {
  compatibilityDiagnostics = [
    `Configured GSPro compatibility bridge was not found at ${compatibilityBridgePath}.`
  ];
  remediationHints.push("Repair the GSPro compatibility bridge path so managed release validation can run.");
}

if (compatibilityDiagnostics.length > 0) {
  stepResults.push(
    createStep({
      stepId: `${sanitizeIdentifier(buildId, "release")}-compatibility-link`,
      label: "Run GSPro compatibility bridge",
      phase: "recipe-validation",
      status: "failed",
      summary: "Managed package runner could not execute the GSPro compatibility bridge.",
      toolId: "gspro-compatibility-bridge",
      executedCommand: compatibilityBridgePath,
      diagnostics: compatibilityDiagnostics
    }),
  );

  const failureReportPath = path.join(outputRoot, "package-build-runner-report.json");
  artifactPaths.push(
    toRelative(writeJsonFile(failureReportPath, {
      tool: TOOL_NAME,
      buildId,
      recipeHint,
      projectRoot,
      manifestPath,
      outputProfile,
      diagnostics: compatibilityDiagnostics,
      checkedAt: new Date().toISOString()
    })),
  );

  writeJsonFailure({
    success: false,
    executionMode: externalExportToolPath ? "mixed" : "repo-backed",
    summary: "Managed package runner could not link the GSPro compatibility bridge.",
    managedOutputRoot: toRelative(outputRoot),
    artifactPaths,
    diagnostics: compatibilityDiagnostics,
    stepResults,
    hostVerificationNotes: buildHostNotes(),
    remediationHints,
    retrySuggested: true
  });
}

const compatibilityOutputRoot = path.join(outputRoot, "compatibility");
const compatibilityRun = runAdapterTool(
  compatibilityBridgePath,
  [
    "verify-export",
    "--json",
    "--project-root",
    projectRoot,
    "--output-profile",
    outputProfile,
    "--build-id",
    buildId,
    "--recipe-hint",
    recipeHint,
    "--output-root",
    compatibilityOutputRoot,
    "--manifest-path",
    manifestPath
  ],
  projectRoot,
);
const parsedCompatibility = parseJsonOutput(compatibilityRun.stdout);
const compatibilityArtifactPaths = Array.isArray(parsedCompatibility?.artifactPaths)
  ? parsedCompatibility.artifactPaths.filter((entry) => typeof entry === "string")
  : [];
const compatibilityStepResults = Array.isArray(parsedCompatibility?.stepResults)
  ? parsedCompatibility.stepResults.filter((entry) => entry && typeof entry === "object")
  : [];
const compatibilitySummary =
  readOptionalString(parsedCompatibility?.summary) ??
  (compatibilityRun.success
    ? "GSPro compatibility bridge completed successfully."
    : "GSPro compatibility bridge failed.");
const compatibilitySteps =
  compatibilityStepResults.length > 0
    ? compatibilityStepResults
    : [
        createStep({
          stepId: `${sanitizeIdentifier(buildId, "release")}-compatibility-verify`,
          label: "Run GSPro compatibility bridge",
          phase: "recipe-validation",
          status: compatibilityRun.success ? "succeeded" : "failed",
          summary: compatibilitySummary,
          toolId: "gspro-compatibility-bridge",
          executedCommand: compatibilityRun.commandLine,
          outputPaths: compatibilityArtifactPaths,
          diagnostics: [
            ...(Array.isArray(parsedCompatibility?.diagnostics)
              ? parsedCompatibility.diagnostics.filter((entry) => typeof entry === "string")
              : []),
            ...(compatibilityRun.stderr ? [compatibilityRun.stderr] : []),
            ...(compatibilityRun.error ? [compatibilityRun.error] : [])
          ].filter(Boolean)
        })
      ];

stepResults.push(...compatibilitySteps);
artifactPaths.push(...compatibilityArtifactPaths);
remediationHints.push(
  ...(Array.isArray(parsedCompatibility?.remediationHints)
    ? parsedCompatibility.remediationHints.filter((entry) => typeof entry === "string")
    : []),
);

let externalExportSucceeded = true;
let externalToolchainProbeSucceeded = false;
let externalDeliveryFinalizationSucceeded = true;
let externalDeliveryFinalizationAttempted = false;
const externalExportArtifactPaths = [];
const externalExportDiagnostics = [];
const externalExportSteps = [];

if (!externalExportToolPath) {
  externalExportDiagnostics.push(
    "No real external GSPro export tool is configured, so this run remains repo-backed for export execution.",
  );
  remediationHints.push(
    "Configure a real external GSPro export tool in Settings to deepen production release evidence.",
  );
  externalExportSteps.push(
    createStep({
      stepId: `${sanitizeIdentifier(buildId, "release")}-external-gspro-export`,
      label: "Run external GSPro export tool",
      phase: "recipe-execution",
      status: "skipped",
      summary: "No external GSPro export tool was configured for this release run.",
      toolId: "gspro-export-tool",
      executedCommand: null,
      diagnostics: externalExportDiagnostics
    }),
  );
  externalExportSteps.push(
    createStep({
      stepId: `${sanitizeIdentifier(buildId, "release")}-external-delivery-finalize`,
      label: "Finalize creator delivery outputs",
      phase: "finalizing",
      status: "skipped",
      summary: "Creator delivery finalization was skipped because no external GSPro export tool was configured.",
      toolId: "gspro-export-tool",
      executedCommand: null,
      diagnostics: [
        "External creator-delivery finalization is unavailable until a GSPro export tool is configured."
      ]
    }),
  );
} else if (
  looksLikeFilesystemPath(externalExportToolPath) &&
  !fs.existsSync(externalExportToolPath)
) {
  externalExportSucceeded = false;
  externalExportDiagnostics.push(
    `Configured external GSPro export tool was not found at ${externalExportToolPath}.`,
  );
  remediationHints.push(
    "Repair the configured external GSPro export tool path before relying on production release execution.",
  );
  externalExportSteps.push(
    createStep({
      stepId: `${sanitizeIdentifier(buildId, "release")}-external-gspro-export`,
      label: "Run external GSPro export tool",
      phase: "recipe-execution",
      status: "failed",
      summary: "External GSPro export tool could not be executed because the configured path is missing.",
      toolId: "gspro-export-tool",
      executedCommand: externalExportToolPath,
      diagnostics: externalExportDiagnostics
    }),
  );
  externalExportSteps.push(
    createStep({
      stepId: `${sanitizeIdentifier(buildId, "release")}-external-delivery-finalize`,
      label: "Finalize creator delivery outputs",
      phase: "finalizing",
      status: "skipped",
      summary: "Creator delivery finalization was skipped because the external GSPro export tool path is missing.",
      toolId: "gspro-export-tool",
      executedCommand: externalExportToolPath,
      diagnostics: [
        "Repair the configured external GSPro export tool path before relying on creator-delivery finalization."
      ]
    }),
  );
} else {
  const externalToolchainOutputRoot = path.join(outputRoot, "external-export", "toolchain");
  const externalToolchainRun = runAdapterTool(
    externalExportToolPath,
    [
      "probe-toolchain",
      "--json",
      "--project-root",
      projectRoot,
      "--output-profile",
      outputProfile,
      "--build-id",
      buildId,
      "--recipe-hint",
      recipeHint,
      "--output-root",
      externalToolchainOutputRoot,
      "--manifest-path",
      manifestPath
    ],
    projectRoot,
  );
  const parsedExternalToolchain = parseJsonOutput(externalToolchainRun.stdout);
  const parsedExternalToolchainSummary =
    readOptionalString(parsedExternalToolchain?.summary) ??
    (externalToolchainRun.success
      ? "External GSPro toolchain probe completed successfully."
      : "External GSPro toolchain probe did not complete cleanly.");
  const parsedExternalToolchainArtifactPaths = Array.isArray(parsedExternalToolchain?.artifactPaths)
    ? parsedExternalToolchain.artifactPaths
        .filter((entry) => typeof entry === "string")
        .map((entry) => toRelative(entry))
    : [];
  const parsedExternalToolchainStepResults = Array.isArray(parsedExternalToolchain?.stepResults)
    ? parsedExternalToolchain.stepResults.filter((entry) => entry && typeof entry === "object")
    : [];
  const parsedExternalToolchainDiagnostics = Array.isArray(parsedExternalToolchain?.diagnostics)
    ? parsedExternalToolchain.diagnostics.filter((entry) => typeof entry === "string")
    : [];
  const parsedExternalToolchainRemediationHints = Array.isArray(parsedExternalToolchain?.remediationHints)
    ? parsedExternalToolchain.remediationHints.filter((entry) => typeof entry === "string")
    : [];

  externalToolchainProbeSucceeded = externalToolchainRun.success;
  externalExportArtifactPaths.push(...parsedExternalToolchainArtifactPaths);
  remediationHints.push(...parsedExternalToolchainRemediationHints);
  if (parsedExternalToolchainStepResults.length > 0) {
    externalExportSteps.push(...parsedExternalToolchainStepResults);
  } else {
    externalExportSteps.push(
      createStep({
        stepId: `${sanitizeIdentifier(buildId, "release")}-external-gspro-toolchain`,
        label: "Probe external GSPro toolchain",
        phase: "bridge-handshake",
        status: externalToolchainRun.success ? "succeeded" : "skipped",
        summary: parsedExternalToolchainSummary,
        toolId: "gspro-export-tool",
        executedCommand: externalToolchainRun.commandLine,
        outputPaths: parsedExternalToolchainArtifactPaths,
        diagnostics: [
          ...parsedExternalToolchainDiagnostics,
          ...(externalToolchainRun.stderr ? [externalToolchainRun.stderr] : []),
          ...(externalToolchainRun.error ? [externalToolchainRun.error] : []),
          ...(externalToolchainRun.success
            ? []
            : [
                "External toolchain probe did not complete cleanly, so export evidence will rely on the run-export step."
              ])
        ].filter(Boolean)
      }),
    );
  }
  if (!externalToolchainRun.success) {
    externalExportDiagnostics.push(
      ...parsedExternalToolchainDiagnostics,
      ...(externalToolchainRun.stderr ? [externalToolchainRun.stderr] : []),
      ...(externalToolchainRun.error ? [externalToolchainRun.error] : []),
      "External toolchain probe did not complete cleanly, so live host evidence for the export tool remains limited.",
    );
    remediationHints.push(
      "Prefer an external GSPro export tool that supports 'probe-toolchain --json' so live readiness can be captured before export.",
    );
  }

  const externalOutputRoot = path.join(outputRoot, "external-export");
  const externalExportRun = runAdapterTool(
    externalExportToolPath,
    [
      "run-export",
      "--json",
      "--project-root",
      projectRoot,
      "--output-profile",
      outputProfile,
      "--build-id",
      buildId,
      "--recipe-hint",
      recipeHint,
      "--output-root",
      externalOutputRoot,
      "--manifest-path",
      manifestPath
    ],
    projectRoot,
  );
  const parsedExternalExport = parseJsonOutput(externalExportRun.stdout);
  const parsedExternalSummary =
    readOptionalString(parsedExternalExport?.summary) ??
    (externalExportRun.success
      ? "External GSPro export tool completed successfully."
      : "External GSPro export tool failed.");
  const parsedExternalArtifactPaths = Array.isArray(parsedExternalExport?.artifactPaths)
    ? parsedExternalExport.artifactPaths
        .filter((entry) => typeof entry === "string")
        .map((entry) => toRelative(entry))
    : [];
  const parsedExternalStepResults = Array.isArray(parsedExternalExport?.stepResults)
    ? parsedExternalExport.stepResults.filter((entry) => entry && typeof entry === "object")
    : [];
  const parsedExternalDiagnostics = Array.isArray(parsedExternalExport?.diagnostics)
    ? parsedExternalExport.diagnostics.filter((entry) => typeof entry === "string")
    : [];
  const parsedExternalRemediationHints = Array.isArray(parsedExternalExport?.remediationHints)
    ? parsedExternalExport.remediationHints.filter((entry) => typeof entry === "string")
    : [];

  externalExportSucceeded = externalExportRun.success;
  externalExportArtifactPaths.push(...parsedExternalArtifactPaths);
  externalExportDiagnostics.push(
    ...parsedExternalDiagnostics,
    ...(externalExportRun.stderr ? [externalExportRun.stderr] : []),
    ...(externalExportRun.error ? [externalExportRun.error] : []),
  );
  remediationHints.push(...parsedExternalRemediationHints);
  externalExportSteps.push(
    ...(parsedExternalStepResults.length > 0
      ? parsedExternalStepResults
      : [
          createStep({
            stepId: `${sanitizeIdentifier(buildId, "release")}-external-gspro-export`,
            label: "Run external GSPro export tool",
            phase: "recipe-execution",
            status: externalExportRun.success ? "succeeded" : "failed",
            summary: parsedExternalSummary,
            toolId: "gspro-export-tool",
            executedCommand: externalExportRun.commandLine,
            outputPaths: parsedExternalArtifactPaths,
            diagnostics: externalExportDiagnostics
          })
        ]),
  );

  if (externalExportRun.success) {
    externalDeliveryFinalizationAttempted = true;
    const externalDeliveryOutputRoot = path.join(outputRoot, "external-export", "delivery");
    const externalDeliveryRun = runAdapterTool(
      externalExportToolPath,
      [
        "finalize-delivery",
        "--json",
        "--project-root",
        projectRoot,
        "--output-profile",
        outputProfile,
        "--build-id",
        buildId,
        "--recipe-hint",
        recipeHint,
        "--output-root",
        externalDeliveryOutputRoot,
        "--manifest-path",
        manifestPath
      ],
      projectRoot,
    );
    const parsedExternalDelivery = parseJsonOutput(externalDeliveryRun.stdout);
    const parsedExternalDeliverySummary =
      readOptionalString(parsedExternalDelivery?.summary) ??
      (externalDeliveryRun.success
        ? "External creator delivery finalization completed."
        : "External creator delivery finalization did not complete cleanly.");
    const parsedExternalDeliveryArtifactPaths = Array.isArray(parsedExternalDelivery?.artifactPaths)
      ? parsedExternalDelivery.artifactPaths
          .filter((entry) => typeof entry === "string")
          .map((entry) => toRelative(entry))
      : [];
    const parsedExternalDeliveryStepResults = Array.isArray(parsedExternalDelivery?.stepResults)
      ? parsedExternalDelivery.stepResults.filter((entry) => entry && typeof entry === "object")
      : [];
    const parsedExternalDeliveryDiagnostics = Array.isArray(parsedExternalDelivery?.diagnostics)
      ? parsedExternalDelivery.diagnostics.filter((entry) => typeof entry === "string")
      : [];
    const parsedExternalDeliveryRemediationHints = Array.isArray(parsedExternalDelivery?.remediationHints)
      ? parsedExternalDelivery.remediationHints.filter((entry) => typeof entry === "string")
      : [];

    externalDeliveryFinalizationSucceeded = externalDeliveryRun.success;
    externalExportArtifactPaths.push(...parsedExternalDeliveryArtifactPaths);
    remediationHints.push(...parsedExternalDeliveryRemediationHints);
    externalExportDiagnostics.push(
      ...parsedExternalDeliveryDiagnostics,
      ...(externalDeliveryRun.stderr ? [externalDeliveryRun.stderr] : []),
      ...(externalDeliveryRun.error ? [externalDeliveryRun.error] : []),
    );
    externalExportSteps.push(
      ...(parsedExternalDeliveryStepResults.length > 0
        ? parsedExternalDeliveryStepResults
        : [
            createStep({
              stepId: `${sanitizeIdentifier(buildId, "release")}-external-delivery-finalize`,
              label: "Finalize creator delivery outputs",
              phase: "finalizing",
              status: externalDeliveryRun.success ? "succeeded" : "failed",
              summary: parsedExternalDeliverySummary,
              toolId: "gspro-export-tool",
              executedCommand: externalDeliveryRun.commandLine,
              outputPaths: parsedExternalDeliveryArtifactPaths,
              diagnostics: [
                ...parsedExternalDeliveryDiagnostics,
                ...(externalDeliveryRun.stderr ? [externalDeliveryRun.stderr] : []),
                ...(externalDeliveryRun.error ? [externalDeliveryRun.error] : []),
              ].filter(Boolean)
            })
          ]),
    );
    if (!externalDeliveryRun.success) {
      remediationHints.push(
        "Repair the external GSPro toolchain so creator-delivery outputs can finalize cleanly after export.",
      );
    }
  } else {
    externalExportSteps.push(
      createStep({
        stepId: `${sanitizeIdentifier(buildId, "release")}-external-delivery-finalize`,
        label: "Finalize creator delivery outputs",
        phase: "finalizing",
        status: "skipped",
        summary: "Creator delivery finalization was skipped because external export did not complete cleanly.",
        toolId: "gspro-export-tool",
        executedCommand: null,
        diagnostics: [
          "Retry external GSPro export before attempting creator-delivery finalization."
        ]
      }),
    );
  }
}

stepResults.push(...externalExportSteps);
artifactPaths.push(...externalExportArtifactPaths);
const success = compatibilityRun.success && externalExportSucceeded;

const bridgeReportPath = path.join(outputRoot, "package-build-runner-report.json");
const bridgeLogPath = path.join(outputRoot, "package-build-runner-log.json");
const bridgeStepResultsPath = path.join(outputRoot, "package-build-runner-step-results.json");
const remediationPath = path.join(outputRoot, "package-build-runner-remediation.json");
artifactPaths.push(
  toRelative(writeJsonFile(bridgeReportPath, {
    tool: TOOL_NAME,
    buildId,
    recipeHint,
    projectRoot,
      manifestPath,
      outputProfile,
      compatibilityBridgePath,
      externalExportToolPath,
      compatibilitySummary,
      externalExportSucceeded,
      externalDeliveryFinalizationAttempted,
      externalDeliveryFinalizationSucceeded,
      checkedAt: new Date().toISOString(),
      stepResults
    })),
);
artifactPaths.push(
  toRelative(writeJsonFile(bridgeLogPath, {
    command: compatibilityRun.commandLine,
    success: compatibilityRun.success,
    exitCode: compatibilityRun.exitCode,
    stdout: compatibilityRun.stdout,
    stderr: compatibilityRun.stderr,
    error: compatibilityRun.error,
    externalExport: {
      toolPath: externalExportToolPath,
      toolchainProbeSucceeded: externalToolchainProbeSucceeded,
      succeeded: externalExportSucceeded,
      deliveryFinalizationAttempted: externalDeliveryFinalizationAttempted,
      deliveryFinalizationSucceeded: externalDeliveryFinalizationSucceeded,
      diagnostics: externalExportDiagnostics
    }
  })),
);
artifactPaths.push(
  toRelative(writeJsonFile(bridgeStepResultsPath, {
    tool: TOOL_NAME,
    buildId,
    recipeHint,
    stepResults
  })),
);
artifactPaths.push(
  toRelative(writeJsonFile(remediationPath, {
    tool: TOOL_NAME,
    buildId,
    remediationHints,
    retrySuggested: !success || (externalDeliveryFinalizationAttempted && !externalDeliveryFinalizationSucceeded),
    checkedAt: new Date().toISOString()
  })),
);

stepResults.push(
  createStep({
    stepId: `${sanitizeIdentifier(buildId, "release")}-bridge-report`,
    label: "Write managed bridge reports",
    phase: "artifact-generation",
    status: compatibilityRun.success && externalExportSucceeded ? "succeeded" : "failed",
    summary: compatibilityRun.success && externalExportSucceeded
      ? "Managed package runner reports were written to the release output root."
      : "Managed package runner reports were written in failure mode for diagnosis.",
    toolId: TOOL_NAME,
    executedCommand: `${TOOL_NAME} build-release-candidate --json`,
    outputPaths: [
      toRelative(bridgeReportPath),
      toRelative(bridgeLogPath),
      toRelative(bridgeStepResultsPath),
      toRelative(remediationPath)
    ]
  }),
);

const hostVerificationNotes = buildHostNotes().concat([
  `Managed output root ${outputRoot}.`,
  `Compatibility bridge ${compatibilityBridgePath}.`,
  externalExportToolPath
    ? `External GSPro export tool ${externalExportToolPath}. Toolchain probe ${externalToolchainProbeSucceeded ? "captured live evidence" : "did not complete cleanly"}. Delivery finalization ${externalDeliveryFinalizationAttempted ? (externalDeliveryFinalizationSucceeded ? "completed." : "failed.") : "was not attempted."}`
    : "No external GSPro export tool was linked into this run."
]);
const executionMode = externalExportToolPath ? "mixed" : "repo-backed";

const output = {
  success,
  executionMode,
  summary: success
    ? externalExportToolPath
      ? externalDeliveryFinalizationAttempted && !externalDeliveryFinalizationSucceeded
        ? `Managed GSPro release bridge completed export execution for ${outputProfile}, but creator-delivery finalization did not complete cleanly.`
        : `Managed GSPro release bridge completed with external export execution for ${outputProfile}.`
      : `Managed GSPro release bridge completed for ${outputProfile}.`
    : externalExportToolPath
      ? "Managed GSPro release bridge failed during compatibility or external export execution."
      : "Managed GSPro release bridge failed during compatibility validation.",
  managedOutputRoot: toRelative(outputRoot),
  artifactPaths,
  diagnostics: [
    ...compatibilitySteps.flatMap((step) => step.diagnostics ?? []),
    ...externalExportSteps.flatMap((step) => step.diagnostics ?? [])
  ].filter(Boolean),
  stepResults,
  hostVerificationNotes,
  remediationHints,
  retrySuggested: !success || (externalDeliveryFinalizationAttempted && !externalDeliveryFinalizationSucceeded)
};

if (!success) {
  writeJsonFailure(output);
}

writeJsonStdout(output);
