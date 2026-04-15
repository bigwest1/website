export const MODULE_KEYS = [
  "home",
  "create",
  "plan",
  "build",
  "gameplay",
  "asset-library",
  "world",
  "animate",
  "playability",
  "performance",
  "preview",
  "package",
  "publish",
  "version-control",
  "agent-command",
  "settings"
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export type ModuleState =
  | "not-started"
  | "defined"
  | "in-design"
  | "in-build"
  | "in-validation"
  | "ready-for-integration"
  | "ready"
  | "blocked";

export type WorkspaceSection = {
  title: string;
  description: string;
  items: string[];
};

export type ModuleDefinition = {
  key: ModuleKey;
  title: string;
  shortTitle: string;
  route: string;
  stage: string;
  owner: string;
  summary: string;
  currentFocus: string;
  deliverables: string[];
  qualityGates: string[];
  nextMove: string;
  workspaceSections: WorkspaceSection[];
};

export const moduleDefinitions: readonly ModuleDefinition[] = [
  {
    key: "home",
    title: "Home",
    shortTitle: "Home",
    route: "/",
    stage: "Home",
    owner: "VELVET GRID",
    summary: "Project access, diagnostics pulse, release history, and quick starts.",
    currentFocus: "Keep orientation, momentum, and project health visible from the first second.",
    deliverables: ["Recent projects", "Pinned flagship", "Diagnostics summary", "Quick actions"],
    qualityGates: ["Project health always visible", "Immediate next steps stay obvious"],
    nextMove: "Connect live recents, package history, and onboarding entry points.",
    workspaceSections: [
      {
        title: "Project Pulse",
        description: "Summarize readiness, blockers, and current attention.",
        items: ["Health score", "Validation counts", "Current focus"]
      },
      {
        title: "Launch Actions",
        description: "Expose the next deliberate moves without forcing the user to hunt.",
        items: ["Create project", "Resume planning", "Open publish queue"]
      }
    ]
  },
  {
    key: "create",
    title: "Create / Project Wizard",
    shortTitle: "Create",
    route: "/create",
    stage: "Create",
    owner: "NORTHSTAR",
    summary: "Initialize a clean project with target hardware, output posture, theme, and defaults.",
    currentFocus: "Turn creator intent into a strong manifest, starter docs, and safe presets.",
    deliverables: ["Project manifest", "Style presets", "Validation profile", "Starter documentation set"],
    qualityGates: ["Clear defaults", "No setup dead ends"],
    nextMove: "Implement wizard form state, templates, and manifest generation.",
    workspaceSections: [
      {
        title: "Intent Capture",
        description: "Gather the variables that shape the whole project.",
        items: [
          "Theme and course type",
          "Target hardware profile",
          "Realism vs stylization"
        ]
      },
      {
        title: "Output Setup",
        description: "Select release posture and validation expectations early.",
        items: ["Experimental vs public-safe", "Validation profile", "Output profile"]
      }
    ]
  },
  {
    key: "plan",
    title: "Plan / Course Bible",
    shortTitle: "Plan",
    route: "/plan",
    stage: "Plan",
    owner: "WORLDSMITH",
    summary: "Own the creative truth of the course, including course bible and hole planning.",
    currentFocus: "Anchor world identity, pacing, signature moments, and hole intent before build complexity explodes.",
    deliverables: ["Course bible", "Hole planner", "Style grammar", "Technical constraints"],
    qualityGates: ["Creative decisions are explicit", "Hole pacing and world rules stay coherent"],
    nextMove: "Add editable course bible sections and hole-plan boards.",
    workspaceSections: [
      {
        title: "Course Bible",
        description: "Define identity, audience, material language, lighting, and release intent.",
        items: ["Vision statement", "Environment logic", "Signature moments"]
      },
      {
        title: "Hole Planner",
        description: "Map the emotional and gameplay arc of every hole.",
        items: ["Challenge level", "Readability target", "Flyover notes"]
      }
    ]
  },
  {
    key: "build",
    title: "Build / Terrain & Routing Workspace",
    shortTitle: "Build",
    route: "/build",
    stage: "Build",
    owner: "BLUEPRINT",
    summary:
      "Author the course scene through terrain strategy, routing structure, and first-class 3D placement controls.",
    currentFocus:
      "Translate planning intent into spatial gameplay anchors, landmark hierarchy, and support-scene structure without breaking playability.",
    deliverables: [
      "Viewport and outliner",
      "Placement layers",
      "Transform inspector",
      "Routing overlays",
      "Validation and density overlays"
    ],
    qualityGates: [
      "Routing coherence",
      "Spatial state is persistable and inspectable",
      "Gameplay anchors are placed before scenic density expands"
    ],
    nextMove:
      "Place gameplay-critical objects, organize the outliner hierarchy, and close build validation gaps before denser scenic passes.",
    workspaceSections: [
      {
        title: "Scene Authoring",
        description: "Control spatial placement, hierarchy, snapping, and overlay review.",
        items: ["Viewport", "Outliner", "Transform inspector", "Quick actions"]
      },
      {
        title: "Routing Strategy",
        description: "Keep the playable route, world transitions, and landmark framing aligned.",
        items: ["Adjacency map", "Line-of-play overlays", "District transitions"]
      }
    ]
  },
  {
    key: "gameplay",
    title: "Gameplay & Simulator Logic Center",
    shortTitle: "Gameplay",
    route: "/gameplay",
    stage: "Build",
    owner: "FAIRWAY MIND",
    summary: "Centralize tee sets, pin sets, metadata, hazards, drop zones, minimap inputs, and export correctness.",
    currentFocus: "Make simulator logic visible, configurable, and validated before packaging.",
    deliverables: ["Tee manager", "Pin manager", "Surface assignments", "Logic warnings"],
    qualityGates: ["Metadata completeness", "Simulator correctness before export"],
    nextMove: "Implement editable simulator-logic forms with validation drilldowns.",
    workspaceSections: [
      {
        title: "Play Configuration",
        description: "Control how the course actually behaves in the simulator.",
        items: ["Tee sets", "Pin sets", "Hole order", "Par/distance metadata"]
      },
      {
        title: "Logic Integrity",
        description: "Track the issues that can break playability or export trust.",
        items: ["Hazards and OB", "Drop zones", "Preview metadata coverage"]
      }
    ]
  },
  {
    key: "asset-library",
    title: "Asset Library",
    shortTitle: "Assets",
    route: "/asset-library",
    stage: "Build",
    owner: "DEEP CURRENT",
    summary: "Normalize, inspect, tag, and approve imported content.",
    currentFocus: "Make asset quality and style compatibility visible before worldbuilding depends on bad content.",
    deliverables: ["Import queue", "Asset cards", "Normalization tools", "Approval workflow"],
    qualityGates: ["Traceable sources", "Consistent approval state"],
    nextMove: "Implement import normalization jobs and compatibility tagging.",
    workspaceSections: [
      {
        title: "Import Control",
        description: "Track what entered the project and what still needs inspection.",
        items: ["Import queue", "Source/license notes", "Rejected assets"]
      },
      {
        title: "Technical Hygiene",
        description: "Surface geometry, material, orientation, and scale health.",
        items: ["Poly estimates", "Scale status", "Pivot/orientation"]
      }
    ]
  },
  {
    key: "world",
    title: "World Builder",
    shortTitle: "World",
    route: "/world",
    stage: "World",
    owner: "WORLDSMITH",
    summary: "Design districts, landmarks, vegetation, support spaces, and world identity overlays.",
    currentFocus: "Make the course feel like one designed world rather than disconnected golf holes.",
    deliverables: ["District map", "Landmark registry", "Environmental zoning", "Support-space notes"],
    qualityGates: ["World cohesion", "Theme plausibility"],
    nextMove: "Add district composition boards and supporting scenery maps.",
    workspaceSections: [
      {
        title: "World Composition",
        description: "Control how districts and support spaces relate to the playable route.",
        items: ["Districts", "Landmarks", "Guest-space concepts"]
      },
      {
        title: "Environmental Identity",
        description: "Define atmosphere, vegetation, and supporting realism.",
        items: ["Vegetation zones", "World overlays", "Material continuity"]
      }
    ]
  },
  {
    key: "animate",
    title: "Animation & Events",
    shortTitle: "Animate",
    route: "/animate",
    stage: "Animate",
    owner: "LENSWORK",
    summary: "Plan ambient loops, attraction cycles, hole-triggered events, and spectacle hooks.",
    currentFocus: "Support living-world moments without letting spectacle break playability or performance.",
    deliverables: ["Ambient loop registry", "Event graph", "Conflict warnings", "Preview states"],
    qualityGates: ["Event intent is clear", "Conflicts are surfaced early"],
    nextMove: "Add event sequencing and timing validation.",
    workspaceSections: [
      {
        title: "Living World",
        description: "Catalog ongoing motion and timed sequences.",
        items: ["Ambient loops", "Scheduled scenes", "Attraction cycles"]
      },
      {
        title: "Gameplay Safety",
        description: "Catch conflicts between spectacle and player readability.",
        items: ["Event overlap warnings", "Shot-space conflicts", "Lighting hooks"]
      }
    ]
  },
  {
    key: "playability",
    title: "Playability Center",
    shortTitle: "Playability",
    route: "/playability",
    stage: "Playability",
    owner: "STEEL CHECK",
    summary: "Review shot readability, hazard fairness, obstructions, and spectacle interference.",
    currentFocus: "Make fairness and fun measurable enough to prevent avoidable frustration.",
    deliverables: ["Readability review", "Landing zone review", "Remediation guidance", "Issue queue"],
    qualityGates: ["Findings explain why they matter", "Fix paths are explicit"],
    nextMove: "Add hole-by-hole first-shot readability scoring.",
    workspaceSections: [
      {
        title: "Shot Review",
        description: "Inspect the player’s first read and intended decision space.",
        items: ["Opening-shot clarity", "Landing zones", "Green readability"]
      },
      {
        title: "Remediation",
        description: "Prescribe fixes instead of only flagging problems.",
        items: ["Hazard fairness", "Obstruction checks", "Recovery path notes"]
      }
    ]
  },
  {
    key: "performance",
    title: "Performance Center",
    shortTitle: "Performance",
    route: "/performance",
    stage: "Performance",
    owner: "GLASSHOUSE",
    summary: "Profile the course against Brother Mode, Community Safe, and Showcase targets.",
    currentFocus: "Present performance risk clearly without forcing creators to think like engine profilers.",
    deliverables: ["Profile comparisons", "Heatmaps", "Risk indicators", "Recommendations"],
    qualityGates: ["Metrics tie to profiles", "Risk language is understandable"],
    nextMove: "Add density heatmaps and zone scoring.",
    workspaceSections: [
      {
        title: "Profile Risk",
        description: "Compare the current project against each target posture.",
        items: ["Brother Mode", "Community Safe", "Showcase"]
      },
      {
        title: "Optimization Guidance",
        description: "Surface where the creator should spend effort first.",
        items: ["Geometry", "Textures", "Animation load", "Visibility complexity"]
      }
    ]
  },
  {
    key: "preview",
    title: "Preview Studio",
    shortTitle: "Preview",
    route: "/preview",
    stage: "Preview",
    owner: "LENSWORK",
    summary: "Plan flyovers, minimaps, screenshots, showcase shots, and reveal choreography.",
    currentFocus: "Treat preview outputs as first-class production assets instead of last-minute chores.",
    deliverables: ["Flyover registry", "Minimap workflow", "Screenshot framing", "Reveal notes"],
    qualityGates: ["Coverage gaps are obvious", "Outputs stay readable"],
    nextMove: "Add camera path editing and capture status.",
    workspaceSections: [
      {
        title: "Preview Assets",
        description: "Prepare what the creator and eventual players will see.",
        items: ["Flyovers", "Minimaps", "Screenshots"]
      },
      {
        title: "Showcase Planning",
        description: "Sequence how the course is introduced and revealed.",
        items: ["Shot list", "Reveal choreography", "Approval queue"]
      }
    ]
  },
  {
    key: "package",
    title: "Package Center",
    shortTitle: "Package",
    route: "/package",
    stage: "Package",
    owner: "GLASSHOUSE",
    summary: "Run dependency checks, logic readiness checks, and repeatable release-candidate generation.",
    currentFocus: "Turn validation confidence into actual export safety.",
    deliverables: ["Dependency checks", "Release candidates", "Output history", "Package notes"],
    qualityGates: ["Broken references are surfaced", "Candidate outputs stay reproducible"],
    nextMove: "Implement package recipes and output manifests.",
    workspaceSections: [
      {
        title: "Readiness Gates",
        description: "Collect the checks that decide whether packaging can proceed safely.",
        items: ["Broken references", "Critical validation issues", "Output profile mismatch"]
      },
      {
        title: "Build Output",
        description: "Track generated release candidates and diagnostics.",
        items: ["Candidate history", "Artifact counts", "Diagnostics summary"]
      }
    ]
  },
  {
    key: "publish",
    title: "Publish Center",
    shortTitle: "Publish",
    route: "/publish",
    stage: "Publish",
    owner: "BLACKBOOK",
    summary: "Prepare release notes, credits, showcase media, and publish-safe metadata.",
    currentFocus: "Make final release posture explicit so creators know what is safe to ship publicly.",
    deliverables: ["Release notes", "Credits", "Media checklist", "Version labels"],
    qualityGates: ["Public-safe posture is explicit", "Release metadata is complete"],
    nextMove: "Add release readiness checklist and metadata editor.",
    workspaceSections: [
      {
        title: "Release Story",
        description: "Frame the course for distribution and audience understanding.",
        items: ["Description", "Credits", "Notes", "Version labels"]
      },
      {
        title: "Public-Safe Review",
        description: "Separate private experiments from shippable releases.",
        items: ["Media checklist", "Publish-safe validation", "Channel posture"]
      }
    ]
  },
  {
    key: "version-control",
    title: "Version Control Center",
    shortTitle: "Versions",
    route: "/version-control",
    stage: "Version Control",
    owner: "BLACKBOOK",
    summary: "Track snapshots, restore points, change summaries, and file-health diagnostics.",
    currentFocus: "Make creators feel safe working through complex iteration.",
    deliverables: ["Snapshots", "Restore points", "Change summaries", "File health"],
    qualityGates: ["Recovery is obvious", "History is readable"],
    nextMove: "Add snapshot policies, restore previews, and release notes linking.",
    workspaceSections: [
      {
        title: "Recovery",
        description: "Preserve safe checkpoints and restore workflows.",
        items: ["Snapshots", "Restore points", "Autosave history"]
      },
      {
        title: "Continuity",
        description: "Make changes explainable over time.",
        items: ["Change summaries", "Release notes", "File-health diagnostics"]
      }
    ]
  },
  {
    key: "agent-command",
    title: "Agent Command Center",
    shortTitle: "Agents",
    route: "/agent-command",
    stage: "Agent Command",
    owner: "IRON FORGE",
    summary: "Coordinate AI assistance, task queues, recommendations, decisions, and risks.",
    currentFocus: "Provide structured help without overwhelming the creator or fragmenting ownership.",
    deliverables: ["Active roster", "Task queue", "Recommendation feed", "Risk list"],
    qualityGates: ["Recommendations are explainable", "Decision memory is preserved"],
    nextMove: "Add persistent task state and decision history linking.",
    workspaceSections: [
      {
        title: "AI Coordination",
        description: "Show who is active, what is in flight, and why.",
        items: ["Agent roster", "Task queue", "Decision summary"]
      },
      {
        title: "Operational Guidance",
        description: "Recommend next work while keeping the creator in control.",
        items: ["Suggested next steps", "Risk feed", "Project continuity"]
      }
    ]
  },
  {
    key: "settings",
    title: "Settings",
    shortTitle: "Settings",
    route: "/settings",
    stage: "Settings",
    owner: "DEEP CURRENT",
    summary: "Configure app behavior, tool paths, defaults, validation strictness, and integrations.",
    currentFocus: "Keep system-level configuration discoverable without polluting authoring workflows.",
    deliverables: ["Theme settings", "Tool paths", "Output preferences", "Diagnostic settings"],
    qualityGates: ["Advanced settings stay understandable", "Integration state is explicit"],
    nextMove: "Add settings persistence and managed integration controls.",
    workspaceSections: [
      {
        title: "Defaults",
        description: "Manage the baseline behavior creators rely on across projects.",
        items: ["Project defaults", "Performance defaults", "Validation strictness"]
      },
      {
        title: "Tooling",
        description: "Show which managed integrations and local tools are available.",
        items: ["Tool paths", "Managed integrations", "Diagnostics"]
      }
    ]
  }
] as const;

export function getModuleDefinition(key: ModuleKey) {
  return moduleDefinitions.find((definition) => definition.key === key);
}

export function getModuleDefinitionByRoute(pathname: string): ModuleDefinition {
  return moduleDefinitions.find((definition) => definition.route === pathname) ?? moduleDefinitions[0]!;
}
