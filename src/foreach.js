// index.js
// --------
// Fast For Each
//
// Employing sound techniques to make a faster Knockout foreach binding.
// --------

import {
  arrayForEach, addDisposeCallback, cleanNode, options, virtualElements,
  createSymbolOrString, domData
} from 'tko.utils';

import {
  isObservable, unwrap, observable
} from 'tko.observable';

import {
  contextFor, applyBindingsToDescendants
} from 'tko.bind';


//      Utilities
var MAX_LIST_SIZE = 9007199254740991;

// from https://github.com/jonschlinkert/is-plain-object
function isPlainObject(o) {
  return !!o && typeof o === 'object' && o.constructor === Object;
}

var supportsDocumentFragment = document && typeof document.createDocumentFragment === "function";


// Get a copy of the (possibly virtual) child nodes of the given element,
// put them into a container, then empty the given node.
function makeTemplateNode(sourceNode) {
  var container = document.createElement("div");
  var parentNode;
  if (sourceNode.content) {
    // For e.g. <template> tags
    parentNode = sourceNode.content;
  } else if (sourceNode.tagName === 'SCRIPT') {
    parentNode = document.createElement("div");
    parentNode.innerHTML = sourceNode.text;
  } else {
    // Anything else e.g. <div>
    parentNode = sourceNode;
  }
  arrayForEach(virtualElements.childNodes(parentNode), function (child) {
    // FIXME - This cloneNode could be expensive; we may prefer to iterate over the
    // parentNode children in reverse (so as not to foul the indexes as childNodes are
    // removed from parentNode when inserted into the container)
    if (child) {
      container.insertBefore(child.cloneNode(true), null);
    }
  });
  return container;
}

// Mimic a KO change item 'add'
function valueToChangeAddItem(value, index) {
  return {
    status: 'added',
    value: value,
    index: index
  };
}


// store a symbol for caching the pending delete info index in the data item objects
var PENDING_DELETE_INDEX_KEY = createSymbolOrString("_ko_ffe_pending_delete_index");

export function ForEach(spec) {
  this.element = spec.element;
  this.container = virtualElements.isStartComment(this.element) ?
                   this.element.parentNode : this.element;
  this.$context = spec.$context;
  this.data = spec.data;
  this.generateContext = this.createContextGenerator(spec.as, !spec.noIndex);
  if (spec.noIndex) { this.updateIndexes = false; }
  this.afterAdd = spec.afterAdd;
  this.beforeRemove = spec.beforeRemove;
  this.templateNode = makeTemplateNode(
    spec.templateNode || (spec.name ? document.getElementById(spec.name).cloneNode(true) : spec.element)
  );
  this.afterQueueFlush = spec.afterQueueFlush;
  this.beforeQueueFlush = spec.beforeQueueFlush;
  this.changeQueue = [];
  this.firstLastNodesList = [];
  this.indexesToDelete = [];
  this.rendering_queued = false;
  this.pendingDeletes = [];

  // Expose the conditional so that if the `foreach` data is empty, successive
  // 'else' bindings will appear.
  this.isNotEmpty = observable(Boolean(unwrap(this.data).length));
  domData.set(this.element, 'conditional', {
    elseChainSatisfied: this.isNotEmpty
  });

  // Remove existing content.
  virtualElements.emptyNode(this.element);

  // Prime content
  var primeData = unwrap(this.data);
  if (primeData.map) {
    this.onArrayChange(primeData.map(valueToChangeAddItem), true);
  }

  // Watch for changes
  if (isObservable(this.data)) {
    if (!this.data.indexOf) {
      // Make sure the observable is trackable.
      this.data = this.data.extend({ trackArrayChanges: true });
    }
    this.changeSubs = this.data.subscribe(this.onArrayChange, this, 'arrayChange');
  }
}

ForEach.PENDING_DELETE_INDEX_KEY = PENDING_DELETE_INDEX_KEY;


ForEach.prototype.dispose = function () {
  if (this.changeSubs) {
    this.changeSubs.dispose();
  }
  this.flushPendingDeletes();
};


