import { useDeferredValue, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { moduleDefinitions, type CourseProject } from "@course-creator-os/project-model";
import type { ValidationReport } from "@course-creator-os/validation";

import { useProjectSession } from "../app/project-session";

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
};

type PaletteItem = {
  id: string;
  label: string;
  meta: string;
  route: string;
  keywords: string[];
};

function buildPaletteItems(
  project: CourseProject,
  validationReport: ValidationReport,
): PaletteItem[] {
  const moduleItems = moduleDefinitions.map((definition) => ({
    id: `module-${definition.key}`,
    label: definition.title,
    meta: `${definition.stage} · ${definition.owner}`,
    route: definition.route,
    keywords: [definition.key, definition.title, definition.owner, definition.stage]
  }));

  const holeItems = project.holes.slice(0, 6).map((hole) => ({
    id: hole.holeId,
    label: `Hole ${hole.number}`,
    meta: `${hole.metadata.holeRole} · ${hole.readabilityTarget}`,
    route: "/plan?tab=hole-planner",
    keywords: [hole.metadata.holeRole, hole.readabilityTarget, String(hole.number)]
  }));

  const issueItems = validationReport.issues.slice(0, 6).map((issue) => ({
    id: issue.issueId,
    label: issue.title,
    meta: `${issue.ownerModule} · ${issue.severity}`,
    route: `/${issue.ownerModule}`.replace("/home", "/"),
    keywords: [issue.category, issue.ownerModule, issue.severity, issue.title]
  }));

  return [...moduleItems, ...holeItems, ...issueItems];
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { project, validationReport } = useProjectSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const items = buildPaletteItems(project, validationReport);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const timeout = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) {
          onClose();
        }
      }

      if (event.key === "Escape" && open) {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const filteredItems = items.filter((item) => {
    const haystack = `${item.label} ${item.meta} ${item.keywords.join(" ")}`.toLowerCase();
    return haystack.includes(deferredQuery.trim().toLowerCase());
  });

  return (
    <div className="palette-backdrop" onClick={onClose} role="presentation">
      <div className="palette-shell panel" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="palette-head">
          <p className="eyebrow">Command Palette</p>
          <button className="ghost-button" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <input
          ref={inputRef}
          className="palette-input"
          placeholder="Jump to a mode, hole, or issue"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="palette-results">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              className="palette-item"
              onClick={() => {
                navigate(item.route);
                onClose();
              }}
              type="button"
            >
              <strong>{item.label}</strong>
              <span>{item.meta}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
