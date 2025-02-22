
import { observable as Observable, unwrap } from '@tko/observable'
import { arrayMap } from '@tko/utils'
import '@tko/utils/helpers/jasmine-13-helper'
import { setDomNodeChildrenFromArrayMapping } from '../dist'

function copyDomNodeChildren (domNode: HTMLElement) {
  var copy: ChildNode[] = []
  for (var i = 0; i < domNode.childNodes.length; i++) {
    copy.push(domNode.childNodes[i])
  }
  return copy
}

describe('Array to DOM node children mapping', function () {
  var testNode : HTMLElement
  beforeEach(function() { testNode = jasmine.prepareTestNode() })

  it('Should populate the DOM node by mapping array elements', function () {
    var array = ['A', 'B']
    var mapping = function (arrayItem) {
      var output1 = document.createElement('DIV')
      var output2 = document.createElement('DIV')
      output1.innerHTML = arrayItem + '1'
      output2.innerHTML = arrayItem + '2'
      return [output1, output2]
    }
    setDomNodeChildrenFromArrayMapping(testNode, array, mapping)
    expect(testNode.childNodes.length).toEqual(4)
    expect(testNode.children[0].innerHTML).toEqual('A1')
    expect(testNode.children[1].innerHTML).toEqual('A2')
    expect(testNode.children[2].innerHTML).toEqual('B1')
    expect(testNode.children[3].innerHTML).toEqual('B2')
  })

  it('Should only call the mapping function for new array elements', function () {
    var mappingInvocations = new Array()
    var mapping = function (arrayItem: string) {
      mappingInvocations.push(arrayItem)

    }
    setDomNodeChildrenFromArrayMapping(testNode, ['A', 'B'], mapping)
    expect(mappingInvocations).toEqual(['A', 'B'])

    mappingInvocations = new Array()
    setDomNodeChildrenFromArrayMapping(testNode, ['A', 'A2', 'B'], mapping)
    expect(mappingInvocations).toEqual(['A2'])
  })

  it('Should retain existing node instances if the array is unchanged', function () {
    var array = ['A', 'B']
    var mapping = function (arrayItem: string) {
      var output1 = document.createElement('DIV')
      var output2 = document.createElement('DIV')
      output1.innerHTML = arrayItem + '1'
      output2.innerHTML = arrayItem + '2'
      return [output1, output2]
    }

    setDomNodeChildrenFromArrayMapping(testNode, array, mapping)
    var existingInstances = copyDomNodeChildren(testNode)

    setDomNodeChildrenFromArrayMapping(testNode, array, mapping)
    var newInstances = copyDomNodeChildren(testNode)

    expect(newInstances).toEqual(existingInstances)
  })

  it('Should insert added nodes at the corresponding place in the DOM', function () {
    var mappingInvocations: string[] = []
    var mapping = function (arrayItem: string) {
      mappingInvocations.push(arrayItem)
      var output = document.createElement('DIV')
      output.innerHTML = arrayItem
      return [output]
    }

    setDomNodeChildrenFromArrayMapping(testNode, ['A', 'B'], mapping)
    expect(arrayMap(testNode.children, function (x) { return x.innerHTML })).toEqual(['A', 'B'])
    expect(mappingInvocations).toEqual(['A', 'B'])

    mappingInvocations = new Array()
    setDomNodeChildrenFromArrayMapping(testNode, ['first', 'A', 'middle1', 'middle2', 'B', 'last'], mapping)
    expect(arrayMap(testNode.children, function (x) { return x.innerHTML })).toEqual(['first', 'A', 'middle1', 'middle2', 'B', 'last'])
    expect(mappingInvocations).toEqual(['first', 'middle1', 'middle2', 'last'])
  })

  it('Should remove deleted nodes from the DOM', function () {
    var mappingInvocations = new Array<string>()
    var mapping = function (arrayItem: string) {
      mappingInvocations.push(arrayItem)
      var output = document.createElement('DIV')
      output.innerHTML = arrayItem
      return [output]
    }

    setDomNodeChildrenFromArrayMapping(testNode, ['first', 'A', 'middle1', 'middle2', 'B', 'last'], mapping)
    expect(arrayMap(testNode.children, function (x) { return x.innerHTML })).toEqual(['first', 'A', 'middle1', 'middle2', 'B', 'last'])
    expect(mappingInvocations).toEqual(['first', 'A', 'middle1', 'middle2', 'B', 'last'])

    mappingInvocations = new Array()
    setDomNodeChildrenFromArrayMapping(testNode, ['A', 'B'], mapping)
    expect(arrayMap(testNode.children, function (x) { return x.innerHTML })).toEqual(['A', 'B'])
    expect(mappingInvocations).toEqual([])
  })

  it('Should tolerate DOM nodes being removed manually, before the corresponding array entry is removed', function () {
        // Represents https://github.com/SteveSanderson/knockout/issues/413
        // Ideally, people wouldn't be mutating the generated DOM manually. But this didn't error in v2.0, so we should try to avoid introducing a break.
    var mappingInvocations = new Array()
    var mapping = function (arrayItem: string) {
      mappingInvocations.push(arrayItem)
      var output = document.createElement('DIV')
      output.innerHTML = arrayItem
      return [output]
    }

    setDomNodeChildrenFromArrayMapping(testNode, ['A', 'B', 'C'], mapping)
    expect(testNode).toContainHtml('<div>a</div><div>b</div><div>c</div>')

        // Now kill the middle DIV manually, even though people shouldn't really do this
    var elemToRemove = testNode.children[1]
    expect(elemToRemove.innerHTML).toEqual('B') // Be sure it's the right one
    elemToRemove.parentNode?.removeChild(elemToRemove)

        // Now remove the corresponding array entry. This shouldn't cause an exception.
    setDomNodeChildrenFromArrayMapping(testNode, ['A', 'C'], mapping)
    expect(testNode).toContainHtml('<div>a</div><div>c</div>')
  })

  it('Should handle sequences of mixed insertions and deletions', function () {
    var mappingInvocations = new Array(), countCallbackInvocations = 0
    var mapping = function (arrayItem: string) {
      mappingInvocations.push(arrayItem)
      var output = document.createElement('DIV')
      output.innerHTML = unwrap(arrayItem) || 'null'
      return [output]
    }
    var callback = function (arrayItem, nodes?) {
      ++countCallbackInvocations
      expect(mappingInvocations[mappingInvocations.length - 1]).toEqual(arrayItem)
    }

    setDomNodeChildrenFromArrayMapping(testNode, ['A'], mapping, null, callback)
    expect(arrayMap(testNode.children, function (x) { return x.innerHTML })).toEqual(['A'])
    expect(mappingInvocations).toEqual(['A'])
    expect(countCallbackInvocations).toEqual(mappingInvocations.length)

    mappingInvocations = new Array(), countCallbackInvocations = 0
    setDomNodeChildrenFromArrayMapping(testNode, ['B'], mapping, null, callback) // Delete and replace single item
    expect(arrayMap(testNode.children, function (x) { return x.innerHTML })).toEqual(['B'])
    expect(mappingInvocations).toEqual(['B'])
    expect(countCallbackInvocations).toEqual(mappingInvocations.length)

    mappingInvocations = new Array(), countCallbackInvocations = 0
    setDomNodeChildrenFromArrayMapping(testNode, ['A', 'B', 'C'], mapping, null, callback) // Add at beginning and end
    expect(arrayMap(testNode.children, function (x) { return x.innerHTML })).toEqual(['A', 'B', 'C'])
    expect(mappingInvocations).toEqual(['A', 'C'])
    expect(countCallbackInvocations).toEqual(mappingInvocations.length)

    mappingInvocations = new Array(), countCallbackInvocations = 0
    setDomNodeChildrenFromArrayMapping(testNode, ['C', 'B', 'A'], mapping, null, callback) // Move items
    expect(arrayMap(testNode.children, function (x) { return x.innerHTML })).toEqual(['C', 'B', 'A'])
    expect(mappingInvocations).toEqual([])
    expect(countCallbackInvocations).toEqual(mappingInvocations.length)

        // Check that observable items can be added and unwrapped in the mapping function and will update the DOM.
        // Also check that observables accessed in the callback function do not update the DOM.
    mappingInvocations = new Array(), countCallbackInvocations = 0
    var observable = Observable(1), callbackObservable = Observable(1)
    var callback2 = function (arrayItem, nodes) {
      callbackObservable()
      callback(arrayItem, nodes)
    }
    setDomNodeChildrenFromArrayMapping(testNode, [observable, null, 'B'], mapping, null, callback2) // Add to beginning; delete from end
    expect(arrayMap(testNode.children, function (x) { return x.innerHTML })).toEqual(['1', 'null', 'B'])
    expect(mappingInvocations).toEqual([observable, null])
    expect(countCallbackInvocations).toEqual(mappingInvocations.length)

        // Change the value of the mapped observable and verify that the DOM is updated
    mappingInvocations = new Array(), countCallbackInvocations = 0
    observable(2)
    expect(arrayMap(testNode.children, function (x) { return x.innerHTML })).toEqual(['2', 'null', 'B'])
    expect(mappingInvocations).toEqual([observable])
    expect(countCallbackInvocations).toEqual(mappingInvocations.length)

        // Change the value of the callback observable and verify that the DOM wasn't updated
    mappingInvocations = new Array(), countCallbackInvocations = 0
    callbackObservable(2)
    expect(mappingInvocations.length).toEqual(0)
    expect(countCallbackInvocations).toEqual(0)
  })
})
