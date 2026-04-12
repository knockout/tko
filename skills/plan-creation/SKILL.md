---
name: plan-creation
description: "Create or update a TKO plan file in plans/. USE WHEN: planning substantial AI-assisted changes, classifying risk, reviewing existing plans for format, documenting verification, or handling HIGH-risk path changes (.github/workflows/, tools/build.mk, tools/karma.conf.js, release/publish controls), new runtime dependencies, CI/CD modifications, or multi-package behavior changes. Scaffolds the plan, applies AI_COMPLIANCE.md risk classes, and enforces approval/evidence expectations."
argument-hint: "Describe the change you are planning"
---

# TKO Plan Creation

## What This Skill Does

- Creates or updates a plan in `plans/`
- Uses existing TKO plans as format references instead of inventing a new shape
- Classifies risk with the `AI_COMPLIANCE.md` model
- Ensures the plan includes validation evidence and approval notes when required

## When to Use

Create a plan **before implementation** when any of these apply:

- The change touches more than one package's observable behaviour
- A new dependency is introduced
- CI/CD, release, or publish logic is modified
- Files in a HIGH-risk path are changed (`.github/workflows/`, `tools/build.mk`,
  `tools/karma.conf.js`, `.changeset/`, release scripts)
- The AI_COMPLIANCE.md risk class is HIGH or MEDIUM with broad blast radius
- You are unsure whether a plan is needed (it is always safe to have one)

## When Not to Use

- Trivial docs, comments, or formatting-only edits with no behavioral impact
- Narrow typo fixes that do not change runtime behavior, tests, workflows, or policy
- Tasks where the user explicitly requested no plan and the change is clearly LOW risk

## Existing Plan Patterns

Review an existing plan before drafting a new one. Good examples in this repo:

- `plans/trusted-publishing.md` — HIGH risk release and publishing changes
- `plans/ai-governance-structure-optimization.md` — HIGH risk governance and approval model changes
- `plans/agent-verified-behaviors.md` — LOW risk generated docs/reference work
- `plans/tsx-doc-examples-rollout.md` — LOW risk docs convention rollout

## Risk Classification Quick Reference

Per `AI_COMPLIANCE.md` §6:

| Class | Scope | Approval |
|-------|-------|----------|
| **HIGH** | Release/publish/security workflows, shared tooling, new runtime deps | Explicit maintainer approval before merge |
| **MEDIUM** | Behavior changes in core/shared runtime logic | Package/repo reviewer + tests |
| **LOW** | Docs, comments, formatting, non-behavior metadata | Standard reviewer |

### Paths that are HIGH by default

- `.github/workflows/`
- `tools/build.mk`
- `tools/karma.conf.js`
- `.changeset/` and release scripts/workflows
- Authentication/publishing and CI secret configurations

If a change is close to the boundary, classify it to the **higher** risk class
until a maintainer explicitly narrows it.

## Procedure

### 1. Review a similar existing plan

Pick at least one plan from `plans/` with similar scope and copy its level of
detail, section naming, and evidence style.

### 2. Classify the risk

Determine the risk class based on which files are being changed and the scope
of the behavioural impact. Use the table above.

### 3. Choose a filename

Use lowercase kebab-case describing the change: `plans/<descriptive-name>.md`.
Check existing files in `plans/` to avoid name collisions.

### 4. Scaffold the plan

Use the [plan template](./assets/plan-template.md) as the starting structure.
Fill in every section — do not leave placeholders in the final plan.

### 5. Add the required sections

Every plan MUST include:

| Section | Content |
|---------|---------|
| **Title** | Short, descriptive heading |
| **Risk class** | `HIGH`, `MEDIUM`, or `LOW` — prominently at the top |
| **Summary** | One paragraph: what and why |
| **Goals** | What the change achieves |
| **Non-Goals** | What it explicitly does not cover |
| **Steps** | Numbered implementation steps |
| **Verification** | How to confirm correctness (commands, tests, manual checks) |
| **AI Evidence** | Risk class, changes summary, tools/commands, validation output, follow-up owner |

### 6. Add optional sections only when they help

Common optional sections seen in TKO plans:

- `Current State` / `Original State`
- `Desired State`
- `Deliverables`
- `Follow-Ups`
- `Rollback / Mitigation`

Use them when they make the plan clearer. Do not add them mechanically.

### 7. HIGH-risk extras

For HIGH-risk plans, also include:

- Rollback or mitigation strategy
- Which maintainer must approve before merge
- Any compensating controls if the change is partially deployed

### 8. Commit the plan

The plan file is committed alongside (or before) the implementation PR.
It is part of the audit trail, not a disposable draft.

## Completion Checklist

After creating the plan, confirm:

- [ ] Risk class is stated at the top
- [ ] All required sections are present and filled in
- [ ] Referenced file paths exist in the repository
- [ ] Verification section includes runnable commands (not just prose)
- [ ] AI Evidence section is complete
- [ ] Plan filename is kebab-case under `plans/`
- [ ] HIGH-risk plans name an approval owner and mitigation path
