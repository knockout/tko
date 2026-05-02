import { expect } from 'chai'

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
import type { BindingHandlerObject } from '@tko/provider'
import { restoreAfter } from '../../utils/helpers/mocha-test-helpers'

describe('Binding Application Promise', function () {
  let bindingHandlers: BindingHandlerObject
  let cleanups: Array<() => void>

  class SyncBinding extends BindingHandler {
    override get bindingCompleted() {
      return this.value(true)
    }
    static override get allowVirtualElements() {
      return true
    }
  }

  class AsyncBinding extends BindingHandler {
    override get bindingCompleted() {
      return options.Promise.resolve().then(() => this.value(true))
    }
    static override get allowVirtualElements() {
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

    override get controlsDescendants() {
      return true
    }
    override get bindingCompleted() {
      return this.bindingCompletion.then(() => this.value(true))
    }
  }

  beforeEach(function () {
    cleanups = []
    // Set up the default binding handlers.
    const provider = new MultiProvider({ providers: [new VirtualProvider(), new DataBindProvider()] })
    restoreAfter(cleanups, options, 'bindingProviderInstance')
    restoreAfter(cleanups, options, 'onError')
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
    expect(tasks.resetForTesting()).to.equal(0)
    while (cleanups.length) {
      cleanups.pop()!()
    }
  })

  it('returns a promise', function () {
    const div = document.createElement('div')
    const abr = applyBindings({}, div)
    expect(abr.constructor).to.equal(options.Promise)
  })

  it('completes immediately when there are no bindings', async function () {
    const div = document.createElement('div')
    const abr = applyBindings({}, div)
    await abr
    expect(div.outerHTML).to.equal('<div></div>')
  })

  it('completes immediately with synchronous bindings and no descendants', async function () {
    const div = document.createElement('div')
    div.setAttribute('data-bind', 'css: "abc"')
    const abr = applyBindings({}, div)
    await abr
    expect(div.outerHTML).to.equal('<div data-bind="css: &quot;abc&quot;" class="abc"></div>')
  })

  it('completes immediately with synchronous bindings and synchronous descendants', async function () {
    const div = document.createElement('div')
    div.innerHTML = '<span data-bind="template: { foreach: y }"><i data-bind="css: $data"></i></span>'
    const abr = applyBindings({ y: ['a', 'b'] }, div)
    await abr
    expect(div.outerHTML).to.equal(
      '<div><span data-bind="template: { foreach: y }"><i data-bind="css: $data" class="a"></i><i data-bind="css: $data" class="b"></i></span></div>'
    )
  })

  it('calls bindingCompleted synchronously/element', async function () {
    const div = document.createElement('div')
    div.setAttribute('data-bind', 'sync: x')
    const x = observable(false)
    const abr = applyBindings({ x }, div)
    expect(x()).to.equal(true)
    await abr
    expect(x()).to.equal(true)
  })

  it('resolves asynchronously/element', async function () {
    const div = document.createElement('div')
    div.setAttribute('data-bind', 'async: x')
    const x = observable(false)
    const abr = applyBindings({ x }, div)
    expect(x()).to.equal(false)
    await abr
    expect(x()).to.equal(true)
  })

  it('calls bindingCompleted synchronously/virtual-element', async function () {
    const div = document.createElement('div')
    div.innerHTML = '<!-- ko sync: x --><!-- /ko -->'
    const x = observable(false)
    const abr = applyBindings({ x }, div)
    expect(x()).to.equal(true)
    await abr
    expect(x()).to.equal(true)
  })

  it('resolves asynchronously/virtual-element', async function () {
    const div = document.createElement('div')
    div.innerHTML = '<!-- ko async: x --><!-- /ko -->'
    const x = observable(false)
    const abr = applyBindings({ x }, div)
    expect(x()).to.equal(false)
    await abr
    expect(x()).to.equal(true)
  })

  it('completes with multiple nested async (synthetic) bindings', async function () {
    const div = document.createElement('div')
    div.innerHTML = '<i data-bind="asynccb: a"><i data-bind="asynccb: b"><i data-bind="asynccb: c"></i></i></i>'
    const [a, b, c] = [observable(false), observable(false), observable(false)]
    const abr = applyBindings({ a, b, c }, div)
    expect(a()).to.equal(false)
    expect(b()).to.equal(false)
    expect(c()).to.equal(false)
    await abr
    expect(a()).to.equal(true)
    expect(b()).to.equal(true)
    expect(c()).to.equal(true)
  })

  it('completes with asynchronous (foreach) bindings and synchronous descendants', async function () {
    const div = document.createElement('div')
    div.innerHTML = '<span data-bind="foreach: y"><i data-bind="css: $data"></i></span>'
    const abr = applyBindings({ y: ['a', 'b'] }, div)
    await abr
    expect(div.outerHTML).to.equal(
      '<div><span data-bind="foreach: y"><i data-bind="css: $data" class="a"></i><i data-bind="css: $data" class="b"></i></span></div>'
    )
  })

  it('completes with asynchronous (foreach) bindings and asynchronous descendants', async function () {
    const div = document.createElement('div')
    div.innerHTML = '<span data-bind="foreach: y"><i data-bind="css: $data"></i></span>'
    eachBindings.foreach.setSync(false)
    const abr = applyBindings({ y: ['a', 'b'] }, div)
    await abr
    expect(div.outerHTML).to.equal(
      '<div><span data-bind="foreach: y"><i data-bind="css: $data" class="a"></i><i data-bind="css: $data" class="b"></i></span></div>'
    )
  })

  it('completes with synchronous bindings and asynchronous (foreach) descendants', async function () {
    const div = document.createElement('div')
    div.innerHTML =
      '<span data-bind="template: {foreach: y}"><i data-bind="foreach: z"><i data-bind="text: $data"></i></i></span>'
    eachBindings.foreach.setSync(false)
    const abr = applyBindings({ y: [{ z: ['a', 'b'] }] }, div)
    await abr
    expect(div.outerHTML).to.equal(
      '<div><span data-bind="template: {foreach: y}"><i data-bind="foreach: z"><i data-bind="text: $data">a</i><i data-bind="text: $data">b</i></i></span></div>'
    )
  })

  it('completes with if binding containing async descendants', async function () {
    const div = document.createElement('div')
    div.innerHTML = '<span data-bind="if: true"><i data-bind="async: x"></i></span>'
    const x = observable(false)
    const abr = applyBindings({ x }, div)
    expect(x()).to.equal(false)
    await abr
    expect(x()).to.equal(true)
  })
})
