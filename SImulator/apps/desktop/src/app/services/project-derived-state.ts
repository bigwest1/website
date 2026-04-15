import {
  assessPerformanceRisk,
  createPerformanceSnapshotFromSpatialState
} from "@course-creator-os/performance";
import type { Project } from "@course-creator-os/project-model";
import { evaluateValidationReport } from "@course-creator-os/validation";

export function mapValidationReadiness(
  readiness: ReturnType<typeof evaluateValidationReport>["readiness"],
): Project["validationState"]["readiness"] {
  switch (readiness) {
    case "blocked":
      return "blocked";
    case "watch":
      return "needs-review";
    case "ready":
    default:
      return "ready";
  }
}

export function enrichDerivedProjectState(project: Project): Project {
  const performanceSnapshot = createPerformanceSnapshotFromSpatialState(project.sceneAuthoring);
  const projectWithTelemetry = {
    ...project,
    performanceSnapshot
  };
  const validationReport = evaluateValidationReport(projectWithTelemetry);
  const activeProfileId =
    projectWithTelemetry.manifest.projectMode === "public-safe" ? "community-safe" : "brother-mode";
  const performanceAssessment = assessPerformanceRisk(performanceSnapshot, activeProfileId);

  return {
    ...projectWithTelemetry,
    validationState: {
      healthState: validationReport.healthState,
      readiness: mapValidationReadiness(validationReport.readiness),
      openIssueCount: validationReport.issues.length
    },
    performanceState: {
      activeProfileId,
      status: performanceAssessment.status,
      topRisk:
        performanceAssessment.overages > 0
          ? performanceAssessment.profile.notes[0] ?? "Performance review required."
          : null
    }
  };
}
