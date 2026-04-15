import { createFlyoverPlan, createShowcaseSequence } from "./create";
import type {
  FlyoverPlan,
  PreviewPath,
  PreviewOutputStatus,
  PreviewReadinessState,
  ScreenshotPlan,
  ScreenshotStatus,
  ShotVariantRole,
  ShotVariantShippingState,
  ShowcaseSequence
} from "./models";
import {
  summarizePreviewReadiness,
  type CameraShotSequencingActionKind,
  type CameraCaptureExecutionActionKind,
  type CameraPathCorrectionToolActionKind,
  type ShotOrderApprovalActionKind,
  type ShotVariantSetActionKind,
  type ShotVariantShippingDecisionActionKind
} from "./summary";

export type PreviewOperationalIssue = {
  issueId: string;
  owner: "flyover" | "minimap" | "screenshot" | "showcase";
  severity: "warning" | "critical";
  title: string;
  summary: string;
  actionPath: string;
};

function appendUniqueSentence(source: string, addition: string) {
  const trimmedSource = source.trim();
  const trimmedAddition = addition.trim();
  if (!trimmedAddition) {
    return trimmedSource;
  }
  if (trimmedSource.toLowerCase().includes(trimmedAddition.toLowerCase())) {
    return trimmedSource;
  }
  return trimmedSource.length === 0 ? trimmedAddition : `${trimmedSource} ${trimmedAddition}`;
}

function nextReadyState(state: PreviewReadinessState) {
  return state === "approved" ? state : "ready";
}

function approveReadinessState(state: PreviewReadinessState) {
  return state === "missing" ? "ready" : state === "approved" ? state : "approved";
}

function promoteScreenshotStatus(status: ScreenshotStatus) {
  return status === "approved" ? status : status === "captured" ? "approved" : "captured";
}

function inferHoleOrdinal(holeId: string) {
  const match = holeId.match(/(\d+)(?!.*\d)/);
  return match ? Number(match[1]) : 0;
}

function createVariantSetId(
  holeId: string,
  role: ShotVariantRole,
  family: "primary" | "flyover" | "key-view" | "showcase",
) {
  return role === "primary"
    ? `shot-variant-${holeId}-primary`
    : `shot-variant-${holeId}-alternate-${family}`;
}

function tagPreviewPathVariant(
  path: PreviewPath,
  input: {
    variantSetId: string;
    variantLabel: string;
    variantRole: ShotVariantRole;
    variantShippingState?: ShotVariantShippingState;
  },
): PreviewPath {
  return {
    ...path,
    shotVariantSetId: input.variantSetId,
    shotVariantLabel: input.variantLabel,
    shotVariantRole: input.variantRole,
    shotVariantShippingState: path.shotVariantShippingState ?? input.variantShippingState ?? "candidate",
  };
}

function tagFlyoverVariant(
  plan: FlyoverPlan,
  input: {
    variantSetId: string;
    variantLabel: string;
    variantRole: ShotVariantRole;
    variantShippingState?: ShotVariantShippingState;
  },
): FlyoverPlan {
  return {
    ...plan,
    shotVariantSetId: input.variantSetId,
    shotVariantLabel: input.variantLabel,
    shotVariantRole: input.variantRole,
    shotVariantShippingState: plan.shotVariantShippingState ?? input.variantShippingState ?? "candidate",
  };
}

function tagScreenshotVariant(
  plan: ScreenshotPlan,
  input: {
    variantSetId: string;
    variantLabel: string;
    variantRole: ShotVariantRole;
    variantShippingState?: ShotVariantShippingState;
  },
): ScreenshotPlan {
  return {
    ...plan,
    shotVariantSetId: input.variantSetId,
    shotVariantLabel: input.variantLabel,
    shotVariantRole: input.variantRole,
    shotVariantShippingState: plan.shotVariantShippingState ?? input.variantShippingState ?? "candidate",
  };
}

function tagShowcaseVariant(
  sequence: ShowcaseSequence,
  input: {
    variantSetId: string;
    variantLabel: string;
    variantRole: ShotVariantRole;
    variantShippingState?: ShotVariantShippingState;
  },
): ShowcaseSequence {
  return {
    ...sequence,
    shotVariantSetId: input.variantSetId,
    shotVariantLabel: input.variantLabel,
    shotVariantRole: input.variantRole,
    shotVariantShippingState: sequence.shotVariantShippingState ?? input.variantShippingState ?? "candidate",
  };
}

function variantBelongsToHole(variantSetId: string | null | undefined, holeId: string) {
  return Boolean(variantSetId && variantSetId.includes(holeId));
}

function intersectingFamilies(
  families: Array<"preview-route" | "flyover" | "key-view" | "showcase">,
  targetFamilies: Set<"preview-route" | "flyover" | "key-view" | "showcase">,
) {
  return families.some((family) => targetFamilies.has(family));
}

function selectVariantShippingState<T extends { shotVariantSetId?: string | null; shotVariantShippingState?: ShotVariantShippingState }>(
  item: T,
  holeId: string,
  targetVariantSetId: string,
  families: Array<"preview-route" | "flyover" | "key-view" | "showcase">,
  targetFamilies: Set<"preview-route" | "flyover" | "key-view" | "showcase">,
) {
  if (!variantBelongsToHole(item.shotVariantSetId, holeId) || !intersectingFamilies(families, targetFamilies)) {
    return item;
  }

  return {
    ...item,
    shotVariantShippingState: item.shotVariantSetId === targetVariantSetId ? "selected" : "hold",
  };
}

export function updatePreviewPathReadiness(
  previewPaths: PreviewPath[],
  previewPathId: string,
  readinessState: PreviewReadinessState,
): PreviewPath[] {
  return previewPaths.map((path) =>
    path.previewPathId === previewPathId
      ? {
          ...path,
          readinessState
        }
      : path,
  );
}

export function updateFlyoverPlanReadiness(
  flyoverPlans: FlyoverPlan[],
  flyoverPlanId: string,
  readinessState: PreviewReadinessState,
): FlyoverPlan[] {
  return flyoverPlans.map((plan) =>
    plan.flyoverPlanId === flyoverPlanId
      ? {
          ...plan,
          readinessState
        }
      : plan,
  );
}

