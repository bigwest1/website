import type { CourseProject } from "@course-creator-os/project-model";
import {
  buildPackagingChecklist,
  deriveExportGeometryReport,
  derivePackagingResult,
  getLatestPackageBuild
} from "@course-creator-os/packaging";

import { createValidationIssue, createValidationResult } from "../helpers";

export function packagingReadinessValidator(project: CourseProject) {
  const issues = [];
  const latestBuild = getLatestPackageBuild(project.packageBuilds);
  const validationSeedIssues = project.validationState.openIssueCount;
  const checklist = buildPackagingChecklist(project, []);
  const result = derivePackagingResult(checklist);
  const exportGeometry = deriveExportGeometryReport(project, []);
  const packagingEscalated =
    project.packagingState.readiness === "needs-review" ||
    project.packagingState.readiness === "ready" ||
    project.packagingState.releaseCandidateReady;

  if (!latestBuild || latestBuild.status !== "ready") {
    issues.push(
      createValidationIssue({
        issueId: "packaging-latest-build",
        validatorId: "packaging-readiness",
        category: "Packaging Readiness",
        module: "package",
        severity: "high",
        title: "No release-ready package candidate exists yet",
        description: "The latest package build is not in a ready state.",
        recommendedFix:
          "Resolve blocking validation issues and generate a release candidate.",
        relatedEntityId: latestBuild?.buildId ?? null,
        whyItMatters: "Without a validated package candidate, export readiness is only theoretical."
      }),
    );
  }

  if (latestBuild && !latestBuild.releaseRecipe) {
    issues.push(
      createValidationIssue({
        issueId: "packaging-release-recipe-missing",
        validatorId: "packaging-readiness",
        category: "Packaging Readiness",
        module: "package",
        severity: packagingEscalated ? "critical" : "warning",
        title: "Latest package build is missing a GSPro release recipe",
        description: "Package execution did not record the release recipe or step outputs needed for trustworthy export review.",
        recommendedFix: "Regenerate the release candidate so Package Center records the GSPro recipe, runtime report, and export log.",
        relatedEntityId: latestBuild.buildId,
        whyItMatters: "Without the recipe definition, release execution is harder to trust, inspect, and debug."
      }),
    );
  }

  if (latestBuild && latestBuild.runtimeVerificationState === "unavailable") {
    issues.push(
      createValidationIssue({
        issueId: "packaging-runtime-unavailable",
        validatorId: "packaging-readiness",
        category: "Packaging Readiness",
        module: "package",
        severity: "critical",
        title: "Host/runtime execution was unavailable during the latest package run",
        description: "The latest release candidate was generated without enough host/runtime verification to trust production output.",
        recommendedFix: "Resolve native runtime availability in Settings, then rerun the GSPro release candidate.",
        relatedEntityId: latestBuild.buildId,
        whyItMatters: "Release output should not be treated as production-capable when host execution could not be verified."
      }),
    );
  }

  if (exportGeometry.blockerCount > 0) {
    issues.push(
      createValidationIssue({
        issueId: "packaging-export-geometry",
        validatorId: "packaging-readiness",
        category: "Packaging Readiness",
        module: "package",
        severity: packagingEscalated ? "critical" : "warning",
        title: "Export-facing geometry is still incomplete",
        description: exportGeometry.summary,
        recommendedFix: exportGeometry.recommendedAction,
        relatedEntityId: null,
        whyItMatters:
          "Packaging cannot be trusted if tee, pin, hazard, OB, drop-zone, or preview geometry is still weak."
      }),
    );
  } else if (exportGeometry.warningCount > 0 || result.readiness === "watch") {
    issues.push(
      createValidationIssue({
        issueId: "packaging-export-geometry-watch",
        validatorId: "packaging-readiness",
        category: "Packaging Readiness",
        module: "package",
        severity: "warning",
        title: "Export geometry still has warnings",
        description: exportGeometry.summary,
        recommendedFix: exportGeometry.recommendedAction,
        relatedEntityId: null,
        whyItMatters: "Release confidence is weaker while export geometry still needs review."
      }),
    );
  }

  if (packagingEscalated && validationSeedIssues > 0 && result.readiness !== "ready") {
    issues.push(
      createValidationIssue({
        issueId: "packaging-checklist-watch",
        validatorId: "packaging-readiness",
        category: "Packaging Readiness",
        module: "package",
        severity: "warning",
        title: "Packaging checklist still needs attention",
        description: result.summary,
        recommendedFix: result.recommendedAction,
        relatedEntityId: latestBuild?.buildId ?? null,
        whyItMatters: "A weak packaging checklist undermines release-candidate confidence."
      }),
    );
  }

  return createValidationResult({
    validatorId: "packaging-readiness",
    label: "Packaging Readiness Validator",
    category: "Packaging Readiness",
    issues,
    summary: "Checks release-ready build status, export geometry quality, and packaging checklist posture."
  });
}
