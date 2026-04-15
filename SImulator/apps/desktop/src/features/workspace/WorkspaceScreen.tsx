import { Suspense, lazy, type ReactNode, useEffect, useState } from "react";

import {
  type PerformanceProfileId
} from "@course-creator-os/performance";
import {
  getModuleDefinition,
  getModuleReadinessStatus,
  type ModuleKey
} from "@course-creator-os/project-model";

import { useProjectSession } from "../../app/project-session";
import { StatusPill } from "../../components/StatusPill";
import { ValidationIssueCard } from "../../components/ValidationIssueCard";

const CreateWizard = lazy(async () => ({
  default: (await import("../create/CreateWizard")).CreateWizard
}));
const PlanWorkspace = lazy(async () => ({
  default: (await import("../plan/PlanWorkspace")).PlanWorkspace
}));
const BuildWorkspace = lazy(async () => ({
  default: (await import("../build/BuildWorkspace")).BuildWorkspace
}));
const GameplayLogicCenter = lazy(async () => ({
  default: (await import("../gameplay/GameplayLogicCenter")).GameplayLogicCenter
}));
const AssetLibraryWorkspace = lazy(async () => ({
  default: (await import("../assets/AssetLibraryWorkspace")).AssetLibraryWorkspace
}));
const WorldBuilderWorkspace = lazy(async () => ({
  default: (await import("../world/WorldBuilderWorkspace")).WorldBuilderWorkspace
}));
const AnimationEventsWorkspace = lazy(async () => ({
  default: (await import("../animate/AnimationEventsWorkspace")).AnimationEventsWorkspace
}));
const PlayabilityCenter = lazy(async () => ({
  default: (await import("../playability/PlayabilityCenter")).PlayabilityCenter
}));
const PerformanceCenter = lazy(async () => ({
  default: (await import("../performance/PerformanceCenter")).PerformanceCenter
}));
const PreviewStudio = lazy(async () => ({
  default: (await import("../preview/PreviewStudio")).PreviewStudio
}));
const PackageCenter = lazy(async () => ({
  default: (await import("../package/PackageCenter")).PackageCenter
}));
const PublishCenter = lazy(async () => ({
  default: (await import("../publish/PublishCenter")).PublishCenter
}));
const VersionControlCenter = lazy(async () => ({
  default: (await import("../versioning/VersionControlCenter")).VersionControlCenter
}));
const SettingsCenter = lazy(async () => ({
  default: (await import("../settings/SettingsCenter")).SettingsCenter
}));
const AgentCommandCenter = lazy(async () => ({
  default: (await import("../agent/AgentCommandCenter")).AgentCommandCenter
}));

type WorkspaceScreenProps = {
  moduleKey: ModuleKey;
};

function WorkspaceLoadingPanel({ label }: { label: string }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Loading</p>
          <h3>{label}</h3>
        </div>
        <StatusPill label="Preparing workspace" tone="info" />
      </div>
      <p className="body-copy">
        The module surface is being prepared so the shell can keep heavyweight workspaces out of
        the initial bundle.
      </p>
    </section>
  );
}

function LazyMode({
  children,
  label
}: {
  children: ReactNode;
  label: string;
}) {
  return <Suspense fallback={<WorkspaceLoadingPanel label={label} />}>{children}</Suspense>;
}

