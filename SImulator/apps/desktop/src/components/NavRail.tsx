import { NavLink } from "react-router-dom";

import { moduleDefinitions, type CourseProject, type ModuleKey } from "@course-creator-os/project-model";

import { ProjectTree } from "./ProjectTree";

type NavRailProps = {
  project: CourseProject;
  activeModule: ModuleKey;
};

function completionLabel(completion: number) {
  return `${Math.round(completion * 100)}%`;
}

const primaryNavigationKeys: ModuleKey[] = [
  "home",
  "create",
  "plan",
  "build",
  "world",
  "animate",
  "playability",
  "performance",
  "preview",
  "package",
  "publish",
  "version-control",
  "agent-command",
  "settings"
];

const specialistNavigationKeys: ModuleKey[] = ["gameplay", "asset-library"];

function renderNavItems(project: CourseProject, activeModule: ModuleKey, keys: ModuleKey[]) {
  return keys.map((key) => {
    const definition = moduleDefinitions.find((candidate) => candidate.key === key);

    if (!definition) {
      return null;
    }

    const status = project.moduleStatuses[definition.key];

    return (
      <NavLink
        key={definition.key}
        to={definition.route}
        className={`nav-item ${activeModule === definition.key ? "is-active" : ""}`}
      >
        <div>
          <strong>{definition.shortTitle}</strong>
          <span>{definition.stage}</span>
        </div>
        <small>{completionLabel(status.completion)}</small>
      </NavLink>
    );
  });
}

export function NavRail({ project, activeModule }: NavRailProps) {
  return (
    <aside className="nav-rail panel">
      <div className="brand-mark">
        <div className="brand-mark-monogram">CC</div>
        <div>
          <p className="eyebrow">Creator Suite</p>
          <h2>Course Creator OS</h2>
        </div>
      </div>

      <section className="nav-section">
        <div className="nav-section-head">
          <p className="eyebrow">Primary Modes</p>
          <span>Creator workflow</span>
        </div>
        <nav className="nav-list" aria-label="Primary navigation">
          {renderNavItems(project, activeModule, primaryNavigationKeys)}
        </nav>
      </section>

      <section className="nav-section nav-subsection">
        <div className="nav-section-head">
          <p className="eyebrow">Specialist Centers</p>
          <span>Deep configuration</span>
        </div>
        <nav className="nav-list nav-list-compact" aria-label="Specialist navigation">
          {renderNavItems(project, activeModule, specialistNavigationKeys)}
        </nav>
      </section>

      <ProjectTree project={project} activeModule={activeModule} />
    </aside>
  );
}