export function updateScreenshotStatus(
  screenshotPlans: ScreenshotPlan[],
  screenshotId: string,
  status: ScreenshotStatus,
): ScreenshotPlan[] {
  const changedAt = new Date().toISOString();
  return screenshotPlans.map((plan) =>
    plan.screenshotId === screenshotId
      ? {
          ...plan,
          status,
          capturedAt:
            status === "captured" || status === "approved"
              ? plan.capturedAt ?? changedAt
              : plan.capturedAt
        }
      : plan,
  );
}

export function updateShowcaseSequenceReadiness(
  showcaseSequences: ShowcaseSequence[],
  showcaseSequenceId: string,
  readinessState: PreviewReadinessState,
): ShowcaseSequence[] {
  return showcaseSequences.map((sequence) =>
    sequence.showcaseSequenceId === showcaseSequenceId
      ? {
          ...sequence,
          readinessState
        }
      : sequence,
  );
}

export function applyCameraPathCorrectionAction(input: {
  previewPaths: PreviewPath[];
  flyoverPlans: FlyoverPlan[];
  screenshotPlans: ScreenshotPlan[];
  showcaseSequences: ShowcaseSequence[];
  holeId: string;
  action: Exclude<CameraPathCorrectionToolActionKind, "ready">;
}): {
  previewPaths: PreviewPath[];
  flyoverPlans: FlyoverPlan[];
  screenshotPlans: ScreenshotPlan[];
  showcaseSequences: ShowcaseSequence[];
} {
  const relevantPreviewPathIds = new Set(
    input.previewPaths
      .filter((path) => path.holeRefs.includes(input.holeId))
      .map((path) => path.previewPathId),
  );
  const relevantScreenshotIds = new Set(
    input.screenshotPlans
      .filter(
        (plan) =>
          plan.holeRef === input.holeId ||
          (plan.previewPathRef !== null && relevantPreviewPathIds.has(plan.previewPathRef)),
      )
      .map((plan) => plan.screenshotId),
  );
  const previewNote =
    input.action === "smooth-transition"
      ? "Playback rhythm was polished for smoother shot transitions."
      : input.action === "open-blocked-segment"
        ? "Blocked path segments were reopened for clearer presentation flow."
        : input.action === "complete-key-view"
          ? "Key-view coverage was completed for stronger preview confidence."
          : "Playback support was reinforced so the final reveal reads more calmly.";
  const flyoverNote =
    input.action === "smooth-transition"
      ? "Extended the timing to calm abrupt transitions."
      : input.action === "open-blocked-segment"
        ? "Adjusted the path to reopen blocked view corridors."
        : input.action === "complete-key-view"
          ? "Completed the supporting hero views for this hole."
          : "Reinforced the path so landmark and route support stay visible in motion.";
  const screenshotNote =
    input.action === "smooth-transition"
      ? "Capture the calmer transition point as a supporting still."
      : input.action === "open-blocked-segment"
        ? "Reframe around the reopened landmark corridor."
        : input.action === "complete-key-view"
          ? "Capture or approve the missing hero frame for this hole."
          : "Reinforce the reveal with one clearer supporting landmark view.";
  const showcaseNote =
    input.action === "smooth-transition"
      ? "Sequence timing was polished for smoother presentation playback."
      : input.action === "open-blocked-segment"
        ? "Sequence notes now call for a clearer open-view transition."
        : input.action === "complete-key-view"
          ? "Sequence now expects the missing hero/support views before approval."
          : "Sequence support was reinforced around the hole’s landmark reveal.";

  return {
    previewPaths: input.previewPaths.map((path) =>
      path.holeRefs.includes(input.holeId)
        ? {
            ...path,
            readinessState: nextReadyState(path.readinessState),
            note: appendUniqueSentence(path.note, previewNote),
          }
        : path,
    ),
    flyoverPlans: input.flyoverPlans.map((plan) =>
      plan.holeRef === input.holeId
        ? {
            ...plan,
            readinessState: nextReadyState(plan.readinessState),
            durationSeconds:
              input.action === "smooth-transition"
                ? Math.min(26, Math.max(16, Math.round(plan.durationSeconds + 2)))
                : plan.durationSeconds,
            cameraIntent:
              input.action === "reinforce-playback-support" &&
              !plan.cameraIntent.toLowerCase().includes("landmark")
                ? `${plan.cameraIntent} with stronger landmark support`
                : plan.cameraIntent,
            note: appendUniqueSentence(plan.note, flyoverNote),
          }
        : plan,
    ),
    screenshotPlans: input.screenshotPlans.map((plan) =>
      plan.holeRef === input.holeId ||
      (plan.previewPathRef !== null && relevantPreviewPathIds.has(plan.previewPathRef))
        ? {
            ...plan,
            status:
              input.action === "complete-key-view" || input.action === "reinforce-playback-support"
                ? promoteScreenshotStatus(plan.status)
                : plan.status,
            framingNote: appendUniqueSentence(plan.framingNote, screenshotNote),
          }
        : plan,
    ),
    showcaseSequences: input.showcaseSequences.map((sequence) =>
      sequence.shotRefs.some((shotRef) => relevantScreenshotIds.has(shotRef))
        ? {
            ...sequence,
            readinessState: nextReadyState(sequence.readinessState),
            note: appendUniqueSentence(sequence.note, showcaseNote),
          }
        : sequence,
    )
  };
}

