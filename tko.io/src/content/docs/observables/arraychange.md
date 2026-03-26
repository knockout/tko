---
title: Arraychange
---


# Tracking Array Changes

Since [Knockout 3.0](http://blog.stevensanderson.com/2013/10/08/knockout-3-0-release-candidate-available/)
there has been an `arrayChange` event that can be attached to an `observable`
or `observableArray`.

One subscribes to changes as follows:

```javascript
obsArray.subscribe(fn, thisArg, "arrayChange");
```

The main advantages of subscribing to changes:

- Performance is O(1) in most cases, i.e., there’s basically no performance implication at all, because for straightforward operations, (push, splice, etc.) KO supplies the change log without running any diff algorithm. KO now only falls back on the diff algorithm if you’ve made an arbitrary change without using a typical array mutation function.

- The change log is filtered down just to give you the items that actually changed.


The `observableArray` has array tracking enabled at construction, but
you can extend any other `subscribable` (i.e. `ko.observable` and `ko.computed`) by extending it as follows:

```javascript
trackable = ko.observable().extend({trackArrayChanges: true});
```


```html
<div>
    <button data-bind="click: addItem">Add Item</button>
    <button data-bind="click: removeItem">Remove Last</button>
</div>
<h4>Items</h4>
<ul data-bind="foreach: items">
    <li data-bind="text: $data"></li>
</ul>
<h4>Change Log</h4>
<ul data-bind="foreach: changes">
    <li data-bind="text: $data"></li>
</ul>
```

```javascript
function ViewModel() {
    var self = this;
    self.items = ko.observableArray(["Alpha", "Beta", "Gamma"]);
    self.changes = ko.observableArray([]);

    self.items.subscribe(function(changeList) {
        changeList.forEach(function(change) {
            var msg = change.status + ': ' + change.value + ' (index ' + change.index + ')';
            self.changes.push(msg);
        });
    }, null, "arrayChange");

    self.addItem = function() {
        self.items.push("Item " + (self.items().length + 1));
    };

    self.removeItem = function() {
        self.items.pop();
    };
}

ko.applyBindings(new ViewModel());
```
