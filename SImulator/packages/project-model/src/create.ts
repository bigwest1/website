import { z } from "zod";

import {
  displayNameSchema,
  isoDateStringSchema,
  projectModeSchema,
  slugSchema,
  validationProfileSchema,
  versionStringSchema
} from "@course-creator-os/core-types";
import { createCourseBibleDraft, releaseIntentSchema } from "@course-creator-os/course-bible";
import { createHoleDraft } from "@course-creator-os/hole-planner";
import { performanceProfileIdSchema } from "@course-creator-os/performance";
import { type CoursePerformanceSnapshot } from "@course-creator-os/performance";
import {
  type FlyoverPlan,
  type PreviewPath,
  type ScreenshotPlan,
  type ShowcaseSequence
} from "@course-creator-os/preview";
import {
  createDropZoneArea,
  createFairwayCorridor,
  createGreenZone,
  createOutOfBoundsZone,
  createPlacementConstraint,
  createPlacementLayer,
  createPlayRouteEnvelope,
  createRoutingNode,
  createRoutingPath,
  createRoutingSegment,
  createSceneAuthoringState,
  createSceneCollection,
  createSceneObject,
  createTerrainModifier,
  createTerrainProfile,
  createTerrainRegion,
  createTerrainSurface,
  createTeeZone,
  createVector3,
  createVisibilityCorridor
} from "@course-creator-os/scene-authoring";
import { createSimulatorLogicConfig, type DropZone, type HazardProfile, type PinSet, type SurfaceProfile, type TeeSet } from "@course-creator-os/sim-logic";
import {
  type ChangeSummary,
  type RestorePoint,
  type Snapshot,
  type SnapshotBundle
} from "@course-creator-os/versioning";
import {
  createDistrictRecord,
  createEnvironmentZoneRecord,
  createSupportSpaceRecord
} from "@course-creator-os/world-system";

import { moduleDefinitions, type ModuleKey } from "./modules";
import {
  courseTypeSchema,
  type CourseProject,
  type ModuleStatus,
  projectManifestSchema,
  type ProjectManifest
} from "./project";

export const projectCreationIntentSchema = z.object({
  name: displayNameSchema,
  slug: slugSchema.optional(),
  projectMode: projectModeSchema,
  holeCount: z.number().min(1).max(18),
  primaryTheme: displayNameSchema,
  courseType: courseTypeSchema,
  realismTarget: z.number().min(0).max(100),
  spectacleTarget: z.number().min(0).max(100),
  targetHardwareProfile: z.string().min(1),
  activeValidationProfile: validationProfileSchema,
  activeOutputProfiles: z.array(performanceProfileIdSchema).min(1),
  activeStylePack: z.string().nullable(),
  version: versionStringSchema.default("0.1.0"),
  createdAt: isoDateStringSchema.optional(),
  updatedAt: isoDateStringSchema.optional(),
  releaseIntent: releaseIntentSchema.optional()
});

export type ProjectCreationIntent = z.output<typeof projectCreationIntentSchema>;
export type ProjectCreationIntentInput = z.input<typeof projectCreationIntentSchema>;

function slugifyProjectName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function deriveProjectId(slug: string) {
  return `cco-${slug}`;
}

function deriveReleaseIntent(intent: ProjectCreationIntent) {
  if (intent.releaseIntent) {
    return intent.releaseIntent;
  }

  return intent.projectMode === "public-safe" ? "community" : "private";
}

function createInitialModuleStatuses(): Record<ModuleKey, ModuleStatus> {
  const statusByModule: Partial<Record<ModuleKey, ModuleStatus>> = {};

  for (const definition of moduleDefinitions) {
    let state: ModuleStatus["state"] = "not-started";
    let completion = 0;

    if (definition.key === "home") {
      state = "ready";
      completion = 1;
    } else if (definition.key === "create") {
      state = "ready";
      completion = 1;
    } else if (definition.key === "plan") {
      state = "defined";
      completion = 0.16;
    } else if (definition.key === "build" || definition.key === "gameplay") {
      state = "defined";
      completion = 0.08;
    }

    statusByModule[definition.key] = {
      state,
      completion,
      blockers: [],
      nextAction: definition.nextMove
    };
  }

  return statusByModule as Record<ModuleKey, ModuleStatus>;
}

