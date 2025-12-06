
import {
    isDomElement, isDocumentFragment, tagNameLower, parseHtmlFragment,
    makeArray, cloneNodes, hasOwnProperty
} from '@tko/utils'

import {registry} from './registry'

// The default loader is responsible for two things:
// 1. Maintaining the default in-memory registry of component configuration objects
//    (i.e., the thing you're writing to when you call ko.components.register(someName, ...))
// 2. Answering requests for components by fetching configuration objects
//    from that default in-memory registry and resolving them into standard
//    component definition objects (of the form { createViewModel: ..., template: ... })
// Custom loaders may override either of these facilities, i.e.,
// 1. To supply configuration objects from some other source (e.g., conventions)
// 2. Or, to resolve configuration objects by loading viewmodels/templates via arbitrary logic.

export var defaultConfigRegistry = {}
export const VIEW_MODEL_FACTORY = Symbol('Knockout View Model ViewModel factory')

interface Component {
  template: Node[];
  createViewModel?: CreateViewModel;
}
type CreateViewModel = (params: ViewModelParams, componentInfo: ComponentInfo) => ViewModel;

interface ViewModelParams {
  [name: string]: any;
}

interface ComponentInfo {
  element: Node;
  templateNodes: Node[];
}

interface ViewModel {
  dispose?: () => void;
  koDescendantsComplete?: (node: Node) => void;
}

interface Config {
  require?: string;
  viewModel?: RequireConfig | ViewModelConfig | any;
  template?: RequireConfig | TemplateConfig | any;
  synchronous?: boolean;
}

interface ViewModelConstructor {
  new(params?: ViewModelParams): ViewModel;
}

interface ViewModelStatic {
  instance: any;
}
interface ViewModelFactory {
  createViewModel: CreateViewModel;
}
interface TemplateElement {
  element: string | Node;
}

type ViewModelConfig = ViewModelConstructor | ViewModelStatic | ViewModelFactory;
type TemplateConfig = string | Node[] | DocumentFragment | TemplateElement;

interface RequireConfig {
  require: string;
}

type RegisterCustomOptions = { ignoreCustomElementWarning: boolean }

function isIgnoreCustomElementWarning(config): config is RegisterCustomOptions{
  return (config as any).ignoreCustomElementWarning !== 'undefined';
}

export function register (componentName: string, config: RegisterCustomOptions | Config ) {
  if (!config) {
    throw new Error('Invalid configuration for ' + componentName)
  }

  if (isRegistered(componentName)) {
    throw new Error('Component ' + componentName + ' is already registered')
  }

  const ceok = componentName.includes('-') && componentName.toLowerCase() === componentName
  
  if (isIgnoreCustomElementWarning(config) && !config.ignoreCustomElementWarning && !ceok) {
    console.log(`
🥊  Knockout warning: components for custom elements must be lowercase and contain a dash.  To ignore this warning, add to the 'config' of .register(componentName, config):

          ignoreCustomElementWarning: true
    `)
  }

  defaultConfigRegistry[componentName] = config
}

export function isRegistered (componentName: string): boolean {
  return hasOwnProperty(defaultConfigRegistry, componentName)
}

export function unregister (componentName: string): void {
  delete defaultConfigRegistry[componentName]
  registry.clearCachedDefinition(componentName)
}

export interface Loader {
      getConfig?(componentName: string, callback: (config: Config | object) => void): void;
      loadComponent?(componentName: string, config: Config | object, callback: (component: Component | null) => void): void;
      loadTemplate?(componentName: string, config: TemplateConfig | any, callback: (resolvedTemplate: Node[] | null) => void): void;
      loadViewModel?(componentName: string, config: ViewModelConfig | any, callback: (resolvedViewModel: CreateViewModel | null) => void): void;
  }

export var defaultLoader : Loader = {
  getConfig(componentName: string, callback: (config: Config | object) => void): void {
    var result = hasOwnProperty(defaultConfigRegistry, componentName)
            ? defaultConfigRegistry[componentName]
            : null
    callback(result)
  },

  loadComponent(componentName: string, config: Config, callback: (component: Component) => void): void {
    var errorCallback = makeErrorCallback(componentName)
    possiblyGetConfigFromAmd(errorCallback, config, function (loadedConfig) {
      resolveConfig(componentName, errorCallback, loadedConfig, callback)
    })
  },

  loadTemplate(componentName: string, templateConfig: TemplateConfig, callback:  (resolvedTemplate: Node[]) => void): void {
    resolveTemplate(makeErrorCallback(componentName), templateConfig, callback)
  },

  loadViewModel(componentName: string, viewModelConfig: ViewModelConfig, callback: (resolvedViewModel: CreateViewModel) => void): void {
    resolveViewModel(makeErrorCallback(componentName), viewModelConfig, callback)
  }
}

var createViewModelKey = 'createViewModel'

