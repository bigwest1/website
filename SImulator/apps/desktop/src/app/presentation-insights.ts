import type { CourseProject } from "@course-creator-os/project-model";
import {
  createSpatialAnalysisReport,
  summarizeCourseScaleTerrainFinish,
  summarizeLandmarkCorridorBundleLibrary,
  summarizeLandmarkCorridorBundleRecommendations,
  summarizeSurfaceRuleCleanupReviewReplayTimeline,
  summarizeRoutingContinuity
} from "@course-creator-os/scene-authoring";
import {
  summarizeBuildToPreviewFraming,
  summarizeCameraCaptureExecution,
  summarizeShotOrderApproval,
  summarizeShotVariantShippingManifest,
  summarizeShotVariantShippingDecisions,
  summarizeShotVariantSets,
  summarizeCameraShotSequencing,
  summarizeCameraPathAuthoring,
  summarizeCameraPathCorrectionTools,
  summarizeCameraPathPlaybackPolish,
  summarizeFinalReleasePresentationConfidence,
  summarizeLandmarkCorridorSupportKits,
  summarizeLandmarkCorridorKitComposition,
  summarizeLandmarkCorridorStaging,
  summarizeLandmarkCorrectionActions,
  summarizeLandmarkReadabilityCorrection,
  summarizeLandmarkViewCorridorTools,
  summarizePreviewCameraReadability,
  summarizeReleaseFacingWorldReadability
} from "@course-creator-os/preview";

function screenshotStatusToPreviewReadiness(status: "planned" | "captured" | "approved") {
  return status === "approved" ? "approved" : status === "captured" ? "ready" : "draft";
}

