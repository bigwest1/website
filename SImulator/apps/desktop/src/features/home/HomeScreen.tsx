import { startTransition, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { moduleDefinitions, type ModuleKey } from "@course-creator-os/project-model";
import { MetricChip, SectionHeader, type ValidationTone } from "@course-creator-os/ui";

import { setActiveProject, useProjectSession } from "../../app/project-session";
import {
  listRecentProjects,
  loadProjectFromStorage,
  type RecentProjectEntry
} from "../../app/services/project-persistence";
import { StatusPill } from "../../components/StatusPill";
import { ValidationSummaryPanel } from "../../components/ValidationSummaryPanel";

const featuredModules = new Set<ModuleKey>(["create", "plan", "gameplay", "asset-library"]);

const templates = [
  {
    title: "Flagship Theme Park",
    summary: "Premium district-based showcase structure with events, landmarks, and preview planning.",
    label: "Recommended"
  },
  {
    title: "Community-Safe Resort",
    summary: "Balanced template tuned for broader playback targets and public-safe release posture.",
    label: "Broad Reach"
  },
  {
    title: "Fantasy Night Course",
    summary: "High-style atmosphere with strong preview and lighting planning built in from the start.",
    label: "Style-Forward"
  }
];

function toneForHealthState(healthState: string): ValidationTone | "accent" | "default" {
  switch (healthState) {
    case "Blocked":
      return "error";
    case "Needs Attention":
      return "warning";
    case "Release Candidate Ready":
      return "success";
    default:
      return "info";
  }
}

function toneForPerformanceStatus(status: string): ValidationTone | "accent" | "default" {
  switch (status) {
    case "safe":
      return "success";
    case "watch":
      return "warning";
    case "risky":
      return "error";
    default:
      return "accent";
  }
}

export function HomeScreen() {
  const navigate = useNavigate();
  const { performanceAssessment, project, projectRoot, validationReport } = useProjectSession();
  const [openingProjectRoot, setOpeningProjectRoot] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const recentProjects = listRecentProjects().filter((entry) => entry.projectRoot !== projectRoot);

  async function handleOpenRecentProject(entry: RecentProjectEntry) {
    setOpeningProjectRoot(entry.projectRoot);
    setOpenError(null);

    try {
      const result = await loadProjectFromStorage(entry.projectRoot, entry.storageMode);
      startTransition(() => {
        setActiveProject(result.project, {
          persistenceMode: result.storageMode,
          projectRoot: result.projectRoot,
          manifestPath: result.manifestPath,
          savedAt: result.project.manifest.updatedAt
        });
      });
      navigate("/plan");
    } catch (error) {
      setOpenError(
        error instanceof Error ? error.message : "The selected project could not be opened.",
      );
    } finally {
      setOpeningProjectRoot(null);
    }
  }

  return (
    <div className="screen-grid">
      <section className="panel hero-panel home-hero">
        <div className="hero-copy">
          <p className="eyebrow">Continue Where You Left Off</p>
          <h2>{project.manifest.name} is in active foundation build.</h2>
          <p className="body-copy">
            The shell now tracks validation, performance posture, preview coverage, and packaging
            readiness across the full Version 1.0 workflow so creators can move with confidence
            instead of guessing what is blocking them.
          </p>
          <div className="hero-action-row">
            <Link className="primary-action" to="/create">
              Create New Project
            </Link>
            <Link className="secondary-action" to="/plan">
              Resume Last Workflow
            </Link>
          </div>
        </div>
        <div className="hero-stats">
          <MetricChip
            label="Project Health"
            tone={toneForHealthState(validationReport.healthState)}
            value={validationReport.healthState}
          />
          <MetricChip
            label="Completion"
            note={`${validationReport.issues.length} issues surfaced`}
            tone="accent"
            value={`${Math.round(validationReport.completion * 100)}%`}
          />
          <MetricChip
            label="Profile Risk"
            tone={toneForPerformanceStatus(performanceAssessment.status)}
            value={performanceAssessment.status}
          />
        </div>
      </section>

      <section className="panel">
        <SectionHeader eyebrow="Recent Projects" title="Project access and orientation" />
        <div className="project-grid">
          <article className="project-card featured">
            <div className="project-card-head">
              <StatusPill label="Pinned Flagship" tone="success" />
              <StatusPill label={project.manifest.courseType} tone="info" />
            </div>
            <h4>{project.manifest.name}</h4>
            <p>{project.courseBible.visionOverview.statement}</p>
            <div className="project-card-meta">
              <span>{project.manifest.projectMode}</span>
              <strong>{project.manifest.activeStylePack}</strong>
            </div>
          </article>
          {recentProjects.slice(0, 2).map((entry) => {
            const isOpening = openingProjectRoot === entry.projectRoot;

            return (
              <article key={entry.projectRoot} className="project-card">
                <div className="project-card-head">
                  <StatusPill label={entry.storageMode === "tauri-filesystem" ? "Disk Project" : "Preview Bundle"} />
                  <StatusPill label={entry.courseType} tone="info" />
                </div>
                <h4>{entry.name}</h4>
                <p>
                  Reopen {entry.projectMode} work from {entry.projectRoot}.
                </p>
                <div className="project-card-meta">
                  <span>{new Date(entry.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  <button
                    className="link-button"
                    disabled={isOpening}
                    onClick={() => void handleOpenRecentProject(entry)}
                    type="button"
                  >
                    {isOpening ? "Opening..." : "Open Project"}
                  </button>
                </div>
              </article>
            );
          })}
          {recentProjects.length === 0 ? (
            <article className="project-card">
              <div className="project-card-head">
                <StatusPill label="Sample Structure" />
              </div>
              <h4>Flagship Course Structure</h4>
              <p>Reference architecture for districts, preview outputs, and release posture.</p>
              <div className="project-card-meta">
                <span>Onboarding</span>
                <strong>Open sample</strong>
              </div>
            </article>
          ) : null}
          <article className="project-card">
            <div className="project-card-head">
              <StatusPill label="Resume Flow" tone="warning" />
            </div>
            <h4>Validation Recovery Path</h4>
            <p>Jump back into the highest-impact fix path without searching through the app.</p>
            <div className="project-card-meta">
              <span>{validationReport.issues.length} issues open</span>
              <strong>Open validation</strong>
            </div>
          </article>
        </div>
        {openError ? <p className="warning-copy">{openError}</p> : null}
      </section>

      <section className="panel">
        <SectionHeader eyebrow="Templates" title="Strong starting directions" />
        <div className="template-carousel">
          {templates.map((template) => (
            <article key={template.title} className="template-card">
              <StatusPill label={template.label} tone="info" />
              <h4>{template.title}</h4>
              <p>{template.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <SectionHeader eyebrow="Recommended Next Actions" title="One clear move from here" />
        <div className="module-grid">
          {moduleDefinitions
            .filter((definition) => featuredModules.has(definition.key))
            .map((definition) => {
              const status = project.moduleStatuses[definition.key];

              return (
                <article key={definition.key} className="module-card">
                  <p className="module-card-title">{definition.title}</p>
                  <p className="body-copy">{definition.summary}</p>
                  <div className="module-card-meta">
                    <span>{status.nextAction}</span>
                    <strong>{Math.round(status.completion * 100)}%</strong>
                  </div>
                </article>
              );
            })}
        </div>
      </section>

      <div className="workspace-columns">
        <section className="panel">
          <SectionHeader eyebrow="Recent Package Activity" title="Release preparation" />
          <div className="activity-stack">
            {project.packageBuilds.map((build) => (
              <article key={build.buildId} className="module-card">
                <div className="project-card-meta">
                  <span>{build.profileId}</span>
                  <strong>{build.status}</strong>
                </div>
                <p className="body-copy">{build.diagnosticsSummary}</p>
              </article>
            ))}
            {project.releaseRecords.map((release) => (
              <article key={release.releaseId} className="module-card">
                <div className="project-card-meta">
                  <span>{release.channel}</span>
                  <strong>{release.versionLabel}</strong>
                </div>
                <p className="body-copy">{release.notes}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <SectionHeader eyebrow="Alerts" title="What needs attention" />
          <ValidationSummaryPanel
            report={validationReport}
            compact
            maxResults={3}
            maxIssues={2}
            title="Project readiness"
            eyebrow="Alerts"
          />
        </section>
      </div>
    </div>
  );
}
