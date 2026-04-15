import {
  previewReadinessSummarySchema,
  type FlyoverPlan,
  type PreviewPath,
  type PreviewReadinessState,
  type ScreenshotPlan,
  type ShotVariantRole,
  type ShotVariantShippingState,
  type ShowcaseSequence
} from "./models";

function isReadyLike(state: PreviewReadinessState | "missing") {
  return state === "ready" || state === "approved";
}

function screenshotStatusToReadiness(status: ScreenshotPlan["status"]): PreviewReadinessState {
  return status === "approved" ? "approved" : status === "captured" ? "ready" : "draft";
}

export function summarizePreviewCoverage(previewPaths: PreviewPath[], holeCount: number) {
  const flyoverReady = previewPaths.filter(
    (path) => path.previewType === "flyover" && isReadyLike(path.readinessState),
  ).length;
  const minimapReady = previewPaths.filter(
    (path) => path.previewType === "minimap" && isReadyLike(path.readinessState),
  ).length;

  return {
    flyoverCoverage: holeCount === 0 ? 0 : flyoverReady / holeCount,
    minimapCoverage: holeCount === 0 ? 0 : minimapReady / holeCount
  };
}

export function summarizePreviewReadiness({
  previewPaths,
  flyoverPlans,
  screenshotPlans,
  showcaseSequences,
  holeCount
}: {
  previewPaths: PreviewPath[];
  flyoverPlans: FlyoverPlan[];
  screenshotPlans: ScreenshotPlan[];
  showcaseSequences: ShowcaseSequence[];
  holeCount: number;
}) {
  const coverage = summarizePreviewCoverage(previewPaths, holeCount);
  const flyoverReadyCount = flyoverPlans.filter((plan) => isReadyLike(plan.readinessState)).length;
  const screenshotApprovedCount = screenshotPlans.filter((plan) => plan.status === "approved").length;
  const showcaseReadyCount = showcaseSequences.filter((sequence) => isReadyLike(sequence.readinessState)).length;

  const overallReadiness =
    coverage.flyoverCoverage < 1 || coverage.minimapCoverage < 1
      ? "blocked"
      : screenshotPlans.length === 0 || showcaseSequences.length === 0 || showcaseReadyCount === 0
        ? "watch"
        : "ready";

  return previewReadinessSummarySchema.parse({
    flyoverCoverage: coverage.flyoverCoverage,
    minimapCoverage: coverage.minimapCoverage,
    flyoverReadyCount,
    minimapReadyCount: Math.round(coverage.minimapCoverage * holeCount),
    screenshotApprovedCount,
    totalScreenshotCount: screenshotPlans.length,
    showcaseReadyCount,
    totalShowcaseCount: showcaseSequences.length,
    overallReadiness
  });
}

export type BuildPreviewFramingHoleInput = {
  holeId: string;
  holeNumber: number;
  landmarkRefCount: number;
  routeDeliveryConfidence: "rough" | "watch" | "ready";
  previewAnchorCount: number;
  hasMinimapPath: boolean;
  hasFlyoverPlan: boolean;
  screenshotCount: number;
};

export type BuildPreviewFramingHoleSummary = {
  holeId: string;
  holeNumber: number;
  framingState: "rough" | "watch" | "ready";
  recommendedAction: string;
};

export type BuildPreviewFramingSummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  recommendedAction: string;
  holeSummaries: BuildPreviewFramingHoleSummary[];
};

export type PreviewCameraReadabilityHoleInput = BuildPreviewFramingHoleInput & {
  blockedFramingIssueCount: number;
  sightlineIssueCount: number;
  occlusionRiskCount: number;
};

export type PreviewCameraReadabilityHoleSummary = {
  holeId: string;
  holeNumber: number;
  readabilityState: "rough" | "watch" | "ready";
  blockingState: "blocked" | "watch" | "clear";
  recommendedAction: string;
};

export type PreviewCameraReadabilitySummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  blockedHoleCount: number;
  recommendedAction: string;
  holeSummaries: PreviewCameraReadabilityHoleSummary[];
};

export type CameraPathAuthoringHoleInput = BuildPreviewFramingHoleInput & {
  flyoverPlanState: "missing" | PreviewReadinessState;
  approvedScreenshotCount: number;
  showcaseSequenceCount: number;
  blockedSegmentCount: number;
  weakSegmentCount: number;
};

export type CameraPathAuthoringHoleSummary = {
  holeId: string;
  holeNumber: number;
  pathState: "rough" | "watch" | "ready";
  completenessState: "incomplete" | "watch" | "complete";
  landmarkSupportState: "weak" | "watch" | "ready";
  recommendedAction: string;
};

export type CameraPathAuthoringSummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  incompleteHoleCount: number;
  blockedHoleCount: number;
  weakLandmarkHoleCount: number;
  recommendedAction: string;
  holeSummaries: CameraPathAuthoringHoleSummary[];
};

export type CameraPathPlaybackPolishHoleInput = {
  holeId: string;
  holeNumber: number;
  routeDeliveryConfidence: "rough" | "watch" | "ready";
  previewAnchorCount: number;
  hasMinimapPath: boolean;
  hasFlyoverPlan: boolean;
  approvedScreenshotCount: number;
  showcaseSequenceCount: number;
  blockedSegmentCount: number;
  weakSegmentCount: number;
};

export type CameraPathPlaybackPolishHoleSummary = {
  holeId: string;
  holeNumber: number;
  polishState: "rough" | "watch" | "ready";
  continuityState: "abrupt" | "watch" | "smooth";
  primaryAction: string;
  recommendedAction: string;
};

export type CameraPathPlaybackPolishSummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  abruptHoleCount: number;
  polishGapHoleCount: number;
  recommendedAction: string;
  holeSummaries: CameraPathPlaybackPolishHoleSummary[];
};

export type CameraPathCorrectionToolActionKind =
  | "smooth-transition"
  | "open-blocked-segment"
  | "complete-key-view"
  | "reinforce-playback-support"
  | "ready";

export type CameraPathCorrectionToolHoleSummary = {
  holeId: string;
  holeNumber: number;
  correctionState: "rough" | "watch" | "ready";
  primaryAction: CameraPathCorrectionToolActionKind;
  recommendedAction: string;
};

export type CameraPathCorrectionToolSummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  blockedHoleCount: number;
  smoothingHoleCount: number;
  completionHoleCount: number;
  supportHoleCount: number;
  correctiveHoleCount: number;
  recommendedAction: string;
  holeSummaries: CameraPathCorrectionToolHoleSummary[];
};

export type CameraCaptureExecutionHoleInput = CameraPathAuthoringHoleInput & {
  capturedScreenshotCount: number;
  showcaseSequenceState: "missing" | PreviewReadinessState;
};

export type CameraCaptureExecutionActionKind =
  | "execute-flyover-pass"
  | "capture-key-shot"
  | "approve-capture-set"
  | "finalize-showcase-pass"
  | "ready";

export type CameraCaptureExecutionHoleSummary = {
  holeId: string;
  holeNumber: number;
  captureState: "rough" | "watch" | "ready";
  primaryAction: CameraCaptureExecutionActionKind;
  recommendedAction: string;
};

export type CameraCaptureExecutionSummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  incompleteHoleCount: number;
  captureHoleCount: number;
  approvalHoleCount: number;
  showcaseHoleCount: number;
  executableHoleCount: number;
  recommendedAction: string;
  holeSummaries: CameraCaptureExecutionHoleSummary[];
};

export type CameraShotSequencingActionKind =
  | "stabilize-preview-route"
  | "sequence-flyover-beats"
  | "sequence-key-view-set"
  | "sequence-showcase-flow"
  | "ready";

export type CameraShotSequencingHoleSummary = {
  holeId: string;
  holeNumber: number;
  sequencingState: "rough" | "watch" | "ready";
  primaryAction: CameraShotSequencingActionKind;
  sequenceGapCount: number;
  weakSequenceSegmentCount: number;
  recommendedAction: string;
};

export type CameraShotSequencingSummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  blockedHoleCount: number;
  missingSequenceHoleCount: number;
  weakSequenceHoleCount: number;
  sequenceGapHoleCount: number;
  polishGapHoleCount: number;
  recommendedAction: string;
  holeSummaries: CameraShotSequencingHoleSummary[];
};

export type ShotOrderApprovalHoleInput = CameraCaptureExecutionHoleInput & {
  minimapPathState: "missing" | PreviewReadinessState;
};

export type ShotOrderApprovalActionKind =
  | "approve-preview-route-order"
  | "approve-flyover-order"
  | "approve-key-view-order"
  | "approve-showcase-order"
  | "ready";

export type ShotOrderApprovalHoleSummary = {
  holeId: string;
  holeNumber: number;
  approvalState: "rough" | "watch" | "ready";
  primaryAction: ShotOrderApprovalActionKind;
  missingOrderSegmentCount: number;
  unapprovedSegmentCount: number;
  recommendedAction: string;
};

export type ShotOrderApprovalSummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  blockedHoleCount: number;
  missingOrderHoleCount: number;
  unapprovedHoleCount: number;
  approvalGapHoleCount: number;
  recommendedAction: string;
  holeSummaries: ShotOrderApprovalHoleSummary[];
};

export type ShotVariantSetRecordInput = {
  variantSetId: string;
  holeId: string;
  label: string;
  role: ShotVariantRole;
  readinessState: "missing" | PreviewReadinessState;
  shippingState: ShotVariantShippingState | null;
  previewPathCount: number;
  flyoverPlanCount: number;
  screenshotCount: number;
  approvedScreenshotCount: number;
  showcaseSequenceCount: number;
  familyCoverage: Array<"preview-route" | "flyover" | "key-view" | "showcase">;
};

export type ShotVariantSetActionKind =
  | "approve-primary-variant-set"
  | "compose-alternate-flyover-variant"
  | "compose-alternate-key-view-variant"
  | "compose-alternate-showcase-variant"
  | "ready";

export type ShotVariantSetHoleSummary = {
  holeId: string;
  holeNumber: number;
  variantState: "rough" | "watch" | "ready";
  primaryAction: ShotVariantSetActionKind;
  primaryVariantCount: number;
  alternateVariantCount: number;
  unapprovedVariantCount: number;
  missingVariantSegmentCount: number;
  recommendedAction: string;
};

