---
"@tko/bind": patch
"@tko/binding.component": patch
"@tko/binding.core": patch
"@tko/binding.foreach": patch
"@tko/binding.if": patch
"@tko/binding.template": patch
"@tko/builder": patch
"@tko/build.knockout": patch
"@tko/build.reference": patch
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
---

Publish generated `types/` folders for all public packages and both bundled builds, and advertise those declarations through package `types` metadata and `exports` conditions so consumer imports resolve the shipped type surface instead of repo-only sources.

This also corrects the published module metadata for modern TypeScript package modes by routing `import` and `require` consumers to mode-appropriate JavaScript and declaration entrypoints. Packages now publish ESM/CJS-aware declaration entries so `bundler`, `node16`, and `nodenext` consumers resolve the shipped surface consistently instead of hitting Node-specific module-resolution mismatches.