export function summarizeProjectPresentationInsights(project: CourseProject) {
  const spatialAnalysis = createSpatialAnalysisReport(project.sceneAuthoring, project.simulatorLogic);
  const routingContinuity = summarizeRoutingContinuity(project.sceneAuthoring);
  const courseScaleTerrainFinish = summarizeCourseScaleTerrainFinish(project.sceneAuthoring);
  const corridorBundleLibrary = summarizeLandmarkCorridorBundleLibrary(project.sceneAuthoring);
  const cleanupReviewReplayTimeline = summarizeSurfaceRuleCleanupReviewReplayTimeline(project.sceneAuthoring);

  const holeInputs = project.holes.map((hole) => {
    const routeHoleSummary = routingContinuity.holeSummaries.find((summary) => summary.holeId === hole.holeId);
    const finishHoleSummary = courseScaleTerrainFinish.holeSummaries.find((summary) => summary.holeId === hole.holeId);
    const flyoverPlan = project.flyoverPlans.find((plan) => plan.holeRef === hole.holeId) ?? null;
    const minimapPath = project.previewPaths.find(
      (path) => path.previewType === "minimap" && path.holeRefs.includes(hole.holeId),
    ) ?? null;
    const holeScreenshots = project.screenshotPlans.filter((plan) => plan.holeRef === hole.holeId);
    const capturedScreenshotCount = holeScreenshots.filter((plan) => plan.status !== "planned").length;
    const approvedScreenshotCount = holeScreenshots.filter((plan) => plan.status === "approved").length;
    const holeShowcaseSequences = project.showcaseSequences.filter((sequence) =>
      sequence.shotRefs.some((shotRef) => holeScreenshots.some((plan) => plan.screenshotId === shotRef)),
    );
    const variantRecords = new Map<
      string,
      {
        variantSetId: string;
        label: string;
        role: "primary" | "alternate";
        readinessStates: Array<"missing" | "draft" | "ready" | "approved">;
        previewPathCount: number;
        flyoverPlanCount: number;
        screenshotCount: number;
        approvedScreenshotCount: number;
        showcaseSequenceCount: number;
        familyCoverage: Set<"preview-route" | "flyover" | "key-view" | "showcase">;
        shippingStates: Array<"candidate" | "selected" | "hold" | null>;
      }
    >();
    const upsertVariantRecord = (
      variantSetId: string,
      role: "primary" | "alternate",
      label: string,
    ) => {
      const existing = variantRecords.get(variantSetId);
      if (existing) {
        return existing;
      }
      const created = {
        variantSetId,
        label,
        role,
        readinessStates: [] as Array<"missing" | "draft" | "ready" | "approved">,
        previewPathCount: 0,
        flyoverPlanCount: 0,
        screenshotCount: 0,
        approvedScreenshotCount: 0,
        showcaseSequenceCount: 0,
        familyCoverage: new Set<"preview-route" | "flyover" | "key-view" | "showcase">(),
        shippingStates: [] as Array<"candidate" | "selected" | "hold" | null>,
      };
      variantRecords.set(variantSetId, created);
      return created;
    };
    const previewVariantAssets = project.previewPaths.filter((path) => path.holeRefs.includes(hole.holeId));
    for (const path of previewVariantAssets) {
      const role = path.shotVariantRole ?? "primary";
      const variantSetId = path.shotVariantSetId ?? `shot-variant-${hole.holeId}-primary`;
      const label = path.shotVariantLabel ?? `Hole ${hole.number} Primary Reveal`;
      const record = upsertVariantRecord(variantSetId, role, label);
      record.readinessStates.push(path.readinessState);
      record.previewPathCount += 1;
      record.familyCoverage.add(path.previewType === "minimap" ? "preview-route" : "flyover");
      record.shippingStates.push(path.shotVariantShippingState ?? null);
    }
    if (flyoverPlan) {
      const role = flyoverPlan.shotVariantRole ?? "primary";
      const variantSetId = flyoverPlan.shotVariantSetId ?? `shot-variant-${hole.holeId}-primary`;
      const label = flyoverPlan.shotVariantLabel ?? `Hole ${hole.number} Primary Reveal`;
      const record = upsertVariantRecord(variantSetId, role, label);
      record.readinessStates.push(flyoverPlan.readinessState);
      record.flyoverPlanCount += 1;
      record.familyCoverage.add("flyover");
      record.shippingStates.push(flyoverPlan.shotVariantShippingState ?? null);
    }
    for (const screenshot of holeScreenshots) {
      const role = screenshot.shotVariantRole ?? "primary";
      const variantSetId = screenshot.shotVariantSetId ?? `shot-variant-${hole.holeId}-primary`;
      const label = screenshot.shotVariantLabel ?? `Hole ${hole.number} Primary Reveal`;
      const record = upsertVariantRecord(variantSetId, role, label);
      record.readinessStates.push(screenshotStatusToPreviewReadiness(screenshot.status));
      record.screenshotCount += 1;
      record.approvedScreenshotCount += screenshot.status === "approved" ? 1 : 0;
      record.familyCoverage.add("key-view");
      record.shippingStates.push(screenshot.shotVariantShippingState ?? null);
    }
    for (const sequence of holeShowcaseSequences) {
      const role = sequence.shotVariantRole ?? "primary";
      const variantSetId = sequence.shotVariantSetId ?? `shot-variant-${hole.holeId}-primary`;
      const label = sequence.shotVariantLabel ?? `Hole ${hole.number} Primary Reveal`;
      const record = upsertVariantRecord(variantSetId, role, label);
      record.readinessStates.push(sequence.readinessState);
      record.showcaseSequenceCount += 1;
      record.familyCoverage.add("showcase");
      record.shippingStates.push(sequence.shotVariantShippingState ?? null);
    }
    const showcaseSequenceCount = holeShowcaseSequences.length;
    const showcaseSequenceState: "missing" | "draft" | "ready" | "approved" =
      holeShowcaseSequences.length === 0
        ? "missing"
        : holeShowcaseSequences.every((sequence) => sequence.readinessState === "approved")
          ? "approved"
          : holeShowcaseSequences.some(
                (sequence) => sequence.readinessState === "ready" || sequence.readinessState === "approved",
              )
            ? "ready"
            : "draft";
    const blockedFramingIssueCount = spatialAnalysis.previewFramingWeaknesses.filter(
      (issue) => issue.holeId === hole.holeId && issue.severity === "critical",
    ).length;
    const sightlineIssueCount = spatialAnalysis.sightlineQualityIssues.filter((issue) => issue.holeId === hole.holeId).length;
    const occlusionRiskCount = spatialAnalysis.occlusionRisks.filter((issue) => issue.holeId === hole.holeId).length;
    const shotVariantRecords = [...variantRecords.values()].map((variant) => {
      const readinessState =
        variant.readinessStates.every((state) => state === "approved")
          ? ("approved" as const)
          : variant.readinessStates.some((state) => state === "ready" || state === "approved")
            ? ("ready" as const)
            : variant.readinessStates.some((state) => state === "draft")
              ? ("draft" as const)
              : ("missing" as const);

      return {
        variantSetId: variant.variantSetId,
        holeId: hole.holeId,
        label: variant.label,
        role: variant.role,
        readinessState,
        shippingState: (
          variant.shippingStates.includes("selected")
            ? "selected"
            : variant.shippingStates.includes("hold")
              ? "hold"
              : variant.shippingStates.includes("candidate")
                ? "candidate"
                : null
        ) as "candidate" | "selected" | "hold" | null,
        previewPathCount: variant.previewPathCount,
        flyoverPlanCount: variant.flyoverPlanCount,
        screenshotCount: variant.screenshotCount,
        approvedScreenshotCount: variant.approvedScreenshotCount,
        showcaseSequenceCount: variant.showcaseSequenceCount,
        familyCoverage: [...variant.familyCoverage],
      };
    });

    return {
      holeId: hole.holeId,
      holeNumber: hole.number,
      landmarkRefCount: hole.landmarkRefs.length,
      routeDeliveryConfidence: routeHoleSummary?.deliveryConfidence ?? "rough",
      previewAnchorCount: project.sceneAuthoring.routingNodes.filter(
        (node) => node.holeId === hole.holeId && node.kind === "preview-anchor",
      ).length,
      minimapPathState: minimapPath?.readinessState ?? "missing",
      hasMinimapPath: project.previewPaths.some(
        (path) => path.previewType === "minimap" && path.holeRefs.includes(hole.holeId),
      ),
      hasFlyoverPlan: flyoverPlan !== null,
      flyoverPlanState: flyoverPlan?.readinessState ?? "missing",
      screenshotCount: holeScreenshots.length,
      capturedScreenshotCount,
      approvedScreenshotCount,
      showcaseSequenceCount,
      showcaseSequenceState,
      shotVariantSets: shotVariantRecords,
      blockedFramingIssueCount,
      sightlineIssueCount,
      occlusionRiskCount,
      terrainFinishBalanceState: finishHoleSummary?.balanceState ?? "imbalanced"
    };
  });

  const buildPreviewFraming = summarizeBuildToPreviewFraming({
    holes: holeInputs.map((hole) => ({
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      landmarkRefCount: hole.landmarkRefCount,
      routeDeliveryConfidence: hole.routeDeliveryConfidence,
      previewAnchorCount: hole.previewAnchorCount,
      hasMinimapPath: hole.hasMinimapPath,
      hasFlyoverPlan: hole.hasFlyoverPlan,
      screenshotCount: hole.screenshotCount
    }))
  });
  const previewCameraReadability = summarizePreviewCameraReadability({
    holes: holeInputs
  });
  const cameraPathAuthoring = summarizeCameraPathAuthoring({
    holes: holeInputs.map((hole) => ({
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      landmarkRefCount: hole.landmarkRefCount,
      routeDeliveryConfidence: hole.routeDeliveryConfidence,
      previewAnchorCount: hole.previewAnchorCount,
      hasMinimapPath: hole.hasMinimapPath,
      hasFlyoverPlan: hole.hasFlyoverPlan,
      flyoverPlanState: hole.flyoverPlanState,
      screenshotCount: hole.screenshotCount,
      approvedScreenshotCount: hole.approvedScreenshotCount,
      showcaseSequenceCount: hole.showcaseSequenceCount,
      blockedSegmentCount: hole.blockedFramingIssueCount + hole.occlusionRiskCount,
      weakSegmentCount: hole.sightlineIssueCount
    }))
  });
  const cameraPathPlaybackPolish = summarizeCameraPathPlaybackPolish({
    holes: holeInputs.map((hole) => ({
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      routeDeliveryConfidence: hole.routeDeliveryConfidence,
      previewAnchorCount: hole.previewAnchorCount,
      hasMinimapPath: hole.hasMinimapPath,
      hasFlyoverPlan: hole.hasFlyoverPlan,
      approvedScreenshotCount: hole.approvedScreenshotCount,
      showcaseSequenceCount: hole.showcaseSequenceCount,
      blockedSegmentCount: hole.blockedFramingIssueCount + hole.occlusionRiskCount,
      weakSegmentCount: hole.sightlineIssueCount
    }))
  });
  const cameraPathCorrections = summarizeCameraPathCorrectionTools({
    holes: holeInputs.map((hole) => ({
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      routeDeliveryConfidence: hole.routeDeliveryConfidence,
      previewAnchorCount: hole.previewAnchorCount,
      hasMinimapPath: hole.hasMinimapPath,
      hasFlyoverPlan: hole.hasFlyoverPlan,
      approvedScreenshotCount: hole.approvedScreenshotCount,
      showcaseSequenceCount: hole.showcaseSequenceCount,
      blockedSegmentCount: hole.blockedFramingIssueCount + hole.occlusionRiskCount,
      weakSegmentCount: hole.sightlineIssueCount
    }))
  });
  const cameraCaptureExecution = summarizeCameraCaptureExecution({
    holes: holeInputs.map((hole) => ({
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      landmarkRefCount: hole.landmarkRefCount,
      routeDeliveryConfidence: hole.routeDeliveryConfidence,
      previewAnchorCount: hole.previewAnchorCount,
      hasMinimapPath: hole.hasMinimapPath,
      hasFlyoverPlan: hole.hasFlyoverPlan,
      flyoverPlanState: hole.flyoverPlanState,
      screenshotCount: hole.screenshotCount,
      capturedScreenshotCount: hole.capturedScreenshotCount,
      approvedScreenshotCount: hole.approvedScreenshotCount,
      showcaseSequenceCount: hole.showcaseSequenceCount,
      showcaseSequenceState: hole.showcaseSequenceState,
      blockedSegmentCount: hole.blockedFramingIssueCount + hole.occlusionRiskCount,
      weakSegmentCount: hole.sightlineIssueCount
    }))
  });
  const cameraShotSequencing = summarizeCameraShotSequencing({
    holes: holeInputs.map((hole) => ({
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      landmarkRefCount: hole.landmarkRefCount,
      routeDeliveryConfidence: hole.routeDeliveryConfidence,
      previewAnchorCount: hole.previewAnchorCount,
      hasMinimapPath: hole.hasMinimapPath,
      hasFlyoverPlan: hole.hasFlyoverPlan,
      flyoverPlanState: hole.flyoverPlanState,
      screenshotCount: hole.screenshotCount,
      capturedScreenshotCount: hole.capturedScreenshotCount,
      approvedScreenshotCount: hole.approvedScreenshotCount,
      showcaseSequenceCount: hole.showcaseSequenceCount,
      showcaseSequenceState: hole.showcaseSequenceState,
      blockedSegmentCount: hole.blockedFramingIssueCount + hole.occlusionRiskCount,
      weakSegmentCount: hole.sightlineIssueCount
    }))
  });
  const shotOrderApproval = summarizeShotOrderApproval({
    holes: holeInputs.map((hole) => ({
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      landmarkRefCount: hole.landmarkRefCount,
      routeDeliveryConfidence: hole.routeDeliveryConfidence,
      previewAnchorCount: hole.previewAnchorCount,
      minimapPathState: hole.minimapPathState,
      hasMinimapPath: hole.hasMinimapPath,
      hasFlyoverPlan: hole.hasFlyoverPlan,
      flyoverPlanState: hole.flyoverPlanState,
      screenshotCount: hole.screenshotCount,
      capturedScreenshotCount: hole.capturedScreenshotCount,
      approvedScreenshotCount: hole.approvedScreenshotCount,
      showcaseSequenceCount: hole.showcaseSequenceCount,
      showcaseSequenceState: hole.showcaseSequenceState,
      blockedSegmentCount: hole.blockedFramingIssueCount + hole.occlusionRiskCount,
      weakSegmentCount: hole.sightlineIssueCount
    }))
  });
  const shotVariantSets = summarizeShotVariantSets({
    holes: holeInputs.map((hole) => ({
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      previewAnchorCount: hole.previewAnchorCount,
      minimapPathState: hole.minimapPathState,
      flyoverPlanState: hole.flyoverPlanState,
      screenshotCount: hole.screenshotCount,
      approvedScreenshotCount: hole.approvedScreenshotCount,
      showcaseSequenceState: hole.showcaseSequenceState,
      blockedSegmentCount: hole.blockedFramingIssueCount + hole.occlusionRiskCount,
      weakSegmentCount: hole.sightlineIssueCount,
      variants: hole.shotVariantSets
    }))
  });
  const shotVariantShippingDecisions = summarizeShotVariantShippingDecisions({
    holes: holeInputs.map((hole) => ({
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      previewAnchorCount: hole.previewAnchorCount,
      minimapPathState: hole.minimapPathState,
      flyoverPlanState: hole.flyoverPlanState,
      screenshotCount: hole.screenshotCount,
      showcaseSequenceState: hole.showcaseSequenceState,
      blockedSegmentCount: hole.blockedFramingIssueCount + hole.occlusionRiskCount,
      weakSegmentCount: hole.sightlineIssueCount,
      variants: hole.shotVariantSets
    }))
  });
  const shotVariantShippingManifest = summarizeShotVariantShippingManifest({
    holes: holeInputs.map((hole) => ({
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      previewAnchorCount: hole.previewAnchorCount,
      minimapPathState: hole.minimapPathState,
      flyoverPlanState: hole.flyoverPlanState,
      screenshotCount: hole.screenshotCount,
      showcaseSequenceState: hole.showcaseSequenceState,
      variants: hole.shotVariantSets
    }))
  });
  const landmarkReadabilityCorrection = summarizeLandmarkReadabilityCorrection({
    holes: holeInputs.map((hole) => ({
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      landmarkRefCount: hole.landmarkRefCount,
      framingState:
        buildPreviewFraming.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.framingState ?? "rough",
      cameraPathState:
        cameraPathAuthoring.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.pathState ?? "rough",
      previewReadabilityState:
        previewCameraReadability.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.readabilityState ??
        "rough",
      blockedViewCount: hole.blockedFramingIssueCount + hole.occlusionRiskCount,
      weakViewCount: hole.sightlineIssueCount,
      routeDeliveryConfidence: hole.routeDeliveryConfidence
    }))
  });
  const landmarkCorrectionActions = summarizeLandmarkCorrectionActions({
    holes: holeInputs.map((hole) => ({
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      landmarkRefCount: hole.landmarkRefCount,
      framingState:
        buildPreviewFraming.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.framingState ?? "rough",
      cameraPathState:
        cameraPathAuthoring.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.pathState ?? "rough",
      previewReadabilityState:
        previewCameraReadability.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.readabilityState ??
        "rough",
      blockedViewCount: hole.blockedFramingIssueCount + hole.occlusionRiskCount,
      weakViewCount: hole.sightlineIssueCount,
      routeDeliveryConfidence: hole.routeDeliveryConfidence
    }))
  });
  const landmarkViewCorridorTools = summarizeLandmarkViewCorridorTools({
    holes: holeInputs.map((hole) => ({
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      landmarkRefCount: hole.landmarkRefCount,
      framingState:
        buildPreviewFraming.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.framingState ?? "rough",
      cameraPathState:
        cameraPathAuthoring.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.pathState ?? "rough",
      previewReadabilityState:
        previewCameraReadability.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.readabilityState ??
        "rough",
      blockedViewCount: hole.blockedFramingIssueCount + hole.occlusionRiskCount,
      weakViewCount: hole.sightlineIssueCount,
      routeDeliveryConfidence: hole.routeDeliveryConfidence
    }))
  });
  const landmarkCorridorStaging = summarizeLandmarkCorridorStaging({
    holes: holeInputs.map((hole) => ({
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      landmarkRefCount: hole.landmarkRefCount,
      framingState:
        buildPreviewFraming.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.framingState ?? "rough",
      cameraPathState:
        cameraPathAuthoring.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.pathState ?? "rough",
      previewReadabilityState:
        previewCameraReadability.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.readabilityState ??
        "rough",
      blockedViewCount: hole.blockedFramingIssueCount + hole.occlusionRiskCount,
      weakViewCount: hole.sightlineIssueCount,
      routeDeliveryConfidence: hole.routeDeliveryConfidence
    }))
  });
  const landmarkCorridorSupportKits = summarizeLandmarkCorridorSupportKits({
    holes: holeInputs.map((hole) => ({
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      landmarkRefCount: hole.landmarkRefCount,
      framingState:
        buildPreviewFraming.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.framingState ?? "rough",
      cameraPathState:
        cameraPathAuthoring.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.pathState ?? "rough",
      previewReadabilityState:
        previewCameraReadability.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.readabilityState ??
        "rough",
      blockedViewCount: hole.blockedFramingIssueCount + hole.occlusionRiskCount,
      weakViewCount: hole.sightlineIssueCount,
      routeDeliveryConfidence: hole.routeDeliveryConfidence
    }))
  });
  const landmarkCorridorKitComposition = summarizeLandmarkCorridorKitComposition({
    holes: holeInputs.map((hole) => ({
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      landmarkRefCount: hole.landmarkRefCount,
      framingState:
        buildPreviewFraming.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.framingState ?? "rough",
      cameraPathState:
        cameraPathAuthoring.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.pathState ?? "rough",
      previewReadabilityState:
        previewCameraReadability.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.readabilityState ??
        "rough",
      blockedViewCount: hole.blockedFramingIssueCount + hole.occlusionRiskCount,
      weakViewCount: hole.sightlineIssueCount,
      routeDeliveryConfidence: hole.routeDeliveryConfidence
    }))
  });
  const corridorBundleRecommendations = summarizeLandmarkCorridorBundleRecommendations(project.sceneAuthoring, {
    holes: holeInputs.map((hole) => ({
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      blockedViewCount: hole.blockedFramingIssueCount + hole.occlusionRiskCount,
      weakViewCount: hole.sightlineIssueCount,
      routeDeliveryConfidence: hole.routeDeliveryConfidence
    }))
  });
  const releaseFacingWorldReadability = summarizeReleaseFacingWorldReadability({
    holes: holeInputs.map((hole) => ({
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      landmarkRefCount: hole.landmarkRefCount,
      screenshotCount: hole.screenshotCount,
      routeDeliveryConfidence: hole.routeDeliveryConfidence,
      framingState:
        buildPreviewFraming.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.framingState ?? "rough",
      previewReadabilityState:
        previewCameraReadability.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.readabilityState ??
        "rough",
      terrainFinishBalanceState: hole.terrainFinishBalanceState
    }))
  });
  const finalReleasePresentationConfidence = summarizeFinalReleasePresentationConfidence({
    holes: holeInputs.map((hole) => ({
      holeId: hole.holeId,
      holeNumber: hole.holeNumber,
      routeDeliveryConfidence: hole.routeDeliveryConfidence,
      framingState:
        buildPreviewFraming.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.framingState ?? "rough",
      cameraPathState:
        cameraPathAuthoring.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.pathState ?? "rough",
      previewReadabilityState:
        previewCameraReadability.holeSummaries.find((summary) => summary.holeId === hole.holeId)?.readabilityState ??
        "rough",
      landmarkCorrectionState:
        landmarkReadabilityCorrection.holeSummaries.find((summary) => summary.holeId === hole.holeId)
          ?.correctionState ?? "rough",
      releaseReadabilityState:
        releaseFacingWorldReadability.holeSummaries.find((summary) => summary.holeId === hole.holeId)
          ?.readabilityState ?? "rough",
      terrainFinishBalanceState: hole.terrainFinishBalanceState
    }))
  });

  return {
    spatialAnalysis,
    routingContinuity,
    courseScaleTerrainFinish,
    buildPreviewFraming,
    cameraPathAuthoring,
    cameraPathPlaybackPolish,
    cameraPathCorrections,
    cameraCaptureExecution,
    cameraShotSequencing,
    shotOrderApproval,
    shotVariantSets,
    shotVariantShippingDecisions,
    shotVariantShippingManifest,
    previewCameraReadability,
    landmarkReadabilityCorrection,
    landmarkCorrectionActions,
    landmarkViewCorridorTools,
    landmarkCorridorStaging,
    landmarkCorridorSupportKits,
    landmarkCorridorKitComposition,
    corridorBundleLibrary,
    corridorBundleRecommendations,
    cleanupReviewReplayTimeline,
    releaseFacingWorldReadability,
    finalReleasePresentationConfidence
  };
}
