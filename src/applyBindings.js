
/* eslint no-cond-assign: 0 */

import {
    extend, objectMap, virtualElements,
    addDisposeCallback, tagNameLower, domData, objectForEach,
    arrayIndexOf, arrayForEach, options
} from 'tko.utils';

import {
    dependencyDetection
} from 'tko.observable';

import {
    computed
} from 'tko.computed';

import {
    bindingContext, storedBindingContextForNode
} from './bindingContext';


// The following element types will not be recursed into during binding.
var bindingDoesNotRecurseIntoElementTypes = {
    // Don't want bindings that operate on text nodes to mutate <script> and <textarea> contents,
    // because it's unexpected and a potential XSS issue.
    // Also bindings should not operate on <template> elements since this breaks in Internet Explorer
    // and because such elements' contents are always intended to be bound in a different context
    // from where they appear in the document.
    'script': true,
    'textarea': true,
    'template': true
};

// Use an overridable method for retrieving binding handlers so that a plugins may support dynamically created handlers
export function getBindingHandler(bindingKey) {
    return options.bindingProviderInstance.bindingHandlers.get(bindingKey);
}


// Returns the valueAccesor function for a binding value
function makeValueAccessor(value) {
    return function() {
        return value;
    };
}

// Returns the value of a valueAccessor function
function evaluateValueAccessor(valueAccessor) {
    return valueAccessor();
}

// Given a function that returns bindings, create and return a new object that contains
// binding value-accessors functions. Each accessor function calls the original function
// so that it always gets the latest value and all dependencies are captured. This is used
// by ko.applyBindingsToNode and getBindingsAndMakeAccessors.
function makeAccessorsFromFunction(callback) {
    return objectMap(dependencyDetection.ignore(callback), function(value, key) {
        return function() {
            return callback()[key];
        };
    });
}

// Given a bindings function or object, create and return a new object that contains
// binding value-accessors functions. This is used by ko.applyBindingsToNode.
function makeBindingAccessors(bindings, context, node) {
    if (typeof bindings === 'function') {
        return makeAccessorsFromFunction(bindings.bind(null, context, node));
    } else {
        return objectMap(bindings, makeValueAccessor);
    }
}

// This function is used if the binding provider doesn't include a getBindingAccessors function.
// It must be called with 'this' set to the provider instance.
function getBindingsAndMakeAccessors(node, context) {
    return makeAccessorsFromFunction(this.getBindings.bind(this, node, context));
}

function validateThatBindingIsAllowedForVirtualElements(bindingName) {
    var bindingHandler = options.bindingProviderInstance.bindingHandlers[bindingName],
        validator;
    if (typeof bindingHandler === 'function') {
        validator = bindingHandler.allowVirtualElements || (
            typeof bindingHandler.prototype === 'object' &&
            Boolean(bindingHandler.prototype.allowVirtualElements)
        );
    } else {
        validator = bindingHandler.allowVirtualElements || virtualElements.allowedBindings[bindingName];
    }
    if (!validator)
        throw new Error("The binding '" + bindingName + "' cannot be used with virtual elements");
}

function applyBindingsToDescendantsInternal (bindingContext, elementOrVirtualElement, bindingContextsMayDifferFromDomParentElement) {
    var currentChild,
        nextInQueue = virtualElements.firstChild(elementOrVirtualElement),
        provider = options.bindingProviderInstance,
        preprocessNode = provider.preprocessNode;

    // Preprocessing allows a binding provider to mutate a node before bindings are applied to it. For example it's
    // possible to insert new siblings after it, and/or replace the node with a different one. This can be used to
    // implement custom binding syntaxes, such as {{ value }} for string interpolation, or custom element types that
    // trigger insertion of <template> contents at that point in the document.
    if (preprocessNode) {
        while (currentChild = nextInQueue) {
            nextInQueue = virtualElements.nextSibling(currentChild);
            preprocessNode.call(provider, currentChild);
        }
        // Reset nextInQueue for the next loop
        nextInQueue = virtualElements.firstChild(elementOrVirtualElement);
    }

    while (currentChild = nextInQueue) {
        // Keep a record of the next child *before* applying bindings, in case the binding removes the current child from its position
        nextInQueue = virtualElements.nextSibling(currentChild);
        applyBindingsToNodeAndDescendantsInternal(bindingContext, currentChild, bindingContextsMayDifferFromDomParentElement);
    }
}

