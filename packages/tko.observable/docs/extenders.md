---
kind: documentation
title: Using extenders to augment observables
cat: 2
---

Knockout observables provide the basic features necessary to support reading/writing values and notifying subscribers when that value changes. In some cases, though, you may wish to add additional functionality to an observable. This might include adding additional properties to the observable or intercepting writes by placing a writeable computed observable in front of the observable. Knockout extenders provide an easy and flexible way to do this type of augmentation to an observable.

### How to create an extender
Creating an extender involves adding a function to the `ko.extenders` object. The function takes in the observable itself as the first argument and any options in the second argument. It can then either return the observable or return something new like a computed observable that uses the original observable in some way.

 This simple `logChange` extender subscribes to the observable and uses the console to write any changes along with a configurable message.

```javascript
ko.extenders.logChange = function(target, option) {
    target.subscribe(function(newValue) {
       console.log(option + ": " + newValue);
    });
    return target;
};
```

You would use this extender by calling the `extend` function of an observable and passing an object that contains a `logChange` property.

```javascript
this.firstName = ko.observable("Bob").extend({logChange: "first name"});
```

If the `firstName` observable's value was changed to `Ted`, then the console would show `first name: Ted`.

### Live Example 1: Forcing input to be numeric

This example creates an extender that forces writes to an observable to be numeric rounded to a configurable level of precision.  In this case, the extender will return a new writeable computed observable that will sit in front of the real observable intercepting writes.

<live-example params='id: "extender-numeric"'></live-example>

Note that for this to automatically erase rejected values from the UI, it's necessary to use `.extend({ notify: 'always' })` on the computed observable. Without this, it's possible for the user to enter an invalid `newValue` that when rounded gives an unchanged `valueToWrite`. Then, since the model value would not be changing, there would be no notification to update the textbox in the UI. Using `{ notify: 'always' }` causes the textbox to refresh (erasing rejected values) even if the computed property has not changed value.

### Live Example 2: Adding validation to an observable

This example creates an extender that allows an observable to be marked as required. Instead of returning a new object, this extender simply adds additional sub-observables to the existing observable. Since observables are functions, they can actually have their own properties. However, when the view model is converted to JSON, the sub-observables will be dropped and we will simply be left with the value of our actual observable.  This is a nice way to add additional functionality that is only relevant for the UI and does not need to be sent back to the server.

<live-example params='id: "extender-validation"'></live-example>

### Applying multiple extenders

More than one extender can be applied in a single call to the `.extend` method of an observable.

```javascript
this.firstName = ko.observable(first).extend({ required: "Please enter a first name", logChange: "first name" });
```

In this case, both the `required` and `logChange` extenders would be executed against our observable.
