import { useSyncExternalStore } from "react";

import { type Asset } from "@course-creator-os/asset-system";
import { type CourseBible } from "@course-creator-os/course-bible";
import { type EventSequence } from "@course-creator-os/event-system";
import { type Hole } from "@course-creator-os/hole-planner";
import { type DiagnosticLog } from "@course-creator-os/logging";
import {
  createReleaseRecordFromBuild,
  type ReleaseChannel
} from "@course-creator-os/packaging";
import { assessPerformanceRisk } from "@course-creator-os/performance";
import {
  createSeedProject,
  projectSchema,
  type CourseProject,
  type ModuleKey
} from "@course-creator-os/project-model";
import {
  applyCameraCaptureExecutionAction,
  applyShotOrderApprovalAction,
  applyShotVariantShippingDecisionAction,
  applyShotVariantSetAction,
  applyCameraShotSequencingAction,
  applyCameraPathCorrectionAction,
  updateFlyoverPlanReadiness,
  updatePreviewPathReadiness,
  updateScreenshotStatus,
  updateShowcaseSequenceReadiness,
  type PreviewReadinessState,
  type ScreenshotStatus
} from "@course-creator-os/preview";
import { type SceneAuthoringState } from "@course-creator-os/scene-authoring";
import {
  synchronizeSimulatorLogicConfig,
  type DropZone,
  type FlyoverMetadata,
  type HazardProfile,
  type HazardSpatialBinding,
  type HolePlayProfile,
  type MinimapMetadata,
  type OutOfBoundsSpatialBinding,
  type PinSet,
  type PinSpatialBinding,
  type PreviewAnchorBinding,
  type SurfaceProfile,
  type TeeSet,
  type TeeSpatialBinding,
  type DropZoneSpatialBinding
} from "@course-creator-os/sim-logic";
import {
  type District,
  type EnvironmentZone,
  type Landmark,
  type SupportSpace
} from "@course-creator-os/world-system";
import {
  createRestoreExecutionUpdate,
  createManualSnapshotUpdate,
  createRestorePointPromotionUpdate
} from "@course-creator-os/versioning";
import { evaluateValidationReport } from "@course-creator-os/validation";
import {
  createSnapshotBundleFiles,
  hydrateProjectFromBundleFiles,
  type ProjectIndexHealthReport
} from "@course-creator-os/storage";

import { enrichDerivedProjectState } from "./services/project-derived-state";
import {
  loadProjectFromStorage,
  persistGeneratedArtifacts,
  persistProjectToStorage,
  type ProjectPersistenceMode
} from "./services/project-persistence";
import { runManagedReleaseAutomation } from "./services/release-automation";
import { rebuildOperationalIndex } from "./services/sqlite-runtime";

type PersistenceMode = "seed" | ProjectPersistenceMode;
const ACTIVE_PROJECT_STORAGE_KEY = "cco:active-project";

type SessionOperationStatus = "idle" | "running" | "succeeded" | "failed";

type SessionOperationState = {
  status: SessionOperationStatus;
  message: string | null;
  ranAt: string | null;
};

type SessionOperationsState = {
  rebuild: SessionOperationState;
  restore: SessionOperationState;
  logs: DiagnosticLog[];
};

type ProjectSessionSnapshot = {
  project: CourseProject;
  projectRoot: string | null;
  manifestPath: string | null;
  validationReport: ReturnType<typeof evaluateValidationReport>;
  activePerformanceProfileId: "brother-mode" | "community-safe";
  performanceAssessment: ReturnType<typeof assessPerformanceRisk>;
  saveStatus: {
    label: string;
    detail: string;
  };
  indexHealth: ProjectIndexHealthReport;
  persistenceMode: PersistenceMode;
  saveState: "saved" | "saving" | "error";
  lastSaveError: string | null;
  operations: SessionOperationsState;
};

type ProjectSessionUpdate = {
  persistenceMode?: PersistenceMode;
  projectRoot?: string | null;
  manifestPath?: string | null;
  indexHealth?: ProjectIndexHealthReport;
  operations?: SessionOperationsState;
  savedAt?: string;
  saveState?: ProjectSessionSnapshot["saveState"];
  lastSaveError?: string | null;
};

type SimulatorLogicProjectState = {
  teeSets: TeeSet[];
  pinSets: PinSet[];
  surfaceProfiles: SurfaceProfile[];
  hazardProfiles: HazardProfile[];
  dropZones: DropZone[];
  holePlayProfiles: HolePlayProfile[];
  teeSpatialBindings: TeeSpatialBinding[];
  pinSpatialBindings: PinSpatialBinding[];
  hazardSpatialBindings: HazardSpatialBinding[];
  outOfBoundsSpatialBindings: OutOfBoundsSpatialBinding[];
  dropZoneSpatialBindings: DropZoneSpatialBinding[];
  previewAnchorBindings: PreviewAnchorBinding[];
  minimapMetadata: MinimapMetadata[];
  flyoverMetadata: FlyoverMetadata[];
  outOfBoundsConfigured: boolean;
  exportProfileNotes: string[];
};

type WorldProjectState = {
  districts: District[];
  landmarks: Landmark[];
  supportSpaces: SupportSpace[];
  environmentZones: EnvironmentZone[];
};

type PlayabilityProjectState = {
  holes: Hole[];
  holePlayProfiles: HolePlayProfile[];
};

type SceneAuthoringProjectState = SceneAuthoringState;

const listeners = new Set<() => void>();

function createIdleOperationState(): SessionOperationState {
  return {
    status: "idle",
    message: null,
    ranAt: null
  };
}

function createDefaultOperationsState(): SessionOperationsState {
  return {
    rebuild: createIdleOperationState(),
    restore: createIdleOperationState(),
    logs: []
  };
}

function mergeReleaseRecords(
  existingReleaseRecords: CourseProject["releaseRecords"],
  nextReleaseRecord: CourseProject["releaseRecords"][number] | null,
) {
  if (!nextReleaseRecord) {
    return existingReleaseRecords;
  }

  const remainingRecords = existingReleaseRecords.filter(
    (release) =>
      release.releaseId !== nextReleaseRecord.releaseId &&
      release.packageBuildRef !== nextReleaseRecord.packageBuildRef,
  );

  return [nextReleaseRecord, ...remainingRecords];
}

function appendOperationLog(
  operations: SessionOperationsState,
  input: Omit<DiagnosticLog, "logId">,
): SessionOperationsState {
  return {
    ...operations,
    logs: [
      {
        ...input,
        logId: `operation-${input.category}-${input.createdAt}-${operations.logs.length}`
      },
      ...operations.logs
    ].slice(0, 40)
  };
}

function readStoredProjectSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      project: CourseProject;
      persistenceMode?: PersistenceMode;
      projectRoot?: string | null;
      manifestPath?: string | null;
      indexHealth?: ProjectIndexHealthReport;
      operations?: SessionOperationsState;
    };

    return {
      project: enrichDerivedProjectState(projectSchema.parse(parsed.project)),
      persistenceMode: parsed.persistenceMode ?? "browser-preview",
      projectRoot: parsed.projectRoot ?? null,
      manifestPath: parsed.manifestPath ?? null,
      indexHealth: parsed.indexHealth,
      operations: parsed.operations ?? createDefaultOperationsState()
    };
  } catch {
    window.localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
    return null;
  }
}

