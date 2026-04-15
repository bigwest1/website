import { describe, expect, it } from "vitest";

import { createEventSequenceDraft } from "./create";
import { findEventsForHole, sortEventsByRisk, summarizeEventRegistry } from "./summary";

describe("event-system", () => {
  it("creates a draft event sequence with type-aware defaults", () => {
    const event = createEventSequenceDraft({
      eventId: "event-finale",
      name: "Finale Burst",
      eventType: "hole-trigger",
      linkedHoleRefs: ["hole-18"]
    });

    expect(event.state).toBe("draft");
    expect(event.triggerMode).toBe("hole-complete");
    expect(event.intensity).toBe("medium");
  });

  it("summarizes registry posture and risks", () => {
    const summary = summarizeEventRegistry([
      {
        eventId: "event-a",
        name: "Skyloop Pulse",
        eventType: "scheduled",
        triggerMode: "clocked-sequence",
        districtRef: "district-kinetics",
        linkedHoleRefs: ["hole-8"],
        state: "ready",
        intensity: "high",
        note: "",
        previewNote: "",
        safetyNote: ""
      },
      {
        eventId: "event-b",
        name: "Bay Light Rise",
        eventType: "hole-trigger",
        triggerMode: "hole-complete",
        districtRef: "district-nightfall",
        linkedHoleRefs: ["hole-17"],
        state: "conflict",
        intensity: "high",
        note: "",
        previewNote: "",
        safetyNote: ""
      }
    ]);

    expect(summary.totalEvents).toBe(2);
    expect(summary.conflictEvents).toBe(1);
    expect(summary.districtCoverageCount).toBe(2);
    expect(summary.nextRisk).toContain("Resolve event conflicts");
  });

  it("finds and sorts the most risky hole-linked events first", () => {
    const events = sortEventsByRisk([
      {
        eventId: "event-ready",
        name: "Ready Event",
        eventType: "scheduled",
        triggerMode: "clocked-sequence",
        districtRef: null,
        linkedHoleRefs: ["hole-5"],
        state: "ready",
        intensity: "medium",
        note: "",
        previewNote: "",
        safetyNote: ""
      },
      {
        eventId: "event-conflict",
        name: "Conflict Event",
        eventType: "hole-trigger",
        triggerMode: "hole-complete",
        districtRef: null,
        linkedHoleRefs: ["hole-5"],
        state: "conflict",
        intensity: "high",
        note: "",
        previewNote: "",
        safetyNote: ""
      }
    ]);

    expect(events[0]?.eventId).toBe("event-conflict");
    expect(findEventsForHole(events, "hole-5")).toHaveLength(2);
  });
});
