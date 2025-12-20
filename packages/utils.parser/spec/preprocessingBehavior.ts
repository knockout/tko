import {
  DataBindProvider
} from '@tko/provider.databind'

import { expect } from 'chai'

describe('Binding preprocessing', function () {
  let bindingHandlers,
    preProcessBindings

  beforeEach(function () {
    let provider = new DataBindProvider()
    bindingHandlers = provider.bindingHandlers
    preProcessBindings = provider.preProcessBindings.bind(provider)
  })

  it('Should allow binding to modify value through "preprocess" method', function () {
    delete bindingHandlers.a
    // create binding that has a default value of false
    bindingHandlers.b = {
      preprocess: function (value) {
        return value || 'false'
      }
    }
    let rewritten = preProcessBindings('a: 1, b')
    let parsedRewritten = eval('({' + rewritten + '})')
    expect(parsedRewritten.a).to.equal(1)
    expect(parsedRewritten.b).to.equal(false)
  })

  it('Should allow binding to add/replace bindings through "preprocess" method\'s "addBinding" callback', function () {
    bindingHandlers.a = {
      preprocess: function (value, key, addBinding) {
        // the a binding will be copied to a2
        addBinding(key + '2', value)
        return value
      }
    }
    bindingHandlers.b = {
      preprocess: function (value, key, addBinding) {
        // the b binding will be replaced by b2
        addBinding(key + '2', value)
      }
    }
    let rewritten = preProcessBindings('a: 1, b: 2')
    let parsedRewritten = eval('({' + rewritten + '})')

    expect(parsedRewritten.a).to.equal(1)
    expect(parsedRewritten.a2).to.equal(1)

    expect(parsedRewritten.b).to.equal(undefined)
    expect(parsedRewritten.b2).to.equal(2)
  })

  it('Should be able to chain "preprocess" calls when one adds a binding for another', function () {
    bindingHandlers.a = {
      preprocess: function (value, key, addBinding) {
        // replace with b
        addBinding('b', value)
      }
    }
    bindingHandlers.b = {
      preprocess: function (value /*, key,  addBinding */) {
        // adds 1 to value
        return '' + (+value + 1)
      }
    }
    let rewritten = preProcessBindings('a: 2')
    let parsedRewritten = eval('({' + rewritten + '})')
    expect(parsedRewritten.a).to.equal(undefined)
    expect(parsedRewritten.b).to.equal(3)
  })

  // FIXME -- stub getBindingHandler
  it('Should be able to get a dynamically created binding handler during preprocessing', function () {
    Object.defineProperty(bindingHandlers, 'get', {
      value: function (/* bindingKey */) {
        return {
          preprocess: function (value) {
            return value + '2'
          }
        }
      }
    })
    let rewritten = preProcessBindings('a: 1')
    let parsedRewritten = eval('({' + rewritten + '})')
    expect(parsedRewritten.a).to.equal(12)
  })
})