function persistProjectSnapshot(snapshot: ProjectSessionSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    ACTIVE_PROJECT_STORAGE_KEY,
    JSON.stringify({
      project: snapshot.project,
      persistenceMode: snapshot.persistenceMode,
      projectRoot: snapshot.projectRoot,
      manifestPath: snapshot.manifestPath,
      indexHealth: snapshot.indexHealth,
      operations: snapshot.operations
    }),
  );
}

function deriveSessionSnapshot(
  project: CourseProject,
  options?: ProjectSessionUpdate,
): ProjectSessionSnapshot {
  const derivedProject = enrichDerivedProjectState(project);
  const validationReport = evaluateValidationReport(derivedProject);
  const activePerformanceProfileId =
    derivedProject.manifest.projectMode === "public-safe" ? "community-safe" : "brother-mode";
  const performanceAssessment = assessPerformanceRisk(
    derivedProject.performanceSnapshot,
    activePerformanceProfileId,
  );
  const persistenceMode = options?.persistenceMode ?? "seed";
  const savedAt = options?.savedAt ?? derivedProject.manifest.updatedAt;
  const savedDate = new Date(savedAt);
  const formattedDate = Number.isNaN(savedDate.getTime())
    ? savedAt
    : savedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      });
  const saveState = options?.saveState ?? "saved";
  const lastSaveError = options?.lastSaveError ?? null;
  const projectRoot = options?.projectRoot ?? null;
  const manifestPath = options?.manifestPath ?? null;
  const operations = options?.operations ?? createDefaultOperationsState();
  const indexHealth =
    options?.indexHealth ?? {
      health: "attention",
      driftState: "missing",
      summary: "Local spatial trust metadata has not been refreshed for this session yet.",
      recommendedAction: "Persist or reload the project to rebuild index and trust metadata.",
      lastIndexedAt: null,
      lastVerifiedAt: savedAt,
      fingerprintMatches: false,
      trustHealth: "attention",
      issueCount: 0,
      warningCount: 0,
      criticalCount: 0,
      snapshot: null,
      issues: []
    };

  const saveStatus =
    saveState === "error"
      ? {
          label: "Save Attention Required",
          detail: lastSaveError ?? "Project persistence needs review."
        }
      : saveState === "saving"
        ? persistenceMode === "tauri-filesystem"
          ? {
              label: "Saving Project Files",
              detail: projectRoot ? `Writing updates to ${projectRoot}` : "Writing updates to disk."
            }
          : {
              label: "Saving Preview Bundle",
              detail: "Persisting the current project snapshot for browser preview."
            }
        : persistenceMode === "tauri-filesystem"
      ? {
          label: "Project Files Saved",
          detail: manifestPath ? `Saved to ${manifestPath} on ${formattedDate}` : `Project files saved ${formattedDate}`
        }
      : persistenceMode === "browser-preview"
        ? {
          label: "Preview Bundle Saved",
          detail:
            indexHealth.health === "healthy"
              ? `Stored locally for browser preview ${formattedDate}`
              : `${indexHealth.summary} Last save ${formattedDate}.`
          }
        : {
            label: "Autosave Preview",
            detail: `Last checkpoint ${formattedDate}`
          };

  return {
    project: derivedProject,
    projectRoot,
    manifestPath,
    validationReport,
    activePerformanceProfileId,
    performanceAssessment,
    saveStatus,
    indexHealth,
    persistenceMode,
    saveState,
    lastSaveError,
    operations
  };
}

const storedSnapshot = readStoredProjectSnapshot();
let sessionSnapshot = storedSnapshot
  ? deriveSessionSnapshot(storedSnapshot.project, {
      persistenceMode: storedSnapshot.persistenceMode,
      projectRoot: storedSnapshot.projectRoot,
      manifestPath: storedSnapshot.manifestPath,
      indexHealth: storedSnapshot.indexHealth,
      operations: storedSnapshot.operations,
      savedAt: storedSnapshot.project.manifest.updatedAt
    })
  : deriveSessionSnapshot(createSeedProject());
let latestPersistenceRequest = 0;
let bootstrapStarted = false;

function emitSessionChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return sessionSnapshot;
}

function commitSessionSnapshot(snapshot: ProjectSessionSnapshot) {
  sessionSnapshot = snapshot;
  persistProjectSnapshot(sessionSnapshot);
  emitSessionChange();
}

async function persistActiveProject(project: CourseProject) {
  if (!sessionSnapshot.projectRoot || sessionSnapshot.persistenceMode === "seed") {
    return;
  }

  const requestId = ++latestPersistenceRequest;
  const targetRoot = sessionSnapshot.projectRoot;
  const targetMode = sessionSnapshot.persistenceMode;

  try {
    const result = await persistProjectToStorage(
      project,
      targetRoot,
      targetMode,
    );

    if (requestId !== latestPersistenceRequest) {
      return;
    }

    commitSessionSnapshot(
      deriveSessionSnapshot(result.project, {
        persistenceMode: result.storageMode,
        projectRoot: result.projectRoot,
        manifestPath: result.manifestPath,
        indexHealth: result.indexHealth,
        operations: sessionSnapshot.operations,
        savedAt: result.project.manifest.updatedAt,
        saveState: "saved",
        lastSaveError: null
      }),
    );
  } catch (error) {
    if (requestId !== latestPersistenceRequest) {
      return;
    }

    commitSessionSnapshot(
      deriveSessionSnapshot(project, {
        persistenceMode: targetMode,
        projectRoot: targetRoot,
        manifestPath: sessionSnapshot.manifestPath,
        indexHealth: sessionSnapshot.indexHealth,
        operations: sessionSnapshot.operations,
        savedAt: project.manifest.updatedAt,
        saveState: "error",
        lastSaveError:
          error instanceof Error ? error.message : "Project persistence failed."
      }),
    );
  }
}

function commitOperationState(
  updater: (operations: SessionOperationsState) => SessionOperationsState,
  saveState?: ProjectSessionSnapshot["saveState"],
) {
  commitSessionSnapshot(
    deriveSessionSnapshot(sessionSnapshot.project, {
      persistenceMode: sessionSnapshot.persistenceMode,
      projectRoot: sessionSnapshot.projectRoot,
      manifestPath: sessionSnapshot.manifestPath,
      indexHealth: sessionSnapshot.indexHealth,
      operations: updater(sessionSnapshot.operations),
      savedAt: sessionSnapshot.project.manifest.updatedAt,
      saveState: saveState ?? sessionSnapshot.saveState,
      lastSaveError: sessionSnapshot.lastSaveError
    }),
  );
}

function advancePlanModuleStatus(project: CourseProject): CourseProject["moduleStatuses"] {
  const currentPlanStatus = project.moduleStatuses.plan;
  const nextPlanState: CourseProject["moduleStatuses"]["plan"]["state"] =
    currentPlanStatus.state === "ready" ? "ready" : "in-build";

  return {
    ...project.moduleStatuses,
    plan: {
      ...currentPlanStatus,
      state: nextPlanState,
      completion: Math.max(currentPlanStatus.completion, 0.42),
      nextAction: "Refine hole-level planning using the updated design truth."
    }
  };
}

