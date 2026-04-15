import { Link } from "react-router-dom";

import { type ModuleKey } from "@course-creator-os/project-model";
import { MetricChip } from "@course-creator-os/ui";
import { formatValidationIssueCounts, type ValidationReport } from "@course-creator-os/validation";

import { StatusPill } from "./StatusPill";
import { ValidationIssueCard } from "./ValidationIssueCard";
import {
  getValidationIssueRoute,
  getValidationModuleLabel
} from "./validation-routes";

type ValidationSummaryPanelProps = {
  report: ValidationReport;
  activeModule?: ModuleKey;
  compact?: boolean;
  title?: string;
  eyebrow?: string;
  maxResults?: number;
  maxIssues?: number;
};

function toneForReadiness(readiness: ValidationReport["readiness"]) {
  switch (readiness) {
    case "blocked":
      return "danger";
    case "watch":
      return "warning";
    case "ready":
    default:
      return "success";
  }
}

function toneForHealthState(healthState: ValidationReport["healthState"]) {
  switch (healthState) {
    case "Blocked":
      return "danger";
    case "Needs Attention":
      return "warning";
    case "Release Candidate Ready":
      return "success";
    case "Healthy":
    default:
      return "info";
  }
}

export function ValidationSummaryPanel({
  report,
  activeModule,
  compact = false,
  title = "Validation Summary",
  eyebrow = "Validation",
  maxResults = 4,
  maxIssues = 2
}: ValidationSummaryPanelProps) {
  const scopedResults = report.results.filter((result) =>
    activeModule ? result.issues.some((issue) => issue.ownerModule === activeModule) : result.issues.length > 0,
  );
  const visibleResults = (scopedResults.length > 0 ? scopedResults : report.results.filter((result) => result.issues.length > 0)).slice(0, maxResults);
  const scopedIssues = report.issues.filter((issue) => (activeModule ? issue.ownerModule === activeModule : true));
  const visibleIssues = (scopedIssues.length > 0 ? scopedIssues : report.issues).slice(0, maxIssues);

  return (
    <section className={`validation-summary-panel ${compact ? "is-compact" : ""}`}>
      <div className="validation-summary-head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
          <p className="body-copy">
            {activeModule
              ? "Current module issues are prioritized first, then broader project blockers."
              : "Structured validation results keep readiness, fix paths, and severity visible."}
          </p>
        </div>
        <div className="validation-summary-badges">
          <StatusPill label={report.healthState} tone={toneForHealthState(report.healthState)} />
          <StatusPill label={report.readiness} tone={toneForReadiness(report.readiness)} />
          <StatusPill label={`${report.issues.length} open`} tone="info" />
        </div>
      </div>

      <div className="validation-summary-metrics">
        <MetricChip label="Critical" tone="error" value={report.issueCounts.critical} />
        <MetricChip label="High" tone="warning" value={report.issueCounts.high} />
        <MetricChip label="Warning" tone="info" value={report.issueCounts.warning} />
        <MetricChip label="Completion" tone="accent" value={`${Math.round(report.completion * 100)}%`} />
      </div>

      <div className="validation-result-list">
        {visibleResults.length === 0 ? (
          <article className="validation-result-card">
            <p className="validation-result-title">All validator lanes are currently clear</p>
            <p className="validation-result-summary">
              No open issues are surfaced for this scope right now.
            </p>
          </article>
        ) : visibleResults.map((result) => {
          const leadIssue = result.issues[0];

          return (
            <article key={result.validatorId} className="validation-result-card">
              <div className="validation-result-head">
                <div>
                  <p className="validation-result-title">{result.label}</p>
                  <p className="validation-result-summary">{result.summary}</p>
                </div>
                <StatusPill label={result.readiness} tone={toneForReadiness(result.readiness)} />
              </div>
              <div className="validation-result-meta">
                <span>{result.category}</span>
                <span>{formatValidationIssueCounts(result.issueCounts)}</span>
              </div>
              {leadIssue ? (
                <div className="validation-result-action">
                  <div>
                    <strong>{leadIssue.title}</strong>
                    <p className="body-copy">{leadIssue.recommendedFix}</p>
                  </div>
                  <Link className="inline-action" to={getValidationIssueRoute(leadIssue)}>
                    {`Open ${getValidationModuleLabel(leadIssue.ownerModule)}`}
                  </Link>
                </div>
              ) : (
                <p className="body-copy muted-copy">No open issues in this validator.</p>
              )}
            </article>
          );
        })}
      </div>

      {visibleIssues.length > 0 ? (
        <div className="validation-summary-issues">
          {visibleIssues.map((issue) => (
            <ValidationIssueCard key={issue.issueId} issue={issue} compact={compact} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
