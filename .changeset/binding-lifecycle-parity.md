---
"@tko/bind": minor
"@tko/binding.if": minor
"@tko/binding.component": minor
"@tko/binding.core": minor
---

Restore Knockout 3.5 binding-lifecycle semantics for `descendantsComplete` and
add `completeOn: "render"`.

`@tko/bind` now owns the KO 3.5 async-completion bookkeeping
(`bindingEvent.startPossiblyAsyncContentBinding` / `AsyncCompleteContext`).
`childrenComplete` drives per-node tracking of pending async descendants, and
`descendantsComplete` fires once a node's children **and** every
asynchronously-completing descendant (components, conditionals) have bound.

Behavior changes to be aware of:

- **`descendantsComplete` re-arms per content cycle.** Previously it fired at
  most once (when the initial binding pass settled), and never fired for a
  conditional that started false. It now fires each time a node renders content
  — a nested `if` becoming true re-fires the ancestor's `descendantsComplete`,
  and toggling a conditional off then on fires it again. Consumers who attached
  one-shot `descendantsComplete` callbacks may see additional calls.
- **`completeOn: "render"`** is now supported on `if`/`ifnot`/`with`. It defers
  the node's `childrenComplete` (and any ancestor `descendantsComplete`, or a
  component's `koDescendantsComplete`) until the binding actually renders
  content. `completeOn` is a reserved binding key (as in KO 3.5).
- A component viewmodel's **`koDescendantsComplete`** now fires via the
  element's `descendantsComplete` event, so inner components complete before
  their outer component (KO 3.5 ordering), including across intermediate
  bindings and several nesting layers.

Fixes the root cause behind
[#414](https://github.com/knockout/tko/issues/414): `koDescendantsComplete` is
no longer suppressed when a component template contains a conditional that
starts false.
