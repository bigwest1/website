#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

export const ADAPTER_VERSION = "0.1.0";

export function parseCli(argv) {
  const [command, ...rest] = argv;
  const flags = {};
  const positionals = [];

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token) {
      continue;
    }

    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = rest[index + 1];
      if (!next || next.startsWith("--")) {
        flags[key] = true;
        continue;
      }

      flags[key] = next;
      index += 1;
      continue;
    }

    positionals.push(token);
  }

  return { command: command ?? null, flags, positionals };
}

export function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
  return directoryPath;
}

export function resolveOutputRoot(projectRoot, outputRoot, suffix = []) {
  const baseRoot = outputRoot
    ? path.isAbsolute(outputRoot)
      ? outputRoot
      : path.resolve(projectRoot, outputRoot)
    : projectRoot;
  return path.resolve(baseRoot, ...suffix);
}

export function writeJsonFile(filePath, payload) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  return filePath;
}

export function writeTextFile(filePath, content) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
  return filePath;
}

export function createStep(input) {
  return {
    stepId: input.stepId,
    label: input.label,
    phase: input.phase,
    status: input.status,
    summary: input.summary,
    toolId: input.toolId ?? null,
    executedCommand: input.executedCommand ?? null,
    outputPaths: input.outputPaths ?? [],
    diagnostics: input.diagnostics ?? []
  };
}

export function buildHostNotes() {
  return [
    `Adapter version ${ADAPTER_VERSION}.`,
    `Node ${process.version}.`,
    `Platform ${process.platform} ${process.arch}.`,
    `Working directory ${process.cwd()}.`,
    `Node executable ${process.execPath}.`
  ];
}

export function printVersion(toolName) {
  process.stdout.write(`${toolName} ${ADAPTER_VERSION}\n`);
}

export function writeJsonStdout(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

export function writeJsonFailure(payload, exitCode = 1) {
  writeJsonStdout(payload);
  process.exit(exitCode);
}

export function runAdapterTool(commandPath, args, workingDirectory = null) {
  const result = spawnSync(commandPath, args, {
    cwd: workingDirectory ?? process.cwd(),
    encoding: "utf8"
  });

  return {
    success: result.status === 0 && !result.error,
    exitCode: result.status,
    stdout: result.stdout?.trim() ?? "",
    stderr: result.stderr?.trim() ?? "",
    error: result.error ? String(result.error.message ?? result.error) : null,
    commandLine: [commandPath, ...args].join(" ")
  };
}

export function parseJsonOutput(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function readOptionalString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function readStringArray(value) {
  return Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : [];
}

export function sanitizeIdentifier(value, fallback) {
  return (value ?? fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallback;
}

export function looksLikeFilesystemPath(executablePath) {
  return executablePath.includes(path.sep) || executablePath.startsWith(".");
}

export function toProjectRelativePath(projectRoot, filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}
