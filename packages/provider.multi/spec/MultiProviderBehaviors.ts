
import {
  MultiProvider
} from '../dist'

import { assert } from "chai"

describe('MultiProvider Behavior', function () {
  describe('nodeHasBindings', function () {
    it('is true if one provider the last is true', function () {
      const mp = new MultiProvider({
        providers: [
          { nodeHasBindings () { return false }, FOR_NODE_TYPES: [1] },
          { nodeHasBindings () { return true }, FOR_NODE_TYPES: [1] }
        ]
      })
      assert.ok(mp.nodeHasBindings({nodeType: 1}))
    })

    it('is true if one provider the first is true', function () {
      const mp = new MultiProvider({
        providers: [
          { nodeHasBindings () { return true }, FOR_NODE_TYPES: [1] },
          { nodeHasBindings () { return false }, FOR_NODE_TYPES: [1] }
        ]
      })
      assert.ok(mp.nodeHasBindings({nodeType: 1}))
    })

    it('is false if no providers are true', function () {
      const mp = new MultiProvider({
        providers: [
          { nodeHasBindings () { return false }, FOR_NODE_TYPES: [1] },
          { nodeHasBindings () { return false }, FOR_NODE_TYPES: [1] }
        ]
      })
      assert.notOk(mp.nodeHasBindings({nodeType: 1}))
    })

    it('skips providers for other node types', function () {
      const mp = new MultiProvider({
        providers: [
          { nodeHasBindings () { return true }, FOR_NODE_TYPES: [4] }
        ]
      })
      assert.notOk(mp.nodeHasBindings({nodeType: 2}))
    })
  })

  describe('getBindingAccessors', function () {
    it('merges the bindings', function () {
      const mp = new MultiProvider({
        providers: [
          {getBindingAccessors () { return { x: 'X' } }, preprocessNode () {}, FOR_NODE_TYPES: [1]},
          {getBindingAccessors () { return { y: 'Y' } }, preprocessNode () {}, FOR_NODE_TYPES: [1]}
        ]
      })
      assert.deepEqual(mp.getBindingAccessors({nodeType: 1}), { x: 'X',  y: 'Y' })
    })

    it('performs only the first preemptive binding', function () {
      const mp = new MultiProvider({
        providers: [
          {getBindingAccessors () { return { x: 'X' } }, preemptive: true, preprocessNode () {}, FOR_NODE_TYPES: [1]},
          {getBindingAccessors () { return { y: 'Y' } }, preprocessNode () {}, FOR_NODE_TYPES: [1]}
        ]
      })
      assert.deepEqual(mp.getBindingAccessors({nodeType: 1}), {x: 'X'})
    })

    it('Skips providers for different node types', function () {
      const mp = new MultiProvider({
        providers: [
          {getBindingAccessors () { return { x: 'X' } }, preprocessNode () {}, FOR_NODE_TYPES: [1]},
          {getBindingAccessors () { return { y: 'Y' } }, preprocessNode () {}, FOR_NODE_TYPES: [2]}
        ]
      })
      assert.deepEqual(mp.getBindingAccessors({nodeType: 1}), {x: 'X'})
    })
  })

  describe('preprocessNode', function () {
    it('calls all preprocessors', function () {
      let calls = 0
      const mp = new MultiProvider({
        providers: [
          {preprocessNode () { ++calls }, FOR_NODE_TYPES: [1]},
          {preprocessNode () { ++calls }, FOR_NODE_TYPES: [1]}
        ]
      })
      mp.preprocessNode({ nodeType: 1 })
      assert.equal(calls, 2)
    })

    it('skips preprocessing if node types are not handled', function () {
      let calls = 0
      const mp = new MultiProvider({
        providers: [
          {preprocessNode () { ++calls }, FOR_NODE_TYPES: [2]},
          {preprocessNode () { ++calls }, FOR_NODE_TYPES: [1]}
        ]
      })
      mp.preprocessNode({ nodeType: 1 })
      assert.equal(calls, 1)
    })
  })
})