function applyBindingsToNodeAndDescendantsInternal (bindingContext, nodeVerified, bindingContextMayDifferFromDomParentElement) {
    var shouldBindDescendants = true;

    // Perf optimisation: Apply bindings only if...
    // (1) We need to store the binding context on this node (because it may differ from the DOM parent node's binding context)
    //     Note that we can't store binding contexts on non-elements (e.g., text nodes), as IE doesn't allow expando properties for those
    // (2) It might have bindings (e.g., it has a data-bind attribute, or it's a marker for a containerless template)
    var isElement = (nodeVerified.nodeType === 1);
    if (isElement) // Workaround IE <= 8 HTML parsing weirdness
        virtualElements.normaliseVirtualElementDomStructure(nodeVerified);

    var shouldApplyBindings = (isElement && bindingContextMayDifferFromDomParentElement)             // Case (1)
                           || options.bindingProviderInstance.nodeHasBindings(nodeVerified);       // Case (2)
    if (shouldApplyBindings)
        shouldBindDescendants = applyBindingsToNodeInternal(nodeVerified, null, bindingContext, bindingContextMayDifferFromDomParentElement).shouldBindDescendants;

    if (shouldBindDescendants && !bindingDoesNotRecurseIntoElementTypes[tagNameLower(nodeVerified)]) {
        // We're recursing automatically into (real or virtual) child nodes without changing binding contexts. So,
        //  * For children of a *real* element, the binding context is certainly the same as on their DOM .parentNode,
        //    hence bindingContextsMayDifferFromDomParentElement is false
        //  * For children of a *virtual* element, we can't be sure. Evaluating .parentNode on those children may
        //    skip over any number of intermediate virtual elements, any of which might define a custom binding context,
        //    hence bindingContextsMayDifferFromDomParentElement is true
        applyBindingsToDescendantsInternal(bindingContext, nodeVerified, /* bindingContextsMayDifferFromDomParentElement: */ !isElement);
    }
}

var boundElementDomDataKey = domData.nextKey();


function topologicalSortBindings(bindings) {
    // Depth-first sort
    var result = [],                // The list of key/handler pairs that we will return
        bindingsConsidered = {},    // A temporary record of which bindings are already in 'result'
        cyclicDependencyStack = []; // Keeps track of a depth-search so that, if there's a cycle, we know which bindings caused it
    objectForEach(bindings, function pushBinding(bindingKey) {
        if (!bindingsConsidered[bindingKey]) {
            var binding = getBindingHandler(bindingKey);
            if (binding) {
                // First add dependencies (if any) of the current binding
                if (binding.after) {
                    cyclicDependencyStack.push(bindingKey);
                    arrayForEach(binding.after, function(bindingDependencyKey) {
                        if (bindings[bindingDependencyKey]) {
                            if (arrayIndexOf(cyclicDependencyStack, bindingDependencyKey) !== -1) {
                                throw Error("Cannot combine the following bindings, because they have a cyclic dependency: " + cyclicDependencyStack.join(", "));
                            } else {
                                pushBinding(bindingDependencyKey);
                            }
                        }
                    });
                    cyclicDependencyStack.length--;
                }
                // Next add the current binding
                result.push({ key: bindingKey, handler: binding });
            }
            bindingsConsidered[bindingKey] = true;
        }
    });

    return result;
}

// This is called when the bindingHandler is an object (with `init` and/or
// `update` methods)
function execObjectBindingHandlerOnNode(bindingKeyAndHandler, node, getValueAccessor, allBindings, bindingContext, reportBindingError) {
    var handlerInitFn = bindingKeyAndHandler.handler["init"],
        handlerUpdateFn = bindingKeyAndHandler.handler["update"],
        bindingKey = bindingKeyAndHandler.key,
        controlsDescendantBindings = false;

    // Run init, ignoring any dependencies
    if (typeof handlerInitFn === "function") {
        try {
            dependencyDetection.ignore(function() {
                var initResult = handlerInitFn(node, getValueAccessor(bindingKey), allBindings, bindingContext.$data, bindingContext);

                // If this binding handler claims to control descendant bindings, make a note of this
                if (initResult && initResult.controlsDescendantBindings) {
                    controlsDescendantBindings = true;
                }
            });
        } catch(ex) {
            reportBindingError('init', ex);
        }
    }

    // Run update in its own computed wrapper
    if (typeof handlerUpdateFn === "function") {
        computed(
            function() {
                try {
                    handlerUpdateFn(node, getValueAccessor(bindingKey), allBindings, bindingContext.$data, bindingContext);
                } catch (ex) {
                    reportBindingError('update', ex);
                }
            },
            null,
            { disposeWhenNodeIsRemoved: node }
        );
    }
    return controlsDescendantBindings;
}

