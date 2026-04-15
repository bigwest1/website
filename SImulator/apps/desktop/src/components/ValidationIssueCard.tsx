import { Link } from "react-router-dom";

import type { ValidationIssue } from "@course-creator-os/validation";

import { StatusPill } from "./StatusPill";
import {
  getValidationIssueRoute,
  getValidationModuleLabel
} from "./validation-routes";

type ValidationIssueCardProps = {
  issue: ValidationIssue;
  compact?: boolean;
};

function toneForSeverity(severity: ValidationIssue["severity"]) {
  switch (severity) {
    case "critical":
      return "danger";
    case "high":
      return "warning";
    case "warning":
      return "info";
    case "info":
    default:
      return "default";
  }
}

export function ValidationIssueCard({ issue, compact = false }: ValidationIssueCardProps) {
  const targetRoute = getValidationIssueRoute(issue);
  const moduleLabel = getValidationModuleLabel(issue.ownerModule);

  return (
    <article className={`issue-card severity-${issue.severity} ${compact ? "is-compact" : ""}`}>
      <div className="issue-card-head">
        <div className="issue-card-badges">
          <StatusPill label={issue.severity} tone={toneForSeverity(issue.severity)} />
          <StatusPill label={issue.category} />
        </div>
        <StatusPill label={issue.ownerModule} tone="info" />
      </div>
      <div className="issue-card-body">
        <h4>{issue.title}</h4>
        <p>{issue.description}</p>
        {!compact ? <p className="issue-fix-path">Fix path: {issue.recommendedFix}</p> : null}
        {!compact ? <p className="issue-impact">Impact: {issue.whyItMatters}</p> : null}
      </div>
      <div className="issue-card-foot">
        <span>{issue.relatedEntityId ? `Related: ${issue.relatedEntityId}` : "Project-level issue"}</span>
        <Link className="inline-action" to={targetRoute}>
          {compact ? `Open ${moduleLabel}` : `Fix in ${moduleLabel}`}
        </Link>
      </div>
    </article>
  );
}
