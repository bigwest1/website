import { NavLink, useLocation } from "react-router-dom";

import type { CourseProject, ModuleKey } from "@course-creator-os/project-model";

type ProjectTreeProps = {
  project: CourseProject;
  activeModule: ModuleKey;
};

export function ProjectTree({ project, activeModule }: ProjectTreeProps) {
  const location = useLocation();
  const quickJumpHoles = project.holes.slice(0, 3);
  const quickJumpDistricts = project.districts.slice(0, 2);
  const currentLocation = `${location.pathname}${location.search}`;
  const treeEntries: Array<{ label: string; route: string; meta: string; moduleKey: ModuleKey }> = [
    { label: "Course Bible", route: "/plan?tab=course-bible", meta: "Design truth", moduleKey: "plan" },
    { label: "Holes", route: "/plan?tab=hole-planner", meta: `${project.holes.length} planned holes`, moduleKey: "plan" },
    { label: "Districts", route: "/world", meta: `${project.districts.length} active districts`, moduleKey: "world" },
    { label: "Assets", route: "/asset-library", meta: `${project.assets.length} tracked assets`, moduleKey: "asset-library" },
    { label: "Events", route: "/animate", meta: `${project.eventSequences.length} sequences`, moduleKey: "animate" },
    { label: "Previews", route: "/preview", meta: `${project.previewPaths.length} preview paths`, moduleKey: "preview" },
    { label: "Packages", route: "/package", meta: "Release candidates", moduleKey: "package" },
    { label: "Releases", route: "/publish", meta: `${project.releaseRecords.length} release records`, moduleKey: "publish" }
  ];

  return (
    <>
      <section className="nav-section">
        <div className="nav-section-head">
          <p className="eyebrow">Quick Jump</p>
          <span>{project.holes.length} holes</span>
        </div>
        <div className="quick-jump-list">
          {quickJumpHoles.map((hole) => (
            <NavLink key={hole.holeId} className="quick-jump-card" to="/plan?tab=hole-planner">
              <strong>Hole {hole.number}</strong>
              <span>{hole.readabilityTarget}</span>
            </NavLink>
          ))}
          {quickJumpDistricts.map((district) => (
            <NavLink key={district.districtId} className="quick-jump-card" to="/world">
              <strong>{district.name}</strong>
              <span>{district.theme}</span>
            </NavLink>
          ))}
        </div>
      </section>

      <section className="nav-section">
        <div className="nav-section-head">
          <p className="eyebrow">Project Tree</p>
          <span>{project.manifest.slug}</span>
        </div>
        <div className="project-tree">
          {treeEntries.map((entry) => (
            <NavLink
              key={entry.label}
              to={entry.route}
              className={`tree-item ${
                currentLocation === entry.route ||
                (entry.moduleKey === activeModule && !entry.route.includes("?tab="))
                  ? "is-active"
                  : ""
              }`}
            >
              <strong>{entry.label}</strong>
              <span>{entry.meta}</span>
            </NavLink>
          ))}
        </div>
      </section>
    </>
  );
}
