"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { Project } from "@/lib/types";
import { MagneticProjectCard } from "@/components/magnetic-project-card";
import { trackPortfolioEvent } from "@/lib/analytics";

const projectFilterLabels: Record<string, string> = {
  all: "All",
  ux: "UX",
  strategy: "Strategy",
  prototype: "Prototype",
  animation: "Animation",
  motion: "Motion"
};

export function ProjectExplorer({
  projects,
  heading,
  subheading,
  maxItems
}: {
  projects: Project[];
  heading: string;
  subheading: string;
  maxItems?: number;
}) {
  const [filter, setFilter] = useState<string>("all");

  const availableFilters = useMemo(() => {
    const found = new Set<string>(["all"]);

    for (const project of projects) {
      for (const category of project.category) {
        if (projectFilterLabels[category]) {
          found.add(category);
        }
      }
    }

    return [...found];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const base =
      filter === "all"
        ? projects
        : projects.filter((project) => project.category.includes(filter as Project["category"][number]));

    return typeof maxItems === "number" ? base.slice(0, maxItems) : base;
  }, [filter, maxItems, projects]);

  return (
    <section className="section project-explorer-section" data-home-section-wrap>
      <div className="container">
        <p className="section-kicker" data-home-section>
          Project Explorer
        </p>
        <h2 className="section-title" data-home-section>
          {heading}
        </h2>
        <p className="section-subtitle" data-home-section>
          {subheading}
        </p>

        <div className="filter-row" role="tablist" aria-label="Project categories" data-home-stagger>
          {availableFilters.map((entry) => (
            <button
              key={entry}
              className="filter-chip"
              data-active={entry === filter}
              type="button"
              onClick={() => {
                setFilter(entry);
                trackPortfolioEvent("interaction_complete", { section: "project_filter", mode: entry });
              }}
            >
              {projectFilterLabels[entry] ?? entry}
            </button>
          ))}
        </div>

        <motion.div layout className="card-grid" data-home-stagger>
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <motion.div
                key={`${filter}-${project.slug}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <MagneticProjectCard project={project} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
