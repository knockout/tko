import { observable } from '@tko/observable'

import { applyBindings } from '@tko/bind'

import { DataBindProvider } from '@tko/provider.databind'
import { VirtualProvider } from '@tko/provider.virtual'
import { MultiProvider } from '@tko/provider.multi'

import { options } from '@tko/utils'

import * as coreBindings from '../dist'

import '@tko/utils/helpers/jasmine-13-helper'
import { Provider } from '@tko/provider'

describe('Binding: Text', function () {
  let bindingHandlers

  let testNode: HTMLElement
  beforeEach(function () {
    testNode = jasmine.prepareTestNode()
  })

  beforeEach(function () {
    let provider = new MultiProvider({ providers: [new DataBindProvider(), new VirtualProvider()] })
    options.bindingProviderInstance = provider
    bindingHandlers = provider.bindingHandlers
    bindingHandlers.set(coreBindings.bindings)
  })

  it('Should assign the value to the node, HTML-encoding the value', function () {
    let model = { textProp: '\'Val <with> "special" <i>characters</i>\'' }
    testNode.innerHTML = "<span data-bind='text:textProp'></span>"
    applyBindings(model, testNode)
    expect(testNode.childNodes[0].textContent || (testNode.childNodes[0] as HTMLElement).innerText).toEqual(
      model.textProp
    )
  })

  it('Should assign an empty string as value if the model value is null', function () {
    testNode.innerHTML = "<span data-bind='text:(null)' ></span>"
    applyBindings(null, testNode)
    let actualText =
      'textContent' in testNode.childNodes[0]
        ? testNode.childNodes[0].textContent
        : (testNode.childNodes[0] as HTMLElement).innerText
    expect(actualText).toEqual('')
  })

  it('Should assign an empty string as value if the model value is undefined', function () {
    testNode.innerHTML = "<span data-bind='text:undefined' ></span>"
    applyBindings(null, testNode)
    let actualText =
      'textContent' in testNode.childNodes[0]
        ? testNode.childNodes[0].textContent
        : (testNode.childNodes[0] as HTMLElement).innerText
    expect(actualText).toEqual('')
  })

  it('Should work with virtual elements, adding a text node between the comments', function () {
    let myObservable = observable('Some text')
    testNode.innerHTML = 'xxx <!-- ko text: textProp --><!-- /ko -->'
    applyBindings({ textProp: myObservable }, testNode)
    expect(testNode).toContainText('xxx Some text')
    expect(testNode).toContainHtml('xxx <!-- ko text: textprop -->some text<!-- /ko -->')

    // update observable; should update text
    myObservable('New text')
    expect(testNode).toContainText('xxx New text')
    expect(testNode).toContainHtml('xxx <!-- ko text: textprop -->new text<!-- /ko -->')

    // clear observable; should remove text
    myObservable(undefined)
    expect(testNode).toContainText('xxx ')
    expect(testNode).toContainHtml('xxx <!-- ko text: textprop --><!-- /ko -->')
  })

  it('Should work with virtual elements, removing any existing stuff between the comments', function () {
    testNode.innerHTML =
      "xxx <!--ko text: undefined-->some random thing<span> that won't be here later</span><!--/ko-->"
    applyBindings(null, testNode)
    expect(testNode).toContainText('xxx ')
    expect(testNode).toContainHtml('xxx <!--ko text: undefined--><!--/ko-->')
  })
  // TODO: NEED HELP
  it('Should not attempt data binding on the generated text node', function () {
    this.restoreAfter(options, 'bindingProviderInstance')

    // Since custom binding providers can regard text nodes as bindable, it would be a
    // security risk to bind against user-supplied text (XSS).

    // First replace the binding provider with one that's hardcoded to replace all text
    // content with a special message, via a binding handler that operates on text nodes
    let originalBindingProvider = options.bindingProviderInstance

    class TestProvider extends Provider {
      override get FOR_NODE_TYPES() {
        return [document.ELEMENT_NODE]
      }
      override nodeHasBindings(/* node, bindingContext */) {
        /* // IE < 9 can't bind text nodes, as expando properties are not allowed on them.
                // This will still prove that the binding provider was not executed on the children of a restricted element.
                if (node.nodeType === Node.TEXT_NODE && jasmine.ieVersion < 9) {
                    node.data = "replaced";
                    return false;
                } */

        return true
      }
      override getBindingAccessors(node, bindingContext) {
        let bindings = originalBindingProvider.getBindingAccessors(node, bindingContext)
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

    let tp = new TestProvider()
    tp.bindingHandlers = originalBindingProvider.bindingHandlers
    options.bindingProviderInstance = tp

    // Now check that, after applying the "text" binding, the emitted text node does *not*
    // get replaced by the special message.
    testNode.innerHTML = "<span data-bind='text: sometext'></span>"
    applyBindings({ sometext: 'hello' }, testNode)
    expect('textContent' in testNode ? testNode.textContent : (testNode as HTMLElement).innerText).toEqual('hello')
  })
})
