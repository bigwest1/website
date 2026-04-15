# Module Contract Map

| Module | Primary Inputs | Primary Outputs | Core Services | Blocking Dependencies |
| --- | --- | --- | --- | --- |
| Home | Project health, module statuses, alerts | Next actions, high-level insights | project-health service | None |
| Create | Creator intent, target profiles, theme selection | Initial project manifest, defaults, starter docs | manifest factory | None |
| Plan | Course identity, hole intent, pacing decisions | Course bible and hole-planning outputs | planning service | Project manifest |
| Build | Hole plans, terrain rules, scene-authoring state | Scene graph, placement overlays, and routing directives | scene-authoring service | Plan |
| Gameplay & Simulator Logic Center | Hole definitions, tee/pin metadata, hazards | Validated simulator logic profile | compatibility engine | Plan |
| Asset Library | Imported assets and tags | Indexed asset registry | asset-indexer | project-store |
| World Builder | Plan outputs, districts, assets | World composition directives | world system service | Plan |
| Animation & Events | World moments, triggers, cameras | Event graph and showcase sequences | event state service | World Builder |
| Playability Center | Routing, shot lines, hazards | Readability and playability findings | playability analyzer | Gameplay Logic |
| Performance Center | Asset density, event load, target profile | Performance grade and optimization tasks | performance analyzer | Asset Library |
| Preview Studio | Cameras, minimap inputs, flyover data | Preview assets and review bundles | preview generator | Animation & Events |
| Package Center | Validated project, output profile | GSPro-ready package and diagnostics | packaging-orchestrator | Compatibility contract |
| Publish Center | Release metadata, media assets, packaging outputs | Release records and public-safe posture | release service | Package Center |
| Version Control Center | Snapshots, decisions, history | Recoverable version timeline | history service | project-store |
| Agent Command Center | Project context, priorities, blockers | Delegated execution plans and recommendations | orchestration service | All module statuses |
| Settings | Tool paths, defaults, integration state | Persistent app settings | settings service | None |
