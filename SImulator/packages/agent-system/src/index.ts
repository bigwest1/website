import { z } from "zod";

import {
  issueSeveritySchema,
  isoDateStringSchema
} from "@course-creator-os/core-types";
import {
  MODULE_KEYS,
  getModuleReadinessStatus,
  moduleDefinitions,
  type CourseProject,
  type ModuleKey
} from "@course-creator-os/project-model";
import type { ValidationReport } from "@course-creator-os/validation";

export const authorityLevelSchema = z.enum([
  "top-level",
  "domain-authority",
  "specialist"
]);

export const agentDefinitionSchema = z.object({
  agentId: z.string(),
  name: z.string(),
  role: z.string(),
  authorityLevel: authorityLevelSchema,
  mission: z.string(),
  owns: z.array(z.string()),
  mustDeliver: z.array(z.string()),
  mustNot: z.array(z.string()),
  successStandard: z.string(),
  escalationToHuman: z.array(z.string()).optional()
});

export const agentRunStateSchema = z.enum([
  "idle",
  "running",
  "blocked",
  "complete"
]);

export const agentStatusSchema = z.object({
  agentId: z.string(),
  state: agentRunStateSchema,
  currentFocus: z.string(),
  summary: z.string(),
  activeTaskCount: z.number().min(0),
  blockedTaskCount: z.number().min(0),
  laneId: z.string().nullable(),
  updatedAt: isoDateStringSchema
});

export const agentTaskStatusSchema = z.enum([
  "queued",
  "active",
  "blocked",
  "done"
]);

export const agentTaskSchema = z.object({
  taskId: z.string(),
  ownerAgentId: z.string(),
  title: z.string(),
  status: agentTaskStatusSchema,
  summary: z.string(),
  relatedLaneId: z.string().nullable(),
  stopCondition: z.string().optional()
});

export const recommendationSchema = z.object({
  recommendationId: z.string(),
  moduleKey: z.string(),
  title: z.string(),
  rationale: z.string(),
  recommendedOwnerAgentId: z.string()
});

export const riskSummarySchema = z.object({
  riskId: z.string(),
  title: z.string(),
  severity: issueSeveritySchema,
  mitigation: z.string(),
  ownerAgentId: z.string()
});

export const decisionSummarySchema = z.object({
  decisionId: z.string(),
  title: z.string(),
  summary: z.string(),
  decidedAt: isoDateStringSchema,
  decidedByAgentId: z.string()
});

export const deliveryLaneSchema = z.object({
  laneId: z.string(),
  title: z.string(),
  objective: z.string(),
  ownerAgentId: z.string(),
  active: z.boolean()
});

export const roadmapStateSchema = z.enum(["planned", "active", "complete", "blocked"]);

export const focusAreaSchema = z.object({
  focusAreaId: z.string(),
  title: z.string(),
  summary: z.string(),
  ownerAgentId: z.string(),
  moduleKey: z.enum(MODULE_KEYS).nullable(),
  state: roadmapStateSchema
});

export const moduleStatusBoardItemSchema = z.object({
  moduleKey: z.enum(MODULE_KEYS),
  title: z.string(),
  ownerAgentId: z.string(),
  readiness: z.string(),
  completion: z.number().min(0).max(1),
  blockerCount: z.number().min(0),
  nextAction: z.string(),
  stage: z.string()
});

export const governanceReferenceSchema = z.object({
  referenceId: z.string(),
  title: z.string(),
  summary: z.string(),
  path: z.string()
});

export const agentCommandSnapshotSchema = z.object({
  activeAgents: z.array(agentStatusSchema),
  focusAreas: z.array(focusAreaSchema),
  suggestedNextActions: z.array(recommendationSchema),
  decisionSummaries: z.array(decisionSummarySchema),
  openRisks: z.array(riskSummarySchema),
  moduleStatusBoard: z.array(moduleStatusBoardItemSchema),
  governanceReferences: z.array(governanceReferenceSchema)
});

export const roadmapStageSchema = z.object({
  stageId: z.string(),
  title: z.string(),
  objective: z.string(),
  status: roadmapStateSchema,
  workstreamIds: z.array(z.string()),
  exitCriteria: z.array(z.string())
});

export const workstreamSchema = z.object({
  workstreamId: z.string(),
  title: z.string(),
  ownerAgentIds: z.array(z.string()),
  scope: z.array(z.string()),
  starts: z.string(),
  dependsOn: z.array(z.string()),
  status: roadmapStateSchema,
  currentFocus: z.string()
});

export const qualityGateSchema = z.object({
  gateId: z.string(),
  title: z.string(),
  rules: z.array(z.string())
});

export const milestoneSchema = z.object({
  milestoneId: z.string(),
  title: z.string(),
  status: roadmapStateSchema,
  outcomes: z.array(z.string())
});

export const startupStepSchema = z.object({
  step: z.number().int().positive(),
  ownerAgentId: z.string(),
  action: z.string()
});

export const conflictResolutionRuleSchema = z.object({
  domain: z.string(),
  ownerAgentId: z.string()
});

export const optionalSpecialistAgentSchema = z.object({
  agentId: z.string(),
  name: z.string(),
  role: z.string(),
  useCase: z.string(),
  requiredInputs: z.array(z.string())
});

export const operatingManualSchema = z.object({
  topLevelAuthorityAgentId: z.string(),
  escalationToHuman: z.array(z.string()),
  decisionFramework: z.array(z.string()),
  humanIntentGuardrails: z.array(z.string()),
  executionRules: z.array(z.string())
});

export type AuthorityLevel = z.infer<typeof authorityLevelSchema>;
export type AgentDefinition = z.infer<typeof agentDefinitionSchema>;
export type AgentRunState = z.infer<typeof agentRunStateSchema>;
export type AgentStatus = z.infer<typeof agentStatusSchema>;
export type AgentTaskStatus = z.infer<typeof agentTaskStatusSchema>;
export type AgentTask = z.infer<typeof agentTaskSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type RiskSummary = z.infer<typeof riskSummarySchema>;
export type DecisionSummary = z.infer<typeof decisionSummarySchema>;
export type FocusArea = z.infer<typeof focusAreaSchema>;
export type ModuleStatusBoardItem = z.infer<typeof moduleStatusBoardItemSchema>;
export type GovernanceReference = z.infer<typeof governanceReferenceSchema>;
export type AgentCommandSnapshot = z.infer<typeof agentCommandSnapshotSchema>;
export type DeliveryLane = z.infer<typeof deliveryLaneSchema>;
export type RoadmapState = z.infer<typeof roadmapStateSchema>;
export type RoadmapStage = z.infer<typeof roadmapStageSchema>;
export type Workstream = z.infer<typeof workstreamSchema>;
export type QualityGate = z.infer<typeof qualityGateSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type StartupStep = z.infer<typeof startupStepSchema>;
export type ConflictResolutionRule = z.infer<typeof conflictResolutionRuleSchema>;
export type OptionalSpecialistAgent = z.infer<typeof optionalSpecialistAgentSchema>;
export type OperatingManual = z.infer<typeof operatingManualSchema>;

