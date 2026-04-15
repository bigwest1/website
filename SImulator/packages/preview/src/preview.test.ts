import { describe, expect, it } from "vitest";

import { createFlyoverPlan, createShowcaseSequence } from "./create";
import {
  applyCameraCaptureExecutionAction,
  applyShotOrderApprovalAction,
  applyShotVariantShippingDecisionAction,
  applyShotVariantSetAction,
  applyCameraShotSequencingAction,
  applyCameraPathCorrectionAction,
  summarizePreviewOperationalFlow,
  updateScreenshotStatus
} from "./services";
import {
  summarizeBuildToPreviewFraming,
  summarizeCameraCaptureExecution,
  summarizeShotOrderApproval,
  summarizeCameraShotSequencing,
  summarizeCameraPathCorrectionTools,
  summarizeCameraPathAuthoring,
  summarizeCameraPathPlaybackPolish,
  summarizeFinalReleasePresentationConfidence,
  summarizeLandmarkCorridorKitComposition,
  summarizeLandmarkCorridorSupportKits,
  summarizeLandmarkCorridorStaging,
  summarizeLandmarkCorrectionActions,
  summarizeLandmarkViewCorridorTools,
  summarizeLandmarkReadabilityCorrection,
  summarizePreviewCameraReadability,
  summarizePreviewReadiness,
  summarizeReleaseFacingWorldReadability,
  summarizeShotVariantShippingDecisions,
  summarizeShotVariantShippingManifest,
  summarizeShotVariantSets
} from "./summary";