export function applyCameraCaptureExecutionAction(input: {
  previewPaths: PreviewPath[];
  flyoverPlans: FlyoverPlan[];
  screenshotPlans: ScreenshotPlan[];
  showcaseSequences: ShowcaseSequence[];
  holeId: string;
  action: Exclude<CameraCaptureExecutionActionKind, "ready">;
}): {
  previewPaths: PreviewPath[];
  flyoverPlans: FlyoverPlan[];
  screenshotPlans: ScreenshotPlan[];
  showcaseSequences: ShowcaseSequence[];
} {
  const relevantPreviewPathIds = new Set(
    input.previewPaths
      .filter((path) => path.holeRefs.includes(input.holeId))
      .map((path) => path.previewPathId),
  );
  const relevantScreenshotIds = new Set(
    input.screenshotPlans
      .filter(
        (plan) =>
          plan.holeRef === input.holeId ||
          (plan.previewPathRef !== null && relevantPreviewPathIds.has(plan.previewPathRef)),
      )
      .map((plan) => plan.screenshotId),
  );
  const previewNote =
    input.action === "execute-flyover-pass"
      ? "Capture execution was staged so the main flyover path can be reviewed as a deliberate pass."
      : input.action === "capture-key-shot"
        ? "Key capture support was staged for missing hero or supporting stills."
        : input.action === "approve-capture-set"
          ? "Captured supporting media was promoted into final review."
          : "Showcase support was finalized so the path can move toward final handoff.";
  const flyoverNote =
    input.action === "execute-flyover-pass"
      ? "Flyover pass was staged for final capture review."
      : input.action === "capture-key-shot"
        ? "The flyover now points at the supporting still that still needs capture."
        : input.action === "approve-capture-set"
          ? "The flyover now aligns to an approved supporting still set."
          : "The flyover pass now aligns to the finalized showcase support.";
  const screenshotNote =
    input.action === "execute-flyover-pass"
      ? "Use this still as the supporting frame for the next flyover pass."
      : input.action === "capture-key-shot"
        ? "This key view is now staged as an active capture target."
        : input.action === "approve-capture-set"
          ? "This supporting still has been promoted into the approved capture set."
          : "This still now supports the final showcase pass.";
  const showcaseNote =
    input.action === "execute-flyover-pass"
      ? "Showcase sequencing should wait for the refreshed flyover pass."
      : input.action === "capture-key-shot"
        ? "Showcase sequencing now expects the missing supporting captures."
        : input.action === "approve-capture-set"
          ? "Showcase sequencing now reads from the approved capture set."
          : "Showcase sequencing is finalized for share-ready review.";

  return {
    previewPaths: input.previewPaths.map((path) =>
      path.holeRefs.includes(input.holeId)
        ? {
            ...path,
            readinessState:
              input.action === "finalize-showcase-pass" || input.action === "approve-capture-set"
                ? nextReadyState(nextReadyState(path.readinessState))
                : nextReadyState(path.readinessState),
            note: appendUniqueSentence(path.note, previewNote),
          }
        : path,
    ),
    flyoverPlans: input.flyoverPlans.map((plan) =>
      plan.holeRef === input.holeId
        ? {
            ...plan,
            readinessState:
              input.action === "execute-flyover-pass" || input.action === "finalize-showcase-pass"
                ? nextReadyState(plan.readinessState)
                : plan.readinessState,
            durationSeconds:
              input.action === "execute-flyover-pass"
                ? Math.min(28, Math.max(16, Math.round(plan.durationSeconds + 1)))
                : plan.durationSeconds,
            note: appendUniqueSentence(plan.note, flyoverNote),
          }
        : plan,
    ),
    screenshotPlans: input.screenshotPlans.map((plan) =>
      plan.holeRef === input.holeId ||
      (plan.previewPathRef !== null && relevantPreviewPathIds.has(plan.previewPathRef))
        ? {
            ...plan,
            status:
              input.action === "capture-key-shot"
                ? plan.status === "planned"
                  ? "captured"
                  : plan.status
                : input.action === "approve-capture-set" || input.action === "finalize-showcase-pass"
                  ? promoteScreenshotStatus(plan.status)
                  : plan.status,
            framingNote: appendUniqueSentence(plan.framingNote, screenshotNote),
          }
        : plan,
    ),
    showcaseSequences: input.showcaseSequences.map((sequence) =>
      sequence.shotRefs.some((shotRef) => relevantScreenshotIds.has(shotRef))
        ? {
            ...sequence,
            readinessState:
              input.action === "finalize-showcase-pass"
                ? nextReadyState(nextReadyState(sequence.readinessState))
                : input.action === "approve-capture-set"
                  ? nextReadyState(sequence.readinessState)
                  : sequence.readinessState,
            note: appendUniqueSentence(sequence.note, showcaseNote),
          }
        : sequence,
    )
  };
}

