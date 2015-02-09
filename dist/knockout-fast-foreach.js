/*!
  Knockout Fast Foreach v0.2.7 (2015-02-09T02:37:35.547Z)
  By: Brian M Hunt (C) 2015
  License: MIT

  Adds `fastForEach` to `ko.bindingHandlers`.
*/
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['knockout'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('knockout'));
  } else {
    root.KnockoutElse = factory(root.ko);
  }
}(this, function (ko) {
// index.js
// --------
// Fast For Each
//
// Employing sound techniques to make a faster Knockout foreach binding.
// --------
"use strict";

//      Utilities

// from https://github.com/jonschlinkert/is-plain-object
function isPlainObject(o) {
  return !!o && typeof o === 'object' && o.constructor === Object;
}

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
  ko.utils.arrayForEach(ko.virtualElements.childNodes(parentNode), function (child) {
    // FIXME - This cloneNode could be expensive; we may prefer to iterate over the
    // parentNode children in reverse (so as not to foul the indexes as childNodes are
    // removed from parentNode when inserted into the container)
    if (child) container.insertBefore(child.cloneNode(true), null);
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

function FastForEach(spec) {
  var self = this;
  this.element = spec.element;
  this.$context = spec.$context;
  this.data = spec.data;
  this.as = spec.as;
  this.templateNode = makeTemplateNode(
    spec.name ? document.getElementById(spec.name).cloneNode(true) : spec.element
  );
  this.afterQueueFlush = spec.afterQueueFlush;
  this.changeQueue = [];
  this.lastNodesList = [];
  this.indexesToDelete = [];
  this.rendering_queued = false;

  // Remove existing content.
  ko.virtualElements.emptyNode(this.element);

  // Prime content
  var primeData = ko.unwrap(this.data);
  if (primeData.map) {
    this.onArrayChange(primeData.map(valueToChangeAddItem));
  }

  // Watch for changes
  if (ko.isObservable(this.data)) {
    if (!this.data.indexOf) {
      // Make sure the observable is trackable.
      this.data = this.data.extend({trackArrayChanges: true});
    }
    this.changeSubs = this.data.subscribe(this.onArrayChange, this, 'arrayChange');
  }
}


FastForEach.animateFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame || window.msRequestAnimationFrame ||
  function(cb) { return window.setTimeout(cb, 1000 / 60); };


FastForEach.prototype.dispose = function () {
  if (this.changeSubs) {
    this.changeSubs.dispose();
  }
};


// If the array changes we register the change.
FastForEach.prototype.onArrayChange = function (changeSet) {
  var self = this;
  var changeMap = {
    added: [],
    deleted: [],
  };
  ko.utils.arrayForEach(changeSet, function(changeItem) {
    changeMap[changeItem.status].push(changeItem);
  });
  if (changeMap.deleted.length > 0) {
    this.changeQueue.push.apply(this.changeQueue, changeMap.deleted);
    this.changeQueue.push({status: 'clearDeletedIndexes'})
  }
  this.changeQueue.push.apply(this.changeQueue, changeMap.added);
  // Once a change is registered, the ticking count-down starts for the processQueue.
  if (this.changeQueue.length > 0 && !this.rendering_queued) {
    this.rendering_queued = true;
    FastForEach.animateFrame.call(window, function () { self.processQueue(); });
  }
};


// Reflect all the changes in the queue in the DOM, then wipe the queue.
FastForEach.prototype.processQueue = function () {
  var self = this;
  ko.utils.arrayForEach(this.changeQueue, function (changeItem) {
    // console.log(self.data(), "CI", JSON.stringify(changeItem, null, 2), JSON.stringify($(self.element).text()))
    self[changeItem.status](changeItem.index, changeItem.value);
    // console.log("  ==> ", JSON.stringify($(self.element).text()))
  });
  this.rendering_queued = false;
  // Callback so folks can do things.
  if (typeof this.afterQueueFlush === 'function') {
    this.afterQueueFlush(this.changeQueue);
  }
  this.changeQueue = [];
};


// Process a changeItem with {status: 'added', ...}
FastForEach.prototype.added = function (index, value) {
  var childContext = this.$context.createChildContext(value, this.as || null);
  var referenceElement = this.lastNodesList[index - 1] || null;
  var templateClone = this.templateNode.cloneNode(true);
  var childNodes = ko.virtualElements.childNodes(templateClone);

  this.lastNodesList.splice(index, 0, childNodes[childNodes.length - 1]);
  ko.applyBindingsToDescendants(childContext, templateClone);

  // Nodes are inserted in reverse order - pushed down immediately after
  // the last node for the previous item or as the first node of element.
  for (var i = childNodes.length - 1; i >= 0; --i) {
    var child = childNodes[i];
    if (!child) return;
    ko.virtualElements.insertAfter(this.element, child, referenceElement);
  }
};


// Process a changeItem with {status: 'deleted', ...}
FastForEach.prototype.deleted = function (index, value) {
  var ptr = this.lastNodesList[index],
      lastNode = this.lastNodesList[index - 1];
  do {
    ptr = ptr.previousSibling;
    this.element.removeChild((ptr && ptr.nextSibling) || this.element.firstChild)
  } while (ptr && ptr !== lastNode);
  // The "last node" in the DOM from which we begin our delets of the next adjacent node is
  // now the sibling that preceded the first node of this item. 
  this.lastNodesList[index] = this.lastNodesList[index - 1];
  this.indexesToDelete.push(index);
};


// We batch our deletion of item indexes in our parallel array.
// See brianmhunt/knockout-fast-foreach#6/#8
FastForEach.prototype.clearDeletedIndexes = function () {
  // We iterate in reverse on the presumption (following the unit tests) that KO's diff engine
  // processes diffs (esp. deletes) monotonically ascending i.e. from index 0 -> N.
  for (var i = this.indexesToDelete.length - 1; i >= 0; --i) {
    this.lastNodesList.splice(this.indexesToDelete[i], 1);
  }
  this.indexesToDelete = [];
};


ko.bindingHandlers.fastForEach = {
  // Valid valueAccessors:
  //    []
  //    ko.observable([])
  //    ko.observableArray([])
  //    ko.computed
  //    {data: array, name: string, as: string}
  init: function init(element, valueAccessor, bindings, vm, context) {
    var value = valueAccessor(),
        spec = {},
        ffe;
    if (isPlainObject(value)) {
      value.element = value.element || element;
      value.$context = context;
      ffe = new FastForEach(value);
    } else {
      ffe = new FastForEach({
        element: element,
        data: ko.unwrap(context.$rawData) === value ? context.$rawData : value,
        $context: context
      });
    }
    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
      ffe.dispose();
    });
    return {controlsDescendantBindings: true};
  },

  // Export for testing, debugging, and overloading.
  FastForEach: FastForEach,
};

ko.virtualElements.allowedBindings.fastForEach = true;
}));
