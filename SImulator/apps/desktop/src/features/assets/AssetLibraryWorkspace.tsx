import { useEffect, useState } from "react";

import {
  assetCategories,
  createAssetRecord,
  filterAssets,
  getAssetContentPackIdentity,
  formatAssetDimensions,
  getAssetNextAction,
  getImportQueueBuckets,
  importQueueStates,
  listAssetPlacementPalette,
  summarizeAssetContentPacks,
  summarizeAssetLibrary,
  updateAssetRecord,
  type ApprovalStatus,
  type Asset,
  type AssetBrowserView,
  type AssetCategory,
  type ImportQueueState
} from "@course-creator-os/asset-system";
import {
  Button,
  EmptyStatePanel,
  Inline,
  MetricChip,
  SectionHeader,
  SelectField,
  SurfaceCard,
  TextAreaField,
  TextField,
  TogglePillGroup
} from "@course-creator-os/ui";
import {
  addPlacementDraftsToSceneryBrush,
  createPlacementAssetDraft,
  setActivePlacementDraft,
  updateSceneryBrushSettings,
  updateViewportState
} from "@course-creator-os/scene-authoring";

import { writePlacementDragPayload } from "../../app/placement-drag";
import { updateAssets, updateSceneAuthoringState, useProjectSession } from "../../app/project-session";
import { StatusPill } from "../../components/StatusPill";
import { ValidationIssueCard } from "../../components/ValidationIssueCard";

const approvalOptions: Array<{ label: string; value: ApprovalStatus | "all" }> = [
  { label: "All approvals", value: "all" },
  { label: "Approved", value: "approved" },
  { label: "Pending", value: "pending" },
  { label: "Rejected", value: "rejected" }
];

const queueOptions: Array<{ label: string; value: ImportQueueState | "all" }> = [
  { label: "All queue states", value: "all" },
  ...importQueueStates.map((value) => ({ label: humanize(value), value }))
];

const categoryOptions: Array<{ label: string; value: AssetCategory | "all" }> = [
  { label: "All categories", value: "all" },
  ...assetCategories.map((value) => ({ label: humanize(value), value }))
];

const viewOptions: Array<{ label: string; value: AssetBrowserView }> = [
  { label: "Grid", value: "grid" },
  { label: "List", value: "list" }
];