export function applyCameraShotSequencingAction(input: {
  previewPaths: PreviewPath[];
  flyoverPlans: FlyoverPlan[];
  screenshotPlans: ScreenshotPlan[];
  showcaseSequences: ShowcaseSequence[];
  holeId: string;
  action: Exclude<CameraShotSequencingActionKind, "ready">;
}): {
  previewPaths: PreviewPath[];
  flyoverPlans: FlyoverPlan[];
  screenshotPlans: ScreenshotPlan[];
  showcaseSequences: ShowcaseSequence[];
} {
  const holeOrdinal = inferHoleOrdinal(input.holeId);
  const relevantPreviewPaths = input.previewPaths.filter((path) => path.holeRefs.includes(input.holeId));
  const relevantPreviewPathIds = new Set(relevantPreviewPaths.map((path) => path.previewPathId));
  const hasMinimapPath = relevantPreviewPaths.some((path) => path.previewType === "minimap");
  const hasFlyoverPlan = input.flyoverPlans.some((plan) => plan.holeRef === input.holeId);
  const holeScreenshotPlans = input.screenshotPlans.filter(
    (plan) =>
      plan.holeRef === input.holeId ||
      (plan.previewPathRef !== null && relevantPreviewPathIds.has(plan.previewPathRef)),
  );
  const holeScreenshotIds = new Set(holeScreenshotPlans.map((plan) => plan.screenshotId));
  const hasShowcaseSequence = input.showcaseSequences.some((sequence) =>
    sequence.shotRefs.some((shotRef) => holeScreenshotIds.has(shotRef)),
  );
  const previewNote =
    input.action === "stabilize-preview-route"
      ? "Preview routing was stabilized so the sequencing lane stays readable from minimap through flyover."
      : input.action === "sequence-flyover-beats"
        ? "Flyover beats were sequenced into a calmer reveal arc."
        : input.action === "sequence-key-view-set"
          ? "Key views were sequenced into a clearer still-image set."
          : "Showcase flow was sequenced into a calmer finish-stage presentation pass.";
  const flyoverNote =
    input.action === "stabilize-preview-route"
      ? "Flyover path was aligned to the stabilized preview route."
      : input.action === "sequence-flyover-beats"
        ? "Flyover beats were sequenced into a clearer intro-to-outro arc."
        : input.action === "sequence-key-view-set"
          ? "Flyover timing was adjusted to support the key-view set."
          : "Flyover now feeds the showcase sequence with calmer beat transitions.";
  const screenshotNote =
    input.action === "stabilize-preview-route"
      ? "Frame this still from the stabilized preview route."
      : input.action === "sequence-flyover-beats"
        ? "Capture the linked flyover beat as a supporting still."
        : input.action === "sequence-key-view-set"
          ? "This still was sequenced into the hero-to-supporting key-view set."
          : "This still now supports the showcase flow order.";
  const showcaseNote =
    input.action === "stabilize-preview-route"
      ? "Showcase flow now assumes the stabilized preview route."
      : input.action === "sequence-flyover-beats"
        ? "Showcase flow now follows the flyover beat order more deliberately."
        : input.action === "sequence-key-view-set"
          ? "Showcase flow now references the key-view set in order."
          : "Showcase flow was sequenced into a calmer beginning-to-end reveal.";

  const previewPaths: PreviewPath[] = hasMinimapPath
    ? input.previewPaths.map((path) =>
        path.holeRefs.includes(input.holeId)
          ? ({
              ...path,
              readinessState: nextReadyState(path.readinessState) as PreviewReadinessState,
              note: appendUniqueSentence(path.note, previewNote),
            } satisfies PreviewPath)
          : path,
      )
    : [
        ...input.previewPaths.map((path) =>
          path.holeRefs.includes(input.holeId)
            ? ({
                ...path,
                readinessState: nextReadyState(path.readinessState) as PreviewReadinessState,
                note: appendUniqueSentence(path.note, previewNote),
              } satisfies PreviewPath)
            : path,
        ),
        {
          previewPathId: `preview-minimap-${input.holeId}`,
          name: `Hole ${holeOrdinal || input.holeId} Minimap`,
          previewType: "minimap" as const,
          holeRefs: [input.holeId],
          readinessState: "ready" as const,
          outputStatus: "not-run" as const,
          lastBuildRef: null,
          note: "Sequenced from the active preview route for clearer capture execution.",
        },
      ];
  const nextRelevantPreviewPathId =
    previewPaths.find((path) => path.holeRefs.includes(input.holeId))?.previewPathId ?? null;
  const screenshotPlans: ScreenshotPlan[] =
    holeScreenshotPlans.length > 0
      ? input.screenshotPlans.map((plan) =>
          plan.holeRef === input.holeId ||
          (plan.previewPathRef !== null && relevantPreviewPathIds.has(plan.previewPathRef))
            ? {
                ...plan,
                status:
                  input.action === "sequence-key-view-set" || input.action === "sequence-showcase-flow"
                    ? promoteScreenshotStatus(plan.status)
                    : plan.status,
                framingNote: appendUniqueSentence(plan.framingNote, screenshotNote),
              }
            : plan,
        )
      : [
          ...input.screenshotPlans,
          {
            screenshotId: `shot-${input.holeId}-hero`,
            label: `Hole ${holeOrdinal || input.holeId} Hero`,
            holeRef: input.holeId,
            previewPathRef: nextRelevantPreviewPathId,
            framingNote: screenshotNote,
            status: (input.action === "sequence-key-view-set" ? "captured" : "planned") as ScreenshotStatus,
            outputStatus: "not-run" as const,
            capturedAt: null,
            lastBuildRef: null,
          },
        ];
  const nextRelevantScreenshotIds = new Set(
    screenshotPlans
      .filter(
        (plan) =>
          plan.holeRef === input.holeId ||
          (plan.previewPathRef !== null && previewPaths.some((path) => path.previewPathId === plan.previewPathRef && path.holeRefs.includes(input.holeId))),
      )
      .map((plan) => plan.screenshotId),
  );
  const flyoverPlans: FlyoverPlan[] = hasFlyoverPlan
    ? input.flyoverPlans.map((plan) =>
        plan.holeRef === input.holeId
          ? {
              ...plan,
              readinessState: nextReadyState(plan.readinessState),
              durationSeconds:
                input.action === "sequence-flyover-beats"
                  ? Math.min(28, Math.max(16, Math.round(plan.durationSeconds + 2)))
                  : plan.durationSeconds,
              note: appendUniqueSentence(plan.note, flyoverNote),
            }
          : plan,
      )
    : [
        ...input.flyoverPlans,
        createFlyoverPlan({
          flyoverPlanId: `flyover-plan-${input.holeId}`,
          holeRef: input.holeId,
          previewPathRef: nextRelevantPreviewPathId,
          cameraIntent: `Sequence Hole ${holeOrdinal || input.holeId} into a clean route-to-landmark reveal.`,
          introBeat: "Start by teaching the route entry and landmark anchor.",
          outroBeat: "Finish on the green-side reveal with enough time to read the finish posture.",
          durationSeconds: 18,
          readinessState: "ready",
          note: flyoverNote,
        }),
      ];
  const showcaseSequences: ShowcaseSequence[] = hasShowcaseSequence
    ? input.showcaseSequences.map((sequence) =>
        sequence.shotRefs.some((shotRef) => nextRelevantScreenshotIds.has(shotRef))
          ? {
              ...sequence,
              readinessState:
                input.action === "sequence-showcase-flow"
                  ? nextReadyState(nextReadyState(sequence.readinessState))
                  : nextReadyState(sequence.readinessState),
              note: appendUniqueSentence(sequence.note, showcaseNote),
            }
          : sequence,
      )
    : [
        ...input.showcaseSequences,
        createShowcaseSequence({
          showcaseSequenceId: `showcase-sequence-${input.holeId}`,
          title: `Hole ${holeOrdinal || input.holeId} Showcase`,
          shotRefs: [...nextRelevantScreenshotIds],
          narrativeGoal: "Carry the hole through a calm route, landmark, and finish-stage reveal.",
          readinessState: input.action === "sequence-showcase-flow" ? "approved" : "ready",
          note: showcaseNote,
        }),
      ];

  return {
    previewPaths,
    flyoverPlans,
    screenshotPlans,
    showcaseSequences,
  };
}