export const operatingManual: OperatingManual = {
  topLevelAuthorityAgentId: "iron-forge",
  escalationToHuman: [
    "Credentials or external access are required.",
    "Payment, licensing, or paid service consent is required.",
    "Legal or public IP exposure becomes material.",
    "A choice would materially diverge from the user-stated vision."
  ],
  decisionFramework: [
    "Does this support the product vision?",
    "Does this protect or improve UX?",
    "Does this preserve creator control?",
    "Does this preserve or improve simulator and output reliability?",
    "Does this scale beyond one course theme?",
    "Is it architecturally sound?",
    "Is it reversible if later evidence changes?",
    "Is there a simpler path that preserves quality?"
  ],
  humanIntentGuardrails: [
    "The product must be beautiful and premium.",
    "Navy blue should guide the visual language.",
    "UX is critical.",
    "The user must never feel lost.",
    "The app must support any course type.",
    "The first flagship course is a modern theme park course.",
    "Simulator logic must be easily configurable in-app.",
    "Final output must play on the target machine without hardship.",
    "The product should become the go-to app creators talk about."
  ],
  executionRules: [
    "Protect the product vision.",
    "Prioritize UX and output reliability.",
    "Decide quickly when decisions are reversible.",
    "Escalate only when truly necessary.",
    "Keep all major decisions recorded.",
    "Never allow workstreams to sit idle.",
    "Prefer explicit ownership over shared ambiguity.",
    "Preserve compatibility, extensibility, and clarity.",
    "Read and follow the product docs in the repo as controlling guidance.",
    "Proceed aggressively but intelligently."
  ]
};

