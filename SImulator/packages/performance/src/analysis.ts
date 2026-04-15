import {
  type CoursePerformanceSnapshot,
  type PerformanceComparison,
  type PerformanceMetric,
  type PerformanceMetricId,
  type PerformanceProfile,
  type PerformanceProfileAssessment,
  type PerformanceProfileId,
  type PerformanceRiskGrade,
  performanceComparisonSchema,
  performanceMetricSchema,
  performanceProfileAssessmentSchema
} from "./models";
import { getPerformanceProfile, performanceProfiles } from "./profiles";

const metricDefinitions: Array<{
  metricId: PerformanceMetricId;
  label: string;
  unit: PerformanceMetric["unit"];
  readActualValue: (snapshot: CoursePerformanceSnapshot) => number;
  readBudgetValue: (profile: PerformanceProfile) => number;
}> = [
  {
    metricId: "geometry",
    label: "Geometry Density",
    unit: "score",
    readActualValue: (snapshot) => snapshot.geometryEstimate,
    readBudgetValue: (profile) => profile.geometryBudget
  },
  {
    metricId: "texture-memory",
    label: "Texture Memory",
    unit: "gb",
    readActualValue: (snapshot) => snapshot.textureMemoryEstimateGb,
    readBudgetValue: (profile) => profile.textureBudget
  },
  {
    metricId: "materials",
    label: "Material Complexity",
    unit: "score",
    readActualValue: (snapshot) => snapshot.materialComplexity,
    readBudgetValue: (profile) => profile.materialBudget
  },
  {
    metricId: "animation",
    label: "Animation Load",
    unit: "score",
    readActualValue: (snapshot) => snapshot.animationComplexity,
    readBudgetValue: (profile) => profile.animationBudget
  },
  {
    metricId: "scene-density",
    label: "Scene Density",
    unit: "score",
    readActualValue: (snapshot) => snapshot.sceneDensity,
    readBudgetValue: (profile) => profile.sceneDensityBudget
  },
  {
    metricId: "visibility",
    label: "Visibility Complexity",
    unit: "score",
    readActualValue: (snapshot) => snapshot.visibilityComplexity,
    readBudgetValue: (profile) => profile.visibilityBudget
  }
] as const;

function toFixedValue(value: number, unit: PerformanceMetric["unit"]) {
  return unit === "gb" ? Number(value.toFixed(1)) : Math.round(value);
}

function gradeForUtilization(utilizationPercent: number): PerformanceRiskGrade {
  if (utilizationPercent > 100) {
    return "risky";
  }

  if (utilizationPercent >= 85) {
    return "caution";
  }

  return "safe";
}

function summarizeMetric(
  label: string,
  actualValue: number,
  budgetValue: number,
  riskGrade: PerformanceRiskGrade,
) {
  if (riskGrade === "risky") {
    return `${label} is over budget and needs reduction before this profile can be trusted.`;
  }

  if (riskGrade === "caution") {
    return `${label} is approaching the profile ceiling and should be watched before density increases.`;
  }

  return `${label} is comfortably inside the current budget.`;
}

export function createPerformanceMetrics(
  snapshot: CoursePerformanceSnapshot,
  profile: PerformanceProfile,
) {
  return metricDefinitions.map((definition) => {
    const actualValue = definition.readActualValue(snapshot);
    const budgetValue = definition.readBudgetValue(profile);
    const utilizationPercent = budgetValue === 0 ? 0 : Number(((actualValue / budgetValue) * 100).toFixed(1));
    const riskGrade = gradeForUtilization(utilizationPercent);

    return performanceMetricSchema.parse({
      metricId: definition.metricId,
      label: definition.label,
      actualValue: toFixedValue(actualValue, definition.unit),
      budgetValue: toFixedValue(budgetValue, definition.unit),
      unit: definition.unit,
      utilizationPercent,
      delta: Number((actualValue - budgetValue).toFixed(1)),
      riskGrade,
      summary: summarizeMetric(definition.label, actualValue, budgetValue, riskGrade)
    });
  });
}

