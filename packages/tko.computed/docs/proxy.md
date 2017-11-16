# Proxy

Where the [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) object is [supported](https://caniuse.com/#search=Proxy), TKO can wrap objects to make them observable.

```Javascript
const obj = { x: 1 }
const p = ko.proxy(obj)
const x2 = ko.computed(() => p.x * p.x)
// p.x === 1; x2 = 1
p.x = 2
// p.x = 2; x2 = 4
```
