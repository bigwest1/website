import { getModuleDefinition, type ModuleKey } from "@course-creator-os/project-model";
import type { ValidationIssue } from "@course-creator-os/validation";

export function getValidationModuleRoute(moduleKey: ModuleKey) {
  return getModuleDefinition(moduleKey)?.route ?? "/";
}

export function getValidationModuleLabel(moduleKey: ModuleKey) {
  return getModuleDefinition(moduleKey)?.shortTitle ?? moduleKey;
}

export function getValidationIssueRoute(issue: Pick<ValidationIssue, "ownerModule">) {
  return getValidationModuleRoute(issue.ownerModule);
}
