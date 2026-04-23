# Plan: The Dark Factory

## Vision

TKO should reach a state where the repository is essentially maintained by AI
agents. Not as a novelty, but because the infrastructure — tests, CI, docs,
verified behaviors — is robust enough that agents can work autonomously and
humans can trust the output.

The term "dark factory" comes from manufacturing: a facility that runs without
lights because the robots don't need to see. In software, it means agents
handle the implementation — writing code, fixing bugs, updating dependencies,
writing docs — while humans focus on direction, design, and validation.

Simon Willison [describes five levels](https://www.alldevblogs.com/article/simon-willison/the-five-levels-from-spicy-autocomplete-to-the-dark-factory)
of AI-assisted programming, from "spicy autocomplete" (Level 0) to the fully
autonomous "dark software factory" (Level 5). StrongDM's AI team operates at
Level 5: ["Code must not be written by humans. Code must not be reviewed by
humans."](https://simonwillison.net/2026/Feb/7/software-factory/) Engineers
design specs, curate test scenarios, and watch scores. Agents do everything
else.

Willison's key observation: engineers shift from **building code** to
**building the systems that build the code**. The critical unsolved question
is how agents prove their code works without human review. The answer, for
StrongDM and for TKO, is tests — not as a checkbox, but as the primary
artifact that defines correctness.

TKO is currently between Level 3 and Level 4. Agents (Claude Code, Copilot)
do most of the implementation. Humans review PRs, set priorities, and make
architectural decisions. The goal is to push toward Level 5 where practical,
while being honest about where human judgment is still required.

## References

- [The Five Levels: from Spicy Autocomplete to the Dark Factory](https://www.alldevblogs.com/article/simon-willison/the-five-levels-from-spicy-autocomplete-to-the-dark-factory) — Simon Willison
- [StrongDM's Software Factory](https://simonwillison.net/2026/Feb/7/software-factory/) — Willison's writeup
- [An AI State of the Union](https://www.lennysnewsletter.com/p/an-ai-state-of-the-union) — Willison on the inflection point
- [Built by Agents, Tested by Agents, Trusted by Whom?](https://law.stanford.edu/2026/02/08/built-by-agents-tested-by-agents-trusted-by-whom/) — Stanford CodeX

## What makes this possible

The tooling modernization (Phases 1–6) was the foundation:

- **Verified behaviors** — `verified-behaviors.json` files are test-backed
  contracts that AI agents can check their work against
- **SOUL.md** — the philosophical foundation of Knockout, so agents
  understand *why* the framework works the way it does
- **AGENTS.md** — instructions that any AI coding tool can follow
- **llms.txt** — concise project context for LLM consumption
- **`bun run verify`** — single command to confirm nothing is broken
  (biome + tsc + build + verify:esm + vitest)
- **`bun run knip`** — detect dead code, unused deps
- **Changesets** — structured release management
- **CI safety net** — lint, typecheck, test, ESM verification on every PR
- **Branch protection** — all changes go through PRs
- **plans/** — documented intent so agents understand context

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
| **Scenario testing** | StrongDM-style holdout scenarios for end-to-end validation |

## Principles

1. **Tests are the source of truth.** If it's not tested, it doesn't exist.
   AI agents should never make changes they can't verify. Tests are not a
   checkbox — they are the primary artifact that defines correctness.

2. **Safety by default.** The CI pipeline should catch any regression an AI
   introduces. `bun run verify` must pass before any commit.

3. **Intent over implementation.** Plans and SOUL.md describe *why* things
   work the way they do. Code describes *what*. AI can change the what if
   it understands the why.

4. **Small, reviewable changes.** One concern per PR. A human should be able
   to review any AI-generated PR in under 5 minutes.

5. **No magic.** Every tool, script, and CI step should be understandable
   by reading the code. No hidden state, no implicit dependencies.

6. **Earn trust incrementally.** Start with low-risk automation (deps, docs,
   formatting). Expand to bug fixes and features as confidence grows. The
   level of autonomy an agent gets should match the level of safety net
   around it.
