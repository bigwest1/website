import { access, mkdir, readFile, writeFile } from "node:fs/promises";

import type { FileSystemBridge } from "./contracts";
import { dirnamePath } from "./pathing";

export class NodeFileSystemBridge implements FileSystemBridge {
  async ensureDirectory(directoryPath: string) {
    await mkdir(directoryPath, { recursive: true });
  }

  async exists(targetPath: string) {
    try {
      await access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  async readText(filePath: string) {
    return readFile(filePath, "utf8");
  }

  async writeText(filePath: string, content: string) {
    await mkdir(dirnamePath(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
  }
}
