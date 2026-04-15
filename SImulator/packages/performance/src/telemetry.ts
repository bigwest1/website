import type { SceneAuthoringState } from "@course-creator-os/scene-authoring";
import {
  createSpatialAnalysisReport,
  createSpatialTrustReport,
  summarizeSceneAuthoringState
} from "@course-creator-os/scene-authoring";

import { coursePerformanceSnapshotSchema, type CoursePerformanceSnapshot } from "./models";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export type SpatialTelemetrySummary = {
  confidence: "high" | "medium" | "low";
  trustHealth: "healthy" | "attention" | "critical";
  objectCount: number;
  terrainCount: number;
  routingCount: number;
  simulatorZoneCount: number;
  issuePressure: number;
  summary: string;
};

export function createSpatialTelemetrySummary(
  sceneAuthoring: SceneAuthoringState,
): SpatialTelemetrySummary {
  const summary = summarizeSceneAuthoringState(sceneAuthoring);
  const analysis = createSpatialAnalysisReport(sceneAuthoring);
  const trust = createSpatialTrustReport(sceneAuthoring);
  const issuePressure =
    analysis.blockedLineOfPlayIssues.length * 5 +
    analysis.collisionConflicts.length * 3 +
    analysis.occlusionRisks.length * 2 +
    analysis.simulatorAnchorConflicts.length * 4 +
    analysis.previewFramingWeaknesses.length * 2 +
    trust.criticalCount * 6 +
    trust.warningCount * 2;

  return {
    confidence: trust.analysisConfidence,
    trustHealth: trust.health,
    objectCount: summary.objectCount,
    terrainCount: summary.terrainRegionCount + summary.terrainModifierCount,
    routingCount: summary.routingNodeCount + summary.routingPathCount,
    simulatorZoneCount: summary.simulatorZoneCount,
    issuePressure,
    summary:
      trust.health === "critical"
        ? "Spatial trust is degraded, so performance estimates should be treated as conservative until drift is repaired."
        : trust.analysisConfidence === "low"
          ? "Telemetry is available but analysis confidence is still thin."
          : "Telemetry is derived from current scene authority and is stable enough for profile comparisons."
  };
}

export function createPerformanceSnapshotFromSpatialState(
  sceneAuthoring: SceneAuthoringState,
): CoursePerformanceSnapshot {
  const summary = summarizeSceneAuthoringState(sceneAuthoring);
  const analysis = createSpatialAnalysisReport(sceneAuthoring);
  const telemetry = createSpatialTelemetrySummary(sceneAuthoring);
  const trustPressure =
    telemetry.trustHealth === "critical"
      ? 1.18
      : telemetry.confidence === "low"
        ? 1.1
        : telemetry.confidence === "medium"
          ? 1.04
          : 1;

  const geometryEstimate =
    (summary.objectCount * 1.35 +
      summary.terrainRegionCount * 4.5 +
      summary.terrainModifierCount * 2.2 +
      summary.routingNodeCount * 1.1 +
      summary.simulatorZoneCount * 2.4 +
      analysis.collisionConflicts.length * 2.6 +
      analysis.occlusionRisks.length * 1.8 +
      analysis.invalidOverlapConditions.length * 2.4 +
      telemetry.issuePressure * 0.12) *
    trustPressure;

  const textureMemoryEstimateGb = Number(
    (
      1.2 +
      summary.visibleObjectCount * 0.028 +
      summary.terrainRegionCount * 0.11 +
      summary.gameplayRelevantCount * 0.04 +
      summary.hiddenObjectCount * 0.012 +
      telemetry.issuePressure * 0.004
    ).toFixed(1),
  );

  const materialComplexity = clampScore(
    summary.terrainSurfaceCount * 8 +
      summary.terrainModifierCount * 5 +
      summary.categoryCounts["animated-set-piece"] * 3 +
      summary.categoryCounts.landmark * 2 +
      summary.categoryCounts.structure * 1.5 +
      telemetry.issuePressure * 0.4,
  );

  const animationComplexity = clampScore(
    summary.categoryCounts["animated-set-piece"] * 16 +
      summary.categoryCounts.landmark * 5 +
      analysis.previewFramingWeaknesses.length * 3 +
      (telemetry.confidence === "low" ? 6 : telemetry.confidence === "medium" ? 3 : 0),
  );

  const sceneDensity = clampScore(
    summary.objectCount * 1.15 +
      summary.groupCount * 2 +
      summary.terrainRegionCount * 3 +
      summary.simulatorZoneCount * 2 +
      analysis.collisionConflicts.length * 6 +
      analysis.occlusionRisks.length * 4 +
      telemetry.issuePressure * 0.35,
  );

  const visibilityComplexity = clampScore(
    summary.routingPathCount * 7 +
      analysis.sightlineQualityIssues.length * 14 +
      analysis.occlusionRisks.length * 10 +
      analysis.blockedLineOfPlayIssues.length * 16 +
      analysis.landingZoneObstructionRisks.length * 8 +
      telemetry.issuePressure * 0.5,
  );

  return coursePerformanceSnapshotSchema.parse({
    geometryEstimate: Number(geometryEstimate.toFixed(1)),
    textureMemoryEstimateGb,
    materialComplexity,
    animationComplexity,
    sceneDensity,
    visibilityComplexity
  });
}
