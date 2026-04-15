import type { Project } from "@course-creator-os/project-model";
import type { ValidationIssue } from "@course-creator-os/validation";

import {
  createSpatialTrustBundle,
  parseProjectIndexSnapshot,
  projectIndexedSpatialStatsSchema,
  type ProjectIndexedSpatialStats,
  type ProjectIndexSnapshot
} from "./index-health";
import {
  type IndexRepository,
  type SQLiteExecutor,
  sqliteTableSchema,
  type StorageMigration,
  type ValidationIssueRepository
} from "./contracts";

export const sqliteMigrations: readonly StorageMigration[] = [
  {
    migrationId: "001_initial_project_index",
    label: "Create project index tables for manifests, assets, issues, and package history.",
    sql: `
CREATE TABLE IF NOT EXISTS projects (
  project_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  manifest_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS assets (
  project_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  approval_status TEXT NOT NULL,
  asset_json TEXT NOT NULL,
  PRIMARY KEY (project_id, asset_id)
);
CREATE TABLE IF NOT EXISTS validation_issues (
  project_id TEXT NOT NULL,
  issue_id TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  owner_module TEXT NOT NULL,
  issue_json TEXT NOT NULL,
  PRIMARY KEY (project_id, issue_id)
);
CREATE TABLE IF NOT EXISTS package_builds (
  project_id TEXT NOT NULL,
  build_id TEXT NOT NULL,
  status TEXT NOT NULL,
  build_json TEXT NOT NULL,
  PRIMARY KEY (project_id, build_id)
);
CREATE TABLE IF NOT EXISTS snapshots (
  project_id TEXT NOT NULL,
  snapshot_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  PRIMARY KEY (project_id, snapshot_id)
);
CREATE TABLE IF NOT EXISTS tasks (
  project_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  task_json TEXT NOT NULL,
  PRIMARY KEY (project_id, task_id)
);
CREATE TABLE IF NOT EXISTS logs (
  project_id TEXT NOT NULL,
  log_id TEXT NOT NULL,
  log_json TEXT NOT NULL,
  PRIMARY KEY (project_id, log_id)
);
CREATE TABLE IF NOT EXISTS preview_paths (
  project_id TEXT NOT NULL,
  preview_path_id TEXT NOT NULL,
  readiness_state TEXT NOT NULL,
  preview_json TEXT NOT NULL,
  PRIMARY KEY (project_id, preview_path_id)
);
CREATE TABLE IF NOT EXISTS holes_index (
  project_id TEXT NOT NULL,
  hole_id TEXT NOT NULL,
  hole_number INTEGER NOT NULL,
  par INTEGER NOT NULL,
  hole_json TEXT NOT NULL,
  PRIMARY KEY (project_id, hole_id)
);
CREATE TABLE IF NOT EXISTS districts_index (
  project_id TEXT NOT NULL,
  district_id TEXT NOT NULL,
  district_name TEXT NOT NULL,
  district_json TEXT NOT NULL,
  PRIMARY KEY (project_id, district_id)
);
CREATE TABLE IF NOT EXISTS scene_objects_index (
  project_id TEXT NOT NULL,
  scene_object_id TEXT NOT NULL,
  collection_id TEXT NOT NULL,
  category TEXT NOT NULL,
  layer_id TEXT NOT NULL,
  scene_json TEXT NOT NULL,
  PRIMARY KEY (project_id, scene_object_id)
);
CREATE TABLE IF NOT EXISTS terrain_regions_index (
  project_id TEXT NOT NULL,
  terrain_region_id TEXT NOT NULL,
  hole_id TEXT,
  gameplay_purpose TEXT NOT NULL,
  region_json TEXT NOT NULL,
  PRIMARY KEY (project_id, terrain_region_id)
);
CREATE TABLE IF NOT EXISTS routing_paths_index (
  project_id TEXT NOT NULL,
  routing_path_id TEXT NOT NULL,
  hole_id TEXT NOT NULL,
  route_status TEXT NOT NULL,
  path_json TEXT NOT NULL,
  PRIMARY KEY (project_id, routing_path_id)
);
CREATE TABLE IF NOT EXISTS simulator_spatial_bindings_index (
  project_id TEXT NOT NULL,
  binding_id TEXT NOT NULL,
  hole_id TEXT NOT NULL,
  binding_type TEXT NOT NULL,
  readiness_state TEXT NOT NULL,
  binding_json TEXT NOT NULL,
  PRIMARY KEY (project_id, binding_id)
);
CREATE TABLE IF NOT EXISTS index_state (
  project_id TEXT PRIMARY KEY,
  manifest_updated_at TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  spatial_fingerprint TEXT NOT NULL,
  trust_health TEXT NOT NULL,
  index_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS spatial_trust_reports (
  project_id TEXT PRIMARY KEY,
  generated_at TEXT NOT NULL,
  health TEXT NOT NULL,
  confidence TEXT NOT NULL,
  issue_count INTEGER NOT NULL,
  report_json TEXT NOT NULL
);`.trim(),
    appliedAt: null
  }
] as const;

