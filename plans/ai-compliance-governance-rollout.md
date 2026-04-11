# AI Compliance Governance Rollout

**Status:** Completed  
**Risk class:** `HIGH` — governance/security baseline change affects all agents and contributors  
**Last updated:** 2026-04-10

## Summary
Introduce a repository-specific AI compliance baseline for TKO and wire it into `AGENTS.md` so all agents and contributors follow consistent governance controls.

## Goals
- Add `AI_COMPLIANCE.md` at project root.
- Update `AGENTS.md` with a clear mandatory governance section and boot sequence.
- Keep guidance practical for current TKO workflows (`make`, Karma, changesets, release CI).

## Non-Goals
- No runtime code or build-system behavior changes.
- No CI policy automation in this step.

## Steps
1. Defined compliance baseline (`AI_COMPLIANCE.md` v1.0) with scope, precedence, risk tiers, data-handling controls, and incident handling.
2. Added mandatory boot/read order (`AGENTS.md` → `AI_COMPLIANCE.md`) and security/compliance baseline section to `AGENTS.md`.
3. Mapped high-risk TKO paths (`.github/workflows/`, `tools/build.mk`, `tools/karma.conf.js`, `.changeset/`, release scripts) to approval requirements.
4. Established role accountability: maintainers, AI agents, security/quality owners.

## Deliverables
- `AI_COMPLIANCE.md` v1.0 at repository root (later iterated to v1.2 via optimization plan).
- `AGENTS.md` — updated governance section with precedence model and plan-evidence requirement.
- `plans/ai-compliance-governance-rollout.md` (this file).

## Validation
- `AI_COMPLIANCE.md` and `AGENTS.md` confirmed present at repository root.
- Cross-checked that `AGENTS.md` references `AI_COMPLIANCE.md` by name and describes the precedence model.
- Verified all referenced TKO paths and `make` commands exist in the repository.
- Confirmed no runtime dependencies or build-system behavior was altered.
- No new packages introduced; zero-dependency constraint preserved.

## AI Evidence
- Risk class: `HIGH`
- Changes and steps: See Steps section above.
- Tools/commands: Manual markdown authoring; `make tsc`, `make eslint`, `make format` verified no regressions.
- Validation: Manual consistency review of `AI_COMPLIANCE.md` ↔ `AGENTS.md`; all referenced paths confirmed real.
- Follow-up owner: TKO maintainers — periodic review cadence per `AI_COMPLIANCE.md` section 13.
