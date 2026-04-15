import type { CourseProject } from "@course-creator-os/project-model";
import { summarizePreviewReadiness } from "@course-creator-os/preview";

import { createValidationIssue, createValidationResult } from "../helpers";

export function previewReadinessValidator(project: CourseProject) {
  const issues = [];
  const previewSummary = summarizePreviewReadiness({
    previewPaths: project.previewPaths,
    flyoverPlans: project.flyoverPlans,
    screenshotPlans: project.screenshotPlans,
    showcaseSequences: project.showcaseSequences,
    holeCount: project.manifest.holeCount
  });

  if (previewSummary.minimapCoverage < 1 || previewSummary.flyoverCoverage < 1) {
    issues.push(
      createValidationIssue({
        issueId: "preview-coverage",
        validatorId: "preview-readiness",
        category: "Preview Readiness",
        module: "preview",
        severity: "warning",
        title: "Preview coverage is incomplete",
        description: `Minimap coverage is ${Math.round(previewSummary.minimapCoverage * 100)}% and flyover coverage is ${Math.round(previewSummary.flyoverCoverage * 100)}%.`,
        recommendedFix: "Complete the missing flyover and minimap entries in Preview Studio.",
        relatedEntityId: null,
        whyItMatters:
          "Preview completeness affects creator review, media output, and packaging quality."
      }),
    );
  }

  if (previewSummary.totalScreenshotCount === 0 || previewSummary.screenshotApprovedCount === 0) {
    issues.push(
      createValidationIssue({
        issueId: "preview-screenshot-approval",
        validatorId: "preview-readiness",
        category: "Preview Readiness",
        module: "preview",
        severity: "info",
        title: "Screenshot workflow has not reached an approved media pass",
        description:
          previewSummary.totalScreenshotCount === 0
            ? "No screenshot plans are defined yet."
            : "Preview Studio still lacks an approved screenshot set.",
        recommendedFix: "Define hero screenshots and approve at least one polished capture set.",
        relatedEntityId: project.screenshotPlans[0]?.screenshotId ?? null,
        whyItMatters:
          "Packaging and publish posture need reliable still media, not only path coverage."
      }),
    );
  }

  if (previewSummary.totalShowcaseCount === 0 || previewSummary.showcaseReadyCount === 0) {
    issues.push(
      createValidationIssue({
        issueId: "preview-showcase-sequence",
        validatorId: "preview-readiness",
        category: "Preview Readiness",
        module: "preview",
        severity: "warning",
        title: "Showcase sequencing is not ready yet",
        description:
          previewSummary.totalShowcaseCount === 0
            ? "No showcase sequence exists yet."
            : "Preview Studio has showcase sequencing, but none of it is ready.",
        recommendedFix: "Build at least one showcase sequence that can drive release media and reveal flow.",
        relatedEntityId: project.showcaseSequences[0]?.showcaseSequenceId ?? null,
        whyItMatters:
          "A visually ambitious product needs a deliberate reveal path, not just isolated shots."
      }),
    );
  }

  return createValidationResult({
    validatorId: "preview-readiness",
    label: "Preview Readiness Validator",
    category: "Preview Readiness",
    issues,
    summary: "Checks flyover and minimap coverage before preview and package work proceeds."
  });
}
