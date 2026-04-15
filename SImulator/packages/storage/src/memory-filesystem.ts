import type { FileSystemBridge } from "./contracts";
import { dirnamePath, normalizePath } from "./pathing";

export class MemoryFileSystemBridge implements FileSystemBridge {
  private readonly files = new Map<string, string>();

  private readonly directories = new Set<string>();

  async ensureDirectory(directoryPath: string) {
    this.directories.add(normalizePath(directoryPath));
  }

  async exists(targetPath: string) {
    const normalizedPath = normalizePath(targetPath);
    return this.files.has(normalizedPath) || this.directories.has(normalizedPath);
  }

  async readText(filePath: string) {
    const normalizedPath = normalizePath(filePath);
    const content = this.files.get(normalizedPath);

    if (content === undefined) {
      throw new Error(`File does not exist: ${normalizedPath}`);
    }

    return content;
  }

  async writeText(filePath: string, content: string) {
    const normalizedPath = normalizePath(filePath);
    this.directories.add(dirnamePath(normalizedPath));
    this.files.set(normalizedPath, content);
  }

  snapshot() {
    return new Map(this.files);
  }
}
