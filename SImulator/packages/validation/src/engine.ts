import { getLatestPackageBuild } from "@course-creator-os/packaging";
import { getModuleDefinition, type CourseProject, type ModuleKey } from "@course-creator-os/project-model";

import {
  countIssuesBySeverity,
  readinessFromIssues,
  sortValidationIssues,
  sortValidationResults
} from "./helpers";
import { type ValidationHealthState, type ValidationReport, validationReportSchema } from "./models";
import { validationValidators } from "./validators";

function deriveHealthState(project: CourseProject, report: Omit<ValidationReport, "healthState">): ValidationHealthState {
  const latestBuild = getLatestPackageBuild(project.packageBuilds);

  if (report.readiness === "blocked") {
    return "Blocked";
  }

  if (
    latestBuild?.status === "ready" &&
    report.issueCounts.high === 0 &&
    report.issueCounts.warning === 0 &&
    report.issueCounts.critical === 0
  ) {
    return "Release Candidate Ready";
  }

  if (report.readiness === "watch") {
    return "Needs Attention";
  }

  return "Healthy";
}

export function evaluateValidationReport(project: CourseProject): ValidationReport {
  const results = sortValidationResults(validationValidators.map((validator) => validator.validate(project)));
  const issues = sortValidationIssues(results.flatMap((result) => result.issues));
  const issueCounts = countIssuesBySeverity(issues);
  const readiness = readinessFromIssues(issues);
  const completion =
    Object.values(project.moduleStatuses).reduce((total, status) => total + status.completion, 0) /
    Object.keys(project.moduleStatuses).length;

  const prioritizedModules = new Set<ModuleKey>();
  for (const issue of issues) {
    prioritizedModules.add(issue.ownerModule);
    if (prioritizedModules.size === 4) {
      break;
    }
  }

  for (const [moduleKey, status] of Object.entries(project.moduleStatuses).sort(
    (left, right) => left[1].completion - right[1].completion,
  )) {
    prioritizedModules.add(moduleKey as ModuleKey);
    if (prioritizedModules.size === 4) {
      break;
    }
  }

  const nextActions = Array.from(prioritizedModules).map((moduleKey) => {
    const topIssue = issues.find((issue) => issue.ownerModule === moduleKey);
    const moduleDefinition = getModuleDefinition(moduleKey);

    return {
      moduleKey,
      title: moduleDefinition?.title ?? moduleKey,
      reason: topIssue?.recommendedFix ?? project.moduleStatuses[moduleKey].nextAction
    };
  });

  const reportWithoutHealthState = {
    readiness,
    issueCounts,
    issues,
    results,
    nextActions,
    completion
  };

  return validationReportSchema.parse({
    ...reportWithoutHealthState,
    healthState: deriveHealthState(project, reportWithoutHealthState)
  });
}
