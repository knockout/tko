# Agent Verified Behaviors

**Risk class:** LOW

## Summary
Add a generated, package-scoped agent reference under `tko.io/public/agents/verified-behaviors/` whose claims are backed by unit tests. The source of truth is the test suite, not prose docs. The generated output should be compact enough for LLM consumption and rebuilt automatically whenever docs are built or published.

## Goals
- Publish a test-backed contract layer for agents.
- Keep behavior summaries package-scoped so agents can load only the files they need.
- Regenerate the files on every docs build/publish.
- Make unit tests the authority for every behavior claim.

## Non-Goals
- Do not dump raw test files into the docs site.
- Do not include behaviors that are not covered by tests.
- Do not attempt full automatic extraction from arbitrary test prose in the first version.

## Output
Generate these files in `tko.io/public/agents/verified-behaviors/`:
- `index.md`
- one file for every package under `packages/`

Each generated file should contain:
- package name
- short scope summary
- flat behavior bullets when curated, or an explicit placeholder when no verified behaviors are published yet
- important defaults/caveats when the tests establish them
- spec file references for each behavior

## Source of Truth
Use package discovery plus package-local curated JSON files.

Each curated file should live at:
- `packages/<pkg>/verified-behaviors.json`

Each curated file must include:
- short description
- behavior statement
- optional notes/defaults/caveats
- one or more spec file references

Each curated file is local to its package, but every listed behavior must be supported by the referenced unit tests.

The generator must also discover:
- all packages under `packages/`
- whether each package has a `spec/` directory with tests

Generated status should distinguish:
- curated
- tests present, curation missing
- no tests found

## Generation
Add a generator script in `tko.io/scripts/` that:
1. Reads the manifest.
2. Renders per-package markdown files.
3. Renders an index that links to all generated package files.
4. Writes a clear generated-file notice stating that unit tests are authoritative.

## Build Integration
Hook the generator into the docs build path so it runs during `prebuild`. Publishing should therefore always regenerate the files.
If a package has tests but no curated verified behaviors, the build should emit a warning listing that package.

## Documentation Integration
Update agent-facing entry points to link to the generated index:
- `tko.io/public/llms.txt`
- `tko.io/public/agents/guide.md`

## Verification
- Run the generator directly and inspect the emitted markdown.
- Run `bun run build` for the docs site.
- Use headless `playwright-cli` to fetch `/agents/verified-behaviors/index.md` from the live docs site and confirm the generated content is present.
- Spot-check at least one package file the same way.

## Follow-Ups
- Expand the manifest as more APIs are audited against tests.
- If the manifest grows large, consider validation that referenced spec files still exist.
- Consider replacing the compatibility root agent files with redirects or short pointers once the `/agents/` paths are fully established.

## AI Evidence
- Risk class: LOW
- Changes and steps: add generator script, curated JSON files per package, build integration, docs site entry-point updates
- Tools/commands: `bun run build`, `playwright-cli` headless, `make test-headless`
- Validation: run generator, confirm emitted markdown, spot-check at least one package file via live docs site
- Follow-up owner: TKO maintainers