// Takes a config object of the form { template: ..., viewModel: ... }, and asynchronously convert it
// into the standard component definition format:
//    { template: <ArrayOfDomNodes>, createViewModel: function(params, componentInfo) { ... } }.
// Since both template and viewModel may need to be resolved asynchronously, both tasks are performed
// in parallel, and the results joined when both are ready. We don't depend on any promises infrastructure,
// so this is implemented manually below.
function resolveConfig (componentName, errorCallback, config, callback) {
  var result = {},
    makeCallBackWhenZero = 2,
    tryIssueCallback = function () {
      if (--makeCallBackWhenZero === 0) {
        callback(result)
      }
    },
    templateConfig = config['template'],
    viewModelConfig = config['viewModel']

  if (templateConfig) {
    possiblyGetConfigFromAmd(errorCallback, templateConfig, function (loadedConfig) {
      registry._getFirstResultFromLoaders('loadTemplate', [componentName, loadedConfig], function (resolvedTemplate) {
        result['template'] = resolvedTemplate
        tryIssueCallback()
      })
    })
  } else {
    tryIssueCallback()
  }

  if (viewModelConfig) {
    possiblyGetConfigFromAmd(errorCallback, viewModelConfig, function (loadedConfig) {
      registry._getFirstResultFromLoaders('loadViewModel', [componentName, loadedConfig], function (resolvedViewModel) {
        result[createViewModelKey] = resolvedViewModel
        tryIssueCallback()
      })
    })
  } else {
    tryIssueCallback()
  }
}

function resolveTemplate (errorCallback, templateConfig, callback) {
  if (typeof templateConfig === 'string') {
        // Markup - parse it
    callback(parseHtmlFragment(templateConfig))
  } else if (templateConfig instanceof Array) {
        // Assume already an array of DOM nodes - pass through unchanged
    callback(templateConfig)
  } else if (isDocumentFragment(templateConfig)) {
        // Document fragment - use its child nodes
    callback(makeArray(templateConfig.childNodes))
  } else if (templateConfig.element) {
    var element = templateConfig.element
    if (isDomElement(element)) {
            // Element instance - copy its child nodes
      callback(cloneNodesFromTemplateSourceElement(element))
    } else if (typeof element === 'string') {
            // Element ID - find it, then copy its child nodes
      var elemInstance = document.getElementById(element)
      if (elemInstance) {
        callback(cloneNodesFromTemplateSourceElement(elemInstance))
      } else {
        errorCallback('Cannot find element with ID ' + element)
      }
    } else {
      errorCallback('Unknown element type: ' + element)
    }
  } else if (templateConfig.elementName) {
    // JSX in the style of babel-plugin-transform-jsx
    callback(templateConfig)
  } else {
    errorCallback('Unknown template value: ' + templateConfig)
  }
}

function resolveViewModel (errorCallback, viewModelConfig, callback) {
  if (viewModelConfig[VIEW_MODEL_FACTORY]) {
    callback((...args) => viewModelConfig[VIEW_MODEL_FACTORY](...args))
  } else if (typeof viewModelConfig === 'function') {
        // Constructor - convert to standard factory function format
        // By design, this does *not* supply componentInfo to the constructor, as the intent is that
        // componentInfo contains non-viewmodel data (e.g., the component's element) that should only
        // be used in factory functions, not viewmodel constructors.
    callback(function (params /*, componentInfo */) {
      return new viewModelConfig(params)
    })
  } else if (typeof viewModelConfig[createViewModelKey] === 'function') {
        // Already a factory function - use it as-is
    callback(viewModelConfig[createViewModelKey])
  } else if ('instance' in viewModelConfig) {
        // Fixed object instance - promote to createViewModel format for API consistency
    var fixedInstance = viewModelConfig['instance']
    callback(function (/* params, componentInfo */) {
      return fixedInstance
    })
  } else if ('viewModel' in viewModelConfig) {
        // Resolved AMD module whose value is of the form { viewModel: ... }
    resolveViewModel(errorCallback, viewModelConfig['viewModel'], callback)
  } else {
    errorCallback('Unknown viewModel value: ' + viewModelConfig)
  }
}

function cloneNodesFromTemplateSourceElement (elemInstance) {
  switch (tagNameLower(elemInstance)) {
    case 'script':
      return parseHtmlFragment(elemInstance.text)
    case 'textarea':
      return parseHtmlFragment(elemInstance.value)
    case 'template':
        // For browsers with proper <template> element support (i.e., where the .content property
        // gives a document fragment), use that document fragment.
      if (isDocumentFragment(elemInstance.content)) {
        return cloneNodes(elemInstance.content.childNodes)
      }
  }

    // Regular elements such as <div>, and <template> elements on old browsers that don't really
    // understand <template> and just treat it as a regular container
  return cloneNodes(elemInstance.childNodes)
}

function possiblyGetConfigFromAmd (errorCallback, config, callback) {
  if (typeof config.require === 'string') {
        // The config is the value of an AMD module
    if (window.amdRequire || window.require) {
      (window.amdRequire || window.require)([config.require], callback)
    } else {
      errorCallback('Uses require, but no AMD loader is present')
    }
  } else {
    callback(config)
  }
}

function makeErrorCallback (componentName) {
  return function (message) {
    throw new Error('Component \'' + componentName + '\': ' + message)
  }
}

// By default, the default loader is the only registered component loader
registry.loaders.push(defaultLoader)