function deriveAssessmentGrade(metrics: PerformanceMetric[]) {
  const riskyCount = metrics.filter((metric) => metric.riskGrade === "risky").length;
  const cautionCount = metrics.filter((metric) => metric.riskGrade === "caution").length;
  const safeCount = metrics.length - riskyCount - cautionCount;

  let riskGrade: PerformanceRiskGrade = "safe";

  if (riskyCount >= 2 || (riskyCount >= 1 && cautionCount >= 1)) {
    riskGrade = "risky";
  } else if (riskyCount === 1 || cautionCount >= 1) {
    riskGrade = "caution";
  }

  return {
    riskGrade,
    riskyCount,
    cautionCount,
    safeCount
  };
}

function buildAssessmentSummary(
  profile: PerformanceProfile,
  riskGrade: PerformanceRiskGrade,
  metrics: PerformanceMetric[],
) {
  const leadMetric = [...metrics].sort((left, right) => right.utilizationPercent - left.utilizationPercent)[0];

  if (!leadMetric) {
    return `${profile.name} does not have enough metric data yet.`;
  }

  if (riskGrade === "risky") {
    return `${leadMetric.label} is pushing ${profile.name} beyond a comfortable release posture.`;
  }

  if (riskGrade === "caution") {
    return `${leadMetric.label} is the main pressure point for ${profile.name}.`;
  }

  return `${profile.name} currently has usable headroom across the tracked metrics.`;
}

function buildTradeoffs(
  profile: PerformanceProfile,
  riskGrade: PerformanceRiskGrade,
  metrics: PerformanceMetric[],
) {
  const pressuredMetrics = metrics
    .filter((metric) => metric.riskGrade !== "safe")
    .sort((left, right) => right.utilizationPercent - left.utilizationPercent)
    .slice(0, 2);

  const tradeoffs = [profile.tradeoffSummary, ...profile.notes];

  if (pressuredMetrics.length > 0) {
    tradeoffs.push(
      `Reduce ${pressuredMetrics.map((metric) => metric.label.toLowerCase()).join(" and ")} first if this profile is the ship target.`,
    );
  } else if (riskGrade === "safe") {
    tradeoffs.push("Current metrics leave room for further polish, but do not spend that headroom casually.");
  }

  return tradeoffs.slice(0, 4);
}

export function evaluatePerformanceProfile(
  snapshot: CoursePerformanceSnapshot,
  profileId: PerformanceProfileId,
) {
  const profile = getPerformanceProfile(profileId);
  const metrics = createPerformanceMetrics(snapshot, profile);
  const { riskGrade, riskyCount, cautionCount, safeCount } = deriveAssessmentGrade(metrics);

  return performanceProfileAssessmentSchema.parse({
    profile,
    riskGrade,
    status: riskGrade === "caution" ? "watch" : riskGrade,
    overages: riskyCount,
    cautionCount,
    safeCount,
    metrics,
    summary: buildAssessmentSummary(profile, riskGrade, metrics),
    tradeoffs: buildTradeoffs(profile, riskGrade, metrics)
  });
}

export function comparePerformanceProfiles(
  snapshot: CoursePerformanceSnapshot,
) {
  const assessments = performanceProfiles.map((profile) =>
    evaluatePerformanceProfile(snapshot, profile.profileId),
  );
  const recommendationOrder: PerformanceProfileId[] = [
    "community-safe",
    "brother-mode",
    "showcase"
  ];
  const bestFitProfileId =
    recommendationOrder.find((profileId) =>
      assessments.some(
        (assessment) =>
          assessment.profile.profileId === profileId && assessment.riskGrade !== "risky",
      ),
    ) ??
    assessments.find((assessment) => assessment.riskGrade === "safe")?.profile.profileId ??
    assessments[0]?.profile.profileId ??
    "brother-mode";

  return performanceComparisonSchema.parse({
    snapshot,
    assessments,
    bestFitProfileId
  });
}

export function assessPerformanceRisk(
  snapshot: CoursePerformanceSnapshot,
  profileId: PerformanceProfileId,
) {
  return evaluatePerformanceProfile(snapshot, profileId);
}
