import { z } from "zod";

export const eventTypes = [
  "ambient-loop",
  "hole-trigger",
  "scheduled",
  "payoff"
 ] as const;
export const triggerModes = [
  "ambient-loop",
  "clocked-sequence",
  "hole-start",
  "hole-complete",
  "district-arrival",
  "manual-preview"
] as const;
export const eventStates = ["draft", "ready", "conflict"] as const;
export const eventIntensities = ["low", "medium", "high"] as const;

export const eventTypeSchema = z.enum(eventTypes);

export const triggerModeSchema = z.enum(triggerModes);

export const eventStateSchema = z.enum(eventStates);
export const eventIntensitySchema = z.enum(eventIntensities);

export const eventSequenceSchema = z.object({
  eventId: z.string(),
  name: z.string(),
  eventType: eventTypeSchema,
  triggerMode: triggerModeSchema.catch("manual-preview"),
  districtRef: z.string().nullable().default(null),
  linkedHoleRefs: z.array(z.string()).default([]),
  state: eventStateSchema,
  intensity: eventIntensitySchema.default("medium"),
  note: z.string(),
  previewNote: z.string().default(""),
  safetyNote: z.string().default("")
});

export type EventType = z.infer<typeof eventTypeSchema>;
export type TriggerMode = z.infer<typeof triggerModeSchema>;
export type EventState = z.infer<typeof eventStateSchema>;
export type EventIntensity = z.infer<typeof eventIntensitySchema>;
export type EventSequence = z.infer<typeof eventSequenceSchema>;