// If the array changes we register the change.
ForEach.prototype.onArrayChange = function (changeSet, isInitial) {
  var self = this;
  var changeMap = {
    added: [],
    deleted: []
  };

  // knockout array change notification index handling:
  // - sends the original array indexes for deletes
  // - sends the new array indexes for adds
  // - sorts them all by index in ascending order
  // because of this, when checking for possible batch additions, any delete can be between to adds with neighboring indexes, so only additions should be checked
  for (var i = 0, len = changeSet.length; i < len; i++) {

    if (changeMap.added.length && changeSet[i].status == 'added') {
      var lastAdd = changeMap.added[changeMap.added.length - 1];
      var lastIndex = lastAdd.isBatch ? lastAdd.index + lastAdd.values.length - 1 : lastAdd.index;
      if (lastIndex + 1 == changeSet[i].index) {
        if (!lastAdd.isBatch) {
          // transform the last addition into a batch addition object
          lastAdd = {
            isBatch: true,
            status: 'added',
            index: lastAdd.index,
            values: [lastAdd.value]
          };
          changeMap.added.splice(changeMap.added.length - 1, 1, lastAdd);
        }
        lastAdd.values.push(changeSet[i].value);
        continue;
      }
    }

    changeMap[changeSet[i].status].push(changeSet[i]);
  }

  if (changeMap.deleted.length > 0) {
    this.changeQueue.push.apply(this.changeQueue, changeMap.deleted);
    this.changeQueue.push({ status: 'clearDeletedIndexes' });
  }
  this.changeQueue.push.apply(this.changeQueue, changeMap.added);
  // Once a change is registered, the ticking count-down starts for the processQueue.
  if (this.changeQueue.length > 0 && !this.rendering_queued) {
    this.rendering_queued = true;
    if (isInitial) {
      self.processQueue();
    } else {
      ForEach.animateFrame.call(window, function () { self.processQueue(); });
    }
  }
};


// Reflect all the changes in the queue in the DOM, then wipe the queue.
ForEach.prototype.processQueue = function () {
  var self = this;
  var isEmpty = !unwrap(this.data).length;
  var lowestIndexChanged = MAX_LIST_SIZE;

  // Callback so folks can do things before the queue flush.
  if (typeof this.beforeQueueFlush === 'function') {
    this.beforeQueueFlush(this.changeQueue);
  }

  arrayForEach(this.changeQueue, function (changeItem) {
    if (typeof changeItem.index === 'number') {
      lowestIndexChanged = Math.min(lowestIndexChanged, changeItem.index);
    }
    self[changeItem.status](changeItem);
  });
  this.flushPendingDeletes();
  this.rendering_queued = false;

  // Update our indexes.
  if (this.updateIndexes) { this.updateIndexes(lowestIndexChanged); }

  // Callback so folks can do things.
  if (typeof this.afterQueueFlush === 'function') {
    this.afterQueueFlush(this.changeQueue);
  }
  this.changeQueue = [];

  // Update the conditional exposed on the domData
  if (isEmpty !== !this.isNotEmpty()) {
    this.isNotEmpty(!isEmpty);
  }
};


// Extend the given context with a $index (passed in via the createChildContext)
function extend$context(include$index, $context) {
  if (include$index) { $context.$index = observable(); }
  $context.$list = this.data;
}


/**
 * Return a function that generates the context for a given node.
 *
 * We generate a single function that reduces our inner-loop calculations,
 * which has a good chance of being optimized by the browser.
 *
 * @param  {string} as  The name given to each item in the list
 * @param  {bool} index Whether to calculate indexes
 * @return {function}   A function(dataValue) that returns the context
 */
ForEach.prototype.createContextGenerator = function (as, index) {
  var $context = this.$context;
  switch ((as && 1) | (index && 2)) {
  case 0: // no-as & no-index
    return function(v) {
      return $context.createChildContext(v, null, extend$context.bind(this, false));
    };

  case 1: // as + no-index
    return function(v) {
      var obj = { $index: undefined, $list: this.data };
      obj[as] = v;
      return $context.extend(obj);
    };

  case 2: // no-as + index
    return function(v) {
      return $context.createChildContext(v, null, extend$context.bind(this, true));
    };

  case 3: // as + index
    return function(v) {
      var obj = { $index: observable(), $list: this.data };
      obj[as] = v;
      return $context.extend(obj);
    };
  }
};


