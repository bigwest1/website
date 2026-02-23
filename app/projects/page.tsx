import type { Metadata } from "next";
import { ProjectExplorer } from "@/components/project-explorer";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects | Jesse Westlund",
  description:
    "Explore all Jesse Westlund UX, interaction, strategy, and motion design projects across enterprise, healthcare, education, and product platforms.",
  alternates: {
    canonical: "/projects"
  }
};

export default function ProjectsPage() {
  return (
    <ProjectExplorer
      projects={projects}
      heading="All Portfolio Projects"
      subheading="A complete archive of UX and creative work, upgraded into a cohesive interactive portfolio experience."
    />
  );
}
