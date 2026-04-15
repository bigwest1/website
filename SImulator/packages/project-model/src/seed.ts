import { createAssetRecord } from "@course-creator-os/asset-system";
import {
  createFlyoverPlan,
  createShowcaseSequence
} from "@course-creator-os/preview";
import {
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
  createSceneGroup,
  createSceneObject,
  createTerrainModifier,
  createTerrainProfile,
  createTerrainRegion,
  createTerrainSurface,
  createTeeZone,
  createVector3,
  createVisibilityCorridor
} from "@course-creator-os/scene-authoring";
import { createSimulatorLogicConfig } from "@course-creator-os/sim-logic";
import {
  createDistrictRecord,
  createEnvironmentZoneRecord,
  createLandmarkRecord,
  createSupportSpaceRecord
} from "@course-creator-os/world-system";

import type { CourseProject } from "./project";
import { moduleDefinitions } from "./modules";

function buildModuleStatuses(): CourseProject["moduleStatuses"] {
  const entries = moduleDefinitions.map((definition, index) => {
    const completion = Math.max(0.18, 0.96 - index * 0.06);
    const blockers =
      definition.key === "package"
        ? ["Packaging still depends on critical simulator-logic and preview issues being resolved."]
        : definition.key === "publish"
          ? ["Public-safe release notes and media checklist are not complete."]
          : [];
    const state =
      blockers.length > 0
        ? "blocked"
        : completion > 0.94
          ? "ready"
          : completion > 0.84
            ? "ready-for-integration"
            : completion > 0.68
              ? "in-validation"
              : completion > 0.5
                ? "in-build"
                : completion > 0.3
                  ? "in-design"
                  : "defined";

    return [
      definition.key,
      {
        state,
        completion: Number(completion.toFixed(2)),
        blockers,
        nextAction: definition.nextMove
      }
    ] as const;
  });

  return Object.fromEntries(entries) as CourseProject["moduleStatuses"];
}

function buildTeeSets(): CourseProject["teeSets"] {
  return [
    {
      teeSetId: "tee-black",
      name: "Championship",
      color: "black",
      totalYardage: 7440,
      defaultTee: true,
      holeYardages: Object.fromEntries(
        Array.from({ length: 18 }, (_, index) => [`hole-${index + 1}`, 360 + index * 10])
      )
    },
    {
      teeSetId: "tee-blue",
      name: "Member",
      color: "blue",
      totalYardage: 6815,
      defaultTee: false,
      holeYardages: Object.fromEntries(
        Array.from({ length: 18 }, (_, index) => [`hole-${index + 1}`, 330 + index * 9])
      )
    }
  ];
}

function buildPinSets(): CourseProject["pinSets"] {
  return [
    {
      pinSetId: "pins-tournament",
      name: "Tournament",
      difficulty: "tournament",
      enabledHoleIds: Array.from({ length: 18 }, (_, index) => `hole-${index + 1}`)
    },
    {
      pinSetId: "pins-daily",
      name: "Daily",
      difficulty: "standard",
      enabledHoleIds: Array.from({ length: 18 }, (_, index) => `hole-${index + 1}`)
    }
  ];
}

function buildHoles(): CourseProject["holes"] {
  return Array.from({ length: 18 }, (_, index) => {
    const number = index + 1;
    const par = number % 5 === 0 ? 5 : number % 4 === 0 ? 3 : 4;
    const waterHole = number === 3 || number === 9 || number === 17;
    const district = ["Harbor", "Garden", "Kinetics", "Nightfall", "Summit", "Finale"][
      Math.floor(index / 3)
    ]!;

    return {
      holeId: `hole-${number}`,
      number,
      par,
      targetYardage: 148 + number * 19,
      teeSetRefs: ["tee-black", "tee-blue"],
      pinSetRefs: ["pins-tournament", "pins-daily"],
      emotionalRole:
        number % 2 === 0
          ? "Reward confident commitment with a clean angle."
          : "Build tension through visual drama and controlled risk.",
      readabilityTarget: number <= 6 ? "Immediate read" : "Guided spectacle read",
      challengeRating: ((number % 5) + 1) as 1 | 2 | 3 | 4 | 5,
      metadata: {
        holeRole:
          number === 18 ? "closing spectacle finisher" : number % 3 === 0 ? "pivot hole" : "momentum builder",
        routeNotes: `Transition from ${district} should feel deliberate and premium.`,
        hazardNotes: waterHole
          ? "Water carry and bunker recovery need to stay readable from the tee."
          : "Primary bunker pattern should pressure the aggressive line without creating guesswork.",
        eventPayoffNotes:
          number % 4 === 0
            ? "Sync the completion payoff with the district event beat."
            : "End the hole with a distinct visual release.",
        fairwayIntent: "Offer a bold high line and a safer shaping line.",
        greenIntent: "Readable contouring with one tournament tier.",
        flyoverNotes: waterHole
          ? "Use elevated reveal to explain forced carry."
          : "Lead with landmark and landing zone clarity."
      },
      hazardRefs: waterHole ? [`hazard-water-${number}`, `hazard-bunker-${number}`] : [`hazard-bunker-${number}`],
      landmarkRefs: [`landmark-${district.toLowerCase()}`],
      eventRefs: number % 4 === 0 ? [`event-${district.toLowerCase()}`] : [],
      playabilityStatus: waterHole && number === 17 ? "needs-review" : "ready",
      previewRefs: [`preview-minimap-hole-${number}`, `preview-flyover-hole-${number}`]
    };
  });
}

function buildPreviewPaths(): CourseProject["previewPaths"] {
  return Array.from({ length: 18 }, (_, index) => {
    const number = index + 1;

    return [
      {
        previewPathId: `preview-flyover-hole-${number}`,
        name: `Hole ${number} Flyover`,
        previewType: "flyover" as const,
        holeRefs: [`hole-${number}`],
        readinessState: (number <= 9 ? "ready" : "draft") as "ready" | "draft",
        outputStatus: "not-run" as const,
        lastBuildRef: null,
        note: "Primary cinematic path for hole preview."
      },
      {
        previewPathId: `preview-minimap-hole-${number}`,
        name: `Hole ${number} Minimap`,
        previewType: "minimap" as const,
        holeRefs: [`hole-${number}`],
        readinessState: (number <= 12 ? "ready" : "missing") as "ready" | "missing",
        outputStatus: "not-run" as const,
        lastBuildRef: null,
        note: "Minimap composition requires final routing marks."
      }
    ];
  }).flat();
}

