---
---

Fix the `Release` workflow, which failed on every push to `main` because
`changesets/action@v2` renamed several inputs (`version` -> `version-script`,
`title` -> `pr-title`, `commit` -> `commit-message`, `publish` ->
`publish-script`) and no longer accepts `commitMode`. Also fixes
`outputs.should_publish`, which read the stale `hasChangesets` key instead of
the current `has-changesets`. CI-only change; no package behavior affected.
