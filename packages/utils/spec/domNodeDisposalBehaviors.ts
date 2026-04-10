/* global testNode */
import { expect } from 'chai'
import sinon from 'sinon'

import {
  addDisposeCallback,
  removeDisposeCallback,
  cleanNode,
  removeNode,
  options,
  otherNodeCleanerFunctions,
  cleanjQueryData
} from '../dist'
import { prepareTestNode } from '../helpers/mocha-test-helpers'

describe('DOM node disposal', function () {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = prepareTestNode()
  })
  afterEach(function () {
    otherNodeCleanerFunctions.length = 0
    otherNodeCleanerFunctions.push(cleanjQueryData)
  })

  it('Should run registered disposal callbacks when a node is cleaned', function () {
    let didRun = false
    addDisposeCallback(testNode, function () {
      didRun = true
    })

    expect(didRun).to.equal(false)
    cleanNode(testNode)
    expect(didRun).to.equal(true)
  })

  it('Should run registered disposal callbacks on descendants when a node is cleaned', function () {
    let didRun = false
    const childNode = document.createElement('DIV')
    const grandChildNode = document.createElement('DIV')
    testNode.appendChild(childNode)
    childNode.appendChild(grandChildNode)
    addDisposeCallback(grandChildNode, function () {
      didRun = true
    })

    expect(didRun).to.equal(false)
    cleanNode(testNode)
    expect(didRun).to.equal(true)
  })

  it('Should run registered disposal callbacks and detach from DOM when a node is removed', function () {
    let didRun = false
    const childNode = document.createElement('DIV')
    testNode.appendChild(childNode)
    addDisposeCallback(childNode, function () {
      didRun = true
    })

    expect(didRun).to.equal(false)
    expect(testNode.childNodes.length).to.equal(1)
    removeNode(childNode)
    expect(didRun).to.equal(true)
    expect(testNode.childNodes.length).to.equal(0)
  })

  it('Should be able to remove previously-registered disposal callbacks', function () {
    let didRun = false
    const callback = function () {
      didRun = true
    }
    addDisposeCallback(testNode, callback)

    expect(didRun).to.equal(false)
    removeDisposeCallback(testNode, callback)
    cleanNode(testNode)
    expect(didRun).to.equal(false) // Didn't run only because we removed it
  })

  it('Should not clean descendant nodes that are removed by a parent dispose handler', function () {
    const childNode = document.createElement('DIV')
    const grandChildNode = document.createElement('DIV')
    const childSpy = sinon.spy(function () {
      childNode.removeChild(grandChildNode)
    })
    const grandChildSpy = sinon.spy()

    testNode.appendChild(childNode)
    childNode.appendChild(grandChildNode)
    addDisposeCallback(childNode, childSpy)
    addDisposeCallback(grandChildNode, grandChildSpy)

    cleanNode(testNode)
    sinon.assert.calledWith(childSpy, childNode)
    sinon.assert.notCalled(grandChildSpy)
  })

  it('Should not clean nodes that are removed by a comment dispose handler', function () {
    const childNode = document.createComment('ko comment')
    const grandChildNode = document.createElement('DIV')
    const childNode2 = document.createComment('ko comment')
    const childSpy = sinon.spy(function () {
      testNode.removeChild(grandChildNode)
    })
    const grandChildSpy = sinon.spy()
    const child2Spy = sinon.spy()

    testNode.appendChild(childNode)
    testNode.appendChild(grandChildNode)
    testNode.appendChild(childNode2)
    addDisposeCallback(childNode, childSpy)
    addDisposeCallback(grandChildNode, grandChildSpy)
    addDisposeCallback(childNode2, child2Spy)

    cleanNode(testNode)
    sinon.assert.calledWith(childSpy, childNode)
    sinon.assert.notCalled(grandChildSpy)
    sinon.assert.calledWith(child2Spy, childNode2)
  })

  it('Should continue cleaning if a cleaned node is removed in a handler', function () {
    let childNode: Node = document.createElement('DIV')
    const childNode2: Node = document.createElement('DIV')
    const removeChildSpy = sinon.spy(function () {
      testNode.removeChild(childNode)
    })
    const childSpy = sinon.spy()

    // Test by removing the node itself
    testNode.appendChild(childNode)
    testNode.appendChild(childNode2)
    addDisposeCallback(childNode, removeChildSpy)
    addDisposeCallback(childNode2, childSpy)

    cleanNode(testNode)
    sinon.assert.calledWith(removeChildSpy, childNode)
    sinon.assert.calledWith(childSpy, childNode2)

    removeChildSpy.resetHistory()
    childSpy.resetHistory()

    // Test by removing a previous node
    const childNode3 = document.createElement('DIV')
    testNode.appendChild(childNode)
    testNode.appendChild(childNode2)
    testNode.appendChild(childNode3)
    addDisposeCallback(childNode2, removeChildSpy)
    addDisposeCallback(childNode3, childSpy)

    cleanNode(testNode)
    sinon.assert.calledWith(removeChildSpy, childNode2)
    sinon.assert.calledWith(childSpy, childNode3)

    removeChildSpy.resetHistory()
    childSpy.resetHistory()

    // Test by removing a comment node
    childNode = document.createComment('ko comment') as Node
    testNode.appendChild(childNode)
    testNode.appendChild(childNode2)
    addDisposeCallback(childNode, removeChildSpy)
    addDisposeCallback(childNode2, childSpy)

    cleanNode(testNode)
    sinon.assert.calledWith(removeChildSpy, childNode)
    sinon.assert.calledWith(childSpy, childNode2)
  })

  it('Should be able to attach disposal callback to a node that has been cloned', function () {
    // This represents bug https://github.com/SteveSanderson/knockout/issues/324
    // IE < 9 copies expando properties when cloning nodes, so if the node already has some DOM data associated with it,
    // the DOM data key will be copied too. This causes a problem for disposal, because if the original node gets disposed,
    // the shared DOM data is disposed, and then it becomes an error to try to set new DOM data on the clone.
    // The solution is to make the DOM-data-setting logic able to recover from the scenario by detecting that the original
    // DOM data is gone, and therefore recreating a new DOM data store for the clone.

    // Create an element with DOM data
    const originalNode = document.createElement('DIV')
    addDisposeCallback(originalNode, function () {})

    // Clone it, then dispose it. Then check it's still safe to associate DOM data with the clone.
    const cloneNode = originalNode.cloneNode(true)
    cleanNode(originalNode)
    addDisposeCallback(cloneNode, function () {})
  })

  it('Should be able to clean any user data by overwriting "cleanExternalData"', function () {
    otherNodeCleanerFunctions.length = 0

    otherNodeCleanerFunctions.push(function (node) {
      if (node['ko_test']) {
        node['ko_test'] = undefined
      }
    })

    testNode['ko_test'] = 'mydata'
    expect(testNode['ko_test']).to.equal('mydata')

    cleanNode(testNode)
    expect(testNode['ko_test']).to.equal(undefined)
  })

  it('If jQuery is referenced, should clear jQuery data when a node is cleaned', function () {
    const jQuery = options.jQuery

    if (!jQuery) {
      console.log('------- JQUERY is disabled -------')
      return // Nothing to test. Run the specs with jQuery referenced for this to do anything.
    }

    const obj = {}
    jQuery.data(testNode, 'ko_test', obj)
    expect(jQuery.data(testNode, 'ko_test')).to.equal(obj)

    cleanNode(testNode)
    expect(jQuery.data(testNode, 'ko_test')).to.equal(undefined)
  })

  it('If jQuery is referenced, should be able to prevent jQuery data from being cleared by overwriting "cleanExternalData"', function () {
    const jQuery = options.jQuery

    if (!jQuery) {
      console.log('------- JQUERY is disabled -------')
      return // Nothing to test. Run the specs with jQuery referenced for this to do anything.
    }
    otherNodeCleanerFunctions.length = 0

    const obj = {}
    jQuery.data(testNode, 'ko_test', obj)
    expect(jQuery.data(testNode, 'ko_test')).to.equal(obj)

    cleanNode(testNode)
    expect(jQuery.data(testNode, 'ko_test')).to.equal(obj)
  })
})
