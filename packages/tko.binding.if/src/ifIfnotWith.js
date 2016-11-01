
import {
    cloneNodes, virtualElements
} from 'tko.utils';

import {
    unwrap, dependencyDetection
} from 'tko.observable';

import {
    computed
} from 'tko.computed';

import {
    applyBindingsToDescendants
} from 'tko.bind';


// Makes a binding like with or if
function makeWithIfBinding(isWith, isNot, makeContextCallback) {
    return {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var didDisplayOnLastUpdate,
                savedNodes;
            computed(function() {
                var rawValue = valueAccessor(),
                    dataValue = unwrap(rawValue),
                    shouldDisplay = !isNot !== !dataValue, // equivalent to isNot ? !dataValue : !!dataValue
                    isFirstRender = !savedNodes,
                    needsRefresh = isFirstRender || isWith || (shouldDisplay !== didDisplayOnLastUpdate);

                if (needsRefresh) {
                    // Save a copy of the inner nodes on the initial update, but only if we have dependencies.
                    if (isFirstRender && dependencyDetection.getDependenciesCount()) {
                        savedNodes = cloneNodes(virtualElements.childNodes(element), true /* shouldCleanNodes */);
                    }

                    if (shouldDisplay) {
                        if (!isFirstRender) {
                            virtualElements.setDomNodeChildren(element, cloneNodes(savedNodes));
                        }
                        applyBindingsToDescendants(makeContextCallback ? makeContextCallback(bindingContext, rawValue) : bindingContext, element);
                    } else {
                        virtualElements.emptyNode(element);
                    }

                    didDisplayOnLastUpdate = shouldDisplay;
                }
            }, null, { disposeWhenNodeIsRemoved: element });
            return { 'controlsDescendantBindings': true };
        },
        allowVirtualElements: true,
        bindingRewriteValidator: false
    };
}

function withContextCallback(bindingContext, dataValue) {
    return bindingContext.createStaticChildContext(dataValue);
}

                                 /* isWith, isNot */
export var $if =   makeWithIfBinding(false, false);
export var ifnot = makeWithIfBinding(false, true);
export var $with = makeWithIfBinding(true, false, withContextCallback);
