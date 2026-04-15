#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import {
  buildHostNotes,
  parseCli,
  printVersion,
  readOptionalString,
  sanitizeIdentifier,
  writeJsonFailure,
  writeJsonFile,
  writeJsonStdout
} from "./shared.mjs";

const TOOL_NAME = "asset-import-runner";

const { command, flags } = parseCli(process.argv.slice(2));

if (!command || command === "--version" || flags.version) {
  printVersion(TOOL_NAME);
  process.exit(0);
}

if (command !== "import-asset") {
  writeJsonFailure({
    success: false,
    summary: `Unsupported command '${command}'.`,
    diagnostics: [`${TOOL_NAME} only supports 'import-asset'.`],
    hostVerificationNotes: buildHostNotes(),
    retrySuggested: false
  });
}

const assetPath = readOptionalString(flags["asset-path"]);
const destinationRoot = readOptionalString(flags["destination-root"]);
const categoryHint = readOptionalString(flags["category-hint"]) ?? "uncategorized";

if (!assetPath || !destinationRoot) {
  writeJsonFailure({
    success: false,
    summary: "Asset import runner is missing required inputs.",
    diagnostics: ["Both --asset-path and --destination-root are required."],
    hostVerificationNotes: buildHostNotes(),
    retrySuggested: false
  });
}

if (!fs.existsSync(assetPath)) {
  writeJsonFailure({
    success: false,
    summary: "Asset import runner could not find the requested source asset.",
    diagnostics: [`Asset path was not found at ${assetPath}.`],
    hostVerificationNotes: buildHostNotes(),
    retrySuggested: false
  });
}

const extension = path.extname(assetPath);
const baseName = path.basename(assetPath, extension);
const normalizedName = sanitizeIdentifier(baseName, "imported-asset");
const categoryRoot = path.resolve(destinationRoot, categoryHint);
const normalizedPath = path.join(categoryRoot, `${normalizedName}${extension || ".asset"}`);
const reportPath = path.join(categoryRoot, `${normalizedName}.import-report.json`);

fs.mkdirSync(categoryRoot, { recursive: true });
fs.copyFileSync(assetPath, normalizedPath);
writeJsonFile(reportPath, {
  tool: TOOL_NAME,
  sourcePath: assetPath,
  normalizedPath,
  categoryHint,
  importedAt: new Date().toISOString()
});

writeJsonStdout({
  success: true,
  normalizedPath,
  importedAssetId: `asset-${normalizedName}`,
  summary: "Asset normalized into the destination catalog.",
  artifactPaths: [reportPath],
  hostVerificationNotes: buildHostNotes()
});
