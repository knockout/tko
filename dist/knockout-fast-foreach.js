/*!
  Knockout Fast Foreach v0.1.0 (2015-02-05T20:32:32.416Z)
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
// Fast For Each
// 
// Employing sound techniques to make a faster Knockout foreach binding.
// --------

// from https://github.com/jonschlinkert/is-plain-object
function isPlainObject(o) {
  return !!o && typeof o === 'object' && o.constructor === Object;
};

function FastForEach(spec) {
  var self = this;
  this.element = spec.element;
  this.$context = spec.$context;
  this.data = spec.data;
  this.as = spec.as;
  this.templateNode = spec.name ? [document.getElementById(spec.name)]
                                : spec.element.cloneNode(true);
  this.changeQueue = [];
  this.startNodesList = [];
  this.rendering_queued = false;

  // Make sure the observable is trackable.
  if (ko.isObservable(this.data) && !this.data.indexOf) {
    this.data = this.data.extend({trackArrayChanges: true});
  }

  // Clear the element
  while (this.element.firstChild) {
    this.element.removeChild(this.element.firstChild);
  }

  // Prime content
  var primeIdx = 0;
  ko.utils.arrayForEach(this.data(), function (item) {
    self.changeQueue.push({
      index: primeIdx++,
      status: "added",
      value: item
    });
  })
  if (primeIdx > 0) {
    this.registerChange();
  }

  // Watch for changes
  this.changeSubs = this.data.subscribe(this.on_array_change, this, 'arrayChange');
}


FastForEach.animateFrame = window.requestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.mozRequestAnimationFrame
  || window.msRequestAnimationFrame
  || function(cb) { return window.setTimeout(cb, 1000 / 60); };


FastForEach.prototype.dispose = function () {
  this.changeSubs.dispose();
}


FastForEach.prototype.on_array_change = function (changeSet) {
  var self = this;
  ko.utils.arrayForEach(changeSet, function(change) {
    self.changeQueue.push(change);
  })
  this.registerChange();
} 


FastForEach.prototype.registerChange = function () {
  var self = this;
  if (!this.rendering_queued) {
    this.rendering_queued = true;
    FastForEach.animateFrame.call(window, function () { self.processQueue() })
  }
}


FastForEach.prototype.processQueue = function () {
  var self = this;
  ko.utils.arrayForEach(this.changeQueue, function (changeItem) {
    self[changeItem.status](changeItem.index, changeItem.value)
  })
  this.changeQueue.length = 0;
  this.rendering_queued = false;
}


FastForEach.prototype.added = function (index, value) {
  var childContext = this.$context.createChildContext(value, this.as || null);
  var referenceElement = this.startNodesList[index] || null;
  var firstChild = null;
  var element = this.element;

  ko.utils.arrayForEach(this.templateNode.children, function(child) {
    if (!child) return;
    var clone = child.cloneNode(true);
    element.insertBefore(clone, referenceElement);
    ko.applyBindingsToDescendants(childContext, clone);
    firstChild = firstChild || clone;
  })

  this.startNodesList.splice(index, 0, firstChild);
}


FastForEach.prototype.deleted = function (index, value) {
  // startNodesList
  var ptr = this.startNodesList[index],
      lastNode = this.startNodesList[index + 1];
  this.element.removeChild(ptr);
  while ((ptr = ptr.nextSibling) && ptr != lastNode) {
    this.element.removeChild(ptr);
  }
  this.startNodesList.splice(index, 1)
}


// Overload, as needed.
FastForEach.prototype.after_process_queue = function (fastforeach) {}


// Valid valueAccessors:
//    []
//    ko.observable([])
//    ko.observableArray([])
//    ko.computed
//    {data: array, name: string, as: string}
function init(element, valueAccessor, bindings, vm, context) {
  var value = valueAccessor(),
      spec = {},
      ffe;
  try {
    if (isPlainObject(value)) {
      value.element = value.element || element;
      value.$context = context;
      ffe = new FastForEach(value);
    } else {
      ffe = new FastForEach({
        element: element,
        data: value,
        $context: context
    });
    }
  } catch(e) {
    console.error("FF error", e.stack);
  }

  ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
    ffe.dispose();
  });

  return {controlsDescendantBindings: true}
};


ko.bindingHandlers['fastForEach'] = {
  init: init
};// Exports
  return {init: init};
}));
