# TKO — AI Agent & Contributor Context

TKO ("Technical Knockout") is the monorepo for the next generation of
[Knockout.js](https://knockoutjs.com). It is a TypeScript MVVM framework for
data binding and templating with zero runtime dependencies.

Repository: https://github.com/knockout/tko
Docs: https://tko.io
License: MIT

## Project Structure

Lerna monorepo with npm workspaces. Current version: see `lerna.json`.

```
packages/          # 25 modular @tko/* packages (all TypeScript)
builds/            # 2 bundled distributions (knockout, reference)
tools/             # Shared build config (build.mk, karma.conf.js, repackage.mjs)
tko.io/            # Documentation site (Astro + Starlight, deployed to GitHub Pages)
Makefile           # Top-level build orchestrator
```

Key packages: `@tko/observable`, `@tko/computed`, `@tko/bind`,
`@tko/binding.core`, `@tko/utils`, `@tko/provider.*`, `@tko/binding.*`.

Builds: `@tko/build.knockout` (backwards-compatible) and
`@tko/build.reference` (modern/recommended).

## Build Commands

All builds use Make + esbuild. Run from the repo root:

```bash
npm install           # Install all dependencies (uses npm workspaces)
make                  # Build all packages (ESM, CommonJS, MJS)
make test             # Run all tests with Electron
make test-headless    # Run all tests with headless Chrome
make test-headless-ff # Run all tests with headless Firefox
make test-headless-jquery  # Run tests with jQuery enabled
make test-coverage    # Run tests and generate coverage report
make eslint           # Run ESLint
make eslint-fix       # Run ESLint with auto-fix
make format           # Check Prettier formatting
make format-fix       # Fix Prettier formatting
make tsc              # TypeScript type-check (no emit)
make dts              # Generate TypeScript declaration files
make sweep            # Clean dist/ and coverage/ dirs
make clean            # Full clean (node_modules, lockfiles, dist)
```

Individual packages can be built/tested from their directory with the same
Make targets (they include `tools/build.mk`).

## Testing

- **Runner**: Karma
- **Frameworks**: Mocha + Chai + Sinon
- **Browsers**: Electron (default), Chrome Headless, Firefox Headless
- **Coverage**: nyc/Istanbul (~89% statements, ~83% branches)
- **Test files**: `packages/*/spec/` directories

Use Mocha/Chai/Sinon for repository tests.

Do not:
- split shared specs into runner-specific versions while they still need to run
  in the browser harness

## Code Style

- **Formatter**: Prettier — no semicolons, single quotes, trailing commas: none, 120 char width
- **Linter**: ESLint with typescript-eslint (flat config)
- **Editor**: 2-space indentation for JS/TS, tabs for Makefiles, LF line endings
- See `.prettierrc` and `eslint.config.js` for full config

Run `make format-fix && make eslint-fix` before committing.

## TypeScript

- All source is in TypeScript (`packages/*/src/`)
- Target: ES6, Module: ES2015
- Strict mode enabled (with `noImplicitAny: false`)
- Types checked with `make tsc` (noEmit — esbuild handles compilation)
- Path aliases: `@tko/*` maps to `packages/*` and `builds/*`

## Package Conventions

Each package under `packages/` follows this layout:

```
packages/example/
  src/           # TypeScript source
  spec/          # Tests
  dist/          # Build output (gitignored)
  helpers/       # Test helpers (if any)
  index.ts       # Entry point
  package.json   # Package metadata
  Makefile       # Includes ../../tools/build.mk
```

Inter-package dependencies use `@tko/package-name` and are resolved via
npm workspaces.

## CI/CD

GitHub Actions workflows (`.github/workflows/`):

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `main-build.yml` | Push to main | Build + audit + headless test |
| `test-headless.yml` | PRs | Matrix test (Chrome, Firefox, jQuery) |
| `lint-and-typecheck.yml` | PRs | Prettier + ESLint + tsc (combined) |
| `publish-check.yml` | PRs | Verify packages are publishable |
| `release.yml` | Push to main | Changeset version PRs + npm publish + GitHub release creation |
| `github-release.yml` | Manual fallback | Backfill a GitHub release/tag for a published `main` commit if automatic release creation needs a retry |
| `deploy-docs.yml` | Push to main | Deploy tko.io to GitHub Pages |
| `codeql-analysis.yml` | Weekly + main push | Security scanning |

All PR checks must pass before merge.

## Release Process

Releases are managed with [Changesets](https://github.com/changesets/changesets).

TKO uses a repo-wide fixed release line for all public `@tko/*` packages. A
release that bumps any public package bumps the full public package set to the
same version.

**For contributors** — when your PR changes package behavior:
```bash
npx changeset add    # Select affected packages, bump type, describe change
```
This creates a changeset file in `.changeset/` that gets committed with your PR.

**For maintainers** — releasing is handled by CI:
1. Push to main triggers `.github/workflows/release.yml`
2. If unreleased changesets exist, the action opens a "Version Packages" PR
3. Review the PR (it bumps versions and updates changelogs)
4. Merge it to publish to npm via GitHub Actions OIDC trusted publishing
5. The same release workflow creates the matching GitHub Release and tag after a successful publish
6. If GitHub release creation ever needs a retry after publish, run `github-release.yml` manually with the merged commit SHA

Avoid manual workstation publishes. If release CI is unavailable, fix the
workflow or npm trusted publisher configuration rather than bypassing it with a
long-lived publish token.

## Plans

Significant changes should have a plan file in `plans/` before implementation
begins. Plans document the context, approach, and verification steps. Review
existing plans in that directory for format examples.

## Agent-First Documentation

AI coding agents are first-class citizens of TKO. The docs site serves both
humans (HTML via Starlight) and agents (plain text).

Agent-facing files in `tko.io/public/`:
- `llms.txt` — discovery entry point, points to the guides below
- `agent-guide.md` — API reference, gotchas, examples, playground URL format
- `agent-testing.md` — how to run and verify TKO code without human interaction

When documentation changes — new APIs, new bindings, new patterns, behavioral
changes — update **both** the Starlight docs (for humans) and the agent guide
(for agents). The agent guide should be token-efficient: dense, code-first,
minimal prose.

## Docs Verification

When validating `tko.io` documentation changes with the local docs site:

- Use `playwright-cli` in headless mode by default. Do not use headed/browser-stealing runs unless the user explicitly asks for them.
- Prefer a live Astro dev server on `127.0.0.1` so markdown/plugin edits reload while you work.
- For docs pages with runnable examples, verify the live page and each `Open in Playground` button after edits.
- Standard headless flow: `playwright-cli close-all`, `playwright-cli open http://127.0.0.1:4321/...`, inspect the snapshot for playground refs, click each button, switch to the playground tab, and confirm `#esbuild-status`, `#compile-time`, and `#error-bar`.
- Treat docs example work as incomplete until the emitted playground payload compiles cleanly on the live site.
- If a page has multiple TSX examples, check every TSX playground button, not just the first one.

## Important Guidelines

- Do not modify `tools/build.mk` or `tools/karma.conf.js` without understanding
  the full impact — they are shared across all 25+ packages.
- Do not add runtime dependencies to core packages. TKO is zero-dependency.
- The `builds/` packages bundle everything into a single distributable.
  Individual `packages/` should remain modular.
- Preserve backwards compatibility in `@tko/build.knockout`.
- Commit messages: present tense, imperative mood, max 72 chars first line.
  See `CONTRIBUTING.md` for emoji conventions.
- Keep PRs focused. One logical change per PR.
