import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";

import { createProject } from "@course-creator-os/project-model";

import { JsonProjectRepository } from "./file-repository";
import {
  createProjectIndexHealthReport,
  createProjectIndexSnapshot,
  parseProjectIndexHealthReport,
  parseProjectIndexSnapshot
} from "./index-health";
import { MemoryFileSystemBridge } from "./memory-filesystem";
import {
  createProjectFileLayout,
  parseProjectManifest,
  serializeProjectManifest
} from "./manifest";
import { joinPath } from "./pathing";
import {
  executeProjectIndexRebuild,
  inspectProjectIndexState
} from "./runtime";
import {
  SQLiteProjectIndexRepository,
  SQLiteValidationIssueRepository
} from "./sqlite";
import type { SQLiteExecutor } from "./contracts";

class TestSQLiteExecutor implements SQLiteExecutor {
  private readonly database = new DatabaseSync(":memory:");

  async exec(sql: string) {
    this.database.exec(sql);
  }

  async query<T extends Record<string, string | number | null>>(
    sql: string,
    params: Array<string | number | null> = [],
  ) {
    const statement = this.database.prepare(sql);
    return statement.all(...params) as T[];
  }

  async run(sql: string, params: Array<string | number | null> = []) {
    const statement = this.database.prepare(sql);
    const result = statement.run(...params);

    return {
      changes: Number(result.changes ?? 0),
      lastInsertRowId:
        result.lastInsertRowid === undefined || result.lastInsertRowid === null
          ? null
          : Number(result.lastInsertRowid)
    };
  }
}

