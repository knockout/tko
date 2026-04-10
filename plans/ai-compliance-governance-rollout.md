# AI Compliance Governance Rollout

## Summary
Introduce a repository-specific AI compliance baseline for TKO and wire it into `AGENTS.md` so all agents and contributors follow consistent governance controls.

## Goals
- Add a `AI_COMPLIANCE.md` in project root
- Update `AGENTS.md` with a clear mandatory governance section.
- Keep guidance practical for current TKO workflows (`make`, Karma, changesets, release CI).

## Non-Goals
- No runtime code or build-system behavior changes.
- No CI policy automation in this step.

## Implementation
1. Define compliance baseline with scope, precedence, risk tiers, controls, and incident handling.
2. Add mandatory boot/read order and operational controls to `AGENTS.md`.
3. Ensure high-risk TKO areas are explicitly mapped to approval requirements.

## Verification
- Confirm both files are valid markdown and present at repository root.
- Check AGENTS content references `AI_COMPLIANCE.md` and governance state files.
- Validate guidance matches existing TKO constraints (zero runtime deps, release workflow, docs verification flow).
