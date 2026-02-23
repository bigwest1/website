import fs from "node:fs";
import path from "node:path";

const PROJECT_CONTENT_DIR = path.join(process.cwd(), "content", "projects");

export function getProjectNarrativeBySlug(slug: string): string | null {
  const filePath = path.join(PROJECT_CONTENT_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, "utf8");
}
