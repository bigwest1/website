import { z } from "zod";

import { assetSchema } from "@course-creator-os/asset-system";
import {
  backgroundJobSchema,
  healthStateSchema,
  projectModeSchema,
  readinessStateSchema,
  validationProfileSchema
} from "@course-creator-os/core-types";
import { courseBibleSchema } from "@course-creator-os/course-bible";
import { eventSequenceSchema } from "@course-creator-os/event-system";
import { holeSchema } from "@course-creator-os/hole-planner";
import { packageBuildSchema, releaseRecordSchema } from "@course-creator-os/packaging";
import {
  coursePerformanceSnapshotSchema,
  performanceProfileIdSchema
} from "@course-creator-os/performance";
import {
  flyoverPlanSchema,
  previewPathSchema,
  screenshotPlanSchema,
  showcaseSequenceSchema
} from "@course-creator-os/preview";
import { sceneAuthoringStateSchema } from "@course-creator-os/scene-authoring";
import {
  dropZoneSchema,
  hazardProfileSchema,
  pinSetSchema,
  simulatorLogicConfigSchema,
  surfaceProfileSchema,
  teeSetSchema
} from "@course-creator-os/sim-logic";
import {
  changeSummarySchema,
  restorePointSchema,
  snapshotSchema,
  snapshotBundleSchema,
  versioningStateSummarySchema
} from "@course-creator-os/versioning";
import {
  districtSchema,
  environmentZoneSchema,
  landmarkSchema,
  supportSpaceSchema
} from "@course-creator-os/world-system";

import { MODULE_KEYS } from "./modules";

export const courseTypeSchema = z.enum([
  "parkland",
  "links",
  "desert",
  "mountain",
  "fantasy",
  "theme-park",
  "resort",
  "municipal",
  "urban",
  "historical",
  "surreal"
]);

export const moduleStateSchema = z.enum([
  "not-started",
  "defined",
  "in-design",
  "in-build",
  "in-validation",
  "ready-for-integration",
  "ready",
  "blocked"
]);

export const moduleStatusSchema = z.object({
  state: moduleStateSchema,
  completion: z.number().min(0).max(1),
  blockers: z.array(z.string()),
  nextAction: z.string()
});

export const projectManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  projectMode: projectModeSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.string(),
  holeCount: z.number().min(1).max(18),
  activeOutputProfiles: z.array(performanceProfileIdSchema).min(1),
  primaryTheme: z.string(),
  realismTarget: z.number().min(0).max(100),
  spectacleTarget: z.number().min(0).max(100),
  targetHardwareProfile: z.string(),
  activeStylePack: z.string().nullable(),
  activeValidationProfile: validationProfileSchema,
  courseType: courseTypeSchema
});

export const validationStateSummarySchema = z.object({
  healthState: healthStateSchema,
  readiness: readinessStateSchema,
  openIssueCount: z.number().min(0)
});

export const performanceStateSummarySchema = z.object({
  activeProfileId: performanceProfileIdSchema,
  status: z.enum(["safe", "watch", "risky"]),
  topRisk: z.string().nullable()
});

export const packagingStateSummarySchema = z.object({
  latestBuildId: z.string().nullable(),
  readiness: readinessStateSchema,
  releaseCandidateReady: z.boolean()
});

export const projectSchema = z.object({
  id: z.string(),
  manifest: projectManifestSchema,
  moduleStatuses: z.record(z.enum(MODULE_KEYS), moduleStatusSchema),
  courseBible: courseBibleSchema,
  holes: z.array(holeSchema).min(1),
  teeSets: z.array(teeSetSchema).min(1),
  pinSets: z.array(pinSetSchema).min(1),
  surfaceProfiles: z.array(surfaceProfileSchema).min(1),
  hazardProfiles: z.array(hazardProfileSchema),
  dropZones: z.array(dropZoneSchema),
  simulatorLogic: simulatorLogicConfigSchema,
  districts: z.array(districtSchema).min(1),
  landmarks: z.array(landmarkSchema),
  supportSpaces: z.array(supportSpaceSchema).default([]),
  environmentZones: z.array(environmentZoneSchema).default([]),
  sceneAuthoring: sceneAuthoringStateSchema,
  assets: z.array(assetSchema),
  eventSequences: z.array(eventSequenceSchema),
  previewPaths: z.array(previewPathSchema),
  flyoverPlans: z.array(flyoverPlanSchema).default([]),
  screenshotPlans: z.array(screenshotPlanSchema),
  showcaseSequences: z.array(showcaseSequenceSchema).default([]),
  validationState: validationStateSummarySchema,
  performanceSnapshot: coursePerformanceSnapshotSchema,
  performanceState: performanceStateSummarySchema,
  packageBuilds: z.array(packageBuildSchema),
  releaseRecords: z.array(releaseRecordSchema),
  packagingState: packagingStateSummarySchema,
  snapshots: z.array(snapshotSchema),
  snapshotBundles: z.array(snapshotBundleSchema).default([]),
  restorePoints: z.array(restorePointSchema).default([]),
  changeSummaries: z.array(changeSummarySchema).default([]),
  versioningState: versioningStateSummarySchema,
  backgroundJobs: z.array(backgroundJobSchema)
});

export type ModuleStatus = z.infer<typeof moduleStatusSchema>;
export type ProjectManifest = z.infer<typeof projectManifestSchema>;
export type ValidationStateSummary = z.infer<typeof validationStateSummarySchema>;
export type PerformanceStateSummary = z.infer<typeof performanceStateSummarySchema>;
export type PackagingStateSummary = z.infer<typeof packagingStateSummarySchema>;
export type CourseProject = z.infer<typeof projectSchema>;
export type Project = CourseProject;

export type ModuleReadiness =
  | "Not Started"
  | "Defined"
  | "In Design"
  | "In Build"
  | "In Validation"
  | "Ready for Integration"
  | "Ready"
  | "Blocked";

export function getModuleReadinessStatus(moduleStatus: ModuleStatus): ModuleReadiness {
  if (moduleStatus.state === "blocked" || moduleStatus.blockers.length > 0) {
    return "Blocked";
  }

  const labels: Record<ModuleStatus["state"], ModuleReadiness> = {
    "not-started": "Not Started",
    defined: "Defined",
    "in-design": "In Design",
    "in-build": "In Build",
    "in-validation": "In Validation",
    "ready-for-integration": "Ready for Integration",
    ready: "Ready",
    blocked: "Blocked"
  };

  return labels[moduleStatus.state];
}
