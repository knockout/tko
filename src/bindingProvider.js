

// import { options } from 'tko.utils';
//
// export var bindingProvider = {
//     instance: options.bindingProviderInstance
// };

// import {
//     Provider
// } from 'tko.provider';
//
//

// import {
//     extend, virtualElements
// } from 'tko.utils';
//
// import * as expressionRewriting from './expressionRewriting';

// ...

// var defaultBindingAttributeName = "data-bind";
//
// export function bindingProvider() {
//     this.bindingCache = {};
// }
//
// extend(bindingProvider.prototype, {
//     nodeHasBindings: function(node) {
//         switch (node.nodeType) {
//         case 1: // Element
//             return node.getAttribute(defaultBindingAttributeName) != null;
//         case 8: // Comment node
//             return virtualElements.hasBindingValue(node);
//         default: return false;
//         }
//     },
//
//     getBindings: function(node, bindingContext) {
//         var bindingsString = this.getBindingsString(node, bindingContext),
//             parsedBindings = bindingsString ? this.parseBindingsString(bindingsString, bindingContext, node) : null;
//         return parsedBindings;
//     },
//
//     getBindingAccessors: function(node, bindingContext) {
//         var bindingsString = this.getBindingsString(node, bindingContext),
//             parsedBindings = bindingsString ? this.parseBindingsString(bindingsString, bindingContext, node, { valueAccessors: true }) : null;
//         return parsedBindings;
//     },
//
//     // The following function is only used internally by this default provider.
//     // It's not part of the interface definition for a general binding provider.
//     getBindingsString: function(node /*, bindingContext */) {
//         switch (node.nodeType) {
//         case 1: return node.getAttribute(defaultBindingAttributeName);   // Element
//         case 8: return virtualElements.virtualNodeBindingValue(node); // Comment node
//         default: return null;
//         }
//     },
//
//     // The following function is only used internally by this default provider.
//     // It's not part of the interface definition for a general binding provider.
//     parseBindingsString: function(bindingsString, bindingContext, node, options) {
//         try {
//             var bindingFunction = createBindingsStringEvaluatorViaCache(bindingsString, this.bindingCache, options);
//             return bindingFunction(bindingContext, node);
//         } catch (ex) {
//             ex.message = "Unable to parse bindings.\nBindings value: " + bindingsString + "\nMessage: " + ex.message;
//             throw ex;
//         }
//     }
// });
//
// bindingProvider.instance = new bindingProvider();
//
//
// function createBindingsStringEvaluatorViaCache(bindingsString, cache, options) {
//     var cacheKey = bindingsString + (options && options.valueAccessors || '');
//     return cache[cacheKey]
//         || (cache[cacheKey] = createBindingsStringEvaluator(bindingsString, options));
// }
//
// function createBindingsStringEvaluator(bindingsString, options) {
//     // Build the source for a function that evaluates "expression"
//     // For each scope variable, add an extra level of "with" nesting
//     // Example result: with(sc1) { with(sc0) { return (expression) } }
//     var rewrittenBindings = expressionRewriting.preProcessBindings(bindingsString, options),
//         functionBody = "with($context){with($data||{}){return{" + rewrittenBindings + "}}}";
//     return new Function("$context", "$element", functionBody);
// }
