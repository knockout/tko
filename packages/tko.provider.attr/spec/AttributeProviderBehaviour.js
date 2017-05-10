
import {
  AttributeProvider
} from '../index'

describe("Attribute Provider Behaviour", function () {
  describe('nodeHasBindings', function () {
    it("is false if there is no ko-{binding} attribute", function () {
      const provider = new AttributeProvider()
      const div = document.createElement('div')
      assert.notOk(provider.nodeHasBindings(div))
    })

    it("is true if there is a ko-{*} attribute", function () {
      const provider = new AttributeProvider()
      const div = document.createElement('div')
      div.setAttribute('ko-text', '')
      assert.ok(provider.nodeHasBindings(div))
    })
  })

  describe('getBindingAccessors', function () {
    it("reads an attribute-value", function() {
      const provider = new AttributeProvider()
      const div = document.createElement('div')
      div.setAttribute('ko-text', 'a')
      const bindings = provider.getBindingAccessors(div, {a: 123})
      assert.deepEqual(Object.keys(bindings), ['text'])
      assert.equal(bindings.text(), '123')
    })
  })

})
