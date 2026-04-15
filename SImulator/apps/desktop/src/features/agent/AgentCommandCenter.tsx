import {
  buildAgentCommandSnapshot,
  defaultAgentTasks,
  getAgentDefinition,
  getAgentName,
  operatingManual
} from "@course-creator-os/agent-system";
import { MetricChip } from "@course-creator-os/ui";

import { useProjectSession } from "../../app/project-session";
import { StatusPill } from "../../components/StatusPill";

function toneForAgentState(state: "idle" | "running" | "blocked" | "complete") {
  switch (state) {
    case "running":
      return "success";
    case "blocked":
      return "danger";
    case "complete":
      return "info";
    case "idle":
    default:
      return "warning";
  }
}

function toneForRoadmapState(state: "planned" | "active" | "complete" | "blocked") {
  switch (state) {
    case "active":
      return "info";
    case "complete":
      return "success";
    case "blocked":
      return "danger";
    case "planned":
    default:
      return "warning";
  }
}

function toneForReadiness(readiness: string) {
  switch (readiness) {
    case "Blocked":
      return "danger";
    case "Ready":
      return "success";
    case "Ready for Integration":
      return "info";
    default:
      return "warning";
  }
}

export function AgentCommandCenter() {
  const { project, validationReport } = useProjectSession();
  const snapshot = buildAgentCommandSnapshot({
    project,
    validationReport
  });
  const activeTaskCount = defaultAgentTasks.filter((task) => task.status === "active").length;
  const blockedTaskCount = defaultAgentTasks.filter((task) => task.status === "blocked").length;
  const blockedModuleCount = snapshot.moduleStatusBoard.filter((item) => item.readiness === "Blocked").length;

  return (
    <div className="mode-stack">
      <section className="panel package-center-hero">
        <div>
          <p className="eyebrow">Agent Command Center</p>
          <h3>Authoritative delivery visibility across the product</h3>
          <p className="body-copy">
            The command center should show who owns the work, what is moving, what is risky, and
            which module should advance next. It is here to guide execution, not to add noise.
          </p>
        </div>
        <div className="package-center-hero-meta">
          <StatusPill label={getAgentName(operatingManual.topLevelAuthorityAgentId)} tone="info" />
          <StatusPill
            label={blockedModuleCount > 0 ? `${blockedModuleCount} blocked modules` : "no blocked modules"}
            tone={blockedModuleCount > 0 ? "warning" : "success"}
          />
        </div>
      </section>

      <div className="package-center-metrics">
        <MetricChip label="Active Agents" value={snapshot.activeAgents.filter((agent) => agent.state === "running").length} tone="success" />
        <MetricChip label="Active Tasks" value={activeTaskCount} note={`${blockedTaskCount} blocked`} tone="info" />
        <MetricChip label="Open Risks" value={snapshot.openRisks.length} tone={snapshot.openRisks.some((risk) => risk.severity === "high" || risk.severity === "critical") ? "warning" : "success"} />
        <MetricChip label="Next Actions" value={snapshot.suggestedNextActions.length} tone="accent" />
      </div>

      <div className="workspace-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Active Agents</p>
              <h3>Current ownership and operating posture</h3>
            </div>
          </div>
          <div className="module-grid">
            {snapshot.activeAgents.map((agent) => (
              <article key={agent.agentId} className="module-card">
                <div className="project-card-head">
                  <StatusPill label={agent.state} tone={toneForAgentState(agent.state)} />
                  <StatusPill label={getAgentDefinitionLabel(agent.agentId)} />
                </div>
                <p className="module-card-title">{getAgentName(agent.agentId)}</p>
                <p className="body-copy">{agent.currentFocus}</p>
                <p className="muted-copy">{agent.summary}</p>
                <div className="project-card-meta">
                  <span>{agent.activeTaskCount} active</span>
                  <strong>{agent.blockedTaskCount} blocked</strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Current Focus Areas</p>
              <h3>Where execution pressure is concentrated</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {snapshot.focusAreas.map((focusArea) => (
              <article key={focusArea.focusAreaId} className="module-card">
                <div className="project-card-meta">
                  <span>{getAgentName(focusArea.ownerAgentId)}</span>
                  <strong>{focusArea.moduleKey ?? "cross-product"}</strong>
                </div>
                <p className="module-card-title">{focusArea.title}</p>
                <p className="body-copy">{focusArea.summary}</p>
                <p className="muted-copy">{focusArea.state}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="workspace-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Suggested Next Actions</p>
              <h3>Highest-value moves right now</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {snapshot.suggestedNextActions.map((recommendation) => (
              <article key={recommendation.recommendationId} className="module-card">
                <div className="project-card-meta">
                  <span>{recommendation.moduleKey}</span>
                  <strong>{getAgentName(recommendation.recommendedOwnerAgentId)}</strong>
                </div>
                <p className="module-card-title">{recommendation.title}</p>
                <p className="body-copy">{recommendation.rationale}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Decision Summary</p>
              <h3>Recorded direction that should not be reopened casually</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {snapshot.decisionSummaries.map((decision) => (
              <article key={decision.decisionId} className="module-card">
                <div className="project-card-meta">
                  <span>{getAgentName(decision.decidedByAgentId)}</span>
                  <strong>{new Date(decision.decidedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</strong>
                </div>
                <p className="module-card-title">{decision.title}</p>
                <p className="body-copy">{decision.summary}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="workspace-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Open Risks</p>
              <h3>What could still bend the project off course</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {snapshot.openRisks.map((risk) => (
              <article key={risk.riskId} className="module-card">
                <div className="project-card-meta">
                  <span>{getAgentName(risk.ownerAgentId)}</span>
                  <strong>{risk.severity}</strong>
                </div>
                <p className="module-card-title">{risk.title}</p>
                <p className="body-copy">{risk.mitigation}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Governance Anchors</p>
              <h3>Docs that define authority, memory, and readiness</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {snapshot.governanceReferences.map((reference) => (
              <article key={reference.referenceId} className="module-card">
                <p className="module-card-title">{reference.title}</p>
                <p className="body-copy">{reference.summary}</p>
                <p className="muted-copy">{reference.path}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Module Status Board</p>
            <h3>Readiness, blockers, and next actions by product module</h3>
          </div>
        </div>
        <div className="issue-card-list">
          {snapshot.moduleStatusBoard.map((item) => (
            <article key={item.moduleKey} className="module-card">
              <div className="project-card-head">
                <StatusPill label={item.readiness} tone={toneForReadiness(item.readiness)} />
                <StatusPill label={item.stage} tone={toneForRoadmapState(item.blockerCount > 0 ? "blocked" : item.completion > 0.9 ? "complete" : item.completion > 0.45 ? "active" : "planned")} />
              </div>
              <p className="module-card-title">{item.title}</p>
              <p className="body-copy">{item.nextAction}</p>
              <div className="project-card-meta">
                <span>{getAgentName(item.ownerAgentId)}</span>
                <strong>{Math.round(item.completion * 100)}%</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function getAgentDefinitionLabel(agentId: string) {
  return getAgentDefinition(agentId)?.authorityLevel ?? "domain-authority";
}
