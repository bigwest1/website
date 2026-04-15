import { z } from "zod";

import { playabilityStatusSchema } from "@course-creator-os/core-types";

export const challengeRatingSchema = z.number().int().min(1).max(5);

export const holePlanningNotesSchema = z.object({
  holeRole: z.string().trim().min(1),
  routeNotes: z.string().trim().min(1),
  hazardNotes: z.string().trim().min(1),
  eventPayoffNotes: z.string().trim().min(1),
  flyoverNotes: z.string().trim().min(1),
  fairwayIntent: z.string().trim().min(1),
  greenIntent: z.string().trim().min(1)
});

export const holeSchema = z.object({
  holeId: z.string(),
  number: z.number().int().min(1).max(18),
  par: z.number().int().min(3).max(6),
  targetYardage: z.number().int().positive(),
  teeSetRefs: z.array(z.string()).min(1),
  pinSetRefs: z.array(z.string()).min(1),
  emotionalRole: z.string().trim().min(1),
  readabilityTarget: z.string().trim().min(1),
  challengeRating: challengeRatingSchema,
  metadata: holePlanningNotesSchema,
  hazardRefs: z.array(z.string()),
  landmarkRefs: z.array(z.string()),
  eventRefs: z.array(z.string()),
  previewRefs: z.array(z.string()),
  playabilityStatus: playabilityStatusSchema
});

export type ChallengeRating = z.infer<typeof challengeRatingSchema>;
export type HolePlanningNotes = z.infer<typeof holePlanningNotesSchema>;
export type Hole = z.infer<typeof holeSchema>;
