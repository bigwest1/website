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
import { Button, MetricChip, TextAreaField } from "@course-creator-os/ui";

import { createReleaseDraft, updateReleaseRecords, useProjectSession } from "../../app/project-session";
import { summarizeProjectPresentationInsights } from "../../app/presentation-insights";
import { StatusPill } from "../../components/StatusPill";
import { ValidationIssueCard } from "../../components/ValidationIssueCard";

export function PublishCenter() {
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
  const publishSummary = releaseConvergence.publishSummary;
  const publishIssues = validationReport.issues.filter(
    (issue) => issue.ownerModule === "publish" || issue.ownerModule === "preview" || issue.ownerModule === "package",
  );
  const latestRelease = publishSummary.latestRelease;
  const latestBuild = releaseExecution.latestBuild;
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
  const releaseDraftActionLabel =
    latestBuild && (!latestRelease || latestRelease.packageBuildRef !== latestBuild.buildId)
      ? "Refresh Release Draft"
      : "Create Release Draft";

  return (
    <div className="mode-stack publish-center">
      <section className="panel package-center-hero">
        <div>
          <p className="eyebrow">Publish Center</p>
          <h3>Release metadata, credits, and public-safe posture</h3>
          <p className="body-copy">
            Publish should make the final release package understandable, credited, and safe to
            distribute. It should never leave the creator guessing what is missing.
          </p>
        </div>
        <div className="package-center-hero-meta">
          <Button onClick={() => createReleaseDraft()} size="sm" tone="primary" disabled={!latestBuild}>
            {releaseDraftActionLabel}
          </Button>
          <StatusPill label={releaseConvergence.overallReadiness} tone={releaseConvergence.overallReadiness === "blocked" ? "danger" : releaseConvergence.overallReadiness === "watch" ? "warning" : "success"} />
          <StatusPill
            label={publishSummary.publicSafeRelease ? "public-safe release on record" : "public-safe record missing"}
            tone={publishSummary.publicSafeRelease ? "success" : "warning"}
          />
        </div>
      </section>

      <div className="package-center-metrics">
        <MetricChip label="Release Records" value={project.releaseRecords.length} tone="info" />
        <MetricChip label="Release Notes" value={publishSummary.hasReleaseNotes ? "Ready" : "Missing"} tone={publishSummary.hasReleaseNotes ? "success" : "warning"} />
        <MetricChip label="Media Checklist" value={publishSummary.hasMediaChecklist ? "Ready" : "Missing"} tone={publishSummary.hasMediaChecklist ? "success" : "warning"} />
        <MetricChip label="Description" value={publishSummary.hasCourseDescription ? "Ready" : "Missing"} tone={publishSummary.hasCourseDescription ? "success" : "warning"} />
        <MetricChip label="Credits" value={publishSummary.creditsComplete ? "Complete" : "Missing"} tone={publishSummary.creditsComplete ? "success" : "warning"} />
        <MetricChip label="Preview Dependency" value={publishSummary.previewReady ? "Ready" : "Missing"} tone={publishSummary.previewReady ? "success" : "warning"} />
        <MetricChip label="Latest Build" value={latestBuild?.executionState ?? "not-run"} note={latestBuild?.status ?? "no candidate"} tone={latestBuild?.executionState === "failed" ? "error" : latestBuild?.executionState === "succeeded" ? "success" : "warning"} />
        <MetricChip
          label="Artifact Manifest"
          value={publishSummary.hasArtifactManifest ? "Linked" : "Missing"}
          note={publishSummary.hasReleaseRecipeLink ? "Recipe linked" : "Recipe link missing"}
          tone={publishSummary.hasArtifactManifest && publishSummary.hasReleaseRecipeLink ? "success" : "warning"}
        />
        <MetricChip
          label="Release Blockers"
          value={releaseExecution.issues.filter((issue) => issue.severity === "critical").length}
          note={`${releaseExecution.issues.filter((issue) => issue.severity === "warning").length} warnings`}
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
          label="Bridge Outputs"
          value={releaseExecution.managedOutputCount}
          note={managedBridgeOutputs[0]?.label ?? "No managed bridge outputs"}
          tone={managedBridgeOutputs.length > 0 ? "success" : "warning"}
        />
        <MetricChip
          label="Draft Sync"
          value={latestBuild && latestRelease?.packageBuildRef === latestBuild.buildId ? "Aligned" : "Stale"}
          note={releaseExecution.remediationActions.find((action) => action.ownerModule === "publish")?.label ?? "Release draft is aligned to the latest build"}
          tone={latestBuild && latestRelease?.packageBuildRef === latestBuild.buildId ? "success" : "warning"}
        />
        <MetricChip
          label="Delivery Ready"
          value={creatorDelivery.overallReadiness}
          note={`${creatorDelivery.deliveryArtifactCount} delivery artifacts`}
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
            <p className="eyebrow">Publish Compass</p>
            <h3>Turn build truth into a creator-safe release handoff</h3>
          </div>
        </div>
        <div className="issue-card-list">
          <article className="module-card">
            <div className="project-card-meta">
              <span>Publish</span>
              <strong>{releaseConvergence.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Release draft trust</p>
            <p className="body-copy">{releaseExecution.nextAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Delivery</span>
              <strong>{creatorDelivery.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Asset and draft linkage</p>
            <p className="body-copy">{creatorDelivery.nextAction}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Handoff</span>
              <strong>{releaseHandoff.handoffReady ? "Ready" : releaseHandoff.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Creator-facing handoff</p>
            <p className="body-copy">{releaseHandoff.nextActions[0] ?? "Creator handoff assets are aligned with the current draft."}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Final delivery</span>
              <strong>{finalDelivery.deliveryReady ? "Ready" : finalDelivery.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Distribution posture</p>
            <p className="body-copy">{finalDelivery.nextActions[0] ?? "Final delivery artifacts are aligned for release."}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Preview camera</span>
              <strong>{previewCameraReadability.overallState}</strong>
            </div>
            <p className="module-card-title">Presentation blocking</p>
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
          <article className="module-card">
            <div className="project-card-meta">
              <span>Presentation</span>
              <strong>{finalReleasePresentationConfidence.overallState}</strong>
            </div>
            <p className="module-card-title">Share-ready posture</p>
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
            <p className="module-card-title">Recommended corridor bundles</p>
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
            <p className="module-card-title">Presentation package handoff</p>
            <p className="body-copy">{shareReadyPresentation.nextActions[0] ?? "Presentation handoff is aligned with the current draft."}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Share packet</span>
              <strong>{presentationSharePacket.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Final presentation packet</p>
            <p className="body-copy">{presentationSharePacket.nextActions[0] ?? "Presentation packet is aligned with the current draft and build."}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Packet proofing</span>
              <strong>{presentationPacketProofing.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Pre-share proofing posture</p>
            <p className="body-copy">{presentationPacketProofing.nextActions[0] ?? "Presentation packet proofing is aligned with the current draft and build."}</p>
          </article>
          <article className="module-card">
            <div className="project-card-meta">
              <span>Share delivery</span>
              <strong>{presentationShareDelivery.overallReadiness}</strong>
            </div>
            <p className="module-card-title">Final delivery confidence</p>
            <p className="body-copy">{presentationShareDelivery.nextActions[0] ?? "Presentation share delivery confidence is aligned with the current draft and build."}</p>
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
        </div>
      </section>

      <div className="workspace-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Release Metadata</p>
              <h3>Current metadata foundation</h3>
            </div>
          </div>
          {latestRelease ? (
            <div className="issue-card-list">
              <article className="module-card">
                <div className="project-card-meta">
                  <span>{latestRelease.channel}</span>
                  <strong>{latestRelease.versionLabel}</strong>
                </div>
                <p className="module-card-title">Course description</p>
                <p className="body-copy">
                  {latestRelease.courseDescription || "No course description recorded yet."}
                </p>
              </article>
              <article className="module-card">
                <p className="module-card-title">Credits</p>
                <p className="body-copy">
                  {latestRelease.creditsSummary || "No credits summary recorded yet."}
                </p>
              </article>
              <article className="module-card">
                <p className="module-card-title">Release notes</p>
                <ul className="rail-list">
                  {(latestRelease.releaseNotes.length > 0
                    ? latestRelease.releaseNotes
                    : ["No release notes recorded yet."]).map((note) => (
                    <li key={`${latestRelease.releaseId}-note-${note}`}>{note}</li>
                  ))}
                </ul>
              </article>
              <article className="module-card">
                <p className="module-card-title">Package execution linkage</p>
                <p className="body-copy">
                  {latestRelease.packageBuildRef
                    ? `This release draft is tied to ${latestRelease.packageBuildRef}.`
                    : "No package build is linked to this release draft yet."}
                </p>
                <p className="muted-copy">
                  {latestRelease.status}
                  {latestRelease.artifactManifestRef ? ` · Manifest: ${latestRelease.artifactManifestRef}` : ""}
                  {latestRelease.releaseRecipeRef ? ` · Recipe: ${latestRelease.releaseRecipeRef}` : ""}
                </p>
                <p className="muted-copy">
                  {latestBuild?.bridgeAdapterId
                    ? `Managed adapter: ${latestBuild.bridgeAdapterId}`
                    : "No managed adapter identity is attached to the latest build."}
                </p>
                <p className="muted-copy">
                  {managedBridgeOutputs.length > 0
                    ? `${managedBridgeOutputs.length} managed bridge outputs are attached to the latest build.`
                    : "No managed bridge outputs are attached to the latest build."}
                </p>
                <p className="muted-copy">
                  Delivery posture: {creatorDelivery.overallReadiness} · {creatorDelivery.deliveryArtifactCount} delivery artifacts · {creatorDelivery.staleOutputCount} stale outputs
                </p>
                <p className="muted-copy">
                  Creator handoff: {releaseHandoff.handoffReady ? "ready" : releaseHandoff.overallReadiness} · {releaseHandoff.missingHandoffCount} missing handoff items
                </p>
                <p className="muted-copy">
                  Final delivery: {finalDelivery.deliveryReady ? "ready" : finalDelivery.overallReadiness} · {finalDelivery.missingDeliveryArtifactCount} missing delivery items
                </p>
              </article>
              {releaseHandoff.handoffArtifacts
                .filter(
                  (artifact) =>
                    artifact.artifactType === "publish-record" ||
                    artifact.artifactType === "artifact-manifest" ||
                    artifact.artifactType === "creator-handoff" ||
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
            </div>
          ) : (
            <article className="module-card">
              <p className="module-card-title">No release record exists yet</p>
              <p className="body-copy">Create a first release record once packaging reaches candidate quality.</p>
            </article>
          )}
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Media and Credits Checklist</p>
              <h3>What must ship with the release</h3>
            </div>
          </div>
          {latestRelease ? (
            <div className="issue-card-list">
              <article className="module-card">
                <TextAreaField
                  label="Course description"
                  value={latestRelease.courseDescription}
                  onChange={(event) =>
                    updateReleaseRecords((releaseRecords) =>
                      releaseRecords.map((release) =>
                        release.releaseId === latestRelease.releaseId
                          ? {
                              ...release,
                              courseDescription: event.currentTarget.value
                            }
                          : release,
                      ),
                    )
                  }
                />
              </article>
              <article className="module-card">
                <TextAreaField
                  label="Credits summary"
                  value={latestRelease.creditsSummary}
                  onChange={(event) =>
                    updateReleaseRecords((releaseRecords) =>
                      releaseRecords.map((release) =>
                        release.releaseId === latestRelease.releaseId
                          ? {
                              ...release,
                              creditsSummary: event.currentTarget.value
                            }
                          : release,
                      ),
                    )
                  }
                />
              </article>
            </div>
          ) : null}
          <ul className="rail-list">
            {(latestRelease?.mediaChecklist.length
              ? latestRelease.mediaChecklist
              : [
                  "Approve hero screenshots and preview media.",
                  "Confirm course description and release notes.",
                  "Record asset credits and contributor acknowledgments."
                ]).map((item) => (
              <li key={`media-check-${item}`}>{item}</li>
            ))}
          </ul>
          {latestRelease ? (
            <div className="issue-card-list">
              <article className="module-card">
                <p className="module-card-title">Operational publish posture</p>
                <p className="body-copy">
                  Preview ready: {latestRelease.previewReady ? "yes" : "no"} · Credits complete:{" "}
                  {latestRelease.creditsComplete ? "yes" : "no"} · Source audit complete:{" "}
                  {latestRelease.sourceAuditComplete ? "yes" : "no"}
                </p>
                <p className="muted-copy">
                  {latestRelease.publishedAt
                    ? `Published at ${latestRelease.publishedAt}`
                    : "This release has not been published yet."}
                </p>
                <p className="muted-copy">{creatorDelivery.nextAction}</p>
                <p className="muted-copy">
                  {releaseHandoff.nextActions[0] ?? "Creator handoff posture is aligned to the latest release truth."}
                </p>
                <p className="muted-copy">
                  {finalDelivery.nextActions[0] ?? "Final creator delivery posture is aligned to the latest release truth."}
                </p>
              </article>
            </div>
          ) : null}
        </section>
      </div>

      <div className="workspace-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Release History</p>
              <h3>Existing publish trail</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {project.releaseRecords.map((release) => (
              <article key={release.releaseId} className="module-card">
                <div className="project-card-meta">
                  <span>{release.channel}</span>
                  <strong>{release.versionLabel} · {release.status}</strong>
                </div>
                <p className="body-copy">{release.notes}</p>
                <p className="muted-copy">{release.createdAt}</p>
              </article>
            ))}
            {creatorDelivery.issues
              .filter((issue) => issue.ownerModule === "publish")
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
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Actionable Gaps</p>
              <h3>What still blocks a clean publish posture</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {latestBuild ? (
              <article className="module-card">
                <div className="project-card-meta">
                  <span>{latestBuild.profileId}</span>
                  <strong>{latestBuild.executionState}</strong>
                </div>
                <p className="module-card-title">Latest package execution</p>
                <p className="body-copy">{latestBuild.diagnosticsSummary}</p>
                <p className="muted-copy">
                  {latestBuild.outputDirectory ?? "No output directory recorded."} · Runtime:{" "}
                  {latestBuild.runtimeVerificationState}
                </p>
                <p className="muted-copy">
                  {latestBuild.releaseRecipe
                    ? `${latestBuild.releaseRecipe.label} · ${latestBuild.releaseRecipe.recipeType}`
                    : "No GSPro recipe linked yet."}
                </p>
              </article>
            ) : null}
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
            {releaseExecution.remediationActions
              .filter((action) => action.ownerModule === "publish" || action.ownerModule === "package")
              .slice(0, 2)
              .map((action) => (
                <article key={action.actionId} className="module-card">
                  <div className="project-card-meta">
                    <span>{action.ownerModule}</span>
                    <strong>{action.severity}</strong>
                  </div>
                  <p className="module-card-title">{action.label}</p>
                  <p className="body-copy">
                    Use this to stabilize the release draft before creator-facing distribution.
                  </p>
                  <p className="muted-copy">{action.actionPath}</p>
                </article>
              ))}
            {finalDelivery.nextActions.slice(0, 2).map((action) => (
              <article key={`final-delivery-${action}`} className="module-card">
                <p className="module-card-title">Final delivery step</p>
                <p className="body-copy">{action}</p>
              </article>
            ))}
            {releaseConvergence.issues.slice(0, 5).map((issue) => (
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
            {releaseConvergence.issues.length === 0 &&
            (publishIssues.length > 0 ? publishIssues : validationReport.issues.slice(0, 2)).map((issue) => (
              <ValidationIssueCard key={issue.issueId} issue={issue} compact />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