export function applyShotOrderApprovalAction(input: {
  previewPaths: PreviewPath[];
  flyoverPlans: FlyoverPlan[];
  screenshotPlans: ScreenshotPlan[];
  showcaseSequences: ShowcaseSequence[];
  holeId: string;
  action: Exclude<ShotOrderApprovalActionKind, "ready">;
}): {
  previewPaths: PreviewPath[];
  flyoverPlans: FlyoverPlan[];
  screenshotPlans: ScreenshotPlan[];
  showcaseSequences: ShowcaseSequence[];
} {
  const sequencingAction: Exclude<CameraShotSequencingActionKind, "ready"> =
    input.action === "approve-preview-route-order"
      ? "stabilize-preview-route"
      : input.action === "approve-flyover-order"
        ? "sequence-flyover-beats"
        : input.action === "approve-key-view-order"
          ? "sequence-key-view-set"
          : "sequence-showcase-flow";
  const sequenced = applyCameraShotSequencingAction({
    previewPaths: input.previewPaths,
    flyoverPlans: input.flyoverPlans,
    screenshotPlans: input.screenshotPlans,
    showcaseSequences: input.showcaseSequences,
    holeId: input.holeId,
    action: sequencingAction
  });
  const relevantPreviewPathIds = new Set(
    sequenced.previewPaths.filter((path) => path.holeRefs.includes(input.holeId)).map((path) => path.previewPathId),
  );
  const relevantScreenshotIds = new Set(
    sequenced.screenshotPlans
      .filter(
        (plan) =>
          plan.holeRef === input.holeId ||
          (plan.previewPathRef !== null && relevantPreviewPathIds.has(plan.previewPathRef)),
      )
      .map((plan) => plan.screenshotId),
  );
  const previewNote =
    input.action === "approve-preview-route-order"
      ? "Preview-route order was approved so the reveal lane now reads as a deliberate opening pass."
      : input.action === "approve-flyover-order"
        ? "Flyover order was approved so the motion reveal now reads as one calm sequence."
        : input.action === "approve-key-view-order"
          ? "Key-view order was approved so the still-image set now reads as one coherent packet."
          : "Showcase order was approved so the final reveal now lands in a share-ready rhythm.";
  const flyoverNote =
    input.action === "approve-preview-route-order"
      ? "Flyover order now tracks the approved preview-route cadence."
      : input.action === "approve-flyover-order"
        ? "Flyover order is approved for finish-stage proofing."
        : input.action === "approve-key-view-order"
          ? "Flyover beats now support the approved key-view order."
          : "Flyover beats now support the approved showcase order.";
  const screenshotNote =
    input.action === "approve-preview-route-order"
      ? "This still now follows the approved preview-route order."
      : input.action === "approve-flyover-order"
        ? "This still now lands on the approved flyover order."
        : input.action === "approve-key-view-order"
          ? "This key view is approved for the final reveal order."
          : "This still now supports the approved showcase order.";
  const showcaseNote =
    input.action === "approve-preview-route-order"
      ? "Showcase order now starts from the approved preview-route reveal."
      : input.action === "approve-flyover-order"
        ? "Showcase order now follows the approved flyover beat sequence."
        : input.action === "approve-key-view-order"
          ? "Showcase order now reads from the approved key-view set."
          : "Showcase order is approved for final packet proofing.";

  return {
    previewPaths: sequenced.previewPaths.map((path) =>
      path.holeRefs.includes(input.holeId)
        ? {
            ...path,
            readinessState:
              input.action === "approve-preview-route-order" || input.action === "approve-flyover-order"
                ? approveReadinessState(path.readinessState)
                : nextReadyState(path.readinessState),
            note: appendUniqueSentence(path.note, previewNote),
          }
        : path,
    ),
    flyoverPlans: sequenced.flyoverPlans.map((plan) =>
      plan.holeRef === input.holeId
        ? {
            ...plan,
            readinessState:
              input.action === "approve-flyover-order" || input.action === "approve-showcase-order"
                ? approveReadinessState(plan.readinessState)
                : nextReadyState(plan.readinessState),
            note: appendUniqueSentence(plan.note, flyoverNote),
          }
        : plan,
    ),
    screenshotPlans: sequenced.screenshotPlans.map((plan) =>
      plan.holeRef === input.holeId ||
      (plan.previewPathRef !== null && relevantPreviewPathIds.has(plan.previewPathRef))
        ? {
            ...plan,
            status:
              input.action === "approve-key-view-order" || input.action === "approve-showcase-order"
                ? "approved"
                : promoteScreenshotStatus(plan.status),
            framingNote: appendUniqueSentence(plan.framingNote, screenshotNote),
          }
        : plan,
    ),
    showcaseSequences: sequenced.showcaseSequences.map((sequence) =>
      sequence.shotRefs.some((shotRef) => relevantScreenshotIds.has(shotRef))
        ? {
            ...sequence,
            readinessState:
              input.action === "approve-showcase-order"
                ? approveReadinessState(sequence.readinessState)
                : nextReadyState(sequence.readinessState),
            note: appendUniqueSentence(sequence.note, showcaseNote),
          }
        : sequence,
    ),
  };
}

