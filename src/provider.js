
import {
  extend, virtualElements, arrayForEach, options
} from 'tko.utils';



import Parser from './parser.js';


// The list of other objects that have the functions that detect and return
// binding handlers from nodes.
var otherProviders = [];


export default function Provider(options) {
  options = options || {};

  // the binding classes -- defaults to the bind's
  // bindingsHandlers
  var bindingHandlers = this.bindingHandlers = {};


  // bindingHandlers.set(nameOrObject, value)
  // ---
  // Examples:
  // bindingHandlers.set('name', bindingDefinition)
  // bindingHandlers.set({ text: textBinding, input: inputBinding })
  Object.defineProperty(bindingHandlers, 'set', {
    get: function () {
      return function setBindingHandler(nameOrObject, value) {
        if (typeof nameOrObject === 'string') {
          bindingHandlers[nameOrObject] = value;
        } else if (typeof nameOrObject === 'object') {
          if (value !== undefined) {
            options.onError(
              new Error("Given extraneous `value` parameter (first param should be a string, but it was an object)." + nameOrObject));
          }
          extend(bindingHandlers, nameOrObject);
        } else {
          options.onError(
            new Error("Given a bad binding handler type" + nameOrObject));
        }
      };
    }
  });


  // Cache the result of parsing binding strings.
  // TODO
  // this.cache = {};
}


function nodeHasBindings(node) {
  if (node.nodeType === node.ELEMENT_NODE) {
    if (node.getAttribute(options.defaultBindingAttribute)) { return true; }
  } else if (node.nodeType === node.COMMENT_NODE) {
    if (!options.allowVirtualElements) { return false; }
    if (virtualElements.isStartComment(node)) { return true; }
  }

  for (var i = 0, j = otherProviders.length; i < j; i++) {
    if (otherProviders[i].nodeHasBindings(node)) { return true; }
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
    sbind_string = this.getBindingsString(node);

  if (sbind_string) {
    bindings = parser.parse(sbind_string || '');
  }

  arrayForEach(this.otherProviders, function(p) {
    extend(bindings, p.getBindingAccessors(node, context, parser));
  });

  return bindings;
}


// addProvider(provider instance)
// ---
//
// Other providers (such as ko.components) can be added with the `addProvider`
// call.  Each provider is expected to have a `nodeHasBindings` and a
// `getBindingAccessors` function.
//
function addProvider(p) { otherProviders.push(p); }


extend(Provider.prototype, {
  nodeHasBindings: nodeHasBindings,
  getBindingAccessors: getBindingAccessors,
  getBindingsString: getBindingsString,
  addProvider: addProvider,
  Parser: Parser
});
