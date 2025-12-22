if (!Function.prototype['bind']) {
  // Shim/polyfill JavaScript Function.bind.
  // This implementation is based on the one in prototype.js
  Function.prototype['bind'] = function (object) {
    const originalFunction = this
    if (arguments.length === 1) {
      return function () {
        return originalFunction.apply(object, arguments)
      }
    } else {
      const partialArgs = Array.prototype.slice.call(arguments, 1)
      return function () {
        const args = partialArgs.slice(0)
        args.push.apply(args, arguments)
        return originalFunction.apply(object, args)
      }
    }
  }
}
