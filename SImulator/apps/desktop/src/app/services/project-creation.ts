import { isTauri } from "@tauri-apps/api/core";

import { createProject, type ProjectCreationIntentInput } from "@course-creator-os/project-model";
import type { PersistedProjectResult } from "./project-persistence";
import { createProjectInStorage } from "./project-persistence";
import { enrichDerivedProjectState } from "./project-derived-state";

export type ProjectCreationResult = PersistedProjectResult;

function normalizeProjectRoot(projectRoot: string) {
  return projectRoot.trim().replace(/[\\/]+$/, "");
}

export async function createProjectInDesktop(
  intent: ProjectCreationIntentInput,
  projectRoot: string,
): Promise<ProjectCreationResult> {
  const normalizedRoot = normalizeProjectRoot(projectRoot);

  if (!normalizedRoot) {
    throw new Error("Project root is required before creating a project.");
  }

  const project = enrichDerivedProjectState(createProject(intent));

  return createProjectInStorage(
    project,
    normalizedRoot,
    isTauri() ? "tauri-filesystem" : "browser-preview",
  );
}
