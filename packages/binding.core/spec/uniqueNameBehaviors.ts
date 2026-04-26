import { applyBindings } from '@tko/bind'
import { expect } from 'chai'

import { DataBindProvider } from '@tko/provider.databind'

import { options } from '@tko/utils'

import { bindings as coreBindings } from '../dist'

import { prepareTestNode } from '../../utils/helpers/mocha-test-helpers'

describe('Binding: Unique Name', function () {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = prepareTestNode()
  })

  beforeEach(function () {
    const provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it('Should apply a different name to each element', function () {
    testNode.innerHTML = "<div data-bind='uniqueName: true'></div><div data-bind='uniqueName: true'></div>"
    applyBindings({}, testNode)

    expect((testNode.childNodes[0] as HTMLInputElement).name.length > 0).to.equal(true)
    expect((testNode.childNodes[1] as HTMLInputElement).name.length > 0).to.equal(true)
    expect(
      (testNode.childNodes[0] as HTMLInputElement).name === (testNode.childNodes[1] as HTMLInputElement).name
    ).to.equal(false)
  })
})