function advanceGameplayModuleStatus(project: CourseProject): CourseProject["moduleStatuses"] {
  const currentGameplayStatus = project.moduleStatuses.gameplay;
  const nextGameplayState: CourseProject["moduleStatuses"]["gameplay"]["state"] =
    currentGameplayStatus.state === "ready" ? "ready" : "in-build";

  return {
    ...project.moduleStatuses,
    gameplay: {
      ...currentGameplayStatus,
      state: nextGameplayState,
      completion: Math.max(currentGameplayStatus.completion, 0.34),
      nextAction: "Close simulator logic gaps across hole order, hazards, previews, and output validation."
    }
  };
}

function advanceBuildModuleStatus(project: CourseProject): CourseProject["moduleStatuses"] {
  const currentBuildStatus = project.moduleStatuses.build;
  const nextBuildState: CourseProject["moduleStatuses"]["build"]["state"] =
    currentBuildStatus.state === "ready" ? "ready" : "in-build";

  return {
    ...project.moduleStatuses,
    build: {
      ...currentBuildStatus,
      state: nextBuildState,
      completion: Math.max(currentBuildStatus.completion, 0.4),
      nextAction:
        "Place gameplay anchors, landmark hierarchy, and support scenery in the scene authoring workspace before deeper terrain/detail passes."
    }
  };
}

function advanceAssetLibraryModuleStatus(project: CourseProject): CourseProject["moduleStatuses"] {
  const currentAssetStatus = project.moduleStatuses["asset-library"];
  const nextAssetState: CourseProject["moduleStatuses"]["asset-library"]["state"] =
    currentAssetStatus.state === "ready" ? "ready" : "in-build";

  return {
    ...project.moduleStatuses,
    "asset-library": {
      ...currentAssetStatus,
      state: nextAssetState,
      completion: Math.max(currentAssetStatus.completion, 0.38),
      nextAction: "Approve imported assets, resolve blocked intake items, and close normalization review gaps."
    }
  };
}

function advanceWorldModuleStatus(project: CourseProject): CourseProject["moduleStatuses"] {
  const currentWorldStatus = project.moduleStatuses.world;
  const nextWorldState: CourseProject["moduleStatuses"]["world"]["state"] =
    currentWorldStatus.state === "ready" ? "ready" : "in-build";

  return {
    ...project.moduleStatuses,
    world: {
      ...currentWorldStatus,
      state: nextWorldState,
      completion: Math.max(currentWorldStatus.completion, 0.36),
      nextAction: "Strengthen district composition, support-space plausibility, and environmental zoning coverage."
    }
  };
}

function advanceAnimateModuleStatus(project: CourseProject): CourseProject["moduleStatuses"] {
  const currentAnimateStatus = project.moduleStatuses.animate;
  const nextAnimateState: CourseProject["moduleStatuses"]["animate"]["state"] =
    currentAnimateStatus.state === "ready" ? "ready" : "in-build";

  return {
    ...project.moduleStatuses,
    animate: {
      ...currentAnimateStatus,
      state: nextAnimateState,
      completion: Math.max(currentAnimateStatus.completion, 0.35),
      nextAction: "Resolve event conflicts, add fallback states, and keep spectacle cues readable."
    }
  };
}

function advancePlayabilityModuleStatus(project: CourseProject): CourseProject["moduleStatuses"] {
  const currentPlayabilityStatus = project.moduleStatuses.playability;
  const nextPlayabilityState: CourseProject["moduleStatuses"]["playability"]["state"] =
    currentPlayabilityStatus.state === "ready" ? "ready" : "in-build";

  return {
    ...project.moduleStatuses,
    playability: {
      ...currentPlayabilityStatus,
      state: nextPlayabilityState,
      completion: Math.max(currentPlayabilityStatus.completion, 0.39),
      nextAction: "Close line-of-play, readability, and spectacle-interference risks before moving forward."
    }
  };
}

function advanceVersioningModuleStatus(project: CourseProject): CourseProject["moduleStatuses"] {
  const currentVersioningStatus = project.moduleStatuses["version-control"];
  const nextVersioningState: CourseProject["moduleStatuses"]["version-control"]["state"] =
    currentVersioningStatus.state === "ready" ? "ready" : "in-build";

  return {
    ...project.moduleStatuses,
    "version-control": {
      ...currentVersioningStatus,
      state: nextVersioningState,
      completion: Math.max(currentVersioningStatus.completion, 0.46),
      nextAction: "Keep snapshots, restore points, and change summaries current before risky edits or release candidate work."
    }
  };
}

export function useProjectSession() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function bootstrapProjectSession() {
  if (bootstrapStarted) {
    return;
  }

  bootstrapStarted = true;

  if (!storedSnapshot?.projectRoot || storedSnapshot.persistenceMode === "seed") {
    return;
  }

  void loadProjectFromStorage(storedSnapshot.projectRoot, storedSnapshot.persistenceMode).then(
    (result) => {
      commitSessionSnapshot(
        deriveSessionSnapshot(result.project, {
          persistenceMode: result.storageMode,
          projectRoot: result.projectRoot,
          manifestPath: result.manifestPath,
          indexHealth: result.indexHealth,
          operations: sessionSnapshot.operations,
          savedAt: result.project.manifest.updatedAt,
          saveState: "saved",
          lastSaveError: null
        }),
      );
    },
    (error) => {
      commitSessionSnapshot(
        deriveSessionSnapshot(sessionSnapshot.project, {
          persistenceMode: sessionSnapshot.persistenceMode,
          projectRoot: sessionSnapshot.projectRoot,
          manifestPath: sessionSnapshot.manifestPath,
          indexHealth: sessionSnapshot.indexHealth,
          operations: sessionSnapshot.operations,
          savedAt: sessionSnapshot.project.manifest.updatedAt,
          saveState: "error",
          lastSaveError:
            error instanceof Error ? error.message : "Stored project bootstrap failed."
        }),
      );
    },
  );
}

export function setActiveProject(project: CourseProject, options?: ProjectSessionUpdate) {
  latestPersistenceRequest = 0;
  commitSessionSnapshot(
    deriveSessionSnapshot(project, {
      ...options,
      operations: options?.operations ?? sessionSnapshot.operations
    }),
  );
}

export function updateProject(
  updater: (project: CourseProject) => CourseProject,
  options?: ProjectSessionUpdate,
) {
  const now = options?.savedAt ?? new Date().toISOString();
  const nextProject = updater({
    ...sessionSnapshot.project,
    manifest: {
      ...sessionSnapshot.project.manifest,
      updatedAt: now
    }
  });
  const nextPersistenceMode = options?.persistenceMode ?? sessionSnapshot.persistenceMode;
  const nextProjectRoot =
    options?.projectRoot === undefined ? sessionSnapshot.projectRoot : options.projectRoot;
  const nextManifestPath =
    options?.manifestPath === undefined ? sessionSnapshot.manifestPath : options.manifestPath;
  const shouldPersist =
    nextPersistenceMode !== "seed" && typeof nextProjectRoot === "string" && nextProjectRoot.length > 0;

  commitSessionSnapshot(
    deriveSessionSnapshot(nextProject, {
      persistenceMode: nextPersistenceMode,
      projectRoot: nextProjectRoot,
      manifestPath: nextManifestPath,
      indexHealth: options?.indexHealth ?? sessionSnapshot.indexHealth,
      operations: options?.operations ?? sessionSnapshot.operations,
      savedAt: now,
      saveState: shouldPersist ? "saving" : options?.saveState,
      lastSaveError: shouldPersist ? null : options?.lastSaveError
    }),
  );

  if (shouldPersist) {
    void persistActiveProject(nextProject);
  }
}

