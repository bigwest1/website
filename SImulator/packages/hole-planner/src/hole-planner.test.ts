import { describe, expect, it } from "vitest";

import { createHoleDraft } from "./create";
import { compareHolePlans, moveHoleToNumber, reorderHoles } from "./services";

describe("hole-planner services", () => {
  it("renumbers holes when they are reordered", () => {
    const holes = [
      createHoleDraft({ number: 1, teeSetRefs: ["tee-member"], pinSetRefs: ["pins-daily"] }),
      createHoleDraft({ number: 2, teeSetRefs: ["tee-member"], pinSetRefs: ["pins-daily"] }),
      createHoleDraft({ number: 3, teeSetRefs: ["tee-member"], pinSetRefs: ["pins-daily"] })
    ];

    const reordered = reorderHoles(holes, "hole-2", "up");

    expect(reordered.map((hole) => hole.holeId)).toEqual(["hole-2", "hole-1", "hole-3"]);
    expect(reordered.map((hole) => hole.number)).toEqual([1, 2, 3]);
  });

  it("compares two holes across the planning metrics", () => {
    const first = {
      ...createHoleDraft({ number: 1, teeSetRefs: ["tee-member"], pinSetRefs: ["pins-daily"] }),
      hazardRefs: ["hazard-water-1"],
      landmarkRefs: ["landmark-arrival"]
    };
    const second = {
      ...createHoleDraft({ number: 2, teeSetRefs: ["tee-member"], pinSetRefs: ["pins-daily"] }),
      targetYardage: 412,
      hazardRefs: ["hazard-water-1", "hazard-bunker-2"],
      landmarkRefs: ["landmark-arrival", "landmark-garden"]
    };

    const comparison = compareHolePlans(first, second);

    expect(comparison.yardageDelta).toBe(first.targetYardage - second.targetYardage);
    expect(comparison.sharedHazards).toEqual(["hazard-water-1"]);
    expect(comparison.sharedLandmarks).toEqual(["landmark-arrival"]);
  });

  it("moves a hole to an explicit hole number", () => {
    const holes = [
      createHoleDraft({ number: 1, teeSetRefs: ["tee-member"], pinSetRefs: ["pins-daily"] }),
      createHoleDraft({ number: 2, teeSetRefs: ["tee-member"], pinSetRefs: ["pins-daily"] }),
      createHoleDraft({ number: 3, teeSetRefs: ["tee-member"], pinSetRefs: ["pins-daily"] })
    ];

    const reordered = moveHoleToNumber(holes, "hole-3", 1);

    expect(reordered.map((hole) => hole.holeId)).toEqual(["hole-3", "hole-1", "hole-2"]);
    expect(reordered.map((hole) => hole.number)).toEqual([1, 2, 3]);
  });
});