// This is called when the bindingHandler is a function (or ES6 class).
// Node that these will work only for browsers with Object.defineProperty,
// i.e. IE9+.
function execNewBindingHandlerOnNode(bindingKeyAndHandler, node, getValueAccessor, allBindings, bindingContext, reportBindingError) {
    var bindingKey = bindingKeyAndHandler.key,
        handlerParams = {
            element: node,
            $data: bindingContext.$data,
            $context: bindingContext,
            allBindings: allBindings
        },
        handlerConstructor = bindingKeyAndHandler.handler,
        handlerInstance,
        subscriptions = [];

    Object.defineProperty(handlerParams, 'value', {
        get: function () { return getValueAccessor(bindingKey)(); }
    });

    function handlerConstructorWrapper() {
        handlerInstance = this;

        // The handler instance will have properties `computed` and
        // `subscribe`, which are almost the same as the `ko.-` equivalent
        // except their lifecycle is limited to that of the node (i.e.
        // they are automatically disposed).
        this.computed = function handlerInstanceComputed(functionOrObject) {
            var settings = typeof functionOrObject === 'function' ?
                { read: functionOrObject, write: functionOrObject } :
                functionOrObject;
            extend(settings, {
                owner: handlerInstance,
                disposeWhenNodeIsRemoved: node
            });
            return computed(settings);
        };

        this.subscribe = function handlerInstanceSubscription(subscribable, callback, eventType) {
            subscriptions.push(
                subscribable.subscribe(callback, handlerInstance, eventType)
            );
        };

        this.value = this.computed(function () {
            return getValueAccessor(bindingKey)();
        });

        handlerConstructor.call(this, handlerParams);
    }

    // We have to wrap the handler instance in this "subclass" because
    // it's the only way to define this.computed/subscribe before the
    // handlerConstructor is called, and one would expect those
    // utilities to be available in the constructor.
    extend(handlerConstructorWrapper, handlerConstructor);
    handlerConstructorWrapper.prototype = handlerConstructor.prototype;

    try {
        new handlerConstructorWrapper();
    } catch(ex) {
        reportBindingError('construction', ex);
    }

    addDisposeCallback(node, function () {
        if (typeof handlerInstance.dispose === "function") {
            handlerInstance.dispose.call(handlerInstance);
        }
        arrayForEach(subscriptions, function (subs) {
            subs.dispose();
        });
    });

    return handlerConstructor.controlsDescendantBindings || handlerInstance.controlsDescendantBindings;
}

function applyBindingsToNodeInternal(node, sourceBindings, bindingContext, bindingContextMayDifferFromDomParentElement) {

    // Use of allBindings as a function is maintained for backwards compatibility, but its use is deprecated
    function allBindings() {
        return objectMap(bindingsUpdater ? bindingsUpdater() : bindings, evaluateValueAccessor);
    }
    // The following is the 3.x allBindings API
    allBindings.get = function(key) {
        return bindings[key] && evaluateValueAccessor(getValueAccessor(key));
    };
    allBindings.has = function(key) {
        return key in bindings;
    };

    // Prevent multiple applyBindings calls for the same node, except when a binding value is specified
    var alreadyBound = domData.get(node, boundElementDomDataKey);
    if (!sourceBindings) {
        if (alreadyBound) {
            onBindingError({
                during: 'apply',
                errorCaptured: new Error("You cannot apply bindings multiple times to the same element."),
                element: node,
                bindingContext: bindingContext
            });
            return false;
        }
        domData.set(node, boundElementDomDataKey, true);
    }

    // Optimization: Don't store the binding context on this node if it's definitely the same as on node.parentNode, because
    // we can easily recover it just by scanning up the node's ancestors in the DOM
    // (note: here, parent node means "real DOM parent" not "virtual parent", as there's no O(1) way to find the virtual parent)
    if (!alreadyBound && bindingContextMayDifferFromDomParentElement)
        storedBindingContextForNode(node, bindingContext);

    // Use bindings if given, otherwise fall back on asking the bindings provider to give us some bindings
    var bindings;
    if (sourceBindings && typeof sourceBindings !== 'function') {
        bindings = sourceBindings;
    } else {
        var provider = options.bindingProviderInstance,
            getBindings = provider.getBindingAccessors || getBindingsAndMakeAccessors;

        // Get the binding from the provider within a computed observable so that we can update the bindings whenever
        // the binding context is updated or if the binding provider accesses observables.
        var bindingsUpdater = computed(
            function() {
                bindings = sourceBindings ? sourceBindings(bindingContext, node) : getBindings.call(provider, node, bindingContext);
                // Register a dependency on the binding context to support observable view models.
                if (bindings && bindingContext._subscribable)
                    bindingContext._subscribable();
                return bindings;
            },
            null, { disposeWhenNodeIsRemoved: node }
        );

        if (!bindings || !bindingsUpdater.isActive())
            bindingsUpdater = null;
    }

    var bindingHandlerThatControlsDescendantBindings;
    if (bindings) {
        // Return the value accessor for a given binding. When bindings are static (won't be updated because of a binding
        // context update), just return the value accessor from the binding. Otherwise, return a function that always gets
        // the latest binding value and registers a dependency on the binding updater.
        var getValueAccessor = bindingsUpdater
            ? function (bindingKey) {
                return function(optionalValue) {
                    var valueAccessor = bindingsUpdater()[bindingKey];
                    if (arguments.length === 0) {
                        return evaluateValueAccessor(valueAccessor);
                    } else {
                        return valueAccessor(optionalValue);
                    }
                };
            } : function (bindingKey) { return bindings[bindingKey]; };

        // First put the bindings into the right order
        var orderedBindings = topologicalSortBindings(bindings);

        // Go through the sorted bindings, calling init and update for each
        arrayForEach(orderedBindings, function(bindingKeyAndHandler) {
            var bindingKey = bindingKeyAndHandler.key,
                controlsDescendantBindings,
                execBindingFunction = typeof bindingKeyAndHandler.handler === 'function' ?
                    execNewBindingHandlerOnNode :
                    execObjectBindingHandlerOnNode;

            if (node.nodeType === 8) {
                validateThatBindingIsAllowedForVirtualElements(bindingKey);
            }

            function reportBindingError(during, errorCaptured) {
                onBindingError({
                    during: during,
                    errorCaptured: errorCaptured,
                    element: node,
                    bindingKey: bindingKey,
                    bindings: bindings,
                    allBindings: allBindings,
                    valueAccessor: getValueAccessor(bindingKey),
                    bindingContext: bindingContext
                });
            }

            // Note that topologicalSortBindings has already filtered out any nonexistent binding handlers,
            // so bindingKeyAndHandler.handler will always be nonnull.
            controlsDescendantBindings = execBindingFunction(
                bindingKeyAndHandler, node, getValueAccessor,
                allBindings, bindingContext, reportBindingError);

            if (controlsDescendantBindings) {
                if (bindingHandlerThatControlsDescendantBindings !== undefined)
                    throw new Error("Multiple bindings (" + bindingHandlerThatControlsDescendantBindings + " and " + bindingKey + ") are trying to control descendant bindings of the same element. You cannot use these bindings together on the same element.");
                bindingHandlerThatControlsDescendantBindings = bindingKey;
            }
        });
    }

    return {
        'shouldBindDescendants': bindingHandlerThatControlsDescendantBindings === undefined
    };
}


