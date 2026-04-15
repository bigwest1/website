import { z } from "zod";

export const performanceProfileIdSchema = z.enum([
  "brother-mode",
  "community-safe",
  "showcase"
]);

export const performanceRiskGradeSchema = z.enum(["safe", "caution", "risky"]);
export const performanceAssessmentStatusSchema = z.enum(["safe", "watch", "risky"]);
export const performanceMetricIdSchema = z.enum([
  "geometry",
  "texture-memory",
  "materials",
  "animation",
  "scene-density",
  "visibility"
]);
export const performanceMetricUnitSchema = z.enum(["score", "gb"]);

export const performanceProfileSchema = z.object({
  profileId: performanceProfileIdSchema,
  name: z.string(),
  intent: z.string(),
  targetMachineClass: z.string(),
  tradeoffSummary: z.string(),
  geometryBudget: z.number().positive(),
  materialBudget: z.number().positive(),
  textureBudget: z.number().positive(),
  animationBudget: z.number().positive(),
  sceneDensityBudget: z.number().positive(),
  visibilityBudget: z.number().positive(),
  notes: z.array(z.string())
});

export const coursePerformanceSnapshotSchema = z.object({
  geometryEstimate: z.number().positive(),
  textureMemoryEstimateGb: z.number().positive(),
  materialComplexity: z.number().min(0).max(100),
  animationComplexity: z.number().min(0).max(100),
  sceneDensity: z.number().min(0).max(100),
  visibilityComplexity: z.number().min(0).max(100)
});

export const performanceMetricSchema = z.object({
  metricId: performanceMetricIdSchema,
  label: z.string(),
  actualValue: z.number().min(0),
  budgetValue: z.number().min(0),
  unit: performanceMetricUnitSchema,
  utilizationPercent: z.number().min(0),
  delta: z.number(),
  riskGrade: performanceRiskGradeSchema,
  summary: z.string()
});

export const performanceProfileAssessmentSchema = z.object({
  profile: performanceProfileSchema,
  riskGrade: performanceRiskGradeSchema,
  status: performanceAssessmentStatusSchema,
  overages: z.number().min(0),
  cautionCount: z.number().min(0),
  safeCount: z.number().min(0),
  metrics: z.array(performanceMetricSchema),
  summary: z.string(),
  tradeoffs: z.array(z.string())
});

export const performanceComparisonSchema = z.object({
  snapshot: coursePerformanceSnapshotSchema,
  assessments: z.array(performanceProfileAssessmentSchema),
  bestFitProfileId: performanceProfileIdSchema
});

export type PerformanceProfileId = z.infer<typeof performanceProfileIdSchema>;
export type PerformanceRiskGrade = z.infer<typeof performanceRiskGradeSchema>;
export type PerformanceAssessmentStatus = z.infer<typeof performanceAssessmentStatusSchema>;
export type PerformanceMetricId = z.infer<typeof performanceMetricIdSchema>;
export type PerformanceMetricUnit = z.infer<typeof performanceMetricUnitSchema>;
export type PerformanceProfile = z.infer<typeof performanceProfileSchema>;
export type CoursePerformanceSnapshot = z.infer<typeof coursePerformanceSnapshotSchema>;
export type PerformanceMetric = z.infer<typeof performanceMetricSchema>;
export type PerformanceMetrics = PerformanceMetric[];
export type PerformanceProfileAssessment = z.infer<typeof performanceProfileAssessmentSchema>;
export type PerformanceComparison = z.infer<typeof performanceComparisonSchema>;
