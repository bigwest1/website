import { useEffect, useMemo, useState } from "react";

import {
  createEventSequenceDraft,
  eventIntensities,
  eventStates,
  eventTypes,
  findEventsForHole,
  sortEventsByRisk,
  summarizeEventRegistry,
  triggerModes,
  type EventIntensity,
  type EventSequence,
  type EventState,
  type EventType,
  type TriggerMode
} from "@course-creator-os/event-system";
import {
  Button,
  Inline,
  MetricChip,
  SectionHeader,
  SelectField,
  TextAreaField,
  TextField
} from "@course-creator-os/ui";

import { updateEventSequences, useProjectSession } from "../../app/project-session";
import { StatusPill } from "../../components/StatusPill";
import { ValidationIssueCard } from "../../components/ValidationIssueCard";

const eventTypeOptions = eventTypes.map((value) => ({
  label: humanize(value),
  value
}));

const triggerModeOptions = triggerModes.map((value) => ({
  label: humanize(value),
  value
}));

const eventStateOptions = eventStates.map((value) => ({
  label: humanize(value),
  value
}));

const eventIntensityOptions = eventIntensities.map((value) => ({
  label: humanize(value),
  value
}));

function humanize(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toneForEventState(state: EventState) {
  switch (state) {
    case "ready":
      return "success";
    case "conflict":
      return "danger";
    case "draft":
    default:
      return "warning";
  }
}

function parseList(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildEventId(index: number) {
  return `event-${String(index).padStart(2, "0")}`;
}

export function AnimationEventsWorkspace() {
  const { project, validationReport } = useProjectSession();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    project.eventSequences[0]?.eventId ?? null,
  );

  const summary = summarizeEventRegistry(project.eventSequences);
  const sortedEvents = useMemo(
    () => sortEventsByRisk(project.eventSequences),
    [project.eventSequences],
  );
  const selectedEvent =
    project.eventSequences.find((event) => event.eventId === selectedEventId) ?? null;
  const selectedEventIssues = validationReport.issues.filter(
    (issue) =>
      issue.ownerModule === "animate" &&
      (!selectedEvent || issue.relatedEntityId === null || issue.relatedEntityId === selectedEvent.eventId),
  );
  const relatedHoles = selectedEvent
    ? project.holes.filter((hole) => selectedEvent.linkedHoleRefs.includes(hole.holeId))
    : [];
  const selectedHoleEvents =
    relatedHoles.length > 0
      ? findEventsForHole(project.eventSequences, relatedHoles[0]!.holeId)
      : [];
  const districtOptions = useMemo(
    () => [
      { label: "No district assigned", value: "" },
      ...project.districts.map((district) => ({
        label: district.name,
        value: district.districtId
      }))
    ],
    [project.districts],
  );

  useEffect(() => {
    if (project.eventSequences.length === 0) {
      if (selectedEventId !== null) {
        setSelectedEventId(null);
      }
      return;
    }

    if (!selectedEventId || !project.eventSequences.some((event) => event.eventId === selectedEventId)) {
      setSelectedEventId(project.eventSequences[0]!.eventId);
    }
  }, [project.eventSequences, selectedEventId]);

  function patchEvent(eventId: string, updater: (event: EventSequence) => EventSequence) {
    updateEventSequences((eventSequences) =>
      eventSequences.map((event) => (event.eventId === eventId ? updater(event) : event)),
    );
  }

  function handleCreateEvent() {
    const nextEvent = createEventSequenceDraft({
      eventId: buildEventId(project.eventSequences.length + 1),
      name: `Event ${project.eventSequences.length + 1}`,
      districtRef: project.districts[0]?.districtId ?? null,
      linkedHoleRefs: project.holes[0] ? [project.holes[0].holeId] : []
    });

    updateEventSequences((eventSequences) => [...eventSequences, nextEvent]);
    setSelectedEventId(nextEvent.eventId);
  }

  return (
    <div className="mode-stack">
      <section className="panel">
        <SectionHeader
          eyebrow="Animation & Events"
          title="Living-world event registry"
          description="This is now a real coordination surface for spectacle timing, fallback safety, and district-level pacing instead of a thin placeholder."
          actions={
            <Inline gap={2}>
              <StatusPill label={summary.nextRisk ? "Risk Watch" : "Registry Stable"} tone={summary.nextRisk ? "warning" : "success"} />
              <Button onClick={handleCreateEvent} tone="primary">
                Add Event
              </Button>
            </Inline>
          }
        />
        {summary.nextRisk ? <p className="body-copy muted-copy">{summary.nextRisk}</p> : null}
        <div className="wizard-success-grid">
          <MetricChip
            label="Registered Events"
            value={summary.totalEvents}
            note="Ambient, triggered, and payoff moments"
            tone="accent"
          />
          <MetricChip
            label="Conflict Events"
            value={summary.conflictEvents}
            note="Need timing or safety fixes"
            tone={summary.conflictEvents > 0 ? "warning" : "success"}
          />
          <MetricChip
            label="Hole Coverage"
            value={summary.holeLinkedEvents}
            note="Events attached to playable holes"
            tone="info"
          />
          <MetricChip
            label="District Coverage"
            value={summary.districtCoverageCount}
            note="World zones with active event plans"
            tone="accent"
          />
        </div>
      </section>

      <div className="workspace-columns mode-feature-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Event Queue</p>
              <h3>Registry ordered by risk</h3>
            </div>
            <StatusPill label={`${summary.draftEvents} drafts`} tone={summary.draftEvents > 0 ? "warning" : "success"} />
          </div>
          <div className="wizard-stepper wizard-stepper-rich">
            {sortedEvents.map((event) => (
              <button
                key={event.eventId}
                className={`wizard-step wizard-step-rich ${selectedEventId === event.eventId ? "is-active" : ""}`}
                onClick={() => setSelectedEventId(event.eventId)}
                type="button"
              >
                <div className="wizard-step-copy">
                  <strong>{event.name}</strong>
                  <span>
                    {humanize(event.eventType)} · {humanize(event.triggerMode)} · {event.linkedHoleRefs.length} linked holes
                  </span>
                </div>
                <StatusPill label={event.state} tone={toneForEventState(event.state)} />
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          {selectedEvent ? (
            <>
              <SectionHeader
                eyebrow="Selected Event"
                title={selectedEvent.name}
                description="Author the event like a deliberate world beat, not a loose timing note."
                actions={<StatusPill label={selectedEvent.state} tone={toneForEventState(selectedEvent.state)} />}
              />
              <div className="wizard-form-grid">
                <TextField
                  label="Event Name"
                  value={selectedEvent.name}
                  onChange={(event) =>
                    patchEvent(selectedEvent.eventId, (current) => ({
                      ...current,
                      name: event.target.value
                    }))
                  }
                />
                <SelectField
                  label="Event Type"
                  options={eventTypeOptions}
                  value={selectedEvent.eventType}
                  onChange={(event) =>
                    patchEvent(selectedEvent.eventId, (current) => ({
                      ...current,
                      eventType: event.target.value as EventType
                    }))
                  }
                />
                <SelectField
                  label="Trigger Mode"
                  options={triggerModeOptions}
                  value={selectedEvent.triggerMode}
                  onChange={(event) =>
                    patchEvent(selectedEvent.eventId, (current) => ({
                      ...current,
                      triggerMode: event.target.value as TriggerMode
                    }))
                  }
                />
                <SelectField
                  label="State"
                  options={eventStateOptions}
                  value={selectedEvent.state}
                  onChange={(event) =>
                    patchEvent(selectedEvent.eventId, (current) => ({
                      ...current,
                      state: event.target.value as EventState
                    }))
                  }
                />
                <SelectField
                  label="Intensity"
                  options={eventIntensityOptions}
                  value={selectedEvent.intensity}
                  onChange={(event) =>
                    patchEvent(selectedEvent.eventId, (current) => ({
                      ...current,
                      intensity: event.target.value as EventIntensity
                    }))
                  }
                />
                <SelectField
                  label="District"
                  options={districtOptions}
                  value={selectedEvent.districtRef ?? ""}
                  onChange={(event) =>
                    patchEvent(selectedEvent.eventId, (current) => ({
                      ...current,
                      districtRef: event.target.value || null
                    }))
                  }
                />
                <TextField
                  label="Linked Holes"
                  hint="Comma-separated hole IDs"
                  value={selectedEvent.linkedHoleRefs.join(", ")}
                  onChange={(event) =>
                    patchEvent(selectedEvent.eventId, (current) => ({
                      ...current,
                      linkedHoleRefs: parseList(event.target.value)
                    }))
                  }
                />
              </div>
              <div className="workspace-columns">
                <TextAreaField
                  label="Event Note"
                  hint="Describe the timing, spectacle purpose, and intended feel."
                  rows={5}
                  value={selectedEvent.note}
                  onChange={(event) =>
                    patchEvent(selectedEvent.eventId, (current) => ({
                      ...current,
                      note: event.target.value
                    }))
                  }
                />
                <TextAreaField
                  label="Preview Note"
                  hint="Explain how Preview Studio should capture this moment."
                  rows={5}
                  value={selectedEvent.previewNote}
                  onChange={(event) =>
                    patchEvent(selectedEvent.eventId, (current) => ({
                      ...current,
                      previewNote: event.target.value
                    }))
                  }
                />
              </div>
              <TextAreaField
                label="Safety Note"
                hint="Spell out the gameplay guardrail or fallback state."
                rows={4}
                value={selectedEvent.safetyNote}
                onChange={(event) =>
                  patchEvent(selectedEvent.eventId, (current) => ({
                    ...current,
                    safetyNote: event.target.value
                  }))
                }
              />
            </>
          ) : (
            <article className="module-card">
              <p className="module-card-title">No event selected</p>
              <p className="body-copy">
                Start the registry with an ambient loop or hole-triggered payoff so the world layer
                has a real timing anchor.
              </p>
            </article>
          )}
        </section>
      </div>

      <div className="workspace-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Coordination Context</p>
              <h3>Holes and districts touched by this event</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {selectedEvent && relatedHoles.length > 0 ? (
              relatedHoles.map((hole) => (
                <article key={hole.holeId} className="module-card">
                  <div className="project-card-meta">
                    <span>Hole {hole.number}</span>
                    <strong>{hole.playabilityStatus}</strong>
                  </div>
                  <p className="module-card-title">{hole.metadata.holeRole}</p>
                  <p className="body-copy">{hole.metadata.eventPayoffNotes}</p>
                </article>
              ))
            ) : (
              <article className="module-card">
                <p className="module-card-title">No hole links yet</p>
                <p className="body-copy">
                  Link the event to at least one playable hole or supporting district so timing and
                  validation have real context.
                </p>
              </article>
            )}
          </div>
          {selectedHoleEvents.length > 1 ? (
            <p className="muted-copy">
              {selectedHoleEvents.length} events currently touch the first linked hole. Review
              timing overlap before calling the sequence stable.
            </p>
          ) : null}
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Event Risks</p>
              <h3>Actionable fixes, not vague warnings</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {selectedEventIssues.length > 0
              ? selectedEventIssues.map((issue) => (
                  <ValidationIssueCard key={issue.issueId} issue={issue} compact />
                ))
              : sortedEvents.slice(0, 3).map((event) => (
                  <article key={event.eventId} className="module-card">
                    <div className="project-card-meta">
                      <span>{humanize(event.triggerMode)}</span>
                      <strong>{event.state}</strong>
                    </div>
                    <p className="module-card-title">{event.name}</p>
                    <p className="body-copy">
                      {event.safetyNote || "Add a safety note so gameplay review has an explicit fallback path."}
                    </p>
                  </article>
                ))}
          </div>
        </section>
      </div>
    </div>
  );
}
