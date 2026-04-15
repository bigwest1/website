import type { CourseProject } from "@course-creator-os/project-model";
import { findInvalidSpatialRelationships } from "@course-creator-os/scene-authoring";

import { createValidationIssue, createValidationResult } from "../helpers";

export function projectIntegrityValidator(project: CourseProject) {
  const issues = [];

  if (project.manifest.holeCount !== project.holes.length) {
    issues.push(
      createValidationIssue({
        issueId: "project-hole-count",
        validatorId: "project-integrity",
        category: "Project Integrity",
        module: "create",
        severity: "critical",
        title: "Manifest hole count does not match project holes",
        description: "The manifest and hole registry disagree on the number of playable holes.",
        recommendedFix: "Regenerate the manifest or reconcile the hole registry.",
        relatedEntityId: null,
        whyItMatters:
          "Packaging and simulator logic cannot be trusted when structural counts are inconsistent."
      }),
    );
  }

  if (!project.sceneAuthoring.activeCollectionId || project.sceneAuthoring.sceneCollections.length === 0) {
    issues.push(
      createValidationIssue({
        issueId: "project-scene-authoring-collection",
        validatorId: "project-integrity",
        category: "Project Integrity",
        module: "build",
        severity: "high",
        title: "No active scene collection is defined",
        description: "The 3D placement and scene authoring system does not yet have an active collection.",
        recommendedFix:
          "Create and activate a primary scene collection before placing gameplay anchors or landmark hierarchy.",
        relatedEntityId: null,
        whyItMatters:
          "Build, placement, and downstream simulator-spatial checks cannot become trustworthy without a real scene-authoring root."
      }),
    );
  }

  if (project.sceneAuthoring.sceneObjects.length === 0) {
    issues.push(
      createValidationIssue({
        issueId: "project-scene-authoring-objects",
        validatorId: "project-integrity",
        category: "Project Integrity",
        module: "build",
        severity: "warning",
        title: "Scene authoring has no placed objects yet",
        description: "The project does not yet contain any placed scene objects.",
        recommendedFix:
          "Start by placing gameplay anchors, landmark framing elements, and support-scene envelopes in the Build workspace.",
        relatedEntityId: null,
        whyItMatters:
          "A premium course creator needs real spatial course state, not only planning notes and metadata."
      }),
    );
  }

  if (
    project.sceneAuthoring.sceneObjects.length > 0 &&
    !project.sceneAuthoring.sceneObjects.some(
      (sceneObject) => sceneObject.category === "gameplay-course-object",
    )
  ) {
    issues.push(
      createValidationIssue({
        issueId: "project-scene-authoring-gameplay-anchors",
        validatorId: "project-integrity",
        category: "Project Integrity",
        module: "build",
        severity: "high",
        title: "Scene authoring is missing gameplay-critical anchors",
        description:
          "The active scene graph contains scenic content, but no gameplay-relevant course objects are placed yet.",
        recommendedFix:
          "Place tee complexes, green anchors, hazard markers, or other gameplay-critical course objects before layering more scenery.",
        relatedEntityId: project.sceneAuthoring.activeCollectionId,
        whyItMatters:
          "Gameplay and GSPro output correctness need a spatial foundation, not only decorative scene dressing."
      }),
    );
  }

  const invalidRelationships = findInvalidSpatialRelationships(project.sceneAuthoring);
  if (invalidRelationships.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "project-scene-authoring-relationships",
        validatorId: "project-integrity",
        category: "Project Integrity",
        module: "build",
        severity: "critical",
        title: "Spatial authoring relationships contain invalid references",
        description: `${invalidRelationships.length} terrain, routing, or play-route entities reference missing geometry or scene dependencies.`,
        recommendedFix:
          "Repair the invalid terrain, routing, and zone references in Build before trusting downstream simulator or validation posture.",
        relatedEntityId: invalidRelationships[0]?.entityId ?? null,
        whyItMatters:
          "Spatial authoring cannot become authoritative when terrain, routing, or play-route entities point at missing dependencies."
      }),
    );
  }

  return createValidationResult({
    validatorId: "project-integrity",
    label: "Project Integrity Validator",
    category: "Project Integrity",
    issues,
    summary: "Checks that the top-level project structure remains internally consistent."
  });
}
