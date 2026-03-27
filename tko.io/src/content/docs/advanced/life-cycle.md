---
title: Lifecycle
---

# Lifecycle

`LifeCycle` helps an object keep track of temporary computeds, subscriptions, event handlers, and other disposables.

You can use it as a base class or mix it into an existing constructor or object:

```javascript
class OtherClass extends LifeCycle {}

LifeCycle.mixInto(thing)
```

Call `dispose` directly, or anchor the lifecycle to a DOM node with `anchorTo(node)` so disposal happens when that node leaves the document.

## Methods

| Function or method | Purpose |
| --- | --- |
| `this.computed(fn)` | Create a computed tied to the lifecycle |
| `this.subscribe(obs, fn)` | Create a subscription tied to the lifecycle |
| `this.addEventListener(node, ...)` | Register a DOM listener that is removed automatically |
| `this.anchorTo(node)` | Dispose the lifecycle when the node is removed |
| `this.addDisposable(obj)` | Dispose a custom object during cleanup |

When a lifecycle ends, its computeds, subscriptions, event handlers, and added disposables are cleaned up. If a computed is anchored to a DOM node, it is disposed when that node is removed.

Prefer `pureComputed` where possible, and explicitly dispose anything that outlives the object itself.