export type ShotVariantSetSummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  blockedHoleCount: number;
  primaryVariantHoleCount: number;
  alternateVariantHoleCount: number;
  missingPrimaryHoleCount: number;
  unapprovedVariantHoleCount: number;
  variantGapHoleCount: number;
  recommendedAction: string;
  holeSummaries: ShotVariantSetHoleSummary[];
};

export type ShotVariantShippingDecisionActionKind =
  | "prepare-variant-set-first"
  | "select-primary-shipping-variant"
  | "select-alternate-flyover-shipping-variant"
  | "select-alternate-key-view-shipping-variant"
  | "select-alternate-showcase-shipping-variant"
  | "ready";

export type ShotVariantShippingDecisionHoleSummary = {
  holeId: string;
  holeNumber: number;
  shippingState: "rough" | "watch" | "ready";
  primaryAction: ShotVariantShippingDecisionActionKind;
  selectedVariantCount: number;
  candidateVariantCount: number;
  approvedNonShippingVariantCount: number;
  missingShippingFamilyCount: number;
  recommendedAction: string;
};

export type ShotVariantShippingDecisionSummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  selectedHoleCount: number;
  candidateHoleCount: number;
  approvedNonShippingHoleCount: number;
  selectedPrimaryHoleCount: number;
  selectedAlternateHoleCount: number;
  shippingGapHoleCount: number;
  recommendedAction: string;
  holeSummaries: ShotVariantShippingDecisionHoleSummary[];
};

export type ShotVariantShippingManifestHoleSummary = {
  holeId: string;
  holeNumber: number;
  manifestState: "rough" | "watch" | "ready";
  completenessState: "missing" | "partial" | "complete";
  selectedVariantCount: number;
  selectedPrimaryVariantCount: number;
  selectedAlternateVariantCount: number;
  heldBackVariantCount: number;
  selectedFamilyCount: number;
  missingManifestFamilyCount: number;
  recommendedAction: string;
};

export type ShotVariantShippingManifestSummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  selectedHoleCount: number;
  selectedPrimaryHoleCount: number;
  selectedAlternateHoleCount: number;
  heldBackHoleCount: number;
  incompleteManifestHoleCount: number;
  recommendedAction: string;
  holeSummaries: ShotVariantShippingManifestHoleSummary[];
};

export type LandmarkReadabilityCorrectionHoleInput = {
  holeId: string;
  holeNumber: number;
  landmarkRefCount: number;
  framingState: "rough" | "watch" | "ready";
  cameraPathState: "rough" | "watch" | "ready";
  previewReadabilityState: "rough" | "watch" | "ready";
  blockedViewCount: number;
  weakViewCount: number;
  routeDeliveryConfidence: "rough" | "watch" | "ready";
};

export type LandmarkReadabilityCorrectionHoleSummary = {
  holeId: string;
  holeNumber: number;
  correctionState: "rough" | "watch" | "ready";
  recommendedAction: string;
};

export type LandmarkReadabilityCorrectionSummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  blockedHoleCount: number;
  missingLandmarkHoleCount: number;
  recommendedAction: string;
  holeSummaries: LandmarkReadabilityCorrectionHoleSummary[];
};

export type LandmarkCorrectionActionKind =
  | "stage-landmark-support"
  | "open-view-corridor"
  | "reinforce-route-view"
  | "calm-presentation-view"
  | "ready";

export type LandmarkCorrectionActionHoleSummary = {
  holeId: string;
  holeNumber: number;
  actionState: "rough" | "watch" | "ready";
  primaryAction: LandmarkCorrectionActionKind;
  recommendedAction: string;
};

export type LandmarkCorrectionActionSummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  blockedHoleCount: number;
  correctiveHoleCount: number;
  missingLandmarkHoleCount: number;
  stageLandmarkHoleCount: number;
  openViewHoleCount: number;
  reinforceRouteHoleCount: number;
  calmPresentationHoleCount: number;
  recommendedAction: string;
  holeSummaries: LandmarkCorrectionActionHoleSummary[];
};

export type LandmarkViewCorridorToolActionKind =
  | "widen-view-corridor"
  | "shift-landmark-support"
  | "rebalance-route-corridor"
  | "calm-presentation-corridor"
  | "ready";

export type LandmarkViewCorridorToolHoleSummary = {
  holeId: string;
  holeNumber: number;
  toolState: "rough" | "watch" | "ready";
  primaryAction: LandmarkViewCorridorToolActionKind;
  recommendedAction: string;
};

export type LandmarkViewCorridorToolSummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  blockedHoleCount: number;
  corridorActionHoleCount: number;
  rebalanceHoleCount: number;
  calmHoleCount: number;
  recommendedAction: string;
  holeSummaries: LandmarkViewCorridorToolHoleSummary[];
};

export type LandmarkCorridorStagingHoleSummary = {
  holeId: string;
  holeNumber: number;
  stagingState: "rough" | "watch" | "ready";
  primaryAction: LandmarkViewCorridorToolActionKind;
  recommendedAction: string;
};

export type LandmarkCorridorStagingSummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  blockedHoleCount: number;
  stagingHoleCount: number;
  reinforceHoleCount: number;
  calmHoleCount: number;
  correctiveHoleCount: number;
  recommendedAction: string;
  holeSummaries: LandmarkCorridorStagingHoleSummary[];
};

export type LandmarkCorridorSupportKitActionKind =
  | "open-view-corridor-kit"
  | "anchor-landmark-support-kit"
  | "rebalance-route-support-kit"
  | "calm-presentation-corridor-kit"
  | "ready";

export type LandmarkCorridorSupportKitHoleSummary = {
  holeId: string;
  holeNumber: number;
  kitState: "rough" | "watch" | "ready";
  primaryKit: LandmarkCorridorSupportKitActionKind;
  blockedViewCount: number;
  weakViewCount: number;
  recommendedAction: string;
};

export type LandmarkCorridorSupportKitSummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  blockedHoleCount: number;
  anchorKitHoleCount: number;
  openKitHoleCount: number;
  rebalanceKitHoleCount: number;
  calmKitHoleCount: number;
  correctiveHoleCount: number;
  recommendedAction: string;
  holeSummaries: LandmarkCorridorSupportKitHoleSummary[];
};

export type LandmarkCorridorKitCompositionActionKind =
  | "compose-open-support-bundle"
  | "compose-route-support-bundle"
  | "compose-presentation-calm-bundle"
  | "compose-hybrid-support-bundle"
  | "ready";

export type LandmarkCorridorKitCompositionHoleSummary = {
  holeId: string;
  holeNumber: number;
  compositionState: "rough" | "watch" | "ready";
  primaryBundle: LandmarkCorridorKitCompositionActionKind;
  recommendedAction: string;
};

export type LandmarkCorridorKitCompositionSummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  blockedHoleCount: number;
  openSupportBundleHoleCount: number;
  routeSupportBundleHoleCount: number;
  presentationCalmBundleHoleCount: number;
  hybridBundleHoleCount: number;
  correctiveHoleCount: number;
  recommendedAction: string;
  holeSummaries: LandmarkCorridorKitCompositionHoleSummary[];
};

export type ReleaseFacingWorldReadabilityHoleInput = {
  holeId: string;
  holeNumber: number;
  landmarkRefCount: number;
  screenshotCount: number;
  routeDeliveryConfidence: "rough" | "watch" | "ready";
  framingState: "rough" | "watch" | "ready";
  previewReadabilityState: "rough" | "watch" | "ready";
  terrainFinishBalanceState: "balanced" | "watch" | "imbalanced";
};

export type ReleaseFacingWorldReadabilityHoleSummary = {
  holeId: string;
  holeNumber: number;
  readabilityState: "rough" | "watch" | "ready";
  recommendedAction: string;
};

export type ReleaseFacingWorldReadabilitySummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  weakLandmarkHoleCount: number;
  finishWatchHoleCount: number;
  routeWatchHoleCount: number;
  recommendedAction: string;
  holeSummaries: ReleaseFacingWorldReadabilityHoleSummary[];
};

export type FinalReleasePresentationHoleInput = {
  holeId: string;
  holeNumber: number;
  routeDeliveryConfidence: "rough" | "watch" | "ready";
  framingState: "rough" | "watch" | "ready";
  cameraPathState: "rough" | "watch" | "ready";
  previewReadabilityState: "rough" | "watch" | "ready";
  landmarkCorrectionState: "rough" | "watch" | "ready";
  releaseReadabilityState: "rough" | "watch" | "ready";
  terrainFinishBalanceState: "balanced" | "watch" | "imbalanced";
};

export type FinalReleasePresentationHoleSummary = {
  holeId: string;
  holeNumber: number;
  presentationState: "rough" | "watch" | "ready";
  recommendedAction: string;
};

export type FinalReleasePresentationConfidenceSummary = {
  overallState: "rough" | "watch" | "ready";
  readyHoleCount: number;
  watchHoleCount: number;
  roughHoleCount: number;
  blockedHoleCount: number;
  presentationGapHoleCount: number;
  recommendedAction: string;
  holeSummaries: FinalReleasePresentationHoleSummary[];
};

export function summarizeBuildToPreviewFraming(input: {
  holes: BuildPreviewFramingHoleInput[];
}): BuildPreviewFramingSummary {
  const holeSummaries: BuildPreviewFramingHoleSummary[] = input.holes.map((hole) => {
    const framingState: BuildPreviewFramingHoleSummary["framingState"] =
      hole.routeDeliveryConfidence === "rough" ||
      hole.previewAnchorCount === 0 ||
      !hole.hasFlyoverPlan ||
      !hole.hasMinimapPath
        ? "rough"
        : hole.routeDeliveryConfidence === "watch" || hole.landmarkRefCount === 0 || hole.screenshotCount === 0
          ? "watch"
          : "ready";

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      framingState,
      recommendedAction:
        framingState === "ready"
          ? "Build and Preview framing are aligned strongly enough for delivery review."
          : framingState === "watch"
            ? "Tighten landmark coverage, screenshots, or route framing before trusting this hole’s presentation."
            : "Preview anchors, minimap/flyover coverage, or route delivery confidence still need correction before this hole will frame well."
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.framingState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.framingState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.framingState === "rough").length;
  const overallState: BuildPreviewFramingSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    recommendedAction:
      overallState === "ready"
        ? "Build and Preview framing now read consistently enough for final presentation review."
        : overallState === "watch"
          ? "Use the remaining watch holes to tighten the handoff from worldbuilding to presentation."
          : "Correct the weak holes before trusting Build-to-Preview framing continuity.",
    holeSummaries
  };
}

