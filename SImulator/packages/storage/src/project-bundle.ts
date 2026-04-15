import {
  projectManifestSchema,
  projectSchema,
  type Project,
  type ProjectManifest
} from "@course-creator-os/project-model";

import {
  createSpatialTrustBundle,
  serializeProjectIndexHealthReport,
  serializeProjectIndexSnapshot
} from "./index-health";

export const PROJECT_MANIFEST_FILENAME = "project.manifest.json";
export const LOCAL_STATE_DIRECTORYNAME = ".course-creator-os";
export const SQLITE_INDEX_FILENAME = "project-index.sqlite3";
export const INDEX_MANIFEST_FILENAME = "index-manifest.json";
export const SPATIAL_TRUST_REPORT_FILENAME = "spatial-trust-report.json";
export const SNAPSHOT_BUNDLES_FILENAME = "snapshot-bundles.json";

export type ProjectBundleFile = {
  relativePath: string;
  content: string;
};

function isSnapshotBundleEligibleFile(file: ProjectBundleFile) {
  return (
    file.relativePath !== `${LOCAL_STATE_DIRECTORYNAME}/${SQLITE_INDEX_FILENAME}` &&
    file.relativePath !== `versioning/${SNAPSHOT_BUNDLES_FILENAME}`
  );
}

