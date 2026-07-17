import { assert } from 'chai'

import { VirtualProvider } from '@tko/provider.virtual'
import { bindings as ifBindings } from '@tko/binding.if'
import { options } from '@tko/utils'

import { Builder } from '../dist'

describe('Builder', () => {
  it('creates a ko instance', function () {
    // `new Builder({...})` mutates the shared `@tko/utils` options
    // (filters + bindingProviderInstance). Under Vitest's per-file
    // module isolation the mutation is invisible to later specs;
    // under the browser /tests runner every spec shares module
    // state, so an unrestored mutation here wipes `options.filters`
    // (which at this point holds the punctuation filters from
    // `@tko/filter.punches`) and breaks ~14 downstream filter-
    // lookup tests.
    // @ts-ignore — global helper from mocha-test-helpers.js
    restoreAfter(options, 'filters')
    // @ts-ignore — global helper from mocha-test-helpers.js
    restoreAfter(options, 'bindingProviderInstance')
    // We're just testing that the builder constructs, here.
    const builder = new Builder({ filters: {}, provider: new VirtualProvider(), bindings: [ifBindings], options: {} })
  })

  describe('create()', () => {
    let builder: InstanceType<typeof Builder>

    beforeEach(function () {
      // @ts-ignore — global helper from mocha-test-helpers.js
      restoreAfter(options, 'filters')
      // @ts-ignore — global helper from mocha-test-helpers.js
      restoreAfter(options, 'bindingProviderInstance')
      builder = new Builder({ filters: {}, provider: new VirtualProvider(), bindings: [ifBindings], options: {} })
    })

    it('merges additional properties onto the returned instance', function () {
      const version = '9.9.9-test'
      const extra = { version, testProp: 'hello' }
      const instance = builder.create(extra)
      assert.equal(instance.version, version)
      assert.equal((instance as any).testProp, 'hello')
    })

    it('returns an object that is also a KnockoutInstance with standard ko properties', function () {
      const instance = builder.create({ myExtension: true })
      // KnockoutInstance includes these standard properties
      assert.isFunction(instance.observable)
      assert.isFunction(instance.computed)
      assert.isFunction(instance.applyBindings)
    })

    it('accepts an empty object and returns a valid instance', function () {
      const instance = builder.create({})
      assert.isFunction(instance.observable)
      assert.isFunction(instance.applyBindings)
    })

    it('merges multiple additional properties from a single object', function () {
      const extra = { propA: 1, propB: 'two', propC: true }
      const instance = builder.create(extra)
      assert.equal((instance as any).propA, 1)
      assert.equal((instance as any).propB, 'two')
      assert.equal((instance as any).propC, true)
    })

    it('additionalProperties take precedence over pre-existing instance properties', function () {
      // The `version` property is intentionally overridable in builds.
      // Passing the same key through additionalProperties should win over whatever
      // the base knockout object provides for that key.
      const version = 'overridden-version'
      const instance = builder.create({ version })
      assert.equal(instance.version, version)
    })

    it('sets options.knockoutInstance to the returned instance', function () {
      const instance = builder.create({ sentinel: 'check-instance' })
      assert.strictEqual(options.knockoutInstance, instance)
    })

    it('preserves the getBindingHandler accessor on the returned instance', function () {
      const instance = builder.create({})
      // getBindingHandler should be a property (accessor) on the instance
      assert.property(instance, 'getBindingHandler')
    })
  })
})
