import type { Project } from "@course-creator-os/project-model";

import { JsonProjectRepository } from "./file-repository";
import { MemoryFileSystemBridge } from "./memory-filesystem";
import { joinPath } from "./pathing";
import type { ProjectBundleFile } from "./project-bundle";

export async function hydrateProjectFromBundleFiles(
  projectRoot: string,
  files: ProjectBundleFile[],
): Promise<Project> {
  const fileSystem = new MemoryFileSystemBridge();
  const repository = new JsonProjectRepository(fileSystem);

  for (const file of files) {
    await fileSystem.writeText(joinPath(projectRoot, file.relativePath), file.content);
  }

  return repository.loadProject(projectRoot);
}
