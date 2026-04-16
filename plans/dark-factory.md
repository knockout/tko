# Plan: The Dark Factory

## Vision

TKO should reach a state where the repository is essentially maintained by AI
agents — where humans set direction, review output, and make judgment calls,
but the routine work of maintenance, bug fixes, dependency updates, and
documentation is handled autonomously.

A "dark factory" in manufacturing is a facility that runs without human
intervention. The analogy here is not about removing humans from the process,
but about removing the need for humans to do the tedious parts: the tooling
should be robust enough, the tests comprehensive enough, and the documentation
clear enough that an AI agent can pick up a task, execute it safely, and
produce a result a human can review in minutes.

## What makes this possible

The tooling modernization (Phases 1–6) was the foundation:

- **Verified behaviors** — `verified-behaviors.json` files are test-backed
  contracts that AI agents can check their work against
- **AGENTS.md** — instructions that any AI coding tool can follow
- **llms.txt** — concise project context for LLM consumption
- **`bun run verify`** — single command to confirm nothing is broken
  (biome + tsc + build + verify:esm + vitest)
- **`bun run knip`** — detect dead code, unused deps
- **Changesets** — structured release management
- **CI safety net** — lint, typecheck, test, ESM verification on every PR
- **Branch protection** — all changes go through PRs
- **plans/** — documented intent so agents understand *why*, not just *what*

## What's not there yet

| Gap | What's needed |
|-----|---------------|
| **Dependency updates** | Renovate/Dependabot with 48h minimumReleaseAge |
| **Bundle size tracking** | CI check comparing browser.min.js against main |
| **Benchmarks** | vitest bench for observable/computed hot paths |
| **Coverage confidence** | Know which code paths are covered, which aren't |
| **Autonomous PR review** | AI reviewer that checks against verified behaviors |
| **Release automation** | Tag + release triggered by changeset merge, not manual |
| **Copilot/Cursor support** | `.github/copilot-instructions.md` extending AGENTS.md |
| **Issue triage** | AI can read an issue, reproduce it, propose a fix |

## Principles

1. **Tests are the source of truth.** If it's not tested, it doesn't exist.
   AI agents should never make changes they can't verify.

2. **Safety by default.** The CI pipeline should catch any regression an AI
   introduces. `bun run verify` must pass before any commit.

3. **Intent over implementation.** Plans and SOUL.md describe *why* things
   work the way they do. Code describes *what*. AI can change the what if
   it understands the why.

4. **Small, reviewable changes.** One concern per PR. A human should be able
   to review any AI-generated PR in under 5 minutes.

5. **No magic.** Every tool, script, and CI step should be understandable
   by reading the code. No hidden state, no implicit dependencies.
