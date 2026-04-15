# Apps

Application entry points live here.

- `desktop`: the Tauri-hosted React desktop shell and top-level product composition layer.

Apps are responsible for product assembly, routing, window and layout orchestration, and background task visibility. They must consume domain packages rather than own core business logic.
