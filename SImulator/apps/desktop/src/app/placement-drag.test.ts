import { describe, expect, it } from "vitest";

import { createPlacementAssetDraft } from "@course-creator-os/scene-authoring";

import {
  PLACEMENT_DRAG_MIME,
  readPlacementDragPayload,
  writePlacementDragPayload
} from "./placement-drag";

function createMockDataTransfer() {
  const store = new Map<string, string>();

  return {
    effectAllowed: "uninitialized",
    setData(type: string, value: string) {
      store.set(type, value);
    },
    getData(type: string) {
      return store.get(type) ?? "";
    }
  } as unknown as DataTransfer;
}

describe("placement drag payloads", () => {
  it("round-trips placement drafts through the drag payload MIME type", () => {
    const dataTransfer = createMockDataTransfer();
    const draft = createPlacementAssetDraft({
      draftId: "placement-draft-boulder-stack",
      assetRef: "asset-boulder-stack",
      label: "Boulder Stack",
      objectType: "boulder-cluster",
      category: "supporting-scenery",
      packId: "northwoods",
      footprintRadiusMeters: 7
    });

    writePlacementDragPayload(dataTransfer, {
      draft,
      source: "asset-library"
    });

    const payload = readPlacementDragPayload(dataTransfer);

    expect(dataTransfer.getData(PLACEMENT_DRAG_MIME)).toContain("asset-boulder-stack");
    expect(payload).not.toBeNull();
    expect(payload?.draft.assetRef).toBe("asset-boulder-stack");
    expect(payload?.draft.footprintRadiusMeters).toBe(7);
    expect(payload?.source).toBe("asset-library");
  });

  it("rejects invalid drag payloads safely", () => {
    const dataTransfer = createMockDataTransfer();
    dataTransfer.setData(PLACEMENT_DRAG_MIME, JSON.stringify({ draft: { nope: true } }));

    expect(readPlacementDragPayload(dataTransfer)).toBeNull();
  });
});
