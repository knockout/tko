---
"@tko/bind": minor
"@tko/utils": minor
"@tko/binding.foreach": patch
---

Allow `applyBindings` to run on `HTMLTemplateElement`, `DocumentFragment`,
and shadow-root subtrees

`applyBindings` and `applyBindingsToDescendants` now accept any `Node` whose
`nodeType` is `ELEMENT_NODE`, `COMMENT_NODE`, or `DOCUMENT_FRAGMENT_NODE`,
which makes it possible to bind a shadow root, a document fragment, or a
`<template>` element directly. The binding engine recurses into
`template.content` as if it were a normal subtree.

`@tko/utils`:

- `cleanNode` now disposes nodes in `Document` / `DocumentFragment`
  subtrees (nodeType 9 and 11), and recurses into every nested
  `HTMLTemplateElement.content` so bindings created inside templates do
  not leak. `instanceof` checks are replaced with `nodeType` checks for
  cross-runtime safety.
- `virtualElements.firstChild`, `childNodes`, `emptyNode`, and
  `setDomNodeChildren` now operate on `template.content` for
  `HTMLTemplateElement`, matching the new template-aware binding path.
- `domNodeIsContainedBy` accepts `null | undefined` and uses a proper
  `compareDocumentPosition` bitmask test.
- New type predicate `isTemplateTag(node)`; `isDomElement` /
  `isDocumentFragment` now narrow types.

**Behavior change for `@tko/build.knockout`:** legacy KO did not recurse
into `<template>` elements. TKO now does. Apps that have `data-bind`
syntax inside `<template>` content and previously relied on it being
left alone will now have those bindings applied.
