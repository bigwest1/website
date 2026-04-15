import { z } from "zod";

import type { Project, ProjectManifest } from "@course-creator-os/project-model";
import type { ValidationIssue } from "@course-creator-os/validation";

export const sqliteTableSchema = z.enum([
  "projects",
  "assets",
  "validation_issues",
  "package_builds",
  "snapshots",
  "tasks",
  "logs",
  "preview_paths",
  "holes_index",
  "districts_index",
  "scene_objects_index",
  "terrain_regions_index",
  "routing_paths_index",
  "simulator_spatial_bindings_index",
  "index_state",
  "spatial_trust_reports"
]);

export const migrationSchema = z.object({
  migrationId: z.string(),
  label: z.string(),
  sql: z.string(),
  appliedAt: z.string().nullable()
});

export const projectFileLayoutSchema = z.object({
  rootPath: z.string(),
  manifestPath: z.string(),
  courseBiblePath: z.string(),
  moduleStatusesPath: z.string(),
  holesPath: z.string(),
  simulatorLogicPath: z.string(),
  sceneAuthoringPath: z.string(),
  districtsPath: z.string(),
  landmarksPath: z.string(),
  supportSpacesPath: z.string(),
  environmentZonesPath: z.string(),
  eventsPath: z.string(),
  assetsPath: z.string(),
  previewPathsPath: z.string(),
  flyoverPlansPath: z.string(),
  screenshotPlansPath: z.string(),
  showcaseSequencesPath: z.string(),
  validationStatePath: z.string(),
  performanceSnapshotPath: z.string(),
  performanceStatePath: z.string(),
  packageBuildsPath: z.string(),
  releaseRecordsPath: z.string(),
  packagingStatePath: z.string(),
  snapshotsPath: z.string(),
  snapshotBundlesPath: z.string(),
  restorePointsPath: z.string(),
  changeSummariesPath: z.string(),
  versioningStatePath: z.string(),
  backgroundJobsPath: z.string(),
  courseBibleDirectory: z.string(),
  holesDirectory: z.string(),
  worldDirectory: z.string(),
  assetsDirectory: z.string(),
  previewDirectory: z.string(),
  buildDirectory: z.string(),
  versioningDirectory: z.string(),
  exportsDirectory: z.string(),
  logsDirectory: z.string(),
  localStateDirectory: z.string(),
  sqliteIndexPath: z.string(),
  indexManifestPath: z.string(),
  spatialTrustReportPath: z.string()
});

export type SQLiteTableName = z.infer<typeof sqliteTableSchema>;
export type StorageMigration = z.infer<typeof migrationSchema>;
export type ProjectFileLayout = z.infer<typeof projectFileLayoutSchema>;

export interface FileSystemBridge {
  ensureDirectory(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  readText(path: string): Promise<string>;
  writeText(path: string, content: string): Promise<void>;
}

export interface ProjectRepository {
  projectExists(projectRoot: string): Promise<boolean>;
  loadProject(projectRoot: string): Promise<Project>;
  saveProject(projectRoot: string, project: Project): Promise<ProjectFileLayout>;
  scaffoldProject(projectRoot: string, project: Project): Promise<ProjectFileLayout>;
}

export interface ManifestRepository {
  loadManifest(projectRoot: string): Promise<ProjectManifest>;
  saveManifest(projectRoot: string, manifest: ProjectManifest): Promise<void>;
}

export interface ValidationIssueRepository {
  listOpenIssues(projectId: string): Promise<ValidationIssue[]>;
  replaceIssues(projectId: string, issues: ValidationIssue[]): Promise<void>;
}

export interface IndexRepository {
  ensureSchema(): Promise<void>;
  rebuildProjectIndex(project: Project): Promise<void>;
  listTables(): Promise<SQLiteTableName[]>;
}

export type SQLiteValue = string | number | null;

export type SQLiteRunResult = {
  changes: number;
  lastInsertRowId: number | string | null;
};

export interface SQLiteExecutor {
  exec(sql: string): Promise<void>;
  query<T extends Record<string, SQLiteValue>>(sql: string, params?: SQLiteValue[]): Promise<T[]>;
  run(sql: string, params?: SQLiteValue[]): Promise<SQLiteRunResult>;
}