export function summarizeCameraPathAuthoring(input: {
  holes: CameraPathAuthoringHoleInput[];
}): CameraPathAuthoringSummary {
  const holeSummaries: CameraPathAuthoringHoleSummary[] = input.holes.map((hole) => {
    const completenessState: CameraPathAuthoringHoleSummary["completenessState"] =
      hole.previewAnchorCount === 0 || !hole.hasMinimapPath || hole.flyoverPlanState === "missing"
        ? "incomplete"
        : !isReadyLike(hole.flyoverPlanState) || hole.approvedScreenshotCount === 0
          ? "watch"
          : "complete";
    const landmarkSupportState: CameraPathAuthoringHoleSummary["landmarkSupportState"] =
      hole.landmarkRefCount === 0
        ? "weak"
        : hole.landmarkRefCount === 1 || hole.weakSegmentCount > 0
          ? "watch"
          : "ready";
    const pathState: CameraPathAuthoringHoleSummary["pathState"] =
      completenessState === "incomplete" ||
      hole.blockedSegmentCount > 0 ||
      hole.routeDeliveryConfidence === "rough"
        ? "rough"
        : completenessState === "watch" ||
            landmarkSupportState !== "ready" ||
            hole.routeDeliveryConfidence === "watch" ||
            hole.showcaseSequenceCount === 0 ||
            hole.weakSegmentCount > 0
          ? "watch"
          : "ready";

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      pathState,
      completenessState,
      landmarkSupportState,
      recommendedAction:
        pathState === "ready"
          ? "Camera-path authoring is complete enough to trust flyover, screenshot, and showcase framing on this hole."
          : pathState === "watch"
            ? "Tighten key-view coverage, approved stills, or landmark support before trusting this hole’s camera path."
            : "Correct missing anchors, blocked path segments, or incomplete flyover/minimap support before trusting this hole’s camera path."
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.pathState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.pathState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.pathState === "rough").length;
  const incompleteHoleCount = holeSummaries.filter((hole) => hole.completenessState === "incomplete").length;
  const blockedHoleCount = input.holes.filter((hole) => hole.blockedSegmentCount > 0).length;
  const weakLandmarkHoleCount = holeSummaries.filter((hole) => hole.landmarkSupportState !== "ready").length;
  const overallState: CameraPathAuthoringSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    incompleteHoleCount,
    blockedHoleCount,
    weakLandmarkHoleCount,
    recommendedAction:
      overallState === "ready"
        ? "Camera paths are complete enough to trust the course’s flyovers, screenshots, and showcase reveal."
        : overallState === "watch"
          ? "Use the remaining watch holes to tighten key views, landmark support, and approved capture coverage."
          : "Correct incomplete or blocked camera-path holes before trusting Preview as presentation truth.",
    holeSummaries
  };
}

export function summarizeCameraPathPlaybackPolish(input: {
  holes: CameraPathPlaybackPolishHoleInput[];
}): CameraPathPlaybackPolishSummary {
  const holeSummaries: CameraPathPlaybackPolishHoleSummary[] = input.holes.map((hole) => {
    const continuityState: CameraPathPlaybackPolishHoleSummary["continuityState"] =
      hole.blockedSegmentCount > 0 || hole.weakSegmentCount >= 2
        ? "abrupt"
        : hole.weakSegmentCount > 0 || hole.routeDeliveryConfidence === "watch"
          ? "watch"
          : "smooth";
    const polishState: CameraPathPlaybackPolishHoleSummary["polishState"] =
      hole.previewAnchorCount === 0 ||
      !hole.hasFlyoverPlan ||
      hole.routeDeliveryConfidence === "rough" ||
      continuityState === "abrupt"
        ? "rough"
        : !hole.hasMinimapPath ||
            hole.approvedScreenshotCount === 0 ||
            hole.showcaseSequenceCount === 0 ||
            continuityState === "watch"
          ? "watch"
          : "ready";

    const primaryAction =
      polishState === "ready"
        ? "Playback reads smoothly enough for share-ready preview review."
        : continuityState === "abrupt"
          ? "Open the abrupt segment and restage the camera transition before trusting playback."
          : hole.approvedScreenshotCount === 0 || hole.showcaseSequenceCount === 0
            ? "Approve a hero frame and extend showcase support so playback resolves into a strong reveal."
            : "Smooth the weak path transition so the shot reads as one calm sequence.";

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      polishState,
      continuityState,
      primaryAction,
      recommendedAction:
        polishState === "ready"
          ? "Playback and shot continuity are calm enough to trust this hole in flyovers, showcase passes, and screenshot framing."
          : polishState === "watch"
            ? "Polish the weaker transitions or add support media before treating this hole as presentation-ready."
            : "Correct abrupt playback gaps, missing anchors, or blocked segments before trusting this hole in presentation playback."
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.polishState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.polishState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.polishState === "rough").length;
  const abruptHoleCount = holeSummaries.filter((hole) => hole.continuityState === "abrupt").length;
  const polishGapHoleCount = holeSummaries.filter((hole) => hole.polishState !== "ready").length;
  const overallState: CameraPathPlaybackPolishSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    abruptHoleCount,
    polishGapHoleCount,
    recommendedAction:
      overallState === "ready"
        ? "Camera playback now reads smoothly enough to trust preview routes, flyovers, and showcase handoff."
        : overallState === "watch"
          ? "Use the remaining playback-polish holes to smooth weak transitions and calm the final presentation rhythm."
          : "Correct abrupt or incomplete camera playback before treating Preview as share-ready presentation truth.",
    holeSummaries
  };
}

export function summarizeCameraPathCorrectionTools(input: {
  holes: CameraPathPlaybackPolishHoleInput[];
}): CameraPathCorrectionToolSummary {
  const holeSummaries: CameraPathCorrectionToolHoleSummary[] = input.holes.map((hole) => {
    const primaryAction: CameraPathCorrectionToolActionKind =
      hole.blockedSegmentCount > 0
        ? "open-blocked-segment"
        : hole.routeDeliveryConfidence === "rough" || hole.weakSegmentCount >= 2
          ? "smooth-transition"
          : !hole.hasFlyoverPlan || !hole.hasMinimapPath || hole.approvedScreenshotCount === 0
            ? "complete-key-view"
            : hole.showcaseSequenceCount === 0 || hole.weakSegmentCount > 0
              ? "reinforce-playback-support"
              : "ready";
    const correctionState: CameraPathCorrectionToolHoleSummary["correctionState"] =
      primaryAction === "open-blocked-segment" || primaryAction === "smooth-transition"
        ? "rough"
        : primaryAction === "ready"
          ? "ready"
          : "watch";

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      correctionState,
      primaryAction,
      recommendedAction:
        primaryAction === "ready"
          ? "Playback posture is calm enough that this hole no longer needs a direct camera correction pass."
          : primaryAction === "open-blocked-segment"
            ? "Open the blocked segment and re-stage the camera corridor before treating this hole as showcase-safe."
            : primaryAction === "smooth-transition"
              ? "Smooth the abrupt transition so the flyover or showcase path reads as one deliberate sequence."
              : primaryAction === "complete-key-view"
                ? "Finish the missing flyover, minimap, or hero-frame support before trusting this hole’s preview path."
                : "Reinforce the weaker playback support so the final path resolves into a calmer reveal."
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.correctionState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.correctionState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.correctionState === "rough").length;
  const blockedHoleCount = holeSummaries.filter((hole) => hole.primaryAction === "open-blocked-segment").length;
  const smoothingHoleCount = holeSummaries.filter((hole) => hole.primaryAction === "smooth-transition").length;
  const completionHoleCount = holeSummaries.filter((hole) => hole.primaryAction === "complete-key-view").length;
  const supportHoleCount = holeSummaries.filter((hole) => hole.primaryAction === "reinforce-playback-support").length;
  const correctiveHoleCount = holeSummaries.filter((hole) => hole.primaryAction !== "ready").length;
  const overallState: CameraPathCorrectionToolSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    blockedHoleCount,
    smoothingHoleCount,
    completionHoleCount,
    supportHoleCount,
    correctiveHoleCount,
    recommendedAction:
      overallState === "ready"
        ? "Direct camera-correction work is calm enough that Preview can focus on final approval instead of path repair."
        : overallState === "watch"
          ? "Use the remaining watch holes to complete key views and reinforce support before final presentation review."
          : "Run the rough holes through direct camera correction before trusting the course as share-ready presentation media.",
    holeSummaries
  };
}

