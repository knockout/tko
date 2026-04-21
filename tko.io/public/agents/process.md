# Agent Process Rules

Mandatory workflow rules for AI agents working in the TKO repo. AGENTS.md
references this file for the detail of each rule; the one-line mandate lives
there so it fires on session load. Read the matching section here before
declaring work complete.

## Never ship docs that reference things that don't exist on the target branch

Before including a doc file — especially any untracked/generated file you find
in the working tree — verify every package, export, class, function, spec path,
or URL it names actually exists on the branch you are merging into (normally
`main`).

Mandatory checks before staging a docs file:

1. `git ls-files <path>` — is it tracked? If not, where did it come from?
   - If it was emitted by a generator (e.g. `tko.io/scripts/generate-verified-behaviors.mjs`), re-run the generator on a clean checkout of the target branch and diff. If the generator does not produce it, it is stale — do not ship it.
   - If it was hand-written on a different branch, confirm that branch has merged into the target. `git log --all -- <path>` and `git branch --contains <commit>` will show where it lives.
2. For each package name in the doc: `ls packages/<name>` and confirm a matching `package.json`. Orphan `@tko/*` references mislead both humans and downstream agents.
3. For each spec path in the doc: the file must exist at the named location.
4. For each external URL in the doc: it is OK to trust user-provided URLs, but do not invent them.

The failure mode is shipping a doc that promises behaviour the code does not
deliver. That is worse than no doc at all — it poisons every future reader
(human or agent) that trusts the docs as a contract. When in doubt, leave it
out and open a follow-up.

Also note: `tko.io/public/agents/verified-behaviors/*.md` are regenerated from
`packages/*/verified-behaviors.json` on every `prebuild` / `predev` / CI build.
Hand-edits there are transient — the generator wins. Edit the JSON source, or
put hand-authored guidance in `guide.md` / `contract.md` instead.

## Adversarial review is mandatory

A single pair of eyes (yours) is not enough in a dark factory. If small teams
plus agents are going to maintain what once took a big team, the missing human
reviewer has to be replaced by a second agent that was not told what "good"
looks like and is asked only "where is this wrong?".

**In scope** (always run the pass):
- Code changes in `packages/*` or `builds/*`
- Test additions, deletions, or env changes
- Public `@tko/*` API surface
- Docs in `tko.io/public/` and agent-facing files (`llms.txt`, `agents/*`)
- CI workflows, `tools/build.ts`, `vitest.config.ts`, `biome.json`
- Changesets and commit messages that land a PR

**Out of scope** (proportionality):
- Typos, whitespace, comment corrections that do not change behavior or public surface
- The adversarial review itself — its report is not an artefact that needs its own review. One pass per change closes the loop.

**How to run the pass**, every time it is in scope:

- Spawn a fresh subagent (`Agent` tool, specialized `subagent_type` when one fits, otherwise `Explore`). Do **not** let the agent that produced the change also sign it off — that is a null check.
- Brief the reviewer with the **artefact (diff or file) and the claim it makes** ("this PR does X"). Do **not** include your reasoning for why it works, the commit message you intend to write, or the PR title. Anchoring the reviewer to your conclusion defeats the pass.
- Prompt it to enumerate likely failure modes *before* reviewing for correctness (e.g. "list the three most likely ways this could break, then check each"). Ask: "where is this wrong, what would break, what would mislead a future reader?" Bias toward flagging.
- Apply the AGENTS.md failure-modes list *and* the domain-specific checklist for the artefact type (docs → "Never ship docs that reference things that don't exist"; tests → disposal leaks + env assumptions; public API → backwards-compat + changeset; etc.).
- If the reviewer returns a finding, **verify the specific claim** (re-run the command, read the named file, grep for the named symbol) — do not rely on your own prior reasoning to dismiss it. Subagents produce false positives, so verification is defensive, not a licence to override. If after verification you still believe the finding is wrong, record the reasoning in the PR description or as a code comment so a future reader (or maintainer) can judge it; do not silently reject.
- If the pass surfaces a finding that belongs in a separate PR, file a follow-up or spawn a task rather than expanding the current change — keep "Keep PRs focused" intact.
- Record that the pass was run. A single line at the end of the **commit message** that introduces the in-scope change is enough:
  `Adversarial pass: <reviewer name or subagent_type>. Result: clean` or
  `Adversarial pass: <reviewer>. Flagged <N>: <summary>. Resolved: <how>.`
  If a PR has multiple in-scope commits, each gets its own audit line; do not batch them. The commit message is the right home: it travels with the change in `git log` forever, stays granular to what was reviewed, and keeps process metadata out of the PR description (which is for *why* the change exists and *what* it does — not for reviewer ceremony). Do not add review outcomes to the PR description. Without *some* audit trail, compliance is unverifiable and the rule is trivially gamed; the commit message is a cheap, out-of-the-way place to leave it.
  Caveat for squash-merge repos: squashing collapses per-commit audit lines into the squash target's message. That is acceptable as long as the lines survive the squash; if the squash message is auto-truncated or rewritten, copy the audit lines into it manually before merging.
- Only after the pass returns clean (or returns findings that you have verified and addressed, deferred to a follow-up, or consciously rejected with documented reasoning) may you declare the work done.

## Docs verification

When changing `tko.io` documentation, verify before declaring done.

Minimum (any docs change):
- `bun run build` in `tko.io/` — clean Astro build is mandatory. It runs the verified-behaviors generator, rebuilds the TKO bundles, and compiles every page. A failure here = broken docs.

For pages with runnable TSX examples, also run the headless Playwright flow:

- Use `playwright-cli` in headless mode. Do not use headed/browser-stealing runs unless the user explicitly asks for them.
- Prefer a live Astro dev server on `127.0.0.1:4321` so markdown/plugin edits reload while you work (`bun run dev` in `tko.io/`).
- Verify each `Open in Playground` button on the page; if a page has multiple TSX examples, check every one, not just the first.
- Standard flow: `playwright-cli close-all`, `playwright-cli open http://127.0.0.1:4321/...`, inspect the snapshot for playground refs, click each button, switch to the playground tab, and confirm `[data-role="status"]` (shows "esbuild ready"), `[data-role="compile-time"]`, and `[data-role="error-bar"]`.
- Treat docs example work as incomplete until the emitted playground payload compiles cleanly on the live site.

Generator-owned files: see the note at the top of this document under "Never ship docs that reference things that don't exist on the target branch."

## Credits

Architectural review guidelines at `agents/contract.md` ("DOM Mutation
Containment", "Component Design", "Component Communication via
`subscribable`") and related Gotchas in `agents/guide.md` and `llms.txt`
originate from code-review rules in the MinuteBox project
([NetPleadings/MinuteBox#9518](https://github.com/NetPleadings/MinuteBox/pull/9518),
@jameskozlowskimb) with input from @ctcarton, ported upstream and reworded for
TKO primitives.
