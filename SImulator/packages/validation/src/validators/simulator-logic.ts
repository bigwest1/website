import type { CourseProject } from "@course-creator-os/project-model";
import { createSpatialAnalysisReport } from "@course-creator-os/scene-authoring";
import { summarizeSimulatorLogic } from "@course-creator-os/sim-logic";

import { createValidationIssue, createValidationResult } from "../helpers";

export function simulatorLogicValidator(project: CourseProject) {
  const issues = [];
  const simSummary = summarizeSimulatorLogic(project.simulatorLogic);
  const spatialAnalysis = createSpatialAnalysisReport(project.sceneAuthoring, project.simulatorLogic);

  if (simSummary.teeSetCount < 3) {
    issues.push(
      createValidationIssue({
        issueId: "logic-tee-depth",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "warning",
        title: "Tee configuration is thinner than the Version 1.0 target",
        description: `Only ${simSummary.teeSetCount} tee set${simSummary.teeSetCount === 1 ? "" : "s"} ${
          simSummary.teeSetCount === 1 ? "is" : "are"
        } defined in the simulator logic center.`,
        recommendedFix:
          "Add a forward or mixed-access tee set to improve accessibility and metadata completeness.",
        relatedEntityId: null,
        whyItMatters: "Thin tee coverage limits creator flexibility and weakens public release confidence."
      }),
    );
  }

  const defaultTeeCount = project.teeSets.filter((teeSet) => teeSet.defaultTee).length;
  if (defaultTeeCount !== 1) {
    issues.push(
      createValidationIssue({
        issueId: "logic-default-tee",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "warning",
        title: "Default tee posture is ambiguous",
        description: `Exactly one default tee set should be active, but ${defaultTeeCount} are currently marked as default.`,
        recommendedFix: "Mark one tee set as the default in the Tee Sets tab.",
        relatedEntityId: null,
        whyItMatters: "Ambiguous defaults create confusing simulator setup and weaken export confidence."
      }),
    );
  }

  if (simSummary.holesCoveredByPins < project.manifest.holeCount) {
    issues.push(
      createValidationIssue({
        issueId: "logic-pin-coverage",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "high",
        title: "Pin coverage is incomplete",
        description: `${project.manifest.holeCount - simSummary.holesCoveredByPins} holes are still missing pin-set coverage.`,
        recommendedFix: "Enable the missing holes across at least one pin set in the Pin Sets tab.",
        relatedEntityId: null,
        whyItMatters: "Incomplete pin coverage directly blocks reliable playable output."
      }),
    );
  }

  if (simSummary.holePlayProfileCount !== project.manifest.holeCount) {
    issues.push(
      createValidationIssue({
        issueId: "logic-hole-profile-mismatch",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "high",
        title: "Hole play profiles are out of sync with the routing",
        description:
          "The simulator logic hole-profile registry no longer matches the project hole count.",
        recommendedFix:
          "Reconcile hole logic profiles with the current route order and hole registry.",
        relatedEntityId: null,
        whyItMatters:
          "Per-hole gameplay correctness depends on a one-to-one mapping between routing and logic profiles."
      }),
    );
  }

  if (simSummary.blockedHoleCount > 0) {
    issues.push(
      createValidationIssue({
        issueId: "logic-export-readiness",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "high",
        title: "Some holes are not export-ready from a gameplay standpoint",
        description: `${simSummary.blockedHoleCount} hole logic profiles are still blocked for export readiness.`,
        recommendedFix:
          "Resolve blocked line-of-play, readability, or metadata gaps in the Hole Logic tab.",
        relatedEntityId:
          project.simulatorLogic.holePlayProfiles.find((profile) => profile.exportReadiness === "blocked")
            ?.holeId ?? null,
        whyItMatters: "Blocked hole logic profiles mean packaging confidence is overstated."
      }),
    );
  }

  if (!project.simulatorLogic.outOfBoundsConfigured) {
    issues.push(
      createValidationIssue({
        issueId: "logic-oob-config",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "critical",
        title: "Out-of-bounds logic is not fully configured",
        description:
          "The simulator logic profile does not yet declare complete out-of-bounds handling.",
        recommendedFix: "Finish OB definitions and confirm gameplay export notes.",
        relatedEntityId: null,
        whyItMatters: "Missing OB logic can break gameplay correctness and export confidence."
      }),
    );
  }

  const missingMinimapInputs = project.simulatorLogic.minimapMetadata.filter(
    (metadata) => metadata.overlayState === "missing",
  );
  if (missingMinimapInputs.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "logic-minimap-inputs",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "warning",
        title: "Minimap input metadata is incomplete",
        description: `${missingMinimapInputs.length} holes still lack minimap input metadata in the simulator logic center.`,
        recommendedFix:
          "Complete preview-path links and framing notes in the Flyovers & Minimap tab.",
        relatedEntityId: missingMinimapInputs[0]?.holeId ?? null,
        whyItMatters:
          "Missing minimap metadata weakens creator review, navigation, and packaging quality."
      }),
    );
  }

  const missingFlyoverInputs = project.simulatorLogic.flyoverMetadata.filter(
    (metadata) => metadata.readinessState === "missing",
  );
  if (missingFlyoverInputs.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "logic-flyover-inputs",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "warning",
        title: "Flyover input metadata is incomplete",
        description: `${missingFlyoverInputs.length} holes still lack flyover input metadata in the simulator logic center.`,
        recommendedFix:
          "Complete preview-path links and camera notes in the Flyovers & Minimap tab.",
        relatedEntityId: missingFlyoverInputs[0]?.holeId ?? null,
        whyItMatters:
          "Missing flyover metadata weakens simulator-facing presentation and release polish."
      }),
    );
  }

  const missingTeeSpatialAnchors = project.simulatorLogic.teeSpatialBindings.filter(
    (binding) => binding.readinessState === "missing",
  );
  if (missingTeeSpatialAnchors.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "logic-tee-spatial-anchors",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "critical",
        title: "Some tee sets are missing spatial anchors",
        description: `${missingTeeSpatialAnchors.length} tee bindings still lack tee-zone or gameplay-anchor geometry.`,
        recommendedFix:
          "Bind each tee set to a tee zone and a gameplay anchor in Build before treating the hole as spatially ready.",
        relatedEntityId: missingTeeSpatialAnchors[0]?.teeSpatialBindingId ?? null,
        whyItMatters:
          "Tee metadata without spatial placement is not enough for trustworthy simulator authoring."
      }),
    );
  }

  const missingPinSpatialAnchors = project.simulatorLogic.pinSpatialBindings.filter(
    (binding) => binding.readinessState === "missing",
  );
  if (missingPinSpatialAnchors.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "logic-pin-spatial-anchors",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "high",
        title: "Some pin sets are missing spatial anchors",
        description: `${missingPinSpatialAnchors.length} pin bindings still lack green-zone or anchor geometry.`,
        recommendedFix:
          "Bind each pin set to green-zone geometry and a stable preview-aligned anchor in Build.",
        relatedEntityId: missingPinSpatialAnchors[0]?.pinSpatialBindingId ?? null,
        whyItMatters:
          "Pin difficulty only becomes trustworthy when the green target exists in scene space."
      }),
    );
  }

  const missingHazardGeometry = project.simulatorLogic.hazardSpatialBindings.filter(
    (binding) => binding.readinessState === "missing",
  );
  if (missingHazardGeometry.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "logic-hazard-geometry",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "high",
        title: "Some hazards lack spatial geometry",
        description: `${missingHazardGeometry.length} hazards still do not point to hazard-zone geometry.`,
        recommendedFix:
          "Create or bind hazard zones for every simulator hazard before claiming gameplay correctness.",
        relatedEntityId: missingHazardGeometry[0]?.hazardSpatialBindingId ?? null,
        whyItMatters:
          "Hazards must exist in world space, not only as simulator notes."
      }),
    );
  }

  const missingOutOfBoundsGeometry = project.simulatorLogic.outOfBoundsSpatialBindings.filter(
    (binding) => binding.readinessState === "missing",
  );
  if (project.simulatorLogic.outOfBoundsConfigured && missingOutOfBoundsGeometry.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "logic-oob-geometry",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "critical",
        title: "Configured OB logic is missing boundary geometry",
        description: `${missingOutOfBoundsGeometry.length} holes declare OB handling without any OB boundary refs.`,
        recommendedFix: "Author OB boundaries in Build and bind them to the affected holes.",
        relatedEntityId: missingOutOfBoundsGeometry[0]?.outOfBoundsSpatialBindingId ?? null,
        whyItMatters:
          "Configured OB without actual boundaries creates false export confidence."
      }),
    );
  }

  const missingDropZoneGeometry = project.simulatorLogic.dropZoneSpatialBindings.filter(
    (binding) => binding.readinessState === "missing",
  );
  if (missingDropZoneGeometry.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "logic-drop-zone-geometry",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "high",
        title: "Some drop zones are missing spatial recovery areas",
        description: `${missingDropZoneGeometry.length} drop zones are defined without drop-zone area geometry.`,
        recommendedFix: "Bind each drop zone to a drop-zone area in Build before packaging.",
        relatedEntityId: missingDropZoneGeometry[0]?.dropZoneSpatialBindingId ?? null,
        whyItMatters:
          "Recovery logic is only real when the recovery location exists in scene space."
      }),
    );
  }

  const missingPreviewAnchors = project.simulatorLogic.previewAnchorBindings.filter(
    (binding) => binding.readinessState === "missing",
  );
  const weakTeeGeometry = project.simulatorLogic.teeSpatialBindings.filter(
    (binding) => binding.readinessState === "ready" && (!binding.teeZoneRef || !binding.positionHint),
  );
  const weakPinGeometry = project.simulatorLogic.pinSpatialBindings.filter(
    (binding) => binding.readinessState === "ready" && (!binding.greenZoneRef || !binding.positionHint),
  );
  const weakHazardGeometry = project.simulatorLogic.hazardSpatialBindings.filter((binding) => {
    const hazardZone = binding.hazardZoneRef
      ? project.sceneAuthoring.hazardZones.find((zone) => zone.hazardZoneId === binding.hazardZoneRef?.entityId)
      : null;
    return (
      binding.readinessState === "ready" &&
      (!!hazardZone && (hazardZone.boundary.points.length < 4 || hazardZone.linkedHazardIds.length === 0))
    );
  });
  const weakOutOfBoundsGeometry = project.simulatorLogic.outOfBoundsSpatialBindings.filter(
    (binding) => binding.readinessState === "ready" && binding.boundaryRefs.length < 2,
  );
  const weakDropZoneGeometry = project.simulatorLogic.dropZoneSpatialBindings.filter((binding) => {
    const dropZoneArea = binding.dropZoneAreaRef
      ? project.sceneAuthoring.dropZoneAreas.find((area) => area.dropZoneAreaId === binding.dropZoneAreaRef?.entityId)
      : null;
    return (
      binding.readinessState === "ready" &&
      (!!dropZoneArea && (dropZoneArea.boundary.points.length < 4 || dropZoneArea.linkedDropZoneIds.length === 0))
    );
  });
  if (missingPreviewAnchors.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "logic-preview-anchor-bindings",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "warning",
        title: "Preview anchor bindings are incomplete",
        description: `${missingPreviewAnchors.length} minimap or flyover anchors are still missing spatial references.`,
        recommendedFix:
          "Create routing preview anchors or bind preview metadata directly to fairway and green geometry.",
        relatedEntityId: missingPreviewAnchors[0]?.previewAnchorBindingId ?? null,
        whyItMatters:
          "Preview systems stay weak when they are not attached to spatial course truth."
      }),
    );
  }

  if (weakTeeGeometry.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "logic-tee-geometry-quality",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "warning",
        title: "Some tee bindings are spatially thin",
        description: `${weakTeeGeometry.length} ready tee bindings still lack a full tee zone plus a stable tee position hint.`,
        recommendedFix:
          "Use Build to author a complete tee zone and place the tee anchor inside it before export sign-off.",
        relatedEntityId: weakTeeGeometry[0]?.teeSpatialBindingId ?? null,
        whyItMatters:
          "Tee geometry is more trustworthy when the playable area and launch point are both explicit."
      }),
    );
  }

  if (weakPinGeometry.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "logic-pin-anchor-quality",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "warning",
        title: "Some pin bindings are still weakly anchored",
        description: `${weakPinGeometry.length} ready pin bindings still lack either a green-zone reference or a stable pin position hint.`,
        recommendedFix:
          "Place the pin anchor inside the green zone and keep the reference aligned with Build geometry.",
        relatedEntityId: weakPinGeometry[0]?.pinSpatialBindingId ?? null,
        whyItMatters:
          "Pin difficulty becomes export-trustworthy only when the exact target posture is spatially coherent."
      }),
    );
  }

  if (weakHazardGeometry.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "logic-hazard-geometry-quality",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "warning",
        title: "Some hazard zones are still spatially underspecified",
        description: `${weakHazardGeometry.length} ready hazard bindings still point to thin or weakly linked hazard areas.`,
        recommendedFix:
          "Refine the hazard boundary and ensure it is linked to the correct simulator hazard profile in Build.",
        relatedEntityId: weakHazardGeometry[0]?.hazardSpatialBindingId ?? null,
        whyItMatters:
          "Thin hazard geometry weakens simulator trust even if the hazard record itself exists."
      }),
    );
  }

  if (weakOutOfBoundsGeometry.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "logic-oob-geometry-quality",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "warning",
        title: "Some OB bindings are too thin for export confidence",
        description: `${weakOutOfBoundsGeometry.length} ready OB bindings still rely on only one boundary ref.`,
        recommendedFix:
          "Use Build to author a fuller OB edge or multi-boundary posture for the affected holes.",
        relatedEntityId: weakOutOfBoundsGeometry[0]?.outOfBoundsSpatialBindingId ?? null,
        whyItMatters:
          "OB logic is stronger when its boundary posture is spatially explicit and complete."
      }),
    );
  }

  if (weakDropZoneGeometry.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "logic-drop-zone-quality",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "warning",
        title: "Some drop-zone areas are still weakly authored",
        description: `${weakDropZoneGeometry.length} ready drop-zone bindings still point to thin or weakly linked recovery geometry.`,
        recommendedFix:
          "Refine the drop-zone area in Build so the recovery surface and simulator drop-zone link are both explicit.",
        relatedEntityId: weakDropZoneGeometry[0]?.dropZoneSpatialBindingId ?? null,
        whyItMatters:
          "Recovery areas must feel spatially deliberate to be trusted at export time."
      }),
    );
  }

  if (spatialAnalysis.simulatorAnchorConflicts.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "logic-simulator-anchor-conflicts",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: spatialAnalysis.simulatorAnchorConflicts.some((issue) => issue.severity === "critical")
          ? "critical"
          : "high",
        title: "Simulator anchors conflict with authored scene geometry",
        description: `${spatialAnalysis.simulatorAnchorConflicts.length} tee, pin, hazard, OB, drop-zone, or preview anchors still conflict with missing or invalid scene geometry.`,
        recommendedFix:
          "Resolve the flagged anchor conflicts in Build so simulator bindings point to valid spatial course truth.",
        relatedEntityId: spatialAnalysis.simulatorAnchorConflicts[0]?.bindingId ?? null,
        whyItMatters:
          "Simulator-critical bindings must attach cleanly to authoritative spatial geometry."
      }),
    );
  }

  if (spatialAnalysis.previewFramingWeaknesses.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "logic-preview-framing-anchors",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "warning",
        title: "Preview and flyover framing anchors are still weak",
        description: `${spatialAnalysis.previewFramingWeaknesses.length} holes still have missing or weak minimap/flyover framing anchors.`,
        recommendedFix:
          "Author or reposition preview anchors in Build so minimap and flyover framing can inherit stable spatial references.",
        relatedEntityId: spatialAnalysis.previewFramingWeaknesses[0]?.holeId ?? null,
        whyItMatters:
          "Preview quality depends on anchors that are spatially coherent, not just noted in metadata."
      }),
    );
  }

  const requiredDropZoneHazards = project.hazardProfiles.filter((hazard) => hazard.dropZoneRequired);
  const missingDropZones = requiredDropZoneHazards.filter(
    (hazard) => !project.dropZones.some((dropZone) => dropZone.triggerHazardId === hazard.hazardId),
  );

  if (missingDropZones.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "logic-drop-zones",
        validatorId: "simulator-logic",
        category: "Simulator Logic Correctness",
        module: "gameplay",
        severity: "high",
        title: "Some required hazard recoveries are missing drop zones",
        description: `${missingDropZones.length} hazards require drop zones that are not defined.`,
        recommendedFix:
          "Create or intentionally waive the missing drop zones in Gameplay & Simulator Logic Center.",
        relatedEntityId: missingDropZones[0]?.hazardId ?? null,
        whyItMatters: "Recovery logic directly impacts playable output and fairness."
      }),
    );
  }

  return createValidationResult({
    validatorId: "simulator-logic",
    label: "Simulator Logic Validator",
    category: "Simulator Logic Correctness",
    issues,
    summary:
      "Checks tee, pin, OB, drop-zone, preview-input, spatial-binding, and per-hole logic completeness for simulator output."
  });
}
