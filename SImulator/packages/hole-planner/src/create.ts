import { holeSchema, type ChallengeRating, type Hole } from "./hole";

type CreateHoleDraftInput = {
  number: number;
  teeSetRefs: string[];
  pinSetRefs: string[];
  par?: 3 | 4 | 5 | 6;
  targetYardage?: number;
  challengeRating?: ChallengeRating;
};

export function createHoleDraft({
  number,
  teeSetRefs,
  pinSetRefs,
  par = number % 5 === 0 ? 5 : number % 4 === 0 ? 3 : 4,
  targetYardage = 320 + number * 8,
  challengeRating = (number % 5 === 0 ? 4 : 3) as ChallengeRating
}: CreateHoleDraftInput): Hole {
  return holeSchema.parse({
    holeId: `hole-${number}`,
    number,
    par,
    targetYardage,
    teeSetRefs,
    pinSetRefs,
    emotionalRole:
      number === 1
        ? "Introduce the course clearly and confidently."
        : "Build the course rhythm with readable escalation.",
    readabilityTarget: number <= 3 ? "Immediate read" : "Guided read",
    challengeRating,
    metadata: {
      holeRole: number === 18 ? "closing hole" : number % 3 === 0 ? "pivot hole" : "rhythm setter",
      routeNotes: "Routing notes to be defined during planning.",
      hazardNotes: "Hazard posture and recovery paths still need planning.",
      eventPayoffNotes: "Capture the event trigger or completion payoff for this hole.",
      flyoverNotes: "Add preview path guidance during preview planning.",
      fairwayIntent: "Define the preferred and safe line.",
      greenIntent: "Keep approach readability high in the initial pass."
    },
    hazardRefs: [],
    landmarkRefs: [],
    eventRefs: [],
    previewRefs: [],
    playabilityStatus: "needs-review"
  });
}