describe("preview foundations", () => {
  it("creates flyover and showcase entities with safe defaults", () => {
    const flyoverPlan = createFlyoverPlan({
      flyoverPlanId: "flyover-1",
      holeRef: "hole-1",
      cameraIntent: "Teach the harbor carry and reveal the skyline marker.",
      introBeat: "Slow harbor crane over the teeing ground.",
      outroBeat: "Hold on the green apron and marina ring.",
      durationSeconds: 18,
      note: "Hero opener."
    });
    const showcaseSequence = createShowcaseSequence({
      showcaseSequenceId: "showcase-1",
      title: "Flagship Reveal",
      shotRefs: ["shot-1", "shot-2"],
      narrativeGoal: "Establish the premium arrival-to-finale arc.",
      note: "Primary promo pass."
    });

    expect(flyoverPlan.readinessState).toBe("draft");
    expect(showcaseSequence.targetChannel).toBe("showcase");
  });

  it("derives blocked readiness when coverage is incomplete", () => {
    const summary = summarizePreviewReadiness({
      previewPaths: [
        {
          previewPathId: "path-flyover-1",
          name: "Hole 1 Flyover",
          previewType: "flyover",
          holeRefs: ["hole-1"],
          readinessState: "ready",
          outputStatus: "not-run",
          lastBuildRef: null,
          note: "Ready"
        }
      ],
      flyoverPlans: [],
      screenshotPlans: [],
      showcaseSequences: [],
      holeCount: 2
    });

    expect(summary.overallReadiness).toBe("blocked");
  });

  it("updates screenshot status and surfaces operational blockers", () => {
    const updatedScreenshots = updateScreenshotStatus(
      [
        {
          screenshotId: "shot-1",
          label: "Hero",
          holeRef: null,
          previewPathRef: null,
          framingNote: "Skyline hero",
          status: "planned",
          outputStatus: "not-run",
          capturedAt: null,
          lastBuildRef: null
        }
      ],
      "shot-1",
      "approved",
    );
    const operational = summarizePreviewOperationalFlow({
      previewPaths: [],
      flyoverPlans: [],
      screenshotPlans: updatedScreenshots,
      showcaseSequences: [],
      holeCount: 1
    });

    expect(updatedScreenshots[0]?.status).toBe("approved");
    expect(operational.issues.some((issue) => issue.owner === "flyover")).toBe(true);
  });

  it("surfaces stale preview outputs when they point at an older build", () => {
    const operational = summarizePreviewOperationalFlow({
      previewPaths: [
        {
          previewPathId: "preview-minimap-1",
          name: "Hole 1 Minimap",
          previewType: "minimap",
          holeRefs: ["hole-1"],
          readinessState: "approved",
          outputStatus: "generated",
          lastBuildRef: "build-old",
          note: "Ready"
        }
      ],
      flyoverPlans: [],
      screenshotPlans: [],
      showcaseSequences: [],
      holeCount: 1,
      latestBuildId: "build-new"
    });

    expect(operational.issues.some((issue) => issue.issueId === "preview-build-output-stale")).toBe(true);
    expect(operational.staleOutputCount).toBe(1);
    expect(operational.buildLinkedOutputCount).toBe(1);
  });

  it("summarizes Build-to-Preview framing continuity across rough and ready holes", () => {
    const framing = summarizeBuildToPreviewFraming({
      holes: [
        {
          holeId: "hole-1",
          holeNumber: 1,
          landmarkRefCount: 2,
          routeDeliveryConfidence: "ready",
          previewAnchorCount: 2,
          hasMinimapPath: true,
          hasFlyoverPlan: true,
          screenshotCount: 2
        },
        {
          holeId: "hole-2",
          holeNumber: 2,
          landmarkRefCount: 0,
          routeDeliveryConfidence: "watch",
          previewAnchorCount: 1,
          hasMinimapPath: true,
          hasFlyoverPlan: true,
          screenshotCount: 0
        },
        {
          holeId: "hole-3",
          holeNumber: 3,
          landmarkRefCount: 1,
          routeDeliveryConfidence: "rough",
          previewAnchorCount: 0,
          hasMinimapPath: false,
          hasFlyoverPlan: false,
          screenshotCount: 0
        }
      ]
    });

    expect(framing.readyHoleCount).toBe(1);
    expect(framing.watchHoleCount).toBe(1);
    expect(framing.roughHoleCount).toBe(1);
    expect(framing.overallState).toBe("rough");
    expect(framing.holeSummaries.find((hole) => hole.holeId === "hole-2")?.framingState).toBe("watch");
    expect(framing.recommendedAction).toContain("weak holes");
  });

  it("summarizes preview camera blocking and readability across key route views", () => {
    const readability = summarizePreviewCameraReadability({
      holes: [
        {
          holeId: "hole-1",
          holeNumber: 1,
          landmarkRefCount: 2,
          routeDeliveryConfidence: "ready",
          previewAnchorCount: 2,
          hasMinimapPath: true,
          hasFlyoverPlan: true,
          screenshotCount: 2,
          blockedFramingIssueCount: 0,
          sightlineIssueCount: 0,
          occlusionRiskCount: 0
        },
        {
          holeId: "hole-2",
          holeNumber: 2,
          landmarkRefCount: 1,
          routeDeliveryConfidence: "watch",
          previewAnchorCount: 1,
          hasMinimapPath: true,
          hasFlyoverPlan: true,
          screenshotCount: 1,
          blockedFramingIssueCount: 0,
          sightlineIssueCount: 2,
          occlusionRiskCount: 0
        },
        {
          holeId: "hole-3",
          holeNumber: 3,
          landmarkRefCount: 0,
          routeDeliveryConfidence: "rough",
          previewAnchorCount: 0,
          hasMinimapPath: false,
          hasFlyoverPlan: false,
          screenshotCount: 0,
          blockedFramingIssueCount: 2,
          sightlineIssueCount: 2,
          occlusionRiskCount: 2
        }
      ]
    });

    expect(readability.overallState).toBe("rough");
    expect(readability.blockedHoleCount).toBe(1);
    expect(readability.watchHoleCount).toBe(1);
    expect(readability.holeSummaries.find((hole) => hole.holeId === "hole-2")?.blockingState).toBe("watch");
    expect(readability.holeSummaries.find((hole) => hole.holeId === "hole-3")?.blockingState).toBe("blocked");
    expect(readability.recommendedAction).toContain("blocked or weak");
  });

  it("summarizes release-facing world readability from preview and finish signals", () => {
    const readability = summarizeReleaseFacingWorldReadability({
      holes: [
        {
          holeId: "hole-1",
          holeNumber: 1,
          landmarkRefCount: 2,
          screenshotCount: 2,
          routeDeliveryConfidence: "ready",
          framingState: "ready",
          previewReadabilityState: "ready",
          terrainFinishBalanceState: "balanced"
        },
        {
          holeId: "hole-2",
          holeNumber: 2,
          landmarkRefCount: 0,
          screenshotCount: 1,
          routeDeliveryConfidence: "watch",
          framingState: "watch",
          previewReadabilityState: "watch",
          terrainFinishBalanceState: "watch"
        },
        {
          holeId: "hole-3",
          holeNumber: 3,
          landmarkRefCount: 1,
          screenshotCount: 0,
          routeDeliveryConfidence: "rough",
          framingState: "rough",
          previewReadabilityState: "rough",
          terrainFinishBalanceState: "imbalanced"
        }
      ]
    });

    expect(readability.overallState).toBe("rough");
    expect(readability.readyHoleCount).toBe(1);
    expect(readability.watchHoleCount).toBe(1);
    expect(readability.roughHoleCount).toBe(1);
    expect(readability.weakLandmarkHoleCount).toBe(1);
    expect(readability.routeWatchHoleCount).toBe(2);
    expect(readability.recommendedAction).toContain("rough holes");
  });

  it("summarizes camera-path authoring depth across incomplete, watch, and ready holes", () => {
    const summary = summarizeCameraPathAuthoring({
      holes: [
        {
          holeId: "hole-1",
          holeNumber: 1,
          landmarkRefCount: 2,
          routeDeliveryConfidence: "ready",
          previewAnchorCount: 2,
          hasMinimapPath: true,
          hasFlyoverPlan: true,
          flyoverPlanState: "approved",
          screenshotCount: 2,
          approvedScreenshotCount: 2,
          showcaseSequenceCount: 1,
          blockedSegmentCount: 0,
          weakSegmentCount: 0
        },
        {
          holeId: "hole-2",
          holeNumber: 2,
          landmarkRefCount: 1,
          routeDeliveryConfidence: "watch",
          previewAnchorCount: 1,
          hasMinimapPath: true,
          hasFlyoverPlan: true,
          flyoverPlanState: "ready",
          screenshotCount: 1,
          approvedScreenshotCount: 0,
          showcaseSequenceCount: 0,
          blockedSegmentCount: 0,
          weakSegmentCount: 2
        },
        {
          holeId: "hole-3",
          holeNumber: 3,
          landmarkRefCount: 0,
          routeDeliveryConfidence: "rough",
          previewAnchorCount: 0,
          hasMinimapPath: false,
          hasFlyoverPlan: false,
          flyoverPlanState: "missing",
          screenshotCount: 0,
          approvedScreenshotCount: 0,
          showcaseSequenceCount: 0,
          blockedSegmentCount: 2,
          weakSegmentCount: 1
        }
      ]
    });

    expect(summary.overallState).toBe("rough");
    expect(summary.readyHoleCount).toBe(1);
    expect(summary.watchHoleCount).toBe(1);
    expect(summary.roughHoleCount).toBe(1);
    expect(summary.incompleteHoleCount).toBe(1);
    expect(summary.blockedHoleCount).toBe(1);
    expect(summary.holeSummaries.find((hole) => hole.holeId === "hole-2")?.pathState).toBe("watch");
  });

  it("summarizes camera-path playback polish across abrupt, watch, and ready holes", () => {
    const summary = summarizeCameraPathPlaybackPolish({
      holes: [
        {
          holeId: "hole-1",
          holeNumber: 1,
          routeDeliveryConfidence: "ready",
          previewAnchorCount: 2,
          hasMinimapPath: true,
          hasFlyoverPlan: true,
          approvedScreenshotCount: 2,
          showcaseSequenceCount: 1,
          blockedSegmentCount: 0,
          weakSegmentCount: 0
        },
        {
          holeId: "hole-2",
          holeNumber: 2,
          routeDeliveryConfidence: "watch",
          previewAnchorCount: 1,
          hasMinimapPath: true,
          hasFlyoverPlan: true,
          approvedScreenshotCount: 1,
          showcaseSequenceCount: 0,
          blockedSegmentCount: 0,
          weakSegmentCount: 1
        },
        {
          holeId: "hole-3",
          holeNumber: 3,
          routeDeliveryConfidence: "rough",
          previewAnchorCount: 0,
          hasMinimapPath: false,
          hasFlyoverPlan: false,
          approvedScreenshotCount: 0,
          showcaseSequenceCount: 0,
          blockedSegmentCount: 1,
          weakSegmentCount: 2
        }
      ]
    });

    expect(summary.overallState).toBe("rough");
    expect(summary.readyHoleCount).toBe(1);
    expect(summary.watchHoleCount).toBe(1);
    expect(summary.roughHoleCount).toBe(1);
    expect(summary.abruptHoleCount).toBe(1);
    expect(summary.holeSummaries.find((hole) => hole.holeId === "hole-2")?.continuityState).toBe("watch");
  });

  it("turns camera-path playback posture into direct correction actions and applies them", () => {
    const correctionSummary = summarizeCameraPathCorrectionTools({
      holes: [
        {
          holeId: "hole-1",
          holeNumber: 1,
          routeDeliveryConfidence: "rough",
          previewAnchorCount: 1,
          hasMinimapPath: true,
          hasFlyoverPlan: true,
          approvedScreenshotCount: 1,
          showcaseSequenceCount: 1,
          blockedSegmentCount: 0,
          weakSegmentCount: 2
        },
        {
          holeId: "hole-2",
          holeNumber: 2,
          routeDeliveryConfidence: "watch",
          previewAnchorCount: 1,
          hasMinimapPath: true,
          hasFlyoverPlan: true,
          approvedScreenshotCount: 0,
          showcaseSequenceCount: 0,
          blockedSegmentCount: 0,
          weakSegmentCount: 0
        }
      ]
    });
    const updated = applyCameraPathCorrectionAction({
      previewPaths: [
        {
          previewPathId: "preview-flyover-1",
          name: "Hole 1 Flyover",
          previewType: "flyover",
          holeRefs: ["hole-1"],
          readinessState: "draft",
          outputStatus: "not-run",
          lastBuildRef: null,
          note: "Primary camera route."
        },
        {
          previewPathId: "preview-shot-2",
          name: "Hole 2 Hero Views",
          previewType: "screenshot-sequence",
          holeRefs: ["hole-2"],
          readinessState: "draft",
          outputStatus: "not-run",
          lastBuildRef: null,
          note: "Needs hero support."
        }
      ],
      flyoverPlans: [
        {
          flyoverPlanId: "flyover-1",
          holeRef: "hole-1",
          previewPathRef: null,
          cameraIntent: "Track the harbor ridge.",
          introBeat: "Open on the landing zone.",
          outroBeat: "Resolve on the green.",
          durationSeconds: 16,
          readinessState: "draft",
          outputStatus: "not-run",
          lastBuildRef: null,
          note: "Primary pass."
        }
      ],
      screenshotPlans: [
        {
          screenshotId: "shot-2",
          label: "Hole 2 Hero",
          holeRef: "hole-2",
          previewPathRef: "preview-shot-2",
          framingNote: "Find the skyline arch.",
          status: "planned",
          outputStatus: "not-run",
          capturedAt: null,
          lastBuildRef: null
        }
      ],
      showcaseSequences: [
        {
          showcaseSequenceId: "showcase-1",
          title: "Share Reel",
          shotRefs: ["shot-2"],
          narrativeGoal: "Sell the premium harbor reveal.",
          targetChannel: "showcase",
          readinessState: "draft",
          outputStatus: "not-run",
          lastBuildRef: null,
          note: "Primary sequence."
        }
      ],
      holeId: "hole-2",
      action: "complete-key-view"
    });

    expect(correctionSummary.overallState).toBe("rough");
    expect(correctionSummary.smoothingHoleCount).toBe(1);
    expect(correctionSummary.completionHoleCount).toBe(1);
    expect(correctionSummary.holeSummaries.find((hole) => hole.holeId === "hole-1")?.primaryAction).toBe(
      "smooth-transition",
    );
    expect(updated.previewPaths.find((path) => path.previewPathId === "preview-shot-2")?.readinessState).toBe("ready");
    expect(updated.screenshotPlans[0]?.status).toBe("captured");
    expect(updated.showcaseSequences[0]?.readinessState).toBe("ready");
    expect(updated.screenshotPlans[0]?.framingNote).toContain("hero frame");
  });

  it("summarizes landmark correction and final release presentation confidence", () => {
    const landmarkCorrection = summarizeLandmarkReadabilityCorrection({
      holes: [
        {
          holeId: "hole-1",
          holeNumber: 1,
          landmarkRefCount: 2,
          framingState: "ready",
          cameraPathState: "ready",
          previewReadabilityState: "ready",
          blockedViewCount: 0,
          weakViewCount: 0,
          routeDeliveryConfidence: "ready"
        },
        {
          holeId: "hole-2",
          holeNumber: 2,
          landmarkRefCount: 1,
          framingState: "watch",
          cameraPathState: "watch",
          previewReadabilityState: "watch",
          blockedViewCount: 0,
          weakViewCount: 2,
          routeDeliveryConfidence: "watch"
        },
        {
          holeId: "hole-3",
          holeNumber: 3,
          landmarkRefCount: 0,
          framingState: "rough",
          cameraPathState: "rough",
          previewReadabilityState: "rough",
          blockedViewCount: 2,
          weakViewCount: 1,
          routeDeliveryConfidence: "rough"
        }
      ]
    });
    const presentation = summarizeFinalReleasePresentationConfidence({
      holes: [
        {
          holeId: "hole-1",
          holeNumber: 1,
          routeDeliveryConfidence: "ready",
          framingState: "ready",
          cameraPathState: "ready",
          previewReadabilityState: "ready",
          landmarkCorrectionState: "ready",
          releaseReadabilityState: "ready",
          terrainFinishBalanceState: "balanced"
        },
        {
          holeId: "hole-2",
          holeNumber: 2,
          routeDeliveryConfidence: "watch",
          framingState: "watch",
          cameraPathState: "watch",
          previewReadabilityState: "watch",
          landmarkCorrectionState: "watch",
          releaseReadabilityState: "watch",
          terrainFinishBalanceState: "watch"
        },
        {
          holeId: "hole-3",
          holeNumber: 3,
          routeDeliveryConfidence: "rough",
          framingState: "rough",
          cameraPathState: "rough",
          previewReadabilityState: "rough",
          landmarkCorrectionState: "rough",
          releaseReadabilityState: "rough",
          terrainFinishBalanceState: "imbalanced"
        }
      ]
    });

    expect(landmarkCorrection.overallState).toBe("rough");
    expect(landmarkCorrection.missingLandmarkHoleCount).toBe(1);
    expect(landmarkCorrection.blockedHoleCount).toBe(1);
    expect(presentation.overallState).toBe("rough");
    expect(presentation.presentationGapHoleCount).toBe(2);
    expect(presentation.blockedHoleCount).toBe(1);
  });

  it("turns landmark-readability posture into corrective actions", () => {
    const actions = summarizeLandmarkCorrectionActions({
      holes: [
        {
          holeId: "hole-1",
          holeNumber: 1,
          landmarkRefCount: 2,
          framingState: "ready",
          cameraPathState: "ready",
          previewReadabilityState: "ready",
          blockedViewCount: 0,
          weakViewCount: 0,
          routeDeliveryConfidence: "ready"
        },
        {
          holeId: "hole-2",
          holeNumber: 2,
          landmarkRefCount: 0,
          framingState: "watch",
          cameraPathState: "watch",
          previewReadabilityState: "watch",
          blockedViewCount: 0,
          weakViewCount: 1,
          routeDeliveryConfidence: "watch"
        },
        {
          holeId: "hole-3",
          holeNumber: 3,
          landmarkRefCount: 2,
          framingState: "watch",
          cameraPathState: "watch",
          previewReadabilityState: "rough",
          blockedViewCount: 2,
          weakViewCount: 1,
          routeDeliveryConfidence: "watch"
        }
      ]
    });

    expect(actions.overallState).toBe("rough");
    expect(actions.correctiveHoleCount).toBe(2);
    expect(actions.stageLandmarkHoleCount).toBe(1);
    expect(actions.openViewHoleCount).toBe(1);
    expect(actions.holeSummaries.find((hole) => hole.holeId === "hole-2")?.primaryAction).toBe("stage-landmark-support");
    expect(actions.holeSummaries.find((hole) => hole.holeId === "hole-3")?.primaryAction).toBe("open-view-corridor");
  });

  it("turns camera capture posture into executable capture actions and applies them", () => {
    const captureSummary = summarizeCameraCaptureExecution({
      holes: [
        {
          holeId: "hole-1",
          holeNumber: 1,
          landmarkRefCount: 1,
          routeDeliveryConfidence: "watch",
          previewAnchorCount: 1,
          hasMinimapPath: true,
          hasFlyoverPlan: true,
          flyoverPlanState: "approved",
          screenshotCount: 1,
          blockedSegmentCount: 0,
          weakSegmentCount: 1,
          capturedScreenshotCount: 0,
          approvedScreenshotCount: 0,
          showcaseSequenceCount: 0,
          showcaseSequenceState: "missing"
        },
        {
          holeId: "hole-2",
          holeNumber: 2,
          landmarkRefCount: 2,
          routeDeliveryConfidence: "ready",
          previewAnchorCount: 2,
          hasMinimapPath: true,
          hasFlyoverPlan: true,
          flyoverPlanState: "approved",
          screenshotCount: 2,
          blockedSegmentCount: 0,
          weakSegmentCount: 0,
          capturedScreenshotCount: 2,
          approvedScreenshotCount: 1,
          showcaseSequenceCount: 1,
          showcaseSequenceState: "ready"
        }
      ]
    });
    const updated = applyCameraCaptureExecutionAction({
      previewPaths: [
        {
          previewPathId: "preview-shot-1",
          name: "Hole 1 Capture Path",
          previewType: "flyover",
          holeRefs: ["hole-1"],
          readinessState: "draft",
          outputStatus: "not-run",
          lastBuildRef: null,
          note: "Needs a stronger flyover pass."
        }
      ],
      flyoverPlans: [
        {
          flyoverPlanId: "flyover-1",
          holeRef: "hole-1",
          previewPathRef: null,
          cameraIntent: "Teach the harbor landing corridor.",
          introBeat: "Open above the tee.",
          outroBeat: "Resolve over the green.",
          durationSeconds: 16,
          readinessState: "draft",
          outputStatus: "not-run",
          lastBuildRef: null,
          note: "Needs capture."
        }
      ],
      screenshotPlans: [
        {
          screenshotId: "shot-1",
          label: "Hole 1 Hero",
          holeRef: "hole-1",
          previewPathRef: "preview-shot-1",
          framingNote: "Find the harbor skyline.",
          status: "planned",
          outputStatus: "not-run",
          capturedAt: null,
          lastBuildRef: null
        }
      ],
      showcaseSequences: [
        {
          showcaseSequenceId: "showcase-1",
          title: "Harbor Reveal",
          shotRefs: ["shot-1"],
          narrativeGoal: "Sell the hole-one arrival shot.",
          targetChannel: "showcase",
          readinessState: "draft",
          outputStatus: "not-run",
          lastBuildRef: null,
          note: "Needs final support."
        }
      ],
      holeId: "hole-1",
      action: "capture-key-shot"
    });

    expect(captureSummary.overallState).toBe("watch");
    expect(captureSummary.captureHoleCount).toBe(1);
    expect(captureSummary.approvalHoleCount).toBe(1);
    expect(captureSummary.holeSummaries.find((hole) => hole.holeId === "hole-1")?.primaryAction).toBe(
      "capture-key-shot",
    );
    expect(updated.previewPaths[0]?.readinessState).toBe("ready");
    expect(updated.screenshotPlans[0]?.status).toBe("captured");
    expect(updated.showcaseSequences[0]?.note).toContain("missing supporting captures");
  });

  it("turns shot sequencing posture into direct sequencing actions and can create missing support media", () => {
    const sequencing = summarizeCameraShotSequencing({
      holes: [
        {
          holeId: "hole-4",
          holeNumber: 4,
          landmarkRefCount: 1,
          routeDeliveryConfidence: "watch",
          previewAnchorCount: 0,
          hasMinimapPath: false,
          hasFlyoverPlan: false,
          flyoverPlanState: "missing",
          screenshotCount: 0,
          blockedSegmentCount: 1,
          weakSegmentCount: 2,
          capturedScreenshotCount: 0,
          approvedScreenshotCount: 0,
          showcaseSequenceCount: 0,
          showcaseSequenceState: "missing"
        }
      ]
    });
    const updated = applyCameraShotSequencingAction({
      previewPaths: [],
      flyoverPlans: [],
      screenshotPlans: [],
      showcaseSequences: [],
      holeId: "hole-4",
      action: "stabilize-preview-route"
    });

    expect(sequencing.overallState).toBe("rough");
    expect(sequencing.sequenceGapHoleCount).toBe(1);
    expect(sequencing.holeSummaries[0]?.primaryAction).toBe("stabilize-preview-route");
    expect(updated.previewPaths[0]?.previewType).toBe("minimap");
    expect(updated.flyoverPlans[0]?.holeRef).toBe("hole-4");
    expect(updated.screenshotPlans[0]?.holeRef).toBe("hole-4");
    expect(updated.showcaseSequences[0]?.shotRefs.length).toBe(1);
  });

  it("turns sequencing posture into explicit shot-order approval actions", () => {
    const approval = summarizeShotOrderApproval({
      holes: [
        {
          holeId: "hole-5",
          holeNumber: 5,
          landmarkRefCount: 2,
          routeDeliveryConfidence: "watch",
          previewAnchorCount: 1,
          minimapPathState: "ready",
          hasMinimapPath: true,
          hasFlyoverPlan: true,
          flyoverPlanState: "ready",
          screenshotCount: 2,
          blockedSegmentCount: 0,
          weakSegmentCount: 1,
          capturedScreenshotCount: 2,
          approvedScreenshotCount: 1,
          showcaseSequenceCount: 1,
          showcaseSequenceState: "ready"
        }
      ]
    });
    const updated = applyShotOrderApprovalAction({
      previewPaths: [
        {
          previewPathId: "preview-path-hole-5",
          name: "Hole 5 Route",
          previewType: "minimap",
          holeRefs: ["hole-5"],
          readinessState: "ready",
          outputStatus: "not-run",
          lastBuildRef: null,
          note: "Existing route."
        }
      ],
      flyoverPlans: [
        createFlyoverPlan({
          flyoverPlanId: "flyover-hole-5",
          holeRef: "hole-5",
          previewPathRef: "preview-path-hole-5",
          cameraIntent: "Show the centerline carry.",
          introBeat: "Start on the tee.",
          outroBeat: "Finish on the green.",
          durationSeconds: 18,
          readinessState: "ready",
          note: "Existing flyover."
        })
      ],
      screenshotPlans: [
        {
          screenshotId: "shot-hole-5",
          label: "Hole 5 Hero",
          holeRef: "hole-5",
          previewPathRef: "preview-path-hole-5",
          framingNote: "Hero frame.",
          status: "captured",
          outputStatus: "not-run",
          capturedAt: null,
          lastBuildRef: null
        }
      ],
      showcaseSequences: [
        createShowcaseSequence({
          showcaseSequenceId: "showcase-hole-5",
          title: "Hole 5 Showcase",
          targetChannel: "showcase",
          shotRefs: ["shot-hole-5"],
          narrativeGoal: "Carry the hole from tee to green.",
          readinessState: "ready",
          note: "Existing showcase."
        })
      ],
      holeId: "hole-5",
      action: "approve-key-view-order"
    });

    expect(approval.overallState).toBe("watch");
    expect(approval.approvalGapHoleCount).toBe(1);
    expect(approval.holeSummaries[0]?.primaryAction).toBe("approve-key-view-order");
    expect(updated.screenshotPlans[0]?.status).toBe("approved");
    expect(updated.showcaseSequences[0]?.note).toContain("approved key-view set");
  });

  it("summarizes landmark view-corridor actions from blocked and weak route views", () => {
    const corridorTools = summarizeLandmarkViewCorridorTools({
      holes: [
        {
          holeId: "hole-1",
          holeNumber: 1,
          landmarkRefCount: 2,
          framingState: "ready",
          cameraPathState: "ready",
          previewReadabilityState: "ready",
          blockedViewCount: 0,
          weakViewCount: 0,
          routeDeliveryConfidence: "ready"
        },
        {
          holeId: "hole-2",
          holeNumber: 2,
          landmarkRefCount: 0,
          framingState: "watch",
          cameraPathState: "watch",
          previewReadabilityState: "watch",
          blockedViewCount: 1,
          weakViewCount: 1,
          routeDeliveryConfidence: "watch"
        },
        {
          holeId: "hole-3",
          holeNumber: 3,
          landmarkRefCount: 1,
          framingState: "watch",
          cameraPathState: "ready",
          previewReadabilityState: "watch",
          blockedViewCount: 0,
          weakViewCount: 2,
          routeDeliveryConfidence: "watch"
        }
      ]
    });

    expect(corridorTools.overallState).toBe("rough");
    expect(corridorTools.blockedHoleCount).toBe(1);
    expect(corridorTools.corridorActionHoleCount).toBe(1);
    expect(corridorTools.rebalanceHoleCount).toBe(1);
    expect(corridorTools.holeSummaries.find((hole) => hole.holeId === "hole-2")?.primaryAction).toBe(
      "widen-view-corridor",
    );
    expect(corridorTools.holeSummaries.find((hole) => hole.holeId === "hole-3")?.primaryAction).toBe(
      "rebalance-route-corridor",
    );
  });

  it("summarizes shot variant sets and applies primary plus alternate variant actions", () => {
    const variants = summarizeShotVariantSets({
      holes: [
        {
          holeId: "hole-1",
          holeNumber: 1,
          blockedSegmentCount: 0,
          weakSegmentCount: 0,
          minimapPathState: "missing",
          flyoverPlanState: "missing",
          showcaseSequenceState: "missing",
          screenshotCount: 0,
          approvedScreenshotCount: 0,
          previewAnchorCount: 0,
          variants: []
        },
        {
          holeId: "hole-2",
          holeNumber: 2,
          blockedSegmentCount: 0,
          weakSegmentCount: 0,
          minimapPathState: "approved",
          flyoverPlanState: "approved",
          showcaseSequenceState: "approved",
          screenshotCount: 1,
          approvedScreenshotCount: 1,
          previewAnchorCount: 2,
          variants: [
            {
              variantSetId: "variant-primary-hole-2",
              holeId: "hole-2",
              label: "Hole 2 Primary Reveal",
              role: "primary",
              readinessState: "approved",
              shippingState: null,
              previewPathCount: 1,
              flyoverPlanCount: 1,
              screenshotCount: 1,
              approvedScreenshotCount: 1,
              showcaseSequenceCount: 1,
              familyCoverage: ["preview-route", "flyover", "key-view", "showcase"]
            },
            {
              variantSetId: "variant-alt-flyover-hole-2",
              holeId: "hole-2",
              label: "Hole 2 Alternate Flyover",
              role: "alternate",
              readinessState: "approved",
              shippingState: null,
              previewPathCount: 1,
              flyoverPlanCount: 1,
              screenshotCount: 0,
              approvedScreenshotCount: 0,
              showcaseSequenceCount: 0,
              familyCoverage: ["flyover"]
            },
            {
              variantSetId: "variant-alt-key-hole-2",
              holeId: "hole-2",
              label: "Hole 2 Alternate Key Views",
              role: "alternate",
              readinessState: "approved",
              shippingState: null,
              previewPathCount: 0,
              flyoverPlanCount: 0,
              screenshotCount: 1,
              approvedScreenshotCount: 1,
              showcaseSequenceCount: 0,
              familyCoverage: ["key-view"]
            }
          ]
        }
      ]
    });

    const primaryApplied = applyShotVariantSetAction({
      previewPaths: [
        {
          previewPathId: "preview-minimap-hole-1",
          name: "Hole 1 Minimap",
          previewType: "minimap",
          holeRefs: ["hole-1"],
          readinessState: "draft",
          outputStatus: "not-run",
          lastBuildRef: null,
          note: "Primary route."
        }
      ],
      flyoverPlans: [
        createFlyoverPlan({
          flyoverPlanId: "flyover-hole-1",
          holeRef: "hole-1",
          previewPathRef: "preview-minimap-hole-1",
          cameraIntent: "Introduce the opener.",
          introBeat: "Tee reveal.",
          outroBeat: "Green resolve.",
          durationSeconds: 14,
          readinessState: "draft",
          note: "Primary flyover."
        })
      ],
      screenshotPlans: [
        {
          screenshotId: "shot-hole-1",
          label: "Hole 1 Hero",
          holeRef: "hole-1",
          previewPathRef: "preview-minimap-hole-1",
          framingNote: "Hero frame.",
          status: "planned",
          outputStatus: "not-run",
          capturedAt: null,
          lastBuildRef: null
        }
      ],
      showcaseSequences: [
        createShowcaseSequence({
          showcaseSequenceId: "showcase-hole-1",
          title: "Hole 1 Showcase",
          shotRefs: ["shot-hole-1"],
          narrativeGoal: "Primary reveal.",
          readinessState: "draft",
          note: "Primary showcase."
        })
      ],
      holeId: "hole-1",
      action: "approve-primary-variant-set"
    });
    const alternateApplied = applyShotVariantSetAction({
      previewPaths: [
        {
          previewPathId: "preview-route-hole-2",
          name: "Hole 2 Route",
          previewType: "flyover",
          holeRefs: ["hole-2"],
          readinessState: "approved",
          outputStatus: "generated",
          lastBuildRef: "build-1",
          note: "Primary flyover route."
        }
      ],
      flyoverPlans: [
        createFlyoverPlan({
          flyoverPlanId: "flyover-hole-2",
          holeRef: "hole-2",
          previewPathRef: "preview-route-hole-2",
          cameraIntent: "Primary flyover.",
          introBeat: "Open over the landing corridor.",
          outroBeat: "Resolve at the green.",
          durationSeconds: 16,
          readinessState: "approved",
          note: "Primary flyover."
        })
      ],
      screenshotPlans: [
        {
          screenshotId: "shot-hole-2",
          label: "Hole 2 Hero",
          holeRef: "hole-2",
          previewPathRef: "preview-route-hole-2",
          framingNote: "Hero frame.",
          status: "approved",
          outputStatus: "generated",
          capturedAt: "2026-04-15T00:00:00.000Z",
          lastBuildRef: "build-1"
        }
      ],
      showcaseSequences: [],
      holeId: "hole-2",
      action: "compose-alternate-showcase-variant"
    });

    expect(variants.overallState).toBe("rough");
    expect(variants.missingPrimaryHoleCount).toBe(1);
    expect(variants.holeSummaries.find((hole) => hole.holeId === "hole-1")?.primaryAction).toBe(
      "approve-primary-variant-set",
    );
    expect(variants.holeSummaries.find((hole) => hole.holeId === "hole-2")?.primaryAction).toBe(
      "compose-alternate-showcase-variant",
    );
    expect(primaryApplied.previewPaths[0]?.shotVariantRole).toBe("primary");
    expect(primaryApplied.previewPaths[0]?.shotVariantShippingState).toBe("candidate");
    expect(primaryApplied.flyoverPlans[0]?.shotVariantRole).toBe("primary");
    expect(primaryApplied.screenshotPlans[0]?.status).toBe("approved");
    expect(primaryApplied.showcaseSequences[0]?.shotVariantRole).toBe("primary");
    expect(
      alternateApplied.showcaseSequences.find((sequence) => sequence.showcaseSequenceId === "showcase-sequence-alt-hole-2")
        ?.shotVariantRole,
    ).toBe("alternate");
  });

  it("summarizes shot variant shipping decisions and selects shipping variants by family", () => {
    const shipping = summarizeShotVariantShippingDecisions({
      holes: [
        {
          holeId: "hole-1",
          holeNumber: 1,
          blockedSegmentCount: 1,
          weakSegmentCount: 0,
          minimapPathState: "approved",
          flyoverPlanState: "approved",
          showcaseSequenceState: "approved",
          screenshotCount: 1,
          previewAnchorCount: 1,
          variants: [
            {
              variantSetId: "shot-variant-hole-1-primary",
              holeId: "hole-1",
              label: "Hole 1 Primary",
              role: "primary",
              readinessState: "approved",
              shippingState: "selected",
              previewPathCount: 1,
              flyoverPlanCount: 1,
              screenshotCount: 1,
              approvedScreenshotCount: 1,
              showcaseSequenceCount: 1,
              familyCoverage: ["preview-route", "flyover", "key-view", "showcase"],
            },
            {
              variantSetId: "shot-variant-hole-1-alternate-flyover",
              holeId: "hole-1",
              label: "Hole 1 Alt Flyover",
              role: "alternate",
              readinessState: "approved",
              shippingState: "candidate",
              previewPathCount: 1,
              flyoverPlanCount: 1,
              screenshotCount: 0,
              approvedScreenshotCount: 0,
              showcaseSequenceCount: 0,
              familyCoverage: ["flyover"],
            },
          ],
        },
      ],
    });
    const selected = applyShotVariantShippingDecisionAction({
      previewPaths: [
        {
          previewPathId: "preview-minimap-hole-1",
          name: "Hole 1 Minimap",
          previewType: "minimap",
          holeRefs: ["hole-1"],
          readinessState: "approved",
          outputStatus: "generated",
          lastBuildRef: "build-1",
          note: "Primary route.",
          shotVariantSetId: "shot-variant-hole-1-primary",
          shotVariantLabel: "Hole 1 Primary",
          shotVariantRole: "primary",
          shotVariantShippingState: "selected",
        },
        {
          previewPathId: "preview-flyover-alt-hole-1",
          name: "Hole 1 Alternate Flyover",
          previewType: "flyover",
          holeRefs: ["hole-1"],
          readinessState: "approved",
          outputStatus: "generated",
          lastBuildRef: "build-1",
          note: "Alternate flyover.",
          shotVariantSetId: "shot-variant-hole-1-alternate-flyover",
          shotVariantLabel: "Hole 1 Alt Flyover",
          shotVariantRole: "alternate",
          shotVariantShippingState: "candidate",
        },
      ],
      flyoverPlans: [
        {
          ...createFlyoverPlan({
            flyoverPlanId: "flyover-hole-1-primary",
            holeRef: "hole-1",
            previewPathRef: "preview-minimap-hole-1",
            cameraIntent: "Primary",
            introBeat: "Start",
            outroBeat: "End",
            durationSeconds: 16,
            readinessState: "approved",
            note: "Primary",
          }),
          shotVariantSetId: "shot-variant-hole-1-primary",
          shotVariantLabel: "Hole 1 Primary",
          shotVariantRole: "primary" as const,
          shotVariantShippingState: "selected" as const,
        },
        {
          ...createFlyoverPlan({
            flyoverPlanId: "flyover-hole-1-alt",
            holeRef: "hole-1",
            previewPathRef: "preview-flyover-alt-hole-1",
            cameraIntent: "Alternate",
            introBeat: "Start",
            outroBeat: "End",
            durationSeconds: 16,
            readinessState: "approved",
            note: "Alt",
          }),
          shotVariantSetId: "shot-variant-hole-1-alternate-flyover",
          shotVariantLabel: "Hole 1 Alt Flyover",
          shotVariantRole: "alternate" as const,
          shotVariantShippingState: "candidate" as const,
        },
      ],
      screenshotPlans: [],
      showcaseSequences: [],
      holeId: "hole-1",
      action: "select-alternate-flyover-shipping-variant",
    });

    expect(shipping.overallState).toBe("watch");
    expect(shipping.holeSummaries[0]?.primaryAction).toBe("select-alternate-flyover-shipping-variant");
    expect(selected.previewPaths.find((path) => path.previewPathId === "preview-flyover-alt-hole-1")?.shotVariantShippingState).toBe("selected");
    expect(selected.flyoverPlans.find((plan) => plan.flyoverPlanId === "flyover-hole-1-primary")?.shotVariantShippingState).toBe("hold");
  });

  it("summarizes shot variant shipping manifests across selected, alternate, and held-back variants", () => {
    const manifest = summarizeShotVariantShippingManifest({
      holes: [
        {
          holeId: "hole-1",
          holeNumber: 1,
          minimapPathState: "approved",
          flyoverPlanState: "approved",
          screenshotCount: 1,
          showcaseSequenceState: "approved",
          previewAnchorCount: 1,
          variants: [
            {
              variantSetId: "manifest-hole-1-primary",
              holeId: "hole-1",
              label: "Hole 1 Primary",
              role: "primary",
              readinessState: "approved",
              shippingState: "selected",
              previewPathCount: 1,
              flyoverPlanCount: 1,
              screenshotCount: 1,
              approvedScreenshotCount: 1,
              showcaseSequenceCount: 1,
              familyCoverage: ["preview-route", "flyover", "key-view", "showcase"],
            },
            {
              variantSetId: "manifest-hole-1-alt-flyover",
              holeId: "hole-1",
              label: "Hole 1 Alt Flyover",
              role: "alternate",
              readinessState: "approved",
              shippingState: "hold",
              previewPathCount: 1,
              flyoverPlanCount: 1,
              screenshotCount: 0,
              approvedScreenshotCount: 0,
              showcaseSequenceCount: 0,
              familyCoverage: ["flyover"],
            },
          ],
        },
        {
          holeId: "hole-2",
          holeNumber: 2,
          minimapPathState: "approved",
          flyoverPlanState: "approved",
          screenshotCount: 1,
          showcaseSequenceState: "approved",
          previewAnchorCount: 1,
          variants: [
            {
              variantSetId: "manifest-hole-2-alt-flyover",
              holeId: "hole-2",
              label: "Hole 2 Alt Flyover",
              role: "alternate",
              readinessState: "approved",
              shippingState: "selected",
              previewPathCount: 0,
              flyoverPlanCount: 1,
              screenshotCount: 0,
              approvedScreenshotCount: 0,
              showcaseSequenceCount: 0,
              familyCoverage: ["flyover"],
            },
          ],
        },
      ],
    });

    expect(manifest.overallState).toBe("rough");
    expect(manifest.selectedHoleCount).toBe(2);
    expect(manifest.selectedPrimaryHoleCount).toBe(1);
    expect(manifest.selectedAlternateHoleCount).toBe(1);
    expect(manifest.heldBackHoleCount).toBe(1);
    expect(manifest.incompleteManifestHoleCount).toBe(1);
    expect(manifest.holeSummaries.find((hole) => hole.holeId === "hole-1")?.manifestState).toBe("ready");
    expect(manifest.holeSummaries.find((hole) => hole.holeId === "hole-1")?.heldBackVariantCount).toBe(1);
    expect(manifest.holeSummaries.find((hole) => hole.holeId === "hole-2")?.completenessState).toBe("partial");
    expect(manifest.holeSummaries.find((hole) => hole.holeId === "hole-2")?.missingManifestFamilyCount).toBe(3);
  });

  it("summarizes landmark corridor staging as a finish-stage support workflow", () => {
    const staging = summarizeLandmarkCorridorStaging({
      holes: [
        {
          holeId: "hole-1",
          holeNumber: 1,
          landmarkRefCount: 2,
          framingState: "ready",
          cameraPathState: "ready",
          previewReadabilityState: "ready",
          blockedViewCount: 0,
          weakViewCount: 0,
          routeDeliveryConfidence: "ready"
        },
        {
          holeId: "hole-2",
          holeNumber: 2,
          landmarkRefCount: 0,
          framingState: "watch",
          cameraPathState: "watch",
          previewReadabilityState: "watch",
          blockedViewCount: 1,
          weakViewCount: 1,
          routeDeliveryConfidence: "watch"
        },
        {
          holeId: "hole-3",
          holeNumber: 3,
          landmarkRefCount: 1,
          framingState: "watch",
          cameraPathState: "ready",
          previewReadabilityState: "watch",
          blockedViewCount: 0,
          weakViewCount: 2,
          routeDeliveryConfidence: "watch"
        }
      ]
    });

    expect(staging.overallState).toBe("rough");
    expect(staging.blockedHoleCount).toBe(1);
    expect(staging.stagingHoleCount).toBe(1);
    expect(staging.reinforceHoleCount).toBe(1);
    expect(staging.correctiveHoleCount).toBe(2);
    expect(staging.holeSummaries.find((hole) => hole.holeId === "hole-2")?.primaryAction).toBe("widen-view-corridor");
    expect(staging.holeSummaries.find((hole) => hole.holeId === "hole-3")?.primaryAction).toBe(
      "rebalance-route-corridor",
    );
  });

  it("summarizes landmark corridor support kits as reusable finish-stage tools", () => {
    const kits = summarizeLandmarkCorridorSupportKits({
      holes: [
        {
          holeId: "hole-1",
          holeNumber: 1,
          landmarkRefCount: 0,
          framingState: "watch",
          cameraPathState: "watch",
          previewReadabilityState: "watch",
          blockedViewCount: 0,
          weakViewCount: 1,
          routeDeliveryConfidence: "watch"
        },
        {
          holeId: "hole-2",
          holeNumber: 2,
          landmarkRefCount: 2,
          framingState: "ready",
          cameraPathState: "ready",
          previewReadabilityState: "ready",
          blockedViewCount: 2,
          weakViewCount: 0,
          routeDeliveryConfidence: "ready"
        }
      ]
    });

    expect(kits.overallState).toBe("rough");
    expect(kits.anchorKitHoleCount).toBe(1);
    expect(kits.openKitHoleCount).toBe(1);
    expect(kits.holeSummaries.find((hole) => hole.holeId === "hole-1")?.primaryKit).toBe(
      "anchor-landmark-support-kit",
    );
    expect(kits.holeSummaries.find((hole) => hole.holeId === "hole-2")?.primaryKit).toBe(
      "open-view-corridor-kit",
    );
  });

  it("summarizes landmark corridor bundle composition as reusable finish-stage support bundles", () => {
    const bundles = summarizeLandmarkCorridorKitComposition({
      holes: [
        {
          holeId: "hole-1",
          holeNumber: 1,
          landmarkRefCount: 0,
          framingState: "watch",
          cameraPathState: "watch",
          previewReadabilityState: "watch",
          blockedViewCount: 1,
          weakViewCount: 1,
          routeDeliveryConfidence: "watch"
        },
        {
          holeId: "hole-2",
          holeNumber: 2,
          landmarkRefCount: 1,
          framingState: "watch",
          cameraPathState: "ready",
          previewReadabilityState: "watch",
          blockedViewCount: 0,
          weakViewCount: 2,
          routeDeliveryConfidence: "watch"
        },
        {
          holeId: "hole-3",
          holeNumber: 3,
          landmarkRefCount: 2,
          framingState: "watch",
          cameraPathState: "ready",
          previewReadabilityState: "watch",
          blockedViewCount: 0,
          weakViewCount: 0,
          routeDeliveryConfidence: "ready"
        }
      ]
    });

    expect(bundles.overallState).toBe("rough");
    expect(bundles.hybridBundleHoleCount).toBe(1);
    expect(bundles.routeSupportBundleHoleCount).toBe(1);
    expect(bundles.presentationCalmBundleHoleCount).toBe(1);
    expect(bundles.holeSummaries.find((hole) => hole.holeId === "hole-1")?.primaryBundle).toBe(
      "compose-hybrid-support-bundle",
    );
    expect(bundles.holeSummaries.find((hole) => hole.holeId === "hole-2")?.primaryBundle).toBe(
      "compose-route-support-bundle",
    );
    expect(bundles.holeSummaries.find((hole) => hole.holeId === "hole-3")?.primaryBundle).toBe(
      "compose-presentation-calm-bundle",
    );
  });
});
