---
"@tko/utils": patch
"@tko/binding.core": patch
"@tko/provider.component": patch
---

Modernize synthetic event construction

`triggerEvent` (exported from `@tko/utils`) now builds synthetic events using
`new MouseEvent`/`KeyboardEvent`/`Event` constructors instead of the
deprecated `document.createEvent('HTMLEvents')` + `initEvent(...)` path. This
restores native side-effects in modern DOM implementations (e.g. synthetic
clicks toggle checkbox `.checked` in happy-dom) without changing behavior in
real browsers. `relatedTarget` is still set to the target element for mouse
events to match the previous init-event argument list.

`@tko/binding.core` event handler no longer assigns the legacy
`event.cancelBubble = true` before calling `event.stopPropagation()` — the
assignment is redundant on modern events and readonly on some implementations.

`@tko/provider.component` now uses `Object.prototype.toString.call(node)` to
detect `HTMLUnknownElement` rather than `'' + node`, which is immune to
user-land `toString` overrides on custom elements.
