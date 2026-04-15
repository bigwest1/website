import { z } from "zod";

export const releaseIntentSchema = z.enum(["private", "community", "showcase"]);
export const constraintSeveritySchema = z.enum(["guideline", "important", "non-negotiable"]);
export const noteEmphasisSchema = z.enum(["general", "risk", "opportunity", "reference"]);

const nonEmptyStringSchema = z.string().trim().min(1);
const nonEmptyStringListSchema = z.array(nonEmptyStringSchema).min(1);

export const visionOverviewSchema = z.object({
  statement: nonEmptyStringSchema,
  playerPromise: nonEmptyStringSchema,
  designThesis: nonEmptyStringSchema
});

export const audienceIntentSchema = z.object({
  primaryAudience: nonEmptyStringSchema,
  intendedExperience: nonEmptyStringSchema,
  releaseIntent: releaseIntentSchema
});

export const worldIdentitySectionSchema = z.object({
  settingSummary: nonEmptyStringSchema,
  environmentLogic: nonEmptyStringListSchema,
  supportSpacePrinciple: nonEmptyStringSchema
});

export const pacingEmotionalArcSchema = z.object({
  openingBeat: nonEmptyStringSchema,
  midCourseBeat: nonEmptyStringSchema,
  closingBeat: nonEmptyStringSchema,
  emotionalArcSummary: nonEmptyStringSchema
});

export const signatureMomentSchema = z.object({
  momentId: nonEmptyStringSchema,
  title: nonEmptyStringSchema,
  summary: nonEmptyStringSchema,
  impact: nonEmptyStringSchema,
  locationHint: nonEmptyStringSchema
});

export const constraintRequirementSchema = z.object({
  constraintId: nonEmptyStringSchema,
  title: nonEmptyStringSchema,
  requirement: nonEmptyStringSchema,
  severity: constraintSeveritySchema
});

export const richNoteBlockSchema = z.object({
  noteId: nonEmptyStringSchema,
  title: nonEmptyStringSchema,
  body: nonEmptyStringSchema,
  emphasis: noteEmphasisSchema
});

export const courseBibleSchema = z.object({
  courseIdentity: nonEmptyStringSchema,
  visionOverview: visionOverviewSchema,
  audienceAndIntent: audienceIntentSchema,
  worldIdentity: worldIdentitySectionSchema,
  styleGrammar: nonEmptyStringListSchema,
  materialLanguage: nonEmptyStringListSchema,
  lightingLanguage: nonEmptyStringListSchema,
  pacingAndEmotionalArc: pacingEmotionalArcSchema,
  signatureMoments: z.array(signatureMomentSchema).min(1),
  constraintsAndRequirements: z.array(constraintRequirementSchema).min(1),
  richNotes: z.array(richNoteBlockSchema).default([])
});

export type ReleaseIntent = z.infer<typeof releaseIntentSchema>;
export type ConstraintSeverity = z.infer<typeof constraintSeveritySchema>;
export type NoteEmphasis = z.infer<typeof noteEmphasisSchema>;
export type VisionOverview = z.infer<typeof visionOverviewSchema>;
export type AudienceIntent = z.infer<typeof audienceIntentSchema>;
export type WorldIdentitySection = z.infer<typeof worldIdentitySectionSchema>;
export type PacingEmotionalArc = z.infer<typeof pacingEmotionalArcSchema>;
export type SignatureMoment = z.infer<typeof signatureMomentSchema>;
export type ConstraintRequirement = z.infer<typeof constraintRequirementSchema>;
export type RichNoteBlock = z.infer<typeof richNoteBlockSchema>;
export type CourseBible = z.infer<typeof courseBibleSchema>;
