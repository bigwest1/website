import {
  placementAssetDraftSchema,
  type PlacementAssetDraft,
  type AuthoringPreviewSource
} from "@course-creator-os/scene-authoring";

export const PLACEMENT_DRAG_MIME = "application/x-course-creator-placement-draft";

export type PlacementDragPayload = {
  draft: PlacementAssetDraft;
  source: AuthoringPreviewSource;
};

export function writePlacementDragPayload(
  dataTransfer: DataTransfer | null,
  payload: PlacementDragPayload,
) {
  if (!dataTransfer) {
    return;
  }

  dataTransfer.effectAllowed = "copy";
  dataTransfer.setData(
    PLACEMENT_DRAG_MIME,
    JSON.stringify({
      draft: payload.draft,
      source: payload.source
    }),
  );
  dataTransfer.setData("text/plain", payload.draft.label);
}

export function readPlacementDragPayload(dataTransfer: DataTransfer | null): PlacementDragPayload | null {
  if (!dataTransfer) {
    return null;
  }

  const raw = dataTransfer.getData(PLACEMENT_DRAG_MIME);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      draft?: unknown;
      source?: unknown;
    };
    const draftResult = placementAssetDraftSchema.safeParse(parsed.draft);
    if (!draftResult.success) {
      return null;
    }

    const source =
      parsed.source === "content-pack" || parsed.source === "asset-library" || parsed.source === "viewport-arm"
        ? parsed.source
        : "content-pack";

    return {
      draft: draftResult.data,
      source
    };
  } catch {
    return null;
  }
}
