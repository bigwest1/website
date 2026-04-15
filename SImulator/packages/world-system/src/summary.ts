import type { District, EnvironmentZone, Landmark, SupportSpace } from "./models";

export type WorldSystemSummary = {
  districtCount: number;
  landmarkCount: number;
  supportSpaceCount: number;
  environmentZoneCount: number;
  districtsWithLandmarks: number;
  districtsWithSupportSpaces: number;
  districtsWithEnvironmentZones: number;
  playerFacingSupportSpaces: number;
  linkedHoleCoveragePercent: number;
};

export function summarizeWorldSystem(
  districts: District[],
  landmarks: Landmark[],
  supportSpaces: SupportSpace[],
  environmentZones: EnvironmentZone[],
) : WorldSystemSummary {
  const districtIds = new Set(districts.map((district) => district.districtId));
  const districtsWithLandmarks = new Set(
    landmarks.filter((landmark) => districtIds.has(landmark.districtRef)).map((landmark) => landmark.districtRef),
  );
  const districtsWithSupportSpaces = new Set(
    supportSpaces
      .filter((supportSpace) => districtIds.has(supportSpace.districtRef))
      .map((supportSpace) => supportSpace.districtRef),
  );
  const districtsWithEnvironmentZones = new Set(
    environmentZones
      .filter((zone) => districtIds.has(zone.districtRef))
      .map((zone) => zone.districtRef),
  );
  const linkedHoleRefs = new Set(
    [...landmarks, ...supportSpaces, ...environmentZones].flatMap((entry) => entry.linkedHoleRefs),
  );
  const coverageDenominator = Math.max(districts.length * 2, 1);

  return {
    districtCount: districts.length,
    landmarkCount: landmarks.length,
    supportSpaceCount: supportSpaces.length,
    environmentZoneCount: environmentZones.length,
    districtsWithLandmarks: districtsWithLandmarks.size,
    districtsWithSupportSpaces: districtsWithSupportSpaces.size,
    districtsWithEnvironmentZones: districtsWithEnvironmentZones.size,
    playerFacingSupportSpaces: supportSpaces.filter((supportSpace) => supportSpace.playerFacing).length,
    linkedHoleCoveragePercent: Math.min(100, Math.round((linkedHoleRefs.size / coverageDenominator) * 100))
  };
}
