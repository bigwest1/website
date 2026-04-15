# Scripts

Local tooling, managed adapter bridges, bootstrap helpers, import diagnostics, packaging workflows,
and maintenance tasks live here.

`scripts/managed-adapters` contains the repo-backed production adapter scaffolds used by Batch 34:

- `package-build-runner.mjs`
- `gspro-compatibility-bridge.mjs`
- `asset-import-runner.mjs`

These adapters emit structured JSON for the integration layer and can write bridge-side reports
into project-local release or import output roots.
