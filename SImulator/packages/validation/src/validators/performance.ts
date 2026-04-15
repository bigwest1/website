import type { CourseProject } from "@course-creator-os/project-model";
import { assessPerformanceRisk } from "@course-creator-os/performance";

import { createValidationIssue, createValidationResult } from "../helpers";

export function performanceValidator(project: CourseProject) {
  const issues = [];
  const performance = assessPerformanceRisk(
    project.performanceSnapshot,
    project.manifest.projectMode === "public-safe" ? "community-safe" : "brother-mode",
  );

  if (performance.status !== "safe") {
    issues.push(
      createValidationIssue({
        issueId: "performance-risk",
        validatorId: "performance",
        category: "Performance Risk",
        module: "performance",
        severity: performance.status === "risky" ? "high" : "warning",
        title: "Performance profile risk needs attention",
        description: `The current course metrics are ${performance.status} against the selected performance posture.`,
        recommendedFix:
          "Review geometry, animation, and visibility complexity in Performance Center.",
        relatedEntityId: null,
        whyItMatters: "Ignoring performance risk will hurt playback and public distribution confidence."
      }),
    );
  }

  return createValidationResult({
    validatorId: "performance",
    label: "Performance Validator",
    category: "Performance Risk",
    issues,
    summary: "Evaluates current course metrics against the active performance posture."
  });
}
