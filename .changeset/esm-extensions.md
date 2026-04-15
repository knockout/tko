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

Add .js extensions to ESM dist imports for Node ESM compatibility

Relative imports in ESM dist files now include `.js` extensions, fixing `ERR_MODULE_NOT_FOUND` in Node's strict ESM resolver and tools like vitest that use it.
