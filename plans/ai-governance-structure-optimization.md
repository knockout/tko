# AI Governance Structure Optimization

## Summary
Review and tighten TKO's AI governance structure so decisions are easier to
apply under delivery pressure and evidence is consistent across contributors
and agents.

## Goals
- Restructure `AI_COMPLIANCE.md` into clearer policy sections with explicit
  decision rights and approval gates.
- Add a practical risk-to-evidence matrix tied to current TKO workflows.
- Add explicit exception and incident handling rules with ownership and expiry.
- Align `AGENTS.md` with the compliance baseline to reduce duplicated or
  drifting guidance.

## Non-Goals
- No automation or CI enforcement changes in this iteration.
- No changes to release mechanics, build tooling behavior, or package runtime.
- No policy expansion outside repository governance and engineering controls.

## Implementation
1. Normalize policy language (`MUST` / `SHOULD` / `MAY`) and clarify precedence.
2. Define role accountability and approval authority for `HIGH` risk changes.
3. Add risk model with explicit TKO high-risk path mapping.
4. Add control gates and evidence requirements per risk class.
5. Add exception workflow (owner, expiry, compensating controls).
6. Add incident runbook for leakage/prompt-injection/supply-chain events.
7. Update `AGENTS.md` governance section to point to the stricter baseline.

## Verification
- Manual consistency check between `AI_COMPLIANCE.md` and `AGENTS.md`.
- Confirm references map to real TKO paths and commands.
- Confirm plan/evidence expectations remain compatible with existing `plans/`
  workflow.

## Deliverables
- Updated `AI_COMPLIANCE.md`
- Updated `AGENTS.md` governance section
- This plan entry in `plans/`
