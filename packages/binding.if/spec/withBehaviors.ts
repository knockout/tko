/* global testNode */
import { triggerEvent, options, arrayForEach } from '@tko/utils'
import { expect } from 'chai'

import { applyBindings, contextFor, dataFor } from '@tko/bind'

import { observable, observableArray } from '@tko/observable'

import { DataBindProvider } from '@tko/provider.databind'
import { MultiProvider } from '@tko/provider.multi'
import { VirtualProvider } from '@tko/provider.virtual'

import { bindings as withBindings } from '../dist'
import { bindings as coreBindings } from '@tko/binding.core'
import { bindings as templateBindings } from '@tko/binding.template'

import { expectContainHtml, expectContainText, prepareTestNode } from '../../utils/helpers/mocha-test-helpers'

function expectValues(node: Node, expectedValues: string[]) {
  const values = Array.from(node.childNodes)
    .map(childNode => (childNode as HTMLInputElement).value)
    .filter(value => value !== undefined)
  expect(values).to.deep.equal(expectedValues)
}

describe('Binding: With', function () {
  let testNode: HTMLElement

  beforeEach(function () {
    testNode = prepareTestNode()
  })

  beforeEach(function () {
    const provider = new MultiProvider({ providers: [new DataBindProvider(), new VirtualProvider()] })
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
    provider.bindingHandlers.set(withBindings)
    provider.bindingHandlers.set(templateBindings)
  })

  it('Should remove descendant nodes from the document (and not bind them) if the value is falsy', function () {
    testNode.innerHTML =
      "<div data-bind='with: someItem'><span data-bind='text: someItem.nonExistentChildProp'></span></div>"
    expect(testNode.childNodes[0].childNodes.length).to.equal(1)
    applyBindings({ someItem: null }, testNode)
    expect(testNode.childNodes[0].childNodes.length).to.equal(0)
  })

  it('Should leave descendant nodes in the document (and bind them in the context of the supplied value) if the value is truthy', function () {
    testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: existentChildProp'></span></div>"
    expect(testNode.childNodes.length).to.equal(1)
    applyBindings({ someItem: { existentChildProp: 'Child prop value' } }, testNode)
    expect(testNode.childNodes[0].childNodes.length).to.equal(1)
    expectContainText(testNode.childNodes[0].childNodes[0], 'Child prop value')
  })

  it('Should leave descendant nodes unchanged if the value is truthy', function () {
    const someItem = observable({ childProp: 'child prop value' })
    testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: childProp'></span></div>"
    const originalNode = testNode.childNodes[0].childNodes[0]

    applyBindings({ someItem: someItem }, testNode)
    expectContainText(testNode.childNodes[0].childNodes[0], 'child prop value')
    expect(testNode.childNodes[0].childNodes[0]).to.equal(originalNode)
  })

  it('Should toggle the presence and bindedness of descendant nodes according to the truthiness of the value, performing binding in the context of the value', function () {
    const someItem = observable(undefined)
    testNode.innerHTML =
      "<div data-bind='with: someItem'><span data-bind='text: occasionallyExistentChildProp'></span></div>"
    applyBindings({ someItem: someItem }, testNode)

    expect(testNode.childNodes[0].childNodes.length).to.equal(0)

    someItem({ occasionallyExistentChildProp: 'Child prop value' })
    expect(testNode.childNodes[0].childNodes.length).to.equal(1)
    expectContainText(testNode.childNodes[0].childNodes[0], 'Child prop value')

    someItem(null)
    expect(testNode.childNodes[0].childNodes.length).to.equal(0)
  })

  it('Should reconstruct and bind descendants when the data item notifies about mutation', function () {
    const someItem = observable({ childProp: 'Hello' })

    testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: childProp'></span></div>"
    applyBindings({ someItem: someItem }, testNode)
    expectContainText(testNode.childNodes[0].childNodes[0], 'Hello')

    someItem().childProp = 'Goodbye'
    someItem.valueHasMutated()
    expectContainText(testNode.childNodes[0].childNodes[0], 'Goodbye')
  })

  it('Should not bind the same elements more than once even if the supplied value notifies a change', function () {
    let countedClicks = 0
    const someItem = observable({
      childProp: observable('Hello'),
      handleClick: function () {
        countedClicks++
      }
    })

    testNode.innerHTML =
      "<div data-bind='with: someItem'><span data-bind='text: childProp, click: handleClick'></span></div>"
    applyBindings({ someItem: someItem }, testNode)

    expectContainText(testNode.childNodes[0].childNodes[0], 'Hello')
    expect(someItem().childProp.getSubscriptionsCount()).to.equal(1)
    triggerEvent(testNode.children[0].children[0], 'click')
    expect(countedClicks).to.equal(1)

    someItem.valueHasMutated()
    expect(someItem().childProp.getSubscriptionsCount()).to.equal(1)

    countedClicks = 0
    triggerEvent(testNode.children[0].children[0], 'click')
    expect(countedClicks).to.equal(1)
  })

  it('Should be able to access parent binding context via $parent', function () {
    testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: $parent.parentProp'></span></div>"
    applyBindings({ someItem: {}, parentProp: 'Parent prop value' }, testNode)
    expectContainText(testNode.childNodes[0].childNodes[0], 'Parent prop value')
  })

  it('Should be able to access all parent binding contexts via $parents, and root context via $root', function () {
    testNode.innerHTML =
      "<div data-bind='with: topItem'>"
      + "<div data-bind='with: middleItem'>"
      + "<div data-bind='with: bottomItem'>"
      + "<span data-bind='text: name'></span>"
      + "<span data-bind='text: $parent.name'></span>"
      + "<span data-bind='text: $parents[1].name'></span>"
      + "<span data-bind='text: $parents[2].name'></span>"
      + "<span data-bind='text: $root.name'></span>"
      + '</div>'
      + '</div>'
      + '</div>'
    applyBindings(
      { name: 'outer', topItem: { name: 'top', middleItem: { name: 'middle', bottomItem: { name: 'bottom' } } } },
      testNode
    )
    const finalContainer = testNode.childNodes[0].childNodes[0].childNodes[0]
    expectContainText(finalContainer.childNodes[0], 'bottom')
    expectContainText(finalContainer.childNodes[1], 'middle')
    expectContainText(finalContainer.childNodes[2], 'top')
    expectContainText(finalContainer.childNodes[3], 'outer')
    expectContainText(finalContainer.childNodes[4], 'outer')

    expect(contextFor(testNode).$data.name).to.equal('outer')
    expect(contextFor(testNode.childNodes[0]).$data.name).to.equal('outer')
    expect(contextFor(testNode.childNodes[0].childNodes[0]).$data.name).to.equal('top')
    expect(contextFor(testNode.childNodes[0].childNodes[0].childNodes[0]).$data.name).to.equal('middle')
    expect(contextFor(testNode.childNodes[0].childNodes[0].childNodes[0].childNodes[0]).$data.name).to.equal('bottom')
    const firstSpan = testNode.childNodes[0].childNodes[0].childNodes[0].childNodes[0] as HTMLElement
    expect(firstSpan.tagName).to.equal('SPAN')
    expect(contextFor(firstSpan).$data.name).to.equal('bottom')
    expect(contextFor(firstSpan).$root.name).to.equal('outer')
    expect(contextFor(firstSpan).$parents[1].name).to.equal('top')
  })

  it('Should be able to access all parent bindings when using "as"', async function () {
    if (options.createChildContextWithAs) {
      console.log('Skip with-as because createChildContextWithAs is enabled')
      return
    }

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
    applyBindings(
      { name: 'outer', topItem: { name: 'top', middleItem: { name: 'middle', bottomItem: { name: 'bottom' } } } },
      testNode
    )
    const finalContainer = (testNode.childNodes[0] as HTMLElement).children[0].children[0]
    const [name, parentName, middleName, parent1Name, rootName] = finalContainer.children
    expectContainText(name, 'bottom')
    expectContainText(parentName, 'top')
    expectContainText(middleName, 'middle')
    expectContainText(parent1Name, 'outer')
    expectContainText(rootName, 'outer')
    expect(contextFor(name).$parents.length).to.equal(2)
  })

  it('Should not create a child context', function () {
    if (options.createChildContextWithAs) {
      console.log('Skip with-as because createChildContextWithAs is enabled')
      return
    }

    testNode.innerHTML =
      "<div data-bind='with: someItem, as: \"item\"'><span data-bind='text: item.childProp'></span></div>"
    const someItem = { childProp: 'Hello' }
    applyBindings({ someItem: someItem }, testNode)

    expectContainText(testNode.childNodes[0].childNodes[0], 'Hello')
    expect(dataFor(testNode.childNodes[0].childNodes[0])).to.equal(dataFor(testNode))
  })

  it('Should provide access to observable value', function () {
    if (options.createChildContextWithAs) {
      console.log('Skip with-as because createChildContextWithAs is enabled')
      return
    }

    testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\"'><input data-bind='value: item'/></div>"
    const someItem = observable('Hello')
    applyBindings({ someItem: someItem }, testNode)
    expect((testNode.childNodes[0].childNodes[0] as HTMLInputElement).value).to.equal('Hello')

    expect(dataFor(testNode.childNodes[0].childNodes[0])).to.equal(dataFor(testNode))

    ;(testNode.childNodes[0].childNodes[0] as HTMLInputElement).value = 'Goodbye'
    triggerEvent(testNode.children[0].children[0], 'change')
    expect(someItem()).to.equal('Goodbye')

    someItem('Hello again')
    expect((testNode.childNodes[0].childNodes[0] as HTMLInputElement).value).to.equal('Hello again')
  })

  it('Should not re-render the nodes when an observable value changes', function () {
    if (options.createChildContextWithAs) {
      console.log('Skip with-as because createChildContextWithAs is enabled')
      return
    }

    testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\"'><span data-bind='text: item'></span></div>"
    const someItem = observable('first')
    applyBindings({ someItem }, testNode)
    expectContainText(testNode.childNodes[0], 'first')

    const saveNode = testNode.childNodes[0].childNodes[0]
    someItem('second')
    expectContainText(testNode.childNodes[0], 'second')
    expect(testNode.childNodes[0].childNodes[0]).to.equal(saveNode)
  })

  it('Should remove nodes with an observable value become falsy', function () {
    if (options.createChildContextWithAs) {
      console.log('Skip with-as because createChildContextWithAs is enabled')
      return
    }

    const someItem = observable(undefined)
    testNode.innerHTML =
      "<div data-bind='with: someItem, as: \"item\"'><span data-bind='text: item().occasionallyExistentChildProp'></span></div>"
    applyBindings({ someItem: someItem }, testNode)

    expect(testNode.childNodes[0].childNodes.length).to.equal(0)

    someItem({ occasionallyExistentChildProp: 'Child prop value' })
    expect(testNode.childNodes[0].childNodes.length).to.equal(1)
    expectContainText(testNode.childNodes[0].childNodes[0], 'Child prop value')

    someItem(null)
    expect(testNode.childNodes[0].childNodes.length).to.equal(0)
  })

  it('Should be able to define an "with" region using a containerless template', function () {
    const someitem = observable(undefined)
    testNode.innerHTML =
      'hello <!-- ko with: someitem --><span data-bind="text: occasionallyexistentchildprop"></span><!-- /ko --> goodbye'
    applyBindings({ someitem: someitem }, testNode)

    expectContainHtml(testNode, 'hello <!-- ko with: someitem --><!-- /ko --> goodbye')

    someitem({ occasionallyexistentchildprop: 'child prop value' })
    expectContainHtml(
      testNode,
      'hello <!-- ko with: someitem --><span data-bind="text: occasionallyexistentchildprop">child prop value</span><!-- /ko --> goodbye'
    )

    someitem(null)
    expectContainHtml(testNode, 'hello <!-- ko with: someitem --><!-- /ko --> goodbye')
  })

  it('Should be able to nest "with" regions defined by containerless templates', function () {
    testNode.innerHTML =
      'hello <!-- ko with: topitem -->'
      + 'Got top: <span data-bind="text: topprop"></span>'
      + '<!-- ko with: childitem -->'
      + 'Got child: <span data-bind="text: childprop"></span>'
      + '<!-- /ko -->'
      + '<!-- /ko -->'
    const viewModel = { topitem: observable(null) }
    applyBindings(viewModel, testNode)

    expectContainHtml(testNode, 'hello <!-- ko with: topitem --><!-- /ko -->')

    viewModel.topitem({ topprop: 'property of top', childitem: observable() })
    expectContainHtml(
      testNode,
      'hello <!-- ko with: topitem -->got top: <span data-bind="text: topprop">property of top</span><!-- ko with: childitem --><!-- /ko --><!-- /ko -->'
    )

    viewModel.topitem().childitem({ childprop: 'property of child' })
    expectContainHtml(
      testNode,
      'hello <!-- ko with: topitem -->got top: <span data-bind="text: topprop">property of top</span><!-- ko with: childitem -->got child: <span data-bind="text: childprop">property of child</span><!-- /ko --><!-- /ko -->'
    )

    viewModel.topitem(null)
    expectContainHtml(testNode, 'hello <!-- ko with: topitem --><!-- /ko -->')
  })

  it('Should provide access to an observable viewModel through $rawData', function () {
    testNode.innerHTML = `<div data-bind='with: item'><input data-bind='value: $rawData'/><div data-bind='text: $data'></div></div>`

    const item = observable('one')
    applyBindings({ item: item }, testNode)
    expect(item.getSubscriptionsCount('change')).to.equal(3)
    expectValues(testNode.childNodes[0], ['one'])
    expectContainText(testNode.childNodes[0], 'one')

    ;(testNode.childNodes[0].childNodes[0] as HTMLInputElement).value = 'two'
    triggerEvent(testNode.children[0].children[0], 'change')
    expect(item()).to.equal('two')
    expectContainText(testNode.childNodes[0], 'two')

    item('three')
    expectValues(testNode.childNodes[0], ['three'])
    expectContainText(testNode.childNodes[0], 'three')

    expect(item.getSubscriptionsCount('change')).to.equal(3)
  })

  it('Should update if given a function', function () {
    testNode.innerHTML = '<div data-bind="with: getTotal">Total: <div data-bind="text: $data"></div>'

    function ViewModel() {
      const self = this
      self.items = observableArray([{ x: observable(4) }])
      self.getTotal = function () {
        let total = 0
        arrayForEach(self.items(), item => {
          total += item.x()
        })
        return total
      }
    }

    const model = new ViewModel()
    applyBindings(model, testNode)
    expectContainText(testNode, 'Total: 4')

    model.items.push({ x: observable(15) })
    expectContainText(testNode, 'Total: 19')

    model.items()[0].x(10)
    expectContainText(testNode, 'Total: 25')
  })

  it('should refresh on dependency update binding', function () {
    testNode.innerHTML = `<!-- ko template: {foreach: items} -->
                <div data-bind="text: x"></div>
                <div data-bind="with: $root.getTotal.bind($data)">
                  Total: <div data-bind="text: $data"></div>
                </div>
            <!-- /ko -->`

    function ViewModel() {
      const self = this
      self.items = observableArray([{ x: observable(4) }])
      self.getTotal = function () {
        return self.items().reduce(function (sum, value) {
          return sum + value.x()
        }, 0)
      }
    }

    const model = new ViewModel()
    applyBindings(model, testNode)

    model.items.push({ x: observable(15) })
  })

  it('Should call a childrenComplete callback function', function () {
    testNode.innerHTML =
      "<div data-bind='with: someItem, childrenComplete: callback'><span data-bind='text: childprop'></span></div>"
    let someItem = observable({ childprop: 'child' })
    let callbacks = 0
    applyBindings(
      {
        someItem: someItem,
        callback: function () {
          callbacks++
        }
      },
      testNode
    )
    expect(callbacks).to.equal(1)
    expectContainText(testNode.childNodes[0], 'child')

    someItem(null)
    expect(callbacks).to.equal(1)
    expect(testNode.childNodes[0].childNodes.length).to.equal(0)

    someItem({ childprop: 'new child' })
    expect(callbacks).to.equal(2)
    expectContainText(testNode.childNodes[0], 'new child')
  })
})