function humanize(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toneForApproval(status: ApprovalStatus) {
  switch (status) {
    case "approved":
      return "success";
    case "pending":
      return "warning";
    case "rejected":
      return "danger";
    default:
      return "default";
  }
}

function toneForQueueState(queueState: ImportQueueState) {
  switch (queueState) {
    case "cataloged":
      return "success";
    case "ready-for-review":
      return "info";
    case "blocked":
      return "danger";
    case "ingesting":
      return "warning";
    case "queued":
    default:
      return "default";
  }
}

function formatMetric(value: number | null, suffix: string) {
  return value === null ? "Pending" : `${value.toLocaleString()} ${suffix}`;
}

function formatTextureMemory(value: number | null) {
  return value === null ? "Pending" : `${value.toLocaleString()} MB`;
}

function buildStyleTagString(asset: Asset) {
  return asset.styleTags.join(", ");
}

function createPlacementDraftFromAsset(asset: Asset) {
  const packIdentity = getAssetContentPackIdentity(asset);
  return createPlacementAssetDraft({
    draftId: `placement-draft-${asset.assetId}`,
    assetRef: asset.assetId,
    label: asset.displayName,
    objectType: asset.category,
    category:
      asset.category === "architecture"
        ? "structure"
        : asset.category === "landmark"
          ? "landmark"
          : asset.category === "vegetation"
            ? "vegetation"
            : asset.category === "gameplay"
              ? "gameplay-course-object"
              : asset.category === "effects" || asset.category === "lighting"
                ? "animated-set-piece"
                : "supporting-scenery",
    packId: packIdentity.packId,
    tags: asset.styleTags,
    placementRules:
      asset.category === "vegetation"
        ? ["scatter", "avoid-playable-core"]
        : asset.category === "architecture" || asset.category === "landmark"
          ? ["hero-placement"]
          : ["scatter"]
  });
}

export function AssetLibraryWorkspace() {
  const { project, validationReport } = useProjectSession();
  const [viewMode, setViewMode] = useState<AssetBrowserView>("grid");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | "all">("all");
  const [approvalFilter, setApprovalFilter] = useState<ApprovalStatus | "all">("all");
  const [queueFilter, setQueueFilter] = useState<ImportQueueState | "all">("all");
  const [tagFilter, setTagFilter] = useState<string | "all">("all");
  const [selectedPackId, setSelectedPackId] = useState<string | "all">("all");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(project.assets[0]?.assetId ?? null);

  const summary = summarizeAssetLibrary(project.assets);
  const contentPacks = summarizeAssetContentPacks(project.assets);
  const placementPalette = listAssetPlacementPalette(project.assets);
  const libraryFilteredAssets = filterAssets(project.assets, {
    query,
    category: categoryFilter,
    approvalStatus: approvalFilter,
    queueState: queueFilter,
    styleTag: tagFilter
  });
  const filteredAssets = libraryFilteredAssets.filter((asset) =>
    selectedPackId === "all" ? true : getAssetContentPackIdentity(asset).packId === selectedPackId,
  );
  const selectedPack =
    selectedPackId === "all" ? null : contentPacks.find((pack) => pack.packId === selectedPackId) ?? null;
  const selectedAsset = project.assets.find((asset) => asset.assetId === selectedAssetId) ?? null;
  const selectedAssetPlacementEntry =
    selectedAsset ? placementPalette.find((entry) => entry.assetId === selectedAsset.assetId) ?? null : null;
  const selectedPackPlacementEntries = selectedPack
    ? placementPalette.filter((entry) => entry.packId === selectedPack.packId)
    : placementPalette;
  const queueBuckets = getImportQueueBuckets(project.assets);
  const relevantIssues = validationReport.issues.filter(
    (issue) =>
      issue.ownerModule === "asset-library" &&
      (!selectedAsset || issue.relatedEntityId === null || issue.relatedEntityId === selectedAsset.assetId),
  );

  useEffect(() => {
    if (selectedPackId !== "all" && !contentPacks.some((pack) => pack.packId === selectedPackId)) {
      setSelectedPackId("all");
    }
  }, [contentPacks, selectedPackId]);

  useEffect(() => {
    if (filteredAssets.length === 0) {
      if (project.assets.length === 0 && selectedAssetId !== null) {
        setSelectedAssetId(null);
      }
      return;
    }

    if (!selectedAssetId || !filteredAssets.some((asset) => asset.assetId === selectedAssetId)) {
      setSelectedAssetId(filteredAssets[0]?.assetId ?? null);
    }
  }, [filteredAssets, project.assets.length, selectedAssetId]);

  function patchAsset(assetId: string, updater: (asset: Asset) => Asset) {
    updateAssets((assets) => updateAssetRecord(assets, assetId, updater));
  }

  function resetFilters() {
    setQuery("");
    setCategoryFilter("all");
    setApprovalFilter("all");
    setQueueFilter("all");
    setTagFilter("all");
    setSelectedPackId("all");
  }

  function armAssetForPlacement(asset: Asset) {
    const draft = createPlacementDraftFromAsset(asset);
    updateSceneAuthoringState((state) =>
      setActivePlacementDraft(
        updateViewportState(state, {
          ...state.viewportState,
          authoringMode: "placement"
        }),
        draft,
      ),
    );
  }

  function addAssetToBrush(asset: Asset) {
    const draft = createPlacementDraftFromAsset(asset);
    updateSceneAuthoringState((state) =>
      updateSceneryBrushSettings(
        addPlacementDraftsToSceneryBrush(
          updateViewportState(state, {
            ...state.viewportState,
            authoringMode: "scenery-brush"
          }),
          [draft],
        ),
        {
          activePackId: draft.packId,
          categoryFilters: draft.category === "vegetation" ? ["vegetation"] : [draft.category]
        },
      ),
    );
  }

  function startAssetDrag(event: React.DragEvent<HTMLElement>, asset: Asset) {
    writePlacementDragPayload(event.dataTransfer, {
      draft: createPlacementDraftFromAsset(asset),
      source: "asset-library"
    });
  }

  function loadPackIntoBrush() {
    if (selectedPackPlacementEntries.length === 0) {
      return;
    }

    updateSceneAuthoringState((state) =>
      updateSceneryBrushSettings(
        addPlacementDraftsToSceneryBrush(
          updateViewportState(state, {
            ...state.viewportState,
            authoringMode: "scenery-brush"
          }),
          selectedPackPlacementEntries
            .filter((entry) => entry.brushEligible)
            .map((entry) =>
              createPlacementAssetDraft({
                draftId: `placement-draft-${entry.assetId}`,
                assetRef: entry.assetId,
                label: entry.label,
                objectType: entry.assetCategory,
                category: entry.sceneCategory,
                packId: entry.packId,
                tags: entry.styleTags,
                placementRules: ["scatter"]
              }),
            ),
        ),
        {
          activePackId: selectedPack?.packId ?? null
        },
      ),
    );
  }

  function handleStagePlaceholder() {
    const nextIndex = project.assets.length + 1;
    const asset = createAssetRecord({
      displayName: `Queued Intake ${nextIndex}`,
      source: {
        sourceType: "licensed",
        providerName: "Pending Source Review",
        licenseSummary: "Source and license notes still need to be captured."
      },
      category: nextIndex % 2 === 0 ? "props" : "architecture",
      styleTags: ["premium"],
      queueState: "queued",
      notes: "Manual intake placeholder created inside Asset Library."
    });

    updateAssets((assets) => [...assets, asset]);
    setSelectedAssetId(asset.assetId);
  }

  return (
    <div className="asset-library-shell">
      <section className="panel asset-library-summary-panel">
        <SectionHeader
          eyebrow="Asset Library"
          title="Import, normalize, approve, and track course content"
          description="Keep source quality, style fit, and normalization health visible before World Builder depends on bad content."
          actions={
            <Inline gap={2}>
              <StatusPill label={`${summary.totalAssets} tracked`} tone="info" />
              <Button onClick={handleStagePlaceholder} tone="primary">
                Stage Intake Placeholder
              </Button>
            </Inline>
          }
        />
        <div className="asset-library-summary-grid">
          <MetricChip
            label="Approval Queue"
            value={summary.pendingApprovalCount}
            note="Needs human review"
            tone={summary.pendingApprovalCount > 0 ? "warning" : "accent"}
          />
          <MetricChip
            label="Import Queue"
            value={summary.queueDepth}
            note="Active intake items"
            tone={summary.queueDepth > 0 ? "info" : "accent"}
          />
          <MetricChip
            label="Normalization Review"
            value={summary.normalizationReviewCount}
            note="Scale or orientation gaps"
            tone={summary.normalizationReviewCount > 0 ? "warning" : "accent"}
          />
          <MetricChip
            label="Analysis Coverage"
            value={`${summary.analysisCoveragePercent}%`}
            note="Assets with first-pass analysis"
            tone={summary.analysisCoveragePercent >= 70 ? "success" : "warning"}
          />
        </div>
        <div className="asset-pack-strip">
          <button
            className="asset-pack-card"
            data-active={selectedPackId === "all"}
            onClick={() => setSelectedPackId("all")}
            type="button"
          >
            <span className="asset-pack-card-eyebrow">Builder Palette</span>
            <strong>All Content Packs</strong>
            <p>Keep the full library visible while switching themes, props, and gameplay scenery in one pass.</p>
          </button>
          {contentPacks.map((pack) => (
            <button
              key={pack.packId}
              className="asset-pack-card"
              data-active={pack.packId === selectedPackId}
              onClick={() => setSelectedPackId(pack.packId)}
              type="button"
            >
              <span className="asset-pack-card-eyebrow">{humanize(pack.dominantQueueState)}</span>
              <strong>{pack.label}</strong>
              <p>{pack.note}</p>
              <div className="asset-pack-card-meta">
                <StatusPill label={`${pack.assetCount} assets`} />
                <StatusPill
                  label={`${pack.readyForPlacementCount} ready`}
                  tone={pack.readyForPlacementCount > 0 ? "success" : "warning"}
                />
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="asset-library-layout">
        <section className="panel asset-library-main">
          <div className="asset-library-toolbar">
            <TextField
              label="Search"
              placeholder="Search assets, tags, source notes, or categories"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <SelectField
              label="Category"
              options={categoryOptions}
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as AssetCategory | "all")}
            />
            <SelectField
              label="Approval"
              options={approvalOptions}
              value={approvalFilter}
              onChange={(event) => setApprovalFilter(event.target.value as ApprovalStatus | "all")}
            />
            <SelectField
              label="Queue"
              options={queueOptions}
              value={queueFilter}
              onChange={(event) => setQueueFilter(event.target.value as ImportQueueState | "all")}
            />
            <SelectField
              label="Style Tag"
              options={[
                { label: "All tags", value: "all" },
                ...summary.styleTags.map((value) => ({ label: humanize(value), value }))
              ]}
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
            />
            <div className="asset-library-view-toggle">
              <span className="asset-library-control-label">View</span>
              <TogglePillGroup
                ariaLabel="Asset browser view"
                options={viewOptions}
                value={viewMode}
                onChange={setViewMode}
              />
            </div>
          </div>

          {selectedPack ? (
            <div className="asset-library-pack-focus">
              <div>
                <p className="eyebrow">Content Pack Focus</p>
                <h3>{selectedPack.label}</h3>
                <p className="body-copy">
                  Keep your browser place while you inspect assets. Use pack-level tags and categories as a scenery brush palette instead of hopping between disconnected tabs.
                </p>
              </div>
              <div className="asset-library-pack-focus-actions">
                <Button
                  onClick={loadPackIntoBrush}
                  tone="primary"
                  disabled={selectedPackPlacementEntries.filter((entry) => entry.brushEligible).length === 0}
                >
                  Load Pack Into Brush
                </Button>
                {selectedPack.categories.slice(0, 4).map((category) => (
                  <button
                    key={category}
                    className="asset-library-pack-chip"
                    data-active={categoryFilter === category}
                    onClick={() => setCategoryFilter(category as AssetCategory)}
                    type="button"
                  >
                    {humanize(category)}
                  </button>
                ))}
                {selectedPack.styleTags.slice(0, 4).map((tag) => (
                  <button
                    key={tag}
                    className="asset-library-pack-chip"
                    data-active={tagFilter === tag}
                    onClick={() => setTagFilter(tag)}
                    type="button"
                  >
                    {tag}
                  </button>
                ))}
                <Button onClick={() => setSelectedPackId("all")} tone="ghost">
                  Exit Pack Focus
                </Button>
              </div>
            </div>
          ) : null}

          <div className="asset-library-results-head">
            <div>
              <p className="eyebrow">Browser Results</p>
              <h3>{filteredAssets.length === 1 ? "1 asset visible" : `${filteredAssets.length} assets visible`}</h3>
              <p className="body-copy muted-copy">
                {selectedPack ? `${selectedPack.label} is pinned as the active scenery pack.` : "All content packs are visible."}
              </p>
            </div>
            <Button onClick={resetFilters} tone="ghost">
              Reset Filters
            </Button>
          </div>

          {project.assets.length === 0 ? (
            <EmptyStatePanel
              eyebrow="No Assets Yet"
              title="The library is ready for intake"
              description="Start by staging the first imports, then capture source notes, normalization posture, and approval state before worldbuilding depends on them."
              action={
                <Button onClick={handleStagePlaceholder} tone="primary">
                  Stage Intake Placeholder
                </Button>
              }
            />
          ) : filteredAssets.length === 0 ? (
            <EmptyStatePanel
              eyebrow="No Matches"
              title="Your current filters hide every asset"
              description="Reset the browser filters or broaden the tag/category scope to continue reviewing the library."
              action={
                <Button onClick={resetFilters} tone="secondary">
                  Clear Filters
                </Button>
              }
            />
          ) : viewMode === "grid" ? (
            <div className="asset-library-grid">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.assetId}
                  className="asset-browser-card"
                  data-active={asset.assetId === selectedAsset?.assetId}
                  draggable={placementPalette.some((entry) => entry.assetId === asset.assetId)}
                  onClick={() => setSelectedAssetId(asset.assetId)}
                  onDragStart={(event) => startAssetDrag(event, asset)}
                  type="button"
                >
                  <div className="asset-browser-card-top">
                    <StatusPill label={asset.approvalStatus} tone={toneForApproval(asset.approvalStatus)} />
                    <StatusPill label={humanize(asset.queueState)} tone={toneForQueueState(asset.queueState)} />
                  </div>
                  <div className="asset-browser-card-copy">
                    <strong>{asset.displayName}</strong>
                    <span>{humanize(asset.category)}</span>
                    <p>{asset.source.providerName ?? humanize(asset.source.sourceType)}</p>
                  </div>
                  <div className="asset-browser-tag-row">
                    {asset.styleTags.slice(0, 3).map((tag) => (
                      <StatusPill key={tag} label={tag} />
                    ))}
                  </div>
                  <div className="asset-browser-metrics">
                    <span>{formatMetric(asset.analysis.polyEstimate, "tris")}</span>
                    <span>{formatMetric(asset.analysis.materialCount, "mats")}</span>
                    <span>{formatMetric(asset.analysis.textureCount, "tex")}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="asset-library-list">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.assetId}
                  className="asset-browser-row"
                  data-active={asset.assetId === selectedAsset?.assetId}
                  draggable={placementPalette.some((entry) => entry.assetId === asset.assetId)}
                  onClick={() => setSelectedAssetId(asset.assetId)}
                  onDragStart={(event) => startAssetDrag(event, asset)}
                  type="button"
                >
                  <div className="asset-browser-row-copy">
                    <strong>{asset.displayName}</strong>
                    <span>{humanize(asset.category)}</span>
                  </div>
                  <div className="asset-browser-row-meta">
                    <StatusPill label={humanize(asset.queueState)} tone={toneForQueueState(asset.queueState)} />
                    <StatusPill label={asset.approvalStatus} tone={toneForApproval(asset.approvalStatus)} />
                    <span>{asset.source.providerName ?? humanize(asset.source.sourceType)}</span>
                    <span>{formatMetric(asset.analysis.polyEstimate, "tris")}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="asset-library-sidebar">
          <SurfaceCard className="asset-library-sidebar-card" padding={6}>
            <SectionHeader
              eyebrow="Import Queue"
              title="Intake posture"
              description="Watch queue depth so worldbuilding does not depend on unfinished content."
            />
            <div className="asset-library-queue-grid">
              {queueBuckets.map((bucket) => (
                <article key={bucket.bucketId} className="asset-library-queue-card">
                  <div className="asset-library-queue-head">
                    <strong>{bucket.label}</strong>
                    <StatusPill
                      label={`${bucket.assets.length}`}
                      tone={bucket.bucketId === "blocked" && bucket.assets.length > 0 ? "danger" : "info"}
                    />
                  </div>
                  <p>{bucket.description}</p>
                  <ul className="asset-library-queue-list">
                    {bucket.assets.slice(0, 3).map((asset) => (
                      <li key={asset.assetId}>
                        <button onClick={() => setSelectedAssetId(asset.assetId)} type="button">
                          {asset.displayName}
                        </button>
                      </li>
                    ))}
                    {bucket.assets.length === 0 ? <li className="is-empty">No assets in this lane.</li> : null}
                  </ul>
                </article>
              ))}
            </div>
          </SurfaceCard>

          {selectedAsset ? (
            <SurfaceCard className="asset-library-sidebar-card" padding={6}>
              <SectionHeader
                eyebrow="Selected Asset"
                title={selectedAsset.displayName}
                description={getAssetNextAction(selectedAsset)}
              />
              <div className="asset-library-selected-meta">
                <StatusPill label={selectedAsset.approvalStatus} tone={toneForApproval(selectedAsset.approvalStatus)} />
                <StatusPill label={humanize(selectedAsset.queueState)} tone={toneForQueueState(selectedAsset.queueState)} />
                <StatusPill label={humanize(selectedAsset.category)} />
              </div>
              {selectedAssetPlacementEntry ? (
                <p className="body-copy">
                  {selectedAssetPlacementEntry.note} The Build workspace will keep this pack context armed when you return.
                </p>
              ) : (
                <p className="body-copy">
                  This asset is not yet ready for placement. Approval and cataloging still need to complete before Build should rely on it.
                </p>
              )}

              <div className="asset-library-form-grid">
                <TextField
                  label="Display Name"
                  value={selectedAsset.displayName}
                  onChange={(event) =>
                    patchAsset(selectedAsset.assetId, (asset) => ({
                      ...asset,
                      displayName: event.target.value
                    }))
                  }
                />
                <SelectField
                  label="Category"
                  options={assetCategories.map((value) => ({ label: humanize(value), value }))}
                  value={selectedAsset.category}
                  onChange={(event) =>
                    patchAsset(selectedAsset.assetId, (asset) => ({
                      ...asset,
                      category: event.target.value as AssetCategory
                    }))
                  }
                />
                <SelectField
                  label="Approval State"
                  options={approvalOptions.slice(1)}
                  value={selectedAsset.approvalStatus}
                  onChange={(event) =>
                    patchAsset(selectedAsset.assetId, (asset) => ({
                      ...asset,
                      approvalStatus: event.target.value as ApprovalStatus
                    }))
                  }
                />
                <SelectField
                  label="Queue State"
                  options={queueOptions.slice(1)}
                  value={selectedAsset.queueState}
                  onChange={(event) =>
                    patchAsset(selectedAsset.assetId, (asset) => ({
                      ...asset,
                      queueState: event.target.value as ImportQueueState
                    }))
                  }
                />
                <SelectField
                  label="Normalization"
                  options={[
                    { label: "Imported", value: "imported" },
                    { label: "Normalized", value: "normalized" },
                    { label: "Needs Review", value: "needs-review" },
                    { label: "Rejected", value: "rejected" }
                  ]}
                  value={selectedAsset.normalizationState}
                  onChange={(event) =>
                    patchAsset(selectedAsset.assetId, (asset) => ({
                      ...asset,
                      normalizationState: event.target.value as Asset["normalizationState"]
                    }))
                  }
                />
                <SelectField
                  label="Scale Status"
                  options={[
                    { label: "Normalized", value: "normalized" },
                    { label: "Needs Review", value: "needs-review" },
                    { label: "Mismatch", value: "mismatch" }
                  ]}
                  value={selectedAsset.scaleStatus}
                  onChange={(event) =>
                    patchAsset(selectedAsset.assetId, (asset) => ({
                      ...asset,
                      scaleStatus: event.target.value as Asset["scaleStatus"]
                    }))
                  }
                />
                <SelectField
                  label="Orientation"
                  options={[
                    { label: "Ready", value: "ready" },
                    { label: "Needs Review", value: "needs-review" },
                    { label: "Flipped", value: "flipped" }
                  ]}
                  value={selectedAsset.orientationStatus}
                  onChange={(event) =>
                    patchAsset(selectedAsset.assetId, (asset) => ({
                      ...asset,
                      orientationStatus: event.target.value as Asset["orientationStatus"]
                    }))
                  }
                />
                <TextField
                  label="Tags"
                  hint="Comma-separated style and usage tags"
                  value={buildStyleTagString(selectedAsset)}
                  onChange={(event) =>
                    patchAsset(selectedAsset.assetId, (asset) => ({
                      ...asset,
                      styleTags: event.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                    }))
                  }
                />
                <TextField
                  label="Source Provider"
                  value={selectedAsset.source.providerName ?? ""}
                  onChange={(event) =>
                    patchAsset(selectedAsset.assetId, (asset) => ({
                      ...asset,
                      source: {
                        ...asset.source,
                        providerName: event.target.value || undefined
                      }
                    }))
                  }
                />
                <TextField
                  label="License Summary"
                  value={selectedAsset.source.licenseSummary ?? ""}
                  onChange={(event) =>
                    patchAsset(selectedAsset.assetId, (asset) => ({
                      ...asset,
                      source: {
                        ...asset.source,
                        licenseSummary: event.target.value || undefined
                      }
                    }))
                  }
                />
              </div>

              <TextAreaField
                label="Notes"
                rows={4}
                value={selectedAsset.notes ?? ""}
                onChange={(event) =>
                  patchAsset(selectedAsset.assetId, (asset) => ({
                    ...asset,
                    notes: event.target.value || undefined
                  }))
                }
              />

              <div className="asset-library-action-row">
                <Button
                  onClick={() => armAssetForPlacement(selectedAsset)}
                  tone="primary"
                  disabled={!selectedAssetPlacementEntry}
                >
                  Arm For Placement
                </Button>
                <Button
                  draggable={Boolean(selectedAssetPlacementEntry)}
                  onDragStart={(event) => startAssetDrag(event, selectedAsset)}
                  tone="ghost"
                  disabled={!selectedAssetPlacementEntry}
                >
                  Drag To Place
                </Button>
                <Button
                  onClick={() => addAssetToBrush(selectedAsset)}
                  tone="secondary"
                  disabled={!selectedAssetPlacementEntry?.brushEligible}
                >
                  Add To Brush
                </Button>
                <Button
                  onClick={() =>
                    patchAsset(selectedAsset.assetId, (asset) => ({
                      ...asset,
                      approvalStatus: "approved",
                      queueState: asset.normalizationState === "normalized" ? "cataloged" : asset.queueState
                    }))
                  }
                  tone="secondary"
                >
                  Approve Asset
                </Button>
                <Button
                  onClick={() =>
                    patchAsset(selectedAsset.assetId, (asset) => ({
                      ...asset,
                      approvalStatus: "pending",
                      queueState: asset.queueState === "cataloged" ? "ready-for-review" : asset.queueState
                    }))
                  }
                  tone="secondary"
                >
                  Keep in Review
                </Button>
                <Button
                  onClick={() =>
                    patchAsset(selectedAsset.assetId, (asset) => ({
                      ...asset,
                      approvalStatus: "rejected",
                      queueState: "blocked",
                      normalizationState: "rejected"
                    }))
                  }
                  tone="danger"
                >
                  Reject
                </Button>
              </div>

              <div className="asset-library-analysis-grid">
                <article className="asset-library-analysis-card">
                  <span>Scale + Orientation</span>
                  <strong>{formatAssetDimensions(selectedAsset)}</strong>
                  <p>
                    {humanize(selectedAsset.scaleStatus)} scale · {humanize(selectedAsset.orientationStatus)} orientation
                  </p>
                </article>
                <article className="asset-library-analysis-card">
                  <span>Asset Analysis</span>
                  <strong>{humanize(selectedAsset.analysis.analysisStatus)}</strong>
                  <p>{selectedAsset.analysis.complexityGrade ? humanize(selectedAsset.analysis.complexityGrade) : "Complexity pending"}</p>
                </article>
              </div>

              <div className="asset-library-analysis-metrics">
                <span>{formatMetric(selectedAsset.analysis.polyEstimate, "tris")}</span>
                <span>{formatMetric(selectedAsset.analysis.materialCount, "mats")}</span>
                <span>{formatMetric(selectedAsset.analysis.textureCount, "tex")}</span>
                <span>{formatTextureMemory(selectedAsset.analysis.textureMemoryEstimateMb)}</span>
              </div>

              <ul className="asset-library-path-list">
                <li>
                  <strong>Import Path</strong>
                  <span>{selectedAsset.importPath}</span>
                </li>
                <li>
                  <strong>Normalized Path</strong>
                  <span>{selectedAsset.normalizedPath ?? "Pending normalization output"}</span>
                </li>
                <li>
                  <strong>Source Type</strong>
                  <span>{humanize(selectedAsset.source.sourceType)}</span>
                </li>
              </ul>
            </SurfaceCard>
          ) : (
            <EmptyStatePanel
              eyebrow="Selected Asset"
              title="Choose an asset to inspect"
              description="The inspector will show source, normalization, approval, and analysis detail once an asset is selected."
            />
          )}

          <SurfaceCard className="asset-library-sidebar-card" padding={6}>
            <SectionHeader
              eyebrow="Asset Health"
              title="Fix paths"
              description="Every issue here has a direct cleanup path before World Builder inherits the problem."
            />
            <div className="issue-card-list">
              {(relevantIssues.length > 0 ? relevantIssues : validationReport.issues.filter((issue) => issue.ownerModule === "asset-library")).slice(0, 4).map((issue) => (
                <ValidationIssueCard key={issue.issueId} issue={issue} compact />
              ))}
              {validationReport.issues.filter((issue) => issue.ownerModule === "asset-library").length === 0 ? (
                <p className="body-copy muted-copy">No asset-library issues are currently open.</p>
              ) : null}
            </div>
          </SurfaceCard>
        </aside>
      </div>
    </div>
  );
}