function buildFlyoverPlans(): CourseProject["flyoverPlans"] {
  return [
    createFlyoverPlan({
      flyoverPlanId: "flyover-plan-1",
      holeRef: "hole-1",
      previewPathRef: "preview-flyover-hole-1",
      cameraIntent: "Establish the arrival district and teach the opening landing zone.",
      introBeat: "Glide past the marina arch toward the tee deck.",
      outroBeat: "Hold on the fairway bend and skyline marker.",
      durationSeconds: 18,
      readinessState: "approved",
      note: "Primary opener for first-session onboarding and promo use."
    }),
    createFlyoverPlan({
      flyoverPlanId: "flyover-plan-9",
      holeRef: "hole-9",
      previewPathRef: "preview-flyover-hole-9",
      cameraIntent: "Bridge the kinetic mid-course energy into the back-nine transition.",
      introBeat: "Bank above the show spine and player route.",
      outroBeat: "Finish on the green reveal with kinetic district motion in frame.",
      durationSeconds: 20,
      readinessState: "ready",
      note: "Ready for capture after final event timing review."
    }),
    createFlyoverPlan({
      flyoverPlanId: "flyover-plan-18",
      holeRef: "hole-18",
      previewPathRef: "preview-flyover-hole-18",
      cameraIntent: "Sell the finale and the premium nightfall payoff.",
      introBeat: "Lift over Lumina Bay with the crowd-space lights warming up.",
      outroBeat: "Finish on the closing green with the finale landmark centered.",
      durationSeconds: 24,
      readinessState: "draft",
      note: "Needs final routing framing and post-hole payoff timing."
    })
  ];
}

function buildShowcaseSequences(): CourseProject["showcaseSequences"] {
  return [
    createShowcaseSequence({
      showcaseSequenceId: "showcase-sequence-flagship",
      title: "Flagship Theme Park Reveal",
      targetChannel: "showcase",
      shotRefs: [
        "shot-harbor-dawn",
        "preview-flyover-hole-1",
        "preview-flyover-hole-9",
        "shot-nightfall-finale"
      ],
      narrativeGoal: "Move from premium arrival, through district escalation, into a finale-grade payoff.",
      readinessState: "ready",
      note: "Ready for internal showcase use once the hole 18 flyover is approved."
    })
  ];
}

