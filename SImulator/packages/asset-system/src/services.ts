import { assetSchema, type ApprovalStatus, type Asset, type AssetCategory, type ImportQueueState } from "./models";

export type AssetBrowserView = "grid" | "list";

export type AssetFilterState = {
  query: string;
  category: AssetCategory | "all";
  approvalStatus: ApprovalStatus | "all";
  queueState: ImportQueueState | "all";
  styleTag: string | "all";
};

export type AssetQueueBucket = {
  bucketId: "intake" | "review" | "blocked";
  label: string;
  description: string;
  assets: Asset[];
};

function normalizeForSearch(value: string) {
  return value.trim().toLowerCase();
}

export function filterAssets(assets: Asset[], filters: AssetFilterState) {
  const query = normalizeForSearch(filters.query);

  return assets.filter((asset) => {
    const matchesQuery =
      query.length === 0 ||
      [
        asset.displayName,
        asset.category,
        asset.source.providerName,
        asset.notes,
        asset.source.licenseSummary,
        asset.styleTags.join(" ")
      ]
        .filter(Boolean)
        .some((value) => normalizeForSearch(String(value)).includes(query));

    const matchesCategory = filters.category === "all" || asset.category === filters.category;
    const matchesApproval =
      filters.approvalStatus === "all" || asset.approvalStatus === filters.approvalStatus;
    const matchesQueue = filters.queueState === "all" || asset.queueState === filters.queueState;
    const matchesTag =
      filters.styleTag === "all" || asset.styleTags.some((tag) => tag === filters.styleTag);

    return matchesQuery && matchesCategory && matchesApproval && matchesQueue && matchesTag;
  });
}

export function updateAssetRecord(
  assets: Asset[],
  assetId: string,
  updater: Asset | ((asset: Asset) => Asset),
) {
  return assets.map((asset) => {
    if (asset.assetId !== assetId) {
      return asset;
    }

    const nextAsset = typeof updater === "function" ? updater(asset) : updater;
    return assetSchema.parse(nextAsset);
  });
}

export function getImportQueueBuckets(assets: Asset[]): AssetQueueBucket[] {
  return [
    {
      bucketId: "intake",
      label: "Intake",
      description: "Raw imports still entering the library and awaiting the first pass.",
      assets: assets.filter((asset) => asset.queueState === "queued" || asset.queueState === "ingesting")
    },
    {
      bucketId: "review",
      label: "Ready for Review",
      description: "Normalization or analysis work is complete enough for human review.",
      assets: assets.filter((asset) => asset.queueState === "ready-for-review")
    },
    {
      bucketId: "blocked",
      label: "Blocked",
      description: "These assets are stalled by scale, orientation, or quality issues.",
      assets: assets.filter((asset) => asset.queueState === "blocked")
    }
  ];
}

export function getAssetNextAction(asset: Asset) {
  if (asset.queueState === "queued") {
    return "Begin ingest and establish the first normalization pass.";
  }

  if (asset.queueState === "ingesting") {
    return "Finish ingest, capture early analysis metrics, and move the asset into review.";
  }

  if (asset.queueState === "blocked") {
    return "Resolve the blocker or reject the asset before worldbuilding depends on it.";
  }

  if (
    asset.normalizationState !== "normalized" ||
    asset.scaleStatus !== "normalized" ||
    asset.orientationStatus !== "ready"
  ) {
    return "Correct normalization, scale, and orientation before approval.";
  }

  if (asset.approvalStatus === "pending") {
    return "Approve or reject once tags, metrics, and source notes are confirmed.";
  }

  if (asset.approvalStatus === "rejected") {
    return "Keep this asset out of world placement until it is replaced or reworked.";
  }

  return "Ready for world placement, performance review, and package dependency checks.";
}

export function formatAssetDimensions(asset: Asset) {
  if (!asset.dimensions) {
    return "Dimensions pending";
  }

  const { widthMeters, depthMeters, heightMeters } = asset.dimensions;
  return `${widthMeters}m × ${depthMeters}m × ${heightMeters}m`;
}
