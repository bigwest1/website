import { summarizePreviewOperationalFlow } from "@course-creator-os/preview";
import { Button, MetricChip } from "@course-creator-os/ui";
import {
  summarizeCreatorDeliveryFlow,
  summarizeCreatorReleaseHandoff,
  summarizeFinalCreatorDelivery,
  summarizeFinalShareGateApproval,
  summarizePresentationPacketProofing,
  summarizePresentationShareDeliveryConfidence,
  summarizePresentationSharePacketFinalization,
  summarizeReleaseConvergence,
  summarizeReleaseExecutionState,
  summarizeShareReadyPresentationHandoff
} from "@course-creator-os/packaging";

import {
  applyCameraCaptureExecutionActionForHole,
  applyShotOrderApprovalActionForHole,
  applyShotVariantShippingDecisionActionForHole,
  applyShotVariantSetActionForHole,
  applyCameraShotSequencingActionForHole,
  applyCameraPathCorrectionActionForHole,
  updateFlyoverPlanReadinessState,
  updatePreviewPathReadinessState,
  updateScreenshotPlanStatus,
  updateShowcaseSequenceReadinessState,
  useProjectSession
} from "../../app/project-session";
import { summarizeProjectPresentationInsights } from "../../app/presentation-insights";
import { StatusPill } from "../../components/StatusPill";
import { ValidationIssueCard } from "../../components/ValidationIssueCard";

function toneForPreviewReadiness(readiness: "blocked" | "watch" | "ready") {
  switch (readiness) {
    case "blocked":
      return "danger";
    case "watch":
      return "warning";
    case "ready":
    default:
      return "success";
  }
}

function labelForCameraCorrectionAction(
  action: "smooth-transition" | "open-blocked-segment" | "complete-key-view" | "reinforce-playback-support" | "ready",
) {
  switch (action) {
    case "smooth-transition":
      return "Smooth Playback";
    case "open-blocked-segment":
      return "Open Blocked Segment";
    case "complete-key-view":
      return "Complete Key View";
    case "reinforce-playback-support":
      return "Reinforce Support";
    case "ready":
    default:
      return "Path Ready";
  }
}

function labelForCameraCaptureAction(
  action: "execute-flyover-pass" | "capture-key-shot" | "approve-capture-set" | "finalize-showcase-pass" | "ready",
) {
  switch (action) {
    case "execute-flyover-pass":
      return "Execute Flyover";
    case "capture-key-shot":
      return "Capture Key Shot";
    case "approve-capture-set":
      return "Approve Captures";
    case "finalize-showcase-pass":
      return "Finalize Showcase";
    case "ready":
    default:
      return "Capture Ready";
  }
}

function labelForCameraSequencingAction(
  action:
    | "stabilize-preview-route"
    | "sequence-flyover-beats"
    | "sequence-key-view-set"
    | "sequence-showcase-flow"
    | "ready",
) {
  switch (action) {
    case "stabilize-preview-route":
      return "Stabilize Route";
    case "sequence-flyover-beats":
      return "Sequence Flyover";
    case "sequence-key-view-set":
      return "Sequence Key Views";
    case "sequence-showcase-flow":
      return "Sequence Showcase";
    case "ready":
    default:
      return "Sequence Ready";
  }
}

function labelForShotOrderApprovalAction(
  action:
    | "approve-preview-route-order"
    | "approve-flyover-order"
    | "approve-key-view-order"
    | "approve-showcase-order"
    | "ready",
) {
  switch (action) {
    case "approve-preview-route-order":
      return "Approve Route Order";
    case "approve-flyover-order":
      return "Approve Flyover";
    case "approve-key-view-order":
      return "Approve Key Views";
    case "approve-showcase-order":
      return "Approve Showcase";
    case "ready":
    default:
      return "Order Approved";
  }
}

function labelForShotVariantSetAction(
  action:
    | "approve-primary-variant-set"
    | "compose-alternate-flyover-variant"
    | "compose-alternate-key-view-variant"
    | "compose-alternate-showcase-variant"
    | "ready",
) {
  switch (action) {
    case "approve-primary-variant-set":
      return "Approve Primary Set";
    case "compose-alternate-flyover-variant":
      return "Add Alt Flyover";
    case "compose-alternate-key-view-variant":
      return "Add Alt Key Views";
    case "compose-alternate-showcase-variant":
      return "Add Alt Showcase";
    case "ready":
    default:
      return "Variants Ready";
  }
}

function labelForShotVariantShippingAction(
  action:
    | "prepare-variant-set-first"
    | "select-primary-shipping-variant"
    | "select-alternate-flyover-shipping-variant"
    | "select-alternate-key-view-shipping-variant"
    | "select-alternate-showcase-shipping-variant"
    | "ready",
) {
  switch (action) {
    case "prepare-variant-set-first":
      return "Prepare Variants";
    case "select-primary-shipping-variant":
      return "Ship Primary";
    case "select-alternate-flyover-shipping-variant":
      return "Ship Alt Flyover";
    case "select-alternate-key-view-shipping-variant":
      return "Ship Alt Key Views";
    case "select-alternate-showcase-shipping-variant":
      return "Ship Alt Showcase";
    case "ready":
    default:
      return "Shipping Ready";
  }
}

