import type { CourseProject } from "@course-creator-os/project-model";
import {
  createSpatialAnalysisReport,
  findBlockedPlayRouteConflicts,
  findRoutingGaps
} from "@course-creator-os/scene-authoring";

import { createValidationIssue, createValidationResult } from "../helpers";

export function playabilityValidator(project: CourseProject) {
  const issues = [];
  const spatialAnalysis = createSpatialAnalysisReport(project.sceneAuthoring, project.simulatorLogic);
  const playabilityHoles = project.holes.filter((hole) => hole.playabilityStatus !== "ready");
  const blockedProfiles = project.simulatorLogic.holePlayProfiles.filter(
    (profile) =>
      profile.lineOfPlayStatus === "blocked" || profile.shotReadabilityStatus === "blocked",
  );
  const watchProfiles = project.simulatorLogic.holePlayProfiles.filter(
    (profile) =>
      profile.lineOfPlayStatus === "watch" || profile.shotReadabilityStatus === "watch",
  );
  const conflictingEvents = project.eventSequences.filter(
    (event) => event.state === "conflict" && event.linkedHoleRefs.length > 0,
  );
  const routingGaps = findRoutingGaps(
    project.sceneAuthoring,
    project.holes.map((hole) => hole.holeId),
  );
  const blockedRouteConflicts = findBlockedPlayRouteConflicts(project.sceneAuthoring);
  const blockedLineOfPlayIssues = spatialAnalysis.blockedLineOfPlayIssues;
  const sightlineIssues = spatialAnalysis.sightlineQualityIssues;
  const routeDiscontinuities = spatialAnalysis.routeDiscontinuities;
  const landingObstructionRisks = spatialAnalysis.landingZoneObstructionRisks;
  const collisionConflicts = spatialAnalysis.collisionConflicts;
  const occlusionRisks = spatialAnalysis.occlusionRisks;

  if (blockedProfiles.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "playability-line-of-play-blocked",
        validatorId: "playability",
        category: "Playability",
        module: "playability",
        severity: "critical",
        title: "Some holes have blocked line-of-play or shot-readability states",
        description: `${blockedProfiles.length} holes are explicitly blocked for line-of-play or shot readability.`,
        recommendedFix:
          "Use Playability Center to clear the blocked line-of-play and shot-readability states before treating gameplay as stable.",
        relatedEntityId: blockedProfiles[0]?.holeId ?? null,
        whyItMatters:
          "A blocked first-shot read or blocked route line is a direct gameplay failure, not a polish issue."
      }),
    );
  }

  if (conflictingEvents.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "playability-event-conflicts",
        validatorId: "playability",
        category: "Playability",
        module: "playability",
        severity: "critical",
        title: "Conflicting spectacle events still overlap active play spaces",
        description: `${conflictingEvents.length} events are marked conflict while still linked to playable holes.`,
        recommendedFix:
          "Resolve conflicting event timing or fallback behavior in Animation & Events before playability sign-off.",
        relatedEntityId: conflictingEvents[0]?.linkedHoleRefs[0] ?? conflictingEvents[0]?.eventId ?? null,
        whyItMatters:
          "Spectacle cannot be allowed to compete with active simulator play space."
      }),
    );
  }

  if (playabilityHoles.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "playability-review",
        validatorId: "playability",
        category: "Playability",
        module: "playability",
        severity: "high",
        title: "Some holes still require playability review",
        description: `${playabilityHoles.length} holes are not marked ready for playability sign-off.`,
        recommendedFix:
          "Review blind spots, hazard fairness, and spectacle interference on the flagged holes.",
        relatedEntityId: playabilityHoles[0]?.holeId ?? null,
        whyItMatters: "Playability gaps are core product failures, not polish issues."
      }),
    );
  }

  if (routingGaps.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "playability-routing-gaps",
        validatorId: "playability",
        category: "Playability",
        module: "playability",
        severity: "critical",
        title: "Some holes do not have connected playable routing",
        description: `${routingGaps.length} holes still have disconnected or incomplete tee-to-green routing.`,
        recommendedFix:
          "Finish the required route nodes, segments, and connected path state for every affected hole in Build.",
        relatedEntityId: routingGaps[0]?.holeId ?? null,
        whyItMatters:
          "A missing route envelope or disconnected routing graph is a direct gameplay failure."
      }),
    );
  }

  if (blockedRouteConflicts.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "playability-route-conflicts",
        validatorId: "playability",
        category: "Playability",
        module: "playability",
        severity: "high",
        title: "Blocked geometry still overlaps active play routes",
        description: `${blockedRouteConflicts.length} play-route envelopes still declare blocking geometry or blocked zones.`,
        recommendedFix:
          "Clear the blocking scene objects or blocked zones from the affected play-route envelopes before sign-off.",
        relatedEntityId: blockedRouteConflicts[0]?.playRouteEnvelopeId ?? null,
        whyItMatters:
          "Readable gameplay corridors cannot be claimed while blocked geometry is still registered inside active route space."
      }),
    );
  }

  if (blockedLineOfPlayIssues.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "playability-spatial-line-of-play",
        validatorId: "playability",
        category: "Playability",
        module: "playability",
        severity: blockedLineOfPlayIssues.some((issue) => issue.severity === "critical") ? "critical" : "high",
        title: "Spatial analysis found blocked play-route geometry",
        description: `${blockedLineOfPlayIssues.length} routed holes still have blocked geometry or blocked zones inside the active play envelope.`,
        recommendedFix:
          "Use Build overlays to clear blocking geometry or reshape the play-route envelope before treating hole flow as readable.",
        relatedEntityId: blockedLineOfPlayIssues[0]?.playRouteEnvelopeId ?? null,
        whyItMatters:
          "A playable corridor cannot be trusted when scene geometry and route envelopes disagree."
      }),
    );
  }

  if (routeDiscontinuities.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "playability-route-discontinuities",
        validatorId: "playability",
        category: "Playability",
        module: "playability",
        severity: "critical",
        title: "Spatial routing continuity is still broken",
        description: `${routeDiscontinuities.length} holes still have disconnected tee-to-green route flow according to the scene graph.`,
        recommendedFix:
          "Reconnect the route nodes and segments in Build until each hole has a coherent tee-to-green flow.",
        relatedEntityId: routeDiscontinuities[0]?.holeId ?? null,
        whyItMatters:
          "Disconnected routing is a direct gameplay correctness failure."
      }),
    );
  }

  if (sightlineIssues.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "playability-sightline-quality",
        validatorId: "playability",
        category: "Playability",
        module: "playability",
        severity: sightlineIssues.some((issue) => issue.severity === "critical") ? "high" : "warning",
        title: "Sightline corridors still weaken shot readability",
        description: `${sightlineIssues.length} routed holes still have weak or missing sightline corridors.`,
        recommendedFix:
          "Widen the visibility corridor, move blocking structures, or refine routing posture in Build.",
        relatedEntityId: sightlineIssues[0]?.visibilityCorridorId ?? sightlineIssues[0]?.holeId ?? null,
        whyItMatters:
          "Readable first shots are central to creator trust and simulator fairness."
      }),
    );
  }

  if (landingObstructionRisks.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "playability-landing-obstructions",
        validatorId: "playability",
        category: "Playability",
        module: "playability",
        severity: landingObstructionRisks.some((issue) => issue.severity === "critical") ? "high" : "warning",
        title: "Landing zones are still compromised by scene obstruction",
        description: `${landingObstructionRisks.length} fairway corridors still carry landing-zone obstruction risk.`,
        recommendedFix:
          "Adjust corridor width, move the obstructing scene objects, or refine hazard placement in Build.",
        relatedEntityId: landingObstructionRisks[0]?.fairwayCorridorId ?? null,
        whyItMatters:
          "Landing zones that read badly in scene space become fairness problems in play."
      }),
    );
  }

  if (collisionConflicts.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "playability-collision-conflicts",
        validatorId: "playability",
        category: "Playability",
        module: "playability",
        severity: collisionConflicts.some((issue) => issue.severity === "critical") ? "high" : "warning",
        title: "Spatial collision conflicts still overlap playable geometry",
        description: `${collisionConflicts.length} overlaps were detected between playable zones and authored scene geometry.`,
        recommendedFix:
          "Resolve the overlapping scene objects or simulator zones in Build before calling the hole fair and stable.",
        relatedEntityId: collisionConflicts[0]?.leftRef.entityId ?? null,
        whyItMatters:
          "Creators need collision and overlap issues surfaced before they become package-time surprises."
      }),
    );
  }

  if (occlusionRisks.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "playability-occlusion-risks",
        validatorId: "playability",
        category: "Playability",
        module: "playability",
        severity: occlusionRisks.some((issue) => issue.severity === "critical") ? "high" : "warning",
        title: "Sightline corridors are still materially occluded",
        description: `${occlusionRisks.length} holes still have heavy scene occlusion along their primary sightline corridors.`,
        recommendedFix:
          "Move blocking structures, vegetation, or animated set pieces and widen the affected sightline corridors in Build.",
        relatedEntityId: occlusionRisks[0]?.visibilityCorridorId ?? occlusionRisks[0]?.holeId ?? null,
        whyItMatters:
          "Severe occlusion undermines shot readability even when route and envelope metadata look complete."
      }),
    );
  }

  if (blockedProfiles.length === 0 && watchProfiles.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "playability-watch-queue",
        validatorId: "playability",
        category: "Playability",
        module: "playability",
        severity: "warning",
        title: "Some holes still carry watch-level readability or route pressure",
        description: `${watchProfiles.length} holes still need clearer line-of-play or shot-readability review.`,
        recommendedFix:
          "Review the watch queue in Playability Center and either clear the logic status or record a stronger remediation note.",
        relatedEntityId: watchProfiles[0]?.holeId ?? null,
        whyItMatters:
          "Watch-level gameplay pressure is easier to resolve early than after packaging confidence builds around unstable routing."
      }),
    );
  }

  return createValidationResult({
    validatorId: "playability",
    label: "Playability Validator",
    category: "Playability",
    issues,
    summary: "Checks whether holes, gameplay readability, and linked spectacle timing are safe for playability sign-off."
  });
}
