import type { EventSequence, EventType, TriggerMode } from "./models";

export function createEventSequenceDraft({
  eventId,
  name,
  eventType = "scheduled",
  triggerMode,
  districtRef = null,
  linkedHoleRefs = []
}: {
  eventId: string;
  name: string;
  eventType?: EventType;
  triggerMode?: TriggerMode;
  districtRef?: string | null;
  linkedHoleRefs?: string[];
}): EventSequence {
  const resolvedTriggerMode =
    triggerMode ??
    (eventType === "ambient-loop"
      ? "ambient-loop"
      : eventType === "hole-trigger"
        ? "hole-complete"
        : "clocked-sequence");

  return {
    eventId,
    name,
    eventType,
    triggerMode: resolvedTriggerMode,
    districtRef,
    linkedHoleRefs,
    state: "draft",
    intensity: "medium",
    note: "Describe the intended spectacle, timing, and fallback state.",
    previewNote: "",
    safetyNote: ""
  };
}