const TABLES = sqliteTableSchema.options;

export class SQLiteProjectIndexRepository implements IndexRepository {
  constructor(private readonly executor: SQLiteExecutor) {}

  async ensureSchema() {
    for (const migration of sqliteMigrations) {
      await this.executor.exec(migration.sql);
    }
  }

  async listTables() {
    return [...TABLES];
  }

  async readProjectIndexSnapshot(projectId: string): Promise<ProjectIndexSnapshot | null> {
    await this.ensureSchema();
    const rows = await this.executor.query<{ index_json: string }>(
      "SELECT index_json FROM index_state WHERE project_id = ?",
      [projectId],
    );

    if (!rows[0]?.index_json) {
      return null;
    }

    return parseProjectIndexSnapshot(rows[0].index_json);
  }

  async readProjectIndexStats(projectId: string): Promise<ProjectIndexedSpatialStats> {
    await this.ensureSchema();
    const queryCount = async (tableName: string) => {
      const rows = await this.executor.query<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${tableName} WHERE project_id = ?`,
        [projectId],
      );

      return Number(rows[0]?.count ?? 0);
    };

    return projectIndexedSpatialStatsSchema.parse({
      availableTables: TABLES,
      sceneObjectCount: await queryCount("scene_objects_index"),
      terrainRegionCount: await queryCount("terrain_regions_index"),
      terrainModifierCount: 0,
      routingPathCount: await queryCount("routing_paths_index"),
      simulatorBindingCount: await queryCount("simulator_spatial_bindings_index"),
      validationIssueCount: await queryCount("validation_issues"),
      snapshotCount: await queryCount("snapshots")
    });
  }

  async rebuildProjectIndex(project: Project) {
    await this.ensureSchema();
    const generatedAt = project.manifest.updatedAt;
    const spatialTrustBundle = createSpatialTrustBundle(project, generatedAt);

    await this.executor.run(
      "REPLACE INTO projects (project_id, name, slug, updated_at, manifest_json) VALUES (?, ?, ?, ?, ?)",
      [
        project.id,
        project.manifest.name,
        project.manifest.slug,
        project.manifest.updatedAt,
        JSON.stringify(project.manifest)
      ],
    );

    await this.executor.run("DELETE FROM assets WHERE project_id = ?", [project.id]);
    for (const asset of project.assets) {
      await this.executor.run(
        "INSERT INTO assets (project_id, asset_id, display_name, category, approval_status, asset_json) VALUES (?, ?, ?, ?, ?, ?)",
        [
          project.id,
          asset.assetId,
          asset.displayName,
          asset.category,
          asset.approvalStatus,
          JSON.stringify(asset)
        ],
      );
    }

    await this.executor.run("DELETE FROM holes_index WHERE project_id = ?", [project.id]);
    for (const hole of project.holes) {
      await this.executor.run(
        "INSERT INTO holes_index (project_id, hole_id, hole_number, par, hole_json) VALUES (?, ?, ?, ?, ?)",
        [project.id, hole.holeId, hole.number, hole.par, JSON.stringify(hole)],
      );
    }

    await this.executor.run("DELETE FROM districts_index WHERE project_id = ?", [project.id]);
    for (const district of project.districts) {
      await this.executor.run(
        "INSERT INTO districts_index (project_id, district_id, district_name, district_json) VALUES (?, ?, ?, ?)",
        [project.id, district.districtId, district.name, JSON.stringify(district)],
      );
    }

    await this.executor.run("DELETE FROM scene_objects_index WHERE project_id = ?", [project.id]);
    for (const sceneObject of project.sceneAuthoring.sceneObjects) {
      await this.executor.run(
        "INSERT INTO scene_objects_index (project_id, scene_object_id, collection_id, category, layer_id, scene_json) VALUES (?, ?, ?, ?, ?, ?)",
        [
          project.id,
          sceneObject.sceneObjectId,
          sceneObject.collectionId,
          sceneObject.category,
          sceneObject.placementLayerId,
          JSON.stringify(sceneObject)
        ],
      );
    }

    await this.executor.run("DELETE FROM terrain_regions_index WHERE project_id = ?", [project.id]);
    for (const terrainRegion of project.sceneAuthoring.terrainRegions) {
      await this.executor.run(
        "INSERT INTO terrain_regions_index (project_id, terrain_region_id, hole_id, gameplay_purpose, region_json) VALUES (?, ?, ?, ?, ?)",
        [
          project.id,
          terrainRegion.terrainRegionId,
          terrainRegion.holeId,
          terrainRegion.gameplayPurpose,
          JSON.stringify(terrainRegion)
        ],
      );
    }

    await this.executor.run("DELETE FROM routing_paths_index WHERE project_id = ?", [project.id]);
    for (const routingPath of project.sceneAuthoring.routingPaths) {
      await this.executor.run(
        "INSERT INTO routing_paths_index (project_id, routing_path_id, hole_id, route_status, path_json) VALUES (?, ?, ?, ?, ?)",
        [
          project.id,
          routingPath.routingPathId,
          routingPath.holeId,
          routingPath.routeStatus,
          JSON.stringify(routingPath)
        ],
      );
    }

    await this.executor.run("DELETE FROM simulator_spatial_bindings_index WHERE project_id = ?", [project.id]);
    for (const binding of [
      ...project.simulatorLogic.teeSpatialBindings.map((entry) => ({
        bindingId: entry.teeSpatialBindingId,
        holeId: entry.holeId,
        bindingType: "tee",
        readinessState: entry.readinessState,
        value: entry
      })),
      ...project.simulatorLogic.pinSpatialBindings.map((entry) => ({
        bindingId: entry.pinSpatialBindingId,
        holeId: entry.holeId,
        bindingType: "pin",
        readinessState: entry.readinessState,
        value: entry
      })),
      ...project.simulatorLogic.hazardSpatialBindings.map((entry) => ({
        bindingId: entry.hazardSpatialBindingId,
        holeId: entry.holeId,
        bindingType: "hazard",
        readinessState: entry.readinessState,
        value: entry
      })),
      ...project.simulatorLogic.outOfBoundsSpatialBindings.map((entry) => ({
        bindingId: entry.outOfBoundsSpatialBindingId,
        holeId: entry.holeId,
        bindingType: "out-of-bounds",
        readinessState: entry.readinessState,
        value: entry
      })),
      ...project.simulatorLogic.dropZoneSpatialBindings.map((entry) => ({
        bindingId: entry.dropZoneSpatialBindingId,
        holeId: entry.holeId,
        bindingType: "drop-zone",
        readinessState: entry.readinessState,
        value: entry
      })),
      ...project.simulatorLogic.previewAnchorBindings.map((entry) => ({
        bindingId: entry.previewAnchorBindingId,
        holeId: entry.holeId,
        bindingType: "preview-anchor",
        readinessState: entry.readinessState,
        value: entry
      }))
    ]) {
      await this.executor.run(
        "INSERT INTO simulator_spatial_bindings_index (project_id, binding_id, hole_id, binding_type, readiness_state, binding_json) VALUES (?, ?, ?, ?, ?, ?)",
        [
          project.id,
          binding.bindingId,
          binding.holeId,
          binding.bindingType,
          binding.readinessState,
          JSON.stringify(binding.value)
        ],
      );
    }

    await this.executor.run("DELETE FROM preview_paths WHERE project_id = ?", [project.id]);
    for (const previewPath of project.previewPaths) {
      await this.executor.run(
        "INSERT INTO preview_paths (project_id, preview_path_id, readiness_state, preview_json) VALUES (?, ?, ?, ?)",
        [
          project.id,
          previewPath.previewPathId,
          previewPath.readinessState,
          JSON.stringify(previewPath)
        ],
      );
    }

    await this.executor.run("DELETE FROM package_builds WHERE project_id = ?", [project.id]);
    for (const build of project.packageBuilds) {
      await this.executor.run(
        "INSERT INTO package_builds (project_id, build_id, status, build_json) VALUES (?, ?, ?, ?)",
        [project.id, build.buildId, build.status, JSON.stringify(build)],
      );
    }

    await this.executor.run("DELETE FROM snapshots WHERE project_id = ?", [project.id]);
    for (const snapshot of project.snapshots) {
      await this.executor.run(
        "INSERT INTO snapshots (project_id, snapshot_id, created_at, snapshot_json) VALUES (?, ?, ?, ?)",
        [project.id, snapshot.snapshotId, snapshot.createdAt, JSON.stringify(snapshot)],
      );
    }

    await this.executor.run(
      "REPLACE INTO index_state (project_id, manifest_updated_at, generated_at, spatial_fingerprint, trust_health, index_json) VALUES (?, ?, ?, ?, ?, ?)",
      [
        project.id,
        project.manifest.updatedAt,
        spatialTrustBundle.indexSnapshot.generatedAt,
        spatialTrustBundle.indexSnapshot.spatialFingerprint,
        spatialTrustBundle.indexHealth.health,
        JSON.stringify(spatialTrustBundle.indexSnapshot)
      ],
    );

    await this.executor.run(
      "REPLACE INTO spatial_trust_reports (project_id, generated_at, health, confidence, issue_count, report_json) VALUES (?, ?, ?, ?, ?, ?)",
      [
        project.id,
        spatialTrustBundle.trustReport.generatedAt,
        spatialTrustBundle.trustReport.health,
        spatialTrustBundle.trustReport.analysisConfidence,
        spatialTrustBundle.trustReport.issueCount,
        JSON.stringify(spatialTrustBundle.trustReport)
      ],
    );
  }
}

export class SQLiteValidationIssueRepository implements ValidationIssueRepository {
  constructor(private readonly executor: SQLiteExecutor) {}

  async listOpenIssues(projectId: string) {
    const rows = await this.executor.query<{ issue_json: string }>(
      "SELECT issue_json FROM validation_issues WHERE project_id = ? AND status = ?",
      [projectId, "open"],
    );

    return rows.map((row) => JSON.parse(row.issue_json) as ValidationIssue);
  }

  async replaceIssues(projectId: string, issues: ValidationIssue[]) {
    await this.executor.run("DELETE FROM validation_issues WHERE project_id = ?", [projectId]);

    for (const issue of issues) {
      await this.executor.run(
        "INSERT INTO validation_issues (project_id, issue_id, severity, status, owner_module, issue_json) VALUES (?, ?, ?, ?, ?, ?)",
        [
          projectId,
          issue.issueId,
          issue.severity,
          issue.status,
          issue.ownerModule,
          JSON.stringify(issue)
        ],
      );
    }
  }
}
