# AI Governance Structure Optimization

**Status:** Completed  
**Risk class:** `HIGH` — modifies the normative security and governance baseline used by all agents and contributors  
**Last updated:** 2026-04-10

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

## Steps
1. Normalized policy language (`MUST` / `SHOULD` / `MAY`) throughout `AI_COMPLIANCE.md`; added normative-terms section (section 1).
2. Added explicit precedence model (section 3): explicit maintainer instruction → legal/security constraints → `AGENTS.md` → `AI_COMPLIANCE.md`.
3. Defined role accountability (section 4): maintainers, AI agents, security/quality owners — each with enumerated decision rights.
4. Added three-tier risk model (section 6) with `HIGH` / `MEDIUM` / `LOW` classes and explicit TKO path mapping for `HIGH` defaults (`.github/workflows/`, `tools/build.mk`, `tools/karma.conf.js`, `.changeset/`, release scripts).
5. Added control-gate approval matrix (section 7) tying risk class to required approvals and evidence.
6. Added verification command set (section 7.2): `make test-headless`, `make tsc`, `make eslint`, `make knip`, `make format`.
7. Added exception workflow (section 10): owner, compensating controls, expiry date.
8. Added incident/escalation runbook (section 11) for leakage, prompt injection, and supply-chain events.
9. Added required boot sequence (section 12): read `AGENTS.md` then `AI_COMPLIANCE.md`; stop if either is missing.
10. Added review-cadence requirement (section 13).
11. Updated `AGENTS.md` governance section to reference the stricter baseline and align precedence language.

## Deliverables
- `AI_COMPLIANCE.md` v1.2 at repository root (bumped from v1.0 introduced in rollout plan).
- `AGENTS.md` — governance section aligned with v1.2 precedence model.
- `plans/ai-governance-structure-optimization.md` (this file).

## Validation
- Manual consistency review: all sections in `AI_COMPLIANCE.md` v1.2 cross-referenced against `AGENTS.md`.
- All referenced `make` targets (`test-headless`, `tsc`, `eslint`, `knip`, `format`) confirmed present in root `Makefile`.
- All referenced high-risk paths confirmed to exist in the repository.
- Exception and incident sections reviewed against OWASP Top 10 and supply-chain attack surface.
- No new runtime dependencies introduced; zero-dependency constraint preserved.
- `plans/` format requirements verified compatible with existing plan files.

## AI Evidence
- Risk class: `HIGH`
- Changes and steps: See Steps section above.
- Tools/commands: Manual markdown authoring; `make tsc`, `make eslint`, `make format` verified no regressions in non-governance code.
- Validation: Manual diff of `AI_COMPLIANCE.md` v1.0 → v1.2; cross-reference with `AGENTS.md` and existing `plans/`; all TKO-specific paths/commands confirmed real.
- Follow-up owner: TKO maintainers — next review triggered by major workflow/security/process changes (section 13).