export function summarizeCameraCaptureExecution(input: {
  holes: CameraCaptureExecutionHoleInput[];
}): CameraCaptureExecutionSummary {
  const holeSummaries: CameraCaptureExecutionHoleSummary[] = input.holes.map((hole) => {
    const primaryAction: CameraCaptureExecutionActionKind =
      hole.previewAnchorCount === 0 ||
      !hole.hasMinimapPath ||
      hole.flyoverPlanState === "missing" ||
      hole.routeDeliveryConfidence === "rough" ||
      hole.blockedSegmentCount > 0
        ? "execute-flyover-pass"
        : hole.capturedScreenshotCount === 0 || hole.approvedScreenshotCount === 0
          ? "capture-key-shot"
          : hole.capturedScreenshotCount > hole.approvedScreenshotCount
            ? "approve-capture-set"
            : hole.showcaseSequenceState === "missing" || !isReadyLike(hole.showcaseSequenceState)
              ? "finalize-showcase-pass"
              : "ready";
    const captureState: CameraCaptureExecutionHoleSummary["captureState"] =
      primaryAction === "execute-flyover-pass"
        ? "rough"
        : primaryAction === "ready"
          ? "ready"
          : "watch";

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      captureState,
      primaryAction,
      recommendedAction:
        primaryAction === "ready"
          ? "Capture posture is calm enough that this hole can move through final presentation review without another execution pass."
          : primaryAction === "execute-flyover-pass"
            ? "Complete the flyover or route-support pass before treating this hole as capture-ready."
            : primaryAction === "capture-key-shot"
              ? "Capture the missing key view or hero still so this hole has usable presentation coverage."
              : primaryAction === "approve-capture-set"
                ? "Approve the captured supporting media so this hole can move from rough capture into final handoff."
                : "Finalize the showcase support so the hole’s captured media reads as one deliberate reveal."
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.captureState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.captureState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.captureState === "rough").length;
  const incompleteHoleCount = holeSummaries.filter((hole) => hole.primaryAction === "execute-flyover-pass").length;
  const captureHoleCount = holeSummaries.filter((hole) => hole.primaryAction === "capture-key-shot").length;
  const approvalHoleCount = holeSummaries.filter((hole) => hole.primaryAction === "approve-capture-set").length;
  const showcaseHoleCount = holeSummaries.filter((hole) => hole.primaryAction === "finalize-showcase-pass").length;
  const executableHoleCount = holeSummaries.filter((hole) => hole.primaryAction !== "ready").length;
  const overallState: CameraCaptureExecutionSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    incompleteHoleCount,
    captureHoleCount,
    approvalHoleCount,
    showcaseHoleCount,
    executableHoleCount,
    recommendedAction:
      overallState === "ready"
        ? "Camera capture execution is calm enough that Preview can focus on final presentation approval instead of missing media passes."
        : overallState === "watch"
          ? "Use the remaining watch holes to capture missing stills, approve supporting shots, and finish showcase support."
          : "Finish the rough capture holes before treating the course as presentation-delivery media.",
    holeSummaries
  };
}

export function summarizeCameraShotSequencing(input: {
  holes: CameraCaptureExecutionHoleInput[];
}): CameraShotSequencingSummary {
  const holeSummaries: CameraShotSequencingHoleSummary[] = input.holes.map((hole) => {
    const sequenceGapCount =
      Number(!hole.hasMinimapPath || hole.previewAnchorCount === 0) +
      Number(!hole.hasFlyoverPlan || hole.flyoverPlanState === "missing") +
      Number(hole.screenshotCount === 0 || hole.approvedScreenshotCount === 0) +
      Number(hole.showcaseSequenceCount === 0 || hole.showcaseSequenceState === "missing");
    const weakSequenceSegmentCount =
      hole.weakSegmentCount +
      Number(hole.showcaseSequenceState === "draft") +
      Number(hole.capturedScreenshotCount > hole.approvedScreenshotCount);
    const primaryAction: CameraShotSequencingActionKind =
      !hole.hasMinimapPath || hole.previewAnchorCount === 0
        ? "stabilize-preview-route"
        : !hole.hasFlyoverPlan ||
            hole.flyoverPlanState === "missing" ||
            hole.routeDeliveryConfidence === "rough" ||
            hole.blockedSegmentCount > 0
          ? "sequence-flyover-beats"
          : hole.screenshotCount === 0 || hole.approvedScreenshotCount === 0
            ? "sequence-key-view-set"
            : hole.showcaseSequenceCount === 0 ||
                hole.showcaseSequenceState === "missing" ||
                !isReadyLike(hole.showcaseSequenceState)
              ? "sequence-showcase-flow"
              : hole.weakSegmentCount > 0 || hole.capturedScreenshotCount > hole.approvedScreenshotCount
                ? "sequence-flyover-beats"
                : "ready";
    const sequencingState: CameraShotSequencingHoleSummary["sequencingState"] =
      primaryAction === "stabilize-preview-route" || primaryAction === "sequence-flyover-beats"
        ? "rough"
        : primaryAction === "ready"
          ? "ready"
          : "watch";

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      sequencingState,
      primaryAction,
      sequenceGapCount,
      weakSequenceSegmentCount,
      recommendedAction:
        primaryAction === "ready"
          ? "Shot sequencing is calm enough that this hole reads like one deliberate reveal across route, flyover, stills, and showcase support."
          : primaryAction === "stabilize-preview-route"
            ? "Stabilize the preview route and anchor path first so sequencing work has a reliable lane to follow."
            : primaryAction === "sequence-flyover-beats"
              ? "Sequence the flyover beats and calm blocked transitions before trusting this hole in final capture review."
              : primaryAction === "sequence-key-view-set"
                ? "Fill the hero and supporting key views so the shot set resolves into a readable progression."
                : "Sequence the showcase flow so the hole finishes as one calm presentation packet instead of isolated captures."
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.sequencingState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.sequencingState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.sequencingState === "rough").length;
  const blockedHoleCount = input.holes.filter((hole) => hole.blockedSegmentCount > 0).length;
  const missingSequenceHoleCount = holeSummaries.filter((hole) => hole.sequenceGapCount > 0).length;
  const weakSequenceHoleCount = holeSummaries.filter((hole) => hole.weakSequenceSegmentCount > 0).length;
  const sequenceGapHoleCount = holeSummaries.filter((hole) => hole.primaryAction !== "ready").length;
  const overallState: CameraShotSequencingSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    blockedHoleCount,
    missingSequenceHoleCount,
    weakSequenceHoleCount,
    sequenceGapHoleCount,
    polishGapHoleCount: sequenceGapHoleCount,
    recommendedAction:
      overallState === "ready"
        ? "Shot sequencing is calm enough that Preview can trust the course as a coherent flyover, screenshot, and showcase story."
        : overallState === "watch"
          ? "Use the remaining watch holes to fill key views and showcase flow before final presentation approval."
          : "Stabilize rough preview routes or missing flyover beats before trusting the course as a sequenced presentation set.",
    holeSummaries
  };
}

export function summarizeShotOrderApproval(input: {
  holes: ShotOrderApprovalHoleInput[];
}): ShotOrderApprovalSummary {
  const holeSummaries: ShotOrderApprovalHoleSummary[] = input.holes.map((hole) => {
    const missingOrderSegmentCount =
      Number(hole.minimapPathState === "missing" || hole.previewAnchorCount === 0) +
      Number(hole.flyoverPlanState === "missing" || !hole.hasFlyoverPlan) +
      Number(hole.screenshotCount === 0) +
      Number(hole.showcaseSequenceCount === 0 || hole.showcaseSequenceState === "missing");
    const unapprovedSegmentCount =
      Number(hole.minimapPathState !== "approved") +
      Number(hole.flyoverPlanState !== "approved") +
      Number(hole.screenshotCount === 0 ? 1 : hole.approvedScreenshotCount < hole.screenshotCount) +
      Number(hole.showcaseSequenceState !== "approved");
    const primaryAction: ShotOrderApprovalActionKind =
      hole.minimapPathState === "missing" || hole.previewAnchorCount === 0
        ? "approve-preview-route-order"
        : hole.flyoverPlanState === "missing" || !hole.hasFlyoverPlan || hole.blockedSegmentCount > 0
          ? "approve-flyover-order"
          : hole.screenshotCount === 0 || hole.approvedScreenshotCount < hole.screenshotCount
            ? "approve-key-view-order"
            : hole.showcaseSequenceCount === 0 || hole.showcaseSequenceState !== "approved"
              ? "approve-showcase-order"
              : hole.weakSegmentCount > 0
                ? "approve-flyover-order"
                : "ready";
    const approvalState: ShotOrderApprovalHoleSummary["approvalState"] =
      primaryAction === "approve-preview-route-order" || primaryAction === "approve-flyover-order"
        ? "rough"
        : primaryAction === "ready"
          ? "ready"
          : "watch";

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      approvalState,
      primaryAction,
      missingOrderSegmentCount,
      unapprovedSegmentCount,
      recommendedAction:
        primaryAction === "ready"
          ? "Shot order is approved strongly enough that this hole can move from sequence review into final proofing."
          : primaryAction === "approve-preview-route-order"
            ? "Approve the preview-route order first so the reveal has a stable lane before final proofing."
            : primaryAction === "approve-flyover-order"
              ? "Approve the flyover order after calming weak or blocked transitions so the motion read stays deliberate."
              : primaryAction === "approve-key-view-order"
                ? "Approve the hero and supporting still order so the key-view set reads as one coherent packet."
                : "Approve the showcase order so the full hole reveal feels intentional before final share."
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.approvalState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.approvalState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.approvalState === "rough").length;
  const blockedHoleCount = input.holes.filter((hole) => hole.blockedSegmentCount > 0).length;
  const missingOrderHoleCount = holeSummaries.filter((hole) => hole.missingOrderSegmentCount > 0).length;
  const unapprovedHoleCount = holeSummaries.filter((hole) => hole.unapprovedSegmentCount > 0).length;
  const approvalGapHoleCount = holeSummaries.filter((hole) => hole.primaryAction !== "ready").length;
  const overallState: ShotOrderApprovalSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    blockedHoleCount,
    missingOrderHoleCount,
    unapprovedHoleCount,
    approvalGapHoleCount,
    recommendedAction:
      overallState === "ready"
        ? "Shot order approval is calm enough that Preview can trust the reveal sequence before the final share packet."
        : overallState === "watch"
          ? "Use the remaining watch holes to approve key-view and showcase order before final proofing."
          : "Finish the rough order approvals around preview routes or flyovers before trusting the final reveal sequence.",
    holeSummaries
  };
}

