import { invoke, isTauri } from "@tauri-apps/api/core";

import type { Project } from "@course-creator-os/project-model";
import {
  SQLiteProjectIndexRepository,
  SQLiteValidationIssueRepository,
  createProjectIndexHealthReport,
  createProjectIndexSnapshot,
  executeProjectIndexRebuild,
  inspectProjectIndexState,
  type IndexInspectionResult,
  type IndexRebuildExecutionResult,
  type SQLiteExecutor,
  type SQLiteRunResult,
  type SQLiteValue
} from "@course-creator-os/storage";
import type { ValidationIssue } from "@course-creator-os/validation";

type SqliteValueRecord = Record<string, SQLiteValue>;

class TauriSQLiteExecutor implements SQLiteExecutor {
  constructor(private readonly projectRoot: string) {}

  async exec(sql: string) {
    await invoke("sqlite_exec", {
      projectRoot: this.projectRoot,
      sql
    });
  }

  async query<T extends SqliteValueRecord>(sql: string, params: SQLiteValue[] = []) {
    return invoke<T[]>("sqlite_query", {
      projectRoot: this.projectRoot,
      sql,
      params
    });
  }

  async run(sql: string, params: SQLiteValue[] = []) {
    return invoke<SQLiteRunResult>("sqlite_run", {
      projectRoot: this.projectRoot,
      sql,
      params
    });
  }
}

function canUseOperationalSQLite(projectRoot: string | null, persistenceMode: string) {
  return Boolean(projectRoot) && persistenceMode === "tauri-filesystem" && isTauri();
}

function fallbackInspection(project: Project, generatedAt = new Date().toISOString()): IndexInspectionResult {
  const indexSnapshot = createProjectIndexSnapshot(project, generatedAt);
  const indexHealth = createProjectIndexHealthReport(project, indexSnapshot, generatedAt);

  return {
    indexSnapshot,
    indexHealth,
    rebuildRecommended: false
  };
}

function fallbackRebuild(project: Project, executedAt = new Date().toISOString()): IndexRebuildExecutionResult {
  const indexSnapshot = createProjectIndexSnapshot(project, executedAt);
  const indexHealth = createProjectIndexHealthReport(project, indexSnapshot, executedAt);

  return {
    executedAt,
    indexSnapshot,
    indexHealth,
    rebuildRecommended: false
  };
}

export async function inspectOperationalIndexHealth(
  project: Project,
  projectRoot: string | null,
  persistenceMode: string,
): Promise<IndexInspectionResult> {
  if (!canUseOperationalSQLite(projectRoot, persistenceMode)) {
    return fallbackInspection(project);
  }

  const executor = new TauriSQLiteExecutor(projectRoot!);
  const indexRepository = new SQLiteProjectIndexRepository(executor);
  return inspectProjectIndexState(project, indexRepository);
}

export async function rebuildOperationalIndex(
  project: Project,
  validationIssues: ValidationIssue[],
  projectRoot: string | null,
  persistenceMode: string,
): Promise<IndexRebuildExecutionResult> {
  if (!canUseOperationalSQLite(projectRoot, persistenceMode)) {
    return fallbackRebuild(project);
  }

  const executor = new TauriSQLiteExecutor(projectRoot!);
  const indexRepository = new SQLiteProjectIndexRepository(executor);
  const validationIssueRepository = new SQLiteValidationIssueRepository(executor);

  return executeProjectIndexRebuild(
    project,
    validationIssues,
    indexRepository,
    validationIssueRepository,
  );
}
