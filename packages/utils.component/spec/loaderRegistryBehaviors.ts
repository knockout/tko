import { options, tasks } from '@tko/utils'

import { observable } from '@tko/observable'
import { computed } from '@tko/computed'

import components from '../dist'

import { expect } from 'chai'
import sinon from 'sinon'
import { restoreAfter, useMockForTasks } from '../../utils/helpers/mocha-test-helpers'

describe('Components: Loader registry', function () {
  const testAsyncDelay = 20
  const testComponentName = 'test-component'
  const testComponentConfig: any = {}
  const testComponentDefinition = { template: {} }
  const loaderThatDoesNotReturnAnything = {
    getConfig: function (name, callback) {
      expect(name).to.equal(testComponentName)
      setTimeout(function () {
        callback(null)
      }, testAsyncDelay)
    },
    loadComponent: function (name, config, callback) {
      expect(name).to.equal(testComponentName)
      expect(config).to.equal(testComponentConfig)
      setTimeout(function () {
        callback(null)
      }, testAsyncDelay)
    }
  }
  const loaderThatHasNoHandlers = {}
  const loaderThatReturnsConfig = {
    getConfig: function (name, callback) {
      expect(name).to.equal(testComponentName)
      setTimeout(function () {
        callback(testComponentConfig)
      }, testAsyncDelay)
    }
  }
  const loaderThatReturnsDefinition = {
    loadComponent: function (name, config, callback) {
      expect(name).to.equal(testComponentName)
      expect(config).to.equal(testComponentConfig)
      setTimeout(function () {
        callback(testComponentDefinition)
      }, testAsyncDelay)
    }
  }
  const loaderThatShouldNeverBeCalled = {
    getConfig: function () {
      throw new Error('Should not be called')
    },
    loadComponent: function () {
      throw new Error('Should not be called')
    }
  }
  const loaderThatCompletesSynchronously = {
    getConfig: function (_name, callback) {
      callback(testComponentConfig)
    },
    loadComponent: function (_name, config, callback) {
      expect(config).to.equal(testComponentConfig)
      callback(testComponentDefinition)
    }
  }

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

  it('Exposes the list of loaders as an array', function () {
    expect(components.loaders instanceof Array).to.equal(true)
  })

  it('issues a PEBKAC when a component name does not have a dash', function () {
    const logs: any[] = []
    restoreAfter(cleanups, console, 'log')
    console.log = v => logs.push(v)

    components.register('testname', { template: {} })
    expect(logs.length).to.equal(1)
    expect(logs[0]).to.contain('Knockout warning')

    components.unregister('testname')
  })

  it('does not issue a PEBCAK when `ignoreCustomElementWarning` is true', function () {
    const logs: any[] = []
    restoreAfter(cleanups, console, 'log')
    console.log = v => logs.push(v)

    components.register('testname', { template: {}, ignoreCustomElementWarning: true })
    expect(logs.length).to.equal(0)

    components.unregister('testname')
  })

  it('Obtains component config and component definition objects by invoking each loader in turn, asynchronously, until one supplies a value', function () {
    const request = beginLoaderChain([
      loaderThatDoesNotReturnAnything,
      loaderThatHasNoHandlers,
      loaderThatReturnsDefinition,
      loaderThatDoesNotReturnAnything,
      loaderThatReturnsConfig,
      loaderThatShouldNeverBeCalled
    ])

    clock.runAll()
    expect(request.loadedDefinition).to.equal(testComponentDefinition)
  })

  it('Supplies null if no registered loader returns a config object', function () {
    const request = beginLoaderChain([
      loaderThatDoesNotReturnAnything,
      loaderThatHasNoHandlers,
      loaderThatReturnsDefinition,
      loaderThatDoesNotReturnAnything
    ])

    clock.runAll()
    expect(request.loadedDefinition).to.equal(null)
  })

  it('Supplies null if no registered loader returns a component for a given config object', function () {
    const request = beginLoaderChain([
      loaderThatDoesNotReturnAnything,
      loaderThatHasNoHandlers,
      loaderThatReturnsConfig,
      loaderThatDoesNotReturnAnything
    ])

    clock.runAll()
    expect(request.loadedDefinition).to.equal(null)
  })

  it('Aborts if a getConfig call returns a value other than undefined', function () {
    const request = beginLoaderChain([
      loaderThatReturnsDefinition,
      loaderThatDoesNotReturnAnything,
      {
        getConfig: function (_name, callback) {
          setTimeout(function () {
            callback(testComponentDefinition)
          }, 50)
          return testComponentDefinition
        },
        suppressLoaderExceptions: true
      },
      loaderThatReturnsConfig
    ])

    clock.runAll()
    expect(request.loadedDefinition).to.equal(null)
  })

  it('Aborts if a loadComponent call returns a value other than undefined', function () {
    const request = beginLoaderChain([
      loaderThatReturnsConfig,
      loaderThatDoesNotReturnAnything,
      {
        loadComponent: function (_name, _config, callback) {
          setTimeout(function () {
            callback(testComponentDefinition)
          }, 50)
          return testComponentDefinition
        },
        suppressLoaderExceptions: true
      },
      loaderThatReturnsDefinition
    ])

    clock.runAll()
    expect(request.loadedDefinition).to.equal(null)
  })

  it('Ensures that the loading process completes asynchronously, even if the loader completed synchronously', function () {
    let wasAsync = false

    const request = beginLoaderChain([loaderThatCompletesSynchronously])
    wasAsync = true
    clock.runAll()

    expect(request.loadedDefinition).to.equal(testComponentDefinition)
    expect(wasAsync).to.equal(true)
  })

  it('Supplies component definition synchronously if the "synchronous" flag is provided and the loader completes synchronously', function () {
    restoreAfter(cleanups, components, 'loaders')
    const testSyncComponentConfig = { synchronous: true }
    const testSyncComponentDefinition = {}
    const syncComponentName = 'my-sync-component'
    let getConfigCallCount = 0
    components.loaders = [
      {
        getConfig: function (_name, callback) {
          getConfigCallCount++
          callback(testSyncComponentConfig)
        },
        loadComponent: function (_name, config, callback) {
          expect(config).to.equal(testSyncComponentConfig)
          callback(testSyncComponentDefinition)
        }
      } as any
    ]

    let initialLoadCompletedSynchronously = false
    components.get(syncComponentName, function (definition) {
      expect(definition).to.equal(testSyncComponentDefinition)
      initialLoadCompletedSynchronously = true
    })
    expect(initialLoadCompletedSynchronously).to.equal(true)
    expect(getConfigCallCount).to.equal(1)

    let cachedLoadCompletedSynchronously = false
    components.get(syncComponentName, function (definition) {
      expect(definition).to.equal(testSyncComponentDefinition)
      cachedLoadCompletedSynchronously = true
    })
    expect(cachedLoadCompletedSynchronously).to.equal(true)
    expect(getConfigCallCount).to.equal(1)

    const someObservable = observable('Initial')
    let callbackCount = 0
    computed(function () {
      components.get(syncComponentName, function () {
        callbackCount++
        someObservable()
      })
    })
    expect(callbackCount).to.equal(1)
    someObservable('Modified')
    expect(callbackCount).to.equal(1)
  })

  it('Supplies component definition synchronously if the "synchronous" flag is provided and definition is already cached', function () {
    restoreAfter(cleanups, components, 'loaders')
    cleanups.push(() => {
      delete testComponentConfig.synchronous
    })
    testComponentConfig.synchronous = 'trueish value'
    components.loaders = [loaderThatReturnsConfig as any, loaderThatReturnsDefinition as any]

    let initialLoadWasAsync = false
    const request = beginGetComponentDefinition(testComponentName)
    initialLoadWasAsync = true
    const initialDefinition = finishGetComponentDefinition(request)
    expect(initialLoadWasAsync).to.equal(true)
    expect(initialDefinition).to.equal(testComponentDefinition)

    let cachedLoadWasSynchronous = false
    components.get(testComponentName, function (cachedDefinition) {
      cachedLoadWasSynchronous = true
      expect(cachedDefinition).to.equal(testComponentDefinition)
    })
    expect(cachedLoadWasSynchronous).to.equal(true)
  })

  it('By default, contains only the default loader', function () {
    expect(components.loaders.length).to.equal(1)
    expect(components.loaders[0]).to.equal(components.defaultLoader)
  })

  it('Caches and reuses loaded component definitions', function () {
    cleanups.push(() => components.unregister('some-component'))
    cleanups.push(() => components.unregister('other-component'))

    components.register('some-component', {
      viewModel: function () {
        this.isTheTestComponent = true
      }
    })
    components.register('other-component', {
      viewModel: function () {
        this.isTheOtherComponent = true
      }
    })

    const definition1 = finishGetComponentDefinition(beginGetComponentDefinition('some-component'))
    expect(definition1.createViewModel().isTheTestComponent).to.equal(true)

    finishGetComponentDefinition(beginGetComponentDefinition('some-component'), function (definition2) {
      expect(definition2).to.equal(definition1)
    })

    finishGetComponentDefinition(beginGetComponentDefinition('other-component'), function (otherDefinition) {
      expect(otherDefinition).to.not.equal(definition1)
      expect(otherDefinition.createViewModel().isTheOtherComponent).to.equal(true)
    })

    components.clearCachedDefinition('some-component')
    finishGetComponentDefinition(beginGetComponentDefinition('some-component'), function (definition3) {
      expect(definition3).to.not.equal(definition1)
      expect(definition3.createViewModel().isTheTestComponent).to.equal(true)
    })

    components.unregister('some-component')
    finishGetComponentDefinition(beginGetComponentDefinition('some-component'), function (definition4) {
      expect(definition4).to.equal(null)
    })
  })

  it('Only commences a single loading process, even if multiple requests arrive before loading has completed', function () {
    const someModuleTemplate = new Array()
    const someComponentModule = { template: someModuleTemplate }
    const requireCallLog: string[][] = []
    restoreAfter(cleanups, window as any, 'require')
    ;(window as any).require = function (modules, callback) {
      requireCallLog.push(modules.slice(0))
      setTimeout(function () {
        callback(someComponentModule)
      }, 80)
    }

    components.register(testComponentName, { require: 'path/testcomponent' })

    let definition1
    components.get(testComponentName, function (loadedDefinition) {
      definition1 = loadedDefinition
    })
    expect(requireCallLog).to.deep.equal([['path/testcomponent']])

    let definition2
    clock.tick(20)
    expect(definition1).to.equal(undefined)

    components.get(testComponentName, function (loadedDefinition) {
      definition2 = loadedDefinition
    })
    expect(definition2).to.equal(undefined)
    expect(requireCallLog.length).to.equal(1)

    clock.tick(20)
    expect(definition1).to.equal(undefined)
    expect(definition2).to.equal(undefined)

    clock.runAll()
    expect(definition1.template).to.equal(someModuleTemplate)
    expect(definition2).to.equal(definition1)

    finishGetComponentDefinition(beginGetComponentDefinition(testComponentName), function (definition3) {
      expect(definition3).to.equal(definition1)
      expect(requireCallLog.length).to.equal(1)
    })
  })

  function beginLoaderChain(chain) {
    restoreAfter(cleanups, components, 'loaders')
    components.loaders = chain

    let loadedDefinition: any = 'Not yet loaded'
    components.get(testComponentName, function (definition) {
      loadedDefinition = definition
    })

    return {
      get loadedDefinition() {
        return loadedDefinition
      }
    }
  }

  function beginGetComponentDefinition(componentName: string) {
    let loadedDefinition
    let hasCompleted = false
    components.get(componentName, function (definition) {
      loadedDefinition = definition
      hasCompleted = true
    })
    expect(hasCompleted).to.equal(false)
    return {
      get loadedDefinition() {
        return loadedDefinition
      },
      get hasCompleted() {
        return hasCompleted
      }
    }
  }

  function finishGetComponentDefinition(
    request: { loadedDefinition: any; hasCompleted: boolean },
    assertionCallback?: (definition: any) => void
  ) {
    clock.runAll()
    expect(request.hasCompleted).to.equal(true)
    if (assertionCallback) {
      assertionCallback(request.loadedDefinition)
    }
    return request.loadedDefinition
  }
})