export function updateCourseBible(
  updater: CourseBible | ((courseBible: CourseBible) => CourseBible),
) {
  updateProject((project) => {
    const nextCourseBible = typeof updater === "function" ? updater(project.courseBible) : updater;

    return {
      ...project,
      courseBible: nextCourseBible,
      moduleStatuses: advancePlanModuleStatus(project)
    };
  });
}

export function updateHoles(
  updater: Hole[] | ((holes: Hole[]) => Hole[]),
) {
  updateProject((project) => {
    const nextHoles: CourseProject["holes"] =
      typeof updater === "function" ? updater(project.holes) : updater;
    const planModuleStatuses = advancePlanModuleStatus(project);
    const gameplayModuleStatuses = advanceGameplayModuleStatus(project);
    const synchronizedLogic = synchronizeSimulatorLogicConfig({
      holes: nextHoles,
      teeSets: project.teeSets,
      pinSets: project.pinSets,
      surfaceProfiles: project.surfaceProfiles,
      hazardProfiles: project.hazardProfiles,
      dropZones: project.dropZones,
      previewPaths: project.previewPaths,
      sceneAuthoring: project.sceneAuthoring,
      currentConfig: project.simulatorLogic
    });

    return {
      ...project,
      holes: nextHoles,
      simulatorLogic: synchronizedLogic,
      moduleStatuses: {
        ...planModuleStatuses,
        gameplay: gameplayModuleStatuses.gameplay
      }
    };
  });
}

export function updateSimulatorLogicState(
  updater:
    | SimulatorLogicProjectState
    | ((state: SimulatorLogicProjectState) => SimulatorLogicProjectState),
) {
  updateProject((project) => {
    const currentState: SimulatorLogicProjectState = {
      teeSets: project.teeSets,
      pinSets: project.pinSets,
      surfaceProfiles: project.surfaceProfiles,
      hazardProfiles: project.hazardProfiles,
      dropZones: project.dropZones,
      holePlayProfiles: project.simulatorLogic.holePlayProfiles,
      teeSpatialBindings: project.simulatorLogic.teeSpatialBindings,
      pinSpatialBindings: project.simulatorLogic.pinSpatialBindings,
      hazardSpatialBindings: project.simulatorLogic.hazardSpatialBindings,
      outOfBoundsSpatialBindings: project.simulatorLogic.outOfBoundsSpatialBindings,
      dropZoneSpatialBindings: project.simulatorLogic.dropZoneSpatialBindings,
      previewAnchorBindings: project.simulatorLogic.previewAnchorBindings,
      minimapMetadata: project.simulatorLogic.minimapMetadata,
      flyoverMetadata: project.simulatorLogic.flyoverMetadata,
      outOfBoundsConfigured: project.simulatorLogic.outOfBoundsConfigured,
      exportProfileNotes: project.simulatorLogic.exportProfileNotes
    };
    const nextState =
      typeof updater === "function" ? updater(currentState) : updater;
    const synchronizedLogic = synchronizeSimulatorLogicConfig({
      holes: project.holes,
      teeSets: nextState.teeSets,
      pinSets: nextState.pinSets,
      surfaceProfiles: nextState.surfaceProfiles,
      hazardProfiles: nextState.hazardProfiles,
      dropZones: nextState.dropZones,
      previewPaths: project.previewPaths,
      sceneAuthoring: project.sceneAuthoring,
      currentConfig: {
        ...project.simulatorLogic,
        teeSets: nextState.teeSets,
        pinSets: nextState.pinSets,
        surfaceProfiles: nextState.surfaceProfiles,
        hazardProfiles: nextState.hazardProfiles,
        dropZones: nextState.dropZones,
        holePlayProfiles: nextState.holePlayProfiles,
        teeSpatialBindings: nextState.teeSpatialBindings,
        pinSpatialBindings: nextState.pinSpatialBindings,
        hazardSpatialBindings: nextState.hazardSpatialBindings,
        outOfBoundsSpatialBindings: nextState.outOfBoundsSpatialBindings,
        dropZoneSpatialBindings: nextState.dropZoneSpatialBindings,
        previewAnchorBindings: nextState.previewAnchorBindings,
        minimapMetadata: nextState.minimapMetadata,
        flyoverMetadata: nextState.flyoverMetadata,
        outOfBoundsConfigured: nextState.outOfBoundsConfigured,
        exportProfileNotes: nextState.exportProfileNotes
      }
    });

    return {
      ...project,
      teeSets: nextState.teeSets,
      pinSets: nextState.pinSets,
      surfaceProfiles: nextState.surfaceProfiles,
      hazardProfiles: nextState.hazardProfiles,
      dropZones: nextState.dropZones,
      simulatorLogic: synchronizedLogic,
      moduleStatuses: advanceGameplayModuleStatus(project)
    };
  });
}

export function updateAssets(
  updater: Asset[] | ((assets: Asset[]) => Asset[]),
) {
  updateProject((project) => {
    const nextAssets = typeof updater === "function" ? updater(project.assets) : updater;

    return {
      ...project,
      assets: nextAssets,
      moduleStatuses: advanceAssetLibraryModuleStatus(project)
    };
  });
}

export function updateWorldState(
  updater:
    | WorldProjectState
    | ((state: WorldProjectState) => WorldProjectState),
) {
  updateProject((project) => {
    const currentState: WorldProjectState = {
      districts: project.districts,
      landmarks: project.landmarks,
      supportSpaces: project.supportSpaces,
      environmentZones: project.environmentZones
    };
    const nextState = typeof updater === "function" ? updater(currentState) : updater;

    return {
      ...project,
      districts: nextState.districts,
      landmarks: nextState.landmarks,
      supportSpaces: nextState.supportSpaces,
      environmentZones: nextState.environmentZones,
      moduleStatuses: advanceWorldModuleStatus(project)
    };
  });
}

export function updateSceneAuthoringState(updater: SceneAuthoringProjectState): void;
export function updateSceneAuthoringState(
  updater: (state: SceneAuthoringProjectState) => SceneAuthoringProjectState,
): void;
export function updateSceneAuthoringState(
  updater:
    | SceneAuthoringProjectState
    | ((state: SceneAuthoringProjectState) => SceneAuthoringProjectState),
) {
  updateProject((project) => {
    const nextSceneAuthoring =
      typeof updater === "function" ? updater(project.sceneAuthoring) : updater;

    return {
      ...project,
      sceneAuthoring: nextSceneAuthoring,
      simulatorLogic: synchronizeSimulatorLogicConfig({
        holes: project.holes,
        teeSets: project.teeSets,
        pinSets: project.pinSets,
        surfaceProfiles: project.surfaceProfiles,
        hazardProfiles: project.hazardProfiles,
        dropZones: project.dropZones,
        previewPaths: project.previewPaths,
        sceneAuthoring: nextSceneAuthoring,
        currentConfig: project.simulatorLogic
      }),
      moduleStatuses: advanceBuildModuleStatus(project)
    };
  });
}

