import type { CourseProject } from "@course-creator-os/project-model";

import { createValidationIssue, createValidationResult } from "../helpers";

export function publishSafeReadinessValidator(project: CourseProject) {
  const issues = [];

  if (project.manifest.projectMode === "public-safe") {
    const publicSafeRelease = project.releaseRecords.some((release) => release.publicSafe);
    if (!publicSafeRelease) {
      issues.push(
        createValidationIssue({
          issueId: "publish-public-safe",
          validatorId: "publish-safe-readiness",
          category: "Publish-Safe Readiness",
          module: "publish",
          severity: "warning",
          title: "Project is marked public-safe but no publish-safe release record exists",
          description:
            "The project mode indicates public-safe intent, but no release record confirms that posture.",
          recommendedFix:
            "Create a public-safe release record after packaging and media checks pass.",
          relatedEntityId: null,
          whyItMatters:
            "Public release posture must be explicit so creators know what can actually ship."
        }),
      );
    }
  }

  return createValidationResult({
    validatorId: "publish-safe-readiness",
    label: "Publish-Safe Readiness Validator",
    category: "Publish-Safe Readiness",
    issues,
    summary: "Checks whether public-safe intent is backed by a release record."
  });
}
