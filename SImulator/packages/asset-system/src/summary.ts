import type { Asset, AssetCategory } from "./models";
import { getImportQueueBuckets } from "./services";

export type AssetLibrarySummary = {
  totalAssets: number;
  approvedAssets: number;
  pendingApprovalCount: number;
  rejectedAssets: number;
  queueDepth: number;
  blockedImportCount: number;
  normalizationReviewCount: number;
  analysisPendingCount: number;
  analysisCoveragePercent: number;
  categories: string[];
  styleTags: string[];
};

export type AssetContentPackSummary = {
  packId: string;
  label: string;
  assetCount: number;
  approvedAssetCount: number;
  blockedAssetCount: number;
  readyForPlacementCount: number;
  categories: string[];
  styleTags: string[];
  dominantQueueState: "queued" | "review" | "blocked" | "cataloged";
  note: string;
};

export type AssetPlacementPaletteEntry = {
  assetId: string;
  label: string;
  assetCategory: AssetCategory;
  sceneCategory:
    | "structure"
    | "prop"
    | "landmark"
    | "vegetation"
    | "supporting-scenery"
    | "animated-set-piece"
    | "gameplay-course-object";
  packId: string;
  packLabel: string;
  styleTags: string[];
  brushEligible: boolean;
  footprintRadiusMeters: number;
  note: string;
};

function normalizePackId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getAssetContentPackIdentity(asset: Asset) {
  const label =
    asset.source.packageName ??
    asset.source.providerName ??
    (asset.styleTags[0]
      ? `${asset.styleTags[0].charAt(0).toUpperCase()}${asset.styleTags[0].slice(1)} Collection`
      : "Unsorted Content");

  return {
    packId: normalizePackId(label) || "unsorted-content",
    label
  };
}

export function summarizeAssetLibrary(assets: Asset[]): AssetLibrarySummary {
  const queueBuckets = getImportQueueBuckets(assets);
  const pendingApprovalCount = assets.filter((asset) => asset.approvalStatus === "pending").length;
  const rejectedAssets = assets.filter((asset) => asset.approvalStatus === "rejected").length;
  const approvedAssets = assets.filter((asset) => asset.approvalStatus === "approved").length;
  const normalizationReviewCount = assets.filter(
    (asset) =>
      asset.normalizationState !== "normalized" ||
      asset.scaleStatus !== "normalized" ||
      asset.orientationStatus !== "ready",
  ).length;
  const analysisPendingCount = assets.filter(
    (asset) => asset.analysis.analysisStatus === "not-started" || asset.analysis.complexityGrade === null,
  ).length;
  const categories = [...new Set(assets.map((asset) => asset.category))].sort();
  const styleTags = [...new Set(assets.flatMap((asset) => asset.styleTags))].sort();
  const queueDepth = queueBuckets.reduce((total, bucket) => total + bucket.assets.length, 0);
  const analyzedAssets = assets.filter((asset) => asset.analysis.analysisStatus !== "not-started").length;

  return {
    totalAssets: assets.length,
    approvedAssets,
    pendingApprovalCount,
    rejectedAssets,
    queueDepth,
    blockedImportCount: queueBuckets.find((bucket) => bucket.bucketId === "blocked")?.assets.length ?? 0,
    normalizationReviewCount,
    analysisPendingCount,
    analysisCoveragePercent: assets.length === 0 ? 0 : Math.round((analyzedAssets / assets.length) * 100),
    categories,
    styleTags
  };
}

