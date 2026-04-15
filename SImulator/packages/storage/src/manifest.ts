import { projectManifestSchema } from "@course-creator-os/project-model";

import {
  projectFileLayoutSchema,
  type ProjectFileLayout
} from "./contracts";
import {
  INDEX_MANIFEST_FILENAME,
  LOCAL_STATE_DIRECTORYNAME,
  PROJECT_MANIFEST_FILENAME,
  SPATIAL_TRUST_REPORT_FILENAME,
  SQLITE_INDEX_FILENAME
} from "./project-bundle";
export { serializeProjectManifest } from "./project-bundle";
import { joinPath } from "./pathing";

export function createProjectFileLayout(projectRoot: string): ProjectFileLayout {
  const courseBibleDirectory = joinPath(projectRoot, "course-bible");
  const holesDirectory = joinPath(projectRoot, "holes");
  const worldDirectory = joinPath(projectRoot, "world");
  const assetsDirectory = joinPath(projectRoot, "assets");
  const previewDirectory = joinPath(projectRoot, "preview");
  const buildDirectory = joinPath(projectRoot, "build");
  const versioningDirectory = joinPath(projectRoot, "versioning");
  const exportsDirectory = joinPath(projectRoot, "exports");
  const logsDirectory = joinPath(projectRoot, "logs");
  const localStateDirectory = joinPath(projectRoot, LOCAL_STATE_DIRECTORYNAME);

  return projectFileLayoutSchema.parse({
    rootPath: projectRoot,
    manifestPath: joinPath(projectRoot, PROJECT_MANIFEST_FILENAME),
    courseBiblePath: joinPath(courseBibleDirectory, "course-bible.json"),
    moduleStatusesPath: joinPath(buildDirectory, "module-statuses.json"),
    holesPath: joinPath(holesDirectory, "holes.json"),
    simulatorLogicPath: joinPath(holesDirectory, "simulator-logic.json"),
    sceneAuthoringPath: joinPath(buildDirectory, "scene-authoring.json"),
    districtsPath: joinPath(worldDirectory, "districts.json"),
    landmarksPath: joinPath(worldDirectory, "landmarks.json"),
    supportSpacesPath: joinPath(worldDirectory, "support-spaces.json"),
    environmentZonesPath: joinPath(worldDirectory, "environment-zones.json"),
    eventsPath: joinPath(worldDirectory, "events.json"),
    assetsPath: joinPath(assetsDirectory, "assets.json"),
    previewPathsPath: joinPath(previewDirectory, "preview-paths.json"),
    flyoverPlansPath: joinPath(previewDirectory, "flyover-plans.json"),
    screenshotPlansPath: joinPath(previewDirectory, "screenshots.json"),
    showcaseSequencesPath: joinPath(previewDirectory, "showcase-sequences.json"),
    validationStatePath: joinPath(buildDirectory, "validation-state.json"),
    performanceSnapshotPath: joinPath(buildDirectory, "performance-snapshot.json"),
    performanceStatePath: joinPath(buildDirectory, "performance-state.json"),
    packageBuildsPath: joinPath(buildDirectory, "package-builds.json"),
    releaseRecordsPath: joinPath(buildDirectory, "release-records.json"),
    packagingStatePath: joinPath(buildDirectory, "packaging-state.json"),
    snapshotsPath: joinPath(versioningDirectory, "snapshots.json"),
    snapshotBundlesPath: joinPath(versioningDirectory, "snapshot-bundles.json"),
    restorePointsPath: joinPath(versioningDirectory, "restore-points.json"),
    changeSummariesPath: joinPath(versioningDirectory, "change-summaries.json"),
    versioningStatePath: joinPath(versioningDirectory, "versioning-state.json"),
    backgroundJobsPath: joinPath(logsDirectory, "background-jobs.json"),
    courseBibleDirectory,
    holesDirectory,
    worldDirectory,
    assetsDirectory,
    previewDirectory,
    buildDirectory,
    versioningDirectory,
    exportsDirectory,
    logsDirectory,
    localStateDirectory,
    sqliteIndexPath: joinPath(localStateDirectory, SQLITE_INDEX_FILENAME),
    indexManifestPath: joinPath(localStateDirectory, INDEX_MANIFEST_FILENAME),
    spatialTrustReportPath: joinPath(localStateDirectory, SPATIAL_TRUST_REPORT_FILENAME)
  });
}

export function parseProjectManifest(text: string) {
  return projectManifestSchema.parse(JSON.parse(text));
}
