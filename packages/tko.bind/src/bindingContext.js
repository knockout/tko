import {
    extend, options, anyDomNodeIsAttachedToDocument, addDisposeCallback,
    arrayRemoveItem, domData
} from 'tko.utils';

import {
    computed
} from 'tko.computed';

import {
    unwrap, isObservable
} from 'tko.observable';


var storedBindingContextDomDataKey = domData.nextKey();



// The bindingContext constructor is only called directly to create the root context. For child
// contexts, use bindingContext.createChildContext or bindingContext.extend.
export function bindingContext(dataItemOrAccessor, parentContext, dataItemAlias, extendCallback, settings) {

    var self = this,
        isFunc = typeof(dataItemOrAccessor) == "function" && !isObservable(dataItemOrAccessor),
        nodes,
        subscribable;

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
            self.ko = options.knockoutInstance;
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

        return self.$data;
    }

    function disposeWhen() {
        return nodes && !anyDomNodeIsAttachedToDocument(nodes);
    }

    if (settings && settings.exportDependencies) {
        // The "exportDependencies" option means that the calling code will track any dependencies and re-create
        // the binding context when they change.
        updateContext();
        return;
    }

    subscribable = computed(updateContext, null, { disposeWhen: disposeWhen, disposeWhenNodeIsRemoved: true });

    // At this point, the binding context has been initialized, and the "subscribable" computed observable is
    // subscribed to any observables that were accessed in the process. If there is nothing to track, the
    // computed will be inactive, and we can safely throw it away. If it's active, the computed is stored in
    // the context object.
    if (subscribable.isActive()) {
        self._subscribable = subscribable;

        // Always notify because even if the model ($data) hasn't changed, other context properties might have changed
        subscribable.equalityComparer = null;

        // We need to be able to dispose of this computed observable when it's no longer needed. This would be
        // easy if we had a single node to watch, but binding contexts can be used by many different nodes, and
        // we cannot assume that those nodes have any relation to each other. So instead we track any node that
        // the context is attached to, and dispose the computed when all of those nodes have been cleaned.

        // Add properties to *subscribable* instead of *self* because any properties added to *self* may be overwritten on updates
        nodes = [];
        subscribable._addNode = function(node) {
            nodes.push(node);
            addDisposeCallback(node, function(node) {
                arrayRemoveItem(nodes, node);
                if (!nodes.length) {
                    subscribable.dispose();
                    self._subscribable = subscribable = undefined;
                }
            });
        };
    }
}

// Extend the binding context hierarchy with a new view model object. If the parent context is watching
// any observables, the new child context will automatically get a dependency on the parent context.
// But this does not mean that the $data value of the child context will also get updated. If the child
// view model also depends on the parent view model, you must provide a function that returns the correct
// view model on each update.
bindingContext.prototype.createChildContext = function (dataItemOrAccessor, dataItemAlias, extendCallback, settings) {
    return new bindingContext(dataItemOrAccessor, this, dataItemAlias, function(self, parentContext) {
        // Extend the context hierarchy by setting the appropriate pointers
        self.$parentContext = parentContext;
        self.$parent = parentContext.$data;
        self.$parents = (parentContext.$parents || []).slice(0);
        self.$parents.unshift(self.$parent);
        if (extendCallback)
            extendCallback(self);
    }, settings);
};

// Extend the binding context with new custom properties. This doesn't change the context hierarchy.
// Similarly to "child" contexts, provide a function here to make sure that the correct values are set
// when an observable view model is updated.
bindingContext.prototype.extend = function(properties) {
    // If the parent context references an observable view model, "_subscribable" will always be the
    // latest view model object. If not, "_subscribable" isn't set, and we can use the static "$data" value.
    return new bindingContext(this._subscribable || this.$data, this, null, function(self, parentContext) {
        // This "child" context doesn't directly track a parent observable view model,
        // so we need to manually set the $rawData value to match the parent.
        self.$rawData = parentContext.$rawData;
        extend(self, typeof(properties) === "function" ? properties() : properties);
    });
};

bindingContext.prototype.createStaticChildContext = function (dataItemOrAccessor, dataItemAlias) {
    return this.createChildContext(dataItemOrAccessor, dataItemAlias, null, { "exportDependencies": true });
};


export function storedBindingContextForNode(node, bindingContext) {
    if (arguments.length == 2) {
        domData.set(node, storedBindingContextDomDataKey, bindingContext);
        if (bindingContext._subscribable)
            bindingContext._subscribable._addNode(node);
    } else {
        return domData.get(node, storedBindingContextDomDataKey);
    }
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
