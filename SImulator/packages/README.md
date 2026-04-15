# Packages

Shared product packages live here.

The package layer follows domain ownership rules from the architecture docs:

- visual tokens and reusable UI primitives
- core shared types and config contracts
- domain models for planning, simulator logic, assets, world systems, preview, packaging, and versioning
- service-facing packages for validation, storage, logging, integration, and agent coordination

Each domain object should have one clear owning package. Cross-package reuse should flow through package APIs instead of duplicated types.
