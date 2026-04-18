import { options, tasks, parseHtmlFragment } from '@tko/utils'

import components from '../dist'

import { expect } from 'chai'
import sinon from 'sinon'
import { expectContainText, restoreAfter, useMockForTasks } from '../../utils/helpers/mocha-test-helpers'
import { isHappyDom } from '../../utils/helpers/test-env'

describe('Components: Default loader', function () {
  const testComponentName = 'test-component'
  let clock: sinon.SinonFakeTimers
  let cleanups: Array<() => void>

  beforeEach(function () {
    cleanups = []
    clock = sinon.useFakeTimers()
    useMockForTasks(cleanups)
  })

  afterEach(function () {
    expect(tasks.resetForTesting()).to.equal(0)
    while (cleanups.length) {
      cleanups.pop()!()
    }
    clock.restore()
    components.unregister(testComponentName)
  })

  it('Allows registration of arbitrary component config objects, reports that they are registered, and allows unregistration', function () {
    components.register(testComponentName, {})

    expect(components.isRegistered(testComponentName)).to.equal(true)
    expect(components.isRegistered('other-component')).to.equal(false)

    components.unregister(testComponentName, {})
    components.unregister('nonexistent-component', {})

    expect(components.isRegistered(testComponentName)).to.equal(false)
  })

  it('Allows registering component names that may conflict with properties on Object.prototype', function () {
    const prototypeProperty = 'toString'

    expect(components.isRegistered(prototypeProperty)).to.equal(false)
    components.register(prototypeProperty, { ignoreCustomElementWarning: true })
    expect(components.isRegistered(prototypeProperty)).to.equal(true)

    components.unregister(prototypeProperty)
    expect(components.isRegistered(prototypeProperty)).to.equal(false)
  })

  it('Throws if you try to register a component that is already registered', function () {
    components.register(testComponentName, {})

    expect(function () {
      components.register(testComponentName, {})
    }).to.throw()
  })

  it('Throws if you try to register a falsy value', function () {
    expect(function () {
      components.register(testComponentName, null as any)
    }).to.throw()

    expect(function () {
      components.register(testComponentName, undefined as any)
    }).to.throw()
  })

  it('getConfig supplies config objects from the in-memory registry', function () {
    const expectedConfig = {}
    let didComplete = false

    components.register(testComponentName, expectedConfig)
    components.defaultLoader.getConfig(testComponentName, function (actualConfig) {
      expect(actualConfig).to.equal(expectedConfig)
      didComplete = true
    })

    expect(didComplete).to.equal(true)
  })

  it('getConfig supplies null for unknown components', function () {
    let didComplete = false

    components.defaultLoader.getConfig(testComponentName, function (actualConfig) {
      expect(actualConfig).to.equal(null)
      didComplete = true
    })

    expect(didComplete).to.equal(true)
  })

  it('Can load a template and viewmodel simultaneously', function () {
    let templateProviderCallback: (value: any) => void
    let viewModelProviderCallback: (value: any) => void
    const createViewModelFunction = function () {}
    const domNodeArray = new Array()
    let didResolveDefinition = false
    const config = { template: { require: 'path/templateModule' }, viewModel: { require: 'path/viewModelModule' } }

    restoreAfter(cleanups, window as any, 'require')
    ;(window as any).require = function (modules, callback) {
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

    const request = beginConfigObject(config, function (definition) {
      didResolveDefinition = true
      expect(definition.template).to.equal(domNodeArray)
      expect(definition.createViewModel).to.equal(createViewModelFunction)
    })

    expect(typeof templateProviderCallback!).to.equal('function')
    expect(typeof viewModelProviderCallback!).to.equal('function')

    viewModelProviderCallback!({ createViewModel: createViewModelFunction })
    expect(didResolveDefinition).to.equal(false)

    templateProviderCallback!(domNodeArray)
    finishConfigObject(request)
    expect(didResolveDefinition).to.equal(true)
  })

  it('Can resolve templates and viewmodels recursively', function () {
    mockAmdEnvironment(cleanups, {
      componentmodule: { template: { require: 'templatemodule' }, viewModel: { require: 'viewmodelmodule' } },
      templatemodule: '<div>Hello world</div>',
      viewmodelmodule: {
        viewModel: function (params) {
          this.receivedValue = params.suppliedValue
        }
      }
    })

    testConfigObject({ require: 'componentmodule' }, function (definition) {
      expect(definition.template.length).to.equal(1)
      expectContainText(definition.template[0], 'Hello world')

      const viewModel = definition.createViewModel({ suppliedValue: 12.3 }, null)
      expect(viewModel.receivedValue).to.equal(12.3)
    })
  })

  it('Can be asked to resolve a template directly', function () {
    const templateConfig = '<span>Markup string</span><div>More</div>'
    let didLoad = false
    components.defaultLoader.loadTemplate('any-component', templateConfig, function (result) {
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
    const testConstructor = function (params) {
      this.suppliedParams = params
    }
    let didLoad = false
    components.defaultLoader.loadViewModel('any-component', testConstructor as any, function (result) {
      const testParams = {}
      const resultInstance = result(testParams, null)
      expect(resultInstance instanceof (testConstructor as any)).to.equal(true)
      expect(resultInstance.suppliedParams).to.equal(testParams)
      didLoad = true
    })
    expect(didLoad).to.equal(true)
  })

  it("Will load templates via 'loadTemplate' on any other registered loader that precedes it", function () {
    const testLoader = {
      loadTemplate: function (componentName, templateConfig, callback) {
        expect(componentName).to.equal(testComponentName)
        expect(templateConfig.customThing).to.equal(123)
        callback(parseHtmlFragment('<div>Hello world</div>'))
      },
      loadViewModel: function (_componentName, _viewModelConfig, callback) {
        callback(null)
      }
    }

    restoreAfter(cleanups, components, 'loaders')
    components.loaders = [testLoader as any, components.defaultLoader]

    const config = { template: { customThing: 123 }, viewModel: { instance: {} } }
    testConfigObject(config, function (definition) {
      expect(definition.template.length).to.equal(1)
      expectContainText(definition.template[0], 'Hello world')

      const viewModel = definition.createViewModel(null, null)
      expect(viewModel).to.equal(config.viewModel.instance)
    })
  })

  it("Will load viewmodels via 'loadViewModel' on any other registered loader that precedes it", function () {
    const testParams = {}
    const testComponentInfo = {}
    const testViewModel = {}
    const testLoader = {
      loadTemplate: function (_componentName, _templateConfig, callback) {
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

    restoreAfter(cleanups, components, 'loaders')
    components.loaders = [testLoader as any, components.defaultLoader]

    const config = { template: '<div>Hello world</div>', viewModel: { customThing: 456 } }
    testConfigObject(config, function (definition) {
      expect(definition.template.length).to.equal(1)
      expectContainText(definition.template[0], 'Hello world')

      const viewModel = definition.createViewModel(testParams, testComponentInfo)
      expect(viewModel).to.equal(testViewModel)
    })
  })

  describe('Configuration formats', function () {
    describe('Templates are normalised to arrays of DOM nodes', function () {
      it('Can be configured as a DOM node array', function () {
        const domNodeArray = [document.createElement('div'), document.createElement('p')]
        testConfigObject({ template: domNodeArray }, function (definition) {
          expect(definition.template).to.equal(domNodeArray)
        })
      })

      it('Can be configured as a document fragment', function () {
        const docFrag = document.createDocumentFragment()
        const elem = document.createElement('div')
        docFrag.appendChild(elem)
        testConfigObject({ template: docFrag }, function (definition) {
          expect(definition.template).to.deep.equal([elem])
        })
      })

      it('Can be configured as a string of markup', function () {
        testConfigObject({ template: '<p>Some text</p><div>More stuff</div>' }, function (definition) {
          expect(definition.template.length).to.equal(2)
          expect(definition.template[0].tagName).to.equal('P')
          expectContainText(definition.template[0], 'Some text')
          expect(definition.template[1].tagName).to.equal('DIV')
          expectContainText(definition.template[1], 'More stuff')
        })
      })

      it('Can be configured as an element ID', function () {
        testTemplateFromElement(
          '<div id="my-container-elem">{0}</div>',
          'my-container-elem',
          function (templateSourceElem) {
            expect(templateSourceElem.childNodes.length).to.equal(2)
          }
        )
      })

      it('Can be configured as the ID of a <script> element', function () {
        testTemplateFromElement('<script id="my-script-elem" type="text/html">{0}</script>', 'my-script-elem')
      })

      // happy-dom gap: <textarea> content parsing/child-node handling differs,
      // producing a single text child where real browsers produce a two-node template.
      ;(isHappyDom() ? it.skip : it)('Can be configured as the ID of a <textarea> element', function () {
        testTemplateFromElement('<textarea id="my-textarea-elem">{0}</textarea>', 'my-textarea-elem')
      })

      it('Can be configured as the ID of a <template> element', function () {
        document.createElement('template')
        testTemplateFromElement('<template id="my-template-elem">{0}</template>', 'my-template-elem')
      })

      it('Can be configured as a regular element instance', function () {
        testTemplateFromElement('<div>{0}</div>', null, function (templateSourceElem) {
          expect(templateSourceElem.childNodes.length).to.equal(2)
        })
      })

      it('Can be configured as a <script> element instance', function () {
        testTemplateFromElement('<script type="text/html">{0}</script>', null)
      })

      // happy-dom gap: <textarea> content parsing/child-node handling differs.
      ;(isHappyDom() ? it.skip : it)('Can be configured as a <textarea> element instance', function () {
        testTemplateFromElement('<textarea>{0}</textarea>', null)
      })

      it('Can be configured as a <template> element instance', function () {
        document.createElement('template')
        testTemplateFromElement('<template>{0}</template>', null)
      })

      it('Can be configured as an AMD module whose value is a DOM node array', function () {
        const domNodeArray = [document.createElement('div'), document.createElement('p')]
        mockAmdEnvironment(cleanups, { 'some/module/path': domNodeArray })

        testConfigObject({ template: { require: 'some/module/path' } }, function (definition) {
          expect(definition.template).to.equal(domNodeArray)
        })
      })

      it('Can be configured as an AMD module whose value is a document fragment', function () {
        const docFrag = document.createDocumentFragment()
        const elem = document.createElement('div')
        docFrag.appendChild(elem)
        mockAmdEnvironment(cleanups, { 'some/module/path': docFrag })

        testConfigObject({ template: { require: 'some/module/path' } }, function (definition) {
          expect(definition.template).to.deep.equal([elem])
        })
      })

      it('Can be configured as an AMD module whose value is markup', function () {
        mockAmdEnvironment(cleanups, { 'some/module/path': '<div>Hello world</div><p>The end</p>' })

        testConfigObject({ template: { require: 'some/module/path' } }, function (definition) {
          expect(definition.template.length).to.equal(2)
          expect(definition.template[0].tagName).to.equal('DIV')
          expectContainText(definition.template[0], 'Hello world')
          expect(definition.template[1].tagName).to.equal('P')
          expectContainText(definition.template[1], 'The end')
        })
      })
    })

    describe('Viewmodels', function () {
      it('Can be configured as a createViewModel function', function () {
        const createViewModel = function () {}

        testConfigObject({ viewModel: { createViewModel: createViewModel } }, function (definition) {
          expect(definition.createViewModel).to.equal(createViewModel)
        })
      })

      it('Can be configured as a constructor function', function () {
        const myConstructor = function (params) {
          this.receivedValue = params.suppliedValue
        }

        testConfigObject({ viewModel: myConstructor }, function (definition) {
          const viewModel = definition.createViewModel({ suppliedValue: 123 }, null)
          expect(viewModel.receivedValue).to.equal(123)
        })
      })

      it('Can be configured as an object instance', function () {
        const myInstance = {}

        testConfigObject({ viewModel: { instance: myInstance } }, function (definition) {
          const viewModel = definition.createViewModel(null, null)
          expect(viewModel).to.equal(myInstance)
        })
      })

      it('Can be configured as an AMD module that supplies a createViewModel factory', function () {
        const createViewModel = function () {}
        mockAmdEnvironment(cleanups, { 'some/module/path': { createViewModel: createViewModel } })

        testConfigObject({ viewModel: { require: 'some/module/path' } }, function (definition) {
          expect(definition.createViewModel).to.equal(createViewModel)
        })
      })

      it('Can be configured as an AMD module that is a constructor function', function () {
        const myConstructor = function (params) {
          this.receivedValue = params.suppliedValue
        }
        mockAmdEnvironment(cleanups, { 'some/module/path': myConstructor })

        testConfigObject({ viewModel: { require: 'some/module/path' } }, function (definition) {
          const viewModel = definition.createViewModel({ suppliedValue: 234 }, null)
          expect(viewModel.receivedValue).to.equal(234)
        })
      })

      it('Can be configured as an AMD module that supplies a viewmodel configuration', function () {
        const myConstructor = function (params) {
          this.receivedValue = params.suppliedValue
        }
        mockAmdEnvironment(cleanups, { 'some/module/path': { viewModel: myConstructor } })

        testConfigObject({ viewModel: { require: 'some/module/path' } }, function (definition) {
          const viewModel = definition.createViewModel({ suppliedValue: 345 }, null)
          expect(viewModel.receivedValue).to.equal(345)
        })
      })
    })

    describe('Combined viewmodel/templates', function () {
      it('Can be configured as an AMD module', function () {
        const moduleObject = {
          template: [],
          viewModel: function (params) {
            this.receivedValue = params.suppliedValue
          }
        }
        mockAmdEnvironment(cleanups, { 'some/module/path': moduleObject })

        testConfigObject({ require: 'some/module/path' }, function (definition) {
          expect(definition.template).to.equal(moduleObject.template)

          const viewModel = definition.createViewModel({ suppliedValue: 567 }, null)
          expect(viewModel.receivedValue).to.equal(567)
        })
      })
    })
  })

  function beginConfigObject(configObject, assertionCallback: (definition: any) => void) {
    components.unregister(testComponentName)
    components.register(testComponentName, configObject)

    let didComplete = false
    components.get(testComponentName, function (definition) {
      assertionCallback(definition)
      didComplete = true
    })

    return {
      get didComplete() {
        return didComplete
      }
    }
  }

  function finishConfigObject(request: { didComplete: boolean }) {
    clock.runAll()
    expect(request.didComplete).to.equal(true)
  }

  function testConfigObject(configObject, assertionCallback: (definition: any) => void) {
    finishConfigObject(beginConfigObject(configObject, assertionCallback))
  }

  function testTemplateFromElement(
    wrapperMarkup: string,
    elementId: string | null,
    extraAssertsCallback?: (templateElem: ChildNode) => void
  ) {
    const testElem = document.createElement('div')
    document.body.appendChild(testElem)
    testElem.innerHTML = 'ignored' + wrapperMarkup.replace('{0}', '<p>Some text</p><div>More stuff</div>')

    const templateElem = testElem.childNodes[1]
    const templateConfigValue = elementId || templateElem

    testConfigObject({ template: { element: templateConfigValue } }, function (definition) {
      expect(definition.template.length).to.equal(2)
      expect(definition.template[0].tagName).to.equal('P')
      expectContainText(definition.template[0], 'Some text')
      expect(definition.template[1].tagName).to.equal('DIV')
      expectContainText(definition.template[1], 'More stuff')

      if (extraAssertsCallback) {
        extraAssertsCallback(templateElem)
      }
    })

    if (testElem.parentNode) {
      testElem.parentNode.removeChild(testElem)
    }
  }

  function mockAmdEnvironment(cleanups: Array<() => void>, definedModules) {
    restoreAfter(cleanups, window as any, 'require')
    ;(window as any).require = function (modules, callback) {
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
