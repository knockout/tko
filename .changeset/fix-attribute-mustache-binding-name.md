---
"@tko/provider.mustache": patch
---

Fix AttributeMustacheProvider to use the mapped binding name (e.g. `css`) instead of the raw attribute name (e.g. `class`) when looking up and emitting a direct binding. In handler sets that register `css` but not a `class` alias, `class="{{ expr }}"` previously fell through to `attr.class` instead of activating the `css` binding handler. Also guards against non-string values in a custom `attributesBindingMap`.
