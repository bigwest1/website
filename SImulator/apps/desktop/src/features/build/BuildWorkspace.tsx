import { MetricChip, SectionHeader } from "@course-creator-os/ui";
import {
  summarizeCreatorDeliveryFlow,
  summarizeCreatorReleaseHandoff,
  summarizeFinalCreatorDelivery,
  summarizeFinalShareGateApproval,
  summarizePresentationPacketProofing,
  summarizePresentationShareDeliveryConfidence,
  summarizePresentationSharePacketFinalization,
  summarizeReleaseExecutionState,
  summarizeShareReadyPresentationHandoff
} from "@course-creator-os/packaging";
import {
  summarizeLandmarkCorridorBundleLibrary,
  summarizePlacementPresetLibrary,
  summarizeRouteFinishReconciliation,
  summarizeRoutingContinuity,
  summarizeSceneryBrushPresetLibrary,
  summarizeSceneAuthoringState,
  summarizeSurfaceRuleAuthoring,
  summarizeSurfaceRuleCleanupAutomation,
  summarizeSurfaceRuleCleanupReview,
  summarizeSurfaceRuleCleanupReviewReplay,
  summarizeSurfaceRuleCleanupReviewReplayTimeline,
  summarizeSurfaceRuleCoverageMapping,
  summarizeSurfaceRulePresetLibrary,
  summarizeTerrainFinishConsistency
} from "@course-creator-os/scene-authoring";

import { summarizeProjectPresentationInsights } from "../../app/presentation-insights";
import { useProjectSession } from "../../app/project-session";
import { StatusPill } from "../../components/StatusPill";
import { ValidationIssueCard } from "../../components/ValidationIssueCard";
import { SceneAuthoringWorkspace } from "./SceneAuthoringWorkspace";

function inferLandmarkCoverage(landmarkRefs: string[]) {
  return landmarkRefs.length > 0 ? `${landmarkRefs.length} landmark anchors` : "Needs landmark anchor";
}

