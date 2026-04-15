import type { CourseProject } from "@course-creator-os/project-model";

import { createValidationIssue, createValidationResult } from "../helpers";

export function courseBibleCompletenessValidator(project: CourseProject) {
  const issues = [];

  if (project.courseBible.signatureMoments.length < 3) {
    issues.push(
      createValidationIssue({
        issueId: "bible-signature-depth",
        validatorId: "course-bible-completeness",
        category: "Course Bible Completeness",
        module: "plan",
        severity: "warning",
        title: "Course bible needs richer signature moments",
        description:
          "The course bible does not yet describe enough anchor moments for the flagship experience.",
        recommendedFix: "Add more signature moments and connect them to hole pacing.",
        relatedEntityId: null,
        whyItMatters: "Weak planning detail makes later worldbuilding and preview work drift."
      }),
    );
  }

  if (
    project.courseBible.visionOverview.statement.length < 40 ||
    project.courseBible.audienceAndIntent.intendedExperience.length < 24 ||
    project.courseBible.worldIdentity.environmentLogic.length < 2
  ) {
    issues.push(
      createValidationIssue({
        issueId: "bible-design-truth-depth",
        validatorId: "course-bible-completeness",
        category: "Course Bible Completeness",
        module: "plan",
        severity: "warning",
        title: "Design truth still needs more depth",
        description:
          "Vision, intended experience, or environment logic is still too thin for a stable planning foundation.",
        recommendedFix: "Expand the Course Bible summary fields before deeper worldbuilding and asset work.",
        relatedEntityId: null,
        whyItMatters:
          "Thin design truth creates rework because later module decisions have no durable creative anchor."
      }),
    );
  }

  return createValidationResult({
    validatorId: "course-bible-completeness",
    label: "Course Bible Completeness Validator",
    category: "Course Bible Completeness",
    issues,
    summary: "Verifies that the design truth is rich enough to support downstream modules."
  });
}
