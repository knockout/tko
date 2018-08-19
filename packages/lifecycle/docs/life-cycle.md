# tko.lifecycle

The `tko.lifecycle` package exports one class, `LifeCycle`, which is intended to make tracking and disposing of temporary computations, subscriptions, and DOM event handlers simpler.


The `LifeCycle` class can be a base for other Knockout fundamentals, such as binding handlers, components, and any other place where an instance keeps track of disposable elements.

## Beginning

The Cycle can be created by either:

#### 1. ES6 Class extension i.e.

```
class OtherClass extends LifeCycle { ... }
```

Any instance of `OtherClass` shall have all the methods of the `LifeCycle` class.

#### 2. Mixin i.e.

```
LifeCycle.mixInto(thing)
```

where `thing` is a constructor (with methods added to its prototype) or an function-object instance (with methods added to the object directly) or object, with methods added directly to the object.

## End

The “cycle” ends with a call to the `dispose` method, which may occur
when:

1. `dispose` is called via another LifeCycle
2. The instance has `anchorTo` a node, and that node is removed via `ko.removeNode` (i.e. via Knockout)
3. `dispose` is called explicitly

Upon the end of the cycle, subscriptions and computeds are disposed and DOM event handlers are removed.

Note that for `computed`, once `anchorTo` has been called with a `node`, upon that node's removal from the DOM tree, the next evaluation of the `computed` will dipose of it.  (i.e. after `anchorTo` is called, any call to `computed` will be passed with `disposeWhenNodeIsRemoved` set to the anchored node).


## Methods

It exposes alternatives to native/ko functions, such as:

|  Function (Native/KO)       |   Replacement
|  ------------               |   --------------
|  `ko.computed(fn/obj, this)`  |  `this.computed(fn/fn-name/obj)`
|  `obs.subscribe(fn, this)`    |  `this.subscribe(obs, fn/fn-name)`
|  `node.addEventListener(...)` |  `this.addEventListener(node, ...)`

where `fn-name` is the name of a method of the current instance i.e.


```
fn = this[fn-name]
```

The event listeners are removed on the first of the DOM node being removed
or the lifecycle ending (`dispose` being called).

It also exposes:

|  Method  | Description
|  ------  | ----
|  `.anchorTo(node)` | .dispose is called upon ko.remove/cleanNode(node).
|  `.addDisposable(obj)` | obj.dispose is called when cleaning up.

Once `anchorTo` has been called, then the `node` argument to `this.addEventListener` can be omitted as the anchor node will be used.  If `node` is provided to `addEventListener` it is preferred to the anchor, and will be disposed at the first of the anchor or the event node being removed.


LICENSE
---

The MIT License (MIT)

Copyright (c) 2017 Knockout Team

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.