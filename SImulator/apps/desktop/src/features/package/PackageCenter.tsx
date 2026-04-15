import {
  buildPackagingChecklist,
  deriveExportGeometryReport,
  derivePackagingResult,
  summarizeCreatorReleaseHandoff,
  summarizeFinalCreatorDelivery,
  getLatestPackageBuild,
  summarizeFinalShareGateApproval,
  summarizePresentationPacketProofing,
  summarizePresentationSharePacketFinalization,
  summarizeCreatorDeliveryFlow,
  summarizeReleaseExecutionState,
  summarizeReleaseConvergence,
  summarizePresentationShareDeliveryConfidence,
  summarizeBuildArtifacts,
  summarizeShareReadyPresentationHandoff,
  type PackagingChecklist
} from "@course-creator-os/packaging";
import { Button, MetricChip } from "@course-creator-os/ui";

import {
  executePackageBuild,
  retryLatestPackageBuild,
  useProjectSession
} from "../../app/project-session";
import { summarizeProjectPresentationInsights } from "../../app/presentation-insights";
import { StatusPill } from "../../components/StatusPill";
import { ValidationIssueCard } from "../../components/ValidationIssueCard";

function toneForChecklistState(state: PackagingChecklist["state"]) {
  switch (state) {
    case "blocked":
      return "danger";
    case "warning":
      return "warning";
    case "complete":
      return "success";
    case "pending":
    default:
      return "info";
  }
}

