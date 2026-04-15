import { type PropsWithChildren, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { getModuleDefinitionByRoute } from "@course-creator-os/project-model";

import { CommandPalette } from "../components/CommandPalette";
import { GlobalHealthBanner } from "../components/GlobalHealthBanner";
import { InspectorRail } from "../components/InspectorRail";
import { NavRail } from "../components/NavRail";
import { UtilityDock } from "../components/UtilityDock";
import { WorkspaceHeader } from "../components/WorkspaceHeader";
import { useProjectSession } from "./project-session";

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const activeModule = getModuleDefinitionByRoute(location.pathname);
  const { performanceAssessment, project, validationReport } = useProjectSession();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isRightRailCollapsed, setIsRightRailCollapsed] = useState(false);
  const [rightRailSize, setRightRailSize] = useState<"compact" | "standard" | "wide">("standard");

  useEffect(() => {
    const storedCollapsed = window.localStorage.getItem("cco:right-rail:collapsed");
    const storedSize = window.localStorage.getItem("cco:right-rail:size");

    if (storedCollapsed === "true") {
      setIsRightRailCollapsed(true);
    }

    if (storedSize === "compact" || storedSize === "standard" || storedSize === "wide") {
      setRightRailSize(storedSize);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("cco:right-rail:collapsed", String(isRightRailCollapsed));
  }, [isRightRailCollapsed]);

  useEffect(() => {
    window.localStorage.setItem("cco:right-rail:size", rightRailSize);
  }, [rightRailSize]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsPaletteOpen((value) => !value);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      className={`app-frame rail-${rightRailSize} ${isRightRailCollapsed ? "rail-collapsed" : ""}`}
    >
      <div className="ambient-gradient ambient-gradient-left" />
      <div className="ambient-gradient ambient-gradient-right" />
      <NavRail project={project} activeModule={activeModule.key} />
      <main className="workspace-frame">
        <WorkspaceHeader
          activeModule={activeModule}
          validationReport={validationReport}
          onOpenCommandPalette={() => setIsPaletteOpen(true)}
        />
        <GlobalHealthBanner validationReport={validationReport} />
        <section className="workspace-content">{children}</section>
        <UtilityDock />
      </main>
      <InspectorRail
        project={project}
        validationReport={validationReport}
        activeModule={activeModule}
        collapsed={isRightRailCollapsed}
        onToggleCollapsed={() => setIsRightRailCollapsed((value) => !value)}
        size={rightRailSize}
        onSizeChange={setRightRailSize}
        performanceAssessment={performanceAssessment}
      />
      <CommandPalette open={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </div>
  );
}