describe("storage manifest strategy", () => {
  it("serializes and parses a human-readable project manifest", () => {
    const project = createProject({
      name: "Harbor Prototype",
      projectMode: "public-safe",
      holeCount: 18,
      primaryTheme: "Premium Harbor Resort",
      courseType: "resort",
      realismTarget: 74,
      spectacleTarget: 52,
      targetHardwareProfile: "Community Baseline",
      activeValidationProfile: "balanced",
      activeOutputProfiles: ["community-safe"],
      activeStylePack: "premium-resort"
    });

    const serialized = serializeProjectManifest(project.manifest);
    const parsed = parseProjectManifest(serialized);

    expect(serialized).toContain(`"name": "Harbor Prototype"`);
    expect(serialized).toContain(`"slug": "harbor-prototype"`);
    expect(serialized.endsWith("\n")).toBe(true);
    expect(parsed).toEqual(project.manifest);
  });

  it("saves and loads a project through the file-based repository", async () => {
    const project = createProject({
      name: "Night Garden",
      projectMode: "experimental-private",
      holeCount: 9,
      primaryTheme: "Luminous Botanical District",
      courseType: "fantasy",
      realismTarget: 38,
      spectacleTarget: 79,
      targetHardwareProfile: "High End Creator Rig",
      activeValidationProfile: "showcase-review",
      activeOutputProfiles: ["brother-mode", "showcase"],
      activeStylePack: "night-garden"
    });
    const fileSystem = new MemoryFileSystemBridge();
    const repository = new JsonProjectRepository(fileSystem);
    const projectRoot = joinPath("/virtual", project.manifest.slug);

    const layout = await repository.scaffoldProject(projectRoot, project);
    const loadedProject = await repository.loadProject(projectRoot);
    const readme = await fileSystem.readText(joinPath(projectRoot, "README.md"));
    const courseBibleDoc = await fileSystem.readText(
      joinPath(projectRoot, "course-bible", "COURSE_BIBLE.md"),
    );
    const holePlannerDoc = await fileSystem.readText(
      joinPath(projectRoot, "holes", "HOLE_PLANNER.md"),
    );
    const sceneAuthoringFile = await fileSystem.readText(
      joinPath(projectRoot, "build", "scene-authoring.json"),
    );
    const simulatorLogicFile = await fileSystem.readText(
      joinPath(projectRoot, "holes", "simulator-logic.json"),
    );
    const indexManifestFile = await fileSystem.readText(
      joinPath(projectRoot, ".course-creator-os", "index-manifest.json"),
    );
    const spatialTrustFile = await fileSystem.readText(
      joinPath(projectRoot, ".course-creator-os", "spatial-trust-report.json"),
    );
    const parsedIndexManifest = parseProjectIndexSnapshot(indexManifestFile);
    const parsedSpatialTrust = parseProjectIndexHealthReport(spatialTrustFile);

    expect(layout).toEqual(createProjectFileLayout(projectRoot));
    expect(loadedProject).toEqual(project);
    expect(await repository.projectExists(projectRoot)).toBe(true);
    expect(readme).toContain("# Night Garden");
    expect(courseBibleDoc).toContain("## Vision Summary");
    expect(holePlannerDoc).toContain("## Seeded Hole Snapshot");
    expect(loadedProject.sceneAuthoring.routingPaths).toEqual(project.sceneAuthoring.routingPaths);
    expect(loadedProject.sceneAuthoring.terrainRegions).toEqual(project.sceneAuthoring.terrainRegions);
    expect(loadedProject.sceneAuthoring.editingState).toEqual(project.sceneAuthoring.editingState);
    expect(loadedProject.simulatorLogic.teeSpatialBindings).toEqual(project.simulatorLogic.teeSpatialBindings);
    expect(sceneAuthoringFile).toContain("\"routingPaths\"");
    expect(sceneAuthoringFile).toContain("\"terrainRegions\"");
    expect(sceneAuthoringFile).toContain("\"editingState\"");
    expect(sceneAuthoringFile).toContain("\"terrainSculptMode\"");
    expect(sceneAuthoringFile).toContain("\"hoveredSpatialEntityRef\"");
    expect(simulatorLogicFile).toContain("\"teeSpatialBindings\"");
    expect(simulatorLogicFile).toContain("\"previewAnchorBindings\"");
    expect(parsedIndexManifest.projectId).toBe(project.id);
    expect(parsedIndexManifest.sceneObjectCount).toBe(project.sceneAuthoring.sceneObjects.length);
    expect(parsedSpatialTrust.snapshot?.projectId).toBe(project.id);
    expect(parsedSpatialTrust.health).toBe("healthy");
  });

  it("detects stale index metadata when spatial truth changes", () => {
    const project = createProject({
      name: "Trust Drift",
      projectMode: "public-safe",
      holeCount: 9,
      primaryTheme: "Harbor Twilight",
      courseType: "resort",
      realismTarget: 62,
      spectacleTarget: 58,
      targetHardwareProfile: "Community Baseline",
      activeValidationProfile: "balanced",
      activeOutputProfiles: ["community-safe"],
      activeStylePack: "harbor-night"
    });
    const snapshot = createProjectIndexSnapshot(project);
    project.sceneAuthoring.sceneObjects.push({
      ...project.sceneAuthoring.sceneObjects[0]!,
      sceneObjectId: "scene-extra-drift"
    });

    const report = createProjectIndexHealthReport(project, snapshot, project.manifest.updatedAt);

    expect(report.driftState).toBe("stale");
    expect(report.health).toBe("attention");
  });

  it("executes a real SQLite rebuild through the repository runtime", async () => {
    const project = createProject({
      name: "Operational Harbor",
      projectMode: "public-safe",
      holeCount: 9,
      primaryTheme: "Harbor Runtime",
      courseType: "resort",
      realismTarget: 70,
      spectacleTarget: 55,
      targetHardwareProfile: "Community Baseline",
      activeValidationProfile: "balanced",
      activeOutputProfiles: ["community-safe"],
      activeStylePack: "harbor-runtime"
    });
    const executor = new TestSQLiteExecutor();
    const indexRepository = new SQLiteProjectIndexRepository(executor);
    const issueRepository = new SQLiteValidationIssueRepository(executor);

    const result = await executeProjectIndexRebuild(
      project,
      [],
      indexRepository,
      issueRepository,
      project.manifest.updatedAt,
    );
    const stats = await indexRepository.readProjectIndexStats(project.id);

    expect(result.indexHealth.health).toBe("healthy");
    expect(result.rebuildRecommended).toBe(false);
    expect(stats.sceneObjectCount).toBe(project.sceneAuthoring.sceneObjects.length);
    expect(stats.routingPathCount).toBe(project.sceneAuthoring.routingPaths.length);
  });

  it("detects stale SQLite counts when project truth drifts after a rebuild", async () => {
    const project = createProject({
      name: "Index Drift Runtime",
      projectMode: "public-safe",
      holeCount: 9,
      primaryTheme: "Night Harbor",
      courseType: "resort",
      realismTarget: 64,
      spectacleTarget: 61,
      targetHardwareProfile: "Community Baseline",
      activeValidationProfile: "balanced",
      activeOutputProfiles: ["community-safe"],
      activeStylePack: "night-harbor"
    });
    const executor = new TestSQLiteExecutor();
    const indexRepository = new SQLiteProjectIndexRepository(executor);
    const issueRepository = new SQLiteValidationIssueRepository(executor);

    await executeProjectIndexRebuild(project, [], indexRepository, issueRepository);
    project.sceneAuthoring.sceneObjects.push({
      ...project.sceneAuthoring.sceneObjects[0]!,
      sceneObjectId: "scene-drift-extra"
    });

    const inspection = await inspectProjectIndexState(project, indexRepository, project.manifest.updatedAt);

    expect(inspection.indexHealth.health).toBe("critical");
    expect(inspection.rebuildRecommended).toBe(true);
    expect(inspection.indexHealth.issues.some((issue) => issue.issueId === "index-record-drift")).toBe(true);
  });
});
