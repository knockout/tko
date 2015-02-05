/*!
  Knockout Fast Foreach v0.1.0 (2015-02-05T19:25:55.699Z)
  By: Brian M Hunt (C) 2015
  License: MIT
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
// Polyfills

// from https://github.com/jonschlinkert/is-plain-object
function isPlainObject(o) {
  return !!o && typeof o === 'object' && o.constructor === Object;
};

// A range of nodes
// spec contains {start: Node, end: Node, parent: Node, index: int}
function NodeRange(spec) {
  this.parent = spec.parent;
  this.start = spec.start;
  this.end = spec.end;
  this.index = spec.index
}

NodeRange.prototype.remove = function remove() {
  if (this.start === null) return;
  var nodesRemoved = [];
  var ptr = this.start;
  while (ptr !== this.end) {
    ptr = ptr.nextSibling;
    this.parent.removeChild(this.start);
    this.start = ptr;
  }
  this.start = this.end = null;
}

NodeRange.prototype.insertAfter = function insertAfter(nodes) {
  var nextNode = this.end.nextSibling;
  for (var i = nodes.length - 1; i >= 0; --i) {
    nextNode = next.insertBefore(nodes[i]);
  }
}


// from FastDOM
var raf = window.requestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.mozRequestAnimationFrame
  || window.msRequestAnimationFrame
  || function(cb) { return window.setTimeout(cb, 1000 / 60); };


// Spec is the usual for a `foreach` binding i.e. {
//    name: template id string  (optional)
//    data: array
//    as: string
//    ...
//    + element: DOMNode
// }
function init_from_object(spec) {
  // Insert a nodes at the given index
  function insertBoundNodeAtIndex(index, data) {
    var nodeCount = nodeList.length;
    var childContext = spec.$context.createChildContext(item, spec.as || null);
    index = (nodeCount + index) % nodeCount; // for modulo e.g. index of -1
    var nodeRange = new NodeRange({
      start: templateNode.firstChild,
      end: templateNode.lastChild,
      parent: element,
      index: index
    });
    nodeRange.insertAfter() /// ....
  }


}

function FastForEach(spec) {
  this.element = spec.element;
  this.$context = spec.$context;
  this.data = spec.data;
  this.templateNode = spec.name ? [document.getElementById(spec.name)]
                                : element.cloneNode(true);
  this.changeQueue = [];
  this.startNodesList = [];

  // Make sure the observable is trackable.
  if (ko.isObservable(data) && !data.indexOf) {
    data = data.extend({trackArrayChanges: true});
  }

  // Clear the element
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }

  // Prime content
  var primeIdx = 0;
  ko.utils.arrayForEach(this.data(), function (item) {
    this.changeQueue.push({
      index: primeIdx++,
      status: "added",
      value: item
    });
  })
  if (primeIdx > 0) {
    this.registerChange();
  }

  // Watch for changes
  var changeSubs = this.data.subscribe(on_array_change, this, 'arrayChange');

  ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
    changeSubs.dispose();
  });
}


FastForEach.protoype.on_array_change = function (changeSet) {
  var self = this;
  ko.utils.forEach(changeSet, function(change) {
    self.changeQueue.append(change);
  })
  this.registerChange()
} 


FastForEach.prototype.registerChange = function () {
  var self = this;
  self.processQueue()
  // raf(function () { self.processQueue() })
}


FastForEach.prototype.processQueue = function () {
  var self = this;
  ko.utils.arrayForEach(this.changeQueue, function (changeItem) {
    self[changeItem.status](changeItem.index, changeItem.value)
  })
  this.changeSet.length = 0;
}


FastForEach.prototype.added = function (index, value) {
  console.log("Inserting ", value, " at ", index)
  // insertBoundNodeAtIndex(-1, item)
  // ko.utils.arrayForEach(templateNode.children, function(child) {
  //   if (!child) return;
  //   var clone = child.cloneNode(true);
  //   element.insertBefore(clone, null);
  //   ko.applyBindingsToDescendants(childContext, clone);
  // })
}


FastForEach.prototype.deleted = function (index, value) {
  // startNodesList
  console.log("Deleting ", value, " at ", index)
}


// /*
//     insertNodeRange
//     --

//     Insert the nodes represented in NodeRange into the DOM.
//  */
// FastForEach.prototype.insertNodeRange(node_range, index) {
//   var lastNode = this.nodeRangeList[index].start,
//       ptr = node_range.end;
//   this.nodeRangeList.splice(index, 0, node_range);
//   this.element.insertBefore(ptr, lastNode);
//   lastNode = ptr;
//   ptr = ptr.previousSibling;
//   while(pre && ptr != node_range.start) {
//     this.element.insertBefore(ptr, lastNode)
//     lastNode = ptr;
//     ptr = ptr.previousSibling;
//   }
// }




// Valid valueAccessors:
//    []
//    ko.observable([])
//    ko.observableArray([])
//    ko.computed
//    {data: array, name: string, as: string}
function init(element, valueAccessor, bindings, vm, context) {
  var value = valueAccessor(),
      spec = {};
  try{
    if (isPlainObject(value)) {
      value.element = value.element || element;
      value.$context = context;
      init_from_object(value);
    } else {
      init_from_object({element: element, data: value, $context: context});
    }
  } catch(e) {
    console.error("FF error", e.stack);
  }
  return {controlsDescendantBindings: true}
};


ko.bindingHandlers['fast-foreach'] = {
  init: init
};// Exports
  return {init: init};
}));
