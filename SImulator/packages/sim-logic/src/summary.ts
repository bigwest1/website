import type { SimulatorLogicConfig } from "./models";

export type LogicCompletenessSegment = {
  segmentId: string;
  label: string;
  score: number;
  status: "safe" | "watch" | "risky";
  detail: string;
};

export type SimulatorLogicSummary = {
  teeSetCount: number;
  pinSetCount: number;
  hazardCount: number;
  dropZoneCount: number;
  holePlayProfileCount: number;
  holesCoveredByPins: number;
  minimapCoveragePercent: number;
  flyoverCoveragePercent: number;
  teeSpatialCoveragePercent: number;
  pinSpatialCoveragePercent: number;
  hazardSpatialCoveragePercent: number;
  previewAnchorCoveragePercent: number;
  routingCoveragePercent: number;
  completenessScore: number;
  blockedHoleCount: number;
  exportReadyHoleCount: number;
  segments: LogicCompletenessSegment[];
};

function segmentStatus(score: number): LogicCompletenessSegment["status"] {
  if (score >= 0.85) {
    return "safe";
  }

  if (score >= 0.6) {
    return "watch";
  }

  return "risky";
}

function percent(ready: number, total: number) {
  return total === 0 ? 0 : Math.round((ready / total) * 100);
}

export function summarizeSimulatorLogic(config: SimulatorLogicConfig): SimulatorLogicSummary {
  const holesCoveredByPins = new Set(config.pinSets.flatMap((pinSet) => pinSet.enabledHoleIds)).size;
  const blockedHoleCount = config.holePlayProfiles.filter(
    (profile) => profile.exportReadiness === "blocked",
  ).length;
  const exportReadyHoleCount = config.holePlayProfiles.filter(
    (profile) => profile.exportReadiness === "ready",
  ).length;
  const defaultTeeCount = config.teeSets.filter((teeSet) => teeSet.defaultTee).length;
  const readyTeeBindings = config.teeSpatialBindings.filter((binding) => binding.readinessState === "ready").length;
  const readyPinBindings = config.pinSpatialBindings.filter((binding) => binding.readinessState === "ready").length;
  const readyHazardBindings = config.hazardSpatialBindings.filter(
    (binding) => binding.readinessState === "ready",
  ).length;
  const readyPreviewAnchors = config.previewAnchorBindings.filter(
    (binding) => binding.readinessState === "ready",
  ).length;
  const routingReadyCount = config.holePlayProfiles.filter(
    (profile) => profile.playRouteEnvelopeRef && profile.fairwayCorridorRef && profile.greenZoneRef,
  ).length;

  const segments: LogicCompletenessSegment[] = [
    {
      segmentId: "hole-logic",
      label: "Hole Logic",
      score:
        config.holePlayProfiles.length === 0
          ? 0
          : config.holePlayProfiles.filter((profile) => profile.exportReadiness !== "blocked").length /
            config.holePlayProfiles.length,
      status: "watch",
      detail: "Per-hole metadata, hole order, and export readiness."
    },
    {
      segmentId: "tee-pin",
      label: "Tee and Pin Coverage",
      score:
        ((config.teeSets.length >= 2 ? 1 : 0.55) +
          (config.pinSets.length >= 2 ? 1 : 0.7) +
          (defaultTeeCount === 1 ? 1 : 0.4)) /
        3,
      status: "watch",
      detail: "Default tee posture and playable access coverage."
    },
    {
      segmentId: "hazards",
      label: "Hazards and Recovery",
      score:
        config.hazardProfiles.length === 0
          ? 0.4
          : config.hazardProfiles.filter((hazard) => !hazard.dropZoneRequired).length /
            config.hazardProfiles.length +
            (config.dropZones.length / Math.max(config.hazardProfiles.length, 1)) * 0.35,
      status: "watch",
      detail: "OB configuration, hazard logic, and recovery paths."
    },
    {
      segmentId: "spatial-bindings",
      label: "Spatial Simulator Bindings",
      score:
        ((readyTeeBindings / Math.max(config.teeSpatialBindings.length, 1)) +
          (readyPinBindings / Math.max(config.pinSpatialBindings.length, 1)) +
          (readyHazardBindings / Math.max(config.hazardSpatialBindings.length, 1)) +
          (routingReadyCount / Math.max(config.holePlayProfiles.length, 1))) /
        4,
      status: "watch",
      detail: "Spatial anchors, route envelopes, and simulator-critical geometry bindings."
    },
    {
      segmentId: "preview-inputs",
      label: "Flyover and Minimap Inputs",
      score:
        ((config.minimapCoverage + config.flyoverCoverage) / 2 +
          readyPreviewAnchors / Math.max(config.previewAnchorBindings.length, 1)) /
        2,
      status: "watch",
      detail: "Preview metadata completeness for simulator-facing presentation."
    }
  ].map((segment) => ({
    ...segment,
    score: Math.max(0, Math.min(1, Number(segment.score.toFixed(2)))),
    status: segmentStatus(Math.max(0, Math.min(1, Number(segment.score.toFixed(2)))))
  }));

  const completenessScore = Math.round(
    (segments.reduce((total, segment) => total + segment.score, 0) / segments.length) * 100,
  );

  return {
    teeSetCount: config.teeSets.length,
    pinSetCount: config.pinSets.length,
    hazardCount: config.hazardProfiles.length,
    dropZoneCount: config.dropZones.length,
    holePlayProfileCount: config.holePlayProfiles.length,
    holesCoveredByPins,
    minimapCoveragePercent: Math.round(config.minimapCoverage * 100),
    flyoverCoveragePercent: Math.round(config.flyoverCoverage * 100),
    teeSpatialCoveragePercent: percent(readyTeeBindings, config.teeSpatialBindings.length),
    pinSpatialCoveragePercent: percent(readyPinBindings, config.pinSpatialBindings.length),
    hazardSpatialCoveragePercent: percent(readyHazardBindings, config.hazardSpatialBindings.length),
    previewAnchorCoveragePercent: percent(readyPreviewAnchors, config.previewAnchorBindings.length),
    routingCoveragePercent: percent(routingReadyCount, config.holePlayProfiles.length),
    completenessScore,
    blockedHoleCount,
    exportReadyHoleCount,
    segments
  };
}
