import { describe, expect, it } from "vitest";

import {
  createDistrictRecord,
  createEnvironmentZoneRecord,
  createLandmarkRecord,
  createSupportSpaceRecord
} from "./create";
import { getDistrictWorldProfile } from "./services";
import { summarizeWorldSystem } from "./summary";

describe("world-system", () => {
  it("creates typed district, landmark, support-space, and zone records", () => {
    const district = createDistrictRecord({ name: "Harbor", districtType: "arrival" });
    const landmark = createLandmarkRecord({ name: "Marina Crown", districtRef: district.districtId });
    const supportSpace = createSupportSpaceRecord({ name: "Guest Arrival Spine", districtRef: district.districtId });
    const zone = createEnvironmentZoneRecord({ name: "Harbor Night Lighting", districtRef: district.districtId });

    expect(district.districtId).toBe("district-harbor");
    expect(landmark.landmarkType).toBe("orientation-anchor");
    expect(supportSpace.spaceType).toBe("operations");
    expect(zone.zoneType).toBe("vegetation");
  });

  it("builds a district profile from linked world entities", () => {
    const district = createDistrictRecord({
      districtId: "district-harbor",
      name: "Harbor",
      supportRealismNotes: ["Backstage logistics stay believable."]
    });

    const profile = getDistrictWorldProfile("district-harbor", {
      districts: [district],
      landmarks: [
        createLandmarkRecord({
          landmarkId: "landmark-harbor",
          name: "Marina Crown",
          districtRef: "district-harbor",
          linkedHoleRefs: ["hole-1"]
        })
      ],
      supportSpaces: [
        createSupportSpaceRecord({
          supportSpaceId: "support-space-harbor",
          districtRef: "district-harbor",
          name: "Arrival Services",
          linkedHoleRefs: ["hole-1", "hole-2"]
        })
      ],
      environmentZones: [
        createEnvironmentZoneRecord({
          environmentZoneId: "environment-zone-harbor",
          districtRef: "district-harbor",
          name: "Harbor Planting",
          linkedHoleRefs: ["hole-2"]
        })
      ]
    });

    expect(profile?.landmarks).toHaveLength(1);
    expect(profile?.supportSpaces).toHaveLength(1);
    expect(profile?.environmentZones).toHaveLength(1);
    expect(profile?.linkedHoleRefs).toEqual(["hole-1", "hole-2"]);
    expect(profile?.readinessScore).toBeGreaterThan(70);
  });

  it("summarizes world-system coverage", () => {
    const districts = [createDistrictRecord({ name: "Harbor" }), createDistrictRecord({ name: "Garden" })];
    const summary = summarizeWorldSystem(
      districts,
      [createLandmarkRecord({ name: "Harbor Marker", districtRef: districts[0]!.districtId })],
      [createSupportSpaceRecord({ name: "Harbor Ops", districtRef: districts[0]!.districtId })],
      [createEnvironmentZoneRecord({ name: "Garden Lighting", districtRef: districts[1]!.districtId })],
    );

    expect(summary.districtCount).toBe(2);
    expect(summary.districtsWithLandmarks).toBe(1);
    expect(summary.districtsWithEnvironmentZones).toBe(1);
  });
});
