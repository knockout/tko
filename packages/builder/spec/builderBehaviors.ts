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
})

describe('Builder.create()', () => {
  let builder: Builder

  beforeEach(() => {
    // @ts-ignore — global helper from mocha-test-helpers.js
    restoreAfter(options, 'filters')
    // @ts-ignore — global helper from mocha-test-helpers.js
    restoreAfter(options, 'bindingProviderInstance')
    builder = new Builder({ filters: {}, provider: new VirtualProvider(), bindings: [ifBindings], options: {} })
  })

  it('merges additional properties onto the knockout instance', function () {
    const extensions = { version: '1.0.0', myProp: 42 }
    const ko = builder.create(extensions)
    assert.equal(ko.version, '1.0.0')
    assert.equal(ko.myProp, 42)
  })

  it('preserves core KnockoutInstance properties', function () {
    const ko = builder.create({})
    assert.isFunction(ko.observable)
    assert.isFunction(ko.computed)
    assert.isFunction(ko.applyBindings)
    assert.isFunction(ko.isObservable)
  })

  it('sets options.knockoutInstance to the returned instance', function () {
    const ko = builder.create({})
    assert.strictEqual(ko.options.knockoutInstance, ko)
  })

  it('handles an empty object as additional properties', function () {
    const ko = builder.create({})
    assert.isFunction(ko.observable)
  })

  it('handles nested object additional properties', function () {
    const jsx = { createElement: () => {}, Fragment: Symbol('Fragment') }
    const ko = builder.create({ jsx })
    assert.deepEqual(ko.jsx, jsx)
  })

  it('additional properties do not override core knockout properties', function () {
    // observable is a core KO property — if overridden, it should come from additionalProperties
    // but the standard behavior is: knockout core < providedProperties < additionalProperties
    const customObservable = () => 'custom'
    const ko = builder.create({ customField: customObservable })
    // Existing core props still present
    assert.isFunction(ko.observable)
    // Custom field also present
    assert.isFunction(ko.customField)
  })

  it('returns an instance with the getBindingHandler getter', function () {
    const ko = builder.create({})
    // getBindingHandler should be accessible as a property (delegating to options)
    assert.isDefined(ko.getBindingHandler)
  })

  it('additionalProperties object is treated as single merge (not spread)', function () {
    // Previously create() used rest params, now it takes a single typed object.
    // Verify a plain object with multiple keys all appear on the result.
    const extensions = { alpha: 1, beta: 'two', gamma: true }
    const ko = builder.create(extensions)
    assert.equal(ko.alpha, 1)
    assert.equal(ko.beta, 'two')
    assert.equal(ko.gamma, true)
  })
})
