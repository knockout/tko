(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.tko = global.tko || {}, global.tko.binding = global.tko.binding || {}, global.tko.binding.template = global.tko.binding.template || {})));
}(this, function (exports) { 'use strict';

  //
  // Array utilities
  //
  /* eslint no-cond-assign: 0 */

  function arrayForEach(array, action) {
      for (var i = 0, j = array.length; i < j; i++)
          action(array[i], i);
  }

  function arrayIndexOf(array, item) {
      // IE9
      if (typeof Array.prototype.indexOf == "function")
          return Array.prototype.indexOf.call(array, item);
      for (var i = 0, j = array.length; i < j; i++)
          if (array[i] === item)
              return i;
      return -1;
  }

  function arrayFirst(array, predicate, predicateOwner) {
      for (var i = 0, j = array.length; i < j; i++)
          if (predicate.call(predicateOwner, array[i], i))
              return array[i];
      return null;
  }

  function arrayRemoveItem(array, itemToRemove) {
      var index = arrayIndexOf(array, itemToRemove);
      if (index > 0) {
          array.splice(index, 1);
      }
      else if (index === 0) {
          array.shift();
      }
  }

  function arrayMap(array, mapping) {
      array = array || [];
      var result = [];
      for (var i = 0, j = array.length; i < j; i++)
          result.push(mapping(array[i], i));
      return result;
  }

  function arrayFilter(array, predicate) {
      array = array || [];
      var result = [];
      for (var i = 0, j = array.length; i < j; i++)
          if (predicate(array[i], i))
              result.push(array[i]);
      return result;
  }

  function arrayPushAll(array, valuesToPush) {
      if (valuesToPush instanceof Array)
          array.push.apply(array, valuesToPush);
      else
          for (var i = 0, j = valuesToPush.length; i < j; i++)
              array.push(valuesToPush[i]);
      return array;
  }

  function makeArray(arrayLikeObject) {
      var result = [];
      for (var i = 0, j = arrayLikeObject.length; i < j; i++) {
          result.push(arrayLikeObject[i]);
      }
      return result;
  }


  // Go through the items that have been added and deleted and try to find matches between them.
  function findMovesInArrayComparison(left, right, limitFailedCompares) {
      if (left.length && right.length) {
          var failedCompares, l, r, leftItem, rightItem;
          for (failedCompares = l = 0; (!limitFailedCompares || failedCompares < limitFailedCompares) && (leftItem = left[l]); ++l) {
              for (r = 0; rightItem = right[r]; ++r) {
                  if (leftItem['value'] === rightItem['value']) {
                      leftItem['moved'] = rightItem['index'];
                      rightItem['moved'] = leftItem['index'];
                      right.splice(r, 1);         // This item is marked as moved; so remove it from right list
                      failedCompares = r = 0;     // Reset failed compares count because we're checking for consecutive failures
                      break;
                  }
              }
              failedCompares += r;
          }
      }
  }



  var statusNotInOld = 'added';
  var statusNotInNew = 'deleted';
  // Simple calculation based on Levenshtein distance.
  function compareArrays(oldArray, newArray, options) {
      // For backward compatibility, if the third arg is actually a bool, interpret
      // it as the old parameter 'dontLimitMoves'. Newer code should use { dontLimitMoves: true }.
      options = (typeof options === 'boolean') ? { 'dontLimitMoves': options } : (options || {});
      oldArray = oldArray || [];
      newArray = newArray || [];

      if (oldArray.length < newArray.length)
          return compareSmallArrayToBigArray(oldArray, newArray, statusNotInOld, statusNotInNew, options);
      else
          return compareSmallArrayToBigArray(newArray, oldArray, statusNotInNew, statusNotInOld, options);
  }


  function compareSmallArrayToBigArray(smlArray, bigArray, statusNotInSml, statusNotInBig, options) {
      var myMin = Math.min,
          myMax = Math.max,
          editDistanceMatrix = [],
          smlIndex, smlIndexMax = smlArray.length,
          bigIndex, bigIndexMax = bigArray.length,
          compareRange = (bigIndexMax - smlIndexMax) || 1,
          maxDistance = smlIndexMax + bigIndexMax + 1,
          thisRow, lastRow,
          bigIndexMaxForRow, bigIndexMinForRow;

      for (smlIndex = 0; smlIndex <= smlIndexMax; smlIndex++) {
          lastRow = thisRow;
          editDistanceMatrix.push(thisRow = []);
          bigIndexMaxForRow = myMin(bigIndexMax, smlIndex + compareRange);
          bigIndexMinForRow = myMax(0, smlIndex - 1);
          for (bigIndex = bigIndexMinForRow; bigIndex <= bigIndexMaxForRow; bigIndex++) {
              if (!bigIndex)
                  thisRow[bigIndex] = smlIndex + 1;
              else if (!smlIndex)  // Top row - transform empty array into new array via additions
                  thisRow[bigIndex] = bigIndex + 1;
              else if (smlArray[smlIndex - 1] === bigArray[bigIndex - 1])
                  thisRow[bigIndex] = lastRow[bigIndex - 1];                  // copy value (no edit)
              else {
                  var northDistance = lastRow[bigIndex] || maxDistance;       // not in big (deletion)
                  var westDistance = thisRow[bigIndex - 1] || maxDistance;    // not in small (addition)
                  thisRow[bigIndex] = myMin(northDistance, westDistance) + 1;
              }
          }
      }

      var editScript = [], meMinusOne, notInSml = [], notInBig = [];
      for (smlIndex = smlIndexMax, bigIndex = bigIndexMax; smlIndex || bigIndex;) {
          meMinusOne = editDistanceMatrix[smlIndex][bigIndex] - 1;
          if (bigIndex && meMinusOne === editDistanceMatrix[smlIndex][bigIndex-1]) {
              notInSml.push(editScript[editScript.length] = {     // added
                  'status': statusNotInSml,
                  'value': bigArray[--bigIndex],
                  'index': bigIndex });
          } else if (smlIndex && meMinusOne === editDistanceMatrix[smlIndex - 1][bigIndex]) {
              notInBig.push(editScript[editScript.length] = {     // deleted
                  'status': statusNotInBig,
                  'value': smlArray[--smlIndex],
                  'index': smlIndex });
          } else {
              --bigIndex;
              --smlIndex;
              if (!options['sparse']) {
                  editScript.push({
                      'status': "retained",
                      'value': bigArray[bigIndex] });
              }
          }
      }

      // Set a limit on the number of consecutive non-matching comparisons; having it a multiple of
      // smlIndexMax keeps the time complexity of this algorithm linear.
      findMovesInArrayComparison(notInBig, notInSml, !options['dontLimitMoves'] && smlIndexMax * 10);

      return editScript.reverse();
  }

  //
  // This becomes ko.options
  // --
  //
  // This is the root 'options', which must be extended by others.

  var options = {
      deferUpdates: false,

      useOnlyNativeEvents: false,

      protoProperty: '__ko_proto__',

      // Modify the default attribute from `data-bind`.
      defaultBindingAttribute: 'data-bind',

      // Enable/disable <!-- ko binding: ... -> style bindings
      allowVirtualElements: true,

      // Global variables that can be accessed from bindings.
      bindingGlobals: window,

      // An instance of the binding provider.
      bindingProviderInstance: null,

      // jQuery will be automatically set to window.jQuery in applyBindings
      // if it is (strictly equal to) undefined.  Set it to false or null to
      // disable automatically setting jQuery.
      jQuery: window && window.jQuery,

      taskScheduler: null,

      debug: false,

      onError: function (e) { throw e; },

      set: function (name, value) {
          options[name] = value;
      }
  };

  Object.defineProperty(options, '$', {
      get: function () { return options.jQuery; }
  });

  function catchFunctionErrors(delegate) {
      return options.onError ? function () {
          try {
              return delegate.apply(this, arguments);
          } catch (e) {
              options.onError(e);
          }
      } : delegate;
  }

  function deferError(error) {
      safeSetTimeout(function () { options.onError(error); }, 0);
  }


  function safeSetTimeout(handler, timeout) {
      return setTimeout(catchFunctionErrors(handler), timeout);
  }

  function throttleFn(callback, timeout) {
      var timeoutInstance;
      return function () {
          if (!timeoutInstance) {
              timeoutInstance = safeSetTimeout(function () {
                  timeoutInstance = undefined;
                  callback();
              }, timeout);
          }
      };
  }

  function debounceFn(callback, timeout) {
      var timeoutInstance;
      return function () {
          clearTimeout(timeoutInstance);
          timeoutInstance = safeSetTimeout(callback, timeout);
      };
  }

  //
  // Detection and Workarounds for Internet Explorer
  //
  /* eslint no-empty: 0 */

  // Detect IE versions for bug workarounds (uses IE conditionals, not UA string, for robustness)
  // Note that, since IE 10 does not support conditional comments, the following logic only detects IE < 10.
  // Currently this is by design, since IE 10+ behaves correctly when treated as a standard browser.
  // If there is a future need to detect specific versions of IE10+, we will amend this.
  var ieVersion = document && (function() {
      var version = 3, div = document.createElement('div'), iElems = div.getElementsByTagName('i');

      // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
      while (
          div.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
          iElems[0]
      ) {}
      return version > 4 ? version : undefined;
  }());

  var isIe6 = ieVersion === 6;
  var isIe7 = ieVersion === 7;

  //
  // Object functions
  //

  function extend(target, source) {
      if (source) {
          for(var prop in source) {
              if(source.hasOwnProperty(prop)) {
                  target[prop] = source[prop];
              }
          }
      }
      return target;
  }

  function objectForEach(obj, action) {
      for (var prop in obj) {
          if (obj.hasOwnProperty(prop)) {
              action(prop, obj[prop]);
          }
      }
  }


  function objectMap(source, mapping) {
      if (!source)
          return source;
      var target = {};
      for (var prop in source) {
          if (source.hasOwnProperty(prop)) {
              target[prop] = mapping(source[prop], prop, source);
          }
      }
      return target;
  }

  var protoProperty$1 = options.protoProperty;

  var canSetPrototype = ({ __proto__: [] } instanceof Array);

  function setPrototypeOf(obj, proto) {
      obj.__proto__ = proto;
      return obj;
  }

  var setPrototypeOfOrExtend = canSetPrototype ? setPrototypeOf : extend;

  function hasPrototype(instance, prototype) {
      if ((instance === null) || (instance === undefined) || (instance[protoProperty$1] === undefined)) return false;
      if (instance[protoProperty$1] === prototype) return true;
      return hasPrototype(instance[protoProperty$1], prototype); // Walk the prototype chain
  }

  //
  // String (and JSON)
  //


  function stringTrim (string) {
      return string === null || string === undefined ? '' :
          string.trim ?
              string.trim() :
              string.toString().replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
  }

  //
  // ES6 Symbols
  //

  var useSymbols = typeof Symbol === 'function';

  function createSymbolOrString(identifier) {
      return useSymbols ? Symbol(identifier) : identifier;
  }

  //
  // jQuery
  //
  // TODO: deprecate in favour of options.$

  var jQueryInstance = window && window.jQuery;

  function domNodeIsContainedBy (node, containedByNode) {
      if (node === containedByNode)
          return true;
      if (node.nodeType === 11)
          return false; // Fixes issue #1162 - can't use node.contains for document fragments on IE8
      if (containedByNode.contains)
          return containedByNode.contains(node.nodeType === 3 ? node.parentNode : node);
      if (containedByNode.compareDocumentPosition)
          return (containedByNode.compareDocumentPosition(node) & 16) == 16;
      while (node && node != containedByNode) {
          node = node.parentNode;
      }
      return !!node;
  }

  function domNodeIsAttachedToDocument (node) {
      return domNodeIsContainedBy(node, node.ownerDocument.documentElement);
  }

  function anyDomNodeIsAttachedToDocument(nodes) {
      return !!arrayFirst(nodes, domNodeIsAttachedToDocument);
  }

  function tagNameLower(element) {
      // For HTML elements, tagName will always be upper case; for XHTML elements, it'll be lower case.
      // Possible future optimization: If we know it's an element from an XHTML document (not HTML),
      // we don't need to do the .toLowerCase() as it will always be lower case anyway.
      return element && element.tagName && element.tagName.toLowerCase();
  }

  //
  // DOM node data
  //
  // import {createSymbolOrString} from '../symbol.js'

  var uniqueId = 0;
  var dataStoreKeyExpandoPropertyName = "__ko__data" + new Date();
  var dataStore = {};


  function getAll(node, createIfNotFound) {
      var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
      var hasExistingDataStore = dataStoreKey && (dataStoreKey !== "null") && dataStore[dataStoreKey];
      if (!hasExistingDataStore) {
          if (!createIfNotFound)
              return undefined;
          dataStoreKey = node[dataStoreKeyExpandoPropertyName] = "ko" + uniqueId++;
          dataStore[dataStoreKey] = {};
      }
      return dataStore[dataStoreKey];
  }

  function get(node, key) {
      var allDataForNode = getAll(node, false);
      return allDataForNode === undefined ? undefined : allDataForNode[key];
  }

  function set(node, key, value) {
      if (value === undefined) {
          // Make sure we don't actually create a new domData key if we are actually deleting a value
          if (getAll(node, false) === undefined)
              return;
      }
      var allDataForNode = getAll(node, true);
      allDataForNode[key] = value;
  }

  function clear(node) {
      var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
      if (dataStoreKey) {
          delete dataStore[dataStoreKey];
          node[dataStoreKeyExpandoPropertyName] = null;
          return true; // Exposing "did clean" flag purely so specs can infer whether things have been cleaned up as intended
      }
      return false;
  }

  function nextKey() {
      return (uniqueId++) + dataStoreKeyExpandoPropertyName;
  }

  var domDataKey = nextKey();
  // Node types:
  // 1: Element
  // 8: Comment
  // 9: Document
  var cleanableNodeTypes = { 1: true, 8: true, 9: true };
  var cleanableNodeTypesWithDescendants = { 1: true, 9: true };

  function getDisposeCallbacksCollection(node, createIfNotFound) {
      var allDisposeCallbacks = get(node, domDataKey);
      if ((allDisposeCallbacks === undefined) && createIfNotFound) {
          allDisposeCallbacks = [];
          set(node, domDataKey, allDisposeCallbacks);
      }
      return allDisposeCallbacks;
  }
  function destroyCallbacksCollection(node) {
      set(node, domDataKey, undefined);
  }

  function cleanSingleNode(node) {
      // Run all the dispose callbacks
      var callbacks = getDisposeCallbacksCollection(node, false);
      if (callbacks) {
          callbacks = callbacks.slice(0); // Clone, as the array may be modified during iteration (typically, callbacks will remove themselves)
          for (var i = 0; i < callbacks.length; i++)
              callbacks[i](node);
      }

      // Erase the DOM data
      clear(node);

      // Perform cleanup needed by external libraries (currently only jQuery, but can be extended)
      cleanExternalData(node);

      // Clear any immediate-child comment nodes, as these wouldn't have been found by
      // node.getElementsByTagName("*") in cleanNode() (comment nodes aren't elements)
      if (cleanableNodeTypesWithDescendants[node.nodeType])
          cleanImmediateCommentTypeChildren(node);
  }

  function cleanImmediateCommentTypeChildren(nodeWithChildren) {
      var child, nextChild = nodeWithChildren.firstChild;
      while (child = nextChild) {
          nextChild = child.nextSibling;
          if (child.nodeType === 8)
              cleanSingleNode(child);
      }
  }

  // Exports
  function addDisposeCallback(node, callback) {
      if (typeof callback != "function")
          throw new Error("Callback must be a function");
      getDisposeCallbacksCollection(node, true).push(callback);
  }

  function removeDisposeCallback(node, callback) {
      var callbacksCollection = getDisposeCallbacksCollection(node, false);
      if (callbacksCollection) {
          arrayRemoveItem(callbacksCollection, callback);
          if (callbacksCollection.length == 0)
              destroyCallbacksCollection(node);
      }
  }

  function cleanNode(node) {
      // First clean this node, where applicable
      if (cleanableNodeTypes[node.nodeType]) {
          cleanSingleNode(node);

          // ... then its descendants, where applicable
          if (cleanableNodeTypesWithDescendants[node.nodeType]) {
              // Clone the descendants list in case it changes during iteration
              var descendants = [];
              arrayPushAll(descendants, node.getElementsByTagName("*"));
              for (var i = 0, j = descendants.length; i < j; i++)
                  cleanSingleNode(descendants[i]);
          }
      }
      return node;
  }

  function removeNode(node) {
      cleanNode(node);
      if (node.parentNode)
          node.parentNode.removeChild(node);
  }

  function cleanExternalData (node) {
      // Special support for jQuery here because it's so commonly used.
      // Many jQuery plugins (including jquery.tmpl) store data using jQuery's equivalent of domData
      // so notify it to tear down any resources associated with the node & descendants here.

      var jQueryCleanNodeFn = jQueryInstance
          ? jQueryInstance.cleanData : null;

      if (jQueryCleanNodeFn) {
          jQueryCleanNodeFn([node]);
      }
  }

  var knownEvents = {};
  var knownEventTypesByEventName = {};
  var keyEventTypeName = (navigator && /Firefox\/2/i.test(navigator.userAgent)) ? 'KeyboardEvent' : 'UIEvents';

  knownEvents[keyEventTypeName] = ['keyup', 'keydown', 'keypress'];

  knownEvents['MouseEvents'] = [
      'click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseover',
      'mouseout', 'mouseenter', 'mouseleave'];


  objectForEach(knownEvents, function(eventType, knownEventsForType) {
      if (knownEventsForType.length) {
          for (var i = 0, j = knownEventsForType.length; i < j; i++)
              knownEventTypesByEventName[knownEventsForType[i]] = eventType;
      }
  });

  function fixUpContinuousNodeArray(continuousNodeArray, parentNode) {
      // Before acting on a set of nodes that were previously outputted by a template function, we have to reconcile
      // them against what is in the DOM right now. It may be that some of the nodes have already been removed, or that
      // new nodes might have been inserted in the middle, for example by a binding. Also, there may previously have been
      // leading comment nodes (created by rewritten string-based templates) that have since been removed during binding.
      // So, this function translates the old "map" output array into its best guess of the set of current DOM nodes.
      //
      // Rules:
      //   [A] Any leading nodes that have been removed should be ignored
      //       These most likely correspond to memoization nodes that were already removed during binding
      //       See https://github.com/knockout/knockout/pull/440
      //   [B] Any trailing nodes that have been remove should be ignored
      //       This prevents the code here from adding unrelated nodes to the array while processing rule [C]
      //       See https://github.com/knockout/knockout/pull/1903
      //   [C] We want to output a continuous series of nodes. So, ignore any nodes that have already been removed,
      //       and include any nodes that have been inserted among the previous collection

      if (continuousNodeArray.length) {
          // The parent node can be a virtual element; so get the real parent node
          parentNode = (parentNode.nodeType === 8 && parentNode.parentNode) || parentNode;

          // Rule [A]
          while (continuousNodeArray.length && continuousNodeArray[0].parentNode !== parentNode)
              continuousNodeArray.splice(0, 1);

          // Rule [B]
          while (continuousNodeArray.length > 1 && continuousNodeArray[continuousNodeArray.length - 1].parentNode !== parentNode)
              continuousNodeArray.length--;

          // Rule [C]
          if (continuousNodeArray.length > 1) {
              var current = continuousNodeArray[0], last = continuousNodeArray[continuousNodeArray.length - 1];
              // Replace with the actual new continuous node set
              continuousNodeArray.length = 0;
              while (current !== last) {
                  continuousNodeArray.push(current);
                  current = current.nextSibling;
              }
              continuousNodeArray.push(last);
          }
      }
      return continuousNodeArray;
  }

  var commentNodesHaveTextProperty = document && document.createComment("test").text === "<!--test-->";

  var startCommentRegex = commentNodesHaveTextProperty ? /^<!--\s*ko(?:\s+([\s\S]+))?\s*-->$/ : /^\s*ko(?:\s+([\s\S]+))?\s*$/;
  var endCommentRegex =   commentNodesHaveTextProperty ? /^<!--\s*\/ko\s*-->$/ : /^\s*\/ko\s*$/;
  var htmlTagsWithOptionallyClosingChildren = { 'ul': true, 'ol': true };

  function isStartComment(node) {
      return (node.nodeType == 8) && startCommentRegex.test(commentNodesHaveTextProperty ? node.text : node.nodeValue);
  }

  function isEndComment(node) {
      return (node.nodeType == 8) && endCommentRegex.test(commentNodesHaveTextProperty ? node.text : node.nodeValue);
  }

  function getVirtualChildren(startComment, allowUnbalanced) {
      var currentNode = startComment;
      var depth = 1;
      var children = [];
      while (currentNode = currentNode.nextSibling) {
          if (isEndComment(currentNode)) {
              depth--;
              if (depth === 0)
                  return children;
          }

          children.push(currentNode);

          if (isStartComment(currentNode))
              depth++;
      }
      if (!allowUnbalanced)
          throw new Error("Cannot find closing comment tag to match: " + startComment.nodeValue);
      return null;
  }

  function getMatchingEndComment(startComment, allowUnbalanced) {
      var allVirtualChildren = getVirtualChildren(startComment, allowUnbalanced);
      if (allVirtualChildren) {
          if (allVirtualChildren.length > 0)
              return allVirtualChildren[allVirtualChildren.length - 1].nextSibling;
          return startComment.nextSibling;
      } else
          return null; // Must have no matching end comment, and allowUnbalanced is true
  }

  function getUnbalancedChildTags(node) {
      // e.g., from <div>OK</div><!-- ko blah --><span>Another</span>, returns: <!-- ko blah --><span>Another</span>
      //       from <div>OK</div><!-- /ko --><!-- /ko -->,             returns: <!-- /ko --><!-- /ko -->
      var childNode = node.firstChild, captureRemaining = null;
      if (childNode) {
          do {
              if (captureRemaining)                   // We already hit an unbalanced node and are now just scooping up all subsequent nodes
                  captureRemaining.push(childNode);
              else if (isStartComment(childNode)) {
                  var matchingEndComment = getMatchingEndComment(childNode, /* allowUnbalanced: */ true);
                  if (matchingEndComment)             // It's a balanced tag, so skip immediately to the end of this virtual set
                      childNode = matchingEndComment;
                  else
                      captureRemaining = [childNode]; // It's unbalanced, so start capturing from this point
              } else if (isEndComment(childNode)) {
                  captureRemaining = [childNode];     // It's unbalanced (if it wasn't, we'd have skipped over it already), so start capturing
              }
          } while (childNode = childNode.nextSibling);
      }
      return captureRemaining;
  }

  var allowedBindings = {};
  function childNodes(node) {
      return isStartComment(node) ? getVirtualChildren(node) : node.childNodes;
  }

  function emptyNode(node) {
      if (!isStartComment(node))
          emptyDomNode(node);
      else {
          var virtualChildren = childNodes(node);
          for (var i = 0, j = virtualChildren.length; i < j; i++)
              removeNode(virtualChildren[i]);
      }
  }

  function setDomNodeChildren(node, childNodes) {
      if (!isStartComment(node))
          setRegularDomNodeChildren(node, childNodes);
      else {
          emptyNode(node);
          var endCommentNode = node.nextSibling; // Must be the next sibling, as we just emptied the children
          for (var i = 0, j = childNodes.length; i < j; i++)
              endCommentNode.parentNode.insertBefore(childNodes[i], endCommentNode);
      }
  }

  function prepend(containerNode, nodeToPrepend) {
      if (!isStartComment(containerNode)) {
          if (containerNode.firstChild)
              containerNode.insertBefore(nodeToPrepend, containerNode.firstChild);
          else
              containerNode.appendChild(nodeToPrepend);
      } else {
          // Start comments must always have a parent and at least one following sibling (the end comment)
          containerNode.parentNode.insertBefore(nodeToPrepend, containerNode.nextSibling);
      }
  }

  function insertAfter(containerNode, nodeToInsert, insertAfterNode) {
      if (!insertAfterNode) {
          prepend(containerNode, nodeToInsert);
      } else if (!isStartComment(containerNode)) {
          // Insert after insertion point
          if (insertAfterNode.nextSibling)
              containerNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
          else
              containerNode.appendChild(nodeToInsert);
      } else {
          // Children of start comments must always have a parent and at least one following sibling (the end comment)
          containerNode.parentNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
      }
  }

  function firstChild(node) {
      if (!isStartComment(node))
          return node.firstChild;
      if (!node.nextSibling || isEndComment(node.nextSibling))
          return null;
      return node.nextSibling;
  }

  function nextSibling(node) {
      if (isStartComment(node))
          node = getMatchingEndComment(node);
      if (node.nextSibling && isEndComment(node.nextSibling))
          return null;
      return node.nextSibling;
  }

  function normaliseVirtualElementDomStructure(elementVerified) {
      // Workaround for https://github.com/SteveSanderson/knockout/issues/155
      // (IE <= 8 or IE 9 quirks mode parses your HTML weirdly, treating closing </li> tags as if they don't exist, thereby moving comment nodes
      // that are direct descendants of <ul> into the preceding <li>)
      if (!htmlTagsWithOptionallyClosingChildren[tagNameLower(elementVerified)])
          return;

      // Scan immediate children to see if they contain unbalanced comment tags. If they do, those comment tags
      // must be intended to appear *after* that child, so move them there.
      var childNode = elementVerified.firstChild;
      if (childNode) {
          do {
              if (childNode.nodeType === 1) {
                  var unbalancedTags = getUnbalancedChildTags(childNode);
                  if (unbalancedTags) {
                      // Fix up the DOM by moving the unbalanced tags to where they most likely were intended to be placed - *after* the child
                      var nodeToInsertBefore = childNode.nextSibling;
                      for (var i = 0; i < unbalancedTags.length; i++) {
                          if (nodeToInsertBefore)
                              elementVerified.insertBefore(unbalancedTags[i], nodeToInsertBefore);
                          else
                              elementVerified.appendChild(unbalancedTags[i]);
                      }
                  }
              }
          } while (childNode = childNode.nextSibling);
      }
  }

  function moveCleanedNodesToContainerElement(nodes) {
      // Ensure it's a real array, as we're about to reparent the nodes and
      // we don't want the underlying collection to change while we're doing that.
      var nodesArray = makeArray(nodes);
      var templateDocument = (nodesArray[0] && nodesArray[0].ownerDocument) || document;

      var container = templateDocument.createElement('div');
      for (var i = 0, j = nodesArray.length; i < j; i++) {
          container.appendChild(cleanNode(nodesArray[i]));
      }
      return container;
  }

  function setRegularDomNodeChildren (domNode, childNodes) {
      emptyDomNode(domNode);
      if (childNodes) {
          for (var i = 0, j = childNodes.length; i < j; i++)
              domNode.appendChild(childNodes[i]);
      }
  }

  function replaceDomNodes (nodeToReplaceOrNodeArray, newNodesArray) {
      var nodesToReplaceArray = nodeToReplaceOrNodeArray.nodeType ? [nodeToReplaceOrNodeArray] : nodeToReplaceOrNodeArray;
      if (nodesToReplaceArray.length > 0) {
          var insertionPoint = nodesToReplaceArray[0];
          var parent = insertionPoint.parentNode;
          for (var i = 0, j = newNodesArray.length; i < j; i++)
              parent.insertBefore(newNodesArray[i], insertionPoint);
          for (i = 0, j = nodesToReplaceArray.length; i < j; i++) {
              removeNode(nodesToReplaceArray[i]);
          }
      }
  }

  function emptyDomNode (domNode) {
      while (domNode.firstChild) {
          removeNode(domNode.firstChild);
      }
  }

  var none = [0, "", ""];
  var table = [1, "<table>", "</table>"];
  var tbody = [2, "<table><tbody>", "</tbody></table>"];
  var colgroup = [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"];
  var tr = [3, "<table><tbody><tr>", "</tr></tbody></table>"];
  var select = [1, "<select multiple='multiple'>", "</select>"];
  var fieldset = [1, "<fieldset>", "</fieldset>"];
  var map = [1, "<map>", "</map>"];
  var object = [1, "<object>", "</object>"];
  var lookup = {
          'area': map,
          'col': colgroup,
          'colgroup': table,
          'caption': table,
          'legend': fieldset,
          'thead': table,
          'tbody': table,
          'tfoot': table,
          'tr': tbody,
          'td': tr,
          'th': tr,
          'option': select,
          'optgroup': select,
          'param': object
      };
  var supportsTemplateTag = 'content' in document.createElement('template');
  function getWrap(tags) {
      var m = tags.match(/^<([a-z]+)[ >]/);
      return (m && lookup[m[1]]) || none;
  }


  function simpleHtmlParse(html, documentContext) {
      documentContext || (documentContext = document);
      var windowContext = documentContext['parentWindow'] || documentContext['defaultView'] || window;

      // Based on jQuery's "clean" function, but only accounting for table-related elements.
      // If you have referenced jQuery, this won't be used anyway - KO will use jQuery's "clean" function directly

      // Note that there's still an issue in IE < 9 whereby it will discard comment nodes that are the first child of
      // a descendant node. For example: "<div><!-- mycomment -->abc</div>" will get parsed as "<div>abc</div>"
      // This won't affect anyone who has referenced jQuery, and there's always the workaround of inserting a dummy node
      // (possibly a text node) in front of the comment. So, KO does not attempt to workaround this IE issue automatically at present.

      // Trim whitespace, otherwise indexOf won't work as expected
      var tags = stringTrim(html).toLowerCase(), div = documentContext.createElement("div"),
          wrap = getWrap(tags),
          depth = wrap[0];

      // Go to html and back, then peel off extra wrappers
      // Note that we always prefix with some dummy text, because otherwise, IE<9 will strip out leading comment nodes in descendants. Total madness.
      var markup = "ignored<div>" + wrap[1] + html + wrap[2] + "</div>";
      if (typeof windowContext['innerShiv'] == "function") {
          // Note that innerShiv is deprecated in favour of html5shiv. We should consider adding
          // support for html5shiv (except if no explicit support is needed, e.g., if html5shiv
          // somehow shims the native APIs so it just works anyway)
          div.appendChild(windowContext['innerShiv'](markup));
      } else {
          div.innerHTML = markup;
      }

      // Move to the right depth
      while (depth--)
          div = div.lastChild;

      return makeArray(div.lastChild.childNodes);
  }


  function templateHtmlParse(html, documentContext) {
      if (!documentContext) { documentContext = document; }
      var template = documentContext.createElement('template');
      template.innerHTML = html;
      return makeArray(template.content.childNodes);
  }


  function jQueryHtmlParse(html, documentContext) {
      // jQuery's "parseHTML" function was introduced in jQuery 1.8.0 and is a documented public API.
      if (jQueryInstance.parseHTML) {
          return jQueryInstance.parseHTML(html, documentContext) || []; // Ensure we always return an array and never null
      } else {
          // For jQuery < 1.8.0, we fall back on the undocumented internal "clean" function.
          var elems = jQueryInstance.clean([html], documentContext);

          // As of jQuery 1.7.1, jQuery parses the HTML by appending it to some dummy parent nodes held in an in-memory document fragment.
          // Unfortunately, it never clears the dummy parent nodes from the document fragment, so it leaks memory over time.
          // Fix this by finding the top-most dummy parent element, and detaching it from its owner fragment.
          if (elems && elems[0]) {
              // Find the top-most parent element that's a direct child of a document fragment
              var elem = elems[0];
              while (elem.parentNode && elem.parentNode.nodeType !== 11 /* i.e., DocumentFragment */)
                  elem = elem.parentNode;
              // ... then detach it
              if (elem.parentNode)
                  elem.parentNode.removeChild(elem);
          }

          return elems;
      }
  }


  function parseHtmlFragment(html, documentContext) {
      return supportsTemplateTag ? templateHtmlParse(html, documentContext) :
          // Note jQuery's HTML parsing fails on element names like tr-*.
          // See: https://github.com/jquery/jquery/pull/1988
          (jQueryInstance ? jQueryHtmlParse(html, documentContext) :
          // Benefit from jQuery's on old browsers, where possible

          simpleHtmlParse(html, documentContext));
          // ... otherwise, this simple logic will do in most common cases.
  }


  function setHtml(node, html) {
      emptyDomNode(node);

      // There's few cases where we would want to display a stringified
      // function, so we unwrap it.
      if (typeof html === 'function') {
          html = html();
      }

      if ((html !== null) && (html !== undefined)) {
          if (typeof html !== 'string')
              html = html.toString();

          // jQuery contains a lot of sophisticated code to parse arbitrary HTML fragments,
          // for example <tr> elements which are not normally allowed to exist on their own.
          // If you've referenced jQuery we'll use that rather than duplicating its code.
          if (jQueryInstance) {
              jQueryInstance(node).html(html);
          } else {
              // ... otherwise, use KO's own parsing logic.
              var parsedNodes = parseHtmlFragment(html, node.ownerDocument);
              for (var i = 0; i < parsedNodes.length; i++)
                  node.appendChild(parsedNodes[i]);
          }
      }
  }

  var memos = {};

  function randomMax8HexChars() {
      return (((1 + Math.random()) * 0x100000000) | 0).toString(16).substring(1);
  }

  function generateRandomId() {
      return randomMax8HexChars() + randomMax8HexChars();
  }

  function findMemoNodes(rootNode, appendToArray) {
      if (!rootNode)
          return;
      if (rootNode.nodeType == 8) {
          var memoId = parseMemoText(rootNode.nodeValue);
          if (memoId != null)
              appendToArray.push({ domNode: rootNode, memoId: memoId });
      } else if (rootNode.nodeType == 1) {
          for (var i = 0, childNodes = rootNode.childNodes, j = childNodes.length; i < j; i++)
              findMemoNodes(childNodes[i], appendToArray);
      }
  }


  function memoize(callback) {
      if (typeof callback != "function")
          throw new Error("You can only pass a function to memoization.memoize()");
      var memoId = generateRandomId();
      memos[memoId] = callback;
      return "<!--[ko_memo:" + memoId + "]-->";
  }

  function unmemoize(memoId, callbackParams) {
      var callback = memos[memoId];
      if (callback === undefined)
          throw new Error("Couldn't find any memo with ID " + memoId + ". Perhaps it's already been unmemoized.");
      try {
          callback.apply(null, callbackParams || []);
          return true;
      }
      finally { delete memos[memoId]; }
  }

  function unmemoizeDomNodeAndDescendants(domNode, extraCallbackParamsArray) {
      var memos = [];
      findMemoNodes(domNode, memos);
      for (var i = 0, j = memos.length; i < j; i++) {
          var node = memos[i].domNode;
          var combinedParams = [node];
          if (extraCallbackParamsArray)
              arrayPushAll(combinedParams, extraCallbackParamsArray);
          unmemoize(memos[i].memoId, combinedParams);
          node.nodeValue = ""; // Neuter this node so we don't try to unmemoize it again
          if (node.parentNode)
              node.parentNode.removeChild(node); // If possible, erase it totally (not always possible - someone else might just hold a reference to it then call unmemoizeDomNodeAndDescendants again)
      }
  }

  function parseMemoText(memoText) {
      var match = memoText.match(/^\[ko_memo\:(.*?)\]$/);
      return match ? match[1] : null;
  }

  var taskQueue = [];
  var taskQueueLength = 0;
  var nextHandle = 1;
  var nextIndexToProcess = 0;
  if (window.MutationObserver && !(window.navigator && window.navigator.standalone)) {
      // Chrome 27+, Firefox 14+, IE 11+, Opera 15+, Safari 6.1+
      // From https://github.com/petkaantonov/bluebird * Copyright (c) 2014 Petka Antonov * License: MIT
      options.taskScheduler = (function (callback) {
          var div = document.createElement("div");
          new MutationObserver(callback).observe(div, {attributes: true});
          return function () { div.classList.toggle("foo"); };
      })(scheduledProcess);
  } else if (document && "onreadystatechange" in document.createElement("script")) {
      // IE 6-10
      // From https://github.com/YuzuJS/setImmediate * Copyright (c) 2012 Barnesandnoble.com, llc, Donavon West, and Domenic Denicola * License: MIT
      options.taskScheduler = function (callback) {
          var script = document.createElement("script");
          script.onreadystatechange = function () {
              script.onreadystatechange = null;
              document.documentElement.removeChild(script);
              script = null;
              callback();
          };
          document.documentElement.appendChild(script);
      };
  } else {
      options.taskScheduler = function (callback) {
          setTimeout(callback, 0);
      };
  }

  function processTasks() {
      if (taskQueueLength) {
          // Each mark represents the end of a logical group of tasks and the number of these groups is
          // limited to prevent unchecked recursion.
          var mark = taskQueueLength, countMarks = 0;

          // nextIndexToProcess keeps track of where we are in the queue; processTasks can be called recursively without issue
          for (var task; nextIndexToProcess < taskQueueLength; ) {
              if (task = taskQueue[nextIndexToProcess++]) {
                  if (nextIndexToProcess > mark) {
                      if (++countMarks >= 5000) {
                          nextIndexToProcess = taskQueueLength;   // skip all tasks remaining in the queue since any of them could be causing the recursion
                          deferError(Error("'Too much recursion' after processing " + countMarks + " task groups."));
                          break;
                      }
                      mark = taskQueueLength;
                  }
                  try {
                      task();
                  } catch (ex) {
                      deferError(ex);
                  }
              }
          }
      }
  }

  function scheduledProcess() {
      processTasks();

      // Reset the queue
      nextIndexToProcess = taskQueueLength = taskQueue.length = 0;
  }

  function scheduleTaskProcessing() {
      options.taskScheduler(scheduledProcess);
  }


  function schedule(func) {
      if (!taskQueueLength) {
          scheduleTaskProcessing();
      }

      taskQueue[taskQueueLength++] = func;
      return nextHandle++;
  }

  function cancel(handle) {
      var index = handle - (nextHandle - taskQueueLength);
      if (index >= nextIndexToProcess && index < taskQueueLength) {
          taskQueue[index] = null;
      }
  }

  function deferUpdates(target) {
      if (!target._deferUpdates) {
          target._deferUpdates = true;
          target.limit(function (callback) {
              var handle;
              return function () {
                  cancel(handle);
                  handle = schedule(callback);
                  target.notifySubscribers(undefined, 'dirty');
              };
          });
      }
  }

  var primitiveTypes = {
      'undefined': 1, 'boolean': 1, 'number': 1, 'string': 1
  };


  function valuesArePrimitiveAndEqual(a, b) {
      var oldValueIsPrimitive = (a === null) || (typeof(a) in primitiveTypes);
      return oldValueIsPrimitive ? (a === b) : false;
  }


  function applyExtenders(requestedExtenders) {
      var target = this;
      if (requestedExtenders) {
          objectForEach(requestedExtenders, function(key, value) {
              var extenderHandler = extenders[key];
              if (typeof extenderHandler == 'function') {
                  target = extenderHandler(target, value) || target;
              } else {
                  options.onError(new Error("Extender not found: " + key));
              }
          });
      }
      return target;
  }

  /*
                  --- DEFAULT EXTENDERS ---
   */


  // Change when notifications are published.
  function notify(target, notifyWhen) {
      target.equalityComparer = notifyWhen == "always" ?
          null :  // null equalityComparer means to always notify
          valuesArePrimitiveAndEqual;
  }


  function deferred(target, option) {
      if (option !== true) {
          throw new Error('The \'deferred\' extender only accepts the value \'true\', because it is not supported to turn deferral off once enabled.');
      }
      deferUpdates(target);
  }


  function rateLimit(target, options) {
      var timeout, method, limitFunction;

      if (typeof options == 'number') {
          timeout = options;
      } else {
          timeout = options.timeout;
          method = options.method;
      }

      // rateLimit supersedes deferred updates
      target._deferUpdates = false;

      limitFunction = method == 'notifyWhenChangesStop' ? debounceFn : throttleFn;

      target.limit(function(callback) {
          return limitFunction(callback, timeout);
      });
  }


  var extenders = {
      notify: notify,
      deferred: deferred,
      rateLimit: rateLimit
  };

  function subscription(target, callback, disposeCallback) {
      this._target = target;
      this.callback = callback;
      this.disposeCallback = disposeCallback;
      this.isDisposed = false;
  }

  subscription.prototype.dispose = function () {
      this.isDisposed = true;
      this.disposeCallback();
  };

  function subscribable() {
      setPrototypeOfOrExtend(this, ko_subscribable_fn);
      ko_subscribable_fn.init(this);
  }

  var defaultEvent = "change";


  var ko_subscribable_fn = {
      init: function(instance) {
          instance._subscriptions = {};
          instance._versionNumber = 1;
      },

      subscribe: function (callback, callbackTarget, event) {
          var self = this;

          event = event || defaultEvent;
          var boundCallback = callbackTarget ? callback.bind(callbackTarget) : callback;

          var subscriptionInstance = new subscription(self, boundCallback, function () {
              arrayRemoveItem(self._subscriptions[event], subscriptionInstance);
              if (self.afterSubscriptionRemove)
                  self.afterSubscriptionRemove(event);
          });

          if (self.beforeSubscriptionAdd)
              self.beforeSubscriptionAdd(event);

          if (!self._subscriptions[event])
              self._subscriptions[event] = [];
          self._subscriptions[event].push(subscriptionInstance);

          return subscriptionInstance;
      },

      notifySubscribers: function (valueToNotify, event) {
          event = event || defaultEvent;
          if (event === defaultEvent) {
              this.updateVersion();
          }
          if (this.hasSubscriptionsForEvent(event)) {
              try {
                  begin(); // Begin suppressing dependency detection (by setting the top frame to undefined)
                  for (var a = this._subscriptions[event].slice(0), i = 0, subscriptionInstance; subscriptionInstance = a[i]; ++i) {
                      // In case a subscription was disposed during the arrayForEach cycle, check
                      // for isDisposed on each subscription before invoking its callback
                      if (!subscriptionInstance.isDisposed)
                          subscriptionInstance.callback(valueToNotify);
                  }
              } finally {
                  end(); // End suppressing dependency detection
              }
          }
      },

      getVersion: function () {
          return this._versionNumber;
      },

      hasChanged: function (versionToCheck) {
          return this.getVersion() !== versionToCheck;
      },

      updateVersion: function () {
          ++this._versionNumber;
      },

      hasSubscriptionsForEvent: function(event) {
          return this._subscriptions[event] && this._subscriptions[event].length;
      },

      getSubscriptionsCount: function (event) {
          if (event) {
              return this._subscriptions[event] && this._subscriptions[event].length || 0;
          } else {
              var total = 0;
              objectForEach(this._subscriptions, function(eventName, subscriptions) {
                  if (eventName !== 'dirty')
                      total += subscriptions.length;
              });
              return total;
          }
      },

      isDifferent: function(oldValue, newValue) {
          return !this.equalityComparer ||
                 !this.equalityComparer(oldValue, newValue);
      },

      extend: applyExtenders
  };


  // For browsers that support proto assignment, we overwrite the prototype of each
  // observable instance. Since observables are functions, we need Function.prototype
  // to still be in the prototype chain.
  if (canSetPrototype) {
      setPrototypeOf(ko_subscribable_fn, Function.prototype);
  }

  subscribable.fn = ko_subscribable_fn;


  function isSubscribable(instance) {
      return instance != null && typeof instance.subscribe == "function" && typeof instance.notifySubscribers == "function";
  }

  var outerFrames = [];
  var currentFrame;
  var lastId = 0;
  // Return a unique ID that can be assigned to an observable for dependency tracking.
  // Theoretically, you could eventually overflow the number storage size, resulting
  // in duplicate IDs. But in JavaScript, the largest exact integral value is 2^53
  // or 9,007,199,254,740,992. If you created 1,000,000 IDs per second, it would
  // take over 285 years to reach that number.
  // Reference http://blog.vjeux.com/2010/javascript/javascript-max_int-number-limits.html
  function getId() {
      return ++lastId;
  }

  function begin(options) {
      outerFrames.push(currentFrame);
      currentFrame = options;
  }

  function end() {
      currentFrame = outerFrames.pop();
  }


  function registerDependency(subscribable) {
      if (currentFrame) {
          if (!isSubscribable(subscribable))
              throw new Error("Only subscribable things can act as dependencies");
          currentFrame.callback.call(currentFrame.callbackTarget, subscribable, subscribable._id || (subscribable._id = getId()));
      }
  }

  function ignore(callback, callbackTarget, callbackArgs) {
      try {
          begin();
          return callback.apply(callbackTarget, callbackArgs || []);
      } finally {
          end();
      }
  }

  var observableLatestValue = createSymbolOrString('_latestValue');


  function observable(initialValue) {
      function Observable() {
          if (arguments.length > 0) {
              // Write

              // Ignore writes if the value hasn't changed
              if (Observable.isDifferent(Observable[observableLatestValue], arguments[0])) {
                  Observable.valueWillMutate();
                  Observable[observableLatestValue] = arguments[0];
                  Observable.valueHasMutated();
              }
              return this; // Permits chained assignments
          }
          else {
              // Read
              registerDependency(Observable); // The caller only needs to be notified of changes if they did a "read" operation
              return Observable[observableLatestValue];
          }
      }

      Observable[observableLatestValue] = initialValue;

      // Inherit from 'subscribable'
      if (!canSetPrototype) {
          // 'subscribable' won't be on the prototype chain unless we put it there directly
          extend(Observable, subscribable.fn);
      }
      subscribable.fn.init(Observable);

      // Inherit from 'observable'
      setPrototypeOfOrExtend(Observable, observable.fn);

      if (options.deferUpdates) {
          deferUpdates(Observable);
      }

      return Observable;
  }

  // Define prototype for observables
  observable.fn = {
      equalityComparer: valuesArePrimitiveAndEqual,
      peek: function() { return this[observableLatestValue]; },
      valueHasMutated: function () { this.notifySubscribers(this[observableLatestValue]); },
      valueWillMutate: function () {
          this.notifySubscribers(this[observableLatestValue], 'beforeChange');
      }
  };



  // Moved out of "limit" to avoid the extra closure
  function limitNotifySubscribers(value, event) {
      if (!event || event === defaultEvent) {
          this._limitChange(value);
      } else if (event === 'beforeChange') {
          this._limitBeforeChange(value);
      } else {
          this._origNotifySubscribers(value, event);
      }
  }

  // Add `limit` function to the subscribable prototype
  subscribable.fn.limit = function limit(limitFunction) {
      var self = this, selfIsObservable = isObservable(self),
          ignoreBeforeChange, previousValue, pendingValue, beforeChange = 'beforeChange';

      if (!self._origNotifySubscribers) {
          self._origNotifySubscribers = self.notifySubscribers;
          self.notifySubscribers = limitNotifySubscribers;
      }

      var finish = limitFunction(function() {
          self._notificationIsPending = false;

          // If an observable provided a reference to itself, access it to get the latest value.
          // This allows computed observables to delay calculating their value until needed.
          if (selfIsObservable && pendingValue === self) {
              pendingValue = self();
          }
          ignoreBeforeChange = false;
          if (self.isDifferent(previousValue, pendingValue)) {
              self._origNotifySubscribers(previousValue = pendingValue);
          }
      });

      self._limitChange = function(value) {
          self._notificationIsPending = ignoreBeforeChange = true;
          pendingValue = value;
          finish();
      };
      self._limitBeforeChange = function(value) {
          if (!ignoreBeforeChange) {
              previousValue = value;
              self._origNotifySubscribers(value, beforeChange);
          }
      };
  };


  // Note that for browsers that don't support proto assignment, the
  // inheritance chain is created manually in the observable constructor
  if (canSetPrototype) {
      setPrototypeOf(observable.fn, subscribable.fn);
  }

  var protoProperty = observable.protoProperty = options.protoProperty;
  observable.fn[protoProperty] = observable;

  function isObservable(instance) {
      return hasPrototype(instance, observable);
  }

  function unwrap(value) {
      return isObservable(value) ? value() : value;
  }

  function peek(value) {
      return isObservable(value) ? value.peek() : value;
  }

  var arrayChangeEventName = 'arrayChange';


  function trackArrayChanges(target, options) {
      // Use the provided options--each call to trackArrayChanges overwrites the previously set options
      target.compareArrayOptions = {};
      if (options && typeof options == "object") {
          extend(target.compareArrayOptions, options);
      }
      target.compareArrayOptions.sparse = true;

      // Only modify the target observable once
      if (target.cacheDiffForKnownOperation) {
          return;
      }
      var trackingChanges = false,
          cachedDiff = null,
          arrayChangeSubscription,
          pendingNotifications = 0,
          underlyingBeforeSubscriptionAddFunction = target.beforeSubscriptionAdd,
          underlyingAfterSubscriptionRemoveFunction = target.afterSubscriptionRemove;

      // Watch "subscribe" calls, and for array change events, ensure change tracking is enabled
      target.beforeSubscriptionAdd = function (event) {
          if (underlyingBeforeSubscriptionAddFunction)
              underlyingBeforeSubscriptionAddFunction.call(target, event);
          if (event === arrayChangeEventName) {
              trackChanges();
          }
      };

      // Watch "dispose" calls, and for array change events, ensure change tracking is disabled when all are disposed
      target.afterSubscriptionRemove = function (event) {
          if (underlyingAfterSubscriptionRemoveFunction)
              underlyingAfterSubscriptionRemoveFunction.call(target, event);
          if (event === arrayChangeEventName && !target.hasSubscriptionsForEvent(arrayChangeEventName)) {
              arrayChangeSubscription.dispose();
              trackingChanges = false;
          }
      };

      function trackChanges() {
          // Calling 'trackChanges' multiple times is the same as calling it once
          if (trackingChanges) {
              return;
          }

          trackingChanges = true;

          // Intercept "notifySubscribers" to track how many times it was called.
          var underlyingNotifySubscribersFunction = target['notifySubscribers'];
          target['notifySubscribers'] = function(valueToNotify, event) {
              if (!event || event === defaultEvent) {
                  ++pendingNotifications;
              }
              return underlyingNotifySubscribersFunction.apply(this, arguments);
          };

          // Each time the array changes value, capture a clone so that on the next
          // change it's possible to produce a diff
          var previousContents = [].concat(target.peek() || []);
          cachedDiff = null;
          arrayChangeSubscription = target.subscribe(function(currentContents) {
              // Make a copy of the current contents and ensure it's an array
              currentContents = [].concat(currentContents || []);

              // Compute the diff and issue notifications, but only if someone is listening
              if (target.hasSubscriptionsForEvent(arrayChangeEventName)) {
                  var changes = getChanges(previousContents, currentContents);
              }

              // Eliminate references to the old, removed items, so they can be GCed
              previousContents = currentContents;
              cachedDiff = null;
              pendingNotifications = 0;

              if (changes && changes.length) {
                  target['notifySubscribers'](changes, arrayChangeEventName);
              }
          });
      }

      function getChanges(previousContents, currentContents) {
          // We try to re-use cached diffs.
          // The scenarios where pendingNotifications > 1 are when using rate-limiting or the Deferred Updates
          // plugin, which without this check would not be compatible with arrayChange notifications. Normally,
          // notifications are issued immediately so we wouldn't be queueing up more than one.
          if (!cachedDiff || pendingNotifications > 1) {
              cachedDiff = trackArrayChanges.compareArrays(previousContents, currentContents, target.compareArrayOptions);
          }

          return cachedDiff;
      }

      target.cacheDiffForKnownOperation = function(rawArray, operationName, args) {
          var index, argsIndex;
          // Only run if we're currently tracking changes for this observable array
          // and there aren't any pending deferred notifications.
          if (!trackingChanges || pendingNotifications) {
              return;
          }
          var diff = [],
              arrayLength = rawArray.length,
              argsLength = args.length,
              offset = 0;

          function pushDiff(status, value, index) {
              return diff[diff.length] = { 'status': status, 'value': value, 'index': index };
          }
          switch (operationName) {
          case 'push':
              offset = arrayLength;
          case 'unshift':
              for (index = 0; index < argsLength; index++) {
                  pushDiff('added', args[index], offset + index);
              }
              break;

          case 'pop':
              offset = arrayLength - 1;
          case 'shift':
              if (arrayLength) {
                  pushDiff('deleted', rawArray[offset], offset);
              }
              break;

          case 'splice':
              // Negative start index means 'from end of array'. After that we clamp to [0...arrayLength].
              // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
              var startIndex = Math.min(Math.max(0, args[0] < 0 ? arrayLength + args[0] : args[0]), arrayLength),
                  endDeleteIndex = argsLength === 1 ? arrayLength : Math.min(startIndex + (args[1] || 0), arrayLength),
                  endAddIndex = startIndex + argsLength - 2,
                  endIndex = Math.max(endDeleteIndex, endAddIndex),
                  additions = [], deletions = [];
              for (index = startIndex, argsIndex = 2; index < endIndex; ++index, ++argsIndex) {
                  if (index < endDeleteIndex)
                      deletions.push(pushDiff('deleted', rawArray[index], index));
                  if (index < endAddIndex)
                      additions.push(pushDiff('added', args[argsIndex], index));
              }
              findMovesInArrayComparison(deletions, additions);
              break;

          default:
              return;
          }
          cachedDiff = diff;
      };
  }


  // Expose compareArrays for testing.
  trackArrayChanges.compareArrays = compareArrays;


  // Add the trackArrayChanges extender so we can use
  // obs.extend({ trackArrayChanges: true })
  extenders.trackArrayChanges = trackArrayChanges;

  function observableArray(initialValues) {
      initialValues = initialValues || [];

      if (typeof initialValues != 'object' || !('length' in initialValues))
          throw new Error("The argument passed when initializing an observable array must be an array, or null, or undefined.");

      var result = observable(initialValues);
      setPrototypeOfOrExtend(result, observableArray.fn);
      trackArrayChanges(result);
          // ^== result.extend({ trackArrayChanges: true })
      return result;
  }

  observableArray.fn = {
      remove: function (valueOrPredicate) {
          var underlyingArray = this.peek();
          var removedValues = [];
          var predicate = typeof valueOrPredicate == "function" && !isObservable(valueOrPredicate) ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
          for (var i = 0; i < underlyingArray.length; i++) {
              var value = underlyingArray[i];
              if (predicate(value)) {
                  if (removedValues.length === 0) {
                      this.valueWillMutate();
                  }
                  removedValues.push(value);
                  underlyingArray.splice(i, 1);
                  i--;
              }
          }
          if (removedValues.length) {
              this.valueHasMutated();
          }
          return removedValues;
      },

      removeAll: function (arrayOfValues) {
          // If you passed zero args, we remove everything
          if (arrayOfValues === undefined) {
              var underlyingArray = this.peek();
              var allValues = underlyingArray.slice(0);
              this.valueWillMutate();
              underlyingArray.splice(0, underlyingArray.length);
              this.valueHasMutated();
              return allValues;
          }
          // If you passed an arg, we interpret it as an array of entries to remove
          if (!arrayOfValues)
              return [];
          return this['remove'](function (value) {
              return arrayIndexOf(arrayOfValues, value) >= 0;
          });
      },

      destroy: function (valueOrPredicate) {
          var underlyingArray = this.peek();
          var predicate = typeof valueOrPredicate == "function" && !isObservable(valueOrPredicate) ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
          this.valueWillMutate();
          for (var i = underlyingArray.length - 1; i >= 0; i--) {
              var value = underlyingArray[i];
              if (predicate(value))
                  underlyingArray[i]["_destroy"] = true;
          }
          this.valueHasMutated();
      },

      destroyAll: function (arrayOfValues) {
          // If you passed zero args, we destroy everything
          if (arrayOfValues === undefined)
              return this.destroy(function() { return true; });

          // If you passed an arg, we interpret it as an array of entries to destroy
          if (!arrayOfValues)
              return [];
          return this.destroy(function (value) {
              return arrayIndexOf(arrayOfValues, value) >= 0;
          });
      },

      indexOf: function (item) {
          var underlyingArray = this();
          return arrayIndexOf(underlyingArray, item);
      },

      replace: function(oldItem, newItem) {
          var index = this.indexOf(oldItem);
          if (index >= 0) {
              this.valueWillMutate();
              this.peek()[index] = newItem;
              this.valueHasMutated();
          }
      }
  };


  // Note that for browsers that don't support proto assignment, the
  // inheritance chain is created manually in the ko.observableArray constructor
  if (canSetPrototype) {
      setPrototypeOf(observableArray.fn, observable.fn);
  }

  // Populate ko.observableArray.fn with read/write functions from native arrays
  // Important: Do not add any additional functions here that may reasonably be used to *read* data from the array
  // because we'll eval them without causing subscriptions, so ko.computed output could end up getting stale
  arrayForEach(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function (methodName) {
      observableArray.fn[methodName] = function () {
          // Use "peek" to avoid creating a subscription in any computed that we're executing in the context of
          // (for consistency with mutating regular observables)
          var underlyingArray = this.peek();
          this.valueWillMutate();
          this.cacheDiffForKnownOperation(underlyingArray, methodName, arguments);
          var methodCallResult = underlyingArray[methodName].apply(underlyingArray, arguments);
          this.valueHasMutated();
          // The native sort and reverse methods return a reference to the array, but it makes more sense to return the observable array instead.
          return methodCallResult === underlyingArray ? this : methodCallResult;
      };
  });

  // Populate ko.observableArray.fn with read-only functions from native arrays
  arrayForEach(["slice"], function (methodName) {
      observableArray.fn[methodName] = function () {
          var underlyingArray = this();
          return underlyingArray[methodName].apply(underlyingArray, arguments);
      };
  });

  var templateScript = 1;
  var templateTextArea = 2;
  var templateTemplate = 3;
  var templateElement = 4;
  function domElement(element) {
      this.domElement = element;

      if (!element) { return; }
      var tagNameLower$$ = tagNameLower(element);
      this.templateType =
          tagNameLower$$ === "script" ? templateScript :
          tagNameLower$$ === "textarea" ? templateTextArea :
              // For browsers with proper <template> element support, where the .content property gives a document fragment
          tagNameLower$$ == "template" && element.content && element.content.nodeType === 11 ? templateTemplate :
          templateElement;
  }

  domElement.prototype.text = function(/* valueToWrite */) {
      var elemContentsProperty = this.templateType === templateScript ? "text"
                               : this.templateType === templateTextArea ? "value"
                               : "innerHTML";

      if (arguments.length == 0) {
          return this.domElement[elemContentsProperty];
      } else {
          var valueToWrite = arguments[0];
          if (elemContentsProperty === "innerHTML")
              setHtml(this.domElement, valueToWrite);
          else
              this.domElement[elemContentsProperty] = valueToWrite;
      }
  };

  var dataDomDataPrefix = nextKey() + "_";
  domElement.prototype.data = function(key /*, valueToWrite */) {
      if (arguments.length === 1) {
          return get(this.domElement, dataDomDataPrefix + key);
      } else {
          set(this.domElement, dataDomDataPrefix + key, arguments[1]);
      }
  };

  var templatesDomDataKey = nextKey();
  function getTemplateDomData(element) {
      return get(element, templatesDomDataKey) || {};
  }
  function setTemplateDomData(element, data) {
      set(element, templatesDomDataKey, data);
  }

  domElement.prototype.nodes = function(/* valueToWrite */) {
      var element = this.domElement;
      if (arguments.length == 0) {
          var templateData = getTemplateDomData(element),
              containerData = templateData.containerData;
          return containerData || (
              this.templateType === templateTemplate ? element.content :
              this.templateType === templateElement ? element :
              undefined);
      } else {
          var valueToWrite = arguments[0];
          setTemplateDomData(element, {containerData: valueToWrite});
      }
  };

  // ---- ko.templateSources.anonymousTemplate -----
  // Anonymous templates are normally saved/retrieved as DOM nodes through "nodes".
  // For compatibility, you can also read "text"; it will be serialized from the nodes on demand.
  // Writing to "text" is still supported, but then the template data will not be available as DOM nodes.

  function anonymousTemplate(element) {
      this.domElement = element;
  }

  anonymousTemplate.prototype = new domElement();
  anonymousTemplate.prototype.constructor = anonymousTemplate;
  anonymousTemplate.prototype.text = function(/* valueToWrite */) {
      if (arguments.length == 0) {
          var templateData = getTemplateDomData(this.domElement);
          if (templateData.textData === undefined && templateData.containerData)
              templateData.textData = templateData.containerData.innerHTML;
          return templateData.textData;
      } else {
          var valueToWrite = arguments[0];
          setTemplateDomData(this.domElement, {textData: valueToWrite});
      }
  };

  function templateEngine() { };

  extend(templateEngine.prototype, {
    renderTemplateSource: function (templateSource, bindingContext, options, templateDocument) {
        options.onError("Override renderTemplateSource");
    },

    createJavaScriptEvaluatorBlock: function (script) {
        options.onError("Override createJavaScriptEvaluatorBlock");
    },

    makeTemplateSource: function(template, templateDocument) {
        // Named template
        if (typeof template == "string") {
            templateDocument = templateDocument || document;
            var elem = templateDocument.getElementById(template);
            if (!elem)
                options.onError("Cannot find template with ID " + template);
            return new domElement(elem);
        } else if ((template.nodeType == 1) || (template.nodeType == 8)) {
            // Anonymous template
            return new anonymousTemplate(template);
        } else
            options.onError("Unknown template type: " + template);
    },

    renderTemplate: function (template, bindingContext, options, templateDocument) {
        var templateSource = this['makeTemplateSource'](template, templateDocument);
        return this.renderTemplateSource(templateSource, bindingContext, options, templateDocument);
    }
  })

  var computedState = createSymbolOrString('_state');

  function computed(evaluatorFunctionOrOptions, evaluatorFunctionTarget, options$$) {
      if (typeof evaluatorFunctionOrOptions === "object") {
          // Single-parameter syntax - everything is on this "options" param
          options$$ = evaluatorFunctionOrOptions;
      } else {
          // Multi-parameter syntax - construct the options according to the params passed
          options$$ = options$$ || {};
          if (evaluatorFunctionOrOptions) {
              options$$.read = evaluatorFunctionOrOptions;
          }
      }
      if (typeof options$$.read != "function")
          throw Error("Pass a function that returns the value of the computed");

      var writeFunction = options$$.write;
      var state = {
          latestValue: undefined,
          isStale: true,
          isBeingEvaluated: false,
          suppressDisposalUntilDisposeWhenReturnsFalse: false,
          isDisposed: false,
          pure: false,
          isSleeping: false,
          readFunction: options$$.read,
          evaluatorFunctionTarget: evaluatorFunctionTarget || options$$.owner,
          disposeWhenNodeIsRemoved: options$$.disposeWhenNodeIsRemoved || options$$.disposeWhenNodeIsRemoved || null,
          disposeWhen: options$$.disposeWhen || options$$.disposeWhen,
          domNodeDisposalCallback: null,
          dependencyTracking: {},
          dependenciesCount: 0,
          evaluationTimeoutInstance: null
      };

      function computedObservable() {
          if (arguments.length > 0) {
              if (typeof writeFunction === "function") {
                  // Writing a value
                  writeFunction.apply(state.evaluatorFunctionTarget, arguments);
              } else {
                  throw new Error("Cannot write a value to a computed unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.");
              }
              return this; // Permits chained assignments
          } else {
              // Reading the value
              registerDependency(computedObservable);
              if (state.isStale || (state.isSleeping && computedObservable.haveDependenciesChanged())) {
                  computedObservable.evaluateImmediate();
              }
              return state.latestValue;
          }
      }

      computedObservable[computedState] = state;
      computedObservable.hasWriteFunction = typeof writeFunction === "function";

      // Inherit from 'subscribable'
      if (!canSetPrototype) {
          // 'subscribable' won't be on the prototype chain unless we put it there directly
          extend(computedObservable, subscribable.fn);
      }
      subscribable.fn.init(computedObservable);

      // Inherit from 'computed'
      setPrototypeOfOrExtend(computedObservable, computed.fn);

      if (options$$.pure) {
          state.pure = true;
          state.isSleeping = true;     // Starts off sleeping; will awake on the first subscription
          extend(computedObservable, pureComputedOverrides);
      } else if (options$$.deferEvaluation) {
          extend(computedObservable, deferEvaluationOverrides);
      }

      if (options.deferUpdates) {
          extenders.deferred(computedObservable, true);
      }

      if (options.debug) {
          // #1731 - Aid debugging by exposing the computed's options
          computedObservable._options = options$$;
      }

      if (state.disposeWhenNodeIsRemoved) {
          // Since this computed is associated with a DOM node, and we don't want to dispose the computed
          // until the DOM node is *removed* from the document (as opposed to never having been in the document),
          // we'll prevent disposal until "disposeWhen" first returns false.
          state.suppressDisposalUntilDisposeWhenReturnsFalse = true;

          // disposeWhenNodeIsRemoved: true can be used to opt into the "only dispose after first false result"
          // behaviour even if there's no specific node to watch. In that case, clear the option so we don't try
          // to watch for a non-node's disposal. This technique is intended for KO's internal use only and shouldn't
          // be documented or used by application code, as it's likely to change in a future version of KO.
          if (!state.disposeWhenNodeIsRemoved.nodeType) {
              state.disposeWhenNodeIsRemoved = null;
          }
      }

      // Evaluate, unless sleeping or deferEvaluation is true
      if (!state.isSleeping && !options$$.deferEvaluation) {
          computedObservable.evaluateImmediate();
      }

      // Attach a DOM node disposal callback so that the computed will be proactively disposed as soon as the node is
      // removed using ko.removeNode. But skip if isActive is false (there will never be any dependencies to dispose).
      if (state.disposeWhenNodeIsRemoved && computedObservable.isActive()) {
          addDisposeCallback(state.disposeWhenNodeIsRemoved, state.domNodeDisposalCallback = function () {
              computedObservable.dispose();
          });
      }

      return computedObservable;
  }

  // Utility function that disposes a given dependencyTracking entry
  function computedDisposeDependencyCallback(id, entryToDispose) {
      if (entryToDispose !== null && entryToDispose.dispose) {
          entryToDispose.dispose();
      }
  }

  // This function gets called each time a dependency is detected while evaluating a computed.
  // It's factored out as a shared function to avoid creating unnecessary function instances during evaluation.
  function computedBeginDependencyDetectionCallback(subscribable, id) {
      var computedObservable = this.computedObservable,
          state = computedObservable[computedState];
      if (!state.isDisposed) {
          if (this.disposalCount && this.disposalCandidates[id]) {
              // Don't want to dispose this subscription, as it's still being used
              computedObservable.addDependencyTracking(id, subscribable, this.disposalCandidates[id]);
              this.disposalCandidates[id] = null; // No need to actually delete the property - disposalCandidates is a transient object anyway
              --this.disposalCount;
          } else if (!state.dependencyTracking[id]) {
              // Brand new subscription - add it
              computedObservable.addDependencyTracking(id, subscribable, state.isSleeping ? { _target: subscribable } : computedObservable.subscribeToDependency(subscribable));
          }
      }
  }

  computed.fn = {
      equalityComparer: valuesArePrimitiveAndEqual,
      getDependenciesCount: function () {
          return this[computedState].dependenciesCount;
      },
      addDependencyTracking: function (id, target, trackingObj) {
          if (this[computedState].pure && target === this) {
              throw Error("A 'pure' computed must not be called recursively");
          }

          this[computedState].dependencyTracking[id] = trackingObj;
          trackingObj._order = this[computedState].dependenciesCount++;
          trackingObj._version = target.getVersion();
      },
      haveDependenciesChanged: function () {
          var id, dependency, dependencyTracking = this[computedState].dependencyTracking;
          for (id in dependencyTracking) {
              if (dependencyTracking.hasOwnProperty(id)) {
                  dependency = dependencyTracking[id];
                  if (dependency._target.hasChanged(dependency._version)) {
                      return true;
                  }
              }
          }
      },
      markDirty: function () {
          // Process "dirty" events if we can handle delayed notifications
          if (this._evalDelayed && !this[computedState].isBeingEvaluated) {
              this._evalDelayed();
          }
      },
      isActive: function () {
          return this[computedState].isStale || this[computedState].dependenciesCount > 0;
      },
      respondToChange: function () {
          // Ignore "change" events if we've already scheduled a delayed notification
          if (!this._notificationIsPending) {
              this.evaluatePossiblyAsync();
          }
      },
      subscribeToDependency: function (target) {
          if (target._deferUpdates && !this[computedState].disposeWhenNodeIsRemoved) {
              var dirtySub = target.subscribe(this.markDirty, this, 'dirty'),
                  changeSub = target.subscribe(this.respondToChange, this);
              return {
                  _target: target,
                  dispose: function () {
                      dirtySub.dispose();
                      changeSub.dispose();
                  }
              };
          } else {
              return target.subscribe(this.evaluatePossiblyAsync, this);
          }
      },
      evaluatePossiblyAsync: function () {
          var computedObservable = this,
              throttleEvaluationTimeout = computedObservable.throttleEvaluation;
          if (throttleEvaluationTimeout && throttleEvaluationTimeout >= 0) {
              clearTimeout(this[computedState].evaluationTimeoutInstance);
              this[computedState].evaluationTimeoutInstance = safeSetTimeout(function () {
                  computedObservable.evaluateImmediate(true /*notifyChange*/);
              }, throttleEvaluationTimeout);
          } else if (computedObservable._evalDelayed) {
              computedObservable._evalDelayed();
          } else {
              computedObservable.evaluateImmediate(true /*notifyChange*/);
          }
      },
      evaluateImmediate: function (notifyChange) {
          var computedObservable = this,
              state = computedObservable[computedState],
              disposeWhen = state.disposeWhen;

          if (state.isBeingEvaluated) {
              // If the evaluation of a ko.computed causes side effects, it's possible that it will trigger its own re-evaluation.
              // This is not desirable (it's hard for a developer to realise a chain of dependencies might cause this, and they almost
              // certainly didn't intend infinite re-evaluations). So, for predictability, we simply prevent ko.computeds from causing
              // their own re-evaluation. Further discussion at https://github.com/SteveSanderson/knockout/pull/387
              return;
          }

          // Do not evaluate (and possibly capture new dependencies) if disposed
          if (state.isDisposed) {
              return;
          }

          if (state.disposeWhenNodeIsRemoved && !domNodeIsAttachedToDocument(state.disposeWhenNodeIsRemoved) || disposeWhen && disposeWhen()) {
              // See comment above about suppressDisposalUntilDisposeWhenReturnsFalse
              if (!state.suppressDisposalUntilDisposeWhenReturnsFalse) {
                  computedObservable.dispose();
                  return;
              }
          } else {
              // It just did return false, so we can stop suppressing now
              state.suppressDisposalUntilDisposeWhenReturnsFalse = false;
          }

          state.isBeingEvaluated = true;
          try {
              this.evaluateImmediate_CallReadWithDependencyDetection(notifyChange);
          } finally {
              state.isBeingEvaluated = false;
          }

          if (!state.dependenciesCount) {
              computedObservable.dispose();
          }
      },
      evaluateImmediate_CallReadWithDependencyDetection: function (notifyChange) {
          // This function is really just part of the evaluateImmediate logic. You would never call it from anywhere else.
          // Factoring it out into a separate function means it can be independent of the try/catch block in evaluateImmediate,
          // which contributes to saving about 40% off the CPU overhead of computed evaluation (on V8 at least).

          var computedObservable = this,
              state = computedObservable[computedState];

          // Initially, we assume that none of the subscriptions are still being used (i.e., all are candidates for disposal).
          // Then, during evaluation, we cross off any that are in fact still being used.
          var isInitial = state.pure ? undefined : !state.dependenciesCount,   // If we're evaluating when there are no previous dependencies, it must be the first time
              dependencyDetectionContext = {
                  computedObservable: computedObservable,
                  disposalCandidates: state.dependencyTracking,
                  disposalCount: state.dependenciesCount
              };

          begin({
              callbackTarget: dependencyDetectionContext,
              callback: computedBeginDependencyDetectionCallback,
              computed: computedObservable,
              isInitial: isInitial
          });

          state.dependencyTracking = {};
          state.dependenciesCount = 0;

          var newValue = this.evaluateImmediate_CallReadThenEndDependencyDetection(state, dependencyDetectionContext);

          if (computedObservable.isDifferent(state.latestValue, newValue)) {
              if (!state.isSleeping) {
                  computedObservable.notifySubscribers(state.latestValue, "beforeChange");
              }

              state.latestValue = newValue;

              if (state.isSleeping) {
                  computedObservable.updateVersion();
              } else if (notifyChange) {
                  computedObservable.notifySubscribers(state.latestValue);
              }
          }

          if (isInitial) {
              computedObservable.notifySubscribers(state.latestValue, "awake");
          }
      },
      evaluateImmediate_CallReadThenEndDependencyDetection: function (state, dependencyDetectionContext) {
          // This function is really part of the evaluateImmediate_CallReadWithDependencyDetection logic.
          // You'd never call it from anywhere else. Factoring it out means that evaluateImmediate_CallReadWithDependencyDetection
          // can be independent of try/finally blocks, which contributes to saving about 40% off the CPU
          // overhead of computed evaluation (on V8 at least).

          try {
              var readFunction = state.readFunction;
              return state.evaluatorFunctionTarget ? readFunction.call(state.evaluatorFunctionTarget) : readFunction();
          } finally {
              end();

              // For each subscription no longer being used, remove it from the active subscriptions list and dispose it
              if (dependencyDetectionContext.disposalCount && !state.isSleeping) {
                  objectForEach(dependencyDetectionContext.disposalCandidates, computedDisposeDependencyCallback);
              }

              state.isStale = false;
          }
      },
      peek: function () {
          // Peek won't re-evaluate, except while the computed is sleeping or to get the initial value when "deferEvaluation" is set.
          var state = this[computedState];
          if ((state.isStale && !state.dependenciesCount) || (state.isSleeping && this.haveDependenciesChanged())) {
              this.evaluateImmediate();
          }
          return state.latestValue;
      },
      limit: function (limitFunction) {
          // Override the limit function with one that delays evaluation as well
          subscribable.fn.limit.call(this, limitFunction);
          this._evalDelayed = function () {
              this._limitBeforeChange(this[computedState].latestValue);

              this[computedState].isStale = true; // Mark as dirty

              // Pass the observable to the "limit" code, which will access it when
              // it's time to do the notification.
              this._limitChange(this);
          };
      },
      dispose: function () {
          var state = this[computedState];
          if (!state.isSleeping && state.dependencyTracking) {
              objectForEach(state.dependencyTracking, function (id, dependency) {
                  if (dependency.dispose)
                      dependency.dispose();
              });
          }
          if (state.disposeWhenNodeIsRemoved && state.domNodeDisposalCallback) {
              removeDisposeCallback(state.disposeWhenNodeIsRemoved, state.domNodeDisposalCallback);
          }
          state.dependencyTracking = null;
          state.dependenciesCount = 0;
          state.isDisposed = true;
          state.isStale = false;
          state.isSleeping = false;
          state.disposeWhenNodeIsRemoved = null;
          state.readFunction = null;
          if (options.debug) {
              this._options = null;
          }
      }
  };

  var pureComputedOverrides = {
      beforeSubscriptionAdd: function (event) {
          // If asleep, wake up the computed by subscribing to any dependencies.
          var computedObservable = this,
              state = computedObservable[computedState];
          if (!state.isDisposed && state.isSleeping && event == 'change') {
              state.isSleeping = false;
              if (state.isStale || computedObservable.haveDependenciesChanged()) {
                  state.dependencyTracking = null;
                  state.dependenciesCount = 0;
                  state.isStale = true;
                  computedObservable.evaluateImmediate();
              } else {
                  // First put the dependencies in order
                  var dependeciesOrder = [];
                  objectForEach(state.dependencyTracking, function (id, dependency) {
                      dependeciesOrder[dependency._order] = id;
                  });
                  // Next, subscribe to each one
                  arrayForEach(dependeciesOrder, function (id, order) {
                      var dependency = state.dependencyTracking[id],
                          subscription = computedObservable.subscribeToDependency(dependency._target);
                      subscription._order = order;
                      subscription._version = dependency._version;
                      state.dependencyTracking[id] = subscription;
                  });
              }
              if (!state.isDisposed) {     // test since evaluating could trigger disposal
                  computedObservable.notifySubscribers(state.latestValue, "awake");
              }
          }
      },
      afterSubscriptionRemove: function (event) {
          var state = this[computedState];
          if (!state.isDisposed && event == 'change' && !this.hasSubscriptionsForEvent('change')) {
              objectForEach(state.dependencyTracking, function (id, dependency) {
                  if (dependency.dispose) {
                      state.dependencyTracking[id] = {
                          _target: dependency._target,
                          _order: dependency._order,
                          _version: dependency._version
                      };
                      dependency.dispose();
                  }
              });
              state.isSleeping = true;
              this.notifySubscribers(undefined, "asleep");
          }
      },
      getVersion: function () {
          // Because a pure computed is not automatically updated while it is sleeping, we can't
          // simply return the version number. Instead, we check if any of the dependencies have
          // changed and conditionally re-evaluate the computed observable.
          var state = this[computedState];
          if (state.isSleeping && (state.isStale || this.haveDependenciesChanged())) {
              this.evaluateImmediate();
          }
          return subscribable.fn.getVersion.call(this);
      }
  };

  var deferEvaluationOverrides = {
      beforeSubscriptionAdd: function (event) {
          // This will force a computed with deferEvaluation to evaluate when the first subscription is registered.
          if (event == 'change' || event == 'beforeChange') {
              this.peek();
          }
      }
  };

  // Note that for browsers that don't support proto assignment, the
  // inheritance chain is created manually in the ko.computed constructor
  if (canSetPrototype) {
      setPrototypeOf(computed.fn, subscribable.fn);
  }

  // Set the proto chain values for ko.hasPrototype
  var protoProp = observable.protoProperty; // == "__ko_proto__"
  computed[protoProp] = observable;
  computed.fn[protoProp] = computed;

  function throttleExtender(target, timeout) {
      // Throttling means two things:

      // (1) For dependent observables, we throttle *evaluations* so that, no matter how fast its dependencies
      //     notify updates, the target doesn't re-evaluate (and hence doesn't notify) faster than a certain rate
      target.throttleEvaluation = timeout;

      // (2) For writable targets (observables, or writable dependent observables), we throttle *writes*
      //     so the target cannot change value synchronously or faster than a certain rate
      var writeTimeoutInstance = null;
      return computed({
          read: target,
          write: function(value) {
              clearTimeout(writeTimeoutInstance);
              writeTimeoutInstance = setTimeout(function() {
                  target(value);
              }, timeout);
          }
      });
  }


  extenders.throttle = throttleExtender;

  var storedBindingContextDomDataKey = nextKey();



  // The bindingContext constructor is only called directly to create the root context. For child
  // contexts, use bindingContext.createChildContext or bindingContext.extend.
  function bindingContext(dataItemOrAccessor, parentContext, dataItemAlias, extendCallback, settings) {

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


  function storedBindingContextForNode(node, bindingContext) {
      if (arguments.length == 2) {
          set(node, storedBindingContextDomDataKey, bindingContext);
          if (bindingContext._subscribable)
              bindingContext._subscribable._addNode(node);
      } else {
          return get(node, storedBindingContextDomDataKey);
      }
  }

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
  function getBindingHandler(bindingKey) {
      return options.bindingProviderInstance.bindingHandlers.get(bindingKey);
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
      return objectMap(ignore(callback), function(value, key) {
          return function() {
              return callback()[key];
          };
      });
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
          validator = bindingHandler.allowVirtualElements || allowedBindings[bindingName];
      }
      if (!validator)
          throw new Error("The binding '" + bindingName + "' cannot be used with virtual elements");
  }

  function applyBindingsToDescendantsInternal (bindingContext, elementOrVirtualElement, bindingContextsMayDifferFromDomParentElement) {
      var currentChild,
          nextInQueue = firstChild(elementOrVirtualElement),
          provider = options.bindingProviderInstance,
          preprocessNode = provider.preprocessNode;

      // Preprocessing allows a binding provider to mutate a node before bindings are applied to it. For example it's
      // possible to insert new siblings after it, and/or replace the node with a different one. This can be used to
      // implement custom binding syntaxes, such as {{ value }} for string interpolation, or custom element types that
      // trigger insertion of <template> contents at that point in the document.
      if (preprocessNode) {
          while (currentChild = nextInQueue) {
              nextInQueue = nextSibling(currentChild);
              preprocessNode.call(provider, currentChild);
          }
          // Reset nextInQueue for the next loop
          nextInQueue = firstChild(elementOrVirtualElement);
      }

      while (currentChild = nextInQueue) {
          // Keep a record of the next child *before* applying bindings, in case the binding removes the current child from its position
          nextInQueue = nextSibling(currentChild);
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
          normaliseVirtualElementDomStructure(nodeVerified);

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

  var boundElementDomDataKey = nextKey();


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
              ignore(function() {
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
      var alreadyBound = get(node, boundElementDomDataKey);
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
          set(node, boundElementDomDataKey, true);
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

  function applyBindings(viewModelOrBindingContext, rootNode) {
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
          error.message = "Unable to process binding \"" + spec.bindingKey
              + "\" in binding \"" + bindingText
              + "\"\nMessage: " + error.message;
      } else {
          // During: 'apply'
          error = spec.errorCaptured;
      }
      extend(error, spec);
      options.onError(error);
  }

  // Objective:
  // * Given an input array, a container DOM node, and a function from array elements to arrays of DOM nodes,
  //   map the array elements to arrays of DOM nodes, concatenate together all these arrays, and use them to populate the container DOM node
  // * Next time we're given the same combination of things (with the array possibly having mutated), update the container DOM node
  //   so that its children is again the concatenation of the mappings of the array elements, but don't re-map any array elements that we
  //   previously mapped - retain those nodes, and just insert/delete other ones

  // "callbackAfterAddingNodes" will be invoked after any "mapping"-generated nodes are inserted into the container node
  // You can use this, for example, to activate bindings on those nodes.

  function mapNodeAndRefreshWhenChanged(containerNode, mapping, valueToMap, callbackAfterAddingNodes, index) {
      // Map this array value inside a dependentObservable so we re-map when any dependency changes
      var mappedNodes = [];
      var dependentObservable = computed(function() {
          var newMappedNodes = mapping(valueToMap, index, fixUpContinuousNodeArray(mappedNodes, containerNode)) || [];

          // On subsequent evaluations, just replace the previously-inserted DOM nodes
          if (mappedNodes.length > 0) {
              replaceDomNodes(mappedNodes, newMappedNodes);
              if (callbackAfterAddingNodes)
                  ignore(callbackAfterAddingNodes, null, [valueToMap, newMappedNodes, index]);
          }

          // Replace the contents of the mappedNodes array, thereby updating the record
          // of which nodes would be deleted if valueToMap was itself later removed
          mappedNodes.length = 0;
          arrayPushAll(mappedNodes, newMappedNodes);
      }, null, { disposeWhenNodeIsRemoved: containerNode, disposeWhen: function() { return !anyDomNodeIsAttachedToDocument(mappedNodes); } });
      return { mappedNodes : mappedNodes, dependentObservable : (dependentObservable.isActive() ? dependentObservable : undefined) };
  }

  var lastMappingResultDomDataKey = nextKey();
  var deletedItemDummyValue = nextKey();
  function setDomNodeChildrenFromArrayMapping(domNode, array, mapping, options, callbackAfterAddingNodes) {
      // Compare the provided array against the previous one
      array = array || [];
      options = options || {};
      var isFirstExecution = get(domNode, lastMappingResultDomDataKey) === undefined;
      var lastMappingResult = get(domNode, lastMappingResultDomDataKey) || [];
      var lastArray = arrayMap(lastMappingResult, function (x) { return x.arrayEntry; });
      var editScript = compareArrays(lastArray, array, options['dontLimitMoves']);

      // Build the new mapping result
      var newMappingResult = [];
      var lastMappingResultIndex = 0;
      var newMappingResultIndex = 0;

      var nodesToDelete = [];
      var itemsToProcess = [];
      var itemsForBeforeRemoveCallbacks = [];
      var itemsForMoveCallbacks = [];
      var itemsForAfterAddCallbacks = [];
      var mapData;

      function itemMovedOrRetained(editScriptIndex, oldPosition) {
          mapData = lastMappingResult[oldPosition];
          if (newMappingResultIndex !== oldPosition)
              itemsForMoveCallbacks[editScriptIndex] = mapData;
          // Since updating the index might change the nodes, do so before calling fixUpContinuousNodeArray
          mapData.indexObservable(newMappingResultIndex++);
          fixUpContinuousNodeArray(mapData.mappedNodes, domNode);
          newMappingResult.push(mapData);
          itemsToProcess.push(mapData);
      }

      function callCallback(callback, items) {
          if (callback) {
              for (var i = 0, n = items.length; i < n; i++) {
                  if (items[i]) {
                      arrayForEach(items[i].mappedNodes, function(node) {
                          callback(node, i, items[i].arrayEntry);
                      });
                  }
              }
          }
      }

      for (var i = 0, editScriptItem, movedIndex; editScriptItem = editScript[i]; i++) {
          movedIndex = editScriptItem['moved'];
          switch (editScriptItem['status']) {
          case "deleted":
              if (movedIndex === undefined) {
                  mapData = lastMappingResult[lastMappingResultIndex];

                  // Stop tracking changes to the mapping for these nodes
                  if (mapData.dependentObservable) {
                      mapData.dependentObservable.dispose();
                      mapData.dependentObservable = undefined;
                  }

                  // Queue these nodes for later removal
                  if (fixUpContinuousNodeArray(mapData.mappedNodes, domNode).length) {
                      if (options['beforeRemove']) {
                          newMappingResult.push(mapData);
                          itemsToProcess.push(mapData);
                          if (mapData.arrayEntry === deletedItemDummyValue) {
                              mapData = null;
                          } else {
                              itemsForBeforeRemoveCallbacks[i] = mapData;
                          }
                      }
                      if (mapData) {
                          nodesToDelete.push.apply(nodesToDelete, mapData.mappedNodes);
                      }
                  }
              }
              lastMappingResultIndex++;
              break;

          case "retained":
              itemMovedOrRetained(i, lastMappingResultIndex++);
              break;

          case "added":
              if (movedIndex !== undefined) {
                  itemMovedOrRetained(i, movedIndex);
              } else {
                  mapData = { arrayEntry: editScriptItem['value'], indexObservable: observable(newMappingResultIndex++) };
                  newMappingResult.push(mapData);
                  itemsToProcess.push(mapData);
                  if (!isFirstExecution)
                      itemsForAfterAddCallbacks[i] = mapData;
              }
              break;
          }
      }

      // Store a copy of the array items we just considered so we can difference it next time
      set(domNode, lastMappingResultDomDataKey, newMappingResult);

      // Call beforeMove first before any changes have been made to the DOM
      callCallback(options['beforeMove'], itemsForMoveCallbacks);

      // Next remove nodes for deleted items (or just clean if there's a beforeRemove callback)
      arrayForEach(nodesToDelete, options['beforeRemove'] ? cleanNode : removeNode);

      // Next add/reorder the remaining items (will include deleted items if there's a beforeRemove callback)
      i = 0;
      for (var nextNode = firstChild(domNode), lastNode, node; mapData = itemsToProcess[i]; i++) {
          // Get nodes for newly added items
          if (!mapData.mappedNodes)
              extend(mapData, mapNodeAndRefreshWhenChanged(domNode, mapping, mapData.arrayEntry, callbackAfterAddingNodes, mapData.indexObservable));

          // Put nodes in the right place if they aren't there already
          for (var j = 0; node = mapData.mappedNodes[j]; nextNode = node.nextSibling, lastNode = node, j++) {
              if (node !== nextNode)
                  insertAfter(domNode, node, lastNode);
          }

          // Run the callbacks for newly added nodes (for example, to apply bindings, etc.)
          if (!mapData.initialized && callbackAfterAddingNodes) {
              callbackAfterAddingNodes(mapData.arrayEntry, mapData.mappedNodes, mapData.indexObservable);
              mapData.initialized = true;
          }
      }

      // If there's a beforeRemove callback, call it after reordering.
      // Note that we assume that the beforeRemove callback will usually be used to remove the nodes using
      // some sort of animation, which is why we first reorder the nodes that will be removed. If the
      // callback instead removes the nodes right away, it would be more efficient to skip reordering them.
      // Perhaps we'll make that change in the future if this scenario becomes more common.
      callCallback(options['beforeRemove'], itemsForBeforeRemoveCallbacks);

      // Replace the stored values of deleted items with a dummy value. This provides two benefits: it marks this item
      // as already "removed" so we won't call beforeRemove for it again, and it ensures that the item won't match up
      // with an actual item in the array and appear as "retained" or "moved".
      for (i = 0; i < itemsForBeforeRemoveCallbacks.length; ++i) {
          if (itemsForBeforeRemoveCallbacks[i]) {
              itemsForBeforeRemoveCallbacks[i].arrayEntry = deletedItemDummyValue;
          }
      }

      // Finally call afterMove and afterAdd callbacks
      callCallback(options['afterMove'], itemsForMoveCallbacks);
      callCallback(options['afterAdd'], itemsForAfterAddCallbacks);
  }

  var _templateEngine;

  function setTemplateEngine(tEngine) {
      if ((tEngine != undefined) && !(tEngine instanceof templateEngine))
          //TODO: ko.templateEngine to appropriate name
          throw new Error("templateEngine must inherit from ko.templateEngine");
      _templateEngine = tEngine;
  }

  function invokeForEachNodeInContinuousRange(firstNode, lastNode, action) {
      var node, nextInQueue = firstNode, firstOutOfRangeNode = nextSibling(lastNode);
      while (nextInQueue && ((node = nextInQueue) !== firstOutOfRangeNode)) {
          nextInQueue = nextSibling(node);
          action(node, nextInQueue);
      }
  }

  function activateBindingsOnContinuousNodeArray(continuousNodeArray, bindingContext) {
      // To be used on any nodes that have been rendered by a template and have been inserted into some parent element
      // Walks through continuousNodeArray (which *must* be continuous, i.e., an uninterrupted sequence of sibling nodes, because
      // the algorithm for walking them relies on this), and for each top-level item in the virtual-element sense,
      // (1) Does a regular "applyBindings" to associate bindingContext with this node and to activate any non-memoized bindings
      // (2) Unmemoizes any memos in the DOM subtree (e.g., to activate bindings that had been memoized during template rewriting)

      if (continuousNodeArray.length) {
          var firstNode = continuousNodeArray[0],
              lastNode = continuousNodeArray[continuousNodeArray.length - 1],
              parentNode = firstNode.parentNode,
              provider = options.bindingProviderInstance,
              preprocessNode = provider.preprocessNode;

          if (preprocessNode) {
              invokeForEachNodeInContinuousRange(firstNode, lastNode, function(node, nextNodeInRange) {
                  var nodePreviousSibling = node.previousSibling;
                  var newNodes = preprocessNode.call(provider, node);
                  if (newNodes) {
                      if (node === firstNode)
                          firstNode = newNodes[0] || nextNodeInRange;
                      if (node === lastNode)
                          lastNode = newNodes[newNodes.length - 1] || nodePreviousSibling;
                  }
              });

              // Because preprocessNode can change the nodes, including the first and last nodes, update continuousNodeArray to match.
              // We need the full set, including inner nodes, because the unmemoize step might remove the first node (and so the real
              // first node needs to be in the array).
              continuousNodeArray.length = 0;
              if (!firstNode) { // preprocessNode might have removed all the nodes, in which case there's nothing left to do
                  return;
              }
              if (firstNode === lastNode) {
                  continuousNodeArray.push(firstNode);
              } else {
                  continuousNodeArray.push(firstNode, lastNode);
                  fixUpContinuousNodeArray(continuousNodeArray, parentNode);
              }
          }

          // Need to applyBindings *before* unmemoziation, because unmemoization might introduce extra nodes (that we don't want to re-bind)
          // whereas a regular applyBindings won't introduce new memoized nodes
          invokeForEachNodeInContinuousRange(firstNode, lastNode, function(node) {
              if (node.nodeType === 1 || node.nodeType === 8)
                  applyBindings(bindingContext, node);
          });
          invokeForEachNodeInContinuousRange(firstNode, lastNode, function(node) {
              if (node.nodeType === 1 || node.nodeType === 8)
                  unmemoizeDomNodeAndDescendants(node, [bindingContext]);
          });

          // Make sure any changes done by applyBindings or unmemoize are reflected in the array
          fixUpContinuousNodeArray(continuousNodeArray, parentNode);
      }
  }

  function getFirstNodeFromPossibleArray(nodeOrNodeArray) {
      return nodeOrNodeArray.nodeType ? nodeOrNodeArray
                                      : nodeOrNodeArray.length > 0 ? nodeOrNodeArray[0]
                                      : null;
  }

  function executeTemplate(targetNodeOrNodeArray, renderMode, template, bindingContext, options) {
      options = options || {};
      var firstTargetNode = targetNodeOrNodeArray && getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
      var templateDocument = (firstTargetNode || template || {}).ownerDocument;
      var templateEngineToUse = (options.templateEngine || _templateEngine);
      var renderedNodesArray = templateEngineToUse.renderTemplate(template, bindingContext, options, templateDocument);

      // Loosely check result is an array of DOM nodes
      if ((typeof renderedNodesArray.length != "number") || (renderedNodesArray.length > 0 && typeof renderedNodesArray[0].nodeType != "number"))
          throw new Error("Template engine must return an array of DOM nodes");

      var haveAddedNodesToParent = false;
      switch (renderMode) {
      case "replaceChildren":
          setDomNodeChildren(targetNodeOrNodeArray, renderedNodesArray);
          haveAddedNodesToParent = true;
          break;
      case "replaceNode":
          replaceDomNodes(targetNodeOrNodeArray, renderedNodesArray);
          haveAddedNodesToParent = true;
          break;
      case "ignoreTargetNode": break;
      default:
          throw new Error("Unknown renderMode: " + renderMode);
      }

      if (haveAddedNodesToParent) {
          activateBindingsOnContinuousNodeArray(renderedNodesArray, bindingContext);
          if (options['afterRender'])
              ignore(options['afterRender'], null, [renderedNodesArray, bindingContext['$data']]);
      }

      return renderedNodesArray;
  }

  function resolveTemplateName(template, data, context) {
      // The template can be specified as:
      if (isObservable(template)) {
          // 1. An observable, with string value
          return template();
      } else if (typeof template === 'function') {
          // 2. A function of (data, context) returning a string
          return template(data, context);
      } else {
          // 3. A string
          return template;
      }
  }

  function renderTemplate(template, dataOrBindingContext, options, targetNodeOrNodeArray, renderMode) {
      options = options || {};
      if ((options.templateEngine || _templateEngine) === undefined)
          throw new Error("Set a template engine before calling renderTemplate");
      renderMode = renderMode || "replaceChildren";

      if (targetNodeOrNodeArray) {
          var firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);

          var whenToDispose = function () { return (!firstTargetNode) || !domNodeIsAttachedToDocument(firstTargetNode); }; // Passive disposal (on next evaluation)
          var activelyDisposeWhenNodeIsRemoved = (firstTargetNode && renderMode == "replaceNode") ? firstTargetNode.parentNode : firstTargetNode;

          return computed( // So the DOM is automatically updated when any dependency changes
              function () {
                  // Ensure we've got a proper binding context to work with
                  var bindingContext$$ = (dataOrBindingContext && (dataOrBindingContext instanceof bindingContext))
                      ? dataOrBindingContext
                      : new bindingContext(dataOrBindingContext, null, null, null, { "exportDependencies": true });

                  var templateName = resolveTemplateName(template, bindingContext$$['$data'], bindingContext$$),
                      renderedNodesArray = executeTemplate(targetNodeOrNodeArray, renderMode, templateName, bindingContext$$, options);

                  if (renderMode == "replaceNode") {
                      targetNodeOrNodeArray = renderedNodesArray;
                      firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
                  }
              },
              null,
              { disposeWhen: whenToDispose, disposeWhenNodeIsRemoved: activelyDisposeWhenNodeIsRemoved }
          );
      } else {
          // We don't yet have a DOM node to evaluate, so use a memo and render the template later when there is a DOM node
          return memoize(function (domNode) {
              renderTemplate(template, dataOrBindingContext, options, domNode, "replaceNode");
          });
      }
  }

  function renderTemplateForEach(template, arrayOrObservableArray, options, targetNode, parentBindingContext) {
      // Since setDomNodeChildrenFromArrayMapping always calls executeTemplateForArrayItem and then
      // activateBindingsCallback for added items, we can store the binding context in the former to use in the latter.
      var arrayItemContext;

      // This will be called by setDomNodeChildrenFromArrayMapping to get the nodes to add to targetNode
      function executeTemplateForArrayItem(arrayValue, index) {
          // Support selecting template as a function of the data being rendered
          arrayItemContext = parentBindingContext['createChildContext'](arrayValue, options['as'], function(context) {
              context['$index'] = index;
          });

          var templateName = resolveTemplateName(template, arrayValue, arrayItemContext);
          return executeTemplate(null, "ignoreTargetNode", templateName, arrayItemContext, options);
      }

      // This will be called whenever setDomNodeChildrenFromArrayMapping has added nodes to targetNode
      var activateBindingsCallback = function(arrayValue, addedNodesArray /*, index */) {
          activateBindingsOnContinuousNodeArray(addedNodesArray, arrayItemContext);
          if (options['afterRender'])
              options['afterRender'](addedNodesArray, arrayValue);

          // release the "cache" variable, so that it can be collected by
          // the GC when its value isn't used from within the bindings anymore.
          arrayItemContext = null;
      };

      return computed(function () {
          var unwrappedArray = unwrap(arrayOrObservableArray) || [];
          if (typeof unwrappedArray.length == "undefined") // Coerce single value into array
              unwrappedArray = [unwrappedArray];

          // Filter out any entries marked as destroyed
          var filteredArray = arrayFilter(unwrappedArray, function(item) {
              return options['includeDestroyed'] || item === undefined || item === null || !unwrap(item['_destroy']);
          });

          // Call setDomNodeChildrenFromArrayMapping, ignoring any observables unwrapped within (most likely from a callback function).
          // If the array items are observables, though, they will be unwrapped in executeTemplateForArrayItem and managed within setDomNodeChildrenFromArrayMapping.
          ignore(setDomNodeChildrenFromArrayMapping, null, [targetNode, filteredArray, executeTemplateForArrayItem, options, activateBindingsCallback]);

      }, null, { disposeWhenNodeIsRemoved: targetNode });
  }

  var templateComputedDomDataKey = nextKey();
  function disposeOldComputedAndStoreNewOne(element, newComputed) {
      var oldComputed = get(element, templateComputedDomDataKey);
      if (oldComputed && (typeof(oldComputed.dispose) == 'function'))
          oldComputed.dispose();
      set(element, templateComputedDomDataKey, (newComputed && newComputed.isActive()) ? newComputed : undefined);
  }

  var template = {
      init: function(element, valueAccessor) {
          var container;
          // Support anonymous templates
          var bindingValue = unwrap(valueAccessor());
          if (typeof bindingValue == "string" || bindingValue['name']) {
              // It's a named template - clear the element
              emptyNode(element);
          } else if ('nodes' in bindingValue) {
              // We've been given an array of DOM nodes. Save them as the template source.
              // There is no known use case for the node array being an observable array (if the output
              // varies, put that behavior *into* your template - that's what templates are for), and
              // the implementation would be a mess, so assert that it's not observable.
              var nodes = bindingValue['nodes'] || [];
              if (isObservable(nodes)) {
                  throw new Error('The "nodes" option must be a plain, non-observable array.');
              }
              container = moveCleanedNodesToContainerElement(nodes); // This also removes the nodes from their current parent
              new anonymousTemplate(element)['nodes'](container);
          } else {
              // It's an anonymous template - store the element contents, then clear the element
              var templateNodes = childNodes(element);
              container = moveCleanedNodesToContainerElement(templateNodes); // This also removes the nodes from their current parent
              new anonymousTemplate(element).nodes(container);
          }
          return { 'controlsDescendantBindings': true };
      },
      update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
          var value = valueAccessor(),
              options = unwrap(value),
              shouldDisplay = true,
              templateComputed = null,
              templateName;

          if (typeof options == "string") {
              templateName = value;
              options = {};
          } else {
              templateName = options['name'];

              // Support "if"/"ifnot" conditions
              if ('if' in options)
                  shouldDisplay = unwrap(options['if']);
              if (shouldDisplay && 'ifnot' in options)
                  shouldDisplay = !unwrap(options['ifnot']);
          }

          if ('foreach' in options) {
              // Render once for each data point (treating data set as empty if shouldDisplay==false)
              var dataArray = (shouldDisplay && options['foreach']) || [];
              templateComputed = renderTemplateForEach(templateName || element, dataArray, options, element, bindingContext);
          } else if (!shouldDisplay) {
              emptyNode(element);
          } else {
              // Render once for this single data point (or use the viewModel if no data was provided)
              var innerBindingContext = ('data' in options) ?
                  bindingContext.createStaticChildContext(options['data'], options['as']) :  // Given an explitit 'data' value, we create a child binding context for it
                  bindingContext;                                                        // Given no explicit 'data' value, we retain the same binding context
              templateComputed = renderTemplate(templateName || element, innerBindingContext, options, element);
          }

          // It only makes sense to have a single template computed per element (otherwise which one should have its output displayed?)
          disposeOldComputedAndStoreNewOne(element, templateComputed);
      },
      allowVirtualElements: true
  };

  function nativeTemplateEngine () {
  }

  nativeTemplateEngine.prototype = new templateEngine();
  nativeTemplateEngine.prototype.constructor = nativeTemplateEngine;
  nativeTemplateEngine.prototype.renderTemplateSource = function(templateSource, bindingContext, options, templateDocument) {
      var useNodesIfAvailable = !(ieVersion < 9), // IE<9 cloneNode doesn't work properly
          templateNodesFunc = useNodesIfAvailable ? templateSource.nodes : null,
          templateNodes = templateNodesFunc ? templateSource.nodes() : null;

      if (templateNodes) {
          return makeArray(templateNodes.cloneNode(true).childNodes);
      } else {
          var templateText = templateSource.text();
          return parseHtmlFragment(templateText, templateDocument);
      }
  };


  nativeTemplateEngine.instance = new nativeTemplateEngine();
  setTemplateEngine(nativeTemplateEngine.instance);

  function makeTemplateValueAccessor(valueAccessor) {
      return function() {
          var modelValue = valueAccessor(),
              unwrappedValue = peek(modelValue);    // Unwrap without setting a dependency here

          // If unwrappedValue is the array, pass in the wrapped value on its own
          // The value will be unwrapped and tracked within the template binding
          // (See https://github.com/SteveSanderson/knockout/issues/523)
          if ((!unwrappedValue) || typeof unwrappedValue.length == "number")
              return { 'foreach': modelValue, 'templateEngine': nativeTemplateEngine.instance };

          // If unwrappedValue.data is the array, preserve all relevant options and unwrap again value so we get updates
          unwrap(modelValue);
          return {
              'foreach': unwrappedValue['data'],
              'as': unwrappedValue['as'],
              'includeDestroyed': unwrappedValue['includeDestroyed'],
              'afterAdd': unwrappedValue['afterAdd'],
              'beforeRemove': unwrappedValue['beforeRemove'],
              'afterRender': unwrappedValue['afterRender'],
              'beforeMove': unwrappedValue['beforeMove'],
              'afterMove': unwrappedValue['afterMove'],
              'templateEngine': nativeTemplateEngine.instance
          };
      };
  }


  // "foreach: someExpression" is equivalent to "template: { foreach: someExpression }"
  // "foreach: { data: someExpression, afterAdd: myfn }" is equivalent to "template: { foreach: someExpression, afterAdd: myfn }"
  var foreach = {
      init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
          return getBindingHandler('template').init(element, makeTemplateValueAccessor(valueAccessor));
      },
      update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
          return getBindingHandler('template').update(element, makeTemplateValueAccessor(valueAccessor), allBindings, viewModel, bindingContext);
      },
      allowVirtualElements: true,
      bindingRewriteValidator: false
  };

  //ko.expressionRewriting.bindingRewriteValidators['foreach'] = false; // Can't rewrite control flow bindings

  //    'let': letBinding,
  //    template: template,

  var bindings = {
      foreach: foreach,
      template: template
  };

  exports.bindings = bindings;
  exports.nativeTemplateEngine = nativeTemplateEngine;
  exports.templateEngine = templateEngine;
  exports.setTemplateEngine = setTemplateEngine;
  exports.renderTemplate = renderTemplate;
  exports.template = template;
  exports.domElement = domElement;
  exports.anonymousTemplate = anonymousTemplate;

  Object.defineProperty(exports, '__esModule', { value: true });

}));