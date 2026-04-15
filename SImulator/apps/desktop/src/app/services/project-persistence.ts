import { invoke, isTauri } from "@tauri-apps/api/core";

import type { Project } from "@course-creator-os/project-model";
import {
  createProjectIndexHealthReport,
  hydrateProjectFromBundleFiles,
  JsonProjectRepository,
  MemoryFileSystemBridge,
  createProjectBundle,
  createProjectFileLayout,
  parseProjectIndexHealthReport,
  parseProjectIndexSnapshot,
  type ProjectBundleFile
} from "@course-creator-os/storage";

import { enrichDerivedProjectState } from "./project-derived-state";
import { inspectOperationalIndexHealth } from "./sqlite-runtime";

const RECENT_PROJECTS_STORAGE_KEY = "cco:recent-projects";

export type ProjectPersistenceMode = "tauri-filesystem" | "browser-preview";

export type RecentProjectEntry = {
  projectId: string;
  name: string;
  slug: string;
  courseType: Project["manifest"]["courseType"];
  projectMode: Project["manifest"]["projectMode"];
  projectRoot: string;
  manifestPath: string;
  updatedAt: string;
  storageMode: ProjectPersistenceMode;
};

export type PersistedProjectResult = {
  project: Project;
  projectRoot: string;
  manifestPath: string;
  fileCount: number;
  storageMode: ProjectPersistenceMode;
  createdFiles: ProjectBundleFile[];
  indexHealth: ReturnType<typeof createProjectIndexHealthReport>;
};

type TauriWriteProjectResult = {
  resolvedRootPath: string;
  manifestPath: string;
  fileCount: number;
};

type TauriReadProjectResult = {
  resolvedRootPath: string;
  manifestPath: string;
  fileCount: number;
  files: ProjectBundleFile[];
};

type TauriWriteGeneratedArtifactsResult = {
  resolvedRootPath: string;
  manifestPath: string;
  fileCount: number;
};

function previewBundleStorageKey(projectRoot: string) {
  return `cco:project-preview:${normalizeProjectRoot(projectRoot)}`;
}

function generatedArtifactsStorageKey(projectRoot: string, buildId: string) {
  return `cco:generated-artifacts:${normalizeProjectRoot(projectRoot)}:${buildId}`;
}

function findBundleFile(files: ProjectBundleFile[], relativePath: string) {
  return files.find((file) => file.relativePath === relativePath)?.content ?? null;
}

function deriveIndexHealthFromBundle(project: Project, projectRoot: string, files: ProjectBundleFile[]) {
  const layout = createProjectFileLayout(projectRoot);
  const relativeIndexManifestPath = layout.indexManifestPath.replace(`${projectRoot}/`, "");
  const relativeTrustReportPath = layout.spatialTrustReportPath.replace(`${projectRoot}/`, "");
  const indexManifestText = findBundleFile(files, relativeIndexManifestPath);
  const trustReportText = findBundleFile(files, relativeTrustReportPath);

  try {
    const parsedSnapshot = indexManifestText ? parseProjectIndexSnapshot(indexManifestText) : null;
    const parsedHealth = trustReportText ? parseProjectIndexHealthReport(trustReportText) : null;
    const derivedHealth = createProjectIndexHealthReport(project, parsedSnapshot, project.manifest.updatedAt);

    if (!parsedHealth) {
      return derivedHealth;
    }

    return {
      ...derivedHealth,
      lastIndexedAt: parsedHealth.lastIndexedAt,
      lastVerifiedAt: parsedHealth.lastVerifiedAt
    };
  } catch (error) {
    return {
      ...createProjectIndexHealthReport(project, null, project.manifest.updatedAt),
      health: "critical" as const,
      driftState: "corrupt" as const,
      summary: "Local spatial trust metadata is damaged or unreadable.",
      recommendedAction: "Rebuild the local index manifest and trust report before continuing long-session spatial work.",
      issues: [
        {
          issueId: "index-metadata-corrupt",
          severity: "critical" as const,
          title: "Index metadata is damaged",
          summary:
            error instanceof Error
              ? `Failed to parse local index metadata: ${error.message}`
              : "Failed to parse local index metadata.",
          recommendedAction:
            "Discard the damaged local metadata and rebuild it from project truth."
        }
      ],
      issueCount: 1,
      warningCount: 0,
      criticalCount: 1
    };
  }
}

