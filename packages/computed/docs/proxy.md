# Proxy

Where the [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) object is [supported](https://caniuse.com/#search=Proxy), TKO can wrap objects to make them observable.

```Javascript
>>> const obj = {
    x: 1,

    // Functions are converted to computed properties.
    x2 () {return this.x * this.x },

    // The computed properties are writable, when assigned to
    rootX (...args) {
        if (args.length) {
            this.x = args[0]
        }
        return Math.sqrt(this.x)
    }
}
>>> const p = ko.proxy(obj)
>>> p.x
1
>>> p.x2
1
>>> p.x = 2
2
// Modifications to the proxy update the original
>>> obj.x
2
>>> p.x2
4
>>> p.rootX = 4

// Add new properties
>>> p.y = 6
>>> p.x3 = () => this.x * this.x * this.x
>>> p.x3
8

// Create arbitrary dependency chains.
>>> const x4 = ko.computed(() => p.x2 * p.x2)
>>> x4()
16
>>> p.x = 0
>>> x4()
0

// Unwrap the proxy by calling it
>>> p() === x
true
// Or assign multiple values
>>> p({ x: 9 })
{x: 9}
```