export function summarizeAssetContentPacks(assets: Asset[]): AssetContentPackSummary[] {
  const groups = new Map<string, Asset[]>();

  for (const asset of assets) {
    const identity = getAssetContentPackIdentity(asset);
    const current = groups.get(identity.packId) ?? [];
    current.push(asset);
    groups.set(identity.packId, current);
  }

  return [...groups.entries()]
    .map(([packId, packAssets]) => {
      const label =
        packAssets[0]?.source.packageName ??
        packAssets[0]?.source.providerName ??
        "Unsorted Content";
      const approvedAssetCount = packAssets.filter((asset) => asset.approvalStatus === "approved").length;
      const blockedAssetCount = packAssets.filter((asset) => asset.queueState === "blocked").length;
      const readyForPlacementCount = packAssets.filter(
        (asset) => asset.approvalStatus === "approved" && asset.queueState === "cataloged",
      ).length;
      const categories = [...new Set(packAssets.map((asset) => asset.category))].sort();
      const styleTags = [...new Set(packAssets.flatMap((asset) => asset.styleTags))].sort();
      const dominantQueueState =
        blockedAssetCount > 0
          ? "blocked"
          : packAssets.some((asset) => asset.queueState === "ready-for-review")
            ? "review"
            : packAssets.some((asset) => asset.queueState === "queued" || asset.queueState === "ingesting")
              ? "queued"
              : "cataloged";

      return {
        packId,
        label,
        assetCount: packAssets.length,
        approvedAssetCount,
        blockedAssetCount,
        readyForPlacementCount,
        categories,
        styleTags,
        dominantQueueState,
        note:
          readyForPlacementCount > 0
            ? `${readyForPlacementCount} assets are ready for placement and brush-based worldbuilding.`
            : blockedAssetCount > 0
              ? "This pack still has blocked assets that need correction before it is safe to rely on."
              : "This pack still needs review before it becomes a dependable Build palette."
      } satisfies AssetContentPackSummary;
    })
    .sort((left, right) => {
      if (left.readyForPlacementCount !== right.readyForPlacementCount) {
        return right.readyForPlacementCount - left.readyForPlacementCount;
      }

      return right.assetCount - left.assetCount;
    });
}

function mapAssetCategoryToSceneCategory(category: AssetCategory): AssetPlacementPaletteEntry["sceneCategory"] {
  switch (category) {
    case "architecture":
      return "structure";
    case "landmark":
      return "landmark";
    case "vegetation":
      return "vegetation";
    case "effects":
    case "lighting":
      return "animated-set-piece";
    case "gameplay":
      return "gameplay-course-object";
    case "transport":
    case "signage":
    case "terrain":
    case "water":
    case "props":
    default:
      return "supporting-scenery";
  }
}

export function listAssetPlacementPalette(
  assets: Asset[],
  options?: {
    packId?: string | null;
    categories?: AssetCategory[];
  },
): AssetPlacementPaletteEntry[] {
  const categoryFilter = new Set(options?.categories ?? []);

  return assets
    .filter(
      (asset) =>
        asset.approvalStatus === "approved" &&
        asset.queueState === "cataloged" &&
        (options?.packId ? getAssetContentPackIdentity(asset).packId === options.packId : true) &&
        (categoryFilter.size > 0 ? categoryFilter.has(asset.category) : true),
    )
    .map((asset) => {
      const packIdentity = getAssetContentPackIdentity(asset);
      const sceneCategory = mapAssetCategoryToSceneCategory(asset.category);
      const brushEligible =
        sceneCategory === "vegetation" ||
        sceneCategory === "supporting-scenery" ||
        sceneCategory === "prop";
      const footprintRadiusMeters =
        sceneCategory === "structure" || sceneCategory === "landmark"
          ? 7.5
          : sceneCategory === "vegetation"
            ? 4.5
            : sceneCategory === "animated-set-piece"
              ? 6.5
              : 5.5;

      return {
        assetId: asset.assetId,
        label: asset.displayName,
        assetCategory: asset.category,
        sceneCategory,
        packId: packIdentity.packId,
        packLabel: packIdentity.label,
        styleTags: asset.styleTags,
        brushEligible,
        footprintRadiusMeters,
        note:
          brushEligible
            ? "Ready for direct placement or brush-based world dressing."
            : "Ready for hero placement and contextual editing."
      } satisfies AssetPlacementPaletteEntry;
    })
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function listRecentPlacementPaletteEntries(
  entries: AssetPlacementPaletteEntry[],
  recentAssetRefs: string[],
  limit = 6,
) {
  const entryMap = new Map(entries.map((entry) => [entry.assetId, entry]));
  const recentEntries: AssetPlacementPaletteEntry[] = [];

  for (const assetRef of recentAssetRefs) {
    const entry = entryMap.get(assetRef);
    if (!entry || recentEntries.some((candidate) => candidate.assetId === entry.assetId)) {
      continue;
    }

    recentEntries.push(entry);

    if (recentEntries.length >= limit) {
      break;
    }
  }

  return recentEntries;
}
