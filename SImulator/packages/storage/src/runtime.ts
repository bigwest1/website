import type { Project } from "@course-creator-os/project-model";
import type { ValidationIssue } from "@course-creator-os/validation";

import {
  createProjectIndexHealthReport,
  createProjectIndexSnapshot,
  shouldRebuildProjectIndex,
  type ProjectIndexHealthReport,
  type ProjectIndexSnapshot
} from "./index-health";
import {
  SQLiteProjectIndexRepository,
  SQLiteValidationIssueRepository
} from "./sqlite";

export type IndexInspectionResult = {
  indexSnapshot: ProjectIndexSnapshot | null;
  indexHealth: ProjectIndexHealthReport;
  rebuildRecommended: boolean;
};

export type IndexRebuildExecutionResult = {
  executedAt: string;
  indexSnapshot: ProjectIndexSnapshot;
  indexHealth: ProjectIndexHealthReport;
  rebuildRecommended: boolean;
};

export async function inspectProjectIndexState(
  project: Project,
  indexRepository: SQLiteProjectIndexRepository,
  generatedAt = new Date().toISOString(),
): Promise<IndexInspectionResult> {
  const indexSnapshot = await indexRepository.readProjectIndexSnapshot(project.id);
  const indexedStats = await indexRepository.readProjectIndexStats(project.id);
  const indexHealth = createProjectIndexHealthReport(project, indexSnapshot, generatedAt, indexedStats);

  return {
    indexSnapshot,
    indexHealth,
    rebuildRecommended: shouldRebuildProjectIndex(indexHealth)
  };
}

export async function executeProjectIndexRebuild(
  project: Project,
  validationIssues: ValidationIssue[],
  indexRepository: SQLiteProjectIndexRepository,
  validationIssueRepository: SQLiteValidationIssueRepository,
  executedAt = new Date().toISOString(),
): Promise<IndexRebuildExecutionResult> {
  await indexRepository.rebuildProjectIndex(project);
  await validationIssueRepository.replaceIssues(project.id, validationIssues);
  const nextIndexSnapshot =
    (await indexRepository.readProjectIndexSnapshot(project.id)) ??
    createProjectIndexSnapshot(project, executedAt);
  const indexedStats = await indexRepository.readProjectIndexStats(project.id);
  const indexHealth = createProjectIndexHealthReport(
    project,
    nextIndexSnapshot,
    executedAt,
    indexedStats,
  );

  return {
    executedAt,
    indexSnapshot: nextIndexSnapshot,
    indexHealth,
    rebuildRecommended: shouldRebuildProjectIndex(indexHealth)
  };
}
