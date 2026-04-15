import {
  assessPerformanceRisk,
  comparePerformanceProfiles,
  type PerformanceMetric,
  type PerformanceProfileId
} from "@course-creator-os/performance";

import { useProjectSession } from "../../app/project-session";
import { StatusPill } from "../../components/StatusPill";
import { ValidationIssueCard } from "../../components/ValidationIssueCard";

type PerformanceCenterProps = {
  selectedProfile: PerformanceProfileId;
  onProfileChange: (profile: PerformanceProfileId) => void;
};

function toneForRiskGrade(riskGrade: "safe" | "caution" | "risky") {
  switch (riskGrade) {
    case "safe":
      return "success";
    case "caution":
      return "warning";
    case "risky":
    default:
      return "danger";
  }
}

function formatMetricValue(metric: PerformanceMetric) {
  return metric.unit === "gb" ? `${metric.actualValue} GB` : `${metric.actualValue}`;
}

function formatMetricBudget(metric: PerformanceMetric) {
  return metric.unit === "gb" ? `${metric.budgetValue} GB` : `${metric.budgetValue}`;
}

export function PerformanceCenter({
  selectedProfile,
  onProfileChange
}: PerformanceCenterProps) {
  const { project, validationReport } = useProjectSession();
  const comparison = comparePerformanceProfiles(project.performanceSnapshot);
  const selectedAssessment =
    comparison.assessments.find((assessment) => assessment.profile.profileId === selectedProfile) ??
    assessPerformanceRisk(project.performanceSnapshot, selectedProfile);
  const performanceIssues = validationReport.issues.filter((issue) => issue.ownerModule === "performance");
  const pressuredMetrics = selectedAssessment.metrics.filter((metric) => metric.riskGrade !== "safe");
  const heatmapDistricts = project.districts.slice(0, 4);

  return (
    <div className="mode-stack performance-center">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Performance Center</p>
            <h3>{selectedAssessment.profile.name}</h3>
          </div>
          <StatusPill
            label={selectedAssessment.riskGrade}
            tone={toneForRiskGrade(selectedAssessment.riskGrade)}
          />
        </div>
        <p className="body-copy">{selectedAssessment.summary}</p>
        <div className="mode-tabs">
          {comparison.assessments.map((assessment) => (
            <button
              key={assessment.profile.profileId}
              className={`mode-tab ${selectedProfile === assessment.profile.profileId ? "is-active" : ""}`}
              onClick={() => onProfileChange(assessment.profile.profileId)}
              type="button"
            >
              {assessment.profile.name}
            </button>
          ))}
        </div>
      </section>

      <section className="performance-profile-grid">
        {comparison.assessments.map((assessment) => (
          <article
            key={assessment.profile.profileId}
            className={`performance-profile-card risk-${assessment.riskGrade} ${selectedProfile === assessment.profile.profileId ? "is-active" : ""}`}
          >
            <div className="performance-profile-head">
              <div>
                <p className="module-card-title">{assessment.profile.name}</p>
                <p className="body-copy">{assessment.profile.intent}</p>
              </div>
              <StatusPill label={assessment.riskGrade} tone={toneForRiskGrade(assessment.riskGrade)} />
            </div>
            <div className="performance-profile-meta">
              <span>{assessment.profile.targetMachineClass}</span>
              <strong>{assessment.overages} over budget</strong>
            </div>
            <p className="body-copy">{assessment.profile.tradeoffSummary}</p>
            <p className="muted-copy">
              {comparison.bestFitProfileId === assessment.profile.profileId
                ? "Current best-fit profile from tracked metrics."
                : `Safe metrics: ${assessment.safeCount} · caution: ${assessment.cautionCount}`}
            </p>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Tracked Metrics</p>
            <h3>Safe / caution / risky by profile budget</h3>
          </div>
        </div>
        <div className="performance-metric-grid">
          {selectedAssessment.metrics.map((metric) => (
            <article key={metric.metricId} className={`metric-card performance-metric-card risk-${metric.riskGrade}`}>
              <span>{metric.label}</span>
              <strong>{formatMetricValue(metric)}</strong>
              <p>
                Budget {formatMetricBudget(metric)} · {metric.utilizationPercent}% utilized
              </p>
              <p className="muted-copy">{metric.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="workspace-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Issue Feed</p>
              <h3>What is driving risk right now</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {performanceIssues.length > 0
              ? performanceIssues.map((issue) => (
                  <ValidationIssueCard key={issue.issueId} issue={issue} compact />
                ))
              : pressuredMetrics.length > 0
                ? pressuredMetrics.map((metric) => (
                    <article key={metric.metricId} className={`issue-card severity-${metric.riskGrade === "risky" ? "high" : "warning"}`}>
                      <div className="issue-card-head">
                        <div className="issue-card-badges">
                          <StatusPill label={metric.riskGrade} tone={toneForRiskGrade(metric.riskGrade)} />
                          <StatusPill label="Performance" />
                        </div>
                      </div>
                      <div className="issue-card-body">
                        <h4>{metric.label}</h4>
                        <p>{metric.summary}</p>
                      </div>
                    </article>
                  ))
                : (
                  <article className="module-card">
                    <p className="module-card-title">No current performance blockers</p>
                    <p className="body-copy">
                      The tracked performance metrics are currently inside the selected profile posture.
                    </p>
                  </article>
                )}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Tradeoffs</p>
              <h3>What this profile protects or sacrifices</h3>
            </div>
          </div>
          <ul className="rail-list">
            {selectedAssessment.tradeoffs.map((tradeoff) => (
              <li key={tradeoff}>
                <strong>{selectedAssessment.profile.name}</strong>
                <span>{tradeoff}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Heatmap Expansion</p>
            <h3>District-level density and visibility scaffold</h3>
          </div>
        </div>
        <div className="heatmap-grid">
          {heatmapDistricts.map((district, index) => {
            const sourceMetric =
              selectedAssessment.metrics[(index + selectedAssessment.overages) % selectedAssessment.metrics.length] ??
              selectedAssessment.metrics[0]!;

            return (
              <div key={district.districtId} className={`heat-cell tone-${sourceMetric.riskGrade === "caution" ? "watch" : sourceMetric.riskGrade}`}>
                <div className="heat-cell-copy">
                  <strong>{district.name}</strong>
                  <span>{sourceMetric.label}</span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="body-copy muted-copy">
          District-linked heatmaps will deepen once routing, asset density, and event telemetry are persisted at zone level.
        </p>
      </section>
    </div>
  );
}
