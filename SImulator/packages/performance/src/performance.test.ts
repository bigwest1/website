import { describe, expect, it } from "vitest";

import { createSeedProject } from "@course-creator-os/project-model";
import { createSceneObject } from "@course-creator-os/scene-authoring";

import {
  assessPerformanceRisk,
  comparePerformanceProfiles,
  createPerformanceMetrics
} from "./analysis";
import { createPerformanceSnapshotFromSpatialState, createSpatialTelemetrySummary } from "./telemetry";
import { getPerformanceProfile } from "./profiles";

describe("performance analysis", () => {
  it("creates a metric record for each tracked performance dimension", () => {
    const metrics = createPerformanceMetrics(
      {
        geometryEstimate: 78,
        textureMemoryEstimateGb: 4.6,
        materialComplexity: 74,
        animationComplexity: 66,
        sceneDensity: 81,
        visibilityComplexity: 76
      },
      getPerformanceProfile("community-safe"),
    );

    expect(metrics).toHaveLength(6);
    expect(metrics.map((metric) => metric.metricId)).toEqual([
      "geometry",
      "texture-memory",
      "materials",
      "animation",
      "scene-density",
      "visibility"
    ]);
  });

  it("grades Community Safe more strictly than Brother Mode for the same snapshot", () => {
    const snapshot = {
      geometryEstimate: 78,
      textureMemoryEstimateGb: 4.6,
      materialComplexity: 74,
      animationComplexity: 66,
      sceneDensity: 81,
      visibilityComplexity: 76
    };

    const communityAssessment = assessPerformanceRisk(snapshot, "community-safe");
    const brotherAssessment = assessPerformanceRisk(snapshot, "brother-mode");

    expect(communityAssessment.riskGrade).toBe("risky");
    expect(brotherAssessment.riskGrade).toBe("caution");
  });

  it("compares all three profiles and surfaces a best-fit recommendation", () => {
    const comparison = comparePerformanceProfiles({
      geometryEstimate: 54,
      textureMemoryEstimateGb: 3.2,
      materialComplexity: 46,
      animationComplexity: 28,
      sceneDensity: 44,
      visibilityComplexity: 48
    });

    expect(comparison.assessments).toHaveLength(3);
    expect(comparison.bestFitProfileId).toBe("community-safe");
  });

  it("derives a real performance snapshot from scene-authoring telemetry", () => {
    const project = createSeedProject();
    const snapshot = createPerformanceSnapshotFromSpatialState(project.sceneAuthoring);

    expect(snapshot.geometryEstimate).toBeGreaterThan(0);
    expect(snapshot.sceneDensity).toBeGreaterThan(0);
    expect(snapshot.visibilityComplexity).toBeGreaterThan(0);
  });

  it("raises visibility and density pressure when occluding scene geometry grows", () => {
    const project = createSeedProject();
    const baseline = createPerformanceSnapshotFromSpatialState(project.sceneAuthoring);

    project.sceneAuthoring.sceneObjects.push(
      createSceneObject({
        sceneObjectId: "scene-occlusion-wall",
        collectionId: project.sceneAuthoring.activeCollectionId ?? "scene-collection-main",
        name: "Occlusion Wall",
        category: "structure",
        objectType: "show-building",
        placementLayerId: project.sceneAuthoring.placementLayers[0]!.layerId,
        transform: {
          position: { x: 84, y: 0, z: 2 },
          scale: { x: 8, y: 8, z: 8 }
        }
      }),
    );

    const nextSnapshot = createPerformanceSnapshotFromSpatialState(project.sceneAuthoring);

    expect(nextSnapshot.sceneDensity).toBeGreaterThanOrEqual(baseline.sceneDensity);
    expect(nextSnapshot.visibilityComplexity).toBeGreaterThanOrEqual(baseline.visibilityComplexity);
  });

  it("produces trust-aware telemetry summaries for larger spatial scenes", () => {
    const project = createSeedProject();
    const telemetry = createSpatialTelemetrySummary(project.sceneAuthoring);

    expect(telemetry.objectCount).toBeGreaterThan(0);
    expect(["high", "medium", "low"]).toContain(telemetry.confidence);
    expect(telemetry.summary.length).toBeGreaterThan(0);
  });
});