export function summarizeShotVariantSets(input: {
  holes: Array<
    Pick<
      ShotOrderApprovalHoleInput,
      | "holeId"
      | "holeNumber"
      | "blockedSegmentCount"
      | "weakSegmentCount"
      | "minimapPathState"
      | "flyoverPlanState"
      | "showcaseSequenceState"
      | "screenshotCount"
      | "approvedScreenshotCount"
      | "previewAnchorCount"
    > & { variants: ShotVariantSetRecordInput[] }
  >;
}): ShotVariantSetSummary {
  const holeSummaries: ShotVariantSetHoleSummary[] = input.holes.map((hole) => {
    const primaryVariants = hole.variants.filter((variant) => variant.role === "primary");
    const alternateVariants = hole.variants.filter((variant) => variant.role === "alternate");
    const approvedPrimaryVariants = primaryVariants.filter((variant) => variant.readinessState === "approved");
    const alternateFlyoverCount = alternateVariants.filter((variant) =>
      variant.familyCoverage.includes("flyover"),
    ).length;
    const alternateKeyViewCount = alternateVariants.filter((variant) =>
      variant.familyCoverage.includes("key-view"),
    ).length;
    const alternateShowcaseCount = alternateVariants.filter((variant) =>
      variant.familyCoverage.includes("showcase"),
    ).length;
    const unapprovedVariantCount = hole.variants.filter((variant) => variant.readinessState !== "approved").length;
    const missingVariantSegmentCount =
      Number(primaryVariants.length === 0) +
      Number(approvedPrimaryVariants.length === 0) +
      Number(alternateFlyoverCount === 0) +
      Number(alternateKeyViewCount === 0) +
      Number(alternateShowcaseCount === 0);
    const primaryAction: ShotVariantSetActionKind =
      primaryVariants.length === 0 ||
      approvedPrimaryVariants.length === 0 ||
      hole.previewAnchorCount === 0 ||
      hole.minimapPathState === "missing" ||
      hole.flyoverPlanState === "missing" ||
      hole.screenshotCount === 0 ||
      hole.showcaseSequenceState === "missing"
        ? "approve-primary-variant-set"
        : alternateFlyoverCount === 0 || hole.blockedSegmentCount > 0
          ? "compose-alternate-flyover-variant"
          : alternateKeyViewCount === 0 || hole.approvedScreenshotCount < hole.screenshotCount
            ? "compose-alternate-key-view-variant"
            : alternateShowcaseCount === 0 || hole.weakSegmentCount > 0
              ? "compose-alternate-showcase-variant"
              : "ready";
    const variantState: ShotVariantSetHoleSummary["variantState"] =
      primaryAction === "approve-primary-variant-set"
        ? "rough"
        : primaryAction === "ready"
          ? "ready"
          : "watch";

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      variantState,
      primaryAction,
      primaryVariantCount: primaryVariants.length,
      alternateVariantCount: alternateVariants.length,
      unapprovedVariantCount,
      missingVariantSegmentCount,
      recommendedAction:
        primaryAction === "ready"
          ? "Shot variants are calm enough that Preview can choose a primary reveal and still keep alternates ready for the final share gate."
          : primaryAction === "approve-primary-variant-set"
            ? "Approve and tag the primary reveal set first so the course has one trusted shipping sequence before adding alternates."
            : primaryAction === "compose-alternate-flyover-variant"
              ? "Compose an alternate flyover variant so blocked or overcommitted motion beats still have a backup reveal lane."
              : primaryAction === "compose-alternate-key-view-variant"
                ? "Compose an alternate key-view variant so the still-image set can flex at final proofing without losing coverage."
                : "Compose an alternate showcase variant so final share can choose between primary and calmer backup pacing.",
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.variantState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.variantState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.variantState === "rough").length;
  const blockedHoleCount = input.holes.filter((hole) => hole.blockedSegmentCount > 0).length;
  const primaryVariantHoleCount = holeSummaries.filter((hole) => hole.primaryVariantCount > 0).length;
  const alternateVariantHoleCount = holeSummaries.filter((hole) => hole.alternateVariantCount > 0).length;
  const missingPrimaryHoleCount = holeSummaries.filter((hole) => hole.primaryVariantCount === 0).length;
  const unapprovedVariantHoleCount = holeSummaries.filter((hole) => hole.unapprovedVariantCount > 0).length;
  const variantGapHoleCount = holeSummaries.filter((hole) => hole.primaryAction !== "ready").length;
  const overallState: ShotVariantSetSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    blockedHoleCount,
    primaryVariantHoleCount,
    alternateVariantHoleCount,
    missingPrimaryHoleCount,
    unapprovedVariantHoleCount,
    variantGapHoleCount,
    recommendedAction:
      overallState === "ready"
        ? "Shot variant sets are calm enough that creators can choose a shipping reveal without losing a credible alternate."
        : overallState === "watch"
          ? "Use the remaining watch holes to compose alternate variants before the final share gate has to choose what ships."
          : "Approve the primary reveal sets first so Preview has one trusted lane before variant choice becomes a share decision.",
    holeSummaries,
  };
}

function variantFamilyCoverageSet(variants: ShotVariantSetRecordInput[]) {
  return variants.reduce<Set<"preview-route" | "flyover" | "key-view" | "showcase">>((families, variant) => {
    for (const family of variant.familyCoverage) {
      families.add(family);
    }
    return families;
  }, new Set());
}

export function summarizeShotVariantShippingDecisions(input: {
  holes: Array<
    Pick<
      ShotOrderApprovalHoleInput,
      | "holeId"
      | "holeNumber"
      | "blockedSegmentCount"
      | "weakSegmentCount"
      | "minimapPathState"
      | "flyoverPlanState"
      | "screenshotCount"
      | "showcaseSequenceState"
      | "previewAnchorCount"
    > & { variants: ShotVariantSetRecordInput[] }
  >;
}): ShotVariantShippingDecisionSummary {
  const holeSummaries: ShotVariantShippingDecisionHoleSummary[] = input.holes.map((hole) => {
    const readyVariants = hole.variants.filter((variant) => isReadyLike(variant.readinessState));
    const primaryVariants = readyVariants.filter((variant) => variant.role === "primary");
    const alternateVariants = readyVariants.filter((variant) => variant.role === "alternate");
    const alternateFlyoverVariants = alternateVariants.filter((variant) => variant.familyCoverage.includes("flyover"));
    const alternateKeyViewVariants = alternateVariants.filter((variant) => variant.familyCoverage.includes("key-view"));
    const alternateShowcaseVariants = alternateVariants.filter((variant) => variant.familyCoverage.includes("showcase"));
    const selectedVariants = readyVariants.filter((variant) => variant.shippingState === "selected");
    const selectedPrimaryVariants = selectedVariants.filter((variant) => variant.role === "primary");
    const selectedAlternateVariants = selectedVariants.filter((variant) => variant.role === "alternate");
    const selectedCoverage = variantFamilyCoverageSet(selectedVariants);
    const requiredFamilies: Array<"preview-route" | "flyover" | "key-view" | "showcase"> = [];

    if (hole.previewAnchorCount > 0 && hole.minimapPathState !== "missing") {
      requiredFamilies.push("preview-route");
    }
    if (hole.flyoverPlanState !== "missing") {
      requiredFamilies.push("flyover");
    }
    if (hole.screenshotCount > 0) {
      requiredFamilies.push("key-view");
    }
    if (hole.showcaseSequenceState !== "missing") {
      requiredFamilies.push("showcase");
    }

    const missingShippingFamilyCount = requiredFamilies.filter((family) => !selectedCoverage.has(family)).length;
    const candidateVariantCount = readyVariants.filter(
      (variant) => variant.shippingState === "candidate" || variant.shippingState === null || variant.shippingState === undefined,
    ).length;
    const approvedNonShippingVariantCount = readyVariants.filter((variant) => variant.shippingState !== "selected").length;
    const primaryAction: ShotVariantShippingDecisionActionKind =
      primaryVariants.length === 0
        ? "prepare-variant-set-first"
        : selectedVariants.length === 0 || missingShippingFamilyCount > 0
          ? "select-primary-shipping-variant"
          : hole.blockedSegmentCount > 0 &&
              alternateFlyoverVariants.length > 0 &&
              !alternateFlyoverVariants.some((variant) => variant.shippingState === "selected")
            ? "select-alternate-flyover-shipping-variant"
            : (hole.weakSegmentCount > 0 || !selectedCoverage.has("key-view")) &&
                alternateKeyViewVariants.length > 0 &&
                !alternateKeyViewVariants.some((variant) => variant.shippingState === "selected")
              ? "select-alternate-key-view-shipping-variant"
              : (hole.weakSegmentCount > 0 || !selectedCoverage.has("showcase")) &&
                  alternateShowcaseVariants.length > 0 &&
                  !alternateShowcaseVariants.some((variant) => variant.shippingState === "selected")
                ? "select-alternate-showcase-shipping-variant"
                : "ready";
    const shippingState: ShotVariantShippingDecisionHoleSummary["shippingState"] =
      primaryAction === "prepare-variant-set-first" || primaryAction === "select-primary-shipping-variant"
        ? "rough"
        : primaryAction === "ready"
          ? "ready"
          : "watch";

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      shippingState,
      primaryAction,
      selectedVariantCount: selectedVariants.length,
      candidateVariantCount,
      approvedNonShippingVariantCount,
      missingShippingFamilyCount,
      recommendedAction:
        primaryAction === "ready"
          ? "Variant shipping posture is calm enough that this hole has one selected reveal lane and credible alternates held back for proofing."
          : primaryAction === "prepare-variant-set-first"
            ? "Prepare and approve the primary variant set first so shipping decisions do not get made on incomplete reveal coverage."
            : primaryAction === "select-primary-shipping-variant"
              ? "Select the primary reveal as the shipping lane first, then keep alternates approved without forcing them into the share packet."
              : primaryAction === "select-alternate-flyover-shipping-variant"
                ? "Ship the alternate flyover for this hole so blocked motion beats do not weaken the final packet."
                : primaryAction === "select-alternate-key-view-shipping-variant"
                  ? "Ship the alternate key-view set so the final still-image lane stays calmer than the current primary read."
                  : "Ship the alternate showcase pacing for this hole so final share can stay smoother without losing coverage.",
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.shippingState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.shippingState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.shippingState === "rough").length;
  const selectedHoleCount = holeSummaries.filter((hole) => hole.selectedVariantCount > 0).length;
  const candidateHoleCount = holeSummaries.filter((hole) => hole.candidateVariantCount > 0).length;
  const approvedNonShippingHoleCount = holeSummaries.filter(
    (hole) => hole.approvedNonShippingVariantCount > 0,
  ).length;
  const selectedPrimaryHoleCount = input.holes.filter((hole) =>
    hole.variants.some(
      (variant) => variant.role === "primary" && variant.shippingState === "selected" && isReadyLike(variant.readinessState),
    ),
  ).length;
  const selectedAlternateHoleCount = input.holes.filter((hole) =>
    hole.variants.some(
      (variant) => variant.role === "alternate" && variant.shippingState === "selected" && isReadyLike(variant.readinessState),
    ),
  ).length;
  const shippingGapHoleCount = holeSummaries.filter((hole) => hole.primaryAction !== "ready").length;
  const overallState: ShotVariantShippingDecisionSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    selectedHoleCount,
    candidateHoleCount,
    approvedNonShippingHoleCount,
    selectedPrimaryHoleCount,
    selectedAlternateHoleCount,
    shippingGapHoleCount,
    recommendedAction:
      overallState === "ready"
        ? "Variant shipping decisions are calm enough that Preview can state exactly which reveal lane ships and which alternates stay approved but held back."
        : overallState === "watch"
          ? "Use the remaining watch holes to choose alternate shipping lanes where blocked or weak beats still pressure the current primary reveal."
          : "Finish primary shipping decisions before the final share packet tries to sign off on reveal variants.",
    holeSummaries,
  };
}

