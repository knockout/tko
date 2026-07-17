---
"@tko/provider.component": patch
---

Fix component params globals resolution in `ComponentProvider`.

`getComponentParams` now instantiates `Parser` with `new Parser()` and passes
provider globals to `parser.parse(...)`, matching canonical parser usage in
other providers. This restores resolution of globals in component `params`
expressions (for example, `params="answer: GLOBAL_CONST"`).