export function PreviewStudio() {
  const { project, validationReport } = useProjectSession();
  const releaseConvergence = summarizeReleaseConvergence(project, validationReport.issues);
  const releaseExecution = summarizeReleaseExecutionState(project);
  const creatorDelivery = summarizeCreatorDeliveryFlow(project);
  const releaseHandoff = summarizeCreatorReleaseHandoff(project);
  const finalDelivery = summarizeFinalCreatorDelivery(project);
  const {
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
    corridorBundleLibrary,
    corridorBundleRecommendations,
    cleanupReviewReplayTimeline,
    releaseFacingWorldReadability,
    finalReleasePresentationConfidence
  } =
    summarizeProjectPresentationInsights(project);
  const previewSummary = releaseConvergence.previewSummary;
  const previewOperationalFlow = summarizePreviewOperationalFlow({
    previewPaths: project.previewPaths,
    flyoverPlans: project.flyoverPlans,
    screenshotPlans: project.screenshotPlans,
    showcaseSequences: project.showcaseSequences,
    holeCount: project.manifest.holeCount,
    latestBuildId: releaseExecution.latestBuild?.buildId ?? null
  });
  const previewIssues = validationReport.issues.filter((issue) => issue.ownerModule === "preview");
  const minimapPaths = project.previewPaths.filter((path) => path.previewType === "minimap");
  const flyoverPaths = project.previewPaths.filter((path) => path.previewType === "flyover");
  const managedBridgeOutputs = releaseExecution.latestBuild?.artifactRefs.filter(
    (artifact) => artifact.artifactType === "managed-bridge-output",
  ) ?? [];
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
      recommendedAction: corridorBundleLibrary.recommendedAction,
    },
    corridorBundleRecommendations,
    cleanupReplayTimeline: cleanupReviewReplayTimeline
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
      recommendedAction: corridorBundleLibrary.recommendedAction,
    },
    corridorBundleRecommendations,
    cleanupReplayTimeline: cleanupReviewReplayTimeline
  });

  return (
    <div className="mode-stack preview-studio">
      <section className="panel preview-studio-hero">
        <div>
          <p className="eyebrow">Preview Studio</p>
          <h3>Cinematic review and release-media preparation</h3>
          <p className="body-copy">
            Flyovers teach the hole, minimaps explain route clarity, screenshots capture premium
            identity, and showcase sequences turn isolated media into a deliberate reveal.
          </p>
        </div>
        <div className="preview-studio-hero-meta">
          <StatusPill label={previewSummary.overallReadiness} tone={toneForPreviewReadiness(previewSummary.overallReadiness)} />
          <StatusPill
            label={`${releaseConvergence.blockerCount} release blockers`}
            tone={releaseConvergence.blockerCount > 0 ? "danger" : "info"}
          />
          <StatusPill
            label={releaseExecution.latestBuild?.executionState ?? "no build"}
            tone={
              releaseExecution.latestBuild?.executionState === "succeeded"
                ? "success"
                : releaseExecution.latestBuild?.executionState === "failed"
                  ? "danger"
                  : "info"
            }
          />
        </div>
      </section>

      <div className="preview-studio-metrics">
        <MetricChip
          label="Flyover Coverage"
          value={`${Math.round(previewSummary.flyoverCoverage * 100)}%`}
          note={`${previewSummary.flyoverReadyCount} ready plans`}
          tone={previewSummary.flyoverCoverage === 1 ? "success" : "warning"}
        />
        <MetricChip
          label="Minimap Coverage"
          value={`${Math.round(previewSummary.minimapCoverage * 100)}%`}
          note={`${previewSummary.minimapReadyCount} ready overlays`}
          tone={previewSummary.minimapCoverage === 1 ? "success" : "warning"}
        />
        <MetricChip
          label="Screenshots"
          value={`${previewSummary.screenshotApprovedCount}/${previewSummary.totalScreenshotCount}`}
          note="Approved hero frames"
          tone={previewSummary.screenshotApprovedCount > 0 ? "success" : "warning"}
        />
        <MetricChip
          label="Showcase Sequences"
          value={`${previewSummary.showcaseReadyCount}/${previewSummary.totalShowcaseCount}`}
          note="Ready reveal flows"
          tone={previewSummary.showcaseReadyCount > 0 ? "success" : "warning"}
        />
        <MetricChip
          label="Latest Build"
          value={releaseExecution.latestBuild?.status ?? "not-run"}
          note={releaseExecution.latestBuild?.buildId ?? "No release build linked yet"}
          tone={
            releaseExecution.latestBuild?.status === "ready"
              ? "success"
              : releaseExecution.latestBuild?.status === "failed"
                ? "error"
                : "warning"
          }
        />
        <MetricChip
          label="Recipe"
          value={releaseExecution.latestBuild?.releaseRecipe?.recipeType ?? "missing"}
          note={releaseExecution.latestBuild?.releaseRecipe?.label ?? "No GSPro recipe recorded yet"}
          tone={releaseExecution.latestBuild?.releaseRecipe ? "info" : "warning"}
        />
        <MetricChip
          label="Release Steps"
          value={releaseExecution.toolLinkedStepCount}
          note={`${releaseExecution.failedStepCount} failed · ${releaseExecution.externalToolStepCount} external`}
          tone={releaseExecution.failedStepCount > 0 ? "error" : releaseExecution.toolLinkedStepCount > 0 ? "success" : "warning"}
        />
        <MetricChip
          label="Execution Mode"
          value={releaseExecution.executionMode}
          note={releaseExecution.latestBuild?.bridgeAdapterId ?? "package-owned release path"}
          tone={
            releaseExecution.executionMode === "mixed" || releaseExecution.executionMode === "external-tool"
              ? "success"
              : releaseExecution.executionMode === "repo-backed"
                ? "warning"
                : "info"
          }
        />
        <MetricChip
          label="Bridge Outputs"
          value={releaseExecution.managedOutputCount}
          note={managedBridgeOutputs[0]?.label ?? "No managed bridge outputs"}
          tone={managedBridgeOutputs.length > 0 ? "success" : "warning"}
        />
        <MetricChip
          label="Output Drift"
          value={previewOperationalFlow.staleOutputCount}
          note={`${previewOperationalFlow.missingOutputCount} missing · ${previewOperationalFlow.failedOutputCount} failed`}
          tone={previewOperationalFlow.staleOutputCount > 0 || previewOperationalFlow.failedOutputCount > 0 ? "warning" : "success"}
        />
        <MetricChip
          label="Framing Continuity"
          value={buildPreviewFraming.overallState}
          note={`${buildPreviewFraming.roughHoleCount} rough · ${buildPreviewFraming.watchHoleCount} watch`}
          tone={
            buildPreviewFraming.overallState === "ready"
              ? "success"
              : buildPreviewFraming.overallState === "watch"
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
          label="Path Corrections"
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
          label="Camera Readability"
          value={previewCameraReadability.overallState}
          note={`${previewCameraReadability.blockedHoleCount} blocked · ${previewCameraReadability.watchHoleCount} watch`}
          tone={
            previewCameraReadability.overallState === "ready"
              ? "success"
              : previewCameraReadability.overallState === "watch"
                ? "warning"
                : "error"
          }
        />
        <MetricChip
          label="Landmark Actions"
          value={landmarkCorrectionActions.overallState}
          note={`${landmarkCorrectionActions.correctiveHoleCount} actions · ${landmarkCorrectionActions.blockedHoleCount} blocked`}
          tone={
            landmarkCorrectionActions.overallState === "ready"
              ? "success"
              : landmarkCorrectionActions.overallState === "watch"
                ? "warning"
                : "error"
          }
        />
        <MetricChip
          label="World Readability"
          value={releaseFacingWorldReadability.overallState}
          note={`${releaseFacingWorldReadability.weakLandmarkHoleCount} landmark-thin · ${releaseFacingWorldReadability.finishWatchHoleCount} finish-watch`}
          tone={
            releaseFacingWorldReadability.overallState === "ready"
              ? "success"
              : releaseFacingWorldReadability.overallState === "watch"
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
          label="Delivery Flow"
          value={creatorDelivery.overallReadiness}
          note={`${creatorDelivery.previewLinkedOutputCount} linked outputs`}
          tone={
            creatorDelivery.overallReadiness === "ready"
              ? "success"
              : creatorDelivery.overallReadiness === "watch"
                ? "warning"
                : "error"
          }
        />
        <MetricChip
          label="Handoff"
          value={releaseHandoff.handoffReady ? "Ready" : "Watch"}
          note={`${releaseHandoff.handoffArtifactCount} handoff assets`}
          tone={releaseHandoff.handoffReady ? "success" : releaseHandoff.overallReadiness === "watch" ? "warning" : "error"}
        />
        <MetricChip
          label="Share Ready"
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
          note={`${presentationSharePacket.includedArtifactCount} assets · ${presentationSharePacket.missingPacketRequirementCount} missing`}
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
          note={`${presentationPacketProofing.proofingGapCount} gaps · ${presentationPacketProofing.sequenceConfidenceState} sequence`}
          tone={
            presentationPacketProofing.overallReadiness === "ready"
              ? "success"
              : presentationPacketProofing.overallReadiness === "watch"
                ? "warning"
                : "error"
          }
        />
        <MetricChip
          label="Capture Execution"
          value={cameraCaptureExecution.overallState}
          note={`${cameraCaptureExecution.captureHoleCount} captures · ${cameraCaptureExecution.approvalHoleCount} approvals`}
          tone={
            cameraCaptureExecution.overallState === "ready"
              ? "success"
              : cameraCaptureExecution.overallState === "watch"
                ? "warning"
                : "error"
          }
        />
        <MetricChip
          label="Shot Sequencing"
          value={cameraShotSequencing.overallState}
          note={`${cameraShotSequencing.sequenceGapHoleCount} gaps · ${cameraShotSequencing.weakSequenceHoleCount} weak`}
          tone={
            cameraShotSequencing.overallState === "ready"
              ? "success"
              : cameraShotSequencing.overallState === "watch"
                ? "warning"
                : "error"
          }
        />
        <MetricChip
          label="Shot Approval"
          value={shotOrderApproval.overallState}
          note={`${shotOrderApproval.approvalGapHoleCount} approvals · ${shotOrderApproval.unapprovedHoleCount} unapproved`}
          tone={
            shotOrderApproval.overallState === "ready"
              ? "success"
              : shotOrderApproval.overallState === "watch"
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
          label="Corridor Kits"
          value={landmarkCorridorSupportKits.overallState}
          note={`${landmarkCorridorSupportKits.correctiveHoleCount} kit holes · ${landmarkCorridorSupportKits.openKitHoleCount} open-view`}
          tone={
            landmarkCorridorSupportKits.overallState === "ready"
              ? "success"
              : landmarkCorridorSupportKits.overallState === "watch"
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
          label="Corridor Staging"
          value={landmarkCorridorStaging.overallState}
          note={`${landmarkCorridorStaging.stagingHoleCount} staging · ${landmarkCorridorStaging.reinforceHoleCount} reinforce`}
          tone={
            landmarkCorridorStaging.overallState === "ready"
              ? "success"
              : landmarkCorridorStaging.overallState === "watch"
                ? "warning"
                : "error"
          }
        />
        <MetricChip
          label="Share Delivery"
          value={presentationShareDelivery.overallReadiness}
          note={`${presentationShareDelivery.shareableAssetCount} assets · ${presentationShareDelivery.deliveryGapCount} gaps · ${presentationShareDelivery.proofingState} proofing`}
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
          note={`${finalShareGate.approvalGapCount} gaps · ${finalShareGate.signoffLockState} lock`}
          tone={
            finalShareGate.gateState === "approved"
              ? "success"
              : finalShareGate.gateState === "watch"
                ? "warning"
                : "error"
          }
        />
        <MetricChip
          label="Final Delivery"
          value={finalDelivery.deliveryReady ? "Ready" : finalDelivery.overallReadiness}
          note={`${finalDelivery.deliveryArtifactCount} delivery artifacts`}
          tone={finalDelivery.deliveryReady ? "success" : finalDelivery.overallReadiness === "watch" ? "warning" : "error"}
        />
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Preview Compass</p>
            <h3>Keep release media in sync with the build</h3>
          </div>
        </div>
        <div className="issue-card-list">
          <article className="module-card">
            <div className="project-card-meta">
              <span>Preview flow</span>
              <strong>{previewSummary.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Media freshness</p>
            <p className="body-copy">{previewOperationalFlow.nextAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Build linkage</span>
              <strong>{releaseExecution.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Current release run</p>
            <p className="body-copy">{releaseExecution.nextAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Framing continuity</span>
              <strong>{buildPreviewFraming.overallState}</strong>
            </div>
            <p className="module-card-title">Build-to-Preview confidence</p>
            <p className="body-copy">{buildPreviewFraming.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Camera readability</span>
              <strong>{previewCameraReadability.overallState}</strong>
            </div>
            <p className="module-card-title">Blocked or weak views</p>
            <p className="body-copy">{previewCameraReadability.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Camera paths</span>
              <strong>{cameraPathAuthoring.overallState}</strong>
            </div>
            <p className="module-card-title">Authoring depth</p>
            <p className="body-copy">{cameraPathAuthoring.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Playback polish</span>
              <strong>{cameraPathPlaybackPolish.overallState}</strong>
            </div>
            <p className="module-card-title">Shot continuity</p>
            <p className="body-copy">{cameraPathPlaybackPolish.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Corrections</span>
              <strong>{cameraPathCorrections.overallState}</strong>
            </div>
            <p className="module-card-title">Direct path cleanup</p>
            <p className="body-copy">{cameraPathCorrections.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Capture execution</span>
              <strong>{cameraCaptureExecution.overallState}</strong>
            </div>
            <p className="module-card-title">Finish-stage capture passes</p>
            <p className="body-copy">{cameraCaptureExecution.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Shot sequencing</span>
              <strong>{cameraShotSequencing.overallState}</strong>
            </div>
            <p className="module-card-title">Sequence confidence</p>
            <p className="body-copy">{cameraShotSequencing.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Shot approval</span>
              <strong>{shotOrderApproval.overallState}</strong>
            </div>
            <p className="module-card-title">Final order approval</p>
            <p className="body-copy">{shotOrderApproval.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Shot variants</span>
              <strong>{shotVariantShippingManifest.overallState}</strong>
            </div>
            <p className="module-card-title">Shipping manifest posture</p>
            <p className="body-copy">{shotVariantShippingManifest.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Landmark actions</span>
              <strong>{landmarkCorrectionActions.overallState}</strong>
            </div>
            <p className="module-card-title">Corrective guidance</p>
            <p className="body-copy">{landmarkCorrectionActions.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Landmark corridors</span>
              <strong>{landmarkViewCorridorTools.overallState}</strong>
            </div>
            <p className="module-card-title">Corridor repair posture</p>
            <p className="body-copy">{landmarkViewCorridorTools.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Corridor staging</span>
              <strong>{landmarkCorridorStaging.overallState}</strong>
            </div>
            <p className="module-card-title">Landmark support staging</p>
            <p className="body-copy">{landmarkCorridorStaging.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Corridor kits</span>
              <strong>{landmarkCorridorSupportKits.overallState}</strong>
            </div>
            <p className="module-card-title">Reusable corridor support</p>
            <p className="body-copy">{landmarkCorridorSupportKits.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Corridor bundles</span>
              <strong>{corridorBundleRecommendations.overallState}</strong>
            </div>
            <p className="module-card-title">Recommended bundle posture</p>
            <p className="body-copy">{corridorBundleRecommendations.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Cleanup replay</span>
              <strong>{cleanupReviewReplayTimeline.overallState}</strong>
            </div>
            <p className="module-card-title">Timeline inspection posture</p>
            <p className="body-copy">{cleanupReviewReplayTimeline.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>World readability</span>
              <strong>{releaseFacingWorldReadability.overallState}</strong>
            </div>
            <p className="module-card-title">Release-facing world confidence</p>
            <p className="body-copy">{releaseFacingWorldReadability.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Presentation</span>
              <strong>{finalReleasePresentationConfidence.overallState}</strong>
            </div>
            <p className="module-card-title">Final release confidence</p>
            <p className="body-copy">{finalReleasePresentationConfidence.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Handoff</span>
              <strong>{shareReadyPresentation.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Share-ready handoff</p>
            <p className="body-copy">{shareReadyPresentation.nextActions[0] ?? "Preview-linked presentation handoff is ready."}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Share Packet</span>
              <strong>{presentationSharePacket.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Presentation packet finalization</p>
            <p className="body-copy">{presentationSharePacket.nextActions[0] ?? "Presentation packet is aligned with the latest preview, package, and publish posture."}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Packet proofing</span>
              <strong>{presentationPacketProofing.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Pre-share proofing</p>
            <p className="body-copy">{presentationPacketProofing.nextActions[0] ?? "Presentation packet proofing is aligned with the current preview, package, and publish posture."}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Share delivery</span>
              <strong>{presentationShareDelivery.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Final creator-facing delivery confidence</p>
            <p className="body-copy">{presentationShareDelivery.nextActions[0] ?? "Presentation delivery confidence is aligned with the current preview, package, and publish posture."}</p>
            <p className="muted-copy">
              Packet {presentationShareDelivery.packetConfidenceState} · Manifest {presentationShareDelivery.variantManifestState} · Corridor guidance {presentationShareDelivery.corridorRecommendationState}
            </p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Share gate</span>
              <strong>{finalShareGate.gateState}</strong>
            </div>
            <p className="module-card-title">Final approval posture</p>
            <p className="body-copy">{finalShareGate.nextActions[0] ?? "Final share gate is calm enough to approve."}</p>
            <p className="muted-copy">
              Lock {finalShareGate.signoffLockState} · {finalShareGate.signoffLockPath ?? "No signoff lock path recorded yet."}
            </p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Final delivery</span>
              <strong>{finalDelivery.deliveryReady ? "Ready" : finalDelivery.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Final media posture</p>
            <p className="body-copy">{finalDelivery.nextActions[0] ?? "Preview media is aligned with final delivery."}</p>
          </article>
        </div>
      </section>

      <div className="preview-studio-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Shot Sequencing</p>
              <h3>Finish the reveal order before final capture approval</h3>
            </div>
            <StatusPill
              label={cameraShotSequencing.overallState}
              tone={toneForPreviewReadiness(cameraShotSequencing.overallState === "rough" ? "blocked" : cameraShotSequencing.overallState)}
            />
          </div>
          <div className="issue-card-list">
            {cameraShotSequencing.holeSummaries
              .filter((hole) => hole.primaryAction !== "ready")
              .slice(0, 6)
              .map((hole) => (
                <article key={hole.holeId} className="module-card">
                  <div className="project-card-meta">
                    <span>Hole {hole.holeNumber}</span>
                    <strong>{hole.sequencingState}</strong>
                  </div>
                  <p className="module-card-title">{labelForCameraSequencingAction(hole.primaryAction)}</p>
                  <p className="body-copy">{hole.recommendedAction}</p>
                  <p className="muted-copy">
                    {hole.sequenceGapCount} sequence gaps · {hole.weakSequenceSegmentCount} weak segments
                  </p>
                  <div className="button-row">
                    <Button
                      onClick={() =>
                        applyCameraShotSequencingActionForHole(
                          hole.holeId,
                          hole.primaryAction as Exclude<typeof hole.primaryAction, "ready">,
                        )
                      }
                      size="sm"
                      tone="primary"
                    >
                      {labelForCameraSequencingAction(hole.primaryAction)}
                    </Button>
                  </div>
                </article>
              ))}
          </div>
          {cameraShotSequencing.sequenceGapHoleCount === 0 ? (
            <p className="body-copy muted-copy">
              Shot sequencing is calm enough that Preview can move on to final delivery confidence.
            </p>
          ) : null}
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Shot Order Approval</p>
              <h3>Approve the final reveal order before packet proofing</h3>
            </div>
            <StatusPill
              label={shotOrderApproval.overallState}
              tone={toneForPreviewReadiness(shotOrderApproval.overallState === "rough" ? "blocked" : shotOrderApproval.overallState)}
            />
          </div>
          <div className="issue-card-list">
            {shotOrderApproval.holeSummaries
              .filter((hole) => hole.primaryAction !== "ready")
              .slice(0, 6)
              .map((hole) => (
                <article key={`shot-approval-${hole.holeId}`} className="module-card">
                  <div className="project-card-meta">
                    <span>Hole {hole.holeNumber}</span>
                    <strong>{hole.approvalState}</strong>
                  </div>
                  <p className="module-card-title">{labelForShotOrderApprovalAction(hole.primaryAction)}</p>
                  <p className="body-copy">{hole.recommendedAction}</p>
                  <p className="muted-copy">
                    {hole.missingOrderSegmentCount} missing order segments · {hole.unapprovedSegmentCount} unapproved segments
                  </p>
                  <div className="button-row">
                    <Button
                      onClick={() =>
                        applyShotOrderApprovalActionForHole(
                          hole.holeId,
                          hole.primaryAction as Exclude<typeof hole.primaryAction, "ready">,
                        )
                      }
                      size="sm"
                      tone="primary"
                    >
                      {labelForShotOrderApprovalAction(hole.primaryAction)}
                    </Button>
                  </div>
                </article>
              ))}
          </div>
          {shotOrderApproval.approvalGapHoleCount === 0 ? (
            <p className="body-copy muted-copy">
              Shot order approval is calm enough that Preview can move from sequencing into packet proofing.
            </p>
          ) : null}
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Shot Variant Sets</p>
              <h3>Prepare primary and alternate reveal sets before final share approval</h3>
            </div>
            <StatusPill
              label={shotVariantSets.overallState}
              tone={toneForPreviewReadiness(shotVariantSets.overallState === "rough" ? "blocked" : shotVariantSets.overallState)}
            />
          </div>
          <div className="issue-card-list">
            {shotVariantSets.holeSummaries
              .filter((hole) => hole.primaryAction !== "ready")
              .slice(0, 6)
              .map((hole) => (
                <article key={`shot-variant-${hole.holeId}`} className="module-card">
                  <div className="project-card-meta">
                    <span>Hole {hole.holeNumber}</span>
                    <strong>{hole.variantState}</strong>
                  </div>
                  <p className="module-card-title">{labelForShotVariantSetAction(hole.primaryAction)}</p>
                  <p className="body-copy">{hole.recommendedAction}</p>
                  <p className="muted-copy">
                    {hole.primaryVariantCount} primary variants · {hole.alternateVariantCount} alternate variants · {hole.unapprovedVariantCount} unapproved
                  </p>
                  <div className="button-row">
                    <Button
                      onClick={() =>
                        applyShotVariantSetActionForHole(
                          hole.holeId,
                          hole.primaryAction as Exclude<typeof hole.primaryAction, "ready">,
                        )
                      }
                      size="sm"
                      tone="primary"
                    >
                      {labelForShotVariantSetAction(hole.primaryAction)}
                    </Button>
                  </div>
                </article>
              ))}
          </div>
          {shotVariantSets.variantGapHoleCount === 0 ? (
            <p className="body-copy muted-copy">
              Shot variants are calm enough that Preview can move from proofing into the final share gate.
            </p>
          ) : null}
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Variant Shipping</p>
              <h3>Select what actually ships and what stays approved but held back</h3>
            </div>
            <StatusPill
              label={shotVariantShippingDecisions.overallState}
              tone={toneForPreviewReadiness(
                shotVariantShippingDecisions.overallState === "rough"
                  ? "blocked"
                  : shotVariantShippingDecisions.overallState,
              )}
            />
          </div>
          <div className="issue-card-list">
            {shotVariantShippingDecisions.holeSummaries
              .filter((hole) => hole.primaryAction !== "ready")
              .slice(0, 6)
              .map((hole) => (
                <article key={`shot-variant-shipping-${hole.holeId}`} className="module-card">
                  <div className="project-card-meta">
                    <span>Hole {hole.holeNumber}</span>
                    <strong>{hole.shippingState}</strong>
                  </div>
                  <p className="module-card-title">{labelForShotVariantShippingAction(hole.primaryAction)}</p>
                  <p className="body-copy">{hole.recommendedAction}</p>
                  <p className="muted-copy">
                    {hole.selectedVariantCount} selected · {hole.candidateVariantCount} candidate · {hole.approvedNonShippingVariantCount} approved not shipping
                  </p>
                  <div className="button-row">
                    {hole.primaryAction === "prepare-variant-set-first" ? null : (
                      <Button
                        onClick={() =>
                          applyShotVariantShippingDecisionActionForHole(
                            hole.holeId,
                            hole.primaryAction as Exclude<typeof hole.primaryAction, "prepare-variant-set-first" | "ready">,
                          )
                        }
                        size="sm"
                        tone="primary"
                      >
                        {labelForShotVariantShippingAction(hole.primaryAction)}
                      </Button>
                    )}
                  </div>
                </article>
              ))}
          </div>
          {shotVariantShippingDecisions.shippingGapHoleCount === 0 ? (
            <p className="body-copy muted-copy">
              Variant shipping decisions are calm enough that Preview can sign off on what ships and what stays approved as backup.
            </p>
          ) : null}
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Shipping Manifest</p>
              <h3>Inspect what ships, what stays alternate, and what stays held back</h3>
            </div>
            <StatusPill
              label={shotVariantShippingManifest.overallState}
              tone={toneForPreviewReadiness(
                shotVariantShippingManifest.overallState === "rough"
                  ? "blocked"
                  : shotVariantShippingManifest.overallState,
              )}
            />
          </div>
          <div className="issue-card-list">
            {shotVariantShippingManifest.holeSummaries
              .filter((hole) => hole.manifestState !== "ready")
              .slice(0, 6)
              .map((hole) => (
                <article key={`shot-variant-manifest-${hole.holeId}`} className="module-card">
                  <div className="project-card-meta">
                    <span>Hole {hole.holeNumber}</span>
                    <strong>{hole.manifestState}</strong>
                  </div>
                  <p className="module-card-title">Manifest {hole.completenessState}</p>
                  <p className="body-copy">{hole.recommendedAction}</p>
                  <p className="muted-copy">
                    {hole.selectedPrimaryVariantCount} selected primary · {hole.selectedAlternateVariantCount} selected alternate ·{" "}
                    {hole.heldBackVariantCount} held back · {hole.missingManifestFamilyCount} missing families
                  </p>
                </article>
              ))}
          </div>
          {shotVariantShippingManifest.incompleteManifestHoleCount === 0 ? (
            <p className="body-copy muted-copy">
              Shipping manifests are calm enough that Preview can state exactly what leaves the product and what stays in reserve.
            </p>
          ) : null}
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Release Linkage</p>
              <h3>Build truth and preview output freshness</h3>
            </div>
            <StatusPill
              label={releaseExecution.latestBuild?.runtimeVerificationState ?? "preview-only"}
              tone={
                releaseExecution.latestBuild?.runtimeVerificationState === "verified"
                  ? "success"
                  : releaseExecution.latestBuild?.runtimeVerificationState === "partially-verified"
                    ? "warning"
                    : releaseExecution.latestBuild?.runtimeVerificationState === "unavailable"
                      ? "danger"
                      : releaseExecution.latestBuild?.runtimeVerificationState === "degraded"
                        ? "danger"
                        : "info"
              }
            />
          </div>
          <div className="issue-card-list">
            <article className="module-card">
              <p className="module-card-title">Latest release recipe</p>
              <p className="body-copy">
                {releaseExecution.latestBuild?.releaseRecipe
                  ? `${releaseExecution.latestBuild.releaseRecipe.label} is driving the current preview/build handoff.`
                  : "No GSPro release recipe is linked to the latest build yet."}
              </p>
              <p className="muted-copy">
                {releaseExecution.latestBuild?.outputDirectory ?? "No release output directory recorded yet."}
              </p>
              <p className="muted-copy">
                {releaseExecution.latestBuild?.bridgeAdapterId
                  ? `Managed adapter: ${releaseExecution.latestBuild.bridgeAdapterId}`
                  : "No managed adapter identity is attached to the latest build."}
              </p>
                <p className="muted-copy">
                  {managedBridgeOutputs.length > 0
                    ? `${managedBridgeOutputs.length} managed bridge outputs are attached to the current release build.`
                    : "No managed bridge outputs are attached to the current release build."}
                </p>
                <p className="muted-copy">
                  Handoff: {releaseHandoff.handoffReady ? "ready" : releaseHandoff.overallReadiness} · {releaseHandoff.handoffArtifactCount} handoff artifacts
                </p>
                <p className="muted-copy">
                  Final delivery: {finalDelivery.deliveryReady ? "ready" : finalDelivery.overallReadiness} · {finalDelivery.missingDeliveryArtifactCount} missing delivery items
                </p>
              </article>
            {releaseHandoff.handoffArtifacts
              .filter(
                (artifact) =>
                  artifact.artifactType === "preview-media" ||
                  artifact.artifactType === "creator-handoff" ||
                  artifact.artifactType === "release-notes" ||
                  artifact.artifactType === "delivery-report",
              )
              .slice(0, 3)
              .map((artifact) => (
                <article key={artifact.artifactId} className="module-card">
                  <div className="project-card-meta">
                    <span>{artifact.artifactType}</span>
                    <strong>{artifact.status}</strong>
                  </div>
                  <p className="module-card-title">{artifact.label}</p>
                  <p className="body-copy">{artifact.note}</p>
                  <p className="muted-copy">{artifact.relativePath}</p>
                </article>
              ))}
            {previewOperationalFlow.issues.slice(0, 3).map((issue) => (
              <article key={issue.issueId} className="module-card">
                <div className="project-card-meta">
                  <span>{issue.owner}</span>
                  <strong>{issue.severity}</strong>
                </div>
                <p className="module-card-title">{issue.title}</p>
                <p className="body-copy">{issue.summary}</p>
                <p className="muted-copy">{issue.actionPath}</p>
              </article>
            ))}
            {releaseExecution.remediationActions
              .filter((action) => action.ownerModule === "preview")
              .slice(0, 2)
              .map((action) => (
                <article key={action.actionId} className="module-card">
                  <div className="project-card-meta">
                    <span>{action.ownerModule}</span>
                    <strong>{action.severity}</strong>
                  </div>
                  <p className="module-card-title">{action.label}</p>
                  <p className="body-copy">
                    Release-linked preview outputs need this correction before media trust is strong.
                  </p>
                  <p className="muted-copy">{action.actionPath}</p>
                </article>
              ))}
            {creatorDelivery.issues
              .filter((issue) => issue.ownerModule === "preview")
              .slice(0, 2)
              .map((issue) => (
                <article key={issue.issueId} className="module-card">
                  <div className="project-card-meta">
                    <span>{issue.ownerModule}</span>
                    <strong>{issue.severity}</strong>
                  </div>
                  <p className="module-card-title">{issue.title}</p>
                  <p className="body-copy">{issue.summary}</p>
                  <p className="muted-copy">{issue.actionPath}</p>
                </article>
              ))}
            {releaseHandoff.nextActions.slice(0, 2).map((action) => (
              <article key={action} className="module-card">
                <p className="module-card-title">Handoff next step</p>
                <p className="body-copy">{action}</p>
              </article>
            ))}
            {finalDelivery.nextActions.slice(0, 2).map((action) => (
              <article key={`delivery-${action}`} className="module-card">
                <p className="module-card-title">Final delivery step</p>
                <p className="body-copy">{action}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Flyovers</p>
              <h3>Camera plans that teach the hole</h3>
            </div>
            <StatusPill label={`${project.flyoverPlans.length} plans`} tone="info" />
          </div>
          <div className="issue-card-list">
            <article className="module-card">
              <div className="project-card-meta">
                <span>Camera paths</span>
                <strong>{cameraPathAuthoring.overallState}</strong>
              </div>
              <p className="module-card-title">Path completeness</p>
              <p className="body-copy">
                {cameraPathAuthoring.incompleteHoleCount} holes still need stronger flyover/minimap/screenshot coverage, and{" "}
                {cameraPathAuthoring.blockedHoleCount} still carry blocked path segments.
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Playback polish</span>
                <strong>{cameraPathPlaybackPolish.overallState}</strong>
              </div>
              <p className="module-card-title">Shot-flow posture</p>
              <p className="body-copy">
                {cameraPathPlaybackPolish.polishGapHoleCount} holes still need playback polish and {cameraPathPlaybackPolish.abruptHoleCount} still carry abrupt transitions. {cameraPathPlaybackPolish.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Landmark actions</span>
                <strong>{landmarkCorrectionActions.overallState}</strong>
              </div>
              <p className="module-card-title">Correction posture</p>
              <p className="body-copy">
                {landmarkCorrectionActions.stageLandmarkHoleCount} holes still need landmark staging, {landmarkCorrectionActions.openViewHoleCount} still need view corridors opened, and {landmarkCorrectionActions.correctiveHoleCount} still need a correction pass. {landmarkCorrectionActions.recommendedAction}
              </p>
            </article>
            <article className="module-card">
              <div className="project-card-meta">
                <span>Capture execution</span>
                <strong>{cameraCaptureExecution.overallState}</strong>
              </div>
              <p className="module-card-title">Final capture posture</p>
              <p className="body-copy">
                {cameraCaptureExecution.incompleteHoleCount} holes still need flyover execution, {cameraCaptureExecution.captureHoleCount} still need key captures, and {cameraCaptureExecution.approvalHoleCount} still need approval passes. {cameraCaptureExecution.recommendedAction}
              </p>
            </article>
            {project.flyoverPlans.map((plan) => {
              const correction = cameraPathCorrections.holeSummaries.find((hole) => hole.holeId === plan.holeRef) ?? null;
              const correctionAction = correction && correction.primaryAction !== "ready" ? correction.primaryAction : null;
              const capture = cameraCaptureExecution.holeSummaries.find((hole) => hole.holeId === plan.holeRef) ?? null;
              const captureAction = capture && capture.primaryAction !== "ready" ? capture.primaryAction : null;

              return (
                <article key={plan.flyoverPlanId} className="module-card">
                  <div className="project-card-meta">
                    <span>{plan.holeRef}</span>
                    <strong>{plan.readinessState}</strong>
                  </div>
                  <p className="module-card-title">{plan.cameraIntent}</p>
                  <p className="body-copy">
                    {plan.introBeat} {plan.outroBeat}
                  </p>
                  <p className="muted-copy">
                    {plan.durationSeconds}s · {plan.note} · Output: {plan.outputStatus}
                    {plan.lastBuildRef ? ` · Build: ${plan.lastBuildRef}` : ""}
                  </p>
                  {correction ? (
                    <p className="muted-copy">
                      {correction.correctionState} correction posture · {correction.recommendedAction}
                    </p>
                  ) : null}
                  {capture ? (
                    <p className="muted-copy">
                      {capture.captureState} capture posture · {capture.recommendedAction}
                    </p>
                  ) : null}
                  <div className="button-row">
                    {correctionAction ? (
                      <Button
                        onClick={() => applyCameraPathCorrectionActionForHole(plan.holeRef, correctionAction)}
                        size="sm"
                        tone="primary"
                      >
                        {labelForCameraCorrectionAction(correctionAction)}
                      </Button>
                    ) : null}
                    {captureAction ? (
                      <Button
                        onClick={() => applyCameraCaptureExecutionActionForHole(plan.holeRef, captureAction)}
                        size="sm"
                        tone={correctionAction ? "secondary" : "primary"}
                      >
                        {labelForCameraCaptureAction(captureAction)}
                      </Button>
                    ) : null}
                    <Button
                      onClick={() =>
                        updateFlyoverPlanReadinessState(
                          plan.flyoverPlanId,
                          plan.readinessState === "draft" ? "ready" : "approved",
                        )
                      }
                      size="sm"
                      tone="secondary"
                    >
                      {plan.readinessState === "draft" ? "Mark Ready" : "Approve"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
          {project.flyoverPlans.length === 0 ? (
            <p className="body-copy muted-copy">No flyover plans have been authored yet.</p>
          ) : null}
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Minimaps</p>
              <h3>Orientation and route-framing overlays</h3>
            </div>
            <StatusPill label={`${minimapPaths.length} minimaps`} tone="info" />
          </div>
          <div className="issue-card-list">
            {minimapPaths.map((path) => {
              const metadata = project.simulatorLogic.minimapMetadata.find(
                (entry) => entry.previewPathRef === path.previewPathId,
              );
              const correction = path.holeRefs[0]
                ? cameraPathCorrections.holeSummaries.find((hole) => hole.holeId === path.holeRefs[0]) ?? null
                : null;
              const correctionAction = correction && correction.primaryAction !== "ready" ? correction.primaryAction : null;
              const capture = path.holeRefs[0]
                ? cameraCaptureExecution.holeSummaries.find((hole) => hole.holeId === path.holeRefs[0]) ?? null
                : null;
              const captureAction = capture && capture.primaryAction !== "ready" ? capture.primaryAction : null;

              return (
                <article key={path.previewPathId} className="module-card">
                  <div className="project-card-meta">
                    <span>{path.holeRefs.join(", ")}</span>
                    <strong>{path.readinessState}</strong>
                  </div>
                  <p className="module-card-title">{path.name}</p>
                  <p className="body-copy">{path.note}</p>
                  <p className="muted-copy">
                    {metadata
                      ? `${metadata.focalLandmark} · ${metadata.orientationHint}`
                      : "No simulator minimap metadata linked yet."} · Output: {path.outputStatus}
                    {path.lastBuildRef ? ` · Build: ${path.lastBuildRef}` : ""}
                  </p>
                  {correction ? <p className="muted-copy">{correction.recommendedAction}</p> : null}
                  {capture ? <p className="muted-copy">{capture.recommendedAction}</p> : null}
                  <div className="button-row">
                    {correctionAction ? (
                      <Button
                        onClick={() => applyCameraPathCorrectionActionForHole(path.holeRefs[0]!, correctionAction)}
                        size="sm"
                        tone="primary"
                      >
                        {labelForCameraCorrectionAction(correctionAction)}
                      </Button>
                    ) : null}
                    {captureAction ? (
                      <Button
                        onClick={() => applyCameraCaptureExecutionActionForHole(path.holeRefs[0]!, captureAction)}
                        size="sm"
                        tone={correctionAction ? "secondary" : "primary"}
                      >
                        {labelForCameraCaptureAction(captureAction)}
                      </Button>
                    ) : null}
                    <Button
                      onClick={() =>
                        updatePreviewPathReadinessState(
                          path.previewPathId,
                          path.readinessState === "draft" ? "ready" : "approved",
                        )
                      }
                      size="sm"
                      tone="secondary"
                    >
                      {path.readinessState === "draft" ? "Mark Ready" : "Approve"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <div className="preview-studio-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Screenshots</p>
              <h3>Hero stills and supporting capture lists</h3>
            </div>
            <StatusPill label={`${project.screenshotPlans.length} planned`} tone="info" />
          </div>
          <div className="issue-card-list">
            {project.screenshotPlans.map((plan) => {
              const holeId =
                plan.holeRef ??
                (plan.previewPathRef
                  ? project.previewPaths.find((path) => path.previewPathId === plan.previewPathRef)?.holeRefs[0] ?? null
                  : null);
              const capture = holeId
                ? cameraCaptureExecution.holeSummaries.find((hole) => hole.holeId === holeId) ?? null
                : null;
              const captureAction = capture && capture.primaryAction !== "ready" ? capture.primaryAction : null;

              return (
                <article key={plan.screenshotId} className="module-card">
                  <div className="project-card-meta">
                    <span>{plan.holeRef ?? "Course-wide"}</span>
                    <strong>{plan.status}</strong>
                  </div>
                  <p className="module-card-title">{plan.label}</p>
                  <p className="body-copy">{plan.framingNote}</p>
                  <p className="muted-copy">
                    {plan.previewPathRef ?? "No preview path attached yet."} · Output: {plan.outputStatus}
                    {plan.lastBuildRef ? ` · Build: ${plan.lastBuildRef}` : ""}
                  </p>
                  {capture ? <p className="muted-copy">{capture.recommendedAction}</p> : null}
                  <div className="button-row">
                    {holeId && captureAction ? (
                      <Button
                        onClick={() => applyCameraCaptureExecutionActionForHole(holeId, captureAction)}
                        size="sm"
                        tone="primary"
                      >
                        {labelForCameraCaptureAction(captureAction)}
                      </Button>
                    ) : null}
                    <Button
                      onClick={() =>
                        updateScreenshotPlanStatus(
                          plan.screenshotId,
                          plan.status === "planned" ? "captured" : "approved",
                        )
                      }
                      size="sm"
                      tone="secondary"
                    >
                      {plan.status === "planned" ? "Mark Captured" : "Approve"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Showcase Sequences</p>
              <h3>Release-quality reveal choreography</h3>
            </div>
            <StatusPill label={`${project.showcaseSequences.length} sequences`} tone="info" />
          </div>
          <div className="issue-card-list">
            {project.showcaseSequences.map((sequence) => {
              const linkedShot = project.screenshotPlans.find((plan) => sequence.shotRefs.includes(plan.screenshotId)) ?? null;
              const holeId =
                linkedShot?.holeRef ??
                (linkedShot?.previewPathRef
                  ? project.previewPaths.find((path) => path.previewPathId === linkedShot.previewPathRef)?.holeRefs[0] ?? null
                  : null);
              const capture = holeId
                ? cameraCaptureExecution.holeSummaries.find((hole) => hole.holeId === holeId) ?? null
                : null;
              const captureAction = capture && capture.primaryAction !== "ready" ? capture.primaryAction : null;

              return (
                <article key={sequence.showcaseSequenceId} className="module-card">
                  <div className="project-card-meta">
                    <span>{sequence.targetChannel}</span>
                    <strong>{sequence.readinessState}</strong>
                  </div>
                  <p className="module-card-title">{sequence.title}</p>
                  <p className="body-copy">{sequence.narrativeGoal}</p>
                  <p className="muted-copy">
                    {sequence.shotRefs.length} shots · {sequence.note} · Output: {sequence.outputStatus}
                    {sequence.lastBuildRef ? ` · Build: ${sequence.lastBuildRef}` : ""}
                  </p>
                  {capture ? <p className="muted-copy">{capture.recommendedAction}</p> : null}
                  <div className="button-row">
                    {holeId && captureAction ? (
                      <Button
                        onClick={() => applyCameraCaptureExecutionActionForHole(holeId, captureAction)}
                        size="sm"
                        tone="primary"
                      >
                        {labelForCameraCaptureAction(captureAction)}
                      </Button>
                    ) : null}
                    <Button
                      onClick={() =>
                        updateShowcaseSequenceReadinessState(
                          sequence.showcaseSequenceId,
                          sequence.readinessState === "draft" ? "ready" : "approved",
                        )
                      }
                      size="sm"
                      tone="secondary"
                    >
                      {sequence.readinessState === "draft" ? "Mark Ready" : "Approve"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
          {project.showcaseSequences.length === 0 ? (
            <p className="body-copy muted-copy">No showcase sequence exists yet.</p>
          ) : null}
        </section>
      </div>

      <div className="workspace-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Readiness Gaps</p>
              <h3>Fix paths before packaging</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {previewOperationalFlow.issues.slice(0, 4).map((issue) => (
              <article key={issue.issueId} className="module-card">
                <div className="project-card-meta">
                  <span>{issue.owner}</span>
                  <strong>{issue.severity}</strong>
                </div>
                <p className="module-card-title">{issue.title}</p>
                <p className="body-copy">{issue.summary}</p>
                <p className="muted-copy">{issue.actionPath}</p>
              </article>
            ))}
            {releaseExecution.issues
              .filter((issue) => issue.ownerModule === "preview" || issue.ownerModule === "package")
              .slice(0, 2)
              .map((issue) => (
                <article key={issue.issueId} className="module-card">
                  <div className="project-card-meta">
                    <span>{issue.ownerModule}</span>
                    <strong>{issue.severity}</strong>
                  </div>
                  <p className="module-card-title">{issue.title}</p>
                  <p className="body-copy">{issue.summary}</p>
                  <p className="muted-copy">{issue.actionPath}</p>
                </article>
              ))}
            {previewOperationalFlow.issues.length === 0 &&
            (previewIssues.length > 0 ? previewIssues : validationReport.issues.slice(0, 2)).map((issue) => (
              <ValidationIssueCard key={issue.issueId} issue={issue} compact />
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Packaging Handoff</p>
              <h3>What release flow needs from Preview Studio</h3>
            </div>
          </div>
          <ul className="rail-list">
            <li>
              <strong>Playable coverage</strong>
              <span>Every hole needs flyover and minimap coverage or an explicit waiver.</span>
            </li>
            <li>
              <strong>Approved media</strong>
              <span>Packaging and publish posture need at least one approved screenshot set.</span>
            </li>
            <li>
              <strong>Reveal narrative</strong>
              <span>Showcase sequences should explain the course identity rather than rely on disconnected shots.</span>
            </li>
            <li>
              <strong>Simulator alignment</strong>
              <span>Preview paths must stay linked to the simulator minimap and flyover metadata authored in Gameplay.</span>
            </li>
            <li>
              <strong>Release convergence</strong>
              <span>{releaseExecution.nextAction}</span>
            </li>
          </ul>
        </section>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Path Registry</p>
            <h3>All preview paths in one place</h3>
          </div>
          <StatusPill label={`${project.previewPaths.length} total paths`} tone="info" />
        </div>
        <div className="preview-path-grid">
          {flyoverPaths.concat(minimapPaths).map((path) => (
            <article key={path.previewPathId} className="preview-path-card">
              <div className="project-card-meta">
                <span>{path.previewType}</span>
                <strong>{path.readinessState}</strong>
              </div>
              <p className="module-card-title">{path.name}</p>
              <p className="body-copy">{path.note}</p>
              <p className="muted-copy">
                Output: {path.outputStatus}
                {path.lastBuildRef ? ` · Last build: ${path.lastBuildRef}` : ""}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
