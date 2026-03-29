describe('Components: Loader registry', function() {
    var testAsyncDelay = 20,
        testComponentName = 'test-component',
        testComponentConfig = {},
        testComponentDefinition = { template: {} },
        loaderThatDoesNotReturnAnything = {
            getConfig: function(name, callback) {
                expect(name).to.equal(testComponentName);
                setTimeout(function() { callback(null) }, testAsyncDelay);
            },
            loadComponent: function(name, config, callback) {
                expect(name).to.equal(testComponentName);
                expect(config).to.equal(testComponentConfig);
                setTimeout(function() { callback(null) }, testAsyncDelay);
            }
        },
        loaderThatHasNoHandlers = {},
        loaderThatReturnsConfig = {
            getConfig: function(name, callback) {
                expect(name).to.equal(testComponentName);
                setTimeout(function() { callback(testComponentConfig) }, testAsyncDelay);
            }
        },
        loaderThatReturnsDefinition = {
            loadComponent: function(name, config, callback) {
                expect(name).to.equal(testComponentName);
                expect(config).to.equal(testComponentConfig);
                setTimeout(function() { callback(testComponentDefinition) }, testAsyncDelay);
            }
        },
        loaderThatShouldNeverBeCalled = {
            getConfig: function() { throw new Error('Should not be called'); },
            loadComponent: function() { throw new Error('Should not be called'); }
        },
        loaderThatCompletesSynchronously = {
            getConfig: function(name, callback) { callback(testComponentConfig); },
            loadComponent: function(name, config, callback) {
                expect(config).to.equal(testComponentConfig);
                callback(testComponentDefinition);
            }
        },
        testLoaderChain = function(spec, chain, options) {
            spec.restoreAfter(ko.components, 'loaders');

            // Set up a chain of loaders, then query it
            ko.components.loaders = chain;

            return new Promise(function(resolve, reject) {
                ko.components.get(testComponentName, function(definition) {
                    try {
                        if ('expectedDefinition' in options) {
                            expect(definition).to.equal(options.expectedDefinition);
                        }
                        resolve(definition);
                    } catch (error) {
                        reject(error);
                    }
                });
            });
        };

    afterEach(function() {
        ko.components.unregister(testComponentName);
    });

    it('Exposes the list of loaders as an array', function() {
        expect(ko.components.loaders instanceof Array).to.equal(true);
    });

    it('Obtains component config and component definition objects by invoking each loader in turn, asynchronously, until one supplies a value', function() {
        var loaders = [
            loaderThatDoesNotReturnAnything,
            loaderThatHasNoHandlers,
            loaderThatReturnsDefinition,
            loaderThatDoesNotReturnAnything,
            loaderThatReturnsConfig,
            loaderThatShouldNeverBeCalled
        ];

        return testLoaderChain(this, loaders, { expectedDefinition: testComponentDefinition });
    });

    it('Supplies null if no registered loader returns a config object', function() {
        var loaders = [
            loaderThatDoesNotReturnAnything,
            loaderThatHasNoHandlers,
            loaderThatReturnsDefinition,
            loaderThatDoesNotReturnAnything
        ];

        return testLoaderChain(this, loaders, { expectedDefinition: null });
    });

    it('Supplies null if no registered loader returns a component for a given config object', function() {
        var loaders = [
            loaderThatDoesNotReturnAnything,
            loaderThatHasNoHandlers,
            loaderThatReturnsConfig,
            loaderThatDoesNotReturnAnything
        ];

        return testLoaderChain(this, loaders, { expectedDefinition: null });
    });

    it('Aborts if a getConfig call returns a value other than undefined', function() {
        // This is just to leave open the option to support synchronous return values in the future.
        // We would detect that a getConfig call wants to return synchronously based on getting a
        // non-undefined return value, and in that case would not wait for the callback.

        var loaders = [
            loaderThatReturnsDefinition,
            loaderThatDoesNotReturnAnything,
            {
                getConfig: function(name, callback) {
                    setTimeout(function() { callback(testComponentDefinition); }, 50);
                    return testComponentDefinition; // This is what's not allowed
                },

                // Unfortunately there's no way to catch the async exception, and we don't
                // want to clutter up the console during tests, so suppress this
                suppressLoaderExceptions: true
            },
            loaderThatReturnsConfig
        ];

        return testLoaderChain(this, loaders, { expectedDefinition: null });
    });

    it('Aborts if a loadComponent call returns a value other than undefined', function() {
        // This is just to leave open the option to support synchronous return values in the future.
        // We would detect that a loadComponent call wants to return synchronously based on getting a
        // non-undefined return value, and in that case would not wait for the callback.

        var loaders = [
            loaderThatReturnsConfig,
            loaderThatDoesNotReturnAnything,
            {
                loadComponent: function(name, config, callback) {
                    setTimeout(function() { callback(testComponentDefinition); }, 50);
                    return testComponentDefinition; // This is what's not allowed
                },

                // Unfortunately there's no way to catch the async exception, and we don't
                // want to clutter up the console during tests, so suppress this
                suppressLoaderExceptions: true
            },
            loaderThatReturnsDefinition
        ];

        return testLoaderChain(this, loaders, { expectedDefinition: null });
    });

    it('Ensures that the loading process completes asynchronously, even if the loader completed synchronously', function() {
        // This behavior is for consistency. Developers calling ko.components.get shouldn't have to
        // be concerned about whether the callback fires before or after their next line of code.

        var wasAsync = false;

        var loaderPromise = testLoaderChain(this, [loaderThatCompletesSynchronously], {
            expectedDefinition: testComponentDefinition,
        });

        wasAsync = true;
        return loaderPromise.then(function() {
            expect(wasAsync).to.equal(true);
        });
    });

    it('Supplies component definition synchronously if the "synchronous" flag is provided and the loader completes synchronously', function() {
        // Set up a synchronous loader that returns a component marked as synchronous
        this.restoreAfter(ko.components, 'loaders');
        var testSyncComponentConfig = { synchronous: true },
            testSyncComponentDefinition = { },
            syncComponentName = 'my-sync-component',
            getConfigCallCount = 0;
        ko.components.loaders = [{
            getConfig: function(name, callback) {
                getConfigCallCount++;
                callback(testSyncComponentConfig);
            },
            loadComponent: function(name, config, callback) {
                expect(config).to.equal(testSyncComponentConfig);
                callback(testSyncComponentDefinition);
            }
        }];

        // See that the initial load can complete synchronously
        var initialLoadCompletedSynchronously = false;
        ko.components.get(syncComponentName, function(definition) {
            expect(definition).to.equal(testSyncComponentDefinition);
            initialLoadCompletedSynchronously = true;
        });
        expect(initialLoadCompletedSynchronously).to.equal(true);
        expect(getConfigCallCount).to.equal(1);

        // See that subsequent cached loads can complete synchronously
        var cachedLoadCompletedSynchronously = false;
        ko.components.get(syncComponentName, function(definition) {
            expect(definition).to.equal(testSyncComponentDefinition);
            cachedLoadCompletedSynchronously = true;
        });
        expect(cachedLoadCompletedSynchronously).to.equal(true);
        expect(getConfigCallCount).to.equal(1); // Was cached, so no extra loads

        // See that, if you use ko.components.get synchronously from inside a computed,
        // it ignores dependencies read inside the callback. That is, the callback only
        // fires once even if something it accesses changes.
        // This represents @lavimc's comment on https://github.com/knockout/knockout/commit/ee6df1398e08e9cc85a7a90497b6d043562d0ed0
        // This behavior might be debatable, since conceivably you might want your computed to
        // react to observables accessed within the synchronous callback. However, developers
        // are at risk of bugs if they do that, because the callback might always fire async
        // if the component isn't yet loaded, then their computed would die early. The argument for
        // this behavior, then, is that it prevents a really obscure and hard-to-repro race condition
        // bug by stopping developers from relying on synchronous dependency detection here at all.
        var someObservable = ko.observable('Initial'),
            callbackCount = 0;
        ko.computed(function() {
            ko.components.get(syncComponentName, function(definition) {
                callbackCount++;
                someObservable();
            })
        });
        expect(callbackCount).to.equal(1);
        someObservable('Modified');
        expect(callbackCount).to.equal(1); // No extra callback
    });

    it('Supplies component definition synchronously if the "synchronous" flag is provided and definition is already cached', function() {
        // Set up an asynchronous loader chain that returns a component marked as synchronous
        this.restoreAfter(ko.components, 'loaders');
        this.after(function() { delete testComponentConfig.synchronous; });
        testComponentConfig.synchronous = "trueish value";
        ko.components.loaders = [loaderThatReturnsConfig, loaderThatReturnsDefinition];

        // Perform an initial load to prime the cache. Also verify it's set up to be async.
        var initialLoadWasAsync = false;
        var initialDefinitionPromise = getComponentDefinition(testComponentName, function(initialDefinition) {
            expect(initialLoadWasAsync).to.equal(true);
            expect(initialDefinition).to.equal(testComponentDefinition);

            // Perform a subsequent load and verify it completes synchronously, because
            // the component config has the 'synchronous' flag
            var cachedLoadWasSynchronous = false;
            ko.components.get(testComponentName, function(cachedDefinition) {
                cachedLoadWasSynchronous = true;
                expect(cachedDefinition).to.equal(testComponentDefinition);
            });
            expect(cachedLoadWasSynchronous).to.equal(true);
        });
        initialLoadWasAsync = true; // We verify that this line runs *before* the definition load completes above
        return initialDefinitionPromise;
    });

    it('By default, contains only the default loader', function() {
        expect(ko.components.loaders.length).to.equal(1);
        expect(ko.components.loaders[0]).to.equal(ko.components.defaultLoader);
    });

    it('Caches and reuses loaded component definitions', function() {
        // Ensure we leave clean state after the test
        this.after(function() {
            ko.components.unregister('some-component');
            ko.components.unregister('other-component');
        });

        ko.components.register('some-component', {
            viewModel: function() { this.isTheTestComponent = true; }
        });
        ko.components.register('other-component', {
            viewModel: function() { this.isTheOtherComponent = true; }
        });

        // Fetch the component definition, and see it's the right thing
        var definition1;
        var cachePromise = getComponentDefinition('some-component', function(definition) {
            definition1 = definition;
            expect(definition1.createViewModel().isTheTestComponent).to.equal(true);
        });

        return cachePromise
            .then(function(definition1Result) {
                definition1 = definition1Result;

                // Fetch it again, and see the definition was reused
                return getComponentDefinition('some-component', function(definition2) {
                    expect(definition2).to.equal(definition1);
                });
            })
            .then(function() {
                // See that requests for other component names don't reuse the same cache entry
                return getComponentDefinition('other-component', function(otherDefinition) {
                    expect(otherDefinition).not.to.equal(definition1);
                    expect(otherDefinition.createViewModel().isTheOtherComponent).to.equal(true);
                });
            })
            .then(function() {
                // See we can choose to force a refresh by clearing a cache entry before fetching a definition.
                // This facility probably won't be used by most applications, but it is helpful for tests.
                ko.components.clearCachedDefinition('some-component');
                return getComponentDefinition('some-component', function(definition3) {
                    expect(definition3).not.to.equal(definition1);
                    expect(definition3.createViewModel().isTheTestComponent).to.equal(true);
                });
            })
            .then(function() {
                // See that unregistering a component implicitly clears the cache entry too
                ko.components.unregister('some-component');
                return getComponentDefinition('some-component', function(definition4) {
                    expect(definition4).to.equal(null);
                });
            });
    });

    it('Only commences a single loading process, even if multiple requests arrive before loading has completed', function() {
        // Set up a mock AMD environment that logs calls
        var someModuleTemplate = [],
            someComponentModule = { template: someModuleTemplate },
            requireCallLog = [];
        this.restoreAfter(window, 'require');
        window.require = function(modules, callback) {
            requireCallLog.push(modules.slice(0));
            setTimeout(function() { callback(someComponentModule); }, 80);
        };

        ko.components.register(testComponentName, { require: 'path/testcomponent' });

        // Begin loading the module; see it synchronously made a request to the module loader
        var definition1 = undefined;
        ko.components.get(testComponentName, function(loadedDefinition) {
            definition1 = loadedDefinition;
        });
        expect(requireCallLog).to.deep.equal([['path/testcomponent']]);

        // Even a little while later, the module hasn't yet loaded
        var definition2 = undefined;
        expect(definition1).to.equal(undefined);

        // ... but let's make a second request for the same module
        ko.components.get(testComponentName, function(loadedDefinition) {
            definition2 = loadedDefinition;
        });

        // This time there was no further request to the module loader
        expect(requireCallLog.length).to.equal(1);

        // And when the loading eventually completes, both requests are satisfied with the same definition
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                try {
                    expect(definition1).to.not.equal(undefined);
                    expect(definition1.template).to.equal(someModuleTemplate);
                    expect(definition2).to.equal(definition1);

                    // Subsequent requests also don't involve calls to the module loader
                    getComponentDefinition(testComponentName, function(definition3) {
                        expect(definition3).to.equal(definition1);
                        expect(requireCallLog.length).to.equal(1);
                    }).then(resolve, reject);
                } catch (error) {
                    reject(error);
                }
            }, 100);
        });
    });

    function getComponentDefinition(componentName, assertionCallback) {
        var hasCompleted = false;

        return new Promise(function(resolve, reject) {
            ko.components.get(componentName, function(definition) {
                hasCompleted = true;
                try {
                    if (assertionCallback) {
                        assertionCallback(definition);
                    }
                    resolve(definition);
                } catch (error) {
                    reject(error);
                }
            });
            expect(hasCompleted).to.equal(false); // Should always complete asynchronously
        });
    }
});