export function summarizeShotVariantShippingManifest(input: {
  holes: Array<
    Pick<
      ShotOrderApprovalHoleInput,
      | "holeId"
      | "holeNumber"
      | "minimapPathState"
      | "flyoverPlanState"
      | "screenshotCount"
      | "showcaseSequenceState"
      | "previewAnchorCount"
    > & { variants: ShotVariantSetRecordInput[] }
  >;
}): ShotVariantShippingManifestSummary {
  const holeSummaries: ShotVariantShippingManifestHoleSummary[] = input.holes.map((hole) => {
    const readyVariants = hole.variants.filter((variant) => isReadyLike(variant.readinessState));
    const selectedVariants = readyVariants.filter((variant) => variant.shippingState === "selected");
    const selectedPrimaryVariants = selectedVariants.filter((variant) => variant.role === "primary");
    const selectedAlternateVariants = selectedVariants.filter((variant) => variant.role === "alternate");
    const heldBackVariants = readyVariants.filter((variant) => variant.shippingState === "hold");
    const selectedCoverage = variantFamilyCoverageSet(selectedVariants);
    const requiredFamilies: Array<"preview-route" | "flyover" | "key-view" | "showcase"> = [];

    if (hole.previewAnchorCount > 0 && hole.minimapPathState !== "missing") {
      requiredFamilies.push("preview-route");
    }
    if (hole.flyoverPlanState !== "missing") {
      requiredFamilies.push("flyover");
    }
    if (hole.screenshotCount > 0) {
      requiredFamilies.push("key-view");
    }
    if (hole.showcaseSequenceState !== "missing") {
      requiredFamilies.push("showcase");
    }

    const missingManifestFamilyCount = requiredFamilies.filter((family) => !selectedCoverage.has(family)).length;
    const completenessState: ShotVariantShippingManifestHoleSummary["completenessState"] =
      selectedVariants.length === 0
        ? "missing"
        : missingManifestFamilyCount > 0
          ? "partial"
          : "complete";
    const manifestState: ShotVariantShippingManifestHoleSummary["manifestState"] =
      completenessState !== "complete"
        ? "rough"
        : heldBackVariants.length === 0 || selectedPrimaryVariants.length === 0
          ? "watch"
          : "ready";

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      manifestState,
      completenessState,
      selectedVariantCount: selectedVariants.length,
      selectedPrimaryVariantCount: selectedPrimaryVariants.length,
      selectedAlternateVariantCount: selectedAlternateVariants.length,
      heldBackVariantCount: heldBackVariants.length,
      selectedFamilyCount: selectedCoverage.size,
      missingManifestFamilyCount,
      recommendedAction:
        completenessState === "missing"
          ? "Select one shipping reveal lane first so the final packet can point at a concrete manifest instead of a candidate pool."
          : completenessState === "partial"
            ? "Complete the shipping manifest across the remaining preview families so the final share packet reflects the actual release lane."
            : heldBackVariants.length === 0
              ? "Hold back at least one approved alternate so the manifest distinguishes what ships from what stays in reserve."
              : selectedPrimaryVariants.length === 0
                ? "Keep the alternate shipping lane if it reads better, but hold the approved primary set as backup so the manifest stays calm."
                : "Shipping manifest posture is calm enough that creators can see what ships, what stays alternate, and what remains held back.",
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.manifestState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.manifestState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.manifestState === "rough").length;
  const selectedHoleCount = holeSummaries.filter((hole) => hole.selectedVariantCount > 0).length;
  const selectedPrimaryHoleCount = holeSummaries.filter((hole) => hole.selectedPrimaryVariantCount > 0).length;
  const selectedAlternateHoleCount = holeSummaries.filter((hole) => hole.selectedAlternateVariantCount > 0).length;
  const heldBackHoleCount = holeSummaries.filter((hole) => hole.heldBackVariantCount > 0).length;
  const incompleteManifestHoleCount = holeSummaries.filter((hole) => hole.completenessState !== "complete").length;
  const overallState: ShotVariantShippingManifestSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    selectedHoleCount,
    selectedPrimaryHoleCount,
    selectedAlternateHoleCount,
    heldBackHoleCount,
    incompleteManifestHoleCount,
    recommendedAction:
      overallState === "ready"
        ? "Shipping manifests are calm enough that the final share packet can say exactly which reveal set ships and which variants stay held back."
        : overallState === "watch"
          ? "Use the remaining watch holes to hold back one approved backup where needed so the manifest keeps shipping and reserve lanes distinct."
          : "Complete the shipping manifest before final share so the packet describes what is actually leaving the product instead of a loose variant pool.",
    holeSummaries,
  };
}

export function summarizePreviewCameraReadability(input: {
  holes: PreviewCameraReadabilityHoleInput[];
}): PreviewCameraReadabilitySummary {
  const holeSummaries: PreviewCameraReadabilityHoleSummary[] = input.holes.map((hole) => {
    const blockingState: PreviewCameraReadabilityHoleSummary["blockingState"] =
      hole.blockedFramingIssueCount > 0 || hole.occlusionRiskCount > 0
        ? "blocked"
        : hole.sightlineIssueCount > 0
          ? "watch"
          : "clear";
    const readabilityState: PreviewCameraReadabilityHoleSummary["readabilityState"] =
      blockingState === "blocked" ||
      hole.routeDeliveryConfidence === "rough" ||
      hole.previewAnchorCount === 0 ||
      !hole.hasFlyoverPlan ||
      !hole.hasMinimapPath
        ? "rough"
        : blockingState === "watch" ||
            hole.routeDeliveryConfidence === "watch" ||
            hole.landmarkRefCount === 0 ||
            hole.screenshotCount === 0
          ? "watch"
          : "ready";

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      readabilityState,
      blockingState,
      recommendedAction:
        readabilityState === "ready"
          ? "Camera blocking and route readability are strong enough for release-facing preview review."
          : readabilityState === "watch"
            ? "Tighten sightlines, landmarks, or supporting media before trusting this hole’s camera read."
            : "Correct blocked framing, missing anchors, or weak route readability before trusting this hole in Preview."
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.readabilityState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.readabilityState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.readabilityState === "rough").length;
  const blockedHoleCount = holeSummaries.filter((hole) => hole.blockingState === "blocked").length;
  const overallState: PreviewCameraReadabilitySummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    blockedHoleCount,
    recommendedAction:
      overallState === "ready"
        ? "Preview camera blocking reads clearly enough for final media review."
        : overallState === "watch"
          ? "Use the remaining watch holes to calm sightlines and landmark support before release media capture."
          : "Correct blocked or weak camera reads before trusting Preview as the final presentation truth.",
    holeSummaries
  };
}

export function summarizeLandmarkReadabilityCorrection(input: {
  holes: LandmarkReadabilityCorrectionHoleInput[];
}): LandmarkReadabilityCorrectionSummary {
  const holeSummaries: LandmarkReadabilityCorrectionHoleSummary[] = input.holes.map((hole) => {
    const correctionState: LandmarkReadabilityCorrectionHoleSummary["correctionState"] =
      hole.landmarkRefCount === 0 ||
      hole.blockedViewCount > 0 ||
      hole.cameraPathState === "rough" ||
      hole.previewReadabilityState === "rough"
        ? "rough"
        : hole.weakViewCount > 0 ||
            hole.landmarkRefCount === 1 ||
            hole.framingState === "watch" ||
            hole.cameraPathState === "watch" ||
            hole.routeDeliveryConfidence !== "ready"
          ? "watch"
          : "ready";

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      correctionState,
      recommendedAction:
        correctionState === "ready"
          ? "Landmark support is strong enough to keep route readability and release views stable."
          : correctionState === "watch"
            ? "Tighten landmark placement, route support, or weak views before trusting this hole’s readability."
            : "Correct blocked views or missing landmark support before trusting this hole’s presentation read."
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.correctionState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.correctionState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.correctionState === "rough").length;
  const blockedHoleCount = input.holes.filter((hole) => hole.blockedViewCount > 0).length;
  const missingLandmarkHoleCount = input.holes.filter((hole) => hole.landmarkRefCount === 0).length;
  const overallState: LandmarkReadabilityCorrectionSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    blockedHoleCount,
    missingLandmarkHoleCount,
    recommendedAction:
      overallState === "ready"
        ? "Landmark readability now supports the route, camera paths, and release-facing views strongly enough."
        : overallState === "watch"
          ? "Use the remaining watch holes to strengthen landmarks and calm weak route views."
          : "Correct blocked landmarks or missing route support before trusting release-facing readability.",
    holeSummaries
  };
}

