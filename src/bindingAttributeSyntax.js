
/* eslint no-cond-assign: 0 */

import {
    extend, anyDomNodeIsAttachedToDocument, objectMap, virtualElements,
    domNodeDisposal, arrayRemoveItem, tagNameLower, domData, objectForEach,
    arrayIndexOf, arrayForEach
} from 'tko.util';

import {
    unwrap, isObservable, dependencyDetection
} from 'tko.observable';

import {
    computed
} from 'tko.computed';

import { bindingProvider } from './bindingProvider';


export var bindingHandlers = {};
export var knockout;  // Must be set when `ko` is fully formed.

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
    return bindingHandlers[bindingKey];
}

// The bindingContext constructor is only called directly to create the root context. For child
// contexts, use bindingContext.createChildContext or bindingContext.extend.
export function bindingContext(dataItemOrAccessor, parentContext, dataItemAlias, extendCallback, options) {

    // The binding context object includes static properties for the current, parent, and root view models.
    // If a view model is actually stored in an observable, the corresponding binding context object, and
    // any child contexts, must be updated when the view model is changed.
    function updateContext() {
        // Most of the time, the context will directly get a view model object, but if a function is given,
        // we call the function to retrieve the view model. If the function accesses any observables or returns
        // an observable, the dependency is tracked, and those observables can later cause the binding
        // context to be updated.
        var dataItemOrObservable = isFunc ? dataItemOrAccessor() : dataItemOrAccessor,
            dataItem = unwrap(dataItemOrObservable);

        if (parentContext) {
            // When a "parent" context is given, register a dependency on the parent context. Thus whenever the
            // parent context is updated, this context will also be updated.
            if (parentContext._subscribable)
                parentContext._subscribable();

            // Copy $root and any custom properties from the parent context
            extend(self, parentContext);

            // Because the above copy overwrites our own properties, we need to reset them.
            self._subscribable = subscribable;
        } else {
            self.$parents = [];
            self.$root = dataItem;

            // Export 'ko' in the binding context so it will be available in bindings and templates
            // even if 'ko' isn't exported as a global, such as when using an AMD loader.
            // See https://github.com/SteveSanderson/knockout/issues/490
            self.ko = knockout;
        }
        self.$rawData = dataItemOrObservable;
        self.$data = dataItem;
        if (dataItemAlias)
            self[dataItemAlias] = dataItem;

        // The extendCallback function is provided when creating a child context or extending a context.
        // It handles the specific actions needed to finish setting up the binding context. Actions in this
        // function could also add dependencies to this binding context.
        if (extendCallback)
            extendCallback(self, parentContext, dataItem);

        return self['$data'];
    }
    function disposeWhen() {
        return nodes && !anyDomNodeIsAttachedToDocument(nodes);
    }

    var self = this,
        isFunc = typeof(dataItemOrAccessor) == "function" && !isObservable(dataItemOrAccessor),
        nodes,
        subscribable;

    if (options && options['exportDependencies']) {
        // The "exportDependencies" option means that the calling code will track any dependencies and re-create
        // the binding context when they change.
        updateContext();
    } else {
        subscribable = computed(updateContext, null, { disposeWhen: disposeWhen, disposeWhenNodeIsRemoved: true });

        // At this point, the binding context has been initialized, and the "subscribable" computed observable is
        // subscribed to any observables that were accessed in the process. If there is nothing to track, the
        // computed will be inactive, and we can safely throw it away. If it's active, the computed is stored in
        // the context object.
        if (subscribable.isActive()) {
            self._subscribable = subscribable;

            // Always notify because even if the model ($data) hasn't changed, other context properties might have changed
            subscribable['equalityComparer'] = null;

            // We need to be able to dispose of this computed observable when it's no longer needed. This would be
            // easy if we had a single node to watch, but binding contexts can be used by many different nodes, and
            // we cannot assume that those nodes have any relation to each other. So instead we track any node that
            // the context is attached to, and dispose the computed when all of those nodes have been cleaned.

            // Add properties to *subscribable* instead of *self* because any properties added to *self* may be overwritten on updates
            nodes = [];
            subscribable._addNode = function(node) {
                nodes.push(node);
                domNodeDisposal.addDisposeCallback(node, function(node) {
                    arrayRemoveItem(nodes, node);
                    if (!nodes.length) {
                        subscribable.dispose();
                        self._subscribable = subscribable = undefined;
                    }
                });
            };
        }
    }
}

// Extend the binding context hierarchy with a new view model object. If the parent context is watching
// any observables, the new child context will automatically get a dependency on the parent context.
// But this does not mean that the $data value of the child context will also get updated. If the child
// view model also depends on the parent view model, you must provide a function that returns the correct
// view model on each update.
bindingContext.prototype.createChildContext = function (dataItemOrAccessor, dataItemAlias, extendCallback, options) {
    return new bindingContext(dataItemOrAccessor, this, dataItemAlias, function(self, parentContext) {
        // Extend the context hierarchy by setting the appropriate pointers
        self.$parentContext = parentContext;
        self.$parent = parentContext.$data;
        self.$parents = (parentContext.$parents || []).slice(0);
        self.$parents.unshift(self.$parent);
        if (extendCallback)
            extendCallback(self);
    }, options);
};

