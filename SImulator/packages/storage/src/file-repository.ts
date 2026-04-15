import {
  projectManifestSchema,
  projectSchema,
  type Project,
  type ProjectManifest
} from "@course-creator-os/project-model";

import type {
  FileSystemBridge,
  ManifestRepository,
  ProjectFileLayout,
  ProjectRepository
} from "./contracts";
import {
  createProjectFileLayout,
  parseProjectManifest,
  serializeProjectManifest
} from "./manifest";
import { createProjectBundle } from "./project-bundle";
import { dirnamePath, joinPath } from "./pathing";

async function ensureProjectDirectories(
  fileSystem: FileSystemBridge,
  layout: ProjectFileLayout,
) {
  await Promise.all([
    fileSystem.ensureDirectory(layout.rootPath),
    fileSystem.ensureDirectory(layout.courseBibleDirectory),
    fileSystem.ensureDirectory(layout.holesDirectory),
    fileSystem.ensureDirectory(layout.worldDirectory),
    fileSystem.ensureDirectory(layout.assetsDirectory),
    fileSystem.ensureDirectory(layout.previewDirectory),
    fileSystem.ensureDirectory(layout.buildDirectory),
    fileSystem.ensureDirectory(layout.versioningDirectory),
    fileSystem.ensureDirectory(layout.exportsDirectory),
    fileSystem.ensureDirectory(layout.logsDirectory),
    fileSystem.ensureDirectory(layout.localStateDirectory)
  ]);
}

async function writeProjectBundle(
  fileSystem: FileSystemBridge,
  projectRoot: string,
  project: Project,
) {
  const bundle = createProjectBundle(project);

  await fileSystem.ensureDirectory(projectRoot);
  await Promise.all(
    bundle.map(async (file) => {
      const absolutePath = joinPath(projectRoot, file.relativePath);
      await fileSystem.ensureDirectory(dirnamePath(absolutePath));
      await fileSystem.writeText(absolutePath, file.content);
    }),
  );
}

async function readJsonSection<T>(fileSystem: FileSystemBridge, filePath: string): Promise<T> {
  const raw = await fileSystem.readText(filePath);
  return JSON.parse(raw) as T;
}

async function readJsonSectionOrDefault<T>(
  fileSystem: FileSystemBridge,
  filePath: string,
  fallback: T,
): Promise<T> {
  if (!(await fileSystem.exists(filePath))) {
    return fallback;
  }

  return readJsonSection<T>(fileSystem, filePath);
}

export class JsonManifestRepository implements ManifestRepository {
  constructor(private readonly fileSystem: FileSystemBridge) {}

  async loadManifest(projectRoot: string) {
    const layout = createProjectFileLayout(projectRoot);
    const manifestText = await this.fileSystem.readText(layout.manifestPath);
    return parseProjectManifest(manifestText);
  }

  async saveManifest(projectRoot: string, manifestInput: ProjectManifest) {
    const manifest = projectManifestSchema.parse(manifestInput);
    const layout = createProjectFileLayout(projectRoot);

    await ensureProjectDirectories(this.fileSystem, layout);
    await this.fileSystem.writeText(layout.manifestPath, serializeProjectManifest(manifest));
  }
}

export class JsonProjectRepository implements ProjectRepository {
  private readonly manifestRepository: ManifestRepository;

  constructor(
    private readonly fileSystem: FileSystemBridge,
    manifestRepository?: ManifestRepository,
  ) {
    this.manifestRepository = manifestRepository ?? new JsonManifestRepository(fileSystem);
  }

  async projectExists(projectRoot: string) {
    const layout = createProjectFileLayout(projectRoot);
    return this.fileSystem.exists(layout.manifestPath);
  }

  async scaffoldProject(projectRoot: string, project: Project) {
    return this.saveProject(projectRoot, project);
  }

  async saveProject(projectRoot: string, projectInput: Project) {
    const project = projectSchema.parse(projectInput);
    const layout = createProjectFileLayout(projectRoot);

    await ensureProjectDirectories(this.fileSystem, layout);
    await writeProjectBundle(this.fileSystem, projectRoot, project);

    return layout;
  }

