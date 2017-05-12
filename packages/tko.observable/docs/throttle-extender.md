---
kind: documentation
title: The "throttle" extender
cat: 2
---

*Note: This throttle API is deprecated as of Knockout 3.1.0. Please use the [`rateLimit` extender](#rateLimit-observable) for similar functionality.*

Normally, [computed observables](#computedObservables) are re-evaluated *synchronously*, as soon as each of their dependencies change. The `throttle` extender, however, causes a computed observable to delay re-evaluation until its dependencies have stopped changing for a specified period of time. Throttled computed observables therefore update *asychronously*.

The main uses cases for throttling are:

 * Making things respond after a certain delay
 * Combining multiple changes into a single re-evaluation (also known as "atomic updates")

You'll find examples of these below.

### Example 1: The basics

Consider the computed observable in the following code:

```javascript
var name = ko.observable('Bert');

var upperCaseName = ko.computed(function() {
    return name().toUpperCase();
});
```

Normally, if you update `name` as follows:

```javascript
name('The New Bert');
```

... then `upperCaseName` will be recomputed immediately, before your next line of code runs. But if you had instead defined `upperCaseName` using `throttle` as follows:

```javascript
var upperCaseName = ko.computed(function() {
    return name().toUpperCase();
}).extend({ throttle: 500 });
```

... then `upperCaseName` would not be recomputed immediately when `name` changes --- instead, it would wait for 500 milliseconds (half a second) before recomputing its value and then notifying any associated UI. Each time `name` changes, that timeout is reset back to zero, so the re-evaluation only occurs once `name` has stopped changing for at least half a second.

### Example 2: Doing something when the user stops typing

In this live example, there's an `instantaneousValue` observable that reacts immediately when you press a key. This is then wrapped inside a `throttledValue` computed observable that's configured to react only when you stop typing for at least 400 milliseconds.

Try it:

<live-example params='id: "throttle-binding"'></live-example>

### Example 3: Avoiding multiple Ajax requests

The following model represents data that you could render as a paged grid:

```javascript
function GridViewModel() {
    this.pageSize = ko.observable(20);
    this.pageIndex = ko.observable(1);
    this.currentPageData = ko.observableArray();

    // Query /Some/Json/Service whenever pageIndex or pageSize changes,
    // and use the results to update currentPageData
    ko.computed(function() {
        var params = { page: this.pageIndex(), size: this.pageSize() };
        $.getJSON('/Some/Json/Service', params, this.currentPageData);
    }, this);
}
```

Because the `ko.computed` evaluates both `pageIndex` and `pageSize`, it becomes dependent on both of them. So, this code will use jQuery's [`$.getJSON` function](http://api.jquery.com/jQuery.getJSON/) to reload `currentPageData` when the `GridViewModel` is first instantiated *and* whenever the `pageIndex` or `pageSize` properties are later changed.

This is very simple and elegant (and it's trivial to add yet more observable query parameters that also trigger a refresh automatically whenever they change), but there is a potential efficiency problem. What if you want to change both `pageIndex` and `pageSize` at once? You might add the following function to `GridViewModel`:

```javascript
this.setPageSize = function(newPageSize) {
    // Whenever you change the page size, we always reset the page index to 1
    this.pageSize(newPageSize);
    this.pageIndex(1);
}
```

The problem is that this will cause *two* simultaneous Ajax requests: the first one will start when you update `pageSize`, and the second one will start immediately afterwards when you update `pageIndex`. This is a waste of bandwidth and server resources, and a source of unpredictable race conditions.

Throttling is an elegant solution. You can add an arbitrarily short but nonzero throttle timeout (e.g., 1 millisecond), and then any sequence of synchronous changes to dependencies will only trigger *one* re-evaluation of your computed observable. For example,

```javascript
ko.computed(function() {
    // This evaluation logic is exactly the same as before
    var params = { page: this.pageIndex(), size: this.pageSize() };
    $.getJSON('/Some/Json/Service', params, this.currentPageData);
}, this).extend({ throttle: 1 });
```

Now you can update `pageIndex` and `pageSize` as many times as you like, and the Ajax call will only happen once at the end of that sequence. It doesn't matter if your thread continually makes changes for longer than 1 millisecond, because re-evaluation won't start until you release your thread back to the JavaScript runtime.
