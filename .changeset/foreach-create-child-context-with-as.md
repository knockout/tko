---
"@tko/binding.foreach": patch
---

`ForEachBinding` now honors `options.createChildContextWithAs`. When it is
enabled, `foreach: { data, as: 'x' }` creates a child context per item
(`$data` is the item, `$parent` the outer data), matching the template-based
`foreach` and `with`. The default (`false`, alias added to the current
context) is unchanged.
