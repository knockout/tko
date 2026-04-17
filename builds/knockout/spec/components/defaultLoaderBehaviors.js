describe('Components: Default loader', function () {
  var testComponentName = 'test-component'

  afterEach(function () {
    ko.components.unregister(testComponentName)
  })

  it('Allows registration of arbitrary component config objects, reports that they are registered, and allows unregistration', function () {
    ko.components.register(testComponentName, {})

    expect(ko.components.isRegistered(testComponentName)).to.equal(true)
    expect(ko.components.isRegistered('other-component')).to.equal(false)

    ko.components.unregister(testComponentName)
    ko.components.unregister('nonexistent-component') // No error - it's just a no-op, since it's harmless

    expect(ko.components.isRegistered(testComponentName)).to.equal(false)
  })

  it('Allows registering component names that may conflict with properties on Object.prototype', function () {
    var prototypeProperty = 'toString'

    expect(ko.components.isRegistered(prototypeProperty)).to.equal(false)
    ko.components.register(prototypeProperty, {})
    expect(ko.components.isRegistered(prototypeProperty)).to.equal(true)

    ko.components.unregister(prototypeProperty)
    expect(ko.components.isRegistered(prototypeProperty)).to.equal(false)
  })

  it('Throws if you try to register a component that is already registered', function () {
    ko.components.register(testComponentName, {})

    expect(function () {
      ko.components.register(testComponentName, {})
    }).to.throw()
  })

  it('Throws if you try to register a falsy value', function () {
    expect(function () {
      ko.components.register(testComponentName, null)
    }).to.throw()

    expect(function () {
      ko.components.register(testComponentName, undefined)
    }).to.throw()
  })

  it('getConfig supplies config objects from the in-memory registry', function () {
    var expectedConfig = {}

    return new Promise(function (resolve) {
      ko.components.register(testComponentName, expectedConfig)
      ko.components.defaultLoader.getConfig(testComponentName, function (actualConfig) {
        expect(actualConfig).to.equal(expectedConfig)
        resolve()
      })
    })
  })

  it('getConfig supplies null for unknown components', function () {
    return new Promise(function (resolve) {
      ko.components.defaultLoader.getConfig(testComponentName, function (actualConfig) {
        expect(actualConfig).to.equal(null)
        resolve()
      })
    })
  })

  it('Can load a template and viewmodel simultaneously', function () {
    // Set up a configuration in which both template and viewmodel have to be loaded asynchronously
    var templateProviderCallback,
      viewModelProviderCallback,
      createViewModelFunction = function () {},
      domNodeArray = [],
      didResolveDefinition = false,
      config = {
        template: { require: 'path/templateModule' },
        viewModel: { require: 'path/viewModelModule' }
      }

    restoreAfter(window, 'require')
    window.require = function (modules, callback) {
      expect(modules.length).to.equal(1)
      switch (modules[0]) {
        case 'path/templateModule':
          templateProviderCallback = callback
          break
        case 'path/viewModelModule':
          viewModelProviderCallback = callback
          break
        default:
          throw new Error('Unexpected requirement for module ' + modules[0])
      }
    }

    // Start the loading process
    var definitionPromise = testConfigObject(config, function (definition) {
      didResolveDefinition = true
      expect(definition.template).to.equal(domNodeArray)
      expect(definition.createViewModel).to.equal(createViewModelFunction)
    })

    // Both modules start loading before either completes
    expect(typeof templateProviderCallback).to.equal('function')
    expect(typeof viewModelProviderCallback).to.equal('function')

    // When the first one completes, nothing else happens
    viewModelProviderCallback({ createViewModel: createViewModelFunction })
    expect(didResolveDefinition).to.equal(false)

    // When the other one completes, the definition is supplied
    templateProviderCallback(domNodeArray)
    expect(didResolveDefinition).to.equal(true)

    return definitionPromise
  })

  it('Can resolve templates and viewmodels recursively', function () {
    // Set up a component which is a module in which:
    //  - template is a further module which supplies markup
    //  - viewModel is a further module which supplies a constructor
    mockAmdEnvironment(this, {
      componentmodule: {
        template: { require: 'templatemodule' },
        viewModel: { require: 'viewmodelmodule' }
      },
      templatemodule: '<div>Hello world</div>',
      viewmodelmodule: {
        viewModel: function (params) {
          this.receivedValue = params.suppliedValue
        }
      }
    })

    // Resolve it all
    return testConfigObject({ require: 'componentmodule' }, function (definition) {
      expect(definition.template.length).to.equal(1)
      expect(nodeText(definition.template[0])).to.equal('Hello world')

      var viewModel = definition.createViewModel({ suppliedValue: 12.3 }, null /* componentInfo */)
      expect(viewModel.receivedValue).to.equal(12.3)
    })
  })

  it('Can be asked to resolve a template directly', function () {
    var templateConfig = '<span>Markup string</span><div>More</div>',
      didLoad = false
    ko.components.defaultLoader.loadTemplate('any-component', templateConfig, function (result) {
      expect(result.length).to.equal(2)
      expect(result[0].tagName).to.equal('SPAN')
      expect(result[1].tagName).to.equal('DIV')
      expect(result[0].innerHTML).to.equal('Markup string')
      expect(result[1].innerHTML).to.equal('More')
      didLoad = true
    })
    expect(didLoad).to.equal(true)
  })

  it('Can be asked to resolve a viewmodel directly', function () {
    var testConstructor = function (params) {
        this.suppliedParams = params
      },
      didLoad = false
    ko.components.defaultLoader.loadViewModel('any-component', testConstructor, function (result) {
      // Result is of the form: function(params, componentInfo) { ... }
      var testParams = {},
        resultInstance = result(testParams, null /* componentInfo */)
      expect(resultInstance instanceof testConstructor).to.equal(true)
      expect(resultInstance.suppliedParams).to.equal(testParams)
      didLoad = true
    })
    expect(didLoad).to.equal(true)
  })

  it("Will load templates via 'loadTemplate' on any other registered loader that precedes it", function () {
    var testLoader = {
      loadTemplate: function (componentName, templateConfig, callback) {
        expect(componentName).to.equal(testComponentName)
        expect(templateConfig.customThing).to.equal(123)
        callback(ko.utils.parseHtmlFragment('<div>Hello world</div>'))
      },
      loadViewModel: function (componentName, viewModelConfig, callback) {
        // Fall through to other loaders
        callback(null)
      }
    }

    restoreAfter(ko.components, 'loaders')
    ko.components.loaders = [testLoader, ko.components.defaultLoader]

    var config = {
      template: { customThing: 123 }, // The custom loader understands this format and will handle it
      viewModel: { instance: {} } // The default loader understands this format and will handle it
    }
    return testConfigObject(config, function (definition) {
      expect(definition.template.length).to.equal(1)
      expect(nodeText(definition.template[0])).to.equal('Hello world')

      var viewModel = definition.createViewModel(null, null)
      expect(viewModel).to.equal(config.viewModel.instance)
    })
  })

  it("Will load viewmodels via 'loadViewModel' on any other registered loader that precedes it", function () {
    var testParams = {},
      testComponentInfo = {},
      testViewModel = {}
    var testLoader = {
      loadTemplate: function (componentName, templateConfig, callback) {
        // Fall through to other loaders
        callback(null)
      },
      loadViewModel: function (componentName, viewModelConfig, callback) {
        expect(componentName).to.equal(testComponentName)
        expect(viewModelConfig.customThing).to.equal(456)
        callback(function (params, componentInfo) {
          expect(params).to.equal(testParams)
          expect(componentInfo).to.equal(testComponentInfo)
          return testViewModel
        })
      }
    }

    restoreAfter(ko.components, 'loaders')
    ko.components.loaders = [testLoader, ko.components.defaultLoader]

    var config = {
      template: '<div>Hello world</div>', // The default loader understands this format and will handle it
      viewModel: { customThing: 456 } // The custom loader understands this format and will handle it
    }
    return testConfigObject(config, function (definition) {
      expect(definition.template.length).to.equal(1)
      expect(nodeText(definition.template[0])).to.equal('Hello world')

      var viewModel = definition.createViewModel(testParams, testComponentInfo)
      expect(viewModel).to.equal(testViewModel)
    })
  })

  describe('Configuration formats', function () {
    describe('Templates are normalised to arrays of DOM nodes', function () {
      it('Can be configured as a DOM node array', function () {
        var domNodeArray = [document.createElement('div'), document.createElement('p')]
        return testConfigObject({ template: domNodeArray }, function (definition) {
          expect(definition.template).to.equal(domNodeArray)
        })
      })

      it('Can be configured as a document fragment', function () {
        var docFrag = document.createDocumentFragment(),
          elem = document.createElement('div')
        docFrag.appendChild(elem)
        return testConfigObject({ template: docFrag }, function (definition) {
          expect(definition.template).to.deep.equal([elem])
        })
      })

      it('Can be configured as a string of markup', function () {
        return testConfigObject({ template: '<p>Some text</p><div>More stuff</div>' }, function (definition) {
          // Converts to standard array-of-DOM-nodes format
          expect(definition.template.length).to.equal(2)
          expect(definition.template[0].tagName).to.equal('P')
          expect(nodeText(definition.template[0])).to.equal('Some text')
          expect(definition.template[1].tagName).to.equal('DIV')
          expect(nodeText(definition.template[1])).to.equal('More stuff')
        })
      })

      it('Can be configured as an element ID', function () {
        return testTemplateFromElement(
          '<div id="my-container-elem">{0}</div>',
          'my-container-elem',
          function (templateSourceElem) {
            // Doesn't destroy the input element
            expect(templateSourceElem.childNodes.length).to.equal(2)
          }
        )
      })

      it('Can be configured as the ID of a <script> element', function () {
        // Special case: the script's text should be interpreted as a markup string
        return testTemplateFromElement('<script id="my-script-elem" type="text/html">{0}</script>', 'my-script-elem')
      })

      // happy-dom gap: <textarea> content parsing differs from real browsers.
      it.skipIf(isHappyDom())('Can be configured as the ID of a <textarea> element', function () {
        // Special case: the textarea's value should be interpreted as a markup string
        return testTemplateFromElement('<textarea id="my-textarea-elem">{0}</textarea>', 'my-textarea-elem')
      })

      it('Can be configured as the ID of a <template> element', function () {
        // Special case: the template's .content should be the source of nodes
        document.createElement('template') // Polyfill needed by IE <= 8
        return testTemplateFromElement('<template id="my-template-elem">{0}</template>', 'my-template-elem')
      })

      it('Can be configured as a regular element instance', function () {
        return testTemplateFromElement('<div>{0}</div>', /* elementId */ null, function (templateSourceElem) {
          // Doesn't destroy the input element
          expect(templateSourceElem.childNodes.length).to.equal(2)
        })
      })

      it('Can be configured as a <script> element instance', function () {
        // Special case: the script's text should be interpreted as a markup string
        return testTemplateFromElement('<script type="text/html">{0}</script>', /* elementId */ null)
      })

      // happy-dom gap: <textarea> content parsing differs.
      it.skipIf(isHappyDom())('Can be configured as a <textarea> element instance', function () {
        // Special case: the textarea's value should be interpreted as a markup string
        return testTemplateFromElement('<textarea>{0}</textarea>', /* elementId */ null)
      })

      it('Can be configured as a <template> element instance', function () {
        // Special case: the template's .content should be the source of nodes
        document.createElement('template') // Polyfill needed by IE <= 8
        return testTemplateFromElement('<template>{0}</template>', /* elementId */ null)
      })

      it('Can be configured as an AMD module whose value is a DOM node array', function () {
        var domNodeArray = [document.createElement('div'), document.createElement('p')]
        mockAmdEnvironment(this, { 'some/module/path': domNodeArray })

        return testConfigObject({ template: { require: 'some/module/path' } }, function (definition) {
          expect(definition.template).to.equal(domNodeArray)
        })
      })

      it('Can be configured as an AMD module whose value is a document fragment', function () {
        var docFrag = document.createDocumentFragment(),
          elem = document.createElement('div')
        docFrag.appendChild(elem)
        mockAmdEnvironment(this, { 'some/module/path': docFrag })

        return testConfigObject({ template: { require: 'some/module/path' } }, function (definition) {
          expect(definition.template).to.deep.equal([elem])
        })
      })

      it('Can be configured as an AMD module whose value is markup', function () {
        mockAmdEnvironment(this, { 'some/module/path': '<div>Hello world</div><p>The end</p>' })

        return testConfigObject({ template: { require: 'some/module/path' } }, function (definition) {
          expect(definition.template.length).to.equal(2)
          expect(definition.template[0].tagName).to.equal('DIV')
          expect(nodeText(definition.template[0])).to.equal('Hello world')
          expect(definition.template[1].tagName).to.equal('P')
          expect(nodeText(definition.template[1])).to.equal('The end')
        })
      })

      // In the future we might also support arbitrary objects acting as component templates,
      // possibly with a config syntax like "template: { custom: arbitraryObject }", which
      // would be passed through (without normalisation) to a custom template engine.
    })

    describe('Viewmodels', function () {
      it('Can be configured as a createViewModel function', function () {
        var createViewModel = function () {}

        return testConfigObject({ viewModel: { createViewModel: createViewModel } }, function (definition) {
          expect(definition.createViewModel).to.equal(createViewModel)
        })
      })

      it('Can be configured as a constructor function', function () {
        var myConstructor = function (params) {
          this.receivedValue = params.suppliedValue
        }

        return testConfigObject({ viewModel: myConstructor }, function (definition) {
          var viewModel = definition.createViewModel({ suppliedValue: 123 }, null /* componentInfo */)
          expect(viewModel.receivedValue).to.equal(123)
        })
      })

      it('Can be configured as an object instance', function () {
        var myInstance = {}

        return testConfigObject({ viewModel: { instance: myInstance } }, function (definition) {
          var viewModel = definition.createViewModel(null /* params */, null /* componentInfo */)
          expect(viewModel).to.equal(myInstance)
        })
      })

      it('Can be configured as an AMD module that supplies a createViewModel factory', function () {
        var createViewModel = function () {}
        mockAmdEnvironment(this, { 'some/module/path': { createViewModel: createViewModel } })

        return testConfigObject({ viewModel: { require: 'some/module/path' } }, function (definition) {
          expect(definition.createViewModel).to.equal(createViewModel)
        })
      })

      it('Can be configured as an AMD module that is a constructor function', function () {
        var myConstructor = function (params) {
          this.receivedValue = params.suppliedValue
        }
        mockAmdEnvironment(this, { 'some/module/path': myConstructor })

        return testConfigObject({ viewModel: { require: 'some/module/path' } }, function (definition) {
          var viewModel = definition.createViewModel({ suppliedValue: 234 }, null /* componentInfo */)
          expect(viewModel.receivedValue).to.equal(234)
        })
      })

      it('Can be configured as an AMD module that supplies a viewmodel configuration', function () {
        var myConstructor = function (params) {
          this.receivedValue = params.suppliedValue
        }
        mockAmdEnvironment(this, { 'some/module/path': { viewModel: myConstructor } })

        return testConfigObject({ viewModel: { require: 'some/module/path' } }, function (definition) {
          var viewModel = definition.createViewModel({ suppliedValue: 345 }, null /* componentInfo */)
          expect(viewModel.receivedValue).to.equal(345)
        })
      })
    })

    describe('Combined viewmodel/templates', function () {
      it('Can be configured as an AMD module', function () {
        var moduleObject = {
          // The module can have any values that are valid as the input to the whole resolution process
          template: [],
          viewModel: function (params) {
            this.receivedValue = params.suppliedValue
          }
        }
        mockAmdEnvironment(this, { 'some/module/path': moduleObject })

        return testConfigObject({ require: 'some/module/path' }, function (definition) {
          expect(definition.template).to.equal(moduleObject.template)

          var viewModel = definition.createViewModel({ suppliedValue: 567 }, null /* componentInfo */)
          expect(viewModel.receivedValue).to.equal(567)
        })
      })
    })
  })

  function testConfigObject(configObject, assertionCallback) {
    ko.components.unregister(testComponentName)
    ko.components.register(testComponentName, configObject)

    return new Promise(function (resolve, reject) {
      ko.components.get(testComponentName, function (definition) {
        try {
          assertionCallback(definition)
          resolve(definition)
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  function testTemplateFromElement(wrapperMarkup, elementId, extraAssertsCallback) {
    var testElem = document.createElement('div')
    document.body.appendChild(testElem) // Needed so it can be found by ID, and because IE<=8 won't parse its .innerHTML properly otherwise

    // The 'ignored' prefix is needed for IE <= 8, which silently strips any <script> elements
    // that are not preceded by something else. Nobody knows why.
    testElem.innerHTML = 'ignored' + wrapperMarkup.replace('{0}', '<p>Some text</p><div>More stuff</div>')

    // If an element ID is supplied, use that (we're testing selection by ID)
    // otherwise use the element instance itself (we're testing explicitly-supplied element instances)
    var templateElem = testElem.childNodes[1],
      templateConfigValue = elementId || templateElem

    return testConfigObject({ template: { element: templateConfigValue } }, function (definition) {
      try {
        // Converts to standard array-of-DOM-nodes format
        expect(definition.template.length).to.equal(2)
        expect(definition.template[0].tagName).to.equal('P')
        expect(nodeText(definition.template[0])).to.equal('Some text')
        expect(definition.template[1].tagName).to.equal('DIV')
        expect(nodeText(definition.template[1])).to.equal('More stuff')

        if (extraAssertsCallback) {
          extraAssertsCallback(templateElem)
        }
      } finally {
        if (testElem.parentNode) {
          testElem.parentNode.removeChild(testElem)
        }
      }
    })
  }

  function mockAmdEnvironment(spec, definedModules) {
    restoreAfter(window, 'require')
    window.require = function (modules, callback) {
      expect(modules.length).to.equal(1)
      if (modules[0] in definedModules) {
        setTimeout(function () {
          callback(definedModules[modules[0]])
        }, 20)
      } else {
        throw new Error('Undefined module: ' + modules[0])
      }
    }
  }
})
