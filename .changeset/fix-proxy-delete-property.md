---
"@tko/computed": patch
---

Fix `ko.proxy` `deleteProperty` trap silently doing nothing

The `deleteProperty` handler on proxies built by `ko.proxy` declared only one
parameter, named `property`. Per the Proxy spec, the trap is invoked with
`(target, property)` — so the handler was receiving `target` (the internal
`function(){}`) in place of the property key, stringifying it, and attempting
to delete that bogus key. The actual property remained on both the mirror
observable store and the underlying object, and its tracked observable stayed
alive.

`delete proxied.foo` now correctly removes `foo` from both the proxy and the
underlying object and returns `true`. Added a regression test to
`proxyBehavior.ts` — the bug had been present since `ko.proxy` was introduced
in 2017 and was untested.
