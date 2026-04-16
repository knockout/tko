---
title: Utility Functions
---

# Utility functions

TKO provides helper functions for inspecting and converting observables.

## Type checking

| Function | Returns `true` when |
|----------|-------------------|
| `ko.isObservable(value)` | The value is an observable, observable array, or computed |
| `ko.isWritableObservable(value)` | The value is a writable observable (not a read-only computed) |
| `ko.isComputed(value)` | The value is a computed observable |
| `ko.isSubscribable(value)` | The value is any subscribable (observable, computed, or raw subscribable) |

```js
const name = ko.observable('TKO')
const upper = ko.computed(() => name().toUpperCase())

ko.isObservable(name)          // true
ko.isObservable(upper)         // true
ko.isObservable('plain')       // false
ko.isWritableObservable(name)  // true
ko.isWritableObservable(upper) // false
ko.isComputed(upper)           // true
```

## Unwrapping

`ko.unwrap(value)` reads the value if it's an observable, or returns it as-is if it isn't. Useful when a function accepts either an observable or a plain value:

```js
ko.unwrap(ko.observable(42))  // 42
ko.unwrap(42)                 // 42
```

This is commonly used inside custom bindings where a parameter could be either type.

## Serialization

`ko.toJS` and `ko.toJSON` convert an object graph containing observables into plain data.

`ko.toJS(viewModel)` — clones the object tree, replacing every observable with its current value:

```js
const vm = {
  name: ko.observable('TKO'),
  tags: ko.observableArray(['fast', 'reactive']),
  nested: {
    count: ko.observable(3)
  }
}

ko.toJS(vm)
// { name: 'TKO', tags: ['fast', 'reactive'], nested: { count: 3 } }
```

`ko.toJSON(viewModel, replacer?, space?)` — same as `ko.toJS` followed by `JSON.stringify`. Accepts the same optional `replacer` and `space` arguments as `JSON.stringify`:

```js
ko.toJSON(vm, null, 2)
// Pretty-printed JSON string
```

See [Loading & Saving Data](./json-data/) for practical patterns.

## Extending types with `.fn`

Every observable inherits from a prototype chain you can extend:

```
subscribable.fn  →  observable.fn  →  observableArray (extends observable.fn)
                 →  computed.fn
```

Adding a method to `ko.observable.fn` makes it available on all observables:

```js
ko.observable.fn.log = function (label) {
  this.subscribe(value => console.log(label, value))
  return this
}

const name = ko.observable('TKO').log('name changed:')
name('v5')  // console: "name changed: v5"
```

Adding to `ko.subscribable.fn` affects everything — observables, computed, and observable arrays.

Use `.fn` when the behavior is broadly useful. For one-off logic, prefer a regular function or [extender](/observables/extenders/) instead.
