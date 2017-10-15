
import {
  MultiProvider
} from '../src'


describe("MultiProvider Behaviour", function () {
  describe("nodeHasBindings", function () {
    it("is true if one provider the last is true", function () {
      const mp = new MultiProvider({
        providers: [
          { nodeHasBindings() { return false }, FOR_NODE_TYPES: [1] },
          { nodeHasBindings() { return true }, FOR_NODE_TYPES: [1] }
        ]
      })
      assert.ok(mp.nodeHasBindings({nodeType: 1}))
    })

    it("is true if one provider the first is true", function () {
      const mp = new MultiProvider({
        providers: [
          { nodeHasBindings() { return true }, FOR_NODE_TYPES: [1] },
          { nodeHasBindings() { return false }, FOR_NODE_TYPES: [1] }
        ]
      })
      assert.ok(mp.nodeHasBindings({nodeType: 1}))
    })

    it("is false if no providers are true", function () {
      const mp = new MultiProvider({
        providers: [
          { nodeHasBindings() { return false }, FOR_NODE_TYPES: [1] },
          { nodeHasBindings() { return false }, FOR_NODE_TYPES: [1] }
        ]
      })
      assert.notOk(mp.nodeHasBindings({nodeType: 1}))
    })

    it("skips providers for other node types", function () {
      const mp = new MultiProvider({
        providers: [
          { nodeHasBindings() { return true }, FOR_NODE_TYPES: [4] },
        ]
      })
      assert.notOk(mp.nodeHasBindings({nodeType: 2}))
    })
  })

  describe("getBindingAccessors", function () {
    it("merges the bindings", function () {
      const mp = new MultiProvider({
        providers: [
          {getBindingAccessors() { return { x: 'X' } }, preprocessNode() {}, FOR_NODE_TYPES: [1]},
          {getBindingAccessors() { return { y: 'Y' } }, preprocessNode() {}, FOR_NODE_TYPES: [1]}
        ]
      })
      assert.deepEqual(mp.getBindingAccessors({nodeType: 1}), {x: 'X', y: 'Y'})
    })

    it("Skips providers for different node types", function () {
      const mp = new MultiProvider({
        providers: [
          {getBindingAccessors() { return { x: 'X' } }, preprocessNode() {}, FOR_NODE_TYPES: [1]},
          {getBindingAccessors() { return { y: 'Y' } }, preprocessNode() {}, FOR_NODE_TYPES: [2]}
        ]
      })
      assert.deepEqual(mp.getBindingAccessors({nodeType: 1}), {x: 'X'})

    })
  })

  describe("preprocessNode", function () {
    it("returns the first preprocessing result", function () {
      const mp = new MultiProvider({
        providers: [
          {preprocessNode() { return 'x' }, FOR_NODE_TYPES: [1]},
          {preprocessNode() { return 'y' }, FOR_NODE_TYPES: [1]}
        ]
      })
      assert.equal(mp.preprocessNode({ nodeType: 1 }), 'x')
    })

    it("skips preprocessing if node types are not handled", function () {
      const mp = new MultiProvider({
        providers: [
          {preprocessNode() { return 'x' }, FOR_NODE_TYPES: [2]},
          {preprocessNode() { return 'y' }, FOR_NODE_TYPES: [1]}
        ]
      })
      assert.equal(mp.preprocessNode({ nodeType: 1 }), 'y')

    })
  })
})
