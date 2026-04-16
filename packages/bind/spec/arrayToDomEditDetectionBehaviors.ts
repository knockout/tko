import { expect } from 'chai'

import { observable as Observable, unwrap } from '@tko/observable'
import { arrayMap } from '@tko/utils'
import { expectContainHtml, prepareTestNode } from '../../utils/helpers/mocha-test-helpers'
import { setDomNodeChildrenFromArrayMapping } from '../dist'

function copyDomNodeChildren(domNode: HTMLElement) {
  const copy: ChildNode[] = []
  for (let i = 0; i < domNode.childNodes.length; i++) {
    copy.push(domNode.childNodes[i])
  }
  return copy
}

describe('Array to DOM node children mapping', function () {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = prepareTestNode()
  })

  it('Should populate the DOM node by mapping array elements', function () {
    const array = ['A', 'B']
    const mapping = function (arrayItem) {
      const output1 = document.createElement('DIV')
      const output2 = document.createElement('DIV')
      output1.innerHTML = arrayItem + '1'
      output2.innerHTML = arrayItem + '2'
      return [output1, output2]
    }
    setDomNodeChildrenFromArrayMapping(testNode, array, mapping)
    expect(testNode.childNodes.length).to.equal(4)
    expect(testNode.children[0].innerHTML).to.equal('A1')
    expect(testNode.children[1].innerHTML).to.equal('A2')
    expect(testNode.children[2].innerHTML).to.equal('B1')
    expect(testNode.children[3].innerHTML).to.equal('B2')
  })

  it('Should only call the mapping function for new array elements', function () {
    let mappingInvocations = new Array()
    const mapping = function (arrayItem: string) {
      mappingInvocations.push(arrayItem)
    }
    setDomNodeChildrenFromArrayMapping(testNode, ['A', 'B'], mapping)
    expect(mappingInvocations).to.deep.equal(['A', 'B'])

    mappingInvocations = new Array()
    setDomNodeChildrenFromArrayMapping(testNode, ['A', 'A2', 'B'], mapping)
    expect(mappingInvocations).to.deep.equal(['A2'])
  })

  it('Should retain existing node instances if the array is unchanged', function () {
    const array = ['A', 'B']
    const mapping = function (arrayItem: string) {
      const output1 = document.createElement('DIV')
      const output2 = document.createElement('DIV')
      output1.innerHTML = arrayItem + '1'
      output2.innerHTML = arrayItem + '2'
      return [output1, output2]
    }

    setDomNodeChildrenFromArrayMapping(testNode, array, mapping)
    const existingInstances = copyDomNodeChildren(testNode)

    setDomNodeChildrenFromArrayMapping(testNode, array, mapping)
    const newInstances = copyDomNodeChildren(testNode)

    expect(newInstances.length).to.equal(existingInstances.length)
    for (let i = 0; i < newInstances.length; i++) {
      expect(newInstances[i]).to.equal(existingInstances[i])
    }
  })

  it('Should insert added nodes at the corresponding place in the DOM', function () {
    let mappingInvocations: string[] = []
    const mapping = function (arrayItem: string) {
      mappingInvocations.push(arrayItem)
      const output = document.createElement('DIV')
      output.innerHTML = arrayItem
      return [output]
    }

    setDomNodeChildrenFromArrayMapping(testNode, ['A', 'B'], mapping)
    expect(
      arrayMap(testNode.children, function (x) {
        return x.innerHTML
      })
    ).to.deep.equal(['A', 'B'])
    expect(mappingInvocations).to.deep.equal(['A', 'B'])

    mappingInvocations = new Array()
    setDomNodeChildrenFromArrayMapping(testNode, ['first', 'A', 'middle1', 'middle2', 'B', 'last'], mapping)
    expect(
      arrayMap(testNode.children, function (x) {
        return x.innerHTML
      })
    ).to.deep.equal(['first', 'A', 'middle1', 'middle2', 'B', 'last'])
    expect(mappingInvocations).to.deep.equal(['first', 'middle1', 'middle2', 'last'])
  })

  it('Should remove deleted nodes from the DOM', function () {
    let mappingInvocations = new Array<string>()
    const mapping = function (arrayItem: string) {
      mappingInvocations.push(arrayItem)
      const output = document.createElement('DIV')
      output.innerHTML = arrayItem
      return [output]
    }

    setDomNodeChildrenFromArrayMapping(testNode, ['first', 'A', 'middle1', 'middle2', 'B', 'last'], mapping)
    expect(
      arrayMap(testNode.children, function (x) {
        return x.innerHTML
      })
    ).to.deep.equal(['first', 'A', 'middle1', 'middle2', 'B', 'last'])
    expect(mappingInvocations).to.deep.equal(['first', 'A', 'middle1', 'middle2', 'B', 'last'])

    mappingInvocations = new Array()
    setDomNodeChildrenFromArrayMapping(testNode, ['A', 'B'], mapping)
    expect(
      arrayMap(testNode.children, function (x) {
        return x.innerHTML
      })
    ).to.deep.equal(['A', 'B'])
    expect(mappingInvocations).to.deep.equal([])
  })

  it('Should tolerate DOM nodes being removed manually, before the corresponding array entry is removed', function () {
    // Represents https://github.com/SteveSanderson/knockout/issues/413
    // Ideally, people wouldn't be mutating the generated DOM manually. But this didn't error in v2.0, so we should try to avoid introducing a break.
    const mappingInvocations = new Array()
    const mapping = function (arrayItem: string) {
      mappingInvocations.push(arrayItem)
      const output = document.createElement('DIV')
      output.innerHTML = arrayItem
      return [output]
    }

    setDomNodeChildrenFromArrayMapping(testNode, ['A', 'B', 'C'], mapping)
    expectContainHtml(testNode, '<div>a</div><div>b</div><div>c</div>')

    // Now kill the middle DIV manually, even though people shouldn't really do this
    const elemToRemove = testNode.children[1]
    expect(elemToRemove.innerHTML).to.equal('B') // Be sure it's the right one
    elemToRemove.parentNode?.removeChild(elemToRemove)

    // Now remove the corresponding array entry. This shouldn't cause an exception.
    setDomNodeChildrenFromArrayMapping(testNode, ['A', 'C'], mapping)
    expectContainHtml(testNode, '<div>a</div><div>c</div>')
  })

  it('Should handle sequences of mixed insertions and deletions', function () {
    let mappingInvocations = new Array(),
      countCallbackInvocations = 0

    const reset = function () {
      mappingInvocations = new Array()
      countCallbackInvocations = 0
    }

    const mapping = function (arrayItem: string) {
      mappingInvocations.push(arrayItem)
      const output = document.createElement('DIV')
      output.innerHTML = unwrap(arrayItem) || 'null'
      return [output]
    }
    const callback = function (arrayItem, nodes?) {
      ++countCallbackInvocations
      expect(mappingInvocations[mappingInvocations.length - 1]).to.equal(arrayItem)
    }

    setDomNodeChildrenFromArrayMapping(testNode, ['A'], mapping, null, callback)
    expect(
      arrayMap(testNode.children, function (x) {
        return x.innerHTML
      })
    ).to.deep.equal(['A'])
    expect(mappingInvocations).to.deep.equal(['A'])
    expect(countCallbackInvocations).to.equal(mappingInvocations.length)

    reset()
    setDomNodeChildrenFromArrayMapping(testNode, ['B'], mapping, null, callback) // Delete and replace single item
    expect(
      arrayMap(testNode.children, function (x) {
        return x.innerHTML
      })
    ).to.deep.equal(['B'])
    expect(mappingInvocations).to.deep.equal(['B'])
    expect(countCallbackInvocations).to.equal(mappingInvocations.length)

    reset()
    setDomNodeChildrenFromArrayMapping(testNode, ['A', 'B', 'C'], mapping, null, callback) // Add at beginning and end
    expect(
      arrayMap(testNode.children, function (x) {
        return x.innerHTML
      })
    ).to.deep.equal(['A', 'B', 'C'])
    expect(mappingInvocations).to.deep.equal(['A', 'C'])
    expect(countCallbackInvocations).to.equal(mappingInvocations.length)

    reset()
    setDomNodeChildrenFromArrayMapping(testNode, ['C', 'B', 'A'], mapping, null, callback) // Move items
    expect(
      arrayMap(testNode.children, function (x) {
        return x.innerHTML
      })
    ).to.deep.equal(['C', 'B', 'A'])
    expect(mappingInvocations).to.deep.equal([])
    expect(countCallbackInvocations).to.equal(mappingInvocations.length)

    // Check that observable items can be added and unwrapped in the mapping function and will update the DOM.
    // Also check that observables accessed in the callback function do not update the DOM.
    reset()
    const observable = Observable(1),
      callbackObservable = Observable(1)
    const callback2 = function (arrayItem, nodes) {
      callbackObservable()
      callback(arrayItem, nodes)
    }
    setDomNodeChildrenFromArrayMapping(testNode, [observable, null, 'B'], mapping, null, callback2) // Add to beginning; delete from end
    expect(
      arrayMap(testNode.children, function (x) {
        return x.innerHTML
      })
    ).to.deep.equal(['1', 'null', 'B'])
    expect(mappingInvocations).to.deep.equal([observable, null])
    expect(countCallbackInvocations).to.equal(mappingInvocations.length)

    // Change the value of the mapped observable and verify that the DOM is updated
    reset()
    observable(2)
    expect(
      arrayMap(testNode.children, function (x) {
        return x.innerHTML
      })
    ).to.deep.equal(['2', 'null', 'B'])
    expect(mappingInvocations).to.deep.equal([observable])
    expect(countCallbackInvocations).to.equal(mappingInvocations.length)

    // Change the value of the callback observable and verify that the DOM wasn't updated
    reset()
    callbackObservable(2)
    expect(mappingInvocations.length).to.equal(0)
    expect(countCallbackInvocations).to.equal(0)
  })
})