// Process a changeItem with {status: 'added', ...}
ForEach.prototype.added = function (changeItem) {
  var index = changeItem.index;
  var valuesToAdd = changeItem.isBatch ? changeItem.values : [changeItem.value];
  var referenceElement = this.getLastNodeBeforeIndex(index);
  // gather all childnodes for a possible batch insertion
  var allChildNodes = [];
  var children;

  for (var i = 0, len = valuesToAdd.length; i < len; ++i) {
    // we check if we have a pending delete with reusable nodesets for this data, and if yes, we reuse one nodeset
    var pendingDelete = this.getPendingDeleteFor(valuesToAdd[i]);
    if (pendingDelete && pendingDelete.nodesets.length) {
      children = pendingDelete.nodesets.pop();
    } else {
      var templateClone = this.templateNode.cloneNode(true);

      // Apply bindings first, and then process child nodes,
      // because bindings can add childnodes.
      applyBindingsToDescendants(
        this.generateContext(valuesToAdd[i]), templateClone
      );

      children = virtualElements.childNodes(templateClone);
    }

    // Note discussion at https://github.com/angular/angular.js/issues/7851
    allChildNodes.push.apply(allChildNodes, Array.prototype.slice.call(children));
    this.firstLastNodesList.splice(index + i, 0, { first: children[0], last: children[children.length - 1] });
  }

  if (typeof this.afterAdd === 'function') {
    this.afterAdd({
      nodeOrArrayInserted: this.insertAllAfter(allChildNodes, referenceElement),
      foreachInstance: this
    }
    );
  } else {
    this.insertAllAfter(allChildNodes, referenceElement);
  }
};

ForEach.prototype.getNodesForIndex = function (index) {
  var result = [],
    ptr = this.firstLastNodesList[index].first,
    last = this.firstLastNodesList[index].last;
  result.push(ptr);
  while (ptr && ptr !== last) {
    ptr = ptr.nextSibling;
    result.push(ptr);
  }
  return result;
};

ForEach.prototype.getLastNodeBeforeIndex = function (index) {
  if (index < 1 || index - 1 >= this.firstLastNodesList.length)
    return null;
  return this.firstLastNodesList[index - 1].last;
};

ForEach.prototype.insertAllAfter = function (nodeOrNodeArrayToInsert, insertAfterNode) {
  var frag, len, i,
    containerNode = this.element;

  // poor man's node and array check, should be enough for this
  if (nodeOrNodeArrayToInsert.nodeType === undefined && nodeOrNodeArrayToInsert.length === undefined) {
    throw new Error("Expected a single node or a node array");
  }
  if (nodeOrNodeArrayToInsert.nodeType !== undefined) {
    virtualElements.insertAfter(containerNode, nodeOrNodeArrayToInsert, insertAfterNode);
    return [nodeOrNodeArrayToInsert];
  } else if (nodeOrNodeArrayToInsert.length === 1) {
    virtualElements.insertAfter(containerNode, nodeOrNodeArrayToInsert[0], insertAfterNode);
  } else if (supportsDocumentFragment) {
    frag = document.createDocumentFragment();

    for (i = 0, len = nodeOrNodeArrayToInsert.length; i !== len; ++i) {
      frag.appendChild(nodeOrNodeArrayToInsert[i]);
    }
    virtualElements.insertAfter(containerNode, frag, insertAfterNode);
  } else {
    // Nodes are inserted in reverse order - pushed down immediately after
    // the last node for the previous item or as the first node of element.
    for (i = nodeOrNodeArrayToInsert.length - 1; i >= 0; --i) {
      var child = nodeOrNodeArrayToInsert[i];
      if (!child) { break; }
      virtualElements.insertAfter(containerNode, child, insertAfterNode);
    }
  }
  return nodeOrNodeArrayToInsert;
};

// checks if the deleted data item should be handled with delay for a possible reuse at additions
ForEach.prototype.shouldDelayDeletion = function (data) {
  return data && (typeof data === "object" || typeof data === "function");
};

// gets the pending deletion info for this data item
ForEach.prototype.getPendingDeleteFor = function (data) {
  var index = data && data[PENDING_DELETE_INDEX_KEY];
  if (index === undefined) return null;
  return this.pendingDeletes[index];
};

// tries to find the existing pending delete info for this data item, and if it can't, it registeres one
ForEach.prototype.getOrCreatePendingDeleteFor = function (data) {
  var pd = this.getPendingDeleteFor(data);
  if (pd) {
    return pd;
  }
  pd = {
    data: data,
    nodesets: []
  };
  data[PENDING_DELETE_INDEX_KEY] = this.pendingDeletes.length;
  this.pendingDeletes.push(pd);
  return pd;
};

