import { Link } from "react-router-dom";

import type { ValidationReport } from "@course-creator-os/validation";

import { StatusPill } from "./StatusPill";
import { getValidationIssueRoute } from "./validation-routes";

type GlobalHealthBannerProps = {
  validationReport: ValidationReport;
};

function toneForHealthState(state: ValidationReport["healthState"]) {
  switch (state) {
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

export function GlobalHealthBanner({ validationReport }: GlobalHealthBannerProps) {
  const topIssue = validationReport.issues[0];
  const primaryRoute = topIssue ? getValidationIssueRoute(topIssue) : "/package";

  return (
    <section className={`panel global-health-banner banner-${validationReport.readiness}`}>
      <div className="banner-copy">
        <div className="banner-head">
          <StatusPill label={validationReport.healthState} tone={toneForHealthState(validationReport.healthState)} />
          <span className="banner-counts">
            {validationReport.issueCounts.critical} critical · {validationReport.issueCounts.high} high ·{" "}
            {validationReport.issueCounts.warning} warning
          </span>
        </div>
        <h2>{topIssue ? topIssue.title : "Project foundation is stable."}</h2>
        <p className="body-copy">
          {topIssue
            ? `${topIssue.whyItMatters} ${topIssue.recommendedFix}`
            : "No blocking issues are currently preventing progress."}
        </p>
      </div>
      <div className="banner-actions">
        <Link className="primary-action" to={primaryRoute}>
          {topIssue ? "Resolve top issue" : "Open package center"}
        </Link>
        <Link className="secondary-action" to="/playability">
          Review validation
        </Link>
      </div>
    </section>
  );
}
