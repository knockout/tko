import { afterEach, beforeEach, describe, expect, it, jest } from 'bun:test'

import { options, tasks, parseHtmlFragment } from '@tko/utils'

import components from '../dist'

function restoreAfter<T extends object, K extends keyof T>(cleanup: DisposableStack, object: T, propertyName: K) {
  const originalValue = object[propertyName]
  cleanup.defer(() => {
    object[propertyName] = originalValue
  })
}

function useFakeTaskScheduler(cleanup: DisposableStack) {
  restoreAfter(cleanup, options, 'taskScheduler')
  options.taskScheduler = callback => setTimeout(callback, 0)
}

describe('Components: Default loader', function () {
  const testComponentName = 'test-component'
  let cleanup: DisposableStack

  beforeEach(function () {
    cleanup = new DisposableStack()
    jest.useFakeTimers()
    useFakeTaskScheduler(cleanup)
  })

  afterEach(function () {
    expect(tasks.resetForTesting()).toEqual(0)
    cleanup.dispose()
    jest.clearAllTimers()
    jest.clearAllMocks()
    jest.useRealTimers()
    components.unregister(testComponentName)
  })

  it('Allows registration of arbitrary component config objects, reports that they are registered, and allows unregistration', function () {
    components.register(testComponentName, {})

    expect(components.isRegistered(testComponentName)).toBe(true)
    expect(components.isRegistered('other-component')).toBe(false)

    components.unregister(testComponentName, {})
    components.unregister('nonexistent-component', {}) // No error - it's just a no-op, since it's harmless

    expect(components.isRegistered(testComponentName)).toBe(false)
  })

  it('Allows registering component names that may conflict with properties on Object.prototype', function () {
    const prototypeProperty = 'toString'

    expect(components.isRegistered(prototypeProperty)).toBe(false)
    components.register(prototypeProperty, { ignoreCustomElementWarning: true })
    expect(components.isRegistered(prototypeProperty)).toBe(true)

    components.unregister(prototypeProperty)
    expect(components.isRegistered(prototypeProperty)).toBe(false)
  })

  it('Throws if you try to register a component that is already registered', function () {
    components.register(testComponentName, {})

    expect(function () {
      components.register(testComponentName, {})
    }).toThrow()
  })

  it('Throws if you try to register a falsy value', function () {
    expect(function () {
      components.register(testComponentName, null)
    }).toThrow()

    expect(function () {
      components.register(testComponentName, undefined)
    }).toThrow()
  })

  it('getConfig supplies config objects from the in-memory registry', function () {
    let expectedConfig = {},
      didComplete = false

    components.register(testComponentName, expectedConfig)
    components.defaultLoader.getConfig(testComponentName, function (actualConfig) {
      expect(actualConfig).toBe(expectedConfig)
      didComplete = true
    })

    expect(didComplete).toBe(true)
  })

  it('getConfig supplies null for unknown components', function () {
    let didComplete = false

    components.defaultLoader.getConfig(testComponentName, function (actualConfig) {
      expect(actualConfig).toBe(null)
      didComplete = true
    })

    expect(didComplete).toBe(true)
  })

  it('Can load a template and viewmodel simultaneously', function () {
    // Set up a configuration in which both template and viewmodel have to be loaded asynchronously
    let templateProviderCallback,
      viewModelProviderCallback,
      createViewModelFunction = function () {},
      domNodeArray = new Array(),
      didResolveDefinition = false,
      config = { template: { require: 'path/templateModule' }, viewModel: { require: 'path/viewModelModule' } }

    restoreAfter(cleanup, window, 'require')
    window.require = function (modules, callback) {
      expect(modules.length).toBe(1)
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
    const request = beginConfigObject(config, function (definition) {
      didResolveDefinition = true
      expect(definition.template).toBe(domNodeArray)
      expect(definition.createViewModel).toBe(createViewModelFunction)
    })

    // Both modules start loading before either completes
    expect(typeof templateProviderCallback).toBe('function')
    expect(typeof viewModelProviderCallback).toBe('function')

    // When the first one completes, nothing else happens
    viewModelProviderCallback({ createViewModel: createViewModelFunction })
    expect(didResolveDefinition).toBe(false)

    // When the other one completes, the definition is supplied
    templateProviderCallback(domNodeArray)
    finishConfigObject(request)
    expect(didResolveDefinition).toBe(true)
  })

  it('Can resolve templates and viewmodels recursively', function () {
    // Set up a component which is a module in which:
    //  - template is a further module which supplies markup
    //  - viewModel is a further module which supplies a constructor
    mockAmdEnvironment(cleanup, {
      componentmodule: { template: { require: 'templatemodule' }, viewModel: { require: 'viewmodelmodule' } },
      templatemodule: '<div>Hello world</div>',
      viewmodelmodule: {
        viewModel: function (params) {
          this.receivedValue = params.suppliedValue
        }
      }
    })

    // Resolve it all
    finishConfigObject(beginConfigObject({ require: 'componentmodule' }, function (definition) {
      expect(definition.template.length).toBe(1)
      expect(definition.template[0]).toContainText('Hello world')

      const viewModel = definition.createViewModel({ suppliedValue: 12.3 }, null /* componentInfo */)
      expect(viewModel.receivedValue).toBe(12.3)
    }))
  })

  it('Can be asked to resolve a template directly', function () {
    let templateConfig = '<span>Markup string</span><div>More</div>',
      didLoad = false
    components.defaultLoader.loadTemplate('any-component', templateConfig, function (result) {
      expect(result.length).toBe(2)
      expect(result[0].tagName).toBe('SPAN')
      expect(result[1].tagName).toBe('DIV')
      expect(result[0].innerHTML).toBe('Markup string')
      expect(result[1].innerHTML).toBe('More')
      didLoad = true
    })
    expect(didLoad).toBe(true)
  })

  it('Can be asked to resolve a viewmodel directly', function () {
    let testConstructor = function (params) {
        this.suppliedParams = params
      },
      didLoad = false
    components.defaultLoader.loadViewModel('any-component', testConstructor, function (result) {
      // Result is of the form: function(params, componentInfo) { ... }
      const testParams = {},
        resultInstance = result(testParams, null /* componentInfo */)
      expect(resultInstance instanceof testConstructor).toBe(true)
      expect(resultInstance.suppliedParams).toBe(testParams)
      didLoad = true
    })
    expect(didLoad).toBe(true)
  })

  it("Will load templates via 'loadTemplate' on any other registered loader that precedes it", function () {
    const testLoader = {
      loadTemplate: function (componentName, templateConfig, callback) {
        expect(componentName).toBe(testComponentName)
        expect(templateConfig.customThing).toBe(123)
        callback(parseHtmlFragment('<div>Hello world</div>'))
      },
      loadViewModel: function (componentName, viewModelConfig, callback) {
        // Fall through to other loaders
        callback(null)
      }
    }

    restoreAfter(cleanup, components, 'loaders')
    components.loaders = [testLoader, components.defaultLoader]

    const config = {
      template: { customThing: 123 }, // The custom loader understands this format and will handle it
      viewModel: { instance: {} } // The default loader understands this format and will handle it
    }
    finishConfigObject(beginConfigObject(config, function (definition) {
      expect(definition.template.length).toBe(1)
      expect(definition.template[0]).toContainText('Hello world')

      const viewModel = definition.createViewModel(null, null)
      expect(viewModel).toBe(config.viewModel.instance)
    }))
  })

  it("Will load viewmodels via 'loadViewModel' on any other registered loader that precedes it", function () {
    const testParams = {},
      testComponentInfo = {},
      testViewModel = {}
    const testLoader = {
      loadTemplate: function (componentName, templateConfig, callback) {
        // Fall through to other loaders
        callback(null)
      },
      loadViewModel: function (componentName, viewModelConfig, callback) {
        expect(componentName).toBe(testComponentName)
        expect(viewModelConfig.customThing).toBe(456)
        callback(function (params, componentInfo) {
          expect(params).toBe(testParams)
          expect(componentInfo).toBe(testComponentInfo)
          return testViewModel
        })
      }
    }

    restoreAfter(cleanup, components, 'loaders')
    components.loaders = [testLoader, components.defaultLoader]

    const config = {
      template: '<div>Hello world</div>', // The default loader understands this format and will handle it
      viewModel: { customThing: 456 } // The custom loader understands this format and will handle it
    }
    finishConfigObject(beginConfigObject(config, function (definition) {
      expect(definition.template.length).toBe(1)
      expect(definition.template[0]).toContainText('Hello world')

      const viewModel = definition.createViewModel(testParams, testComponentInfo)
      expect(viewModel).toBe(testViewModel)
    }))
  })

  describe('Configuration formats', function () {
    describe('Templates are normalised to arrays of DOM nodes', function () {
      it('Can be configured as a DOM node array', function () {
        const domNodeArray = [document.createElement('div'), document.createElement('p')]
        finishConfigObject(beginConfigObject({ template: domNodeArray }, function (definition) {
          expect(definition.template).toBe(domNodeArray)
        }))
      })

      it('Can be configured as a document fragment', function () {
        const docFrag = document.createDocumentFragment(),
          elem = document.createElement('div')
        docFrag.appendChild(elem)
        finishConfigObject(beginConfigObject({ template: docFrag }, function (definition) {
          expect(definition.template).toEqual([elem])
        }))
      })

      it('Can be configured as a string of markup', function () {
        finishConfigObject(beginConfigObject({ template: '<p>Some text</p><div>More stuff</div>' }, function (definition) {
          // Converts to standard array-of-DOM-nodes format
          expect(definition.template.length).toBe(2)
          expect(definition.template[0].tagName).toBe('P')
          expect(definition.template[0]).toContainText('Some text')
          expect(definition.template[1].tagName).toBe('DIV')
          expect(definition.template[1]).toContainText('More stuff')
        }))
      })

      it('Can be configured as an element ID', function () {
        testTemplateFromElement(
          '<div id="my-container-elem">{0}</div>',
          'my-container-elem',
          function (templateSourceElem) {
            // Doesn't destroy the input element
            expect(templateSourceElem.childNodes.length).toBe(2)
          }
        )
      })

      it('Can be configured as the ID of a <script> element', function () {
        // Special case: the script's text should be interpreted as a markup string
        testTemplateFromElement('<script id="my-script-elem" type="text/html">{0}</script>', 'my-script-elem')
      })

      it('Can be configured as the ID of a <textarea> element', function () {
        // Special case: the textarea's value should be interpreted as a markup string
        testTemplateFromElement('<textarea id="my-textarea-elem">{0}</textarea>', 'my-textarea-elem')
      })

      it('Can be configured as the ID of a <template> element', function () {
        // Special case: the template's .content should be the source of nodes
        document.createElement('template') // Polyfill needed by IE <= 8
        testTemplateFromElement('<template id="my-template-elem">{0}</template>', 'my-template-elem')
      })

      it('Can be configured as a regular element instance', function () {
        testTemplateFromElement('<div>{0}</div>', /* elementId */ null, function (templateSourceElem) {
          // Doesn't destroy the input element
          expect(templateSourceElem.childNodes.length).toBe(2)
        })
      })

      it('Can be configured as a <script> element instance', function () {
        // Special case: the script's text should be interpreted as a markup string
        testTemplateFromElement('<script type="text/html">{0}</script>', /* elementId */ null)
      })

      it('Can be configured as a <textarea> element instance', function () {
        // Special case: the textarea's value should be interpreted as a markup string
        testTemplateFromElement('<textarea>{0}</textarea>', /* elementId */ null)
      })

      it('Can be configured as a <template> element instance', function () {
        // Special case: the template's .content should be the source of nodes
        document.createElement('template') // Polyfill needed by IE <= 8
        testTemplateFromElement('<template>{0}</template>', /* elementId */ null)
      })

      it('Can be configured as an AMD module whose value is a DOM node array', function () {
        const domNodeArray = [document.createElement('div'), document.createElement('p')]
        mockAmdEnvironment(cleanup, { 'some/module/path': domNodeArray })

        finishConfigObject(beginConfigObject({ template: { require: 'some/module/path' } }, function (definition) {
          expect(definition.template).toBe(domNodeArray)
        }))
      })

      it('Can be configured as an AMD module whose value is a document fragment', function () {
        const docFrag = document.createDocumentFragment(),
          elem = document.createElement('div')
        docFrag.appendChild(elem)
        mockAmdEnvironment(cleanup, { 'some/module/path': docFrag })

        finishConfigObject(beginConfigObject({ template: { require: 'some/module/path' } }, function (definition) {
          expect(definition.template).toEqual([elem])
        }))
      })

      it('Can be configured as an AMD module whose value is markup', function () {
        mockAmdEnvironment(cleanup, { 'some/module/path': '<div>Hello world</div><p>The end</p>' })

        finishConfigObject(beginConfigObject({ template: { require: 'some/module/path' } }, function (definition) {
          expect(definition.template.length).toBe(2)
          expect(definition.template[0].tagName).toBe('DIV')
          expect(definition.template[0]).toContainText('Hello world')
          expect(definition.template[1].tagName).toBe('P')
          expect(definition.template[1]).toContainText('The end')
        }))
      })

      // In the future we might also support arbitrary objects acting as component templates,
      // possibly with a config syntax like "template: { custom: arbitraryObject }", which
      // would be passed through (without normalisation) to a custom template engine.
    })

    describe('Viewmodels', function () {
      it('Can be configured as a createViewModel function', function () {
        const createViewModel = function () {}

        finishConfigObject(beginConfigObject({ viewModel: { createViewModel: createViewModel } }, function (definition) {
          expect(definition.createViewModel).toBe(createViewModel)
        }))
      })

      it('Can be configured as a constructor function', function () {
        const myConstructor = function (params) {
          this.receivedValue = params.suppliedValue
        }

        finishConfigObject(beginConfigObject({ viewModel: myConstructor }, function (definition) {
          const viewModel = definition.createViewModel({ suppliedValue: 123 }, null /* componentInfo */)
          expect(viewModel.receivedValue).toBe(123)
        }))
      })

      it('Can be configured as an object instance', function () {
        const myInstance = {}

        finishConfigObject(beginConfigObject({ viewModel: { instance: myInstance } }, function (definition) {
          const viewModel = definition.createViewModel(null /* params */, null /* componentInfo */)
          expect(viewModel).toBe(myInstance)
        }))
      })

      it('Can be configured as an AMD module that supplies a createViewModel factory', function () {
        const createViewModel = function () {}
        mockAmdEnvironment(cleanup, { 'some/module/path': { createViewModel: createViewModel } })

        finishConfigObject(beginConfigObject({ viewModel: { require: 'some/module/path' } }, function (definition) {
          expect(definition.createViewModel).toBe(createViewModel)
        }))
      })

      it('Can be configured as an AMD module that is a constructor function', function () {
        const myConstructor = function (params) {
          this.receivedValue = params.suppliedValue
        }
        mockAmdEnvironment(cleanup, { 'some/module/path': myConstructor })

        finishConfigObject(beginConfigObject({ viewModel: { require: 'some/module/path' } }, function (definition) {
          const viewModel = definition.createViewModel({ suppliedValue: 234 }, null /* componentInfo */)
          expect(viewModel.receivedValue).toBe(234)
        }))
      })

      it('Can be configured as an AMD module that supplies a viewmodel configuration', function () {
        const myConstructor = function (params) {
          this.receivedValue = params.suppliedValue
        }
        mockAmdEnvironment(cleanup, { 'some/module/path': { viewModel: myConstructor } })

        finishConfigObject(beginConfigObject({ viewModel: { require: 'some/module/path' } }, function (definition) {
          const viewModel = definition.createViewModel({ suppliedValue: 345 }, null /* componentInfo */)
          expect(viewModel.receivedValue).toBe(345)
        }))
      })
    })

    describe('Combined viewmodel/templates', function () {
      it('Can be configured as an AMD module', function () {
        const moduleObject = {
          // The module can have any values that are valid as the input to the whole resolution process
          template: [],
          viewModel: function (params) {
            this.receivedValue = params.suppliedValue
          }
        }
        mockAmdEnvironment(cleanup, { 'some/module/path': moduleObject })

        finishConfigObject(beginConfigObject({ require: 'some/module/path' }, function (definition) {
          expect(definition.template).toBe(moduleObject.template)

          const viewModel = definition.createViewModel({ suppliedValue: 567 }, null /* componentInfo */)
          expect(viewModel.receivedValue).toBe(567)
        }))
      })
    })
  })

  function beginConfigObject(configObject, assertionCallback) {
    components.unregister(testComponentName)
    components.register(testComponentName, configObject)

    let didComplete = false
    let loadedDefinition
    components.get(testComponentName, function (definition) {
      loadedDefinition = definition
      assertionCallback(definition)
      didComplete = true
    })

    return {
      get didComplete() {
        return didComplete
      },
      get loadedDefinition() {
        return loadedDefinition
      }
    }
  }

  function finishConfigObject(request) {
    jest.runAllTimers()
    expect(request.didComplete).toBe(true)
    return request.loadedDefinition
  }

  function testTemplateFromElement(wrapperMarkup, elementId, extraAssertsCallback?) {
    const testElem = document.createElement('div')
    const templateMarkup = '<p>Some text</p><div>More stuff</div>'
    document.body.appendChild(testElem) // Needed so it can be found by ID, and because IE<=8 won't parse its .innerHTML properly otherwise
    cleanup.defer(() => {
      if (testElem.parentNode) {
        testElem.parentNode.removeChild(testElem)
      }
    })

    // The 'ignored' prefix is needed for IE <= 8, which silently strips any <script> elements
    // that are not preceded by something else. Nobody knows why.
    testElem.innerHTML = 'ignored' + wrapperMarkup.replace('{0}', templateMarkup)

    // If an element ID is supplied, use that (we're testing selection by ID)
    // otherwise use the element instance itself (we're testing explicitly-supplied element instances)
    const templateElem = testElem.childNodes[1],
      templateConfigValue = elementId || templateElem

    // <textarea> uses its value as the template source, so seed it with the intended markup directly.
    if (templateElem instanceof HTMLTextAreaElement) {
      templateElem.value = templateMarkup
    }

    finishConfigObject(beginConfigObject({ template: { element: templateConfigValue } }, function (definition) {
      // Converts to standard array-of-DOM-nodes format
      expect(definition.template.length).toBe(2)
      expect(definition.template[0].tagName).toBe('P')
      expect(definition.template[0]).toContainText('Some text')
      expect(definition.template[1].tagName).toBe('DIV')
      expect(definition.template[1]).toContainText('More stuff')

      if (extraAssertsCallback) {
        extraAssertsCallback(templateElem)
      }
    }))
  }

  function mockAmdEnvironment(cleanup, definedModules) {
    restoreAfter(cleanup, window, 'require')
    window.require = function (modules, callback) {
      expect(modules.length).toBe(1)
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
