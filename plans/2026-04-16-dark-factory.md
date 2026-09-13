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

## Status — September 2026

Shipped since this plan was written (the gap table above is the original
April snapshot):

- **Dependency updates** — Dependabot weekly with a 2-day cooldown
  (`.github/dependabot.yml`); Dependabot applies cooldown to version
  updates only, so security updates are not delayed by it.
- **Release automation** — single-action release via `release.yml`
  (PR #377): merging the version PR builds, tests, publishes to npm via
  OIDC, and creates the tag + GitHub Release.
- **Copilot support** — `.github/copilot-instructions.md` delegates to
  AGENTS.md. No Cursor-specific config; tools that read AGENTS.md
  directly are covered by the standard itself.
- **Coverage confidence (partial)** — `coverage.yml` runs Vitest + V8
  coverage on every PR and main push, with no threshold gate. The closed
  loop is tracked in #379 ("Closed-loop coverage: PR delta comment +
  regression gate").
- **Autonomous PR review (partial)** — a mandatory adversarial subagent
  pass with a commit-message audit trail (`tko.io/public/agents/process.md`)
  covers authorship-time review. It is not a CI gate and does not check
  against verified behaviors, so the original gap is only half closed.

Still open, roughly ordered by value per unit cost:

1. **Closed-loop coverage** (#379) — the report already runs on every PR;
   wiring the delta comment and a no-regression gate converts an artifact a
   human must remember to read into a signal nobody has to watch.
2. **Issue triage** — open reproducible bugs are the natural proving
   ground: an agent reads the issue, writes the failing spec, then fixes
   it — or lands the failing spec alone as an executable reproduction when
   the fix is unclear. Candidates as of September 2026: #421 (parser fails
   on ES6 property shorthand before a closing brace), #414 (`if` binding
   delays `koDescendantsComplete`), #410 (`?.` operator binding
   regression), #401 (JSX `foreach` on a `jsx.render` template renders
   nothing).
3. **Bundle size tracking** — CI compares `browser.min.js` bytes against
   main; a budget check is a cheap tripwire for accidental dependency or
   dead-code regressions.
4. **Benchmarks** — `vitest bench` for the hot paths (observable read,
   dependency tracking, binding apply); start informational, like coverage.
5. **CI-side AI reviewer** — the original gap: a reviewer in CI that
   checks PRs against `verified-behaviors.json`. The adversarial pass
   replaces the second human at authorship time but is not a gate.
6. **Scenario testing** — StrongDM-style holdout scenarios; highest cost,
   revisit after the cheaper gates above are closed.

The direction matches the 2026 discourse: the bottleneck in agentic
development is human review capacity, not code production, so investment
belongs in review-replacing infrastructure — tests, gates, adversarial
passes. See [Agentic Engineering Patterns](https://simonw.substack.com/p/agentic-engineering-patterns)
(Willison, Feb 2026) and the [Pragmatic Summit fireside chat](https://simonw.substack.com/p/fireside-chat-about-agentic-engineering)
(Willison, Mar 2026).
