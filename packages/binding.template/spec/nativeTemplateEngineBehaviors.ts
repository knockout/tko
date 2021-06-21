/* global testNode */
import {
    applyBindings
} from '@tko/bind'

import {
    observable, observableArray
} from '@tko/observable'

import {
  DataBindProvider
} from '@tko/provider.databind'

import {
    options
} from '@tko/utils'

import {
    bindings as templateBindings,
    renderTemplate,
    anonymousTemplate
} from '../dist'
import {
    bindings as coreBindings
} from '@tko/binding.core'

import '@tko/utils/helpers/jasmine-13-helper'

describe('Native template engine', function () {
  function ensureNodeExistsAndIsEmpty (id, tagName, type) {
    var existingNode = document.getElementById(id)
    if (existingNode != null) { existingNode.parentNode.removeChild(existingNode) }
    var resultNode = document.createElement(tagName || 'div')
    resultNode.id = id
    if (type) { resultNode.setAttribute('type', type) }
    document.body.appendChild(resultNode)
    return resultNode
  }

  beforeEach(jasmine.prepareTestNode)

  beforeEach(function () {
    var provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
    provider.bindingHandlers.set(templateBindings)
  })

  describe('Named templates', function () {
    function testRenderTemplate (templateElem, templateElemId, templateElementProp) {
      templateElementProp || (templateElementProp = 'innerHTML')
      templateElem[templateElementProp] = "name: <div data-bind='text: name'></div>"

      renderTemplate(templateElemId, {
        name: 'bert'
      }, null, testNode)
      expect(testNode).toContainHtml('name: <div data-bind="text: name">bert</div>')

            // A second render also works
      renderTemplate(templateElemId, {
        name: 'tom'
      }, null, testNode)
      expect(testNode).toContainHtml('name: <div data-bind="text: name">tom</div>')

            // A change to the element contents is picked up
      templateElem[templateElementProp] = "welcome <div data-bind='text: name'></div>"
      renderTemplate(templateElemId, {
        name: 'dave'
      }, null, testNode)
      expect(testNode).toContainHtml('welcome <div data-bind="text: name">dave</div>')
    }

    it('can display static content from regular DOM element', function () {
      var testDivTemplate = ensureNodeExistsAndIsEmpty('testDivTemplate')
      testDivTemplate.innerHTML = 'this is some static content'
      renderTemplate('testDivTemplate', null, null, testNode)
      expect(testNode).toContainHtml('this is some static content')
    })

    it('can fetch template from regular DOM element and data-bind on results', function () {
      var testDivTemplate = ensureNodeExistsAndIsEmpty('testDivTemplate')
      testRenderTemplate(testDivTemplate, 'testDivTemplate')
    })

    it('can fetch template from <script> elements and data-bind on results', function () {
      var testScriptTemplate = ensureNodeExistsAndIsEmpty('testScriptTemplate', 'script', 'text/html')
      testRenderTemplate(testScriptTemplate, 'testScriptTemplate', 'text')
    })

    it('can fetch template from <textarea> elements and data-bind on results', function () {
      var testTextAreaTemplate = ensureNodeExistsAndIsEmpty('testTextAreaTemplate', 'textarea'),
        prop = 'value'
      testRenderTemplate(testTextAreaTemplate, 'testTextAreaTemplate', prop)
    })

    it('can fetch template from <template> elements and data-bind on results', function () {
      var testTemplateTemplate = ensureNodeExistsAndIsEmpty('testTemplateTemplate', 'template')
      testRenderTemplate(testTemplateTemplate, 'testTemplateTemplate')
    })
  })

  describe('Anonymous templates', function () {
    it('can display static content', function () {
      new anonymousTemplate(testNode).text('this is some static content')
      testNode.innerHTML = 'irrelevant initial content'
      renderTemplate(testNode, null, null, testNode)
      expect(testNode).toContainHtml('this is some static content')
    })

    it('can data-bind on results', function () {
      new anonymousTemplate(testNode).text("name: <div data-bind='text: name'></div>")
      testNode.innerHTML = 'irrelevant initial content'
      renderTemplate(testNode, {
        name: 'bert'
      }, null, testNode)
      expect(testNode).toContainHtml('name: <div data-bind="text: name">bert</div>')
    })

    it('can be supplied by not giving a template name', function () {
      testNode.innerHTML = "<div data-bind='template: { data: someItem }'>Value: <span data-bind='text: val'></span></div>"

      var viewModel = {
        someItem: {
          val: 'abc'
        }
      }
      applyBindings(viewModel, testNode)

      expect(testNode.childNodes[0]).toContainText('Value: abc')
    })

    it('work in conjunction with foreach', function () {
      testNode.innerHTML = "<div data-bind='template: { foreach: myItems }'><b>Item: <span data-bind='text: itemProp'></span></b></div>"
      var myItems = observableArray([{
        itemProp: 'Alpha'
      }, {
        itemProp: 'Beta'
      }, {
        itemProp: 'Gamma'
      }])
      applyBindings({
        myItems: myItems
      }, testNode)

      expect(testNode.childNodes[0].childNodes[0]).toContainText('Item: Alpha')
      expect(testNode.childNodes[0].childNodes[1]).toContainText('Item: Beta')
      expect(testNode.childNodes[0].childNodes[2]).toContainText('Item: Gamma')

            // Can cause re-rendering
      myItems.push({
        itemProp: 'Pushed'
      })
      expect(testNode.childNodes[0].childNodes[0]).toContainText('Item: Alpha')
      expect(testNode.childNodes[0].childNodes[1]).toContainText('Item: Beta')
      expect(testNode.childNodes[0].childNodes[2]).toContainText('Item: Gamma')
      expect(testNode.childNodes[0].childNodes[3]).toContainText('Item: Pushed')

      myItems.splice(1, 1)
      expect(testNode.childNodes[0].childNodes[0]).toContainText('Item: Alpha')
      expect(testNode.childNodes[0].childNodes[1]).toContainText('Item: Gamma')
      expect(testNode.childNodes[0].childNodes[2]).toContainText('Item: Pushed')
    })

    it('may be nested', function () {
      testNode.innerHTML = "<div data-bind='template: { foreach: items }'>" +
                "<div data-bind='template: { foreach: children }'>" +
                "(Val: <span data-bind='text: $data'></span>, Invocations: <span data-bind='text: $root.invocationCount()'></span>, Parents: <span data-bind='text: $parents.length'></span>)" +
                '</div>' +
                '</div>'
      var viewModel = {
        invocations: 0, // Verifying # invocations to be sure we're not rendering anything multiple times and discarding the results
        items: observableArray([{
          children: observableArray(['A1', 'A2', 'A3'])
        }, {
          children: observableArray(['B1', 'B2'])
        }])
      }
      viewModel.invocationCount = function () {
        return ++this.invocations
      }.bind(viewModel)
      applyBindings(viewModel, testNode)

      expect(testNode.childNodes[0].childNodes[0]).toContainText('(Val: A1, Invocations: 1, Parents: 2)(Val: A2, Invocations: 2, Parents: 2)(Val: A3, Invocations: 3, Parents: 2)')
      expect(testNode.childNodes[0].childNodes[1]).toContainText('(Val: B1, Invocations: 4, Parents: 2)(Val: B2, Invocations: 5, Parents: 2)')

            // Check we can insert without causing anything else to rerender
      viewModel.items()[1].children.unshift('ANew')
      expect(testNode.childNodes[0].childNodes[0]).toContainText('(Val: A1, Invocations: 1, Parents: 2)(Val: A2, Invocations: 2, Parents: 2)(Val: A3, Invocations: 3, Parents: 2)')
      expect(testNode.childNodes[0].childNodes[1]).toContainText('(Val: ANew, Invocations: 6, Parents: 2)(Val: B1, Invocations: 4, Parents: 2)(Val: B2, Invocations: 5, Parents: 2)')
    })

    it('re-renders nested templates', function () {
      var node = document.createElement('div')
      let inner = 0
      let outer = 0
      node.innerHTML = `
              <div data-bind='template: { data: x }'>
                <i data-bind='incrementInner'></i>
                <div data-bind='template: { data: $parent.y }'>
                  <i data-bind='incrementOuter'></i>
                </div>
              </div>
            `
      options.bindingProviderInstance.bindingHandlers.set('incrementOuter', () => outer++)
      options.bindingProviderInstance.bindingHandlers.set('incrementInner', () => inner++)
      const x = observable()
      const y = observable()
      applyBindings({ x, y }, node)
      expect(inner).toEqual(1)
      expect(outer).toEqual(1)
      x('a')
      expect(inner).toEqual(2)
      expect(outer).toEqual(2)
      y('a')
      expect(inner).toEqual(2)
      expect(outer).toEqual(3)
    })

    it('with no content should be rejected', function () {
      window.testDivTemplate.innerHTML = "<div data-bind='template: { data: someItem }'></div>"

      var viewModel = {
        someItem: { val: 'abc' }
      }
      expect(function () {
        applyBindings(viewModel, window.testDivTemplate)
      }).toThrowContaining('no template content')
    })
  })

  describe('Data-bind syntax', function () {
    it('should expose parent binding context as $parent if binding with an explicit \"data\" value', function () {
      testNode.innerHTML = "<div data-bind='template: { data: someItem }'>" +
                "ValueBound: <span data-bind='text: $parent.parentProp'></span>" +
                '</div>'
      applyBindings({
        someItem: {},
        parentProp: 'Hello'
      }, testNode)
      expect(testNode.childNodes[0]).toContainText('ValueBound: Hello')
    })

    it('should expose all ancestor binding contexts as $parents, with top frame also given as $root', function () {
      testNode.innerHTML = "<div data-bind='template: { data: outerItem }'>" +
                "<div data-bind='template: { data: middleItem }'>" +
                "<div data-bind='template: { data: innerItem }'>(" +
                "data: <span data-bind='text: $data.val'></span>, " +
                "parent: <span data-bind='text: $parent.val'></span>, " +
                "parents[0]: <span data-bind='text: $parents[0].val'></span>, " +
                "parents[1]: <span data-bind='text: $parents[1].val'></span>, " +
                "parents.length: <span data-bind='text: $parents.length'></span>, " +
                "root: <span data-bind='text: $root.val'></span>" +
                ')</div>' +
                '</div>' +
                '</div>'

      applyBindings({
        val: 'ROOT',
        outerItem: {
          val: 'OUTER',
          middleItem: {
            val: 'MIDDLE',
            innerItem: {
              val: 'INNER'
            }
          }
        }
      }, testNode)
      expect(testNode.childNodes[0].childNodes[0].childNodes[0]).toContainText('(data: INNER, parent: MIDDLE, parents[0]: MIDDLE, parents[1]: OUTER, parents.length: 3, root: ROOT)')
    })
  })
})