export function WorkspaceScreen({ moduleKey }: WorkspaceScreenProps) {
  const { activePerformanceProfileId, project, validationReport } = useProjectSession();
  const [selectedPerformanceProfile, setSelectedPerformanceProfile] =
    useState<PerformanceProfileId>(activePerformanceProfileId);
  const module = getModuleDefinition(moduleKey);

  useEffect(() => {
    setSelectedPerformanceProfile(activePerformanceProfileId);
  }, [activePerformanceProfileId]);

  if (!module) {
    return null;
  }

  const status = project.moduleStatuses[moduleKey];
  const relatedIssues = validationReport.issues.filter((issue) => issue.ownerModule === moduleKey);
  return (
    <div className="workspace-screen">
      <section className="panel workspace-hero">
        <div>
          <p className="eyebrow">{module.owner}</p>
          <h2>{module.title}</h2>
          <p className="body-copy">{module.summary}</p>
        </div>
        <div className="workspace-hero-meta">
          <div className="hero-stat">
            <span>Status</span>
            <strong>{getModuleReadinessStatus(status)}</strong>
          </div>
          <div className="hero-stat">
            <span>Completion</span>
            <strong>{Math.round(status.completion * 100)}%</strong>
          </div>
          <div className="hero-stat">
            <span>Open Issues</span>
            <strong>{relatedIssues.length}</strong>
          </div>
        </div>
      </section>

      {moduleKey === "create" ? <CreateMode /> : null}
      {moduleKey === "plan" ? <PlanMode /> : null}
      {moduleKey === "build" ? <BuildMode /> : null}
      {moduleKey === "gameplay" ? <GameplayMode /> : null}
      {moduleKey === "asset-library" ? <AssetLibraryMode /> : null}
      {moduleKey === "world" ? <WorldMode /> : null}
      {moduleKey === "animate" ? <AnimateMode /> : null}
      {moduleKey === "playability" ? <PlayabilityMode /> : null}
      {moduleKey === "agent-command" ? <AgentCommandMode /> : null}
      {moduleKey === "performance" ? (
        <PerformanceMode
          selectedProfile={selectedPerformanceProfile}
          onProfileChange={setSelectedPerformanceProfile}
        />
      ) : null}
      {moduleKey === "preview" ? <PreviewMode /> : null}
      {moduleKey === "package" ? <PackageMode /> : null}
      {moduleKey === "publish" ? <PublishMode /> : null}
      {moduleKey === "version-control" ? <VersionControlMode /> : null}
      {moduleKey === "settings" ? <SettingsMode /> : null}

      <div className="workspace-columns">
        <section className="panel">
          <p className="eyebrow">Current Focus</p>
          <h3>What this mode must do well</h3>
          <p className="body-copy">{module.currentFocus}</p>
          <p className="body-copy muted-copy">{status.nextAction}</p>
        </section>

        <section className="panel">
          <p className="eyebrow">Workspace Sections</p>
          <h3>Screen structure</h3>
          <ul className="rail-list">
            {module.workspaceSections.map((section) => (
              <li key={section.title}>
                <strong>{section.title}</strong>
                <span>{section.description}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="workspace-columns">
        <section className="panel">
          <p className="eyebrow">Deliverables</p>
          <h3>Version 1.0 outputs</h3>
          <ul className="rail-list">
            {module.deliverables.map((deliverable) => (
              <li key={deliverable}>{deliverable}</li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <p className="eyebrow">Validation Issues</p>
          <h3>Fixable paths</h3>
          <div className="issue-card-list">
            {(relatedIssues.length > 0 ? relatedIssues : validationReport.issues.slice(0, 2)).map((issue) => (
              <ValidationIssueCard key={issue.issueId} issue={issue} compact />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function BuildMode() {
  return (
    <LazyMode label="Terrain & Routing Workspace">
      <BuildWorkspace />
    </LazyMode>
  );
}

function CreateMode() {
  return (
    <LazyMode label="Project Wizard">
      <CreateWizard />
    </LazyMode>
  );
}

function PlanMode() {
  return (
    <LazyMode label="Planning Workspace">
      <PlanWorkspace />
    </LazyMode>
  );
}

function GameplayMode() {
  return (
    <LazyMode label="Gameplay & Simulator Logic Center">
      <GameplayLogicCenter />
    </LazyMode>
  );
}

function AssetLibraryMode() {
  return (
    <LazyMode label="Asset Library">
      <AssetLibraryWorkspace />
    </LazyMode>
  );
}

function WorldMode() {
  return (
    <LazyMode label="World Builder">
      <WorldBuilderWorkspace />
    </LazyMode>
  );
}

function AnimateMode() {
  return (
    <LazyMode label="Animation & Events">
      <AnimationEventsWorkspace />
    </LazyMode>
  );
}

function PlayabilityMode() {
  return (
    <LazyMode label="Playability Center">
      <PlayabilityCenter />
    </LazyMode>
  );
}

function PerformanceMode({
  selectedProfile,
  onProfileChange
}: {
  selectedProfile: PerformanceProfileId;
  onProfileChange: (profile: PerformanceProfileId) => void;
}) {
  return (
    <LazyMode label="Performance Center">
      <PerformanceCenter selectedProfile={selectedProfile} onProfileChange={onProfileChange} />
    </LazyMode>
  );
}

function PreviewMode() {
  return (
    <LazyMode label="Preview Studio">
      <PreviewStudio />
    </LazyMode>
  );
}

function PackageMode() {
  return (
    <LazyMode label="Package Center">
      <PackageCenter />
    </LazyMode>
  );
}

function PublishMode() {
  return (
    <LazyMode label="Publish Center">
      <PublishCenter />
    </LazyMode>
  );
}

function VersionControlMode() {
  return (
    <LazyMode label="Version Control Center">
      <VersionControlCenter />
    </LazyMode>
  );
}

function SettingsMode() {
  return (
    <LazyMode label="Settings">
      <SettingsCenter />
    </LazyMode>
  );
}

function AgentCommandMode() {
  return (
    <LazyMode label="Agent Command Center">
      <AgentCommandCenter />
    </LazyMode>
  );
}
