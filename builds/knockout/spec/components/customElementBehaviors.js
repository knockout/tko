function cleanedHtml(node) {
  var html = node.innerHTML.toLowerCase().replace(/\r\n/g, '')
  html = html.replace(/(<!--.*?-->)\s*/g, '$1')
  return html.replace(/ __ko__\d+=\"(ko\d+|null)\"/g, '')
}

function expectHtml(node, expectedHtml) {
  expect(cleanedHtml(node)).to.equal(expectedHtml.replace(/(<!--.*?-->)\s*/g, '$1'))
}

function expectText(node, expectedText, ignoreSpaces) {
  var actualText = (nodeText(node) || '').replace(/\r\n/g, '\n')
  var normalizedExpectedText = expectedText
  if (ignoreSpaces) {
    actualText = actualText.replace(/\s/g, '')
    normalizedExpectedText = expectedText.replace(/\s/g, '')
  }
  expect(actualText).to.equal(normalizedExpectedText)
}

describe('Components: Custom elements', function () {
  var clock, originalTaskScheduler

  beforeEach(function () {
    clock = sinon.useFakeTimers()
    originalTaskScheduler = ko.options.taskScheduler
    ko.options.taskScheduler = function (callback) {
      setTimeout(callback, 0)
    }
    prepareTestNode()
  })

  afterEach(function () {
    expect(ko.tasks.resetForTesting()).to.equal(0)
    ko.options.taskScheduler = originalTaskScheduler
    clock.restore()
    clock = null
    ko.components.unregister('test-component')
  })

  it('Inserts components into custom elements with matching names', function () {
    ko.components.register('test-component', {
      template: 'custom element <span data-bind="text: 123"></span>'
    })
    var initialMarkup = '<div>hello <test-component></test-component></div>'
    testNode.innerHTML = initialMarkup

    // Since components are loaded asynchronously, it doesn't show up synchronously
    ko.applyBindings(null, testNode)
    expectHtml(testNode, initialMarkup)

    // ... but when the component is loaded, it does show up
    clock.tick(1)
    expectHtml(
      testNode,
      '<div>hello <test-component>custom element <span data-bind="text: 123">123</span></test-component></div>'
    )
  })

  it('Inserts components into custom elements with matching non-dashed names', function () {
    if (ieVersion || window.HTMLUnknownElement) {
      // Phantomjs 1.x doesn't include HTMLUnknownElement and will fail this test
      after(function () {
        ko.components.unregister('somefaroutname')
      })
      ko.components.register('somefaroutname', {
        template: 'custom element <span data-bind="text: 123"></span>'
      })
      var initialMarkup = '<div>hello <somefaroutname></somefaroutname></div>'
      testNode.innerHTML = initialMarkup

      // Since components are loaded asynchronously, it doesn't show up synchronously
      ko.applyBindings(null, testNode)
      expectContainHtml(testNode, initialMarkup)

      // ... but when the component is loaded, it does show up
      clock.tick(1)
      expectContainHtml(
        testNode,
        '<div>hello <somefaroutname>custom element <span data-bind="text: 123">123</span></somefaroutname></div>'
      )
    }
  })

  it('Does not insert components into standard elements with matching names', function () {
    after(function () {
      ko.components.unregister('em')
    })
    ko.components.register('em', {
      template: 'custom element <span data-bind="text: 123"></span>'
    })
    var initialMarkup = '<div>hello <em></em></div>'
    testNode.innerHTML = initialMarkup

    ko.applyBindings(null, testNode)
    clock.tick(1)
    expectContainHtml(testNode, initialMarkup)
  })

  it('Is possible to override getComponentNameForNode to determine which component goes into which element', function () {
    ko.components.register('test-component', { template: 'custom element' })
    var componentProvider = ko.options.bindingProviderInstance.providers
      ? ko.options.bindingProviderInstance.providers[0]
      : ko.options.bindingProviderInstance.provider && ko.options.bindingProviderInstance.provider.providers
        ? ko.options.bindingProviderInstance.provider.providers[0]
        : ko.options.bindingProviderInstance
    restoreAfter(componentProvider, 'getComponentNameForNode')

    // Set up a getComponentNameForNode function that maps "A" tags to test-component
    testNode.innerHTML = '<div>hello <a>&nbsp;</a> <b>ignored</b></div>'
    componentProvider.getComponentNameForNode = function (node) {
      return node.tagName === 'A' ? 'test-component' : null
    }

    // See the component show up
    ko.applyBindings(null, testNode)
    clock.tick(1)
    expectContainHtml(testNode, '<div>hello <a>custom element</a> <b>ignored</b></div>')
  })

  it("Is possible to have regular data-bind bindings on a custom element, as long as they don't attempt to control descendants", function () {
    ko.components.register('test-component', { template: 'custom element' })
    testNode.innerHTML = '<test-component data-bind="visible: shouldshow"></test-component>'

    // Bind with a viewmodel that controls visibility
    var viewModel = { shouldshow: ko.observable(true) }
    ko.applyBindings(viewModel, testNode)
    clock.tick(1)
    expectContainHtml(testNode, '<test-component data-bind="visible: shouldshow">custom element</test-component>')
    expect(testNode.childNodes[0].style.display).not.to.equal('none')

    // See that the 'visible' binding still works
    viewModel.shouldshow(false)
    expect(testNode.childNodes[0].style.display).to.equal('none')
    expect(testNode.childNodes[0].innerHTML).to.equal('custom element')
  })

  it('Is not possible to have regular data-bind bindings on a custom element if they also attempt to control descendants', function () {
    ko.components.register('test-component', { template: 'custom element' })
    testNode.innerHTML = '<test-component data-bind="if: true"></test-component>'

    expect(function () {
      ko.applyBindings(null, testNode)
    }).to.throw('Unable to process binding "if"')

    // Even though ko.applyBindings threw an exception, the component still gets bound (asynchronously)
    clock.tick(1)
  })

  it('Is possible to call applyBindings directly on a custom element', function () {
    ko.components.register('test-component', { template: 'custom element' })
    testNode.innerHTML = '<test-component></test-component>'
    var customElem = testNode.childNodes[0]
    expect(customElem.tagName.toLowerCase()).to.equal('test-component')

    ko.applyBindings(null, customElem)
    clock.tick(1)
    expect(customElem.innerHTML).to.equal('custom element')
  })

  it("Throws if you try to duplicate the 'component' binding on a custom element that matches a component", function () {
    ko.components.register('test-component', { template: 'custom element' })
    testNode.innerHTML = '<test-component data-bind="component: {}"></test-component>'

    expect(function () {
      ko.applyBindings(null, testNode)
    }).to.throw('The binding "component" is duplicated by multiple providers')
  })

  it('Is possible to pass literal values', function () {
    var suppliedParams = []
    ko.components.register('test-component', {
      template: 'Ignored',
      viewModel: function (params) {
        suppliedParams.push(params)

        // The raw value for each param is a computed giving the literal value
        ko.utils.objectForEach(params, function (key, value) {
          if (key !== '$raw') {
            expect(ko.isComputed(params.$raw[key])).to.equal(true)
            expect(params.$raw[key]()).to.equal(value)
          }
        })
      }
    })

    testNode.innerHTML =
      '<test-component params="nothing: null, num: 123, bool: true, obj: { abc: 123 }, str: \'mystr\'"></test-component>'
    ko.applyBindings(null, testNode)
    clock.tick(1)

    delete suppliedParams[0].$raw // Don't include '$raw' in the following assertion, as we only want to compare supplied values
    expect(suppliedParams).to.deep.equal([{ nothing: null, num: 123, bool: true, obj: { abc: 123 }, str: 'mystr' }])
  })

  it('Supplies an empty params object (with empty $raw) if a custom element has no params attribute', function () {
    var suppliedParams = []
    ko.components.register('test-component', {
      template: 'Ignored',
      viewModel: function (params) {
        suppliedParams.push(params)
      }
    })

    testNode.innerHTML = '<test-component></test-component>'
    ko.applyBindings(null, testNode)
    clock.tick(1)
    expect(suppliedParams).to.deep.equal([{ $raw: {} }])
  })

  it('Supplies an empty params object (with empty $raw) if a custom element has an empty whitespace params attribute', function () {
    var suppliedParams = []
    ko.components.register('test-component', {
      template: 'Ignored',
      viewModel: function (params) {
        suppliedParams.push(params)
      }
    })

    testNode.innerHTML = '<test-component params=" "></test-component>'
    ko.applyBindings(null, testNode)
    clock.tick(1)
    expect(suppliedParams).to.deep.equal([{ $raw: {} }])
  })

  it('Should not confuse parameters with bindings', function () {
    restoreAfter(ko, 'getBindingHandler')
    var bindings = []
    ko.getBindingHandler = function (bindingKey) {
      bindings.push(bindingKey)
    }

    ko.components.register('test-component', { template: 'Ignored' })
    testNode.innerHTML = '<test-component params="value: value"></test-component>'
    ko.applyBindings({ value: 123 }, testNode)

    clock.tick(1)
    // The only binding it should look up is "component"
    expect(bindings).to.deep.equal(['component'])
  })

  it('Should update component when observable view model changes', function () {
    ko.components.register('test-component', {
      template:
        '<p>the component value: <span data-bind="text: textToShow"></span>, the root value: <span data-bind="text: $root.value"></span></p>'
    })

    testNode.innerHTML = '<test-component params="textToShow: value"></test-component>'
    var vm = ko.observable({ value: 'A' })
    ko.applyBindings(vm, testNode)
    clock.tick(1)
    expectContainText(testNode, 'the component value: A, the root value: A')

    vm({ value: 'Z' })
    // The view-model change updates the old component contents before the new contents get rendered.
    // This is the way it has always worked, but maybe this isn't the best experience
    expectContainText(testNode, 'the component value: A, the root value: Z')

    clock.tick(1)
    expectContainText(testNode, 'the component value: Z, the root value: Z')
  })

  it('Is possible to pass observable instances', function () {
    ko.components.register('test-component', {
      template: '<p>the observable: <span data-bind="text: receivedobservable"></span></p>',
      viewModel: function (params) {
        this.receivedobservable = params.suppliedobservable
        expect(this.receivedobservable.subprop).to.equal('subprop')
        this.dispose = function () {
          this.wasDisposed = true
        }

        // The $raw value for this param is a computed giving the observable instance
        expect(ko.isComputed(params.$raw.suppliedobservable)).to.equal(true)
        expect(params.$raw.suppliedobservable()).to.equal(params.suppliedobservable)
      }
    })

    // See we can supply an observable instance, which is received with no wrapper around it
    var myobservable = ko.observable(1)
    myobservable.subprop = 'subprop'
    testNode.innerHTML = '<test-component params="suppliedobservable: myobservable"></test-component>'
    ko.applyBindings({ myobservable: myobservable }, testNode)
    clock.tick(1)
    var viewModelInstance = ko.dataFor(testNode.firstChild.firstChild)
    expectContainText(testNode.firstChild, 'the observable: 1')

    // See the observable instance can mutate, without causing the component to tear down
    myobservable(2)
    expectContainText(testNode.firstChild, 'the observable: 2')
    expect(ko.dataFor(testNode.firstChild.firstChild)).to.equal(viewModelInstance) // Didn't create a new instance
    expect(viewModelInstance.wasDisposed).not.to.equal(true)
  })

  it('Is possible to pass expressions that can vary observably', function () {
    var rootViewModel = {
        myobservable: ko.observable('Alpha')
      },
      constructorCallCount = 0

    ko.components.register('test-component', {
      template: '<p>the string reversed: <span data-bind="text: receivedobservable"></span></p>',
      viewModel: function (params) {
        constructorCallCount++
        this.receivedobservable = params.suppliedobservable
        this.dispose = function () {
          this.wasDisposed = true
        }

        // See we didn't get the original observable instance. Instead we got a read-only computed property.
        expect(this.receivedobservable).not.to.equal(rootViewModel.myobservable)
        expect(ko.isComputed(this.receivedobservable)).to.equal(true)
        expect(ko.isWritableObservable(this.receivedobservable)).to.equal(false)

        // The $raw value for this param is a computed property whose value is raw result
        // of evaluating the binding value. Since the raw result in this case is itself not
        // observable, it's the same value as the regular (non-$raw) supplied parameter.
        expect(ko.isComputed(params.$raw.suppliedobservable)).to.equal(true)
        expect(params.$raw.suppliedobservable()).to.equal(params.suppliedobservable())
      }
    })

    // Bind, using an expression that evaluates the observable during binding
    testNode.innerHTML =
      '<test-component params=\'suppliedobservable: myobservable().split("").reverse().join("")\'></test-component>'
    ko.applyBindings(rootViewModel, testNode)
    clock.tick(1)
    expectContainText(testNode.firstChild, 'the string reversed: ahplA')
    var componentViewModelInstance = ko.dataFor(testNode.firstChild.firstChild)
    expect(constructorCallCount).to.equal(1)
    expect(rootViewModel.myobservable.getSubscriptionsCount()).to.equal(1)

    // See that mutating the underlying observable modifies the supplied computed property,
    // but doesn't cause the component to tear down
    rootViewModel.myobservable('Beta')
    expectContainText(testNode.firstChild, 'the string reversed: ateB')
    expect(constructorCallCount).to.equal(1)
    expect(ko.dataFor(testNode.firstChild.firstChild)).to.equal(componentViewModelInstance) // No new viewmodel needed
    expect(componentViewModelInstance.wasDisposed).not.to.equal(true)
    expect(rootViewModel.myobservable.getSubscriptionsCount()).to.equal(1) // No extra subscription needed

    // See also that subscriptions to the evaluated observables are disposed
    // when the custom element is cleaned
    ko.cleanNode(testNode)
    expect(componentViewModelInstance.wasDisposed).to.equal(true)
    expect(rootViewModel.myobservable.getSubscriptionsCount()).to.equal(0)
  })

  it('Is possible to pass expressions that can vary observably and evaluate as writable observable instances', function () {
    var constructorCallCount = 0
    ko.components.register('test-component', {
      template: '<input data-bind="value: myval"/>',
      viewModel: function (params) {
        constructorCallCount++
        this.myval = params.somevalue

        // See we received a writable observable
        expect(ko.isWritableObservable(this.myval)).to.equal(true)

        // See we received a computed, not either of the original observables
        expect(ko.isComputed(this.myval)).to.equal(true)

        // See we can reach the original inner observable directly if needed via $raw
        // (e.g., because it has subobservables or similar)
        var originalObservable = params.$raw.somevalue()
        expect(ko.isObservable(originalObservable)).to.equal(true)
        expect(ko.isComputed(originalObservable)).to.equal(false)
        if (originalObservable() === 'inner1') {
          expect(originalObservable).to.equal(innerObservable) // See there's no wrapper
        }
      }
    })

    // Bind to a viewmodel with nested observables; see the expression is evaluated as expected
    // The component itself doesn't have to know or care that the supplied value is nested - the
    // custom element syntax takes care of producing a single computed property that gives the
    // unwrapped inner value.
    var innerObservable = ko.observable('inner1'),
      outerObservable = ko.observable({ inner: innerObservable })
    testNode.innerHTML = '<test-component params="somevalue: outer().inner"></test-component>'
    ko.applyBindings({ outer: outerObservable }, testNode)
    clock.tick(1)
    expect(testNode.childNodes[0].childNodes[0].value).to.deep.equal('inner1')
    expect(outerObservable.getSubscriptionsCount()).to.equal(1)
    expect(innerObservable.getSubscriptionsCount()).to.equal(1)
    expect(constructorCallCount).to.equal(1)

    // See we can mutate the inner value and see the result show up
    innerObservable('inner2')
    expect(testNode.childNodes[0].childNodes[0].value).to.deep.equal('inner2')
    expect(outerObservable.getSubscriptionsCount()).to.equal(1)
    expect(innerObservable.getSubscriptionsCount()).to.equal(1)
    expect(constructorCallCount).to.equal(1)

    // See that we can mutate the observable from within the component
    testNode.childNodes[0].childNodes[0].value = 'inner3'
    ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], 'change')
    expect(innerObservable()).to.deep.equal('inner3')

    // See we can mutate the outer value and see the result show up (cleaning subscriptions to the old inner value)
    var newInnerObservable = ko.observable('newinner')
    outerObservable({ inner: newInnerObservable })
    expect(testNode.childNodes[0].childNodes[0].value).to.deep.equal('newinner')
    expect(outerObservable.getSubscriptionsCount()).to.equal(1)
    expect(innerObservable.getSubscriptionsCount()).to.equal(0)
    expect(newInnerObservable.getSubscriptionsCount()).to.equal(1)
    expect(constructorCallCount).to.equal(1)

    // See that we can mutate the new observable from within the component
    testNode.childNodes[0].childNodes[0].value = 'newinner2'
    ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], 'change')
    expect(newInnerObservable()).to.deep.equal('newinner2')
    expect(innerObservable()).to.deep.equal('inner3') // original one hasn't changed

    // See that subscriptions are disposed when the component is
    ko.cleanNode(testNode)
    expect(outerObservable.getSubscriptionsCount()).to.equal(0)
    expect(innerObservable.getSubscriptionsCount()).to.equal(0)
    expect(newInnerObservable.getSubscriptionsCount()).to.equal(0)
  })

  it('Supplies any custom parameter called "$raw" in preference to the function that yields raw parameter values', function () {
    var constructorCallCount = 0,
      suppliedValue = {}
    ko.components.register('test-component', {
      template: 'Ignored',
      viewModel: function (params) {
        constructorCallCount++
        expect(params.$raw).to.equal(suppliedValue)
      }
    })

    testNode.innerHTML = '<test-component params="$raw: suppliedValue"></test-component>'
    ko.applyBindings({ suppliedValue: suppliedValue }, testNode)
    clock.tick(1)
    expect(constructorCallCount).to.equal(1)
  })

  it('Disposes the component when the custom element is cleaned', function () {
    // This is really a behavior of the component binding, not custom elements.
    // This spec just shows that custom elements don't break it for any reason.
    var componentViewModel = {
      dispose: function () {
        this.wasDisposed = true
      }
    }
    ko.components.register('test-component', {
      template: 'custom element',
      viewModel: { instance: componentViewModel }
    })
    testNode.innerHTML = '<test-component></test-component>'

    // See it binds properly
    ko.applyBindings(null, testNode)
    clock.tick(1)
    expectContainHtml(testNode.firstChild, 'custom element')

    // See the viewmodel is disposed when the corresponding DOM element is
    expect(componentViewModel.wasDisposed).not.to.equal(true)
    ko.cleanNode(testNode.firstChild)
    expect(componentViewModel.wasDisposed).to.equal(true)
  })

  it('Can nest custom elements', function () {
    // Note that, for custom elements to work properly on IE < 9, you *must*:
    // (1) Reference jQuery
    // (2) Register any component that will be used as a custom element
    //     (e.g., ko.components.register(...)) *before* the browser parses any
    //     markup containing that custom element
    //
    // The reason for (2) is the same as the well-known issue that IE < 9 cannot
    // parse markup containing HTML5 elements unless you've already called
    // document.createElement(thatElementName) first. Our old-IE compatibility
    // code causes this to happen automatically for all registered components.
    //
    // The reason for (1) is that KO's built-in simpleHtmlParse logic uses .innerHTML
    // on a <div> that is not attached to any document, which means the trick from
    // (1) does not work. Referencing jQuery overrides the HTML parsing logic to
    // uses jQuery's, which uses a temporary document fragment, and our old-IE compatibility
    // code has patched createDocumentFragment to enable preregistered components
    // to act as custom elements in that document fragment. If we wanted, we could
    // amend simpleHtmlParse to use a document fragment, but it seems unlikely that
    // anyone targetting IE < 9 would not be using jQuery.

    after(function () {
      ko.components.unregister('outer-component')
      ko.components.unregister('inner-component')
    })

    ko.components.register('inner-component', {
      template: 'the inner component with value [<span data-bind="text: innerval"></span>]'
    })
    ko.components.register('outer-component', {
      template: 'the outer component [<inner-component params="innerval: outerval.innerval"></inner-component>] goodbye'
    })
    var initialMarkup = '<div>hello [<outer-component params="outerval: outerval"></outer-component>] world</div>'
    testNode.innerHTML = initialMarkup

    ko.applyBindings({ outerval: { innerval: 'my value' } }, testNode)
    try {
      clock.tick(1)
      expectContainText(
        testNode,
        'hello [the outer component [the inner component with value [my value]] goodbye] world'
      )
    } catch (ex) {
      if (ex.message.indexOf('Unexpected call to method or property access.') >= 0) {
        // On IE < 9, this scenario is only supported if you have referenced jQuery.
        // So don't consider this to be a failure if jQuery isn't referenced.
        if (!window.jQuery) {
          return
        }
      }

      throw ex
    }
  })

  it('Is possible to set up components that receive, inject, and bind templates supplied by the user of the component (sometimes called "templated components" or "transclusion")', function () {
    // This spec repeats assertions made in other specs elsewhere, but is useful to prove the end-to-end technique

    after(function () {
      ko.components.unregister('special-list')
    })

    // First define a reusable 'special-list' component that produces a <ul> in which the <li>s are filled with the supplied template
    // Note: It would be even simpler to write "template: { nodes: $componentTemplateNodes }", which would also work.
    //       However it's useful to have test coverage for the more longwinded approach of passing nodes via your
    //       viewmodel as well, so retaining the longer syntax for this test.
    ko.components.register('special-list', {
      template:
        '<ul class="my-special-list" data-bind="foreach: specialListItems">' +
        '<li data-bind="template: { nodes: $component.suppliedItemTemplate }">' +
        '</li>' +
        '</ul>',
      viewModel: {
        createViewModel: function (params, componentInfo) {
          return {
            specialListItems: params.items,
            suppliedItemTemplate: componentInfo.templateNodes
          }
        }
      }
    })

    // Now make some view markup that uses <special-list> and supplies a template to be used inside each list item
    testNode.innerHTML =
      '<h1>Cheeses</h1>' +
      '<special-list params="items: cheeses">' +
      '<em data-bind="text: name">x</em> has quality <em data-bind="text: quality">x</em>' +
      '</special-list>'

    // Finally, bind it all to some data
    ko.applyBindings(
      {
        cheeses: [
          { name: 'brie', quality: 7 },
          { name: 'cheddar', quality: 9 },
          { name: 'roquefort', quality: 3 }
        ]
      },
      testNode
    )

    clock.tick(1)
    expectContainText(testNode.childNodes[0], 'Cheeses')
    expect(testNode.childNodes[1].childNodes[0].tagName.toLowerCase()).to.deep.equal('ul')
    expect(testNode.childNodes[1].childNodes[0].className).to.deep.equal('my-special-list')
    expectContainHtml(
      testNode.childNodes[1].childNodes[0],
      '<li data-bind="template: { nodes: $component.supplieditemtemplate }">' +
        '<em data-bind="text: name">brie</em> has quality <em data-bind="text: quality">7</em>' +
        '</li>' +
        '<li data-bind="template: { nodes: $component.supplieditemtemplate }">' +
        '<em data-bind="text: name">cheddar</em> has quality <em data-bind="text: quality">9</em>' +
        '</li>' +
        '<li data-bind="template: { nodes: $component.supplieditemtemplate }">' +
        '<em data-bind="text: name">roquefort</em> has quality <em data-bind="text: quality">3</em>' +
        '</li>'
    )
  })

  it('Should call a childrenComplete callback function', function () {
    ko.components.register('test-component', { template: 'custom element' })
    testNode.innerHTML = '<test-component data-bind="childrenComplete: callback"></test-component>'

    var callbacks = 0,
      viewModel = {
        callback: function (nodes, data) {
          expect(nodes.length).to.deep.equal(1)
          expect(nodes[0]).to.deep.equal(testNode.childNodes[0].childNodes[0])
          expect(data).to.deep.equal(undefined)
          callbacks++
        }
      }
    ko.applyBindings(viewModel, testNode)
    expect(callbacks).to.deep.equal(0)

    clock.tick(1)
    expect(callbacks).to.deep.equal(1)
    expectContainHtml(
      testNode,
      '<test-component data-bind="childrencomplete: callback">custom element</test-component>'
    )
  })
})
