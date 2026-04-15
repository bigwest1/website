import { Suspense, lazy } from "react";
import { useSearchParams } from "react-router-dom";

import { SectionHeader, SurfaceCard } from "@course-creator-os/ui";

const CourseBibleWorkspace = lazy(async () => ({
  default: (await import("./CourseBibleWorkspace")).CourseBibleWorkspace
}));
const HolePlannerWorkspace = lazy(async () => ({
  default: (await import("./HolePlannerWorkspace")).HolePlannerWorkspace
}));

const planTabs = [
  {
    key: "course-bible",
    label: "Course Bible",
    title: "Design truth and world rules",
    description: "Lock the creative truth before downstream modules start depending on it."
  },
  {
    key: "hole-planner",
    label: "Hole Planner",
    title: "Per-hole pacing and intent",
    description: "Plan each hole as a playable, visual, and simulator-readable experience."
  }
] as const;

type PlanTabKey = (typeof planTabs)[number]["key"];

export function PlanWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = planTabs.some((tab) => tab.key === requestedTab)
    ? (requestedTab as PlanTabKey)
    : "course-bible";
  const activeDefinition = planTabs.find((tab) => tab.key === activeTab) ?? planTabs[0];

  function handleTabChange(tab: PlanTabKey) {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("tab", tab);
    setSearchParams(nextSearchParams, { replace: true });
  }

  const workspaceLabel =
    activeTab === "course-bible" ? "Course Bible Workspace" : "Hole Planner Workspace";

  return (
    <div className="mode-stack">
      <SurfaceCard padding={6} tone="raised">
        <SectionHeader
          eyebrow="Planning Workspace"
          title={activeDefinition.title}
          description={activeDefinition.description}
        />
        <div className="mode-tabs" role="tablist" aria-label="Planning workspaces">
          {planTabs.map((tab) => (
            <button
              key={tab.key}
              aria-selected={activeTab === tab.key}
              className={`mode-tab ${activeTab === tab.key ? "is-active" : ""}`}
              onClick={() => handleTabChange(tab.key)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </SurfaceCard>

      <Suspense
        fallback={
          <SurfaceCard padding={6} tone="raised">
            <SectionHeader
              eyebrow="Loading"
              title={workspaceLabel}
              description="Preparing the planning surface without forcing both planning modules into the initial chunk."
            />
          </SurfaceCard>
        }
      >
        {activeTab === "course-bible" ? <CourseBibleWorkspace /> : <HolePlannerWorkspace />}
      </Suspense>
    </div>
  );
}