function createInitialTeeSets(holeCount: number): TeeSet[] {
  const enabledHoleIds = Array.from({ length: holeCount }, (_, index) => `hole-${index + 1}`);

  return [
    {
      teeSetId: "tee-member",
      name: "Member",
      color: "blue",
      totalYardage: holeCount * 360,
      defaultTee: true,
      holeYardages: Object.fromEntries(enabledHoleIds.map((holeId, index) => [holeId, 335 + index * 4]))
    }
  ];
}

function createInitialPinSets(holeCount: number): PinSet[] {
  return [
    {
      pinSetId: "pins-daily",
      name: "Daily",
      difficulty: "standard",
      enabledHoleIds: Array.from({ length: holeCount }, (_, index) => `hole-${index + 1}`)
    }
  ];
}

function createInitialSurfaceProfiles(): SurfaceProfile[] {
  return [
    {
      surfaceId: "surface-fairway",
      name: "Fairway",
      type: "fairway",
      physicsNote: "Baseline fairway surface profile.",
      playable: true
    },
    {
      surfaceId: "surface-green",
      name: "Green",
      type: "green",
      physicsNote: "Readable green speeds for early project setup.",
      playable: true
    },
    {
      surfaceId: "surface-rough",
      name: "Rough",
      type: "rough",
      physicsNote: "General rough penalty profile.",
      playable: true
    },
    {
      surfaceId: "surface-bunker",
      name: "Bunker",
      type: "bunker",
      physicsNote: "Default bunker surface profile.",
      playable: true
    }
  ];
}

function createInitialHoles(holeCount: number): CourseProject["holes"] {
  return Array.from({ length: holeCount }, (_, index) =>
    createHoleDraft({
      number: index + 1,
      teeSetRefs: ["tee-member"],
      pinSetRefs: ["pins-daily"]
    }),
  );
}

function createInitialPerformanceSnapshot(): CoursePerformanceSnapshot {
  return {
    geometryEstimate: 12,
    textureMemoryEstimateGb: 1.2,
    materialComplexity: 18,
    animationComplexity: 8,
    sceneDensity: 12,
    visibilityComplexity: 16
  };
}

