import {
  createDesignTruthSummary,
  type ConstraintRequirement,
  type CourseBible,
  type RichNoteBlock,
  type SignatureMoment
} from "@course-creator-os/course-bible";
import { Button, Inline, MetricChip, SectionHeader, Stack, SurfaceCard, TextAreaField, TextField, SelectField } from "@course-creator-os/ui";

import { updateCourseBible, useProjectSession } from "../../app/project-session";
import { StatusPill } from "../../components/StatusPill";
import { ValidationIssueCard } from "../../components/ValidationIssueCard";

const releaseIntentOptions = [
  { label: "Private", value: "private" },
  { label: "Community", value: "community" },
  { label: "Showcase", value: "showcase" }
];

const constraintSeverityOptions = [
  { label: "Guideline", value: "guideline" },
  { label: "Important", value: "important" },
  { label: "Non-Negotiable", value: "non-negotiable" }
];

const noteEmphasisOptions = [
  { label: "General", value: "general" },
  { label: "Risk", value: "risk" },
  { label: "Opportunity", value: "opportunity" },
  { label: "Reference", value: "reference" }
];

function splitListInput(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinListInput(values: string[]) {
  return values.join("\n");
}

function updateBible(updater: (courseBible: CourseBible) => CourseBible) {
  updateCourseBible((courseBible) => updater(courseBible));
}

function updateSignatureMoment(
  moments: SignatureMoment[],
  momentId: string,
  updater: (moment: SignatureMoment) => SignatureMoment,
) {
  return moments.map((moment) => (moment.momentId === momentId ? updater(moment) : moment));
}

function updateConstraint(
  constraints: ConstraintRequirement[],
  constraintId: string,
  updater: (constraint: ConstraintRequirement) => ConstraintRequirement,
) {
  return constraints.map((constraint) =>
    constraint.constraintId === constraintId ? updater(constraint) : constraint,
  );
}

function updateRichNote(
  notes: RichNoteBlock[],
  noteId: string,
  updater: (note: RichNoteBlock) => RichNoteBlock,
) {
  return notes.map((note) => (note.noteId === noteId ? updater(note) : note));
}

export function CourseBibleWorkspace() {
  const { project, validationReport } = useProjectSession();
  const courseBible = project.courseBible;
  const summary = createDesignTruthSummary(courseBible);
  const planIssues = validationReport.issues.filter((issue) => issue.ownerModule === "plan");

  return (
    <section className="panel course-bible-shell">
      <div className="course-bible-layout">
        <Stack gap={6} className="course-bible-main">
          <SectionHeader
            eyebrow="Course Bible"
            title="Structured creative truth"
            description="Capture the design truth of the project in a way later modules can trust."
            actions={<StatusPill label="Structured + Rich Notes" tone="success" />}
          />

          <SurfaceCard padding={6}>
            <SectionHeader
              eyebrow="Vision Overview"
              title="What the course is trying to achieve"
              description="Anchor the high-level creative intent before deeper routing and world decisions."
            />
            <div className="course-bible-section-grid">
              <TextField
                label="Course Identity"
                value={courseBible.courseIdentity}
                onChange={(event) =>
                  updateBible((current) => ({
                    ...current,
                    courseIdentity: event.target.value
                  }))
                }
              />
              <TextAreaField
                label="Vision Statement"
                rows={4}
                value={courseBible.visionOverview.statement}
                onChange={(event) =>
                  updateBible((current) => ({
                    ...current,
                    visionOverview: {
                      ...current.visionOverview,
                      statement: event.target.value
                    }
                  }))
                }
              />
              <TextAreaField
                label="Player Promise"
                rows={4}
                value={courseBible.visionOverview.playerPromise}
                onChange={(event) =>
                  updateBible((current) => ({
                    ...current,
                    visionOverview: {
                      ...current.visionOverview,
                      playerPromise: event.target.value
                    }
                  }))
                }
              />
              <TextAreaField
                label="Design Thesis"
                rows={4}
                value={courseBible.visionOverview.designThesis}
                onChange={(event) =>
                  updateBible((current) => ({
                    ...current,
                    visionOverview: {
                      ...current.visionOverview,
                      designThesis: event.target.value
                    }
                  }))
                }
              />
            </div>
          </SurfaceCard>

          <SurfaceCard padding={6}>
            <SectionHeader
              eyebrow="Audience and Intent"
              title="Who this is for and how it should feel"
              description="Make the intended player experience and release posture explicit."
            />
            <div className="course-bible-section-grid">
              <TextAreaField
                label="Primary Audience"
                rows={4}
                value={courseBible.audienceAndIntent.primaryAudience}
                onChange={(event) =>
                  updateBible((current) => ({
                    ...current,
                    audienceAndIntent: {
                      ...current.audienceAndIntent,
                      primaryAudience: event.target.value
                    }
                  }))
                }
              />
              <TextAreaField
                label="Intended Experience"
                rows={4}
                value={courseBible.audienceAndIntent.intendedExperience}
                onChange={(event) =>
                  updateBible((current) => ({
                    ...current,
                    audienceAndIntent: {
                      ...current.audienceAndIntent,
                      intendedExperience: event.target.value
                    }
                  }))
                }
              />
              <SelectField
                label="Release Intent"
                options={releaseIntentOptions}
                value={courseBible.audienceAndIntent.releaseIntent}
                onChange={(event) =>
                  updateBible((current) => ({
                    ...current,
                    audienceAndIntent: {
                      ...current.audienceAndIntent,
                      releaseIntent: event.target.value as CourseBible["audienceAndIntent"]["releaseIntent"]
                    }
                  }))
                }
              />
            </div>
          </SurfaceCard>

          <SurfaceCard padding={6}>
            <SectionHeader
              eyebrow="World Identity"
              title="Setting, support-space logic, and world rules"
              description="This should read like a believable world system, not disconnected decor."
            />
            <div className="course-bible-section-grid">
              <TextAreaField
                label="Setting Summary"
                rows={4}
                value={courseBible.worldIdentity.settingSummary}
                onChange={(event) =>
                  updateBible((current) => ({
                    ...current,
                    worldIdentity: {
                      ...current.worldIdentity,
                      settingSummary: event.target.value
                    }
                  }))
                }
              />
              <TextAreaField
                label="Environment Logic"
                rows={5}
                hint="One rule per line."
                value={joinListInput(courseBible.worldIdentity.environmentLogic)}
                onChange={(event) =>
                  updateBible((current) => ({
                    ...current,
                    worldIdentity: {
                      ...current.worldIdentity,
                      environmentLogic: splitListInput(event.target.value)
                    }
                  }))
                }
              />
              <TextAreaField
                label="Support-Space Principle"
                rows={4}
                value={courseBible.worldIdentity.supportSpacePrinciple}
                onChange={(event) =>
                  updateBible((current) => ({
                    ...current,
                    worldIdentity: {
                      ...current.worldIdentity,
                      supportSpacePrinciple: event.target.value
                    }
                  }))
                }
              />
            </div>
          </SurfaceCard>

          <SurfaceCard padding={6}>
            <SectionHeader
              eyebrow="Design Language"
              title="Style, materials, and lighting"
              description="Use one line per principle so later systems can align to the same vocabulary."
            />
            <div className="course-bible-section-grid">
              <TextAreaField
                label="Style Grammar"
                rows={5}
                hint="One principle per line."
                value={joinListInput(courseBible.styleGrammar)}
                onChange={(event) =>
                  updateBible((current) => ({
                    ...current,
                    styleGrammar: splitListInput(event.target.value)
                  }))
                }
              />
              <TextAreaField
                label="Material Language"
                rows={5}
                hint="One principle per line."
                value={joinListInput(courseBible.materialLanguage)}
                onChange={(event) =>
                  updateBible((current) => ({
                    ...current,
                    materialLanguage: splitListInput(event.target.value)
                  }))
                }
              />
              <TextAreaField
                label="Lighting Language"
                rows={5}
                hint="One principle per line."
                value={joinListInput(courseBible.lightingLanguage)}
                onChange={(event) =>
                  updateBible((current) => ({
                    ...current,
                    lightingLanguage: splitListInput(event.target.value)
                  }))
                }
              />
            </div>
          </SurfaceCard>

          <SurfaceCard padding={6}>
            <SectionHeader
              eyebrow="Pacing and Emotional Arc"
              title="How the course should feel over time"
              description="Translate the project intent into opening, middle, and closing beats."
            />
            <div className="course-bible-section-grid">
              <TextAreaField
                label="Opening Beat"
                rows={3}
                value={courseBible.pacingAndEmotionalArc.openingBeat}
                onChange={(event) =>
                  updateBible((current) => ({
                    ...current,
                    pacingAndEmotionalArc: {
                      ...current.pacingAndEmotionalArc,
                      openingBeat: event.target.value
                    }
                  }))
                }
              />
              <TextAreaField
                label="Mid-Course Beat"
                rows={3}
                value={courseBible.pacingAndEmotionalArc.midCourseBeat}
                onChange={(event) =>
                  updateBible((current) => ({
                    ...current,
                    pacingAndEmotionalArc: {
                      ...current.pacingAndEmotionalArc,
                      midCourseBeat: event.target.value
                    }
                  }))
                }
              />
              <TextAreaField
                label="Closing Beat"
                rows={3}
                value={courseBible.pacingAndEmotionalArc.closingBeat}
                onChange={(event) =>
                  updateBible((current) => ({
                    ...current,
                    pacingAndEmotionalArc: {
                      ...current.pacingAndEmotionalArc,
                      closingBeat: event.target.value
                    }
                  }))
                }
              />
              <TextAreaField
                label="Emotional Arc Summary"
                rows={4}
                value={courseBible.pacingAndEmotionalArc.emotionalArcSummary}
                onChange={(event) =>
                  updateBible((current) => ({
                    ...current,
                    pacingAndEmotionalArc: {
                      ...current.pacingAndEmotionalArc,
                      emotionalArcSummary: event.target.value
                    }
                  }))
                }
              />
            </div>
          </SurfaceCard>

          <SurfaceCard padding={6}>
            <SectionHeader
              eyebrow="Signature Moments"
              title="Anchor moments the rest of the project should remember"
              description="Each moment should state what it is, why it matters, and where it belongs."
              actions={
                <Button
                  size="sm"
                  tone="secondary"
                  onClick={() =>
                    updateBible((current) => ({
                      ...current,
                      signatureMoments: [
                        ...current.signatureMoments,
                        {
                          momentId: `signature-${Date.now()}`,
                          title: "New signature moment",
                          summary: "Describe the reveal or payoff.",
                          impact: "Explain why it matters.",
                          locationHint: "Place it in the routing or world."
                        }
                      ]
                    }))
                  }
                >
                  Add Signature Moment
                </Button>
              }
            />
            <div className="course-bible-card-grid">
              {courseBible.signatureMoments.map((moment) => (
                <SurfaceCard key={moment.momentId} padding={4} tone="ghost">
                  <Stack gap={4}>
                    <Inline justify="space-between">
                      <StatusPill label={moment.momentId} />
                      {courseBible.signatureMoments.length > 1 ? (
                        <Button
                          size="sm"
                          tone="ghost"
                          onClick={() =>
                            updateBible((current) => ({
                              ...current,
                              signatureMoments: current.signatureMoments.filter(
                                (candidate) => candidate.momentId !== moment.momentId,
                              )
                            }))
                          }
                        >
                          Remove
                        </Button>
                      ) : null}
                    </Inline>
                    <TextField
                      label="Title"
                      value={moment.title}
                      onChange={(event) =>
                        updateBible((current) => ({
                          ...current,
                          signatureMoments: updateSignatureMoment(
                            current.signatureMoments,
                            moment.momentId,
                            (candidate) => ({
                              ...candidate,
                              title: event.target.value
                            }),
                          )
                        }))
                      }
                    />
                    <TextAreaField
                      label="Summary"
                      rows={4}
                      value={moment.summary}
                      onChange={(event) =>
                        updateBible((current) => ({
                          ...current,
                          signatureMoments: updateSignatureMoment(
                            current.signatureMoments,
                            moment.momentId,
                            (candidate) => ({
                              ...candidate,
                              summary: event.target.value
                            }),
                          )
                        }))
                      }
                    />
                    <TextAreaField
                      label="Impact"
                      rows={3}
                      value={moment.impact}
                      onChange={(event) =>
                        updateBible((current) => ({
                          ...current,
                          signatureMoments: updateSignatureMoment(
                            current.signatureMoments,
                            moment.momentId,
                            (candidate) => ({
                              ...candidate,
                              impact: event.target.value
                            }),
                          )
                        }))
                      }
                    />
                    <TextField
                      label="Location Hint"
                      value={moment.locationHint}
                      onChange={(event) =>
                        updateBible((current) => ({
                          ...current,
                          signatureMoments: updateSignatureMoment(
                            current.signatureMoments,
                            moment.momentId,
                            (candidate) => ({
                              ...candidate,
                              locationHint: event.target.value
                            }),
                          )
                        }))
                      }
                    />
                  </Stack>
                </SurfaceCard>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard padding={6}>
            <SectionHeader
              eyebrow="Constraints and Requirements"
              title="What the product must not forget later"
              description="Capture explicit rules that validation, performance, and packaging should respect."
              actions={
                <Button
                  size="sm"
                  tone="secondary"
                  onClick={() =>
                    updateBible((current) => ({
                      ...current,
                      constraintsAndRequirements: [
                        ...current.constraintsAndRequirements,
                        {
                          constraintId: `constraint-${Date.now()}`,
                          title: "New requirement",
                          requirement: "Describe the rule that later modules must respect.",
                          severity: "important"
                        }
                      ]
                    }))
                  }
                >
                  Add Requirement
                </Button>
              }
            />
            <div className="course-bible-card-grid">
              {courseBible.constraintsAndRequirements.map((constraint) => (
                <SurfaceCard key={constraint.constraintId} padding={4} tone="ghost">
                  <Stack gap={4}>
                    <Inline justify="space-between">
                      <StatusPill label={constraint.severity} tone={constraint.severity === "non-negotiable" ? "warning" : "info"} />
                      {courseBible.constraintsAndRequirements.length > 1 ? (
                        <Button
                          size="sm"
                          tone="ghost"
                          onClick={() =>
                            updateBible((current) => ({
                              ...current,
                              constraintsAndRequirements: current.constraintsAndRequirements.filter(
                                (candidate) => candidate.constraintId !== constraint.constraintId,
                              )
                            }))
                          }
                        >
                          Remove
                        </Button>
                      ) : null}
                    </Inline>
                    <TextField
                      label="Title"
                      value={constraint.title}
                      onChange={(event) =>
                        updateBible((current) => ({
                          ...current,
                          constraintsAndRequirements: updateConstraint(
                            current.constraintsAndRequirements,
                            constraint.constraintId,
                            (candidate) => ({
                              ...candidate,
                              title: event.target.value
                            }),
                          )
                        }))
                      }
                    />
                    <TextAreaField
                      label="Requirement"
                      rows={4}
                      value={constraint.requirement}
                      onChange={(event) =>
                        updateBible((current) => ({
                          ...current,
                          constraintsAndRequirements: updateConstraint(
                            current.constraintsAndRequirements,
                            constraint.constraintId,
                            (candidate) => ({
                              ...candidate,
                              requirement: event.target.value
                            }),
                          )
                        }))
                      }
                    />
                    <SelectField
                      label="Severity"
                      options={constraintSeverityOptions}
                      value={constraint.severity}
                      onChange={(event) =>
                        updateBible((current) => ({
                          ...current,
                          constraintsAndRequirements: updateConstraint(
                            current.constraintsAndRequirements,
                            constraint.constraintId,
                            (candidate) => ({
                              ...candidate,
                              severity: event.target.value as ConstraintRequirement["severity"]
                            }),
                          )
                        }))
                      }
                    />
                  </Stack>
                </SurfaceCard>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard padding={6}>
            <SectionHeader
              eyebrow="Rich Notes"
              title="Context that should not get buried"
              description="Use note cards for risks, references, and ideas that do not fit cleanly into a structured field."
              actions={
                <Button
                  size="sm"
                  tone="secondary"
                  onClick={() =>
                    updateBible((current) => ({
                      ...current,
                      richNotes: [
                        ...current.richNotes,
                        {
                          noteId: `note-${Date.now()}`,
                          title: "New note",
                          body: "Capture supporting context, risks, or references.",
                          emphasis: "general"
                        }
                      ]
                    }))
                  }
                >
                  Add Rich Note
                </Button>
              }
            />
            <div className="course-bible-card-grid">
              {courseBible.richNotes.map((note) => (
                <SurfaceCard key={note.noteId} padding={4} tone="ghost">
                  <Stack gap={4}>
                    <Inline justify="space-between">
                      <StatusPill label={note.emphasis} tone={note.emphasis === "risk" ? "warning" : note.emphasis === "opportunity" ? "success" : "info"} />
                      <Button
                        size="sm"
                        tone="ghost"
                        onClick={() =>
                          updateBible((current) => ({
                            ...current,
                            richNotes: current.richNotes.filter((candidate) => candidate.noteId !== note.noteId)
                          }))
                        }
                      >
                        Remove
                      </Button>
                    </Inline>
                    <TextField
                      label="Title"
                      value={note.title}
                      onChange={(event) =>
                        updateBible((current) => ({
                          ...current,
                          richNotes: updateRichNote(current.richNotes, note.noteId, (candidate) => ({
                            ...candidate,
                            title: event.target.value
                          }))
                        }))
                      }
                    />
                    <TextAreaField
                      label="Body"
                      rows={5}
                      value={note.body}
                      onChange={(event) =>
                        updateBible((current) => ({
                          ...current,
                          richNotes: updateRichNote(current.richNotes, note.noteId, (candidate) => ({
                            ...candidate,
                            body: event.target.value
                          }))
                        }))
                      }
                    />
                    <SelectField
                      label="Emphasis"
                      options={noteEmphasisOptions}
                      value={note.emphasis}
                      onChange={(event) =>
                        updateBible((current) => ({
                          ...current,
                          richNotes: updateRichNote(current.richNotes, note.noteId, (candidate) => ({
                            ...candidate,
                            emphasis: event.target.value as RichNoteBlock["emphasis"]
                          }))
                        }))
                      }
                    />
                  </Stack>
                </SurfaceCard>
              ))}
              {courseBible.richNotes.length === 0 ? (
                <SurfaceCard padding={6} tone="ghost" border="subtle">
                  <Stack gap={3}>
                    <p className="eyebrow">No Rich Notes Yet</p>
                    <p className="body-copy">
                      Add notes for risks, references, and ideas that should survive beyond a single session.
                    </p>
                  </Stack>
                </SurfaceCard>
              ) : null}
            </div>
          </SurfaceCard>
        </Stack>
        <aside className="course-bible-sidebar">
          <Stack gap={6}>
            <SurfaceCard padding={6} tone="contrast" border="accent">
              <SectionHeader
                eyebrow="Design Truth"
                title="Always-visible summary"
                description="This is the creative truth the rest of the product should trust."
                actions={<StatusPill label={summary.releaseIntent} tone="info" />}
              />
              <Stack gap={4}>
                <MetricChip label="Course Identity" value={summary.courseIdentity} note={summary.visionStatement} />
                <MetricChip label="Player Promise" tone="accent" value={summary.playerPromise} note={summary.intendedExperience} />
              </Stack>
            </SurfaceCard>

            <div className="wizard-success-grid">
              <MetricChip
                label="Signature Moments"
                value={summary.signatureMomentCount}
                note="Anchor beats defined"
                tone={summary.signatureMomentCount >= 3 ? "success" : "warning"}
              />
              <MetricChip
                label="Constraints"
                value={summary.constraintCount}
                note="Release and quality rules"
              />
              <MetricChip
                label="Rich Notes"
                value={summary.noteCount}
                note="Supporting context"
              />
              <MetricChip
                label="Release Intent"
                value={summary.releaseIntent}
                note="Audience posture"
                tone="info"
              />
            </div>

            <SurfaceCard padding={6} tone="ghost">
              <SectionHeader
                eyebrow="Attention"
                title="Current plan issues"
                description="Validation is meant to guide the next edit, not just report after the fact."
              />
              <div className="issue-card-list">
                {(planIssues.length > 0 ? planIssues : validationReport.issues.slice(0, 2)).map((issue) => (
                  <ValidationIssueCard key={issue.issueId} issue={issue} compact />
                ))}
              </div>
            </SurfaceCard>
          </Stack>
        </aside>
      </div>
    </section>
  );
}
