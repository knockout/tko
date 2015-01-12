/*!
  Knockout Fast Foreach v0.1.0 (2015-01-12T14:46:26.409Z)
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
if (!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

// from https://github.com/jonschlinkert/is-plain-object
function isPlainObject(o) {
  return !!o && typeof o === 'object' && o.constructor === Object;
};

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
  var data = spec.data,
      element = spec.element,
      templateNode = spec.name ? [document.getElementById(spec.name)] : element.cloneNode(true);

  // Initialize the data
  if (ko.isObservable(data) && !data.indexOf) {
    data = data.extend({trackArrayChanges: true});
  }

  // Clear the element
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }

  // Prime content
  ko.utils.arrayForEach(ko.unwrap(data), function(v) {
    var childContext = spec.$context.createChildContext(v, spec.as || null);
    var clone = templateNode.cloneNode(true);
    ko.applyBindingsToDescendants(childContext, clone.children);
    ko.utils.arrayForEach(clone.childNodes, function(child) {
      // console.log("INSERTING", child)
      if (child) element.insertBefore(child, null);
    })
  })

  // Start subscriptions
  function on_array_change(changeSet) {
    function startChangeUpdate() {
      var nodes_to_remove = [];
      ko.utils.arrayForEach(changeSet, function(change) {
        switch(change.status) {
          case 'deleted':
            nodes_to_remove.push();
            break;
        }
      });
    }

    // raf(startChangeUpdate);
    startChangeUpdate()
  }

  changeSubs = data.subscribe(on_array_change, null, 'arrayChange');

  ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
    changeSubs.dispose();
    changes.length = 0;
  });
}

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
