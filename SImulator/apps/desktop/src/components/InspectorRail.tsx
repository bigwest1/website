import { useState } from "react";

import {
  getModuleReadinessStatus,
  type CourseProject,
  type ModuleDefinition
} from "@course-creator-os/project-model";
import type { ValidationReport } from "@course-creator-os/validation";

import { getObjectContextLabel } from "../app/project-session";
import { StatusPill } from "./StatusPill";
import { ValidationIssueCard } from "./ValidationIssueCard";
import { ValidationSummaryPanel } from "./ValidationSummaryPanel";

type InspectorTab = "inspector" | "validation" | "guidance" | "notes" | "activity";

type InspectorRailProps = {
  project: CourseProject;
  validationReport: ValidationReport;
  activeModule: ModuleDefinition;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  size: "compact" | "standard" | "wide";
  onSizeChange: (size: "compact" | "standard" | "wide") => void;
  performanceAssessment: {
    status: "safe" | "watch" | "risky";
    profile: {
      profileId: string;
      name: string;
    };
  };
};

const inspectorTabs: Array<{ key: InspectorTab; label: string }> = [
  { key: "inspector", label: "Inspector" },
  { key: "validation", label: "Validation" },
  { key: "guidance", label: "AI Guidance" },
  { key: "notes", label: "Notes" },
  { key: "activity", label: "Activity" }
];

export function InspectorRail({
  project,
  validationReport,
  activeModule,
  collapsed,
  onToggleCollapsed,
  size,
  onSizeChange,
  performanceAssessment
}: InspectorRailProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("validation");
  const moduleIssues = validationReport.issues.filter((issue) => issue.ownerModule === activeModule.key);

  if (collapsed) {
    return (
      <aside className="inspector-rail is-collapsed panel">
        <button className="ghost-button rail-collapse-button" onClick={onToggleCollapsed} type="button">
          Open Rail
        </button>
      </aside>
    );
  }

  return (
    <aside className={`inspector-rail size-${size}`}>
      <section className="panel rail-shell">
        <div className="rail-topbar">
          <div>
            <p className="eyebrow">Right Rail</p>
            <strong>{activeModule.shortTitle}</strong>
          </div>
          <div className="rail-topbar-actions">
            <div className="rail-size-group">
              <button className={`size-button ${size === "compact" ? "is-active" : ""}`} onClick={() => onSizeChange("compact")} type="button">
                S
              </button>
              <button className={`size-button ${size === "standard" ? "is-active" : ""}`} onClick={() => onSizeChange("standard")} type="button">
                M
              </button>
              <button className={`size-button ${size === "wide" ? "is-active" : ""}`} onClick={() => onSizeChange("wide")} type="button">
                L
              </button>
            </div>
            <button className="ghost-button" onClick={onToggleCollapsed} type="button">
              Collapse
            </button>
          </div>
        </div>

        <div className="rail-tabs" role="tablist" aria-label="Right rail tabs">
          {inspectorTabs.map((tab) => (
            <button
              key={tab.key}
              className={`rail-tab ${activeTab === tab.key ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="rail-panel-stack">
          {activeTab === "inspector" ? (
            <>
              <section className="rail-section">
                <p className="eyebrow">Current Object</p>
                <h3>{getObjectContextLabel(activeModule.key)}</h3>
                <p className="body-copy">{activeModule.currentFocus}</p>
              </section>
              <section className="rail-section">
                <p className="eyebrow">Module Readiness</p>
                <div className="rail-metric">
                  <div>
                    <span className="metric-label">Completion</span>
                    <strong>{Math.round(project.moduleStatuses[activeModule.key].completion * 100)}%</strong>
                  </div>
                  <div>
                    <span className="metric-label">State</span>
                    <strong>{getModuleReadinessStatus(project.moduleStatuses[activeModule.key])}</strong>
                  </div>
                </div>
                <ul className="rail-list">
                  {activeModule.workspaceSections.map((section) => (
                    <li key={section.title}>
                      <strong>{section.title}</strong>
                      <span>{section.description}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : null}

          {activeTab === "validation" ? (
            <>
              <section className="rail-section">
                <ValidationSummaryPanel
                  report={validationReport}
                  activeModule={activeModule.key}
                  compact
                  maxResults={3}
                  maxIssues={2}
                  title="Module Validation"
                  eyebrow="Validation Summary"
                />
              </section>
              <section className="rail-section rail-scroll">
                <div className="issue-card-list">
                  {(moduleIssues.length > 0 ? moduleIssues : validationReport.issues.slice(0, 4)).map((issue) => (
                    <ValidationIssueCard key={issue.issueId} issue={issue} compact />
                  ))}
                </div>
              </section>
            </>
          ) : null}

          {activeTab === "guidance" ? (
            <>
              <section className="rail-section">
                <p className="eyebrow">Recommended Next Step</p>
                <h3>{project.moduleStatuses[activeModule.key].nextAction}</h3>
                <p className="body-copy">
                  The current workflow favors clarity: finish the main blocker, then advance to the next
                  linked mode instead of spreading effort everywhere.
                </p>
              </section>
              <section className="rail-section">
                <p className="eyebrow">Agent Guidance</p>
                <ul className="rail-list">
                  {validationReport.nextActions.map((action) => (
                    <li key={action.moduleKey}>
                      <strong>{action.title}</strong>
                      <span>{action.reason}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : null}

          {activeTab === "notes" ? (
            <>
              <section className="rail-section">
                <p className="eyebrow">Design Truth</p>
                <p className="body-copy">{project.courseBible.visionOverview.statement}</p>
              </section>
              <section className="rail-section">
                <p className="eyebrow">Current Notes</p>
                <ul className="rail-list">
                  <li>
                    <strong>Release Intent</strong>
                    <span>{project.courseBible.audienceAndIntent.releaseIntent}</span>
                  </li>
                  <li>
                    <strong>Performance Profile</strong>
                    <span>{performanceAssessment.profile.name}</span>
                  </li>
                  <li>
                    <strong>Latest Build Note</strong>
                    <span>{project.packageBuilds[0]?.diagnosticsSummary}</span>
                  </li>
                </ul>
              </section>
            </>
          ) : null}

          {activeTab === "activity" ? (
            <>
              <section className="rail-section">
                <p className="eyebrow">Background Jobs</p>
                <ul className="rail-list">
                  {project.backgroundJobs.map((job) => (
                    <li key={job.jobId}>
                      <strong>{job.label}</strong>
                      <span>
                        {job.area} · {job.status} · {Math.round(job.progress * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="rail-section">
                <p className="eyebrow">Recent Recovery Points</p>
                <ul className="rail-list">
                  {project.snapshots.map((snapshot) => (
                    <li key={snapshot.snapshotId}>
                      <strong>{snapshot.label}</strong>
                      <span>{snapshot.summary}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : null}
        </div>
      </section>
    </aside>
  );
}
