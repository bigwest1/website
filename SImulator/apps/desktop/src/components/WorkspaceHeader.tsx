import { Link } from "react-router-dom";

import type { ModuleDefinition } from "@course-creator-os/project-model";
import type { ValidationReport } from "@course-creator-os/validation";

import {
  getObjectContextLabel,
  getPrimaryActionForModule,
  useProjectSession
} from "../app/project-session";
import { StatusPill } from "./StatusPill";

type WorkspaceHeaderProps = {
  activeModule: ModuleDefinition;
  validationReport: ValidationReport;
  onOpenCommandPalette: () => void;
};

export function WorkspaceHeader({
  activeModule,
  validationReport,
  onOpenCommandPalette
}: WorkspaceHeaderProps) {
  const { activePerformanceProfileId, project, saveStatus } = useProjectSession();
  const primaryAction = getPrimaryActionForModule(activeModule.key);
  const objectContext = getObjectContextLabel(activeModule.key);

  return (
    <header className="workspace-topbar panel">
      <div className="topbar-identity">
        <div className="brand-lockup">
          <div className="brand-mark-monogram">CC</div>
          <div>
            <p className="eyebrow">Course Creator OS</p>
            <h1>{project.manifest.name}</h1>
          </div>
        </div>
        <div className="mode-context">
          <StatusPill label={activeModule.stage} tone="info" />
          <div>
            <strong>{activeModule.title}</strong>
            <span>{objectContext}</span>
          </div>
        </div>
      </div>

      <div className="topbar-status">
        <div className="status-stack">
          <span className="status-label">Save Status</span>
          <strong>{saveStatus.label}</strong>
          <span>{saveStatus.detail}</span>
        </div>
        <div className="status-stack">
          <span className="status-label">Performance Profile</span>
          <strong>{activePerformanceProfileId}</strong>
          <span>{project.manifest.activeOutputProfiles.join(", ")}</span>
        </div>
        <div className="status-stack">
          <span className="status-label">Release Mode</span>
          <strong>{project.manifest.projectMode}</strong>
          <span>{project.manifest.activeValidationProfile}</span>
        </div>
        <div className="status-stack">
          <span className="status-label">Validation</span>
          <strong>{validationReport.issues.length} open issues</strong>
          <span>{validationReport.healthState}</span>
        </div>
      </div>

      <div className="topbar-actions">
        <button className="secondary-action" onClick={onOpenCommandPalette} type="button">
          Command Palette
          <span className="action-hint">Cmd+K</span>
        </button>
        <Link className="primary-action" to={primaryAction.route}>
          {primaryAction.label}
        </Link>
      </div>
    </header>
  );
}
