/* global testNode */
import {
    triggerEvent, options, arrayForEach
} from '@tko/utils'

import {
    applyBindings, contextFor, dataFor
} from '@tko/bind'

import {
    observable, observableArray
} from '@tko/observable'

import { DataBindProvider } from '@tko/provider.databind'
import { MultiProvider } from '@tko/provider.multi'
import { VirtualProvider } from '@tko/provider.virtual'

import {bindings as withBindings} from '../dist'
import {bindings as coreBindings} from '@tko/binding.core'
import {bindings as templateBindings} from '@tko/binding.template'

import '@tko/utils/helpers/jasmine-13-helper.js'

describe('Binding: With', function () {
  beforeEach(jasmine.prepareTestNode)

  beforeEach(function () {
    var provider = new MultiProvider({
      providers: [new DataBindProvider(), new VirtualProvider()]
    })
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
    provider.bindingHandlers.set(withBindings)
    provider.bindingHandlers.set(templateBindings)
  })

  it('Should remove descendant nodes from the document (and not bind them) if the value is falsy', function () {
    testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: someItem.nonExistentChildProp'></span></div>"
    expect(testNode.childNodes[0].childNodes.length).toEqual(1)
    applyBindings({ someItem: null }, testNode)
    expect(testNode.childNodes[0].childNodes.length).toEqual(0)
  })

  it('Should leave descendant nodes in the document (and bind them in the context of the supplied value) if the value is truthy', function () {
    testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: existentChildProp'></span></div>"
    expect(testNode.childNodes.length).toEqual(1)
    applyBindings({ someItem: { existentChildProp: 'Child prop value' } }, testNode)
    expect(testNode.childNodes[0].childNodes.length).toEqual(1)
    expect(testNode.childNodes[0].childNodes[0]).toContainText('Child prop value')
  })

  it('Should leave descendant nodes unchanged if the value is truthy', function () {
    var someItem = observable({ childProp: 'child prop value' })
    testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: childProp'></span></div>"
    var originalNode = testNode.childNodes[0].childNodes[0]

        // Value is initially true, so nodes are retained
    applyBindings({ someItem: someItem }, testNode)
    expect(testNode.childNodes[0].childNodes[0]).toContainText('child prop value')
    expect(testNode.childNodes[0].childNodes[0]).toEqual(originalNode)
  })

  it('Should toggle the presence and bindedness of descendant nodes according to the truthiness of the value, performing binding in the context of the value', function () {
    var someItem = observable(undefined)
    testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: occasionallyExistentChildProp'></span></div>"
    applyBindings({ someItem: someItem }, testNode)

        // First it's not there
    expect(testNode.childNodes[0].childNodes.length).toEqual(0)

        // Then it's there
    someItem({ occasionallyExistentChildProp: 'Child prop value' })
    expect(testNode.childNodes[0].childNodes.length).toEqual(1)
    expect(testNode.childNodes[0].childNodes[0]).toContainText('Child prop value')

        // Then it's gone again
    someItem(null)
    expect(testNode.childNodes[0].childNodes.length).toEqual(0)
  })

  it('Should reconstruct and bind descendants when the data item notifies about mutation', function () {
    var someItem = observable({ childProp: 'Hello' })

    testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: childProp'></span></div>"
    applyBindings({ someItem: someItem }, testNode)
    expect(testNode.childNodes[0].childNodes[0]).toContainText('Hello')

        // Force "update" binding handler to fire, then check the DOM changed
    someItem().childProp = 'Goodbye'
    someItem.valueHasMutated()
    expect(testNode.childNodes[0].childNodes[0]).toContainText('Goodbye')
  })

  it('Should not bind the same elements more than once even if the supplied value notifies a change', function () {
    var countedClicks = 0
    var someItem = observable({
      childProp: observable('Hello'),
      handleClick: function () { countedClicks++ }
    })

    testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: childProp, click: handleClick'></span></div>"
    applyBindings({ someItem: someItem }, testNode)

        // Initial state is one subscriber, one click handler
    expect(testNode.childNodes[0].childNodes[0]).toContainText('Hello')
    expect(someItem().childProp.getSubscriptionsCount()).toEqual(1)
    triggerEvent(testNode.childNodes[0].childNodes[0], 'click')
    expect(countedClicks).toEqual(1)

        // Force "update" binding handler to fire, then check we still have one subscriber...
    someItem.valueHasMutated()
    expect(someItem().childProp.getSubscriptionsCount()).toEqual(1)

        // ... and one click handler
    countedClicks = 0
    triggerEvent(testNode.childNodes[0].childNodes[0], 'click')
    expect(countedClicks).toEqual(1)
  })

  it('Should be able to access parent binding context via $parent', function () {
    testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: $parent.parentProp'></span></div>"
    applyBindings({ someItem: { }, parentProp: 'Parent prop value' }, testNode)
    expect(testNode.childNodes[0].childNodes[0]).toContainText('Parent prop value')
  })

  it('Should be able to access all parent binding contexts via $parents, and root context via $root', function () {
    testNode.innerHTML = "<div data-bind='with: topItem'>" +
                                "<div data-bind='with: middleItem'>" +
                                    "<div data-bind='with: bottomItem'>" +
                                        "<span data-bind='text: name'></span>" +
                                        "<span data-bind='text: $parent.name'></span>" +
                                        "<span data-bind='text: $parents[1].name'></span>" +
                                        "<span data-bind='text: $parents[2].name'></span>" +
                                        "<span data-bind='text: $root.name'></span>" +
                                    '</div>' +
                                '</div>' +
                              '</div>'
    applyBindings({
      name: 'outer',
      topItem: {
        name: 'top',
        middleItem: {
          name: 'middle',
          bottomItem: {
            name: 'bottom'
          }
        }
      }
    }, testNode)
    var finalContainer = testNode.childNodes[0].childNodes[0].childNodes[0]
    expect(finalContainer.childNodes[0]).toContainText('bottom')
    expect(finalContainer.childNodes[1]).toContainText('middle')
    expect(finalContainer.childNodes[2]).toContainText('top')
    expect(finalContainer.childNodes[3]).toContainText('outer')
    expect(finalContainer.childNodes[4]).toContainText('outer')

        // Also check that, when we later retrieve the binding contexts, we get consistent results
    expect(contextFor(testNode).$data.name).toEqual('outer')
    expect(contextFor(testNode.childNodes[0]).$data.name).toEqual('outer')
    expect(contextFor(testNode.childNodes[0].childNodes[0]).$data.name).toEqual('top')
    expect(contextFor(testNode.childNodes[0].childNodes[0].childNodes[0]).$data.name).toEqual('middle')
    expect(contextFor(testNode.childNodes[0].childNodes[0].childNodes[0].childNodes[0]).$data.name).toEqual('bottom')
    var firstSpan = testNode.childNodes[0].childNodes[0].childNodes[0].childNodes[0]
    expect(firstSpan.tagName).toEqual('SPAN')
    expect(contextFor(firstSpan).$data.name).toEqual('bottom')
    expect(contextFor(firstSpan).$root.name).toEqual('outer')
    expect(contextFor(firstSpan).$parents[1].name).toEqual('top')
  })

  it('Should be able to access all parent bindings when using "as"', async function () {
    testNode.innerHTML = `<div data-bind='with: topItem'>
        <div data-bind="with: middleItem, as: 'middle'">
            <div data-bind='with: middle.bottomItem'>
                <span data-bind='text: name'></span>
                <span data-bind='text: $parent.name'></span>
                <span data-bind='text: middle.name'></span>
                <span data-bind='text: $parents[1].name'></span>
                <span data-bind='text: $root.name'></span>
            </div>
        </div>
      </div>`
    applyBindings({
      name: 'outer',
      topItem: {
        name: 'top',
        middleItem: {
          name: 'middle',
          bottomItem: {
            name: 'bottom'
          }
        }
      }
    }, testNode)
    const finalContainer = testNode.childNodes[0].children[0].children[0]
    // This differs from ko 3.x in that `with` does not create a child context
    // when using `as`.
    const [name, parentName, middleName, parent1Name, rootName] = finalContainer.children
    expect(name).toContainText('bottom')
    expect(parentName).toContainText('top')
    expect(middleName).toContainText('middle')
    expect(parent1Name).toContainText('outer')
    expect(rootName).toContainText('outer')
    expect(contextFor(name).parents.length).toEqual(2)
  })

  it('Should not create a child context', function () {
    testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\"'><span data-bind='text: item.childProp'></span></div>"
    var someItem = { childProp: 'Hello' }
    applyBindings({ someItem: someItem }, testNode)

    expect(testNode.childNodes[0].childNodes[0]).toContainText('Hello')
    expect(dataFor(testNode.childNodes[0].childNodes[0])).toEqual(dataFor(testNode))
  })

  it('Should provide access to observable value', function () {
    testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\"'><input data-bind='value: item'/></div>"
    var someItem = observable('Hello')
    applyBindings({ someItem: someItem }, testNode)
    expect(testNode.childNodes[0].childNodes[0].value).toEqual('Hello')

    expect(dataFor(testNode.childNodes[0].childNodes[0])).toEqual(dataFor(testNode))

      // Should update observable when input is changed
    testNode.childNodes[0].childNodes[0].value = 'Goodbye'
    triggerEvent(testNode.childNodes[0].childNodes[0], 'change')
    expect(someItem()).toEqual('Goodbye')

      // Should update the input when the observable changes
    someItem('Hello again')
    expect(testNode.childNodes[0].childNodes[0].value).toEqual('Hello again')
  })

  it('Should not re-render the nodes when an observable value changes', function () {
    testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\"'><span data-bind='text: item'></span></div>"
    var someItem = observable('first')
    applyBindings({ someItem }, testNode)
    expect(testNode.childNodes[0]).toContainText('first')

    var saveNode = testNode.childNodes[0].childNodes[0]
    someItem('second')
    expect(testNode.childNodes[0]).toContainText('second')
    expect(testNode.childNodes[0].childNodes[0]).toEqual(saveNode)
  })

  it('Should remove nodes with an observable value become falsy', function () {
    var someItem = observable(undefined)
    testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\"'><span data-bind='text: item().occasionallyExistentChildProp'></span></div>"
    applyBindings({ someItem: someItem }, testNode)

      // First it's not there
    expect(testNode.childNodes[0].childNodes.length).toEqual(0)

      // Then it's there
    someItem({ occasionallyExistentChildProp: 'Child prop value' })
    expect(testNode.childNodes[0].childNodes.length).toEqual(1)
    expect(testNode.childNodes[0].childNodes[0]).toContainText('Child prop value')

      // Then it's gone again
    someItem(null)
    expect(testNode.childNodes[0].childNodes.length).toEqual(0)
  })

  it('Should be able to define an "with" region using a containerless template', function () {
    var someitem = observable(undefined)
    testNode.innerHTML = 'hello <!-- ko with: someitem --><span data-bind="text: occasionallyexistentchildprop"></span><!-- /ko --> goodbye'
    applyBindings({ someitem: someitem }, testNode)

        // First it's not there
    expect(testNode).toContainHtml('hello <!-- ko with: someitem --><!-- /ko --> goodbye')

        // Then it's there
    someitem({ occasionallyexistentchildprop: 'child prop value' })
    expect(testNode).toContainHtml('hello <!-- ko with: someitem --><span data-bind="text: occasionallyexistentchildprop">child prop value</span><!-- /ko --> goodbye')

        // Then it's gone again
    someitem(null)
    expect(testNode).toContainHtml('hello <!-- ko with: someitem --><!-- /ko --> goodbye')
  })

  it('Should be able to nest "with" regions defined by containerless templates', function () {
    testNode.innerHTML = 'hello <!-- ko with: topitem -->' +
                               'Got top: <span data-bind="text: topprop"></span>' +
                               '<!-- ko with: childitem -->' +
                                   'Got child: <span data-bind="text: childprop"></span>' +
                               '<!-- /ko -->' +
                           '<!-- /ko -->'
    var viewModel = { topitem: observable(null) }
    applyBindings(viewModel, testNode)

        // First neither are there
    expect(testNode).toContainHtml('hello <!-- ko with: topitem --><!-- /ko -->')

        // Make top appear
    viewModel.topitem({ topprop: 'property of top', childitem: observable() })
    expect(testNode).toContainHtml('hello <!-- ko with: topitem -->got top: <span data-bind="text: topprop">property of top</span><!-- ko with: childitem --><!-- /ko --><!-- /ko -->')

        // Make child appear
    viewModel.topitem().childitem({ childprop: 'property of child' })
    expect(testNode).toContainHtml('hello <!-- ko with: topitem -->got top: <span data-bind="text: topprop">property of top</span><!-- ko with: childitem -->got child: <span data-bind="text: childprop">property of child</span><!-- /ko --><!-- /ko -->')

        // Make top disappear
    viewModel.topitem(null)
    expect(testNode).toContainHtml('hello <!-- ko with: topitem --><!-- /ko -->')
  })

  it('Should provide access to an observable viewModel through $rawData', function () {
    testNode.innerHTML = `<div data-bind='with: item'><input data-bind='value: $rawData'/><div data-bind='text: $data'></div></div>`

    var item = observable('one')
    applyBindings({ item: item }, testNode)
    expect(item.getSubscriptionsCount('change')).toEqual(3)    // subscriptions are the with and value bindings, and the binding contex
    expect(testNode.childNodes[0]).toHaveValues(['one'])
    expect(testNode.childNodes[0]).toContainText('one')

        // Should update observable when input is changed
    testNode.childNodes[0].childNodes[0].value = 'two'
    triggerEvent(testNode.childNodes[0].childNodes[0], 'change')
    expect(item()).toEqual('two')
    expect(testNode.childNodes[0]).toContainText('two')

        // Should update the input when the observable changes
    item('three')
    expect(testNode.childNodes[0]).toHaveValues(['three'])
    expect(testNode.childNodes[0]).toContainText('three')

    // Subscription count is stable
    expect(item.getSubscriptionsCount('change')).toEqual(3)
  })

  it('Should update if given a function', function () {
      // See knockout/knockout#2285
    testNode.innerHTML = '<div data-bind="with: getTotal">Total: <div data-bind="text: $data"></div>'

    function ViewModel () {
      var self = this
      self.items = observableArray([{ x: observable(4) }])
      self.getTotal = function () {
        var total = 0
        arrayForEach(self.items(), item => { total += item.x() })
        return total
      }
    }

    var model = new ViewModel()
    applyBindings(model, testNode)
    expect(testNode).toContainText('Total: 4')

    model.items.push({ x: observable(15) })
    expect(testNode).toContainText('Total: 19')

    model.items()[0].x(10)
    expect(testNode).toContainText('Total: 25')
  })

  it('should refresh on dependency update binding', function () {
    // Note:
    //  - knockout/knockout#2285
    //  - http://jsfiddle.net/g15jphta/6/
    testNode.innerHTML = `<!-- ko template: {foreach: items} -->
                <div data-bind="text: x"></div>
                <div data-bind="with: $root.getTotal.bind($data)">
                  Total: <div data-bind="text: $data"></div>
                </div>
            <!-- /ko -->`

    function ViewModel () {
      var self = this
      self.items = observableArray([{ x: observable(4) }])
      self.getTotal = function () {
        return self.items()
                .reduce(function (sum, value) { return sum + value.x() }, 0)
      }
    }

    var model = new ViewModel()
    applyBindings(model, testNode)

    model.items.push({ x: observable(15) })
  })

  it('Should call a childrenComplete callback function', function () {
    testNode.innerHTML = "<div data-bind='with: someItem, childrenComplete: callback'><span data-bind='text: childprop'></span></div>"
    var someItem = observable({ childprop: 'child' }),
      callbacks = 0
    applyBindings({ someItem: someItem, callback: function () { callbacks++ } }, testNode)
    expect(callbacks).toEqual(1)
    expect(testNode.childNodes[0]).toContainText('child')

    someItem(null)
    expect(callbacks).toEqual(1)
    expect(testNode.childNodes[0].childNodes.length).toEqual(0)

    someItem({ childprop: 'new child' })
    expect(callbacks).toEqual(2)
    expect(testNode.childNodes[0]).toContainText('new child')
  })
})
