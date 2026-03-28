import { afterEach, beforeEach, describe, expect, it, jest } from 'bun:test'

import { options, tasks } from '@tko/utils'

import { observable } from '@tko/observable'

import { computed } from '@tko/computed'

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

describe('Components: Loader registry', function () {
  const testAsyncDelay = 20,
    testComponentName = 'test-component',
    testComponentConfig: any = {},
    testComponentDefinition = { template: {} },
    loaderThatDoesNotReturnAnything = {
      getConfig: function (name, callback) {
        expect(name).toBe(testComponentName)
        setTimeout(function () {
          callback(null)
        }, testAsyncDelay)
      },
      loadComponent: function (name, config, callback) {
        expect(name).toBe(testComponentName)
        expect(config).toBe(testComponentConfig)
        setTimeout(function () {
          callback(null)
        }, testAsyncDelay)
      }
    },
    loaderThatHasNoHandlers = {},
    loaderThatReturnsConfig = {
      getConfig: function (name, callback) {
        expect(name).toBe(testComponentName)
        setTimeout(function () {
          callback(testComponentConfig)
        }, testAsyncDelay)
      }
    },
    loaderThatReturnsDefinition = {
      loadComponent: function (name, config, callback) {
        expect(name).toBe(testComponentName)
        expect(config).toBe(testComponentConfig)
        setTimeout(function () {
          callback(testComponentDefinition)
        }, testAsyncDelay)
      }
    },
    loaderThatShouldNeverBeCalled = {
      getConfig: function () {
        throw new Error('Should not be called')
      },
      loadComponent: function () {
        throw new Error('Should not be called')
      }
    },
    loaderThatCompletesSynchronously = {
      getConfig: function (name, callback) {
        callback(testComponentConfig)
      },
      loadComponent: function (name, config, callback) {
        expect(config).toBe(testComponentConfig)
        callback(testComponentDefinition)
      }
    }
  let cleanup: DisposableStack

  beforeEach(function () {
    cleanup = new DisposableStack()
    jest.useFakeTimers()
    useFakeTaskScheduler(cleanup)
  })

  const beginLoaderChain = function (chain) {
      restoreAfter(cleanup, components, 'loaders')

      // Set up a chain of loaders, then query it
      components.loaders = chain

      let loadedDefinition = 'Not yet loaded'
      components.get(testComponentName, function (definition) {
        loadedDefinition = definition
      })

      return {
        get loadedDefinition() {
          return loadedDefinition
        }
      }
    }

  afterEach(function () {
    expect(tasks.resetForTesting()).toEqual(0)
    cleanup.dispose()
    jest.clearAllTimers()
    jest.clearAllMocks()
    jest.useRealTimers()
    components.unregister(testComponentName)
  })

  it('Exposes the list of loaders as an array', function () {
    expect(components.loaders instanceof Array).toBe(true)
  })

  it('issues a PEBKAC when a component name does not have a dash', function () {
    const logs = new Array()
    restoreAfter(cleanup, console, 'log')
    console.log = v => logs.push(v)

    components.register('testname', { template: {} })
    expect(logs.length).toEqual(1)
    expect(logs[0]).toContain('Knockout warning')

    components.unregister('testname')
  })

  it('does not issue a PEBCAK when `ignoreCustomElementWarning` is true', function () {
    const logs = new Array()
    restoreAfter(cleanup, console, 'log')
    console.log = v => logs.push(v)

    components.register('testname', { template: {}, ignoreCustomElementWarning: true })
    expect(logs.length).toEqual(0)

    components.unregister('testname')
  })

  it('Obtains component config and component definition objects by invoking each loader in turn, asynchronously, until one supplies a value', function () {
    const loaders = [
      loaderThatDoesNotReturnAnything,
      loaderThatHasNoHandlers,
      loaderThatReturnsDefinition,
      loaderThatDoesNotReturnAnything,
      loaderThatReturnsConfig,
      loaderThatShouldNeverBeCalled
    ]

    const request = beginLoaderChain(loaders)
    jest.runAllTimers()
    expect(request.loadedDefinition).toBe(testComponentDefinition)
  })

  it('Supplies null if no registered loader returns a config object', function () {
    const loaders = [
      loaderThatDoesNotReturnAnything,
      loaderThatHasNoHandlers,
      loaderThatReturnsDefinition,
      loaderThatDoesNotReturnAnything
    ]

    const request = beginLoaderChain(loaders)
    jest.runAllTimers()
    expect(request.loadedDefinition).toBe(null)
  })

  it('Supplies null if no registered loader returns a component for a given config object', function () {
    const loaders = [
      loaderThatDoesNotReturnAnything,
      loaderThatHasNoHandlers,
      loaderThatReturnsConfig,
      loaderThatDoesNotReturnAnything
    ]

    const request = beginLoaderChain(loaders)
    jest.runAllTimers()
    expect(request.loadedDefinition).toBe(null)
  })

  it('Aborts if a getConfig call returns a value other than undefined', function () {
    // This is just to leave open the option to support synchronous return values in the future.
    // We would detect that a getConfig call wants to return synchronously based on getting a
    // non-undefined return value, and in that case would not wait for the callback.

    const loaders = [
      loaderThatReturnsDefinition,
      loaderThatDoesNotReturnAnything,
      {
        getConfig: function (name, callback) {
          setTimeout(function () {
            callback(testComponentDefinition)
          }, 50)
          return testComponentDefinition // This is what's not allowed
        },

        // Unfortunately there's no way to catch the async exception, and we don't
        // want to clutter up the console during tests, so suppress this
        suppressLoaderExceptions: true
      },
      loaderThatReturnsConfig
    ]

    const request = beginLoaderChain(loaders)
    jest.runAllTimers()
    expect(request.loadedDefinition).toBe(null)
  })

  it('Aborts if a loadComponent call returns a value other than undefined', function () {
    // This is just to leave open the option to support synchronous return values in the future.
    // We would detect that a loadComponent call wants to return synchronously based on getting a
    // non-undefined return value, and in that case would not wait for the callback.

    const loaders = [
      loaderThatReturnsConfig,
      loaderThatDoesNotReturnAnything,
      {
        loadComponent: function (name, config, callback) {
          setTimeout(function () {
            callback(testComponentDefinition)
          }, 50)
          return testComponentDefinition // This is what's not allowed
        },

        // Unfortunately there's no way to catch the async exception, and we don't
        // want to clutter up the console during tests, so suppress this
        suppressLoaderExceptions: true
      },
      loaderThatReturnsDefinition
    ]

    const request = beginLoaderChain(loaders)
    jest.runAllTimers()
    expect(request.loadedDefinition).toBe(null)
  })

  it('Ensures that the loading process completes asynchronously, even if the loader completed synchronously', function () {
    // This behavior is for consistency. Developers calling components.get shouldn't have to
    // be concerned about whether the callback fires before or after their next line of code.

    let wasAsync = false

    const request = beginLoaderChain([loaderThatCompletesSynchronously])
    wasAsync = true
    jest.runAllTimers()
    expect(request.loadedDefinition).toBe(testComponentDefinition)
    expect(wasAsync).toBe(true)
  })

  it('Supplies component definition synchronously if the "synchronous" flag is provided and the loader completes synchronously', function () {
    // Set up a synchronous loader that returns a component marked as synchronous
    restoreAfter(cleanup, components, 'loaders')
    let testSyncComponentConfig = { synchronous: true },
      testSyncComponentDefinition = {},
      syncComponentName = 'my-sync-component',
      getConfigCallCount = 0
    components.loaders = [
      {
        getConfig: function (name, callback) {
          getConfigCallCount++
          callback(testSyncComponentConfig)
        },
        loadComponent: function (name, config, callback) {
          expect(config).toBe(testSyncComponentConfig)
          callback(testSyncComponentDefinition)
        }
      }
    ]

    // See that the initial load can complete synchronously
    let initialLoadCompletedSynchronously = false
    components.get(syncComponentName, function (definition) {
      expect(definition).toBe(testSyncComponentDefinition)
      initialLoadCompletedSynchronously = true
    })
    expect(initialLoadCompletedSynchronously).toBe(true)
    expect(getConfigCallCount).toBe(1)

    // See that subsequent cached loads can complete synchronously
    let cachedLoadCompletedSynchronously = false
    components.get(syncComponentName, function (definition) {
      expect(definition).toBe(testSyncComponentDefinition)
      cachedLoadCompletedSynchronously = true
    })
    expect(cachedLoadCompletedSynchronously).toBe(true)
    expect(getConfigCallCount).toBe(1) // Was cached, so no extra loads

    // See that, if you use components.get synchronously from inside a computed,
    // it ignores dependencies read inside the callback. That is, the callback only
    // fires once even if something it accesses changes.
    // This represents @lavimc's comment on https://github.com/knockout/knockout/commit/ee6df1398e08e9cc85a7a90497b6d043562d0ed0
    // This behavior might be debatable, since conceivably you might want your computed to
    // react to observables accessed within the synchronous callback. However, developers
    // are at risk of bugs if they do that, because the callback might always fire async
    // if the component isn't yet loaded, then their computed would die early. The argument for
    // this behavior, then, is that it prevents a really obscure and hard-to-repro race condition
    // bug by stopping developers from relying on synchronous dependency detection here at all.
    let someObservable = observable('Initial'),
      callbackCount = 0
    computed(function () {
      components.get(syncComponentName, function (/* definition */) {
        callbackCount++
        someObservable()
      })
    })
    expect(callbackCount).toBe(1)
    someObservable('Modified')
    expect(callbackCount).toBe(1) // No extra callback
  })

  it('Supplies component definition synchronously if the "synchronous" flag is provided and definition is already cached', function () {
    // Set up an asynchronous loader chain that returns a component marked as synchronous
    restoreAfter(cleanup, components, 'loaders')
    cleanup.defer(() => {
      delete testComponentConfig.synchronous
    })
    testComponentConfig.synchronous = 'trueish value'
    components.loaders = [loaderThatReturnsConfig, loaderThatReturnsDefinition]

    // Perform an initial load to prime the cache. Also verify it's set up to be async.
    let initialLoadWasAsync = false
    const request = beginGetComponentDefinition(testComponentName)
    initialLoadWasAsync = true // We verify that this line runs *before* the definition load completes above
    const initialDefinition = finishGetComponentDefinition(request)
      expect(initialLoadWasAsync).toBe(true)
      expect(initialDefinition).toBe(testComponentDefinition)

      // Perform a subsequent load and verify it completes synchronously, because
      // the component config has the 'synchronous' flag
      let cachedLoadWasSynchronous = false
      components.get(testComponentName, function (cachedDefinition) {
        cachedLoadWasSynchronous = true
        expect(cachedDefinition).toBe(testComponentDefinition)
      })
      expect(cachedLoadWasSynchronous).toBe(true)
  })

  it('By default, contains only the default loader', function () {
    expect(components.loaders.length).toBe(1)
    expect(components.loaders[0]).toBe(components.defaultLoader)
  })

  it('Caches and reuses loaded component definitions', function () {
    // Ensure we leave clean state after the test
    cleanup.defer(() => components.unregister('some-component'))
    cleanup.defer(() => components.unregister('other-component'))

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

    // Fetch the component definition, and see it's the right thing
    let definition1
    definition1 = finishGetComponentDefinition(beginGetComponentDefinition('some-component'))
    expect(definition1.createViewModel().isTheTestComponent).toBe(true)

    // Fetch it again, and see the definition was reused
    finishGetComponentDefinition(beginGetComponentDefinition('some-component'), function (definition2) {
      expect(definition2).toBe(definition1)
    })

    // See that requests for other component names don't reuse the same cache entry
    finishGetComponentDefinition(beginGetComponentDefinition('other-component'), function (otherDefinition) {
      expect(otherDefinition).not.toBe(definition1)
      expect(otherDefinition.createViewModel().isTheOtherComponent).toBe(true)
    })

    // See we can choose to force a refresh by clearing a cache entry before fetching a definition.
    // This facility probably won't be used by most applications, but it is helpful for tests.
    components.clearCachedDefinition('some-component')
    finishGetComponentDefinition(beginGetComponentDefinition('some-component'), function (definition3) {
      expect(definition3).not.toBe(definition1)
      expect(definition3.createViewModel().isTheTestComponent).toBe(true)
    })

    // See that unregistering a component implicitly clears the cache entry too
    components.unregister('some-component')
    finishGetComponentDefinition(beginGetComponentDefinition('some-component'), function (definition4) {
      expect(definition4).toBe(null)
    })
  })

  it('Only commences a single loading process, even if multiple requests arrive before loading has completed', function () {
    // Set up a mock AMD environment that logs calls
    const someModuleTemplate = new Array(),
      someComponentModule = { template: someModuleTemplate },
      requireCallLog = new Array()
    restoreAfter(cleanup, window, 'require')
    window.require = function (modules, callback) {
      requireCallLog.push(modules.slice(0))
      setTimeout(function () {
        callback(someComponentModule)
      }, 80)
    }

    components.register(testComponentName, { require: 'path/testcomponent' })

    // Begin loading the module; see it synchronously made a request to the module loader
    let definition1
    components.get(testComponentName, function (loadedDefinition) {
      definition1 = loadedDefinition
    })
    expect(requireCallLog).toEqual([['path/testcomponent']])

    // Even a little while later, the module hasn't yet loaded
    let definition2
    jest.advanceTimersByTime(20)
    expect(definition1).toBe(undefined)

    // ... but let's make a second request for the same module
    components.get(testComponentName, function (loadedDefinition) {
      definition2 = loadedDefinition
    })
    expect(definition2).toBe(undefined)

    // This time there was no further request to the module loader
    expect(requireCallLog.length).toBe(1)

    // Another partial tick still should not complete either request.
    jest.advanceTimersByTime(20)
    expect(definition1).toBe(undefined)
    expect(definition2).toBe(undefined)

    // And when the loading eventually completes, both requests are satisfied with the same definition
    jest.runAllTimers()
    expect(definition1.template).toBe(someModuleTemplate)
    expect(definition2).toBe(definition1)

    // Subsequent requests also don't involve calls to the module loader
    finishGetComponentDefinition(beginGetComponentDefinition(testComponentName), function (definition3) {
      expect(definition3).toBe(definition1)
      expect(requireCallLog.length).toBe(1)
    })
  })

  function beginGetComponentDefinition(componentName) {
    let loadedDefinition,
      hasCompleted = false
    components.get(componentName, function (definition) {
      loadedDefinition = definition
      hasCompleted = true
    })
    expect(hasCompleted).toBe(false) // Should always complete asynchronously
    return {
      get loadedDefinition() {
        return loadedDefinition
      },
      get hasCompleted() {
        return hasCompleted
      }
    }
  }

  function finishGetComponentDefinition(request, assertionCallback?) {
    jest.runAllTimers()
    expect(request.hasCompleted).toBe(true)
    if (assertionCallback) {
      assertionCallback(request.loadedDefinition)
    }
    return request.loadedDefinition
  }
})
