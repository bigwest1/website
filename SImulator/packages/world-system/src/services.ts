import type { District, EnvironmentZone, Landmark, SupportSpace } from "./models";

export type WorldSystemState = {
  districts: District[];
  landmarks: Landmark[];
  supportSpaces: SupportSpace[];
  environmentZones: EnvironmentZone[];
};

export type DistrictWorldProfile = {
  district: District;
  landmarks: Landmark[];
  supportSpaces: SupportSpace[];
  environmentZones: EnvironmentZone[];
  linkedHoleRefs: string[];
  readinessScore: number;
};

export function getDistrictWorldProfile(
  districtId: string,
  state: WorldSystemState,
): DistrictWorldProfile | null {
  const district = state.districts.find((entry) => entry.districtId === districtId);

  if (!district) {
    return null;
  }

  const landmarks = state.landmarks.filter((entry) => entry.districtRef === districtId);
  const supportSpaces = state.supportSpaces.filter((entry) => entry.districtRef === districtId);
  const environmentZones = state.environmentZones.filter((entry) => entry.districtRef === districtId);
  const linkedHoleRefs = [
    ...new Set(
      [...landmarks, ...supportSpaces, ...environmentZones].flatMap((entry) => entry.linkedHoleRefs),
    )
  ];
  const readinessScore = Math.round(
    (((landmarks.length > 0 ? 1 : 0.25) +
      (supportSpaces.length > 0 ? 1 : 0.25) +
      (environmentZones.length > 0 ? 1 : 0.25) +
      (district.supportRealismNotes.length > 0 ? 1 : 0.4)) /
      4) *
      100,
  );

  return {
    district,
    landmarks,
    supportSpaces,
    environmentZones,
    linkedHoleRefs,
    readinessScore
  };
}