export function updatePreviewPaths(
  updater: CourseProject["previewPaths"] | ((previewPaths: CourseProject["previewPaths"]) => CourseProject["previewPaths"]),
) {
  updateProject((project) => ({
    ...project,
    previewPaths: typeof updater === "function" ? updater(project.previewPaths) : updater
  }));
}

export function updateFlyoverPlans(
  updater: CourseProject["flyoverPlans"] | ((flyoverPlans: CourseProject["flyoverPlans"]) => CourseProject["flyoverPlans"]),
) {
  updateProject((project) => ({
    ...project,
    flyoverPlans: typeof updater === "function" ? updater(project.flyoverPlans) : updater
  }));
}

export function updateScreenshotPlans(
  updater:
    | CourseProject["screenshotPlans"]
    | ((screenshotPlans: CourseProject["screenshotPlans"]) => CourseProject["screenshotPlans"]),
) {
  updateProject((project) => ({
    ...project,
    screenshotPlans:
      typeof updater === "function" ? updater(project.screenshotPlans) : updater
  }));
}

export function updateShowcaseSequences(
  updater:
    | CourseProject["showcaseSequences"]
    | ((showcaseSequences: CourseProject["showcaseSequences"]) => CourseProject["showcaseSequences"]),
) {
  updateProject((project) => ({
    ...project,
    showcaseSequences:
      typeof updater === "function" ? updater(project.showcaseSequences) : updater
  }));
}

export function updatePreviewPathReadinessState(previewPathId: string, readinessState: PreviewReadinessState) {
  updatePreviewPaths((previewPaths) => updatePreviewPathReadiness(previewPaths, previewPathId, readinessState));
}

export function updateFlyoverPlanReadinessState(flyoverPlanId: string, readinessState: PreviewReadinessState) {
  updateFlyoverPlans((flyoverPlans) => updateFlyoverPlanReadiness(flyoverPlans, flyoverPlanId, readinessState));
}

export function updateScreenshotPlanStatus(screenshotId: string, status: ScreenshotStatus) {
  updateScreenshotPlans((screenshotPlans) => updateScreenshotStatus(screenshotPlans, screenshotId, status));
}

export function updateShowcaseSequenceReadinessState(
  showcaseSequenceId: string,
  readinessState: PreviewReadinessState,
) {
  updateShowcaseSequences((showcaseSequences) =>
    updateShowcaseSequenceReadiness(showcaseSequences, showcaseSequenceId, readinessState),
  );
}

export function applyCameraPathCorrectionActionForHole(
  holeId: string,
  action: "smooth-transition" | "open-blocked-segment" | "complete-key-view" | "reinforce-playback-support",
) {
  updateProject((project) => {
    const updated = applyCameraPathCorrectionAction({
      previewPaths: project.previewPaths,
      flyoverPlans: project.flyoverPlans,
      screenshotPlans: project.screenshotPlans,
      showcaseSequences: project.showcaseSequences,
      holeId,
      action
    });

    return {
      ...project,
      previewPaths: updated.previewPaths,
      flyoverPlans: updated.flyoverPlans,
      screenshotPlans: updated.screenshotPlans,
      showcaseSequences: updated.showcaseSequences
    };
  });
}

export function applyCameraCaptureExecutionActionForHole(
  holeId: string,
  action: "execute-flyover-pass" | "capture-key-shot" | "approve-capture-set" | "finalize-showcase-pass",
) {
  updateProject((project) => {
    const updated = applyCameraCaptureExecutionAction({
      previewPaths: project.previewPaths,
      flyoverPlans: project.flyoverPlans,
      screenshotPlans: project.screenshotPlans,
      showcaseSequences: project.showcaseSequences,
      holeId,
      action
    });

    return {
      ...project,
      previewPaths: updated.previewPaths,
      flyoverPlans: updated.flyoverPlans,
      screenshotPlans: updated.screenshotPlans,
      showcaseSequences: updated.showcaseSequences
    };
  });
}

export function applyCameraShotSequencingActionForHole(
  holeId: string,
  action: "stabilize-preview-route" | "sequence-flyover-beats" | "sequence-key-view-set" | "sequence-showcase-flow",
) {
  updateProject((project) => {
    const updated = applyCameraShotSequencingAction({
      previewPaths: project.previewPaths,
      flyoverPlans: project.flyoverPlans,
      screenshotPlans: project.screenshotPlans,
      showcaseSequences: project.showcaseSequences,
      holeId,
      action
    });

    return {
      ...project,
      previewPaths: updated.previewPaths,
      flyoverPlans: updated.flyoverPlans,
      screenshotPlans: updated.screenshotPlans,
      showcaseSequences: updated.showcaseSequences
    };
  });
}

export function applyShotOrderApprovalActionForHole(
  holeId: string,
  action: "approve-preview-route-order" | "approve-flyover-order" | "approve-key-view-order" | "approve-showcase-order",
) {
  updateProject((project) => {
    const updated = applyShotOrderApprovalAction({
      previewPaths: project.previewPaths,
      flyoverPlans: project.flyoverPlans,
      screenshotPlans: project.screenshotPlans,
      showcaseSequences: project.showcaseSequences,
      holeId,
      action
    });

    return {
      ...project,
      previewPaths: updated.previewPaths,
      flyoverPlans: updated.flyoverPlans,
      screenshotPlans: updated.screenshotPlans,
      showcaseSequences: updated.showcaseSequences
    };
  });
}

export function applyShotVariantSetActionForHole(
  holeId: string,
  action:
    | "approve-primary-variant-set"
    | "compose-alternate-flyover-variant"
    | "compose-alternate-key-view-variant"
    | "compose-alternate-showcase-variant",
) {
  updateProject((project) => {
    const updated = applyShotVariantSetAction({
      previewPaths: project.previewPaths,
      flyoverPlans: project.flyoverPlans,
      screenshotPlans: project.screenshotPlans,
      showcaseSequences: project.showcaseSequences,
      holeId,
      action
    });

    return {
      ...project,
      previewPaths: updated.previewPaths,
      flyoverPlans: updated.flyoverPlans,
      screenshotPlans: updated.screenshotPlans,
      showcaseSequences: updated.showcaseSequences
    };
  });
}

export function applyShotVariantShippingDecisionActionForHole(
  holeId: string,
  action:
    | "select-primary-shipping-variant"
    | "select-alternate-flyover-shipping-variant"
    | "select-alternate-key-view-shipping-variant"
    | "select-alternate-showcase-shipping-variant",
) {
  updateProject((project) => {
    const updated = applyShotVariantShippingDecisionAction({
      previewPaths: project.previewPaths,
      flyoverPlans: project.flyoverPlans,
      screenshotPlans: project.screenshotPlans,
      showcaseSequences: project.showcaseSequences,
      holeId,
      action,
    });

    return {
      ...project,
      previewPaths: updated.previewPaths,
      flyoverPlans: updated.flyoverPlans,
      screenshotPlans: updated.screenshotPlans,
      showcaseSequences: updated.showcaseSequences,
    };
  });
}

export function updateReleaseRecords(
  updater:
    | CourseProject["releaseRecords"]
    | ((releaseRecords: CourseProject["releaseRecords"]) => CourseProject["releaseRecords"]),
) {
  updateProject((project) => ({
    ...project,
    releaseRecords:
      typeof updater === "function" ? updater(project.releaseRecords) : updater
  }));
}