export const coreAgents: readonly AgentDefinition[] = [
  {
    agentId: "iron-forge",
    name: "IRON FORGE",
    role: "Executive Program Director + Chief Product and Technical Officer",
    authorityLevel: "top-level",
    mission: "Drive Course Creator OS forward with disciplined priorities, decisions, and execution.",
    owns: [
      "product direction",
      "cross-agent priorities",
      "architecture and UX tie-breaks",
      "workstream restructuring"
    ],
    mustDeliver: ["priority directives", "final internal decisions", "execution summaries"],
    mustNot: [
      "let reversible decisions stall",
      "allow cross-domain debate to idle the project"
    ],
    successStandard: "The project moves with clarity, speed, and premium standards.",
    escalationToHuman: operatingManual.escalationToHuman
  },
  {
    agentId: "blueprint",
    name: "BLUEPRINT",
    role: "Lead Solutions / Application / System Architect",
    authorityLevel: "domain-authority",
    mission: "Protect modular, scalable, and resilient system architecture.",
    owns: [
      "system architecture",
      "package boundaries",
      "service contracts",
      "persistence strategy",
      "integration isolation"
    ],
    mustDeliver: [
      "architecture diagrams",
      "module contracts",
      "migration strategies",
      "technical risk evaluations"
    ],
    mustNot: [
      "ship clever but fragile architecture",
      "make visual design decisions"
    ],
    successStandard: "The codebase remains understandable and extensible under growth."
  },
  {
    agentId: "velvet-grid",
    name: "VELVET GRID",
    role: "Chief Product Designer + UX Director",
    authorityLevel: "domain-authority",
    mission: "Create a premium, calm, navy-anchored experience that never feels confusing.",
    owns: [
      "information architecture",
      "navigation logic",
      "interaction patterns",
      "design system direction",
      "visual polish rules"
    ],
    mustDeliver: [
      "workflow maps",
      "screen structures",
      "component behavior standards",
      "design token proposals"
    ],
    mustNot: [
      "allow UX clutter for convenience",
      "accept confusing workflows because they are easy to implement"
    ],
    successStandard: "The product feels like a premium creative suite users trust immediately."
  },
  {
    agentId: "fairway-mind",
    name: "FAIRWAY MIND",
    role: "Golf Simulator Logic Architect + Gameplay Systems Designer",
    authorityLevel: "domain-authority",
    mission: "Keep simulator logic visible, configurable, playable, and export-safe.",
    owns: [
      "tee and pin models",
      "metadata integrity",
      "surface and hazard logic",
      "playability logic rules",
      "simulator readiness validation"
    ],
    mustDeliver: [
      "simulator logic schemas",
      "playability rules",
      "metadata completeness definitions",
      "validation conditions"
    ],
    mustNot: [
      "let spectacle hide broken golf logic",
      "accept vague simulator assumptions"
    ],
    successStandard: "Creators can configure reliable gameplay without leaving the app."
  },
  {
    agentId: "worldsmith",
    name: "WORLDSMITH",
    role: "Course Worldbuilding Director",
    authorityLevel: "domain-authority",
    mission: "Make course environments feel coherent, intentional, and memorable.",
    owns: [
      "world identity systems",
      "district structures",
      "landmark hierarchy",
      "support-space plausibility",
      "theme-pack logic"
    ],
    mustDeliver: [
      "world system definitions",
      "district structures",
      "landmark relationships",
      "composition rules"
    ],
    mustNot: [
      "treat environments as disconnected decor",
      "allow visual soup from inconsistent world logic"
    ],
    successStandard: "Worlds built with the app feel designed rather than assembled."
  },
  {
    agentId: "spark-engine",
    name: "SPARK ENGINE",
    role: "Lead Application Engineer",
    authorityLevel: "domain-authority",
    mission: "Build the app codebase to a production-grade standard.",
    owns: [
      "desktop shell implementation",
      "app composition",
      "frontend structure",
      "package integration",
      "engineering standards"
    ],
    mustDeliver: [
      "production-grade scaffolds",
      "component implementations",
      "package wiring",
      "typed APIs"
    ],
    mustNot: [
      "bury domain logic in UI files",
      "cut structural corners for speed"
    ],
    successStandard: "The foundation is strong, typed, and ready to scale."
  },
  {
    agentId: "deep-current",
    name: "DEEP CURRENT",
    role: "Integration and Toolchain Engineer",
    authorityLevel: "domain-authority",
    mission: "Provide managed integration paths without exposing chaos to the user.",
    owns: [
      "tool path contracts",
      "orchestration bridges",
      "integration health checks",
      "external execution wrappers"
    ],
    mustDeliver: [
      "tool adapter interfaces",
      "orchestration flows",
      "integration state definitions",
      "failure and recovery behaviors"
    ],
    mustNot: [
      "let tool-specific assumptions leak into the UI",
      "build brittle direct dependencies on external tools"
    ],
    successStandard: "The system stays unified while benefiting from external capabilities."
  },
  {
    agentId: "northstar",
    name: "NORTHSTAR",
    role: "Product Manager + Business Analyst",
    authorityLevel: "domain-authority",
    mission: "Keep requirements clear, structured, and aligned to user intent.",
    owns: [
      "requirements capture",
      "acceptance criteria",
      "roadmap integrity",
      "feature sequencing intent"
    ],
    mustDeliver: [
      "feature briefs",
      "user stories",
      "acceptance criteria",
      "dependency notes"
    ],
    mustNot: [
      "allow vague features into implementation",
      "let requirements drift casually"
    ],
    successStandard: "The team always knows what is being built and why."
  },
  {
    agentId: "steel-check",
    name: "STEEL CHECK",
    role: "QA Director + Validation Architect",
    authorityLevel: "domain-authority",
    mission: "Make the product trustworthy by designing validation strategy and quality bars.",
    owns: [
      "validator strategy",
      "issue severity model",
      "test priorities",
      "release gating logic"
    ],
    mustDeliver: [
      "validation categories",
      "test plans",
      "issue models",
      "release blockers"
    ],
    mustNot: [
      "treat QA as late cleanup",
      "permit avoidable fragile flows into release candidates"
    ],
    successStandard: "The product catches problems early and clearly."
  },
  {
    agentId: "glasshouse",
    name: "GLASSHOUSE",
    role: "Production Support + Reliability Engineer",
    authorityLevel: "domain-authority",
    mission: "Ensure the product feels safe, recoverable, diagnosable, and supportable.",
    owns: [
      "diagnostics strategy",
      "structured logging",
      "snapshots and restore guidance",
      "repair workflows"
    ],
    mustDeliver: [
      "logging standards",
      "restore workflow definitions",
      "crash safety expectations",
      "support diagnostics models"
    ],
    mustNot: [
      "accept silent failure paths",
      "leave destructive actions without recovery logic"
    ],
    successStandard: "Creators feel safe using the app for long-running work."
  },
  {
    agentId: "lenswork",
    name: "LENSWORK",
    role: "Preview / Presentation / Camera Systems Director",
    authorityLevel: "domain-authority",
    mission: "Make preview, flyover, minimap, and showcase flows polished and first-class.",
    owns: [
      "preview systems",
      "flyover structures",
      "screenshot planning",
      "showcase sequences"
    ],
    mustDeliver: [
      "preview entity definitions",
      "flyover requirements",
      "minimap workflow structures",
      "preview readiness criteria"
    ],
    mustNot: [
      "treat previews as an afterthought",
      "allow weak showcase tooling in a visually ambitious product"
    ],
    successStandard: "Creators can present courses beautifully and confidently."
  },
  {
    agentId: "blackbook",
    name: "BLACKBOOK",
    role: "Decision Historian + Governance Agent",
    authorityLevel: "domain-authority",
    mission: "Preserve continuity, decisions, assumptions, and risk memory across the project.",
    owns: [
      "decision log",
      "ADR records",
      "assumptions register",
      "change rationale",
      "continuity summaries"
    ],
    mustDeliver: [
      "decision entries",
      "rationale summaries",
      "referenceable governance records",
      "issue history"
    ],
    mustNot: [
      "allow major decisions to vanish into chat history",
      "reopen settled questions without cause"
    ],
    successStandard: "The project keeps memory and context over time."
  },
  {
    agentId: "tempo",
    name: "TEMPO",
    role: "Delivery Manager + Program Scheduler",
    authorityLevel: "domain-authority",
    mission: "Keep all workstreams active, coordinated, and appropriately sequenced.",
    owns: [
      "workstream orchestration",
      "dependency tracking",
      "parallel lane management",
      "blocker routing"
    ],
    mustDeliver: [
      "current lane map",
      "blockers list",
      "active queue priorities",
      "reassignment decisions"
    ],
    mustNot: [
      "let the team sit idle behind one dependency",
      "confuse motion with progress"
    ],
    successStandard: "The project keeps moving with high throughput and minimal downtime."
  }
] as const;

export const optionalSpecialistAgents: readonly OptionalSpecialistAgent[] = [
  {
    agentId: "navy-ink",
    name: "NAVY INK",
    role: "Content and interface copy specialist",
    useCase: "Use when interface copy, helper text, or onboarding language needs tightening.",
    requiredInputs: ["mission", "scope", "deliverables", "stop conditions"]
  },
  {
    agentId: "material-sage",
    name: "MATERIAL SAGE",
    role: "Material and shader systems expert",
    useCase: "Use when material systems or environmental look-dev need specialized guidance.",
    requiredInputs: ["mission", "scope", "owner relationship", "deliverables", "stop conditions"]
  },
  {
    agentId: "canopy",
    name: "CANOPY",
    role: "Vegetation and scene-density specialist",
    useCase: "Use when planting density or environmental composition risks need focused work.",
    requiredInputs: ["mission", "scope", "deliverables", "stop conditions"]
  },
  {
    agentId: "redline",
    name: "REDLINE",
    role: "Performance optimization specialist",
    useCase: "Use when performance risk is concentrated and needs targeted optimization work.",
    requiredInputs: ["mission", "scope", "owner relationship", "deliverables", "stop conditions"]
  },
  {
    agentId: "patchbay",
    name: "PATCHBAY",
    role: "Bug triage and hotfix specialist",
    useCase: "Use when regression or release-blocking defects need focused triage.",
    requiredInputs: ["mission", "scope", "deliverables", "stop conditions"]
  },
  {
    agentId: "anchor",
    name: "ANCHOR",
    role: "Persistence and migration specialist",
    useCase: "Use when storage contracts or migration work needs concentrated attention.",
    requiredInputs: ["mission", "scope", "owner relationship", "deliverables", "stop conditions"]
  },
  {
    agentId: "rail-switch",
    name: "RAIL SWITCH",
    role: "Workflow automation specialist",
    useCase: "Use when automation or delivery orchestration needs focused implementation.",
    requiredInputs: ["mission", "scope", "deliverables", "stop conditions"]
  }
] as const;

