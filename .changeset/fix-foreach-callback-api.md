---
"@tko/binding.foreach": patch
---

Add documented `foreach` lifecycle callbacks to `ForEachBinding`:
`afterRender(nodes, value)` fires when an item is rendered from the template,
`beforeMove(node, newIndex, value)` and `afterMove(node, newIndex, value)` fire
for retained items that shift position. The existing `afterAdd` and
`beforeRemove` signatures are unchanged.