export function applyShotVariantSetAction(input: {
  previewPaths: PreviewPath[];
  flyoverPlans: FlyoverPlan[];
  screenshotPlans: ScreenshotPlan[];
  showcaseSequences: ShowcaseSequence[];
  holeId: string;
  action: Exclude<ShotVariantSetActionKind, "ready">;
}): {
  previewPaths: PreviewPath[];
  flyoverPlans: FlyoverPlan[];
  screenshotPlans: ScreenshotPlan[];
  showcaseSequences: ShowcaseSequence[];
} {
  const holeOrdinal = inferHoleOrdinal(input.holeId);

  if (input.action === "approve-primary-variant-set") {
    const primaryMeta = {
      variantSetId: createVariantSetId(input.holeId, "primary", "primary"),
      variantLabel: `Hole ${holeOrdinal || input.holeId} Primary Reveal`,
      variantRole: "primary" as const,
    };
    const primaryApprovalActions = [
      "approve-preview-route-order",
      "approve-flyover-order",
      "approve-key-view-order",
      "approve-showcase-order",
    ] as const;
    const primaryApproved = primaryApprovalActions.reduce(
      (state, action) =>
        applyShotOrderApprovalAction({
          ...state,
          holeId: input.holeId,
          action,
        }),
      {
        previewPaths: input.previewPaths,
        flyoverPlans: input.flyoverPlans,
        screenshotPlans: input.screenshotPlans,
        showcaseSequences: input.showcaseSequences,
      },
    );
    const relevantPreviewPathIds = new Set(
      primaryApproved.previewPaths.filter((path) => path.holeRefs.includes(input.holeId)).map((path) => path.previewPathId),
    );
    const relevantScreenshotIds = new Set(
      primaryApproved.screenshotPlans
        .filter(
          (plan) =>
            plan.holeRef === input.holeId ||
            (plan.previewPathRef !== null && relevantPreviewPathIds.has(plan.previewPathRef)),
        )
        .map((plan) => plan.screenshotId),
    );

    return {
      previewPaths: primaryApproved.previewPaths.map((path) =>
        path.holeRefs.includes(input.holeId)
          ? tagPreviewPathVariant(
              {
                ...path,
                readinessState: approveReadinessState(path.readinessState),
              },
              primaryMeta,
            )
          : path,
      ),
      flyoverPlans: primaryApproved.flyoverPlans.map((plan) =>
        plan.holeRef === input.holeId
          ? tagFlyoverVariant(
              {
                ...plan,
                readinessState: approveReadinessState(plan.readinessState),
              },
              primaryMeta,
            )
          : plan,
      ),
      screenshotPlans: primaryApproved.screenshotPlans.map((plan) =>
        plan.holeRef === input.holeId ||
        (plan.previewPathRef !== null && relevantPreviewPathIds.has(plan.previewPathRef))
          ? tagScreenshotVariant(
              {
                ...plan,
                status: "approved",
              },
              primaryMeta,
            )
          : plan,
      ),
      showcaseSequences: primaryApproved.showcaseSequences.map((sequence) =>
        sequence.shotRefs.some((shotRef) => relevantScreenshotIds.has(shotRef))
          ? tagShowcaseVariant(
              {
                ...sequence,
                readinessState: approveReadinessState(sequence.readinessState),
              },
              primaryMeta,
            )
          : sequence,
      ),
    };
  }

  if (input.action === "compose-alternate-flyover-variant") {
    const variantSetId = createVariantSetId(input.holeId, "alternate", "flyover");
    const variantLabel = `Hole ${holeOrdinal || input.holeId} Alternate Flyover`;
    const alternatePreviewPathId = `preview-flyover-alt-${input.holeId}`;
    const alternateFlyoverPlanId = `flyover-plan-alt-${input.holeId}`;
    const previewNote = "Alternate flyover variant was prepared so final share can choose a calmer backup reveal lane.";
    const flyoverNote = "Alternate flyover variant is ready as a backup motion reveal for the final share gate.";
    const existingPreviewPath = input.previewPaths.find((path) => path.previewPathId === alternatePreviewPathId);
    const existingFlyoverPlan = input.flyoverPlans.find((plan) => plan.flyoverPlanId === alternateFlyoverPlanId);

    return {
      previewPaths: existingPreviewPath
        ? input.previewPaths.map((path) =>
            path.previewPathId === alternatePreviewPathId
              ? tagPreviewPathVariant(
                  {
                    ...path,
                    readinessState: nextReadyState(path.readinessState),
                    note: appendUniqueSentence(path.note, previewNote),
                  },
                  { variantSetId, variantLabel, variantRole: "alternate" },
                )
              : path,
          )
        : [
            ...input.previewPaths,
            tagPreviewPathVariant(
              {
                previewPathId: alternatePreviewPathId,
                name: `Hole ${holeOrdinal || input.holeId} Alternate Flyover`,
                previewType: "flyover",
                holeRefs: [input.holeId],
                readinessState: "ready",
                outputStatus: "not-run",
                lastBuildRef: null,
                note: previewNote,
              },
              { variantSetId, variantLabel, variantRole: "alternate" },
            ),
          ],
      flyoverPlans: existingFlyoverPlan
        ? input.flyoverPlans.map((plan) =>
            plan.flyoverPlanId === alternateFlyoverPlanId
              ? tagFlyoverVariant(
                  {
                    ...plan,
                    previewPathRef: alternatePreviewPathId,
                    readinessState: nextReadyState(plan.readinessState),
                    note: appendUniqueSentence(plan.note, flyoverNote),
                  },
                  { variantSetId, variantLabel, variantRole: "alternate" },
                )
              : plan,
          )
        : [
            ...input.flyoverPlans,
            tagFlyoverVariant(
              createFlyoverPlan({
                flyoverPlanId: alternateFlyoverPlanId,
                holeRef: input.holeId,
                previewPathRef: alternatePreviewPathId,
                cameraIntent: `Provide an alternate flyover for Hole ${holeOrdinal || input.holeId} that stays calmer around landmark or framing pressure.`,
                introBeat: "Begin from a steadier reveal angle that still teaches the playable line.",
                outroBeat: "Finish on a calmer payoff angle that stays usable if the primary shot is too crowded.",
                durationSeconds: 16,
                readinessState: "ready",
                note: flyoverNote,
              }),
              { variantSetId, variantLabel, variantRole: "alternate" },
            ),
          ],
      screenshotPlans: input.screenshotPlans,
      showcaseSequences: input.showcaseSequences,
    };
  }

  if (input.action === "compose-alternate-key-view-variant") {
    const variantSetId = createVariantSetId(input.holeId, "alternate", "key-view");
    const variantLabel = `Hole ${holeOrdinal || input.holeId} Alternate Key Views`;
    const alternateScreenshotId = `shot-alt-${input.holeId}-hero`;
    const baseScreenshot =
      input.screenshotPlans.find((plan) => plan.holeRef === input.holeId) ??
      input.screenshotPlans[0] ??
      null;
    const existingScreenshot = input.screenshotPlans.find((plan) => plan.screenshotId === alternateScreenshotId);

    return {
      previewPaths: input.previewPaths,
      flyoverPlans: input.flyoverPlans,
      screenshotPlans: existingScreenshot
        ? input.screenshotPlans.map((plan) =>
            plan.screenshotId === alternateScreenshotId
              ? tagScreenshotVariant(
                  {
                    ...plan,
                    status: promoteScreenshotStatus(plan.status),
                    framingNote: appendUniqueSentence(
                      plan.framingNote,
                      "Alternate key-view variant is ready as a calmer still-image fallback for final share.",
                    ),
                  },
                  { variantSetId, variantLabel, variantRole: "alternate" },
                )
              : plan,
          )
        : [
            ...input.screenshotPlans,
            tagScreenshotVariant(
              {
                screenshotId: alternateScreenshotId,
                label: `Hole ${holeOrdinal || input.holeId} Alternate Hero`,
                holeRef: input.holeId,
                previewPathRef: baseScreenshot?.previewPathRef ?? null,
                framingNote:
                  "Alternate key-view variant for calmer proofing and final share selection.",
                status: "captured",
                outputStatus: "not-run",
                capturedAt: new Date().toISOString(),
                lastBuildRef: null,
              },
              { variantSetId, variantLabel, variantRole: "alternate" },
            ),
          ],
      showcaseSequences: input.showcaseSequences,
    };
  }

  const variantSetId = createVariantSetId(input.holeId, "alternate", "showcase");
  const variantLabel = `Hole ${holeOrdinal || input.holeId} Alternate Showcase`;
  const alternateShowcaseSequenceId = `showcase-sequence-alt-${input.holeId}`;
  const holeScreenshotIds = input.screenshotPlans
    .filter((plan) => plan.holeRef === input.holeId)
    .map((plan) => plan.screenshotId);
  const existingSequence = input.showcaseSequences.find(
    (sequence) => sequence.showcaseSequenceId === alternateShowcaseSequenceId,
  );

  return {
    previewPaths: input.previewPaths,
    flyoverPlans: input.flyoverPlans,
    screenshotPlans: input.screenshotPlans,
    showcaseSequences: existingSequence
      ? input.showcaseSequences.map((sequence) =>
          sequence.showcaseSequenceId === alternateShowcaseSequenceId
            ? tagShowcaseVariant(
                {
                  ...sequence,
                  readinessState: nextReadyState(sequence.readinessState),
                  note: appendUniqueSentence(
                    sequence.note,
                    "Alternate showcase variant is ready as a calmer pacing option for the final share gate.",
                  ),
                },
                { variantSetId, variantLabel, variantRole: "alternate" },
              )
            : sequence,
        )
      : [
          ...input.showcaseSequences,
          tagShowcaseVariant(
            createShowcaseSequence({
              showcaseSequenceId: alternateShowcaseSequenceId,
              title: `Hole ${holeOrdinal || input.holeId} Alternate Showcase`,
              shotRefs: holeScreenshotIds,
              narrativeGoal: "Provide a calmer alternate showcase pacing option for the final share gate.",
              readinessState: holeScreenshotIds.length > 0 ? "ready" : "draft",
              note: "Alternate showcase variant prepared for final share selection.",
            }),
            { variantSetId, variantLabel, variantRole: "alternate" },
          ),
      ],
  };
}

