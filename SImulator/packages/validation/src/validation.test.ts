import { describe, expect, it } from "vitest";

import { createSeedProject } from "@course-creator-os/project-model";
import {
  createOutOfBoundsZone,
  createPlayRouteEnvelope,
  createRoutingNode,
  createRoutingPath,
  createRoutingSegment,
  createSceneObject,
  createSceneSpatialReference,
  createTeeZone,
  createVisibilityCorridor
} from "@course-creator-os/scene-authoring";

import { validationValidators } from "./validators";
import { evaluateValidationReport } from "./index";

function resolveSpatialFoundation(project: ReturnType<typeof createSeedProject>) {
  project.sceneAuthoring.teeZones = project.holes.flatMap((hole) =>
    hole.teeSetRefs.map((teeSetId, index) =>
      createTeeZone({
        teeZoneId: `tee-zone-${hole.holeId}-${teeSetId}`,
        holeId: hole.holeId,
        teeSetRefs: [teeSetId],
        boundary: [
          { x: hole.number * 20 + index * 2, y: 0, z: -4 },
          { x: hole.number * 20 + 8 + index * 2, y: 0, z: -4 },
          { x: hole.number * 20 + 8 + index * 2, y: 0, z: 4 },
          { x: hole.number * 20 + index * 2, y: 0, z: 4 }
        ],
        facingDirectionDegrees: 18
      }),
    ),
  );

  project.sceneAuthoring.outOfBoundsZones = project.holes.map((hole) =>
    createOutOfBoundsZone({
      outOfBoundsZoneId: `oob-zone-${hole.holeId}`,
      holeId: hole.holeId,
      sideLabel: "Right",
      boundary: [
        { x: hole.number * 20 + 20, y: 0, z: 24 },
        { x: hole.number * 20 + 80, y: 0, z: 24 },
        { x: hole.number * 20 + 80, y: 0, z: 48 },
        { x: hole.number * 20 + 20, y: 0, z: 48 }
      ]
    }),
  );

  project.sceneAuthoring.routingNodes = project.holes.flatMap((hole) => [
    createRoutingNode({
      routingNodeId: `routing-node-${hole.holeId}-tee`,
      holeId: hole.holeId,
      kind: "tee",
      label: `Hole ${hole.number} Tee`,
      position: { x: hole.number * 20, y: 0, z: 0 }
    }),
    createRoutingNode({
      routingNodeId: `routing-node-${hole.holeId}-green`,
      holeId: hole.holeId,
      kind: "green-center",
      label: `Hole ${hole.number} Green`,
      position: { x: hole.number * 20 + 140, y: 0, z: 0 }
    })
  ]);

  project.sceneAuthoring.routingSegments = project.holes.map((hole) =>
    createRoutingSegment({
      routingSegmentId: `routing-segment-${hole.holeId}`,
      holeId: hole.holeId,
      fromNodeId: `routing-node-${hole.holeId}-tee`,
      toNodeId: `routing-node-${hole.holeId}-green`,
      kind: "primary-shot",
      controlLine: [
        { x: hole.number * 20, y: 0, z: 0 },
        { x: hole.number * 20 + 70, y: 0, z: 0 },
        { x: hole.number * 20 + 140, y: 0, z: 0 }
      ]
    }),
  );

  project.sceneAuthoring.routingPaths = project.holes.map((hole) =>
    createRoutingPath({
      routingPathId: `routing-path-${hole.holeId}`,
      holeId: hole.holeId,
      name: `Hole ${hole.number} Primary`,
      teeNodeId: `routing-node-${hole.holeId}-tee`,
      greenNodeId: `routing-node-${hole.holeId}-green`,
      nodeIds: [`routing-node-${hole.holeId}-tee`, `routing-node-${hole.holeId}-green`],
      segmentIds: [`routing-segment-${hole.holeId}`],
      routeStatus: "connected"
    }),
  );

  project.simulatorLogic.teeSpatialBindings = project.simulatorLogic.teeSpatialBindings.map((binding) => ({
    ...binding,
    teeZoneRef: createSceneSpatialReference({
      entityType: "tee-zone",
      entityId: `tee-zone-${binding.holeId}-${binding.teeSetId}`,
      holeId: binding.holeId
    }),
    sceneObjectRef: createSceneSpatialReference({
      entityType: "tee-zone",
      entityId: `tee-zone-${binding.holeId}-${binding.teeSetId}`,
      holeId: binding.holeId
    }),
    readinessState: "ready"
  }));

  project.simulatorLogic.outOfBoundsSpatialBindings = project.simulatorLogic.outOfBoundsSpatialBindings.map(
    (binding) => ({
      ...binding,
      boundaryRefs: [
        createSceneSpatialReference({
          entityType: "out-of-bounds-zone",
          entityId: `oob-zone-${binding.holeId}`,
          holeId: binding.holeId
        })
      ],
      readinessState: "ready"
    }),
  );
}

