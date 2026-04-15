import { invoke, isTauri } from "@tauri-apps/api/core";

import type { ProjectPersistenceMode } from "./project-persistence";

export type NativeRuntimeVerificationStatus =
  | "verified"
  | "partially-verified"
  | "degraded"
  | "unavailable"
  | "preview-only";

export type NativeRuntimeCommandStatus = {
  commandId: string;
  available: boolean;
  resolvedPath: string | null;
  summary: string;
  versionText: string | null;
};

export type NativeRuntimeVerificationEvidence = {
  checkId: string;
  label: string;
  status: "verified" | "partial" | "failed";
  detail: string;
};

export type NativeRuntimeVerificationReport = {
  status: NativeRuntimeVerificationStatus;
  shellRuntime: "tauri" | "browser";
  os: string;
  desktopRuntimeAvailable: boolean;
  nativeCommandBridgeAvailable: boolean;
  filesystemWriteAvailable: boolean;
  sqliteIndexAvailable: boolean;
  commandExecutionReady: boolean;
  hostSessionReady: boolean;
  projectRootResolved: string | null;
  sqlitePath: string | null;
  writableStateRoot: string | null;
  hostSessionEvidencePath: string | null;
  commandStatuses: NativeRuntimeCommandStatus[];
  verificationEvidence: NativeRuntimeVerificationEvidence[];
  degradedReasons: string[];
  checkedAt: string;
  summary: string;
  recommendedAction: string;
};

type NativeRuntimeStatusPayload = {
  shellRuntime: string;
  os: string;
  desktopRuntimeAvailable: boolean;
  nativeCommandBridgeAvailable: boolean;
  filesystemWriteAvailable: boolean;
  sqliteIndexAvailable: boolean;
  commandExecutionReady: boolean;
  hostSessionReady: boolean;
  sqlitePath: string | null;
  projectRootResolved: string | null;
  writableStateRoot: string | null;
  hostSessionEvidencePath: string | null;
  commandStatuses: NativeRuntimeCommandStatus[];
  verificationEvidence: NativeRuntimeVerificationEvidence[];
  degradedReasons: string[];
  summary: string;
};

type ToolPathProbePayload = {
  exists: boolean;
  executable: boolean;
  summary: string;
  resolvedPath: string | null;
  versionText: string | null;
};

export function createPreviewOnlyNativeRuntimeReport(
  projectRoot: string | null,
): NativeRuntimeVerificationReport {
  const checkedAt = new Date().toISOString();
  return {
    status: "preview-only",
    shellRuntime: "browser",
    os: typeof navigator !== "undefined" ? navigator.platform : "browser",
    desktopRuntimeAvailable: false,
    nativeCommandBridgeAvailable: false,
    filesystemWriteAvailable: false,
    sqliteIndexAvailable: false,
    commandExecutionReady: false,
    hostSessionReady: false,
    projectRootResolved: projectRoot,
    sqlitePath: null,
    writableStateRoot: null,
    hostSessionEvidencePath: null,
    commandStatuses: [],
    verificationEvidence: [],
    degradedReasons: [
      "Native desktop verification is unavailable in browser preview mode."
    ],
    checkedAt,
    summary: "Browser preview mode is active, so native desktop verification is not available in this session.",
    recommendedAction:
      "Open the desktop shell with a persisted project root before treating native runtime, SQLite, or filesystem execution as verified."
  };
}

function createUnavailableNativeRuntimeReport(
  projectRoot: string | null,
  detail: string,
): NativeRuntimeVerificationReport {
  const checkedAt = new Date().toISOString();
  return {
    status: "unavailable",
    shellRuntime: "tauri",
    os: typeof navigator !== "undefined" ? navigator.platform : "unknown",
    desktopRuntimeAvailable: false,
    nativeCommandBridgeAvailable: false,
    filesystemWriteAvailable: false,
    sqliteIndexAvailable: false,
    commandExecutionReady: false,
    hostSessionReady: false,
    projectRootResolved: projectRoot,
    sqlitePath: null,
    writableStateRoot: null,
    hostSessionEvidencePath: null,
    commandStatuses: [],
    verificationEvidence: [],
    degradedReasons: [detail],
    checkedAt,
    summary: detail,
    recommendedAction:
      "Restore native desktop command execution, filesystem access, and runtime inspection before treating host execution as release-capable."
  };
}

