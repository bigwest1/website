import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { defaultIntegrationCatalog, defaultToolCatalog } from "./defaults";
import {
  createConfiguredToolDefinitions,
  deriveIntegrationHealth,
  summarizeIntegrationHealth
} from "./summary";
import {
  AssetImportRunnerBridge,
  InMemoryToolPathProvider,
  LocalCliExecutionBridge,
  ManagedPackagingBridge,
  PackageBuildRunnerBridge,
  ProbeDrivenToolHealthChecker
} from "./runtime";

const repoRoot = path.resolve(process.cwd(), "../..");

function managedAdapterPath(fileName: string) {
  return path.join(repoRoot, "scripts", "managed-adapters", fileName);
}

function runLocalCli(request: {
  commandPath: string | null;
  args: string[];
  workingDirectory: string | null;
}) {
  if (!request.commandPath) {
    return Promise.resolve({
      success: false,
      exitCode: null,
      summary: "No command path supplied.",
      commandLine: null,
      stdout: "",
      stderr: "Command path is required."
    });
  }

  const result = spawnSync(request.commandPath, request.args, {
    cwd: request.workingDirectory ?? process.cwd(),
    encoding: "utf8"
  });

  return Promise.resolve({
    success: result.status === 0 && !result.error,
    exitCode: result.status,
    summary:
      result.status === 0 && !result.error
        ? `Executed ${request.commandPath} successfully.`
        : `Execution failed for ${request.commandPath}.`,
    commandLine: [request.commandPath, ...request.args].join(" "),
    stdout: result.stdout ?? "",
    stderr: result.error ? String(result.error.message ?? result.error) : (result.stderr ?? "")
  });
}

