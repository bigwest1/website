import { holeSchema, type Hole } from "./hole";

export type ReorderDirection = "up" | "down";

export type HolePlanningComparison = {
  primaryHoleId: string;
  secondaryHoleId: string;
  primaryLabel: string;
  secondaryLabel: string;
  yardageDelta: number;
  parDelta: number;
  challengeDelta: number;
  readabilityMatch: boolean;
  sharedHazards: string[];
  sharedLandmarks: string[];
};

function parseHoleList(holes: Hole[]) {
  return holes.map((hole) => holeSchema.parse(hole));
}

function renumberHoles(holes: Hole[]) {
  return holes.map((hole, index) =>
    holeSchema.parse({
      ...hole,
      number: index + 1
    }),
  );
}

export function updateHolePlan(
  holes: Hole[],
  holeId: string,
  updater: (hole: Hole) => Hole,
) {
  return parseHoleList(holes).map((hole) =>
    hole.holeId === holeId ? holeSchema.parse(updater(hole)) : hole,
  );
}

export function reorderHoles(
  holes: Hole[],
  holeId: string,
  direction: ReorderDirection,
) {
  const next = [...parseHoleList(holes)];
  const currentIndex = next.findIndex((hole) => hole.holeId === holeId);

  if (currentIndex < 0) {
    return next;
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= next.length) {
    return next;
  }

  const [moved] = next.splice(currentIndex, 1);

  if (!moved) {
    return next;
  }

  next.splice(targetIndex, 0, moved);

  return renumberHoles(next);
}

export function moveHoleToNumber(
  holes: Hole[],
  holeId: string,
  nextNumber: number,
) {
  const next = [...parseHoleList(holes)];
  const currentIndex = next.findIndex((hole) => hole.holeId === holeId);

  if (currentIndex < 0) {
    return next;
  }

  const targetIndex = Math.max(0, Math.min(next.length - 1, nextNumber - 1));

  if (targetIndex === currentIndex) {
    return next;
  }

  const [moved] = next.splice(currentIndex, 1);

  if (!moved) {
    return next;
  }

  next.splice(targetIndex, 0, moved);

  return renumberHoles(next);
}

export function compareHolePlans(primaryHole: Hole, secondaryHole: Hole): HolePlanningComparison {
  const primary = holeSchema.parse(primaryHole);
  const secondary = holeSchema.parse(secondaryHole);

  return {
    primaryHoleId: primary.holeId,
    secondaryHoleId: secondary.holeId,
    primaryLabel: `Hole ${primary.number}`,
    secondaryLabel: `Hole ${secondary.number}`,
    yardageDelta: primary.targetYardage - secondary.targetYardage,
    parDelta: primary.par - secondary.par,
    challengeDelta: primary.challengeRating - secondary.challengeRating,
    readabilityMatch: primary.readabilityTarget === secondary.readabilityTarget,
    sharedHazards: primary.hazardRefs.filter((hazardRef) => secondary.hazardRefs.includes(hazardRef)),
    sharedLandmarks: primary.landmarkRefs.filter((landmarkRef) =>
      secondary.landmarkRefs.includes(landmarkRef),
    )
  };
}