function markdownList(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function previewFileList(files: ProjectBundleFile[], limit = 8) {
  return files
    .slice(0, limit)
    .map((file) => `- \`${file.relativePath}\``)
    .join("\n");
}

function createRootReadme(project: Project, files: ProjectBundleFile[]) {
  return `# ${project.manifest.name}

Course Creator OS project scaffold.

## Project Intent

- Theme: ${project.manifest.primaryTheme}
- Course type: ${project.manifest.courseType}
- Project mode: ${project.manifest.projectMode}
- Hole count: ${project.manifest.holeCount}
- Validation profile: ${project.manifest.activeValidationProfile}
- Output profiles: ${project.manifest.activeOutputProfiles.join(", ")}

## First Next Steps

- Refine the course bible in the Plan workspace.
- Define hole intent, readability, and pacing for each hole.
- Complete simulator logic coverage before packaging.
- Review validation issues before marking any module ready.

## Scaffold Contents

${previewFileList(files)}
`;
}

function createProjectSetupDoc(project: Project) {
  return `# ${project.manifest.name} Setup

## Created By

Course Creator OS project wizard.

## Hardware Target

${project.manifest.targetHardwareProfile}

## Starting Posture

- Project mode: ${project.manifest.projectMode}
- Validation profile: ${project.manifest.activeValidationProfile}
- Active style pack: ${project.manifest.activeStylePack ?? "None selected"}

## Immediate Workflow

1. Confirm course identity and release intent.
2. Review the seeded hole structure and adjust pacing.
3. Add tee, pin, hazard, and preview coverage.
4. Begin asset ingestion only after style direction is stable.
`;
}

function createNextStepsDoc(project: Project) {
  return `# Next Steps

## Planning Priorities

${markdownList([
  "Lock the design truth in the Course Bible.",
  "Review all seeded holes for par, target yardage, and role accuracy.",
  "Define districts and landmark hierarchy before importing a large asset set.",
  "Complete simulator logic coverage for tees, pins, hazards, and drop zones."
])}

## Seeded Signature Moments

${markdownList(project.courseBible.signatureMoments.map((moment) => moment.title))}
`;
}

function createCourseBibleDoc(project: Project) {
  return `# Course Bible

## Vision Summary

${project.courseBible.visionOverview.statement}

## Audience

${project.courseBible.audienceAndIntent.primaryAudience}

## World Identity

${project.courseBible.worldIdentity.settingSummary}

## Style Grammar

${markdownList(project.courseBible.styleGrammar)}

## Material Language

${markdownList(project.courseBible.materialLanguage)}

## Lighting Language

${markdownList(project.courseBible.lightingLanguage)}

## Pacing Plan

${markdownList([
  project.courseBible.pacingAndEmotionalArc.openingBeat,
  project.courseBible.pacingAndEmotionalArc.midCourseBeat,
  project.courseBible.pacingAndEmotionalArc.closingBeat
])}
`;
}

function createHolePlannerDoc(project: Project) {
  return `# Hole Planner

## Planning Priorities

- Confirm hole sequence and pacing.
- Review par and target yardage per hole.
- Add landmark, hazard, and payoff planning notes before build work.
- Align flyover notes with preview readiness.

## Seeded Hole Snapshot

${project.holes
  .slice(0, 6)
  .map(
    (hole) =>
      `- Hole ${hole.number}: Par ${hole.par}, ${hole.targetYardage} yds, ${hole.metadata.holeRole}`,
  )
  .join("\n")}
`;
}

function createPreviewStudioDoc(project: Project) {
  return `# Preview Studio

## Preview Priorities

- Finish flyover and minimap coverage for every playable hole.
- Approve hero screenshots before public-safe release posture is claimed.
- Build at least one showcase sequence that explains the course identity end to end.
- Keep preview framing aligned with gameplay readability, not just spectacle.

## Seeded Preview Assets

- Preview paths: ${project.previewPaths.length}
- Flyover plans: ${project.flyoverPlans.length}
- Screenshot plans: ${project.screenshotPlans.length}
  - Showcase sequences: ${project.showcaseSequences.length}
  `;
}

function createSceneAuthoringDoc(project: Project) {
  return `# Scene Authoring

## Placement Priorities

- Place gameplay-critical anchors before dense scenic dressing.
- Keep landmark framing readable from the player route and preview cameras.
- Use support-space placement to reinforce world plausibility, not clutter.
- Review density and validation overlays before locking large placement passes.

## Initial Scene Metrics

- Collections: ${project.sceneAuthoring.sceneCollections.length}
- Layers: ${project.sceneAuthoring.placementLayers.length}
- Scene objects: ${project.sceneAuthoring.sceneObjects.length}
- Scene groups: ${project.sceneAuthoring.sceneGroups.length}
`;
}

export function serializeHumanReadableJson(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function serializeProjectManifest(manifestInput: ProjectManifest) {
  const manifest = projectManifestSchema.parse(manifestInput);

  return serializeHumanReadableJson({
    id: manifest.id,
    name: manifest.name,
    slug: manifest.slug,
    projectMode: manifest.projectMode,
    createdAt: manifest.createdAt,
    updatedAt: manifest.updatedAt,
    version: manifest.version,
    holeCount: manifest.holeCount,
    activeOutputProfiles: manifest.activeOutputProfiles,
    primaryTheme: manifest.primaryTheme,
    realismTarget: manifest.realismTarget,
    spectacleTarget: manifest.spectacleTarget,
    targetHardwareProfile: manifest.targetHardwareProfile,
    activeStylePack: manifest.activeStylePack,
    activeValidationProfile: manifest.activeValidationProfile,
    courseType: manifest.courseType
  } satisfies ProjectManifest);
}

export function createProjectBundle(projectInput: Project): ProjectBundleFile[] {
  const project = projectSchema.parse(projectInput);
  const generatedAt = project.manifest.updatedAt;
  const spatialTrustBundle = createSpatialTrustBundle(project, generatedAt);

  const files: ProjectBundleFile[] = [
    {
      relativePath: PROJECT_MANIFEST_FILENAME,
      content: serializeProjectManifest(project.manifest)
    },
    {
      relativePath: "course-bible/course-bible.json",
      content: serializeHumanReadableJson(project.courseBible)
    },
    {
      relativePath: "build/module-statuses.json",
      content: serializeHumanReadableJson(project.moduleStatuses)
    },
    {
      relativePath: "holes/holes.json",
      content: serializeHumanReadableJson(project.holes)
    },
    {
      relativePath: "holes/simulator-logic.json",
      content: serializeHumanReadableJson({
        teeSets: project.teeSets,
        pinSets: project.pinSets,
        surfaceProfiles: project.surfaceProfiles,
        hazardProfiles: project.hazardProfiles,
        dropZones: project.dropZones,
        simulatorLogic: project.simulatorLogic
      })
    },
    {
      relativePath: "build/scene-authoring.json",
      content: serializeHumanReadableJson(project.sceneAuthoring)
    },
    {
      relativePath: "world/districts.json",
      content: serializeHumanReadableJson(project.districts)
    },
    {
      relativePath: "world/landmarks.json",
      content: serializeHumanReadableJson(project.landmarks)
    },
    {
      relativePath: "world/support-spaces.json",
      content: serializeHumanReadableJson(project.supportSpaces)
    },
    {
      relativePath: "world/environment-zones.json",
      content: serializeHumanReadableJson(project.environmentZones)
    },
    {
      relativePath: "world/events.json",
      content: serializeHumanReadableJson(project.eventSequences)
    },
    {
      relativePath: "assets/assets.json",
      content: serializeHumanReadableJson(project.assets)
    },
    {
      relativePath: "preview/preview-paths.json",
      content: serializeHumanReadableJson(project.previewPaths)
    },
    {
      relativePath: "preview/flyover-plans.json",
      content: serializeHumanReadableJson(project.flyoverPlans)
    },
    {
      relativePath: "preview/screenshots.json",
      content: serializeHumanReadableJson(project.screenshotPlans)
    },
    {
      relativePath: "preview/showcase-sequences.json",
      content: serializeHumanReadableJson(project.showcaseSequences)
    },
    {
      relativePath: "build/validation-state.json",
      content: serializeHumanReadableJson(project.validationState)
    },
    {
      relativePath: "build/performance-snapshot.json",
      content: serializeHumanReadableJson(project.performanceSnapshot)
    },
    {
      relativePath: "build/performance-state.json",
      content: serializeHumanReadableJson(project.performanceState)
    },
    {
      relativePath: "build/package-builds.json",
      content: serializeHumanReadableJson(project.packageBuilds)
    },
    {
      relativePath: "build/release-records.json",
      content: serializeHumanReadableJson(project.releaseRecords)
    },
    {
      relativePath: "build/packaging-state.json",
      content: serializeHumanReadableJson(project.packagingState)
    },
    {
      relativePath: "versioning/snapshots.json",
      content: serializeHumanReadableJson(project.snapshots)
    },
    {
      relativePath: `versioning/${SNAPSHOT_BUNDLES_FILENAME}`,
      content: serializeHumanReadableJson(project.snapshotBundles)
    },
    {
      relativePath: "versioning/restore-points.json",
      content: serializeHumanReadableJson(project.restorePoints)
    },
    {
      relativePath: "versioning/change-summaries.json",
      content: serializeHumanReadableJson(project.changeSummaries)
    },
    {
      relativePath: "versioning/versioning-state.json",
      content: serializeHumanReadableJson(project.versioningState)
    },
    {
      relativePath: "logs/background-jobs.json",
      content: serializeHumanReadableJson(project.backgroundJobs)
    },
    {
      relativePath: `${LOCAL_STATE_DIRECTORYNAME}/${SQLITE_INDEX_FILENAME}`,
      content: ""
    },
    {
      relativePath: `${LOCAL_STATE_DIRECTORYNAME}/${INDEX_MANIFEST_FILENAME}`,
      content: serializeProjectIndexSnapshot(spatialTrustBundle.indexSnapshot)
    },
    {
      relativePath: `${LOCAL_STATE_DIRECTORYNAME}/${SPATIAL_TRUST_REPORT_FILENAME}`,
      content: serializeProjectIndexHealthReport(spatialTrustBundle.indexHealth)
    }
  ];

  const starterDocs: ProjectBundleFile[] = [
    {
      relativePath: "README.md",
      content: createRootReadme(project, files)
    },
    {
      relativePath: "docs/PROJECT_SETUP.md",
      content: createProjectSetupDoc(project)
    },
    {
      relativePath: "docs/NEXT_STEPS.md",
      content: createNextStepsDoc(project)
    },
    {
      relativePath: "course-bible/COURSE_BIBLE.md",
      content: createCourseBibleDoc(project)
    },
    {
      relativePath: "holes/HOLE_PLANNER.md",
      content: createHolePlannerDoc(project)
    },
    {
      relativePath: "preview/PREVIEW_STUDIO.md",
      content: createPreviewStudioDoc(project)
    },
    {
      relativePath: "build/SCENE_AUTHORING.md",
      content: createSceneAuthoringDoc(project)
    }
  ];

  return [...files, ...starterDocs];
}

export function createSnapshotBundleFiles(projectInput: Project): ProjectBundleFile[] {
  return createProjectBundle(projectInput).filter(isSnapshotBundleEligibleFile);
}