export function classifyNativeRuntimeStatus(input: {
  persistenceMode: ProjectPersistenceMode | "seed";
  payload: NativeRuntimeStatusPayload;
}): NativeRuntimeVerificationStatus {
  const { payload, persistenceMode } = input;

  if (!payload.desktopRuntimeAvailable || !payload.nativeCommandBridgeAvailable) {
    return "unavailable";
  }

  if (!payload.filesystemWriteAvailable || !payload.commandExecutionReady) {
    return "degraded";
  }

  if (persistenceMode !== "tauri-filesystem") {
    return "partially-verified";
  }

  if (!payload.hostSessionReady) {
    return "partially-verified";
  }

  if (!payload.projectRootResolved || !payload.sqliteIndexAvailable) {
    return "partially-verified";
  }

  const missingDevelopmentCommand = payload.commandStatuses.some(
    (command) =>
      (command.commandId === "cargo" ||
        command.commandId === "rustc" ||
        command.commandId === "tauri") &&
      !command.available,
  );
  return missingDevelopmentCommand ? "partially-verified" : "verified";
}

export async function inspectNativeRuntimeVerification(
  projectRoot: string | null,
  persistenceMode: ProjectPersistenceMode | "seed",
): Promise<NativeRuntimeVerificationReport> {
  if (!isTauri()) {
    return createPreviewOnlyNativeRuntimeReport(projectRoot);
  }

  const checkedAt = new Date().toISOString();
  let payload: NativeRuntimeStatusPayload;

  try {
    payload = await invoke<NativeRuntimeStatusPayload>("get_native_runtime_status", {
      projectRoot: persistenceMode === "tauri-filesystem" ? projectRoot : null
    });
  } catch (error) {
    return createUnavailableNativeRuntimeReport(
      projectRoot,
      error instanceof Error
        ? `Native runtime inspection failed: ${error.message}`
        : "Native runtime inspection failed before host execution could be verified.",
    );
  }
  const status = classifyNativeRuntimeStatus({
    persistenceMode,
    payload
  });

  return {
    status,
    shellRuntime: "tauri",
    os: payload.os,
    desktopRuntimeAvailable: payload.desktopRuntimeAvailable,
    nativeCommandBridgeAvailable: payload.nativeCommandBridgeAvailable,
    filesystemWriteAvailable: payload.filesystemWriteAvailable,
    sqliteIndexAvailable: payload.sqliteIndexAvailable,
    hostSessionReady: payload.hostSessionReady,
    projectRootResolved: payload.projectRootResolved,
    sqlitePath: payload.sqlitePath,
    commandStatuses: payload.commandStatuses,
    commandExecutionReady: payload.commandExecutionReady,
    writableStateRoot: payload.writableStateRoot,
    hostSessionEvidencePath: payload.hostSessionEvidencePath,
    verificationEvidence: payload.verificationEvidence,
    degradedReasons: payload.degradedReasons,
    checkedAt,
    summary: payload.summary,
    recommendedAction:
      status === "verified"
        ? "Native runtime posture is strong enough for persisted Build, recovery, and release execution."
        : status === "partially-verified"
          ? "Persist the project root, materialize the SQLite index, and resolve any missing host capabilities before treating native runtime as fully verified."
          : status === "degraded"
            ? "Resolve degraded native/runtime capabilities before relying on desktop execution for release-critical work."
            : "Host execution is unavailable right now. Re-establish native runtime inspection and command execution before trusting release flows."
  };
}

export async function probeNativeToolPath(path: string | null, versionArgs: string[] = ["--version"]) {
  if (!isTauri()) {
    return {
      exists: Boolean(path),
      executable: false,
      summary: path
        ? "Tool path cannot be verified from browser preview mode."
        : "No executable path is configured yet.",
      resolvedPath: path,
      versionText: null
    } satisfies ToolPathProbePayload;
  }

  return invoke<ToolPathProbePayload>("probe_tool_path_with_args", {
    path: path ?? "",
    versionArgs
  });
}

export async function runNativeCommand(
  commandPath: string,
  args: string[] = [],
  workingDirectory: string | null = null,
) {
  if (!isTauri()) {
    return {
      success: false,
      exitCode: null,
      summary: "Native command execution is unavailable in browser preview mode.",
      commandLine: [commandPath, ...args].join(" ").trim(),
      stdout: "",
      stderr: "Open the desktop shell before relying on native command execution."
    };
  }

  return invoke<{
    success: boolean;
    exitCode: number | null;
    summary: string;
    commandLine: string | null;
    stdout: string;
    stderr: string;
  }>("run_native_command", {
    commandPath,
    args,
    workingDirectory
  });
}