function createInitialSceneAuthoringState(
  projectName: string,
  holes: CourseProject["holes"],
  teeSets: TeeSet[],
) {
  const primaryHole = holes[0];
  const primaryHoleId = primaryHole?.holeId ?? "hole-1";
  const primaryTeeSetId = teeSets[0]?.teeSetId ?? "tee-member";
  const teeNodeId = `routing-node-${primaryHoleId}-tee`;
  const landingNodeId = `routing-node-${primaryHoleId}-landing`;
  const greenNodeId = `routing-node-${primaryHoleId}-green`;
  const previewNodeId = `routing-node-${primaryHoleId}-preview`;
  const routingPathId = `routing-path-${primaryHoleId}`;
  const fairwayCorridorId = `fairway-corridor-${primaryHoleId}`;
  const greenZoneId = `green-zone-${primaryHoleId}`;
  const teeZoneId = `tee-zone-${primaryHoleId}-${primaryTeeSetId}`;
  const visibilityCorridorId = `visibility-corridor-${primaryHoleId}`;
  const playRouteEnvelopeId = `play-route-envelope-${primaryHoleId}`;

  return createSceneAuthoringState({
    activeCollectionId: "collection-primary-course",
    viewportState: {
      rendererMode: "hybrid-preview",
      backendStatus: "scaffolded",
      projectionMode: "top-down",
      authoringMode: "placement",
      activeHoleId: primaryHoleId,
      selectedRoutingPathId: routingPathId,
      selectedTerrainRegionId: `terrain-region-${primaryHoleId}-fairway`,
      densityMode: "hole",
      camera: {
        position: createVector3({ x: 0, y: 74, z: 0 }),
        target: createVector3({ x: 0, y: 0, z: 0 }),
        zoom: 1.1,
        pitchDegrees: 72,
        yawDegrees: 0
      },
      interactionPipeline: {
        activeHandle: null,
        state: "idle",
        draggingEntityId: null,
        draggingEntityType: null,
        pendingActionLabel: null
      },
      showGrid: true,
      showCompass: true
    },
    sceneCollections: [
      createSceneCollection({
        collectionId: "collection-primary-course",
        name: "Primary Course Scene",
        description: `Main placement collection for ${projectName}.`,
        defaultLayerId: "layer-gameplay",
        routeSummary: "Start with gameplay anchors, landmark framing, and support-space massing.",
        tags: ["core", "course"]
      })
    ],
    placementLayers: [
      createPlacementLayer({
        layerId: "layer-gameplay",
        name: "Gameplay Anchors",
        description: "Tees, greens, hazard markers, and core simulator-critical scene objects.",
        colorToken: "accent.primary",
        filterCategories: ["gameplay-course-object"]
      }),
      createPlacementLayer({
        layerId: "layer-landmarks",
        name: "Landmarks",
        description: "Premium focal points and route-framing spectacle elements.",
        colorToken: "state.info",
        filterCategories: ["landmark", "animated-set-piece"]
      }),
      createPlacementLayer({
        layerId: "layer-structures",
        name: "Structures & Support",
        description: "Buildings, bridges, support-space envelopes, and large support scenery.",
        colorToken: "state.warning",
        filterCategories: ["structure", "supporting-scenery"]
      }),
      createPlacementLayer({
        layerId: "layer-vegetation",
        name: "Vegetation & Props",
        description: "Vegetation, props, and filler placement with performance awareness.",
        colorToken: "state.success",
        filterCategories: ["vegetation", "prop"]
      })
    ],
    terrainSurfaces: [
      createTerrainSurface({
        terrainSurfaceId: "terrain-surface-fairway",
        name: "Fairway Surface",
        gameplayPurpose: "fairway",
        materialFamily: "managed-grass",
        visualRole: "Primary fairway play surface."
      }),
      createTerrainSurface({
        terrainSurfaceId: "terrain-surface-green",
        name: "Green Surface",
        gameplayPurpose: "green-complex",
        materialFamily: "tight-green",
        visualRole: "Primary green target surface."
      }),
      createTerrainSurface({
        terrainSurfaceId: "terrain-surface-rough",
        name: "Rough Surface",
        gameplayPurpose: "rough",
        materialFamily: "secondary-rough",
        visualRole: "Playable but punitive rough perimeter."
      })
    ],
    terrainProfiles: [
      createTerrainProfile({
        terrainProfileId: "terrain-profile-fairway",
        name: "Fairway Profile",
        description: "Balanced fairway shaping for early routing validation.",
        primarySurfaceId: "terrain-surface-fairway",
        slopeToleranceDegrees: 11,
        roughness: 0.14,
        drainageBias: 0.52,
        themeTags: ["baseline", "course"]
      }),
      createTerrainProfile({
        terrainProfileId: "terrain-profile-green",
        name: "Green Complex Profile",
        description: "Green surface shaping with clear approach legibility.",
        primarySurfaceId: "terrain-surface-green",
        slopeToleranceDegrees: 6,
        roughness: 0.08,
        drainageBias: 0.48,
        themeTags: ["target", "approach"]
      })
    ],
    terrainRegions: [
      createTerrainRegion({
        terrainRegionId: `terrain-region-${primaryHoleId}-fairway`,
        collectionId: "collection-primary-course",
        holeId: primaryHoleId,
        name: "Opening Fairway Region",
        gameplayPurpose: "fairway",
        terrainProfileId: "terrain-profile-fairway",
        boundary: [
          { x: -18, y: 0, z: 28 },
          { x: 18, y: 0, z: 20 },
          { x: 12, y: 0, z: -8 },
          { x: -14, y: 0, z: -14 }
        ],
        elevationMin: -1,
        elevationMax: 3,
        linkedZoneIds: [fairwayCorridorId, teeZoneId, greenZoneId],
        linkedSceneObjectIds: ["scene-hole-1-tee-complex"]
      }),
      createTerrainRegion({
        terrainRegionId: `terrain-region-${primaryHoleId}-green`,
        collectionId: "collection-primary-course",
        holeId: primaryHoleId,
        name: "Opening Green Complex",
        gameplayPurpose: "green-complex",
        terrainProfileId: "terrain-profile-green",
        boundary: [
          { x: -6, y: 0, z: -18 },
          { x: 6, y: 0, z: -18 },
          { x: 8, y: 0, z: -28 },
          { x: -8, y: 0, z: -28 }
        ],
        elevationMin: 0,
        elevationMax: 2,
        linkedZoneIds: [greenZoneId]
      })
    ],
    terrainModifiers: [
      createTerrainModifier({
        terrainModifierId: `terrain-modifier-${primaryHoleId}-green-crown`,
        holeId: primaryHoleId,
        regionId: `terrain-region-${primaryHoleId}-green`,
        kind: "smooth",
        strength: 0.44,
        falloffMeters: 7,
        targetHeight: 1.2,
        bounds: [
          { x: -8, y: 0, z: -18 },
          { x: 8, y: 0, z: -18 },
          { x: 8, y: 0, z: -30 },
          { x: -8, y: 0, z: -30 }
        ],
        note: "Keeps the first green target clear and premium."
      })
    ],
    routingNodes: [
      createRoutingNode({
        routingNodeId: teeNodeId,
        holeId: primaryHoleId,
        kind: "tee",
        label: "Opening Tee",
        position: { x: -10, y: 1, z: 24 },
        linkedSceneObjectId: "scene-hole-1-tee-complex",
        linkedZoneId: teeZoneId
      }),
      createRoutingNode({
        routingNodeId: landingNodeId,
        holeId: primaryHoleId,
        kind: "landing-zone",
        label: "Primary Landing",
        position: { x: 4, y: 0, z: 2 },
        linkedZoneId: fairwayCorridorId
      }),
      createRoutingNode({
        routingNodeId: greenNodeId,
        holeId: primaryHoleId,
        kind: "green-center",
        label: "Green Center",
        position: { x: 0, y: 1, z: -22 },
        linkedZoneId: greenZoneId
      }),
      createRoutingNode({
        routingNodeId: previewNodeId,
        holeId: primaryHoleId,
        kind: "preview-anchor",
        label: "Preview Anchor",
        position: { x: 2, y: 8, z: 12 },
        linkedSceneObjectId: "scene-primary-landmark"
      })
    ],
    routingSegments: [
      createRoutingSegment({
        routingSegmentId: `routing-segment-${primaryHoleId}-tee-to-landing`,
        holeId: primaryHoleId,
        fromNodeId: teeNodeId,
        toNodeId: landingNodeId,
        kind: "primary-shot",
        controlLine: [
          { x: -10, y: 1, z: 24 },
          { x: -4, y: 1, z: 14 },
          { x: 4, y: 0, z: 2 }
        ],
        targetWidthMeters: 30,
        visibilityCorridorId
      }),
      createRoutingSegment({
        routingSegmentId: `routing-segment-${primaryHoleId}-landing-to-green`,
        holeId: primaryHoleId,
        fromNodeId: landingNodeId,
        toNodeId: greenNodeId,
        kind: "approach",
        controlLine: [
          { x: 4, y: 0, z: 2 },
          { x: 3, y: 0, z: -10 },
          { x: 0, y: 1, z: -22 }
        ],
        targetWidthMeters: 22,
        visibilityCorridorId
      })
    ],
    routingPaths: [
      createRoutingPath({
        routingPathId,
        holeId: primaryHoleId,
        name: "Opening Hole Route",
        teeNodeId,
        greenNodeId,
        nodeIds: [teeNodeId, landingNodeId, greenNodeId],
        segmentIds: [
          `routing-segment-${primaryHoleId}-tee-to-landing`,
          `routing-segment-${primaryHoleId}-landing-to-green`
        ],
        routeStatus: "connected",
        note: "Baseline connected routing path for the first hole."
      })
    ],
    fairwayCorridors: [
      createFairwayCorridor({
        fairwayCorridorId,
        holeId: primaryHoleId,
        routingPathId,
        centerline: [
          { x: -10, y: 1, z: 24 },
          { x: -2, y: 1, z: 12 },
          { x: 3, y: 0, z: 0 }
        ],
        averageWidthMeters: 28,
        landingZoneCount: 1,
        note: "Opening fairway corridor."
      })
    ],
    greenZones: [
      createGreenZone({
        greenZoneId,
        holeId: primaryHoleId,
        boundary: [
          { x: -5, y: 0, z: -18 },
          { x: 5, y: 0, z: -18 },
          { x: 6, y: 0, z: -27 },
          { x: -6, y: 0, z: -27 }
        ],
        targetPinCapacity: 3,
        approachNodeId: greenNodeId,
        note: "Primary green target."
      })
    ],
    teeZones: [
      createTeeZone({
        teeZoneId,
        holeId: primaryHoleId,
        boundary: [
          { x: -14, y: 0, z: 20 },
          { x: -6, y: 0, z: 20 },
          { x: -6, y: 0, z: 28 },
          { x: -14, y: 0, z: 28 }
        ],
        teeSetRefs: [primaryTeeSetId],
        facingDirectionDegrees: 160,
        note: "Opening tee deck."
      })
    ],
    hazardZones: [],
    outOfBoundsZones: [
      createOutOfBoundsZone({
        outOfBoundsZoneId: `out-of-bounds-${primaryHoleId}-left`,
        holeId: primaryHoleId,
        sideLabel: "Left perimeter",
        boundary: [
          { x: -24, y: 0, z: 30 },
          { x: -20, y: 0, z: 30 },
          { x: -18, y: 0, z: -18 },
          { x: -24, y: 0, z: -18 }
        ],
        note: "Opening hole left-side safety boundary."
      })
    ],
    dropZoneAreas: [],
    visibilityCorridors: [
      createVisibilityCorridor({
        visibilityCorridorId,
        holeId: primaryHoleId,
        fromNodeId: teeNodeId,
        toNodeId: greenNodeId,
        corridorLine: [
          { x: -10, y: 1, z: 24 },
          { x: -1, y: 2, z: 8 },
          { x: 0, y: 1, z: -22 }
        ],
        minimumWidthMeters: 18,
        note: "Keeps the opening line readable from tee to green."
      })
    ],
    playRouteEnvelopes: [
      createPlayRouteEnvelope({
        playRouteEnvelopeId,
        holeId: primaryHoleId,
        routingPathId,
        boundary: [
          { x: -18, y: 0, z: 28 },
          { x: 16, y: 0, z: 18 },
          { x: 10, y: 0, z: -30 },
          { x: -12, y: 0, z: -28 }
        ],
        note: "Opening playable hole envelope."
      })
    ],
    sceneObjects: [
      createSceneObject({
        sceneObjectId: "scene-hole-1-tee-complex",
        collectionId: "collection-primary-course",
        name: "Hole 1 Tee Complex",
        category: "gameplay-course-object",
        objectType: "tee-complex",
        placementLayerId: "layer-gameplay",
        binding: {
          bindingType: "tee",
          entityId: primaryHoleId,
          exportRole: "gameplay-critical"
        },
        transform: {
          position: {
            x: -10,
            y: 1,
            z: 24
          }
        },
        placementConstraints: [
          createPlacementConstraint({
            constraintId: "constraint-hole-1-tee-upright",
            kind: "keep-upright",
            note: "Keep the tee complex upright for readable simulator framing."
          })
        ]
      }),
      createSceneObject({
        sceneObjectId: "scene-primary-landmark",
        collectionId: "collection-primary-course",
        name: "Primary Landmark Anchor",
        category: "landmark",
        objectType: "signature-landmark",
        placementLayerId: "layer-landmarks",
        transform: {
          position: {
            x: 18,
            y: 6,
            z: -12
          }
        }
      }),
      createSceneObject({
        sceneObjectId: "scene-support-operations",
        collectionId: "collection-primary-course",
        name: "Operations Support Envelope",
        category: "supporting-scenery",
        objectType: "support-envelope",
        placementLayerId: "layer-structures",
        transform: {
          position: {
            x: -14,
            y: 0,
            z: 16
          }
        }
      }),
      createSceneObject({
        sceneObjectId: "scene-vegetation-cluster-a",
        collectionId: "collection-primary-course",
        name: "Vegetation Cluster A",
        category: "vegetation",
        objectType: "tree-cluster",
        placementLayerId: "layer-vegetation",
        transform: {
          position: {
            x: 10,
            y: 0,
            z: 14
          }
        },
        placementConstraints: [
          createPlacementConstraint({
            constraintId: "constraint-vegetation-surface",
            kind: "terrain-surface",
            note: "Vegetation should remain terrain-conforming."
          })
        ]
      })
    ],
    parentRelationships: [
      {
        relationshipId: "relationship-scene-hole-1-tee-complex",
        childId: "scene-hole-1-tee-complex",
        childType: "object",
        parentId: null,
        parentType: "collection"
      },
      {
        relationshipId: "relationship-scene-primary-landmark",
        childId: "scene-primary-landmark",
        childType: "object",
        parentId: null,
        parentType: "collection"
      },
      {
        relationshipId: "relationship-scene-support-operations",
        childId: "scene-support-operations",
        childType: "object",
        parentId: null,
        parentType: "collection"
      },
      {
        relationshipId: "relationship-scene-vegetation-cluster-a",
        childId: "scene-vegetation-cluster-a",
        childType: "object",
        parentId: null,
        parentType: "collection"
      }
    ]
  });
}

