---
title: Throttle Extender
---

# Throttle Extender

*Legacy note: `throttle` is deprecated. Prefer [`rateLimit`](./rateLimit-observable/) for new code.*

The old `throttle` extender delayed re-evaluation of a computed observable until its dependencies stopped changing for a specified period of time. `rateLimit` is the modern replacement, but it is broader and more configurable:

* `throttle` only applied to computed observables.
* `rateLimit` works with both observables and computed observables.
* `rateLimit` supports multiple notification strategies, including fixed-rate updates and "notify when changes stop" behavior.

If you are migrating old code, treat `throttle` as a legacy shorthand for "delay notifications until changes settle," then move to `rateLimit` for new work.

If you still need to recognize the old shape in an existing codebase, it looked like this:

```javascript
var name = ko.observable('Bert');

var upperCaseName = ko.computed(function() {
    return name().toUpperCase();
}).extend({ throttle: 500 });
```

The older API only delayed re-evaluation of computed observables. It did not change the general binding or observable model, so new docs should use `rateLimit` instead. For current guidance and migration targets, see [`rateLimit`](./rateLimit-observable/).
