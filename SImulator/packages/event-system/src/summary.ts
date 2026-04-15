import type { EventSequence, EventState } from "./models";

export type EventRegistrySummary = {
  totalEvents: number;
  readyEvents: number;
  draftEvents: number;
  conflictEvents: number;
  holeLinkedEvents: number;
  districtCoverageCount: number;
  nextRisk: string | null;
};

function countByState(events: EventSequence[], state: EventState) {
  return events.filter((event) => event.state === state).length;
}

export function summarizeEventRegistry(events: EventSequence[]): EventRegistrySummary {
  const conflictEvents = countByState(events, "conflict");
  const draftEvents = countByState(events, "draft");
  const readyEvents = countByState(events, "ready");
  const holeLinkedEvents = events.filter((event) => event.linkedHoleRefs.length > 0).length;
  const districtCoverageCount = new Set(
    events.map((event) => event.districtRef).filter((districtRef): districtRef is string => Boolean(districtRef)),
  ).size;

  const nextRisk =
    conflictEvents > 0
      ? "Resolve event conflicts before treating spectacle timing as stable."
      : draftEvents > 0
        ? "Draft events still need preview and safety review."
        : null;

  return {
    totalEvents: events.length,
    readyEvents,
    draftEvents,
    conflictEvents,
    holeLinkedEvents,
    districtCoverageCount,
    nextRisk
  };
}

export function findEventsForHole(events: EventSequence[], holeId: string) {
  return events.filter((event) => event.linkedHoleRefs.includes(holeId));
}

export function sortEventsByRisk(events: EventSequence[]) {
  const rank = (event: EventSequence) =>
    event.state === "conflict" ? 3 : event.state === "draft" ? 2 : 1;

  return [...events].sort((left, right) => rank(right) - rank(left) || left.name.localeCompare(right.name));
}
