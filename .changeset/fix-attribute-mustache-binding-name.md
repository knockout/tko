---
"@tko/provider.mustache": patch
---

Fix AttributeMustacheProvider to use the mapped binding name (e.g. `css`) instead of the raw attribute name (e.g. `class`) when looking up and emitting a direct binding. Previously `class="{{ expr }}"` silently fell through to `attr.class` instead of activating the `css` binding handler.
