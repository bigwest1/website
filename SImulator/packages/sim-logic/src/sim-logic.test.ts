import { describe, expect, it } from "vitest";

import { createHoleDraft } from "@course-creator-os/hole-planner";
import type { PreviewPath } from "@course-creator-os/preview";
import {
  createFairwayCorridor,
  createGreenZone,
  createOutOfBoundsZone,
  createPlacementLayer,
  createPlayRouteEnvelope,
  createRoutingNode,
  createRoutingPath,
  createRoutingSegment,
  createSceneAuthoringState,
  createSceneCollection,
  createSceneObject,
  createTeeZone,
  createVisibilityCorridor
} from "@course-creator-os/scene-authoring";

import { createSimulatorLogicConfig } from "./create";
import { synchronizeSimulatorLogicConfig } from "./services";
import { summarizeSimulatorLogic } from "./summary";

function createSpatialSceneAuthoring() {
  return createSceneAuthoringState({
    activeCollectionId: "collection-main",
    sceneCollections: [
      createSceneCollection({
        collectionId: "collection-main",
        name: "Main Scene",
        description: "Primary course collection.",
        defaultLayerId: "layer-gameplay",
        routeSummary: "Opening routing spine."
      })
    ],
    placementLayers: [
      createPlacementLayer({
        layerId: "layer-gameplay",
        name: "Gameplay",
        description: "Gameplay anchors and routing.",
        colorToken: "accent.primary"
      })
    ],
    sceneObjects: [
      createSceneObject({
        sceneObjectId: "scene-hole-1-tee-anchor",
        collectionId: "collection-main",
        name: "Hole 1 Tee Anchor",
        category: "gameplay-course-object",
        objectType: "tee-anchor",
        placementLayerId: "layer-gameplay",
        binding: {
          bindingType: "hole",
          entityId: "hole-1",
          exportRole: "gameplay-critical"
        },
        transform: {
          position: { x: 0, y: 0, z: 0 }
        }
      })
    ],
    teeZones: [
      createTeeZone({
        teeZoneId: "tee-zone-hole-1-member",
        holeId: "hole-1",
        boundary: [
          { x: -4, y: 0, z: -3 },
          { x: 4, y: 0, z: -3 },
          { x: 4, y: 0, z: 3 },
          { x: -4, y: 0, z: 3 }
        ],
        teeSetRefs: ["tee-member"],
        facingDirectionDegrees: 22
      })
    ],
    greenZones: [
      createGreenZone({
        greenZoneId: "green-zone-hole-1",
        holeId: "hole-1",
        boundary: [
          { x: 150, y: 0, z: -8 },
          { x: 164, y: 0, z: -8 },
          { x: 164, y: 0, z: 8 },
          { x: 150, y: 0, z: 8 }
        ],
        targetPinCapacity: 4,
        approachNodeId: "routing-node-hole-1-approach"
      })
    ],
    routingNodes: [
      createRoutingNode({
        routingNodeId: "routing-node-hole-1-tee",
        holeId: "hole-1",
        kind: "tee",
        label: "Tee",
        position: { x: 0, y: 0, z: 0 },
        linkedZoneId: "tee-zone-hole-1-member"
      }),
      createRoutingNode({
        routingNodeId: "routing-node-hole-1-approach",
        holeId: "hole-1",
        kind: "approach",
        label: "Approach",
        position: { x: 120, y: 0, z: 0 },
        linkedZoneId: "green-zone-hole-1"
      }),
      createRoutingNode({
        routingNodeId: "routing-node-hole-1-green",
        holeId: "hole-1",
        kind: "green-center",
        label: "Green",
        position: { x: 156, y: 0, z: 0 },
        linkedZoneId: "green-zone-hole-1"
      }),
      createRoutingNode({
        routingNodeId: "routing-node-hole-1-preview",
        holeId: "hole-1",
        kind: "preview-anchor",
        label: "Preview Anchor",
        position: { x: 80, y: 14, z: -24 }
      })
    ],
    routingSegments: [
      createRoutingSegment({
        routingSegmentId: "routing-segment-hole-1-tee-to-approach",
        holeId: "hole-1",
        fromNodeId: "routing-node-hole-1-tee",
        toNodeId: "routing-node-hole-1-approach",
        kind: "primary-shot",
        controlLine: [
          { x: 0, y: 0, z: 0 },
          { x: 60, y: 0, z: 4 },
          { x: 120, y: 0, z: 0 }
        ],
        visibilityCorridorId: "visibility-corridor-hole-1"
      }),
      createRoutingSegment({
        routingSegmentId: "routing-segment-hole-1-approach-to-green",
        holeId: "hole-1",
        fromNodeId: "routing-node-hole-1-approach",
        toNodeId: "routing-node-hole-1-green",
        kind: "approach",
        controlLine: [
          { x: 120, y: 0, z: 0 },
          { x: 140, y: 0, z: 2 },
          { x: 156, y: 0, z: 0 }
        ],
        visibilityCorridorId: "visibility-corridor-hole-1"
      })
    ],
    routingPaths: [
      createRoutingPath({
        routingPathId: "routing-path-hole-1",
        holeId: "hole-1",
        name: "Hole 1 Primary",
        teeNodeId: "routing-node-hole-1-tee",
        greenNodeId: "routing-node-hole-1-green",
        nodeIds: [
          "routing-node-hole-1-tee",
          "routing-node-hole-1-approach",
          "routing-node-hole-1-green"
        ],
        segmentIds: [
          "routing-segment-hole-1-tee-to-approach",
          "routing-segment-hole-1-approach-to-green"
        ],
        routeStatus: "connected"
      })
    ],
    fairwayCorridors: [
      createFairwayCorridor({
        fairwayCorridorId: "fairway-corridor-hole-1",
        holeId: "hole-1",
        routingPathId: "routing-path-hole-1",
        centerline: [
          { x: 0, y: 0, z: 0 },
          { x: 90, y: 0, z: 2 },
          { x: 156, y: 0, z: 0 }
        ],
        averageWidthMeters: 32
      })
    ],
    visibilityCorridors: [
      createVisibilityCorridor({
        visibilityCorridorId: "visibility-corridor-hole-1",
        holeId: "hole-1",
        fromNodeId: "routing-node-hole-1-tee",
        toNodeId: "routing-node-hole-1-green",
        corridorLine: [
          { x: 0, y: 0, z: 0 },
          { x: 156, y: 0, z: 0 }
        ]
      })
    ],
    playRouteEnvelopes: [
      createPlayRouteEnvelope({
        playRouteEnvelopeId: "play-route-envelope-hole-1",
        holeId: "hole-1",
        routingPathId: "routing-path-hole-1",
        boundary: [
          { x: -8, y: 0, z: -18 },
          { x: 168, y: 0, z: -18 },
          { x: 168, y: 0, z: 18 },
          { x: -8, y: 0, z: 18 }
        ]
      })
    ],
    outOfBoundsZones: [
      createOutOfBoundsZone({
        outOfBoundsZoneId: "oob-zone-hole-1-right",
        holeId: "hole-1",
        sideLabel: "Right",
        boundary: [
          { x: 40, y: 0, z: 24 },
          { x: 168, y: 0, z: 24 },
          { x: 168, y: 0, z: 50 },
          { x: 40, y: 0, z: 50 }
        ]
      })
    ]
  });
}