export const deliveryLanes: readonly DeliveryLane[] = [
  {
    laneId: "governance-docs",
    title: "Product and governance docs",
    objective: "Keep specs, decisions, and continuity artifacts current.",
    ownerAgentId: "blackbook",
    active: true
  },
  {
    laneId: "app-shell",
    title: "App shell and navigation",
    objective: "Advance the desktop shell, navigation, and workspace composition.",
    ownerAgentId: "spark-engine",
    active: true
  },
  {
    laneId: "design-system",
    title: "Design system and component library",
    objective: "Lock visual language, primitives, and UX consistency.",
    ownerAgentId: "velvet-grid",
    active: true
  },
  {
    laneId: "project-persistence",
    title: "Project model and persistence",
    objective: "Protect deterministic project structure and recoverable persistence.",
    ownerAgentId: "blueprint",
    active: true
  },
  {
    laneId: "sim-logic",
    title: "Simulator logic",
    objective: "Model and validate tee, pin, hazard, and output-readiness rules.",
    ownerAgentId: "fairway-mind",
    active: true
  },
  {
    laneId: "asset-world",
    title: "Asset and world systems",
    objective: "Advance assets, districts, landmarks, and supporting world logic.",
    ownerAgentId: "worldsmith",
    active: true
  },
  {
    laneId: "validation-qa",
    title: "Validation and QA",
    objective: "Strengthen issue models, validators, and release confidence.",
    ownerAgentId: "steel-check",
    active: true
  },
  {
    laneId: "preview-packaging",
    title: "Preview and packaging",
    objective: "Advance preview readiness, media outputs, and release candidate flow.",
    ownerAgentId: "lenswork",
    active: true
  },
  {
    laneId: "diagnostics-recovery",
    title: "Diagnostics and recovery",
    objective: "Keep safety, logging, and restore workflows first-class.",
    ownerAgentId: "glasshouse",
    active: true
  }
] as const;

export const roadmapStages: readonly RoadmapStage[] = [
  {
    stageId: "stage-0",
    title: "Stage 0 — Governance and Product Lock",
    objective: "Lock product definition, architecture direction, agent operating model, and design principles.",
    status: "complete",
    workstreamIds: ["workstream-a", "workstream-b", "workstream-c"],
    exitCriteria: [
      "Foundational docs exist.",
      "Architecture direction is approved.",
      "Agent ownership is clear.",
      "Primary product modes are defined."
    ]
  },
  {
    stageId: "stage-1",
    title: "Stage 1 — Foundation and Shell",
    objective: "Create the technical base, monorepo, design tokens, app shell, and primary navigation.",
    status: "complete",
    workstreamIds: ["workstream-b", "workstream-c", "workstream-d"],
    exitCriteria: [
      "App runs locally.",
      "Major routes exist.",
      "Shell reflects product IA.",
      "Shared tokens and UI primitives are in place."
    ]
  },
  {
    stageId: "stage-2",
    title: "Stage 2 — Core Domain Systems",
    objective: "Implement real domain entities, persistence direction, and storage foundations.",
    status: "active",
    workstreamIds: ["workstream-e", "workstream-f", "workstream-g", "workstream-k"],
    exitCriteria: [
      "Core entities are typed.",
      "Storage paths are established.",
      "Project creation writes real structure.",
      "Domain packages are testable outside the UI."
    ]
  },
  {
    stageId: "stage-3",
    title: "Stage 3 — Core Workspaces",
    objective: "Implement creator-facing workspaces with real data flow.",
    status: "active",
    workstreamIds: ["workstream-c", "workstream-d", "workstream-l"],
    exitCriteria: [
      "Users can create a real project.",
      "Users can navigate major modules.",
      "Users can edit and persist core data.",
      "Workspaces remain understandable."
    ]
  },
  {
    stageId: "stage-4",
    title: "Stage 4 — Validation, Performance, and Recovery",
    objective: "Make the product trustworthy, diagnosable, and safe.",
    status: "active",
    workstreamIds: ["workstream-h", "workstream-i"],
    exitCriteria: [
      "Issues are detected and presented clearly.",
      "Project state can be recovered.",
      "Performance profiles are visible and explainable.",
      "Diagnostics are actionable."
    ]
  },
  {
    stageId: "stage-5",
    title: "Stage 5 — Preview, Packaging, and Publish",
    objective: "Build release-facing confidence and output workflows.",
    status: "planned",
    workstreamIds: ["workstream-j"],
    exitCriteria: [
      "Preview data has a clear home.",
      "Package readiness is visible.",
      "Release metadata is managed in-app."
    ]
  },
  {
    stageId: "stage-6",
    title: "Stage 6 — Agent Command and Product Hardening",
    objective: "Refine guidance, polish the UX, and harden the codebase.",
    status: "planned",
    workstreamIds: ["workstream-l", "workstream-h"],
    exitCriteria: [
      "Agent guidance is helpful and not noisy.",
      "Navigation and workflows feel premium.",
      "Codebase health is strong."
    ]
  }
] as const;

