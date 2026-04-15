import { getLatestPackageBuild } from "@course-creator-os/packaging";

import { useProjectSession } from "../app/project-session";

export function UtilityDock() {
  const { project } = useProjectSession();
  const latestBuild = getLatestPackageBuild(project.packageBuilds);
  const pendingAssets = project.assets.filter((asset) => asset.approvalStatus !== "approved").length;

  return (
    <section className="panel utility-dock">
      <div className="utility-column">
        <p className="eyebrow">Background Jobs</p>
        <ul className="rail-list compact-list">
          {project.backgroundJobs.map((job) => (
            <li key={job.jobId}>
              <strong>{job.label}</strong>
              <span>
                {job.area} · {job.status} · {Math.round(job.progress * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="utility-column">
        <p className="eyebrow">Import Queue</p>
        <strong>{pendingAssets} assets need review</strong>
        <p className="body-copy">
          Scale, orientation, and style-compatibility checks remain visible here so the user can
          recover without leaving the current mode.
        </p>
      </div>
      <div className="utility-column">
        <p className="eyebrow">Latest Package</p>
        <strong>{latestBuild?.status ?? "No candidate yet"}</strong>
        <p className="body-copy">
          {latestBuild?.diagnosticsSummary ?? "Generate a release candidate to populate package diagnostics."}
        </p>
      </div>
    </section>
  );
}
