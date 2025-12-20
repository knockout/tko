import {
    applyBindings
} from '@tko/bind'

import {
    observable
} from '@tko/observable'

import { DataBindProvider } from '@tko/provider.databind'

import {
    options
} from '@tko/utils'

import {bindings as coreBindings} from '../dist'

import '@tko/utils/helpers/jasmine-13-helper'

describe('Binding: CSS classes', function () {
  let bindingHandlers

  let testNode : HTMLElement
  beforeEach(function() { testNode = jasmine.prepareTestNode() })

  beforeEach(function () {
    let provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    bindingHandlers = provider.bindingHandlers
    bindingHandlers.set(coreBindings)
  })

  it('Should give the element the specific CSS class only when the specified value is true', function () {
    let observable1 = observable()
    let observable2 = observable(true)
    testNode.innerHTML = "<div class='unrelatedClass1 unrelatedClass2' data-bind='css: { myRule: someModelProperty, anotherRule: anotherModelProperty }'>Hallo</div>"
    applyBindings({ someModelProperty: observable1, anotherModelProperty: observable2 }, testNode)

    expect(testNode.children[0].className).toEqual('unrelatedClass1 unrelatedClass2 anotherRule')
    observable1(true)
    expect(testNode.children[0].className).toEqual('unrelatedClass1 unrelatedClass2 anotherRule myRule')
    observable2(false)
    expect(testNode.children[0].className).toEqual('unrelatedClass1 unrelatedClass2 myRule')
  })

  it('Should give the element a single CSS class without a leading space when the specified value is true', function () {
    let observable1 = observable()
    testNode.innerHTML = "<div data-bind='css: { myRule: someModelProperty }'>Hallo</div>"
    applyBindings({ someModelProperty: observable1 }, testNode)

    expect(testNode.children[0].className).toEqual('')
    observable1(true)
    expect(testNode.children[0].className).toEqual('myRule')
  })

  it('Should toggle multiple CSS classes if specified as a single string separated by spaces', function () {
    let observable1 = observable()
    testNode.innerHTML = "<div class='unrelatedClass1' data-bind='css: { \"myRule _another-Rule123\": someModelProperty }'>Hallo</div>"
    applyBindings({ someModelProperty: observable1 }, testNode)

    expect(testNode.children[0].className).toEqual('unrelatedClass1')
    observable1(true)
    expect(testNode.children[0].className).toEqual('unrelatedClass1 myRule _another-Rule123')
    observable1(false)
    expect(testNode.children[0].className).toEqual('unrelatedClass1')
  })

  it('Should set/change dynamic CSS class(es) if string is specified', function () {
    let observable1 = observable('')
    testNode.innerHTML = "<div class='unrelatedClass1' data-bind='css: someModelProperty'>Hallo</div>"
    applyBindings({ someModelProperty: observable1 }, testNode)

    expect(testNode.children[0].className).toEqual('unrelatedClass1')
    observable1('my-Rule')
    expect(testNode.children[0].className).toEqual('unrelatedClass1 my-Rule')
    observable1('another_Rule  my-Rule')
    expect(testNode.children[0].className).toEqual('unrelatedClass1 another_Rule my-Rule')
    observable1(undefined)
    expect(testNode.children[0].className).toEqual('unrelatedClass1')
    observable1(' ')
    expect(testNode.children[0].className).toEqual('unrelatedClass1')
  })

  it('Should work with any arbitrary class names', function () {
        // See https://github.com/SteveSanderson/knockout/issues/704
    let observable1 = observable()
    testNode.innerHTML = "<div data-bind='css: { \"complex/className complex.className\" : someModelProperty }'>Something</div>"
    applyBindings({ someModelProperty: observable1 }, testNode)

    expect(testNode.children[0].className).toEqual('')
    observable1(true)
    expect(testNode.children[0].className).toEqual('complex/className complex.className')
  })

    // Ensure CSS binding supports SVG, where applicable.
    // The problem is that svg nodes do not have a className string property;  it will be a
    // SVGAnimatedString. On more modern browsers, we can use the classList property, as it
    // works as expected. Alternatively, when given a svg node we can use className.baseVal
    // just as we would otherwise update a className string.
    //
    // Some reading:
    // - https://github.com/knockout/knockout/pull/1597
    // - http://stackoverflow.com/questions/4118254
    // - http://voormedia.com/blog/2012/10/displaying-and-detecting-support-for-svg-images
    // - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/svg.js
    // - https://github.com/eligrey/classList.js/pull/18
  let svgTag = document.createElementNS && document.createElementNS('http://www.w3.org/2000/svg', 'svg')

  it('should update the class of an SVG tag', function () {
    if (svgTag) {
      let myObservable = observable()
      testNode.innerHTML = "<svg class='Y' data-bind='css: {x: someModelProperty}'></svg>"
      applyBindings({someModelProperty: myObservable}, testNode)
      expect(testNode.children[0].getAttribute('class')).toEqual('Y')
      myObservable(true)
      expect(testNode.children[0].getAttribute('class')).toEqual('Y x')
    }
  })

  it('Should change dynamic CSS class(es) if null is specified', function () {
        // See https://github.com/knockout/knockout/issues/1468
    let observable1 = observable({})
    testNode.innerHTML = "<div class='unrelatedClass1' data-bind='css: someModelProperty'>Hallo</div>"
    applyBindings({ someModelProperty: observable1 }, testNode)
    expect(testNode.children[0].className).toEqual('unrelatedClass1')
    observable1('my-Rule')
    expect(testNode.children[0].className).toEqual('unrelatedClass1 my-Rule')
    observable1(null)
    expect(testNode.children[0].className).toEqual('unrelatedClass1')
    observable1('my-Rule')
    expect(testNode.children[0].className).toEqual('unrelatedClass1 my-Rule')
  })

  it('Should be aliased as class as well as css', function () {
    expect(bindingHandlers['class']).toEqual(bindingHandlers.css)
  })

  it('Should be able to combine "class" and "css" bindings with dynamic and static classes', function () {
        // This test doesn't cover cases where the static and dynamic bindings try to set or unset the same class name
        // because the behavior for that scenario isn't defined.

    let booleanProp = observable(false)
    let stringProp = observable('')
    testNode.innerHTML = "<div class='unrelatedClass' data-bind='css: { staticClass: booleanProp }, class: stringProp'></div>"

    applyBindings({ booleanProp: booleanProp, stringProp: stringProp }, testNode)
    expect(testNode.children[0].className).toEqual('unrelatedClass')

    booleanProp(true)
    expect(testNode.children[0].className).toEqual('unrelatedClass staticClass')

    stringProp('dynamicClass')
    expect(testNode.children[0].className).toEqual('unrelatedClass staticClass dynamicClass')

    booleanProp(false)
    expect(testNode.children[0].className).toEqual('unrelatedClass dynamicClass')
    stringProp(null)
    expect(testNode.children[0].className).toEqual('unrelatedClass')
  })
})
