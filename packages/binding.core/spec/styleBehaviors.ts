import {
  applyBindings
} from '@tko/bind'

import {
  observable
} from '@tko/observable'

import {
  DataBindProvider
} from '@tko/provider.databind'

import {
  options
} from '@tko/utils'

import {bindings as coreBindings} from '../dist'

import '@tko/utils/helpers/jasmine-13-helper'

describe('Binding: CSS style', function () {
  var testNode : HTMLElement
  beforeEach(function() { testNode = jasmine.prepareTestNode() })

  beforeEach(function () {
    var provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it('Should be able to use standard CSS style name (rather than JavaScript name)', function () {
    var myObservable = observable('red')
    testNode.innerHTML = "<div data-bind='style: { \"background-color\": colorValue }'>Hallo</div>"
    applyBindings({ colorValue: myObservable }, testNode)
    var divEl = testNode.children[0] as HTMLDivElement
    expect(divEl.style.backgroundColor).toEqualOneOf(['red', '#ff0000']) // Opera returns style color values in #rrggbb notation, unlike other browsers
    myObservable('green')
    expect(divEl.style.backgroundColor).toEqualOneOf(['green', '#008000'])
    myObservable(undefined)
    expect(divEl.style.backgroundColor).toEqual('')
  })

  it('Should be able to apply the numeric value to a style and have it converted to px', function () {
    // See https://github.com/knockout/knockout/issues/231
    testNode.innerHTML = "<div data-bind='style: { width: 10 }'></div>"
    applyBindings(null, testNode)
    var divEl = testNode.children[0] as HTMLDivElement
    expect(divEl.style.width).toBe('10px')
  })

  it('Should give the element the specified CSS style value', function () {
    var myObservable = observable('red')
    testNode.innerHTML = "<div data-bind='style: { backgroundColor: colorValue }'>Hallo</div>"
    applyBindings({ colorValue: myObservable }, testNode)
    var divEl = testNode.children[0] as HTMLDivElement
    expect(divEl.style.backgroundColor).toEqualOneOf(['red', '#ff0000']) // Opera returns style color values in #rrggbb notation, unlike other browsers
    myObservable('green')
    expect(divEl.style.backgroundColor).toEqualOneOf(['green', '#008000'])
    myObservable(undefined)
    expect(divEl.style.backgroundColor).toEqual('')
  })

  it('Should be able to apply the numeric value to a style that doesn\'t accept pixels', function () {
    testNode.innerHTML = "<div data-bind='style: { zIndex: 10 }'></div>"
    applyBindings(null, testNode)
    var divEl = testNode.children[0] as HTMLDivElement
    expect(divEl.style.zIndex).toEqualOneOf(['10', 10])
  })

  it('Should be able to apply the numeric value zero to a style', function () {
    // Represents https://github.com/knockout/knockout/issues/972
    testNode.innerHTML = "<div data-bind='style: { width: 0 }'></div>"
    applyBindings(null, testNode)
    var divEl = testNode.children[0] as HTMLDivElement
    expect(divEl.style.width).toBe('0px')
  })

  it('Should be able to use "false" to remove a style', function () {
    // Verifying that the fix for 972 doesn't break this existing behavior
    testNode.innerHTML = "<div style='width: 100px' data-bind='style: { width: false }'></div>"
    applyBindings(null, testNode)
    var divEl = testNode.children[0] as HTMLDivElement
    expect(divEl.style.width).toBe('')
  })

  it('Should properly respond to changes in the observable, adding px when appropriate', function () {
    var width = observable()
    testNode.innerHTML = "<div data-bind='style: { width: width }'></div>"

    applyBindings({width: width}, testNode)

    var divEl = testNode.children[0] as HTMLDivElement
    expect(divEl.style.width).toBe('')

    width(10)
    expect(divEl.style.width).toBe('10px')

    width(20)
    expect(divEl.style.width).toBe('20px')

    width(false)
    expect(divEl.style.width).toBe('')
  })
})
