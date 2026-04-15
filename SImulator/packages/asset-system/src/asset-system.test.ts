import { describe, expect, it } from "vitest";

import { createAssetRecord } from "./create";
import { filterAssets, getAssetNextAction, getImportQueueBuckets, updateAssetRecord } from "./services";
import {
  getAssetContentPackIdentity,
  listAssetPlacementPalette,
  listRecentPlacementPaletteEntries,
  summarizeAssetLibrary
} from "./summary";

describe("asset-system", () => {
  it("creates a typed asset record with safe defaults", () => {
    const asset = createAssetRecord({
      displayName: "Harbor Banner Rig",
      source: { sourceType: "licensed", providerName: "EnviroGuild" },
      styleTags: ["premium", "harbor"]
    });

    expect(asset.assetId).toBe("asset-harbor-banner-rig");
    expect(asset.queueState).toBe("queued");
    expect(asset.analysis.analysisStatus).toBe("not-started");
    expect(asset.approvalStatus).toBe("pending");
  });

  it("filters and summarizes the library for UI state", () => {
    const assets = [
      createAssetRecord({
        displayName: "Marina Arch",
        source: { sourceType: "licensed", providerName: "Theme Foundry" },
        category: "architecture",
        styleTags: ["premium", "harbor"],
        normalizationState: "normalized",
        scaleStatus: "normalized",
        orientationStatus: "ready",
        approvalStatus: "approved",
        queueState: "cataloged",
        analysis: {
          analysisStatus: "verified",
          polyEstimate: 82000,
          materialCount: 6,
          textureCount: 12,
          textureMemoryEstimateMb: 486,
          animationClipCount: 0,
          complexityGrade: "moderate"
        }
      }),
      createAssetRecord({
        displayName: "Skyloop Ring",
        source: { sourceType: "kitbash", providerName: "RideWorks" },
        category: "landmark",
        styleTags: ["showcase", "kinetic"],
        queueState: "blocked"
      })
    ];

    const filtered = filterAssets(assets, {
      query: "marina",
      category: "all",
      approvalStatus: "all",
      queueState: "all",
      styleTag: "all"
    });
    const summary = summarizeAssetLibrary(assets);
    const queueBuckets = getImportQueueBuckets(assets);

    expect(filtered).toHaveLength(1);
    expect(summary.totalAssets).toBe(2);
    expect(summary.blockedImportCount).toBe(1);
    expect(summary.analysisCoveragePercent).toBe(50);
    expect(queueBuckets.find((bucket) => bucket.bucketId === "blocked")?.assets).toHaveLength(1);
  });

  it("updates an asset and exposes the right next action", () => {
    const updatedAssets = updateAssetRecord(
      [
        createAssetRecord({
          displayName: "Garden Fountain",
          source: { sourceType: "scratch" }
        })
      ],
      "asset-garden-fountain",
      (current) => ({
        ...current,
        queueState: "ready-for-review",
        normalizationState: "needs-review",
        scaleStatus: "mismatch"
        }),
    );
    const asset = updatedAssets[0]!;

    expect(asset.scaleStatus).toBe("mismatch");
    expect(getAssetNextAction(asset)).toContain("Correct normalization");
  });

  it("derives stable content-pack identities for browsing flows", () => {
    const asset = createAssetRecord({
      displayName: "Boardwalk Lantern Cluster",
      source: {
        sourceType: "licensed",
        providerName: "Theme Harbor",
        packageName: "Twilight Boardwalk"
      },
      styleTags: ["premium", "festival"]
    });

    expect(getAssetContentPackIdentity(asset)).toEqual({
      packId: "twilight-boardwalk",
      label: "Twilight Boardwalk"
    });
  });

  it("builds a placement palette for approved content-pack assets", () => {
    const assets = [
      createAssetRecord({
        displayName: "Festival Pine Cluster",
        source: {
          sourceType: "licensed",
          providerName: "Theme Harbor",
          packageName: "Twilight Boardwalk"
        },
        category: "vegetation",
        styleTags: ["festival", "night"],
        approvalStatus: "approved",
        queueState: "cataloged",
        normalizationState: "normalized",
        scaleStatus: "normalized",
        orientationStatus: "ready"
      }),
      createAssetRecord({
        displayName: "Blocked Bench",
        source: {
          sourceType: "licensed",
          providerName: "Theme Harbor",
          packageName: "Twilight Boardwalk"
        },
        category: "props",
        approvalStatus: "pending",
        queueState: "ready-for-review"
      })
    ];

    const palette = listAssetPlacementPalette(assets, {
      packId: "twilight-boardwalk"
    });

    expect(palette).toHaveLength(1);
    expect(palette[0]?.sceneCategory).toBe("vegetation");
    expect(palette[0]?.brushEligible).toBe(true);
    expect(palette[0]?.footprintRadiusMeters).toBeGreaterThan(0);
  });

  it("surfaces recent placement entries without duplicating older repeats", () => {
    const assets = [
      createAssetRecord({
        displayName: "Festival Pine Cluster",
        source: {
          sourceType: "licensed",
          providerName: "Theme Harbor",
          packageName: "Twilight Boardwalk"
        },
        category: "vegetation",
        styleTags: ["festival", "night"],
        approvalStatus: "approved",
        queueState: "cataloged",
        normalizationState: "normalized",
        scaleStatus: "normalized",
        orientationStatus: "ready"
      }),
      createAssetRecord({
        displayName: "Boardwalk Lamp",
        source: {
          sourceType: "licensed",
          providerName: "Theme Harbor",
          packageName: "Twilight Boardwalk"
        },
        category: "props",
        styleTags: ["festival"],
        approvalStatus: "approved",
        queueState: "cataloged",
        normalizationState: "normalized",
        scaleStatus: "normalized",
        orientationStatus: "ready"
      })
    ];

    const palette = listAssetPlacementPalette(assets);
    const recent = listRecentPlacementPaletteEntries(
      palette,
      ["asset-boardwalk-lamp", "asset-festival-pine-cluster", "asset-boardwalk-lamp"],
      4,
    );

    expect(recent.map((entry) => entry.assetId)).toEqual([
      "asset-boardwalk-lamp",
      "asset-festival-pine-cluster"
    ]);
  });
});