export const workstreams: readonly Workstream[] = [
  {
    workstreamId: "workstream-a",
    title: "Workstream A — Governance, Product, and Decision Continuity",
    ownerAgentIds: ["northstar", "blackbook"],
    scope: [
      "governance docs",
      "product briefs",
      "acceptance criteria",
      "decision logging",
      "roadmap upkeep",
      "module status board"
    ],
    starts: "Immediately",
    dependsOn: ["product lock"],
    status: "active",
    currentFocus: "Keep roadmap, decisions, and governance artifacts aligned to actual implementation."
  },
  {
    workstreamId: "workstream-b",
    title: "Workstream B — Architecture and Package Foundation",
    ownerAgentIds: ["blueprint"],
    scope: [
      "monorepo structure",
      "package boundaries",
      "dependency rules",
      "service architecture",
      "persistence strategy",
      "ADRs"
    ],
    starts: "Immediately",
    dependsOn: ["product lock"],
    status: "active",
    currentFocus: "Protect explicit domain ownership and service boundaries."
  },
  {
    workstreamId: "workstream-c",
    title: "Workstream C — Design System and UX Foundation",
    ownerAgentIds: ["velvet-grid"],
    scope: [
      "design tokens",
      "AppShell layouts",
      "navigation standards",
      "screen structure",
      "component patterns",
      "global health and validation patterns"
    ],
    starts: "Immediately",
    dependsOn: ["UX and design-system specs"],
    status: "active",
    currentFocus: "Keep shell and workspace UX authoritative, premium, and legible."
  },
  {
    workstreamId: "workstream-d",
    title: "Workstream D — App Shell and Platform Composition",
    ownerAgentIds: ["spark-engine"],
    scope: [
      "desktop shell",
      "workspace routing",
      "navigation wiring",
      "app composition",
      "command palette foundation",
      "utility tray framework"
    ],
    starts: "After repo and package foundations exist",
    dependsOn: ["workstream-b", "workstream-c"],
    status: "active",
    currentFocus: "Turn the desktop shell into the stable composition layer for every module."
  },
  {
    workstreamId: "workstream-e",
    title: "Workstream E — Project Model and Persistence",
    ownerAgentIds: ["blueprint", "spark-engine"],
    scope: [
      "project manifest",
      "core entities",
      "storage adapters",
      "SQLite foundations",
      "project creation flow",
      "snapshots foundation"
    ],
    starts: "Early foundation phase",
    dependsOn: ["workstream-b"],
    status: "active",
    currentFocus: "Move from schema-only persistence direction toward real adapters and project writes."
  },
  {
    workstreamId: "workstream-f",
    title: "Workstream F — Simulator Logic Center",
    ownerAgentIds: ["fairway-mind"],
    scope: [
      "tee and pin schemas",
      "hole metadata rules",
      "surface and hazard models",
      "drop zone model",
      "logic completeness rules",
      "simulator validation contracts"
    ],
    starts: "Early domain phase",
    dependsOn: ["workstream-b", "workstream-e"],
    status: "active",
    currentFocus: "Deepen simulator correctness so packaging confidence is earned."
  },
  {
    workstreamId: "workstream-g",
    title: "Workstream G — Asset and World Systems",
    ownerAgentIds: ["worldsmith", "spark-engine"],
    scope: [
      "asset model",
      "import normalization state",
      "asset browser foundations",
      "districts and landmarks",
      "world composition structures",
      "theme-pack readiness"
    ],
    starts: "Early domain phase",
    dependsOn: ["workstream-b", "workstream-e"],
    status: "active",
    currentFocus: "Advance world cohesion and asset governance under real package ownership."
  },
  {
    workstreamId: "workstream-h",
    title: "Workstream H — Validation and QA",
    ownerAgentIds: ["steel-check"],
    scope: [
      "validation issue model",
      "validation engines",
      "severity system",
      "readiness states",
      "issue card behaviors",
      "quality gates",
      "test planning"
    ],
    starts: "Early, alongside domain modeling",
    dependsOn: ["workstream-b", "workstream-e", "workstream-f", "workstream-g"],
    status: "active",
    currentFocus: "Keep validation early and actionable instead of bolted on later."
  },
  {
    workstreamId: "workstream-i",
    title: "Workstream I — Performance and Diagnostics",
    ownerAgentIds: ["glasshouse"],
    scope: [
      "performance profiles",
      "project diagnostics",
      "logging standards",
      "task logging",
      "issue triage surfaces",
      "restore and recovery patterns"
    ],
    starts: "Middle foundation phase",
    dependsOn: ["workstream-e", "workstream-h"],
    status: "active",
    currentFocus: "Strengthen trust layers without waiting for packaging to force them."
  },
  {
    workstreamId: "workstream-j",
    title: "Workstream J — Preview and Packaging",
    ownerAgentIds: ["lenswork", "spark-engine"],
    scope: [
      "preview entities",
      "flyover and minimap structures",
      "package model",
      "publish metadata model",
      "release candidate flow"
    ],
    starts: "After core domain models are stable",
    dependsOn: ["workstream-e", "workstream-f", "workstream-h"],
    status: "planned",
    currentFocus: "Prepare release-facing confidence systems once storage and simulator correctness are stronger."
  },
  {
    workstreamId: "workstream-k",
    title: "Workstream K — Integration Layer",
    ownerAgentIds: ["deep-current"],
    scope: [
      "adapter interfaces",
      "tool path model",
      "integration health",
      "bridge abstractions",
      "managed execution contracts"
    ],
    starts: "After architecture and project model are stable enough",
    dependsOn: ["workstream-b", "workstream-e"],
    status: "active",
    currentFocus: "Keep external-tool assumptions isolated behind bridges before real integrations arrive."
  },
  {
    workstreamId: "workstream-l",
    title: "Workstream L — Agent Command Center",
    ownerAgentIds: ["iron-forge", "spark-engine"],
    scope: [
      "agent state model",
      "recommendation surfaces",
      "active queue visibility",
      "decision summaries",
      "module progress visibility"
    ],
    starts: "After app shell and core state foundation exist",
    dependsOn: ["workstream-d", "workstream-e", "workstream-a"],
    status: "active",
    currentFocus: "Turn the Agent Command Center into a real coordination surface instead of a placeholder."
  }
] as const;

export const qualityGates: readonly QualityGate[] = [
  {
    gateId: "architecture-gate",
    title: "Architecture Gate",
    rules: [
      "Ownership is defined.",
      "Package destination is defined.",
      "Interfaces are defined.",
      "Persistence impact is understood."
    ]
  },
  {
    gateId: "ux-gate",
    title: "UX Gate",
    rules: [
      "Primary action is obvious.",
      "Navigation is clear.",
      "Right rail behavior is defined.",
      "Empty state is handled.",
      "Validation surface is defined."
    ]
  },
  {
    gateId: "domain-gate",
    title: "Domain Gate",
    rules: [
      "Entity ownership is clear.",
      "Schema is typed.",
      "State transitions are explicit.",
      "Validation assumptions are documented."
    ]
  },
  {
    gateId: "testing-gate",
    title: "Testing Gate",
    rules: [
      "Critical domain tests exist.",
      "Key state transitions are covered.",
      "Validation output is testable."
    ]
  },
  {
    gateId: "release-gate",
    title: "Release Gate",
    rules: [
      "Blockers are surfaced correctly.",
      "Readiness status is visible.",
      "Failure states are actionable."
    ]
  }
] as const;

