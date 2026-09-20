---
"@tko/bind": major
"@tko/binding.component": major
"@tko/binding.core": major
"@tko/binding.foreach": major
"@tko/binding.if": major
"@tko/binding.template": major
"@tko/build.knockout": major
"@tko/build.reference": major
"@tko/builder": major
"@tko/computed": major
"@tko/filter.punches": major
"@tko/lifecycle": major
"@tko/observable": major
"@tko/provider": major
"@tko/provider.attr": major
"@tko/provider.bindingstring": major
"@tko/provider.component": major
"@tko/provider.databind": major
"@tko/provider.multi": major
"@tko/provider.mustache": major
"@tko/provider.native": major
"@tko/provider.virtual": major
"@tko/utils": major
"@tko/utils.component": major
"@tko/utils.functionrewrite": major
"@tko/utils.jsx": major
"@tko/utils.parser": major
---

Fix the `Release` workflow, which failed on every push to `main` because
`changesets/action@v2` renamed several inputs (`version` -> `version-script`,
`title` -> `pr-title`, `commit` -> `commit-message`, `publish` ->
`publish-script`) and no longer accepts `commitMode`. Also fixes
`outputs.should_publish`, which read the stale `hasChangesets` key instead of
the current `has-changesets`. CI-only change; no package behavior affected.
