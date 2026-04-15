import type { ModuleKey } from "@course-creator-os/project-model";

import {
  type ValidationCategory,
  type ValidationIssue,
  type ValidationIssueCounts,
  type ValidationReadiness,
  type ValidationResult,
  validationResultSchema
} from "./models";

const severityPriority: Record<ValidationIssue["severity"], number> = {
  critical: 0,
  high: 1,
  warning: 2,
  info: 3
};

const readinessPriority: Record<ValidationReadiness, number> = {
  blocked: 0,
  watch: 1,
  ready: 2
};

export function countIssuesBySeverity(issues: ValidationIssue[]): ValidationIssueCounts {
  return {
    info: issues.filter((issue) => issue.severity === "info").length,
    warning: issues.filter((issue) => issue.severity === "warning").length,
    high: issues.filter((issue) => issue.severity === "high").length,
    critical: issues.filter((issue) => issue.severity === "critical").length
  };
}

export function readinessFromIssues(issues: ValidationIssue[]): ValidationReadiness {
  const counts = countIssuesBySeverity(issues);

  if (counts.critical > 0) {
    return "blocked";
  }

  if (counts.high > 0 || counts.warning > 0) {
    return "watch";
  }

  return "ready";
}

export function sortValidationIssues(issues: ValidationIssue[]) {
  return [...issues].sort((left, right) => {
    const severityDelta = severityPriority[left.severity] - severityPriority[right.severity];

    if (severityDelta !== 0) {
      return severityDelta;
    }

    return left.title.localeCompare(right.title);
  });
}

export function sortValidationResults(results: ValidationResult[]) {
  return [...results].sort((left, right) => {
    const readinessDelta = readinessPriority[left.readiness] - readinessPriority[right.readiness];

    if (readinessDelta !== 0) {
      return readinessDelta;
    }

    const leftTopSeverity = sortValidationIssues(left.issues)[0]?.severity ?? "info";
    const rightTopSeverity = sortValidationIssues(right.issues)[0]?.severity ?? "info";
    const severityDelta = severityPriority[leftTopSeverity] - severityPriority[rightTopSeverity];

    if (severityDelta !== 0) {
      return severityDelta;
    }

    return left.label.localeCompare(right.label);
  });
}

export function formatValidationIssueCounts(issueCounts: ValidationIssueCounts) {
  return `${issueCounts.critical} critical · ${issueCounts.high} high · ${issueCounts.warning} warning · ${issueCounts.info} info`;
}

type CreateValidationIssueInput = {
  issueId: string;
  validatorId: string;
  category: ValidationCategory;
  module: ModuleKey;
  severity: ValidationIssue["severity"];
  title: string;
  description: string;
  recommendedFix: string;
  relatedEntityId: string | null;
  whyItMatters: string;
  createdAt?: string;
  updatedAt?: string;
};

export function createValidationIssue({
  issueId,
  validatorId,
  category,
  module,
  severity,
  title,
  description,
  recommendedFix,
  relatedEntityId,
  whyItMatters,
  createdAt = "2026-04-13T00:00:00.000Z",
  updatedAt = "2026-04-13T00:00:00.000Z"
}: CreateValidationIssueInput): ValidationIssue {
  return {
    issueId,
    validatorId,
    category,
    module,
    severity,
    status: "open",
    title,
    description,
    recommendedFix,
    relatedEntityId,
    whyItMatters,
    ownerModule: module,
    createdAt,
    updatedAt
  };
}

type CreateValidationResultInput = {
  validatorId: string;
  label: string;
  category: ValidationCategory;
  issues: ValidationIssue[];
  summary: string;
};

export function createValidationResult({
  validatorId,
  label,
  category,
  issues,
  summary
}: CreateValidationResultInput): ValidationResult {
  return validationResultSchema.parse({
    validatorId,
    label,
    category,
    readiness: readinessFromIssues(issues),
    issueCounts: countIssuesBySeverity(issues),
    issues,
    summary
  });
}