export function createProjectManifest(intentInput: ProjectCreationIntentInput): ProjectManifest {
  const intent = projectCreationIntentSchema.parse(intentInput);
  const now = intent.updatedAt ?? intent.createdAt ?? new Date().toISOString();
  const slug = intent.slug ?? slugifyProjectName(intent.name);
  const manifest = {
    id: deriveProjectId(slug),
    name: intent.name,
    slug,
    projectMode: intent.projectMode,
    createdAt: intent.createdAt ?? now,
    updatedAt: intent.updatedAt ?? now,
    version: intent.version,
    holeCount: intent.holeCount,
    activeOutputProfiles: intent.activeOutputProfiles,
    primaryTheme: intent.primaryTheme,
    realismTarget: intent.realismTarget,
    spectacleTarget: intent.spectacleTarget,
    targetHardwareProfile: intent.targetHardwareProfile,
    activeStylePack: intent.activeStylePack,
    activeValidationProfile: intent.activeValidationProfile,
    courseType: intent.courseType
  };

  return projectManifestSchema.parse(manifest);
}

export function createProject(intentInput: ProjectCreationIntentInput): CourseProject {
  const manifest = createProjectManifest(intentInput);
  const intent = projectCreationIntentSchema.parse(intentInput);
  const holes = createInitialHoles(manifest.holeCount);
  const teeSets = createInitialTeeSets(manifest.holeCount);
  const pinSets = createInitialPinSets(manifest.holeCount);
  const surfaceProfiles = createInitialSurfaceProfiles();
  const hazardProfiles: HazardProfile[] = [];
  const dropZones: DropZone[] = [];
  const previewPaths: PreviewPath[] = [];
  const flyoverPlans: FlyoverPlan[] = [];
  const screenshotPlans: ScreenshotPlan[] = [];
  const showcaseSequences: ShowcaseSequence[] = [];
  const sceneAuthoring = createInitialSceneAuthoringState(manifest.name, holes, teeSets);
  const releaseIntent = deriveReleaseIntent(intent);
  const initialSnapshotId = `snapshot-${manifest.slug}-initial`;
  const initialChangeSummaryId = `change-${manifest.slug}-initial`;
  const initialRestorePointId = `restore-${manifest.slug}-initial`;
  const snapshots: Snapshot[] = [
    {
      snapshotId: initialSnapshotId,
      projectId: manifest.id,
      label: "Initial Project Creation",
      createdAt: manifest.createdAt,
      source: "manual",
      posture: "stable",
      summary: "Project initialized with base planning, simulator, and world scaffolds.",
      changeSummary: "Created project structure and starter manifest.",
      changeSummaryRefs: [initialChangeSummaryId],
      bundleAvailable: false
    }
  ];
  const snapshotBundles: SnapshotBundle[] = [];
  const changeSummaries: ChangeSummary[] = [
    {
      changeSummaryId: initialChangeSummaryId,
      title: "Project scaffold created",
      summary: "Initialized the repo-ready course project structure, manifest, and starter planning state.",
      createdAt: manifest.createdAt,
      impact: "moderate",
      moduleRefs: ["create", "plan", "gameplay"],
      relatedSnapshotId: initialSnapshotId,
      note: "This is the first safe checkpoint for the project."
    }
  ];
  const restorePoints: RestorePoint[] = [
    {
      restorePointId: initialRestorePointId,
      label: "Initial Safe Return",
      createdAt: manifest.createdAt,
      sourceSnapshotId: initialSnapshotId,
      state: "recommended",
      reason: "safe-edit-return",
      summary: "Return here if early planning or worldbuilding experiments need to be rolled back cleanly.",
      riskNotes: [],
      changeSummaryRefs: [initialChangeSummaryId]
    }
  ];

  return {
    id: manifest.id,
    manifest,
    moduleStatuses: createInitialModuleStatuses(),
    courseBible: createCourseBibleDraft({
      projectName: manifest.name,
      primaryTheme: manifest.primaryTheme,
      releaseIntent
    }),
    holes,
    teeSets,
    pinSets,
    surfaceProfiles,
    hazardProfiles,
    dropZones,
    simulatorLogic: createSimulatorLogicConfig({
      holes,
      teeSets,
      pinSets,
      surfaceProfiles,
      hazardProfiles,
      dropZones,
      previewPaths,
      sceneAuthoring,
      outOfBoundsConfigured: false,
      exportProfileNotes: ["Project created. Simulator metadata still needs full authoring review."]
    }),
    districts: [
      createDistrictRecord({
        districtId: "district-core",
        name: "Core Course Grounds",
        districtType: "primary",
        theme: manifest.primaryTheme,
        visualRole: "initial project-wide grounding district",
        mood: "to be defined",
        supportRealismNotes: ["Support spaces should grow from the creator workflow, not from filler content."]
      })
    ],
    landmarks: [],
    supportSpaces: [
      createSupportSpaceRecord({
        supportSpaceId: "support-space-core-operations",
        districtRef: "district-core",
        name: "Core Operations Spine",
        spaceType: "operations",
        roleSummary: "First-pass logistics and maintenance support layer for the course.",
        playerFacing: false
      })
    ],
    environmentZones: [
      createEnvironmentZoneRecord({
        environmentZoneId: "environment-zone-core-baseline",
        districtRef: "district-core",
        name: "Baseline Environment Layer",
        zoneType: "vegetation",
        treatmentSummary: "Sets the first-pass planting, atmosphere, and materials baseline.",
        dominantPalette: ["deep green", "slate", "warm stone"],
        density: "medium"
      })
    ],
    sceneAuthoring,
    assets: [],
    eventSequences: [],
    previewPaths,
    flyoverPlans,
    screenshotPlans,
    showcaseSequences,
    validationState: {
      healthState: "Needs Attention",
      readiness: "in-progress",
      openIssueCount: 0
    },
    performanceSnapshot: createInitialPerformanceSnapshot(),
    performanceState: {
      activeProfileId: manifest.projectMode === "public-safe" ? "community-safe" : "brother-mode",
      status: "safe",
      topRisk: null
    },
    packageBuilds: [],
    releaseRecords: [],
    packagingState: {
      latestBuildId: null,
      readiness: "not-started",
      releaseCandidateReady: false
    },
    snapshots,
    snapshotBundles,
    restorePoints,
    changeSummaries,
    versioningState: {
      latestSnapshotId: initialSnapshotId,
      latestRestorePointId: initialRestorePointId,
      snapshotCount: snapshots.length,
      restorePointCount: restorePoints.length,
      restoreAvailable: true,
      autosaveProtected: true,
      recoveryConfidence: "strong",
      lastRecoveryCheckAt: manifest.createdAt
    },
    backgroundJobs: []
  };
}