export function BuildWorkspace() {
  const { project, validationReport } = useProjectSession();
  const routeQueue = [...project.holes].sort((left, right) => left.number - right.number);
  const routeWatchProfiles = project.simulatorLogic.holePlayProfiles.filter(
    (profile) => profile.lineOfPlayStatus !== "clear" || profile.shotReadabilityStatus !== "clear",
  );
  const buildIssues = validationReport.issues.filter((issue) => issue.ownerModule === "build");
  const sceneSummary = summarizeSceneAuthoringState(project.sceneAuthoring);
  const placementPresetLibrary = summarizePlacementPresetLibrary(project.sceneAuthoring);
  const surfaceRulePresetLibrary = summarizeSurfaceRulePresetLibrary(project.sceneAuthoring);
  const surfaceRuleAuthoring = summarizeSurfaceRuleAuthoring(project.sceneAuthoring);
  const surfaceRuleCoverage = summarizeSurfaceRuleCoverageMapping(project.sceneAuthoring);
  const surfaceRuleCleanupAutomation = summarizeSurfaceRuleCleanupAutomation(project.sceneAuthoring);
  const surfaceRuleCleanupReview = summarizeSurfaceRuleCleanupReview(project.sceneAuthoring);
  const surfaceRuleCleanupReplay = summarizeSurfaceRuleCleanupReviewReplay(project.sceneAuthoring);
  const surfaceRuleCleanupReplayTimeline = summarizeSurfaceRuleCleanupReviewReplayTimeline(project.sceneAuthoring);
  const corridorBundleLibrary = summarizeLandmarkCorridorBundleLibrary(project.sceneAuthoring);
  const brushPresetLibrary = summarizeSceneryBrushPresetLibrary(project.sceneAuthoring);
  const terrainFinish = summarizeTerrainFinishConsistency(project.sceneAuthoring);
  const {
    courseScaleTerrainFinish,
    routingContinuity,
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
    landmarkCorrectionActions,
    landmarkViewCorridorTools,
    landmarkCorridorStaging,
    landmarkCorridorSupportKits,
    landmarkCorridorKitComposition,
    corridorBundleRecommendations,
    releaseFacingWorldReadability,
    finalReleasePresentationConfidence
  } = summarizeProjectPresentationInsights(project);
  const routeFinishReconciliation = summarizeRouteFinishReconciliation(project.sceneAuthoring);
  const creatorDelivery = summarizeCreatorDeliveryFlow(project);
  const releaseHandoff = summarizeCreatorReleaseHandoff(project);
  const finalDelivery = summarizeFinalCreatorDelivery(project);
  const releaseExecution = summarizeReleaseExecutionState(project);
  const shareReadyPresentation = summarizeShareReadyPresentationHandoff({
    releaseHandoff,
    finalDelivery,
    cameraPlayback: cameraPathPlaybackPolish,
    landmarkActions: landmarkCorrectionActions,
    finalPresentation: finalReleasePresentationConfidence
  });
  const presentationSharePacket = summarizePresentationSharePacketFinalization({
    releaseExecution,
    releaseHandoff,
    finalDelivery,
    shareReadyPresentation
  });
  const presentationPacketProofing = summarizePresentationPacketProofing({
    releaseHandoff,
    finalDelivery,
    shareReadyPresentation,
    presentationSharePacket,
    shotOrderApproval,
    corridorSupportKits: landmarkCorridorSupportKits
  });
  const presentationShareDelivery = summarizePresentationShareDeliveryConfidence({
    creatorDelivery,
    releaseHandoff,
    finalDelivery,
    shareReadyPresentation,
    presentationSharePacket,
    presentationPacketProofing,
    cameraCapture: cameraCaptureExecution,
    landmarkCorridors: landmarkViewCorridorTools,
    cameraSequencing: cameraShotSequencing,
    landmarkStaging: landmarkCorridorStaging,
    shotOrderApproval,
    shotVariantSets,
    variantShippingDecisions: shotVariantShippingDecisions,
    variantShippingManifest: shotVariantShippingManifest,
    corridorSupportKits: landmarkCorridorSupportKits,
    corridorKitComposition: landmarkCorridorKitComposition,
    corridorBundleLibraries: {
      overallState: corridorBundleLibrary.overallState,
      correctiveHoleCount: Math.max(0, landmarkCorridorKitComposition.correctiveHoleCount - corridorBundleLibrary.quickApplyCount),
      recommendedAction: corridorBundleLibrary.recommendedAction
    },
    corridorBundleRecommendations,
    cleanupReplayTimeline: surfaceRuleCleanupReplayTimeline
  });
  const finalShareGate = summarizeFinalShareGateApproval({
    releaseExecution,
    presentationShareDelivery,
    presentationPacketProofing,
    presentationSharePacket,
    shotVariantSets,
    variantShippingDecisions: shotVariantShippingDecisions,
    variantShippingManifest: shotVariantShippingManifest,
    corridorKitComposition: landmarkCorridorKitComposition,
    corridorBundleLibraries: {
      overallState: corridorBundleLibrary.overallState,
      correctiveHoleCount: Math.max(0, landmarkCorridorKitComposition.correctiveHoleCount - corridorBundleLibrary.quickApplyCount),
      recommendedAction: corridorBundleLibrary.recommendedAction
    },
    corridorBundleRecommendations,
    cleanupReplayTimeline: surfaceRuleCleanupReplayTimeline
  });

  return (
    <div className="mode-stack">
      <section className="panel">
        <SectionHeader
          eyebrow="Build Substrate"
          title="Terrain, routing, and scene authoring"
          description="Build is now explicitly anchored on scene authoring as a first-class product capability. Routing, landmark framing, and support-space composition feed the same spatial system."
          actions={<StatusPill label="Scene Authoring Active" tone="info" />}
        />
        <div className="wizard-success-grid">
          <MetricChip label="Holes in Route" value={routeQueue.length} note="Playable routing sequence" />
          <MetricChip
            label="Routing Paths"
            value={`${sceneSummary.connectedRoutingPathCount}/${sceneSummary.routingPathCount}`}
            note="Connected route graphs"
            tone={sceneSummary.connectedRoutingPathCount > 0 ? "success" : "warning"}
          />
          <MetricChip
            label="Terrain Regions"
            value={sceneSummary.terrainRegionCount}
            note="Playable and scenic terrain partitions"
            tone="info"
          />
          <MetricChip
            label="Placed Objects"
            value={sceneSummary.objectCount}
            note="Scene-authoring entities in the active collection"
            tone="accent"
          />
          <MetricChip
            label="Placement Presets"
            value={sceneSummary.placementPresetCount}
            note="Reusable posture + snap recipes"
            tone={sceneSummary.placementPresetCount > 0 ? "info" : "warning"}
          />
          <MetricChip
            label="Surface Rules"
            value={surfaceRulePresetLibrary.totalCount}
            note={`${surfaceRulePresetLibrary.favoriteCount} favorites · ${surfaceRuleAuthoring.currentSummary}`}
            tone={
              surfaceRuleAuthoring.confidenceState === "ready"
                ? "success"
                : surfaceRuleAuthoring.confidenceState === "watch"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="Surface Coverage"
            value={surfaceRuleCoverage.overallState}
            note={`${surfaceRuleCoverage.uncoveredRegionCount} uncovered · ${surfaceRuleCoverage.conflictingRegionCount} conflicts`}
            tone={
              surfaceRuleCoverage.overallState === "ready"
                ? "success"
                : surfaceRuleCoverage.overallState === "watch"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="Rule Cleanup"
            value={surfaceRuleCleanupAutomation.overallState}
            note={`${surfaceRuleCleanupAutomation.autoCleanableHoleCount} auto-cleanable · ${surfaceRuleCleanupReview.pendingReviewCount} pending review`}
            tone={
              surfaceRuleCleanupAutomation.overallState === "clean"
                ? "success"
                : surfaceRuleCleanupAutomation.overallState === "watch"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="Cleanup Review"
            value={surfaceRuleCleanupReview.overallState}
            note={`${surfaceRuleCleanupReview.pendingReviewCount} pending · ${surfaceRuleCleanupReview.approvedReviewCount} approved`}
            tone={
              surfaceRuleCleanupReview.overallState === "ready"
                ? "success"
                : surfaceRuleCleanupReview.overallState === "watch"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="Brush Presets"
            value={sceneSummary.brushPresetCount}
            note="Saved world-dressing recipes"
            tone={sceneSummary.brushPresetCount > 0 ? "info" : "warning"}
          />
          <MetricChip
            label="Finish Intel"
            value={
              terrainFinish.coverageGapRegionIds.length +
              terrainFinish.patchyRegionIds.length +
              terrainFinish.dominantMaterialOveruseRegionIds.length
            }
            note={`${courseScaleTerrainFinish.imbalancedHoleCount} weak holes · ${terrainFinish.recommendedAction}`}
            tone={terrainFinish.balanceState === "balanced" ? "success" : terrainFinish.balanceState === "watch" ? "warning" : "error"}
          />
          <MetricChip
            label="Gameplay Anchors"
            value={sceneSummary.gameplayRelevantCount}
            note="Course-critical spatial objects"
            tone={sceneSummary.gameplayRelevantCount > 0 ? "success" : "warning"}
          />
          <MetricChip
            label="Sightline Watch"
            value={routeWatchProfiles.length}
            note="Holes with line-of-play or readability pressure"
            tone={routeWatchProfiles.length > 0 ? "warning" : "success"}
          />
          <MetricChip
            label="Delivery Loop"
            value={creatorDelivery.overallReadiness}
            note={creatorDelivery.nextAction}
            tone={
              creatorDelivery.overallReadiness === "ready"
                ? "success"
                : creatorDelivery.overallReadiness === "watch"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="Latest Release Run"
            value={releaseExecution.latestBuild?.status ?? "not-run"}
            note={releaseExecution.latestBuild?.releaseRecipe?.label ?? "No GSPro recipe execution linked yet"}
            tone={
              releaseExecution.latestBuild?.status === "ready"
                ? "success"
                : releaseExecution.latestBuild?.status === "failed"
                  ? "error"
                  : "warning"
            }
          />
          <MetricChip
            label="Route Delivery"
            value={routingContinuity.deliveryConfidence}
            note={`${routingContinuity.completionPercent}% connected · ${routingContinuity.mergeClusterCount} merge clusters`}
            tone={routingContinuity.deliveryConfidence === "ready" ? "success" : routingContinuity.deliveryConfidence === "watch" ? "warning" : "error"}
          />
          <MetricChip
            label="Route Reconciliation"
            value={routeFinishReconciliation.overallState}
            note={`${routeFinishReconciliation.unresolvedHoleCount} unresolved holes`}
            tone={
              routeFinishReconciliation.overallState === "reconciled"
                ? "success"
                : routeFinishReconciliation.overallState === "watch"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="Preview Framing"
            value={buildPreviewFraming.overallState}
            note={buildPreviewFraming.recommendedAction}
            tone={buildPreviewFraming.overallState === "ready" ? "success" : buildPreviewFraming.overallState === "watch" ? "warning" : "error"}
          />
          <MetricChip
            label="Preview Camera"
            value={previewCameraReadability.overallState}
            note={`${previewCameraReadability.blockedHoleCount} blocked views`}
            tone={
              previewCameraReadability.overallState === "ready"
                ? "success"
                : previewCameraReadability.overallState === "watch"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="Camera Paths"
            value={cameraPathAuthoring.overallState}
            note={`${cameraPathAuthoring.incompleteHoleCount} incomplete · ${cameraPathAuthoring.blockedHoleCount} blocked`}
            tone={
              cameraPathAuthoring.overallState === "ready"
                ? "success"
                : cameraPathAuthoring.overallState === "watch"
                  ? "warning"
                : "error"
            }
          />
          <MetricChip
            label="Playback Polish"
            value={cameraPathPlaybackPolish.overallState}
            note={`${cameraPathPlaybackPolish.polishGapHoleCount} gaps · ${cameraPathPlaybackPolish.abruptHoleCount} abrupt`}
            tone={
              cameraPathPlaybackPolish.overallState === "ready"
                ? "success"
                : cameraPathPlaybackPolish.overallState === "watch"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="Camera Corrections"
            value={cameraPathCorrections.overallState}
            note={`${cameraPathCorrections.blockedHoleCount} blocked · ${cameraPathCorrections.smoothingHoleCount} smoothing`}
            tone={
              cameraPathCorrections.overallState === "ready"
                ? "success"
                : cameraPathCorrections.overallState === "watch"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="Capture Execution"
            value={cameraCaptureExecution.overallState}
            note={`${cameraCaptureExecution.captureHoleCount} key shots · ${cameraCaptureExecution.approvalHoleCount} approvals`}
            tone={
              cameraCaptureExecution.overallState === "ready"
                ? "success"
                : cameraCaptureExecution.overallState === "watch"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="Shot Variants"
            value={shotVariantSets.overallState}
            note={`${shotVariantShippingManifest.selectedHoleCount} manifest selected · ${shotVariantShippingManifest.heldBackHoleCount} held back`}
            tone={
              shotVariantSets.overallState === "ready"
                ? "success"
                : shotVariantSets.overallState === "watch"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="Landmark Actions"
            value={landmarkCorrectionActions.overallState}
            note={`${landmarkCorrectionActions.correctiveHoleCount} corrective holes · ${landmarkCorrectionActions.blockedHoleCount} blocked`}
            tone={
              landmarkCorrectionActions.overallState === "ready"
                ? "success"
                : landmarkCorrectionActions.overallState === "watch"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="Landmark Corridors"
            value={landmarkViewCorridorTools.overallState}
            note={`${landmarkViewCorridorTools.corridorActionHoleCount} corridor actions · ${landmarkViewCorridorTools.rebalanceHoleCount} rebalances`}
            tone={
              landmarkViewCorridorTools.overallState === "ready"
                ? "success"
                : landmarkViewCorridorTools.overallState === "watch"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="World Readability"
            value={releaseFacingWorldReadability.overallState}
            note={`${releaseFacingWorldReadability.roughHoleCount} rough · ${releaseFacingWorldReadability.weakLandmarkHoleCount} landmark-thin`}
            tone={
              releaseFacingWorldReadability.overallState === "ready"
                ? "success"
                : releaseFacingWorldReadability.overallState === "watch"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="Corridor Bundles"
            value={landmarkCorridorKitComposition.overallState}
            note={`${corridorBundleRecommendations.recommendedBundleCount} recommended · ${corridorBundleLibrary.quickApplyCount} quick apply`}
            tone={
              landmarkCorridorKitComposition.overallState === "ready"
                ? "success"
                : landmarkCorridorKitComposition.overallState === "watch"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="Presentation"
            value={finalReleasePresentationConfidence.overallState}
            note={`${finalReleasePresentationConfidence.presentationGapHoleCount} gaps · ${finalReleasePresentationConfidence.blockedHoleCount} blocked`}
            tone={
              finalReleasePresentationConfidence.overallState === "ready"
                ? "success"
                : finalReleasePresentationConfidence.overallState === "watch"
                  ? "warning"
                : "error"
            }
          />
          <MetricChip
            label="Share Handoff"
            value={shareReadyPresentation.overallReadiness}
            note={`${shareReadyPresentation.previewAssetCount} assets · ${shareReadyPresentation.polishGapHoleCount} polish gaps`}
            tone={
              shareReadyPresentation.overallReadiness === "ready"
                ? "success"
                : shareReadyPresentation.overallReadiness === "watch"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="Share Packet"
            value={presentationSharePacket.overallReadiness}
            note={`${presentationSharePacket.includedArtifactCount} packet assets · ${presentationSharePacket.missingPacketRequirementCount} missing`}
            tone={
              presentationSharePacket.overallReadiness === "ready"
                ? "success"
                : presentationSharePacket.overallReadiness === "watch"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="Packet Proofing"
            value={presentationPacketProofing.overallReadiness}
            note={`${presentationPacketProofing.proofingGapCount} proofing gaps · ${presentationPacketProofing.sequenceConfidenceState} sequence`}
            tone={
              presentationPacketProofing.overallReadiness === "ready"
                ? "success"
                : presentationPacketProofing.overallReadiness === "watch"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="Share Delivery"
            value={presentationShareDelivery.overallReadiness}
            note={`${presentationShareDelivery.shareableAssetCount} shareable assets · ${presentationShareDelivery.deliveryGapCount} gaps`}
            tone={
              presentationShareDelivery.overallReadiness === "ready"
                ? "success"
                : presentationShareDelivery.overallReadiness === "watch"
                  ? "warning"
                  : "error"
            }
          />
          <MetricChip
            label="Share Gate"
            value={finalShareGate.gateState}
            note={`${finalShareGate.approvalGapCount} approval gaps · ${finalShareGate.signoffLockState} lock`}
            tone={
              finalShareGate.gateState === "approved"
                ? "success"
                : finalShareGate.gateState === "watch"
                  ? "warning"
                  : "error"
            }
          />
        </div>
      </section>

      <SceneAuthoringWorkspace />

      <div className="workspace-columns">
        <section className="panel">
          <p className="eyebrow">Creator Lenses</p>
          <h3>Readability, density, and delivery at a glance</h3>
          <div className="issue-card-list">
            <article className="module-card">
              <div className="project-card-meta">
                <span>Readability</span>
                <strong>{routeWatchProfiles.length === 0 ? "Calm" : "Watch"}</strong>
              </div>
              <p className="module-card-title">Route clarity lens</p>
              <p className="body-copy">
                {routeWatchProfiles.length === 0
                  ? "Current simulator logic reads clearly enough to keep pushing scenery and terrain."
                  : `${routeWatchProfiles.length} holes still need cleaner line-of-play or landmark framing.`}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Density</span>
                <strong>{sceneSummary.objectCount} placed</strong>
              </div>
              <p className="module-card-title">Worldbuilding pressure lens</p>
              <p className="body-copy">
                {sceneSummary.terrainRegionCount} terrain regions and {sceneSummary.collectionCount} collections are active, so the next pass should preserve hierarchy calm as scenery density rises.
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Terrain Finish</span>
                <strong>{terrainFinish.balanceState}</strong>
              </div>
              <p className="module-card-title">Finish consistency lens</p>
              <p className="body-copy">
                {courseScaleTerrainFinish.imbalancedHoleCount} holes are imbalanced, {courseScaleTerrainFinish.watchHoleCount} still need balancing, and{" "}
                {terrainFinish.dominantMaterialLabel
                  ? `${terrainFinish.dominantMaterialLabel} leads at ${terrainFinish.dominantMaterialPercent}% course-wide.`
                  : "no finish is dominant yet."}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Route Continuity</span>
                <strong>{routingContinuity.deliveryConfidence}</strong>
              </div>
              <p className="module-card-title">Continuity polish lens</p>
              <p className="body-copy">
                {routingContinuity.widthHarmonyState} width harmony, {routingContinuity.elevationHarmonyState} elevation harmony, and{" "}
                {routingContinuity.mergeConfidenceState} merge confidence across {routingContinuity.mergeClusterCount} merge clusters. {routingContinuity.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Surface Rules</span>
                <strong>{surfaceRuleCoverage.overallState}</strong>
              </div>
              <p className="module-card-title">Coverage mapping lens</p>
              <p className="body-copy">
                {surfaceRuleAuthoring.currentSummary}. {surfaceRuleCoverage.uncoveredRegionCount} terrain regions still sit outside the active rule map, and{" "}
                {surfaceRuleCoverage.conflictingRegionCount} rule conflicts still need cleanup before surface-aware placement reads course-wide.
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Rule Cleanup</span>
                <strong>{surfaceRuleCleanupAutomation.overallState}</strong>
              </div>
              <p className="module-card-title">Automation assist lens</p>
              <p className="body-copy">
                {surfaceRuleCleanupAutomation.autoCleanableHoleCount} holes can use cleanup assistance now, {surfaceRuleCleanupAutomation.roughHoleCount} still need harder conflict repair, and {surfaceRuleCleanupAutomation.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Cleanup Review</span>
                <strong>{surfaceRuleCleanupReview.overallState}</strong>
              </div>
              <p className="module-card-title">Approval posture lens</p>
              <p className="body-copy">
                {surfaceRuleCleanupReview.pendingReviewCount} cleanup passes are waiting for review, {surfaceRuleCleanupReplay.replayableReviewCount} replayable review entries now preserve before-and-after history, {surfaceRuleCleanupReplayTimeline.timelineEntryCount} timeline steps are available for inspection, and {surfaceRuleCleanupReview.approvalDepthState} approval posture is driving final cleanup confidence. {surfaceRuleCleanupReview.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Reusable Flow</span>
                <strong>{sceneSummary.placementPresetCount + sceneSummary.brushPresetCount + sceneSummary.surfaceRulePresetCount}</strong>
              </div>
              <p className="module-card-title">Preset authoring lens</p>
              <p className="body-copy">
                {placementPresetLibrary.favoriteCount} placement favorites, {surfaceRulePresetLibrary.favoriteCount} surface-rule favorites, and {brushPresetLibrary.favoriteCount} brush favorites are ready for faster finish-stage passes.
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Preview Framing</span>
                <strong>{buildPreviewFraming.overallState}</strong>
              </div>
              <p className="module-card-title">Build-to-Preview lens</p>
              <p className="body-copy">
                {buildPreviewFraming.roughHoleCount} holes still frame rough, {buildPreviewFraming.watchHoleCount} are on watch, and {buildPreviewFraming.readyHoleCount} read ready from build through preview.
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Preview Camera</span>
                <strong>{previewCameraReadability.overallState}</strong>
              </div>
              <p className="module-card-title">Blocking and readability lens</p>
              <p className="body-copy">
                {previewCameraReadability.blockedHoleCount} holes still have blocked views and {previewCameraReadability.watchHoleCount} are in watch posture. {previewCameraReadability.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Camera Paths</span>
                <strong>{cameraPathAuthoring.overallState}</strong>
              </div>
              <p className="module-card-title">Authoring completeness lens</p>
              <p className="body-copy">
                {cameraPathAuthoring.incompleteHoleCount} holes still have incomplete camera-path coverage,{" "}
                {cameraPathAuthoring.blockedHoleCount} are blocked, and {cameraPathAuthoring.weakLandmarkHoleCount} still need stronger landmark support along the path.
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Playback Polish</span>
                <strong>{cameraPathPlaybackPolish.overallState}</strong>
              </div>
              <p className="module-card-title">Shot continuity lens</p>
              <p className="body-copy">
                {cameraPathPlaybackPolish.polishGapHoleCount} holes still need playback cleanup and {cameraPathPlaybackPolish.abruptHoleCount} still carry abrupt path transitions. {cameraPathPlaybackPolish.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Camera Corrections</span>
                <strong>{cameraPathCorrections.overallState}</strong>
              </div>
              <p className="module-card-title">Direct correction lens</p>
              <p className="body-copy">
                {cameraPathCorrections.blockedHoleCount} holes still need blocked-segment cleanup, {cameraPathCorrections.smoothingHoleCount} still need smoothing, and {cameraPathCorrections.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Capture Execution</span>
                <strong>{cameraCaptureExecution.overallState}</strong>
              </div>
              <p className="module-card-title">Finish-stage capture lens</p>
              <p className="body-copy">
                {cameraCaptureExecution.captureHoleCount} holes still need key captures, {cameraCaptureExecution.approvalHoleCount} still need approvals, and {cameraCaptureExecution.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Shot Sequencing</span>
                <strong>{cameraShotSequencing.overallState}</strong>
              </div>
              <p className="module-card-title">Sequence confidence lens</p>
              <p className="body-copy">
                {cameraShotSequencing.sequenceGapHoleCount} holes still need sequencing work, {cameraShotSequencing.weakSequenceHoleCount} still show weak sequence segments, and {cameraShotSequencing.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Shipping Manifest</span>
                <strong>{shotVariantShippingManifest.overallState}</strong>
              </div>
              <p className="module-card-title">Final packet selection lens</p>
              <p className="body-copy">
                {shotVariantShippingManifest.selectedHoleCount} holes already have selected shipping lanes, {shotVariantShippingManifest.heldBackHoleCount} still hold approved backups, and {shotVariantShippingManifest.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Corridor Guidance</span>
                <strong>{corridorBundleRecommendations.overallState}</strong>
              </div>
              <p className="module-card-title">Bundle recommendation lens</p>
              <p className="body-copy">
                {corridorBundleRecommendations.recommendationCount} holes still have active corridor bundle guidance, {corridorBundleRecommendations.recommendedBundleCount} reusable bundles are recommended right now, and {corridorBundleRecommendations.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Shot Approval</span>
                <strong>{shotOrderApproval.overallState}</strong>
              </div>
              <p className="module-card-title">Order proofing lens</p>
              <p className="body-copy">
                {shotOrderApproval.approvalGapHoleCount} holes still need explicit order approval, {shotOrderApproval.unapprovedHoleCount} still carry unapproved shot segments, and {shotOrderApproval.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Shot Variants</span>
                <strong>{shotVariantSets.overallState}</strong>
              </div>
              <p className="module-card-title">Variant selection lens</p>
              <p className="body-copy">
                {shotVariantSets.primaryVariantHoleCount} holes now have a primary reveal set, {shotVariantSets.alternateVariantHoleCount} have alternates, and {shotVariantSets.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Landmark Actions</span>
                <strong>{landmarkCorrectionActions.overallState}</strong>
              </div>
              <p className="module-card-title">Correction action lens</p>
              <p className="body-copy">
                {landmarkCorrectionActions.stageLandmarkHoleCount} holes still need landmark staging,{" "}
                {landmarkCorrectionActions.openViewHoleCount} still need blocked views opened, and{" "}
                {landmarkCorrectionActions.reinforceRouteHoleCount + landmarkCorrectionActions.calmPresentationHoleCount} remain in reinforcement or calm-down posture. {landmarkCorrectionActions.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Landmark Corridors</span>
                <strong>{landmarkViewCorridorTools.overallState}</strong>
              </div>
              <p className="module-card-title">Corridor repair lens</p>
              <p className="body-copy">
                {landmarkViewCorridorTools.blockedHoleCount} holes still have blocked corridor posture, {landmarkViewCorridorTools.rebalanceHoleCount} still need rebalancing, and {landmarkViewCorridorTools.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Corridor Staging</span>
                <strong>{landmarkCorridorStaging.overallState}</strong>
              </div>
              <p className="module-card-title">Finish-stage landmark lane</p>
              <p className="body-copy">
                {landmarkCorridorStaging.stagingHoleCount} holes still need corridor staging, {landmarkCorridorStaging.reinforceHoleCount} need route-side reinforcement, and {landmarkCorridorStaging.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Corridor Support Kits</span>
                <strong>{landmarkCorridorSupportKits.overallState}</strong>
              </div>
              <p className="module-card-title">Reusable correction kit lens</p>
              <p className="body-copy">
                {landmarkCorridorSupportKits.correctiveHoleCount} holes still need corridor kit support, {landmarkCorridorSupportKits.openKitHoleCount} still need open-view kits, and {landmarkCorridorSupportKits.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Corridor Bundles</span>
                <strong>{landmarkCorridorKitComposition.overallState}</strong>
              </div>
              <p className="module-card-title">Composed support lens</p>
              <p className="body-copy">
                {landmarkCorridorKitComposition.correctiveHoleCount} holes still need composed support bundles, {landmarkCorridorKitComposition.hybridBundleHoleCount} still need hybrid support, and {landmarkCorridorKitComposition.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>World Readability</span>
                <strong>{releaseFacingWorldReadability.overallState}</strong>
              </div>
              <p className="module-card-title">Release-facing readability lens</p>
              <p className="body-copy">
                {releaseFacingWorldReadability.weakLandmarkHoleCount} holes still need stronger landmark support and {releaseFacingWorldReadability.finishWatchHoleCount} still need finish/readability cleanup before release-facing presentation is calm.
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Presentation</span>
                <strong>{finalReleasePresentationConfidence.overallState}</strong>
              </div>
              <p className="module-card-title">Final release lens</p>
              <p className="body-copy">
                {finalReleasePresentationConfidence.presentationGapHoleCount} holes still need presentation cleanup and{" "}
                {finalReleasePresentationConfidence.blockedHoleCount} remain blocked across camera, landmark, or preview posture. {finalReleasePresentationConfidence.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Share Handoff</span>
                <strong>{shareReadyPresentation.overallReadiness}</strong>
              </div>
              <p className="module-card-title">Build-to-share lens</p>
              <p className="body-copy">
                {shareReadyPresentation.missingPresentationAssetCount} presentation assets are still missing, {shareReadyPresentation.polishGapHoleCount} holes still need polish, and {shareReadyPresentation.nextActions[0] ?? creatorDelivery.nextAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Share Packet</span>
                <strong>{presentationSharePacket.overallReadiness}</strong>
              </div>
              <p className="module-card-title">Presentation packet lens</p>
              <p className="body-copy">
                {presentationSharePacket.missingPacketRequirementCount} packet requirements are still missing, {presentationSharePacket.polishGapHoleCount} holes still need polish, and {presentationSharePacket.nextActions[0] ?? creatorDelivery.nextAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Packet Proofing</span>
                <strong>{presentationPacketProofing.overallReadiness}</strong>
              </div>
              <p className="module-card-title">Pre-share proofing lens</p>
              <p className="body-copy">
                {presentationPacketProofing.proofingGapCount} proofing gaps remain, shot approval is {presentationPacketProofing.sequenceConfidenceState}, corridor support is {presentationPacketProofing.corridorSupportState}, and {presentationPacketProofing.nextActions[0] ?? creatorDelivery.nextAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Share Delivery</span>
                <strong>{presentationShareDelivery.overallReadiness}</strong>
              </div>
              <p className="module-card-title">Delivery confidence lens</p>
              <p className="body-copy">
                {presentationShareDelivery.deliveryGapCount} delivery gaps remain, packet confidence is {presentationShareDelivery.packetConfidenceState}, proofing is {presentationShareDelivery.proofingState}, shot approval is {presentationShareDelivery.shotApprovalState}, and {presentationShareDelivery.nextActions[0] ?? creatorDelivery.nextAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Share Gate</span>
                <strong>{finalShareGate.gateState}</strong>
              </div>
              <p className="module-card-title">Final approval lens</p>
              <p className="body-copy">
                {finalShareGate.approvalGapCount} approval gaps remain, shot variants are {finalShareGate.shotVariantState}, corridor bundles are {finalShareGate.corridorBundleState}, and {finalShareGate.nextActions[0] ?? creatorDelivery.nextAction}
              </p>
            </article>
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">Routing Queue</p>
          <h3>Playable flow and adjacency</h3>
          <ul className="rail-list">
            {routeQueue.map((hole, index) => (
              <li key={hole.holeId}>
                <strong>
                  Hole {hole.number} · Par {hole.par} · {hole.metadata.holeRole}
                </strong>
                <span>
                  {hole.metadata.routeNotes} Next transition:{" "}
                  {routeQueue[index + 1] ? `Hole ${routeQueue[index + 1]!.number}` : "Finish sequence"}.
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <p className="eyebrow">World Transitions</p>
          <h3>District and landmark framing</h3>
          <div className="issue-card-list">
            {project.districts.map((district) => {
              const landmarkCount = project.landmarks.filter(
                (landmark) => landmark.districtRef === district.districtId,
              ).length;
              const supportCount = project.supportSpaces.filter(
                (supportSpace) => supportSpace.districtRef === district.districtId,
              ).length;

              return (
                <article key={district.districtId} className="module-card">
                  <div className="project-card-meta">
                    <span>{district.districtType}</span>
                    <strong>{district.theme}</strong>
                  </div>
                  <p className="module-card-title">{district.name}</p>
                  <p className="body-copy">{district.visualRole}</p>
                  <div className="module-card-meta">
                    <span>{landmarkCount} landmarks</span>
                    <strong>{supportCount} support spaces</strong>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">Build Watchlist</p>
          <h3>Where the next pass still needs care</h3>
          <div className="issue-card-list">
            {routeWatchProfiles.length > 0
              ? routeWatchProfiles.slice(0, 4).map((profile) => {
                  const hole = routeQueue.find((candidate) => candidate.holeId === profile.holeId);

                  return (
                    <article key={profile.holeId} className="module-card">
                  <div className="project-card-meta">
                    <span>{profile.lineOfPlayStatus}</span>
                    <strong>{profile.shotReadabilityStatus}</strong>
                  </div>
                  <p className="module-card-title">
                        Hole {profile.holeNumber} · {hole?.metadata.holeRole ?? "Route review"}
                  </p>
                      <p className="body-copy">
                        {inferLandmarkCoverage(hole?.landmarkRefs ?? [])}{" "}
                        {profile.playRouteEnvelopeRef ? "Route envelope linked." : "Needs route envelope."}
                      </p>
                    </article>
                  );
                })
              : (buildIssues.length > 0 ? buildIssues : validationReport.issues.slice(0, 2)).map((issue) => (
                  <ValidationIssueCard key={issue.issueId} issue={issue} compact />
                ))}
          </div>
        </section>
      </div>
    </div>
  );
}
