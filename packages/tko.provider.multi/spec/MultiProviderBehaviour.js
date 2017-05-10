
import {
  MultiProvider
} from '../index'


describe("MultiProvider Behaviour", function () {
  describe("nodeHasBindings", function () {
    it("is true if one provider the last is true", function () {
      const mp = new MultiProvider({
        providers: [
          { nodeHasBindings() { return false } },
          { nodeHasBindings() { return true } }
        ]
      })
      assert.ok(mp.nodeHasBindings())
    })

    it("is true if one provider the first is true", function () {
      const mp = new MultiProvider({
        providers: [
          { nodeHasBindings() { return true } },
          { nodeHasBindings() { return false } }
        ]
      })
      assert.ok(mp.nodeHasBindings())
    })

    it("is false if no providers are true", function () {
      const mp = new MultiProvider({
        providers: [
          { nodeHasBindings() { return false } },
          { nodeHasBindings() { return false } }
        ]
      })
      assert.notOk(mp.nodeHasBindings())
    })
  })

  describe("getBindingAccessors", function () {
    it("merges the bindings", function () {
      const mp = new MultiProvider({
        providers: [
          {getBindingAccessors() { return { x: 'X' } }, preprocessNode() {}},
          {getBindingAccessors() { return { y: 'Y' } }, preprocessNode() {}}
        ]
      })
      assert.deepEqual(mp.getBindingAccessors(), {x: 'X', y: 'Y'})

    })
  })

  describe("preprocessNode", function () {
    it("returns the first preprocessing result", function () {
      const mp = new MultiProvider({
        providers: [
          {preprocessNode() { return 'x' }},
          {preprocessNode() { return 'y' }}
        ]
      })
      assert.equal(mp.preprocessNode(), 'x')
    })
  })
})