export function updateEventSequences(
  updater: EventSequence[] | ((eventSequences: EventSequence[]) => EventSequence[]),
) {
  updateProject((project) => {
    const nextEventSequences =
      typeof updater === "function" ? updater(project.eventSequences) : updater;

    return {
      ...project,
      eventSequences: nextEventSequences,
      moduleStatuses: advanceAnimateModuleStatus(project)
    };
  });
}

export function updatePlayabilityState(
  updater:
    | PlayabilityProjectState
    | ((state: PlayabilityProjectState) => PlayabilityProjectState),
) {
  updateProject((project) => {
    const currentState: PlayabilityProjectState = {
      holes: project.holes,
      holePlayProfiles: project.simulatorLogic.holePlayProfiles
    };
    const nextState = typeof updater === "function" ? updater(currentState) : updater;
    const synchronizedLogic = synchronizeSimulatorLogicConfig({
      holes: nextState.holes,
      teeSets: project.teeSets,
      pinSets: project.pinSets,
      surfaceProfiles: project.surfaceProfiles,
      hazardProfiles: project.hazardProfiles,
      dropZones: project.dropZones,
      previewPaths: project.previewPaths,
      sceneAuthoring: project.sceneAuthoring,
      currentConfig: {
        ...project.simulatorLogic,
        holePlayProfiles: nextState.holePlayProfiles
      }
    });
    const gameplayModuleStatuses = advanceGameplayModuleStatus(project);
    const playabilityModuleStatuses = advancePlayabilityModuleStatus(project);

    return {
      ...project,
      holes: nextState.holes,
      simulatorLogic: synchronizedLogic,
      moduleStatuses: {
        ...gameplayModuleStatuses,
        playability: playabilityModuleStatuses.playability
      }
    };
  });
}

export function recordManualSnapshot(label?: string) {
  updateProject((project) => {
    const nextVersioningState = createManualSnapshotUpdate({
      projectId: project.id,
      snapshots: project.snapshots,
      snapshotBundles: project.snapshotBundles,
      changeSummaries: project.changeSummaries,
      versioningState: project.versioningState,
      validationHealthState: project.validationState.healthState,
      snapshotFiles: createSnapshotBundleFiles(project),
      manifestUpdatedAt: project.manifest.updatedAt,
      spatialFingerprint: sessionSnapshot.indexHealth.snapshot?.spatialFingerprint,
      label
    });

    return {
      ...project,
      snapshots: nextVersioningState.snapshots,
      snapshotBundles: nextVersioningState.snapshotBundles,
      changeSummaries: nextVersioningState.changeSummaries,
      versioningState: nextVersioningState.versioningState,
      moduleStatuses: advanceVersioningModuleStatus(project)
    };
  });
}

export function promoteRestorePoint(snapshotId?: string, label?: string) {
  updateProject((project) => {
    const nextVersioningState = createRestorePointPromotionUpdate({
      snapshots: project.snapshots,
      restorePoints: project.restorePoints,
      versioningState: project.versioningState,
      validationHealthState: project.validationState.healthState,
      snapshotBundles: project.snapshotBundles,
      snapshotId,
      label
    });

    if (!nextVersioningState) {
      return project;
    }

    return {
      ...project,
      restorePoints: nextVersioningState.restorePoints,
      versioningState: nextVersioningState.versioningState,
      moduleStatuses: advanceVersioningModuleStatus(project)
    };
  });
}

export async function rebuildSpatialIndex() {
  if (!sessionSnapshot.projectRoot || sessionSnapshot.persistenceMode === "seed") {
    const attemptedAt = new Date().toISOString();

    commitOperationState((operations) => {
      const nextOperations: SessionOperationsState = {
        ...operations,
        rebuild: {
          status: "failed",
          message: "Spatial index rebuild requires a persisted project path.",
          ranAt: attemptedAt
        }
      };

      return appendOperationLog(nextOperations, {
        category: "spatial-index",
        severity: "warning",
        source: "VersionControlCenter",
        message: "Spatial index rebuild was skipped because the project is not persisted yet.",
        createdAt: attemptedAt
      });
    });
    return;
  }

  const startedAt = new Date().toISOString();
  commitOperationState((operations) => ({
    ...operations,
    rebuild: {
      status: "running",
      message: "Refreshing local spatial index and trust metadata.",
      ranAt: startedAt
    }
  }), "saving");

  try {
    const persisted = await persistProjectToStorage(
      sessionSnapshot.project,
      sessionSnapshot.projectRoot,
      sessionSnapshot.persistenceMode,
    );
    const rebuildResult = await rebuildOperationalIndex(
      persisted.project,
      sessionSnapshot.validationReport.issues,
      persisted.projectRoot,
      persisted.storageMode,
    );
    const completedAt = rebuildResult.executedAt;
    const nextOperations = appendOperationLog(
      {
        ...sessionSnapshot.operations,
        rebuild: {
          status: "succeeded",
          message: rebuildResult.indexHealth.summary,
          ranAt: completedAt
        }
      },
      {
        category: "spatial-index",
        severity: rebuildResult.indexHealth.health === "healthy" ? "info" : "warning",
        source: "SpatialIndexService",
        message: `Spatial index rebuild completed. ${rebuildResult.indexHealth.summary}`,
        createdAt: completedAt
      },
    );

    commitSessionSnapshot(
      deriveSessionSnapshot(persisted.project, {
        persistenceMode: persisted.storageMode,
        projectRoot: persisted.projectRoot,
        manifestPath: persisted.manifestPath,
        indexHealth: rebuildResult.indexHealth,
        operations: nextOperations,
        savedAt: persisted.project.manifest.updatedAt,
        saveState: "saved",
        lastSaveError: null
      }),
    );
  } catch (error) {
    const failedAt = new Date().toISOString();
    const nextOperations = appendOperationLog(
      {
        ...sessionSnapshot.operations,
        rebuild: {
          status: "failed",
          message:
            error instanceof Error ? error.message : "Spatial index rebuild failed.",
          ranAt: failedAt
        }
      },
      {
        category: "spatial-index",
        severity: "high",
        source: "SpatialIndexService",
        message:
          error instanceof Error ? error.message : "Spatial index rebuild failed.",
        createdAt: failedAt
      },
    );

    commitSessionSnapshot(
      deriveSessionSnapshot(sessionSnapshot.project, {
        persistenceMode: sessionSnapshot.persistenceMode,
        projectRoot: sessionSnapshot.projectRoot,
        manifestPath: sessionSnapshot.manifestPath,
        indexHealth: sessionSnapshot.indexHealth,
        operations: nextOperations,
        savedAt: sessionSnapshot.project.manifest.updatedAt,
        saveState: "error",
        lastSaveError:
          error instanceof Error ? error.message : "Spatial index rebuild failed."
      }),
    );
  }
}

