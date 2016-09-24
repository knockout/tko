
import {
    isDomElement, isDocumentFragment, tagNameLower, parseHtmlFragment,
    makeArray, cloneNodes
} from 'tko.utils';

import {
    registry
} from './loaderRegistry';


// The default loader is responsible for two things:
// 1. Maintaining the default in-memory registry of component configuration objects
//    (i.e., the thing you're writing to when you call ko.components.register(someName, ...))
// 2. Answering requests for components by fetching configuration objects
//    from that default in-memory registry and resolving them into standard
//    component definition objects (of the form { createViewModel: ..., template: ... })
// Custom loaders may override either of these facilities, i.e.,
// 1. To supply configuration objects from some other source (e.g., conventions)
// 2. Or, to resolve configuration objects by loading viewmodels/templates via arbitrary logic.

export var defaultConfigRegistry = {};

export function register(componentName, config) {
    if (!config) {
        throw new Error('Invalid configuration for ' + componentName);
    }

    if (isRegistered(componentName)) {
        throw new Error('Component ' + componentName + ' is already registered');
    }

    defaultConfigRegistry[componentName] = config;
}

export function isRegistered(componentName) {
    return defaultConfigRegistry.hasOwnProperty(componentName);
}

export function unregister(componentName) {
    delete defaultConfigRegistry[componentName];
    registry.clearCachedDefinition(componentName);
}

export var defaultLoader = {
    getConfig: function(componentName, callback) {
        var result = defaultConfigRegistry.hasOwnProperty(componentName)
            ? defaultConfigRegistry[componentName]
            : null;
        callback(result);
    },

    loadComponent: function(componentName, config, callback) {
        var errorCallback = makeErrorCallback(componentName);
        possiblyGetConfigFromAmd(errorCallback, config, function(loadedConfig) {
            resolveConfig(componentName, errorCallback, loadedConfig, callback);
        });
    },

    loadTemplate: function(componentName, templateConfig, callback) {
        resolveTemplate(makeErrorCallback(componentName), templateConfig, callback);
    },

    loadViewModel: function(componentName, viewModelConfig, callback) {
        resolveViewModel(makeErrorCallback(componentName), viewModelConfig, callback);
    }
};

var createViewModelKey = 'createViewModel';

// Takes a config object of the form { template: ..., viewModel: ... }, and asynchronously convert it
// into the standard component definition format:
//    { template: <ArrayOfDomNodes>, createViewModel: function(params, componentInfo) { ... } }.
// Since both template and viewModel may need to be resolved asynchronously, both tasks are performed
// in parallel, and the results joined when both are ready. We don't depend on any promises infrastructure,
// so this is implemented manually below.
function resolveConfig(componentName, errorCallback, config, callback) {
    var result = {},
        makeCallBackWhenZero = 2,
        tryIssueCallback = function() {
            if (--makeCallBackWhenZero === 0) {
                callback(result);
            }
        },
        templateConfig = config['template'],
        viewModelConfig = config['viewModel'];

    if (templateConfig) {
        possiblyGetConfigFromAmd(errorCallback, templateConfig, function(loadedConfig) {
            registry._getFirstResultFromLoaders('loadTemplate', [componentName, loadedConfig], function(resolvedTemplate) {
                result['template'] = resolvedTemplate;
                tryIssueCallback();
            });
        });
    } else {
        tryIssueCallback();
    }

    if (viewModelConfig) {
        possiblyGetConfigFromAmd(errorCallback, viewModelConfig, function(loadedConfig) {
            registry._getFirstResultFromLoaders('loadViewModel', [componentName, loadedConfig], function(resolvedViewModel) {
                result[createViewModelKey] = resolvedViewModel;
                tryIssueCallback();
            });
        });
    } else {
        tryIssueCallback();
    }
}

function resolveTemplate(errorCallback, templateConfig, callback) {
    if (typeof templateConfig === 'string') {
        // Markup - parse it
        callback(parseHtmlFragment(templateConfig));
    } else if (templateConfig instanceof Array) {
        // Assume already an array of DOM nodes - pass through unchanged
        callback(templateConfig);
    } else if (isDocumentFragment(templateConfig)) {
        // Document fragment - use its child nodes
        callback(makeArray(templateConfig.childNodes));
    } else if (templateConfig['element']) {
        var element = templateConfig['element'];
        if (isDomElement(element)) {
            // Element instance - copy its child nodes
            callback(cloneNodesFromTemplateSourceElement(element));
        } else if (typeof element === 'string') {
            // Element ID - find it, then copy its child nodes
            var elemInstance = document.getElementById(element);
            if (elemInstance) {
                callback(cloneNodesFromTemplateSourceElement(elemInstance));
            } else {
                errorCallback('Cannot find element with ID ' + element);
            }
        } else {
            errorCallback('Unknown element type: ' + element);
        }
    } else {
        errorCallback('Unknown template value: ' + templateConfig);
    }
}

function resolveViewModel(errorCallback, viewModelConfig, callback) {
    if (typeof viewModelConfig === 'function') {
        // Constructor - convert to standard factory function format
        // By design, this does *not* supply componentInfo to the constructor, as the intent is that
        // componentInfo contains non-viewmodel data (e.g., the component's element) that should only
        // be used in factory functions, not viewmodel constructors.
        callback(function (params /*, componentInfo */) {
            return new viewModelConfig(params);
        });
    } else if (typeof viewModelConfig[createViewModelKey] === 'function') {
        // Already a factory function - use it as-is
        callback(viewModelConfig[createViewModelKey]);
    } else if ('instance' in viewModelConfig) {
        // Fixed object instance - promote to createViewModel format for API consistency
        var fixedInstance = viewModelConfig['instance'];
        callback(function (/* params, componentInfo */) {
            return fixedInstance;
        });
    } else if ('viewModel' in viewModelConfig) {
        // Resolved AMD module whose value is of the form { viewModel: ... }
        resolveViewModel(errorCallback, viewModelConfig['viewModel'], callback);
    } else {
        errorCallback('Unknown viewModel value: ' + viewModelConfig);
    }
}

function cloneNodesFromTemplateSourceElement(elemInstance) {
    switch (tagNameLower(elemInstance)) {
    case 'script':
        return parseHtmlFragment(elemInstance.text);
    case 'textarea':
        return parseHtmlFragment(elemInstance.value);
    case 'template':
        // For browsers with proper <template> element support (i.e., where the .content property
        // gives a document fragment), use that document fragment.
        if (isDocumentFragment(elemInstance.content)) {
            return cloneNodes(elemInstance.content.childNodes);
        }
    }

    // Regular elements such as <div>, and <template> elements on old browsers that don't really
    // understand <template> and just treat it as a regular container
    return cloneNodes(elemInstance.childNodes);
}


function possiblyGetConfigFromAmd(errorCallback, config, callback) {
    if (typeof config.require === 'string') {
        // The config is the value of an AMD module
        if (window.amdRequire || window.require) {
            (window.amdRequire || window.require)([config.require], callback);
        } else {
            errorCallback('Uses require, but no AMD loader is present');
        }
    } else {
        callback(config);
    }
}

function makeErrorCallback(componentName) {
    return function (message) {
        throw new Error('Component \'' + componentName + '\': ' + message);
    };
}


// By default, the default loader is the only registered component loader
registry.loaders.push(defaultLoader);
