import { expect } from 'chai'

import { applyBindings } from '../dist'

import { cleanNode, options } from '@tko/utils'
import { expectContainHtml, expectContainText } from '../../utils/helpers/mocha-test-helpers'

import { observable } from '@tko/observable'

import {
  renderTemplate,
  setTemplateEngine,
  templateEngine,
  nativeTemplateEngine,
  bindings as templateBindings
} from '@tko/binding.template'

import { DataBindProvider } from '@tko/provider.databind'

import { bindings as coreBindings } from '@tko/binding.core'

import { bindings as ifBindings } from '@tko/binding.if'

import { dummyTemplateEngine } from '@tko/binding.template/helpers/dummyTemplateEngine'

const BLANK_HTML = `
<!doctype html>
<html>
  <head></head>
  <body></body>
</html>
`

describe('Cross-window support', function () {
  beforeEach(function () {
    // Set up the default binding handlers.
    const provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
    provider.bindingHandlers.set(templateBindings)
    provider.bindingHandlers.set(ifBindings)

    // The dummyTemplateEngine prototype test will fail if we let it just
    // use the one in dummyTemplateEngine.js, because that's imported from
    // the relative node_modules path (and therefore not the same).
    dummyTemplateEngine.prototype = new templateEngine()
  })

  it('Should work in another window', function () {
    const win2 = window.open('', '_blank', 'height=150,location=no,menubar=no,toolbar=no,width=250')

    if (!win2) {
      return
    }

    const previousTemplateEngine = nativeTemplateEngine.instance
    try {
      win2.document.write(BLANK_HTML)
      win2.document.close()
      const body2 = win2.document.body

      // renderTemplate
      setTemplateEngine(new dummyTemplateEngine({ someTemplate: "<div data-bind='text: text'></div>" }))
      renderTemplate('someTemplate', { text: 'abc' }, null, body2)
      expect(body2.childNodes.length).to.equal(1)
      expectContainHtml(body2, '<div data-bind="text: text">abc</div>')
      cleanNode(body2)

      // foreach
      body2.innerHTML = "<div data-bind='foreach: someItems'><span data-bind='text: childProp'></span></div>"
      const someItems = [{ childProp: 'first child' }, { childProp: 'second child' }]
      applyBindings({ someItems: someItems }, body2)
      expectContainHtml(
        body2.childNodes[0],
        '<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>'
      )
      cleanNode(body2)

      // template/foreach binding
      setTemplateEngine(new nativeTemplateEngine())
      body2.innerHTML =
        "<div id='tmpl'><span data-bind='text: childProp'></span></div><div data-bind='template: {name: \"tmpl\", foreach: someItems}'></div>"
      applyBindings({ someItems: someItems }, body2.childNodes[1])
      expectContainHtml(
        body2.childNodes[1],
        '<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>'
      )
      cleanNode(body2)

      // with
      const someItem = observable(undefined)
      body2.innerHTML =
        "<div data-bind='with: someItem'><span data-bind='text: occasionallyExistentChildProp'></span></div>"
      applyBindings({ someItem: someItem }, body2)

      expect(body2.childNodes[0].childNodes.length).to.equal(0)

      someItem({ occasionallyExistentChildProp: 'Child prop value' })
      expect(body2.childNodes[0].childNodes.length).to.equal(1)
      expectContainText(body2.childNodes[0].childNodes[0], 'Child prop value')

      someItem(null)
      expect(body2.childNodes[0].childNodes.length).to.equal(0)
      cleanNode(body2)
    } finally {
      setTemplateEngine(previousTemplateEngine)
      win2.close()
    }
  })
})