export async function executeRestorePoint(restorePointId?: string) {
  const startedAt = new Date().toISOString();
  commitOperationState((operations) => ({
    ...operations,
    restore: {
      status: "running",
      message: "Preparing restore execution and capture of the pre-recovery checkpoint.",
      ranAt: startedAt
    }
  }), "saving");

  const restoreUpdate = createRestoreExecutionUpdate({
    projectId: sessionSnapshot.project.id,
    snapshots: sessionSnapshot.project.snapshots,
    snapshotBundles: sessionSnapshot.project.snapshotBundles,
    restorePoints: sessionSnapshot.project.restorePoints,
    changeSummaries: sessionSnapshot.project.changeSummaries,
    versioningState: sessionSnapshot.project.versioningState,
    validationHealthState: sessionSnapshot.project.validationState.healthState,
    currentStateFiles: createSnapshotBundleFiles(sessionSnapshot.project),
    currentManifestUpdatedAt: sessionSnapshot.project.manifest.updatedAt,
    currentSpatialFingerprint:
      sessionSnapshot.indexHealth.snapshot?.spatialFingerprint ?? sessionSnapshot.project.manifest.updatedAt,
    restorePointId,
    createdAt: startedAt
  });

  if (restoreUpdate.status === "failed") {
    const nextOperations = appendOperationLog(
      {
        ...sessionSnapshot.operations,
        restore: {
          status: "failed",
          message: restoreUpdate.message,
          ranAt: startedAt
        }
      },
      {
        category: "recovery",
        severity: "warning",
        source: "RestoreService",
        message: restoreUpdate.message,
        createdAt: startedAt
      },
    );

    commitSessionSnapshot(
      deriveSessionSnapshot(sessionSnapshot.project, {
        persistenceMode: sessionSnapshot.persistenceMode,
        projectRoot: sessionSnapshot.projectRoot,
        manifestPath: sessionSnapshot.manifestPath,
        indexHealth: sessionSnapshot.indexHealth,
        operations: nextOperations,
        savedAt: sessionSnapshot.project.manifest.updatedAt,
        saveState: "saved",
        lastSaveError: null
      }),
    );
    return;
  }

  try {
    const restoreRoot = sessionSnapshot.projectRoot ?? "/recovery-preview";
    const restoredProjectState = enrichDerivedProjectState(
      await hydrateProjectFromBundleFiles(restoreRoot, restoreUpdate.restoredFiles),
    );
    const restoredProject: CourseProject = {
      ...restoredProjectState,
      snapshots: restoreUpdate.snapshots,
      snapshotBundles: restoreUpdate.snapshotBundles,
      restorePoints: restoreUpdate.restorePoints,
      changeSummaries: restoreUpdate.changeSummaries,
      versioningState: restoreUpdate.versioningState,
      moduleStatuses: advanceVersioningModuleStatus(restoredProjectState)
    };
    const persistenceMode =
      sessionSnapshot.persistenceMode === "seed" ? "browser-preview" : sessionSnapshot.persistenceMode;
    const persisted = await persistProjectToStorage(
      restoredProject,
      restoreRoot,
      persistenceMode,
    );
    const rebuildResult = await rebuildOperationalIndex(
      persisted.project,
      evaluateValidationReport(persisted.project).issues,
      persisted.projectRoot,
      persisted.storageMode,
    );
    const completedAt = rebuildResult.executedAt;
    const nextOperations = appendOperationLog(
      {
        ...sessionSnapshot.operations,
        restore: {
          status: "succeeded",
          message: restoreUpdate.message,
          ranAt: completedAt
        }
      },
      {
        category: "recovery",
        severity: "info",
        source: "RestoreService",
        message: `${restoreUpdate.message} Local spatial index was refreshed after restore.`,
        createdAt: completedAt
      },
    );

    commitSessionSnapshot(
      deriveSessionSnapshot(persisted.project, {
        persistenceMode: persisted.storageMode,
        projectRoot: persisted.projectRoot,
        manifestPath: persisted.manifestPath,
        indexHealth: rebuildResult.indexHealth,
        operations: nextOperations,
        savedAt: persisted.project.manifest.updatedAt,
        saveState: "saved",
        lastSaveError: null
      }),
    );
  } catch (error) {
    const failedAt = new Date().toISOString();
    const nextOperations = appendOperationLog(
      {
        ...sessionSnapshot.operations,
        restore: {
          status: "failed",
          message: error instanceof Error ? error.message : "Restore execution failed.",
          ranAt: failedAt
        }
      },
      {
        category: "recovery",
        severity: "high",
        source: "RestoreService",
        message: error instanceof Error ? error.message : "Restore execution failed.",
        createdAt: failedAt
      },
    );

    commitSessionSnapshot(
      deriveSessionSnapshot(sessionSnapshot.project, {
        persistenceMode: sessionSnapshot.persistenceMode,
        projectRoot: sessionSnapshot.projectRoot,
        manifestPath: sessionSnapshot.manifestPath,
        indexHealth: sessionSnapshot.indexHealth,
        operations: nextOperations,
        savedAt: sessionSnapshot.project.manifest.updatedAt,
        saveState: "error",
        lastSaveError:
          error instanceof Error ? error.message : "Restore execution failed."
      }),
    );
  }
}

