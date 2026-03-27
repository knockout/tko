---
title: Throttle Extender
---

# Throttle Extender

*Legacy note: `throttle` is deprecated. Prefer [`rateLimit`](./rateLimit-observable/) for new code.*

The old `throttle` extender delayed re-evaluation of a computed observable until its dependencies stopped changing for a specified period of time. `rateLimit` now covers the same practical migration path and is the recommended option for new code.

If you still need to recognize the old shape in an existing codebase, it looked like this:

```javascript
var name = ko.observable('Bert');

var upperCaseName = ko.computed(function() {
    return name().toUpperCase();
}).extend({ throttle: 500 });
```

The older API only delayed re-evaluation of computed observables. It did not change the general binding or observable model, so new docs should use `rateLimit` instead.
