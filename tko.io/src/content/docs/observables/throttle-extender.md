---
title: Throttle Extender
---

# Throttle Extender

*Legacy note: `throttle` is deprecated. Prefer [`rateLimit`](./rateLimit-observable/) for new code.*

The old `throttle` extender delayed work on both sides of a writable value:

* For computed observables, it delayed re-evaluation until dependencies stopped changing for a specified period.
* For writable observables and writable computed observables, it also delayed writes back to the underlying target.

If you are modernizing code that depends on delayed writes, keep that behavior in mind: `rateLimit` is the notification-focused API, not a drop-in replacement for write throttling.

If you still need to recognize the old shape in an existing codebase, it looked like this:

```javascript
var name = ko.observable('Bert');

var upperCaseName = ko.computed(function() {
    return name().toUpperCase();
}).extend({ throttle: 500 });
```

The older API did not change the general binding model, but it did affect both computed timing and writes to writable targets. New docs should use `rateLimit` unless they specifically need throttled writes during migration.
