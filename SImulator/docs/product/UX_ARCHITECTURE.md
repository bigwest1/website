# UX Architecture

## Shell Principles

- The creator always sees where they are, what is healthy, and what blocks progress.
- The shell must maintain one persistent mental model across all modules.
- The right rail is not decorative; it always carries validation, guidance, or inspector value.

## Global Shell Anatomy

### Left Rail

- Project identity.
- Module navigation.
- Lightweight progress cues per module.

### Center Workspace

- Screen hero explaining the current workspace.
- Main execution surfaces for the active module.
- Task-shaped content with strong hierarchy and low ambiguity.

### Right Rail

- Project health summary.
- Active module context.
- Recommended next actions.
- Top findings and recovery paths.

## Warning And Recovery Behavior

- Every warning must include a plain-language fix path.
- Errors must explain why export or playability is affected.
- Info states must help creators prioritize rather than merely decorate the UI.

## Progressive Disclosure

- Each module starts from a creator-facing summary and reveals complexity only when it adds value.
- Simulator logic controls stay grouped by gameplay intent rather than raw data shape.
- Performance and packaging details remain accessible without dominating early planning workflows.

## Desired Feel

- Calm, premium, deliberate.
- Confident but not sterile.
- Powerful without dumping raw system complexity onto the creator.