function resolveShotVariantShippingTarget(input: {
  previewPaths: PreviewPath[];
  flyoverPlans: FlyoverPlan[];
  screenshotPlans: ScreenshotPlan[];
  showcaseSequences: ShowcaseSequence[];
  holeId: string;
  action: Exclude<ShotVariantShippingDecisionActionKind, "prepare-variant-set-first" | "ready">;
}) {
  if (input.action === "select-primary-shipping-variant") {
    return (
      input.previewPaths.find(
        (path) => path.shotVariantRole === "primary" && variantBelongsToHole(path.shotVariantSetId, input.holeId),
      )?.shotVariantSetId ??
      input.flyoverPlans.find(
        (plan) => plan.shotVariantRole === "primary" && variantBelongsToHole(plan.shotVariantSetId, input.holeId),
      )?.shotVariantSetId ??
      input.screenshotPlans.find(
        (plan) => plan.shotVariantRole === "primary" && variantBelongsToHole(plan.shotVariantSetId, input.holeId),
      )?.shotVariantSetId ??
      input.showcaseSequences.find(
        (sequence) =>
          sequence.shotVariantRole === "primary" && variantBelongsToHole(sequence.shotVariantSetId, input.holeId),
      )?.shotVariantSetId ??
      null
    );
  }

  if (input.action === "select-alternate-flyover-shipping-variant") {
    return (
      input.flyoverPlans.find(
        (plan) =>
          plan.shotVariantRole === "alternate" && variantBelongsToHole(plan.shotVariantSetId, input.holeId),
      )?.shotVariantSetId ??
      input.previewPaths.find(
        (path) =>
          path.previewType === "flyover" &&
          path.shotVariantRole === "alternate" &&
          variantBelongsToHole(path.shotVariantSetId, input.holeId),
      )?.shotVariantSetId ??
      null
    );
  }

  if (input.action === "select-alternate-key-view-shipping-variant") {
    return (
      input.screenshotPlans.find(
        (plan) =>
          plan.shotVariantRole === "alternate" && variantBelongsToHole(plan.shotVariantSetId, input.holeId),
      )?.shotVariantSetId ?? null
    );
  }

  return (
    input.showcaseSequences.find(
      (sequence) =>
        sequence.shotVariantRole === "alternate" && variantBelongsToHole(sequence.shotVariantSetId, input.holeId),
    )?.shotVariantSetId ?? null
  );
}

export function applyShotVariantShippingDecisionAction(input: {
  previewPaths: PreviewPath[];
  flyoverPlans: FlyoverPlan[];
  screenshotPlans: ScreenshotPlan[];
  showcaseSequences: ShowcaseSequence[];
  holeId: string;
  action: Exclude<ShotVariantShippingDecisionActionKind, "prepare-variant-set-first" | "ready">;
}): {
  previewPaths: PreviewPath[];
  flyoverPlans: FlyoverPlan[];
  screenshotPlans: ScreenshotPlan[];
  showcaseSequences: ShowcaseSequence[];
} {
  const targetVariantSetId = resolveShotVariantShippingTarget(input);
  if (!targetVariantSetId) {
    return {
      previewPaths: input.previewPaths,
      flyoverPlans: input.flyoverPlans,
      screenshotPlans: input.screenshotPlans,
      showcaseSequences: input.showcaseSequences,
    };
  }

  const targetFamilies = new Set<"preview-route" | "flyover" | "key-view" | "showcase">(
    input.action === "select-primary-shipping-variant"
      ? ["preview-route", "flyover", "key-view", "showcase"]
      : input.action === "select-alternate-flyover-shipping-variant"
        ? ["flyover"]
        : input.action === "select-alternate-key-view-shipping-variant"
          ? ["key-view"]
          : ["showcase"],
  );

  return {
    previewPaths: input.previewPaths.map((path) =>
      selectVariantShippingState(
        path,
        input.holeId,
        targetVariantSetId,
        path.previewType === "minimap" ? ["preview-route"] : path.previewType === "flyover" ? ["flyover"] : [],
        targetFamilies,
      ),
    ),
    flyoverPlans: input.flyoverPlans.map((plan) =>
      selectVariantShippingState(plan, input.holeId, targetVariantSetId, ["flyover"], targetFamilies),
    ),
    screenshotPlans: input.screenshotPlans.map((plan) =>
      selectVariantShippingState(plan, input.holeId, targetVariantSetId, ["key-view"], targetFamilies),
    ),
    showcaseSequences: input.showcaseSequences.map((sequence) =>
      selectVariantShippingState(sequence, input.holeId, targetVariantSetId, ["showcase"], targetFamilies),
    ),
  };
}