describe("integration summaries", () => {
  it("derives health and summary from configured tool paths", () => {
    const tools = createConfiguredToolDefinitions({
      toolCatalog: defaultToolCatalog,
      storedToolPathSettings: [
        {
          toolId: "gspro-compatibility-bridge",
          executablePath: "/Applications/gspro-bridge",
          enabled: true
        },
        {
          toolId: "asset-import-runner",
          executablePath: null,
          enabled: true
        },
        {
          toolId: "package-build-runner",
          executablePath: null,
          enabled: false
        }
      ]
    });
    const health = deriveIntegrationHealth({
      integrations: defaultIntegrationCatalog,
      toolPaths: tools,
      integrationPreferences: [
        { integrationId: "gspro-export", enabled: false },
        { integrationId: "gspro-compatibility", enabled: true },
        { integrationId: "asset-import", enabled: true },
        { integrationId: "package-build", enabled: false }
      ]
    });
    const summary = summarizeIntegrationHealth(health);

    expect(health.find((item) => item.integrationId === "gspro-compatibility")?.status).toBe("connected");
    expect(health.find((item) => item.integrationId === "asset-import")?.status).toBe("needs-config");
    expect(health.find((item) => item.integrationId === "package-build")?.status).toBe("disabled");
    expect(summary.needsConfigCount).toBe(1);
  });

  it("uses suggested repo-backed adapter paths when desktop execution allows it", () => {
    const tools = createConfiguredToolDefinitions({
      toolCatalog: defaultToolCatalog,
      storedToolPathSettings: [],
      allowSuggestedPaths: true
    });

    expect(tools.find((tool) => tool.toolId === "package-build-runner")?.executablePath).toBe(
      "scripts/managed-adapters/package-build-runner.mjs",
    );
    expect(tools.find((tool) => tool.toolId === "gspro-compatibility-bridge")?.executablePath).toBe(
      "scripts/managed-adapters/gspro-compatibility-bridge.mjs",
    );
  });

  it("runs concrete path probes and managed packaging bridge foundations", async () => {
    const tools = createConfiguredToolDefinitions({
      toolCatalog: defaultToolCatalog,
      storedToolPathSettings: [
        {
          toolId: "gspro-compatibility-bridge",
          executablePath: "/usr/local/bin/gspro-bridge",
          enabled: true
        }
      ]
    });
    const provider = new InMemoryToolPathProvider(tools);
    const checker = new ProbeDrivenToolHealthChecker(async (path) => ({
      exists: Boolean(path),
      executable: Boolean(path),
      summary: "Verified for test runtime.",
      resolvedPath: path
    }));
    const tool = await provider.getToolPath("gspro-compatibility-bridge");
    const check = await checker.checkTool(tool!);
    const bridge = new ManagedPackagingBridge(async (request) => ({
      success: true,
      adapterId: "managed-test-bridge",
      executionMode: "repo-backed",
      summary: `Managed build request accepted for ${request.outputProfile}.`,
      executedCommand: "/usr/local/bin/managed-test-bridge build-release-candidate",
      managedOutputRoot: "exports/gspro-release-runs/build-test/managed-bridge",
      artifactPaths: ["exports/gspro-release-runs/test"],
      diagnostics: [],
      stepResults: [],
      hostVerificationNotes: [],
      remediationHints: [],
      retrySuggested: false
    }));
    const result = await bridge.buildReleaseCandidate({
      projectRoot: "/tmp/course",
      outputProfile: "community-safe",
      manifestPath: "/tmp/course/project.manifest.json",
      buildId: "build-test",
      recipeHint: "gspro-community-safe",
      releaseOutputRoot: "exports/gspro-release-runs"
    });

    expect(check.status).toBe("connected");
    expect(result.success).toBe(true);
  });

  it("parses structured JSON output from the package build runner adapter", async () => {
    const tools = createConfiguredToolDefinitions({
      toolCatalog: defaultToolCatalog,
      storedToolPathSettings: [
        {
          toolId: "gspro-compatibility-bridge",
          executablePath: "/usr/local/bin/gspro-bridge",
          enabled: true
        },
        {
          toolId: "package-build-runner",
          executablePath: "/usr/local/bin/package-build-runner",
          enabled: true
        }
      ]
    });
    const provider = new InMemoryToolPathProvider(tools);
    const bridge = new PackageBuildRunnerBridge(provider, {
      execute: async () => ({
        success: true,
        exitCode: 0,
        summary: "CLI completed.",
        commandLine: "/usr/local/bin/package-build-runner build-release-candidate --json",
        stdout: JSON.stringify({
          executionMode: "mixed",
          summary: "GSPro recipe completed.",
          managedOutputRoot: "exports/gspro-release-runs/build-1/managed-bridge",
          artifactPaths: ["exports/gspro-release-runs/build-1/course/course.gspro-release.json"],
          diagnostics: ["Compatibility pass completed."],
          remediationHints: ["Review the generated manifest before publish."],
          stepResults: [
            {
              stepId: "bridge-runner-step",
              label: "Managed Package Runner",
              phase: "recipe-execution",
              status: "succeeded",
              summary: "Package runner completed.",
              toolId: "package-build-runner",
              executedCommand: "/usr/local/bin/package-build-runner build-release-candidate --json",
              outputPaths: ["exports/gspro-release-runs/build-1/course/course.gspro-release.json"],
              diagnostics: []
            }
          ],
          hostVerificationNotes: ["Package build runner resolved."],
          retrySuggested: false
        }),
        stderr: ""
      })
    });

    const result = await bridge.buildReleaseCandidate({
      projectRoot: "/tmp/course",
      outputProfile: "community-safe",
      manifestPath: "/tmp/course/project.manifest.json",
      buildId: "build-1",
      recipeHint: "gspro-community-safe",
      releaseOutputRoot: "exports/gspro-release-runs"
    });

    expect(result.success).toBe(true);
    expect(result.executionMode).toBe("mixed");
    expect(result.summary).toBe("GSPro recipe completed.");
    expect(result.artifactPaths).toEqual([
      "exports/gspro-release-runs/build-1/course/course.gspro-release.json"
    ]);
    expect(result.managedOutputRoot).toBe("exports/gspro-release-runs/build-1/managed-bridge");
    expect(result.diagnostics).toContain("Compatibility pass completed.");
    expect(result.remediationHints).toContain("Review the generated manifest before publish.");
    expect(result.stepResults[0]?.toolId).toBe("package-build-runner");
    expect(result.hostVerificationNotes).toContain("Package build runner resolved.");
  });

  it("parses structured JSON output from the asset import runner adapter", async () => {
    const tools = createConfiguredToolDefinitions({
      toolCatalog: defaultToolCatalog,
      storedToolPathSettings: [
        {
          toolId: "asset-import-runner",
          executablePath: "/usr/local/bin/asset-import-runner",
          enabled: true
        }
      ]
    });
    const provider = new InMemoryToolPathProvider(tools);
    const bridge = new AssetImportRunnerBridge(provider, {
      execute: async () => ({
        success: true,
        exitCode: 0,
        summary: "Import completed.",
        commandLine: "/usr/local/bin/asset-import-runner import-asset --json",
        stdout: JSON.stringify({
          normalizedPath: "/catalog/harbor-crate.glb",
          importedAssetId: "asset-harbor-crate",
          summary: "Asset normalized and cataloged."
        }),
        stderr: ""
      })
    });

    const result = await bridge.importAsset({
      assetPath: "/incoming/harbor-crate.glb",
      destinationRoot: "/catalog",
      categoryHint: "props"
    });

    expect(result.normalizedPath).toBe("/catalog/harbor-crate.glb");
    expect(result.importedAssetId).toBe("asset-harbor-crate");
    expect(result.summary).toBe("Asset normalized and cataloged.");
  });

  it("runs the repo-backed package build runner script end to end", async () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cco-package-bridge-"));
    fs.writeFileSync(
      path.join(projectRoot, "project.manifest.json"),
      JSON.stringify({
        id: "project-1",
        name: "Bridge Test",
        slug: "bridge-test"
      }),
    );
    const packageRunnerPath = managedAdapterPath("package-build-runner.mjs");
    const compatibilityBridgePath = managedAdapterPath("gspro-compatibility-bridge.mjs");
    const tools = createConfiguredToolDefinitions({
      toolCatalog: defaultToolCatalog,
      storedToolPathSettings: [
        {
          toolId: "gspro-compatibility-bridge",
          executablePath: compatibilityBridgePath,
          enabled: true
        },
        {
          toolId: "package-build-runner",
          executablePath: packageRunnerPath,
          enabled: true
        }
      ]
    });
    const provider = new InMemoryToolPathProvider(tools);
    const bridge = new PackageBuildRunnerBridge(
      provider,
      new LocalCliExecutionBridge(runLocalCli),
    );

    const result = await bridge.buildReleaseCandidate({
      projectRoot,
      outputProfile: "community-safe",
      manifestPath: path.join(projectRoot, "project.manifest.json"),
      buildId: "build-integration-script",
      recipeHint: "gspro-community-safe",
      releaseOutputRoot: "exports/gspro-release-runs"
    });

    expect(result.success).toBe(true);
    expect(result.executionMode).toBe("repo-backed");
    expect(result.stepResults.some((step) => step.toolId === "gspro-compatibility-bridge")).toBe(true);
    expect(result.stepResults.some((step) => step.toolId === "gspro-export-tool" && step.status === "skipped")).toBe(true);
    expect(result.stepResults.some((step) => step.label === "Finalize creator delivery outputs" && step.status === "skipped")).toBe(true);
    expect(result.artifactPaths.some((artifactPath) => artifactPath.endsWith("package-build-runner-report.json"))).toBe(true);
    expect(result.artifactPaths.some((artifactPath) => artifactPath.endsWith("package-build-runner-step-results.json"))).toBe(true);
    expect(result.managedOutputRoot?.endsWith("managed-bridge")).toBe(true);
    expect(
      result.artifactPaths.every((artifactPath) =>
        fs.existsSync(path.resolve(projectRoot, artifactPath)),
      ),
    ).toBe(true);
  });

  it("runs the package build runner with a configured external GSPro export tool", async () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cco-package-export-"));
    fs.writeFileSync(
      path.join(projectRoot, "project.manifest.json"),
      JSON.stringify({
        id: "project-2",
        name: "Export Test",
        slug: "export-test"
      }),
    );
    const exportToolPath = path.join(projectRoot, "gspro-export-tool.mjs");
    fs.writeFileSync(
      exportToolPath,
      `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const args = process.argv.slice(2);
const command = args[0];
const getFlag = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
};
const outputRoot = getFlag("--output-root") || process.cwd();
fs.mkdirSync(outputRoot, { recursive: true });
const artifactPath = path.join(
  outputRoot,
  command === "probe-toolchain"
    ? "gspro-external-toolchain-report.json"
    : command === "finalize-delivery"
      ? "gspro-external-delivery-report.json"
      : "gspro-external-export-report.json",
);
fs.writeFileSync(artifactPath, JSON.stringify({ ok: true }, null, 2));
process.stdout.write(JSON.stringify({
  success: true,
  summary:
    command === "probe-toolchain"
      ? "External GSPro toolchain probe completed."
      : command === "finalize-delivery"
        ? "External creator delivery finalization completed."
        : "External GSPro export completed.",
  artifactPaths: [artifactPath],
  diagnostics: [],
  remediationHints: [],
  stepResults: [
    {
      stepId:
        command === "probe-toolchain"
          ? "gspro-external-toolchain"
          : command === "finalize-delivery"
            ? "gspro-external-delivery"
            : "gspro-external-export",
      label:
        command === "probe-toolchain"
          ? "External GSPro Toolchain Probe"
          : command === "finalize-delivery"
            ? "Finalize Creator Delivery Outputs"
            : "External GSPro Export",
      phase:
        command === "probe-toolchain"
          ? "bridge-handshake"
          : command === "finalize-delivery"
            ? "finalizing"
            : "recipe-execution",
      status: "succeeded",
      summary:
        command === "probe-toolchain"
          ? "External GSPro toolchain probe completed."
          : command === "finalize-delivery"
            ? "External creator delivery finalization completed."
            : "External GSPro export completed.",
      toolId: "gspro-export-tool",
      executedCommand: process.argv.join(" "),
      outputPaths: [artifactPath],
      diagnostics: []
    }
  ]
}) + "\\n");
`,
      { mode: 0o755 },
    );
    const packageRunnerPath = managedAdapterPath("package-build-runner.mjs");
    const compatibilityBridgePath = managedAdapterPath("gspro-compatibility-bridge.mjs");
    const tools = createConfiguredToolDefinitions({
      toolCatalog: defaultToolCatalog,
      storedToolPathSettings: [
        {
          toolId: "gspro-compatibility-bridge",
          executablePath: compatibilityBridgePath,
          enabled: true
        },
        {
          toolId: "package-build-runner",
          executablePath: packageRunnerPath,
          enabled: true
        },
        {
          toolId: "gspro-export-tool",
          executablePath: exportToolPath,
          enabled: true
        }
      ]
    });
    const provider = new InMemoryToolPathProvider(tools);
    const bridge = new PackageBuildRunnerBridge(
      provider,
      new LocalCliExecutionBridge(runLocalCli),
    );

    const result = await bridge.buildReleaseCandidate({
      projectRoot,
      outputProfile: "community-safe",
      manifestPath: path.join(projectRoot, "project.manifest.json"),
      buildId: "build-external-export",
      recipeHint: "gspro-community-safe",
      releaseOutputRoot: "exports/gspro-release-runs"
    });

    expect(result.success).toBe(true);
    expect(result.executionMode).toBe("mixed");
    expect(result.stepResults.some((step) => step.label === "External GSPro Toolchain Probe")).toBe(true);
    expect(result.stepResults.some((step) => step.toolId === "gspro-export-tool" && step.status === "succeeded")).toBe(true);
    expect(result.stepResults.some((step) => step.label === "Finalize Creator Delivery Outputs")).toBe(true);
    expect(result.artifactPaths.some((artifactPath) => artifactPath.endsWith("gspro-external-export-report.json"))).toBe(true);
    expect(result.artifactPaths.some((artifactPath) => artifactPath.endsWith("gspro-external-toolchain-report.json"))).toBe(true);
    expect(result.artifactPaths.some((artifactPath) => artifactPath.endsWith("gspro-external-delivery-report.json"))).toBe(true);
  });

  it("runs the repo-backed asset import runner script end to end", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cco-asset-bridge-"));
    const sourceAssetPath = path.join(tempRoot, "harbor-crate.glb");
    fs.writeFileSync(sourceAssetPath, "mesh-data");
    const destinationRoot = path.join(tempRoot, "catalog");
    const assetRunnerPath = managedAdapterPath("asset-import-runner.mjs");
    const tools = createConfiguredToolDefinitions({
      toolCatalog: defaultToolCatalog,
      storedToolPathSettings: [
        {
          toolId: "asset-import-runner",
          executablePath: assetRunnerPath,
          enabled: true
        }
      ]
    });
    const provider = new InMemoryToolPathProvider(tools);
    const bridge = new AssetImportRunnerBridge(
      provider,
      new LocalCliExecutionBridge(runLocalCli),
    );

    const result = await bridge.importAsset({
      assetPath: sourceAssetPath,
      destinationRoot,
      categoryHint: "props"
    });

    expect(result.importedAssetId).toBe("asset-harbor-crate");
    expect(fs.existsSync(result.normalizedPath)).toBe(true);
    expect(fs.existsSync(path.join(destinationRoot, "props", "harbor-crate.import-report.json"))).toBe(true);
  });
});
