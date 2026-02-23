import rawProjects from "@/data/projects.json";
import type { Project } from "@/lib/types";

export const projects = rawProjects as Project[];

export const featuredProjects = projects.filter((project) => project.featured);

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getProjectFilters(): string[] {
  const filters = new Set<string>();
  for (const project of projects) {
    for (const category of project.category) {
      filters.add(category);
    }
  }
  return [...filters];
}
