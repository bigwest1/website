import type { CourseProject } from "@course-creator-os/project-model";

import { createValidationIssue, createValidationResult } from "../helpers";

export function assetHealthValidator(project: CourseProject) {
  const issues = [];
  const pendingAssets = project.assets.filter((asset) => asset.approvalStatus !== "approved");

  if (pendingAssets.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "assets-pending-approval",
        validatorId: "asset-health",
        category: "Asset Health",
        module: "asset-library",
        severity: "warning",
        title: "Asset approval queue still has unresolved items",
        description: `${pendingAssets.length} assets still need approval or cleanup.`,
        recommendedFix: "Resolve scale/orientation issues and approve or reject the pending assets.",
        relatedEntityId: pendingAssets[0]?.assetId ?? null,
        whyItMatters: "Unreviewed assets create downstream worldbuilding and performance risk."
      }),
    );
  }

  const blockedAssetImports = project.assets.filter((asset) => asset.queueState === "blocked");
  if (blockedAssetImports.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "assets-blocked-imports",
        validatorId: "asset-health",
        category: "Asset Health",
        module: "asset-library",
        severity: "high",
        title: "Some asset imports are blocked before approval",
        description: `${blockedAssetImports.length} assets are stalled by import or normalization blockers.`,
        recommendedFix:
          "Resolve the blocked assets or reject them before World Builder depends on them.",
        relatedEntityId: blockedAssetImports[0]?.assetId ?? null,
        whyItMatters:
          "Blocked imports create hidden production risk because later modules may build on assets that never become usable."
      }),
    );
  }

  const normalizationReviewAssets = project.assets.filter(
    (asset) =>
      asset.normalizationState !== "normalized" ||
      asset.scaleStatus !== "normalized" ||
      asset.orientationStatus !== "ready",
  );
  if (normalizationReviewAssets.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "assets-normalization-review",
        validatorId: "asset-health",
        category: "Asset Health",
        module: "asset-library",
        severity: "warning",
        title: "Asset normalization review still has open items",
        description: `${normalizationReviewAssets.length} assets still need scale, orientation, or normalization cleanup.`,
        recommendedFix:
          "Use the Asset Library inspector to resolve the flagged normalization statuses before approval.",
        relatedEntityId: normalizationReviewAssets[0]?.assetId ?? null,
        whyItMatters:
          "Weak normalization produces downstream placement, performance, and packaging problems."
      }),
    );
  }

  const analysisGapAssets = project.assets.filter(
    (asset) => asset.analysis.analysisStatus === "not-started" || asset.analysis.complexityGrade === null,
  );
  if (analysisGapAssets.length > 0) {
    issues.push(
      createValidationIssue({
        issueId: "assets-analysis-coverage",
        validatorId: "asset-health",
        category: "Asset Health",
        module: "asset-library",
        severity: "info",
        title: "Asset analysis coverage is still thin",
        description: `${analysisGapAssets.length} assets are missing a complete early analysis pass.`,
        recommendedFix:
          "Capture first-pass poly, material, texture, and complexity estimates in the Asset Library.",
        relatedEntityId: analysisGapAssets[0]?.assetId ?? null,
        whyItMatters:
          "Without even rough analysis data, performance forecasting and approval decisions stay weak."
      }),
    );
  }

  return createValidationResult({
    validatorId: "asset-health",
    label: "Asset Health Validator",
    category: "Asset Health",
    issues,
    summary:
      "Tracks approval, intake blockers, normalization gaps, and analysis completeness in the asset pipeline."
  });
}
