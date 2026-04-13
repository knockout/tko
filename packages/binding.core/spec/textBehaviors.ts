import { observable } from '@tko/observable'
import { expect } from 'chai'

import { applyBindings } from '@tko/bind'

import { DataBindProvider } from '@tko/provider.databind'
import { VirtualProvider } from '@tko/provider.virtual'
import { MultiProvider } from '@tko/provider.multi'

import { options } from '@tko/utils'

import * as coreBindings from '../dist'

import { Provider } from '@tko/provider'
import {
  expectContainHtml,
  expectContainText,
  prepareTestNode,
  restoreAfter
} from '../../utils/helpers/mocha-test-helpers'

describe('Binding: Text', function () {
  let bindingHandlers
  let cleanups: Array<() => void>

  let testNode: HTMLElement
  beforeEach(function () {
    cleanups = []
    testNode = prepareTestNode()
  })

  beforeEach(function () {
    const provider = new MultiProvider({ providers: [new DataBindProvider(), new VirtualProvider()] })
    options.bindingProviderInstance = provider
    bindingHandlers = provider.bindingHandlers
    bindingHandlers.set(coreBindings.bindings)
  })

  afterEach(function () {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }
  })

  it('Should assign the value to the node, HTML-encoding the value', function () {
    const model = { textProp: '\'Val <with> "special" <i>characters</i>\'' }
    testNode.innerHTML = "<span data-bind='text:textProp'></span>"
    applyBindings(model, testNode)
    expect(testNode.childNodes[0].textContent || (testNode.childNodes[0] as HTMLElement).innerText).to.equal(
      model.textProp
    )
  })

  it('Should assign an empty string as value if the model value is null', function () {
    testNode.innerHTML = "<span data-bind='text:(null)' ></span>"
    applyBindings(null, testNode)
    const actualText =
      'textContent' in testNode.childNodes[0]
        ? testNode.childNodes[0].textContent
        : (testNode.childNodes[0] as HTMLElement).innerText
    expect(actualText).to.equal('')
  })

  it('Should assign an empty string as value if the model value is undefined', function () {
    testNode.innerHTML = "<span data-bind='text:undefined' ></span>"
    applyBindings(null, testNode)
    const actualText =
      'textContent' in testNode.childNodes[0]
        ? testNode.childNodes[0].textContent
        : (testNode.childNodes[0] as HTMLElement).innerText
    expect(actualText).to.equal('')
  })

  it('Should work with virtual elements, adding a text node between the comments', function () {
    const myObservable = observable('Some text')
    testNode.innerHTML = 'xxx <!-- ko text: textProp --><!-- /ko -->'
    applyBindings({ textProp: myObservable }, testNode)
    expectContainText(testNode, 'xxx Some text')
    expectContainHtml(testNode, 'xxx <!-- ko text: textprop -->some text<!-- /ko -->')

    // update observable; should update text
    myObservable('New text')
    expectContainText(testNode, 'xxx New text')
    expectContainHtml(testNode, 'xxx <!-- ko text: textprop -->new text<!-- /ko -->')

    // clear observable; should remove text
    myObservable(undefined)
    expectContainText(testNode, 'xxx ')
    expectContainHtml(testNode, 'xxx <!-- ko text: textprop --><!-- /ko -->')
  })

  it('Should work with virtual elements, removing any existing stuff between the comments', function () {
    testNode.innerHTML =
      "xxx <!--ko text: undefined-->some random thing<span> that won't be here later</span><!--/ko-->"
    applyBindings(null, testNode)
    expectContainText(testNode, 'xxx ')
    expectContainHtml(testNode, 'xxx <!--ko text: undefined--><!--/ko-->')
  })
  // TODO: NEED HELP
  it('Should not attempt data binding on the generated text node', function () {
    restoreAfter(cleanups, options, 'bindingProviderInstance')

    // Since custom binding providers can regard text nodes as bindable, it would be a
    // security risk to bind against user-supplied text (XSS).

    // First replace the binding provider with one that's hardcoded to replace all text
    // content with a special message, via a binding handler that operates on text nodes
    const originalBindingProvider = options.bindingProviderInstance

    class TestProvider extends Provider {
      override get FOR_NODE_TYPES() {
        return [Node.ELEMENT_NODE]
      }
      override nodeHasBindings(/* node, bindingContext */) {
        return true
      }
      override getBindingAccessors(node, bindingContext) {
        const bindings = originalBindingProvider.getBindingAccessors(node, bindingContext)
        if (node.nodeType === Node.TEXT_NODE) {
          return {
            replaceTextNodeContent: function () {
              return 'should not see this value in the output'
            }
          }
        } else {
          return bindings
        }
      }
    }

    bindingHandlers.replaceTextNodeContent = {
      update: function (textNode, valueAccessor) {
        textNode.data = valueAccessor()
      }
    }

    const tp = new TestProvider()
    tp.bindingHandlers = originalBindingProvider.bindingHandlers
    options.bindingProviderInstance = tp

    // Now check that, after applying the "text" binding, the emitted text node does *not*
    // get replaced by the special message.
    testNode.innerHTML = "<span data-bind='text: sometext'></span>"
    applyBindings({ sometext: 'hello' }, testNode)
    expect('textContent' in testNode ? testNode.textContent : (testNode as HTMLElement).innerText).to.equal('hello')
  })
})