export const milestones: readonly Milestone[] = [
  {
    milestoneId: "milestone-1",
    title: "Milestone 1 — Product Skeleton Exists",
    status: "complete",
    outcomes: [
      "Repo structured.",
      "Docs in place.",
      "Shell runs.",
      "Navigation visible.",
      "Design tokens active."
    ]
  },
  {
    milestoneId: "milestone-2",
    title: "Milestone 2 — Core Domain Model Exists",
    status: "active",
    outcomes: [
      "Project creation works.",
      "Manifest persists.",
      "Domain entities exist.",
      "Storage foundation works."
    ]
  },
  {
    milestoneId: "milestone-3",
    title: "Milestone 3 — Creator Workflow Exists",
    status: "active",
    outcomes: [
      "Users can create and edit through major workspaces.",
      "Simulator logic has a real home.",
      "Asset and world structures exist."
    ]
  },
  {
    milestoneId: "milestone-4",
    title: "Milestone 4 — Trust Layer Exists",
    status: "active",
    outcomes: [
      "Validation works.",
      "Diagnostics exist.",
      "Snapshots and recovery exist.",
      "Health and readiness are visible."
    ]
  },
  {
    milestoneId: "milestone-5",
    title: "Milestone 5 — Release Path Exists",
    status: "planned",
    outcomes: [
      "Preview structures exist.",
      "Package workflows exist.",
      "Publish metadata exists."
    ]
  },
  {
    milestoneId: "milestone-6",
    title: "Milestone 6 — Product Feels Premium",
    status: "planned",
    outcomes: [
      "Agent Command Center exists.",
      "Polish passes completed.",
      "UX coherence is strong.",
      "Module readiness is stabilized."
    ]
  }
] as const;

export const startupSequence: readonly StartupStep[] = [
  { step: 1, ownerAgentId: "iron-forge", action: "Confirm active objectives." },
  { step: 2, ownerAgentId: "blueprint", action: "Finalize architecture boundaries." },
  { step: 3, ownerAgentId: "velvet-grid", action: "Lock navigation and design-system direction." },
  { step: 4, ownerAgentId: "northstar", action: "Convert specs into module-level requirements." },
  { step: 5, ownerAgentId: "fairway-mind", action: "Finalize simulator logic schemas." },
  { step: 6, ownerAgentId: "spark-engine", action: "Scaffold and extend the codebase." },
  { step: 7, ownerAgentId: "deep-current", action: "Define integration interfaces." },
  { step: 8, ownerAgentId: "steel-check", action: "Define validator categories and quality bars." },
  { step: 9, ownerAgentId: "glasshouse", action: "Define recovery and logging expectations." },
  { step: 10, ownerAgentId: "tempo", action: "Establish parallel delivery lanes." },
  { step: 11, ownerAgentId: "blackbook", action: "Record all starting decisions." }
] as const;

export const conflictResolutionRules: readonly ConflictResolutionRule[] = [
  { domain: "Architecture disputes", ownerAgentId: "blueprint" },
  { domain: "UX disputes", ownerAgentId: "velvet-grid" },
  { domain: "Simulator and gameplay disputes", ownerAgentId: "fairway-mind" },
  { domain: "Quality and release disputes", ownerAgentId: "steel-check" },
  { domain: "Sequencing disputes", ownerAgentId: "tempo" },
  { domain: "Final tie-break", ownerAgentId: "iron-forge" }
] as const;

export const defaultAgentStatuses: readonly AgentStatus[] = [
  {
    agentId: "iron-forge",
    state: "running",
    currentFocus: "Hold product direction, sequencing, and tie-break authority steady.",
    summary: "Driving cross-domain priorities and keeping workstreams aligned to the premium product bar.",
    activeTaskCount: 2,
    blockedTaskCount: 0,
    laneId: null,
    updatedAt: "2026-04-13T12:00:00.000Z"
  },
  {
    agentId: "blueprint",
    state: "running",
    currentFocus: "Protect package boundaries, storage direction, and integration isolation.",
    summary: "Keeping the architecture scalable while domain packages and workspaces deepen.",
    activeTaskCount: 2,
    blockedTaskCount: 0,
    laneId: "project-persistence",
    updatedAt: "2026-04-13T12:00:00.000Z"
  },
  {
    agentId: "velvet-grid",
    state: "running",
    currentFocus: "Keep the shell, workspaces, and decision surfaces premium and obvious.",
    summary: "Driving clarity so the product never feels like a cluttered utility.",
    activeTaskCount: 2,
    blockedTaskCount: 0,
    laneId: "design-system",
    updatedAt: "2026-04-13T12:00:00.000Z"
  },
  {
    agentId: "fairway-mind",
    state: "running",
    currentFocus: "Deepen simulator logic and protect export correctness.",
    summary: "Keeping gameplay data first-class and packaging-aware.",
    activeTaskCount: 2,
    blockedTaskCount: 0,
    laneId: "sim-logic",
    updatedAt: "2026-04-13T12:00:00.000Z"
  },
  {
    agentId: "worldsmith",
    state: "running",
    currentFocus: "Keep world systems coherent across districts, landmarks, and support spaces.",
    summary: "Protecting thematic flexibility so the tool never becomes theme-locked.",
    activeTaskCount: 1,
    blockedTaskCount: 0,
    laneId: "asset-world",
    updatedAt: "2026-04-13T12:00:00.000Z"
  },
  {
    agentId: "spark-engine",
    state: "running",
    currentFocus: "Implement premium workspaces on top of stable shared contracts.",
    summary: "Shipping the desktop experience without collapsing domain logic into UI files.",
    activeTaskCount: 2,
    blockedTaskCount: 0,
    laneId: "app-shell",
    updatedAt: "2026-04-13T12:00:00.000Z"
  },
  {
    agentId: "deep-current",
    state: "idle",
    currentFocus: "Hold integration abstraction and managed tool-path planning ready.",
    summary: "Available for deeper bridge and orchestration work once integration flows are expanded.",
    activeTaskCount: 0,
    blockedTaskCount: 0,
    laneId: null,
    updatedAt: "2026-04-13T12:00:00.000Z"
  },
  {
    agentId: "northstar",
    state: "running",
    currentFocus: "Keep requirements, release posture, and roadmap language aligned.",
    summary: "Making sure module work still reflects the approved full-product spec.",
    activeTaskCount: 1,
    blockedTaskCount: 0,
    laneId: "governance-docs",
    updatedAt: "2026-04-13T12:00:00.000Z"
  },
  {
    agentId: "steel-check",
    state: "running",
    currentFocus: "Expand validation and release gating depth without creating noise.",
    summary: "Driving actionable issue models and quality gates across the product.",
    activeTaskCount: 2,
    blockedTaskCount: 0,
    laneId: "validation-qa",
    updatedAt: "2026-04-13T12:00:00.000Z"
  },
  {
    agentId: "glasshouse",
    state: "running",
    currentFocus: "Improve recovery, diagnostics, and creator trust surfaces.",
    summary: "Making the product feel safe during long-running work and candidate packaging.",
    activeTaskCount: 1,
    blockedTaskCount: 0,
    laneId: "diagnostics-recovery",
    updatedAt: "2026-04-13T12:00:00.000Z"
  },
  {
    agentId: "lenswork",
    state: "idle",
    currentFocus: "Stand by for deeper preview polish and showcase tooling.",
    summary: "Preview foundations exist, but richer cinematic tooling is still queued.",
    activeTaskCount: 0,
    blockedTaskCount: 0,
    laneId: "preview-packaging",
    updatedAt: "2026-04-13T12:00:00.000Z"
  },
  {
    agentId: "blackbook",
    state: "running",
    currentFocus: "Keep decisions, assumptions, and continuity records referenceable.",
    summary: "Preventing governance drift as implementation accelerates.",
    activeTaskCount: 1,
    blockedTaskCount: 0,
    laneId: "governance-docs",
    updatedAt: "2026-04-13T12:00:00.000Z"
  },
  {
    agentId: "tempo",
    state: "running",
    currentFocus: "Keep the active lanes balanced and no-idle discipline enforced.",
    summary: "Sequencing work so the product moves forward without dependency paralysis.",
    activeTaskCount: 1,
    blockedTaskCount: 0,
    laneId: null,
    updatedAt: "2026-04-13T12:00:00.000Z"
  }
] as const;

