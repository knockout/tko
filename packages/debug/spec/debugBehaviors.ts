import { assert } from 'chai'

import { options, cleanNode } from '@tko/utils'

import { observable } from '@tko/observable'
import { pureComputed } from '@tko/computed'

import { MultiProvider } from '@tko/provider.multi'
import { VirtualProvider } from '@tko/provider.virtual'
import { DataBindProvider } from '@tko/provider.databind'

import { applyBindings } from '@tko/bind'

import { bindings as coreBindings } from '@tko/binding.core'

import { inspectNode, inspectObservable, inspectPath } from '../dist'

describe('@tko/debug', function () {
  let root: HTMLElement

  beforeEach(function () {
    root = document.createElement('div')
    document.body.appendChild(root)

    const provider = new MultiProvider({ providers: [new VirtualProvider(), new DataBindProvider()] })
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
    options.onError = function (error) {
      throw error
    }
  })

  afterEach(function () {
    cleanNode(root)
    document.body.removeChild(root)
  })

  it('inspects a bound node and its binding context', function () {
    root.innerHTML = '<span class="target" data-bind="text: answer"></span>'

    applyBindings({ answer: observable('ready') }, root, function (context) {
      context.extraFlag = true
    })

    const target = root.querySelector('.target') as HTMLElement
    const inspection = inspectNode(target)

    assert.equal(inspection.bound, true)
    assert.equal(inspection.tagName, 'SPAN')
    assert.equal(inspection.context?.parentsCount, 0)
    assert.deepEqual(inspection.context?.aliasKeys, ['extraFlag'])
    assert.equal(inspection.context?.aliases.extraFlag.kind, 'primitive')
    assert.equal(inspection.context?.chain.length, 1)
  })

  it('inspects observables with current value and subscriptions', function () {
    const message = observable('hello')

    root.innerHTML = '<span data-bind="text: message"></span>'
    applyBindings({ message }, root)

    const inspection = inspectObservable(message)

    assert.isDefined(inspection)
    assert.equal(inspection?.kind, 'observable')
    assert.equal(inspection?.value.kind, 'primitive')
    assert.equal(inspection?.value.value, 'hello')
    assert.isAtLeast(inspection?.subscriptions.change ?? 0, 1)
    assert.equal(inspection?.isWritable, true)
  })

  it('inspects pure computeds with dependency metadata', function () {
    const price = observable(3)
    const doubled = pureComputed(function () {
      return price() * 2
    })

    root.innerHTML = '<span data-bind="text: doubled"></span>'
    applyBindings({ doubled }, root)

    const inspection = inspectObservable(doubled)

    assert.isDefined(inspection)
    assert.equal(inspection?.kind, 'computed')
    assert.equal(inspection?.isPureComputed, true)
    assert.equal(inspection?.dependenciesCount, 1)
    assert.lengthOf(inspection?.dependencies ?? [], 1)
  })

  it('does not evaluate sleeping pure computeds during inspection by default', function () {
    let evaluations = 0
    const sleeping = pureComputed(function () {
      evaluations++
      return 'expensive'
    })

    const inspection = inspectObservable(sleeping)
    const pathInspection = inspectPath({ sleeping }, 'sleeping')

    assert.equal(evaluations, 0)
    assert.equal(inspection?.kind, 'computed')
    assert.equal(inspection?.value.kind, 'computed')
    assert.equal(pathInspection.value.kind, 'computed')
  })

  it('resolves direct view-model paths without evaluating computeds', function () {
    const message = observable('bridge-ready')
    const doubled = pureComputed(function () {
      return 2
    })

    const messageInspection = inspectPath({ message }, 'message')
    const computedInspection = inspectPath({ doubled }, 'doubled')

    assert.equal(messageInspection.found, true)
    assert.equal(messageInspection.observable?.kind, 'observable')
    assert.equal(messageInspection.observable?.value.value, 'bridge-ready')
    assert.equal(computedInspection.found, true)
    assert.equal(computedInspection.value.kind, 'computed')
  })
})
