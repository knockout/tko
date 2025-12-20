import { BindingStringProvider } from '../src'

import { assert } from 'chai'

describe('Binding String Provider behavior', function () {
  describe('getBindingAccessors', function () {
    it('parses the given string', function () {
      class TestBSP extends BindingStringProvider {
        get FOR_NODE_TYPES() {
          return [document.ELEMENT_NODE]
        }
        getBindingString() {
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
})
