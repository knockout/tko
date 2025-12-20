import { applyBindings } from '@tko/bind'

import { DataBindProvider } from '@tko/provider.databind'

import { options } from '@tko/utils'

import { bindings as coreBindings } from '../dist'

import '@tko/utils/helpers/jasmine-13-helper'

describe('Binding: HTML', function () {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = jasmine.prepareTestNode()
  })

  beforeEach(function () {
    let provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it('Should assign the value to the node without HTML-encoding the value', function () {
    let model = { textProp: 'My <span>HTML-containing</span> value' }
    testNode.innerHTML = "<span data-bind='html:textProp'></span>"
    applyBindings(model, testNode)
    expect((testNode.childNodes[0] as HTMLElement).innerHTML.toLowerCase()).toEqual(model.textProp.toLowerCase())
    expect((testNode.childNodes[0].childNodes[1] as HTMLElement).innerHTML).toEqual('HTML-containing')
  })

  it('Should assign an empty string as value if the model value is null', function () {
    testNode.innerHTML = "<span data-bind='html:(null)' ></span>"
    applyBindings(null, testNode)
    expect(testNode.children[0].innerHTML).toEqual('')
  })

  it('Should assign an empty string as value if the model value is undefined', function () {
    testNode.innerHTML = "<span data-bind='html:undefined' ></span>"
    applyBindings(null, testNode)
    expect(testNode.children[0].innerHTML).toEqual('')
  })

  it('Should be able to write arbitrary HTML, even if it is not semantically correct', function () {
    // Represents issue #98 (https://github.com/SteveSanderson/knockout/issues/98)
    // IE 8 and earlier is excessively strict about the use of .innerHTML - it throws
    // if you try to write a <P> tag inside an existing <P> tag, for example.
    let model = { textProp: "<p>hello</p><p>this isn't semantically correct</p>" }
    testNode.innerHTML = "<p data-bind='html:textProp'></p>"
    applyBindings(model, testNode)
    expect(testNode.children[0]).toContainHtml(model.textProp)
  })

  it('Should be able to write arbitrary HTML, including <tr> elements into tables', function () {
    // Some HTML elements are awkward, because the browser implicitly adds surrounding
    // elements, or won't allow those elements to be direct children of others.
    // The most common examples relate to tables.
    let model = { textProp: '<tr><td>hello</td></tr>' }
    testNode.innerHTML = "<table data-bind='html:textProp'></table>"
    applyBindings(model, testNode)

    // Accept either of the following outcomes - there may or may not be an implicitly added <tbody>.
    let tr = testNode.children[0].children[0]
    if (tr.tagName == 'TBODY') {
      tr = tr.children[0]
    }

    let td = tr.children[0]

    expect(tr.tagName).toEqual('TR')
    expect(td.tagName).toEqual('TD')
    expect('innerText' in td ? td.innerText : td.textContent).toEqual('hello')
  })
})
