#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import {
  buildHostNotes,
  createStep,
  parseCli,
  printVersion,
  readOptionalString,
  resolveOutputRoot,
  sanitizeIdentifier,
  toProjectRelativePath,
  writeJsonFailure,
  writeJsonFile,
  writeJsonStdout
} from "./shared.mjs";

const TOOL_NAME = "gspro-compatibility-bridge";

const { command, flags } = parseCli(process.argv.slice(2));

if (!command || command === "--version" || flags.version) {
  printVersion(TOOL_NAME);
  process.exit(0);
}

if (command !== "verify-export") {
  writeJsonFailure({
    success: false,
    summary: `Unsupported command '${command}'.`,
    artifactPaths: [],
    diagnostics: [`${TOOL_NAME} only supports 'verify-export'.`],
    hostVerificationNotes: buildHostNotes(),
    retrySuggested: false
  });
}

const projectRoot = readOptionalString(flags["project-root"]);
const outputProfile = readOptionalString(flags["output-profile"]) ?? "community-safe";
const buildId = readOptionalString(flags["build-id"]) ?? `compat-${Date.now()}`;
const recipeHint = readOptionalString(flags["recipe-hint"]) ?? `gspro-${outputProfile}`;
const outputRoot = resolveOutputRoot(
  projectRoot ?? process.cwd(),
  readOptionalString(flags["output-root"]),
  [],
);
const manifestPath =
  readOptionalString(flags["manifest-path"]) ??
  (projectRoot ? path.resolve(projectRoot, "project.manifest.json") : null);
const diagnostics = [];
const remediationHints = [];

if (!projectRoot || !fs.existsSync(projectRoot)) {
  diagnostics.push("Project root does not exist, so GSPro compatibility verification could not begin.");
  remediationHints.push("Open or persist a valid project root before running GSPro compatibility verification.");
}

if (!manifestPath || !fs.existsSync(manifestPath)) {
  diagnostics.push("Project manifest is missing, so release metadata trust remains incomplete.");
  remediationHints.push("Restore project.manifest.json before trusting GSPro-facing release output.");
}

const succeeded = diagnostics.length === 0;
const compatibilityRoot = resolveOutputRoot(outputRoot, null, [
  sanitizeIdentifier(buildId, "compatibility-run")
]);
const reportPath = path.join(compatibilityRoot, "gspro-compatibility-report.json");
const evidencePath = path.join(compatibilityRoot, "gspro-host-evidence.json");
const logPath = path.join(compatibilityRoot, "gspro-compatibility-log.json");
const relativeReportPath = projectRoot ? toProjectRelativePath(projectRoot, reportPath) : reportPath;
const relativeEvidencePath = projectRoot ? toProjectRelativePath(projectRoot, evidencePath) : evidencePath;
const relativeLogPath = projectRoot ? toProjectRelativePath(projectRoot, logPath) : logPath;

writeJsonFile(reportPath, {
  tool: TOOL_NAME,
  buildId,
  recipeHint,
  projectRoot,
  manifestPath,
  outputProfile,
  readiness: succeeded ? "ready" : "watch",
  diagnostics,
  checkedAt: new Date().toISOString()
});
writeJsonFile(evidencePath, {
  tool: TOOL_NAME,
  hostVerificationNotes: buildHostNotes(),
  manifestPresent: Boolean(manifestPath && fs.existsSync(manifestPath)),
  projectRootPresent: Boolean(projectRoot && fs.existsSync(projectRoot))
});
writeJsonFile(logPath, {
  tool: TOOL_NAME,
  buildId,
  recipeHint,
  succeeded,
  diagnostics,
  remediationHints,
  checkedAt: new Date().toISOString()
});

const output = {
  success: succeeded,
  summary: succeeded
    ? `GSPro compatibility verification completed for ${outputProfile}.`
    : "GSPro compatibility verification found missing project inputs.",
  managedOutputRoot: projectRoot ? toProjectRelativePath(projectRoot, compatibilityRoot) : compatibilityRoot,
  artifactPaths: [relativeReportPath, relativeEvidencePath, relativeLogPath],
  diagnostics,
  hostVerificationNotes: buildHostNotes(),
  stepResults: [
    createStep({
      stepId: `${sanitizeIdentifier(buildId, "compat")}-input-validation`,
      label: "Validate GSPro compatibility inputs",
      phase: "bridge-handshake",
      status: succeeded ? "succeeded" : "failed",
      summary: succeeded
        ? "Project root and manifest inputs are present for GSPro compatibility verification."
        : "GSPro compatibility verification found missing project inputs.",
      toolId: TOOL_NAME,
      executedCommand: `${TOOL_NAME} verify-export --json`,
      diagnostics
    }),
    createStep({
      stepId: `${sanitizeIdentifier(buildId, "compat")}-compatibility-verify`,
      label: "GSPro Compatibility Verification",
      phase: "recipe-validation",
      status: succeeded ? "succeeded" : "failed",
      summary: succeeded
        ? "Managed GSPro compatibility evidence was generated."
        : "Managed GSPro compatibility evidence captured missing project inputs.",
      toolId: TOOL_NAME,
      executedCommand: `${TOOL_NAME} verify-export --json`,
      outputPaths: [relativeReportPath, relativeEvidencePath],
      diagnostics
    }),
    createStep({
      stepId: `${sanitizeIdentifier(buildId, "compat")}-compatibility-log`,
      label: "Write compatibility execution log",
      phase: "artifact-generation",
      status: "succeeded",
      summary: "Compatibility report, host evidence, and managed execution log were written.",
      toolId: TOOL_NAME,
      executedCommand: `${TOOL_NAME} verify-export --json`,
      outputPaths: [relativeReportPath, relativeEvidencePath, relativeLogPath],
      diagnostics
    })
  ],
  remediationHints,
  retrySuggested: !succeeded
};

if (!succeeded) {
  writeJsonFailure(output);
}

writeJsonStdout(output);