export const defaultAgentTasks: readonly AgentTask[] = [
  {
    taskId: "task-architecture-alignment",
    ownerAgentId: "blueprint",
    title: "Keep package boundaries aligned to approved specs",
    status: "active",
    summary: "Protect domain ownership and prevent schema drift as new packages land.",
    relatedLaneId: "project-persistence",
    stopCondition: "The repo matches the approved package ownership map."
  },
  {
    taskId: "task-ux-command-center",
    ownerAgentId: "velvet-grid",
    title: "Shape the Agent Command Center into a guidance-first workspace",
    status: "active",
    summary: "Expose roster, next actions, and risks without turning the screen into noise.",
    relatedLaneId: "design-system",
    stopCondition: "The screen remains authoritative and clear."
  },
  {
    taskId: "task-validation-growth",
    ownerAgentId: "steel-check",
    title: "Expand validator coverage with clear remediation paths",
    status: "active",
    summary: "Keep issue UX actionable as domain depth increases.",
    relatedLaneId: "validation-qa",
    stopCondition: "Every major issue category has a fix path."
  },
  {
    taskId: "task-governance-memory",
    ownerAgentId: "blackbook",
    title: "Keep assumptions and decisions referenceable",
    status: "active",
    summary: "Prevent important product direction from vanishing into implementation churn.",
    relatedLaneId: "governance-docs",
    stopCondition: "Major decisions and assumptions are documented and linkable."
  }
] as const;

export const defaultRecommendations: readonly Recommendation[] = [
  {
    recommendationId: "rec-agent-docs",
    moduleKey: "agent-command",
    title: "Lock the operating model before specialist work expands",
    rationale: "Clear authority and escalation rules prevent overlap and repeated debate.",
    recommendedOwnerAgentId: "iron-forge"
  },
  {
    recommendationId: "rec-persistence",
    moduleKey: "version-control",
    title: "Advance storage adapters next",
    rationale: "Project portability and recovery depend on real persistence contracts, not only schemas.",
    recommendedOwnerAgentId: "blueprint"
  },
  {
    recommendationId: "rec-sim-logic",
    moduleKey: "gameplay",
    title: "Deepen simulator-readiness rules before packaging expands",
    rationale: "Packaging confidence depends on reliable logic completeness checks.",
    recommendedOwnerAgentId: "fairway-mind"
  }
] as const;

export const defaultRiskSummaries: readonly RiskSummary[] = [
  {
    riskId: "risk-agent-drift",
    title: "Agents could drift back into overlapping ownership",
    severity: "warning",
    mitigation: "Keep package, UX, and governance ownership explicit in docs and code.",
    ownerAgentId: "iron-forge"
  },
  {
    riskId: "risk-memory-loss",
    title: "Important decisions could get lost across rapid implementation",
    severity: "warning",
    mitigation: "Update the decision log and assumptions register whenever major direction changes.",
    ownerAgentId: "blackbook"
  },
  {
    riskId: "risk-output-reliability",
    title: "Feature growth could outpace simulator and packaging correctness",
    severity: "high",
    mitigation: "Keep FAIRWAY MIND and STEEL CHECK involved in schema and validation evolution.",
    ownerAgentId: "fairway-mind"
  }
] as const;

export const defaultDecisionSummaries: readonly DecisionSummary[] = [
  {
    decisionId: "decision-agent-manual",
    title: "Adopt a formal agent operating manual",
    summary: "The project uses explicit charters, decision rights, escalation triggers, and delivery lanes to prevent drift.",
    decidedAt: "2026-04-13T00:00:00.000Z",
    decidedByAgentId: "iron-forge"
  },
  {
    decisionId: "decision-blackbook-register",
    title: "Make assumptions referenceable",
    summary: "BLACKBOOK keeps a dedicated assumptions register so user guardrails remain visible.",
    decidedAt: "2026-04-13T00:00:00.000Z",
    decidedByAgentId: "blackbook"
  }
] as const;

export function getAgentDefinition(agentId: string) {
  return coreAgents.find((agent) => agent.agentId === agentId) ?? null;
}

