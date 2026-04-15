import { describe, expect, it } from "vitest";

import { classifyNativeRuntimeStatus } from "./native-runtime";

describe("native runtime verification", () => {
  it("classifies missing native command bridge as unavailable", () => {
    const status = classifyNativeRuntimeStatus({
      persistenceMode: "tauri-filesystem",
      payload: {
        shellRuntime: "tauri",
        os: "darwin",
        desktopRuntimeAvailable: true,
        nativeCommandBridgeAvailable: false,
        filesystemWriteAvailable: true,
        sqliteIndexAvailable: true,
        commandExecutionReady: true,
        hostSessionReady: false,
        sqlitePath: "/tmp/project/.course-creator-os/project-index.sqlite3",
        projectRootResolved: "/tmp/project",
        writableStateRoot: "/tmp/project/.course-creator-os",
        hostSessionEvidencePath: null,
        commandStatuses: [],
        verificationEvidence: [],
        degradedReasons: ["bridge missing"],
        summary: "bridge missing"
      }
    });

    expect(status).toBe("unavailable");
  });

  it("classifies writable native runtime with missing cargo as partially verified", () => {
    const status = classifyNativeRuntimeStatus({
      persistenceMode: "tauri-filesystem",
      payload: {
        shellRuntime: "tauri",
        os: "darwin",
        desktopRuntimeAvailable: true,
        nativeCommandBridgeAvailable: true,
        filesystemWriteAvailable: true,
        sqliteIndexAvailable: true,
        commandExecutionReady: true,
        hostSessionReady: true,
        sqlitePath: "/tmp/project/.course-creator-os/project-index.sqlite3",
        projectRootResolved: "/tmp/project",
        writableStateRoot: "/tmp/project/.course-creator-os",
        hostSessionEvidencePath: "/tmp/project/.course-creator-os/native-host-session-evidence.json",
        commandStatuses: [
          {
            commandId: "cargo",
            available: false,
            resolvedPath: null,
            summary: "cargo missing",
            versionText: null
          },
          {
            commandId: "rustc",
            available: true,
            resolvedPath: "/usr/bin/rustc",
            summary: "rustc ok",
            versionText: "rustc 1.0"
          },
          {
            commandId: "tauri",
            available: true,
            resolvedPath: "/usr/local/bin/tauri",
            summary: "tauri ok",
            versionText: "tauri 2"
          }
        ],
        verificationEvidence: [],
        degradedReasons: ["cargo missing"],
        summary: "partial"
      }
    });

    expect(status).toBe("partially-verified");
  });

  it("classifies full persisted host posture as verified", () => {
    const status = classifyNativeRuntimeStatus({
      persistenceMode: "tauri-filesystem",
      payload: {
        shellRuntime: "tauri",
        os: "darwin",
        desktopRuntimeAvailable: true,
        nativeCommandBridgeAvailable: true,
        filesystemWriteAvailable: true,
        sqliteIndexAvailable: true,
        commandExecutionReady: true,
        hostSessionReady: true,
        sqlitePath: "/tmp/project/.course-creator-os/project-index.sqlite3",
        projectRootResolved: "/tmp/project",
        writableStateRoot: "/tmp/project/.course-creator-os",
        hostSessionEvidencePath: "/tmp/project/.course-creator-os/native-host-session-evidence.json",
        commandStatuses: [
          {
            commandId: "cargo",
            available: true,
            resolvedPath: "/usr/bin/cargo",
            summary: "cargo ok",
            versionText: "cargo 1.0"
          },
          {
            commandId: "rustc",
            available: true,
            resolvedPath: "/usr/bin/rustc",
            summary: "rustc ok",
            versionText: "rustc 1.0"
          },
          {
            commandId: "tauri",
            available: true,
            resolvedPath: "/usr/local/bin/tauri",
            summary: "tauri ok",
            versionText: "tauri 2"
          }
        ],
        verificationEvidence: [],
        degradedReasons: [],
        summary: "verified"
      }
    });

    expect(status).toBe("verified");
  });

  it("classifies missing command execution readiness as degraded", () => {
    const status = classifyNativeRuntimeStatus({
      persistenceMode: "tauri-filesystem",
      payload: {
        shellRuntime: "tauri",
        os: "darwin",
        desktopRuntimeAvailable: true,
        nativeCommandBridgeAvailable: true,
        filesystemWriteAvailable: true,
        sqliteIndexAvailable: true,
        commandExecutionReady: false,
        hostSessionReady: true,
        sqlitePath: "/tmp/project/.course-creator-os/project-index.sqlite3",
        projectRootResolved: "/tmp/project",
        writableStateRoot: "/tmp/project/.course-creator-os",
        hostSessionEvidencePath: "/tmp/project/.course-creator-os/native-host-session-evidence.json",
        commandStatuses: [],
        verificationEvidence: [],
        degradedReasons: ["Node missing"],
        summary: "degraded"
      }
    });

    expect(status).toBe("degraded");
  });

  it("classifies unresolved persisted project roots as partially verified", () => {
    const status = classifyNativeRuntimeStatus({
      persistenceMode: "tauri-filesystem",
      payload: {
        shellRuntime: "tauri",
        os: "darwin",
        desktopRuntimeAvailable: true,
        nativeCommandBridgeAvailable: true,
        filesystemWriteAvailable: true,
        sqliteIndexAvailable: false,
        commandExecutionReady: true,
        hostSessionReady: false,
        sqlitePath: null,
        projectRootResolved: null,
        writableStateRoot: null,
        hostSessionEvidencePath: null,
        commandStatuses: [
          {
            commandId: "cargo",
            available: true,
            resolvedPath: "/usr/bin/cargo",
            summary: "cargo ok",
            versionText: "cargo 1.0"
          },
          {
            commandId: "rustc",
            available: true,
            resolvedPath: "/usr/bin/rustc",
            summary: "rustc ok",
            versionText: "rustc 1.0"
          },
          {
            commandId: "tauri",
            available: true,
            resolvedPath: "/usr/local/bin/tauri",
            summary: "tauri ok",
            versionText: "tauri 2"
          }
        ],
        verificationEvidence: [],
        degradedReasons: ["Project root unresolved"],
        summary: "partial"
      }
    });

    expect(status).toBe("partially-verified");
  });

  it("classifies missing host-session evidence as partially verified", () => {
    const status = classifyNativeRuntimeStatus({
      persistenceMode: "tauri-filesystem",
      payload: {
        shellRuntime: "tauri",
        os: "darwin",
        desktopRuntimeAvailable: true,
        nativeCommandBridgeAvailable: true,
        filesystemWriteAvailable: true,
        sqliteIndexAvailable: true,
        commandExecutionReady: true,
        hostSessionReady: false,
        sqlitePath: "/tmp/project/.course-creator-os/project-index.sqlite3",
        projectRootResolved: "/tmp/project",
        writableStateRoot: "/tmp/project/.course-creator-os",
        hostSessionEvidencePath: null,
        commandStatuses: [
          {
            commandId: "cargo",
            available: true,
            resolvedPath: "/usr/bin/cargo",
            summary: "cargo ok",
            versionText: "cargo 1.0"
          },
          {
            commandId: "rustc",
            available: true,
            resolvedPath: "/usr/bin/rustc",
            summary: "rustc ok",
            versionText: "rustc 1.0"
          },
          {
            commandId: "tauri",
            available: true,
            resolvedPath: "/usr/local/bin/tauri",
            summary: "tauri ok",
            versionText: "tauri 2"
          }
        ],
        verificationEvidence: [],
        degradedReasons: ["Native host-session evidence missing"],
        summary: "partial"
      }
    });

    expect(status).toBe("partially-verified");
  });
});