describe("sim-logic", () => {
  it("creates preview metadata and derived coverage from hole and preview data", () => {
    const holes = [
      {
        ...createHoleDraft({ number: 1, teeSetRefs: ["tee-member"], pinSetRefs: ["pins-daily"] }),
        previewRefs: ["preview-minimap-hole-1", "preview-flyover-hole-1"]
      },
      createHoleDraft({ number: 2, teeSetRefs: ["tee-member"], pinSetRefs: ["pins-daily"] })
    ];
    const previewPaths: PreviewPath[] = [
      {
        previewPathId: "preview-minimap-hole-1",
        name: "Hole 1 Minimap",
        previewType: "minimap",
        holeRefs: ["hole-1"],
        readinessState: "ready",
        outputStatus: "not-run",
        lastBuildRef: null,
        note: "Ready minimap"
      },
      {
        previewPathId: "preview-flyover-hole-1",
        name: "Hole 1 Flyover",
        previewType: "flyover",
        holeRefs: ["hole-1"],
        readinessState: "ready",
        outputStatus: "not-run",
        lastBuildRef: null,
        note: "Ready flyover"
      }
    ];

    const config = createSimulatorLogicConfig({
      holes,
      teeSets: [
        {
          teeSetId: "tee-member",
          name: "Member",
          color: "blue",
          totalYardage: 6800,
          defaultTee: true,
          holeYardages: { "hole-1": 360, "hole-2": 400 }
        }
      ],
      pinSets: [
        {
          pinSetId: "pins-daily",
          name: "Daily",
          difficulty: "standard",
          enabledHoleIds: ["hole-1", "hole-2"]
        }
      ],
      surfaceProfiles: [
        {
          surfaceId: "surface-fairway",
          name: "Fairway",
          type: "fairway",
          physicsNote: "Baseline fairway",
          playable: true
        },
        {
          surfaceId: "surface-green",
          name: "Green",
          type: "green",
          physicsNote: "Baseline green",
          playable: true
        }
      ],
      hazardProfiles: [],
      dropZones: [],
      previewPaths
    });

    expect(config.minimapMetadata[0]?.previewPathRef).toBe("preview-minimap-hole-1");
    expect(config.flyoverMetadata[0]?.previewPathRef).toBe("preview-flyover-hole-1");
    expect(config.minimapCoverage).toBe(0.5);
    expect(config.flyoverCoverage).toBe(0.5);
  });

  it("synchronizes hole sequence and profile numbering after hole order changes", () => {
    const holes = [
      createHoleDraft({ number: 2, teeSetRefs: ["tee-member"], pinSetRefs: ["pins-daily"] }),
      createHoleDraft({ number: 1, teeSetRefs: ["tee-member"], pinSetRefs: ["pins-daily"] })
    ];
    holes[0]!.holeId = "hole-2";
    holes[1]!.holeId = "hole-1";

    const config = createSimulatorLogicConfig({
      holes,
      teeSets: [
        {
          teeSetId: "tee-member",
          name: "Member",
          color: "blue",
          totalYardage: 6800,
          defaultTee: true,
          holeYardages: { "hole-1": 360, "hole-2": 400 }
        }
      ],
      pinSets: [
        {
          pinSetId: "pins-daily",
          name: "Daily",
          difficulty: "standard",
          enabledHoleIds: ["hole-1", "hole-2"]
        }
      ],
      surfaceProfiles: [
        {
          surfaceId: "surface-fairway",
          name: "Fairway",
          type: "fairway",
          physicsNote: "Baseline fairway",
          playable: true
        },
        {
          surfaceId: "surface-green",
          name: "Green",
          type: "green",
          physicsNote: "Baseline green",
          playable: true
        }
      ],
      hazardProfiles: [],
      dropZones: []
    });

    const synchronized = synchronizeSimulatorLogicConfig({
      holes: holes.slice().reverse(),
      teeSets: config.teeSets,
      pinSets: config.pinSets,
      surfaceProfiles: config.surfaceProfiles,
      hazardProfiles: config.hazardProfiles,
      dropZones: config.dropZones,
      currentConfig: config
    });

    expect(synchronized.holeSequence).toEqual(["hole-1", "hole-2"]);
    expect(synchronized.holePlayProfiles.map((profile) => profile.holeNumber)).toEqual([1, 2]);
  });

  it("summarizes simulator logic completeness into segments", () => {
    const config = createSimulatorLogicConfig({
      holes: [createHoleDraft({ number: 1, teeSetRefs: ["tee-member"], pinSetRefs: ["pins-daily"] })],
      teeSets: [
        {
          teeSetId: "tee-member",
          name: "Member",
          color: "blue",
          totalYardage: 360,
          defaultTee: true,
          holeYardages: { "hole-1": 360 }
        }
      ],
      pinSets: [
        {
          pinSetId: "pins-daily",
          name: "Daily",
          difficulty: "standard",
          enabledHoleIds: ["hole-1"]
        }
      ],
      surfaceProfiles: [
        {
          surfaceId: "surface-fairway",
          name: "Fairway",
          type: "fairway",
          physicsNote: "Baseline fairway",
          playable: true
        },
        {
          surfaceId: "surface-green",
          name: "Green",
          type: "green",
          physicsNote: "Baseline green",
          playable: true
        }
      ],
      hazardProfiles: [],
      dropZones: []
    });

    const summary = summarizeSimulatorLogic(config);

    expect(summary.holePlayProfileCount).toBe(1);
    expect(summary.segments).toHaveLength(5);
    expect(summary.segments.some((segment) => segment.label === "Spatial Simulator Bindings")).toBe(true);
    expect(summary.completenessScore).toBeGreaterThan(0);
  });

  it("binds simulator-critical entities to spatial scene authoring geometry", () => {
    const sceneAuthoring = createSpatialSceneAuthoring();

    const config = createSimulatorLogicConfig({
      holes: [createHoleDraft({ number: 1, teeSetRefs: ["tee-member"], pinSetRefs: ["pins-daily"] })],
      teeSets: [
        {
          teeSetId: "tee-member",
          name: "Member",
          color: "blue",
          totalYardage: 360,
          defaultTee: true,
          holeYardages: { "hole-1": 360 }
        }
      ],
      pinSets: [
        {
          pinSetId: "pins-daily",
          name: "Daily",
          difficulty: "standard",
          enabledHoleIds: ["hole-1"]
        }
      ],
      surfaceProfiles: [
        {
          surfaceId: "surface-fairway",
          name: "Fairway",
          type: "fairway",
          physicsNote: "Baseline fairway",
          playable: true
        },
        {
          surfaceId: "surface-green",
          name: "Green",
          type: "green",
          physicsNote: "Baseline green",
          playable: true
        }
      ],
      hazardProfiles: [],
      dropZones: [],
      sceneAuthoring,
      outOfBoundsConfigured: true
    });

    expect(config.holePlayProfiles[0]?.playRouteEnvelopeRef?.entityId).toBe("play-route-envelope-hole-1");
    expect(config.holePlayProfiles[0]?.fairwayCorridorRef?.entityId).toBe("fairway-corridor-hole-1");
    expect(config.teeSpatialBindings[0]?.readinessState).toBe("ready");
    expect(config.pinSpatialBindings[0]?.readinessState).toBe("ready");
    expect(config.outOfBoundsSpatialBindings[0]?.boundaryRefs).toHaveLength(1);
    expect(config.previewAnchorBindings.some((binding) => binding.readinessState === "ready")).toBe(true);
    expect(config.minimapMetadata[0]?.frameAnchorRef?.entityId).toBe("green-zone-hole-1");
    expect(config.flyoverMetadata[0]?.startAnchorRef?.entityId).toBe("routing-node-hole-1-preview");
  });
});