export function summarizeLandmarkCorrectionActions(input: {
  holes: LandmarkReadabilityCorrectionHoleInput[];
}): LandmarkCorrectionActionSummary {
  const holeSummaries: LandmarkCorrectionActionHoleSummary[] = input.holes.map((hole) => {
    const primaryAction: LandmarkCorrectionActionKind =
      hole.landmarkRefCount === 0
        ? "stage-landmark-support"
        : hole.blockedViewCount > 0
          ? "open-view-corridor"
          : hole.weakViewCount > 0
            ? "reinforce-route-view"
            : hole.framingState === "watch" ||
                hole.cameraPathState === "watch" ||
                hole.previewReadabilityState === "watch" ||
                hole.routeDeliveryConfidence === "watch"
              ? "calm-presentation-view"
              : "ready";
    const actionState: LandmarkCorrectionActionHoleSummary["actionState"] =
      primaryAction === "stage-landmark-support" || primaryAction === "open-view-corridor"
        ? "rough"
        : primaryAction === "ready"
          ? "ready"
          : "watch";

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      actionState,
      primaryAction,
      recommendedAction:
        primaryAction === "ready"
          ? "Landmark support is stable enough to keep the route, preview, and release-facing read calm."
          : primaryAction === "stage-landmark-support"
            ? "Add or restage landmark support so the hole has a reliable visual anchor in route and presentation views."
            : primaryAction === "open-view-corridor"
              ? "Open the blocked landmark corridor before trusting this hole’s presentation read."
              : primaryAction === "reinforce-route-view"
                ? "Reinforce the landmark sequence around the route so weak views read clearly in motion."
                : "Calm the presentation view by tightening landmark spacing, framing support, or route emphasis."
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.actionState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.actionState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.actionState === "rough").length;
  const blockedHoleCount = input.holes.filter((hole) => hole.blockedViewCount > 0).length;
  const correctiveHoleCount = holeSummaries.filter((hole) => hole.primaryAction !== "ready").length;
  const missingLandmarkHoleCount = holeSummaries.filter(
    (hole) => hole.primaryAction === "stage-landmark-support",
  ).length;
  const stageLandmarkHoleCount = missingLandmarkHoleCount;
  const openViewHoleCount = holeSummaries.filter((hole) => hole.primaryAction === "open-view-corridor").length;
  const reinforceRouteHoleCount = holeSummaries.filter(
    (hole) => hole.primaryAction === "reinforce-route-view",
  ).length;
  const calmPresentationHoleCount = holeSummaries.filter(
    (hole) => hole.primaryAction === "calm-presentation-view",
  ).length;
  const overallState: LandmarkCorrectionActionSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    blockedHoleCount,
    correctiveHoleCount,
    missingLandmarkHoleCount,
    stageLandmarkHoleCount,
    openViewHoleCount,
    reinforceRouteHoleCount,
    calmPresentationHoleCount,
    recommendedAction:
      overallState === "ready"
        ? "Landmark correction work is calm enough that creators can trust route readability and share-ready views."
        : overallState === "watch"
          ? "Use the remaining action holes to reinforce weak landmark sequences before final presentation review."
          : "Correct missing or blocked landmark views before trusting the course as presentation-ready.",
    holeSummaries
  };
}

export function summarizeLandmarkViewCorridorTools(input: {
  holes: LandmarkReadabilityCorrectionHoleInput[];
}): LandmarkViewCorridorToolSummary {
  const holeSummaries: LandmarkViewCorridorToolHoleSummary[] = input.holes.map((hole) => {
    const primaryAction: LandmarkViewCorridorToolActionKind =
      hole.blockedViewCount > 0
        ? "widen-view-corridor"
        : hole.landmarkRefCount === 0
          ? "shift-landmark-support"
          : hole.weakViewCount > 0 || hole.routeDeliveryConfidence === "watch"
            ? "rebalance-route-corridor"
            : hole.framingState === "watch" || hole.previewReadabilityState === "watch"
              ? "calm-presentation-corridor"
              : "ready";
    const toolState: LandmarkViewCorridorToolHoleSummary["toolState"] =
      primaryAction === "widen-view-corridor" || primaryAction === "shift-landmark-support"
        ? "rough"
        : primaryAction === "ready"
          ? "ready"
          : "watch";

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      toolState,
      primaryAction,
      recommendedAction:
        primaryAction === "ready"
          ? "View-corridor support is calm enough that this hole no longer needs another readability corridor pass."
          : primaryAction === "widen-view-corridor"
            ? "Open and widen the landmark corridor before trusting this hole’s presentation framing."
            : primaryAction === "shift-landmark-support"
              ? "Shift or restage landmark support so the corridor has a stronger readable anchor."
              : primaryAction === "rebalance-route-corridor"
                ? "Rebalance the landmark corridor around the route so weak presentation views stop drifting."
                : "Calm the corridor emphasis so the landmark read feels deliberate instead of crowded."
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.toolState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.toolState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.toolState === "rough").length;
  const blockedHoleCount = input.holes.filter((hole) => hole.blockedViewCount > 0).length;
  const corridorActionHoleCount = holeSummaries.filter(
    (hole) =>
      hole.primaryAction === "widen-view-corridor" || hole.primaryAction === "shift-landmark-support",
  ).length;
  const rebalanceHoleCount = holeSummaries.filter((hole) => hole.primaryAction === "rebalance-route-corridor").length;
  const calmHoleCount = holeSummaries.filter((hole) => hole.primaryAction === "calm-presentation-corridor").length;
  const overallState: LandmarkViewCorridorToolSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    blockedHoleCount,
    corridorActionHoleCount,
    rebalanceHoleCount,
    calmHoleCount,
    recommendedAction:
      overallState === "ready"
        ? "Landmark corridor support is calm enough that creators can trust presentation-facing readability."
        : overallState === "watch"
          ? "Use the remaining watch holes to rebalance weak corridors before final share review."
          : "Correct blocked or under-supported landmark corridors before trusting the course in presentation views.",
    holeSummaries
  };
}

export function summarizeLandmarkCorridorStaging(input: {
  holes: LandmarkReadabilityCorrectionHoleInput[];
}): LandmarkCorridorStagingSummary {
  const holeSummaries: LandmarkCorridorStagingHoleSummary[] = input.holes.map((hole) => {
    const primaryAction: LandmarkViewCorridorToolActionKind =
      hole.blockedViewCount > 0
        ? "widen-view-corridor"
        : hole.landmarkRefCount === 0
          ? "shift-landmark-support"
          : hole.weakViewCount > 0 || hole.routeDeliveryConfidence === "watch"
            ? "rebalance-route-corridor"
            : hole.framingState === "watch" || hole.previewReadabilityState === "watch"
              ? "calm-presentation-corridor"
              : "ready";
    const stagingState: LandmarkCorridorStagingHoleSummary["stagingState"] =
      primaryAction === "widen-view-corridor" || primaryAction === "shift-landmark-support"
        ? "rough"
        : primaryAction === "ready"
          ? "ready"
          : "watch";

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      stagingState,
      primaryAction,
      recommendedAction:
        primaryAction === "ready"
          ? "Landmark corridor staging is calm enough that this hole reads clearly from route through presentation views."
          : primaryAction === "widen-view-corridor"
            ? "Open the blocked corridor first so the landmark sequence has room to read."
            : primaryAction === "shift-landmark-support"
              ? "Stage stronger landmark support into the corridor so the route gains a clear readable anchor."
              : primaryAction === "rebalance-route-corridor"
                ? "Re-stage corridor support around the route so landmark emphasis stays intentional."
                : "Calm the presentation corridor so landmark support reads strong without crowding the view."
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.stagingState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.stagingState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.stagingState === "rough").length;
  const blockedHoleCount = input.holes.filter((hole) => hole.blockedViewCount > 0).length;
  const stagingHoleCount = holeSummaries.filter(
    (hole) =>
      hole.primaryAction === "widen-view-corridor" || hole.primaryAction === "shift-landmark-support",
  ).length;
  const reinforceHoleCount = holeSummaries.filter(
    (hole) => hole.primaryAction === "rebalance-route-corridor",
  ).length;
  const calmHoleCount = holeSummaries.filter(
    (hole) => hole.primaryAction === "calm-presentation-corridor",
  ).length;
  const correctiveHoleCount = holeSummaries.filter((hole) => hole.primaryAction !== "ready").length;
  const overallState: LandmarkCorridorStagingSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    blockedHoleCount,
    stagingHoleCount,
    reinforceHoleCount,
    calmHoleCount,
    correctiveHoleCount,
    recommendedAction:
      overallState === "ready"
        ? "Landmark corridor staging is calm enough that creators can trust route support and presentation views."
        : overallState === "watch"
          ? "Use the remaining watch holes to rebalance corridor support before final share review."
          : "Restage blocked or under-supported landmark corridors before trusting the course as presentation-ready.",
    holeSummaries
  };
}

export function summarizeLandmarkCorridorSupportKits(input: {
  holes: LandmarkReadabilityCorrectionHoleInput[];
}): LandmarkCorridorSupportKitSummary {
  const holeSummaries: LandmarkCorridorSupportKitHoleSummary[] = input.holes.map((hole) => {
    const primaryKit: LandmarkCorridorSupportKitActionKind =
      hole.blockedViewCount > 0
        ? "open-view-corridor-kit"
        : hole.landmarkRefCount === 0
          ? "anchor-landmark-support-kit"
          : hole.weakViewCount > 0 || hole.routeDeliveryConfidence === "watch"
            ? "rebalance-route-support-kit"
            : hole.framingState === "watch" || hole.previewReadabilityState === "watch"
              ? "calm-presentation-corridor-kit"
              : "ready";
    const kitState: LandmarkCorridorSupportKitHoleSummary["kitState"] =
      primaryKit === "open-view-corridor-kit" || primaryKit === "anchor-landmark-support-kit"
        ? "rough"
        : primaryKit === "ready"
          ? "ready"
          : "watch";

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      kitState,
      primaryKit,
      blockedViewCount: hole.blockedViewCount,
      weakViewCount: hole.weakViewCount,
      recommendedAction:
        primaryKit === "ready"
          ? "Corridor support is strong enough that this hole no longer needs another landmark support kit."
          : primaryKit === "open-view-corridor-kit"
            ? "Apply the open-view kit so blocked landmark reads stop breaking the route and presentation corridor."
            : primaryKit === "anchor-landmark-support-kit"
              ? "Apply the anchor-support kit so the hole gains a clearer landmark spine through the corridor."
              : primaryKit === "rebalance-route-support-kit"
                ? "Apply the route-support kit so weak landmark emphasis rebalances around the playable line."
                : "Apply the calm-presentation kit so the corridor reads deliberate instead of visually crowded."
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.kitState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.kitState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.kitState === "rough").length;
  const blockedHoleCount = input.holes.filter((hole) => hole.blockedViewCount > 0).length;
  const openKitHoleCount = holeSummaries.filter((hole) => hole.primaryKit === "open-view-corridor-kit").length;
  const anchorKitHoleCount = holeSummaries.filter((hole) => hole.primaryKit === "anchor-landmark-support-kit").length;
  const rebalanceKitHoleCount = holeSummaries.filter(
    (hole) => hole.primaryKit === "rebalance-route-support-kit",
  ).length;
  const calmKitHoleCount = holeSummaries.filter(
    (hole) => hole.primaryKit === "calm-presentation-corridor-kit",
  ).length;
  const correctiveHoleCount = holeSummaries.filter((hole) => hole.primaryKit !== "ready").length;
  const overallState: LandmarkCorridorSupportKitSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    blockedHoleCount,
    anchorKitHoleCount,
    openKitHoleCount,
    rebalanceKitHoleCount,
    calmKitHoleCount,
    correctiveHoleCount,
    recommendedAction:
      overallState === "ready"
        ? "Landmark corridor support kits are calm enough that creators can trust view support before final share."
        : overallState === "watch"
          ? "Use the remaining watch holes to rebalance route or presentation kits before packet proofing."
          : "Apply open-view or anchor-support kits before trusting corridor support in the final presentation pass.",
    holeSummaries
  };
}