  async loadProject(projectRoot: string) {
    const layout = createProjectFileLayout(projectRoot);
    const manifest = await this.manifestRepository.loadManifest(projectRoot);
    const simulatorSection = await readJsonSection<{
      teeSets: Project["teeSets"];
      pinSets: Project["pinSets"];
      surfaceProfiles: Project["surfaceProfiles"];
      hazardProfiles: Project["hazardProfiles"];
      dropZones: Project["dropZones"];
      simulatorLogic: Project["simulatorLogic"];
    }>(this.fileSystem, layout.simulatorLogicPath);

    return projectSchema.parse({
      id: manifest.id,
      manifest,
      moduleStatuses: await readJsonSection<Project["moduleStatuses"]>(this.fileSystem, layout.moduleStatusesPath),
      courseBible: await readJsonSection<Project["courseBible"]>(this.fileSystem, layout.courseBiblePath),
      holes: await readJsonSection<Project["holes"]>(this.fileSystem, layout.holesPath),
      teeSets: simulatorSection.teeSets,
      pinSets: simulatorSection.pinSets,
      surfaceProfiles: simulatorSection.surfaceProfiles,
      hazardProfiles: simulatorSection.hazardProfiles,
      dropZones: simulatorSection.dropZones,
      simulatorLogic: simulatorSection.simulatorLogic,
      districts: await readJsonSection<Project["districts"]>(this.fileSystem, layout.districtsPath),
      landmarks: await readJsonSection<Project["landmarks"]>(this.fileSystem, layout.landmarksPath),
      supportSpaces: await readJsonSectionOrDefault<Project["supportSpaces"]>(
        this.fileSystem,
        layout.supportSpacesPath,
        [],
      ),
      environmentZones: await readJsonSectionOrDefault<Project["environmentZones"]>(
        this.fileSystem,
        layout.environmentZonesPath,
        [],
      ),
      sceneAuthoring: await readJsonSection<Project["sceneAuthoring"]>(this.fileSystem, layout.sceneAuthoringPath),
      assets: await readJsonSection<Project["assets"]>(this.fileSystem, layout.assetsPath),
      eventSequences: await readJsonSection<Project["eventSequences"]>(this.fileSystem, layout.eventsPath),
      previewPaths: await readJsonSection<Project["previewPaths"]>(this.fileSystem, layout.previewPathsPath),
      flyoverPlans: await readJsonSectionOrDefault<Project["flyoverPlans"]>(
        this.fileSystem,
        layout.flyoverPlansPath,
        [],
      ),
      screenshotPlans: await readJsonSection<Project["screenshotPlans"]>(this.fileSystem, layout.screenshotPlansPath),
      showcaseSequences: await readJsonSectionOrDefault<Project["showcaseSequences"]>(
        this.fileSystem,
        layout.showcaseSequencesPath,
        [],
      ),
      validationState: await readJsonSection<Project["validationState"]>(this.fileSystem, layout.validationStatePath),
      performanceSnapshot: await readJsonSection<Project["performanceSnapshot"]>(this.fileSystem, layout.performanceSnapshotPath),
      performanceState: await readJsonSection<Project["performanceState"]>(this.fileSystem, layout.performanceStatePath),
      packageBuilds: await readJsonSection<Project["packageBuilds"]>(this.fileSystem, layout.packageBuildsPath),
      releaseRecords: await readJsonSection<Project["releaseRecords"]>(this.fileSystem, layout.releaseRecordsPath),
      packagingState: await readJsonSection<Project["packagingState"]>(this.fileSystem, layout.packagingStatePath),
      snapshots: await readJsonSection<Project["snapshots"]>(this.fileSystem, layout.snapshotsPath),
      snapshotBundles: await readJsonSectionOrDefault<Project["snapshotBundles"]>(
        this.fileSystem,
        layout.snapshotBundlesPath,
        [],
      ),
      restorePoints: await readJsonSectionOrDefault<Project["restorePoints"]>(
        this.fileSystem,
        layout.restorePointsPath,
        [],
      ),
      changeSummaries: await readJsonSectionOrDefault<Project["changeSummaries"]>(
        this.fileSystem,
        layout.changeSummariesPath,
        [],
      ),
      versioningState: await readJsonSection<Project["versioningState"]>(this.fileSystem, layout.versioningStatePath),
      backgroundJobs: await readJsonSection<Project["backgroundJobs"]>(this.fileSystem, layout.backgroundJobsPath)
    } satisfies Project);
  }
}