export function getAgentIdByName(name: string) {
  return coreAgents.find((agent) => agent.name === name)?.agentId ?? null;
}

export function getAgentStatus(agentId: string) {
  return defaultAgentStatuses.find((status) => status.agentId === agentId) ?? null;
}

export function getAgentName(agentId: string) {
  return getAgentDefinition(agentId)?.name ?? agentId;
}

export const governanceReferences: readonly GovernanceReference[] = [
  {
    referenceId: "product-master-brief",
    title: "PRODUCT_MASTER_BRIEF.md",
    summary: "Executive product definition and delivery standard.",
    path: "/Users/westlunds/Documents/Website/SImulator/PRODUCT_MASTER_BRIEF.md"
  },
  {
    referenceId: "decision-log",
    title: "DECISION_LOG.md",
    summary: "Durable record of product and architecture decisions.",
    path: "/Users/westlunds/Documents/Website/SImulator/DECISION_LOG.md"
  },
  {
    referenceId: "roadmap-master",
    title: "ROADMAP_MASTER.md",
    summary: "Stage plan, milestones, and execution posture.",
    path: "/Users/westlunds/Documents/Website/SImulator/ROADMAP_MASTER.md"
  },
  {
    referenceId: "module-status-board",
    title: "MODULE_STATUS_BOARD.md",
    summary: "Readiness, blockers, and next actions for every major module.",
    path: "/Users/westlunds/Documents/Website/SImulator/MODULE_STATUS_BOARD.md"
  }
] as const;

function severityRank(severity: RiskSummary["severity"]) {
  switch (severity) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "warning":
      return 2;
    case "info":
    default:
      return 1;
  }
}

export function buildAgentCommandSnapshot({
  project,
  validationReport
}: {
  project: CourseProject;
  validationReport: ValidationReport;
}): AgentCommandSnapshot {
  const activeAgents = [...defaultAgentStatuses].sort((left, right) => {
    const leftScore = left.state === "blocked" ? 3 : left.state === "running" ? 2 : left.state === "complete" ? 1 : 0;
    const rightScore = right.state === "blocked" ? 3 : right.state === "running" ? 2 : right.state === "complete" ? 1 : 0;
    return rightScore - leftScore;
  });

  const focusAreas: FocusArea[] = workstreams
    .filter((workstream) => workstream.status === "active" || workstream.status === "blocked")
    .map((workstream) => {
      const relatedModule = moduleDefinitions.find((definition) =>
        definition.owner === getAgentName(workstream.ownerAgentIds[0] ?? ""),
      );

      return {
        focusAreaId: workstream.workstreamId,
        title: workstream.title,
        summary: workstream.currentFocus,
        ownerAgentId: workstream.ownerAgentIds[0] ?? "iron-forge",
        moduleKey: relatedModule?.key ?? null,
        state: workstream.status
      };
    });

  const dynamicRecommendations: Recommendation[] = validationReport.nextActions.map((action, index) => {
    const moduleDefinition = moduleDefinitions.find((definition) => definition.key === action.moduleKey);
    return {
      recommendationId: `dynamic-rec-${action.moduleKey}-${index}`,
      moduleKey: action.moduleKey,
      title: action.title,
      rationale: action.reason,
      recommendedOwnerAgentId: getAgentIdByName(moduleDefinition?.owner ?? "") ?? "iron-forge"
    };
  });

  const suggestedNextActions =
    dynamicRecommendations.length > 0 ? dynamicRecommendations : [...defaultRecommendations];

  const blockedModules = moduleDefinitions
    .map((definition) => ({
      definition,
      status: project.moduleStatuses[definition.key]
    }))
    .filter(({ status }) => getModuleReadinessStatus(status) === "Blocked");

  const dynamicRisks: RiskSummary[] = [
    ...(blockedModules.length > 0
      ? [
          {
            riskId: "risk-blocked-modules",
            title: `${blockedModules.length} modules are currently blocked`,
            severity: blockedModules.some(({ status }) => status.blockers.length > 1) ? "high" : "warning",
            mitigation: blockedModules
              .map(({ definition, status }) => `${definition.shortTitle}: ${status.nextAction}`)
              .join(" "),
            ownerAgentId: "tempo"
          } satisfies RiskSummary
        ]
      : []),
    ...(validationReport.issueCounts.critical > 0
      ? [
          {
            riskId: "risk-critical-validation",
            title: "Critical validation issues still threaten product trust",
            severity: "high",
            mitigation: "Route the highest-severity fix path first and do not claim candidate readiness until the blockers clear.",
            ownerAgentId: "steel-check"
          } satisfies RiskSummary
        ]
      : []),
    ...(project.packagingState.readiness === "blocked"
      ? [
          {
            riskId: "risk-release-path",
            title: "Packaging posture remains blocked",
            severity: "warning",
            mitigation: "Keep simulator logic, preview readiness, and recovery posture aligned before the next package attempt.",
            ownerAgentId: "glasshouse"
          } satisfies RiskSummary
        ]
      : [])
  ];

  const openRisks = [...defaultRiskSummaries, ...dynamicRisks]
    .sort((left, right) => severityRank(right.severity) - severityRank(left.severity))
    .slice(0, 6);

  const decisionSummaries = [...defaultDecisionSummaries]
    .sort((left, right) => new Date(right.decidedAt).getTime() - new Date(left.decidedAt).getTime())
    .slice(0, 4);

  const moduleStatusBoard: ModuleStatusBoardItem[] = moduleDefinitions
    .map((definition) => {
      const status = project.moduleStatuses[definition.key];
      return {
        moduleKey: definition.key,
        title: definition.title,
        ownerAgentId: getAgentIdByName(definition.owner) ?? "iron-forge",
        readiness: getModuleReadinessStatus(status),
        completion: status.completion,
        blockerCount: status.blockers.length,
        nextAction: status.nextAction,
        stage: definition.stage
      };
    })
    .sort((left, right) => {
      const leftBlocked = left.readiness === "Blocked" ? 1 : 0;
      const rightBlocked = right.readiness === "Blocked" ? 1 : 0;
      if (leftBlocked !== rightBlocked) {
        return rightBlocked - leftBlocked;
      }

      return left.completion - right.completion;
    });

  return {
    activeAgents,
    focusAreas,
    suggestedNextActions,
    decisionSummaries,
    openRisks,
    moduleStatusBoard,
    governanceReferences: [...governanceReferences]
  };
}