function buildSceneAuthoring(): CourseProject["sceneAuthoring"] {
  return createSceneAuthoringState({
    activeCollectionId: "collection-flagship-course",
    placementMode: "move",
    gizmoMode: "move",
    selectionState: {
      selectedObjectIds: ["scene-marina-arch"],
      selectedGroupIds: [],
      primarySelectionId: "scene-marina-arch",
      hoveredObjectId: null,
      hoveredSpatialEntityRef: null,
      transformSpace: "world",
      pivotMode: "selection-center",
      selectedSpatialEntityRefs: [],
      filterCategories: [],
      includeHiddenObjects: false
    },
    viewportState: {
      rendererMode: "hybrid-preview",
      backendStatus: "scaffolded",
      projectionMode: "top-down",
      authoringMode: "placement",
      activeHoleId: "hole-1",
      selectedRoutingPathId: "routing-path-hole-1",
      selectedTerrainRegionId: "terrain-region-hole-1-fairway",
      densityMode: "hole",
      camera: {
        position: createVector3({ x: 0, y: 86, z: 0 }),
        target: createVector3({ x: 0, y: 0, z: 0 }),
        zoom: 1.18,
        pitchDegrees: 74,
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
        collectionId: "collection-flagship-course",
        name: "Flagship Course Scene",
        description: "Primary collection for the modern premium theme park course.",
        defaultLayerId: "layer-gameplay",
        routeSummary: "Carry gameplay anchors, spectacle landmarks, and support-space realism together.",
        tags: ["flagship", "theme-park"]
      })
    ],
    placementLayers: [
      createPlacementLayer({
        layerId: "layer-gameplay",
        name: "Gameplay Anchors",
        description: "Course-critical tees, pin proxies, and routing objects.",
        colorToken: "accent.primary",
        filterCategories: ["gameplay-course-object"]
      }),
      createPlacementLayer({
        layerId: "layer-landmarks",
        name: "Landmarks",
        description: "High-priority framing landmarks and reveal anchors.",
        colorToken: "state.info",
        filterCategories: ["landmark", "animated-set-piece"]
      }),
      createPlacementLayer({
        layerId: "layer-structures",
        name: "Structures",
        description: "Bridges, plaza edges, support buildings, and scenic structures.",
        colorToken: "state.warning",
        filterCategories: ["structure", "supporting-scenery"]
      }),
      createPlacementLayer({
        layerId: "layer-vegetation",
        name: "Vegetation & Props",
        description: "Vegetation masses and premium dressing elements.",
        colorToken: "state.success",
        filterCategories: ["vegetation", "prop"]
      })
    ],
    terrainSurfaces: [
      createTerrainSurface({
        terrainSurfaceId: "terrain-surface-fairway",
        name: "Showcase Fairway",
        gameplayPurpose: "fairway",
        materialFamily: "premium-fairway",
        visualRole: "Playable fairway corridor surface."
      }),
      createTerrainSurface({
        terrainSurfaceId: "terrain-surface-green",
        name: "Showcase Green",
        gameplayPurpose: "green-complex",
        materialFamily: "premium-green",
        visualRole: "Readable green target surface."
      }),
      createTerrainSurface({
        terrainSurfaceId: "terrain-surface-harbor-edge",
        name: "Harbor Edge Rough",
        gameplayPurpose: "rough",
        materialFamily: "ornamental-rough",
        visualRole: "Transition rough between fairway and themed edges."
      })
    ],
    terrainProfiles: [
      createTerrainProfile({
        terrainProfileId: "terrain-profile-hole-1-fairway",
        name: "Opening Fairway Profile",
        description: "Premium opening fairway shaping with readable carry and landing definition.",
        primarySurfaceId: "terrain-surface-fairway",
        slopeToleranceDegrees: 10,
        roughness: 0.18,
        drainageBias: 0.5,
        themeTags: ["flagship", "arrival"]
      }),
      createTerrainProfile({
        terrainProfileId: "terrain-profile-hole-1-green",
        name: "Opening Green Profile",
        description: "Controlled green shaping for showcase-grade approach readability.",
        primarySurfaceId: "terrain-surface-green",
        slopeToleranceDegrees: 6,
        roughness: 0.09,
        drainageBias: 0.46,
        themeTags: ["flagship", "target"]
      })
    ],
    terrainRegions: [
      createTerrainRegion({
        terrainRegionId: "terrain-region-hole-1-fairway",
        collectionId: "collection-flagship-course",
        holeId: "hole-1",
        name: "Hole 1 Fairway Grounds",
        gameplayPurpose: "fairway",
        terrainProfileId: "terrain-profile-hole-1-fairway",
        boundary: [
          { x: -26, y: 0, z: 24 },
          { x: 18, y: 0, z: 18 },
          { x: 12, y: 0, z: -20 },
          { x: -18, y: 0, z: -26 }
        ],
        elevationMin: -2,
        elevationMax: 4,
        linkedZoneIds: [
          "tee-zone-hole-1-black",
          "fairway-corridor-hole-1",
          "green-zone-hole-1"
        ],
        linkedSceneObjectIds: ["scene-hole-1-tee"]
      }),
      createTerrainRegion({
        terrainRegionId: "terrain-region-hole-1-green",
        collectionId: "collection-flagship-course",
        holeId: "hole-1",
        name: "Hole 1 Green Shelf",
        gameplayPurpose: "green-complex",
        terrainProfileId: "terrain-profile-hole-1-green",
        boundary: [
          { x: -8, y: 0, z: -18 },
          { x: 6, y: 0, z: -20 },
          { x: 8, y: 0, z: -30 },
          { x: -10, y: 0, z: -28 }
        ],
        elevationMin: 0,
        elevationMax: 3,
        linkedZoneIds: ["green-zone-hole-1"]
      })
    ],
    terrainModifiers: [
      createTerrainModifier({
        terrainModifierId: "terrain-modifier-hole-1-crown",
        holeId: "hole-1",
        regionId: "terrain-region-hole-1-green",
        kind: "smooth",
        strength: 0.5,
        falloffMeters: 8,
        targetHeight: 1.3,
        bounds: [
          { x: -10, y: 0, z: -18 },
          { x: 8, y: 0, z: -18 },
          { x: 8, y: 0, z: -32 },
          { x: -10, y: 0, z: -32 }
        ],
        note: "Keeps the opening green polished and readable."
      })
    ],
    routingNodes: [
      createRoutingNode({
        routingNodeId: "routing-node-hole-1-tee",
        holeId: "hole-1",
        kind: "tee",
        label: "Hole 1 Tee",
        position: { x: -22, y: 1, z: 18 },
        linkedSceneObjectId: "scene-hole-1-tee",
        linkedZoneId: "tee-zone-hole-1-black"
      }),
      createRoutingNode({
        routingNodeId: "routing-node-hole-1-landing",
        holeId: "hole-1",
        kind: "landing-zone",
        label: "Hole 1 Landing",
        position: { x: -2, y: 0, z: 4 },
        linkedZoneId: "fairway-corridor-hole-1"
      }),
      createRoutingNode({
        routingNodeId: "routing-node-hole-1-green",
        holeId: "hole-1",
        kind: "green-center",
        label: "Hole 1 Green",
        position: { x: -1, y: 1, z: -24 },
        linkedZoneId: "green-zone-hole-1"
      }),
      createRoutingNode({
        routingNodeId: "routing-node-hole-1-preview",
        holeId: "hole-1",
        kind: "preview-anchor",
        label: "Hole 1 Preview",
        position: { x: 4, y: 10, z: 10 },
        linkedSceneObjectId: "scene-marina-arch"
      })
    ],
    routingSegments: [
      createRoutingSegment({
        routingSegmentId: "routing-segment-hole-1-drive",
        holeId: "hole-1",
        fromNodeId: "routing-node-hole-1-tee",
        toNodeId: "routing-node-hole-1-landing",
        kind: "primary-shot",
        controlLine: [
          { x: -22, y: 1, z: 18 },
          { x: -11, y: 1, z: 11 },
          { x: -2, y: 0, z: 4 }
        ],
        targetWidthMeters: 30,
        visibilityCorridorId: "visibility-corridor-hole-1"
      }),
      createRoutingSegment({
        routingSegmentId: "routing-segment-hole-1-approach",
        holeId: "hole-1",
        fromNodeId: "routing-node-hole-1-landing",
        toNodeId: "routing-node-hole-1-green",
        kind: "approach",
        controlLine: [
          { x: -2, y: 0, z: 4 },
          { x: 1, y: 0, z: -10 },
          { x: -1, y: 1, z: -24 }
        ],
        targetWidthMeters: 22,
        visibilityCorridorId: "visibility-corridor-hole-1"
      })
    ],
    routingPaths: [
      createRoutingPath({
        routingPathId: "routing-path-hole-1",
        holeId: "hole-1",
        name: "Opening Route",
        teeNodeId: "routing-node-hole-1-tee",
        greenNodeId: "routing-node-hole-1-green",
        nodeIds: [
          "routing-node-hole-1-tee",
          "routing-node-hole-1-landing",
          "routing-node-hole-1-green"
        ],
        segmentIds: [
          "routing-segment-hole-1-drive",
          "routing-segment-hole-1-approach"
        ],
        routeStatus: "connected",
        note: "Opening route is connected and ready for spatial validation."
      })
    ],
    fairwayCorridors: [
      createFairwayCorridor({
        fairwayCorridorId: "fairway-corridor-hole-1",
        holeId: "hole-1",
        routingPathId: "routing-path-hole-1",
        centerline: [
          { x: -22, y: 1, z: 18 },
          { x: -10, y: 1, z: 10 },
          { x: -2, y: 0, z: 4 }
        ],
        averageWidthMeters: 29,
        landingZoneCount: 1,
        note: "Opening fairway corridor."
      })
    ],
    greenZones: [
      createGreenZone({
        greenZoneId: "green-zone-hole-1",
        holeId: "hole-1",
        boundary: [
          { x: -7, y: 0, z: -19 },
          { x: 5, y: 0, z: -20 },
          { x: 7, y: 0, z: -29 },
          { x: -9, y: 0, z: -28 }
        ],
        targetPinCapacity: 3,
        approachNodeId: "routing-node-hole-1-green",
        note: "Showcase green for the opening hole."
      })
    ],
    teeZones: [
      createTeeZone({
        teeZoneId: "tee-zone-hole-1-black",
        holeId: "hole-1",
        boundary: [
          { x: -26, y: 0, z: 14 },
          { x: -18, y: 0, z: 14 },
          { x: -18, y: 0, z: 22 },
          { x: -26, y: 0, z: 22 }
        ],
        teeSetRefs: ["tee-black"],
        facingDirectionDegrees: 156,
        note: "Championship tee deck."
      })
    ],
    hazardZones: [],
    outOfBoundsZones: [
      createOutOfBoundsZone({
        outOfBoundsZoneId: "out-of-bounds-hole-1-left",
        holeId: "hole-1",
        sideLabel: "Harbor left",
        boundary: [
          { x: -30, y: 0, z: 24 },
          { x: -26, y: 0, z: 24 },
          { x: -22, y: 0, z: -30 },
          { x: -30, y: 0, z: -30 }
        ],
        note: "Opening left-side OB edge."
      })
    ],
    dropZoneAreas: [],
    visibilityCorridors: [
      createVisibilityCorridor({
        visibilityCorridorId: "visibility-corridor-hole-1",
        holeId: "hole-1",
        fromNodeId: "routing-node-hole-1-tee",
        toNodeId: "routing-node-hole-1-green",
        corridorLine: [
          { x: -22, y: 1, z: 18 },
          { x: -4, y: 2, z: 6 },
          { x: -1, y: 1, z: -24 }
        ],
        minimumWidthMeters: 18,
        note: "Maintains a readable first-hole corridor."
      })
    ],
    playRouteEnvelopes: [
      createPlayRouteEnvelope({
        playRouteEnvelopeId: "play-route-envelope-hole-1",
        holeId: "hole-1",
        routingPathId: "routing-path-hole-1",
        boundary: [
          { x: -28, y: 0, z: 24 },
          { x: 18, y: 0, z: 18 },
          { x: 10, y: 0, z: -30 },
          { x: -20, y: 0, z: -30 }
        ],
        note: "Primary play route envelope."
      })
    ],
    sceneObjects: [
      createSceneObject({
        sceneObjectId: "scene-hole-1-tee",
        collectionId: "collection-flagship-course",
        name: "Hole 1 Tee Deck",
        category: "gameplay-course-object",
        objectType: "tee-deck",
        placementLayerId: "layer-gameplay",
        binding: {
          bindingType: "tee",
          entityId: "hole-1",
          exportRole: "gameplay-critical"
        },
        transform: {
          position: {
            x: -22,
            y: 1,
            z: 18
          }
        }
      }),
      createSceneObject({
        sceneObjectId: "scene-marina-arch",
        collectionId: "collection-flagship-course",
        name: "Marina Arrival Arch",
        category: "landmark",
        objectType: "arrival-arch",
        placementLayerId: "layer-landmarks",
        transform: {
          position: {
            x: 8,
            y: 7,
            z: -12
          },
          rotation: {
            x: 0,
            y: 22,
            z: 0
          }
        }
      }),
      createSceneObject({
        sceneObjectId: "scene-show-spine",
        collectionId: "collection-flagship-course",
        name: "Kinetic Show Spine",
        category: "animated-set-piece",
        objectType: "show-spine",
        placementLayerId: "layer-landmarks",
        transform: {
          position: {
            x: 24,
            y: 5,
            z: 6
          }
        }
      }),
      createSceneObject({
        sceneObjectId: "scene-support-plaza",
        collectionId: "collection-flagship-course",
        name: "Support Plaza Envelope",
        category: "supporting-scenery",
        objectType: "support-plaza",
        placementLayerId: "layer-structures",
        transform: {
          position: {
            x: -14,
            y: 0,
            z: -4
          }
        }
      }),
      createSceneObject({
        sceneObjectId: "scene-palm-grove",
        collectionId: "collection-flagship-course",
        name: "Palm Grove Cluster",
        category: "vegetation",
        objectType: "tree-cluster",
        placementLayerId: "layer-vegetation",
        transform: {
          position: {
            x: 14,
            y: 0,
            z: 16
          }
        },
        placementConstraints: [
          createPlacementConstraint({
            constraintId: "constraint-palm-grove-terrain",
            kind: "terrain-surface",
            note: "Maintain terrain-conforming placement."
          })
        ]
      })
    ],
    sceneGroups: [
      createSceneGroup({
        groupId: "group-arrival-sequence",
        collectionId: "collection-flagship-course",
        name: "Arrival Sequence",
        placementLayerId: "layer-landmarks",
        pivot: {
          x: 16,
          y: 6,
          z: -3
        }
      })
    ],
    parentRelationships: [
      {
        relationshipId: "relationship-group-arrival-sequence",
        childId: "group-arrival-sequence",
        childType: "group",
        parentId: null,
        parentType: "collection"
      },
      {
        relationshipId: "relationship-scene-hole-1-tee",
        childId: "scene-hole-1-tee",
        childType: "object",
        parentId: null,
        parentType: "collection"
      },
      {
        relationshipId: "relationship-scene-support-plaza",
        childId: "scene-support-plaza",
        childType: "object",
        parentId: null,
        parentType: "collection"
      },
      {
        relationshipId: "relationship-scene-palm-grove",
        childId: "scene-palm-grove",
        childType: "object",
        parentId: null,
        parentType: "collection"
      },
      {
        relationshipId: "relationship-scene-marina-arch",
        childId: "scene-marina-arch",
        childType: "object",
        parentId: "group-arrival-sequence",
        parentType: "group"
      },
      {
        relationshipId: "relationship-scene-show-spine",
        childId: "scene-show-spine",
        childType: "object",
        parentId: "group-arrival-sequence",
        parentType: "group"
      }
    ]
  });
}