// Extend the binding context with new custom properties. This doesn't change the context hierarchy.
// Similarly to "child" contexts, provide a function here to make sure that the correct values are set
// when an observable view model is updated.
bindingContext.prototype.extend = function(properties) {
    // If the parent context references an observable view model, "_subscribable" will always be the
    // latest view model object. If not, "_subscribable" isn't set, and we can use the static "$data" value.
    return new bindingContext(this._subscribable || this['$data'], this, null, function(self, parentContext) {
        // This "child" context doesn't directly track a parent observable view model,
        // so we need to manually set the $rawData value to match the parent.
        self['$rawData'] = parentContext['$rawData'];
        extend(self, typeof(properties) == "function" ? properties() : properties);
    });
};

bindingContext.prototype.createStaticChildContext = function (dataItemOrAccessor, dataItemAlias) {
    return this['createChildContext'](dataItemOrAccessor, dataItemAlias, null, { "exportDependencies": true });
};

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
    return makeAccessorsFromFunction(this['getBindings'].bind(this, node, context));
}

function validateThatBindingIsAllowedForVirtualElements(bindingName) {
    var bindingHandler = bindingHandlers[bindingName],
        validator;
    if (typeof bindingHandler === 'function') {
        validator = bindingHandler.allowVirtualElements || (
            typeof bindingHandler.prototype === 'object' &&
            Boolean(bindingHandler.prototype.allowVirtualElements)
        );
    } else {
        validator = virtualElements.allowedBindings[bindingName];
    }
    if (!validator)
        throw new Error("The binding '" + bindingName + "' cannot be used with virtual elements");
}

function applyBindingsToDescendantsInternal (bindingContext, elementOrVirtualElement, bindingContextsMayDifferFromDomParentElement) {
    var currentChild,
        nextInQueue = virtualElements.firstChild(elementOrVirtualElement),
        provider = bindingProvider.instance,
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
                           || bindingProvider.instance.nodeHasBindings(nodeVerified);       // Case (2)
    if (shouldApplyBindings)
        shouldBindDescendants = applyBindingsToNodeInternal(nodeVerified, null, bindingContext, bindingContextMayDifferFromDomParentElement)['shouldBindDescendants'];

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
                if (binding['after']) {
                    cyclicDependencyStack.push(bindingKey);
                    arrayForEach(binding['after'], function(bindingDependencyKey) {
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
                var initResult = handlerInitFn(node, getValueAccessor(bindingKey), allBindings, bindingContext['$data'], bindingContext);

                // If this binding handler claims to control descendant bindings, make a note of this
                if (initResult && initResult['controlsDescendantBindings']) {
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
                    handlerUpdateFn(node, getValueAccessor(bindingKey), allBindings, bindingContext['$data'], bindingContext);
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
            $data: bindingContext['$data'],
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
            var options = typeof functionOrObject === 'function' ?
                { read: functionOrObject, write: functionOrObject } :
                functionOrObject;
            extend(options, {
                owner: handlerInstance,
                disposeWhenNodeIsRemoved: node
            });
            return computed(options);
        };

        this.subscribe = function handlerInstanceSubscription(subscribable, callback, eventType) {
            subscriptions.push(
                subscribable.subscribe(callback, handlerInstance, eventType)
            );
        };

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

    domNodeDisposal.addDisposeCallback(node, function () {
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
        var provider = bindingProvider.instance,
            getBindings = provider['getBindingAccessors'] || getBindingsAndMakeAccessors;

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
            ? function(bindingKey) {
                return function() {
                    return evaluateValueAccessor(bindingsUpdater()[bindingKey]);
                };
            } : function(bindingKey) {
                return bindings[bindingKey];
            };

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

var storedBindingContextDomDataKey = domData.nextKey();
export function storedBindingContextForNode(node, bindingContext) {
    if (arguments.length == 2) {
        domData.set(node, storedBindingContextDomDataKey, bindingContext);
        if (bindingContext._subscribable)
            bindingContext._subscribable._addNode(node);
    } else {
        return domData.get(node, storedBindingContextDomDataKey);
    }
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
    if (!jQueryInstance && window['jQuery']) {
        jQueryInstance = window['jQuery'];
    }

    if (rootNode && (rootNode.nodeType !== 1) && (rootNode.nodeType !== 8))
        throw new Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node");
    rootNode = rootNode || window.document.body; // Make "rootNode" parameter optional

    applyBindingsToNodeAndDescendantsInternal(getBindingContext(viewModelOrBindingContext), rootNode, true);
}

// Retrieving binding context from arbitrary nodes
export function contextFor(node) {
    // We can only do something meaningful for elements and comment nodes (in particular, not text nodes, as IE can't store domdata for them)
    switch (node.nodeType) {
    case 1:
    case 8:
        var context = storedBindingContextForNode(node);
        if (context) return context;
        if (node.parentNode) return contextFor(node.parentNode);
        break;
    }
    return undefined;
}

export function dataFor(node) {
    var context = contextFor(node);
    return context ? context.$data : undefined;
}

function onBindingError(spec) {
    var error, bindingText;
    if (spec.bindingKey) {
        // During: 'init' or initial 'update'
        error = spec.errorCaptured;
        bindingText = bindingProvider.instance.getBindingsString(spec.element);
        error.message = "Unable to process binding \"" + spec.bindingKey
            + "\" in binding \"" + bindingText
            + "\"\nMessage: " + error.message;
    } else {
        // During: 'apply'
        error = spec.errorCaptured;
    }
    extend(error, spec);
    if (typeof knockout.onError === 'function') {
        knockout.onError(error);
    } else {
        throw error;
    }
}