function readRecentProjectsStorage(): RecentProjectEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(RECENT_PROJECTS_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as RecentProjectEntry[];
    return parsed
      .filter((entry) => typeof entry.projectRoot === "string" && typeof entry.manifestPath === "string")
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  } catch {
    window.localStorage.removeItem(RECENT_PROJECTS_STORAGE_KEY);
    return [];
  }
}

function writeRecentProjectsStorage(entries: RecentProjectEntry[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    RECENT_PROJECTS_STORAGE_KEY,
    JSON.stringify(
      [...entries].sort(
        (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      ),
    ),
  );
}

function rememberRecentProject(result: PersistedProjectResult) {
  const nextEntry: RecentProjectEntry = {
    projectId: result.project.id,
    name: result.project.manifest.name,
    slug: result.project.manifest.slug,
    courseType: result.project.manifest.courseType,
    projectMode: result.project.manifest.projectMode,
    projectRoot: result.projectRoot,
    manifestPath: result.manifestPath,
    updatedAt: result.project.manifest.updatedAt,
    storageMode: result.storageMode
  };
  const existing = readRecentProjectsStorage().filter(
    (entry) => entry.projectRoot !== nextEntry.projectRoot && entry.projectId !== nextEntry.projectId,
  );

  writeRecentProjectsStorage([nextEntry, ...existing].slice(0, 12));
}

function readPreviewBundle(projectRoot: string): ProjectBundleFile[] {
  if (typeof window === "undefined") {
    throw new Error("Preview bundle storage is unavailable outside the browser.");
  }

  const raw = window.localStorage.getItem(previewBundleStorageKey(projectRoot));

  if (!raw) {
    throw new Error(`No browser preview bundle was found for ${projectRoot}.`);
  }

  try {
    const parsed = JSON.parse(raw) as {
      files?: ProjectBundleFile[];
    };

    if (!Array.isArray(parsed.files)) {
      throw new Error("Preview bundle files are missing.");
    }

    return parsed.files;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Failed to read the stored preview bundle: ${error.message}`
        : "Failed to read the stored preview bundle.",
    );
  }
}

function writePreviewBundle(projectRoot: string, files: ProjectBundleFile[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    previewBundleStorageKey(projectRoot),
    JSON.stringify({
      projectRoot,
      files
    }),
  );
}

function writePreviewGeneratedArtifacts(
  projectRoot: string,
  buildId: string,
  files: ProjectBundleFile[],
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    generatedArtifactsStorageKey(projectRoot, buildId),
    JSON.stringify({
      projectRoot,
      buildId,
      files
    }),
  );
}

export function normalizeProjectRoot(projectRoot: string) {
  return projectRoot.trim().replace(/[\\/]+$/, "");
}

export function listRecentProjects() {
  return readRecentProjectsStorage();
}

export async function persistProjectToStorage(
  projectInput: Project,
  projectRoot: string,
  storageMode: ProjectPersistenceMode,
): Promise<PersistedProjectResult> {
  const project = enrichDerivedProjectState(projectInput);
  const normalizedRoot = normalizeProjectRoot(projectRoot);
  const createdFiles = createProjectBundle(project);

  if (storageMode === "tauri-filesystem" && isTauri()) {
    const result = await invoke<TauriWriteProjectResult>("save_project_bundle", {
      projectRoot: normalizedRoot,
      files: createdFiles.map((file) => ({
        relativePath: file.relativePath,
        content: file.content
      }))
    });
    const persisted = {
      project,
      projectRoot: result.resolvedRootPath,
      manifestPath: result.manifestPath,
      fileCount: result.fileCount,
      storageMode,
      createdFiles,
      indexHealth: deriveIndexHealthFromBundle(project, result.resolvedRootPath, createdFiles)
    } satisfies PersistedProjectResult;

    rememberRecentProject(persisted);
    return persisted;
  }

  writePreviewBundle(normalizedRoot, createdFiles);

  const persisted = {
    project,
    projectRoot: normalizedRoot,
    manifestPath: createProjectFileLayout(normalizedRoot).manifestPath,
    fileCount: createdFiles.length,
    storageMode: "browser-preview" as const,
    createdFiles,
    indexHealth: deriveIndexHealthFromBundle(project, normalizedRoot, createdFiles)
  } satisfies PersistedProjectResult;

  rememberRecentProject(persisted);
  return persisted;
}

export async function createProjectInStorage(
  projectInput: Project,
  projectRoot: string,
  storageMode: ProjectPersistenceMode,
): Promise<PersistedProjectResult> {
  const project = enrichDerivedProjectState(projectInput);
  const normalizedRoot = normalizeProjectRoot(projectRoot);
  const createdFiles = createProjectBundle(project);

  if (storageMode === "tauri-filesystem" && isTauri()) {
    const result = await invoke<TauriWriteProjectResult>("write_project_bundle", {
      projectRoot: normalizedRoot,
      files: createdFiles.map((file) => ({
        relativePath: file.relativePath,
        content: file.content
      }))
    });
    const persisted = {
      project,
      projectRoot: result.resolvedRootPath,
      manifestPath: result.manifestPath,
      fileCount: result.fileCount,
      storageMode,
      createdFiles,
      indexHealth: deriveIndexHealthFromBundle(project, result.resolvedRootPath, createdFiles)
    } satisfies PersistedProjectResult;

    rememberRecentProject(persisted);
    return persisted;
  }

  writePreviewBundle(normalizedRoot, createdFiles);

  const persisted = {
    project,
    projectRoot: normalizedRoot,
    manifestPath: createProjectFileLayout(normalizedRoot).manifestPath,
    fileCount: createdFiles.length,
    storageMode: "browser-preview" as const,
    createdFiles,
    indexHealth: deriveIndexHealthFromBundle(project, normalizedRoot, createdFiles)
  } satisfies PersistedProjectResult;

  rememberRecentProject(persisted);
  return persisted;
}

export async function loadProjectFromStorage(
  projectRoot: string,
  storageMode: ProjectPersistenceMode,
): Promise<PersistedProjectResult> {
  const normalizedRoot = normalizeProjectRoot(projectRoot);

  if (storageMode === "tauri-filesystem" && isTauri()) {
    const result = await invoke<TauriReadProjectResult>("read_project_bundle", {
      projectRoot: normalizedRoot
    });
    const project = enrichDerivedProjectState(
      await hydrateProjectFromBundleFiles(result.resolvedRootPath, result.files),
    );
    const indexInspection = await inspectOperationalIndexHealth(
      project,
      result.resolvedRootPath,
      storageMode,
    );
    const loaded = {
      project,
      projectRoot: result.resolvedRootPath,
      manifestPath: result.manifestPath,
      fileCount: result.fileCount,
      storageMode,
      createdFiles: result.files,
      indexHealth: indexInspection.indexHealth
    } satisfies PersistedProjectResult;

    rememberRecentProject(loaded);
    return loaded;
  }

  const files = readPreviewBundle(normalizedRoot);
  const project = enrichDerivedProjectState(await hydrateProjectFromBundleFiles(normalizedRoot, files));
  const loaded = {
    project,
    projectRoot: normalizedRoot,
    manifestPath: createProjectFileLayout(normalizedRoot).manifestPath,
    fileCount: files.length,
    storageMode: "browser-preview" as const,
    createdFiles: files,
    indexHealth: deriveIndexHealthFromBundle(project, normalizedRoot, files)
  } satisfies PersistedProjectResult;

  rememberRecentProject(loaded);
  return loaded;
}

export async function persistGeneratedArtifacts(
  projectRoot: string,
  buildId: string,
  files: ProjectBundleFile[],
  storageMode: ProjectPersistenceMode,
) {
  const normalizedRoot = normalizeProjectRoot(projectRoot);

  if (storageMode === "tauri-filesystem" && isTauri()) {
    const result = await invoke<TauriWriteGeneratedArtifactsResult>("write_generated_artifacts", {
      projectRoot: normalizedRoot,
      files: files.map((file) => ({
        relativePath: file.relativePath,
        content: file.content
      }))
    });

    return {
      storageMode,
      projectRoot: result.resolvedRootPath,
      fileCount: result.fileCount
    };
  }

  writePreviewGeneratedArtifacts(normalizedRoot, buildId, files);
  return {
    storageMode: "browser-preview" as const,
    projectRoot: normalizedRoot,
    fileCount: files.length
  };
}