export async function executePackageBuild(
  profileId: "brother-mode" | "community-safe" | "showcase" = sessionSnapshot.project.performanceState.activeProfileId,
) {
  const releaseRun = await runManagedReleaseAutomation({
    project: sessionSnapshot.project,
    validationIssues: sessionSnapshot.validationReport.issues,
    profileId,
    projectRoot: sessionSnapshot.projectRoot,
    manifestPath: sessionSnapshot.manifestPath
  });
  const { startedAt, bridgeResult, automation } = releaseRun;
  const { execution, previewProductionState, releaseExecution, finalDelivery } = automation;
  const nextOperations = appendOperationLog(
    sessionSnapshot.operations,
    {
      category: "packaging",
      severity:
        execution.build.executionState === "failed"
          ? "high"
          : execution.build.status === "ready"
            ? "info"
            : "warning",
      source: "PackageCenter",
      message: `${execution.build.diagnosticsSummary} ${releaseExecution.nextAction} ${finalDelivery.nextActions[0] ?? ""}`.trim(),
      createdAt: startedAt
    },
  );

  try {
    if (sessionSnapshot.projectRoot && sessionSnapshot.persistenceMode !== "seed") {
      await persistGeneratedArtifacts(
        sessionSnapshot.projectRoot,
        execution.build.buildId,
        execution.generatedFiles.map((file) => ({
          relativePath: file.relativePath,
          content: file.content
        })),
        sessionSnapshot.persistenceMode,
      );
    }

    updateProject((project) => ({
      ...project,
      packageBuilds: [
        {
          ...execution.build,
          notes: `${execution.build.notes} ${bridgeResult.summary}`.trim()
        },
        ...project.packageBuilds
      ],
      releaseRecords: mergeReleaseRecords(project.releaseRecords, execution.releaseRecord),
      packagingState: execution.packagingState,
      previewPaths: previewProductionState.previewPaths,
      flyoverPlans: previewProductionState.flyoverPlans,
      screenshotPlans: previewProductionState.screenshotPlans,
      showcaseSequences: previewProductionState.showcaseSequences,
      moduleStatuses: {
        ...project.moduleStatuses,
        package: {
          ...project.moduleStatuses.package,
          state:
            execution.build.status === "failed"
              ? "in-validation"
              : execution.build.status === "ready"
                ? "ready-for-integration"
                : "in-build",
          completion: Math.max(
            project.moduleStatuses.package.completion,
            execution.build.status === "ready" ? 0.82 : 0.68,
          ),
          blockers:
            execution.build.status === "failed"
              ? [execution.build.failureReason ?? execution.build.diagnosticsSummary]
              : [],
          nextAction:
            releaseExecution.remediationActions[0]?.label ??
            (execution.build.status === "failed"
              ? execution.build.diagnosticsSummary
              : finalDelivery.nextActions[0] ?? "Review generated artifacts and then move to Publish Center.")
        },
        preview: {
          ...project.moduleStatuses.preview,
          state:
            execution.build.executionState === "failed"
              ? "in-validation"
              : execution.build.status === "ready"
                ? "ready-for-integration"
                : "in-build",
          completion: Math.max(
            project.moduleStatuses.preview.completion,
            execution.build.executionState === "failed" ? 0.62 : 0.76,
          ),
          blockers:
            execution.build.executionState === "failed"
              ? ["Preview outputs were not fully synchronized with the latest release run."]
              : [],
          nextAction:
            releaseExecution.remediationActions.find((action) => action.ownerModule === "preview")?.label ??
            (execution.build.executionState === "failed"
              ? "Resolve preview output blockers and rerun the release candidate."
              : finalDelivery.nextActions.find((action) => action.toLowerCase().includes("preview")) ??
                "Review generated preview outputs, approved media, and showcase linkage.")
        },
        publish: {
          ...project.moduleStatuses.publish,
          state:
            execution.build.executionState === "failed"
              ? "in-build"
              : execution.build.status === "ready"
                ? "ready-for-integration"
                : "in-validation",
          completion: Math.max(
            project.moduleStatuses.publish.completion,
            execution.build.executionState === "failed" ? 0.58 : 0.74,
          ),
          blockers:
            execution.build.executionState === "failed"
              ? [execution.build.failureReason ?? execution.build.diagnosticsSummary]
              : [],
          nextAction:
            releaseExecution.remediationActions.find((action) => action.ownerModule === "publish")?.label ??
            (execution.build.executionState === "failed"
              ? "Resolve packaging and native/runtime issues before relying on Publish."
              : finalDelivery.nextActions.find((action) => action.toLowerCase().includes("delivery")) ??
                "Review release draft linkage, credits, and preview dependencies.")
        }
      }
    }), {
      operations: nextOperations
    });
  } catch (error) {
    updateProject((project) => ({
      ...project,
      packageBuilds: [
        {
          ...execution.build,
          status: "failed",
          executionState: "failed",
          failureReason:
            error instanceof Error ? error.message : "Generated artifact persistence failed.",
          diagnosticsSummary:
            error instanceof Error ? error.message : "Generated artifact persistence failed.",
          executionLogs: [
            ...execution.build.executionLogs,
            {
              logId: `build-log-artifact-persist-${startedAt.replace(/[^0-9]/g, "")}`,
              phase: "artifact-persist",
              level: "error",
              message:
                error instanceof Error ? error.message : "Generated artifact persistence failed.",
              createdAt: startedAt
            }
          ]
        },
        ...project.packageBuilds
      ],
      packagingState: {
        latestBuildId: execution.build.buildId,
        readiness: "blocked",
        releaseCandidateReady: false
      }
    }), {
      operations: appendOperationLog(nextOperations, {
        category: "packaging",
        severity: "high",
        source: "PackageCenter",
        message:
          error instanceof Error ? error.message : "Package build execution failed.",
        createdAt: startedAt
      }),
      saveState: "error",
      lastSaveError:
        error instanceof Error ? error.message : "Package build execution failed."
    });
  }
}

export function createReleaseDraft(channel: ReleaseChannel = "community") {
  const latestBuild = sessionSnapshot.project.packageBuilds[0];
  if (!latestBuild) {
    return;
  }

  const existingReleaseRecord = latestBuild.releaseRecordRef
    ? sessionSnapshot.project.releaseRecords.find(
        (release) => release.releaseId === latestBuild.releaseRecordRef,
      ) ?? null
    : sessionSnapshot.project.releaseRecords.find(
        (release) => release.packageBuildRef === latestBuild.buildId,
      ) ?? null;

  const releaseRecord =
    existingReleaseRecord ??
    createReleaseRecordFromBuild({
      project: sessionSnapshot.project,
      build: latestBuild,
      channel
    });

  updateProject((project) => ({
    ...project,
    releaseRecords: mergeReleaseRecords(project.releaseRecords, releaseRecord),
    packageBuilds: project.packageBuilds.map((build) =>
      build.buildId === latestBuild.buildId
        ? {
            ...build,
            releaseRecordRef: releaseRecord.releaseId
          }
        : build,
    ),
    moduleStatuses: {
      ...project.moduleStatuses,
      publish: {
        ...project.moduleStatuses.publish,
        state: latestBuild.status === "ready" ? "ready-for-integration" : "in-build",
        completion: Math.max(project.moduleStatuses.publish.completion, latestBuild.status === "ready" ? 0.72 : 0.58),
        blockers: latestBuild.status === "failed" ? [latestBuild.diagnosticsSummary] : [],
        nextAction:
          latestBuild.status === "ready"
            ? "Review release draft metadata, assets, and preview dependencies before publish."
            : "Resolve package and preview blockers before treating this draft as release-candidate quality."
      }
    }
  }));
}

export function retryLatestPackageBuild() {
  const latestBuild = sessionSnapshot.project.packageBuilds[0];

  if (!latestBuild) {
    return Promise.resolve();
  }

  return executePackageBuild(latestBuild.profileId);
}

export function getPrimaryActionForModule(moduleKey: ModuleKey) {
  const actions: Record<ModuleKey, { label: string; route: string }> = {
    home: { label: "Create New Project", route: "/create" },
    create: { label: "Continue to Plan", route: "/plan" },
    plan: { label: "Continue to Build", route: "/build" },
    build: { label: "Continue to Gameplay Logic", route: "/gameplay" },
    gameplay: { label: "Review Asset Library", route: "/asset-library" },
    "asset-library": { label: "Open World Builder", route: "/world" },
    world: { label: "Open Animation & Events", route: "/animate" },
    animate: { label: "Run Playability Review", route: "/playability" },
    playability: { label: "Open Performance Review", route: "/performance" },
    performance: { label: "Prepare Preview Studio", route: "/preview" },
    preview: { label: "Build Package Candidate", route: "/package" },
    package: { label: "Prepare Publish Release", route: "/publish" },
    publish: { label: "Review Version History", route: "/version-control" },
    "version-control": { label: "Open Agent Command Center", route: "/agent-command" },
    "agent-command": { label: "Open Settings", route: "/settings" },
    settings: { label: "Return Home", route: "/" }
  };

  return actions[moduleKey];
}

export function getObjectContextLabel(moduleKey: ModuleKey) {
  const contexts: Record<ModuleKey, string> = {
    home: "Recent Projects",
    create: "Project Wizard",
    plan: "Course Bible / Hole Planner",
    build: "Scene Authoring Studio",
    gameplay: "Simulator Logic Dashboard",
    "asset-library": "Imported Asset Browser",
    world: "District Map",
    animate: "Event Registry",
    playability: "Playability Review",
    performance: "Profile Risk Review",
    preview: "Preview Registry",
    package: "Release Candidate Prep",
    publish: "Release Metadata",
    "version-control": "Snapshots & Restore Points",
    "agent-command": "Agent Operations Board",
    settings: "System Preferences"
  };

  return contexts[moduleKey];
}