export function synchronizePreviewProductionState(input: {
  previewPaths: PreviewPath[];
  flyoverPlans: FlyoverPlan[];
  screenshotPlans: ScreenshotPlan[];
  showcaseSequences: ShowcaseSequence[];
  buildId: string;
  buildSucceeded: boolean;
}) {
  const nextOutputStatus: PreviewOutputStatus = input.buildSucceeded ? "generated" : "failed";
  const missingOutputStatus: PreviewOutputStatus = input.buildSucceeded ? "missing" : "failed";

  return {
    previewPaths: input.previewPaths.map((path) => ({
      ...path,
      lastBuildRef: input.buildId,
      outputStatus:
        path.readinessState === "approved" || path.readinessState === "ready"
          ? nextOutputStatus
          : missingOutputStatus
    })),
    flyoverPlans: input.flyoverPlans.map((plan) => ({
      ...plan,
      lastBuildRef: input.buildId,
      outputStatus:
        plan.readinessState === "approved" || plan.readinessState === "ready"
          ? nextOutputStatus
          : missingOutputStatus
    })),
    screenshotPlans: input.screenshotPlans.map((plan) => ({
      ...plan,
      lastBuildRef: input.buildId,
      outputStatus: plan.status === "approved" ? nextOutputStatus : missingOutputStatus
    })),
    showcaseSequences: input.showcaseSequences.map((sequence) => ({
      ...sequence,
      lastBuildRef: input.buildId,
      outputStatus:
        sequence.readinessState === "approved" || sequence.readinessState === "ready"
          ? nextOutputStatus
          : missingOutputStatus
    }))
  };
}

export function summarizePreviewOperationalFlow(input: {
  previewPaths: PreviewPath[];
  flyoverPlans: FlyoverPlan[];
  screenshotPlans: ScreenshotPlan[];
  showcaseSequences: ShowcaseSequence[];
  holeCount: number;
  latestBuildId?: string | null;
}) {
  const readiness = summarizePreviewReadiness(input);
  const issues: PreviewOperationalIssue[] = [];
  const linkedOutputs = [
    ...input.previewPaths,
    ...input.flyoverPlans,
    ...input.screenshotPlans,
    ...input.showcaseSequences
  ];
  const staleOutputCount = linkedOutputs.filter(
    (entry) => input.latestBuildId && entry.lastBuildRef && entry.lastBuildRef !== input.latestBuildId,
  ).length;
  const missingOutputCount = linkedOutputs.filter(
    (entry) => entry.lastBuildRef && entry.outputStatus === "missing",
  ).length;
  const failedOutputCount = linkedOutputs.filter(
    (entry) => entry.lastBuildRef && entry.outputStatus === "failed",
  ).length;
  const buildLinkedOutputCount = linkedOutputs.filter((entry) => Boolean(entry.lastBuildRef)).length;

  if (readiness.flyoverCoverage < 1) {
    issues.push({
      issueId: "preview-flyover-coverage",
      owner: "flyover",
      severity: "critical",
      title: "Flyover coverage is incomplete",
      summary: "Every playable hole needs flyover coverage before preview posture is trustworthy.",
      actionPath: "Preview Studio > Flyovers"
    });
  }

  if (readiness.minimapCoverage < 1) {
    issues.push({
      issueId: "preview-minimap-coverage",
      owner: "minimap",
      severity: "critical",
      title: "Minimap coverage is incomplete",
      summary: "Preview minimaps still do not cover every playable hole.",
      actionPath: "Preview Studio > Minimaps"
    });
  }

  if (readiness.screenshotApprovedCount === 0) {
    issues.push({
      issueId: "preview-screenshots-missing",
      owner: "screenshot",
      severity: "warning",
      title: "Approved release screenshots are missing",
      summary: "Preview and publish posture remain weak until at least one screenshot set is approved.",
      actionPath: "Preview Studio > Screenshots"
    });
  }

  if (readiness.showcaseReadyCount === 0) {
    issues.push({
      issueId: "preview-showcase-missing",
      owner: "showcase",
      severity: "warning",
      title: "Showcase sequence is not release-ready",
      summary: "A candidate release should have at least one ready showcase sequence to explain the course identity.",
      actionPath: "Preview Studio > Showcase Sequences"
    });
  }

  if (
    input.flyoverPlans.some((plan) => plan.lastBuildRef && plan.outputStatus !== "generated") ||
    input.previewPaths.some((path) => path.lastBuildRef && path.outputStatus !== "generated") ||
    input.screenshotPlans.some((plan) => plan.lastBuildRef && plan.outputStatus !== "generated") ||
    input.showcaseSequences.some((sequence) => sequence.lastBuildRef && sequence.outputStatus !== "generated")
  ) {
    issues.push({
      issueId: "preview-build-output-mismatch",
      owner: "showcase",
      severity: "warning",
      title: "Preview build outputs are incomplete",
      summary: "Some preview-facing items are linked to a build, but their generated output state is still missing or failed.",
      actionPath: "Preview Studio > Path Registry"
    });
  }

  if (
    input.latestBuildId &&
    (
      input.flyoverPlans.some((plan) => plan.lastBuildRef && plan.lastBuildRef !== input.latestBuildId) ||
      input.previewPaths.some((path) => path.lastBuildRef && path.lastBuildRef !== input.latestBuildId) ||
      input.screenshotPlans.some((plan) => plan.lastBuildRef && plan.lastBuildRef !== input.latestBuildId) ||
      input.showcaseSequences.some((sequence) => sequence.lastBuildRef && sequence.lastBuildRef !== input.latestBuildId)
    )
  ) {
    issues.push({
      issueId: "preview-build-output-stale",
      owner: "showcase",
      severity: "warning",
      title: "Preview outputs are stale against the latest build",
      summary: "Some preview-facing outputs still point at an older build instead of the latest release run.",
      actionPath: "Preview Studio > Release Linkage"
    });
  }

  return {
    readiness,
    staleOutputCount,
    missingOutputCount,
    failedOutputCount,
    buildLinkedOutputCount,
    issues,
    nextAction:
      issues[0]?.summary ??
      "Preview posture is clear enough for package and publish handoff."
  };
}
