/* globals testNode */

import { tasks, options } from '@tko/utils'

import { unwrap, observable as Observable, observableArray as ObservableArray } from '@tko/observable'

import { pureComputed } from '@tko/computed'

import { DataBindProvider } from '@tko/provider.databind'

import { bindings as coreBindings } from '@tko/binding.core'
import { bindings as templateBindings } from '@tko/binding.template'
import { bindings as ifBindings } from '@tko/binding.if'
import { applyBindings } from '@tko/bind'

import { useMockForTasks } from '@tko/utils/helpers/jasmine-13-helper'

describe('Deferred bindings', function () {
  let bindingSpy, bindingHandlers
  let testNode: HTMLElement

  beforeEach(function () {
    testNode = jasmine.prepareTestNode()
    useMockForTasks(options)
    options.deferUpdates = true
    let provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    bindingHandlers = provider.bindingHandlers
    bindingHandlers.set(coreBindings)
    bindingHandlers.set(templateBindings)
    bindingHandlers.set(ifBindings)

    bindingSpy = jasmine.createSpy('bindingSpy')
    bindingHandlers.test = {
      init: function (element, valueAccessor) {
        bindingSpy('init', unwrap(valueAccessor()))
      },
      update: function (element, valueAccessor) {
        bindingSpy('update', unwrap(valueAccessor()))
      }
    }
  })
  afterEach(function () {
    expect(tasks.resetForTesting()).toEqual(0)
    jasmine.Clock.reset()
    options.deferUpdates = false
    bindingSpy = bindingHandlers.test = null
  })

  it('Should update bindings asynchronously', function () {
    let observable = Observable('A')

    // The initial "applyBindings" is synchronous
    testNode.innerHTML = "<div data-bind='test: myObservable'></div>"
    applyBindings({ myObservable: observable }, testNode)
    expect(bindingSpy.argsForCall).toEqual([
      ['init', 'A'],
      ['update', 'A']
    ])

    // When changing the observable, the update is deferred
    bindingSpy.reset()
    observable('B')
    expect(bindingSpy).not.toHaveBeenCalled()

    // Update is still deferred
    observable('C')
    expect(bindingSpy).not.toHaveBeenCalled()

    jasmine.Clock.tick(1)
    // Only the latest value is notified
    expect(bindingSpy.argsForCall).toEqual([['update', 'C']])
  })

  it('Should update templates asynchronously', function () {
    let observable = Observable('A')

    testNode.innerHTML = "<div data-bind='template: {data: myObservable}'><div data-bind='test: $data'></div></div>"
    applyBindings({ myObservable: observable }, testNode)
    expect(bindingSpy.argsForCall).toEqual([
      ['init', 'A'],
      ['update', 'A']
    ])

    // mutate; template should not be updated yet
    bindingSpy.reset()
    observable('B')
    expect(bindingSpy).not.toHaveBeenCalled()

    // mutate again; template should not be updated yet
    observable('C')
    expect(bindingSpy).not.toHaveBeenCalled()

    jasmine.Clock.tick(1)
    // only the latest value should be used
    expect(bindingSpy.argsForCall).toEqual([
      ['init', 'C'],
      ['update', 'C']
    ])
  })

  it("Should update 'foreach' items asynchronously", function () {
    let observable = ObservableArray(['A'])

    testNode.innerHTML = "<div data-bind='foreach: {data: myObservables}'><div data-bind='test: $data'></div></div>"
    applyBindings({ myObservables: observable }, testNode)
    expect(bindingSpy.argsForCall).toEqual([
      ['init', 'A'],
      ['update', 'A']
    ])

    // mutate; template should not be updated yet
    bindingSpy.reset()
    observable(['A', 'B'])
    expect(bindingSpy).not.toHaveBeenCalled()

    // mutate again; template should not be updated yet
    observable(['A', 'C'])
    expect(bindingSpy).not.toHaveBeenCalled()

    jasmine.Clock.tick(1)
    // only the latest value should be used ("C" added but not "B")
    expect(bindingSpy.argsForCall).toEqual([
      ['init', 'C'],
      ['update', 'C']
    ])

    // When an element is deleted and then added in a new place, it should register as a move and
    // not create new DOM elements or update any child bindings
    bindingSpy.reset()
    observable.remove('A')
    observable.push('A')

    let nodeA = testNode.childNodes[0].childNodes[0],
      nodeB = testNode.childNodes[0].childNodes[1]
    jasmine.Clock.tick(1)
    expect(bindingSpy).not.toHaveBeenCalled()
    expect(testNode.childNodes[0].childNodes[0]).toBe(nodeB)
    expect(testNode.childNodes[0].childNodes[1]).toBe(nodeA)
  })

  it('Should be able to force an update using runEarly', function () {
    // This is based on the logic used in https://github.com/rniemeyer/knockout-sortable that when an item
    // is dragged and dropped in the same list, it must be deleted and re-added instead of being moved.

    testNode.innerHTML = "<div data-bind='foreach: someItems'><span data-bind='text: childProp'></span></div>"
    let someItems = ObservableArray([
      { childProp: 'first child' },
      { childProp: 'second child' },
      { childProp: 'moving child' }
    ])
    applyBindings({ someItems: someItems }, testNode)
    expect(testNode.childNodes[0]).toContainHtml(
      '<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span><span data-bind="text: childprop">moving child</span>'
    )

    let sourceIndex = 2,
      targetIndex = 0,
      itemNode = testNode.childNodes[0].childNodes[sourceIndex],
      item = someItems()[sourceIndex]

    // Simply removing and re-adding item isn't sufficient because it will be registered as a move and no new element will be added
    // Using tasks.runEarly between the updates ensures that the binding sees each individual update
    someItems.splice(sourceIndex, 1)
    tasks.runEarly()
    someItems.splice(targetIndex, 0, item)

    jasmine.Clock.tick(1)
    expect(testNode.childNodes[0]).toContainHtml(
      '<span data-bind="text: childprop">moving child</span><span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>'
    )
    expect(testNode.childNodes[0].childNodes[targetIndex]).not.toBe(itemNode) // node was create anew so it's not the same
  })

  it('Should get latest value when conditionally included', function () {
    // Test is based on example in https://github.com/knockout/knockout/issues/1975
    testNode.innerHTML = '<div data-bind="if: show"><div data-bind="text: status"></div></div>'
    let value = Observable(0),
      is1 = pureComputed(function () {
        return value() === 1
      }),
      status = pureComputed(function () {
        return is1() ? 'ok' : 'error'
      }),
      show = pureComputed(function () {
        return value() > 0 && is1()
      })

    applyBindings({ status: status, show: show }, testNode)
    expect(testNode.childNodes[0]).toContainHtml('')

    value(1)
    jasmine.Clock.tick(1)
    expect(testNode.childNodes[0]).toContainHtml('<div data-bind="text: status">ok</div>')

    value(0)
    jasmine.Clock.tick(1)
    expect(testNode.childNodes[0]).toContainHtml('')

    value(1)
    jasmine.Clock.tick(1)
    expect(testNode.childNodes[0]).toContainHtml('<div data-bind="text: status">ok</div>')
  })

  it('Should update "if" binding before descendant bindings', function () {
    // Based on example at https://github.com/knockout/knockout/pull/2226
    testNode.innerHTML = `<div data-bind="if: hasAddress()"><span data-bind="text: streetNumber().toLowerCase()"></span> <span data-bind="text: street().toLowerCase()"></span></div>`

    const vm = {
      street: Observable(),
      streetNumber: Observable(),
      hasAddress: pureComputed(() => vm.streetNumber() && vm.street())
    }

    applyBindings(vm, testNode)
    jasmine.Clock.tick(1)
    expect(testNode.childNodes[0]).toContainText('')

    vm.street('my street')
    vm.streetNumber('123')
    jasmine.Clock.tick(1)
    expect(testNode.childNodes[0]).toContainText('123 my street')

    vm.street(null)
    vm.streetNumber(null)
    jasmine.Clock.tick(1)
    expect(testNode.childNodes[0]).toContainText('')
  })

  it('Should update "with" binding before descendant bindings', function () {
    // Based on example at https://github.com/knockout/knockout/pull/2226
    testNode.innerHTML = `<div data-bind="with: hasAddress()"><span data-bind="text: $parent.streetNumber().toLowerCase()"></span> <span data-bind="text: $parent.street().toLowerCase()"></span></div>`
    const vm = {
      street: Observable(),
      streetNumber: Observable(),
      hasAddress: pureComputed(() => vm.streetNumber() && vm.street())
    }

    applyBindings(vm, testNode)
    jasmine.Clock.tick(1)
    expect(testNode.childNodes[0]).toContainText('')

    vm.street('my street')
    vm.streetNumber('123')
    jasmine.Clock.tick(1)
    expect(testNode.childNodes[0]).toContainText('123 my street')

    vm.street(null)
    vm.streetNumber(null)
    jasmine.Clock.tick(1)
    expect(testNode.childNodes[0]).toContainText('')
  })

  it('Should leave descendant nodes unchanged if the value is truthy and remains truthy when changed', function () {
    let someItem = Observable(true)
    testNode.innerHTML = "<div data-bind='if: someItem'><span data-bind='text: (++counter)'></span></div>"
    let originalNode = testNode.childNodes[0].childNodes[0]

    // Value is initially true, so nodes are retained
    applyBindings({ someItem: someItem, counter: 0 }, testNode)

    expect(testNode.childNodes[0].childNodes[0]['tagName']['toLowerCase']()).toEqual('span')
    expect(testNode.childNodes[0].childNodes[0]).toEqual(originalNode)
    expect(testNode).toContainText('1')

    // Change the value to a different truthy value; see the previous SPAN remains
    someItem('different truthy value')
    jasmine.Clock.tick(1)

    expect(testNode.childNodes[0].childNodes[0]['tagName']['toLowerCase']()).toEqual('span')
    expect(testNode.childNodes[0].childNodes[0]).toEqual(originalNode)
    expect(testNode).toContainText('1')
  })
})