// Process a changeItem with {status: 'deleted', ...}
ForEach.prototype.deleted = function (changeItem) {
  // if we should delay the deletion of this data, we add the nodeset to the pending delete info object
  if (this.shouldDelayDeletion(changeItem.value)) {
    var pd = this.getOrCreatePendingDeleteFor(changeItem.value);
    pd.nodesets.push(this.getNodesForIndex(changeItem.index));
  } else { // simple data, just remove the nodes
    this.removeNodes(this.getNodesForIndex(changeItem.index));
  }
  this.indexesToDelete.push(changeItem.index);
};

// removes a set of nodes from the DOM
ForEach.prototype.removeNodes = function (nodes) {
  if (!nodes.length) { return; }

  var removeFn = function () {
    var parent = nodes[0].parentNode;
    for (var i = nodes.length - 1; i >= 0; --i) {
      cleanNode(nodes[i]);
      parent.removeChild(nodes[i]);
    }
  };

  if (this.beforeRemove) {
    var beforeRemoveReturn = this.beforeRemove({
      nodesToRemove: nodes, foreachInstance: this
    }) || {};
    // If beforeRemove returns a `then`–able e.g. a Promise, we remove
    // the nodes when that thenable completes.  We pass any errors to
    // ko.onError.
    if (typeof beforeRemoveReturn.then === 'function') {
      beforeRemoveReturn.then(removeFn, options.onError);
    }
  } else {
    removeFn();
  }
};

// flushes the pending delete info store
// this should be called after queue processing has finished, so that data items and remaining (not reused) nodesets get cleaned up
// we also call it on dispose not to leave any mess
ForEach.prototype.flushPendingDeletes = function () {
  for (var i = 0, len = this.pendingDeletes.length; i != len; ++i) {
    var pd = this.pendingDeletes[i];
    while (pd.nodesets.length) {
      this.removeNodes(pd.nodesets.pop());
    }
    if (pd.data && pd.data[PENDING_DELETE_INDEX_KEY] !== undefined)
      delete pd.data[PENDING_DELETE_INDEX_KEY];
  }
  this.pendingDeletes = [];
};

// We batch our deletion of item indexes in our parallel array.
// See brianmhunt/knockout-fast-foreach#6/#8
ForEach.prototype.clearDeletedIndexes = function () {
  // We iterate in reverse on the presumption (following the unit tests) that KO's diff engine
  // processes diffs (esp. deletes) monotonically ascending i.e. from index 0 -> N.
  for (var i = this.indexesToDelete.length - 1; i >= 0; --i) {
    this.firstLastNodesList.splice(this.indexesToDelete[i], 1);
  }
  this.indexesToDelete = [];
};


ForEach.prototype.getContextStartingFrom = function (node) {
  var ctx;
  while (node) {
    ctx = contextFor(node);
    if (ctx) { return ctx; }
    node = node.nextSibling;
  }
};


ForEach.prototype.updateIndexes = function (fromIndex) {
  var ctx;
  for (var i = fromIndex, len = this.firstLastNodesList.length; i < len; ++i) {
    ctx = this.getContextStartingFrom(this.firstLastNodesList[i].first);
    if (ctx) { ctx.$index(i); }
  }
};


/**
 * Set whether the binding is synchronous.
 * Useful during testing.
 */
function setSync(toggle) {
  if (toggle) {
    ForEach.animateFrame = function (frame) { frame(); };
  } else {
    ForEach.animateFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame || window.msRequestAnimationFrame ||
      function (cb) { return window.setTimeout(cb, 1000 / 60); };
  }
}


export var foreach = {
  // Valid valueAccessors:
  //    []
  //    observable([])
  //    observableArray([])
  //    computed
  //    {data: array, name: string, as: string}
  init: function init(element, valueAccessor, bindings, vm, context) {
    var ffe, value = valueAccessor();
    if (isPlainObject(value)) {
      value.element = value.element || element;
      value.$context = context;
      ffe = new ForEach(value);
    } else {
      ffe = new ForEach({
        element: element,
        data: unwrap(context.$rawData) === value ? context.$rawData : value,
        $context: context,
        as: bindings.get('as'),
        noIndex: bindings.get('noIndex')
      });
    }

    addDisposeCallback(element, function () {
      ffe.dispose();
    });
    return { controlsDescendantBindings: true };
  },

  setSync: setSync,

  allowVirtualElements: true,

  // Export for testing, debugging, and overloading.
  ForEach: ForEach
};