import { DataBindProvider } from '@tko/provider.databind'
import { BindingStringProvider } from '../src'

import { assert } from 'chai'

describe('Binding String Provider behavior', function () {
  describe('getBindingAccessors', function () {
    it('parses the given string', function () {
      class TestBSP extends BindingStringProvider {
        override get FOR_NODE_TYPES() {
          return [Node.ELEMENT_NODE]
        }
        override getBindingString() {
          return 'text: 123'
        }
      }
      const p = new TestBSP()
      const div = document.createElement('div')
      const bindings = p.getBindingAccessors(div, {})
      assert.deepEqual(Object.keys(bindings), ['text'])
      assert.equal(bindings.text(), 123)
    })
  })

  describe('Preprocessing', function () {
    it('Should allow binding to modify value through "preprocess" method', function () {
      const provider = new DataBindProvider()
      const bindingHandlers: any = provider.bindingHandlers
      const preProcessBindings = provider.preProcessBindings.bind(provider)

      bindingHandlers.b = {
        preprocess: function (value) {
          return value || 'false'
        }
      }
      let rewritten = preProcessBindings('a: 1, b')
      assert.equal(rewritten, "'a':1,'b':false")

      rewritten = preProcessBindings('a: 2, b: true')
      assert.equal(rewritten, "'a':2,'b':true")
    })
  })
})
