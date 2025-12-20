/* globals it, jasmine, describe, afterEach, beforeEach, expect */

import { options, tasks } from '@tko/utils'
import { observable } from '@tko/observable'
import { MultiProvider } from '@tko/provider.multi'
import { VirtualProvider } from '@tko/provider.virtual'
import { DataBindProvider } from '@tko/provider.databind'
import { applyBindings, applyBindingsToDescendants } from '../dist'
import { BindingHandler } from '../src'
import { bindings as coreBindings } from '@tko/binding.core'
import { bindings as templateBindings } from '@tko/binding.template'
import { bindings as ifBindings } from '@tko/binding.if'
import { bindings as eachBindings } from '@tko/binding.foreach'
import { BindingHandlerObject } from '@tko/provider'

describe('Binding Application Promise', function () {
  let bindingHandlers: BindingHandlerObject

  class SyncBinding extends BindingHandler {
    get bindingCompleted() {
      return this.value(true)
    }
    static get allowVirtualElements() {
      return true
    }
  }

  class AsyncBinding extends BindingHandler {
    get bindingCompleted() {
      return options.Promise.resolve().then(() => this.value(true))
    }
    static get allowVirtualElements() {
      return true
    }
  }

  class AsyncContainerBinding extends BindingHandler {
    constructor(params) {
      super(params)
      this.bindingCompletion = options.Promise.resolve().then(() =>
        applyBindingsToDescendants(this.$context, this.$element)
      )
    }

    get controlsDescendants() {
      return true
    }
    get bindingCompleted() {
      return this.bindingCompletion.then(() => this.value(true))
    }
  }

  beforeEach(function () {
    // Set up the default binding handlers.
    let provider = new MultiProvider({ providers: [new VirtualProvider(), new DataBindProvider()] })
    options.bindingProviderInstance = provider
    bindingHandlers = provider.bindingHandlers
    bindingHandlers.set(coreBindings)
    bindingHandlers.set(templateBindings)
    bindingHandlers.set(ifBindings)
    bindingHandlers.set(eachBindings)
    bindingHandlers.set({ sync: SyncBinding, async: AsyncBinding, asynccb: AsyncContainerBinding })
    options.onError = function (e) {
      throw e
    }
  })

  afterEach(function () {
    expect(tasks.resetForTesting()).toEqual(0)
  })

  it('returns a promise', function () {
    const div = document.createElement('div')
    const abr = applyBindings({}, div)
    expect(abr.constructor).toEqual(options.Promise)
  })

  it('completes immediately when there are no bindings', function () {
    const div = document.createElement('div')
    const abr = applyBindings({}, div)
    jasmine.resolve(abr.then(() => expect(div.outerHTML).toEqual('<div></div>')))
  })

  it('completes immediately with synchronous bindings and no descendants', function () {
    const div = document.createElement('div')
    div.setAttribute('data-bind', 'css: "abc"')
    const abr = applyBindings({}, div)
    jasmine.resolve(
      abr.then(() => expect(div.outerHTML).toEqual('<div data-bind="css: &quot;abc&quot;" class="abc"></div>'))
    )
  })

  it('completes immediately with synchronous bindings and synchronous descendants', function () {
    const div = document.createElement('div')
    div.innerHTML = '<span data-bind="template: { foreach: y }"><i data-bind="css: $data"></i></span>'
    const abr = applyBindings({ y: ['a', 'b'] }, div)
    jasmine.resolve(
      abr.then(() =>
        expect(div.outerHTML).toEqual(
          '<div><span data-bind="template: { foreach: y }"><i data-bind="css: $data" class="a"></i><i data-bind="css: $data" class="b"></i></span></div>'
        )
      )
    )
  })

  it('calls bindingCompleted synchronously/element', function () {
    const div = document.createElement('div')
    div.setAttribute('data-bind', 'sync: x')
    const x = observable(false)
    const abr = applyBindings({ x }, div)
    expect(x()).toEqual(true)
    jasmine.resolve(abr.then(() => expect(x()).toEqual(true)))
  })

  it('resolves asynchronously/element', function () {
    const div = document.createElement('div')
    div.setAttribute('data-bind', 'async: x')
    const x = observable(false)
    const abr = applyBindings({ x }, div)
    expect(x()).toEqual(false)
    jasmine.resolve(abr.then(() => expect(x()).toEqual(true)))
  })

  it('calls bindingCompleted synchronously/virtual-element', function () {
    const div = document.createElement('div')
    div.innerHTML = '<!-- ko sync: x --><!-- /ko -->'
    const x = observable(false)
    const abr = applyBindings({ x }, div)
    expect(x()).toEqual(true)
    jasmine.resolve(abr.then(() => expect(x()).toEqual(true)))
  })

  it('resolves asynchronously/virtual-element', function () {
    const div = document.createElement('div')
    div.innerHTML = '<!-- ko async: x --><!-- /ko -->'
    const x = observable(false)
    const abr = applyBindings({ x }, div)
    expect(x()).toEqual(false)
    jasmine.resolve(abr.then(() => expect(x()).toEqual(true)))
  })

  it('completes with multiple nested async (synthetic) bindings', function () {
    const div = document.createElement('div')
    div.innerHTML = '<i data-bind="asynccb: a"><i data-bind="asynccb: b"><i data-bind="asynccb: c"></i></i></i>'
    const [a, b, c] = [observable(false), observable(false), observable(false)]
    const abr = applyBindings({ a, b, c }, div)
    expect(a()).toEqual(false)
    expect(b()).toEqual(false)
    expect(c()).toEqual(false)
    jasmine.resolve(
      abr.then(() => {
        expect(a()).toEqual(true)
        expect(b()).toEqual(true)
        expect(c()).toEqual(true)
      })
    )
  })

  it('completes with asynchronous (foreach) bindings and synchronous descendants', function () {
    const div = document.createElement('div')
    div.innerHTML = '<span data-bind="foreach: y"><i data-bind="css: $data"></i></span>'
    const abr = applyBindings({ y: ['a', 'b'] }, div)
    jasmine.resolve(
      abr.then(() =>
        expect(div.outerHTML).toEqual(
          '<div><span data-bind="foreach: y"><i data-bind="css: $data" class="a"></i><i data-bind="css: $data" class="b"></i></span></div>'
        )
      )
    )
  })

  it('completes with asynchronous (foreach) bindings and asynchronous descendants', function () {
    const div = document.createElement('div')
    div.innerHTML = '<span data-bind="foreach: y"><i data-bind="css: $data"></i></span>'
    eachBindings.foreach.setSync(false)
    const abr = applyBindings({ y: ['a', 'b'] }, div)
    jasmine.resolve(
      abr.then(() =>
        expect(div.outerHTML).toEqual(
          '<div><span data-bind="foreach: y"><i data-bind="css: $data" class="a"></i><i data-bind="css: $data" class="b"></i></span></div>'
        )
      )
    )
  })

  it('completes with synchronous bindings and asynchronous (foreach) descendants', function () {
    const div = document.createElement('div')
    div.innerHTML =
      '<span data-bind="template: {foreach: y}"><i data-bind="foreach: z"><i data-bind="text: $data"></i></i></span>'
    eachBindings.foreach.setSync(false)
    const abr = applyBindings({ y: [{ z: ['a', 'b'] }] }, div)
    jasmine.resolve(
      abr.then(() =>
        expect(div.outerHTML).toEqual(
          '<div><span data-bind="template: {foreach: y}"><i data-bind="foreach: z"><i data-bind="text: $data">a</i><i data-bind="text: $data">b</i></i></span></div>'
        )
      )
    )
  })
})
