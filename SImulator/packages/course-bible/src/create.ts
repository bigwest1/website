import type { ReleaseIntent } from "./course-bible";
import { courseBibleSchema, type CourseBible } from "./course-bible";

type CreateCourseBibleDraftInput = {
  projectName: string;
  primaryTheme: string;
  releaseIntent: ReleaseIntent;
};

export function createCourseBibleDraft({
  projectName,
  primaryTheme,
  releaseIntent
}: CreateCourseBibleDraftInput): CourseBible {
  return courseBibleSchema.parse({
    courseIdentity: `${projectName} initial concept`,
    visionOverview: {
      statement: `Define the premium creative direction for ${projectName}.`,
      playerPromise: "Deliver a readable, premium, replayable simulator course from the first tee.",
      designThesis: "Use strong planning structure so spectacle and simulator correctness can scale together."
    },
    audienceAndIntent: {
      primaryAudience: "Course creators and simulator players who value clarity, quality, and replayability.",
      intendedExperience: "Confident shot planning, premium worldbuilding, and a believable release path.",
      releaseIntent
    },
    worldIdentity: {
      settingSummary: `${primaryTheme} course world in active definition.`,
      environmentLogic: ["Environment logic to be defined."],
      supportSpacePrinciple: "Support spaces should feel intentional and believable, never like filler."
    },
    styleGrammar: ["Readability-first framing"],
    materialLanguage: ["Primary material language to be defined"],
    lightingLanguage: ["Lighting language to be defined"],
    pacingAndEmotionalArc: {
      openingBeat: "Opening move",
      midCourseBeat: "Mid-course escalation",
      closingBeat: "Finale payoff",
      emotionalArcSummary: "Start with clarity, escalate with confidence, and finish with a premium payoff."
    },
    signatureMoments: [
      {
        momentId: "signature-001",
        title: "Signature moment to be defined",
        summary: "Define the first unforgettable moment that expresses the course identity.",
        impact: "Sets the expectation for the premium experience.",
        locationHint: "Choose the first high-value reveal zone."
      }
    ],
    constraintsAndRequirements: [
      {
        constraintId: "constraint-001",
        title: "Protect playability",
        requirement: "Keep readability and fair shot outcomes intact while the course identity evolves.",
        severity: "non-negotiable"
      }
    ],
    richNotes: []
  });
}