export function summarizeLandmarkCorridorKitComposition(input: {
  holes: LandmarkReadabilityCorrectionHoleInput[];
}): LandmarkCorridorKitCompositionSummary {
  const holeSummaries: LandmarkCorridorKitCompositionHoleSummary[] = input.holes.map((hole) => {
    const primaryBundle: LandmarkCorridorKitCompositionActionKind =
      hole.blockedViewCount > 0 && hole.landmarkRefCount === 0
        ? "compose-hybrid-support-bundle"
        : hole.blockedViewCount > 0
          ? "compose-open-support-bundle"
          : hole.landmarkRefCount === 0 || hole.weakViewCount > 0 || hole.routeDeliveryConfidence === "watch"
            ? "compose-route-support-bundle"
            : hole.framingState === "watch" || hole.previewReadabilityState === "watch"
              ? "compose-presentation-calm-bundle"
              : "ready";
    const compositionState: LandmarkCorridorKitCompositionHoleSummary["compositionState"] =
      primaryBundle === "compose-hybrid-support-bundle" || primaryBundle === "compose-open-support-bundle"
        ? "rough"
        : primaryBundle === "ready"
          ? "ready"
          : "watch";

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      compositionState,
      primaryBundle,
      recommendedAction:
        primaryBundle === "ready"
          ? "Corridor support bundles are calm enough that this hole no longer needs another composed support pass."
          : primaryBundle === "compose-hybrid-support-bundle"
            ? "Compose the hybrid corridor bundle so blocked reads, missing anchors, and route drift all settle in one pass."
            : primaryBundle === "compose-open-support-bundle"
              ? "Compose the open-support bundle so blocked landmark reads reopen before final presentation proofing."
              : primaryBundle === "compose-route-support-bundle"
                ? "Compose the route-support bundle so weak corridor support gains a stronger landmark spine."
                : "Compose the presentation-calm bundle so support remains readable without crowding the final view lane.",
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.compositionState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.compositionState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.compositionState === "rough").length;
  const blockedHoleCount = input.holes.filter((hole) => hole.blockedViewCount > 0).length;
  const openSupportBundleHoleCount = holeSummaries.filter(
    (hole) => hole.primaryBundle === "compose-open-support-bundle",
  ).length;
  const routeSupportBundleHoleCount = holeSummaries.filter(
    (hole) => hole.primaryBundle === "compose-route-support-bundle",
  ).length;
  const presentationCalmBundleHoleCount = holeSummaries.filter(
    (hole) => hole.primaryBundle === "compose-presentation-calm-bundle",
  ).length;
  const hybridBundleHoleCount = holeSummaries.filter(
    (hole) => hole.primaryBundle === "compose-hybrid-support-bundle",
  ).length;
  const correctiveHoleCount = holeSummaries.filter((hole) => hole.primaryBundle !== "ready").length;
  const overallState: LandmarkCorridorKitCompositionSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    blockedHoleCount,
    openSupportBundleHoleCount,
    routeSupportBundleHoleCount,
    presentationCalmBundleHoleCount,
    hybridBundleHoleCount,
    correctiveHoleCount,
    recommendedAction:
      overallState === "ready"
        ? "Corridor kit composition is calm enough that creators can trust the landmark support bundles before final share."
        : overallState === "watch"
          ? "Use the remaining watch holes to compose route or presentation bundles before final share approval."
          : "Compose the blocked or hybrid support bundles before trusting corridor support in the last proofing pass.",
    holeSummaries,
  };
}

export function summarizeReleaseFacingWorldReadability(input: {
  holes: ReleaseFacingWorldReadabilityHoleInput[];
}): ReleaseFacingWorldReadabilitySummary {
  const holeSummaries: ReleaseFacingWorldReadabilityHoleSummary[] = input.holes.map((hole) => {
    const readabilityState: ReleaseFacingWorldReadabilityHoleSummary["readabilityState"] =
      hole.previewReadabilityState === "rough" ||
      hole.routeDeliveryConfidence === "rough" ||
      hole.terrainFinishBalanceState === "imbalanced"
        ? "rough"
        : hole.previewReadabilityState === "watch" ||
            hole.routeDeliveryConfidence === "watch" ||
            hole.framingState === "watch" ||
            hole.landmarkRefCount === 0 ||
            hole.screenshotCount === 0 ||
            hole.terrainFinishBalanceState === "watch"
          ? "watch"
          : "ready";

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      readabilityState,
      recommendedAction:
        readabilityState === "ready"
          ? "The world reads clearly enough from route to landmark to finish treatment."
          : readabilityState === "watch"
            ? "Tighten landmark support, finish balance, or framing before calling this hole release-ready."
            : "Correct route, finish, or preview readability issues before trusting this hole at release time."
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.readabilityState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.readabilityState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.readabilityState === "rough").length;
  const weakLandmarkHoleCount = input.holes.filter((hole) => hole.landmarkRefCount === 0).length;
  const finishWatchHoleCount = input.holes.filter((hole) => hole.terrainFinishBalanceState !== "balanced").length;
  const routeWatchHoleCount = input.holes.filter((hole) => hole.routeDeliveryConfidence !== "ready").length;
  const overallState: ReleaseFacingWorldReadabilitySummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    weakLandmarkHoleCount,
    finishWatchHoleCount,
    routeWatchHoleCount,
    recommendedAction:
      overallState === "ready"
        ? "World readability is strong enough to support release-facing presentation and handoff."
        : overallState === "watch"
          ? "Use the remaining weak holes to tighten landmark support, finish balance, and route read before release."
          : "Correct the rough holes before trusting the course to read well in release-facing media and delivery.",
    holeSummaries
  };
}

export function summarizeFinalReleasePresentationConfidence(input: {
  holes: FinalReleasePresentationHoleInput[];
}): FinalReleasePresentationConfidenceSummary {
  const holeSummaries: FinalReleasePresentationHoleSummary[] = input.holes.map((hole) => {
    const presentationState: FinalReleasePresentationHoleSummary["presentationState"] =
      hole.routeDeliveryConfidence === "rough" ||
      hole.framingState === "rough" ||
      hole.cameraPathState === "rough" ||
      hole.previewReadabilityState === "rough" ||
      hole.landmarkCorrectionState === "rough" ||
      hole.releaseReadabilityState === "rough" ||
      hole.terrainFinishBalanceState === "imbalanced"
        ? "rough"
        : hole.routeDeliveryConfidence === "watch" ||
            hole.framingState === "watch" ||
            hole.cameraPathState === "watch" ||
            hole.previewReadabilityState === "watch" ||
            hole.landmarkCorrectionState === "watch" ||
            hole.releaseReadabilityState === "watch" ||
            hole.terrainFinishBalanceState === "watch"
          ? "watch"
          : "ready";

    return {
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      presentationState,
      recommendedAction:
        presentationState === "ready"
          ? "This hole presents cleanly enough to support final preview, publish, and package confidence."
          : presentationState === "watch"
            ? "Tighten the remaining presentation gaps before calling this hole release-ready."
            : "Correct camera, landmark, route, or finish issues before trusting this hole in final release media."
    };
  });

  const readyHoleCount = holeSummaries.filter((hole) => hole.presentationState === "ready").length;
  const watchHoleCount = holeSummaries.filter((hole) => hole.presentationState === "watch").length;
  const roughHoleCount = holeSummaries.filter((hole) => hole.presentationState === "rough").length;
  const blockedHoleCount = input.holes.filter(
    (hole) =>
      hole.cameraPathState === "rough" ||
      hole.previewReadabilityState === "rough" ||
      hole.landmarkCorrectionState === "rough",
  ).length;
  const presentationGapHoleCount = input.holes.filter(
    (hole) =>
      hole.framingState !== "ready" ||
      hole.cameraPathState !== "ready" ||
      hole.previewReadabilityState !== "ready" ||
      hole.landmarkCorrectionState !== "ready" ||
      hole.releaseReadabilityState !== "ready" ||
      hole.terrainFinishBalanceState !== "balanced",
  ).length;
  const overallState: FinalReleasePresentationConfidenceSummary["overallState"] =
    roughHoleCount > 0 ? "rough" : watchHoleCount > 0 ? "watch" : "ready";

  return {
    overallState,
    readyHoleCount,
    watchHoleCount,
    roughHoleCount,
    blockedHoleCount,
    presentationGapHoleCount,
    recommendedAction:
      overallState === "ready"
        ? "Release-facing presentation is calm enough to trust preview, packaging, publish, and creator handoff."
        : overallState === "watch"
          ? "Use the remaining weak holes to tighten the final presentation loop before release."
          : "Correct the rough presentation holes before trusting the course as share-ready.",
    holeSummaries
  };
}
