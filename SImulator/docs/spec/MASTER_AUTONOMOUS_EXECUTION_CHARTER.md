# Master Autonomous Execution Charter

## Status

Approved for execution.

## Purpose

Provide a canonical repo-level name for the durable execution rules that govern autonomous work on Course Creator OS.

This document exists to remove source-of-truth drift around instruction naming and to make the repo’s controlling execution stack explicit.

## Canonical Instruction Stack

For repo work, treat these as the controlling execution documents:

1. [AGENTS.md](/Users/westlunds/Documents/Website/SImulator/AGENTS.md)
2. [PRODUCT_MASTER_BRIEF.md](/Users/westlunds/Documents/Website/SImulator/PRODUCT_MASTER_BRIEF.md)
3. [MASTER_SYSTEM_PROMPT.md](/Users/westlunds/Documents/Website/SImulator/docs/spec/MASTER_SYSTEM_PROMPT.md)
4. [CODEX_MASTER_PROMPT_PACK.md](/Users/westlunds/Documents/Website/SImulator/docs/spec/CODEX_MASTER_PROMPT_PACK.md)
5. the approved product, UX, architecture, agent-operation, and roadmap specs in `/docs/spec`

## Charter Rules

- Treat the product as a long-term premium creator platform, not a prototype.
- Use plan mode first for major structural work.
- Protect architecture, UX, simulator logic, validation, release truth, host/runtime trust, and GSPro-compatible output together.
- Prefer explicit package ownership and reversible decisions.
- Update durable docs when recurring corrections, major architectural decisions, or roadmap shifts appear.
- Trigger refocus when implementation drifts visibly from the approved product shape.
- The standard is not merely that the code runs; the standard is that the product is becoming the course creation platform creators will prefer.

## Integrity Notes

- `Prompt 21` is present in the canonical prompt sequence and is `Continuous Execution Prompt`.
- Older references suggesting Prompt 21 is missing are obsolete and should not be treated as controlling truth.
- Malformed chat wrappers or copied transport artifacts are not repo instructions unless they are intentionally recorded in the controlling docs above.
