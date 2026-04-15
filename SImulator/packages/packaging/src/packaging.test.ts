import { describe, expect, it } from "vitest";

import { createSeedProject } from "@course-creator-os/project-model";
import { createSceneSpatialReference } from "@course-creator-os/scene-authoring";

import {
  buildPackagingChecklist,
  summarizeCreatorDeliveryFlow,
  summarizeCreatorReleaseHandoff,
  summarizeFinalCreatorDelivery,
  summarizeFinalShareGateApproval,
  summarizePresentationPacketProofing,
  summarizePresentationShareDeliveryConfidence,
  summarizePresentationSharePacketFinalization,
  deriveExportGeometryReport,
  derivePackagingResult,
  summarizeReleaseExecutionState,
  summarizeReleaseConvergence,
  summarizeShareReadyPresentationHandoff,
  summarizeBuildArtifacts,
  summarizePublishReadiness
} from "./analysis";
import {
  createReleaseRecordFromBuild,
  executeReleaseCandidateBuild
} from "./execution";
import { executeManagedReleaseAutomation } from "./automation";

describe("packaging analysis", () => {
  it("marks readiness as blocked when checklist blockers exist", () => {
    const result = derivePackagingResult([
      {
        itemId: "validation",
        label: "Validation blockers",
        category: "validation",
        state: "blocked",
        summary: "Critical validation issues remain open.",
        actionPath: "/package",
        ownerModule: "package"
      }
    ]);

    expect(result.readiness).toBe("blocked");
    expect(result.blockerCount).toBe(1);
  });

  it("summarizes build artifact statuses", () => {
    const summary = summarizeBuildArtifacts({
      buildId: "build-1",
      profileId: "community-safe",
      createdAt: "2026-04-13T00:00:00.000Z",
      status: "candidate",
      executionState: "succeeded",
      executionMode: "repo-backed",
      runtimeVerificationState: "verified",
      runtimeVerificationSummary: "Host runtime verified.",
      runtimeVerificationEvidence: ["Desktop runtime bridge: verified"],
      progressPercent: 100,
      startedAt: "2026-04-13T00:00:00.000Z",
      completedAt: "2026-04-13T00:00:00.000Z",
      outputDirectory: "exports/gspro-release-runs/build-1",
      artifactCount: 2,
      diagnosticsSummary: "Candidate generated.",
      artifactRefs: [
        {
          artifactId: "artifact-1",
          label: "Course package",
          artifactType: "course-package",
          relativePath: "exports/course.pkg",
          status: "generated",
          generatedAt: "2026-04-13T00:00:00.000Z",
          sizeBytes: 256,
          note: ""
        },
        {
          artifactId: "artifact-2",
          label: "Release notes",
          artifactType: "release-notes",
          relativePath: "exports/release-notes.md",
          status: "missing",
          generatedAt: null,
          sizeBytes: null,
          note: ""
        }
      ],
      executionLogs: [],
      failureReason: null,
      retryCount: 0,
      releaseRecordRef: "release-1",
      bridgeSummary: "Managed runner completed successfully.",
      bridgeAdapterId: "package-build-runner",
      releaseRecipe: {
        recipeId: "recipe-build-1",
        recipeType: "gspro-community-safe",
        label: "GSPro Community Safe Release",
        profileId: "community-safe",
        exportTarget: "gspro-compatible",
        outputRoot: "exports/gspro-release-runs/build-1",
        diagnostics: [],
        steps: []
      },
      checklist: [],
      result: null,
      notes: ""
    });

    expect(summary.generatedCount).toBe(1);
    expect(summary.missingCount).toBe(1);
  });

  it("reads publish readiness from the latest release record", () => {
    const summary = summarizePublishReadiness([
      {
        releaseId: "release-1",
        versionLabel: "0.1.0",
        createdAt: "2026-04-13T00:00:00.000Z",
        channel: "community",
        status: "candidate",
        packageBuildRef: "build-1",
        releaseRecipeRef: "recipe-build-1",
        artifactManifestRef: "exports/gspro-release-runs/build-1/manifest/artifact-manifest.json",
        previewReady: true,
        creditsComplete: true,
        sourceAuditComplete: true,
        publishedAt: null,
        publicSafe: true,
        notes: "Public-safe candidate",
        courseDescription: "Premium harbor course.",
        creditsSummary: "Internal team",
        mediaChecklist: ["Hero screenshot approved"],
        releaseNotes: ["Initial candidate"]
      }
    ]);

    expect(summary.publicSafeRelease?.publicSafe).toBe(true);
    expect(summary.hasReleaseNotes).toBe(true);
  });

  it("surfaces export geometry blockers from authored simulator bindings", () => {
    const project = createSeedProject();
    project.simulatorLogic.teeSpatialBindings[0] = {
      ...project.simulatorLogic.teeSpatialBindings[0]!,
      teeZoneRef: createSceneSpatialReference({
        entityType: "tee-zone",
        entityId: "missing-tee-zone",
        holeId: project.simulatorLogic.teeSpatialBindings[0]!.holeId
      }),
      readinessState: "draft"
    };

    const report = deriveExportGeometryReport(project);

    expect(report.readiness).toBe("blocked");
    expect(report.diagnostics.some((diagnostic) => diagnostic.category === "tee-anchor")).toBe(true);
  });

  it("builds a checklist that includes export geometry posture", () => {
    const project = createSeedProject();
    const checklist = buildPackagingChecklist(project, []);

    expect(checklist.some((item) => item.itemId === "export-geometry")).toBe(true);
    expect(derivePackagingResult(checklist).readiness).toBe("blocked");
  });

  it("converges release readiness across package, preview, and publish layers", () => {
    const project = createSeedProject();
    const convergence = summarizeReleaseConvergence(project, []);

    expect(convergence.exportGeometry.readiness).toBe("blocked");
    expect(convergence.previewSummary.overallReadiness).toBe("blocked");
    expect(convergence.overallReadiness).toBe("blocked");
    expect(convergence.issues.some((issue) => issue.ownerModule === "preview")).toBe(true);
  });

  it("summarizes creator delivery flow from build, preview, and publish truth", () => {
    const project = createSeedProject();
    const delivery = summarizeCreatorDeliveryFlow(project);

    expect(delivery.overallReadiness).toBe("blocked");
    expect(delivery.issues.some((issue) => issue.issueId === "delivery-build-incomplete")).toBe(true);
    expect(delivery.deliveryReady).toBe(false);
  });

  it("summarizes creator release handoff from shared release truth", () => {
    const project = createSeedProject();
    const handoff = summarizeCreatorReleaseHandoff(project);

    expect(handoff.handoffReady).toBe(false);
    expect(handoff.missingHandoffCount).toBeGreaterThan(0);
    expect(handoff.issues.some((issue) => issue.issueId === "delivery-build-incomplete")).toBe(true);
  });

  it("summarizes share-ready presentation handoff from release and presentation truth", () => {
    const project = createSeedProject();
    const handoff = summarizeCreatorReleaseHandoff(project);
    const finalDelivery = summarizeFinalCreatorDelivery(project);
    const shareReady = summarizeShareReadyPresentationHandoff({
      releaseHandoff: handoff,
      finalDelivery,
      cameraPlayback: {
        overallState: "rough",
        abruptHoleCount: 2,
        polishGapHoleCount: 3,
        recommendedAction: "Calm the abrupt playback transitions before sharing."
      },
      landmarkActions: {
        overallState: "watch",
        blockedHoleCount: 1,
        correctiveHoleCount: 2,
        recommendedAction: "Reinforce landmark support around the weakest route views."
      },
      finalPresentation: {
        overallState: "watch",
        blockedHoleCount: 1,
        presentationGapHoleCount: 3,
        recommendedAction: "Tighten the remaining presentation gaps before handoff."
      }
    });

    expect(shareReady.overallReadiness).toBe("blocked");
    expect(shareReady.shareReady).toBe(false);
    expect(shareReady.issues.some((issue) => issue.issueId === "share-ready-camera-playback-rough")).toBe(true);
    expect(shareReady.nextActions[0]).toBeTruthy();
  });

  it("summarizes final presentation share-packet readiness from release truth", () => {
    const project = createSeedProject();
    const releaseExecution = summarizeReleaseExecutionState(project);
    const releaseHandoff = summarizeCreatorReleaseHandoff(project);
    const finalDelivery = summarizeFinalCreatorDelivery(project);
    const packet = summarizePresentationSharePacketFinalization({
      releaseExecution,
      releaseHandoff,
      finalDelivery,
      shareReadyPresentation: {
        overallReadiness: "watch",
        shareReady: false,
        previewAssetCount: 2,
        missingPresentationAssetCount: 1,
        blockedHoleCount: 1,
        polishGapHoleCount: 2,
        handoffAligned: false,
        issues: [],
        nextActions: ["Polish the remaining camera and landmark gaps before packaging the final share packet."]
      }
    });

    expect(packet.packetGenerated).toBe(false);
    expect(packet.packetReady).toBe(false);
    expect(packet.issues.some((issue) => issue.issueId === "presentation-share-packet-missing")).toBe(true);
    expect(packet.nextActions[0]).toBeTruthy();
  });

  it("summarizes presentation-share delivery confidence from packet, capture, and corridor truth", () => {
    const project = createSeedProject();
    const creatorDelivery = summarizeCreatorDeliveryFlow(project);
    const releaseHandoff = summarizeCreatorReleaseHandoff(project);
    const finalDelivery = summarizeFinalCreatorDelivery(project);
    const shareReadyPresentation = summarizeShareReadyPresentationHandoff({
      releaseHandoff,
      finalDelivery,
      cameraPlayback: {
        overallState: "watch",
        abruptHoleCount: 1,
        polishGapHoleCount: 2,
        recommendedAction: "Calm the remaining playback gaps before delivery."
      },
      landmarkActions: {
        overallState: "watch",
        blockedHoleCount: 1,
        correctiveHoleCount: 2,
        recommendedAction: "Reinforce landmark support around the weakest route views."
      },
      finalPresentation: {
        overallState: "watch",
        blockedHoleCount: 1,
        presentationGapHoleCount: 2,
        recommendedAction: "Tighten the remaining presentation gaps before handoff."
      }
    });
    const packet = summarizePresentationSharePacketFinalization({
      releaseExecution: summarizeReleaseExecutionState(project),
      releaseHandoff,
      finalDelivery,
      shareReadyPresentation
    });
    const packetProofing = summarizePresentationPacketProofing({
      releaseHandoff,
      finalDelivery,
      shareReadyPresentation,
      presentationSharePacket: packet,
      shotOrderApproval: {
        overallState: "watch",
        blockedHoleCount: 1,
        polishGapHoleCount: 1,
        recommendedAction: "Approve the remaining weak shot order before final share."
      },
      corridorSupportKits: {
        overallState: "watch",
        blockedHoleCount: 1,
        correctiveHoleCount: 2,
        recommendedAction: "Apply corridor support kits around the weakest presentation holes."
      }
    });
    const delivery = summarizePresentationShareDeliveryConfidence({
      creatorDelivery,
      releaseHandoff,
      finalDelivery,
      shareReadyPresentation,
      presentationSharePacket: packet,
      presentationPacketProofing: packetProofing,
      cameraCapture: {
        overallState: "watch",
        blockedHoleCount: 1,
        polishGapHoleCount: 2,
        recommendedAction: "Capture and approve the missing supporting hero views."
      },
      landmarkCorridors: {
        overallState: "rough",
        blockedHoleCount: 1,
        correctiveHoleCount: 2,
        recommendedAction: "Open and rebalance the weakest landmark corridors before delivery."
      },
      cameraSequencing: {
        overallState: "watch",
        blockedHoleCount: 1,
        polishGapHoleCount: 1,
        recommendedAction: "Sequence the remaining weak flyover and still-image beats before delivery."
      },
      landmarkStaging: {
        overallState: "watch",
        blockedHoleCount: 1,
        correctiveHoleCount: 1,
        recommendedAction: "Restage the weakest landmark corridors before trusting the share packet."
      },
      shotOrderApproval: {
        overallState: "watch",
        blockedHoleCount: 1,
        polishGapHoleCount: 1,
        recommendedAction: "Approve the remaining weak shot order before delivery."
      },
      shotVariantSets: {
        overallState: "watch",
        blockedHoleCount: 0,
        polishGapHoleCount: 1,
        recommendedAction: "Compose one more alternate reveal set before delivery."
      },
      variantShippingDecisions: {
        overallState: "watch",
        blockedHoleCount: 0,
        polishGapHoleCount: 1,
        recommendedAction: "Choose the last shipping variant before delivery."
      },
      variantShippingManifest: {
        overallState: "watch",
        blockedHoleCount: 0,
        polishGapHoleCount: 1,
        recommendedAction: "Complete the shipping manifest before delivery."
      },
      corridorSupportKits: {
        overallState: "watch",
        blockedHoleCount: 1,
        correctiveHoleCount: 2,
        recommendedAction: "Apply corridor support kits around the weakest delivery holes."
      },
      corridorKitComposition: {
        overallState: "watch",
        blockedHoleCount: 0,
        correctiveHoleCount: 1,
        recommendedAction: "Compose one more corridor bundle before final delivery."
      },
      corridorBundleLibraries: {
        overallState: "watch",
        correctiveHoleCount: 1,
        recommendedAction: "Promote the strongest corridor bundle to quick apply before delivery."
      },
      corridorBundleRecommendations: {
        overallState: "watch",
        correctiveHoleCount: 1,
        recommendedAction: "Apply the recommended corridor bundle before delivery."
      },
      cleanupReplayTimeline: {
        overallState: "watch",
        polishGapHoleCount: 1,
        recommendedAction: "Replay the cleanup timeline before delivery."
      }
    });

    expect(delivery.overallReadiness).toBe("blocked");
    expect(delivery.deliveryReady).toBe(false);
    expect(delivery.packetConfidenceState).toBe("blocked");
    expect(delivery.proofingState).toBe("blocked");
    expect(delivery.shotApprovalState).toBe("watch");
    expect(delivery.shotVariantState).toBe("watch");
    expect(delivery.variantShippingState).toBe("watch");
    expect(delivery.variantManifestState).toBe("watch");
    expect(delivery.corridorKitState).toBe("watch");
    expect(delivery.corridorBundleState).toBe("watch");
    expect(delivery.corridorLibraryState).toBe("watch");
    expect(delivery.corridorRecommendationState).toBe("watch");
    expect(delivery.cleanupReplayState).toBe("watch");
    expect(delivery.sequencingState).toBe("watch");
    expect(delivery.corridorStagingState).toBe("watch");
    expect(delivery.issues.some((issue) => issue.issueId === "presentation-share-delivery-corridors-rough")).toBe(
      true,
    );
    expect(delivery.nextActions[0]).toBeTruthy();
  });

  it("summarizes the final share gate from delivery, proofing, variants, and corridor bundles", () => {
    const gate = summarizeFinalShareGateApproval({
      releaseExecution: summarizeReleaseExecutionState(createSeedProject()),
      presentationShareDelivery: {
        overallReadiness: "watch",
        deliveryReady: false,
        trustedToShare: false,
        alignmentState: "watch",
        packetReady: false,
        packetConfidenceState: "watch",
        proofingState: "watch",
        shotApprovalState: "ready",
        shotVariantState: "watch",
        variantShippingState: "watch",
        variantManifestState: "watch",
        corridorKitState: "ready",
        corridorBundleState: "watch",
        corridorLibraryState: "watch",
        corridorRecommendationState: "watch",
        cleanupReplayState: "watch",
        sequencingState: "ready",
        corridorStagingState: "ready",
        assetCoverageState: "watch",
        shareableAssetCount: 4,
        deliveryGapCount: 2,
        blockedHoleCount: 1,
        polishGapHoleCount: 2,
        issues: [],
        nextActions: ["Tighten the remaining share gaps before approval."]
      },
      presentationPacketProofing: {
        overallReadiness: "watch",
        proofedReady: false,
        packetReady: false,
        packetGenerated: true,
        alignmentState: "watch",
        assetCoverageState: "watch",
        sequenceConfidenceState: "watch",
        corridorSupportState: "ready",
        proofingGapCount: 1,
        blockedHoleCount: 1,
        issues: [],
        nextActions: ["Proof the packet one more time before approval."]
      },
      presentationSharePacket: {
        overallReadiness: "watch",
        packetReady: false,
        packetGenerated: true,
        packetArtifactPath: "exports/presentation-share-packet.json",
        includedArtifactCount: 4,
        shareableAssetCount: 3,
        missingPacketRequirementCount: 1,
        blockedHoleCount: 1,
        polishGapHoleCount: 1,
        issues: [],
        nextActions: ["Regenerate the last missing packet asset before approval."]
      },
      shotVariantSets: {
        overallState: "watch",
        blockedHoleCount: 0,
        polishGapHoleCount: 1,
        recommendedAction: "Compose one more alternate reveal set before final approval."
      },
      variantShippingDecisions: {
        overallState: "watch",
        blockedHoleCount: 0,
        polishGapHoleCount: 1,
        recommendedAction: "Choose the last shipping variant before final approval."
      },
      variantShippingManifest: {
        overallState: "watch",
        blockedHoleCount: 0,
        polishGapHoleCount: 1,
        recommendedAction: "Complete the shipping manifest before final approval."
      },
      corridorKitComposition: {
        overallState: "watch",
        blockedHoleCount: 0,
        correctiveHoleCount: 1,
        recommendedAction: "Compose one more corridor bundle before final approval."
      },
      corridorBundleLibraries: {
        overallState: "watch",
        correctiveHoleCount: 1,
        recommendedAction: "Promote the strongest corridor bundle before final approval."
      },
      corridorBundleRecommendations: {
        overallState: "watch",
        correctiveHoleCount: 1,
        recommendedAction: "Apply the recommended corridor bundle before final approval."
      },
      cleanupReplayTimeline: {
        overallState: "watch",
        polishGapHoleCount: 1,
        recommendedAction: "Replay the cleanup timeline before final approval."
      }
    });

    expect(gate.gateApproved).toBe(false);
    expect(gate.gateState).toBe("watch");
    expect(gate.shotVariantState).toBe("watch");
    expect(gate.variantShippingState).toBe("watch");
    expect(gate.variantManifestState).toBe("watch");
    expect(gate.corridorBundleState).toBe("watch");
    expect(gate.corridorLibraryState).toBe("watch");
    expect(gate.corridorRecommendationState).toBe("watch");
    expect(gate.cleanupReplayState).toBe("watch");
    expect(gate.signoffArtifactState).toBe("missing");
    expect(gate.signoffLockState).toBe("missing");
    expect(gate.approvalGapCount).toBeGreaterThan(0);
    expect(gate.nextActions[0]).toBeTruthy();
  });

  it("summarizes presentation packet proofing before the final share gate", () => {
    const project = createSeedProject();
    const releaseExecution = summarizeReleaseExecutionState(project);
    const releaseHandoff = summarizeCreatorReleaseHandoff(project);
    const finalDelivery = summarizeFinalCreatorDelivery(project);
    const shareReadyPresentation = summarizeShareReadyPresentationHandoff({
      releaseHandoff,
      finalDelivery,
      cameraPlayback: {
        overallState: "watch",
        abruptHoleCount: 1,
        polishGapHoleCount: 1,
        recommendedAction: "Calm the remaining playback gap before proofing."
      },
      landmarkActions: {
        overallState: "watch",
        blockedHoleCount: 1,
        correctiveHoleCount: 1,
        recommendedAction: "Reinforce one more landmark support lane before proofing."
      },
      finalPresentation: {
        overallState: "watch",
        blockedHoleCount: 1,
        presentationGapHoleCount: 1,
        recommendedAction: "Tighten the remaining presentation gap before proofing."
      }
    });
    const packet = summarizePresentationSharePacketFinalization({
      releaseExecution,
      releaseHandoff,
      finalDelivery,
      shareReadyPresentation
    });
    const proofing = summarizePresentationPacketProofing({
      releaseHandoff,
      finalDelivery,
      shareReadyPresentation,
      presentationSharePacket: packet,
      shotOrderApproval: {
        overallState: "watch",
        blockedHoleCount: 1,
        polishGapHoleCount: 1,
        recommendedAction: "Approve the remaining shot order before proofing."
      },
      corridorSupportKits: {
        overallState: "rough",
        blockedHoleCount: 1,
        correctiveHoleCount: 2,
        recommendedAction: "Apply corridor support kits before trusting the packet."
      }
    });

    expect(proofing.overallReadiness).toBe("blocked");
    expect(proofing.proofedReady).toBe(false);
    expect(proofing.sequenceConfidenceState).toBe("watch");
    expect(proofing.corridorSupportState).toBe("blocked");
    expect(proofing.issues.some((issue) => issue.issueId === "presentation-packet-proofing-corridor-kits-rough")).toBe(true);
  });

  it("executes a candidate build and generates artifact records", () => {
    const project = createSeedProject();
    project.manifest.holeCount = 1;
    project.holes = project.holes.filter((hole) => hole.holeId === "hole-1");
    project.sceneAuthoring.routingPaths = project.sceneAuthoring.routingPaths.filter(
      (path) => path.holeId === "hole-1",
    );
    project.sceneAuthoring.fairwayCorridors = project.sceneAuthoring.fairwayCorridors.filter(
      (corridor) => corridor.holeId === "hole-1",
    );
    project.sceneAuthoring.greenZones = project.sceneAuthoring.greenZones.filter(
      (zone) => zone.holeId === "hole-1",
    );
    project.sceneAuthoring.teeZones = project.sceneAuthoring.teeZones.filter(
      (zone) => zone.holeId === "hole-1",
    );
    project.sceneAuthoring.outOfBoundsZones = project.sceneAuthoring.outOfBoundsZones.filter(
      (zone) => zone.holeId === "hole-1",
    );
    project.sceneAuthoring.visibilityCorridors = project.sceneAuthoring.visibilityCorridors.filter(
      (corridor) => corridor.holeId === "hole-1",
    );
    project.sceneAuthoring.playRouteEnvelopes = project.sceneAuthoring.playRouteEnvelopes.filter(
      (envelope) => envelope.holeId === "hole-1",
    );
    project.simulatorLogic.teeSpatialBindings = [
      {
        ...project.simulatorLogic.teeSpatialBindings.find((binding) => binding.holeId === "hole-1")!,
        teeZoneRef: createSceneSpatialReference({
          entityType: "tee-zone",
          entityId: "tee-zone-hole-1-black",
          holeId: "hole-1"
        }),
        facingDirectionDegrees: 156,
        readinessState: "ready"
      }
    ];
    project.simulatorLogic.pinSpatialBindings = [
      {
        ...project.simulatorLogic.pinSpatialBindings.find((binding) => binding.holeId === "hole-1")!,
        greenZoneRef: createSceneSpatialReference({
          entityType: "green-zone",
          entityId: "green-zone-hole-1",
          holeId: "hole-1"
        }),
        readinessState: "ready"
      }
    ];
    project.simulatorLogic.hazardSpatialBindings = [];
    project.simulatorLogic.outOfBoundsSpatialBindings = [
      {
        ...project.simulatorLogic.outOfBoundsSpatialBindings.find((binding) => binding.holeId === "hole-1")!,
        boundaryRefs: [
          createSceneSpatialReference({
            entityType: "out-of-bounds-zone",
            entityId: "out-of-bounds-hole-1-left",
            holeId: "hole-1"
          })
        ],
        readinessState: "ready"
      }
    ];
    project.simulatorLogic.dropZoneSpatialBindings = [];
    project.simulatorLogic.previewAnchorBindings = [
      {
        ...project.simulatorLogic.previewAnchorBindings.find((binding) => binding.holeId === "hole-1")!,
        anchorRef: createSceneSpatialReference({
          entityType: "visibility-corridor",
          entityId: "visibility-corridor-hole-1",
          holeId: "hole-1"
        }),
        readinessState: "ready"
      }
    ];
    project.simulatorLogic.holePlayProfiles = [
      {
        ...project.simulatorLogic.holePlayProfiles.find((profile) => profile.holeId === "hole-1")!,
        hazardRefs: [],
        fairwayCorridorRef: createSceneSpatialReference({
          entityType: "fairway-corridor",
          entityId: "fairway-corridor-hole-1",
          holeId: "hole-1"
        }),
        greenZoneRef: createSceneSpatialReference({
          entityType: "green-zone",
          entityId: "green-zone-hole-1",
          holeId: "hole-1"
        }),
        playRouteEnvelopeRef: createSceneSpatialReference({
          entityType: "play-route-envelope",
          entityId: "play-route-envelope-hole-1",
          holeId: "hole-1"
        }),
        visibilityCorridorRef: createSceneSpatialReference({
          entityType: "visibility-corridor",
          entityId: "visibility-corridor-hole-1",
          holeId: "hole-1"
        }),
        lineOfPlayStatus: "clear",
        shotReadabilityStatus: "clear",
        exportReadiness: "ready"
      }
    ];
    project.previewPaths = project.previewPaths
      .filter((path) => path.holeRefs.includes("hole-1"))
      .map((path) => ({
        ...path,
        holeRefs: ["hole-1"],
        readinessState: "approved"
      }));
    project.flyoverPlans = project.flyoverPlans
      .filter((plan) => plan.holeRef === "hole-1")
      .map((plan) => ({
        ...plan,
        readinessState: "approved"
      }));
    project.screenshotPlans = project.screenshotPlans
      .filter((plan) => plan.holeRef === "hole-1")
      .map((plan) => ({
        ...plan,
        status: "approved"
      }));
    project.showcaseSequences = project.showcaseSequences.map((sequence) => ({
      ...sequence,
      readinessState: "approved"
    }));
    project.assets = project.assets.map((asset) => ({
      ...asset,
      queueState: "cataloged",
      approvalStatus: "approved"
    }));
    project.packagingState = {
      latestBuildId: null,
      readiness: "in-progress",
      releaseCandidateReady: false
    };
    project.previewPaths.forEach((path) => {
      path.readinessState = "approved";
    });
    project.flyoverPlans.forEach((plan) => {
      plan.readinessState = "approved";
    });
    project.screenshotPlans.forEach((plan) => {
      plan.status = "approved";
    });
    project.showcaseSequences.forEach((sequence) => {
      sequence.readinessState = "approved";
    });
    project.packageBuilds = [];
    project.releaseRecords = [];

    const execution = executeReleaseCandidateBuild({
      project,
      validationIssues: [],
      profileId: "community-safe",
      createdAt: "2026-04-14T00:00:00.000Z"
    });

    expect(execution.build.executionState).toBe("succeeded");
    expect(execution.build.releaseRecipe?.recipeType).toBe("gspro-community-safe");
    expect(execution.build.artifactRefs.length).toBeGreaterThan(0);
    expect(execution.build.artifactRefs.some((artifact) => artifact.artifactType === "gspro-recipe")).toBe(true);
    expect(execution.build.artifactRefs.some((artifact) => artifact.artifactType === "recipe-step-results")).toBe(true);
    expect(execution.build.artifactRefs.some((artifact) => artifact.artifactType === "runtime-report")).toBe(true);
    expect(execution.build.artifactRefs.some((artifact) => artifact.artifactType === "export-log")).toBe(true);
    expect(execution.build.artifactRefs.some((artifact) => artifact.artifactType === "creator-handoff")).toBe(true);
    expect(execution.build.artifactRefs.some((artifact) => artifact.artifactType === "delivery-report")).toBe(true);
    expect(execution.build.artifactRefs.some((artifact) => artifact.artifactType === "presentation-share-packet")).toBe(
      true,
    );
    expect(execution.build.artifactRefs.some((artifact) => artifact.artifactType === "share-gate-signoff")).toBe(
      true,
    );
    expect(execution.build.artifactRefs.some((artifact) => artifact.artifactType === "share-gate-lock")).toBe(true);
    expect(execution.releaseRecord?.releaseRecipeRef).toBe(execution.build.releaseRecipe?.recipeId ?? null);
    expect(execution.generatedFiles.some((file) => file.relativePath.endsWith("gspro-release-recipe.json"))).toBe(true);
    expect(execution.generatedFiles.some((file) => file.relativePath.endsWith("creator-release-handoff.md"))).toBe(true);
    expect(execution.generatedFiles.some((file) => file.relativePath.endsWith("final-delivery-summary.json"))).toBe(true);
    expect(execution.generatedFiles.some((file) => file.relativePath.endsWith("presentation-share-packet.md"))).toBe(
      true,
    );
    expect(execution.generatedFiles.some((file) => file.relativePath.endsWith("share-gate-signoff.md"))).toBe(true);
    expect(execution.generatedFiles.some((file) => file.relativePath.endsWith("share-gate-lock.md"))).toBe(true);
    expect(execution.generatedFiles.length).toBeGreaterThan(0);
  });

  it("fails the release run when the managed bridge fails, while still generating diagnostic artifacts", () => {
    const project = createSeedProject();
    project.packageBuilds = [];
    project.releaseRecords = [];

    const execution = executeReleaseCandidateBuild({
      project,
      validationIssues: [],
      profileId: "community-safe",
      createdAt: "2026-04-14T00:00:00.000Z",
      bridgeSucceeded: false,
      bridgeAdapterId: "package-build-runner",
      bridgeExecutedCommand: "/usr/local/bin/package-build-runner build-release-candidate",
      bridgeSummary: "Managed package runner failed.",
      bridgeDiagnostics: ["Package build runner exited with code 1."],
      bridgeStepResults: [
        {
          stepId: "managed-package-runner",
          label: "Managed Package Runner",
          phase: "recipe-execution",
          status: "failed",
          summary: "Package runner failed.",
          toolId: "package-build-runner",
          executedCommand: "/usr/local/bin/package-build-runner build-release-candidate",
          outputPaths: [],
          diagnostics: ["Package build runner exited with code 1."]
        }
      ],
      runtimeVerificationState: "partially-verified",
      runtimeVerificationSummary: "Runtime is only partially verified.",
      runtimeVerificationEvidence: ["Native Rust/Tauri toolchain: partial"]
    });

    expect(execution.build.executionState).toBe("failed");
    expect(execution.build.bridgeAdapterId).toBe("package-build-runner");
    expect(execution.build.artifactRefs.some((artifact) => artifact.artifactType === "recipe-step-results")).toBe(true);
    expect(execution.generatedFiles.some((file) => file.relativePath.endsWith("gspro-step-results.json"))).toBe(true);
    expect(execution.releaseRecord).toBeNull();
  });

  it("creates a release draft from the latest build", () => {
    const project = createSeedProject();
    const build = project.packageBuilds[0]!;
    const release = createReleaseRecordFromBuild({
      project,
      build,
      createdAt: "2026-04-14T00:00:00.000Z"
    });

    expect(release.packageBuildRef).toBe(build.buildId);
    expect(release.status).toBe("draft");
  });

  it("treats unavailable runtime posture as a release-execution blocker", () => {
    const project = createSeedProject();
    project.packageBuilds[0] = {
      ...project.packageBuilds[0]!,
      status: "candidate",
      executionState: "succeeded",
      runtimeVerificationState: "unavailable",
      runtimeVerificationSummary: "Host execution unavailable.",
      runtimeVerificationEvidence: [],
      bridgeAdapterId: "package-build-runner",
      releaseRecipe: null,
      artifactRefs: []
    };

    const summary = summarizeReleaseExecutionState(project);

    expect(summary.overallReadiness).toBe("blocked");
    expect(summary.issues.some((issue) => issue.issueId === "release-runtime-unavailable")).toBe(true);
    expect(summary.issues.some((issue) => issue.issueId === "release-recipe-missing")).toBe(true);
  });

  it("treats failed tool-backed recipe steps as a release blocker", () => {
    const project = createSeedProject();
    project.packageBuilds[0] = {
      ...project.packageBuilds[0]!,
      executionState: "succeeded",
      status: "candidate",
      runtimeVerificationState: "partially-verified",
      runtimeVerificationSummary: "Runtime is only partially verified.",
      runtimeVerificationEvidence: ["Desktop runtime bridge: verified"],
      bridgeAdapterId: "package-build-runner",
      artifactRefs: [
        ...project.packageBuilds[0]!.artifactRefs,
        {
          artifactId: "artifact-recipe-steps",
          label: "GSPro Recipe Step Results",
          artifactType: "recipe-step-results",
          relativePath: "exports/gspro-release-runs/build-001/recipe/gspro-step-results.json",
          status: "generated",
          generatedAt: "2026-04-14T00:00:00.000Z",
          sizeBytes: 512,
          note: ""
        }
      ],
      releaseRecipe: {
        recipeId: "recipe-build-001",
        recipeType: "gspro-showcase",
        label: "GSPro Showcase Release",
        profileId: "showcase",
        exportTarget: "gspro-compatible",
        outputRoot: "exports/gspro-release-runs/build-001",
        diagnostics: [],
        steps: [
          {
            stepId: "step-runner",
            label: "Managed Package Runner",
            phase: "recipe-execution",
            ownerModule: "integration",
            status: "failed",
            summary: "Package runner failed.",
            toolId: "package-build-runner",
            executedCommand: "/usr/local/bin/package-build-runner build-release-candidate",
            attemptCount: 1,
            outputPaths: [],
            diagnostics: ["Package build runner exited with code 1."]
          }
        ]
      }
    };

    const summary = summarizeReleaseExecutionState(project);

    expect(summary.overallReadiness).toBe("blocked");
    expect(summary.failedStepCount).toBe(1);
    expect(summary.issues.some((issue) => issue.issueId === "release-recipe-step-failed")).toBe(true);
    expect(summary.retryRecommended).toBe(true);
    expect(summary.remediationActions.some((action) => action.actionId === "retry-latest-release-run")).toBe(true);
  });

  it("records managed bridge outputs as build artifacts", () => {
    const project = createSeedProject();
    project.packageBuilds = [];
    project.releaseRecords = [];

    const execution = executeReleaseCandidateBuild({
      project,
      validationIssues: [],
      profileId: "community-safe",
      createdAt: "2026-04-14T00:00:00.000Z",
      bridgeSucceeded: false,
      bridgeAdapterId: "package-build-runner",
      bridgeExecutedCommand: "/usr/local/bin/package-build-runner build-release-candidate",
      bridgeSummary: "Managed package runner failed after writing bridge reports.",
      bridgeDiagnostics: ["Package build runner exited with code 1."],
      bridgeArtifactPaths: [
        "exports/gspro-release-runs/build-001/managed-bridge/package-build-runner-report.json"
      ],
      bridgeStepResults: [
        {
          stepId: "managed-package-runner",
          label: "Managed Package Runner",
          phase: "recipe-execution",
          status: "failed",
          summary: "Package runner failed after writing bridge reports.",
          toolId: "package-build-runner",
          executedCommand: "/usr/local/bin/package-build-runner build-release-candidate",
          outputPaths: [
            "exports/gspro-release-runs/build-001/managed-bridge/package-build-runner-report.json"
          ],
          diagnostics: ["Package build runner exited with code 1."]
        }
      ]
    });

    expect(
      execution.build.artifactRefs.some(
        (artifact) =>
          artifact.artifactType === "managed-bridge-output" &&
          artifact.relativePath.endsWith("package-build-runner-report.json"),
      ),
    ).toBe(true);
    expect(
      execution.build.artifactRefs.some(
        (artifact) =>
          artifact.artifactType === "creator-handoff" &&
          artifact.relativePath.endsWith("creator-release-handoff.md"),
      ),
    ).toBe(true);
    expect(
      execution.build.artifactRefs.some(
        (artifact) =>
          artifact.artifactType === "delivery-report" &&
          artifact.relativePath.endsWith("final-delivery-summary.json"),
      ),
    ).toBe(true);
  });

  it("warns when tool-backed execution has no managed bridge output artifacts", () => {
    const project = createSeedProject();
    project.packageBuilds = [];
    project.releaseRecords = [];

    const execution = executeReleaseCandidateBuild({
      project,
      validationIssues: [],
      profileId: "community-safe",
      createdAt: "2026-04-14T00:00:00.000Z",
      bridgeSucceeded: false,
      bridgeAdapterId: "package-build-runner",
      bridgeExecutedCommand: "/usr/local/bin/package-build-runner build-release-candidate",
      bridgeSummary: "Managed package runner failed before writing managed outputs.",
      bridgeDiagnostics: ["Package build runner exited with code 1."],
      bridgeStepResults: [
        {
          stepId: "managed-package-runner",
          label: "Managed Package Runner",
          phase: "recipe-execution",
          status: "failed",
          summary: "Package runner failed.",
          toolId: "package-build-runner",
          executedCommand: "/usr/local/bin/package-build-runner build-release-candidate",
          outputPaths: [],
          diagnostics: ["Package build runner exited with code 1."]
        }
      ]
    });
    project.packageBuilds = [execution.build];

    const summary = summarizeReleaseExecutionState(project);

    expect(summary.issues.some((issue) => issue.issueId === "release-managed-output-missing")).toBe(true);
  });

  it("warns when the latest release run has no external GSPro export evidence", () => {
    const project = createSeedProject();
    project.packageBuilds[0] = {
      ...project.packageBuilds[0]!,
      status: "candidate",
      executionState: "succeeded",
      executionMode: "repo-backed",
      runtimeVerificationState: "partially-verified",
      runtimeVerificationSummary: "Runtime is only partially verified.",
      runtimeVerificationEvidence: ["Desktop runtime bridge: verified"],
      bridgeAdapterId: "package-build-runner",
      artifactRefs: [],
      releaseRecipe: {
        recipeId: "recipe-build-001",
        recipeType: "gspro-showcase",
        label: "GSPro Showcase Release",
        profileId: "showcase",
        exportTarget: "gspro-compatible",
        outputRoot: "exports/gspro-release-runs/build-001",
        diagnostics: [],
        steps: [
          {
            stepId: "step-runner",
            label: "Managed Package Runner",
            phase: "recipe-execution",
            ownerModule: "integration",
            status: "succeeded",
            summary: "Package runner completed.",
            toolId: "package-build-runner",
            executedCommand: "/usr/local/bin/package-build-runner build-release-candidate",
            attemptCount: 1,
            outputPaths: [],
            diagnostics: []
          }
        ]
      }
    };

    const summary = summarizeReleaseExecutionState(project);

    expect(summary.executionMode).toBe("repo-backed");
    expect(summary.externalToolStepCount).toBe(0);
    expect(summary.issues.some((issue) => issue.issueId === "release-external-tool-evidence-missing")).toBe(true);
  });

  it("warns when the latest release run has no creator handoff artifact", () => {
    const project = createSeedProject();
    project.packageBuilds[0] = {
      ...project.packageBuilds[0]!,
      status: "candidate",
      executionState: "succeeded",
      executionMode: "mixed",
      runtimeVerificationState: "partially-verified",
      runtimeVerificationSummary: "Runtime is only partially verified.",
      runtimeVerificationEvidence: ["Desktop runtime bridge: verified"],
      bridgeAdapterId: "package-build-runner",
      artifactRefs: project.packageBuilds[0]!.artifactRefs.filter(
        (artifact) => artifact.artifactType !== "creator-handoff",
      ),
      releaseRecipe: {
        recipeId: "recipe-build-001",
        recipeType: "gspro-showcase",
        label: "GSPro Showcase Release",
        profileId: "showcase",
        exportTarget: "gspro-compatible",
        outputRoot: "exports/gspro-release-runs/build-001",
        diagnostics: [],
        steps: [
          {
            stepId: "step-runner",
            label: "Managed Package Runner",
            phase: "recipe-execution",
            ownerModule: "integration",
            status: "succeeded",
            summary: "Package runner completed.",
            toolId: "package-build-runner",
            executedCommand: "/usr/local/bin/package-build-runner build-release-candidate",
            attemptCount: 1,
            outputPaths: [],
            diagnostics: []
          },
          {
            stepId: "step-export",
            label: "External GSPro Export Tool",
            phase: "recipe-execution",
            ownerModule: "integration",
            status: "succeeded",
            summary: "External GSPro export completed.",
            toolId: "gspro-export-tool",
            executedCommand: "/usr/local/bin/gspro-export-tool run-export",
            attemptCount: 1,
            outputPaths: [],
            diagnostics: []
          }
        ]
      }
    };

    const summary = summarizeReleaseExecutionState(project);
    const handoff = summarizeCreatorReleaseHandoff(project);

    expect(summary.issues.some((issue) => issue.issueId === "release-handoff-missing")).toBe(true);
    expect(handoff.missingHandoffCount).toBeGreaterThan(0);
  });

  it("warns when the latest release run has no final delivery artifact", () => {
    const project = createSeedProject();
    project.packageBuilds[0] = {
      ...project.packageBuilds[0]!,
      status: "candidate",
      executionState: "succeeded",
      executionMode: "mixed",
      runtimeVerificationState: "partially-verified",
      runtimeVerificationSummary: "Runtime is only partially verified.",
      runtimeVerificationEvidence: ["Desktop runtime bridge: verified"],
      bridgeAdapterId: "package-build-runner",
      artifactRefs: project.packageBuilds[0]!.artifactRefs.filter(
        (artifact) => artifact.artifactType !== "delivery-report",
      ),
      releaseRecipe: {
        recipeId: "recipe-build-001",
        recipeType: "gspro-showcase",
        label: "GSPro Showcase Release",
        profileId: "showcase",
        exportTarget: "gspro-compatible",
        outputRoot: "exports/gspro-release-runs/build-001",
        diagnostics: [],
        steps: [
          {
            stepId: "step-runner",
            label: "Managed Package Runner",
            phase: "recipe-execution",
            ownerModule: "integration",
            status: "succeeded",
            summary: "Package runner completed.",
            toolId: "package-build-runner",
            executedCommand: "/usr/local/bin/package-build-runner build-release-candidate",
            attemptCount: 1,
            outputPaths: [],
            diagnostics: []
          },
          {
            stepId: "step-export",
            label: "External GSPro Export Tool",
            phase: "recipe-execution",
            ownerModule: "integration",
            status: "succeeded",
            summary: "External GSPro export completed.",
            toolId: "gspro-export-tool",
            executedCommand: "/usr/local/bin/gspro-export-tool run-export",
            attemptCount: 1,
            outputPaths: [],
            diagnostics: []
          }
        ]
      }
    };

    const summary = summarizeReleaseExecutionState(project);
    const finalDelivery = summarizeFinalCreatorDelivery(project);

    expect(summary.issues.some((issue) => issue.issueId === "release-delivery-report-missing")).toBe(true);
    expect(finalDelivery.finalDeliveryAutomated).toBe(false);
    expect(finalDelivery.missingDeliveryArtifactCount).toBeGreaterThan(0);
  });

  it("automates release execution and synchronizes preview production state", () => {
    const project = createSeedProject();
    project.packageBuilds = [];
    project.releaseRecords = [];

    const automation = executeManagedReleaseAutomation({
      project,
      validationIssues: [],
      profileId: "community-safe",
      createdAt: "2026-04-14T01:00:00.000Z",
      bridgeSucceeded: false,
      bridgeAdapterId: "package-build-runner",
      bridgeExecutedCommand: "/usr/local/bin/package-build-runner build-release-candidate --json",
      bridgeSummary: "Managed package runner failed during validation.",
      bridgeDiagnostics: ["Package build runner exited with code 1."],
      bridgeArtifactPaths: [
        "exports/gspro-release-runs/build-001/managed-bridge/package-build-runner-report.json"
      ],
      bridgeStepResults: [
        {
          stepId: "managed-package-runner",
          label: "Managed Package Runner",
          phase: "recipe-execution",
          status: "failed",
          summary: "Package runner failed.",
          toolId: "package-build-runner",
          executedCommand: "/usr/local/bin/package-build-runner build-release-candidate --json",
          outputPaths: [],
          diagnostics: ["Package build runner exited with code 1."]
        }
      ],
      runtimeVerificationState: "partially-verified",
      runtimeVerificationSummary: "Runtime is only partially verified.",
      runtimeVerificationEvidence: ["Desktop runtime bridge: verified"]
    });

    expect(automation.execution.build.executionState).toBe("failed");
    expect(automation.previewProductionState.previewPaths.every((path) => path.lastBuildRef === automation.execution.build.buildId)).toBe(true);
    expect(automation.releaseExecution.latestBuild?.buildId).toBe(automation.execution.build.buildId);
    expect(automation.releaseExecution.retryRecommended).toBe(true);
    expect(automation.finalDelivery.latestBuildId).toBe(automation.execution.build.buildId);
    expect(automation.finalDelivery.nextActions.length).toBeGreaterThan(0);
  });
});