describe("evaluateValidationReport", () => {
  it("blocks readiness when critical simulator logic is incomplete", () => {
    const project = createSeedProject();
    const report = evaluateValidationReport(project);

    expect(report.readiness).toBe("blocked");
    expect(report.issueCounts.critical).toBeGreaterThan(0);
    expect(report.results).toHaveLength(validationValidators.length);
    expect(report.results.map((result) => result.validatorId)).toContain("simulator-logic");
    expect(report.results[0]?.readiness).toBe("blocked");
  });

  it("improves readiness when major foundation gaps are resolved", () => {
    const project = createSeedProject();
    resolveSpatialFoundation(project);
    project.simulatorLogic.outOfBoundsConfigured = true;
    project.teeSets.push({
      teeSetId: "tee-green",
      name: "Forward",
      color: "green",
      totalYardage: 6020,
      defaultTee: false,
      holeYardages: Object.fromEntries(Array.from({ length: 18 }, (_, index) => [`hole-${index + 1}`, 290 + index * 7]))
    });
    project.simulatorLogic.teeSets = project.teeSets;
    project.dropZones.push({
      dropZoneId: "drop-zone-17",
      holeId: "hole-17",
      label: "Nightfall rescue tee",
      triggerHazardId: "hazard-water-17",
      note: "Protects pace and fairness."
    });
    project.holes.forEach((hole) => {
      hole.playabilityStatus = "ready";
    });
    project.simulatorLogic.holePlayProfiles = project.simulatorLogic.holePlayProfiles.map((profile) => ({
      ...profile,
      lineOfPlayStatus: "clear",
      shotReadabilityStatus: "clear"
    }));
    project.eventSequences = project.eventSequences.map((event) => ({
      ...event,
      state: "ready"
    }));
    project.previewPaths.forEach((path) => {
      path.readinessState = "ready";
    });
    project.packageBuilds[0]!.status = "ready";
    project.releaseRecords.push({
      releaseId: "release-public-safe-001",
      versionLabel: "0.1.0-beta",
      createdAt: "2026-04-13T00:00:00.000Z",
      channel: "community",
      status: "candidate",
      packageBuildRef: project.packageBuilds[0]!.buildId,
      releaseRecipeRef: "recipe-build-001",
      artifactManifestRef: "exports/gspro-release-runs/build-001/manifest/artifact-manifest.json",
      previewReady: true,
      creditsComplete: true,
      sourceAuditComplete: true,
      publishedAt: null,
      publicSafe: true,
      notes: "Public-safe validation satisfied.",
      courseDescription: "Public-safe validation candidate.",
      creditsSummary: "Course Creator OS team.",
      mediaChecklist: ["Hero screenshots approved"],
      releaseNotes: ["Validation satisfied for public-safe posture"]
    });

    const report = evaluateValidationReport(project);

    expect(report.issueCounts.critical).toBe(0);
    expect(report.readiness).toBe("watch");
    expect(report.results.every((result) => result.issueCounts.critical === 0)).toBe(true);
  });

  it("prioritizes next actions from the highest-severity open issues first", () => {
    const project = createSeedProject();
    project.holes.forEach((hole) => {
      hole.playabilityStatus = "ready";
    });
    project.simulatorLogic.holePlayProfiles = project.simulatorLogic.holePlayProfiles.map((profile) => ({
      ...profile,
      lineOfPlayStatus: "clear",
      shotReadabilityStatus: "clear"
    }));
    project.eventSequences = project.eventSequences.map((event) => ({
      ...event,
      state: "ready"
    }));
    project.manifest.holeCount = 17;

    const report = evaluateValidationReport(project);

    expect(report.nextActions[0]?.moduleKey).toBe("create");
    expect(report.nextActions[0]?.reason).toContain("Regenerate the manifest");
  });

  it("keeps packaging blocked when the build is ready but export geometry is still weak", () => {
    const project = createSeedProject();
    project.packageBuilds[0]!.status = "ready";

    const report = evaluateValidationReport(project);
    const packagingResult = report.results.find((result) => result.validatorId === "packaging-readiness");

    expect(packagingResult).toBeDefined();
    expect(packagingResult?.readiness).toBe("watch");
    expect(packagingResult?.issues.some((issue) => issue.issueId === "packaging-export-geometry")).toBe(true);
  });

  it("surfaces playability-critical issues when blocked readability and event conflicts exist", () => {
    const project = createSeedProject();

    project.simulatorLogic.holePlayProfiles[0] = {
      ...project.simulatorLogic.holePlayProfiles[0]!,
      lineOfPlayStatus: "blocked",
      shotReadabilityStatus: "blocked"
    };
    project.eventSequences[0] = {
      ...project.eventSequences[0]!,
      state: "conflict",
      linkedHoleRefs: ["hole-1"]
    };

    const report = evaluateValidationReport(project);
    const playabilityResult = report.results.find((result) => result.validatorId === "playability");

    expect(playabilityResult).toBeDefined();
    expect(playabilityResult?.readiness).toBe("blocked");
    expect(playabilityResult?.issues.some((issue) => issue.issueId === "playability-line-of-play-blocked")).toBe(true);
    expect(playabilityResult?.issues.some((issue) => issue.issueId === "playability-event-conflicts")).toBe(true);
  });

  it("surfaces spatial simulator issues when anchors and geometry are missing", () => {
    const project = createSeedProject();
    const report = evaluateValidationReport(project);
    const simulatorLogicResult = report.results.find((result) => result.validatorId === "simulator-logic");

    expect(simulatorLogicResult).toBeDefined();
    expect(simulatorLogicResult?.issues.some((issue) => issue.issueId === "logic-tee-spatial-anchors")).toBe(true);
    expect(simulatorLogicResult?.issues.some((issue) => issue.issueId === "logic-oob-geometry")).toBe(false);

    project.simulatorLogic.outOfBoundsConfigured = true;
    const configuredReport = evaluateValidationReport(project);
    const configuredSimResult = configuredReport.results.find((result) => result.validatorId === "simulator-logic");

    expect(configuredSimResult?.issues.some((issue) => issue.issueId === "logic-oob-geometry")).toBe(true);
  });

  it("surfaces geometry-backed playability and simulator conflicts after spatial analysis is wired in", () => {
    const project = createSeedProject();
    resolveSpatialFoundation(project);
    project.sceneAuthoring.sceneObjects.push(
      createSceneObject({
        sceneObjectId: "scene-play-blocker-1",
        collectionId: project.sceneAuthoring.activeCollectionId ?? "scene-collection-main",
        name: "Maintenance Blocker",
        category: "structure",
        objectType: "service-wall",
        placementLayerId: project.sceneAuthoring.placementLayers[0]!.layerId,
        transform: {
          position: { x: 90, y: 0, z: 0 }
        }
      }),
    );
    project.simulatorLogic.teeSpatialBindings[0] = {
      ...project.simulatorLogic.teeSpatialBindings[0]!,
      positionHint: { x: 200, y: 0, z: 200 },
      readinessState: "ready"
    };

    const report = evaluateValidationReport(project);
    const playabilityResult = report.results.find((result) => result.validatorId === "playability");
    const simulatorLogicResult = report.results.find((result) => result.validatorId === "simulator-logic");

    expect(playabilityResult?.issues.some((issue) => issue.issueId === "playability-spatial-line-of-play")).toBe(true);
    expect(simulatorLogicResult?.issues.some((issue) => issue.issueId === "logic-simulator-anchor-conflicts")).toBe(true);
  });

  it("surfaces richer occlusion and simulator-geometry quality diagnostics", () => {
    const project = createSeedProject();
    resolveSpatialFoundation(project);

    project.sceneAuthoring.visibilityCorridors = [
      createVisibilityCorridor({
        visibilityCorridorId: "visibility-corridor-hole-1",
        holeId: "hole-1",
        fromNodeId: "routing-node-hole-1-tee",
        toNodeId: "routing-node-hole-1-green",
        corridorLine: [
          { x: 20, y: 0, z: 0 },
          { x: 160, y: 0, z: 0 }
        ],
        minimumWidthMeters: 8
      })
    ];
    project.sceneAuthoring.playRouteEnvelopes = [
      createPlayRouteEnvelope({
        playRouteEnvelopeId: "play-route-envelope-hole-1",
        holeId: "hole-1",
        routingPathId: "routing-path-hole-1",
        boundary: [
          { x: 10, y: 0, z: -14 },
          { x: 170, y: 0, z: -14 },
          { x: 170, y: 0, z: 14 },
          { x: 10, y: 0, z: 14 }
        ]
      })
    ];
    project.sceneAuthoring.sceneObjects.push(
      createSceneObject({
        sceneObjectId: "scene-occluder-hole-1",
        collectionId: project.sceneAuthoring.activeCollectionId ?? "scene-collection-main",
        name: "Sightline Blocker",
        category: "structure",
        objectType: "show-building",
        placementLayerId: project.sceneAuthoring.placementLayers[0]!.layerId,
        transform: {
          position: { x: 88, y: 0, z: 4 }
        }
      }),
    );
    project.simulatorLogic.teeSpatialBindings[0] = {
      ...project.simulatorLogic.teeSpatialBindings[0]!,
      positionHint: null,
      readinessState: "ready"
    };

    const report = evaluateValidationReport(project);
    const playabilityResult = report.results.find((result) => result.validatorId === "playability");
    const simulatorLogicResult = report.results.find((result) => result.validatorId === "simulator-logic");

    expect(playabilityResult?.issues.some((issue) => issue.issueId === "playability-occlusion-risks")).toBe(true);
    expect(simulatorLogicResult?.issues.some((issue) => issue.issueId === "logic-tee-geometry-quality")).toBe(true);
  });
});