export function createSeedProject(): CourseProject {
  const holes = buildHoles();
  const teeSets = buildTeeSets();
  const pinSets = buildPinSets();
  const previewPaths = buildPreviewPaths();
  const flyoverPlans = buildFlyoverPlans();
  const sceneAuthoring = buildSceneAuthoring();
  const hazardProfiles = holes.flatMap((hole) => [
    {
      hazardId: `hazard-bunker-${hole.number}`,
      type: "bunker" as const,
      holeId: hole.holeId,
      playRule: "Standard bunker penalty context.",
      dropZoneRequired: false,
      note: "Primary fairway defense."
    },
    ...(hole.hazardRefs.some((hazard) => hazard.includes("water"))
      ? [
          {
            hazardId: `hazard-water-${hole.number}`,
            type: "water" as const,
            holeId: hole.holeId,
            playRule: "Water carry penalty with recovery path.",
            dropZoneRequired: true,
            note: "Major forced carry or lateral hazard."
          }
        ]
      : [])
  ]);
  const dropZones = [
    {
      dropZoneId: "drop-zone-3",
      holeId: "hole-3",
      label: "Garden recovery deck",
      triggerHazardId: "hazard-water-3",
      note: "Aligned to maintain pace of play."
    },
    {
      dropZoneId: "drop-zone-9",
      holeId: "hole-9",
      label: "Kinetics bypass tee",
      triggerHazardId: "hazard-water-9",
      note: "Placed to keep the landmark reveal intact."
    }
  ];
  const surfaceProfiles = [
    {
      surfaceId: "surface-fairway",
      name: "Fairway",
      type: "fairway" as const,
      physicsNote: "GSPro baseline fairway response.",
      playable: true
    },
    {
      surfaceId: "surface-green",
      name: "Green",
      type: "green" as const,
      physicsNote: "Tournament-ready green speeds.",
      playable: true
    },
    {
      surfaceId: "surface-bunker",
      name: "Bunker",
      type: "bunker" as const,
      physicsNote: "Consistent sand escape tuning.",
      playable: true
    },
    {
      surfaceId: "surface-water",
      name: "Water Hazard",
      type: "water" as const,
      physicsNote: "Water hazard state.",
      playable: false
    }
  ];

  return {
    id: "cco-eclipse-harbor",
    manifest: {
      id: "cco-eclipse-harbor",
      name: "Eclipse Harbor",
      slug: "eclipse-harbor",
      projectMode: "public-safe",
      createdAt: "2026-04-13T00:00:00.000Z",
      updatedAt: "2026-04-13T00:00:00.000Z",
      version: "0.1.0",
      holeCount: 18,
      activeOutputProfiles: ["brother-mode", "community-safe", "showcase"],
      primaryTheme: "Modern premium theme park resort",
      realismTarget: 72,
      spectacleTarget: 84,
      targetHardwareProfile: "i7-8086K / RTX 4080 Super / 64 GB / NVMe",
      activeStylePack: "premium-theme-park",
      activeValidationProfile: "balanced",
      courseType: "theme-park"
    },
    moduleStatuses: buildModuleStatuses(),
    courseBible: {
      courseIdentity: "A resort-scale theme park course built as a believable premium destination.",
      visionOverview: {
        statement: "Blend world-class destination detailing with simulator-first readability and playability.",
        playerPromise: "Give players clear shots, premium reveals, and confidence at every routing transition.",
        designThesis: "Treat the course like a destination world first, but never at the expense of simulator clarity."
      },
      audienceAndIntent: {
        primaryAudience: "Course creators and simulator players who want spectacle without chaos.",
        intendedExperience: "Premium destination golf that feels organized, memorable, and reliably playable.",
        releaseIntent: "community"
      },
      worldIdentity: {
        settingSummary: "Premium resort-scale theme park destination with coherent lands and support spaces.",
        environmentLogic: [
          "Each district supports the playable route.",
          "Guest-space logic stays believable."
        ],
        supportSpacePrinciple: "Backstage and guest support spaces must reinforce the premium destination fiction."
      },
      styleGrammar: ["Premium futurism", "Kinetic landmarks", "Readable shot framing"],
      materialLanguage: ["Stone marina edges", "Brushed metal accents", "Lush engineered landscape"],
      lightingLanguage: ["Warm harbor dusk", "Cool kinetic glow", "Controlled night-finale contrast"],
      pacingAndEmotionalArc: {
        openingBeat: "Open with confidence",
        midCourseBeat: "Mid-course escalation",
        closingBeat: "Night-finale payoff",
        emotionalArcSummary: "Move from composed arrival luxury into kinetic escalation and finish with waterfront spectacle."
      },
      signatureMoments: [
        {
          momentId: "signature-arrival-marina",
          title: "Arrival marina reveal",
          summary: "Frame the first premium reveal with water, skyline, and readable golf lines.",
          impact: "Sets trust and premium tone from the opening sequence.",
          locationHint: "Opening arrival district"
        },
        {
          momentId: "signature-garden-amphitheater",
          title: "Garden amphitheater par 3",
          summary: "Use the par 3 as the first emotional reset and landmark-centered reveal.",
          impact: "Creates a signature pause in the middle of the routing arc.",
          locationHint: "Garden district"
        },
        {
          momentId: "signature-waterfront-finale",
          title: "Waterfront night finisher",
          summary: "Close with controlled night spectacle and a confident final approach.",
          impact: "Delivers the memorable final image of the course.",
          locationHint: "Nightfall district"
        }
      ],
      constraintsAndRequirements: [
        {
          constraintId: "constraint-readable-spectacle",
          title: "Readable spectacle",
          requirement: "Spectacle cannot break shot readability.",
          severity: "non-negotiable"
        },
        {
          constraintId: "constraint-community-safe",
          title: "Community-safe release",
          requirement: "Community Safe profile required before broad release.",
          severity: "important"
        }
      ],
      richNotes: [
        {
          noteId: "note-routing-legibility",
          title: "Routing legibility",
          body: "District transitions must remain legible from top-down routing views.",
          emphasis: "reference"
        },
        {
          noteId: "note-spectacle-fallback",
          title: "Fallback state discipline",
          body: "Every major spectacle beat needs a fall-back low-complexity state.",
          emphasis: "risk"
        }
      ],
    },
    holes,
    teeSets: [...teeSets],
    pinSets: [...pinSets],
    surfaceProfiles,
    hazardProfiles,
    dropZones,
    simulatorLogic: createSimulatorLogicConfig({
      holes,
      teeSets: [...teeSets],
      pinSets: [...pinSets],
      surfaceProfiles,
      hazardProfiles,
      dropZones,
      previewPaths,
      sceneAuthoring,
      outOfBoundsConfigured: false,
      exportProfileNotes: ["Hole 17 still needs a water-hazard drop zone decision."]
    }),
    districts: [
      createDistrictRecord({
        districtId: "district-harbor",
        name: "Harbor",
        districtType: "arrival",
        theme: "Arrival luxury marina",
        visualRole: "first impression anchor",
        mood: "calm prestige",
        supportRealismNotes: ["Dock operations feel believable."]
      }),
      createDistrictRecord({
        districtId: "district-garden",
        name: "Garden",
        districtType: "garden",
        theme: "Futurist botanical district",
        visualRole: "mid-course calm reset",
        mood: "elevated calm",
        supportRealismNotes: ["Botanical structures should guide sightlines."]
      }),
      createDistrictRecord({
        districtId: "district-kinetics",
        name: "Kinetics",
        districtType: "entertainment",
        theme: "High-energy entertainment",
        visualRole: "kinetic skyline escalation",
        mood: "kinetic excitement",
        supportRealismNotes: ["Motion should not overwhelm readability."]
      }),
      createDistrictRecord({
        districtId: "district-nightfall",
        name: "Nightfall",
        districtType: "finale",
        theme: "Waterfront light district",
        visualRole: "night climax and finale payoff",
        mood: "spectral luxury",
        supportRealismNotes: ["Contrast stays controlled for simulator readability."]
      })
    ],
    landmarks: [
      createLandmarkRecord({
        landmarkId: "landmark-harbor",
        name: "Marina Crown Tower",
        districtRef: "district-harbor",
        landmarkType: "orientation-anchor",
        visibilityRole: "orientation anchor",
        visibilityPriority: "hero",
        linkedHoleRefs: ["hole-1", "hole-2"],
        notes: "Visible from holes 1 and 2."
      }),
      createLandmarkRecord({
        landmarkId: "landmark-garden",
        name: "Garden Halo Conservatory",
        districtRef: "district-garden",
        landmarkType: "signature-moment",
        visibilityRole: "par-3 reveal",
        visibilityPriority: "high",
        linkedHoleRefs: ["hole-5", "hole-6", "hole-7"],
        notes: "Defines the garden amphitheater."
      }),
      createLandmarkRecord({
        landmarkId: "landmark-kinetics",
        name: "Skyloop Transit Spine",
        districtRef: "district-kinetics",
        landmarkType: "skyline-marker",
        visibilityRole: "kinetic skyline marker",
        visibilityPriority: "hero",
        linkedHoleRefs: ["hole-8", "hole-9", "hole-10"],
        notes: "Crosses the horizon, not the shot line."
      }),
      createLandmarkRecord({
        landmarkId: "landmark-nightfall",
        name: "Lumina Bay Ring",
        districtRef: "district-nightfall",
        landmarkType: "signature-moment",
        visibilityRole: "finale icon",
        visibilityPriority: "hero",
        linkedHoleRefs: ["hole-17", "hole-18"],
        notes: "Closes the course with controlled spectacle."
      })
    ],
    supportSpaces: [
      createSupportSpaceRecord({
        supportSpaceId: "support-space-harbor-arrival",
        districtRef: "district-harbor",
        name: "Harbor Guest Arrival Spine",
        spaceType: "guest-services",
        roleSummary: "Arrival promenade, drop-off, and premium guest circulation support.",
        playerFacing: true,
        linkedHoleRefs: ["hole-1", "hole-2"]
      }),
      createSupportSpaceRecord({
        supportSpaceId: "support-space-garden-service",
        districtRef: "district-garden",
        name: "Conservatory Service Ring",
        spaceType: "landscape-support",
        roleSummary: "Back-of-house support for the botanical set pieces and maintenance access.",
        playerFacing: false,
        linkedHoleRefs: ["hole-5", "hole-6"]
      }),
      createSupportSpaceRecord({
        supportSpaceId: "support-space-kinetics-transit",
        districtRef: "district-kinetics",
        name: "Skyloop Transit Platform",
        spaceType: "transit",
        roleSummary: "Believable transport and queuing logic supporting the kinetic skyline fiction.",
        playerFacing: true,
        linkedHoleRefs: ["hole-8", "hole-9", "hole-10"]
      }),
      createSupportSpaceRecord({
        supportSpaceId: "support-space-nightfall-operations",
        districtRef: "district-nightfall",
        name: "Nightfall Show Control Deck",
        spaceType: "attraction-support",
        roleSummary: "Supports the final light and audio sequences without breaking course realism.",
        playerFacing: false,
        linkedHoleRefs: ["hole-17", "hole-18"]
      })
    ],
    environmentZones: [
      createEnvironmentZoneRecord({
        environmentZoneId: "environment-zone-harbor-marina",
        districtRef: "district-harbor",
        name: "Harbor Marina Palette",
        zoneType: "materials",
        treatmentSummary: "Warm stone, marine metal, and planted waterfront edges set the arrival tone.",
        dominantPalette: ["warm stone", "navy metal", "seafoam planting"],
        density: "medium",
        linkedHoleRefs: ["hole-1", "hole-2"]
      }),
      createEnvironmentZoneRecord({
        environmentZoneId: "environment-zone-garden-canopy",
        districtRef: "district-garden",
        name: "Garden Canopy Layer",
        zoneType: "vegetation",
        treatmentSummary: "Dense engineered planting softens the route and frames the calmer reset holes.",
        dominantPalette: ["deep green", "orchid", "matte stone"],
        density: "high",
        linkedHoleRefs: ["hole-5", "hole-6", "hole-7"]
      }),
      createEnvironmentZoneRecord({
        environmentZoneId: "environment-zone-kinetics-audio",
        districtRef: "district-kinetics",
        name: "Kinetics Audio Atmosphere",
        zoneType: "audio",
        treatmentSummary: "Directional motion and controlled energy cues escalate spectacle without muddying golf focus.",
        dominantPalette: ["electric cyan", "steel blue"],
        density: "hero",
        linkedHoleRefs: ["hole-8", "hole-9", "hole-10"]
      }),
      createEnvironmentZoneRecord({
        environmentZoneId: "environment-zone-nightfall-lighting",
        districtRef: "district-nightfall",
        name: "Nightfall Lighting Arc",
        zoneType: "lighting",
        treatmentSummary: "Controlled waterfront glow and contrast discipline shape the final emotional payoff.",
        dominantPalette: ["amber", "cool white", "deep navy"],
        density: "hero",
        linkedHoleRefs: ["hole-17", "hole-18"]
      })
    ],
    sceneAuthoring,
    assets: [
      createAssetRecord({
        assetId: "asset-marina-arch",
        displayName: "Marina Arrival Arch",
        source: {
          sourceType: "licensed",
          providerName: "Theme Foundry",
          licenseSummary: "Studio-seat architectural pack licensed for packaged simulator releases."
        },
        importPath: "/imports/marina-arch.fbx",
        normalizedPath: "/normalized/marina-arch.glb",
        fileType: "glb",
        category: "architecture",
        styleTags: ["premium", "harbor", "arrival"],
        queueState: "cataloged",
        dimensions: {
          widthMeters: 18,
          depthMeters: 9,
          heightMeters: 7
        },
        normalizationState: "normalized",
        scaleStatus: "normalized",
        orientationStatus: "ready",
        analysis: {
          analysisStatus: "verified",
          polyEstimate: 82000,
          materialCount: 6,
          textureCount: 12,
          textureMemoryEstimateMb: 486,
          animationClipCount: 0,
          complexityGrade: "moderate",
          note: "Clean hero asset for the arrival sequence."
        },
        approvalStatus: "approved",
        notes: "Key hero piece for the arrival sequence."
      }),
      createAssetRecord({
        assetId: "asset-coaster-loop",
        displayName: "Skyloop Coaster Ring",
        source: {
          sourceType: "kitbash",
          providerName: "RideWorks",
          packageName: "Thrill Spine Set"
        },
        importPath: "/imports/skyloop-ring.fbx",
        normalizedPath: "/normalized/skyloop-ring.glb",
        fileType: "glb",
        category: "landmark",
        styleTags: ["kinetic", "showcase", "premium"],
        queueState: "blocked",
        dimensions: {
          widthMeters: 40,
          depthMeters: 12,
          heightMeters: 28
        },
        normalizationState: "needs-review",
        scaleStatus: "mismatch",
        orientationStatus: "flipped",
        analysis: {
          analysisStatus: "estimated",
          polyEstimate: 164000,
          materialCount: 11,
          textureCount: 18,
          textureMemoryEstimateMb: 712,
          animationClipCount: 1,
          complexityGrade: "heavy",
          note: "Orientation cleanup still needed before review."
        },
        approvalStatus: "pending",
        notes: "Blocked pending orientation cleanup and scale confirmation."
      }),
      createAssetRecord({
        assetId: "asset-harbor-palms",
        displayName: "Harbor Palm Cluster",
        source: {
          sourceType: "marketplace",
          providerName: "Coastal Elements",
          licenseSummary: "Marketplace foliage license recorded pending public-safe review."
        },
        fileType: "fbx",
        category: "vegetation",
        styleTags: ["harbor", "lush", "premium"],
        queueState: "ingesting",
        normalizationState: "imported",
        scaleStatus: "needs-review",
        orientationStatus: "ready",
        dimensions: {
          widthMeters: 6,
          depthMeters: 6,
          heightMeters: 8
        },
        analysis: {
          analysisStatus: "not-started",
          polyEstimate: null,
          materialCount: null,
          textureCount: null,
          textureMemoryEstimateMb: null,
          animationClipCount: null,
          complexityGrade: null,
          note: "Needs first-pass foliage density check."
        },
        approvalStatus: "pending",
        notes: "Planned for harbor transition dressing."
      }),
      createAssetRecord({
        assetId: "asset-nightfall-lamp-set",
        displayName: "Nightfall Promenade Lamp Set",
        source: {
          sourceType: "scratch",
          author: "Course Creator OS Seed Team"
        },
        normalizedPath: "/normalized/nightfall-lamp-set.glb",
        fileType: "glb",
        category: "lighting",
        styleTags: ["nightfall", "premium", "support-space"],
        queueState: "ready-for-review",
        normalizationState: "normalized",
        scaleStatus: "normalized",
        orientationStatus: "ready",
        analysis: {
          analysisStatus: "estimated",
          polyEstimate: 14800,
          materialCount: 3,
          textureCount: 4,
          textureMemoryEstimateMb: 96,
          animationClipCount: 0,
          complexityGrade: "light",
          note: "Ready for approval after final source notes."
        },
        approvalStatus: "pending",
        notes: "Should become the default promenade lighting family."
      })
    ],
    eventSequences: [
      {
        eventId: "event-kinetics",
        name: "Skyloop Pulse Cycle",
        eventType: "scheduled",
        triggerMode: "clocked-sequence",
        districtRef: "district-kinetics",
        linkedHoleRefs: ["hole-8", "hole-9", "hole-10"],
        state: "ready",
        intensity: "medium",
        note: "Timed skyline motion every 90 seconds.",
        previewNote: "Capture the skyline pulse as a mid-round escalation beat.",
        safetyNote: "Do not fire the brightest beat during an active tee shot or green approach."
      },
      {
        eventId: "event-nightfall",
        name: "Bay Light Rise",
        eventType: "hole-trigger",
        triggerMode: "hole-complete",
        districtRef: "district-nightfall",
        linkedHoleRefs: ["hole-17", "hole-18"],
        state: "conflict",
        intensity: "high",
        note: "Current timing competes with hole 17 shot setup.",
        previewNote: "Use as the transition into the finale district once timing is safe.",
        safetyNote: "Delay the light rise until the hole 17 ball is at rest and the player camera is clear."
      }
    ],
    previewPaths,
    flyoverPlans,
    screenshotPlans: [
      {
        screenshotId: "shot-harbor-dawn",
        label: "Harbor Arrival Hero",
        holeRef: "hole-1",
        previewPathRef: "preview-flyover-hole-1",
        framingNote: "Capture the marina arch with tee framing.",
        status: "approved",
        outputStatus: "not-run",
        capturedAt: null,
        lastBuildRef: null
      },
      {
        screenshotId: "shot-nightfall-finale",
        label: "Nightfall Finale",
        holeRef: "hole-18",
        previewPathRef: "preview-flyover-hole-18",
        framingNote: "Use Lumina Bay Ring as the payoff backdrop.",
        status: "planned",
        outputStatus: "not-run",
        capturedAt: null,
        lastBuildRef: null
      }
    ],
    showcaseSequences: buildShowcaseSequences(),
    validationState: {
      healthState: "Blocked",
      readiness: "blocked",
      openIssueCount: 7
    },
    performanceSnapshot: {
      geometryEstimate: 78,
      textureMemoryEstimateGb: 4.6,
      materialComplexity: 74,
      animationComplexity: 66,
      sceneDensity: 81,
      visibilityComplexity: 76
    },
    performanceState: {
      activeProfileId: "community-safe",
      status: "watch",
      topRisk: "Scene density and visibility complexity are trending above Community Safe targets."
    },
    packageBuilds: [
      {
        buildId: "build-001",
        profileId: "showcase",
        createdAt: "2026-04-13T00:00:00.000Z",
        status: "draft",
        executionState: "not-run",
        executionMode: "package-owned",
        runtimeVerificationState: "preview-only",
        runtimeVerificationSummary:
          "Native runtime has not been verified for this seed draft yet.",
        runtimeVerificationEvidence: [],
        progressPercent: 0,
        startedAt: null,
        completedAt: null,
        outputDirectory: null,
        artifactCount: 0,
        diagnosticsSummary: "Packaging blocked by unresolved gameplay and preview issues.",
        artifactRefs: [
          {
            artifactId: "artifact-manifest",
            label: "Project Manifest Snapshot",
            artifactType: "manifest",
            relativePath: "exports/project.manifest.json",
            status: "generated",
            generatedAt: "2026-04-13T00:00:00.000Z",
            sizeBytes: 1280,
            note: "Current manifest snapshot is available for review."
          },
          {
            artifactId: "artifact-course-package",
            label: "GSPro Course Package",
            artifactType: "course-package",
            relativePath: "exports/eclipse-harbor-course.pkg",
            status: "missing",
            generatedAt: null,
            sizeBytes: null,
            note: "Blocked until gameplay and preview readiness are cleared."
          }
        ],
        executionLogs: [],
        failureReason: null,
        retryCount: 0,
        releaseRecordRef: "release-private-001",
        bridgeSummary: "Managed packaging bridge has not been executed for this draft yet.",
        bridgeAdapterId: null,
        releaseRecipe: null,
        checklist: [],
        result: null,
        notes: "First candidate is intentionally blocked to force readiness review."
      }
    ],
    releaseRecords: [
      {
        releaseId: "release-private-001",
        versionLabel: "0.1.0-alpha",
        createdAt: "2026-04-13T00:00:00.000Z",
        channel: "private",
        status: "draft",
        packageBuildRef: "build-001",
        releaseRecipeRef: null,
        artifactManifestRef: null,
        previewReady: false,
        creditsComplete: true,
        sourceAuditComplete: false,
        publishedAt: null,
        publicSafe: false,
        notes: "Internal foundation checkpoint.",
        courseDescription: "A premium theme-park-inspired harbor course built as the first Course Creator OS flagship.",
        creditsSummary: "Course Creator OS foundation team.",
        mediaChecklist: ["Preview hero shot drafted", "Flyover opener approved for internal review"],
        releaseNotes: ["Initial foundation checkpoint", "Packaging and publish systems still in active build"]
      }
    ],
    packagingState: {
      latestBuildId: "build-001",
      readiness: "blocked",
      releaseCandidateReady: false
    },
    snapshots: [
      {
        snapshotId: "snapshot-foundation",
        projectId: "cco-eclipse-harbor",
        label: "Foundation Bootstrap",
        createdAt: "2026-04-13T00:00:00.000Z",
        source: "manual",
        posture: "stable",
        summary: "Initial full-product foundation scaffold.",
        changeSummary: "Created the first production-grade repository and shell structure.",
        changeSummaryRefs: ["change-foundation-bootstrap"],
        bundleAvailable: false
      },
      {
        snapshotId: "snapshot-preview-package-pass",
        projectId: "cco-eclipse-harbor",
        label: "Preview and Package Pass",
        createdAt: "2026-04-13T12:00:00.000Z",
        source: "package-candidate",
        posture: "watch",
        summary: "Preview, packaging, and publish foundations pushed into the product shell.",
        changeSummary: "Added preview, package, and publish modules with candidate-readiness scaffolds.",
        changeSummaryRefs: ["change-preview-package-pass"],
        bundleAvailable: false
      }
    ],
    snapshotBundles: [],
    restorePoints: [
      {
        restorePointId: "restore-foundation-safe-return",
        label: "Foundation Safe Return",
        createdAt: "2026-04-13T00:00:00.000Z",
        sourceSnapshotId: "snapshot-foundation",
        state: "recommended",
        reason: "safe-edit-return",
        summary: "Stable checkpoint before deeper workflow and packaging work.",
        riskNotes: [],
        changeSummaryRefs: ["change-foundation-bootstrap"]
      },
      {
        restorePointId: "restore-preview-package-review",
        label: "Preview and Package Review",
        createdAt: "2026-04-13T12:05:00.000Z",
        sourceSnapshotId: "snapshot-preview-package-pass",
        state: "available",
        reason: "package-candidate",
        summary: "Use this checkpoint before revising release-facing flows or packaging logic.",
        riskNotes: ["Packaging posture is still blocked by unresolved gameplay and preview issues."],
        changeSummaryRefs: ["change-preview-package-pass"]
      }
    ],
    changeSummaries: [
      {
        changeSummaryId: "change-foundation-bootstrap",
        title: "Foundation shell established",
        summary: "The monorepo, shell, governance docs, and major workspace routes were created.",
        createdAt: "2026-04-13T00:00:00.000Z",
        impact: "high",
        moduleRefs: ["create", "plan", "agent-command"],
        relatedSnapshotId: "snapshot-foundation",
        note: "This is the first reliable checkpoint for the codebase."
      },
      {
        changeSummaryId: "change-preview-package-pass",
        title: "Release-facing workflow foundations added",
        summary: "Preview, package, and publish layers now have first-class UI and domain models.",
        createdAt: "2026-04-13T12:00:00.000Z",
        impact: "moderate",
        moduleRefs: ["preview", "package", "publish"],
        relatedSnapshotId: "snapshot-preview-package-pass",
        note: "Packaging is still blocked, but the recovery and release path is now visible."
      }
    ],
    versioningState: {
      latestSnapshotId: "snapshot-preview-package-pass",
      latestRestorePointId: "restore-preview-package-review",
      snapshotCount: 2,
      restorePointCount: 2,
      restoreAvailable: true,
      autosaveProtected: true,
      recoveryConfidence: "watch",
      lastRecoveryCheckAt: "2026-04-13T12:10:00.000Z"
    },
    backgroundJobs: [
      {
        jobId: "job-import-normalization",
        label: "Import normalization queue",
        area: "Asset Library",
        status: "running",
        progress: 0.42,
        startedAt: "2026-04-13T00:10:00.000Z",
        updatedAt: "2026-04-13T00:20:00.000Z",
        detail: "Normalizing 2 assets and generating scale metadata."
      },
      {
        jobId: "job-preview-registry",
        label: "Preview coverage audit",
        area: "Preview Studio",
        status: "queued",
        progress: 0,
        startedAt: null,
        updatedAt: "2026-04-13T00:20:00.000Z",
        detail: "Waiting for flyover and minimap coverage refresh."
      }
    ]
  };
}