export function PackageCenter() {
  const { project, validationReport } = useProjectSession();
  const releaseConvergence = summarizeReleaseConvergence(project, validationReport.issues);
  const releaseExecution = summarizeReleaseExecutionState(project);
  const creatorDelivery = summarizeCreatorDeliveryFlow(project);
  const releaseHandoff = summarizeCreatorReleaseHandoff(project);
  const finalDelivery = summarizeFinalCreatorDelivery(project);
  const {
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
  const latestBuild = getLatestPackageBuild(project.packageBuilds);
  const checklist = buildPackagingChecklist(project, validationReport.issues);
  const result = derivePackagingResult(checklist);
  const exportGeometry = deriveExportGeometryReport(project, validationReport.issues);
  const artifactSummary = summarizeBuildArtifacts(latestBuild);
  const managedBridgeOutputs = latestBuild?.artifactRefs.filter(
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
      recommendedAction: corridorBundleLibrary.recommendedAction
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
      recommendedAction: corridorBundleLibrary.recommendedAction
    },
    corridorBundleRecommendations,
    cleanupReplayTimeline: cleanupReviewReplayTimeline
  });
  const packageIssues = validationReport.issues.filter(
    (issue) => issue.ownerModule === "package" || issue.ownerModule === "gameplay" || issue.ownerModule === "preview",
  );

  return (
    <div className="mode-stack package-center">
      <section className="panel package-center-hero">
        <div>
          <p className="eyebrow">Package Center</p>
          <h3>Checklist-driven release candidate control</h3>
          <p className="body-copy">
            Packaging should fail safely, explain why, and point the creator toward the exact module
            that must be fixed before claiming GSPro-ready output.
          </p>
        </div>
        <div className="package-center-hero-meta">
          <Button onClick={() => void executePackageBuild()} size="sm" tone="primary">
            Run Candidate Build
          </Button>
          {releaseExecution.retryRecommended && latestBuild ? (
            <Button onClick={() => void retryLatestPackageBuild()} size="sm" tone="secondary">
              Retry Latest Run
            </Button>
          ) : null}
          <StatusPill label={releaseConvergence.overallReadiness} tone={toneForChecklistState(releaseConvergence.overallReadiness === "ready" ? "complete" : releaseConvergence.overallReadiness === "watch" ? "warning" : "blocked")} />
          <StatusPill label={latestBuild?.status ?? "no build"} tone={latestBuild?.status === "failed" ? "danger" : latestBuild?.status === "ready" ? "success" : "warning"} />
        </div>
      </section>

      <div className="package-center-metrics">
        <MetricChip label="Blockers" value={result.blockerCount} tone={result.blockerCount > 0 ? "error" : "success"} />
        <MetricChip label="Warnings" value={result.warningCount} tone={result.warningCount > 0 ? "warning" : "success"} />
        <MetricChip label="Checklist Done" value={result.completeCount} note={`${result.pendingCount} pending`} tone="accent" />
        <MetricChip label="Artifacts" value={latestBuild?.artifactCount ?? 0} note={`${artifactSummary.generatedCount} generated`} tone="info" />
        <MetricChip label="Execution" value={latestBuild?.executionState ?? "not-run"} note={latestBuild?.outputDirectory ?? "No candidate output yet"} tone={latestBuild?.executionState === "failed" ? "error" : latestBuild?.executionState === "succeeded" ? "success" : "warning"} />
        <MetricChip
          label="Runtime Trust"
          value={latestBuild?.runtimeVerificationState ?? "preview-only"}
          note={latestBuild?.bridgeSummary || "No managed bridge summary recorded yet"}
          tone={
            latestBuild?.runtimeVerificationState === "verified"
              ? "success"
              : latestBuild?.runtimeVerificationState === "partially-verified"
                ? "warning"
                : latestBuild?.runtimeVerificationState === "unavailable"
                  ? "error"
                : latestBuild?.runtimeVerificationState === "degraded"
                  ? "error"
                  : "info"
          }
        />
        <MetricChip
          label="Release Path"
          value={releaseExecution.overallReadiness}
          note={`${releaseExecution.missingArtifactCount} artifact gaps`}
          tone={releaseExecution.overallReadiness === "blocked" ? "error" : releaseExecution.overallReadiness === "watch" ? "warning" : "success"}
        />
        <MetricChip
          label="Tool-backed Steps"
          value={releaseExecution.toolLinkedStepCount}
          note={`${releaseExecution.failedStepCount} failed · ${releaseExecution.externalToolStepCount} external`}
          tone={releaseExecution.failedStepCount > 0 ? "error" : releaseExecution.toolLinkedStepCount > 0 ? "success" : "warning"}
        />
        <MetricChip
          label="Execution Mode"
          value={releaseExecution.executionMode}
          note={latestBuild?.bridgeAdapterId ?? "package-owned release path"}
          tone={
            releaseExecution.executionMode === "mixed" || releaseExecution.executionMode === "external-tool"
              ? "success"
              : releaseExecution.executionMode === "repo-backed"
                ? "warning"
                : "info"
          }
        />
        <MetricChip
          label="Managed Outputs"
          value={releaseExecution.managedOutputCount}
          note={managedBridgeOutputs[0]?.label ?? "No managed bridge outputs recorded"}
          tone={managedBridgeOutputs.length > 0 ? "success" : "warning"}
        />
        <MetricChip
          label="Retry Posture"
          value={releaseExecution.retryRecommended ? "Ready" : "Stable"}
          note={releaseExecution.remediationActions[0]?.label ?? "No immediate retry action is recommended"}
          tone={releaseExecution.retryRecommended ? "warning" : "success"}
        />
        <MetricChip
          label="GSPro Recipe"
          value={latestBuild?.releaseRecipe?.recipeType ?? "missing"}
          note={latestBuild?.releaseRecipe?.label ?? "No recipe recorded yet"}
          tone={latestBuild?.releaseRecipe ? "info" : "warning"}
        />
        <MetricChip
          label="Delivery Ready"
          value={creatorDelivery.overallReadiness}
          note={`${creatorDelivery.deliveryArtifactCount} delivery artifacts · ${creatorDelivery.staleOutputCount} stale outputs`}
          tone={
            creatorDelivery.overallReadiness === "ready"
              ? "success"
              : creatorDelivery.overallReadiness === "watch"
                ? "warning"
                : "error"
          }
        />
        <MetricChip
          label="Handoff Ready"
          value={releaseHandoff.handoffReady ? "Ready" : "Needs Work"}
          note={`${releaseHandoff.handoffArtifactCount} handoff assets · ${releaseHandoff.externalToolEvidenceCount} external steps`}
          tone={releaseHandoff.handoffReady ? "success" : releaseHandoff.overallReadiness === "watch" ? "warning" : "error"}
        />
        <MetricChip
          label="Final Delivery"
          value={finalDelivery.deliveryReady ? "Ready" : finalDelivery.overallReadiness}
          note={`${finalDelivery.deliveryArtifactCount} delivery artifacts · ${finalDelivery.missingDeliveryArtifactCount} gaps`}
          tone={finalDelivery.deliveryReady ? "success" : finalDelivery.overallReadiness === "watch" ? "warning" : "error"}
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
          label="Share Delivery"
          value={presentationShareDelivery.overallReadiness}
          note={`${presentationShareDelivery.shareableAssetCount} assets · ${presentationShareDelivery.deliveryGapCount} gaps · ${presentationShareDelivery.variantShippingState} shipping`}
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

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Release Run Compass</p>
            <h3>What the creator should do next</h3>
          </div>
        </div>
        <div className="issue-card-list">
          <article className="module-card">
            <div className="project-card-meta">
              <span>Package</span>
              <strong>{releaseExecution.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Run stability</p>
            <p className="body-copy">{releaseExecution.nextAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Delivery</span>
              <strong>{creatorDelivery.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Artifact handoff</p>
            <p className="body-copy">{creatorDelivery.nextAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Handoff</span>
              <strong>{releaseHandoff.handoffReady ? "Ready" : releaseHandoff.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Creator handoff guidance</p>
            <p className="body-copy">{releaseHandoff.nextActions[0] ?? "Handoff artifacts are aligned with the current release run."}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Final delivery</span>
              <strong>{finalDelivery.deliveryReady ? "Ready" : finalDelivery.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Post-build destination</p>
            <p className="body-copy">{finalDelivery.nextActions[0] ?? "Final delivery artifacts are ready for creator review."}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Presentation</span>
              <strong>{finalReleasePresentationConfidence.overallState}</strong>
            </div>
            <p className="module-card-title">Release-facing read</p>
            <p className="body-copy">{finalReleasePresentationConfidence.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Capture execution</span>
              <strong>{cameraCaptureExecution.overallState}</strong>
            </div>
            <p className="module-card-title">Finish-stage media passes</p>
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
              <span>Landmark corridors</span>
              <strong>{landmarkViewCorridorTools.overallState}</strong>
            </div>
            <p className="module-card-title">View-corridor cleanup</p>
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
            <p className="module-card-title">Recommended corridor support</p>
            <p className="body-copy">{corridorBundleRecommendations.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Cleanup replay</span>
              <strong>{cleanupReviewReplayTimeline.overallState}</strong>
            </div>
            <p className="module-card-title">Timeline inspection confidence</p>
            <p className="body-copy">{cleanupReviewReplayTimeline.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Share handoff</span>
              <strong>{shareReadyPresentation.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Presentation-ready package posture</p>
            <p className="body-copy">{shareReadyPresentation.nextActions[0] ?? "Presentation handoff is aligned with the current release run."}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Share packet</span>
              <strong>{presentationSharePacket.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Creator-facing packet</p>
            <p className="body-copy">{presentationSharePacket.nextActions[0] ?? "Presentation share packet is aligned with the current release run."}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Packet proofing</span>
              <strong>{presentationPacketProofing.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Pre-share proofing posture</p>
            <p className="body-copy">{presentationPacketProofing.nextActions[0] ?? "Presentation packet proofing is aligned with the current release run."}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Share delivery</span>
              <strong>{presentationShareDelivery.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Delivery confidence</p>
            <p className="body-copy">{presentationShareDelivery.nextActions[0] ?? "Presentation delivery confidence is aligned with the current release run."}</p>
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
            <p className="body-copy">{finalShareGate.nextActions[0] ?? "Final share gate is aligned with the current package posture."}</p>
            <p className="muted-copy">
              Lock {finalShareGate.signoffLockState} · {finalShareGate.signoffLockPath ?? "No signoff lock path recorded yet."}
            </p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Preview camera</span>
              <strong>{previewCameraReadability.overallState}</strong>
            </div>
            <p className="module-card-title">Blocking confidence</p>
            <p className="body-copy">{previewCameraReadability.recommendedAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>World readability</span>
              <strong>{releaseFacingWorldReadability.overallState}</strong>
            </div>
            <p className="module-card-title">Release-facing course read</p>
            <p className="body-copy">{releaseFacingWorldReadability.recommendedAction}</p>
          </article>
        </div>
      </section>

      <div className="workspace-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Readiness Checklist</p>
              <h3>Blockers, warnings, and explicit next actions</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {checklist.map((item) => (
              <article key={item.itemId} className={`module-card checklist-card state-${item.state}`}>
                <div className="project-card-meta">
                  <span>{item.category}</span>
                  <strong>{item.state}</strong>
                </div>
                <p className="module-card-title">{item.label}</p>
                <p className="body-copy">{item.summary}</p>
                <p className="muted-copy">{item.actionPath}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Failure States</p>
              <h3>Execution posture and blockers</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {latestBuild ? (
              <article className="module-card">
                <div className="project-card-meta">
                  <span>{latestBuild.profileId}</span>
                  <strong>{latestBuild.executionState}</strong>
                </div>
                <p className="module-card-title">Latest build execution</p>
                <p className="body-copy">{latestBuild.diagnosticsSummary}</p>
                <p className="muted-copy">
                  {latestBuild.outputDirectory ?? "No output directory recorded."} · Runtime:{" "}
                  {latestBuild.runtimeVerificationState}
                </p>
                <p className="muted-copy">
                  {latestBuild.releaseRecipe
                    ? `${latestBuild.releaseRecipe.label} · ${latestBuild.releaseRecipe.steps.length} steps`
                    : "GSPro release recipe is not recorded for this build."}
                </p>
                <p className="muted-copy">
                  {latestBuild.bridgeAdapterId
                    ? `Managed adapter: ${latestBuild.bridgeAdapterId}`
                    : "No managed adapter identity was recorded for this build."}
                </p>
                <p className="muted-copy">
                  {managedBridgeOutputs.length > 0
                    ? `${managedBridgeOutputs.length} managed bridge outputs were attached to this run.`
                    : "No managed bridge outputs were attached to this build record."}
                </p>
              </article>
            ) : null}
            {managedBridgeOutputs.slice(0, 2).map((artifact) => (
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
            {latestBuild?.releaseRecipe?.steps.slice(0, 3).map((step) => (
              <article key={step.stepId} className="module-card">
                <div className="project-card-meta">
                  <span>{step.phase}</span>
                  <strong>{step.status}</strong>
                </div>
                <p className="module-card-title">{step.label}</p>
                <p className="body-copy">{step.summary}</p>
                <p className="muted-copy">
                  {step.toolId ? `${step.toolId}` : "package-owned step"}
                  {step.executedCommand ? ` · ${step.executedCommand}` : ""}
                </p>
              </article>
            ))}
            {releaseExecution.issues.slice(0, 3).map((issue) => (
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
            {releaseExecution.remediationActions.slice(0, 2).map((action) => (
              <article key={action.actionId} className="module-card">
                <div className="project-card-meta">
                  <span>{action.ownerModule}</span>
                  <strong>{action.severity}</strong>
                </div>
                <p className="module-card-title">{action.label}</p>
                <p className="body-copy">
                  {action.ownerModule === "package"
                    ? "Use this to rerun or stabilize the release pipeline."
                    : "Resolve this dependency before treating the release path as stable."}
                </p>
                <p className="muted-copy">{action.actionPath}</p>
              </article>
            ))}
            {creatorDelivery.issues.slice(0, 2).map((issue) => (
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
            {releaseHandoff.handoffArtifacts.slice(0, 2).map((artifact) => (
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
            {(packageIssues.length > 0 ? packageIssues : validationReport.issues.slice(0, 2)).map((issue) => (
              <ValidationIssueCard key={issue.issueId} issue={issue} compact />
            ))}
          </div>
          <p className="body-copy muted-copy">
            {releaseExecution.nextAction} {creatorDelivery.nextAction}
          </p>
        </section>
      </div>

      <div className="workspace-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Creator Handoff</p>
              <h3>What the creator can inspect and deliver next</h3>
            </div>
            <StatusPill
              label={releaseHandoff.overallReadiness}
              tone={
                releaseHandoff.overallReadiness === "ready"
                  ? "success"
                  : releaseHandoff.overallReadiness === "watch"
                    ? "warning"
                    : "danger"
              }
            />
          </div>
          <div className="issue-card-list">
            <article className="module-card">
              <p className="module-card-title">Handoff posture</p>
              <p className="body-copy">
                {releaseHandoff.handoffReady
                  ? "The current build has a usable handoff package for creator review."
                  : "The current build still needs corrections before creator handoff is trustworthy."}
              </p>
              <p className="muted-copy">
                Build: {releaseHandoff.latestBuildId ?? "missing"} · Release: {releaseHandoff.latestReleaseId ?? "missing"}
              </p>
              <p className="muted-copy">
                Execution: {releaseHandoff.executionMode} · Preview fresh: {releaseHandoff.previewFresh ? "yes" : "no"} · Missing handoff items: {releaseHandoff.missingHandoffCount}
              </p>
            </article>
            {releaseHandoff.handoffArtifacts.slice(0, 4).map((artifact) => (
              <article key={`handoff-${artifact.artifactId}`} className="module-card">
                <div className="project-card-meta">
                  <span>{artifact.artifactType}</span>
                  <strong>{artifact.generatedAt ? "generated" : artifact.status}</strong>
                </div>
                <p className="module-card-title">{artifact.label}</p>
                <p className="body-copy">{artifact.note}</p>
                <p className="muted-copy">{artifact.relativePath}</p>
              </article>
            ))}
            {finalDelivery.deliveryArtifacts
              .filter((artifact) => artifact.artifactType === "delivery-report")
              .slice(0, 1)
              .map((artifact) => (
                <article key={`delivery-${artifact.artifactId}`} className="module-card">
                  <div className="project-card-meta">
                    <span>{artifact.artifactType}</span>
                    <strong>{artifact.generatedAt ? "generated" : artifact.status}</strong>
                  </div>
                  <p className="module-card-title">{artifact.label}</p>
                  <p className="body-copy">{artifact.note}</p>
                  <p className="muted-copy">{artifact.relativePath}</p>
                </article>
              ))}
            {releaseHandoff.nextActions.slice(0, 3).map((action) => (
              <article key={action} className="module-card">
                <p className="module-card-title">Next handoff step</p>
                <p className="body-copy">{action}</p>
              </article>
            ))}
            {finalDelivery.nextActions.slice(0, 2).map((action) => (
              <article key={`final-${action}`} className="module-card">
                <p className="module-card-title">Final delivery step</p>
                <p className="body-copy">{action}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Export Geometry</p>
              <h3>Authored geometry trust for simulator-facing output</h3>
            </div>
            <StatusPill
              label={exportGeometry.readiness}
              tone={
                exportGeometry.readiness === "blocked"
                  ? "danger"
                  : exportGeometry.readiness === "watch"
                    ? "warning"
                    : "success"
              }
            />
          </div>
          <div className="issue-card-list">
            {exportGeometry.diagnostics.slice(0, 6).map((diagnostic) => (
              <article key={diagnostic.diagnosticId} className="module-card">
                <div className="project-card-meta">
                  <span>{diagnostic.category}</span>
                  <strong>{diagnostic.severity}</strong>
                </div>
                <p className="module-card-title">{diagnostic.title}</p>
                <p className="body-copy">{diagnostic.summary}</p>
                <p className="muted-copy">{diagnostic.recommendedAction}</p>
              </article>
            ))}
            {exportGeometry.diagnostics.length === 0 ? (
              <article className="module-card">
                <p className="module-card-title">Geometry posture is currently clear</p>
                <p className="body-copy">
                  Tee, pin, hazard, OB, drop-zone, preview, and route geometry are aligned closely enough for package confidence.
                </p>
              </article>
            ) : null}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Export Guidance</p>
              <h3>What Package and Publish should trust next</h3>
            </div>
          </div>
          <div className="issue-card-list">
            <article className="module-card">
              <div className="project-card-meta">
                <span>summary</span>
                <strong>{exportGeometry.readiness}</strong>
              </div>
              <p className="module-card-title">Geometry readiness summary</p>
              <p className="body-copy">{exportGeometry.summary}</p>
              <p className="muted-copy">{exportGeometry.recommendedAction}</p>
            </article>
            <article className="module-card">
              <p className="module-card-title">Package handoff rule</p>
              <p className="body-copy">
                Package and Publish should treat authored Build geometry as the source of truth, with simulator bindings and validation acting as trust layers on top.
              </p>
            </article>
            <article className="module-card">
              <p className="module-card-title">Release draft linkage</p>
              <p className="body-copy">
                {releaseExecution.latestRelease
                  ? `Latest release draft ${releaseExecution.latestRelease.versionLabel} is linked to ${releaseExecution.latestRelease.packageBuildRef ?? "no build"}.`
                  : "No release draft is linked to the latest build truth yet."}
              </p>
              <p className="muted-copy">{releaseExecution.nextAction}</p>
            </article>
            <article className="module-card">
              <p className="module-card-title">GSPro recipe handoff</p>
              <p className="body-copy">
                {latestBuild?.releaseRecipe
                  ? `${latestBuild.releaseRecipe.label} writes into ${latestBuild.releaseRecipe.outputRoot}.`
                  : "Generate a GSPro release recipe before treating Package output as production-oriented."}
              </p>
            </article>
          </div>
        </section>
      </div>

      <div className="workspace-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Build History</p>
              <h3>Release candidate trail</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {project.packageBuilds.map((build) => (
              <article key={build.buildId} className="module-card">
                <div className="project-card-meta">
                  <span>{build.profileId}</span>
                  <strong>{build.status}</strong>
                </div>
                <p className="module-card-title">{build.artifactCount} artifacts</p>
                <p className="body-copy">{build.diagnosticsSummary}</p>
                <p className="muted-copy">{build.notes || "No additional package note recorded."}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Artifacts</p>
              <h3>Expected output set</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {(latestBuild?.artifactRefs.length ? latestBuild.artifactRefs : []).map((artifact) => (
              <article key={artifact.artifactId} className="module-card">
                <div className="project-card-meta">
                  <span>{artifact.artifactType}</span>
                  <strong>{artifact.status}</strong>
                </div>
                <p className="module-card-title">{artifact.label}</p>
                <p className="body-copy">{artifact.relativePath}</p>
                <p className="muted-copy">{artifact.note}</p>
              </article>
            ))}
            {!latestBuild?.artifactRefs.length ? (
              <article className="module-card">
                <p className="module-card-title">No artifact plan recorded yet</p>
                <p className="body-copy">Generate a candidate build to populate artifact expectations and diagnostics.</p>
              </article>
            ) : null}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Execution Logs</p>
            <h3>Candidate-build operational trail</h3>
          </div>
        </div>
        <div className="issue-card-list">
          {(latestBuild?.executionLogs ?? []).map((log) => (
            <article key={log.logId} className="module-card">
              <div className="project-card-meta">
                <span>{log.phase}</span>
                <strong>{log.level}</strong>
              </div>
              <p className="body-copy">{log.message}</p>
              <p className="muted-copy">{log.createdAt}</p>
            </article>
          ))}
          {!latestBuild?.executionLogs.length ? (
            <article className="module-card">
              <p className="module-card-title">No execution logs yet</p>
              <p className="body-copy">Run a candidate build to record package execution, artifact generation, and failure handling.</p>
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
}
