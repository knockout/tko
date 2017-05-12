
import {
  Provider
} from '../index'

describe('Provider', function () {
  it("throws an error if not subclassed", function () {
    const fn = () => new Provider()
    assert.throws(fn, /Provider is an abstract base class/)
  })

  it("sets globals and bindingHandlers from params", function () {
    class SubProvider extends Provider {}
    const globals = {}
    const bindingHandlers = {}
    const sp = new SubProvider({ globals, bindingHandlers })
    assert.strictEqual(sp.globals, globals)
    assert.strictEqual(sp.bindingHandlers, bindingHandlers)
  })
})
