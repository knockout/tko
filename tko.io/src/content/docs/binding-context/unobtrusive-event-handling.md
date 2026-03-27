---
title: Unobtrusive Event Handling Binding
---

# Unobtrusive Event Handlers

For most cases, inline `click` or `submit` bindings are clearer. Use delegated DOM listeners when you need one handler for many repeated items.

Knockout provides two helper functions that let you identify the data associated with a DOM element:

* `ko.dataFor(element)` - returns the data that was available for binding against the element
* `ko.contextFor(element)` - returns the entire [binding context](../) that was available to the DOM element

These helpers are useful when you attach a single event listener to a container and then inspect the clicked child with standard DOM APIs.

### Example: delegated remove links

```example
html: |-
  <ul id="people" data-bind="foreach: people">
      <li>
          <a class="remove" href="#">remove</a>
          <span data-bind="text: name"></span>
      </li>
  </ul>
javascript: |-
  const viewModel = {
      people: ko.observableArray([
          { name: ko.observable("Bob") },
          { name: ko.observable("Ann") }
      ])
  }

  ko.applyBindings(viewModel)

  document.getElementById('people').addEventListener('click', event => {
      const removeLink = event.target.closest('.remove')
      if (!removeLink) return

      event.preventDefault()
      const context = ko.contextFor(removeLink)
      context.$parent.people.remove(ko.dataFor(removeLink))
  })
```

The handler always knows which item was clicked, even if the list grows or items are added later.
