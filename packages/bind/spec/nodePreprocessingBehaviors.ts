import { options } from '@tko/utils'

import { observable } from '@tko/observable'

import { MultiProvider } from '@tko/provider.multi'
import { VirtualProvider } from '@tko/provider.virtual'
import { DataBindProvider } from '@tko/provider.databind'

import { bindings as coreBindings } from '@tko/binding.core'

import { applyBindings } from '../dist'

import '@tko/utils/helpers/jasmine-13-helper'

describe('Node preprocessing', function () {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = jasmine.prepareTestNode()
  })

  beforeEach(function () {
    options.bindingProviderInstance = new DataBindProvider()
    options.bindingProviderInstance.bindingHandlers.set(coreBindings)
  })

  it('Can leave the nodes unchanged by returning a falsy value', function () {
    options.bindingProviderInstance.preprocessNode = function (/* node */) {
      return null
    }
    testNode.innerHTML = "<p data-bind='text: someValue'></p>"
    applyBindings({ someValue: 'hello' }, testNode)
    expect(testNode).toContainText('hello')
  })

  it('Can replace a node with some other node', function () {
    options.bindingProviderInstance.preprocessNode = function (node) {
      // Example: replace <mySpecialNode /> with <span data-bind='text: someValue'></span>
      // This technique could be the basis for implementing custom element types that render templates
      if (node instanceof Element && node.tagName && node.tagName.toLowerCase() === 'myspecialnode') {
        const newNode = document.createElement('span')
        newNode.setAttribute('data-bind', 'text: someValue')
        expect(node.parentNode).not.toBe(null)
        node.parentNode?.insertBefore(newNode, node)
        node.parentNode?.removeChild(node)
        return [newNode]
      }
      return null
    }
    testNode.innerHTML = '<span>a</span><mySpecialNode></mySpecialNode><span>b</span>'
    const someValue = observable('hello')
    applyBindings({ someValue: someValue }, testNode)
    expect(testNode).toContainText('ahellob')

    // Check that updating the observable has the expected effect
    someValue('goodbye')
    expect(testNode).toContainText('agoodbyeb')
  })

  it('Can replace a node with multiple new nodes', function () {
    class TestProvider extends DataBindProvider {
      override preprocessNode(node) {
        // Example: Replace {{ someValue }} with text from that property.
        // This could be generalized to full support for string interpolation in text nodes.
        if (node.nodeType === Node.TEXT_NODE && node.data.indexOf('{{ someValue }}') >= 0) {
          const prefix = node.data.substring(0, node.data.indexOf('{{ someValue }}')),
            suffix = node.data.substring(node.data.indexOf('{{ someValue }}') + '{{ someValue }}'.length),
            newNodes = [
              document.createTextNode(prefix),
              document.createComment('ko text: someValue'),
              document.createComment('/ko'),
              document.createTextNode(suffix)
            ]
          // Manually reimplement ko.utils.replaceDomNodes, since it's not available in minified build
          for (let i = 0; i < newNodes.length; i++) {
            node.parentNode.insertBefore(newNodes[i], node)
          }
          node.parentNode.removeChild(node)
          return newNodes
        }
        return null
      }
    }
    options.bindingProviderInstance = new TestProvider()
    options.bindingProviderInstance.bindingHandlers.set(coreBindings)

    testNode.innerHTML = "the value is <span data-bind='text: someValue'></span>."
    const someValue = observable('hello')
    applyBindings({ someValue: someValue }, testNode)
    expect(testNode).toContainText('the value is hello.')

    // Check that updating the observable has the expected effect
    someValue('goodbye')
    expect(testNode).toContainText('the value is goodbye.')
  })

  it('Should call a childrenComplete callback, passing all of the rendered nodes, accounting for node preprocessing and virtual element bindings', function () {
    class TestProvider extends MultiProvider {
      override preprocessNode(node) {
        if (node.nodeType === Node.TEXT_NODE && node.data.charAt(0) === '$') {
          const newNodes = [document.createComment('ko text: ' + node.data), document.createComment('/ko')]
          for (let i = 0; i < newNodes.length; i++) {
            node.parentNode.insertBefore(newNodes[i], node)
          }
          node.parentNode.removeChild(node)
          return newNodes
        }
        return null
      }
    }
    const testProvider = new TestProvider()
    testProvider.bindingHandlers.set(coreBindings)
    testProvider.addProvider(new DataBindProvider())
    testProvider.addProvider(new VirtualProvider())

    options.bindingProviderInstance = testProvider

    // Now perform bindings, and see that childrenComplete gets the output from the preprocessor and bindings
    let callbacks = 0,
      vm = {
        childprop: 'child property',
        callback: function (nodes, data) {
          expect(nodes.length).toBe(5)
          expect(nodes[0]).toContainText('[') // <span>[</span>
          expect(nodes[1].nodeType).toBe(8) // <!-- ko text: $data.childprop -->
          expect(nodes[2].nodeType).toBe(3) // text node inserted by text binding
          expect(nodes[3].nodeType).toBe(8) // <!-- /ko -->
          expect(nodes[4]).toContainText(']') // <span>]</span>
          expect(data).toBe(vm)
          callbacks++
        }
      }

    testNode.innerHTML = "<div data-bind='childrenComplete: callback'><span>[</span>$data.childprop<span>]</span></div>"
    applyBindings(vm, testNode)
    expect(testNode.childNodes[0]).toContainText('[child property]')
    expect(callbacks).toBe(1)
  })
})
