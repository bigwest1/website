import type { CourseBible } from "./course-bible";

export type DesignTruthSummary = {
  courseIdentity: string;
  visionStatement: string;
  playerPromise: string;
  intendedExperience: string;
  releaseIntent: CourseBible["audienceAndIntent"]["releaseIntent"];
  signatureMomentCount: number;
  constraintCount: number;
  noteCount: number;
};

export function createDesignTruthSummary(courseBible: CourseBible): DesignTruthSummary {
  return {
    courseIdentity: courseBible.courseIdentity,
    visionStatement: courseBible.visionOverview.statement,
    playerPromise: courseBible.visionOverview.playerPromise,
    intendedExperience: courseBible.audienceAndIntent.intendedExperience,
    releaseIntent: courseBible.audienceAndIntent.releaseIntent,
    signatureMomentCount: courseBible.signatureMoments.length,
    constraintCount: courseBible.constraintsAndRequirements.length,
    noteCount: courseBible.richNotes.length
  };
}
