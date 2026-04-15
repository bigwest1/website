import type { CourseProject } from "@course-creator-os/project-model";

import { createValidationIssue, createValidationResult } from "../helpers";

export function styleConsistencyValidator(project: CourseProject) {
  const issues = [];
  const styleMismatchAssets = project.assets.filter((asset) => !asset.styleTags.includes("premium"));
  if (styleMismatchAssets.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "style-compatibility",
        validatorId: "style-consistency",
        category: "Style Consistency",
        module: "asset-library",
        severity: "info",
        title: "Some assets are weakly aligned to the premium flagship language",
        description: `${styleMismatchAssets.length} assets need stronger style compatibility tagging.`,
        recommendedFix: "Review style tags and reject anything that fights the course identity.",
        relatedEntityId: styleMismatchAssets[0]?.assetId ?? null,
        whyItMatters:
          "Style drift degrades the product’s premium feel even when the asset is technically valid."
      }),
    );
  }

  if (project.districts.length < 2) {
    issues.push(
      createValidationIssue({
        issueId: "world-district-depth",
        validatorId: "style-consistency",
        category: "Style Consistency",
        module: "world",
        severity: "warning",
        title: "World Builder still needs more district structure",
        description: "The world layer still reads as a single undifferentiated district.",
        recommendedFix:
          "Define additional districts or lands before relying on World Builder for composition planning.",
        relatedEntityId: project.districts[0]?.districtId ?? null,
        whyItMatters:
          "Weak district structure makes the course feel generic and undermines strategic world planning."
      }),
    );
  }

  const districtsWithoutLandmarks = project.districts.filter(
    (district) => !project.landmarks.some((landmark) => landmark.districtRef === district.districtId),
  );
  if (districtsWithoutLandmarks.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "world-landmark-coverage",
        validatorId: "style-consistency",
        category: "Style Consistency",
        module: "world",
        severity: "warning",
        title: "Some districts still lack landmark anchors",
        description: `${districtsWithoutLandmarks.length} districts do not yet have landmark coverage.`,
        recommendedFix:
          "Add landmark anchors so each district has a clear compositional focal point.",
        relatedEntityId: districtsWithoutLandmarks[0]?.districtId ?? null,
        whyItMatters:
          "Without landmark anchors, routing and preview work lose a major orientation tool."
      }),
    );
  }

  if (project.supportSpaces.length === 0) {
    issues.push(
      createValidationIssue({
        issueId: "world-support-space-depth",
        validatorId: "style-consistency",
        category: "Style Consistency",
        module: "world",
        severity: "info",
        title: "Support-space planning has not started",
        description:
          "The project does not yet define support spaces for operations, circulation, or believable world logic.",
        recommendedFix:
          "Add support spaces in World Builder before event and preview work assume the world is coherent.",
        relatedEntityId: null,
        whyItMatters:
          "Support-space planning is what keeps ambitious worlds from feeling like disconnected decor."
      }),
    );
  }

  if (project.environmentZones.length === 0) {
    issues.push(
      createValidationIssue({
        issueId: "world-environment-zones",
        validatorId: "style-consistency",
        category: "Style Consistency",
        module: "world",
        severity: "info",
        title: "Environmental zoning still needs definition",
        description:
          "The project does not yet describe vegetation, lighting, atmosphere, or materials as explicit world zones.",
        recommendedFix: "Define environmental zones so world look-dev stays intentional and repeatable.",
        relatedEntityId: null,
        whyItMatters:
          "Environmental zoning protects consistency across districts and helps performance review stay grounded."
      }),
    );
  }

  return createValidationResult({
    validatorId: "style-consistency",
    label: "Style Consistency Validator",
    category: "Style Consistency",
    issues,
    summary:
      "Protects the premium creative direction across assets, districts, landmarks, support spaces, and zones."
  });
}
