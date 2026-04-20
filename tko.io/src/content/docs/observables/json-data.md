---
title: Loading & Saving Data
---

# Loading and saving data

TKO doesn't prescribe how you load or save data — use `fetch`, a library, or whatever your server expects. This page covers the patterns for moving data between your server and your observable view models.

## Serializing a view model

Use `ko.toJS` to strip observables from a view model before sending it to a server:

```js
const vm = {
  firstName: ko.observable('Jane'),
  lastName: ko.observable('Doe'),
  tags: ko.observableArray(['admin', 'active'])
}

const save = async () => {
  const data = ko.toJS(vm)
  // data is { firstName: 'Jane', lastName: 'Doe', tags: ['admin', 'active'] }

  await fetch('/api/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}
```

Or use `ko.toJSON` as a shorthand for `JSON.stringify(ko.toJS(...))`:

```js
await fetch('/api/user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: ko.toJSON(vm)
})
```

## Loading data into observables

When you receive data from a server, update each observable individually:

```js
const load = async () => {
  const response = await fetch('/api/user')
  const data = await response.json()

  vm.firstName(data.firstName)
  vm.lastName(data.lastName)
  vm.tags(data.tags)
}
```

For larger models, a helper keeps things tidy:

```js
const updateFrom = (viewModel, data) => {
  for (const [key, value] of Object.entries(data)) {
    if (ko.isWritableObservable(viewModel[key])) {
      viewModel[key](value)
    }
  }
}

// Usage
const load = async () => {
  const data = await fetch('/api/user').then(r => r.json())
  updateFrom(vm, data)
}
```

## Debugging: showing JSON in the UI

Bind `ko.toJSON` directly to see the live state of your view model:

```html
<pre data-bind="text: ko.toJSON($root, null, 2)"></pre>
```

This updates in real time as observables change — useful during development.

## See also

- [Utility Functions](./utilities/) — `ko.toJS`, `ko.toJSON`, and type-checking helpers
- [Observables](/observables/) — how reactive state works
