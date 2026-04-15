import { describe, expect, it } from "vitest";

import { createSeedProject } from "@course-creator-os/project-model";
import { evaluateValidationReport } from "@course-creator-os/validation";

import { buildAgentCommandSnapshot } from "./index";

describe("buildAgentCommandSnapshot", () => {
  it("derives active agents, recommendations, risks, and module status board from project state", () => {
    const project = createSeedProject();
    const validationReport = evaluateValidationReport(project);

    const snapshot = buildAgentCommandSnapshot({
      project,
      validationReport
    });

    expect(snapshot.activeAgents.length).toBeGreaterThan(4);
    expect(snapshot.suggestedNextActions.length).toBeGreaterThan(0);
    expect(snapshot.openRisks.length).toBeGreaterThan(0);
    expect(snapshot.moduleStatusBoard.some((item) => item.moduleKey === "agent-command")).toBe(true);
    expect(snapshot.governanceReferences.some((item) => item.title === "MODULE_STATUS_BOARD.md")).toBe(true);
  });
});
