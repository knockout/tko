
import {
  extend, virtualElements, arrayForEach, options, objectForEach
} from 'tko.utils';



import Parser from './parser.js';
import parseObjectLiteral from './preparse';


export default function Provider(options) {
  options = options || {};
  this.otherProviders = options.otherProviders || [];
  this.bindingPreProcessors = options.bindingPreProcessors || [];
  this.nodePreProcessors = options.preprocessors || [];

  // the binding classes -- defaults to the bind's
  // bindingsHandlers
  var bindingHandlers = this.bindingHandlers = {};

  addGetterSetter(bindingHandlers);

  // Cache the result of parsing binding strings.
  // TODO
  // this.cache = {};
}


/** Add non-enumerable `get` and `set` properties.
 */
// bindingHandlers.set(nameOrObject, value)
// ---
// Examples:
//
// bindingHandlers.set('name', bindingDefinition)
// bindingHandlers.set({ text: textBinding, input: inputBinding })
function addGetterSetter(bindingHandlersObject) {
  Object.defineProperties(bindingHandlersObject, {
    'set': {
      configurable: true,
      value: function setBindingHandler(nameOrObject, value) {
        if (typeof nameOrObject === 'string') {
          bindingHandlersObject[nameOrObject] = value;
        } else if (typeof nameOrObject === 'object') {
          if (value !== undefined) {
            options.onError(
              new Error("Given extraneous `value` parameter (first param should be a string, but it was an object)." + nameOrObject));
          }
          extend(bindingHandlersObject, nameOrObject);
        } else {
          options.onError(
            new Error("Given a bad binding handler type: " + nameOrObject));
        }
      }
    },
    'get': {
      configurable: true,
      value: function getBindingHandler(name) {
        // NOTE: Strict binding checking ought to occur here.
        return bindingHandlersObject[name];
      }
    }
  });
}



function nodeHasBindings(node) {
  if (node.nodeType === node.ELEMENT_NODE) {
    if (node.getAttribute(options.defaultBindingAttribute)) { return true; }
  } else if (node.nodeType === node.COMMENT_NODE) {
    if (options.allowVirtualElements &&
        virtualElements.isStartComment(node)) {
      return true;
    }
  }

  for (var i = 0, j = this.otherProviders.length; i < j; i++) {
    if (this.otherProviders[i].nodeHasBindings(node)) { return true; }
  }

  return false;
}


function getBindingsString(node) {
  switch (node.nodeType) {
  case node.ELEMENT_NODE:
    return node.getAttribute(options.defaultBindingAttribute);
  case node.COMMENT_NODE:
    return virtualElements.virtualNodeBindingValue(node);
  default:
    return null;
  }
}


// Note we do not seem to need both getBindings and getBindingAccessors; just
// the latter appears to suffice.
//
// Return the name/valueAccessor pairs.
// (undocumented replacement for getBindings)
// see https://github.com/knockout/knockout/pull/742
function getBindingAccessors(node, context) {
  var bindings = {},
    parser = new Parser(node, context, options.bindingGlobals),
    binding_string = this.getBindingsString(node);

  if (binding_string) {
    binding_string = this.preProcessBindings(binding_string);
    bindings = parser.parse(binding_string || '');
  }

  arrayForEach(this.otherProviders, function(p) {
    extend(bindings, p.getBindingAccessors(node, context, parser, bindings));
  });

  objectForEach(bindings, this.preProcessBindings.bind(this));

  return bindings;
}


/** Call bindingHandler.preprocess on each respective binding string.
 *
 * The `preprocess` property of bindingHandler must be a static
 * function (i.e. on the object or constructor).
 */
function preProcessBindings(bindingString) {
  var results = [];
  var bindingHandlers = this.bindingHandlers;
  var preprocessed;

  // Check for a Provider.preprocessNode property
  if (typeof this.preprocessNode === 'function') {
    preprocessed = this.preprocessNode(bindingString, this);
    if (preprocessed) { bindingString = preprocessed; }
  }

  for (var i = 0, j = this.bindingPreProcessors.length; i < j; ++i) {
    preprocessed = this.bindingPreProcessors[i](bindingString, this);
    if (preprocessed) { bindingString = preprocessed; }
  }

  function addBinding(name, value) {
    results.push("'" + name + "':" + value);
  }

  function processBinding(key, value) {
    // Get the "on" binding from "on.click"
    var handler = bindingHandlers.get(key.split('.')[0]);

    if (handler && typeof handler.preprocess === 'function') {
      value = handler.preprocess(value, key, processBinding);
    }

    addBinding(key, value);
  }

  arrayForEach(parseObjectLiteral(bindingString), function(keyValueItem) {
    processBinding(
      keyValueItem.key || keyValueItem.unknown,
      keyValueItem.value
    );
  });

  return results.join(',');
}


/**
 * Run the preprocessors on a given node
 * @param  {HTMLElement} node The node to be modified/preprocessed.
 * @return {Array<HTMLElement>}     An array of nodes.
 *
 * FIXME: This only lets one node preprocessor modify the nodes; more
 * generically we want to be able to have a nested node->nodes for each
 * preprocessor, eventually flattening a tree-like result.
 */
function preprocessNode(node, startingPreprocessorIndex) {
  var newNodes;
  for (var i = startingPreprocessorIndex || 0, j = this.nodePreProcessors.length; i < j; i++) {
    newNodes = this.nodePreProcessors[i].call(this, node, this);
    if (newNodes) { return newNodes; }
  }
  return;
}


// addProvider(provider instance)
// ---
//
// Other providers (such as ko.components) can be added with the `addProvider`
// call.  Each provider is expected to have a `nodeHasBindings` and a
// `getBindingAccessors` function.
//
function addProvider(p) { this.otherProviders.push(p); }
function clearProviders() { this.otherProviders.length = 0; }

function addBindingPreprocessor(fn) { this.bindingPreProcessors.push(fn); }
function clearBindingPreprocessors() { this.bindingPreProcessors.length = 0; }

function addNodePreprocessor(fn) { this.nodePreProcessors.push(fn); }
function clearNodePreprocessors() { this.nodePreProcessors.length = 0; }


extend(Provider.prototype, {
  nodeHasBindings: nodeHasBindings,
  getBindingAccessors: getBindingAccessors,
  getBindingsString: getBindingsString,
  Parser: Parser,
  preProcessBindings: preProcessBindings,
  preprocessNode: preprocessNode,

  addProvider: addProvider,
  addBindingPreprocessor: addBindingPreprocessor,
  clearProviders: clearProviders,
  clearBindingPreprocessors: clearBindingPreprocessors,
  addNodePreprocessor: addNodePreprocessor,
  clearNodePreprocessors: clearNodePreprocessors,
});