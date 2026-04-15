import { flyoverPlanSchema, showcaseSequenceSchema } from "./models";

type CreateFlyoverPlanInput = {
  flyoverPlanId: string;
  holeRef: string;
  previewPathRef?: string | null;
  cameraIntent: string;
  introBeat: string;
  outroBeat: string;
  durationSeconds: number;
  readinessState?: "missing" | "draft" | "ready" | "approved";
  note: string;
};

export function createFlyoverPlan(input: CreateFlyoverPlanInput) {
  return flyoverPlanSchema.parse({
    ...input,
    previewPathRef: input.previewPathRef ?? null,
    readinessState: input.readinessState ?? "draft",
    outputStatus: "not-run",
    lastBuildRef: null
  });
}

type CreateShowcaseSequenceInput = {
  showcaseSequenceId: string;
  title: string;
  targetChannel?: "private" | "community" | "showcase";
  shotRefs: string[];
  narrativeGoal: string;
  readinessState?: "missing" | "draft" | "ready" | "approved";
  note: string;
};

export function createShowcaseSequence(input: CreateShowcaseSequenceInput) {
  return showcaseSequenceSchema.parse({
    ...input,
    targetChannel: input.targetChannel ?? "showcase",
    readinessState: input.readinessState ?? "draft",
    outputStatus: "not-run",
    lastBuildRef: null
  });
}