function getBindingContext(viewModelOrBindingContext) {
    return viewModelOrBindingContext && (viewModelOrBindingContext instanceof bindingContext)
        ? viewModelOrBindingContext
        : new bindingContext(viewModelOrBindingContext);
}

export function applyBindingAccessorsToNode(node, bindings, viewModelOrBindingContext) {
    if (node.nodeType === 1) // If it's an element, workaround IE <= 8 HTML parsing weirdness
        virtualElements.normaliseVirtualElementDomStructure(node);
    return applyBindingsToNodeInternal(node, bindings, getBindingContext(viewModelOrBindingContext), true);
}

export function applyBindingsToNode(node, bindings, viewModelOrBindingContext) {
    var context = getBindingContext(viewModelOrBindingContext);
    return applyBindingAccessorsToNode(node, makeBindingAccessors(bindings, context, node), context);
}

export function applyBindingsToDescendants(viewModelOrBindingContext, rootNode) {
    if (rootNode.nodeType === 1 || rootNode.nodeType === 8)
        applyBindingsToDescendantsInternal(getBindingContext(viewModelOrBindingContext), rootNode, true);
}

export function applyBindings(viewModelOrBindingContext, rootNode) {
    // If jQuery is loaded after Knockout, we won't initially have access to it. So save it here.
    if (!options.jQuery === undefined && window.jQuery) {
        options.jQuery = window.jQuery;
    }

    if (rootNode && (rootNode.nodeType !== 1) && (rootNode.nodeType !== 8))
        throw new Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node");
    rootNode = rootNode || window.document.body; // Make "rootNode" parameter optional

    applyBindingsToNodeAndDescendantsInternal(getBindingContext(viewModelOrBindingContext), rootNode, true);
}

function onBindingError(spec) {
    var error, bindingText;
    if (spec.bindingKey) {
        // During: 'init' or initial 'update'
        error = spec.errorCaptured;
        bindingText = options.bindingProviderInstance.getBindingsString(spec.element);
        spec.message = "Unable to process binding \"" + spec.bindingKey
            + "\" in binding \"" + bindingText
            + "\"\nMessage: " + error.message;
    } else {
        // During: 'apply'
        error = spec.errorCaptured;
    }
    try {
        extend(error, spec);
    } catch (e) {
        // Read-only error e.g. a DOMEXception.
        spec.stack = error.stack;
        error = new Error(error.message);
        extend(error, spec);
    }
    options.onError(error);
}