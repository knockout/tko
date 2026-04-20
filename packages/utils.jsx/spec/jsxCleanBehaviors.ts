import { assert } from 'chai'
import sinon from 'sinon'

import { addDisposeCallback, options } from '@tko/utils'

import { queueCleanNode } from '../src/jsxClean'

describe('jsxClean queue', function () {
  let cleaned: Node[]
  let clock: sinon.SinonFakeTimers
  let originalBatchSize: number

  function makeNode(): HTMLElement {
    const node = document.createElement('div')
    addDisposeCallback(node, () => cleaned.push(node))
    return node
  }

  beforeEach(function () {
    cleaned = []
    originalBatchSize = options.jsxCleanBatchSize
    clock = sinon.useFakeTimers()
  })

  afterEach(function () {
    clock.restore()
    options.jsxCleanBatchSize = originalBatchSize
  })

  describe('jsxCleanBatchSize = 0 (synchronous)', function () {
    beforeEach(function () {
      options.jsxCleanBatchSize = 0
    })

    it('runs cleanup synchronously on queueCleanNode', function () {
      const node = makeNode()
      queueCleanNode(node)
      assert.deepEqual(cleaned, [node])
    })

    it('drains all queued nodes synchronously in a single call', function () {
      const nodes = [makeNode(), makeNode(), makeNode()]
      for (const n of nodes) queueCleanNode(n)
      assert.deepEqual(cleaned, nodes)
    })

    it('does not schedule a timer', function () {
      queueCleanNode(makeNode())
      assert.equal(clock.countTimers(), 0)
    })
  })

  describe('jsxCleanBatchSize > 0 (batched, default 1000)', function () {
    beforeEach(function () {
      options.jsxCleanBatchSize = 1000
    })

    it('defers cleanup until the 25ms timer fires', function () {
      const node = makeNode()
      queueCleanNode(node)
      assert.lengthOf(cleaned, 0, 'not cleaned before timer fires')
      clock.tick(25)
      assert.deepEqual(cleaned, [node])
    })

    it('does not re-trigger the timer while one is already pending', function () {
      const a = makeNode()
      const b = makeNode()
      queueCleanNode(a)
      queueCleanNode(b)
      clock.tick(24)
      assert.lengthOf(cleaned, 0)
      clock.tick(1)
      assert.deepEqual(cleaned, [a, b])
    })

    it('processes at most batchSize nodes per 25ms tick', function () {
      options.jsxCleanBatchSize = 3
      const nodes = [makeNode(), makeNode(), makeNode(), makeNode(), makeNode()]
      for (const n of nodes) queueCleanNode(n)

      clock.tick(25)
      assert.lengthOf(cleaned, 3, 'first tick processes one batch')

      clock.tick(25)
      assert.lengthOf(cleaned, 5, 'second tick drains the remainder')
    })

    it('re-schedules itself when the queue is non-empty after a batch', function () {
      options.jsxCleanBatchSize = 2
      const nodes = Array.from({ length: 5 }, makeNode)
      for (const n of nodes) queueCleanNode(n)

      clock.tick(25)
      assert.lengthOf(cleaned, 2)
      clock.tick(25)
      assert.lengthOf(cleaned, 4)
      clock.tick(25)
      assert.lengthOf(cleaned, 5)
    })

    it('drains synchronously if batchSize is flipped to 0 while a timer is pending', function () {
      const nodes = [makeNode(), makeNode(), makeNode()]
      for (const n of nodes) queueCleanNode(n)
      assert.lengthOf(cleaned, 0)
      assert.equal(clock.countTimers(), 1)

      // Consumer flips to sync mid-flight. When the timer fires it must
      // fall through to a full drain — not splice(0, 0) forever.
      options.jsxCleanBatchSize = 0
      clock.tick(25)

      assert.deepEqual(cleaned, nodes)
      assert.equal(clock.countTimers(), 0, 'no re-armed timer')
    })
  })
})
