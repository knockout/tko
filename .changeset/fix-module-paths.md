---
"@tko/bind": patch
"@tko/binding.component": patch
"@tko/binding.core": patch
"@tko/binding.foreach": patch
"@tko/binding.if": patch
"@tko/binding.template": patch
"@tko/builder": patch
"@tko/computed": patch
"@tko/filter.punches": patch
"@tko/lifecycle": patch
"@tko/observable": patch
"@tko/provider": patch
"@tko/provider.attr": patch
"@tko/provider.bindingstring": patch
"@tko/provider.component": patch
"@tko/provider.databind": patch
"@tko/provider.multi": patch
"@tko/provider.mustache": patch
"@tko/provider.native": patch
"@tko/provider.virtual": patch
"@tko/utils": patch
"@tko/utils.component": patch
"@tko/utils.functionrewrite": patch
"@tko/utils.jsx": patch
"@tko/utils.parser": patch
"@tko/build.knockout": patch
"@tko/build.reference": patch
---

Fix broken ESM module paths and remove test helpers from published packages

The `module` field in 22 packages pointed to non-existent files (e.g., `dist/bind.js`). Fixed to `dist/index.js`. Test helpers are no longer included in published packages.
