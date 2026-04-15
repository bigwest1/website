import type { CourseProject } from "@course-creator-os/project-model";

import { createValidationIssue, createValidationResult } from "../helpers";

export function holeMetadataValidator(project: CourseProject) {
  const issues = [];
  const thinHolePlans = project.holes.filter(
    (hole) =>
      hole.metadata.routeNotes.length < 24 ||
      hole.metadata.hazardNotes.length < 24 ||
      hole.metadata.eventPayoffNotes.length < 24 ||
      hole.metadata.flyoverNotes.length < 24 ||
      hole.landmarkRefs.length === 0,
  );

  if (thinHolePlans.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "hole-planning-depth",
        validatorId: "hole-metadata",
        category: "Hole Metadata Completeness",
        module: "plan",
        severity: "warning",
        title: "Some holes still need fuller planning detail",
        description: `${thinHolePlans.length} holes are still missing strong route, hazard, payoff, flyover, or landmark planning detail.`,
        recommendedFix:
          "Finish the Hole Planner notes and landmark references before deeper build work.",
        relatedEntityId: thinHolePlans[0]?.holeId ?? null,
        whyItMatters:
          "Thin hole plans make routing, preview, and simulator logic drift because later modules lack clear hole intent."
      }),
    );
  }

  const holesMissingPreview = project.holes.filter((hole) => hole.previewRefs.length < 2);
  if (holesMissingPreview.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "holes-preview-links",
        validatorId: "hole-metadata",
        category: "Hole Metadata Completeness",
        module: "plan",
        severity: "high",
        title: "Some holes are missing preview references",
        description: `${holesMissingPreview.length} holes do not reference both flyover and minimap planning assets.`,
        recommendedFix: "Complete preview references from the planning workspace.",
        relatedEntityId: holesMissingPreview[0]?.holeId ?? null,
        whyItMatters: "Preview omissions usually indicate that planning detail is still incomplete."
      }),
    );
  }

  return createValidationResult({
    validatorId: "hole-metadata",
    label: "Hole Metadata Validator",
    category: "Hole Metadata Completeness",
    issues,
    summary: "Checks that each hole is planned deeply enough to support routing and preview work."
  });
}
